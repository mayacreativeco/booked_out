#!/usr/bin/env tsx
/**
 * Admin script — creates a new client token and prints the dashboard URL.
 *
 * Usage:
 *   npx tsx scripts/create-client.ts "Client Name"
 *
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN in .env.local.
 * Pull them first: vercel env pull .env.local
 */

// Load .env.local before any KV calls are made
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '../lib/clients';

const name = process.argv[2]?.trim();

if (!name) {
  console.error('Error: client name is required.');
  console.error('Usage: npx tsx scripts/create-client.ts "Client Name"');
  process.exit(1);
}

(async () => {
  const { token, url } = await createClient(name, {});

  console.log('\n✓ Client created successfully\n');
  console.log(`  Name   : ${name}`);
  console.log(`  Token  : ${token}`);
  console.log(`  URL    : ${url}`);
  console.log('\nSend the URL above to your client.\n');
})();
