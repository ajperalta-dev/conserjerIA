import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ConserjerIA",
    short_name: "ConserjerIA",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#0F172A",
    icons: [192, 512].map((n) => ({
      src: "/brand/icon-" + n + ".png",
      sizes: n + "x" + n,
      type: "image/png",
    })),
  };
}
