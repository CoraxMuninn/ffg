import { PUBLIC_EMAIL, PUBLIC_PHONE } from "@/lib/content/contact";
import { statusStrings } from "./status";
import type { Dictionary } from "./types";

export const en: Dictionary = {
  brand: "Feiz Food Group",

  nav: {
    home: "Home",
    products: "Products",
    markets: "Markets",
    supplyChain: "Supply Chain",
    qualityControl: "Quality Control",
    certifications: "Certifications",
    blog: "Blog",
    about: "About Us",
    contact: "Contact Us",
  },

  cta: {
    requestQuote: "Request a Quote",
    viewProducts: "View Products",
    viewDetails: "View Details",
    viewFullSpecifications: "Product Specifications",
    backToHome: "Back to Home",
    exploreAllMarkets: "View Market Requirements",
  },

  header: {
    toggleMenu: "Toggle menu",
    skipToContent: "Skip to content",
    scrollToTop: "Back to top",
    chooseLanguage: "Choose language",
  },

  footer: {
    tagline:
      "Iran-based B2B exporter focused on IQF frozen chicken feet, liver, gizzard, and heart.",
    quickLinks: "Quick Links",
    products: "Products",
    contact: "Contact",
    email: "Email",
    phone: "Phone",
    officeHours: "Office Hours",
    officeHoursValue: "Saturday–Thursday, 09:00–18:00 (GMT+3:30)",
    rights: "All rights reserved.",
    social: "Social media",
    instagram: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
  },

  legal: {
    eyebrow: "Legal",
    lastUpdated: "Last updated",
    relatedHeading: "Related pages",
    contactHeading: "Questions about this page?",
    contactText:
      "If anything here is unclear, or you would like information about an enquiry you have already sent, our export team can help.",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
  },

  homepage: {
    productsHeading: "Frozen Poultry Products",
    productsIntro:
      "IQF frozen poultry products for importers, distributors, and food processors.",
    buyerPrioritiesHeading: "Export Capabilities",
    buyerPrioritiesIntro:
      "The commercial points we address with B2B buyers: specification, inspection, cold chain, packing, and export documents.",
    certificationsHeading: "Export Documents & Standards",
    certificationsIntro: "Document and food-safety standard categories to confirm for the product and destination.",
    qualityHeading: "Quality Control",
    qualityIntro:
      "Review the product, temperature, inspection, and loading checks that can be agreed for an order.",
    supplyChainHeading: "Frozen Poultry Supply Chain",
    supplyChainIntro: "From sourcing and IQF freezing to -18°C storage, reefer loading, and destination delivery.",
    supplyRailLabel: "Supply chain stages — scroll horizontally to see more",
    marketsHeading: "Commercial Market Focus",
    marketsIntro: "Vietnam is the primary market; the UAE, Russia, and Thailand are secondary target markets.",
    featuredBadge: "Our Primary Product",
    primaryMarket: "Primary Market",
    coldChainLabel: "-18°C Cold Chain Maintained Throughout",
    coldChainSub: "From processing facility to destination port",
    viewProcess: "Review Quality Checks",
    viewSupplyChain: "Review the Export Supply Chain",
    statIqf: "IQF",
    statIqfLabel: "Individual Quick Freezing",
    statColdChain: "-18°C",
    statColdChainLabel: "Cold Chain Maintained",
    statGrade: "Grade A/A+",
    statGradeLabel: "Frozen Chicken Feet Quality",
    finalCtaHeading: "Send your frozen poultry requirement",
    finalCtaText:
      "Include the product, quantity, destination port, packing, and document requirements so the enquiry can be assessed accurately.",
    finalCtaSecondary: "View Products",
  },

  markets: {
    networkEyebrow: "Global Export Network",
    networkCaption:
      "Export origin in Iran, with commercial focus on four destination markets.",
    exportOrigin: "Export Origin",
    originCountry: "Iran",
    primaryLabel: "Primary Market",
    targetLabel: "Target Market",
    regionLabel: "Region",
    coverageLabel: "Markets in focus",
    focusHeading: "What buyers evaluate here",
    documentsHeading: "Documents usually in scope",
    overviewHeading: "How we read these markets",
    destinationsHeading: "Destination markets",
    destinationsIntro:
      "Each page focuses on the product specification, packing, cold-chain, and document questions relevant to that destination.",
    workingHeading: "How a first order usually starts",
    workingIntro:
      "A defined requirement keeps the specification, document list, and commercial terms aligned before an order is agreed.",
    workingSteps: [
      {
        title: "Send the requirement",
        text: "Product, quantity, destination port, and any packaging or labelling requirement, through the RFQ form.",
      },
      {
        title: "Specification and documents",
        text: "Confirm grade, glaze range, piece size, packing, and the document set required by the import channel.",
      },
      {
        title: "Sample and approval",
        text: "Where requested, define how a sample will be approved against the written specification before the order proceeds.",
      },
      {
        title: "Loading and shipment",
        text: "Agree the inspection, reefer loading, seal records, and -18°C storage requirements for the proposed shipment.",
      },
    ],
    newMarketHeading: "Importing into another market?",
    newMarketText:
      "These four markets define the current commercial focus. For another destination, send the product and document requirements so feasibility can be checked.",
    jumpTo: "Jump to market",
  },

  about: {
    approachHeading: "Our approach to quality",
    approachIntro:
      "Quality is discussed as named checkpoints rather than a general promise. The applicable checks are agreed for the product and order.",
    chainHeading: "From processing to destination",
    chainIntro:
      "The stages show where control can sit. The documented storage condition after freezing is -18°C.",
    marketsHeading: "Where we export",
    marketsIntro:
      "Vietnam is the primary commercial market. The UAE, Russia, and Thailand are secondary target markets for the frozen poultry range.",
    documentsHeading: "Export documentation",
    documentsIntro:
      "Document categories that may apply to a shipment. Current numbers, issuers, validity, and acceptance must be confirmed for the order.",
    partnershipHeading: "What a long-term partnership looks like",
    partnershipIntro:
      "For repeat orders, a written specification and document list provide a consistent reference for both parties.",
    partnershipPoints: [
      {
        title: "One specification, repeated",
        text: "Grade, glaze range, piece size, and packing should be recorded so later orders can refer to the same agreed requirements.",
      },
      {
        title: "Documents prepared the same way",
        text: "The required document categories should be recorded with the order and checked again when rules or destinations change.",
      },
      {
        title: "Honest scope",
        text: "Volume, specification, destination, and feasibility are reviewed at the enquiry stage before any commercial commitment.",
      },
      {
        title: "One point of contact",
        text: "A complete RFQ keeps product, specification, destination, and document questions together in one enquiry.",
      },
    ],
  },

  blog: {
    emptyTitle: "No articles published yet",
    emptyText:
      "We are preparing practical B2B articles on frozen poultry export. Check back soon, or contact us directly with your questions.",
    emptyCta: "Browse Our Products",
    backToBlog: "Back to Blog",
    readMore: "Read Article",
    published: "Published",
    updated: "Updated",
    by: "By",
    relatedHeading: "Related reading",
  },

  imageAlt: {
    hero: "Cargo ship and container cranes at an international port at dusk",
    aboutOperations: "Workers in protective clothing on a poultry processing line",
    certificationRecords: "Inspection clipboard, temperature logger, and gloves on a stainless steel table",
    qualityInspection: "Gloved inspector checking poultry with a temperature probe",
    qualityPreview: "Quality inspector working on a poultry processing line",
    supplyChainTerminal: "Refrigerated containers lined up at an export terminal",
    supplyChainColdStorage: "Frozen-storage aisle with closed insulated doors",
    marketsMap: "Map showing Iran as the origin and Vietnam, the UAE, Russia, and Thailand as commercial focus markets",
  },

  contact: {
    infoHeading: "Contact the export team",
    infoIntro:
      "Send the product, quantity, destination, packing, and document requirements through the form for review.",
    emailLabel: "Email",
    phoneLabel: "Phone",
    emailValue: PUBLIC_EMAIL,
    phoneValue: PUBLIC_PHONE,
  },

  rfq: {
    heading: "Request a Quote",
    intro:
      "Tell us the product, quantity, destination, packing, and documents you need so the request can be assessed.",
    name: "Full Name",
    namePlaceholder: "Your full name",
    company: "Company Name",
    companyPlaceholder: "Your company",
    email: "Business Email",
    emailPlaceholder: "name@company.com",
    phone: "Phone",
    phonePlaceholder: "Optional — phone number",
    country: "Destination Market",
    countryPlaceholder: "Your country or market",
    product: "Product",
    productPlaceholder: "Select a product",
    quantity: "Quantity",
    quantityPlaceholder: "e.g. 20 MT / 1 × 40' container",
    message: "Message / Additional Requirements",
    messagePlaceholder: "Requirements, destination port, or other details",
    destinationPort: "Destination / Port",
    destinationPortPlaceholder: "Optional — destination port",
    packaging: "Packaging / Specification",
    packagingPlaceholder: "Optional — packaging or specification",
    submit: "Send Request",
    submitting: "Sending…",
    successTitle: "Request sent",
    successText:
      "Thank you. Your quotation request has been sent and our export team will follow up by email.",
    errorRequired: "This field is required.",
    errorEmail: "Enter a valid business email.",
    errorQuantity: "Enter the quantity you need.",
    errorMessage: "Please add a short description of your requirements.",
    errorSummary: "Please review the highlighted fields",
    errorInvalid: "This value is too long or invalid.",
    errorProduct: "Choose a product from the list.",
    note: "Fields marked as required must be completed. All other fields are optional.",
    privacyNote: "See how we handle your enquiry in our",
    privacyLinkText: "Privacy Policy",
    serverError: "We could not send your request. Please try again in a moment.",
    rateLimited: "Too many requests. Please wait before trying again.",
    turnstileFailed: "Security check failed. Please try again.",
    turnstileRequired: "Please complete the security check.",
  },

  meta: {
    title: "Frozen Poultry Exporter from Iran",
    description:
      "Feiz Food Group is an Iran-based B2B exporter of frozen chicken feet, liver, gizzard, and heart in IQF form.",
  },

  notFound: statusStrings.en.notFound,

  loading: statusStrings.en.loading,

  error: statusStrings.en.error,
};
