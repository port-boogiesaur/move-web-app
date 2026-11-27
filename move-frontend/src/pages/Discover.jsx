import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoSearch, IoCalendarOutline, IoAddCircleOutline, IoPeopleOutline, IoTrophyOutline, IoArrowForward, IoHeartOutline, IoStatsChartOutline } from 'react-icons/io5';
import { useTable } from '../data/db';
import { SportChips, VenueCard, Btn, inputCls } from '../components/ui';

// Uses the first photo found in src/assets for the hero (jpg, png or webp).
const heroImages = Object.values(import.meta.glob('../assets/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' }));
const hero = heroImages[0];

const actions = [
  { to: '/book', label: 'Book Court', Icon: IoCalendarOutline, tint: 'bg-[#85f8c4]' },
  { to: '/host', label: 'Host Play', Icon: IoAddCircleOutline, tint: 'bg-[#dae2fd]' },
  { to: '/players', label: 'Find Players', Icon: IoPeopleOutline, tint: 'bg-[#d3e4fe]' },
  { to: '/tourneys', label: 'Tourneys', Icon: IoTrophyOutline, tint: 'bg-[#ffddb8]' },
  { to: '/saved', label: 'Saved Courts', Icon: IoHeartOutline, tint: 'bg-[#ffdad6]' },
  { to: '/leaderboard', label: 'Leaderboard', Icon: IoStatsChartOutline, tint: 'bg-[#e8def8]' },
];

const discoverBlobConfigs = [
  { rx: 285, ry: 210, opacity: 0.42, pace: 0.82 },
  { rx: 205, ry: 160, opacity: 0.34, pace: 1.16 },
  { rx: 165, ry: 125, opacity: 0.39, pace: 1.28 },
  { rx: 300, ry: 220, opacity: 0.44, pace: 0.76 },
  { rx: 135, ry: 105, opacity: 0.31, pace: 1.12 },
  { rx: 260, ry: 190, opacity: 0.4, pace: 0.94 },
  { rx: 185, ry: 150, opacity: 0.36, pace: 1.24 },
  { rx: 315, ry: 230, opacity: 0.45, pace: 0.8 },
  { rx: 150, ry: 115, opacity: 0.32, pace: 1.08 },
  { rx: 230, ry: 175, opacity: 0.38, pace: 0.9 },
];

const ambientStyles = `
  @media (max-width: 1023px) {
    .discover-goo-blob:nth-of-type(n + 9) { display: none; }
  }
  @media (max-width: 639px) {
    .discover-goo-blob:nth-of-type(n + 7) { display: none; }
  }
`;

const discoverDiffusionShapes = [
  { left: '-78vw', top: '-52vh', width: '195vw', height: '175vh', opacity: 0.025, filter: 'blur(470px)', borderRadius: '63% 37% 56% 44% / 44% 58% 42% 56%' },
  { right: '-74vw', bottom: '-58vh', width: '190vw', height: '165vh', opacity: 0.03, filter: 'blur(445px)', borderRadius: '42% 58% 47% 53% / 58% 42% 56% 44%' },
];

const discoverDeepAtmosphereShapes = [
  { left: '-54vw', top: '-35%', width: '155vw', height: '140vh', opacity: 0.05, filter: 'blur(380px)', borderRadius: '58% 42% 65% 35% / 42% 61% 39% 58%' },
  { right: '-59vw', top: '21%', width: '160vw', height: '130vh', opacity: 0.06, filter: 'blur(355px)', borderRadius: '41% 59% 46% 54% / 61% 39% 57% 43%' },
  { left: '-27vw', top: '62%', width: '148vw', height: '135vh', opacity: 0.05, filter: 'blur(390px)', borderRadius: '56% 44% 63% 37% / 45% 57% 43% 55%' },
];

const discoverMidAtmosphereShapes = [
  { left: '-39vw', top: '5%', width: '126vw', height: '90vh', opacity: 0.07, filter: 'blur(230px)', borderRadius: '62% 38% 53% 47% / 46% 58% 42% 54%' },
  { right: '-34vw', top: '42%', width: '128vw', height: '96vh', opacity: 0.08, filter: 'blur(255px)', borderRadius: '44% 56% 61% 39% / 55% 45% 59% 41%' },
  { left: '18vw', top: '78%', width: '116vw', height: '82vh', opacity: 0.06, filter: 'blur(215px)', borderRadius: '55% 45% 42% 58% / 58% 42% 54% 46%' },
];

function startDiscoverBlobMotion(svg, filter, groupRefs) {
  if (!svg || !filter) return () => {};

  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let blobs = [];
  let frame = 0;

  const writeTransform = (blob, index) => {
    const node = groupRefs.current[index];
    if (!node) return;
    node.setAttribute(
      'transform',
      `translate(${blob.x.toFixed(1)} ${blob.y.toFixed(1)}) rotate(${blob.rotation.toFixed(2)}) scale(${(blob.baseScale * blob.scaleX).toFixed(3)} ${(blob.baseScale * blob.scaleY).toFixed(3)})`,
    );
  };

  const chooseTarget = (blob, index, now) => {
    blob.startX = blob.x;
    blob.startY = blob.y;
    blob.startScaleX = blob.scaleX;
    blob.startScaleY = blob.scaleY;
    blob.startRotation = blob.rotation;

    const xRange = Math.max(80, width * randomBetween(0.08, 0.2));
    const yRange = Math.max(65, height * randomBetween(0.05, 0.12));
    let targetX = blob.x + randomBetween(-xRange, xRange);
    let targetY = blob.y + randomBetween(-yRange, yRange);

    if (blobs.length > 1 && Math.random() < 0.24) {
      const offset = 1 + Math.floor(Math.random() * (blobs.length - 1));
      const neighbor = blobs[(index + offset) % blobs.length];
      targetX = neighbor.x + randomBetween(-neighbor.rx * 0.45, neighbor.rx * 0.45);
      targetY = neighbor.y + randomBetween(-neighbor.ry * 0.45, neighbor.ry * 0.45);
    }

    blob.targetX = clamp(targetX, -blob.rx * 0.65, width + blob.rx * 0.65);
    blob.targetY = clamp(targetY, -blob.ry * 0.65, height + blob.ry * 0.65);
    blob.targetScaleX = randomBetween(0.93, 1.07);
    blob.targetScaleY = randomBetween(0.93, 1.07);
    blob.targetRotation = randomBetween(-6, 6);
    blob.duration = randomBetween(6500, 13000) / blob.pace;
    blob.startAt = now + randomBetween(350, 2000);
  };

  const render = (now) => {
    blobs.forEach((blob, index) => {
      if (now >= blob.startAt) {
        const progress = Math.min(1, (now - blob.startAt) / blob.duration);
        const eased = progress * progress * (3 - 2 * progress);
        blob.x = blob.startX + (blob.targetX - blob.startX) * eased;
        blob.y = blob.startY + (blob.targetY - blob.startY) * eased;
        blob.scaleX = blob.startScaleX + (blob.targetScaleX - blob.startScaleX) * eased;
        blob.scaleY = blob.startScaleY + (blob.targetScaleY - blob.startScaleY) * eased;
        blob.rotation = blob.startRotation + (blob.targetRotation - blob.startRotation) * eased;
        if (progress === 1) chooseTarget(blob, index, now);
      }
      writeTransform(blob, index);
    });
  };

  const animate = (now) => {
    frame = 0;
    render(now);
    if (!motionPreference.matches) frame = requestAnimationFrame(animate);
  };

  const start = () => {
    if (!frame) frame = requestAnimationFrame(animate);
  };

  const resize = () => {
    const rect = svg.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width);
    const nextHeight = Math.max(1, rect.height);
    const oldWidth = width || nextWidth;
    const oldHeight = height || nextHeight;
    const baseScale = Math.min(1.05, Math.max(0.82, nextWidth / 1200));
    width = nextWidth;
    height = nextHeight;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    filter.setAttribute('width', String(width + 256));
    filter.setAttribute('height', String(height + 256));

    if (blobs.length) {
      blobs.forEach((blob, index) => {
        const config = discoverBlobConfigs[index];
        blob.baseScale = baseScale;
        blob.rx = config.rx * baseScale;
        blob.ry = config.ry * baseScale;
        blob.x = clamp(blob.x * (width / oldWidth), -blob.rx, width + blob.rx);
        blob.y = clamp(blob.y * (height / oldHeight), -blob.ry, height + blob.ry);
      });
      blobs.forEach((blob, index) => chooseTarget(blob, index, performance.now()));
    } else {
      blobs = discoverBlobConfigs.map((config) => {
        const rx = config.rx * baseScale;
        const ry = config.ry * baseScale;
        return {
          ...config,
          rx,
          ry,
          baseScale,
          x: randomBetween(-rx * 0.45, width + rx * 0.45),
          y: randomBetween(-ry * 0.45, height + ry * 0.45),
          scaleX: 1,
          scaleY: 1,
          rotation: randomBetween(-7, 7),
        };
      });
      blobs.forEach((blob, index) => chooseTarget(blob, index, performance.now()));
    }

    render(performance.now());
    if (!motionPreference.matches) start();
  };

  const observer = new ResizeObserver(resize);
  observer.observe(svg);
  resize();

  const onMotionPreferenceChange = () => {
    if (motionPreference.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else {
      blobs.forEach((blob, index) => chooseTarget(blob, index, performance.now()));
      start();
    }
  };
  if (motionPreference.addEventListener) {
    motionPreference.addEventListener('change', onMotionPreferenceChange);
  } else {
    motionPreference.addListener(onMotionPreferenceChange);
  }

  return () => {
    observer.disconnect();
    if (motionPreference.removeEventListener) {
      motionPreference.removeEventListener('change', onMotionPreferenceChange);
    } else {
      motionPreference.removeListener(onMotionPreferenceChange);
    }
    if (frame) cancelAnimationFrame(frame);
  };
}

export default function Discover() {
  const ambientSvgRef = useRef(null);
  const ambientFilterRef = useRef(null);
  const ambientGroupRefs = useRef([]);
  const navigate = useNavigate();
  const venues = useTable('venues');
  const [sport, setSport] = useState('all');
  const [q, setQ] = useState('');

  useEffect(
    () => startDiscoverBlobMotion(ambientSvgRef.current, ambientFilterRef.current, ambientGroupRefs),
    [],
  );

  const players = useTable('players');
  const matches = useTable('matches');
  const popular = venues.filter((v) => sport === 'all' || v.sports.includes(sport));

  return (
    <div className="relative isolate w-full overflow-hidden">
      <style>{ambientStyles}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {discoverDiffusionShapes.map((shape, index) => (
          <span key={index} className="absolute bg-[#8FE3C1]" style={shape} />
        ))}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {discoverDeepAtmosphereShapes.map((shape, index) => (
          <span key={index} className="absolute bg-[#8FE3C1]" style={shape} />
        ))}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {discoverMidAtmosphereShapes.map((shape, index) => (
          <span key={index} className="absolute bg-[#8FE3C1]" style={shape} />
        ))}
      </div>
      <svg ref={ambientSvgRef} aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-hidden">
        <defs>
          <filter ref={ambientFilterRef} id="discover-goo" x="-128" y="-128" width="1000" height="1000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="softened" />
            <feColorMatrix in="softened" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -4.8" result="goo" />
          </filter>
        </defs>
        <g filter="url(#discover-goo)">
          {discoverBlobConfigs.map((blob, index) => (
            <g
              key={index}
              ref={(node) => { ambientGroupRefs.current[index] = node; }}
              className="discover-goo-blob"
              transform="translate(0 0)"
            >
              <ellipse cx="0" cy="0" rx={blob.rx} ry={blob.ry} fill="#8FE3C1" opacity={blob.opacity} />
            </g>
          ))}
        </g>
      </svg>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-5 sm:pt-5">
        <form onSubmit={(e) => { e.preventDefault(); navigate(`/map?q=${encodeURIComponent(q)}`); }} className="relative mb-2">
          <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#006948]" size={20} />
          <input className={`${inputCls} rounded-full py-3 pl-11`} placeholder="Search courts, clubs, or matches…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <SportChips value={sport} onChange={setSport} />

        <section className="-mt-2 mb-4 grid overflow-hidden rounded-3xl bg-white shadow-lg shadow-[#0b1c30]/5 ring-1 ring-[#0b1c30]/5 md:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center gap-2.5 p-5 md:p-6">
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
          <div className="aspect-video bg-gradient-to-br from-[#006948] to-[#85f8c4]">
            {hero && <img src={hero} alt="Players on a pickleball court" className="h-full w-full object-cover" />}
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
