"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// OpenMind — core domain types
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOARD_IDS = void 0;
exports.isBoardId = isBoardId;
/** Runtime registry for the BoardId union — the single source of truth shared
 *  by the profile API, the enrolment UI and the specification layer. Without
 *  this, each call site re-listed the ids by hand and a new board could not be
 *  saved by the very API it was added for. */
exports.BOARD_IDS = [
    "cbse", "icse", "matric", "state",
    "igcse", "cambridge", "ib",
    "aqa", "edexcel", "ocr", "wjec",
    "nigerian", "kenyan", "caps",
    "gce", "minesec",
    "philippine", "bangladeshi", "indonesian", "brazilian", "mexican",
    "commoncore", "collegeboard", "acara", "canadian",
    // Africa
    "ethiopian", "egyptian", "moroccan", "rwandan", "zambian",
    "zimsec", "malawian", "malian", "senegalese", "ivorian",
    "nigerien", "burkinabe", "somali", "sudanese",
    // Asia & Middle East
    "vietnamese", "turkish", "iranian", "afghan", "chinese",
    "japanese", "korean", "yemeni", "iraqi", "syrian",
    "jordanian", "lebanese", "nepali", "srilankan", "myanmar",
    "cambodian", "lao", "mongolian", "kazakh", "uzbek",
    // Europe
    "spanish", "french", "german", "italian", "polish", "ukrainian",
    // Americas
    "colombian", "argentine", "peruvian", "haitian", "bolivian",
    "ecuadorian", "guatemalan", "honduran", "nicaraguan", "salvadoran",
    "dominican",
];
function isBoardId(value) {
    return typeof value === "string" && exports.BOARD_IDS.includes(value);
}
const _boardIdsCover = true;
void _boardIdsCover;
