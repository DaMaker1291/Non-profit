#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE MEDIA GATE — what the lesson is allowed to promise about a video.
//
// The product links OUT to a video. It does not embed a third-party player,
// does not download the media, and does not rehost it. That is a legal decision
// and a product decision: a blocked player leaves a blank box where teaching was
// promised, and a learner on a slow connection pays for a frame they cannot
// watch.
//
// A VIDEO CARD IS A CLAIM THAT THE VIDEO TEACHES THIS IDEA. The first version
// gave every lesson a subject overview — the chemistry lesson sent all sixteen
// concepts to one 7:45 "Introduction to chemistry" — and the honesty label did
// not make the link useful. A learner asking how to balance an equation was sent
// somewhere that did not answer it, through a cookie wall. The fallback is gone:
// five verified videos remain, and a lesson with no verified exact-concept
// video renders no card. The chemistry cards were removed after review: every
// one opened a BBC/Khan page behind a consent choice, and several were longer
// than the lesson they were attached to.
//
// When a card exists this gate requires it to say:
//   - what language the audio is in;
//   - whether captions are human, automatic, absent or unchecked;
//   - what the video shows, in our own words, so the card still teaches when
//     the link cannot open;
//   - that it is concept-specific, and how long it is (a lesson is not a
//     replacement for a lecture).
// It also requires the lesson to have a text route, because a video may never be
// the only way to learn the concept.
//
// Run: node scripts/media-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { LESSON_PLANS, planFor } = require("../.verify/lesson-plans.js");
const { CONCEPTS } = require("../.verify/genome.js");
const { videoFor, videoScopeKey } = require("../.verify/lesson-media.js");

const CAPTIONS = new Set(["human", "auto", "none", "unknown"]);
const failures = [];
const videos = [];
const MAX_MINUTES = 6;

/** Parse "7:45" or "1:02:03" into minutes. Missing lengths are allowed, because
 *  the source does not always state one; a stated length over the ceiling is not. */
function minutesOf(length) {
  if (!length) return null;
  const parts = String(length).split(":").map((n) => Number(n));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return NaN;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  return NaN;
}

for (const concept of CONCEPTS) {
  const plan = planFor(concept.id);
  if (!plan) {
    failures.push(`${concept.id}: no lesson plan, so no video can be resolved`);
    continue;
  }
  const video = videoFor(plan);
  // NO CARD IS A VALID ANSWER. The absence is reported by the count below; it
  // is not silently filled with a subject overview that does not teach the idea.
  if (!video) continue;

  videos.push({ conceptId: concept.id, ...video });
  if (video.scope !== "concept") failures.push(`${concept.id}: only an exact-concept video may be shown`);
  if (videoScopeKey(video) !== "lesson.videoConcept") failures.push(`${concept.id}: a non-concept scope key reached the card`);

  let url;
  try {
    url = new URL(video.url);
  } catch {
    failures.push(`${concept.id}: video URL is not a URL (${video.url})`);
    continue;
  }
  if (url.protocol !== "https:") failures.push(`${concept.id}: video is not HTTPS`);
  if (/\/(embed|shorts)\//.test(url.pathname)) failures.push(`${concept.id}: a player/embed URL is not a link`);
  if (/\.(mp4|webm|m3u8)$/i.test(url.pathname)) failures.push(`${concept.id}: a media file is not a link`);
  if (!video.title?.trim()) failures.push(`${concept.id}: video has no title`);
  if (!video.source?.trim()) failures.push(`${concept.id}: video has no source`);
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(video.language ?? "")) {
    failures.push(`${concept.id}: video language is not a BCP-47 tag (${video.language ?? "missing"})`);
  }
  if (!CAPTIONS.has(video.captions)) {
    failures.push(`${concept.id}: caption status must be human|auto|none|unknown (${video.captions ?? "missing"})`);
  }
  if ((video.summary ?? "").trim().length < 40) {
    failures.push(`${concept.id}: the video needs a fallback summary of at least 40 characters`);
  }
  const minutes = minutesOf(video.length);
  if (Number.isNaN(minutes)) failures.push(`${concept.id}: video length is not mm:ss (${video.length})`);
  else if (minutes !== null && minutes > MAX_MINUTES) {
    failures.push(`${concept.id}: video is ${video.length}, longer than the ${MAX_MINUTES}-minute lesson ceiling`);
  }
  if (!Array.isArray(plan.idea) || plan.idea.length < 3 || !plan.usedFor?.trim()) {
    failures.push(`${concept.id}: a video is present but the lesson has no substantial text route`);
  }
}

// The markup is part of the promise: an iframe here would make the gate above
// describe a link the page does not actually render.
const pagePath = path.join("app", "learn", "[subject]", "[concept]", "page.tsx");
const page = fs.readFileSync(pagePath, "utf8");
const block = page.match(/className="lesson-video"[\s\S]*?<\/a>/)?.[0] ?? "";
if (!block) {
  failures.push("the lesson page has no .lesson-video card");
} else {
  if (!/target="_blank"/.test(block)) failures.push(".lesson-video does not open in a new tab");
  if (!/rel="noreferrer noopener"/.test(block)) failures.push(".lesson-video is missing rel=noreferrer noopener");
  if (/<iframe|<embed|youtube\.com\/embed/i.test(block)) failures.push(".lesson-video embeds a third-party player");
  if (!/data-video-scope/.test(block)) failures.push(".lesson-video does not print whether it teaches this idea");
}
if (!/videoFor\(plan\)/.test(page)) failures.push("the lesson page does not resolve the concept-video card");

const twin = fs.readFileSync(path.join("docs", "app.js"), "utf8");
if (!/function lessonVideoHtml\(plan\)/.test(twin)) failures.push("the offline twin has no lessonVideoHtml");
if (!/E\.lessonMedia\.videoFor\(plan\)/.test(twin)) failures.push("the offline twin does not resolve the concept-video card");
if (!/E\.lessonMedia\.videoScopeKey\(v\)/.test(twin)) failures.push("the offline twin does not translate the video scope");

if (!videos.length) failures.push("no lesson has a verified exact-concept video");
if (videos.length >= CONCEPTS.length) {
  failures.push("every lesson claims a concept-specific video; re-check the sources before allowing that claim");
}

if (failures.length) {
  console.error("Media gate failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

const missing = CONCEPTS.length - videos.length;
const languages = [...new Set(videos.map((v) => v.language))];
const captions = videos.reduce((m, v) => {
  m[v.captions] = (m[v.captions] ?? 0) + 1;
  return m;
}, {});
console.log(
  `✓ ${videos.length} exact-concept video links are link-only, each with language ${languages.join(", ")} ` +
    `(captions: ${Object.entries(captions).map(([k, n]) => `${k} ${n}`).join(", ")}), ` +
    `a fallback summary, and a text route that does not need the video. ` +
    `${missing} lessons show no video card rather than an unrelated subject overview.`,
);

// Keep the plans variable type checked even when no plan has a video.
void LESSON_PLANS;
