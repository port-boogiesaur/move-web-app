import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IoChevronBack, IoSend, IoChatbubblesOutline } from 'react-icons/io5';
import { useTable } from '../data/db';
import { useThreads, useConversationWith, useMessages, sendMessage, markRead, useDirectUnread } from '../data/chat';
import { useRooms, useRoomMessages, sendRoomMessage, markRoomRead, setOpenRoom, useRoomUnread } from '../data/rooms';
import { useProfile } from '../data/db';
import { Avatar, Btn, fmtDate, fmtTime, SportIcon } from '../components/ui';

const clock = (iso) => new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

// Shared conversation view for direct chats and game rooms.
function ThreadView({ header, messages, typing, typingLabel, onSend, showAuthor, note, emptyText, loading, error }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length, typing]);
  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setSendError('');
    try {
      await onSend(text);
      setText('');
    } catch (requestError) {
      setSendError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-[#e5eeff] px-3 py-3 md:px-4">
        <Link to="/chat" aria-label="Back to chats" className="rounded-full p-1.5 hover:bg-[#e5eeff] md:hidden"><IoChevronBack size={20} /></Link>
        {header}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[#f8f9ff] px-3 py-4 md:px-4">
        <p className="mx-auto mb-2 max-w-xs rounded-full bg-[#e5eeff] px-3 py-1 text-center text-[11px] font-semibold text-[#565e74]">{note}</p>
        {(error || sendError) && <p role="alert" className="mx-auto max-w-lg rounded-xl bg-[#ffdad6] px-3 py-2 text-center text-sm font-semibold text-[#93000a]">{error || sendError}</p>}
        {loading && messages.length === 0 && <p className="py-10 text-center text-sm text-[#565e74]">Loading messages…</p>}
        {!loading && messages.length === 0 && <p className="py-10 text-center text-sm text-[#565e74]">{emptyText}</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${m.from === 'me' ? 'rounded-br-md bg-gradient-to-b from-[#00855d] to-[#006948] text-white' : 'rounded-bl-md bg-white text-[#0b1c30]'}`}>
              {showAuthor && m.from !== 'me' && <p className="mb-0.5 text-xs font-bold text-[#006948]">{m.author}</p>}
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <p className={`mt-0.5 text-right text-[10px] ${m.from === 'me' ? 'text-white/70' : 'text-[#6d7a72]'}`}>{clock(m.createdAt)}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm" aria-label={typingLabel}>
              {[0, 1, 2].map((i) => <span key={i} className="chat-dot h-2 w-2 rounded-full bg-[#6d7a72]" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#e5eeff] bg-white p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Write a message…" aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-[#bccac0] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#006948] focus:ring-2 focus:ring-[#85f8c4]" />
        <button type="submit" disabled={!text.trim() || sending} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006948] text-white transition hover:bg-[#00855d] active:scale-90 disabled:opacity-40">
          <IoSend size={18} />
        </button>
      </form>
    </div>
  );
}

function DirectThread({ playerId }) {
  const { conversation, loading: conversationLoading, error: conversationError } = useConversationWith(playerId);
  const { messages, loading: messagesLoading, error: messagesError } = useMessages(conversation?.id);
  const unread = messages.filter((m) => m.from === 'them' && !m.read).length;
  const [readError, setReadError] = useState('');
  useEffect(() => {
    if (!unread || !conversation?.id) return undefined;
    let active = true;
    markRead(conversation.id).catch((requestError) => {
      if (active) setReadError(requestError.message);
    });
    return () => { active = false; };
  }, [unread, conversation?.id]);
  if (conversationLoading) return <div className="flex h-full items-center justify-center text-sm text-[#565e74]">Opening conversation…</div>;
  if (!conversation) return <div role="alert" className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-[#ba1a1a]">{conversationError || 'Conversation unavailable.'}</div>;
  const player = conversation.user;
  return (
    <ThreadView
      header={<>
        <Avatar name={player.name} src={player.profilePicture} size={40} />
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{player.name}</p>
          <p className="truncate text-xs text-[#565e74]">{player.bio || 'MOVE player'}</p>
        </div>
      </>}
      messages={messages} loading={messagesLoading} error={messagesError || readError}
      typing={false} onSend={(text) => sendMessage(conversation.id, text)}
      note={`A private conversation with ${player.name}.`}
      emptyText={`No messages yet. Say hi to ${player.name.split(' ')[0]}.`}
    />
  );
}

function RoomThread({ matchId }) {
  const me = useProfile().name;
  const match = useTable('matches').find((m) => m.id === matchId);
  const messages = useRoomMessages(matchId);
  const unread = messages.filter((m) => m.from === 'them' && !m.read).length;
  useEffect(() => { setOpenRoom(matchId); return () => setOpenRoom(null); }, [matchId]);
  useEffect(() => { if (unread) markRoomRead(matchId); }, [unread, matchId]);

  if (!match) return <div className="flex h-full items-center justify-center text-sm text-[#565e74]">Game not found.</div>;
  if (!match.joined.includes(me)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-bold">Join this game to chat with the group</p>
        <Btn to="/open-play">Go to Open play</Btn>
      </div>
    );
  }
  return (
    <ThreadView
      header={<>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#85f8c4] text-[#002114]"><SportIcon sport={match.sport} size={20} /></span>
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{match.title}</p>
          <p className="truncate text-xs text-[#565e74]">{fmtDate(match.date)}, {fmtTime(match.time)} · {match.joined.length} players</p>
        </div>
      </>}
      messages={messages} typing={false} showAuthor
      onSend={(t) => sendRoomMessage(matchId, t)}
      note={`In this room: ${match.joined.join(', ')}. Demo mode: replies from the group are automatic.`}
      emptyText="No messages yet. Say hi to the group."
    />
  );
}

export default function Chat() {
  const { playerId, matchId } = useParams();
  const { threads, loading: threadsLoading, error: threadsError } = useThreads();
  const rooms = useRooms();
  const directUnread = useDirectUnread();
  const roomUnread = useRoomUnread();
  const [tab, setTab] = useState(matchId ? 'rooms' : 'direct');
  useEffect(() => { if (matchId) setTab('rooms'); else if (playerId) setTab('direct'); }, [matchId, playerId]);
  const hasThread = !!(playerId || matchId);

  const badge = (n) => n > 0 && <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#006948] px-1.5 text-[11px] font-bold text-white">{n}</span>;

  const tabs = (
    <div className="flex gap-1 border-b border-[#e5eeff] px-3 pt-3">
      {[['direct', 'Direct', directUnread], ['rooms', 'Games', roomUnread]].map(([k, label, n]) => (
        <button key={k} onClick={() => setTab(k)} className={`rounded-t-xl px-4 py-2 text-sm font-bold transition ${tab === k ? 'border-b-2 border-[#006948] text-[#006948]' : 'text-[#565e74] hover:bg-[#eff4ff]'}`}>{label}{badge(n)}</button>
      ))}
    </div>
  );

  const direct = threadsLoading && threads.length === 0 ? (
    <p className="px-6 py-12 text-center text-sm text-[#565e74]">Loading friends…</p>
  ) : threads.length === 0 ? (
    <div className="px-6 py-12 text-center">
      <IoChatbubblesOutline size={36} className="mx-auto text-[#6d7a72]" />
      <p className="mt-3 font-bold">No chats yet</p>
      <p className="mt-1 text-sm text-[#565e74]">Add a friend, then message them to set up a game.</p>
      <div className="mt-4"><Btn to="/players">Find players</Btn></div>
    </div>
  ) : threads.map(({ player: p, last, unread }) => (
    <Link key={p.id} to={`/chat/${p.id}`} className={`flex items-center gap-3 px-4 py-3 transition hover:bg-[#eff4ff] ${p.id === playerId ? 'bg-[#e5eeff]' : ''}`}>
      <Avatar name={p.name} src={p.avatar} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate ${unread ? 'font-extrabold' : 'font-bold'}`}>{p.name}</p>
          {last && <span className="shrink-0 text-[11px] text-[#6d7a72]">{clock(last.createdAt)}</span>}
        </div>
        <p className={`truncate text-sm ${unread ? 'font-semibold text-[#0b1c30]' : 'text-[#565e74]'}`}>{last ? `${last.from === 'me' ? 'You: ' : ''}${last.text}` : 'Say hi'}</p>
      </div>
      {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#006948] px-1.5 text-[11px] font-bold text-white">{unread}</span>}
    </Link>
  ));

  const roomList = rooms.length === 0 ? (
    <div className="px-6 py-12 text-center">
      <IoChatbubblesOutline size={36} className="mx-auto text-[#6d7a72]" />
      <p className="mt-3 font-bold">No game chats yet</p>
      <p className="mt-1 text-sm text-[#565e74]">Join an open-play game and its group chat shows up here.</p>
      <div className="mt-4"><Btn to="/open-play">Find open play</Btn></div>
    </div>
  ) : rooms.map(({ match: m, last, unread }) => (
    <Link key={m.id} to={`/chat/room/${m.id}`} className={`flex items-center gap-3 px-4 py-3 transition hover:bg-[#eff4ff] ${m.id === matchId ? 'bg-[#e5eeff]' : ''}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#85f8c4] text-[#002114]"><SportIcon sport={m.sport} size={22} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate ${unread ? 'font-extrabold' : 'font-bold'}`}>{m.title}</p>
          {last && <span className="shrink-0 text-[11px] text-[#6d7a72]">{clock(last.createdAt)}</span>}
        </div>
        <p className={`truncate text-sm ${unread ? 'font-semibold text-[#0b1c30]' : 'text-[#565e74]'}`}>{last ? `${last.from === 'me' ? 'You' : last.author}: ${last.text}` : `${fmtDate(m.date)}, ${fmtTime(m.time)}`}</p>
      </div>
      {unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#006948] px-1.5 text-[11px] font-bold text-white">{unread}</span>}
    </Link>
  ));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-4 md:pb-6">
      <div className="grid h-[calc(100dvh-10rem)] overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#0b1c30]/5 md:h-[calc(100dvh-8.5rem)] md:grid-cols-[320px_1fr]">
        <div className={`flex min-h-0 flex-col border-[#e5eeff] md:border-r ${hasThread ? 'hidden md:flex' : ''}`}>
          <div className="px-4 pt-4"><h1 className="text-xl font-extrabold tracking-tight">Chats</h1></div>
          {tabs}
          {threadsError && tab === 'direct' && <p role="alert" className="px-4 py-2 text-sm font-semibold text-[#ba1a1a]">{threadsError}</p>}
          <div className="min-h-0 flex-1 overflow-y-auto">{tab === 'direct' ? direct : roomList}</div>
        </div>
        <div className={`min-h-0 ${hasThread ? '' : 'hidden md:block'}`}>
          {playerId ? <DirectThread key={playerId} playerId={playerId} />
            : matchId ? <RoomThread key={matchId} matchId={matchId} />
            : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[#565e74]">
                <IoChatbubblesOutline size={44} /><p className="font-semibold">Select a chat</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
