'use client';

import { useEffect, useRef, useState } from 'react';
import { FRAME_PATHS } from './framePaths';

const chapters = [
  { tag: 'The complete system', title: <>Two slots.<br />One statement.</>, text: 'Scroll to move through all forty views of the RTX 5090.' },
  { tag: 'Flow-through cooling', title: <>Air has<br />a clear path.</>, text: 'Every frame is mapped directly to your position in the sequence.' },
  { tag: 'Founders Edition', title: <>Built from<br />every angle.</>, text: 'Reverse your scroll and the image sequence reverses with you.' },
  { tag: 'Blackwell', title: <>See what<br />drives it.</>, text: 'Forty product frames, held full-screen until the sequence is complete.' },
];

export default function GpuExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceRef = useRef<HTMLElement>(null);
  const frameRef = useRef(-1);
  const rafRef = useRef<number | null>(null);
  const [frames, setFrames] = useState<HTMLImageElement[]>([]);
  const [chapter, setChapter] = useState(0);
  const [percent, setPercent] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    setReducedMotion(prefersReducedMotion);

    const paths = prefersReducedMotion
      ? FRAME_PATHS.slice(0, 1)
      : FRAME_PATHS.filter((_, index) => !isMobile || index % 2 === 0);

    Promise.all(
      paths.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
          }),
      ),
    )
      .then((loadedFrames) => {
        if (!cancelled) setFrames(loadedFrames);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sequence = sequenceRef.current;
    if (!canvas || !sequence || frames.length === 0) return;

    const context = canvas.getContext('2d');
    if (!context) {
      setLoadError(true);
      return;
    }

    const drawFrame = (index: number, force = false) => {
      if (!force && frameRef.current === index) return;

      const image = frames[index];
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const scale = Math.min(canvasWidth / image.naturalWidth, canvasHeight / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;

      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height);
      frameRef.current = index;
    };

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * pixelRatio);
      canvas.height = Math.round(window.innerHeight * pixelRatio);
      drawFrame(Math.max(frameRef.current, 0), true);
    };

    const updateFrame = () => {
      rafRef.current = null;
      if (reducedMotion) {
        drawFrame(0);
        return;
      }

      const rect = sequence.getBoundingClientRect();
      const scrollableDistance = sequence.offsetHeight - window.innerHeight;

      // Map section scroll progress (0–1) to the available frame indexes.
      // Adjust the section's 400vh height in CSS to change the scroll speed.
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableDistance));
      const nextFrame = Math.round(progress * (frames.length - 1));

      if (nextFrame !== frameRef.current) {
        drawFrame(nextFrame);
        setPercent(Math.round(progress * 100));
        setChapter(Math.min(chapters.length - 1, Math.floor(progress * chapters.length)));
      }
    };

    const requestFrame = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(updateFrame);
    };

    const handleResize = () => {
      resizeCanvas();
      requestFrame();
    };

    resizeCanvas();
    updateFrame();
    window.addEventListener('scroll', requestFrame, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', requestFrame);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [frames, reducedMotion]);

  const replay = () => {
    window.scrollTo({ top: sequenceRef.current?.offsetTop ?? 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const isLoading = frames.length === 0 && !loadError;

  return (
    <main id="top">
      <header className="topbar">
        <a className="brand" href="#top">NVIDIA <span>///</span> GEFORCE</a>
        <nav>
          <a href="#inside">Sequence</a>
          <a href="#specs">Specs</a>
          <a href="https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/" target="_blank" rel="noreferrer">nvidia.com ↗</a>
        </nav>
      </header>

      <section className={`image-sequence${reducedMotion ? ' reduced-motion' : ''}`} id="inside" ref={sequenceRef} aria-busy={isLoading}>
        <div className="sequence-sticky">
          <canvas ref={canvasRef} className="sequence-canvas" aria-label="Scroll-controlled RTX 5090 product sequence" />
          {isLoading && <div className="sequence-loading">Loading 5090 frames…</div>}
          {loadError && <div className="sequence-loading">The image sequence could not be loaded.</div>}

          {!isLoading && !loadError && (
            <>
              <div className="sequence-title"><p>GeForce RTX 5090</p><h1>Inside<br />the future.</h1></div>
              <div className="sequence-rule" aria-hidden="true" />
              {chapters.map((item, index) => (
                <article key={item.tag} className={`chapter ${index === chapter ? 'active ' : ''}${index % 2 ? 'right' : ''}`}>
                  <div className="tag">{item.tag}</div><h2>{item.title}</h2><p>{item.text}</p>
                </article>
              ))}
              {!reducedMotion && <button className="replay" onClick={replay}>Replay sequence ↺</button>}
              <div className="scene-status">Frame sequence <strong>{percent}%</strong></div>
            </>
          )}
        </div>
      </section>

      <section className="specs" id="specs">
        <h2>POWER<br />WITHOUT<br /><span>COMPROMISE.</span></h2>
        <div className="specs-copy"><p>The RTX 5090 is built for the moments that demand everything: 4K gaming, neural rendering, simulation, and creation at the speed of thought.</p><dl className="spec-grid"><div className="spec"><dt>Memory</dt><dd>32 GB GDDR7</dd></div><div className="spec"><dt>Interface</dt><dd>PCIe 5.0</dd></div><div className="spec"><dt>CUDA cores</dt><dd>21,760</dd></div><div className="spec"><dt>Architecture</dt><dd>Blackwell</dd></div></dl></div>
      </section>

      <section className="outro">
        <h2>SEE<br />WHAT&apos;S<br />NEXT.</h2>
        <img className="outro-gpu" src={FRAME_PATHS[0]} alt="NVIDIA GeForce RTX 5090 Founders Edition" />
        <div className="outro-foot"><a href="https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/" target="_blank" rel="noreferrer">Explore RTX 5090 at NVIDIA ↗</a><div className="legal">This is an independent, illustrative product experience. NVIDIA, GeForce, RTX and Blackwell are trademarks of NVIDIA Corporation.</div></div>
      </section>
    </main>
  );
}
