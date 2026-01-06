import { Helmet } from "react-helmet-async";

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

  // Default Organization structured data
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Revallo",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.svg`,
    "description": DEFAULT_DESCRIPTION,
    "sameAs": [
      "https://twitter.com/Revallo"
    ]
  };

  // Handle array or single object structured data
  const renderStructuredData = () => {
    if (!structuredData) {
      return (
        <script type="application/ld+json">
          {JSON.stringify(defaultStructuredData)}
        </script>
      );
    }

    if (Array.isArray(structuredData)) {
      return structuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ));
    }

    return (
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    );
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Revallo" />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Structured Data */}
      {renderStructuredData()}
    </Helmet>
  );
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
      "urlTemplate": typeof window !== "undefined" ? `${window.location.origin}/tournaments?search={search_term_string}` : ""
    },
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Revallo",
    "logo": {
      "@type": "ImageObject",
      "url": typeof window !== "undefined" ? `${window.location.origin}/favicon.svg` : ""
    }
  }
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
    "url": typeof window !== "undefined" ? `${window.location.origin}/tournament/${tournament.id}` : ""
  },
  "image": tournament.banner_url || "/og-image.png",
  "organizer": {
    "@type": "Organization",
    "name": "Revallo",
    "url": typeof window !== "undefined" ? window.location.origin : ""
  },
  "offers": {
    "@type": "Offer",
    "price": tournament.entry_fee,
    "priceCurrency": "BRL",
    "availability": tournament.current_participants < tournament.max_participants 
      ? "https://schema.org/InStock" 
      : "https://schema.org/SoldOut",
    "validFrom": new Date().toISOString()
  },
  "maximumAttendeeCapacity": tournament.max_participants,
  "remainingAttendeeCapacity": tournament.max_participants - tournament.current_participants
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
  "url": typeof window !== "undefined" ? `${window.location.origin}/profile/${profile.id}` : ""
});

// FAQ structured data
export const getFAQStructuredData = (faqs: { question: string; answer: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

// BreadcrumbList structured data
export const getBreadcrumbStructuredData = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

// Default FAQs for home page - helps with rich snippets
export const getDefaultFAQs = () => [
  {
    question: "O que é a Revallo?",
    answer: "A Revallo é uma plataforma brasileira de torneios de eSports onde você pode participar de campeonatos de Free Fire, Valorant e Blood Strike."
  },
  {
    question: "Como me inscrever em um torneio?",
    answer: "Basta criar uma conta gratuita na Revallo, escolher o torneio desejado e clicar em 'Inscrever-se'. Alguns torneios podem exigir taxa de inscrição ou ter requisitos específicos."
  },
  {
    question: "Posso criar meu próprio torneio?",
    answer: "Sim! Qualquer usuário pode se tornar organizador e criar torneios na Revallo. Acesse a área de Organizadores para começar a criar seus campeonatos."
  },
  {
    question: "A Revallo é gratuita?",
    answer: "Sim, criar conta e participar de muitos torneios é totalmente gratuito. Alguns torneios podem ter taxa de inscrição definida pelo organizador."
  },
  {
    question: "Quais jogos estão disponíveis na Revallo?",
    answer: "Atualmente oferecemos torneios de Free Fire, Valorant e Blood Strike. Novos jogos são adicionados regularmente."
  }
];

// Combined structured data for pages with multiple schema types
export const getCombinedStructuredData = (schemas: object[]) => schemas;
