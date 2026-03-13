"use client";

import React from 'react';

export function JSONLD() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Revallo",
    "url": "https://revallo.com.br",
    "logo": "https://revallo.com.br/favicon.svg",
    "sameAs": [
      "https://instagram.com/revallo",
      "https://twitter.com/revallo"
    ],
    "description": "A maior plataforma de torneios e squads de Free Fire do Brasil."
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Revallo",
    "url": "https://revallo.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://revallo.com.br/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
      />
    </>
  );
}

export function SEO({ title, description, image, type, structuredData, keywords }: any) {
  // O Next.js gerencia as meta tags via o objeto metadata no layout/page.
  // Este componente SEO serve para injetar Scripts JSON-LD específicos de cada página.
  return (
    <>
      {structuredData && (
        <>
          {Array.isArray(structuredData) ? (
            structuredData.map((data, i) => (
              <script
                key={i}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
              />
            ))
          ) : (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
          )}
        </>
      )}
    </>
  );
}

export function getTournamentStructuredData(tournament: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": tournament.title,
    "description": tournament.description,
    "startDate": tournament.start_date,
    "location": {
      "@type": "VirtualLocation",
      "url": `https://revallo.com.br/tournaments/${tournament.id}`
    },
    "image": tournament.banner_url,
    "organizer": {
      "@type": "Organization",
      "name": tournament.organizer?.nickname || "Revallo",
      "url": "https://revallo.com.br"
    }
  };
}

export function getBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
export function getProfileStructuredData(profile: any) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": profile.nickname,
      "description": profile.bio,
      "image": profile.avatar_url,
      "identifier": profile.id
    }
  };
}
