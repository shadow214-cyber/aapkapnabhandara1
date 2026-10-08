# Backend Plan

The current app has browser-local customer profiles, menu edits, and enquiry tracking. Admin sign-in uses a signed HTTP-only cookie; the primary admin is configured in the environment and secondary admin password hashes are kept in a local server file. Optional Resend and WhatsApp Cloud API adapters send notices only when configured. Customer data and enquiries do not leave the browser, so different devices do not share accounts or inbox records. This is not production authentication or shared storage, and there is no payment processor. The enquiry form limits the selected service area to Delhi and Delhi NCR.

## Suggested structure

```text
src/
  app/
    api/
      menu/route.ts
      enquiries/route.ts
      account/route.ts
      admin/menu/route.ts
      admin/enquiries/route.ts
  lib/server/
    auth.ts
    db.ts
    payments.ts
    notifications.ts
prisma/
  schema.prisma
```

Keep Prisma and credentials in server-only modules. Validate every request on the server, authenticate admin routes, and never trust a price or role supplied by a browser.

## API outline

| Route | Purpose | Access |
| --- | --- | --- |
| `GET /api/menu` | Read active menu items and current quote rates | Public |
| `POST /api/enquiries` | Validate customer, event, selected item IDs, and guest count; create a pending enquiry | Public, rate-limited |
| `GET /api/account/enquiries` | List enquiries belonging to the authenticated customer | Customer session |
| `GET /api/admin/enquiries` | Search and review enquiries | Admin session |
| `PATCH /api/admin/enquiries/:id` | Update enquiry status and internal notes | Admin session |
| `POST /api/admin/menu` | Create or update a menu item and its price | Admin session |
| `POST /api/payments/checkout` | Create a hosted checkout after quote confirmation | Customer session; payment provider TBD |
| `POST /api/webhooks/payment` | Verify provider signature and record payment result | Signed webhook |

## PostgreSQL / Prisma model outline

Recommended core entities:

- `User`: id, name, email (unique), phone, password hash or external auth subject, created/updated timestamps.
- `Admin`: user id, role, active flag, created timestamp. Keep admin access separate from public profile fields.
- `MenuItem`: id, name, description, current rate in minor currency units, active flag, image URL, timestamps.
- `Enquiry`: id, customer id (nullable for guest checkout), contact snapshot, event date, venue, guest count, message, status, consent timestamps, created timestamp.
- `EnquiryItem`: enquiry id, menu item id, item name/rate snapshot, quantity or per-guest amount. Preserve quote snapshots if menu rates change later.
- `Payment`: enquiry id, provider, provider reference, amount, currency, status, verified timestamp. Store no card details.
- `Notification`: enquiry id, channel, recipient, template/version, provider reference, status, attempt count, sent timestamp, error code.

Use integer minor units for money. Put uniqueness constraints on user email and provider payment references; index enquiry status/event date and customer id. Add migrations and seed data only after production prices, terms, and contact details are confirmed.

## Integration gates

1. Confirm final menu, prices, phone/email contacts, event terms, and privacy/retention policy.
2. Choose an authentication method; hash passwords with a suitable password hashing algorithm if credentials are managed directly. Require MFA for admins.
3. Provision PostgreSQL and Prisma migrations; move menu and enquiry data out of browser state.
4. Select a payment provider, complete merchant verification, and verify signed payment webhooks before marking an enquiry paid.
5. Configure email and WhatsApp providers only after sender/domain setup, template approval, and explicit applicable consent. Keep credentials in server environment variables.
6. Add operational tests, audit logging, backups, abuse protection, and a user-facing deletion/contact process.