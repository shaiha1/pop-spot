# PopSpot — Israel Launch: Execution Kit

Concrete, ready-to-use assets for the plan outlined earlier. This is meant
to be copy-pasted, not just read — captions, setup steps, and templates you
can act on immediately.

## 1. Google Business Profile (do this first — 15 minutes)

1. Go to [business.google.com](https://business.google.com) → **Manage now**.
2. Business name: **PopSpot**. Category: "Vacation rental agency" (closest
   fit for a rental marketplace; you can add a second category "Event
   venue" or "Wedding venue" later).
3. Area served rather than a physical address (you're a platform, not a
   single location) — choose "I deliver goods and services to my
   customers" and list the cities you operate in (תל אביב, הרצליה, רמת
   השרון, etc. — pull straight from `CITIES` in `src/lib/constants.js`).
4. Website: `https://pop-spot.vercel.app`
5. Verification: Google will likely offer phone/email verification for a
   service-area business (no postcard needed). Use the WhatsApp number
   already on the site (055-9733667) if it accepts a call/SMS.

## 2. Content calendar — first 4 weeks

One post format repeated with different listings keeps production cheap:
**hook → reveal → price → CTA**. Each of the 8 demo listings gives you at
least one post; real host photos will extend this indefinitely.

| Week | Platform | Post | Caption (Hebrew, ready to paste) |
|---|---|---|---|
| 1 | Instagram Reel | Villa+pool reveal | "מחפשים בריכה פרטית ליום שלם? 🏊‍♀️ הצצה למקום שכולם מדברים עליו בהרצליה. החל מ-₪180 לשעה. הקישור בביו 👆 #פופספוט #בריכה_פרטית" |
| 1 | Instagram Story | Poll | "איזה מקום הכי שווה? 🤔" + poll sticker: בריכה 🏊 vs וילה 🏡 |
| 2 | TikTok | POV walkthrough | "POV: מצאת את הסטודיו המושלם ליום הולדת של הבייבי שלך 🎂 סטודיו יוגה בלב תל אביב, ₪150/שעה. #DIY #יום_הולדת #תל_אביב" |
| 2 | Facebook Group post | Local group ("לוח תל אביב") | "היי לכולם 👋 השקנו פלטפורמה להשכרת מקומות לפי שעה — בריכות, אולמות, סטודיו צילום ועוד, בלי התחייבות ליום שלם. מישהו מכיר מקום פנוי שכדאי לפרסם? popspot.co.il [קישור]" — **post only in groups that allow this**, check rules first |
| 3 | Instagram Reel | Event space | "אירוע חברה בלי כאב ראש 💼 לופט תעשייתי בגבעתיים, עד 100 איש. מוזמנים לבדוק זמינות." |
| 3 | TikTok | "מקום השבוע" series launch | Weekly recurring format — pick one listing, 15 sec walkthrough + price overlay |
| 4 | Instagram | Host recruitment | "יש לכם בריכה, גינה או סטודיו שלא מנוצלים כל הזמן? 💰 הפכו אותם להכנסה נוספת. פרסום חינם, אתם קובעים מחיר ושעות." |
| 4 | WhatsApp broadcast (once you have a list) | Weekend push | "🎉 סופ״ש בפתח! 3 מקומות פנויים לאירוע היום — [שמות]. פרטים: popspot.co.il" |

**Repeatable weekly format going forward**: 1 "מקום השבוע" Reel/TikTok +
1 category-specific post + 1 Story poll/engagement piece + opportunistic
Facebook Group posts when new listings match a group's audience.

## 3. Facebook Groups — starter target list

Search Facebook for these group *types* (exact groups/membership rules
change — you'll need to join and check each group's posting rules
yourself, I can't do this on your behalf):

- City-specific marketplace/board groups ("לוח מודעות + city name")
- "אמהות" (mothers) groups per city — strong for birthday/kids-event use case
- Event-planning / "מפיקי אירועים" groups
- Wedding/engagement planning groups (חתונות, אירוסין)
- Photography community groups (for the photo-studio category)

Rule of thumb: lead with value ("we built X, does anyone know a space
worth listing?") not a bare link-drop — groups mute/ban obvious ads fast.

## 4. Ad copy templates (Meta + Google, once ready to spend)

**Meta Ads (Instagram/Facebook feed)**
> מה תרצה להשכיר היום? 🏊 🎉 📸
> בריכות, אולמות, סטודיו לצילום ועוד — לפי שעה, בלי התחייבות.
> [CTA: גלו מקומות בקרבתכם] → popspot.co.il

**Google Search Ad** (pair with the category+city keywords from the SEO plan)
> כותרת 1: השכרת מקומות לפי שעה | כותרת 2: {עיר} — בריכות, אולמות ועוד
> תיאור: מצאו והזמינו מקום מושלם לפי שעה. הזמנה מיידית, מחירים שקופים.

## 5. Referral program (mechanics, revised for off-platform payment)

PopSpot never touches money — guest and host settle payment directly — so
an in-app wallet/credit system doesn't fit (there's nothing to credit
against; no charge ever runs through the app to apply a discount to).
Two approaches that actually work under that model:

**A. Manual cash reward (recommended — zero engineering)**
- You (the operator) pay a referrer directly (Bit/PayBox/bank transfer)
  once you've manually confirmed the referral led to a real booking —
  e.g. ₪25 for a guest referral, ₪50 for a host referral (supply-side
  growth is the real bottleneck early on, so weight it toward hosts).
- Tracking needs only a lightweight addition: a `referred_by` text field
  on `profiles` (holding the referrer's email or a short code), captured
  once at signup via a `?ref=` link. No payout logic in the app at all —
  you look up who-referred-whom in the Supabase Table Editor and pay out
  manually. Say the word if you want the `?ref=` capture wired up; it's a
  small change (one column + reading a query param at signup).

**B. Platform-native reward — no money changes hands**
- Instead of cash, reward a referring host with **featured placement**:
  their listing (or the new host's first listing) shown at the top of
  the home page / relevant category for e.g. 2 weeks. This is something
  the app can actually enforce itself (unlike a cash reward), since
  PopSpot fully controls what's displayed.
- Needs a `featured` boolean + `featured_until` date on `spaces`, plus
  sorting featured listings first on Home/Search. I can implement this
  if you want to run with it — it's a well-scoped, self-contained change.

Either can run alongside the other — manual cash for real referral
tracking, featured placement as a low-cost/no-cash lever you control
entirely from the admin panel.

## 6. What to track weekly

- New listings created (supply growth — the real bottleneck for a new
  two-sided marketplace)
- Search Console: impressions/clicks on listing pages (Performance report)
- Instagram/TikTok: saves + shares (better intent signal than likes for a
  marketplace)
- Bookings created → completed (funnel already in the `bookings` table —
  query `status` distribution in Supabase Table Editor)
