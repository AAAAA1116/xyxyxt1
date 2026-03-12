const path = require("path");
const fs = require("fs");

/** 从项目根目录显式加载 .env.local，避免服务端读不到 */
function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "NEXT_PUBLIC_SUPABASE_URL" || key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      env[key] = val;
    }
  });
  return env;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: loadEnvLocal(),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
