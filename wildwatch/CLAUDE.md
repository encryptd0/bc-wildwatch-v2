# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node app.js` (serves at `http://localhost:3000`)
- `app.js` lives in the `wildwatch/` directory. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/shiva/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/shiva/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` — saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- EJS views in `views/`, all styles in `public/css/style.css` and `public/css/admin.css`
- No CSS frameworks — write custom CSS only
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `public/images/` folder before designing. It may contain logos, color guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- Colour palette is defined in `style.css` `:root` — use those exact values, do not invent new brand colors.

## BC WildWatch Design Tokens (always enforce these)
| Token | Hex | Use |
|---|---|---|
| `--navy` | `#0F2450` | Primary brand, navbar, headings |
| `--navy-mid` | `#1B3A6B` | Hover states, gradients |
| `--sky` | `#3B82F6` | Interactive/link colour |
| `--amber` | `#F59E0B` | CTA buttons, Report action |
| `--emerald` | `#10B981` | Success / Resolved |
| `--rose` | `#EF4444` | Danger / Critical |
| `--orange` | `#F97316` | Medium severity / In Progress |
| `--surface` | `#F8FAFC` | Page background |

### Severity badges
- Low → `bg:#D1FAE5 color:#065F46`
- Medium → `bg:#FEF3C7 color:#92400E`
- High → `bg:#FEE2E2 color:#991B1B`
- Critical → `bg:#EF4444 color:#FFF` + pulse animation

### Status badges
- Pending → `bg:#FEF3C7 color:#92400E`
- Reviewed → `bg:#DBEAFE color:#1E40AF`
- In Progress → `bg:#FFEDD5 color:#9A3412`
- Resolved → `bg:#D1FAE5 color:#065F46`

## Anti-Generic Guardrails
- **Colors:** Never use default framework palette colors. Always use the design tokens above.
- **Shadows:** Never use flat single-layer shadows. Use layered, color-tinted shadows with low opacity.
- **Typography:** Headings use weight 800–900, letter-spacing -0.5px to -1.5px, line-height 1.1–1.2. Body uses weight 400, line-height 1.65.
- **Gradients:** Layer multiple radial gradients for depth. Add decorative blobs/orbs in hero sections.
- **Animations:** Only animate `transform` and `opacity`. Never use `transition: all`. Use `cubic-bezier(0.4, 0, 0.2, 1)` easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions. Minimum tap target 44px.
- **Spacing:** Use intentional, consistent spacing — not random values. Sections need breathing room (`clamp(3rem, 7vw, 5.5rem)`).
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Icon Rules
- Never use emoji characters in any file. Use Font Awesome 6 Free (`<i class="fa-solid fa-...">`) for UI icons and Twemoji 14 PNG CDN (`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/{HEX}.png`) for animal/brand icons.

## Hard Rules
- Do not add sections, features, or content not asked for
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition: all`
- Do not use inline styles — all overrides go in `style.css` using BEM-like class names
- When redesigning: rewrite `style.css` and `admin.css` completely — do not patch incrementally
- Keep the EJS variable contracts intact: `index.ejs` expects `{ feed, stats, dbOffline }`

## Architecture Notes
- Routes: `/home`, `/report`, `/my-reports`, `/admin`, `/chatbot`, `/qr`
- Incidents router mounted at `app.use('/', ...)` — page routes live there alongside `/incidents/*` API routes
- Admin password: `wildwatch2026` (env var `ADMIN_PASSWORD`), checked via `x-admin-password` header or `?password=` query
- MongoDB disconnected state is handled — pages render with empty data, no timeout errors
- Gemini chatbot falls back gracefully when `GEMINI_API_KEY` is not set

## Key Files
| File | Purpose |
|---|---|
| `app.js` | Express setup, middleware, route mounts |
| `models/Incident.js` | Mongoose schema |
| `controllers/incidentController.js` | Home, report, my-reports, feed, stats |
| `controllers/adminController.js` | Admin CRUD, CSV export |
| `controllers/chatbotController.js` | Gemini API integration |
| `public/css/style.css` | ALL styles (~2300 lines) |
| `public/css/admin.css` | Admin table/dashboard overrides |
| `public/js/reports.js` | Form validation, photo preview, toasts |
| `public/js/chatbot.js` | Chat UI logic |
| `seed.js` | Insert 20 realistic sample incidents (`npm run seed`) |
