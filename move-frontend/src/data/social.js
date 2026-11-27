import { useEffect, useState } from 'react';
import { api, getToken } from './api';

const SOCIAL_CHANGE = 'move-social-change';
const emptySocial = { friends: [], incoming: [], outgoing: [] };
const notifySocialChange = () => window.dispatchEvent(new Event(SOCIAL_CHANGE));

const updateRequest = async (id, action, method = 'PATCH') => {
  await api(`/friends/requests/${encodeURIComponent(id)}/${action}`, { method });
  notifySocialChange();
};

export async function sendRequest(userId) {
  await api('/friends/request', { method: 'POST', body: { userId } });
  notifySocialChange();
}

export const acceptRequest = (id) => updateRequest(id, 'accept');
export const declineRequest = (id) => updateRequest(id, 'decline');
export const cancelRequest = async (id) => {
  await api(`/friends/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
  notifySocialChange();
};
export const removeFriend = async (userId) => {
  await api(`/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  notifySocialChange();
};

export function useSocial() {
  const [social, setSocial] = useState(emptySocial);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!getToken()) {
        setSocial(emptySocial);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      try {
        const [friends, requests] = await Promise.all([
          api('/friends'),
          api('/friends/requests'),
        ]);
        if (active) {
          setSocial({ friends, ...requests });
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    window.addEventListener(SOCIAL_CHANGE, load);
    return () => {
      active = false;
      window.removeEventListener(SOCIAL_CHANGE, load);
    };
  }, []);

  const findRequest = (rows, userId) => rows.find((row) => row.user.id === userId);
  const friendIds = new Set(social.friends.map((friend) => friend.user.id));

  return {
    ...social,
    loading,
    error,
    friendIds,
    statusOf: (userId) => (
      friendIds.has(userId) ? 'friends'
        : findRequest(social.outgoing, userId) ? 'sent'
          : findRequest(social.incoming, userId) ? 'incoming'
            : 'none'
    ),
    requestOf: (userId) => (
      findRequest(social.incoming, userId) ?? findRequest(social.outgoing, userId)
    ),
  };
}
