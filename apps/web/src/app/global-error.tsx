"use client";

/**
 * The boundary for a failure in the root layout itself, which is the one case
 * error.tsx cannot catch — at this point React has no layout left to render
 * into, so this component supplies its own <html> and <body>.
 *
 * Nothing here may import from the design system or the app shell: if the
 * layout is what broke, anything it depended on is suspect too. Hence the
 * inline styles, which is the one place in this codebase they are the right
 * answer rather than a shortcut.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#FAFAF8",
          color: "#161618",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 10px" }}>Dr Evide is temporarily unavailable</h1>
          <p style={{ color: "#4E4B43", lineHeight: 1.55, margin: "0 0 22px" }}>
            Please try again in a moment.{" "}
            <strong>
              In an emergency, call <a href="tel:108">108</a> for a free ambulance — you do not
              need this site to do that.
            </strong>
          </p>
          <button
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "0 22px",
              borderRadius: 12,
              border: "none",
              background: "#0f766e",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
