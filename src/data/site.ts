// Single source of truth for content pulled from ehikings.com and the
// official estate flyer. Honest copy only — no invented metrics or testimonials.

export const COMPANY = {
  name: "Ehi-Kings Real Estate and Construction",
  short: "Ehi-Kings",
  wordmark: "EK",
  philosophy: "Turning dreams into homes, and homes into legacies.",
  tagline: "Invest with us today, and smile tomorrow.",
  mission:
    "To actualize dream houses that may have seemed impossible for our clients — transforming virgin land into modern living communities.",
  vision:
    "To become the biggest real estate and construction company in Africa, guided by the grace of God.",
  experience: "Over two decades of practice across Nigeria.",
  address:
    "Ehi-Kings Real Estate Close, adjacent Jakande ShopRite (Triangle Mall), Lekki-Epe Expressway, Lagos.",
  email: "info@ehikings.com",
  phones: ["+234 810 922 7485", "+234 906 115 4872", "+234 907 376 5081"],
  whatsapp: "+234 810 922 7485",
  whatsappRaw: "2348109227485",
  whatsappUrl: "https://wa.me/2348109227485",
  customerCare: "+234 906 115 4872",
  marketingSales: "+234 907 376 5081",
  contactChannels: [
    {
      department: "WhatsApp Contact",
      number: "+234 810 922 7485",
      href: "https://wa.me/2348109227485",
      description: "Chat directly with a senior agent on WhatsApp",
      type: "whatsapp" as const,
    },
    {
      department: "Customer Care",
      number: "+234 906 115 4872",
      href: "tel:+2349061154872",
      description: "Allocations, client support, documentation inquiries",
      type: "care" as const,
    },
    {
      department: "Marketing & Sales",
      number: "+234 907 376 5081",
      href: "tel:+2349073765081",
      description: "Estate sales, realtor partnerships, and site inspections",
      type: "sales" as const,
    },
  ],
  socials: {
    web: "https://www.ehikings.com",
    instagram: "@ehikingsrealestate",
    facebook: "@ehikingsdevelopment",
  },
};

export const NAV = [
  { label: "About", to: "/about" },
  { label: "Properties", to: "/properties" },
  { label: "Construction", to: "/construction" },
  { label: "Journal", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export const SERVICES = [
  {
    title: "Real Estate Consultancy",
    desc: "Advice for confident property decisions.",
  },
  {
    title: "Land & Property Sale",
    desc: "Documented land and property sales.",
  },
  {
    title: "Building Development",
    desc: "Estate homes and hotel apartments.",
  },
  {
    title: "Architectural Design & Planning",
    desc: "Plans matched to budget, land, and use.",
  },
  {
    title: "Property Management",
    desc: "Support for rentals, upkeep, and oversight.",
  },
  {
    title: "Construction & Renovation",
    desc: "New builds, remodelling, and renovation.",
  },
];

export type PriceTier = { label: string; price: string; note?: string };

export type Estate = {
  slug: string;
  name: string;
  location: string;
  region: string;
  title: string; // legal land title
  size: string;
  price: string; // headline / "from" price
  note?: string; // price unit
  kind: "land" | "home";
  priceTiers?: PriceTier[];
  overview: string[];
  features: string[];
  img?: string; // optional image path; shared media fallback fills gaps
  soldOut?: boolean;
  almostSoldOut?: boolean;
  ambassadors?: string[];
};

export const ESTATES: Estate[] = [
  {
    slug: "grace-apartments-lekki",
    name: "Grace Apartments, Lekki",
    location: "Oke-Ado, Sangotedo, Lekki, Lagos",
    region: "Lekki",
    title: "Governor's Consent",
    size: "Luxury apartment unit",
    price: "From ₦65M",
    note: "₦20M initial deposit · balance over 12 months",
    kind: "home",
    almostSoldOut: true,
    img: "/2026 flyers & designs/Grace Apartments 2026 Flier.jpeg",
    priceTiers: [
      { label: "Per unit", price: "₦65M", note: "₦20M initial deposit · balance spread over 12 months" },
    ],
    overview: [
      "Grace Apartments is a luxury residential development in Oke-Ado, Sangotedo — where luxury meets class.",
      "Modern, high-finish 1-bedroom apartments in a prime Lekki address with constant power supply, internet service, modern finishing, and high ROI. Almost sold out — secure a unit with a ₦20M initial deposit and the balance spread across twelve months.",
    ],
    features: [
      "Prime Sangotedo / Oke-Ado location",
      "Constant 24/7 power supply & internet service",
      "Modern, high-specification finishing & high ROI",
      "₦20M deposit · balance over 12 months",
    ],
  },
  {
    slug: "grace-villa-estate",
    name: "Grace Villa Garden Estate",
    location: "Behind Greenspring School, Awoyaya, Lekki, Lagos",
    region: "Lekki",
    title: "Certificate of Occupancy (C of O)",
    size: "450 SQM",
    price: "₦55M",
    note: "Per plot · Outright payment",
    kind: "land",
    img: "/2026 flyers & designs/Grace Villa Garden Estate, Awoyaya 2026 Flier.png",
    ambassadors: ["Nosa Rex", "Nuella"],
    priceTiers: [
      { label: "450 SQM Plot", price: "₦55M", note: "Full Certificate of Occupancy (C of O)" },
    ],
    overview: [
      "Grace Villa Estate is located directly behind Greenspring School in Awoyaya — one of the most secure title positions Ehi-Kings offers, held on a full Certificate of Occupancy.",
      "At 450 SQM, these plots suit buyers prioritising title strength and a settled, family-oriented address.",
    ],
    features: [
      "Full Certificate of Occupancy (C of O)",
      "450 SQM plots",
      "Behind Greenspring School, Awoyaya",
      "Settled, family-oriented neighbourhood",
    ],
  },
  {
    slug: "grace-life-garden-estate",
    name: "Grace Life Garden Estate",
    location: "Awoyaya, Ibeju-Lekki, Lagos",
    region: "Lekki",
    title: "Registered Court Judgement",
    size: "500 SQM",
    price: "From ₦30M",
    note: "Outright · ₦30.5M on 6-month plan",
    kind: "land",
    img: "/2026 flyers & designs/Grace Life Garden Estate 2026 flier.png",
    ambassadors: ["Nosa Rex", "Nuella Njubigbo"],
    priceTiers: [
      { label: "Outright", price: "₦30M" },
      { label: "6-month plan", price: "₦30.5M" },
    ],
    overview: [
      "Grace Life Garden Estate is set in Awoyaya, an established and well-serviced stretch of the Lekki-Epe corridor with schools, retail, and a growing residential community already in place.",
      "Plots of 500 SQM are held on a registered court judgement title, situated near Greenspring School, Corona School, UBA Supermarket, and Novare Mall.",
    ],
    features: [
      "500 SQM plots on Registered Court Judgement title",
      "Prime Awoyaya neighbourhood",
      "Near Greenspring School, Corona School & Novare Mall",
      "Outright ₦30M · ₦30.5M on 6-month installment",
    ],
  },
  {
    slug: "grace-court-estate-epe",
    name: "Grace Court Estate, Epe",
    location: "Ilara (Opposite St. Augustine University), Epe, Lagos",
    region: "Epe",
    title: "Registered Survey",
    size: "600 SQM",
    price: "From ₦15M",
    note: "Outright ₦15M · ₦15.5M on 6-month plan",
    kind: "land",
    img: "/2026 flyers & designs/Grace Court Estate Epe 2026 Flier.jpg",
    ambassadors: ["Nosa Rex", "Nuella"],
    priceTiers: [
      { label: "Outright", price: "₦15M" },
      { label: "6-month plan", price: "₦15.5M" },
    ],
    overview: [
      "Grace Court Estate sits in Ilara, Epe — directly opposite Saint Augustine University in the emerging higher-education and infrastructural growth belt.",
      "Generous 600 SQM plots on a registered survey offer immediate value and strong long-term appreciation.",
    ],
    features: [
      "600 SQM plots on Registered Survey",
      "Directly opposite Saint Augustine University, Ilara, Epe",
      "Outright ₦15M · ₦15.5M on 6 months plan",
      "Rapidly developing university neighbourhood",
    ],
  },
  {
    slug: "perfect-garden-estate-epe",
    name: "Perfect Garden Estate, Epe",
    location: "Epe, Lagos",
    region: "Epe",
    title: "Registered Survey",
    size: "600 SQM",
    price: "From ₦4.5M",
    note: "30% initial deposit · plans to 6 months",
    kind: "land",
    img: "/2026 flyers & designs/Perfect Garden Estate Epe 2026 Flier.jpg",
    ambassadors: ["Nosa Rex", "Nuella"],
    priceTiers: [
      { label: "Outright", price: "₦4.5M" },
      { label: "3-month plan", price: "₦4.5M" },
      { label: "6-month plan", price: "₦5M", note: "30% initial deposit" },
    ],
    overview: [
      "Perfect Garden Estate, Epe is one of the most accessible 600 SQM entries in the Ehi-Kings portfolio, set in the fast-developing Epe district.",
      "Held on a registered survey with physical allocations ongoing, it is ideal for land banking and self-building ahead of major infrastructure.",
    ],
    features: [
      "Affordable 600 SQM plots",
      "Registered Survey title",
      "Epe growth district",
      "30% initial deposit with plans up to 6 months",
    ],
  },
  {
    slug: "charis-garden-estate",
    name: "Charis Garden Estate",
    location: "Imagbon, Epe – Ijebu Ode",
    region: "Epe",
    title: "Registered Survey",
    size: "300 & 550 SQM",
    price: "From ₦1.7M",
    note: "Outright & installment plans",
    kind: "land",
    img: "/2026 flyers & designs/Charis garden Flier 2026 flier.jpg",
    ambassadors: ["Nosa Rex", "Nuella Njubigbo"],
    priceTiers: [
      { label: "300 SQM — Outright", price: "₦1.7M" },
      { label: "300 SQM — Installment", price: "₦2M", note: "₦500k deposit · balance over 6 months" },
      { label: "550 SQM — Outright", price: "₦3M" },
      { label: "550 SQM — Installment", price: "₦3.5M", note: "₦1M deposit · balance over 6 months" },
    ],
    overview: [
      "Charis Garden Estate sits at Imagbon on the Epe–Ijebu Ode corridor, offering the most accessible registered survey land in the portfolio.",
      "Available in 300 SQM and 550 SQM sizes with outright and six-month flexible installment plans.",
    ],
    features: [
      "300 SQM and 550 SQM plots on Registered Survey",
      "Flexible installment plans with ₦500k initial deposit",
      "Imagbon, Epe – Ijebu Ode axis",
      "Accessible entry point for early land ownership",
    ],
  },
  {
    slug: "perfect-garden-homes-abuja",
    name: "Perfect Garden Homes, Abuja",
    location: "Airport Road, Lugbe, Abuja",
    region: "Abuja",
    title: "Right of Occupancy (R of O)",
    size: "500 SQM & 5-Bed Duplex",
    price: "From ₦25M",
    note: "Land & Luxury Homes",
    kind: "home",
    img: "/2026 flyers & designs/Perfect Garden Homes Abuja 2026 Flier.PNG",
    ambassadors: ["Nosa Rex", "Nuella"],
    priceTiers: [
      { label: "5-Bedroom Fully Detached Duplex (with Penthouse)", price: "₦160M", note: "₦10M initial deposit · spread balance within 1 year" },
      { label: "Serviced Land — 500 SQM", price: "₦25M", note: "Spread balance within 1 year" },
    ],
    overview: [
      "Perfect Garden Homes brings the Ehi-Kings standard to Abuja on Airport Road in Lugbe — moments from Dunamis Church, Shoprite, and the Abuja International Airport.",
      "Secure a finished 5-bedroom luxury duplex with penthouse at ₦160M (₦10M initial deposit) or a 500 SQM serviced plot at ₦25M with payments spread across 1 year.",
    ],
    features: [
      "5-Bed Detached Duplex with Penthouse & 500 SQM plots",
      "Right of Occupancy (R of O) title",
      "Airport Road, Lugbe (near Shoprite & Dunamis Church)",
      "₦10M deposit on duplex · 1-year payment spread",
    ],
  },
  {
    slug: "perfect-garden-estate-benin",
    name: "Perfect Garden Estate, Benin",
    location: "GRA, Benin City, Edo State",
    region: "Benin",
    title: "Governor's Consent",
    size: "440 SQM",
    price: "₦35M",
    note: "Per plot · ₦5M initial deposit",
    kind: "land",
    img: "/2026 flyers & designs/Perfect Garden Homes Benin 2026 Flier.PNG",
    ambassadors: ["Nosa Rex", "Nuella"],
    priceTiers: [
      { label: "Land — 440 SQM (100% dry land)", price: "₦35M", note: "₦5M initial deposit · balance over 3 months" },
    ],
    overview: [
      "Perfect Garden Estate, Benin offers dry land within the prestigious GRA district of Benin City under Governor's Consent title.",
      "Features gated security, serene environment, 24hrs light, and solid infrastructure. Secure 440 SQM with a ₦5M initial deposit and spread balance over 3 months.",
    ],
    features: [
      "Prestigious GRA, Benin City address",
      "Full Governor's Consent title",
      "440 SQM 100% dry, buildable land",
      "Gated estate with 24hrs light & security",
    ],
  },
  {
    slug: "shalom-garden-city-benin",
    name: "Shalom Garden City, Benin",
    location: "Agho-Ozomu, Upper Ekehuan Road / Airport Road, Benin City",
    region: "Benin",
    title: "Registered Survey",
    size: "50×100 ft & 100×100 ft",
    price: "From ₦1.8M",
    note: "Launch & pre-launch pricing",
    kind: "land",
    img: "/2026 flyers & designs/Shallom Garden City Epe 2026 Flier.jpg",
    ambassadors: ["MC Allamano", "Nosa Rex"],
    priceTiers: [
      { label: "100 × 100 ft — Launch price", price: "₦4M" },
      { label: "100 × 100 ft — Pre-launch price", price: "₦3.5M" },
      { label: "50 × 100 ft — Launch price", price: "₦2M" },
      { label: "50 × 100 ft — Pre-launch price", price: "₦1.8M" },
    ],
    overview: [
      "Shalom Garden City is a prime Benin City estate situated along Agho-Ozomu, Upper Ekehuan Road / Airport Road corridor.",
      "Available in 50×100 ft and 100×100 ft sizes at introductory pre-launch and launch pricing — supported by ambassadors MC Allamano and Nosa Rex.",
    ],
    features: [
      "50×100 ft and 100×100 ft plots",
      "Launch & pre-launch pricing from ₦1.8M",
      "Upper Ekehuan Road / Airport Road, Benin City",
      "High growth appreciation corridor",
    ],
  },
  {
    slug: "audacious-hotel-apartments",
    name: "Audacious Hotel Apartments",
    location: "Off Jakande ShopRite, Lekki-Epe Expressway, Lagos",
    region: "Lekki",
    title: "Governor's Consent",
    size: "Serviced apartment",
    price: "From ₦95M",
    note: "Per apartment",
    kind: "home",
    img: "/hero/audacious-final-frame.png",
    overview: [
      "Audacious Hotel Apartments is a serviced, income-ready development on the Lekki-Epe Expressway, moments from Jakande ShopRite (Triangle Mall).",
      "Each apartment is finished to a hospitality standard — built for owner-occupiers who want a turnkey home, or investors seeking short-let rental income in a prime corridor.",
    ],
    features: [
      "Fully serviced, hospitality-grade finish",
      "Prime Lekki-Epe Expressway address",
      "Strong short-let rental potential",
      "Move-in ready",
    ],
  },
  {
    slug: "grace-luxury-homes-phase-2",
    name: "Grace Luxury Homes Phase 2",
    location: "Oko Ado, Sangotedo, Lekki, Lagos",
    region: "Lekki",
    title: "Certificate of Occupancy",
    size: "5-Bedroom duplexes",
    price: "From ₦160M",
    note: "Sold out",
    kind: "home",
    soldOut: true,
    img: "/2026 flyers & designs/Grace Luxury Homes Phase 2 2026 Flier.png",
    ambassadors: ["Nosa Rex"],
    priceTiers: [
      { label: "5-Bedroom Semi-detached Duplex (BQ inclusive)", price: "₦160M" },
      { label: "5-Bedroom Fully-detached Duplex (BQ inclusive)", price: "₦170M" },
    ],
    overview: [
      "Grace Luxury Homes Phase 2 is a sold-out collection of 5-bedroom luxury duplexes with Boys' Quarters in Oko Ado, Sangotedo, Lekki.",
      "Delivered with Certificate of Occupancy, clean water, 24-hour electricity, gated security, and ample parking space.",
    ],
    features: [
      "5-bedroom luxury duplexes, BQ inclusive",
      "Certificate of Occupancy (C of O)",
      "24hrs electricity, clean water, gated security",
      "Sold Out — delivered standard",
    ],
  },
  {
    slug: "open-gate-royal-garden-phase-1",
    name: "Open Gate Royal Garden Phase 1",
    location: "Otorlu-Ilagbo, Ibeju-Lekki, Lagos",
    region: "Ibeju-Lekki",
    title: "Registered Survey (Excision in Process)",
    size: "600 SQM",
    price: "₦4.5M",
    note: "Per plot",
    kind: "land",
    soldOut: true,
    img: "/2026 flyers & designs/open Gate Royal Garden Phase 1 2026 Flier.jpeg",
    ambassadors: ["Nosa Rex", "Nuella Njubigbo"],
    overview: [
      "Open Gate Royal Garden Phase 1 lies along the Otorlu-Ilagbo axis of Ibeju-Lekki, inside Lagos' principal growth corridor — home to the Lekki Free Trade Zone, the Dangote Refinery, and the Lekki deep-sea port.",
      "Each plot spans 600 SQM on a survey plan with excision in process. Now completely sold out.",
    ],
    features: [
      "Generous 600 SQM plots",
      "Registered Survey — excision in process",
      "Otorlu-Ilagbo, Ibeju-Lekki growth corridor",
      "Sold Out — physical allocations completed",
    ],
  },
  {
    slug: "gold-silver-garden",
    name: "Gold & Silver Garden Phase 1",
    location: "Akpakin, Ibeju-Lekki, Lagos",
    region: "Ibeju-Lekki",
    title: "Registered Survey",
    size: "600 SQM",
    price: "₦4M",
    note: "Per plot",
    kind: "land",
    soldOut: true,
    img: "/2026 flyers & designs/Gold & Silver phase 1 2026 Flier.png",
    overview: [
      "Gold & Silver Garden Phase 1 sits in Akpakin, Ibeju-Lekki, Lagos' designated growth corridor and the heart of the Lekki Free Trade Zone economy.",
      "Positioned for both owner-occupiers and investors seeking exposure to one of Nigeria's fastest-appreciating land markets.",
    ],
    features: [
      "Within the Lekki Free Trade Zone catchment",
      "Documented registered survey title",
      "Generous 600 SQM standard plot size",
      "Close to the Dangote Refinery & deep-sea port",
    ],
  },
  {
    slug: "gold-silver-garden-phase-2",
    name: "Gold & Silver Garden Phase 2",
    location: "Akpakin, Ibeju-Lekki, Lagos",
    region: "Ibeju-Lekki",
    title: "Registered Survey (Excision in Process)",
    size: "600 SQM",
    price: "₦4M",
    note: "Per plot",
    kind: "land",
    soldOut: true,
    img: "/2026 flyers & designs/Gold & Silver phase 2 2026 Flier.png",
    overview: [
      "Gold & Silver Garden Phase 2 is located in Akpakin, Ibeju-Lekki, inside the Lekki Free Trade Zone catchment.",
      "600 SQM plots held on a registered survey with excision in process. Now completely sold out.",
    ],
    features: [
      "600 SQM plots",
      "Registered Survey — excision in process",
      "Akpakin, Ibeju-Lekki Free Trade Zone corridor",
      "Sold Out",
    ],
  },
];

export const getEstate = (slug: string): Estate | undefined =>
  ESTATES.find((e) => e.slug === slug);

export const LEADERSHIP = [
  { name: "Dr. Kingsley Ehikioya", role: "Managing Director / CEO", photo: "/team/kingsley-ehikioya.png" },
  { name: "Bethel Ehikioya", role: "Executive Director", photo: "/team/bethel-ehikioya.png" },
  { name: "Jude Obaseki", role: "General Manager", photo: "/team/jude-obaseki.png" },
];

export const VALUES = [
  {
    n: "01",
    title: "Proven experience",
    desc: "Two decades of development, valuation, and consultancy across Nigeria.",
  },
  {
    n: "02",
    title: "Integrity & professionalism",
    desc: "Documented title, transparent process, and counsel you can hold us to.",
  },
  {
    n: "03",
    title: "End-to-end solutions",
    desc: "From virgin land to finished home — one accountable team throughout.",
  },
];

export type JournalPost = {
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  metaDescription: string;
  keywords: string[];
  body: string[];
};

// Journal entries - AI-assisted SEO drafts grounded in Ehi-Kings' real services,
// estates, and buyer questions. No fabricated news, testimonials, or metrics.
export const JOURNAL = [
  {
    slug: "charis-garden-promo",
    date: "June 2026",
    title: "One free plot for every five at Charis Garden",
    category: "Estate guide",
    readingTime: "4 min read",
    excerpt:
      "How the Charis Garden Estate offer works, where the estate sits, and what buyers should confirm before allocation.",
    metaDescription:
      "Learn about Charis Garden Estate, the available plot sizes, the buy-five-get-one offer, and the checks buyers should make before payment.",
    keywords: ["Charis Garden Estate", "Epe land for sale", "Ehi-Kings land", "registered survey"],
    body: [
      "Charis Garden Estate is positioned at Imagbon on the Epe to Ijebu Ode axis, with 300 SQM and 550 SQM plot options listed in the Ehi-Kings portfolio.",
      "The current estate note includes a promotion of one free plot for every five purchased. Buyers should still treat the offer like a normal land purchase: confirm the available allocation, inspect the site, review the registered survey, and understand the payment schedule before committing.",
      "For first-time land buyers, the attraction is not only the entry price. The important questions are whether the land fits the intended use, whether the documentation is clear, whether access roads and neighbouring development support the plan, and whether the buyer can comfortably complete payment.",
      "Ehi-Kings helps buyers move from interest to inspection, then from documentation review to allocation. That process matters more than rushing into a low headline price.",
    ],
  },
  {
    slug: "corper-today-landlord-tomorrow",
    date: "May 2026",
    title: "Corper today, landlord tomorrow",
    category: "Buyer education",
    readingTime: "3 min read",
    excerpt:
      "Why we built flexible payment plans so a serving Corper can hold real, titled land before the service year ends.",
    metaDescription:
      "A practical guide for young buyers using flexible payment plans to start land ownership with Ehi-Kings.",
    keywords: ["flexible land payment", "land banking Nigeria", "young property buyers", "Ehi-Kings"],
    body: [
      "Land ownership does not always begin with a finished building. For many young buyers, the first step is securing a documented plot in a growth corridor and then building when income and timing make sense.",
      "Flexible payment plans are useful when they keep the buyer disciplined instead of pressured. The key is to know the initial deposit, balance timeline, exact plot size, title status, and what happens after payment is completed.",
      "A serving Corper or early-career buyer should focus on clarity. Ask for the estate name, location, title, plot size, payment schedule, and inspection option. Avoid making decisions from a flyer alone.",
      "The Ehi-Kings team can help narrow choices by budget and location so buyers do not waste time inspecting estates that do not fit their plan.",
    ],
  },
  {
    slug: "reading-a-lagos-title",
    date: "April 2026",
    title: "How to read a Lagos land title before you buy",
    category: "Due diligence",
    readingTime: "5 min read",
    excerpt:
      "Excision, gazette, C-of-O, governor's consent — the four words that decide whether your plot is truly yours.",
    metaDescription:
      "Understand common Lagos land title terms including registered survey, C of O, governor's consent, and excision in process.",
    keywords: ["Lagos land title", "C of O", "Governor's Consent", "registered survey", "Ibeju-Lekki land"],
    body: [
      "A land title is not decoration on a flyer. It tells you what legal interest is being sold and what checks still need to happen before you buy.",
      "A registered survey helps identify and describe the land. A Certificate of Occupancy is stronger evidence of government-recognized rights. Governor's Consent is often discussed when an existing title interest is being transferred. Excision in process means the buyer should ask what stage the process has reached and what documents are available now.",
      "The safest habit is to compare the title claim with the estate documents, inspect the actual site, confirm the seller's authority, and understand the payment and allocation terms in writing.",
      "Ehi-Kings lists the title type for each estate so buyers can ask better questions before inspection.",
    ],
  },
  {
    slug: "why-site-inspection-still-matters",
    date: "March 2026",
    title: "Why site inspection still matters",
    category: "Inspection",
    readingTime: "4 min read",
    excerpt:
      "Photos help, but a proper inspection confirms access, neighbourhood context, allocation, and whether the estate fits your plan.",
    metaDescription:
      "A practical checklist for inspecting land and property before buying in Lagos, Epe, Ibeju-Lekki, or Benin City.",
    keywords: ["site inspection", "real estate inspection Nigeria", "Lekki land", "Benin City property"],
    body: [
      "A good photograph can introduce a property, but it cannot replace standing on the site. Inspection shows the road, surrounding development, access, drainage context, distance, and how the estate feels in real life.",
      "Before inspection, write down the purpose of the purchase. A plot for immediate building, land banking, rental housing, or family use may lead to different decisions even at the same price.",
      "During inspection, ask to confirm the estate boundary, available plot sizes, current allocation, title documents, payment timeline, and any development or service charges.",
      "After inspection, compare the property against your budget and timeline. The right property is not only the one that looks attractive. It is the one you understand well enough to own confidently.",
    ],
  },
  {
    slug: "land-home-construction-one-team",
    date: "February 2026",
    title: "Why one accountable team helps",
    category: "Company",
    readingTime: "3 min read",
    excerpt:
      "Ehi-Kings works across land sale, development, construction, valuation, consultancy, and management so buyers are not left alone after payment.",
    metaDescription:
      "How Ehi-Kings combines real estate consultancy, property sale, development, construction, and management for buyers.",
    keywords: ["Ehi-Kings construction", "real estate consultancy Nigeria", "property development Lagos"],
    body: [
      "Buying land is one chapter. Designing, building, managing, or reselling can become the next chapter. That is why Ehi-Kings operates as both a real estate and construction company.",
      "The company's work includes consultancy, land and property sale, building development, architectural design and planning, property management, construction, and renovation.",
      "For clients, the benefit is continuity. The same company that understands the land can also advise on development, construction, and long-term management.",
      "That does not remove the need for due diligence. It simply gives the buyer a clearer path from first contact to the next practical step.",
    ],
  },
] satisfies JournalPost[];

export const getJournalPost = (slug: string): JournalPost | undefined =>
  JOURNAL.find((post) => post.slug === slug);
