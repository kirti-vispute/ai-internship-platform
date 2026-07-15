"use client";

/**
 * Animated mesh background inspired by Uiverse SelfMadeSystem/warm-lion-64
 * (dotted gradient field with slow ambient motion). MIT-licensed style from Uiverse community.
 */
export function UiverseAnimatedBackground() {
  return (
    <div className="uiverse-warm-lion pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="uiverse-warm-lion__layer uiverse-warm-lion__dots" />
      <div className="uiverse-warm-lion__layer uiverse-warm-lion__mesh" />
      <div className="uiverse-warm-lion__layer uiverse-warm-lion__mesh uiverse-warm-lion__mesh--alt" />
      <div className="uiverse-warm-lion__layer uiverse-warm-lion__glow uiverse-warm-lion__glow--blue" />
      <div className="uiverse-warm-lion__layer uiverse-warm-lion__glow uiverse-warm-lion__glow--green" />
      <div className="uiverse-warm-lion__layer uiverse-warm-lion__glow uiverse-warm-lion__glow--purple" />
    </div>
  );
}
