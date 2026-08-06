/**
 * Placeholder rows shown while a search is in flight.
 *
 * Shaped to match DoctorCard's real geometry — same 56px avatar, same three
 * text lines, same ring on the right — so the list doesn't jump when results
 * land. The previous loading state was the string "Finding doctors…", which
 * measured zero height and made every search reflow the page.
 *
 * aria-hidden: this is scaffolding, not content. The status message beside the
 * radius slider is what a screen reader should hear.
 */
export function DoctorCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="sh-card doc-card skeleton-card" key={i}>
          <div className="doc-card__top">
            <div className="skeleton skeleton--avatar" />
            <div className="doc-card__body">
              <div className="skeleton skeleton--line" style={{ width: "62%", height: 18 }} />
              <div className="skeleton skeleton--line" style={{ width: "40%", height: 13 }} />
              <div className="skeleton skeleton--line" style={{ width: "30%", height: 20 }} />
            </div>
            <div className="skeleton skeleton--ring" />
          </div>
          <div className="doc-card__foot">
            <div className="skeleton skeleton--line" style={{ width: 110, height: 14 }} />
            <div className="skeleton skeleton--line" style={{ width: 70, height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
