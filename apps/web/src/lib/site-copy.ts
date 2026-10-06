import type { Lang } from "@dr-evide/core";

/**
 * Copy for the public face of the website — the landing page and the site
 * chrome around it.
 *
 * Deliberately *not* in @dr-evide/core, and that is not an oversight of the
 * "one copy of shared logic" rule. Core exists for the things both apps show,
 * because a phrase that means one thing on the website and another in the app
 * is real drift. Nothing here is shown by the app: the app has no landing page,
 * no feature tour, and no reason to describe itself to someone who has already
 * installed it. Putting web-only marketing copy in core would force the mobile
 * bundle to carry strings it can never render, and would put a marketing claim
 * one import away from the ranking function.
 *
 * The product strings the landing page *does* reuse — the TrustScore weight
 * labels, the no-paid-placement pledge, the disclaimer — are read from core,
 * not restated here. Where this file and core disagree, core is right.
 *
 * Same warning as core's i18n: the Malayalam here has not been reviewed by a
 * native speaker. It carries no emergency copy — the red flags stay on /find,
 * in core's strings — so nothing on this page is load-bearing for safety, but
 * it still needs a read before launch.
 */

export type FeatureIcon =
  | "pencil"
  | "siren"
  | "shield"
  | "map"
  | "badge"
  | "languages";

/** One app screen, drawn as a phone mock. Keys map to PhoneMockup renderers. */
export type ScreenId = "ask" | "results" | "profile" | "emergency";

export interface SiteCopy {
  nav: {
    features: string;
    how: string;
    download: string;
    find: string;
    menu: string;
  };

  hero: {
    eyebrow: string;
    titleLead: string;
    titleEmphasis: string;
    sub: string;
    ctaFind: string;
    ctaGet: string;
    /** Three short claims under the buttons. Each is checkable. */
    proof: [string, string, string];
  };

  steps: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { title: string; body: string }[];
  };

  features: {
    eyebrow: string;
    title: string;
    sub: string;
    items: { icon: FeatureIcon; title: string; body: string }[];
  };

  trust: {
    eyebrow: string;
    title: string;
    sub: string;
    weightsCaption: string;
    pledgeTitle: string;
    pledgeBody: string;
    openTitle: string;
    openBody: string;
  };

  screens: {
    eyebrow: string;
    title: string;
    sub: string;
    captions: Record<ScreenId, { label: string; caption: string }>;
  };

  download: {
    eyebrow: string;
    title: string;
    sub: string;
    comingSoon: string;
    getItOn: string;
    playStore: string;
    downloadOn: string;
    appStore: string;
    notifyLabel: string;
    notifyHint: string;
    notifyPlaceholder: string;
    notifyCta: string;
    notifySending: string;
    notifyOk: string;
    notifyDuplicate: string;
    notifyError: string;
    notifyInvalid: string;
    notifyOffline: string;
    mailtoCta: string;
    browserTitle: string;
    browserBody: string;
    browserCta: string;
  };

  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };

  footer: {
    tagline: string;
    product: string;
    project: string;
    findLink: string;
    downloadLink: string;
    howLink: string;
    sourceLink: string;
    statusLink: string;
    area: string;
    sampleNote: string;
  };
}

const en: SiteCopy = {
  nav: {
    features: "What it does",
    how: "How ranking works",
    download: "Get the app",
    find: "Find a doctor",
    menu: "Menu",
  },

  hero: {
    eyebrow: "Starting in Edappal, Kerala",
    titleLead: "The doctor you need,",
    titleEmphasis: "not the one who paid.",
    // "Advertising slots", not the more natural word for them: the integrity
    // check (scripts/check-no-paid-ranking.mjs) bans that word from this
    // codebase outright, prose included, and a marketing line is not a good
    // enough reason to carve a hole in the gate that protects the promise the
    // line is making.
    sub: "Dr Evide asks what is bothering you — in your own words — routes you to the right department, and ranks the doctors near you on credentials we have actually checked. No advertising slots. No boosted profiles. There is nothing to buy.",
    ctaFind: "Find a doctor now",
    ctaGet: "Get the app",
    proof: [
      "No paid placement, enforced in CI",
      "Emergency check runs on your phone",
      "Plain-language search, no forms",
    ],
  },

  steps: {
    eyebrow: "How it works",
    title: "Three steps, in your own words",
    sub: "No specialty list to guess your way through, and no form. Most people do not know whether a rash is Dermatology or General Medicine — that is our job, not yours.",
    items: [
      {
        title: "Say what's wrong",
        body: "Type it the way you'd say it to a friend. “മുടി കൊഴിയുന്നു” and “my hair is falling” both work, and so does anything in between.",
      },
      {
        title: "We find the department",
        body: "Your words are matched to a department, with the reason shown. If it genuinely could be two, we say so and let you choose rather than guessing on your behalf.",
      },
      {
        title: "See who is actually qualified",
        body: "Doctors near you, ranked by TrustScore, with the full breakdown of why each one sits where it does — and how far away they are.",
      },
    ],
  },

  features: {
    eyebrow: "What it does",
    title: "Everything in the app, on this page",
    sub: "The Android and iOS apps and this website run the same routing, the same emergency checks and the same scoring code — literally the same package, not a copy of it. A doctor cannot score one way here and another way on a phone.",
    items: [
      {
        icon: "pencil",
        title: "Describe it in your own words",
        body: "Free-text symptom routing, built for how people actually talk. Write it in plain English; Malayalam, and Malayalam typed in English letters, are understood too — the keyword sets were written by hand, not scraped.",
      },
      {
        icon: "siren",
        title: "Emergency red flags, checked first",
        body: "Chest pain, stroke signs, severe bleeding and self-harm are matched on your own device before anything reaches the network. If a red flag fires you get the right helpline — 108, or Tele-MANAS — and the search stops.",
      },
      {
        icon: "shield",
        title: "TrustScore, and the whole breakdown",
        body: "A 0–100 score from five signals we can verify. Every doctor's page shows what each signal contributed. Nothing in it is editable by the doctor, or by us.",
      },
      {
        icon: "map",
        title: "Distance as a filter, not a rank",
        body: "Set how far you can reasonably travel and see everyone inside it on a map. Being nearer never makes a doctor score higher — Edappal is rural, and the right specialist is often a town away.",
      },
      {
        icon: "badge",
        title: "Credentials checked against the register",
        body: "Qualifications are verified against the NMC registry, and every check records who did it, against what source, and when. A doctor we have not yet reached is shown as not verified, not quietly padded.",
      },
      {
        icon: "languages",
        title: "English first, Malayalam one tap away",
        body: "The site and app read in English by default. A full Malayalam version is one tap away in the top bar, for anyone who is more comfortable in it.",
      },
    ],
  },

  trust: {
    eyebrow: "How ranking works",
    title: "Five signals. Nothing else.",
    sub: "TrustScore is a pure function of a doctor's record. It does not read the clock, the network, or who is paying us — because none of those are arguments it can be given. Change a weight and every affected score changes in a reviewable diff, never quietly.",
    weightsCaption: "The weights below are read live from the scoring package this site runs on.",
    pledgeTitle: "No one can pay to rank higher",
    pledgeBody: "Not for a boost, not for a badge, not for a slot at the top. The business model comes later and it will not be this one.",
    openTitle: "Enforced by the build, not by our word",
    openBody: "A check in continuous integration fails the build if a field that looks like paid placement is ever added to this codebase. A promise anyone can break quietly is not a promise.",
  },

  screens: {
    eyebrow: "The app",
    title: "Four screens, one job",
    sub: "Built for a mid-range Android on a patchy connection, because that is what the launch area runs.",
    captions: {
      ask: {
        label: "Ask",
        caption: "One box. No dropdown of fifty specialties to guess from.",
      },
      results: {
        label: "Results",
        caption: "Ranked by TrustScore, with distance shown but never scored.",
      },
      profile: {
        label: "Profile",
        caption: "The score, opened up — every signal and what it contributed.",
      },
      emergency: {
        label: "Emergency",
        caption: "Full screen, one action, decided on the device before any request goes out.",
      },
    },
  },

  download: {
    eyebrow: "Get the app",
    title: "Not on the stores yet",
    sub: "Dr Evide is in build. The listings below go live once the doctor data has been verified against the NMC registry and reviewed by a lawyer — we are not shipping rankings of real doctors before that.",
    comingSoon: "Coming soon",
    // The badge's own lead line stays the conventional one; the state is
    // carried by the tag on the right, so the badge does not say "coming
    // soon" twice in one 220px row.
    getItOn: "Get it on",
    playStore: "Google Play",
    downloadOn: "Download on the",
    appStore: "App Store",
    notifyLabel: "Tell me when it's out",
    notifyHint: "One email at launch. Nothing else, ever, and you can be removed by replying.",
    notifyPlaceholder: "you@example.com",
    notifyCta: "Notify me",
    notifySending: "Saving…",
    notifyOk: "Saved. You'll hear from us once, at launch.",
    notifyDuplicate: "You're already on the list — nothing more to do.",
    notifyError: "We couldn't save that. Please try again in a moment.",
    notifyInvalid: "That doesn't look like an email address.",
    notifyOffline: "The list isn't set up yet on this deployment — email us instead and we'll add you by hand.",
    mailtoCta: "Email us instead",
    browserTitle: "You don't have to wait",
    browserBody: "Everything the app does, this site does. Same routing, same scores, nothing to install.",
    browserCta: "Use it in your browser",
  },

  faq: {
    eyebrow: "Straight answers",
    title: "The questions worth asking",
    items: [
      {
        q: "Are the doctors listed right now real?",
        a: "No. Every record you can see today is fictional and marked as such in the interface. Real doctors go in only after their credentials are checked against the NMC registry and the check itself is recorded.",
      },
      {
        q: "How will Dr Evide make money?",
        a: "Not decided, and deliberately so. What is decided is the floor: no paid ranking, no advertising placement, no pay-to-appear. Booking fees and clinic tools are on the table; the order of the results is not.",
      },
      {
        q: "What happens to what I type in the symptom box?",
        a: "It is classified in memory and then gone. It is never written to a database, never put in a log, and never put in the URL — a query string would land in browser history on a shared phone and in every access log between you and us.",
      },
      {
        q: "Is this medical advice?",
        a: "No. Dr Evide helps you find a suitable doctor and nothing more. It does not diagnose, and it will tell you to call 108 rather than try when what you describe sounds like an emergency.",
      },
      {
        q: "Why start in Edappal?",
        a: "Because a directory is worth nothing if it is thin. We would rather cover one rural block properly — including the towns people actually travel to — than list a whole country from an unverified scrape. More areas follow as verified doctors do.",
      },
    ],
  },

  footer: {
    tagline: "Find the right doctor near you. Ranked by what can be verified, never by who paid.",
    product: "Product",
    project: "Project",
    findLink: "Find a doctor",
    downloadLink: "Get the app",
    howLink: "How ranking works",
    sourceLink: "What it does",
    statusLink: "Service status",
    area: "Starting in Edappal, Kerala — and Ponnani, Kuttippuram, Valanchery, Tirur.",
    sampleNote: "Currently running on sample data. No doctor shown anywhere on this site is a real person.",
  },
};

const ml: SiteCopy = {
  nav: {
    features: "എന്തു ചെയ്യുന്നു",
    how: "ക്രമീകരണം എങ്ങനെ",
    download: "ആപ്പ് നേടൂ",
    find: "ഡോക്ടറെ കണ്ടെത്തൂ",
    menu: "മെനു",
  },

  hero: {
    eyebrow: "എടപ്പാൾ, കേരളം · ഡോക്ടർ എവിടെ?",
    titleLead: "നിങ്ങൾക്ക് വേണ്ട ഡോക്ടർ,",
    titleEmphasis: "പണം നൽകിയ ആളല്ല.",
    sub: "നിങ്ങളെ അലട്ടുന്നത് എന്താണെന്ന് ഡോ. എവിടെ ചോദിക്കുന്നു — മലയാളത്തിലോ ഇംഗ്ലീഷിലോ. ശരിയായ വിഭാഗത്തിലേക്ക് വഴികാട്ടി, ഞങ്ങൾ നേരിട്ട് പരിശോധിച്ച യോഗ്യതകൾ അടിസ്ഥാനമാക്കി അടുത്തുള്ള ഡോക്ടർമാരെ ക്രമീകരിക്കുന്നു. പരസ്യ സ്ഥാനങ്ങളില്ല. ഉയർത്തിക്കാട്ടിയ പ്രൊഫൈലുകളില്ല. വാങ്ങാൻ ഒന്നുമില്ല.",
    ctaFind: "ഇപ്പോൾ ഡോക്ടറെ കണ്ടെത്തൂ",
    ctaGet: "ആപ്പ് നേടൂ",
    proof: [
      "പണം വാങ്ങി സ്ഥാനം നൽകുന്നില്ല — പരിശോധിച്ചുറപ്പിക്കുന്നു",
      "അടിയന്തര പരിശോധന നിങ്ങളുടെ ഫോണിൽ തന്നെ",
      "മലയാളവും ഇംഗ്ലീഷും",
    ],
  },

  steps: {
    eyebrow: "എങ്ങനെ പ്രവർത്തിക്കുന്നു",
    title: "മൂന്ന് ഘട്ടം, നിങ്ങളുടെ സ്വന്തം വാക്കുകളിൽ",
    sub: "ഊഹിച്ചു കണ്ടെത്താൻ വിഭാഗങ്ങളുടെ പട്ടികയില്ല, ഫോറവുമില്ല. ചൊറിച്ചിൽ ത്വക്ക് വിഭാഗമാണോ ജനറൽ മെഡിസിനാണോ എന്ന് മിക്കവർക്കും അറിയില്ല — അത് ഞങ്ങളുടെ ജോലിയാണ്, നിങ്ങളുടേതല്ല.",
    items: [
      {
        title: "എന്താണ് പ്രശ്നമെന്ന് പറയൂ",
        body: "ഒരു സുഹൃത്തിനോട് പറയുന്നതുപോലെ എഴുതൂ. “മുടി കൊഴിയുന്നു”, “my hair is falling” — രണ്ടും ശരിയാണ്, ഇടയിലുള്ളതും.",
      },
      {
        title: "വിഭാഗം ഞങ്ങൾ കണ്ടെത്തും",
        body: "നിങ്ങളുടെ വാക്കുകൾ ഒരു വിഭാഗവുമായി ചേർക്കുന്നു, കാരണവും കാണിക്കുന്നു. ശരിക്കും രണ്ടാകാമെങ്കിൽ അത് പറയും — നിങ്ങൾക്കുവേണ്ടി ഊഹിക്കില്ല.",
      },
      {
        title: "ശരിക്കും യോഗ്യതയുള്ളവരെ കാണൂ",
        body: "അടുത്തുള്ള ഡോക്ടർമാർ, ട്രസ്റ്റ്‌സ്കോർ പ്രകാരം. ഓരോരുത്തരും ആ സ്ഥാനത്ത് വരാനുള്ള മുഴുവൻ കാരണവും, എത്ര ദൂരമുണ്ടെന്നും കാണാം.",
      },
    ],
  },

  features: {
    eyebrow: "എന്തു ചെയ്യുന്നു",
    title: "ആപ്പിലുള്ളതെല്ലാം, ഈ പേജിൽ",
    sub: "ആൻഡ്രോയ്ഡ്, iOS ആപ്പുകളും ഈ വെബ്‌സൈറ്റും ഒരേ വഴികാട്ടൽ, ഒരേ അടിയന്തര പരിശോധന, ഒരേ സ്കോറിങ് കോഡ് ഉപയോഗിക്കുന്നു — പകർപ്പല്ല, ഒരേ പാക്കേജ് തന്നെ. ഒരു ഡോക്ടർക്ക് ഇവിടെ ഒരു സ്കോറും ഫോണിൽ മറ്റൊന്നും വരാൻ കഴിയില്ല.",
    items: [
      {
        icon: "pencil",
        title: "സ്വന്തം വാക്കുകളിൽ പറയൂ",
        body: "ആളുകൾ ശരിക്കും സംസാരിക്കുന്ന രീതിക്കായി ഉണ്ടാക്കിയ വഴികാട്ടൽ. മലയാളം, ഇംഗ്ലീഷ്, അല്ലെങ്കിൽ ഇംഗ്ലീഷ് അക്ഷരത്തിൽ എഴുതിയ മലയാളം — മൂന്നിന്റെയും വാക്കുകൾ കൈകൊണ്ട് എഴുതിയതാണ്.",
      },
      {
        icon: "siren",
        title: "അടിയന്തര സൂചനകൾ ആദ്യം",
        body: "നെഞ്ചുവേദന, പക്ഷാഘാത ലക്ഷണങ്ങൾ, കടുത്ത രക്തസ്രാവം, സ്വയം ഉപദ്രവം — ഇവ ഇന്റർനെറ്റിലേക്ക് ഒന്നും പോകുന്നതിന് മുൻപ് നിങ്ങളുടെ ഉപകരണത്തിൽ തന്നെ പരിശോധിക്കുന്നു. സൂചന കണ്ടാൽ ശരിയായ നമ്പർ — 108 അല്ലെങ്കിൽ ടെലി-മനസ് — കാണിച്ച് തിരയൽ നിർത്തുന്നു.",
      },
      {
        icon: "shield",
        title: "ട്രസ്റ്റ്‌സ്കോറും അതിന്റെ മുഴുവൻ വിശദാംശവും",
        body: "പരിശോധിക്കാൻ കഴിയുന്ന അഞ്ച് കാര്യങ്ങളിൽ നിന്നുള്ള 0–100 സ്കോർ. ഓരോ ഡോക്ടറുടെ പേജിലും ഓരോ ഘടകവും എത്ര നൽകി എന്ന് കാണാം. ഇതൊന്നും ഡോക്ടർക്കോ ഞങ്ങൾക്കോ മാറ്റാൻ കഴിയില്ല.",
      },
      {
        icon: "map",
        title: "ദൂരം ഒരു അരിപ്പയാണ്, ക്രമമല്ല",
        body: "എത്ര ദൂരം പോകാൻ കഴിയുമെന്ന് നിശ്ചയിക്കൂ, അതിനുള്ളിലുള്ളവരെ ഭൂപടത്തിൽ കാണൂ. അടുത്തായതുകൊണ്ട് ഒരു ഡോക്ടർക്കും സ്കോർ കൂടില്ല — എടപ്പാൾ ഗ്രാമപ്രദേശമാണ്, ശരിയായ വിദഗ്ധൻ പലപ്പോഴും ഒരു പട്ടണം അകലെയാണ്.",
      },
      {
        icon: "badge",
        title: "രജിസ്റ്ററിനോട് ഒത്തുനോക്കിയ യോഗ്യതകൾ",
        body: "യോഗ്യതകൾ NMC രജിസ്ട്രിയുമായി ഒത്തുനോക്കുന്നു. ഓരോ പരിശോധനയിലും ആര്, ഏത് രേഖ വച്ച്, എപ്പോൾ എന്ന് രേഖപ്പെടുത്തുന്നു. ഇതുവരെ പരിശോധിക്കാത്ത ഡോക്ടറെ അങ്ങനെതന്നെ കാണിക്കും.",
      },
      {
        icon: "languages",
        title: "ചോദിച്ച ഭാഷയിൽ തന്നെ ഉത്തരം",
        body: "വെബ്‌സൈറ്റ് മുഴുവൻ മലയാളത്തിൽ വായിക്കാം, തിരയൽ പെട്ടി മാത്രമല്ല. മലയാളത്തിൽ എഴുതാൻ പറഞ്ഞിട്ട് ഇംഗ്ലീഷിൽ മാത്രം മറുപടി നൽകുന്നത് ആ മലയാളം ആർക്കുവേണ്ടിയാണോ അവരെത്തന്നെ കൈവിടലാണ്.",
      },
    ],
  },

  trust: {
    eyebrow: "ക്രമീകരണം എങ്ങനെ",
    title: "അഞ്ച് ഘടകങ്ങൾ. മറ്റൊന്നുമല്ല.",
    sub: "ഒരു ഡോക്ടറുടെ രേഖയിൽ നിന്ന് മാത്രമാണ് ട്രസ്റ്റ്‌സ്കോർ ഉണ്ടാകുന്നത്. സമയമോ ഇന്റർനെറ്റോ ആരാണ് പണം നൽകുന്നതെന്നോ അത് നോക്കുന്നില്ല — അവയൊന്നും അതിന് നൽകാൻ കഴിയുന്ന വിവരങ്ങളല്ല.",
    weightsCaption: "താഴെയുള്ള അളവുകൾ ഈ സൈറ്റ് പ്രവർത്തിക്കുന്ന സ്കോറിങ് പാക്കേജിൽ നിന്ന് നേരിട്ട് എടുത്തതാണ്.",
    pledgeTitle: "പണം നൽകി ആർക്കും മുകളിൽ വരാൻ കഴിയില്ല",
    pledgeBody: "ഉയർത്തലിനല്ല, ബാഡ്ജിനല്ല, മുകളിലെ സ്ഥാനത്തിനുമല്ല. വരുമാന മാർഗം പിന്നീട് വരും, അത് ഇതായിരിക്കില്ല.",
    openTitle: "ഞങ്ങളുടെ വാക്കല്ല, കോഡ് തന്നെ ഉറപ്പാക്കുന്നു",
    openBody: "പണം വാങ്ങിയുള്ള സ്ഥാനം പോലെ തോന്നുന്ന ഒരു ഘടകം കോഡിൽ ചേർത്താൽ യാന്ത്രിക പരിശോധന നിർമ്മാണം തന്നെ പരാജയപ്പെടുത്തും. ആരും അറിയാതെ ലംഘിക്കാവുന്ന വാഗ്ദാനം വാഗ്ദാനമല്ല.",
  },

  screens: {
    eyebrow: "ആപ്പ്",
    title: "നാല് സ്ക്രീൻ, ഒരൊറ്റ ജോലി",
    sub: "ദുർബലമായ ഇന്റർനെറ്റുള്ള സാധാരണ ആൻഡ്രോയ്ഡ് ഫോണിനായി ഉണ്ടാക്കിയത് — തുടക്കപ്രദേശത്ത് ഉള്ളത് അതാണ്.",
    captions: {
      ask: {
        label: "ചോദിക്കൂ",
        caption: "ഒരൊറ്റ പെട്ടി. ഊഹിക്കാൻ അൻപത് വിഭാഗങ്ങളുടെ പട്ടികയില്ല.",
      },
      results: {
        label: "ഫലങ്ങൾ",
        caption: "ട്രസ്റ്റ്‌സ്കോർ പ്രകാരം. ദൂരം കാണിക്കും, പക്ഷേ സ്കോറിൽ വരില്ല.",
      },
      profile: {
        label: "വിവരങ്ങൾ",
        caption: "സ്കോർ തുറന്നുകാട്ടുന്നു — ഓരോ ഘടകവും എത്ര നൽകി എന്നും.",
      },
      emergency: {
        label: "അടിയന്തരം",
        caption: "മുഴുവൻ സ്ക്രീൻ, ഒരൊറ്റ പ്രവൃത്തി, ഉപകരണത്തിൽ തന്നെ തീരുമാനിക്കുന്നു.",
      },
    },
  },

  download: {
    eyebrow: "ആപ്പ് നേടൂ",
    title: "ഇതുവരെ സ്റ്റോറുകളിൽ എത്തിയിട്ടില്ല",
    sub: "ഡോ. എവിടെ ഇപ്പോഴും നിർമ്മാണത്തിലാണ്. ഡോക്ടർമാരുടെ വിവരങ്ങൾ NMC രജിസ്ട്രിയുമായി ഒത്തുനോക്കി, നിയമപരിശോധനയും കഴിഞ്ഞാൽ മാത്രമേ താഴെയുള്ളവ സജീവമാകൂ — അതിന് മുൻപ് യഥാർത്ഥ ഡോക്ടർമാരുടെ ക്രമപ്പട്ടിക ഞങ്ങൾ പുറത്തിറക്കില്ല.",
    comingSoon: "ഉടൻ വരുന്നു",
    getItOn: "ഇവിടെ ലഭ്യമാകും",
    playStore: "Google Play",
    downloadOn: "ഇവിടെ ലഭ്യമാകും",
    appStore: "App Store",
    notifyLabel: "പുറത്തിറങ്ങുമ്പോൾ അറിയിക്കൂ",
    notifyHint: "പുറത്തിറങ്ങുമ്പോൾ ഒരൊറ്റ ഇമെയിൽ. മറ്റൊന്നുമില്ല, ഒരിക്കലും. മറുപടി അയച്ചാൽ പട്ടികയിൽ നിന്ന് ഒഴിവാക്കാം.",
    notifyPlaceholder: "you@example.com",
    notifyCta: "അറിയിക്കൂ",
    notifySending: "സൂക്ഷിക്കുന്നു…",
    notifyOk: "സൂക്ഷിച്ചു. പുറത്തിറങ്ങുമ്പോൾ ഒരിക്കൽ അറിയിക്കാം.",
    notifyDuplicate: "നിങ്ങൾ ഇതിനകം പട്ടികയിലുണ്ട് — ഇനി ഒന്നും ചെയ്യേണ്ടതില്ല.",
    notifyError: "സൂക്ഷിക്കാൻ കഴിഞ്ഞില്ല. അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ.",
    notifyInvalid: "ഇത് ഒരു ഇമെയിൽ വിലാസം പോലെ തോന്നുന്നില്ല.",
    notifyOffline: "ഈ സെർവറിൽ പട്ടിക ഇതുവരെ ഒരുക്കിയിട്ടില്ല — ഞങ്ങൾക്ക് ഇമെയിൽ അയച്ചാൽ നേരിട്ട് ചേർക്കാം.",
    mailtoCta: "പകരം ഇമെയിൽ അയക്കൂ",
    browserTitle: "കാത്തിരിക്കേണ്ടതില്ല",
    browserBody: "ആപ്പ് ചെയ്യുന്നതെല്ലാം ഈ സൈറ്റും ചെയ്യും. ഒരേ വഴികാട്ടൽ, ഒരേ സ്കോർ, ഒന്നും ഇൻസ്റ്റാൾ ചെയ്യേണ്ട.",
    browserCta: "ബ്രൗസറിൽ ഉപയോഗിക്കൂ",
  },

  faq: {
    eyebrow: "നേരായ ഉത്തരങ്ങൾ",
    title: "ചോദിക്കേണ്ട ചോദ്യങ്ങൾ",
    items: [
      {
        q: "ഇപ്പോൾ കാണുന്ന ഡോക്ടർമാർ യഥാർത്ഥമാണോ?",
        a: "അല്ല. ഇന്ന് കാണുന്ന എല്ലാ വിവരങ്ങളും സാങ്കൽപ്പികമാണ്, അത് സ്ക്രീനിൽ തന്നെ പറയുന്നുമുണ്ട്. NMC രജിസ്ട്രിയുമായി യോഗ്യത ഒത്തുനോക്കി, ആ പരിശോധന രേഖപ്പെടുത്തിയ ശേഷം മാത്രമേ യഥാർത്ഥ ഡോക്ടർമാർ ചേരൂ.",
      },
      {
        q: "ഡോ. എവിടെ എങ്ങനെ വരുമാനമുണ്ടാക്കും?",
        a: "ഇതുവരെ തീരുമാനിച്ചിട്ടില്ല, മനഃപൂർവ്വം. തീരുമാനിച്ചത് ഇത്രമാത്രം: പണം വാങ്ങിയുള്ള ക്രമീകരണമില്ല, പരസ്യ സ്ഥാനമില്ല, പണം നൽകി പട്ടികയിൽ വരാൻ കഴിയില്ല. ബുക്കിങ് ഫീസും ക്ലിനിക് സൗകര്യങ്ങളും ആലോചനയിലുണ്ട്; ഫലങ്ങളുടെ ക്രമം അല്ല.",
      },
      {
        q: "ഞാൻ എഴുതുന്ന ലക്ഷണങ്ങൾക്ക് എന്ത് സംഭവിക്കും?",
        a: "അത് മെമ്മറിയിൽ വച്ച് വർഗ്ഗീകരിച്ച ശേഷം ഇല്ലാതാകുന്നു. ഒരു ഡാറ്റാബേസിലും എഴുതുന്നില്ല, ലോഗിൽ വരുന്നില്ല, വിലാസത്തിലും വരുന്നില്ല — വിലാസത്തിൽ വന്നാൽ അത് പങ്കിടുന്ന ഫോണിന്റെ ചരിത്രത്തിലും ഇടയിലുള്ള എല്ലാ സെർവറിന്റെ രേഖയിലും എത്തും.",
      },
      {
        q: "ഇത് വൈദ്യോപദേശമാണോ?",
        a: "അല്ല. അനുയോജ്യനായ ഡോക്ടറെ കണ്ടെത്താൻ മാത്രമാണ് ഡോ. എവിടെ സഹായിക്കുന്നത്. രോഗനിർണയം നടത്തുന്നില്ല. നിങ്ങൾ പറയുന്നത് അടിയന്തരാവസ്ഥ പോലെ തോന്നിയാൽ തിരയാൻ ശ്രമിക്കാതെ 108 വിളിക്കാൻ പറയും.",
      },
      {
        q: "എടപ്പാൾ മാത്രം എന്തുകൊണ്ട്?",
        a: "വിവരങ്ങൾ കുറവാണെങ്കിൽ ഒരു ഡയറക്ടറി കൊണ്ട് പ്രയോജനമില്ല. പരിശോധിക്കാത്ത വിവരങ്ങൾ വച്ച് കേരളത്തിന്റെ പകുതി പട്ടികപ്പെടുത്തുന്നതിനേക്കാൾ നല്ലത് ഒരു ഗ്രാമപ്രദേശം — ആളുകൾ ശരിക്കും പോകുന്ന പട്ടണങ്ങൾ ഉൾപ്പെടെ — നന്നായി ഉൾക്കൊള്ളുന്നതാണ്.",
      },
    ],
  },

  footer: {
    tagline: "നിങ്ങൾക്കടുത്ത് ശരിയായ ഡോക്ടറെ കണ്ടെത്തൂ. പരിശോധിക്കാൻ കഴിയുന്നത് അനുസരിച്ച്, പണം നൽകിയത് അനുസരിച്ചല്ല.",
    product: "ഉൽപ്പന്നം",
    project: "പദ്ധതി",
    findLink: "ഡോക്ടറെ കണ്ടെത്തൂ",
    downloadLink: "ആപ്പ് നേടൂ",
    howLink: "ക്രമീകരണം എങ്ങനെ",
    sourceLink: "എന്തു ചെയ്യുന്നു",
    statusLink: "സേവന നില",
    area: "എടപ്പാൾ, കേരളം — പൊന്നാനി, കുറ്റിപ്പുറം, വളാഞ്ചേരി, തിരൂർ എന്നിവിടങ്ങളും.",
    sampleNote: "ഇപ്പോൾ സാമ്പിൾ വിവരങ്ങളിലാണ് പ്രവർത്തിക്കുന്നത്. ഈ സൈറ്റിൽ കാണുന്ന ഒരു ഡോക്ടറും യഥാർത്ഥ വ്യക്തിയല്ല.",
  },
};

const TABLE: Record<Lang, SiteCopy> = { en, ml };

/** The landing page copy for a language. Unknown values fall back to English. */
export const siteCopy = (lang: Lang): SiteCopy => TABLE[lang] ?? TABLE.en;
