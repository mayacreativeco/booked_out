This is the **Booked Out** client portal — a Next.js app that serves gated product content to clients via unique token URLs.

---

## Client dashboard

Each client gets a private, unguessable URL in the form:

```
https://booked-out.mayacreativeco.com/dashboard/<uuid>
```

No login required. The UUID in the URL is the access token. If it's valid, the client sees the full content. If not, they get a 404.

### Creating a new client

First, make sure your local environment is set up (see below), then run:

```bash
npx tsx scripts/create-client.ts "Client Name"
```

This writes a record to the KV store and prints the full URL to copy and send.

### Local environment setup

1. **Connect a KV store in the Vercel dashboard**
   Go to Storage → Create → KV (or connect an existing Upstash Redis store via the Marketplace) and link it to this project.

   > Note: `@vercel/kv` is deprecated for new stores. If setting up fresh, add an Upstash Redis integration from the Vercel Marketplace (`vercel integration add upstash`) — the env vars are compatible.

2. **Pull env vars locally**

   ```bash
   vercel env pull .env.local
   ```

   This writes `KV_REST_API_URL` and `KV_REST_API_TOKEN` (plus others) to `.env.local`, which the admin script reads automatically. Re-run this command whenever secrets change.

3. **Required env vars** (provided by Vercel after linking storage):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### Content files

The gated HTML pages live in `content/` and are served server-side through Next.js — they are never exposed as static public files. Internal navigation links are rewritten at render time to match the `/dashboard/<token>/…` URL structure.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
