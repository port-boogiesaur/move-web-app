const prisma = require("../config/prisma");

const userFields = {
  id: true,
  name: true,
  profilePicture: true,
  bio: true,
};

const pairFor = (firstId, secondId) => (
  firstId < secondId
    ? { participantAId: firstId, participantBId: secondId }
    : { participantAId: secondId, participantBId: firstId }
);

const friendshipPairFor = (firstId, secondId) => (
  firstId < secondId
    ? { lowUserId: firstId, highUserId: secondId }
    : { lowUserId: secondId, highUserId: firstId }
);

const hasAcceptedFriendship = async (firstId, secondId) => {
  if (firstId === secondId) return false;
  const friendship = await prisma.friendship.findUnique({
    where: { lowUserId_highUserId: friendshipPairFor(firstId, secondId) },
    select: { status: true },
  });
  return friendship?.status === "ACCEPTED";
};

const findAccessibleConversation = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      participantAId: true,
      participantBId: true,
    },
  });

  if (!conversation) return { error: "not_found" };
  if (![conversation.participantAId, conversation.participantBId].includes(userId)) {
    return { error: "not_found" };
  }

  const otherUserId = conversation.participantAId === userId
    ? conversation.participantBId
    : conversation.participantAId;
  if (!await hasAcceptedFriendship(userId, otherUserId)) {
    return { error: "not_friends" };
  }

  return { conversation };
};

const getConversations = async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ lowUserId: req.user.id }, { highUserId: req.user.id }],
      },
      select: { lowUserId: true, highUserId: true },
    });
    const friendIds = friendships.map((friendship) => (
      friendship.lowUserId === req.user.id ? friendship.highUserId : friendship.lowUserId
    ));

    if (!friendIds.length) return res.json([]);

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participantAId: req.user.id, participantBId: { in: friendIds } },
          { participantBId: req.user.id, participantAId: { in: friendIds } },
        ],
      },
      include: {
        participantA: { select: userFields },
        participantB: { select: userFields },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: userFields } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const unreadCounts = conversations.length
      ? await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: conversations.map(({ id }) => id) },
          senderId: { not: req.user.id },
          readAt: null,
        },
        _count: { _all: true },
      })
      : [];
    const unreadByConversation = new Map(
      unreadCounts.map(({ conversationId, _count: count }) => [conversationId, count._all]),
    );

    res.json(conversations.map((conversation) => ({
      id: conversation.id,
      user: conversation.participantAId === req.user.id
        ? conversation.participantB
        : conversation.participantA,
      lastMessage: conversation.messages[0] ?? null,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
      updatedAt: conversation.updatedAt,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

const startConversation = async (req, res) => {
  const { userId } = req.body ?? {};
  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ message: "userId is required" });
  }
  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot message yourself" });
  }

  try {
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: userFields,
    });
    if (!recipient) return res.status(404).json({ message: "User not found" });
    if (!await hasAcceptedFriendship(req.user.id, userId)) {
      return res.status(403).json({ message: "You can only message accepted friends" });
    }

    const pair = pairFor(req.user.id, userId);
    const existing = await prisma.conversation.findUnique({
      where: { participantAId_participantBId: pair },
    });
    if (existing) return res.json({ id: existing.id, user: recipient });

    const conversation = await prisma.conversation.create({ data: pair });
    res.status(201).json({ id: conversation.id, user: recipient });
  } catch (error) {
    if (error.code === "P2002") {
      try {
        const existing = await prisma.conversation.findUnique({
          where: { participantAId_participantBId: pairFor(req.user.id, userId) },
        });
        if (existing) {
          const user = await prisma.user.findUnique({ where: { id: userId }, select: userFields });
          return res.json({ id: existing.id, user });
        }
      } catch (lookupError) {
        console.error(lookupError);
      }
    }
    if (error.code === "P2003") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to start conversation" });
  }
};

const getMessages = async (req, res) => {
  try {
    const access = await findAccessibleConversation(req.params.conversationId, req.user.id);
    if (access.error === "not_found") {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (access.error === "not_friends") {
      return res.status(403).json({ message: "Messaging is only available between accepted friends" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: access.conversation.id },
      include: { sender: { select: userFields } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

const sendMessage = async (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) return res.status(400).json({ message: "Message content is required" });
  if (content.length > 500) {
    return res.status(400).json({ message: "Messages cannot exceed 500 characters" });
  }

  try {
    const access = await findAccessibleConversation(req.params.conversationId, req.user.id);
    if (access.error === "not_found") {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (access.error === "not_friends") {
      return res.status(403).json({ message: "Messaging is only available between accepted friends" });
    }

    const message = await prisma.$transaction(async (transaction) => {
      const created = await transaction.message.create({
        data: {
          conversationId: access.conversation.id,
          senderId: req.user.id,
          content,
        },
        include: { sender: { select: userFields } },
      });
      await transaction.conversation.update({
        where: { id: access.conversation.id },
        data: { updatedAt: new Date() },
      });
      return created;
    });
    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

const markMessagesRead = async (req, res) => {
  try {
    const access = await findAccessibleConversation(req.params.conversationId, req.user.id);
    if (access.error === "not_found") {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (access.error === "not_friends") {
      return res.status(403).json({ message: "Messaging is only available between accepted friends" });
    }

    const result = await prisma.message.updateMany({
      where: {
        conversationId: access.conversation.id,
        senderId: { not: req.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    res.json({ markedRead: result.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

module.exports = {
  getConversations,
  startConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
};
