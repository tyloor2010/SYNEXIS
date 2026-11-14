import { createFileRoute } from "@tanstack/react-router";
import { SynexisHome } from "@/components/SynexisHome";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "SYNEXIS — Lunar Landing Site Navigator" },
      {
        name: "description",
        content:
          "SYNEXIS compares lunar landing sites and dates using real JPL Horizons data to assess sunlight and Earth's visibility above the horizon.",
      },
      { property: "og:title", content: "SYNEXIS — Lunar Landing Site Navigator" },
      {
        property: "og:description",
        content:
          "SYNEXIS compares lunar landing sites and dates using real JPL Horizons data to assess sunlight and Earth's visibility above the horizon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:description", content: "SYNEXIS compares lunar landing sites and dates using real JPL Horizons data to assess sunlight and Earth's visibility above the horizon." },
    ],
  }),
  component: SynexisHome,
});
