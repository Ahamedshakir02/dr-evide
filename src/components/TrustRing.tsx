/**
 * The TrustScore ring — conic-gradient donut from the design
 * (Dr Evide.dc.html:206-212). The arc is the score itself, so it reads as
 * a proportion of 100 without needing a legend.
 */
export function TrustRing({
  score,
  size = 56,
  showDenominator = false,
}: {
  score: number;
  size?: number;
  showDenominator?: boolean;
}) {
  const inner = size - 12;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(var(--accent) ${score}%, var(--border) 0)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
      }}
      role="img"
      aria-label={`TrustScore ${score} out of 100`}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: "50%",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="sh-mono"
          style={{
            fontWeight: 700,
            fontSize: Math.round(size * 0.34),
            color: "var(--accent-text)",
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        {showDenominator && (
          <span
            style={{
              fontSize: 8,
              letterSpacing: "0.06em",
              color: "var(--text-faint)",
              textTransform: "uppercase",
            }}
          >
            of 100
          </span>
        )}
      </div>
    </div>
  );
}
