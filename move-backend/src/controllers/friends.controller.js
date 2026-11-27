const prisma = require("../config/prisma");

const userFields = {
  id: true,
  name: true,
  profilePicture: true,
  bio: true,
};

const pairFor = (firstId, secondId) => (
  firstId < secondId
    ? { lowUserId: firstId, highUserId: secondId }
    : { lowUserId: secondId, highUserId: firstId }
);

const getFriends = async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ lowUserId: req.user.id }, { highUserId: req.user.id }],
      },
      include: {
        requester: { select: userFields },
        addressee: { select: userFields },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(friendships.map((friendship) => ({
      id: friendship.id,
      user: friendship.requesterId === req.user.id
        ? friendship.addressee
        : friendship.requester,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch friends" });
  }
};

const getRequests = async (req, res) => {
  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.friendship.findMany({
        where: { addresseeId: req.user.id, status: "PENDING" },
        select: {
          id: true,
          createdAt: true,
          requester: { select: userFields },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendship.findMany({
        where: { requesterId: req.user.id, status: "PENDING" },
        select: {
          id: true,
          createdAt: true,
          addressee: { select: userFields },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      incoming: incoming.map(({ requester, ...request }) => ({ ...request, user: requester })),
      outgoing: outgoing.map(({ addressee, ...request }) => ({ ...request, user: addressee })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch friend requests" });
  }
};

const searchUsers = async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) return res.json([]);

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        name: { contains: query, mode: "insensitive" },
      },
      select: userFields,
      orderBy: { name: "asc" },
      take: 20,
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to search users" });
  }
};

const createFriendRequest = async (req, res) => {
  const { userId } = req.body;

  if (typeof userId !== "string" || !userId.trim()) {
    return res.status(400).json({ message: "userId is required" });
  }
  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot add yourself" });
  }

  try {
    const recipient = await prisma.user.findUnique({ where: { id: userId } });
    if (!recipient) return res.status(404).json({ message: "User not found" });

    const pair = pairFor(req.user.id, userId);
    const existing = await prisma.friendship.findUnique({
      where: { lowUserId_highUserId: pair },
    });

    if (existing?.status === "ACCEPTED") {
      return res.status(409).json({ message: "You are already friends" });
    }
    if (existing?.status === "PENDING") {
      return res.status(409).json({
        message: existing.requesterId === req.user.id
          ? "Friend request already sent"
          : "This user has already sent you a friend request",
      });
    }

    const friendship = existing
      ? await prisma.friendship.update({
        where: { id: existing.id },
        data: { requesterId: req.user.id, addresseeId: userId, status: "PENDING" },
      })
      : await prisma.friendship.create({
        data: {
          requesterId: req.user.id,
          addresseeId: userId,
          ...pair,
        },
      });

    res.status(201).json({ id: friendship.id, status: friendship.status });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A relationship with this user already exists" });
    }
    if (error.code === "P2003") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to send friend request" });
  }
};

const updatePendingRequest = async (req, res, status) => {
  const friendship = await prisma.friendship.findUnique({
    where: { id: req.params.id },
  });

  if (!friendship || friendship.addresseeId !== req.user.id) {
    return res.status(404).json({ message: "Incoming friend request not found" });
  }
  if (friendship.status !== "PENDING") {
    return res.status(409).json({ message: "This friend request has already been processed" });
  }

  const result = await prisma.friendship.updateMany({
    where: {
      id: friendship.id,
      addresseeId: req.user.id,
      status: "PENDING",
    },
    data: { status },
  });

  if (!result.count) {
    return res.status(409).json({ message: "This friend request has already been processed" });
  }
  res.json({ id: friendship.id, status });
};

const acceptFriendRequest = async (req, res) => {
  try {
    await updatePendingRequest(req, res, "ACCEPTED");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to accept friend request" });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    await updatePendingRequest(req, res, "DECLINED");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to decline friend request" });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const result = await prisma.friendship.deleteMany({
      where: {
        id: req.params.id,
        requesterId: req.user.id,
        status: "PENDING",
      },
    });
    if (!result.count) {
      return res.status(404).json({ message: "Outgoing friend request not found" });
    }
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel friend request" });
  }
};

const removeFriend = async (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ message: "You cannot remove yourself" });
  }

  try {
    const result = await prisma.friendship.deleteMany({
      where: {
        ...pairFor(req.user.id, req.params.userId),
        status: "ACCEPTED",
      },
    });
    if (!result.count) return res.status(404).json({ message: "Friend not found" });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove friend" });
  }
};

module.exports = {
  getFriends,
  getRequests,
  searchUsers,
  createFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
};
