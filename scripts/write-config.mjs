import { writeFileSync } from "node:fs";

const config = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
  naverMapClientId: process.env.NAVER_MAP_CLIENT_ID ?? "",
  mapCenter: { latitude: 37.5598636, longitude: 126.9187769, zoom: 16 }
};

writeFileSync("public/config.js", `window.SITE_CONFIG = ${JSON.stringify(config)};\n`, "utf8");
