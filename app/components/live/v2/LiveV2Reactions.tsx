'use client';

/**
 * The reactions row above the chat input in the new layout, the same six the app shows. Each tap only calls the page's
 * existing reaction handler; nothing about how a reaction is sent or shown changes.
 */
const EMOJIS = ['🔥', '❤️', '👏', '😍', '🎉', '😮'] as const;

export function LiveV2Reactions({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <div className="ls-v2-reacts" role="group" aria-label="Send a reaction">
      {EMOJIS.map((e) => (
        <button key={e} type="button" className="ls-v2-react" onClick={() => onReact(e)} aria-label={`React ${e}`}>
          <span aria-hidden="true">{e}</span>
        </button>
      ))}
    </div>
  );
}
