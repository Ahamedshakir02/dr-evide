"use client";

import {
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  GitBranch,
  Languages,
  Map,
  Pencil,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { SCORE_WEIGHTS } from "@dr-evide/core";
import { useLang } from "@/lib/lang";
import { siteCopy, type FeatureIcon, type ScreenId } from "@/lib/site-copy";
import { NotifyForm } from "./NotifyForm";
import { PhoneMockup } from "./PhoneMockup";
import { StoreBadges } from "./StoreBadges";

/**
 * The website's front page.
 *
 * The site has two readers and, until now, one page for both of them. Someone
 * unwell wants the symptom box and nothing else; someone deciding whether to
 * trust this thing — a doctor asked to be listed, a journalist, whoever is
 * reading the pitch — wants to know what it is, who ranks whom, and on what
 * basis. Answering the second question inside the first one's search box made
 * both worse, so the product moved to /find and this page took over the
 * explaining.
 *
 * Two rules hold it honest:
 *
 * 1. Every number on this page is read from the code that produces it. The
 *    TrustScore weights below come from SCORE_WEIGHTS in @dr-evide/core, so a
 *    marketing claim about how ranking works cannot drift away from how ranking
 *    actually works — change a weight and this page changes with it.
 * 2. Nothing here is a promise the repo does not keep. "No paid placement" is
 *    checked by CI (scripts/check-no-paid-ranking.mjs); the sample-data caveat
 *    is stated on the page rather than in a footnote, because every doctor on
 *    this site today is fictional.
 *
 * A client component for the language toggle, same as the rest of the site. The
 * route file stays a server component so the page keeps its own metadata.
 */
export function Landing() {
  const { lang, t } = useLang();
  const c = siteCopy(lang);

  return (
    <div className="landing">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__copy">
          <div className="sh-eyebrow">{c.hero.eyebrow}</div>
          <h1 className="lp-hero__title">
            {c.hero.titleLead} <em>{c.hero.titleEmphasis}</em>
          </h1>
          <p className="lp-hero__sub">{c.hero.sub}</p>

          <div className="lp-hero__actions">
            <a className="sh-btn sh-btn--primary sh-btn--lg" href="/find">
              {c.hero.ctaFind}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="sh-btn sh-btn--secondary sh-btn--lg" href="#download">
              {c.hero.ctaGet}
            </a>
          </div>

          <ul className="lp-proof">
            {c.hero.proof.map((claim) => (
              <li key={claim}>
                <CircleCheck size={15} aria-hidden="true" />
                {claim}
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-hero__art">
          <PhoneMockup screen="ask" />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <Section id="how-it-works" eyebrow={c.steps.eyebrow} title={c.steps.title} sub={c.steps.sub}>
        <ol className="lp-steps">
          {c.steps.items.map((step, i) => (
            <li className="lp-step" key={step.title}>
              <span className="lp-step__n sh-mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="lp-step__title">{step.title}</h3>
              <p className="lp-step__body">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── What it does ──────────────────────────────────────────── */}
      <Section
        id="features"
        eyebrow={c.features.eyebrow}
        title={c.features.title}
        sub={c.features.sub}
      >
        <div className="lp-features">
          {c.features.items.map((f) => (
            <article className="sh-card lp-feature" key={f.title}>
              <span className="icon-tile">{FEATURE_ICONS[f.icon]}</span>
              <h3 className="lp-feature__title">{f.title}</h3>
              <p className="lp-feature__body">{f.body}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* ── The app's screens ─────────────────────────────────────── */}
      <Section
        id="screens"
        eyebrow={c.screens.eyebrow}
        title={c.screens.title}
        sub={c.screens.sub}
      >
        <div className="lp-screens">
          {SCREEN_ORDER.map((id) => (
            <figure className="lp-screen" key={id}>
              <PhoneMockup screen={id} />
              <figcaption>
                <span className="lp-screen__label">{c.screens.captions[id].label}</span>
                {c.screens.captions[id].caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ── How ranking works ─────────────────────────────────────────
          The weights are SCORE_WEIGHTS, and the labels are core's own
          translations of them — the same two sources /find reads. This
          page cannot describe a ranking the product does not run. */}
      <Section id="trust" eyebrow={c.trust.eyebrow} title={c.trust.title} sub={c.trust.sub}>
        <div className="lp-trust">
          <div className="sh-card lp-weights">
            <div className="sh-eyebrow">{t.howTrustScoreWorks}</div>
            <p className="lp-weights__cap">{c.trust.weightsCaption}</p>
            <div className="lp-weights__list">
              {SCORE_WEIGHTS.map(({ key, max }) => (
                <div className="lp-weight" key={key}>
                  <span className="lp-weight__head">
                    <span>{t.weightLabels[key]}</span>
                    <span className="sh-mono lp-weight__pct">{max}%</span>
                  </span>
                  <span className="lp-weight__track">
                    <span className="lp-weight__fill" style={{ width: `${max}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-trust__notes">
            <article className="sh-card lp-note">
              <span className="lp-note__icon lp-note__icon--pine">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <h3>{c.trust.pledgeTitle}</h3>
              <p>{c.trust.pledgeBody}</p>
            </article>
            <article className="sh-card lp-note">
              <span className="lp-note__icon">
                <GitBranch size={20} aria-hidden="true" />
              </span>
              <h3>{c.trust.openTitle}</h3>
              <p>{c.trust.openBody}</p>
            </article>
          </div>
        </div>
      </Section>

      {/* ── Download ──────────────────────────────────────────────── */}
      <Section
        id="download"
        eyebrow={c.download.eyebrow}
        title={c.download.title}
        sub={c.download.sub}
      >
        <div className="lp-download">
          <div className="sh-card lp-download__stores">
            <StoreBadges />
            <hr className="lp-download__rule" />
            <NotifyForm />
          </div>

          {/* The working alternative, given equal weight rather than a
              footnote — it is the thing that actually exists today. */}
          <div className="sh-card lp-download__browser">
            <h3>{c.download.browserTitle}</h3>
            <p>{c.download.browserBody}</p>
            <a className="sh-btn sh-btn--primary sh-btn--block" href="/find">
              {c.download.browserCta}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </Section>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <Section id="faq" eyebrow={c.faq.eyebrow} title={c.faq.title}>
        <div className="lp-faq">
          {c.faq.items.map((item) => (
            <details className="lp-faq__item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* No closing disclaimer block here. There was one, and it sat
          directly above the footer's — the same sentence from the same
          string in core, twice on one screen. The footer carries it on
          every page, so this page does not need its own copy. */}
    </div>
  );
}

/** Order the screens tell the story in, not the order they were built in. */
const SCREEN_ORDER: ScreenId[] = ["ask", "results", "profile", "emergency"];

const FEATURE_ICONS: Record<FeatureIcon, React.ReactNode> = {
  pencil: <Pencil size={20} aria-hidden="true" />,
  siren: <Siren size={20} aria-hidden="true" />,
  shield: <ShieldCheck size={20} aria-hidden="true" />,
  map: <Map size={20} aria-hidden="true" />,
  badge: <BadgeCheck size={20} aria-hidden="true" />,
  languages: <Languages size={20} aria-hidden="true" />,
};

function Section({
  id,
  eyebrow,
  title,
  sub,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lp-section" id={id} aria-labelledby={`${id}-title`}>
      <header className="lp-section__head">
        <div className="sh-eyebrow">{eyebrow}</div>
        <h2 className="lp-section__title" id={`${id}-title`}>
          {title}
        </h2>
        {sub && <p className="lp-section__sub">{sub}</p>}
      </header>
      {children}
    </section>
  );
}
