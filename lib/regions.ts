// ── WHERE A LEARNER IS, WITHIN THEIR COUNTRY ───────────────────────────────
//
// A country does not always decide the language. In Canada the province does
// (Quebec is French, the rest is overwhelmingly English), in Cameroon the
// region does (the North-West and South-West are the Anglophone system, the
// other eight are Francophone), and in India the state does (the Hindi belt
// reads Hindi, West Bengal and Tripura read Bengali, and the rest of the
// country is taught in English at secondary level far more often than in the
// state's own first language).
//
// WHY ONLY THREE COUNTRIES. This table is not a gazetteer, and it is not a
// "province" field for its own sake: it exists so that a region can select one
// of the languages this product ACTUALLY SHIPS (the fifteen in lib/i18n.ts).
// Every other country in `COUNTRIES` either has one national language we ship,
// or its regional languages are not ours to offer — Spain's Catalan, Nigeria's
// Yoruba, Kerala's Malayalam. A select listing forty provinces that changes
// nothing is decoration, and giving a learner a choice that has no effect is
// worse than not asking.
//
// THE THREE THAT LOOK LIKE THEY BELONG AND DO NOT, checked rather than assumed:
//   · Kenya, Tanzania, Uganda — Swahili is a national language in EVERY county
//     and region of each, so a region cannot decide between Swahili and English.
//   · The Philippines — Filipino is national nationwide, and the regional
//     languages (Cebuano, Ilocano, …) are not shipped. Region decides nothing.
//   · Pakistan, Bangladesh — Urdu and Bengali are national languages of the
//     whole country respectively, not of some provinces.
//
// `label` IS WRITTEN IN THE LANGUAGE THE REGION SELECTS. That is the one
// convention that keeps a 15-language product honest without a 15 × 59 name
// table: a learner in Quebec reads "Québec" and the interface turns French; a
// learner in Uttar Pradesh reads "उत्तर प्रदेश" and it turns Hindi; a learner in
// Tamil Nadu reads "Tamil Nadu" and it turns English, which is what their
// secondary schooling is in. A region that selected a language it is not
// written in would be the only place in the product where the screen speaks
// one language and the labels another.
//
// This module deliberately imports NOTHING — not even lib/i18n.ts — so the
// server can validate a region without pulling the dictionaries into a route.
// `npm run verify` holds the two together instead: every `language` below must
// be a code lib/i18n.ts ships, which is a claim about the data that a reader
// cannot check by eye across 59 rows.

export interface Region {
  /** Stable within its country, and stored on the profile. Never renamed: a
   *  learner's record carries this string, and a migration is a worse answer
   *  than an id that is a little long. */
  id: string;
  /** Shown in the picker, written in `language`. */
  label: string;
  /** One of the shipped language codes (lib/i18n.ts `LANGS`). */
  language: string;
}

/** Countries whose OWN administrative division decides the language. */
export const REGIONS: Record<string, Region[]> = {
  // Canada: Quebec is French-speaking and the rest of the country is not. New
  // Brunswick is the one officially bilingual province, and its French-speaking
  // third is the population this row serves.
  CA: [
    { id: "quebec", label: "Québec", language: "fr" },
    { id: "new-brunswick", label: "Nouveau-Brunswick", language: "fr" },
    { id: "ontario", label: "Ontario", language: "en" },
    { id: "manitoba", label: "Manitoba", language: "en" },
    { id: "british-columbia", label: "British Columbia", language: "en" },
    { id: "alberta", label: "Alberta", language: "en" },
    { id: "saskatchewan", label: "Saskatchewan", language: "en" },
    { id: "nova-scotia", label: "Nova Scotia", language: "en" },
    { id: "prince-edward-island", label: "Prince Edward Island", language: "en" },
    { id: "newfoundland-and-labrador", label: "Newfoundland and Labrador", language: "en" },
    { id: "yukon", label: "Yukon", language: "en" },
    { id: "northwest-territories", label: "Northwest Territories", language: "en" },
    { id: "nunavut", label: "Nunavut", language: "en" },
  ],

  // Cameroon: TWO EDUCATION SYSTEMS, not two dialects. The North-West and
  // South-West run the Anglophone system (GCE), the other eight the Francophone
  // one — which is also why lib/curricula/registry.ts has to offer two pathways
  // for this country. The labels are in the language of the system, so the
  // Anglophone regions read "North-West" and the Francophone ones "Extrême-Nord".
  CM: [
    { id: "north-west", label: "North-West", language: "en" },
    { id: "south-west", label: "South-West", language: "en" },
    { id: "adamawa", label: "Adamaoua", language: "fr" },
    { id: "centre", label: "Centre", language: "fr" },
    { id: "east", label: "Est", language: "fr" },
    { id: "far-north", label: "Extrême-Nord", language: "fr" },
    { id: "littoral", label: "Littoral", language: "fr" },
    { id: "north", label: "Nord", language: "fr" },
    { id: "west", label: "Ouest", language: "fr" },
    { id: "south", label: "Sud", language: "fr" },
  ],

  // India: 28 states and 8 union territories. Hindi is the official language of
  // the nine states and one territory below; Bengali is official in West Bengal
  // and co-official in Tripura; everywhere else the secondary curriculum is far
  // more often English than the state's own first language, and English is the
  // language this product ships for those states. NOT a claim that nobody in
  // Tamil Nadu reads Tamil — it is that we do not ship Tamil, so English is the
  // honest choice rather than a wrong one.
  IN: [
    { id: "bihar", label: "बिहार", language: "hi" },
    { id: "chhattisgarh", label: "छत्तीसगढ़", language: "hi" },
    { id: "haryana", label: "हरियाणा", language: "hi" },
    { id: "himachal-pradesh", label: "हिमाचल प्रदेश", language: "hi" },
    { id: "jharkhand", label: "झारखंड", language: "hi" },
    { id: "madhya-pradesh", label: "मध्य प्रदेश", language: "hi" },
    { id: "rajasthan", label: "राजस्थान", language: "hi" },
    { id: "uttar-pradesh", label: "उत्तर प्रदेश", language: "hi" },
    { id: "uttarakhand", label: "उत्तराखंड", language: "hi" },
    { id: "delhi", label: "दिल्ली", language: "hi" },
    { id: "west-bengal", label: "পশ্চিমবঙ্গ", language: "bn" },
    { id: "tripura", label: "ত্রিপুরা", language: "bn" },
    { id: "andhra-pradesh", label: "Andhra Pradesh", language: "en" },
    { id: "arunachal-pradesh", label: "Arunachal Pradesh", language: "en" },
    { id: "assam", label: "Assam", language: "en" },
    { id: "goa", label: "Goa", language: "en" },
    { id: "gujarat", label: "Gujarat", language: "en" },
    { id: "karnataka", label: "Karnataka", language: "en" },
    { id: "kerala", label: "Kerala", language: "en" },
    { id: "maharashtra", label: "Maharashtra", language: "en" },
    { id: "manipur", label: "Manipur", language: "en" },
    { id: "meghalaya", label: "Meghalaya", language: "en" },
    { id: "mizoram", label: "Mizoram", language: "en" },
    { id: "nagaland", label: "Nagaland", language: "en" },
    { id: "odisha", label: "Odisha", language: "en" },
    { id: "punjab", label: "Punjab", language: "en" },
    { id: "sikkim", label: "Sikkim", language: "en" },
    { id: "tamil-nadu", label: "Tamil Nadu", language: "en" },
    { id: "telangana", label: "Telangana", language: "en" },
    { id: "andaman-and-nicobar-islands", label: "Andaman and Nicobar Islands", language: "en" },
    { id: "chandigarh", label: "Chandigarh", language: "en" },
    { id: "dadra-and-nagar-haveli-and-daman-and-diu", label: "Dadra and Nagar Haveli and Daman and Diu", language: "en" },
    { id: "jammu-and-kashmir", label: "Jammu and Kashmir", language: "en" },
    { id: "ladakh", label: "Ladakh", language: "en" },
    { id: "lakshadweep", label: "Lakshadweep", language: "en" },
    { id: "puducherry", label: "Puducherry", language: "en" },
  ],
};

/** The regions a country offers, or `[]` — most countries offer none, and the
 *  caller is expected to render NOTHING rather than an empty picker. */
export function regionsFor(country: string | undefined | null): Region[] {
  if (!country) return [];
  return REGIONS[country.toUpperCase()] ?? [];
}

/** Whether this country's own division decides the language, which is the only
 *  reason to ask. */
export function hasRegions(country: string | undefined | null): boolean {
  return regionsFor(country).length > 0;
}

/** One region, or `null`. Case-sensitive on the id on purpose: ids are stored,
 *  and "uttar-pradesh" is the value this module wrote — a fuzzy match would
 *  accept a record no version of this file ever produced. */
export function regionFor(country: string | undefined | null, id: string | undefined | null): Region | null {
  if (!id) return null;
  return regionsFor(country).find((r) => r.id === id) ?? null;
}

/** The language a region selects, or `null` when the country offers no regions
 *  or the id is not one of them. Never invents a language: a caller that gets
 *  `null` must leave the learner's choice alone. */
export function languageForRegion(country: string | undefined | null, id: string | undefined | null): string | null {
  return regionFor(country, id)?.language ?? null;
}
