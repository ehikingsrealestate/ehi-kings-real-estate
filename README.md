# Ehi-Kings Real Estate and Construction

Official public website and staff workspace for Ehi-Kings Real Estate and Construction.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add the Convex environment values in `.env.local`.

3. Start the app:

   ```bash
   npm run dev
   ```

## Production

- Public website and admin shell deploy to Vercel.
- Staff data, listings, permissions, tasks, chat, site-editor content, AI actions, and Zoho Mail integration run through Convex.
- The admin workspace is Zoho-first. Password login only works for accounts where an administrator explicitly sets a temporary password.
- The local `version 1/` folder contains a snapshot of the previous Vercel production deployment and is intentionally excluded from future deployments.

## Useful Commands

```bash
npm run lint
npm run build
npx convex deploy
npx vercel deploy --prod
```
