"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBJECT_LABELS = exports.SUBJECT_IDS = void 0;
exports.subjectLabel = subjectLabel;
exports.subjectFromParam = subjectFromParam;
const i18n_1 = require("./i18n");
exports.SUBJECT_IDS = ["maths", "physics", "chemistry", "biology", "computing"];
exports.SUBJECT_LABELS = {
    maths: "subj.maths",
    physics: "subj.physics",
    chemistry: "subj.chemistry",
    biology: "subj.biology",
    computing: "subj.computing",
};
/** Translated subject name — falls back to the id when unknown. */
function subjectLabel(id, lang) {
    const key = exports.SUBJECT_LABELS[id];
    if (!key)
        return id;
    return (0, i18n_1.translator)(lang ?? "en")(key);
}
function subjectFromParam(raw) {
    const v = Array.isArray(raw) ? raw[0] : raw;
    return exports.SUBJECT_IDS.includes(v ?? "") ? v : "maths";
}
