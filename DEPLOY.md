# 🚀 Deploy MissedIt — total-beginner guide

Follow these in order. Takes ~15 minutes. Everything here is **free**.
By the end you'll have a live link + a public GitHub repo — the two things you submit.

> ⚠️ The #1 rule from the rules slide: **your deployed link must actually work**, or you're
> disqualified even if you're in the Top 10. These steps are ordered to guarantee that.

---

## Part A — Get your free Gemini API key (2 min)

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with your Google account.
3. Click **"Create API key"** → **"Create API key in new project"**.
4. Copy the key (starts with `AIza...`). **Paste it somewhere safe for a minute** — you'll
   need it in Part D. Don't share it or put it in your code.

---

## Part B — Put the code on GitHub (5 min)

### B1. Make a GitHub account (skip if you have one)
Go to **https://github.com** → Sign up.

### B2. Create a new repository
1. Click the **+** (top-right) → **New repository**.
2. **Repository name:** `missedit`
3. Set it to **Public** ✅ (the rules require a public repo).
4. **Do NOT** check "Add a README" (we already have one).
5. Click **Create repository**. Leave this page open — you'll need the commands it shows.

### B3. Upload the code
You have the project folder (`missedit`). Two ways:

**Easiest — drag & drop (no terminal):**
1. On your new empty repo page, click **"uploading an existing file"** (the link in the
   "…or push an existing repository" area, or go to **Add file → Upload files**).
2. Open the `missedit` folder on your computer, select **all files and folders inside it**
   (including the `api`, `test`, `docs` folders), and drag them into the browser.
3. Scroll down, click **Commit changes**.

> Note: the drag-and-drop method may not preserve the multiple commits. That's fine for
> submission. If you want the clean commit history preserved, use the terminal method below.

**Terminal method (keeps the nice commit history):**
```bash
cd path/to/missedit
git remote add origin https://github.com/YOUR_USERNAME/missedit.git
git push -u origin main
```
(Replace `YOUR_USERNAME`. If git asks you to sign in, use the browser prompt / a Personal
Access Token.)

### B4. Confirm
Refresh your GitHub repo page — you should see all the files and the README showing at the
bottom. **This repo link is your "GitHub Repository link" for Requirement 1 & 2.**

---

## Part C — Deploy to Vercel (3 min)

1. Go to **https://vercel.com** → **Sign Up** → choose **"Continue with GitHub"**
   (this links them so deploying is one click).
2. On your Vercel dashboard click **Add New… → Project**.
3. Find **`missedit`** in the list of your GitHub repos → click **Import**.
4. Leave every setting at its default. Framework = "Other" is correct. **Don't click Deploy
   yet** — do Part D first so the key is set on the very first build.

---

## Part D — Add your Gemini key to Vercel (2 min) — don't skip!

Still on the import/configure screen (or later in **Settings → Environment Variables**):

1. Find the **Environment Variables** section.
2. Add one:
   - **Key / Name:** `GEMINI_API_KEY`
   - **Value:** paste the `AIza...` key from Part A
3. Click **Add**, then click **Deploy**.
4. Wait ~1 minute for it to build. You'll get a **🎉 Congratulations** screen with your
   live link, like `https://missedit-xxxx.vercel.app`.

> If you already clicked Deploy before adding the key: add the variable in
> **Settings → Environment Variables**, then go to **Deployments → ⋯ (top one) → Redeploy**.

---

## Part E — Test the live link like an evaluator WILL (3 min)

Open your live Vercel URL and check each thing:

- [ ] Login screen loads.
- [ ] Click **"Fill & sign in"** → you land in the app.
- [ ] Click a sample chip (e.g. **Work group chat**) → text fills in.
- [ ] Click **"✨ Analyze what I missed"** → after a couple seconds you get a summary,
      action items, deadlines, etc. (This confirms the **real Gemini call works live.**)
- [ ] Paste your own messages and analyze → still works.
- [ ] Toggle 🌙 / ☀️ dark mode.
- [ ] Open the link on your **phone** → layout still looks good.

If analysis fails with a key error → the env var isn't set; redo Part D and redeploy.
If it says rate limit → wait 30 seconds and retry (free tier has per-minute limits).

**Do this test from an incognito window too**, so you're seeing exactly what a judge sees.

---

## Part F — Submit (on the hackathon platform)

From the Submission Requirements slides, you need to provide:

1. **GitHub repository link** → your `https://github.com/YOUR_USERNAME/missedit` (public). ✅
2. Repo is **public**. ✅
3. **Deployed project link** → your `https://missedit-xxxx.vercel.app`. ✅
4. **Brief description of the project** → paste this:

   > MissedIt is an AI micro-app that solves the "What Did I Miss?" problem. Paste any
   > overwhelming chat or thread and it returns a prioritized summary — action items (with
   > owners), deadlines, decisions, and every mention of you — so you can catch up in
   > seconds instead of scrolling. It's local-first (your messages aren't stored) and uses
   > Google Gemini for the analysis.

5. **Which Gen AI services were used & where** → paste this:

   > Google Gemini API (gemini-flash-latest). It powers all the analysis in the serverless
   > function `api/analyze.js`: given the conversation, Gemini produces the summary, action
   > items, deadlines, mentions, decisions and priority as structured JSON. No mocked or
   > canned AI responses — every result is a live model call. (I also used Claude to help
   > write and review the code.)

---

## 🎁 Bonus points reminder
There's a **+2 bonus for submitting between 12:30–1:00 PM.** If you're in that window, get
your submission in. And post on LinkedIn with **#Pals #ProtocolX** tagging **@palsXbmsit**
for the social prize.

## 🏁 You're done. Good luck!
