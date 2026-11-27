import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoSearch, IoCalendarOutline, IoAddCircleOutline, IoPeopleOutline, IoTrophyOutline, IoArrowForward, IoHeartOutline, IoStatsChartOutline } from 'react-icons/io5';
import { useTable } from '../data/db';
import { SportChips, VenueCard, Btn, inputCls } from '../components/ui';

const Hero3DModel = lazy(() => import('../components/Hero3DModel'));

const actions = [
  { to: '/book', label: 'Book Court', Icon: IoCalendarOutline, tint: 'bg-[#85f8c4]' },
  { to: '/host', label: 'Host Play', Icon: IoAddCircleOutline, tint: 'bg-[#dae2fd]' },
  { to: '/players', label: 'Find Players', Icon: IoPeopleOutline, tint: 'bg-[#d3e4fe]' },
  { to: '/tourneys', label: 'Tourneys', Icon: IoTrophyOutline, tint: 'bg-[#ffddb8]' },
  { to: '/saved', label: 'Saved Courts', Icon: IoHeartOutline, tint: 'bg-[#ffdad6]' },
  { to: '/leaderboard', label: 'Leaderboard', Icon: IoStatsChartOutline, tint: 'bg-[#e8def8]' },
];

export default function Discover() {
  const navigate = useNavigate();
  const venues = useTable('venues');
  const [sport, setSport] = useState('all');
  const [q, setQ] = useState('');

  const players = useTable('players');
  const matches = useTable('matches');
  const popular = venues.filter((v) => sport === 'all' || v.sports.includes(sport));

  return (
    <div className="relative isolate w-full overflow-hidden">
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-5 sm:pt-5">
        <form onSubmit={(e) => { e.preventDefault(); navigate(`/map?q=${encodeURIComponent(q)}`); }} className="relative mb-2">
          <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006948]" size={20} />
          <input className={`${inputCls} rounded-full py-3 pl-11`} placeholder="Search courts, clubs, or matches…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <SportChips value={sport} onChange={setSport} />

        <section className="-mt-2 mb-4 grid overflow-hidden rounded-3xl bg-transparent shadow-lg shadow-[#0b1c30]/5 ring-1 ring-[#0b1c30]/5 md:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center gap-2.5 bg-white p-5 md:p-6">
            <p className="text-sm font-bold text-[#006948]">Cebu weekend showdown · 40+ matches</p>
            <h1 className="bg-gradient-to-r from-[#0b1c30] via-[#0b1c30] to-[#006948] bg-clip-text text-3xl font-extrabold leading-tight tracking-tight text-transparent md:text-4xl">Open Play Weekend in Cebu</h1>
            <p className="text-sm leading-5 text-[#3d4a42]">Pickleball, padel and basketball runs forming fast across Metro Cebu. Join solo or with a partner.</p>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              {[[venues.length, 'courts'], [matches.length, 'games'], [players.length, 'players']].map(([n, l]) => (
                <span key={l} className="rounded-full bg-[#eff4ff] px-3 py-1 text-[#0b1c30]"><span className="text-[#006948]">{n}</span> {l}</span>
              ))}
            </div>
            <div><Btn to="/open-play" className="px-5 py-2.5">Browse Matches <IoArrowForward /></Btn></div>
          </div>
          <div className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-r-[28px] bg-transparent p-3 shadow-[0_8px_20px_rgba(0,105,72,0.22),inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-3px_0_rgba(0,105,72,0.24)] md:aspect-auto md:min-h-[330px]">
            <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-transparent shadow-[inset_0_2px_5px_rgba(0,33,20,0.36),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <div className="absolute inset-0 bg-transparent sm:inset-2">
                <Suspense fallback={null}>
                  <Hero3DModel />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {actions.map(({ to, label, Icon, tint }) => (
            <Link key={to} to={to} className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#0b1c30]/5 transition hover:-translate-y-0.5 hover:shadow-md active:scale-95">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}><Icon size={20} /></span>
              <span className="text-sm font-bold leading-snug">{label}</span>
            </Link>
          ))}
        </section>

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold sm:text-lg">Courts you can book</h2>
          <Btn to="/courts/new" variant="soft" className="px-4 py-2">Add court</Btn>
        </div>
        <div className="grid gap-2.5 md:grid-cols-2">
          {popular.map((v) => <VenueCard key={v.id} venue={v} />)}
        </div>
      </div>
    </div>
  );
}
