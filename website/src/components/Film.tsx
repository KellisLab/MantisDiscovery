'use client';
// The launch film. Only the poster loads with the page; the video (with captions) is created when the
// visitor asks for it, so the page carries none of its weight until then.
import { useRef, useState } from 'react';

type Props = { src: string; poster: string; posterPhone: string; captions: string; title: string; duration: string };

export function Film({ src, poster, posterPhone, captions, title, duration }: Props) {
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  return (
    <div className="film" data-playing={playing || undefined} data-station="film" data-poster={poster} data-poster-phone={posterPhone}>
      {playing ? (
        <video ref={video} className="film__video" src={src} poster={poster} controls autoPlay playsInline preload="auto">
          <track kind="captions" src={captions} srcLang="en" label="English" default />
        </video>
      ) : (
        <button type="button" className="film__poster" onClick={() => setPlaying(true)}>
          {/* Phones get a square still with the title set above the graph, so neither is cropped. */}
          <picture>
            <source media="(max-width: 600px)" srcSet={posterPhone} width={1080} height={1080} />
            <img src={poster} alt="" width={1600} height={900} loading="lazy" decoding="async" />
          </picture>
          <span className="film__play">
            <span className="film__tri" aria-hidden="true" />
            <span>Play the film</span>
            <span className="film__dur num">{duration}</span>
            <span className="sr-only">: {title}, with captions</span>
          </span>
        </button>
      )}
    </div>
  );
}
