import { useEffect, useRef } from 'react';

const blobConfigs = [
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
    .ambient-goo-blob:nth-of-type(n + 9) { display: none; }
  }
  @media (max-width: 639px) {
    .ambient-goo-blob:nth-of-type(n + 7) { display: none; }
  }
`;

const diffusionShapes = [
  { left: '-78vw', top: '-52vh', width: '195vw', height: '175vh', opacity: 0.025, filter: 'blur(470px)', borderRadius: '63% 37% 56% 44% / 44% 58% 42% 56%' },
  { right: '-74vw', bottom: '-58vh', width: '190vw', height: '165vh', opacity: 0.03, filter: 'blur(445px)', borderRadius: '42% 58% 47% 53% / 58% 42% 56% 44%' },
];

const deepAtmosphereShapes = [
  { left: '-54vw', top: '-35%', width: '155vw', height: '140vh', opacity: 0.05, filter: 'blur(380px)', borderRadius: '58% 42% 65% 35% / 42% 61% 39% 58%' },
  { right: '-59vw', top: '21%', width: '160vw', height: '130vh', opacity: 0.06, filter: 'blur(355px)', borderRadius: '41% 59% 46% 54% / 61% 39% 57% 43%' },
  { left: '-27vw', top: '62%', width: '148vw', height: '135vh', opacity: 0.05, filter: 'blur(390px)', borderRadius: '56% 44% 63% 37% / 45% 57% 43% 55%' },
];

const midAtmosphereShapes = [
  { left: '-39vw', top: '5%', width: '126vw', height: '90vh', opacity: 0.07, filter: 'blur(230px)', borderRadius: '62% 38% 53% 47% / 46% 58% 42% 54%' },
  { right: '-34vw', top: '42%', width: '128vw', height: '96vh', opacity: 0.08, filter: 'blur(255px)', borderRadius: '44% 56% 61% 39% / 55% 45% 59% 41%' },
  { left: '18vw', top: '78%', width: '116vw', height: '82vh', opacity: 0.06, filter: 'blur(215px)', borderRadius: '55% 45% 42% 58% / 58% 42% 54% 46%' },
];

function startAmbientBlobMotion(svg, filter, groupRefs) {
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
        const config = blobConfigs[index];
        blob.baseScale = baseScale;
        blob.rx = config.rx * baseScale;
        blob.ry = config.ry * baseScale;
        blob.x = clamp(blob.x * (width / oldWidth), -blob.rx, width + blob.rx);
        blob.y = clamp(blob.y * (height / oldHeight), -blob.ry, height + blob.ry);
      });
      blobs.forEach((blob, index) => chooseTarget(blob, index, performance.now()));
    } else {
      blobs = blobConfigs.map((config) => {
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

export default function AmbientBackground() {
  const svgRef = useRef(null);
  const filterRef = useRef(null);
  const groupRefs = useRef([]);

  useEffect(
    () => startAmbientBlobMotion(svgRef.current, filterRef.current, groupRefs),
    [],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {diffusionShapes.map((shape, index) => (
          <span key={index} className="absolute bg-[#8FE3C1]" style={shape} />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden">
        {deepAtmosphereShapes.map((shape, index) => (
          <span key={index} className="absolute bg-[#8FE3C1]" style={shape} />
        ))}
      </div>
      <div className="absolute inset-0 overflow-hidden">
        {midAtmosphereShapes.map((shape, index) => (
          <span key={index} className="absolute bg-[#8FE3C1]" style={shape} />
        ))}
      </div>
      <svg ref={svgRef} focusable="false" className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-hidden">
        <style>{ambientStyles}</style>
        <defs>
          <filter ref={filterRef} id="move-goo" x="-128" y="-128" width="1000" height="1000" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="softened" />
            <feColorMatrix in="softened" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -4.8" result="goo" />
          </filter>
        </defs>
        <g filter="url(#move-goo)">
          {blobConfigs.map((blob, index) => (
            <g
              key={index}
              ref={(node) => { groupRefs.current[index] = node; }}
              className="ambient-goo-blob"
              transform="translate(0 0)"
            >
              <ellipse cx="0" cy="0" rx={blob.rx} ry={blob.ry} fill="#8FE3C1" opacity={blob.opacity} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
