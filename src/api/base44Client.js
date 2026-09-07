// Standalone local backend. Replaces the Base44 SDK client with a
// localStorage-backed store that exposes the same `base44.auth.*` /
// `base44.entities.*` / `base44.integrations.*` shape the pages already use,
// so no page or component code needs to change.

const DB_KEY = 'popspot_db_v1';
const USERS_KEY = 'popspot_users_v1';
const SESSION_KEY = 'popspot_session_v1';
const PENDING_KEY = 'popspot_pending_otp_v1';

const uid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2);

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const readDb = () => readJson(DB_KEY, {});
const writeDb = (db) => writeJson(DB_KEY, db);
const readUsers = () => readJson(USERS_KEY, []);
const writeUsers = (u) => writeJson(USERS_KEY, u);
const readPending = () => readJson(PENDING_KEY, {});
const writePending = (p) => writeJson(PENDING_KEY, p);
const getSession = () => readJson(SESSION_KEY, null);
const setSession = (s) => writeJson(SESSION_KEY, s);
const clearSession = () => localStorage.removeItem(SESSION_KEY);

function authError(message, status = 401) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av === bv) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;
    return (av < bv ? -1 : 1) * (desc ? -1 : 1);
  });
}

function makeEntity(name) {
  return {
    async list(sort, limit) {
      const db = readDb();
      let rows = applySort(db[name] || [], sort);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async filter(query = {}, sort, limit) {
      const db = readDb();
      let rows = (db[name] || []).filter((row) =>
        Object.entries(query).every(([k, v]) => row[k] === v)
      );
      rows = applySort(rows, sort);
      if (limit) rows = rows.slice(0, limit);
      return rows;
    },
    async get(id) {
      const db = readDb();
      const row = (db[name] || []).find((r) => r.id === id);
      if (!row) throw authError(`${name} not found`, 404);
      return row;
    },
    async create(data) {
      const db = readDb();
      db[name] = db[name] || [];
      const row = { id: uid(), created_date: new Date().toISOString(), ...data };
      db[name].push(row);
      writeDb(db);
      return row;
    },
    async update(id, data) {
      const db = readDb();
      db[name] = db[name] || [];
      const idx = db[name].findIndex((r) => r.id === id);
      if (idx === -1) throw authError(`${name} not found`, 404);
      db[name][idx] = { ...db[name][idx], ...data };
      writeDb(db);
      return db[name][idx];
    },
    async delete(id) {
      const db = readDb();
      db[name] = (db[name] || []).filter((r) => r.id !== id);
      writeDb(db);
      return { success: true };
    },
  };
}

// User entity reads from the accounts store, never exposing passwords.
const userEntity = {
  async list(sort, limit) {
    let rows = readUsers().map(({ password, ...u }) => u);
    rows = applySort(rows, sort);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  },
  async filter(query = {}, sort, limit) {
    let rows = readUsers()
      .map(({ password, ...u }) => u)
      .filter((row) => Object.entries(query).every(([k, v]) => row[k] === v));
    rows = applySort(rows, sort);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  },
  async get(id) {
    const user = readUsers().find((u) => u.id === id);
    if (!user) throw authError('User not found', 404);
    const { password, ...publicUser } = user;
    return publicUser;
  },
};

async function fileToOptimizedDataUrl(file, maxDim = 1600, quality = 0.82) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function toSafePath(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname + parsed.search;
  } catch {
    return '/';
  }
}

export const base44 = {
  auth: {
    async me() {
      const session = getSession();
      if (!session) throw authError('Not authenticated');
      const user = readUsers().find((u) => u.id === session.userId);
      if (!user) {
        clearSession();
        throw authError('Not authenticated');
      }
      const { password, ...publicUser } = user;
      return publicUser;
    },

    async loginViaEmailPassword(email, password) {
      const user = readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.password !== password) {
        throw authError('אימייל או סיסמה שגויים');
      }
      const token = uid();
      setSession({ userId: user.id, token });
      return { access_token: token };
    },

    loginWithProvider(provider, returnTo) {
      // Demo stand-in for OAuth: instantly sign in as a demo Google user.
      const users = readUsers();
      let user = users.find((u) => u.email === 'demo.google@popspot.app');
      if (!user) {
        user = {
          id: uid(),
          email: 'demo.google@popspot.app',
          password: null,
          full_name: 'משתמש גוגל',
          role: 'user',
          created_date: new Date().toISOString(),
        };
        users.push(user);
        writeUsers(users);
      }
      setSession({ userId: user.id, token: uid() });
      window.location.href = returnTo || '/';
    },

    async register({ email, password }) {
      if (readUsers().some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw authError('כתובת האימייל הזו כבר רשומה', 409);
      }
      const pending = readPending();
      const code = '123456';
      pending[email.toLowerCase()] = { password, code };
      writePending(pending);
      console.info(`[PopSpot demo] Verification code for ${email}: ${code}`);
      return { sent: true };
    },

    async verifyOtp({ email, otpCode }) {
      const pending = readPending();
      const p = pending[email.toLowerCase()];
      if (!p || p.code !== otpCode) throw authError('קוד אימות שגוי', 400);
      const users = readUsers();
      const newUser = {
        id: uid(),
        email,
        password: p.password,
        full_name: email.split('@')[0],
        role: users.length === 0 ? 'admin' : 'user',
        created_date: new Date().toISOString(),
      };
      users.push(newUser);
      writeUsers(users);
      delete pending[email.toLowerCase()];
      writePending(pending);
      const token = uid();
      setSession({ userId: newUser.id, token });
      return { access_token: token };
    },

    async resendOtp(email) {
      const pending = readPending();
      const p = pending[email.toLowerCase()];
      if (!p) throw authError('No pending registration', 404);
      console.info(`[PopSpot demo] Verification code for ${email}: ${p.code}`);
      return { sent: true };
    },

    setToken(token) {
      const session = getSession();
      if (session) setSession({ ...session, token });
    },

    async resetPasswordRequest() {
      // No real email infrastructure in the standalone demo; always resolves.
      return { sent: true };
    },

    async resetPassword() {
      throw authError('איפוס סיסמה בדוא"ל אינו זמין בגרסת הדמו המקומית', 400);
    },

    logout(redirectTo) {
      clearSession();
      if (typeof redirectTo === 'string' && redirectTo) {
        window.location.href = toSafePath(redirectTo);
      }
    },

    redirectToLogin(returnUrl) {
      const path = toSafePath(returnUrl || '/');
      window.location.href = '/login?returnTo=' + encodeURIComponent(path);
    },

    isAuthenticated() {
      return !!getSession();
    },
  },

  entities: {
    Space: makeEntity('Space'),
    Booking: makeEntity('Booking'),
    Favorite: makeEntity('Favorite'),
    Review: makeEntity('Review'),
    Message: makeEntity('Message'),
    User: userEntity,
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = await fileToOptimizedDataUrl(file);
        return { file_url };
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Demo data seed — runs once so the app has content on first load.
// ---------------------------------------------------------------------------
function seedIfEmpty() {
  if (readUsers().length > 0) return;

  const now = Date.now();
  const daysAgo = (n) => new Date(now - n * 86400000).toISOString();

  const admin = { id: uid(), email: 'admin@popspot.co.il', password: 'password123', full_name: 'מנהל המערכת', role: 'admin', created_date: daysAgo(90) };
  const host = { id: uid(), email: 'host@popspot.co.il', password: 'password123', full_name: 'נועה כהן', role: 'user', created_date: daysAgo(60) };
  const guest = { id: uid(), email: 'guest@popspot.co.il', password: 'password123', full_name: 'איתי לוי', role: 'user', created_date: daysAgo(45) };
  writeUsers([admin, host, guest]);

  const img = (id) => `https://images.unsplash.com/${id}?q=80&w=1200&auto=format&fit=crop`;

  const spaces = [
    {
      id: uid(), title: 'וילה פרטית עם בריכה בהרצליה', slug: 'villa-pool-herzliya',
      description: 'וילה מרשימה עם בריכה מחוממת, גינה גדולה ומטבח מאובזר. אידיאלי לנופש משפחתי, אירועים קטנים וימי כיף בבריכה.',
      category: 'villa', space_type: 'villa', city: 'הרצליה', address: 'רחוב הבנים 12',
      latitude: 32.1624, longitude: 34.8447, max_guests: 20, status: 'active', instant_booking: true,
      images: [img('photo-1600585154340-be6161a56a0c'), img('photo-1613977257363-707ba9348227')],
      amenities: ['heated_pool', 'kitchen', 'wifi', 'parking', 'bbq', 'air_conditioning'],
      activities: ['vacation', 'daytime_use', 'family_event', 'photography'],
      activity_pricing: [
        { activity: 'daytime_use', hourly_price: 180, pricing_unit: 'hour', min_hours: 3, max_guests: 20 },
        { activity: 'family_event', hourly_price: 220, pricing_unit: 'hour', min_hours: 4, max_guests: 20 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '08:00', end_time: '22:00', enabled: true },
        { day: 'monday', start_time: '08:00', end_time: '22:00', enabled: true },
        { day: 'tuesday', start_time: '08:00', end_time: '22:00', enabled: true },
        { day: 'wednesday', start_time: '08:00', end_time: '22:00', enabled: true },
        { day: 'thursday', start_time: '08:00', end_time: '22:00', enabled: true },
        { day: 'friday', start_time: '08:00', end_time: '16:00', enabled: true },
        { day: 'saturday', start_time: '09:00', end_time: '23:00', enabled: true },
      ],
      rules: 'ללא נעליים בבית, שקט לאחר 22:00, איסור עישון בפנים.',
      cancellation_policy: 'moderate', min_booking_hours: 3,
      host_id: host.id, host_name: host.full_name, avg_rating: 4.8, review_count: 2, starting_price: 180,
      created_date: daysAgo(40),
    },
    {
      id: uid(), title: 'בריכת שחייה חצי אולימפית ברמת השרון', slug: 'pool-ramat-hasharon',
      description: 'בריכת שחייה מקצועית עם 6 מסלולים, מתאימה לשיעורי שחייה ואימונים פרטיים.',
      category: 'pool', space_type: 'pool', city: 'רמת השרון', address: 'שדרות הדר 4',
      latitude: 32.1467, longitude: 34.8394, max_guests: 15, status: 'active', instant_booking: false,
      images: [img('photo-1560089000-7433a4ebbd64'), img('photo-1576013551627-0cc20b96c2a7')],
      amenities: ['shower', 'bathroom', 'changing_room', 'parking'],
      activities: ['swimming_lessons', 'pool'],
      activity_pricing: [
        { activity: 'swimming_lessons', hourly_price: 120, pricing_unit: 'hour', min_hours: 1, max_guests: 6 },
        { activity: 'pool', hourly_price: 90, pricing_unit: 'hour', min_hours: 2, max_guests: 15 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '06:00', end_time: '21:00', enabled: true },
        { day: 'monday', start_time: '06:00', end_time: '21:00', enabled: true },
        { day: 'tuesday', start_time: '06:00', end_time: '21:00', enabled: true },
        { day: 'wednesday', start_time: '06:00', end_time: '21:00', enabled: true },
        { day: 'thursday', start_time: '06:00', end_time: '21:00', enabled: true },
        { day: 'friday', start_time: '06:00', end_time: '15:00', enabled: true },
        { day: 'saturday', start_time: '08:00', end_time: '18:00', enabled: true },
      ],
      rules: 'חובה מגבת אישית, ילדים מתחת לגיל 10 בהשגחת מבוגר.',
      cancellation_policy: 'flexible', min_booking_hours: 1,
      host_id: host.id, host_name: host.full_name, avg_rating: 5, review_count: 1, starting_price: 90,
      created_date: daysAgo(35),
    },
    {
      id: uid(), title: 'סטודיו יוגה ופילאטיס בתל אביב', slug: 'studio-yoga-tlv',
      description: 'סטודיו מעוצב עם רצפת עץ, מראות קיר לקיר, מזרנים וציוד פילאטיס. אור טבעי מלא.',
      category: 'training_studio', space_type: 'studio', city: 'תל אביב', address: 'רחוב דיזנגוף 99',
      latitude: 32.0809, longitude: 34.7746, max_guests: 25, status: 'active', instant_booking: true,
      images: [img('photo-1518611012118-696072aa579a'), img('photo-1571902943202-507ec2618e8f')],
      amenities: ['mirrors', 'mats', 'sound_system', 'air_conditioning', 'changing_room'],
      activities: ['yoga', 'pilates', 'dance', 'personal_training', 'meditation'],
      activity_pricing: [
        { activity: 'yoga', hourly_price: 150, pricing_unit: 'hour', min_hours: 1, max_guests: 20 },
        { activity: 'pilates', hourly_price: 150, pricing_unit: 'hour', min_hours: 1, max_guests: 15 },
        { activity: 'personal_training', hourly_price: 100, pricing_unit: 'hour', min_hours: 1, max_guests: 4 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '07:00', end_time: '22:00', enabled: true },
        { day: 'monday', start_time: '07:00', end_time: '22:00', enabled: true },
        { day: 'tuesday', start_time: '07:00', end_time: '22:00', enabled: true },
        { day: 'wednesday', start_time: '07:00', end_time: '22:00', enabled: true },
        { day: 'thursday', start_time: '07:00', end_time: '22:00', enabled: true },
        { day: 'friday', start_time: '07:00', end_time: '16:00', enabled: true },
        { day: 'saturday', start_time: '09:00', end_time: '20:00', enabled: false },
      ],
      rules: 'נעליים אסורות על רצפת הסטודיו, יש להשאיר את המקום נקי.',
      cancellation_policy: 'strict', min_booking_hours: 1,
      host_id: host.id, host_name: host.full_name, avg_rating: 0, review_count: 0, starting_price: 100,
      created_date: daysAgo(20),
    },
    {
      id: uid(), title: 'לופט תעשייתי לאירועים בגבעתיים', slug: 'loft-events-givatayim',
      description: 'חלל תעשייתי מעוצב עם תקרות גבוהות, תאורה אטמוספרית ובר. מושלם לאירועי חברה, השקות ומסיבות.',
      category: 'event_space', space_type: 'loft', city: 'גבעתיים', address: 'רחוב כצנלסון 30',
      latitude: 32.0723, longitude: 34.8107, max_guests: 100, status: 'active', instant_booking: false,
      images: [img('photo-1519167758481-83f550bb49b3'), img('photo-1478146896981-b80fe463b330')],
      amenities: ['sound_system', 'lighting', 'tables', 'chairs', 'bbq', 'accessible'],
      activities: ['birthday', 'company_event', 'launch', 'wedding', 'workshop'],
      activity_pricing: [
        { activity: 'company_event', hourly_price: 400, pricing_unit: 'hour', min_hours: 4, max_guests: 100 },
        { activity: 'birthday', hourly_price: 300, pricing_unit: 'hour', min_hours: 3, max_guests: 80 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '10:00', end_time: '23:59', enabled: true },
        { day: 'monday', start_time: '10:00', end_time: '23:59', enabled: true },
        { day: 'tuesday', start_time: '10:00', end_time: '23:59', enabled: true },
        { day: 'wednesday', start_time: '10:00', end_time: '23:59', enabled: true },
        { day: 'thursday', start_time: '10:00', end_time: '23:59', enabled: true },
        { day: 'friday', start_time: '10:00', end_time: '18:00', enabled: true },
        { day: 'saturday', start_time: '12:00', end_time: '23:59', enabled: true },
      ],
      rules: 'ניקיון בתום האירוע, אין זיקוקים בפנים.',
      cancellation_policy: 'strict', min_booking_hours: 3,
      host_id: host.id, host_name: host.full_name, avg_rating: 0, review_count: 0, starting_price: 300,
      created_date: daysAgo(15),
    },
    {
      id: uid(), title: 'סטודיו צילום עם רקעים בנתניה', slug: 'photo-studio-netanya',
      description: 'סטודיו צילום מקצועי עם רקעי צבע, ציוד תאורה ואביזרי הפקה.',
      category: 'photography', space_type: 'studio', city: 'נתניה', address: 'רחוב הרצל 55',
      latitude: 32.3215, longitude: 34.8532, max_guests: 10, status: 'active', instant_booking: true,
      images: [img('photo-1554080353-a576cf803bda'), img('photo-1493863641943-9b68992a8d07')],
      amenities: ['lighting', 'cameras', 'privacy', 'air_conditioning'],
      activities: ['photography', 'video', 'food_photography'],
      activity_pricing: [
        { activity: 'photography', hourly_price: 130, pricing_unit: 'hour', min_hours: 2, max_guests: 8 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '09:00', end_time: '20:00', enabled: true },
        { day: 'monday', start_time: '09:00', end_time: '20:00', enabled: true },
        { day: 'tuesday', start_time: '09:00', end_time: '20:00', enabled: true },
        { day: 'wednesday', start_time: '09:00', end_time: '20:00', enabled: true },
        { day: 'thursday', start_time: '09:00', end_time: '20:00', enabled: true },
        { day: 'friday', start_time: '09:00', end_time: '14:00', enabled: true },
        { day: 'saturday', start_time: '09:00', end_time: '20:00', enabled: false },
      ],
      rules: 'שמירה על ציוד הצילום, תיאום מראש להזמנת אביזרים.',
      cancellation_policy: 'moderate', min_booking_hours: 2,
      host_id: host.id, host_name: host.full_name, avg_rating: 0, review_count: 0, starting_price: 130,
      created_date: daysAgo(10),
    },
    {
      id: uid(), title: 'חדר ישיבות בוטיק בבורסה רמת גן', slug: 'meeting-room-ramat-gan',
      description: 'חדר ישיבות מעוצב עם מסך שיתוף, לוח מחיק ופינת קפה. חמש דקות מרכבת סבידור.',
      category: 'meeting', space_type: 'room', city: 'רמת גן', address: 'דרך אבא הלל 12',
      latitude: 32.0823, longitude: 34.8083, max_guests: 12, status: 'active', instant_booking: true,
      images: [img('photo-1497366216548-37526070297c'), img('photo-1497366811353-6870744d04b2')],
      amenities: ['wifi', 'air_conditioning', 'tables', 'chairs'],
      activities: ['meeting', 'interview', 'lecture', 'workshop'],
      activity_pricing: [
        { activity: 'meeting', hourly_price: 80, pricing_unit: 'hour', min_hours: 1, max_guests: 12 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '08:00', end_time: '19:00', enabled: true },
        { day: 'monday', start_time: '08:00', end_time: '19:00', enabled: true },
        { day: 'tuesday', start_time: '08:00', end_time: '19:00', enabled: true },
        { day: 'wednesday', start_time: '08:00', end_time: '19:00', enabled: true },
        { day: 'thursday', start_time: '08:00', end_time: '19:00', enabled: true },
        { day: 'friday', start_time: '08:00', end_time: '14:00', enabled: true },
        { day: 'saturday', start_time: '08:00', end_time: '19:00', enabled: false },
      ],
      rules: 'ניקיון עצמי בסיום, אין אוכל חם בחדר.',
      cancellation_policy: 'flexible', min_booking_hours: 1,
      host_id: host.id, host_name: host.full_name, avg_rating: 0, review_count: 0, starting_price: 80,
      created_date: daysAgo(8),
    },
    {
      id: uid(), title: 'גינה טרופית לאירועים בקיסריה', slug: 'garden-caesarea',
      description: 'גינה מטופחת עם דקל, פרגולה ותאורה. אידיאלית לימי הולדת, בריתות ומפגשים משפחתיים.',
      category: 'garden', space_type: 'garden', city: 'קיסריה', address: 'רחוב הארז 3',
      latitude: 32.5000, longitude: 34.9000, max_guests: 60, status: 'active', instant_booking: false,
      images: [img('photo-1464366400600-7168b8af9bc3'), img('photo-1416879595882-3373a0480b5b')],
      amenities: ['bbq', 'tables', 'chairs', 'lighting', 'parking'],
      activities: ['birthday', 'family_event', 'brit', 'workshop'],
      activity_pricing: [
        { activity: 'family_event', hourly_price: 200, pricing_unit: 'hour', min_hours: 3, max_guests: 60 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '09:00', end_time: '22:00', enabled: true },
        { day: 'monday', start_time: '09:00', end_time: '22:00', enabled: true },
        { day: 'tuesday', start_time: '09:00', end_time: '22:00', enabled: true },
        { day: 'wednesday', start_time: '09:00', end_time: '22:00', enabled: true },
        { day: 'thursday', start_time: '09:00', end_time: '22:00', enabled: true },
        { day: 'friday', start_time: '09:00', end_time: '17:00', enabled: true },
        { day: 'saturday', start_time: '10:00', end_time: '22:00', enabled: true },
      ],
      rules: 'שקט לאחר 21:00, איסוף פסולת עצמי.',
      cancellation_policy: 'moderate', min_booking_hours: 3,
      host_id: host.id, host_name: host.full_name, avg_rating: 0, review_count: 0, starting_price: 200,
      created_date: daysAgo(5),
    },
    {
      id: uid(), title: 'אולפן פודקאסט מאובזר בירושלים', slug: 'podcast-studio-jerusalem',
      description: 'אולפן מוקלט אקוסטית עם 4 מיקרופונים, מיקסר ותאורת סטרימינג.',
      category: 'podcast', space_type: 'studio', city: 'ירושלים', address: 'רחוב יפו 88',
      latitude: 31.7857, longitude: 35.2007, max_guests: 6, status: 'pending_review', instant_booking: false,
      images: [img('photo-1478737270239-2f02b77fc618')],
      amenities: ['microphones', 'sound_system', 'wifi', 'air_conditioning'],
      activities: ['podcast', 'video'],
      activity_pricing: [
        { activity: 'podcast', hourly_price: 140, pricing_unit: 'hour', min_hours: 2, max_guests: 5 },
      ],
      availability_rules: [
        { day: 'sunday', start_time: '10:00', end_time: '21:00', enabled: true },
        { day: 'monday', start_time: '10:00', end_time: '21:00', enabled: true },
        { day: 'tuesday', start_time: '10:00', end_time: '21:00', enabled: true },
        { day: 'wednesday', start_time: '10:00', end_time: '21:00', enabled: true },
        { day: 'thursday', start_time: '10:00', end_time: '21:00', enabled: true },
        { day: 'friday', start_time: '10:00', end_time: '14:00', enabled: true },
        { day: 'saturday', start_time: '10:00', end_time: '21:00', enabled: false },
      ],
      rules: 'טיפול עדין בציוד ההקלטה.',
      cancellation_policy: 'strict', min_booking_hours: 2,
      host_id: host.id, host_name: host.full_name, avg_rating: 0, review_count: 0, starting_price: 140,
      created_date: daysAgo(2),
    },
  ];

  const db = { Space: spaces, Booking: [], Favorite: [], Review: [], Message: [] };

  const villa = spaces[0];
  const pool = spaces[1];

  const completedBooking = {
    id: uid(), space_id: villa.id, space_title: villa.title, space_image: villa.images[0],
    host_id: host.id, guest_id: guest.id, guest_name: guest.full_name, guest_email: guest.email,
    activity: 'daytime_use', date: daysAgo(12).slice(0, 10), start_time: '10:00', end_time: '14:00', hours: 4,
    guests_count: 8, hourly_price: 180, subtotal: 720, guest_fee: 36, host_fee: 108, total: 756,
    host_payout: 612, platform_revenue: 144, status: 'completed', payment_status: 'paid',
    created_date: daysAgo(13),
  };
  const pendingBooking = {
    id: uid(), space_id: pool.id, space_title: pool.title, space_image: pool.images[0],
    host_id: host.id, guest_id: guest.id, guest_name: guest.full_name, guest_email: guest.email,
    activity: 'swimming_lessons', date: daysAgo(-3).slice(0, 10), start_time: '16:00', end_time: '17:00', hours: 1,
    guests_count: 2, hourly_price: 120, subtotal: 120, guest_fee: 6, host_fee: 18, total: 126,
    host_payout: 102, platform_revenue: 24, status: 'pending', payment_status: 'unpaid',
    created_date: daysAgo(1),
  };
  db.Booking.push(completedBooking, pendingBooking);

  db.Review.push({
    id: uid(), space_id: villa.id, booking_id: completedBooking.id, reviewer_id: guest.id,
    reviewer_name: guest.full_name, host_id: host.id, rating: 5,
    text: 'מקום מדהים, הבריכה נקייה והנוף מהגינה מרהיב. נועה הייתה קשובה ומגיבה מהר.',
    created_date: daysAgo(11),
  });
  db.Review.push({
    id: uid(), space_id: villa.id, booking_id: completedBooking.id, reviewer_id: host.id,
    reviewer_name: 'אורח נוסף', host_id: host.id, rating: 4,
    text: 'בילינו יום משפחתי מצוין, המחיר הוגן ביחס לגודל המקום.',
    created_date: daysAgo(9),
  });
  db.Review.push({
    id: uid(), space_id: pool.id, booking_id: null, reviewer_id: guest.id,
    reviewer_name: guest.full_name, host_id: host.id, rating: 5,
    text: 'שיעורי השחייה היו מצוינים, המדריכה מקצועית מאוד.',
    created_date: daysAgo(6),
  });

  db.Favorite.push({ id: uid(), user_id: guest.id, space_id: pool.id, created_date: daysAgo(4) });

  writeDb(db);

  console.info(
    '[PopSpot demo] Seeded local data. Demo accounts (password: password123):\n' +
    `  admin: ${admin.email}\n  host:  ${host.email}\n  guest: ${guest.email}`
  );
}

if (typeof window !== 'undefined') {
  seedIfEmpty();
}
