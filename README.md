# Dead Battery

A found-phone mystery thriller for the browser. You found missing 19-year-old Maya Reyes's phone at 23% battery. Find her before it dies.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine, content and playthrough tests
npm run build      # production build to dist/
```

Add `?debug=1` to the URL for the tuning overlay (battery controls, ×10 time, chapter skip).

## Deploy to Vercel

Either push the repo to GitHub and import it at vercel.com/new (Vite is auto-detected), or run:

```bash
npx vercel --prod
```

`vercel.json` already sets the build command, output directory and SPA rewrites. Vercel Analytics events (`chapter_start`, `hint_used`, `ending`, `share_clicked`, `power_bank_found`) start recording once Analytics is enabled on the Vercel project.

## Where things live

- `src/engine/balance.ts`: every tunable number (drain rates, costs, thresholds)
- `src/content/`: all story content as data (messages, triggers, calls, evidence, endings, hints)
- `src/engine/director.ts`: trigger engine, player actions, chapters and endings
- `dead-battery-implementation-plan.md`: full design and implementation plan
