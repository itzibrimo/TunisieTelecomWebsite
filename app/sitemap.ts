import { MetadataRoute } from "next";

const BASE_URL = "https://ttdigital.tn";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE_URL}/offres`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: "never" as const, priority: 0.3 },
    { url: `${BASE_URL}/signup`, lastModified: new Date(), changeFrequency: "never" as const, priority: 0.3 },
    { url: `${BASE_URL}/aide`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${BASE_URL}/support`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  return publicPages;
}
