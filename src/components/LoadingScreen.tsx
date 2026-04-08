/**
 * Animated loading screen — stick figure climbing a staircase.
 * Two-frame walk cycle (stride/gather) toggles every 0.3s for a marching rhythm.
 * Theme-aware: uses CSS custom properties, adapts to all themes automatically.
 * CSS animations defined in src/index.css under "Loading Screen Animation".
 */

const STEP_DELAYS = [0, 0.42, 0.96, 1.50, 2.04];

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface bg-topo flex flex-col items-center justify-center gap-8">
      <svg
        viewBox="0 0 140 110"
        className="w-48 overflow-visible"
        aria-hidden="true"
      >
        {/* Staircase outline — draws itself on mount via stroke-dashoffset */}
        <polyline
          className="loading-stairs"
          points="10,98 34,98 34,81 58,81 58,64 82,64 82,47 106,47 106,30 130,30"
          fill="none"
          stroke="var(--text-subtle)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Step flash highlights — each lights up when the climber arrives */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = 10 + i * 24;
          const y = 98 - i * 17;
          return (
            <line
              key={i}
              x1={x} y1={y} x2={x + 24} y2={y}
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="loading-step"
              style={{ animationDelay: `${STEP_DELAYS[i]}s` }}
            />
          );
        })}

        {/* Climbing stick figure — origin at feet, figure drawn upward */}
        <g className="loading-climber">
          {/* Glow halo (centered on torso) */}
          <circle cx="0" cy="-10" r="12" fill="var(--accent)" className="loading-glow" />

          {/* Head */}
          <circle cx="0" cy="-18" r="3.5" fill="var(--accent)" />

          {/* Torso */}
          <line
            x1="0" y1="-14.5" x2="0" y2="-6"
            stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"
          />

          {/* Frame A: stride — legs and arms spread wide */}
          <g className="loading-frame-a">
            <line x1="0" y1="-12" x2="-4" y2="-8"
              stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="-12" x2="4.5" y2="-9"
              stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="3.5" y2="-0.5"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="-3" y2="1"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Frame B: gather — legs and arms compact (between strides) */}
          <g className="loading-frame-b">
            <line x1="0" y1="-12" x2="-2" y2="-8"
              stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="-12" x2="2.5" y2="-8.5"
              stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="1.5" y2="0.5"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="-1" y2="0.5"
              stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>
      </svg>

      {/* Brand text with staggered letter reveal */}
      <div
        className="font-display text-[11px] tracking-[0.25em] uppercase flex"
        aria-label="Maha Log"
      >
        {'MAHA LOG'.split('').map((char, i) => (
          <span
            key={i}
            className="loading-letter text-fg-subtle"
            style={{ animationDelay: `${0.3 + i * 0.06}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    </div>
  );
}
