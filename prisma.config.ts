// prisma.config.ts — Prisma v7 configuration
// See: https://pris.ly/d/config-datasource

import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/p2p_exchange',
  },
});
