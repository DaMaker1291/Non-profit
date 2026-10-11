// ─────────────────────────────────────────────────────────────────────────────
// THE FILES A BUILD REWRITES, AND PUTTING THEM BACK.
//
// `next dev` and `next build` each rewrite `next-env.d.ts` to name their OWN
// dist types (`.next-dev/types/routes.d.ts` vs `.next/types/routes.d.ts`), and
// the file is TRACKED. So every script that builds — the release checklist, the
// restore drill — used to flip a tracked file and leave the working tree dirty,
// at exactly the moment a release inspects its own diff. A release whose own
// tooling dirties the tree it is certifying makes "inspect the diff" unreadable,
// and it quietly invites committing a build artefact's opinion about which
// server ran last.
//
// Snapshot before the first build, restore after the last server is down, and
// ASSERT the restore: "the tooling leaves the tree as it found it" is a property
// worth checking, not a claim worth making.
//
// ONE IMPLEMENTATION, because two scripts build. A second copy of this rule is a
// second opinion about what the working tree is supposed to contain.
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";

/** Tracked files a build rewrites. Add here — never at a call site. */
export const GENERATED = ["next-env.d.ts"];

/** Read the current contents of every generated file, before anything builds.
 *  `null` records "it did not exist", which a restore must reproduce. */
export function snapshotGenerated(root = process.cwd()) {
  return new Map(
    GENERATED.map((f) => {
      const full = path.join(root, f);
      return [f, fs.existsSync(full) ? fs.readFileSync(full) : null];
    }),
  );
}

/**
 * Put the snapshot back. Returns `{ restoredAll, changed }`:
 *
 *   restoredAll — true when every generated file is byte-identical to the
 *                 snapshot afterwards. False is a real failure: it means a file
 *                 could not be returned to the state the caller found it in.
 *   changed     — the files that had actually been rewritten (empty is normal
 *                 when the last build happened to write the same bytes).
 */
export function restoreGenerated(before, root = process.cwd()) {
  let restoredAll = true;
  const changed = [];
  for (const f of GENERATED) {
    const was = before.get(f);
    const full = path.join(root, f);
    const now = fs.existsSync(full) ? fs.readFileSync(full) : null;
    if (was && now && now.equals(was)) continue;
    if (was) fs.writeFileSync(full, was);
    else fs.rmSync(full, { force: true });
    const after = fs.existsSync(full) ? fs.readFileSync(full) : null;
    if (!after || !was || !after.equals(was)) restoredAll = false;
    else changed.push(f);
  }
  return { restoredAll, changed };
}
