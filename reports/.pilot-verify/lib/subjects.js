"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBJECT_LABELS = exports.SUBJECT_IDS = void 0;
exports.withMainSubject = withMainSubject;
exports.subjectLabel = subjectLabel;
exports.subjectFromParam = subjectFromParam;
const i18n_1 = require("./i18n");
exports.SUBJECT_IDS = ["maths", "physics", "chemistry", "biology", "computing"];
/**
 * Put a learner's MAIN subject first, without inventing a second record.
 *
 * `subjects[0]` is the subject the shell, Home, the context strip and the
 * baseline diagnostic open by default. Adding chemistry to a physics-only
 * profile used to leave physics first, so a learner who believed they had
 * changed subject still met physics everywhere. This is the ONE owner of that
 * order: the chosen main subject leads, the rest keep their own order, and a
 * duplicate or unknown value cannot enter the list.
 */
function withMainSubject(subjects, main) {
    const out = [];
    const seen = new Set();
    for (const subject of [main, ...subjects]) {
        if (!subject || seen.has(subject) || !exports.SUBJECT_IDS.includes(subject))
            continue;
        seen.add(subject);
        out.push(subject);
    }
    return out;
}
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
