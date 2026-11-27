import { useState } from 'react';
import { useTable } from '../data/db';
import { useSocial, acceptRequest, declineRequest, cancelRequest, removeFriend } from '../data/social';
import { Page, Card, Btn, Avatar, Empty, isIn } from '../components/ui';

export default function Friends() {
  const matches = useTable('matches');
  const { friends, incoming, outgoing, loading, error: loadError } = useSocial();
  const [busyId, setBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const error = actionError || loadError;

  const act = async (id, action) => {
    setBusyId(id);
    setActionError('');
    try {
      await action();
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const section = (title, rows) => (
    <h2 className="mb-2 mt-6 font-bold first:mt-0">{title} ({rows.length})</h2>
  );

  return (
    <Page title="Friends" subtitle="Requests and the games your friends are joining" actions={<Btn to="/players">Find players</Btn>}>
      {error && <p role="alert" className="mb-3 text-sm font-semibold text-[#ba1a1a]">{error}</p>}

      {section('Friend requests', incoming)}
      {incoming.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {incoming.map((request) => (
            <Card key={request.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={request.user.name} src={request.user.profilePicture} />
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{request.user.name}</h3>
                  <p className="truncate text-sm text-[#565e74]">{request.user.bio || 'MOVE player'}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Btn disabled={busyId === request.id} onClick={() => act(request.id, () => acceptRequest(request.id))}>Accept</Btn>
                <Btn variant="danger" disabled={busyId === request.id} onClick={() => act(request.id, () => declineRequest(request.id))}>Decline</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section('Requests you sent', outgoing)}
      {outgoing.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {outgoing.map((request) => (
            <Card key={request.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={request.user.name} src={request.user.profilePicture} />
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{request.user.name}</h3>
                  <p className="text-sm font-semibold text-[#006948]">Request sent · waiting for them</p>
                </div>
              </div>
              <Btn variant="danger" disabled={busyId === request.id} onClick={() => act(request.id, () => cancelRequest(request.id))}>Cancel</Btn>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-6 font-bold">My friends ({friends.length})</h2>
      {loading ? (
        <p className="py-6 text-center text-sm text-[#565e74]">Loading friends…</p>
      ) : friends.length === 0 ? (
        <Empty title="No friends yet" hint="Send a request from Find players. They show up here once accepted." action={<Btn to="/players">Find players</Btn>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {friends.map((friendship) => {
            const friend = friendship.user;
            const games = matches.filter((match) => isIn(match.joined, friend));
            return (
              <Card key={friendship.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={friend.name} src={friend.profilePicture} />
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{friend.name}</h3>
                      <p className="truncate text-sm text-[#565e74]">{friend.bio || 'MOVE player'}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Btn to={`/chat/${friend.id}`}>Message</Btn>
                    <Btn variant="danger" disabled={busyId === friend.id} onClick={() => act(friend.id, () => removeFriend(friend.id))}>Remove</Btn>
                  </div>
                </div>
                {games.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {games.map((match) => (
                      <li key={match.id} className="rounded-xl bg-[#85f8c4]/50 px-3 py-2 font-semibold text-[#002114]">
                        Joining: {match.title}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
