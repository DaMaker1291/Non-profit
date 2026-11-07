#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE MEDIA GATE — what the lesson is allowed to promise about a video.
//
// The product links OUT to a video. It does not embed a third-party player,
// does not download the media, and does not rehost it. That is a legal decision
// (YouTube's terms permit the embeddable player; they do not permit downloading
// or redistributing; Khan Academy and PhET are non-commercial licences) and a
// product decision (a blocked player leaves a blank box where teaching was
// promised, and a learner on a slow connection pays for a frame they cannot
// watch).
//
// This gate is deliberately about the CLAIM, not about whether a URL happens to
// answer today. It requires every linked video to say:
//   - what language the audio is in;
//   - whether captions are human, automatic, absent or unchecked;
//   - what the video shows, in our own words, so the card still teaches when
//     the link cannot open.
// It also requires the lesson to have a text route (idea paragraphs and a
// usedFor), because a video may never be the only way to learn the concept.
//
// Run: node scripts/media-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();

const { LESSON_PLANS } = require("../.verify/lesson-plans.js");

const CAPTIONS = new Set(["human", "auto", "none", "unknown"]);
const failures = [];
const videos = [];

for (const [conceptId, plan] of Object.entries(LESSON_PLANS)) {
  const video = plan.video;
  if (!video) continue;
  videos.push({ conceptId, ...video });

  let url;
  try {
    url = new URL(video.url);
  } catch {
    failures.push(`${conceptId}: video URL is not a URL (${video.url})`);
    continue;
  }
  if (url.protocol !== "https:") failures.push(`${conceptId}: video is not HTTPS`);
  if (/\/(embed|shorts)\//.test(url.pathname)) failures.push(`${conceptId}: a player/embed URL is not a link`);
  if (/\.(mp4|webm|m3u8)$/i.test(url.pathname)) failures.push(`${conceptId}: a media file is not a link`);
  if (!video.title?.trim()) failures.push(`${conceptId}: video has no title`);
  if (!video.source?.trim()) failures.push(`${conceptId}: video has no source`);
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(video.language ?? "")) {
    failures.push(`${conceptId}: video language is not a BCP-47 tag (${video.language ?? "missing"})`);
  }
  if (!CAPTIONS.has(video.captions)) {
    failures.push(`${conceptId}: caption status must be human|auto|none|unknown (${video.captions ?? "missing"})`);
  }
  if ((video.summary ?? "").trim().length < 40) {
    failures.push(`${conceptId}: the video needs a fallback summary of at least 40 characters`);
  }
  if (!Array.isArray(plan.idea) || plan.idea.length < 3 || !plan.usedFor?.trim()) {
    failures.push(`${conceptId}: a video is present but the lesson has no substantial text route`);
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
}

if (!videos.length) failures.push("no lesson carries a video");

if (failures.length) {
  console.error("Media gate failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

const languages = [...new Set(videos.map((v) => v.language))];
const captions = videos.reduce((m, v) => {
  m[v.captions] = (m[v.captions] ?? 0) + 1;
  return m;
}, {});
console.log(
  `✓ ${videos.length} external video links are link-only, each with language ${languages.join(", ")} ` +
    `(captions: ${Object.entries(captions).map(([k, n]) => `${k} ${n}`).join(", ")}), ` +
    "a fallback summary, and a text route that does not need the video.",
);
