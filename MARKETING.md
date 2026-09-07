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

## 5. Referral program (mechanics, implement when ready)

- ₪25 credit to both sides when a referred guest completes their first
  paid booking.
- ₪50 credit to a host who refers another host whose first listing gets
  its first booking (supply-side growth is the real bottleneck early on).
- Needs a `referral_code` field + a redemption flow — not built yet; say
  the word if you want this implemented (it'd need a `credits` or
  `wallet_balance` column on `profiles`, plus wiring the checkout/payout
  logic to apply it — currently there's no real payment processing at
  all, worth flagging: bookings track prices but no actual charge happens
  anywhere yet).

## 6. What to track weekly

- New listings created (supply growth — the real bottleneck for a new
  two-sided marketplace)
- Search Console: impressions/clicks on listing pages (Performance report)
- Instagram/TikTok: saves + shares (better intent signal than likes for a
  marketplace)
- Bookings created → completed (funnel already in the `bookings` table —
  query `status` distribution in Supabase Table Editor)
