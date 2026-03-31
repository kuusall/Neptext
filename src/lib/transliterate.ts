/**
 * Romanized Nepali to Unicode Devanagari transliteration engine.
 * Converts phonetic Roman input into proper Nepali Unicode text.
 *
 * Supports:
 * - Vowels (a, aa/ā, i, ii/ī, u, uu/ū, e, ai, o, au, ri)
 * - Consonants with proper halant handling
 * - Conjuncts via halant (e.g. "ksha" → क्ष)
 * - Common aspirated consonants (kh, gh, chh, jh, th, dh, ph, bh, etc.)
 * - Retroflex consonants (T, Th, D, Dh, N vs t, th, d, dh, n)
 * - Anusvara (M/n~ → ं), Chandrabindu (N~ → ँ), Visarga (H → ः)
 */

// Independent vowel forms (used at start of word or after another vowel)
const VOWELS: Record<string, string> = {
  au: "औ",
  ai: "ऐ",
  aa: "आ",
  ii: "ई",
  uu: "ऊ",
  ri: "ऋ",
  a: "अ",
  i: "इ",
  u: "उ",
  e: "ए",
  o: "ओ",
};

// Dependent vowel signs (mātrā) used after consonants
const MATRAS: Record<string, string> = {
  au: "ौ",
  ai: "ै",
  aa: "ा",
  ii: "ी",
  uu: "ू",
  ri: "ृ",
  a: "",      // inherent 'a' — no mātrā needed
  i: "ि",
  u: "ु",
  e: "े",
  o: "ो",
};

// Consonants mapped from romanized input
const CONSONANTS: Record<string, string> = {
  // Aspirated / digraphs first (longer matches)
  ksh: "क्ष",
  kshy: "क्ष्य",
  gya: "ज्ञ",
  shh: "ष",
  sh: "श",
  chh: "छ",
  ch: "च",
  kh: "ख",
  gh: "घ",
  ng: "ङ",
  jh: "झ",
  ny: "ञ",
  // Retroflex (uppercase)
  Th: "ठ",
  Dh: "ढ",
  T: "ट",
  D: "ड",
  N: "ण",
  // Dental
  th: "थ",
  dh: "ध",
  ph: "फ",
  bh: "भ",
  // Simple consonants
  k: "क",
  g: "ग",
  j: "ज",
  t: "त",
  d: "द",
  n: "न",
  p: "प",
  b: "ब",
  m: "म",
  y: "य",
  r: "र",
  l: "ल",
  w: "व",
  v: "व",
  s: "स",
  h: "ह",
};

// Special characters
const SPECIALS: Record<string, string> = {
  "M": "ं",    // anusvara
  "H": "ः",    // visarga
  ".": "।",    // purna viram
  "..": "॥",   // double danda
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

const HALANT = "्";

// Sort keys by length descending so longer patterns match first
const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);

function matchAt(input: string, pos: number, keys: string[]): string | null {
  for (const key of keys) {
    if (input.substring(pos, pos + key.length) === key) {
      return key;
    }
  }
  return null;
}

/**
 * Transliterate a full Romanized Nepali string to Unicode Devanagari.
 */
export function transliterate(input: string): string {
  let result = "";
  let i = 0;
  let lastWasConsonant = false; // tracks if last output was a consonant (with inherent 'a')

  while (i < input.length) {
    const ch = input[i];

    // Check double-dot special first
    if (input.substring(i, i + 2) === "..") {
      result += "॥";
      i += 2;
      lastWasConsonant = false;
      continue;
    }

    // Special characters
    if (SPECIALS[ch] && !matchAt(input, i, CONSONANT_KEYS)) {
      result += SPECIALS[ch];
      i += 1;
      lastWasConsonant = false;
      continue;
    }

    // Try matching a vowel
    const vowelKey = matchAt(input, i, VOWEL_KEYS);
    if (vowelKey && !matchAt(input, i, CONSONANT_KEYS.filter(k => k.length > vowelKey.length))) {
      if (lastWasConsonant) {
        // Add mātrā (dependent vowel)
        result += MATRAS[vowelKey];
      } else {
        // Add independent vowel
        result += VOWELS[vowelKey];
      }
      i += vowelKey.length;
      lastWasConsonant = false;
      continue;
    }

    // Try matching a consonant
    const consKey = matchAt(input, i, CONSONANT_KEYS);
    if (consKey) {
      if (lastWasConsonant) {
        // Previous consonant gets halant before this one (conjunct)
        result += HALANT;
      }
      result += CONSONANTS[consKey];
      i += consKey.length;
      lastWasConsonant = true;
      continue;
    }

    // Space or non-transliterable character
    if (lastWasConsonant && (ch === " " || ch === "\n" || ch === "\t")) {
      // inherent 'a' is fine, just end the syllable
      lastWasConsonant = false;
    } else if (lastWasConsonant) {
      lastWasConsonant = false;
    }

    result += ch;
    i += 1;
    lastWasConsonant = false;
  }

  return result;
}

/**
 * Transliterate only the last word (after the last space) in the input.
 * Returns { before, converted } so we can replace just the tail.
 */
export function transliterateLastWord(input: string): {
  prefix: string;
  original: string;
  converted: string;
} {
  const lastSpace = input.lastIndexOf(" ");
  const prefix = lastSpace >= 0 ? input.substring(0, lastSpace + 1) : "";
  const lastWord = lastSpace >= 0 ? input.substring(lastSpace + 1) : input;
  return {
    prefix,
    original: lastWord,
    converted: transliterate(lastWord),
  };
}
