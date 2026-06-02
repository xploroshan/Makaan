# Deploying Dwello — a step-by-step guide for beginners

This guide takes you from zero to a **live website** that anyone on the internet
can visit. No prior DevOps experience needed. Read top to bottom and do each step
in order.

## What we're going to set up

Dwello has three pieces. You'll create a free account for each:

| Piece                    | What it does                                     | Service we'll use                  |
| ------------------------ | ------------------------------------------------ | ---------------------------------- |
| **The website**          | The pages people see + the API                   | **Vercel** (hosts the Next.js app) |
| **The database + login** | Stores listings, users, chats; sends login codes | **Supabase** (Postgres database)   |
| **The AI** (optional)    | Listing-writer + smart search                    | **Anthropic** (Claude API key)     |

> 💡 You can do the whole thing for **₹0 / $0** on the free tiers while testing.
> Costs only start if you get real traffic (see "Costs" at the end).

**Time needed:** about 30–45 minutes the first time.

---

## Before you start — create these free accounts

Open each link, sign up (you can "Sign in with GitHub" everywhere to keep it simple):

1. **GitHub** — https://github.com (the code already lives here: `xploroshan/Makaan`)
2. **Supabase** — https://supabase.com
3. **Vercel** — https://vercel.com
4. **Anthropic** (only if you want the AI features) — https://console.anthropic.com

You do **not** need to install anything on your computer for the basic deploy.
Everything is done in the browser.

---

## Part 1 — Set up the database (Supabase)

### 1.1 Create the project

1. Go to https://supabase.com/dashboard and click **New project**.
2. Fill in:
   - **Name:** `dwello`
   - **Database Password:** click _Generate a password_ and **save it somewhere safe**
     (a notes app is fine). You rarely need it, but don't lose it.
   - **Region:** pick the one closest to your users (e.g. _South Asia (Mumbai)_ for India).
3. Click **Create new project** and wait ~2 minutes while it sets up.

### 1.2 Create the database tables (copy-paste SQL)

The project's database structure lives in 6 files in the code. We'll run them in
order using Supabase's built-in SQL editor.

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar → **New query**.
2. For **each file below, in this exact order**, open the file on GitHub, copy
   _all_ of its contents, paste into the SQL editor, and click **Run** (or press
   Ctrl/Cmd+Enter). Wait for "Success" before moving to the next.

   Run these one at a time, in order:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_storage.sql`
   3. `supabase/migrations/0003_profiles.sql`
   4. `supabase/migrations/0004_connect.sql`
   5. `supabase/migrations/0005_admin.sql`
   6. `supabase/seed/seed.sql` ← this one adds starter cities + listing forms

   > 🔗 Tip: on GitHub, open the file, click the **Raw** button, then select-all
   > and copy — that gives you clean text to paste.

   If a file errors, **stop** and re-check you ran the previous ones first
   (they build on each other). The first file enables the map/location features
   (PostGIS) — that's expected and can take a few extra seconds.

3. To confirm it worked: click **Table Editor** in the sidebar. You should now
   see tables like `users`, `listings`, `enquiries`, `chats`, and more.

### 1.3 Turn on email login

Dwello signs people in with a **one-time code emailed to them** (no passwords).
This works on Supabase with no extra setup:

1. In the sidebar go to **Authentication** → **Sign In / Providers**.
2. Make sure **Email** is **enabled**. That's it.

> Supabase's built-in email works fine for testing (a few emails/hour). For a
> real launch you'll add your own email sender and, optionally, phone-OTP and
> Google/Apple login — but you do **not** need those to go live now.

### 1.4 Copy your Supabase keys (you'll need these in Part 3)

1. In the sidebar go to **Project Settings** (gear icon) → **API**.
2. Keep this tab open. You'll copy three values:
   - **Project URL** — looks like `https://abcdxyz.supabase.co`
   - **anon public** key — a long string under "Project API keys"
   - **service_role** key — another long string (click _Reveal_ to see it)

> ⚠️ The **service_role** key is a master key. Never put it in the frontend,
> never paste it in chat or commit it to GitHub. We'll only give it to Vercel
> as a server-side secret.

---

## Part 2 — Get an AI key (optional but recommended)

Skip this if you don't want the AI features yet — the site works fine without them.

1. Go to https://console.anthropic.com → **API Keys** → **Create Key**.
2. Copy the key (starts with `sk-ant-...`) and save it. You'll add billing later;
   new accounts usually get some free credit to test.

---

## Part 3 — Deploy the website (Vercel)

### 3.1 Import the project

1. Go to https://vercel.com/new.
2. Connect your GitHub account if asked, then find and **Import** the
   `xploroshan/Makaan` repository.
3. Vercel auto-detects it's a Next.js app — leave the build settings as they are.
4. **Important:** in the **Branch** dropdown, pick the branch the app lives on:
   `claude/trusting-rubin-PAPma` (or `main` if it's been merged there).

### 3.2 Add the environment variables (the keys)

Still on the import screen, expand **Environment Variables** and add these one by
one. Copy the values from the Supabase tab (Part 1.4) and your Anthropic key (Part 2):

| Name (copy exactly)             | Value                                                                       |
| ------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | your Supabase **Project URL**                                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase **anon public** key                                           |
| `SUPABASE_SERVICE_ROLE_KEY`     | your Supabase **service_role** key                                          |
| `NEXT_PUBLIC_APP_URL`           | `https://your-project.vercel.app` (you can fix this after the first deploy) |
| `ANTHROPIC_API_KEY`             | your Anthropic key (skip if not using AI)                                   |

> The names must match exactly, including the `NEXT_PUBLIC_` prefix where shown.

### 3.3 Deploy

1. Click **Deploy** and wait 1–3 minutes.
2. When it finishes you'll get a live URL like `https://dwello-xxxx.vercel.app`.
   Click it — you should see the Dwello home page. 🎉
3. **Fix the app URL:** go to Vercel → your project → **Settings** →
   **Environment Variables**, set `NEXT_PUBLIC_APP_URL` to your real
   `https://...vercel.app` address, then **Redeploy** (Deployments tab → ⋯ → Redeploy).

### 3.4 Tell Supabase about your website address

So login redirects work correctly:

1. Back in Supabase → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel URL (e.g. `https://dwello-xxxx.vercel.app`).
3. Under **Redirect URLs**, add `https://dwello-xxxx.vercel.app/**` (with the `/**`).
4. Save.

---

## Part 4 — Make yourself the admin & finish setup

### 4.1 Create your account

1. Visit your live site and click **Sign in** (top right).
2. Enter your email → you'll get a 6-digit code by email → enter it. You're in.

### 4.2 Give your account admin powers

New accounts are regular users. To unlock the admin console, run one small command:

1. Supabase → **SQL Editor** → New query.
2. Paste this, replacing the email with the one you just signed in with:

   ```sql
   update public.users
   set roles = '{seeker,owner,admin}'
   where email = 'you@example.com';
   ```

3. Click **Run**. Then on the website, refresh — an **Admin** link appears in the top bar.

### 4.3 (Optional) Turn on the AI features

If you added the Anthropic key, switch the AI features on from the admin console:

1. On the site, go to **Admin** → **Config & flags**.
2. Find `feature.ai_listing_assist` and `feature.nl_search` and click **Enable**
   on each.
   - _(Or run in Supabase SQL Editor:
     `update app_config set enabled = true where key in ('feature.ai_listing_assist','feature.nl_search');`)_

---

## Part 5 — Check everything works

Do this quick walkthrough on your live site:

1. **List a property:** top bar → _List property_ → fill the wizard → Publish.
   (Try the **✨ Generate with AI** button if you enabled AI.)
2. **Search:** top bar → _Search_. Your listing should appear. Try the
   natural-language box ("2BHK under 30k") if AI is on.
3. **Express interest:** open a listing in a different browser / incognito window,
   sign in as a second user, and click **Express interest** → a chat opens.
4. **Admin:** open **Admin** → you should see live stats and moderation tools.

If all four work, you're fully deployed. 🚀

---

## Updating the site later

You don't redeploy by hand. **Every time new code is pushed to your branch on
GitHub, Vercel automatically rebuilds and updates the live site** within a couple
of minutes. You can watch progress in Vercel → **Deployments**.

If you ever change the database structure (new migration files), run the new
`.sql` file in the Supabase SQL Editor the same way as Part 1.2.

---

## Troubleshooting

| Symptom                                              | Fix                                                                                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Pages load but search says _"Search is unavailable"_ | A Supabase env var is wrong/missing in Vercel. Re-check Part 3.2, then Redeploy.                                                        |
| Login email never arrives                            | Check spam. Supabase's test email has low limits — wait a minute, or set up a custom SMTP sender in Supabase → Authentication → Emails. |
| "Admin access required" after granting admin         | Sign out and back in (the role is read at login).                                                                                       |
| AI buttons say _"not enabled"_                       | Turn on the flags (Part 4.3) **and** make sure `ANTHROPIC_API_KEY` is set in Vercel, then Redeploy.                                     |
| A migration SQL file errors                          | You ran them out of order. Re-run from `0001` upward; each builds on the last.                                                          |
| Build fails on Vercel                                | Open the failed deployment's logs. Most often a missing env var — add it and Redeploy.                                                  |

---

## Costs (so there are no surprises)

- **Supabase Free:** generous — fine for testing and a small launch. Paid plan
  (~$25/mo) when you outgrow it.
- **Vercel Hobby:** free for personal/testing. **Pro (~$20/mo)** is required once
  it's a commercial product or needs a team.
- **Anthropic:** pay-per-use. The listing-writer and smart-search are tiny
  requests — typically fractions of a cent each. You set a spending cap in the
  Anthropic console.

You will not be charged automatically — paid tiers are opt-in.

---

## Going further (when you're ready)

These are **not** needed to launch, but are the natural next steps:

- **Custom domain** (e.g. `dwello.in`): Vercel → Settings → Domains → add your
  domain and follow the DNS instructions. Then update Supabase Site URL + the
  `NEXT_PUBLIC_APP_URL` env var to match.
- **Phone-OTP and Google/Apple login:** add an SMS provider (e.g. Twilio) and
  OAuth credentials in Supabase → Authentication → Providers.
- **Custom email sender** for reliable login emails: Supabase → Authentication →
  Emails → SMTP settings.
- **Local development** (running it on your own computer to make changes): see the
  "Local development" section in the main `README.md`.
