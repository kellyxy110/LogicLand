// Custom brand geometry for the landing page. Deliberately abstract — nodes,
// paths, and blocks that evoke logic and building — so the brand reads as
// premium and considered rather than a stock mascot or emoji. Pure SVG, so these
// stay server components with zero client cost.

/** The LogicLand mark: an "L" traced as a node graph — logic made of steps. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="LogicLand">
      <rect width="32" height="32" rx="9" fill="#6C5CE7" />
      <path
        d="M11 9 V 21 H 22"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="9" r="2.6" fill="white" />
      <circle cx="11" cy="21" r="2.6" fill="#FFB020" />
      <circle cx="22" cy="21" r="2.6" fill="white" />
    </svg>
  );
}

/** Hero composition: an ascending path of connected ideas, with soft blocks. */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 360"
      className={className}
      role="img"
      aria-label="An ascending path of connected ideas"
    >
      <defs>
        <linearGradient id="ll-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A29BFE" stopOpacity="0.28" />
          <stop offset="1" stopColor="#6C5CE7" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* backdrop + floating blocks */}
      <rect x="38" y="38" width="284" height="284" rx="60" fill="url(#ll-warm)" />
      <rect
        x="70"
        y="80"
        width="54"
        height="54"
        rx="16"
        fill="#38BDF8"
        opacity="0.18"
        transform="rotate(-12 97 107)"
      />
      <rect
        x="236"
        y="212"
        width="66"
        height="66"
        rx="18"
        fill="#FFB020"
        opacity="0.16"
        transform="rotate(10 269 245)"
      />

      {/* the connecting path */}
      <polyline
        points="72,292 134,246 128,176 208,158 250,98 300,74"
        fill="none"
        stroke="#6C5CE7"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.45"
      />

      {/* nodes along the way */}
      <circle cx="72" cy="292" r="9" fill="#6C5CE7" />
      <circle cx="134" cy="246" r="7" fill="#38BDF8" />
      <circle cx="128" cy="176" r="6" fill="#A29BFE" />
      <circle cx="208" cy="158" r="10" fill="#22C55E" />
      <circle cx="208" cy="158" r="4" fill="white" />
      <circle cx="250" cy="98" r="7" fill="#6C5CE7" />
      {/* the destination — a bright idea */}
      <circle cx="300" cy="74" r="13" fill="#FFB020" />
      <circle cx="300" cy="74" r="5.5" fill="white" />

      {/* fine accents */}
      <circle cx="96" cy="210" r="3" fill="#6C5CE7" opacity="0.4" />
      <circle cx="286" cy="150" r="3" fill="#22C55E" opacity="0.5" />
      <circle cx="172" cy="292" r="3" fill="#FFB020" opacity="0.5" />
    </svg>
  );
}

/** A numbered, tinted crest for a world in the journey. Open worlds are filled;
 *  upcoming worlds are outlined and softened — honest, and still elegant. */
export function JourneyMark({
  tone,
  index,
  open,
}: {
  tone: string;
  index: number;
  open: boolean;
}) {
  return (
    <svg viewBox="0 0 44 44" className="h-12 w-12 shrink-0" role="img" aria-hidden>
      <rect
        x="2"
        y="2"
        width="40"
        height="40"
        rx="12"
        fill={tone}
        fillOpacity={open ? 0.14 : 0}
        stroke={tone}
        strokeWidth="2"
        strokeOpacity={open ? 0.55 : 0.3}
      />
      <text
        x="22"
        y="29"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fill={tone}
        fillOpacity={open ? 1 : 0.55}
        fontFamily="var(--font-display), sans-serif"
      >
        {index}
      </text>
    </svg>
  );
}
