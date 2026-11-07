# LaunchLab

LaunchLab is a Hebrew-first studio for turning a business idea into a saved launch workspace: discovery, a business plan, brand directions, a website draft, a financial model, marketing drafts, and a roadmap.

The interface is Hebrew by default, with an English option and full right-to-left layout. Israeli businesses default to shekels. Nothing in the product promises profit, invents market statistics, or claims that a name or logo is trademark-cleared.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account, describe an idea, and the workspace is stored in `data/launchlab.db`.

Production:

```bash
npm run build
npm start
```

Copy `.env.example` to `.env.local` when you add optional services.

## What is verified here

- Account passwords are hashed with scrypt. Sessions are httpOnly cookies.
- Every project read and write checks that the row belongs to the signed-in user.
- Without a language-model key, generation is a preliminary analysis and is labeled as such.
- A number typed in the budget field is an entered input. If that field is empty and the idea names an amount, the model reads it and labels it as an estimate until it is confirmed. If neither is present, the opening amount is a 20,000 shekel default, also labeled as an estimate.
- If a configured model fails, the previous content stays. A failed generation does not become a fake success.
- Financial totals, margin, cash flow, and break-even come from `src/lib/finance.ts`, not from the model.
- Exports are built from saved rows: plan PDF, brand PDF, finance CSV, calendar CSV, website ZIP, and Markdown summary.
- Plan edits can be locked. A refresh will not replace a locked section.
- Sharing is off until the owner creates a read-only link, and the owner can revoke it.

## External services

| Service | Required | What happens when it is missing |
| --- | --- | --- |
| SQLite | No setup | Used automatically at `data/launchlab.db` |
| OpenAI, Anthropic, or AI Gateway | No | Preliminary, labeled analysis |
| `AI_IMAGE_ENABLED=true` plus `OPENAI_API_KEY` | No | Editable logo layouts, no generated images |
| `DEPLOY_HOOK_URL` | No | Publishing stays disabled. ZIP export still works |
| Supabase | No | Schema and row-level security are in `supabase/migrations/001_launchlab.sql`. The running app does not connect until that project is wired |

Set `COOKIE_SECURE=true` when the app is served over HTTPS.

`AI_DAILY_LIMIT` caps model calls per user per day (default 30). Preliminary refreshes have a separate daily cap of 80.

## Supabase

The migration expects Supabase Auth (`auth.users`) and enables row-level security on every table. Owners can access only their rows. Child rows are allowed only when the parent project belongs to `auth.uid()`.

This build does not ship a tested Supabase runtime adapter, because no Supabase project was available. Do not treat the SQL file as proof that cloud sync already works.

## Scripts

- `npm test` — finance math, Hebrew text order, the preliminary workspace, ownership, and a real PDF
- `npm run lint` — Next.js lint
- `npm run build` — production build

## Fonts

PDF export embeds Noto Sans Hebrew (Google, SIL Open Font License). See `assets/fonts/OFL.txt`.
