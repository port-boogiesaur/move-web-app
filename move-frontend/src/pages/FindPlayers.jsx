import { useEffect, useState } from 'react';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { api } from '../data/api';
import { useSocial, sendRequest, acceptRequest } from '../data/social';
import { Page, Card, Btn, Avatar, Empty, inputCls } from '../components/ui';

export default function FindPlayers() {
  const { statusOf, requestOf, error: socialError } = useSocial();
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setPlayers([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      setError('');
      try {
        const users = await api(`/friends/search?q=${encodeURIComponent(query.trim())}`);
        if (active) setPlayers(users);
      } catch (searchError) {
        if (active) setError(searchError.message);
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const act = async (userId, action) => {
    setBusyId(userId);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId('');
    }
  };

  const friendButton = (player) => {
    switch (statusOf(player.id)) {
      case 'friends':
        return <Btn to={`/chat/${player.id}`} variant="soft"><IoChatbubbleEllipsesOutline size={16} /> Message</Btn>;
      case 'sent':
        return <Btn variant="soft" disabled>Request sent</Btn>;
      case 'incoming':
        return <Btn disabled={busyId === player.id} onClick={() => act(player.id, () => acceptRequest(requestOf(player.id).id))}>Accept request</Btn>;
      default:
        return <Btn variant="soft" disabled={busyId === player.id} onClick={() => act(player.id, () => sendRequest(player.id))}>Add friend</Btn>;
    }
  };

  return (
    <Page
      title="Find players"
      subtitle="Search MOVE users and connect with them"
      actions={<Btn to="/friends" variant="soft">Friends</Btn>}
    >
      <input
        className={`${inputCls} mb-4`}
        placeholder="Search MOVE users by name"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {(error || socialError) && <p role="alert" className="mb-3 text-sm font-semibold text-[#ba1a1a]">{error || socialError}</p>}
      {searching ? (
        <p className="py-6 text-center text-sm text-[#565e74]">Searching MOVE users…</p>
      ) : players.length === 0 ? (
        <Empty
          title={query.trim() ? 'No users match your search' : 'Search for MOVE users'}
          hint={query.trim() ? 'Try another name.' : 'Enter a name to find people to add.'}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {players.map((player) => (
            <Card key={player.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={player.name} src={player.profilePicture} />
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{player.name}</h3>
                  <p className="truncate text-sm text-[#565e74]">{player.bio || 'MOVE player'}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">{friendButton(player)}</div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
