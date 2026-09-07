// Use-cases: the specific reason a space is rented (used for per-use pricing)
export const ACTIVITIES = {
  // Training studio uses
  yoga: { label: 'יוגה', emoji: '🧘' },
  pilates: { label: 'פילאטיס', emoji: '🧘‍♀️' },
  dance: { label: 'ריקוד', emoji: '💃' },
  personal_training: { label: 'אימון אישי', emoji: '💪' },
  martial_arts: { label: 'אומנויות לחימה', emoji: '🥋' },
  fitness: { label: 'פיטנס', emoji: '🏋️' },
  meditation: { label: 'מדיטציה', emoji: '🧘🏻' },
  // Pool uses
  swimming_lessons: { label: 'שיעורי שחייה', emoji: '🏊‍♂️' },
  pool: { label: 'בילוי בבריכה', emoji: '☀️' },
  // Villa / apartment uses
  vacation: { label: 'נופש', emoji: '🌴' },
  daytime_use: { label: 'שימוש יומי', emoji: '☀️' },
  // Event uses
  birthday: { label: 'יום הולדת', emoji: '🎂' },
  bar_mitzvah: { label: 'בר / בת מצווה', emoji: '🕎' },
  wedding: { label: 'חתונה', emoji: '💍' },
  brit: { label: 'ברית / בריתה', emoji: '👶' },
  engagement: { label: 'אירוסין', emoji: '💑' },
  bachelor_party: { label: 'מסיבת רווקים / רווקות', emoji: '🎊' },
  company_event: { label: 'אירוע חברה', emoji: '🏢' },
  family_event: { label: 'מפגש משפחתי', emoji: '👨‍👩‍👧' },
  launch: { label: 'השקה', emoji: '🚀' },
  event: { label: 'אירוע', emoji: '🎉' },
  // Photography / production
  photography: { label: 'צילום', emoji: '📸' },
  video: { label: 'הפקת וידאו', emoji: '🎬' },
  food_photography: { label: 'צילום אוכל', emoji: '📷' },
  // Meeting / work
  meeting: { label: 'פגישה / עבודה', emoji: '💼' },
  interview: { label: 'ראיון', emoji: '🗣️' },
  lecture: { label: 'הרצאה', emoji: '🎤' },
  // Podcast / studio
  podcast: { label: 'פודקאסט', emoji: '🎙️' },
  // Sports
  sports: { label: 'ספורט', emoji: '🏀' },
  // Kitchen
  cooking_class: { label: 'סדנת בישול', emoji: '👩‍🍳' },
  // Shared
  workshop: { label: 'סדנה', emoji: '🎨' },
  garden: { label: 'גינה / חצר', emoji: '🌳' },
  kitchen: { label: 'מטבח', emoji: '🍳' },
  parking: { label: 'חניה', emoji: '🚗' },
};

// Main marketplace categories — the top-level "what do you want to rent" taxonomy
export const CATEGORIES = {
  training_studio: {
    label: 'סטודיו לאימונים', emoji: '🏋️', icon: 'Dumbbell',
    activities: ['yoga', 'pilates', 'dance', 'personal_training', 'martial_arts', 'fitness', 'meditation', 'workshop'],
  },
  pool: {
    label: 'בריכת שחייה', emoji: '🏊', icon: 'Waves',
    activities: ['swimming_lessons', 'pool', 'birthday'],
  },
  villa: {
    label: 'וילה או דירה', emoji: '🏡', icon: 'Home',
    activities: ['vacation', 'daytime_use', 'photography', 'family_event', 'event'],
  },
  event_space: {
    label: 'מקום לאירועים', emoji: '🎉', icon: 'PartyPopper',
    activities: ['birthday', 'bar_mitzvah', 'wedding', 'brit', 'engagement', 'bachelor_party', 'company_event', 'family_event', 'workshop', 'lecture'],
  },
  photography: {
    label: 'צילום והפקות', emoji: '📸', icon: 'Camera',
    activities: ['photography', 'video', 'food_photography'],
  },
  meeting: {
    label: 'חדרי ישיבות ועבודה', emoji: '💼', icon: 'Briefcase',
    activities: ['meeting', 'interview', 'workshop', 'lecture'],
  },
  podcast: {
    label: 'אולפן ופודקאסט', emoji: '🎙️', icon: 'Mic',
    activities: ['podcast', 'video'],
  },
  sports: {
    label: 'מגרשי ספורט', emoji: '🏀', icon: 'CircleDot',
    activities: ['sports'],
  },
  garden: {
    label: 'גינות וחצרות', emoji: '🌳', icon: 'TreePine',
    activities: ['birthday', 'workshop', 'yoga', 'family_event', 'photography'],
  },
  kitchen: {
    label: 'מטבחים', emoji: '🍳', icon: 'ChefHat',
    activities: ['cooking_class', 'food_photography', 'workshop'],
  },
  // Future vertical — not shown prominently at launch, kept for architecture readiness
  parking: {
    label: 'חניה', emoji: '🚗', icon: 'Car',
    activities: ['parking'],
    hidden: true,
  },
};

export const PRIMARY_CATEGORIES = ['training_studio', 'pool', 'villa', 'event_space', 'photography'];
export const SECONDARY_CATEGORIES = ['meeting', 'podcast', 'sports', 'garden', 'kitchen'];

// Legacy aliases kept for compatibility with older code paths
export const PRIMARY_ACTIVITIES = PRIMARY_CATEGORIES;
export const SECONDARY_ACTIVITIES = SECONDARY_CATEGORIES;

export const PRICING_UNITS = {
  hour: { label: '₪ לשעה', suffix: '/שעה' },
  three_hours: { label: '₪ ל-3 שעות', suffix: '/3 שעות' },
  half_day: { label: '₪ לחצי יום', suffix: '/חצי יום' },
  day: { label: '₪ ליום', suffix: '/יום' },
  night: { label: '₪ ללילה', suffix: '/לילה' },
  event: { label: '₪ לאירוע', suffix: '/אירוע' },
};

export const SPACE_TYPES = {
  pool: 'בריכה',
  villa: 'וילה',
  rooftop: 'גג',
  loft: 'לופט',
  studio: 'סטודיו',
  room: 'חדר',
  garden: 'גינה',
  court: 'מגרש',
  kitchen: 'מטבח',
  parking: 'חניה',
  other: 'אחר',
};

export const AMENITIES = [
  { id: 'heated_pool', label: 'בריכה מחוממת', emoji: '♨️' },
  { id: 'shower', label: 'מקלחת', emoji: '🚿' },
  { id: 'bathroom', label: 'שירותים', emoji: '🚻' },
  { id: 'bbq', label: 'מנגל', emoji: '🍖' },
  { id: 'kitchen', label: 'מטבח', emoji: '🍳' },
  { id: 'wifi', label: 'Wi-Fi', emoji: '📶' },
  { id: 'parking', label: 'חניה', emoji: '🅿️' },
  { id: 'sound_system', label: 'מערכת שמע', emoji: '🔊' },
  { id: 'tables', label: 'שולחנות', emoji: '🪑' },
  { id: 'chairs', label: 'כיסאות', emoji: '💺' },
  { id: 'accessible', label: 'נגישות', emoji: '♿' },
  { id: 'privacy', label: 'פרטיות מלאה', emoji: '🔒' },
  { id: 'air_conditioning', label: 'מיזוג אוויר', emoji: '❄️' },
  { id: 'lighting', label: 'תאורה מקצועית', emoji: '💡' },
  { id: 'mirrors', label: 'מראות', emoji: '🪞' },
  { id: 'mats', label: 'מזרנים', emoji: '🧘' },
  { id: 'changing_room', label: 'חדר הלבשה', emoji: '👗' },
  { id: 'microphones', label: 'מיקרופונים', emoji: '🎤' },
  { id: 'cameras', label: 'מצלמות', emoji: '📷' },
];

export const CITIES = [
  'תל אביב', 'הרצליה', 'רמת השרון', 'רמת גן', 'גבעתיים',
  'ראשון לציון', 'רחובות', 'נתניה', 'ירושלים', 'קיסריה', 'חיפה',
];

export const CANCELLATION_POLICIES = {
  flexible: { label: 'גמישה', description: 'ביטול חינם עד 24 שעות לפני' },
  moderate: { label: 'בינונית', description: 'ביטול חינם עד 3 ימים לפני' },
  strict: { label: 'מחמירה', description: 'ביטול חינם עד 7 ימים לפני' },
};

export const BOOKING_STATUSES = {
  pending: { label: 'ממתין לאישור', color: 'warning' },
  accepted: { label: 'מאושר', color: 'success' },
  rejected: { label: 'נדחה', color: 'destructive' },
  cancelled: { label: 'בוטל', color: 'muted' },
  completed: { label: 'הושלם', color: 'success' },
};

export const DAYS_HE = {
  sunday: 'ראשון',
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'שבת',
};

export const DEFAULT_AVAILABILITY = [
  { day: 'sunday', start_time: '08:00', end_time: '22:00', enabled: true },
  { day: 'monday', start_time: '08:00', end_time: '22:00', enabled: true },
  { day: 'tuesday', start_time: '08:00', end_time: '22:00', enabled: true },
  { day: 'wednesday', start_time: '08:00', end_time: '22:00', enabled: true },
  { day: 'thursday', start_time: '08:00', end_time: '22:00', enabled: true },
  { day: 'friday', start_time: '08:00', end_time: '16:00', enabled: true },
  { day: 'saturday', start_time: '09:00', end_time: '23:00', enabled: true },
];
