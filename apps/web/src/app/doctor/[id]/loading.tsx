/**
 * Profile skeleton.
 *
 * The doctor page is a server component that awaits a database read with a 5s
 * statement timeout, so "nothing at all for up to five seconds" was a real
 * state with no representation. Shaped like the finished page so nothing jumps
 * when the data lands.
 */
export default function Loading() {
  return (
    <div className="profile-grid" style={{ marginTop: 20 }} aria-hidden="true">
      <div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
          <div className="skeleton" style={{ width: 76, height: 76, borderRadius: 999 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton--line" style={{ width: "55%", height: 26 }} />
            <div className="skeleton skeleton--line" style={{ width: "70%", height: 16 }} />
            <div className="skeleton skeleton--line" style={{ width: "35%", height: 22 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 58, borderRadius: 12, marginBottom: 10 }} />
        <div className="skeleton" style={{ height: 58, borderRadius: 12 }} />
      </div>
      <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
    </div>
  );
}
