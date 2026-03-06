"use client";

import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
  structuredData?: object | object[];
}

const DEFAULT_TITLE = "Revallo - Plataforma de Torneios de eSports";
const DEFAULT_DESCRIPTION = "Revallo é a plataforma brasileira de torneios de eSports. Participe de campeonatos de Free Fire, Valorant, Blood Strike, COD Warzone e muito mais!";
const DEFAULT_KEYWORDS = "esports, torneios, campeonatos, free fire, valorant, blood strike, cod warzone, gaming, brasil, competição, jogos, gamers";
const DEFAULT_IMAGE = "https://revallo.com.br/og-image-new.png";
const SITE_NAME = "Revallo";
const TWITTER_HANDLE = "@Revallo";
const SITE_URL = "https://revallo.com.br";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const currentUrl = url || (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Revallo",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.svg`,
    "description": DEFAULT_DESCRIPTION,
    "sameAs": ["https://twitter.com/Revallo"],
  };

  const sdToEmit = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [defaultStructuredData];

  useEffect(() => {
    // Title
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Primary
    setMeta("name", "title", fullTitle);
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("name", "author", "Revallo");
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    setLink("canonical", currentUrl);

    // OG
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:url", currentUrl);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", absoluteImage);
    setMeta("property", "og:locale", "pt_BR");

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", TWITTER_HANDLE);
    setMeta("name", "twitter:creator", TWITTER_HANDLE);
    setMeta("name", "twitter:url", currentUrl);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", absoluteImage);

    // Structured Data
    const existingScripts = document.querySelectorAll('script[data-seo="revallo"]');
    existingScripts.forEach((s) => s.remove());

    sdToEmit.forEach((sd) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "revallo");
      script.textContent = JSON.stringify(sd);
      document.head.appendChild(script);
    });
  }, [fullTitle, description, keywords, absoluteImage, currentUrl, type, noIndex]);

  return null;
};

// WebSite structured data for home page
export const getWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Revallo",
  "alternateName": "Revallo eSports",
  "url": typeof window !== "undefined" ? window.location.origin : "",
  "description": DEFAULT_DESCRIPTION,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": typeof window !== "undefined" ? `${window.location.origin}/tournaments?search={search_term_string}` : "",
    },
    "query-input": "required name=search_term_string",
  },
  "publisher": {
    "@type": "Organization",
    "name": "Revallo",
    "logo": {
      "@type": "ImageObject",
      "url": typeof window !== "undefined" ? `${window.location.origin}/favicon.svg` : "",
    },
  },
});

// Tournament Event structured data
export const getTournamentStructuredData = (tournament: {
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  game: string;
  max_participants: number;
  current_participants: number;
  prize_description?: string | null;
  entry_fee: number;
  banner_url?: string | null;
  id: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": tournament.title,
  "description": tournament.description || `Torneio de ${tournament.game} na Revallo`,
  "startDate": tournament.start_date,
  "endDate": tournament.end_date || tournament.start_date,
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
  "location": {
    "@type": "VirtualLocation",
    "url": typeof window !== "undefined" ? `${window.location.origin}/tournament/${tournament.id}` : "",
  },
  "image": tournament.banner_url || "/og-image.png",
  "organizer": {
    "@type": "Organization",
    "name": "Revallo",
    "url": typeof window !== "undefined" ? window.location.origin : "",
  },
  "offers": {
    "@type": "Offer",
    "price": tournament.entry_fee,
    "priceCurrency": "BRL",
    "availability": tournament.current_participants < tournament.max_participants
      ? "https://schema.org/InStock"
      : "https://schema.org/SoldOut",
    "validFrom": new Date().toISOString(),
  },
  "maximumAttendeeCapacity": tournament.max_participants,
  "remainingAttendeeCapacity": tournament.max_participants - tournament.current_participants,
});

// Profile/Person structured data
export const getProfileStructuredData = (profile: {
  nickname: string;
  bio?: string | null;
  avatar_url?: string | null;
  id: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": profile.nickname,
  "description": profile.bio || `Jogador na plataforma Revallo`,
  "image": profile.avatar_url || "/og-image.png",
  "url": typeof window !== "undefined" ? `${window.location.origin}/profile/${profile.id}` : "",
});

// FAQ structured data
export const getFAQStructuredData = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
});

// BreadcrumbList structured data
export const getBreadcrumbStructuredData = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url,
  })),
});

// Default FAQs for home page
export const getDefaultFAQs = () => [
  {
    question: "O que é a Revallo?",
    answer: "A Revallo é uma plataforma brasileira de torneios de eSports onde você pode participar de campeonatos de Free Fire, Valorant e Blood Strike.",
  },
  {
    question: "Como me inscrever em um torneio?",
    answer: "Basta criar uma conta gratuita na Revallo, escolher o torneio desejado e clicar em 'Inscrever-se'. Alguns torneios podem exigir taxa de inscrição ou ter requisitos específicos.",
  },
  {
    question: "Posso criar meu próprio torneio?",
    answer: "Sim! Qualquer usuário pode se tornar organizador e criar torneios na Revallo. Acesse a área de Organizadores para começar a criar seus campeonatos.",
  },
  {
    question: "A Revallo é gratuita?",
    answer: "Sim, criar conta e participar de muitos torneios é totalmente gratuito. Alguns torneios podem ter taxa de inscrição definida pelo organizador.",
  },
  {
    question: "Quais jogos estão disponíveis na Revallo?",
    answer: "Atualmente oferecemos torneios de Free Fire, Valorant e Blood Strike. Novos jogos são adicionados regularmente.",
  },
];

// Combined structured data for pages with multiple schema types
export const getCombinedStructuredData = (schemas: object[]) => schemas;
