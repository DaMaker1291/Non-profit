// Drop the one redundant key the teacher/student i18n script authored:
// `tl.offlineAnswer` said exactly "recorded offline", which `evv.offline`
// already says in all fifteen dictionaries — the learner's own record and the
// teacher's view of it must use ONE word for one claim. Mechanical and
// verified: it removes only whole lines whose key is that one.
import fs from "node:fs";
const FILE = "lib/i18n.ts";
const lines = fs.readFileSync(FILE, "utf8").split("\n");
const kept = lines.filter((l) => !l.trim().startsWith('"tl.offlineAnswer":'));
console.log(`removed ${lines.length - kept.length} lines (want 15)`);
fs.writeFileSync(FILE, kept.join("\n"));
