/**
 * HaMerutz L-70 — Game Data
 * Design: Cinematic Broadcast — Dark Navy / Metallic Gold
 *
 * Each station follows the exact same flow:
 * CLUE → TASK → CONTROL_ROOM → COMPLETE (+ fact) | TRY_AGAIN
 *
 * To add a new station: append a new object to the stations array.
 * Images are referenced by name only (e.g., "02-netanya").
 * Replace placeholder content with real content when approved.
 */

export type TaskType = "photo" | "puzzle" | "coordinates" | "morse";

export interface Station {
  id: string;
  /** Database id of the station (present when loaded from the admin panel). */
  dbId?: number;
  /** Mission type — photo (default), puzzle, coordinates or morse. */
  taskType?: TaskType;
  /** Image used by puzzle missions. */
  taskImageUrl?: string;
  number: number;
  name: string;
  image: string; // e.g. "02-netanya" — will be used as placeholder label
  clue: {
    title: string;
    text: string;
  };
  task: {
    title: string;
    instructions: string;
    wazeLink?: string;
  };
  hints: string[]; // up to 3 hints
  fact: string;    // shown after success
}

export const stations: Station[] = [
  {
    id: "station-01",
    number: 1,
    name: "פתיחה",
    image: "01-opening",
    clue: {
      title: "תחנה 1 — הפתיחה",
      text: "המסע מתחיל כאן. לפניכם 70 שנים של חיים, הרפתקאות וזיכרונות. הרמז הראשון שלכם: המקום שבו הכל התחיל.",
    },
    task: {
      title: "משימה ראשונה",
      instructions: "מצאו את התמונה הישנה ביותר של שלמה שתוכלו למצוא בבית. צלמו אותה ושלחו לצוות ההפקה.",
      wazeLink: undefined,
    },
    hints: [
      "חפשו באלבומי תמונות ישנים.",
      "אולי בארגז הזיכרונות בחדר השינה?",
      "שאלו את אמא — היא בטח יודעת איפה.",
    ],
    fact: "שלמה נולד בשנת 1955. הוא גדל בשכונה קטנה ועם חלומות גדולים.",
  },
  {
    id: "station-02",
    number: 2,
    name: "נתניה",
    image: "02-netanya",
    clue: {
      title: "תחנה 2 — נתניה",
      text: "עיר הים, עיר הילדות. שלמה גדל כאן בין גלי הים לרחובות הצרים. מצאו את הכתובת שבה הכל התחיל.",
    },
    task: {
      title: "משימה — נתניה",
      instructions: "הגיעו לרחוב הילדות של שלמה בנתניה. צלמו תמונה קבוצתית מול הבניין.",
      wazeLink: "https://waze.com/ul?q=נתניה",
    },
    hints: [
      "הרחוב נמצא ליד הים.",
      "חפשו בניין בן 4 קומות עם מרפסות.",
      "הכתובת: רחוב הרצל 12, נתניה.",
    ],
    fact: "שלמה בילה את ילדותו בנתניה. הים היה המגרש המשחקים שלו.",
  },
  {
    id: "station-03",
    number: 3,
    name: "נאות שושנים",
    image: "03-neurim",
    clue: {
      title: "תחנה 3 — נאות שושנים",
      text: "כאן נוצרו חברויות לכל החיים. המקום שבו שלמה למד מה זה אחווה אמיתית.",
    },
    task: {
      title: "משימה — נאות שושנים",
      instructions: "מצאו את שלט הכניסה לנאות שושנים. צלמו את כל הקבוצה מתחת לשלט.",
      wazeLink: "https://waze.com/ul?q=נאות+שושנים",
    },
    hints: [
      "השלט נמצא בכניסה הראשית.",
      "חפשו את הכביש הראשי.",
      "השלט הוא כחול עם כיתוב לבן.",
    ],
    fact: "שלמה ביקר בנאות שושנים עשרות פעמים לאורך חייו. המקום תמיד נשאר בלבו.",
  },
  {
    id: "station-04",
    number: 4,
    name: "הטכניון",
    image: "04-technion",
    clue: {
      title: "תחנה 4 — הטכניון",
      text: "כאן שלמה הפך מחלום למציאות. ארבע שנים של לימוד, חברויות, ואהבה לטכנולוגיה.",
    },
    task: {
      title: "משימה — הטכניון",
      instructions: "הגיעו לשער הראשי של הטכניון בחיפה. צלמו תמונה קבוצתית מול השלט.",
      wazeLink: "https://waze.com/ul?q=הטכניון+חיפה",
    },
    hints: [
      "השער הראשי נמצא בכניסה מרחוב הטכניון.",
      "חפשו את הלוגו הכחול של הטכניון.",
      "הכניסה הראשית היא מצד הדרום.",
    ],
    fact: "שלמה סיים את לימודיו בהצטיינות. הוא תמיד אמר שהטכניון לימד אותו לחשוב.",
  },
];

export type ScreenType =
  | "SCRATCH"
  | "CLUE"
  | "TASK"
  | "CONTROL_ROOM"
  | "COMPLETE"
  | "TRY_AGAIN";

export interface GameState {
  currentStationIndex: number;
  currentScreen: ScreenType;
  hintsRevealed: number; // 0, 1, 2, or 3
  isFinished: boolean;
}

export const initialGameState: GameState = {
  currentStationIndex: 0,
  currentScreen: "SCRATCH",
  hintsRevealed: 0,
  isFinished: false,
};
