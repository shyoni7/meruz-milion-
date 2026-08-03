/**
 * Morse code helpers — Hebrew + English + digits.
 * Used by the game (legend screen) and the admin panel (QR generation).
 */

export const MORSE_MAP: Record<string, string> = {
  // Hebrew (standard Hebrew Morse)
  "א": ".-",
  "ב": "-...",
  "ג": "--.",
  "ד": "-..",
  "ה": "---",
  "ו": ".",
  "ז": "--..",
  "ח": "....",
  "ט": "..-",
  "י": "..",
  "כ": "-.-",
  "ל": ".-..",
  "מ": "--",
  "נ": "-.",
  "ס": "-.-.",
  "ע": ".---",
  "פ": ".--.",
  "צ": ".--",
  "ק": "--.-",
  "ר": ".-.",
  "ש": "...",
  "ת": "-",
  // English
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.",
  h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.",
  o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-",
  v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..",
  // Digits
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};

// Hebrew final letters share the code of their base letter
const FINALS: Record<string, string> = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

/** Encode a word/phrase to morse: letters separated by spaces, words by " / " */
export function toMorse(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split("")
        .map((ch) => MORSE_MAP[FINALS[ch] ?? ch] ?? "")
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean)
    .join(" / ");
}

/** Hebrew letters + digits for the in-game legend table */
export const HEBREW_LEGEND: Array<[string, string]> = [
  ["א", ".-"], ["ב", "-..."], ["ג", "--."], ["ד", "-.."], ["ה", "---"],
  ["ו", "."], ["ז", "--.."], ["ח", "...."], ["ט", "..-"], ["י", ".."],
  ["כ", "-.-"], ["ל", ".-.."], ["מ", "--"], ["נ", "-."], ["ס", "-.-."],
  ["ע", ".---"], ["פ", ".--."], ["צ", ".--"], ["ק", "--.-"], ["ר", ".-."],
  ["ש", "..."], ["ת", "-"],
];
