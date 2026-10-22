'use client';
import { useState } from 'react';

export function CopyCite({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('done');
    } catch {
      setState('fail');
    }
    setTimeout(() => setState('idle'), 2400);
  };
  return (
    <div className="cite">
      {/* One block per field, so a long title or URL wraps under its own value instead of running off the box. */}
      <pre className="cite__code mono" tabIndex={0} aria-label="BibTeX citation"><code>{text.split('\n').map((line, k) => <span key={k} className="cite__line">{line}</span>)}</code></pre>
      <button type="button" className="go cite__copy" onClick={copy}>
        <span className="mark" data-state={state === 'done' ? 'shown' : 'open'} aria-hidden="true" />
        {state === 'done' ? 'Copied' : state === 'fail' ? 'Select the text to copy' : 'Copy BibTeX'}
      </button>
      <span className="sr-only" aria-live="polite">{state === 'done' ? 'Citation copied' : ''}</span>
    </div>
  );
}
