# CareerSetu Brand System

Unified branding for the CareerSetu platform. Visual theme (CSS tokens, colors, layout) is unchanged — only name, slogan, and logo assets were updated.

## Central configuration

| File | Purpose |
|------|---------|
| `frontend/lib/brand.ts` | `BRAND_NAME`, `BRAND_TAGLINE`, `BRAND_LOGO_PATH`, support email |
| `backend/src/constants/brand.js` | Server-side brand constants for email and PDF |

## Logo asset

- **Primary:** `frontend/public/brand/logo.png`
- **PDF reports:** `backend/assets/logo.png`
- **Component:** `InternAILogo` (all variants use `BRAND_LOGO_PATH`)

## Slogan

**Connecting Skills to Success**

## Reports & email

- PDF headers, watermarks, and footers use CareerSetu branding via `report-pdf.service.js`
- Transactional email uses CareerSetu name, slogan, and logo URL from `email-template.service.js`
