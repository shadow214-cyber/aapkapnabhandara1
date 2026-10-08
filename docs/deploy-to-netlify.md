# Publish with Netlify

This is a Next.js App Router app with API routes. It cannot be published as a static drag-and-drop folder. Connect the Git repository so Netlify can run `npm run build` and use its Next.js adapter.

## 1. Put the project on GitHub

Keep this folder as the repository root. Confirm `.env.local`, `.data/`, `node_modules/`, and `.next/` are not uploaded. `.env.example` is safe to include.

## 2. Create the Netlify site

1. Sign in to [Netlify](https://app.netlify.com) and choose **Add new site > Import an existing project**.
2. Connect GitHub and select this repository.
3. Keep the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** `22`
4. Do not change the publish directory to `out`, `public`, or the project root. Those settings only work for static sites and will break this app.

## 3. Set environment variables

In **Site configuration > Environment variables**, add values for Production (and Deploy Previews if you use them):

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (a unique production password)
- `ADMIN_SESSION_SECRET` (at least 32 random characters)
- Optional: `ADMIN_NAME`, `ADMIN_PHONE`

Leave Resend and WhatsApp keys unset until those providers are ready.

Redeploy after saving variables.

## 4. Open the site

Use the `https://…netlify.app` URL. Sign in at `/sign-in?role=admin`. Menu edits, dish photos, and extra admin accounts persist in Netlify Blobs. Customer profiles and enquiries still stay in each visitor’s browser.

If a custom domain is added later, keep HTTPS enabled so the admin session cookie works.
