import { useEffect, useState } from 'react';
import { api, getToken } from './api';
import { useSocial } from './social';
import { useUser } from './db';
import { checkChatAchievement } from './achievements';
import { useRoomUnread } from './rooms';

const CHAT_CHANGE = 'move-chat-change';
const notifyChatChange = (conversationId) => window.dispatchEvent(new CustomEvent(CHAT_CHANGE, {
  detail: { conversationId },
}));

const toUiMessage = (message, userId) => ({
  id: message.id,
  senderId: message.senderId,
  from: message.senderId === userId ? 'me' : 'them',
  author: message.sender?.name ?? '',
  text: message.content,
  createdAt: message.createdAt,
  read: Boolean(message.readAt),
});

export function useThreads() {
  const { friends, error: friendsError } = useSocial();
  const user = useUser();
  const friendsKey = friends.map((friendship) => friendship.user.id).join('|');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!getToken()) {
        setConversations([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      try {
        const rows = await api('/conversations');
        if (active) {
          setConversations(rows);
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const refresh = () => load();
    window.addEventListener(CHAT_CHANGE, refresh);
    window.addEventListener('move-social-change', refresh);
    return () => {
      active = false;
      window.removeEventListener(CHAT_CHANGE, refresh);
      window.removeEventListener('move-social-change', refresh);
    };
  }, [friendsKey]);

  const byFriend = new Map(conversations.map((conversation) => [conversation.user.id, conversation]));
  const threads = friends.map(({ user: friend }) => {
    const conversation = byFriend.get(friend.id);
    const lastMessage = conversation?.lastMessage;
    return {
      id: friend.id,
      conversationId: conversation?.id ?? null,
      player: { ...friend, avatar: friend.profilePicture },
      last: lastMessage ? toUiMessage(lastMessage, user?.id) : null,
      unread: conversation?.unreadCount ?? 0,
    };
  });

  return {
    threads,
    loading,
    error: error || friendsError,
  };
}

export function useConversationWith(userId) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId && getToken()));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!userId || !getToken()) {
      return () => { active = false; };
    }

    api('/conversations', { method: 'POST', body: { userId } })
      .then((result) => {
        if (active) {
          setConversation(result);
          notifyChatChange(result.id);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [userId]);

  return { conversation, loading, error };
}

export function useMessages(conversationId) {
  const user = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(conversationId && getToken()));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!conversationId || !getToken()) {
        setMessages([]);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      try {
        const rows = await api(`/conversations/${encodeURIComponent(conversationId)}/messages`);
        if (active) {
          setMessages(rows.map((message) => toUiMessage(message, user?.id)));
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const refresh = (event) => {
      const changedId = event.detail?.conversationId;
      if (!changedId || changedId === conversationId) load();
    };
    window.addEventListener(CHAT_CHANGE, refresh);
    return () => {
      active = false;
      window.removeEventListener(CHAT_CHANGE, refresh);
    };
  }, [conversationId, user?.id]);

  return { messages, loading, error };
}

export async function sendMessage(conversationId, text) {
  const content = text.trim();
  if (!content) return;
  await api(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: { content },
  });
  checkChatAchievement();
  notifyChatChange(conversationId);
}

export async function markRead(conversationId) {
  await api(`/conversations/${encodeURIComponent(conversationId)}/read`, { method: 'PATCH' });
  notifyChatChange(conversationId);
}

export const useDirectUnread = () => useThreads().threads.reduce((count, thread) => count + thread.unread, 0);
export const useUnread = () => useDirectUnread() + useRoomUnread();
