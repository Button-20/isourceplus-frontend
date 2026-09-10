// Flat, brand-coloured vector illustrations for the waitlist landing page.
//
// Authored as inline SVG so they need no external assets and recolour with the
// theme tokens (fill-brand, fill-brand-2, fill-card, …). The style follows the
// Payllion reference: simple geometric shapes, faceless figures, soft backdrop
// blobs — sized to sit beside copy in two-column sections.
//
// Motion: each scene uses the `animate-illo-*` utilities defined in index.css
// (bars grow in, lines draw, checks pop, routes march, wheels turn, things
// float/pulse/twinkle). SVG transforms pivot on the shape's own box via
// `tbox-fill` + an `origin-*` class. Every root <svg> carries `illo` as a
// single hook for scene-wide motion rules. Animations intentionally run
// regardless of the OS reduced-motion preference (see index.css).

const delay = (s) => ({ animationDelay: `${s}s` });

// A faceless flat figure. `x`/`y` is the centre of the head.
function Person({ x, y, shirt, flip = false }) {
  const dir = flip ? -1 : 1;
  return (
    <g>
      <circle cx={x} cy={y} r="18" className="fill-[#f3c9a6]" />
      <path
        d={`M${x - 32} ${y + 96} V${y + 52} a32 32 0 0 1 64 0 V${y + 96} Z`}
        className={shirt}
      />
      {/* reaching arm */}
      <rect
        x={flip ? x - 78 : x + 18}
        y={y + 50}
        width="60"
        height="14"
        rx="7"
        className={shirt}
        transform={`rotate(${-18 * dir} ${flip ? x - 18 : x + 18} ${y + 57})`}
      />
      <rect x={x - 30} y={y + 92} width="24" height="62" rx="9" className="fill-slate-700" />
      <rect x={x + 6} y={y + 92} width="24" height="62" rx="9" className="fill-slate-700" />
      <rect x={x - 34} y={y + 150} width="32" height="10" rx="5" className="fill-slate-800" />
      <rect x={x + 2} y={y + 150} width="32" height="10" rx="5" className="fill-slate-800" />
    </g>
  );
}

// A turning wheel: tyre, hub and a spoke so the rotation reads.
function Wheel({ cx, cy, r = 13, className = "" }) {
  return (
    <g className={`tbox-fill origin-center animate-illo-wheel ${className}`}>
      <circle cx={cx} cy={cy} r={r} className="fill-slate-700" />
      <rect x={cx - 1.5} y={cy - r + 3} width="3" height={r * 2 - 6} rx="1.5" className="fill-slate-500" />
      <rect x={cx - r + 3} y={cy - 1.5} width={r * 2 - 6} height="3" rx="1.5" className="fill-slate-500" />
      <circle cx={cx} cy={cy} r={r * 0.4} className="fill-slate-300" />
    </g>
  );
}

// A bar that grows up from its base, staggered by `d` seconds.
function GrowBar({ d = 0, className, ...rest }) {
  return (
    <rect
      {...rest}
      className={`tbox-fill origin-bottom animate-illo-grow-up ${className}`}
      style={delay(d)}
    />
  );
}

// A check badge that pops in.
function PopCheck({ cx, cy, r, d = 0, fill = "fill-brand", stroke = 2.5 }) {
  const k = r / 12; // scale the tick to the badge size
  return (
    <g className="tbox-fill origin-center animate-illo-pop" style={delay(d)}>
      <circle cx={cx} cy={cy} r={r} className={fill} />
      <path
        d={`M${cx - 6 * k} ${cy} l${4 * k} ${4 * k} l${8 * k} ${-9 * k}`}
        className="stroke-white"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

// Hero: dashboard + mobile app + document + truck (the "product mockup").
export function IllustrationPlatform({ className }) {
  return (
    <svg
      viewBox="0 0 580 370"
      className={`illo ${className || ""}`}
      role="img"
      aria-label="iSourceplus procurement dashboard, mobile app and logistics"
    >
      <circle cx="90" cy="90" r="64" className="fill-brand/10 animate-illo-float-slow" />
      <circle cx="500" cy="300" r="76" className="fill-brand-2/10 animate-illo-float-slow" style={delay(2)} />

      {/* dashboard */}
      <rect x="130" y="40" width="330" height="232" rx="18" className="fill-card stroke-border" strokeWidth="2" />
      <path d="M130 58 a18 18 0 0 1 18 -18 h294 a18 18 0 0 1 18 18 v18 h-330 z" className="fill-muted" />
      <circle cx="152" cy="58" r="5" className="fill-brand-2" />
      <circle cx="168" cy="58" r="5" className="fill-[#f5b942]" />
      <circle cx="184" cy="58" r="5" className="fill-emerald-400" />
      <rect x="150" y="94" width="90" height="50" rx="10" className="fill-brand/15" />
      <rect x="250" y="94" width="90" height="50" rx="10" className="fill-brand/15" />
      <rect x="350" y="94" width="90" height="50" rx="10" className="fill-brand-2/15" />
      <rect x="160" y="104" width="44" height="9" rx="4.5" className="fill-brand" />
      <rect x="160" y="120" width="28" height="6" rx="3" className="fill-muted-foreground/50" />
      <rect x="260" y="104" width="36" height="9" rx="4.5" className="fill-brand" />
      <rect x="260" y="120" width="28" height="6" rx="3" className="fill-muted-foreground/50" />
      <rect x="360" y="104" width="52" height="9" rx="4.5" className="fill-brand-2" />
      <rect x="360" y="120" width="28" height="6" rx="3" className="fill-muted-foreground/50" />
      {/* bar chart grows in, then the trend line draws over it */}
      <GrowBar d={0.05} x="160" y="212" width="26" height="44" rx="6" className="fill-brand/50" />
      <GrowBar d={0.12} x="196" y="196" width="26" height="60" rx="6" className="fill-brand/65" />
      <GrowBar d={0.19} x="232" y="206" width="26" height="50" rx="6" className="fill-brand/50" />
      <GrowBar d={0.26} x="268" y="180" width="26" height="76" rx="6" className="fill-brand/80" />
      <GrowBar d={0.33} x="304" y="190" width="26" height="66" rx="6" className="fill-brand/65" />
      <GrowBar d={0.4} x="340" y="166" width="26" height="90" rx="6" className="fill-brand" />
      <GrowBar d={0.47} x="376" y="176" width="26" height="80" rx="6" className="fill-brand/80" />
      <GrowBar d={0.54} x="412" y="158" width="26" height="98" rx="6" className="fill-brand-2" />
      <polyline
        points="173,200 209,186 245,192 281,170 317,176 353,154 389,160 425,138"
        className="stroke-brand-2 animate-illo-draw"
        style={delay(0.7)}
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* phone floats; its confirmation pops in */}
      <g className="animate-illo-float">
        <rect x="38" y="140" width="112" height="204" rx="22" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="50" y="160" width="88" height="156" rx="14" className="fill-muted" />
        <rect x="72" y="150" width="44" height="6" rx="3" className="fill-slate-700" />
        <PopCheck cx={94} cy={216} r={28} d={0.9} stroke={4.5} />
        <rect x="64" y="258" width="60" height="8" rx="4" className="fill-brand/45" />
        <rect x="72" y="274" width="44" height="8" rx="4" className="fill-brand/25" />
        <rect x="62" y="294" width="64" height="12" rx="6" className="fill-brand-2" />
      </g>

      {/* floating document */}
      <g className="animate-illo-float-slow" style={delay(1.2)}>
        <g transform="rotate(8 458 84)">
          <rect x="412" y="26" width="92" height="116" rx="12" className="fill-card stroke-border" strokeWidth="2" />
          <rect x="426" y="44" width="40" height="8" rx="4" className="fill-brand" />
          <rect x="426" y="62" width="64" height="6" rx="3" className="fill-muted-foreground/50" />
          <rect x="426" y="76" width="56" height="6" rx="3" className="fill-muted-foreground/50" />
          <rect x="426" y="90" width="60" height="6" rx="3" className="fill-muted-foreground/50" />
          <PopCheck cx={480} cy={120} r={11} d={1.3} fill="fill-brand-2" />
        </g>
      </g>

      {/* truck bobs along; wheels turn */}
      <g className="animate-illo-drive">
        <rect x="372" y="296" width="118" height="48" rx="8" className="fill-brand" />
        <rect x="490" y="308" width="50" height="36" rx="7" className="fill-brand-2" />
        <rect x="500" y="314" width="22" height="14" rx="3" className="fill-white/70" />
        <Wheel cx={404} cy={348} />
        <Wheel cx={512} cy={348} />
      </g>
      <rect x="340" y="360" width="230" height="4" rx="2" className="fill-border" />
    </svg>
  );
}

// About: buyer and supplier connecting over a verified document, with a
// network of nodes above them.
export function IllustrationNetwork({ className }) {
  const nodes = [
    [160, 70],
    [280, 40],
    [400, 70],
    [230, 110],
    [330, 110],
  ];
  return (
    <svg
      viewBox="0 0 560 360"
      className={`illo ${className || ""}`}
      role="img"
      aria-label="A buyer and a supplier connecting through iSourceplus"
    >
      <circle cx="280" cy="180" r="140" className="fill-brand/8 animate-illo-float-slow" />
      {/* skyline with twinkling windows */}
      <rect x="60" y="150" width="60" height="120" rx="6" className="fill-muted" />
      <rect x="130" y="120" width="44" height="150" rx="6" className="fill-muted/80" />
      <rect x="390" y="130" width="50" height="140" rx="6" className="fill-muted/80" />
      <rect x="450" y="160" width="62" height="110" rx="6" className="fill-muted" />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <rect
            key={`w${r}${c}`}
            x={72 + c * 22}
            y={164 + r * 28}
            width="12"
            height="14"
            rx="2"
            className="fill-brand/30 tbox-fill origin-center animate-illo-twinkle"
            style={delay((r * 2 + c) * 0.35)}
          />
        )),
      )}
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <rect
            key={`v${r}${c}`}
            x={462 + c * 22}
            y={174 + r * 28}
            width="12"
            height="14"
            rx="2"
            className="fill-brand-2/30 tbox-fill origin-center animate-illo-twinkle"
            style={delay(0.2 + (r * 2 + c) * 0.4)}
          />
        )),
      )}

      {/* network links march; nodes pulse */}
      <g className="stroke-brand/50" strokeWidth="2" strokeDasharray="5 6" fill="none">
        <line x1="160" y1="70" x2="280" y2="40" className="animate-illo-dash" />
        <line x1="280" y1="40" x2="400" y2="70" className="animate-illo-dash" />
        <line x1="160" y1="70" x2="230" y2="110" className="animate-illo-dash" />
        <line x1="400" y1="70" x2="330" y2="110" className="animate-illo-dash" />
        <line x1="230" y1="110" x2="330" y2="110" className="animate-illo-dash" />
      </g>
      {nodes.map(([cx, cy], i) => (
        <g key={i} className="tbox-fill origin-center animate-illo-pulse" style={delay(i * 0.3)}>
          <circle cx={cx} cy={cy} r="12" className={i % 2 ? "fill-brand-2" : "fill-brand"} />
          <circle cx={cx} cy={cy} r="5" className="fill-white/90" />
        </g>
      ))}

      {/* document between them floats; its approval pops in */}
      <g className="animate-illo-float" style={delay(0.6)}>
        <rect x="236" y="176" width="88" height="106" rx="12" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="250" y="194" width="40" height="8" rx="4" className="fill-brand" />
        <rect x="250" y="212" width="60" height="6" rx="3" className="fill-muted-foreground/50" />
        <rect x="250" y="226" width="52" height="6" rx="3" className="fill-muted-foreground/50" />
        <rect x="250" y="240" width="58" height="6" rx="3" className="fill-muted-foreground/50" />
        <PopCheck cx={298} cy={262} r={12} d={0.8} fill="fill-brand-2" />
      </g>

      <Person x={175} y={150} shirt="fill-brand" />
      <Person x={385} y={150} shirt="fill-brand-2" flip />
      <rect x="40" y="316" width="480" height="4" rx="2" className="fill-border" />
    </svg>
  );
}

// Benefits: cargo truck on a route to a map pin, with boxes ready to ship.
export function IllustrationLogistics({ className }) {
  return (
    <svg
      viewBox="0 0 560 360"
      className={`illo ${className || ""}`}
      role="img"
      aria-label="Cargo transporter delivering goods along a mapped route"
    >
      <circle cx="120" cy="110" r="70" className="fill-brand-2/10 animate-illo-float-slow" />
      <circle cx="450" cy="120" r="80" className="fill-brand/10 animate-illo-float-slow" style={delay(1.5)} />

      {/* route dashes march toward the destination */}
      <path
        d="M80 300 C 160 240, 240 340, 320 260 S 440 180, 470 130"
        className="stroke-brand/60 animate-illo-route"
        strokeWidth="4"
        strokeDasharray="10 10"
        fill="none"
        strokeLinecap="round"
      />
      {/* destination pin floats over a rippling marker */}
      <circle cx="470" cy="166" r="12" className="fill-brand-2/50 tbox-fill origin-center animate-illo-ring" />
      <circle cx="470" cy="166" r="12" className="fill-brand-2/50 tbox-fill origin-center animate-illo-ring" style={delay(1)} />
      <g className="animate-illo-float">
        <path d="M470 60 c-24 0 -40 17 -40 38 c0 26 40 66 40 66 s40 -40 40 -66 c0 -21 -16 -38 -40 -38z" className="fill-brand-2" />
        <circle cx="470" cy="98" r="14" className="fill-white/90" />
      </g>

      {/* boxes */}
      <rect x="60" y="216" width="54" height="54" rx="6" className="fill-[#c98b4a]" />
      <rect x="60" y="238" width="54" height="10" className="fill-[#a86f36]" />
      <rect x="120" y="236" width="40" height="34" rx="5" className="fill-[#c98b4a]" />
      <rect x="120" y="250" width="40" height="8" className="fill-[#a86f36]" />
      <rect x="82" y="182" width="40" height="34" rx="5" className="fill-[#d99a5a]" />

      {/* truck bobs along; wheels turn */}
      <g className="animate-illo-drive">
        <rect x="190" y="200" width="200" height="86" rx="10" className="fill-brand" />
        <rect x="206" y="216" width="168" height="8" rx="4" className="fill-white/25" />
        <rect x="206" y="232" width="120" height="8" rx="4" className="fill-white/25" />
        <rect x="390" y="228" width="78" height="58" rx="9" className="fill-brand-2" />
        <rect x="404" y="238" width="40" height="22" rx="4" className="fill-white/75" />
        <rect x="452" y="262" width="20" height="10" rx="3" className="fill-[#f5b942]" />
        <Wheel cx={240} cy={292} r={18} />
        <Wheel cx={350} cy={292} r={18} />
        <Wheel cx={436} cy={292} r={18} />
      </g>
      <rect x="40" y="312" width="490" height="4" rx="2" className="fill-border" />
    </svg>
  );
}

// Vision: growth bars with a figure planting a flag, a target, and a
// mobile-money / card payment badge — "powering the 24-hr economy".
export function IllustrationGrowth({ className }) {
  return (
    <svg
      viewBox="0 0 560 360"
      className={`illo ${className || ""}`}
      role="img"
      aria-label="Business growth powered by integrated payments"
    >
      <circle cx="430" cy="110" r="84" className="fill-brand/10 animate-illo-float-slow" />
      {/* target with a rippling outer ring and a pulsing bullseye */}
      <circle cx="430" cy="110" r="46" className="fill-none stroke-brand-2/50 tbox-fill origin-center animate-illo-ring" strokeWidth="4" />
      <circle cx="430" cy="110" r="46" className="fill-card stroke-brand-2" strokeWidth="6" />
      <circle cx="430" cy="110" r="28" className="fill-card stroke-brand-2" strokeWidth="6" />
      <circle cx="430" cy="110" r="10" className="fill-brand-2 tbox-fill origin-center animate-illo-pulse" />

      {/* bars grow in, then the arrow draws and its head pops */}
      <GrowBar d={0.1} x="80" y="240" width="60" height="70" rx="8" className="fill-brand/45" />
      <GrowBar d={0.25} x="160" y="200" width="60" height="110" rx="8" className="fill-brand/65" />
      <GrowBar d={0.4} x="240" y="150" width="60" height="160" rx="8" className="fill-brand/85" />
      <GrowBar d={0.55} x="320" y="110" width="60" height="200" rx="8" className="fill-brand" />
      <path
        d="M90 236 C 170 190, 220 140, 340 96"
        className="stroke-brand-2 animate-illo-draw"
        style={delay(0.8)}
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset="1"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M318 84 L350 92 L332 118 Z"
        className="fill-brand-2 tbox-fill origin-center animate-illo-pop"
        style={delay(2.2)}
      />

      {/* figure on the top bar with a flag */}
      <Person x={350} y={-4} shirt="fill-brand-2" />
      <rect x="384" y="-20" width="4" height="130" rx="2" className="fill-slate-300" />
      <path
        d="M388 -18 h56 l-14 16 l14 16 h-56 z"
        className="fill-brand-2 tbox-fill origin-left animate-illo-swing"
        style={delay(0.4)}
      />

      {/* payment badge: floating phone + card */}
      <g className="animate-illo-float">
        <rect x="40" y="60" width="86" height="150" rx="16" className="fill-card stroke-border" strokeWidth="2" />
        <rect x="50" y="76" width="66" height="116" rx="10" className="fill-muted" />
        <rect x="60" y="92" width="46" height="30" rx="6" className="fill-[#f5b942]" />
        <rect x="60" y="130" width="46" height="8" rx="4" className="fill-brand/50" />
        <rect x="60" y="146" width="32" height="8" rx="4" className="fill-brand/30" />
        <PopCheck cx={83} cy={176} r={9} d={1} stroke={2.2} />
      </g>
      <g className="animate-illo-float-slow" style={delay(0.9)}>
        <g transform="rotate(-12 150 130)">
          <rect x="110" y="110" width="84" height="52" rx="8" className="fill-brand-2" />
          <rect x="110" y="124" width="84" height="10" className="fill-slate-900/40" />
          <rect x="120" y="144" width="26" height="8" rx="3" className="fill-white/80" />
        </g>
      </g>

      {/* 24-hr clock badge pulses gently */}
      <g className="tbox-fill origin-center animate-illo-pulse" style={delay(1.2)}>
        <circle cx="470" cy="270" r="40" className="fill-card stroke-brand" strokeWidth="5" />
        <text x="470" y="266" textAnchor="middle" className="fill-brand font-display text-[22px] font-bold">24</text>
        <text x="470" y="288" textAnchor="middle" className="fill-muted-foreground text-[11px] font-semibold tracking-widest">HRS</text>
      </g>
      <rect x="40" y="316" width="490" height="4" rx="2" className="fill-border" />
    </svg>
  );
}

// Form: a sign-up clipboard with completed checks, an envelope and a bell.
export function IllustrationSignup({ className }) {
  return (
    <svg
      viewBox="0 0 480 400"
      className={`illo ${className || ""}`}
      role="img"
      aria-label="Reserve your spot on the iSourceplus waitlist"
    >
      <circle cx="240" cy="200" r="150" className="fill-brand/8 animate-illo-float-slow" />
      {/* clipboard: checks pop in one after another; the last one is pending */}
      <rect x="130" y="60" width="220" height="290" rx="20" className="fill-card stroke-border" strokeWidth="2" />
      <rect x="196" y="44" width="88" height="34" rx="12" className="fill-brand" />
      <rect x="222" y="54" width="36" height="12" rx="6" className="fill-white/80" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="156" y={118 + i * 52} width="168" height="36" rx="10" className="fill-muted" />
          {i < 3 ? (
            <PopCheck cx={178} cy={136 + i * 52} r={11} d={0.3 + i * 0.35} />
          ) : (
            <g className="tbox-fill origin-center animate-illo-pulse" style={delay(1.4)}>
              <circle cx="178" cy={136 + i * 52} r="11" className="fill-brand-2" />
              <rect x="174" y={135 + i * 52} width="8" height="2.5" rx="1" className="fill-white" />
            </g>
          )}
          <rect x="200" y={130 + i * 52} width={i === 1 ? 80 : 104} height="7" rx="3.5" className="fill-muted-foreground/60" />
          <rect x="200" y={142 + i * 52} width="64" height="5" rx="2.5" className="fill-muted-foreground/35" />
        </g>
      ))}
      {/* envelope floats */}
      <g className="animate-illo-float" style={delay(0.5)}>
        <g transform="rotate(-10 92 300)">
          <rect x="40" y="270" width="104" height="64" rx="10" className="fill-brand-2" />
          <path d="M40 280 L92 318 L144 280" className="stroke-white/80" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* bell swings from its top */}
      <g className="tbox-fill origin-top animate-illo-swing">
        <g transform="rotate(12 400 110)">
          <path d="M372 132 a28 28 0 0 1 56 0 v22 l10 12 h-76 l10 -12 z" className="fill-[#f5b942]" />
          <circle cx="400" cy="176" r="8" className="fill-[#d99a2a]" />
          <circle cx="400" cy="100" r="5" className="fill-[#f5b942]" />
        </g>
      </g>
      {/* sparkles twinkle */}
      <path
        d="M96 120 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 z"
        className="fill-brand/60 tbox-fill origin-center animate-illo-twinkle"
      />
      <path
        d="M392 240 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4 z"
        className="fill-brand-2/60 tbox-fill origin-center animate-illo-twinkle"
        style={delay(0.8)}
      />
    </svg>
  );
}
