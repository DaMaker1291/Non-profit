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
// EVERY LESSON MUST HAVE A CARD. Five concepts have an authored, verified
// concept video. The other plans used to render no video at all, which left the
// learner to guess whether media existed. They now fall back to a subject
// overview in lib/lesson-media.ts, marked `scope: "subject"`, so the card never
// pretends it teaches the exact idea.
//
// This gate is about the CLAIM, not about whether a URL answers today. It
// requires every linked video to say:
//   - what language the audio is in;
//   - whether captions are human, automatic, absent or unchecked;
//   - what the video shows, in our own words, so the card still teaches when
//     the link cannot open;
//   - whether it is concept-specific or a subject overview.
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
const { videoFor, videoScopeLabel } = require("../.verify/lesson-media.js");

const CAPTIONS = new Set(["human", "auto", "none", "unknown"]);
const failures = [];
const videos = [];
let conceptVideos = 0;
let subjectVideos = 0;

for (const concept of CONCEPTS) {
  const plan = planFor(concept.id);
  if (!plan) {
    failures.push(`${concept.id}: no lesson plan, so no video can be resolved`);
    continue;
  }
  const video = videoFor(plan);
  if (!video) {
    failures.push(`${concept.id}: every lesson must resolve a video card`);
    continue;
  }
  videos.push({ conceptId: concept.id, ...video });
  if (video.scope === "concept") conceptVideos += 1;
  else if (video.scope === "subject") subjectVideos += 1;
  else failures.push(`${concept.id}: video scope must be concept|subject`);

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
  if (!videoScopeLabel(video).trim()) failures.push(`${concept.id}: the video needs a visible scope label`);
  if (video.scope === "subject" && !/subject overview/i.test(video.summary ?? "")) {
    failures.push(`${concept.id}: a subject overview must say so in its summary`);
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
  if (!/data-video-scope/.test(block)) failures.push(".lesson-video does not print whether it is a subject overview");
}
if (!/videoFor\(plan\)/.test(page)) failures.push("the lesson page does not resolve the universal video card");

const twin = fs.readFileSync(path.join("docs", "app.js"), "utf8");
if (!/function lessonVideoHtml\(plan\)/.test(twin)) failures.push("the offline twin has no lessonVideoHtml");
if (!/E\.lessonMedia\.videoFor\(plan\)/.test(twin)) failures.push("the offline twin does not resolve the universal video card");

if (!videos.length) failures.push("no lesson carries a video");
if (!conceptVideos) failures.push("no lesson has a concept-specific video");
if (!subjectVideos) failures.push("no lesson has an explicitly labelled subject overview");
if (conceptVideos + subjectVideos !== CONCEPTS.length) {
  failures.push(`video scopes cover ${conceptVideos + subjectVideos} of ${CONCEPTS.length} lessons`);
}

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
  `✓ ${videos.length} external video links are link-only ` +
    `(${conceptVideos} concept-specific, ${subjectVideos} subject overviews explicitly labelled), ` +
    `each with language ${languages.join(", ")} ` +
    `(captions: ${Object.entries(captions).map(([k, n]) => `${k} ${n}`).join(", ")}), ` +
    "a fallback summary, and a text route that does not need the video.",
);