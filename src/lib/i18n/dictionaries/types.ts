/**
 * Shape of the UI-level dictionary used for locale-aware chrome strings.
 *
 * Structural page headings and intros for most pages are CMS-managed (see the
 * `pages` content collection). This dictionary carries the UI chrome: nav,
 * buttons, CTAs, homepage section labels, form labels, and status copy. The
 * full set of locales must be kept in sync with this type.
 */
export interface Dictionary {
  brand: string;

  nav: {
    home: string;
    products: string;
    markets: string;
    supplyChain: string;
    qualityControl: string;
    certifications: string;
    blog: string;
    about: string;
    contact: string;
  };

  cta: {
    requestQuote: string;
    viewProducts: string;
    viewDetails: string;
    viewFullSpecifications: string;
    backToHome: string;
    exploreAllMarkets: string;
  };

  header: {
    toggleMenu: string;
    skipToContent: string;
    scrollToTop: string;
  };

  footer: {
    tagline: string;
    quickLinks: string;
    products: string;
    contact: string;
    email: string;
    phone: string;
    officeHours: string;
    officeHoursValue: string;
    privacy: string;
    terms: string;
    rights: string;
    social: string;
    instagram: string;
    telegram: string;
    whatsapp: string;
  };

  legal: {
    /** Eyebrow shown above legal page titles. */
    eyebrow: string;
    lastUpdated: string;
    relatedHeading: string;
    contactHeading: string;
    contactText: string;
    privacy: string;
    terms: string;
  };

  homepage: {
    productsHeading: string;
    productsIntro: string;
    buyerPrioritiesHeading: string;
    buyerPrioritiesIntro: string;
    certificationsHeading: string;
    certificationsIntro: string;
    qualityHeading: string;
    qualityIntro: string;
    supplyChainHeading: string;
    supplyChainIntro: string;
    marketsHeading: string;
    marketsIntro: string;
    featuredBadge: string;
    primaryMarket: string;
    coldChainLabel: string;
    coldChainSub: string;
    viewProcess: string;
    viewSupplyChain: string;
    statIqf: string;
    statIqfLabel: string;
    statColdChain: string;
    statColdChainLabel: string;
    statGrade: string;
    statGradeLabel: string;
    finalCtaHeading: string;
    finalCtaText: string;
    finalCtaSecondary: string;
  };

  /**
   * Markets page chrome. Country-level copy stays in the `markets` content
   * collection; these are the labels and section headings around it.
   */
  markets: {
    networkEyebrow: string;
    networkCaption: string;
    exportOrigin: string;
    originCountry: string;
    primaryLabel: string;
    targetLabel: string;
    regionLabel: string;
    coverageLabel: string;
    focusHeading: string;
    documentsHeading: string;
    overviewHeading: string;
    destinationsHeading: string;
    destinationsIntro: string;
    workingHeading: string;
    workingIntro: string;
    workingSteps: { title: string; text: string }[];
    newMarketHeading: string;
    newMarketText: string;
    jumpTo: string;
  };

  /** About page section chrome (long-form copy lives in the CMS page body). */
  about: {
    approachHeading: string;
    approachIntro: string;
    chainHeading: string;
    chainIntro: string;
    marketsHeading: string;
    marketsIntro: string;
    documentsHeading: string;
    documentsIntro: string;
    partnershipHeading: string;
    partnershipIntro: string;
    partnershipPoints: { title: string; text: string }[];
  };

  blog: {
    emptyTitle: string;
    emptyText: string;
    emptyCta: string;
    backToBlog: string;
    readMore: string;
    published: string;
    by: string;
  };

  /** Localized, factual descriptions of images used outside CMS records. */
  imageAlt: {
    hero: string;
    aboutOperations: string;
    certificationRecords: string;
    qualityInspection: string;
    qualityPreview: string;
    supplyChainTerminal: string;
    supplyChainColdStorage: string;
    marketsMap: string;
  };

  contact: {
    infoHeading: string;
    infoIntro: string;
    emailLabel: string;
    phoneLabel: string;
    emailValue: string;
    phoneValue: string;
  };

  rfq: {
    heading: string;
    intro: string;
    name: string;
    namePlaceholder: string;
    company: string;
    companyPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    country: string;
    countryPlaceholder: string;
    product: string;
    productPlaceholder: string;
    quantity: string;
    quantityPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    destinationPort: string;
    destinationPortPlaceholder: string;
    packaging: string;
    packagingPlaceholder: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successText: string;
    errorRequired: string;
    errorEmail: string;
    errorQuantity: string;
    errorMessage: string;
    note: string;
    serverError: string;
    rateLimited: string;
    turnstileFailed: string;
  };

  meta: {
    title: string;
    description: string;
  };

  notFound: {
    eyebrow: string;
    title: string;
    message: string;
    home: string;
    secondary: string;
  };

  loading: {
    label: string;
  };

  error: {
    title: string;
    message: string;
    retry: string;
    home: string;
  };
}
