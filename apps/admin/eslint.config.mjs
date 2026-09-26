import next from "eslint-config-next";

const config = [...next, { ignores: [".next/**", "next-env.d.ts"] }];

export default config;
