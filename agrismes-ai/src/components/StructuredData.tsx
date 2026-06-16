import { useEffect } from "react";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AgriSMES",
  description: "AgriSMES is an AI-driven agribusiness decision platform offering market intelligence, pre-trade readiness, and scientific analysis for farmers, institutions, and agri-supply chain actors.",
  url: "https://agrismes.com",
  logo: {
    "@type": "ImageObject",
    url: "https://agrismes.com/apple-touch-icon.png",
    width: 512,
    height: 512
  },
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@agrismes.com",
    contactType: "customer service",
    availableLanguage: ["English", "French", "Swahili", "Arabic", "Amharic", "Spanish", "Portuguese"],
  },
  areaServed: [
    { "@type": "Place", name: "Global" },
    { "@type": "Country", name: "Tanzania" },
    { "@type": "Country", name: "Kenya" },
    { "@type": "Country", name: "Ethiopia" },
    { "@type": "Country", name: "Uganda" },
    { "@type": "Country", name: "Ghana" },
    { "@type": "Country", name: "Ivory Coast" },
  ],
  knowsAbout: [
    "AI Agribusiness Platform",
    "Market Intelligence",
    "Pre-Trade Readiness",
    "Agricultural Scientific Analysis",
    "Trade Finance",
    "Agribusiness Financing",
    "SME Development",
    "Export Documentation",
    "Agricultural Commodities",
    "Bank Readiness Assessment",
    "Coffee Sourcing",
    "Coffee Export Tanzania",
    "Arabica Coffee",
    "Robusta Coffee Sourcing",
    "Cashew Import Financing",
    "Cashew Nuts Export",
    "W180 W240 W320 Cashew",
    "Cocoa Export Support",
    "Cocoa Beans",
    "Avocado Export",
    "Hass Avocado Sourcing",
    "Macadamia Nuts Export",
    "Sesame Seeds",
    "Pigeon Pea Export",
    "Cardamom Spices Export",
    "Zanzibar Cloves",
    "Pineapple Export",
    "SME Growth Solutions",
    "Import Financing",
    "Export Trade Readiness",
    "Quality Assurance",
    "Moisture Content Analysis",
    "Trade Compliance",
    "Market Access Pathways",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AgriSMES",
  url: "https://agrismes.com",
  description: "AgriSMES is an AI-driven platform offering market intelligence, pre-trade readiness, and scientific analysis for farmers, institutions, and agri-supply chain actors in the agricultural sector.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://agrismes.com/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  keywords: "AI agribusiness platform, market intelligence, pre-trade readiness, agriculture decision platform, farmers, agri-supply chain actors, agricultural scientific analysis, trade readiness",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is AgriSMES?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgriSMES is an AI-mediated agribusiness decision platform focused on pre-trade readiness, market intelligence, and agricultural scientific analysis for farmers, institutions, and supply chain actors in agribusiness.",
      },
    },
    {
      "@type": "Question",
      name: "Does AgriSMES provide loans or financing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AgriSMES does not provide loans, approve financing, or make credit decisions. All financing decisions are made solely by licensed financial institutions. AgriSMES prepares SMEs to engage banks with structured documentation and trade logic.",
      },
    },
    {
      "@type": "Question",
      name: "What commodities does AgriSMES support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgriSMES supports: Coffee (Arabica and Robusta), Cashew Kernels (W180, W240, W320), Cocoa, Avocado, Macadamia, Sesame, Pigeon Pea, Cardamom, export-grade Spices (Cloves, Pepper), and Pineapple.",
      },
    },
    {
      "@type": "Question",
      name: "How does AgriSMES provide market intelligence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgriSMES provides real-time commodity pricing, market trend analysis, weather impact assessments, and AI-powered insights to help farmers and exporters make informed decisions about when and how to trade.",
      },
    },
    {
      "@type": "Question",
      name: "How does AgriSMES help banks?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgriSMES provides banks with pre-assessed SME pipelines, market-linked trade structures, predictable trade cycles, and reduced onboarding and monitoring burden. There is no on-lending or credit intermediation risk.",
      },
    },
    {
      "@type": "Question",
      name: "What is pre-trade readiness?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pre-trade readiness refers to an SME's preparedness to engage financial institutions with clear trade logic, proper documentation, defined use-of-funds, quality standards, and predictable cash-flow structures that banks typically expect.",
      },
    },
    {
      "@type": "Question",
      name: "How can I access AgriSMES on mobile?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AgriSMES is available as a mobile-responsive web platform and offers dedicated mobile apps for Android and iOS. Download the app for real-time market updates and trade readiness tools on the go.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Agribusiness Decision Platform",
  provider: {
    "@type": "Organization",
    name: "AgriSMES",
  },
  description: "AI-driven platform offering market intelligence, pre-trade readiness, and scientific analysis for farmers, institutions, and agri-supply chain actors.",
  serviceType: "Agricultural Market Intelligence",
  areaServed: [
    { "@type": "Place", name: "Global" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AgriSMES Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Market Intelligence",
          description: "Real-time commodity pricing, market trends, and AI-powered insights for agricultural trade decisions",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Pre-Trade Readiness Assessment",
          description: "AI-enabled assessment of SME readiness, risk profile, and trade capacity for agribusiness financing",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Agricultural Scientific Analysis",
          description: "Quality control, moisture content analysis, and crop health assessment tools for farmers and exporters",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Buyer-Seller Matchmaking",
          description: "Connect verified buyers and sellers across commodity and service categories for agribusiness trade",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Risk Management",
          description: "Trade risk assessment and mitigation strategies for agricultural supply chain actors",
        },
      },
    ],
  },
};

export function StructuredData() {
  useEffect(() => {
    // Remove any existing structured data scripts
    const existingScripts = document.querySelectorAll('script[data-structured-data]');
    existingScripts.forEach(script => script.remove());

    // Add structured data scripts (Organization, Website, FAQ, Service - no Product schemas)
    const schemas = [organizationSchema, websiteSchema, faqSchema, serviceSchema];
    
    schemas.forEach((schema, index) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-structured-data", `schema-${index}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      const scripts = document.querySelectorAll('script[data-structured-data]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  return null;
}

export default StructuredData;
