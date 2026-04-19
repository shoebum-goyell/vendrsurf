# VendrSurf

AI-powered hardware procurement platform. Paste an RFQ, get a ranked vendor shortlist, and let the agent cold-call suppliers on your behalf — capturing pricing, lead times, and qualifications automatically.

Built at **Context Con 2026** hackathon.

## What it does

1. **RFQ creation** — fill in a structured form (product, quantity, budget, certifications, etc.) or paste a voice transcript and let Claude extract the fields.
2. **Vendor discovery** — Claude derives search intent from the RFQ; Crust Data company + person search finds ranked, contact-enriched suppliers.
3. **Automated calling** — Vapi voice agent cold-calls each vendor, qualifies them on your spec, and extracts unit price, lead time, MOQ, and NRE via structured AI analysis.
4. **Live dashboard** — tracks each vendor through discovered → calling → qualified → quoted in real time. Call transcript and recording available on the vendor detail screen.

## Stack

- **Frontend**: Next.js 14 (App Router), deployed on Vercel
- **Backend**: FastAPI on Railway — vendor discovery + Vapi call orchestration
- **DB**: Supabase (Postgres + Storage)
- **AI**: Claude (Anthropic) for RFQ parsing + vendor search planning; GPT-4o via Vapi for live call reasoning
- **Voice**: Vapi + ElevenLabs (Sarah voice) + Deepgram Nova-3 transcription

## Live demo

**https://vendrsurf.vercel.app**

## Local dev

```bash
npm install
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
npm run dev
```

## Repos

| Repo | Purpose |
|---|---|
| `vendrsurf` (this) | Next.js frontend |
| `vendrsurf-backend` | FastAPI backend — discovery, calling, webhooks |
