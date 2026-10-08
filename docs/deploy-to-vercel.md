# Publish with Vercel

This guide publishes the current app as a public preview. Do not use it for real customer bookings until the production-readiness items below are completed.

## Important preview limits

- Customer profiles, menu changes, and enquiries are stored in each visitor's browser. The admin cannot see another visitor's browser-local enquiries.
- Menu edits, dish photos, and secondary admin accounts are written to `.data/menu-items.json`, `.data/menu-images/`, and `.data/admin-users.json` on the app server. Vercel serverless storage is temporary and can be different between instances, so those changes are not durable there.
- The current customer sign-in is a browser demo, not a verified production identity system.
- Email and WhatsApp calls can contact real people once provider keys are configured. Leave notification credentials unset for the preview. WhatsApp requires an approved template and explicit opt-in.

For real operation, first add shared persistent storage (for example PostgreSQL and object storage for images), production customer/admin authentication, persistent menu/request data, abuse protection, and notification delivery logging. Then migrate the menu and admin-user JSON stores to that database.

## 1. Prepare the project

1. Keep `.env.local` on your computer. It is ignored by `.gitignore`; never upload or share it.
2. Configure local admin credentials in the ignored `.env.local` file. Before any public deployment, set a unique production `ADMIN_EMAIL`, strong `ADMIN_PASSWORD`, and new random `ADMIN_SESSION_SECRET` of at least 32 characters. Do not reuse local credentials online.
3. Install [GitHub Desktop](https://desktop.github.com) and sign in to your GitHub account.
4. In GitHub Desktop, choose **File > Add local repository**, select this project folder (`New folder (4)/AapkaApnaBhandara`), then choose **Create a repository** if prompted. Publish it to GitHub as a **Private** repository.
5. Before publishing, confirm `.env.local` and `.data` are not listed among the files to publish. `.env.example` is safe to publish because it contains no credentials.

## 2. Import into Vercel

1. Sign in to [Vercel](https://vercel.com) and choose **Add New > Project**.
2. Connect GitHub if asked, then import the private `AapkaApnaBhandara` repository.
3. Keep the detected Next.js framework and default build settings. Vercel runs the project build automatically.
4. Before deploying, open **Environment Variables** and set:
   - `ADMIN_EMAIL`: `githubdev378@gmail.com`
   - `ADMIN_PASSWORD`: a new, unique strong production password
   - `ADMIN_SESSION_SECRET`: a new random value of at least 32 characters
   - Optional profile fields: `ADMIN_NAME`, `ADMIN_PHONE`
5. Leave `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL`, and all `WHATSAPP_*` values unset until persistent booking storage, sender verification, approved WhatsApp templates, and delivery monitoring are ready.
6. Choose **Deploy**. When it completes, use the Vercel-provided `https://…vercel.app` address to open the public preview.

## 3. Verify the deployment

1. Open the homepage and confirm it loads over HTTPS.
2. Open `/sign-in?role=admin`, sign in with the production admin email/password, and check that the dashboard opens.
3. Check `/admin/menu`, `/admin/requests`, `/admin/customers`, `/admin/notifications`, and `/admin/settings`.
4. Do not submit real customer data: the current preview stores customer requests in the browser, not a shared database.
5. For a custom domain, open the Vercel project **Settings > Domains**, add your domain, and follow the DNS records Vercel displays at your domain registrar. Wait for Vercel to confirm the domain and HTTPS certificate.

## 4. Production launch gate

Before accepting real bookings, replace browser-local records and `.data/admin-users.json` with a shared database, implement production customer authentication, add persistent rate limiting, and verify provider webhooks/delivery. Configure Resend only after verifying the sender domain. Configure WhatsApp only after business verification, template approval, and consent review. Run `npm run lint` and `npm run build` after each deployment change.
