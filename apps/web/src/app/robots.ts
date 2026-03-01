import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sinapsemed.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/review",
        "/decks",
        "/planner",
        "/settings",
        "/gaps",
        "/analytics",
        "/hoje",
        "/simulados",
        "/sprints",
        "/onboarding",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
