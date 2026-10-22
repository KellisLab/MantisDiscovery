'use client';
// A Mantis demo from mantis.csail.mit.edu: an agent working over a map of course topics. It plays muted on
// a loop while it is on screen and pauses when it leaves; reduced motion keeps the still.
import { useEffect, useRef } from 'react';

type Props = { src: string; poster: string; label: string };

export function MantisDemo({ src, poster, label }: Props) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current!;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video ref={video} className="statement__video" src={src} poster={poster} muted loop playsInline preload="none"
      width={1280} height={720} aria-label={label} />
  );
}
