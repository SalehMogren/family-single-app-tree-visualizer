// Shared lint config for workspace packages (apps have their own Next.js configs).
import next from "eslint-config-next";

const config = [
  ...next,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  { ignores: ["**/.next/**", "**/node_modules/**", "legacy/**", "apps/**"] },
];

export default config;
