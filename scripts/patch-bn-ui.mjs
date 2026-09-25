// One-shot: the Bengali UI tier. Bengali shipped with the full content tier
// (concept titles, blurbs, misconception names) and the native tutor/hint
// engines, but its UI dictionary was never completed — 242 keys fell back to
// English at render time. This authors all of them and appends them to the bn
// block. Reports any key it could not place, so nothing silently stays English.
import fs from "node:fs";

const BN = {
  // ── access / offline ────────────────────────────────────────────────
  "access.noSpeech": "এই ডিভাইসে পড়ে শোনানোর ইঞ্জিন নেই।",
  "access.noVoice": "আপনার ভাষার কোনো কণ্ঠ এখনো ইনস্টল নেই — সম্ভব হলে বোতামগুলো অন্য কণ্ঠে পড়বে।",
  "offline.bar": "আপনি অফলাইনে আছেন। সমস্যা নেই — পড়তে থাকুন। আবার যুক্ত হলে মূল্যায়ন চলবে।",

  // ── starter (don't know how to begin) ───────────────────────────────
  "starter.open": "কীভাবে শুরু করবেন বুঝতে পারছেন না?",
  "starter.title": "চলুন শুরু করা যাক",
  "starter.unavailable": "এই প্রশ্নের জন্য শুরুর সাহায্য নেই।",
  "starter.askGoal": "প্রথমে: প্রশ্নটি আপনাকে কী খুঁজতে বলছে? নিজের ভাষায় বলুন।",
  "starter.placeholderGoal": "যেমন x² + y²-এর মান",
  "starter.askGivens": "ভালো। এখন: প্রশ্ন থেকে আপনি কী জানতে পারছেন?",
  "starter.placeholderGivens": "যেমন x + y = 17 এবং xy = 60",
  "starter.askBridge": "কোন ধারণাটি আপনার জানা তথ্যের সঙ্গে প্রয়োজনীয় তথ্যকে যুক্ত করে?",
  "starter.bridgeIs": "সেতুটি হলো",
  "starter.firstMove": "প্রথম পদক্ষেপ:",
  "starter.yours": "প্রথম পদক্ষেপটি আপনাকেই নিতে হবে — বাকিটা এমনিতেই আসবে।",
  "starter.noBridge": "এই প্রশ্নে আলাদা কোনো সংযোগকারী ধারণা নেই — যা জানেন সেখান থেকেই শুরু করুন।",

  // ── micro-diagnostic (conceptual vs procedural) ─────────────────────
  "micro.eyebrow": "ক্ষুদ্র পরীক্ষা · কেন এটি বারবার ঘটছে",
  "micro.question": "মূল ধারণার একটি দ্রুত পরীক্ষা:",
  "micro.conceptual": "ধারণাগত",
  "micro.conceptualNote": "এই বিষয়টি বোঝার আগে ধারণাটিই ঠিক করতে হবে — সেটিই আমরা কাজ করব।",
  "micro.procedural": "প্রক্রিয়াগত",
  "micro.proceduralNote": "ধারণাটি আপনার জানা আছে; প্রয়োগের সময় ভুল হচ্ছে। আরও সতর্ক অনুশীলনে এটি ঠিক হবে।",
  "micro.resolved": "পরিষ্কার — ঠিক করার মতো কোনো প্যাটার্ন নেই।",
  "solve.nextEyebrow": "আজকের কাজের ভিত্তিতে",
  "solve.nextCta": "এবার এটি শিখুন",

  // ── teacher plan ────────────────────────────────────────────────────
  "plan.title": "এই সপ্তাহের পরিকল্পনা",
  "plan.groups": "মিশ্র সামর্থ্যের দল (বৃহস্পতিবার)",
  "plan.group": "দল",
  "plan.scaffold": "আগে সহায়ক ধাপ দরকার",
  "plan.print": "অফলাইন প্যাক প্রিন্ট করুন",
  "plan.export": "ডেটা রপ্তানি (JSON)",

  // ── offline packs ───────────────────────────────────────────────────
  "pack.day0": "সোমবার",
  "pack.day1": "মঙ্গলবার",
  "pack.day2": "বুধবার",
  "pack.day3": "বৃহস্পতিবার",
  "pack.day4": "শুক্রবার",
  "pack.explain": "ব্যাখ্যা",
  "pack.diagnose": "রোগনির্ণয়",
  "pack.practice": "অনুশীলন",
  "pack.activity": "দলগত কাজ",
  "pack.mastery": "দক্ষতা পরীক্ষা",
  "pack.coaching": "প্রশিক্ষণ নোট:",
  "pack.weekOf": "সপ্তাহ শুরু",
  "pack.offlineNote": "যুক্ত থাকতে একবার ডাউনলোড করুন — প্যাকটি ছাপা যায় ও ইন্টারনেট ছাড়াই কাজ করে।",
  "pack.noData": "এখনো কোনো শিক্ষার্থীর তথ্য নেই — এই পরিকল্পনা শুরু থেকেই পাঠ্যক্রম অনুসরণ করে। মঙ্গলবারের রোগনির্ণয় আপনার ক্লাস অনুযায়ী এটি সাজাবে।",
  "pack.planTitle": "এক নজরে সপ্তাহ",
  "pack.lessonsTitle": "পাঠ",
  "pack.keyTitle": "উত্তরপত্র",

  // ── the wedge: "stuck on a question?" ───────────────────────────────
  "solve.eyebrow": "একটি প্রশ্নে আটকে গেছেন?",
  "solve.title": "সমাধান করতে পারছেন না এমন প্রশ্ন আছে?",
  "solve.lead": "এখানে লিখুন বা পেস্ট করুন। কোন ধারণাটি পরীক্ষা করছে তা বের করব, বুঝিয়ে দেব, আর আপনি সত্যিই বুঝেছেন কি না যাচাই করব — বিনামূল্যে, অ্যাকাউন্ট ছাড়াই।",
  "solve.placeholder": "যেমন 3x + 5 = 20 সমাধান করুন … বা কোথায় আটকে গেছেন তা লিখুন",
  "solve.match": "আমার কী দরকার তা বের করুন",
  "solve.noAccount": "অ্যাকাউন্ট নেই। সাইন-আপ নেই। প্রতিটি উত্তর আপনারই থাকে।",
  "solve.found": "এই প্রশ্নটি পরীক্ষা করছে",
  "solve.prove": "আমি বুঝেছি তা প্রমাণ করি",
  "solve.stuck": "আমি এখনো আটকে আছি",
  "solve.lesson": "পাঠটি খুলুন",
  "solve.unsureTitle": "আমি নিশ্চিত নই",
  "solve.unsureLead": "এগুলো কি এর একটি? না হলে টিউটরকে জিজ্ঞেস করুন বা বিষয়গুলো দেখুন।",
  "solve.proveEyebrow": "প্রমাণ করুন",
  "solve.proveTitle": "একটি প্রশ্ন। না চাইলে কোনো ইঙ্গিত নেই।",
  "solve.nailed": "আপনি পেরেছেন",
  "solve.notYet": "এখনো নয়",
  "solve.masteredCta": "আমি এটি বুঝেছি",
  "solve.masteredEyebrow": "আয়ত্ত হয়েছে",
  "solve.masteredTitle": "আপনি প্রমাণ করেছেন যে এটি বুঝেছেন",
  "solve.masteredLead": "আপনি এটির একটি নতুন প্রশ্ন সমাধান করেছেন",
  "solve.challengeFriend": "বন্ধুকে চ্যালেঞ্জ করুন",
  "solve.keepGoing": "অনুশীলন চালিয়ে যান",
  "solve.teachPrompt": "এখন আপনি এটি বুঝেছেন। অন্য কাউকে সাহায্য করতে চান?",
  "solve.teachCta": "একটি স্টাডি প্যাক লিখুন",
  "solve.another": "আরেকটি প্রশ্ন",
  "solve.cta": "আমার প্রশ্ন সমাধান করুন",

  // ── learning link (/try) ────────────────────────────────────────────
  "try.eyebrow": "শেখার লিংক",
  "try.title": "এটি সমাধান করতে পারবেন?",
  "try.learnMore": "এই ধারণাটি শিখুন",
  "try.fixIt": "চলুন এটি ঠিক করি",
  "try.again": "আরেকটি চেষ্টা করুন",

  // ── coaching / flare ────────────────────────────────────────────────
  "coach.noticed": "আমি একটি বিষয় লক্ষ্য করেছি।",
  "coach.misconception": "আপনি একই \u201c{name}\u201d ভুল কয়েকবার করেছেন।",
  "coach.fixIt": "চলুন ঠিক করি",

  // ── intents / teaching ──────────────────────────────────────────────
  "intent.code": "কোড শিখুন",
  "intent.competition": "প্রতিযোগিতা",
  "intent.life": "জীবনের জন্য শিখুন",
  "teach.misconceptions": "সাধারণ ভুল ধারণা",

  // ── retention / weak links / confidence ─────────────────────────────
  "retention.title": "পুনরালোচনার জন্য প্রস্তুত",
  "retention.sub": "আগে এগুলোর সঠিক উত্তর দিয়েছিলেন। এখন একবার দেখে নিন — আজ, পরের সপ্তাহে, পরের মাসে — এতেই এগুলো মনে থাকবে।",
  "retention.review": "পুনরালোচনা",
  "weak.title": "আপনার দুর্বল জায়গা",
  "weak.lowMastery": "কম দক্ষতা",
  "weak.fading": "মিলিয়ে যাচ্ছে",
  "weak.misconception": "ভুল ধারণা",
  "weak.lowConfidence": "কম আত্মবিশ্বাস",
  "prog.confidence": "আত্মবিশ্বাস",
  "path.prerequisite": "আগে আবার দেখুন",
  "path.learn": "পাঠটি পড়ুন",
  "path.master": "দক্ষতা পরীক্ষা",

  // ── about / brand ───────────────────────────────────────────────────
  "about.chaptersBody": "৫ জন শিক্ষার্থী + ১ জন পরামর্শদাতা + একটি ফোন। একটি শুরু করুন, OpenMind আপনাকে পাঠ্যক্রম, সরঞ্জাম ও নেটওয়ার্ক দেবে।",
  "brand.tagline": "প্রতিটি শিক্ষার্থীর জন্য বিশ্বমানের শিক্ষক — বিনামূল্যে, চিরকাল।",

  // ── nav / home ──────────────────────────────────────────────────────
  "nav.how": "কীভাবে কাজ করে",
  "nav.subjects": "বিষয়",
  "nav.rooms": "স্টাডি রুম",
  "home.cta2": "নলেজ জিনোম ঘুরে দেখুন",
  "home.free": "১০০% বিনামূল্যে",
  "home.offline": "সার্ভারে মূল্যায়িত অনুশীলন",
  "home.languages": "১৫টি ভাষা",
  "home.openSource": "ওপেন সোর্স",
  "home.tryCaption": "OpenMind-এর প্রতিটি প্রশ্ন নতুন করে তৈরি ও সৎভাবে মূল্যায়িত — ভুল উত্তর ৪৩টি পরিচিত ভুল-ধারণার নমুনার সঙ্গে মেলানো হয়।",
  "home.tryLink": "সম্পূর্ণ রোগনির্ণয় করুন →",
  "home.chaptersTitle": "চ্যাপ্টার",
  "home.chaptersLine": "৫ জন শিক্ষার্থী + ১ জন পরামর্শদাতা + একটি ফোন।",

  // ── how it works ────────────────────────────────────────────────────
  "how.title": "রোগনির্ণয়। শেখা। প্রমাণ।",
  "how.p1": "একটি সংক্ষিপ্ত অভিযোজিত রোগনির্ণয় আপনার প্রকৃত জ্ঞান মাপে — সিলেবাস যা ধরে নেয় তা নয়। এটি প্রতিটি ধারণায় কঠিনতার সিঁড়ি বেয়ে ওঠে, তাই দক্ষ শিক্ষার্থীরা দ্রুত শেষ করে আর দুর্বলরা কখনো সাধ্যের বাইরে পরীক্ষিত বোধ করে না।",
  "how.p2": "প্রতিটি পাঠ শুধু ধাপ নয়, ধারণাটি শেখায়। অনুশীলন অসীম ও নতুন করে তৈরি, আর প্রতিটি ভুল উত্তর ৪৩টি পরিচিত ভুল-ধারণার নমুনার সঙ্গে মেলানো হয় — তাই কেন ভুল হলো তাও জানতে পারেন, শুধু ভুল হয়েছে তা নয়।",
  "how.p3": "আপনার প্রমাণ: প্রতি ধারণায় দক্ষতা, সময়ের সঙ্গে কমতে থাকা ভুল ধারণা, আর ধারাবাহিকতা দেখানো স্ট্রিক। শিক্ষক ও চ্যাপ্টাররা যার উপর গড়ে তুলতে পারে এমন রপ্তানিযোগ্য অগ্রগতি।",
  "how.diagnose": "রোগনির্ণয়",
  "how.learn": "শিখুন",
  "how.prove": "প্রমাণ",

  // ── onboarding ──────────────────────────────────────────────────────
  "onb.age": "বয়স",
  "onb.teachingLang": "শেখানোর ভাষা (ব্যাখ্যা)",
  "onb.understandLang": "আমি ভালো বুঝি",
  "onb.schoolLang": "আমার স্কুল ব্যবহার করে (পদগুলো রাখবো)",
  "onb.answerLang": "উত্তরের ভাষা (আমি উত্তর দিই)",
  "onb.goal": "আপনার লক্ষ্য",
  "onb.subjects": "আপনি যে বিষয়গুলো চান",
  "onb.goalPh": "যেমন আমি ইঞ্জিনিয়ার হতে চাই",

  // ── dashboard ───────────────────────────────────────────────────────
  "dashboard.title": "ড্যাশবোর্ড",
  "dash.continue": "আপনার পথ চালিয়ে যান",
  "dash.diagnose": "রোগনির্ণয় করুন",
  "dash.recommended": "পরবর্তী প্রস্তাব",
  "dash.rooms": "স্টাডি রুম",
  "dash.genome": "জিনোম মানচিত্র",
  "dash.language": "ভাষা",

  // ── diagnostic ──────────────────────────────────────────────────────
  "diag.title": "অভিযোজিত রোগনির্ণয়",
  "diag.sub": "প্রতি ধারণায় কয়েকটি প্রশ্ন। ভুল উত্তর কাজে লাগে — এগুলো ভুল ধারণা প্রকাশ করে।",
  "diag.next": "পরবর্তী প্রশ্ন",
  "diag.skip": "ধারণাটি এড়িয়ে যান",
  "diag.done": "রোগনির্ণয় শেষ করুন",
  "diag.working": "রোগনির্ণয় চলছে…",
  "diag.q1": "প্রশ্ন",

  // ── learning map / plan ─────────────────────────────────────────────
  "res.title": "আপনার শেখার মানচিত্র",
  "res.strengths": "শক্তি",
  "res.gaps": "পূরণ করার ঘাটতি",
  "res.misconceptions": "শনাক্ত ভুল ধারণা",
  "res.plan": "আপনার ব্যক্তিগত পথ",
  "res.startPlan": "প্রথম ধাপ দিয়ে শুরু করুন",
  "res.retest": "পরে আবার পরীক্ষা করুন",
  "map.title": "নলেজ জিনোম",
  "map.sub": "প্রতিটি ধারণা পূর্বশর্তসহ একটি নোড। যেখান থেকেই ঢুকুন — গ্রাফ আপনার পথ খুঁজে দেবে।",
  "map.gaps": "পূরণ করার ঘাটতি",
  "map.strengths": "শক্তি",
  "map.concepts": "ধারণা",
  "map.root": "মূল — যার উপর গড়ার কিছু নেই",

  // ── learn surface ───────────────────────────────────────────────────
  "learn.lesson": "পাঠ",
  "learn.hint": "ইঙ্গিত",
  "learn.correct": "সঠিক",
  "learn.wrong": "এখনো নয়",
  "learn.explain": "ব্যাখ্যা",
  "learn.streak": "স্ট্রিক",
  "learn.ask": "টিউটরকে জিজ্ঞেস করুন",
  "learn.socratic": "সক্রেটিক মোড — টিউটর পথ দেখায়, কখনো বলে দেয় না",
  "learn.generate": "নতুন প্রশ্ন",
  "learn.back": "পিছনে",
  "learn.misconceptions": "ভুল ধারণা",
  "learn.attempts": "চেষ্টা",
  "learn.nextQ": "পরবর্তী প্রশ্ন",
  "learn.notFound": "ধারণাটি পাওয়া যায়নি",

  // ── rooms ───────────────────────────────────────────────────────────
  "rooms.title": "OpenMind স্টাডি রুম",
  "rooms.sub": "একসঙ্গে শিখুন। একটি রুম ছোট ক্লাসের মতো: একটিমাত্র ধারণা, কয়েকজন বন্ধু, আর কোণে একজন সক্রেটিক টিউটর। রুমগুলো ওপেন-সোর্স কোডের মতো ফর্ক হয়।",
  "rooms.name": "রুমের নাম",
  "rooms.join": "যোগ দিন",
  "rooms.send": "পাঠান",
  "rooms.members": "সদস্য",
  "rooms.fork": "এই রুম ফর্ক করুন",
  "rooms.empty": "এখনো কোনো রুম নেই — আপনার ভাষায় প্রথমটি তৈরি করুন।",
  "rooms.tutorNote": "টিউটর শুধু পথ দেখানো প্রশ্ন দেয়, কখনো সরাসরি উত্তর নয়।",
  "rooms.hello": "একটি হ্যালো বলুন — যে কেউ জিজ্ঞেস করলে টিউটর সাহায্য করবে।",

  // ── teacher tools ───────────────────────────────────────────────────
  "teach.title": "শিক্ষকের সরঞ্জাম",
  "teach.sub": "একটি ক্লাস তৈরি করুন, জয়েন কোড শেয়ার করুন, এবং প্রতি ধারণায় দক্ষতা দেখুন — ডিজাইনেই নাম-পরিচয় ছাড়া। একটি শেয়ার করা ডিভাইসে বা ত্রিশটিতে কাজ করে।",
  "teach.name": "ক্লাসের নাম",
  "teach.roster": "ক্লাসের তালিকা",
  "teach.avg": "ক্লাসের গড়",
  "teach.students": "শিক্ষার্থী",
  "teach.concepts": "নির্ধারিত ধারণা",
  "teach.invite": "জয়েন কোড",
  "teach.empty": "এখনো কোনো শিক্ষার্থী নেই — কোডটি শেয়ার করুন।",
  "teach.createHint": "শিক্ষার্থীরা কোড দিয়ে যোগ দেয় — ইমেল নেই, অ্যাকাউন্ট নেই, শেয়ার করা ডিভাইসেও কাজ করে।",
  "teach.joinHint": "শিক্ষার্থীরা: তালিকায় আসতে আপনার ক্লাস কোড লিখুন (শুধু হ্যান্ডেল)।",
  "teach.focus": "ফোকাস",

  // ── tutor ───────────────────────────────────────────────────────────
  "tutor.title": "টিউটর",
  "tutor.sub": "এই ধারণা সম্পর্কে যা খুশি জিজ্ঞেস করুন — টিউটর প্রশ্ন দিয়ে পথ দেখায়, কখনো উত্তর দেয় না।",
  "tutor.you": "আপনি",
  "tutor.ph": "টিউটরকে জিজ্ঞেস করুন…",
  "tutor.aiNote": "AI মোড: একটি API কী সেট করা আছে, তাই টিউটর এই ধারণা নিয়ে স্বাধীনভাবে যুক্তি করে।",
  "tutor.offlineNote": "সক্রেটিক মোড: যেকোনো সংযোগে, অফলাইনেও কাজ করে। টিউটর পথ দেখায়, বলে দেয় না।",
  "tutor.err": "টিউটর সার্ভারে পৌঁছাতে পারেনি। আপনার সংযোগ দেখে আবার চেষ্টা করুন।",

  // ── progress / evidence ─────────────────────────────────────────────
  "prog.nav": "আমার প্রমাণ",
  "prog.title": "আপনার প্রমাণ",
  "prog.sub": "এখানে সবকিছু আপনার প্রকৃত উত্তরের ভিত্তিতে গণনা করা — কোনো অনুমান নেই, কোনো কৃত্রিম তথ্য নেই।",
  "prog.empty": "এখনো কিছু নথিভুক্ত হয়নি। একটি রোগনির্ণয় করুন বা কয়েকটি অনুশীলন প্রশ্নের উত্তর দিন, আপনার প্রমাণ এখানে গড়ে উঠবে।",
  "prog.attempts": "নথিভুক্ত উত্তর",
  "prog.accuracy": "প্রথম চেষ্টার নির্ভুলতা",
  "prog.recurring": "বারবার",
  "prog.seenOnce": "একবার দেখা",
  "prog.mastery": "প্রতি ধারণায় দক্ষতা",
  "prog.recent": "সাম্প্রতিক উত্তর",
  "prog.gainPts": "পয়েন্ট অর্জিত",
  "prog.gainHint": "আপনার অগ্রগতি মাপতে আবার রোগনির্ণয় করুন।",

  // ── study packs ─────────────────────────────────────────────────────
  "pack.title": "স্টাডি প্যাক",
  "pack.none": "এখনো কোনো প্যাক নেই — এই ধারণার জন্য প্রথম নোটটি লিখুন।",
  "pack.add": "একটি প্যাক যোগ করুন",
  "pack.fork": "ফর্ক",
  "pack.helpful": "সহায়ক",
  "pack.phTitle": "প্যাকের শিরোনাম",
  "pack.phBody": "একজন বন্ধুর কী জানা দরকার? একটি কৌশল, একটি সতর্কতা, আপনার ভাষা…",
  "pack.forkOf": "এর ফর্ক",

  // ── goal / path ─────────────────────────────────────────────────────
  "goal.title": "আপনার লক্ষ্য",
  "goal.step": "ধাপ",
  "goal.now": "এখন",
  "goal.done": "সম্পন্ন",
  "goal.none": "আপনার পথ তৈরি করতে গণিতের একটি রোগনির্ণয় করুন।",
  "path.practice": "অনুশীলন",

  // ── about ───────────────────────────────────────────────────────────
  "about.title": "OpenMind সম্পর্কে",
  "about.mission": "দেশ বা আয় নির্বিশেষে প্রতিটি শিক্ষার্থীর কাছে বিশ্বের সবচেয়ে সুবিধাভোগী শিক্ষার্থীদের মতো মানসম্মত শেখার সহায়তা থাকা উচিত। OpenMind সেই লক্ষ্যের বিনামূল্যে, ওপেন-সোর্স ভিত্তি: পাঠ্যক্রম, টিউটর, রোগনির্ণয় ও নেটওয়ার্ক।",
  "about.license": "MIT লাইসেন্সে প্রকাশিত। ফর্ক করুন, অনুবাদ করুন, স্কুলের সার্ভারে চালান, ডিপ্লয়মেন্টে আপনার মন্ত্রণালয়ের নাম বসান।",
  "about.contribute": "অবদান রাখুন: পাঠ, প্রশ্ন, অনুবাদ ও ভুল-ধারণার নমুনা সবই সাধারণ ডেটা ফাইল — আপনার প্রথম পুল রিকোয়েস্ট কাউকে পড়তে শেখাতে পারে।",
  "about.chapters": "চ্যাপ্টার: ৫ জন শিক্ষার্থী + ১ জন পরামর্শদাতা + একটি ফোন। একটি শুরু করুন, OpenMind আপনাকে পাঠ্যক্রম, সরঞ্জাম ও নেটওয়ার্ক দেবে।",
  "about.contributeTitle": "অবদান রাখুন",
  "about.privacyTitle": "গোপনীয়তা",
  "about.licenseTitle": "লাইসেন্স",
  "about.privacyBody": "ইমেল নেই, ফোন নম্বর নেই, আসল নাম নেই। একটি হ্যান্ডেল, ঐচ্ছিক দেশ, আর আপনার নিজের থাকা শেখার তথ্য। নিজেই হোস্ট করলে তথ্য কখনো আপনার স্কুল ছেড়ে যায় না।",
  "about.genomeTitle": "নলেজ জিনোম",
  "about.genomeBody": "প্রতিটি ধারণা পূর্বশর্তসহ একটি নোড: ভগ্নাংশ → বীজগণিত → সমীকরণ → ফাংশন → ক্যালকুলাস → পদার্থবিজ্ঞান ও প্রকৌশল। রোগনির্ণয় আপনাকে গ্রাফে বসায়; পথ-ইঞ্জিন আপনার সঙ্গে হাঁটে। পাঠ, প্রশ্ন, অনুবাদ ও ভুল-ধারণার নমুনা সবই সাধারণ ডেটা ফাইল — কমিউনিটি উইকিপিডিয়ার মতো জিনোম বাড়াতে পারে।",

  // ── common ──────────────────────────────────────────────────────────
  "common.subject": "বিষয়",
  "common.stage": "পর্যায়",
  "common.prereqs": "যার উপর গড়া",
  "common.you": "আপনি",
  "common.close": "বন্ধ করুন",
  "common.retry": "আবার চেষ্টা করুন",

  // ── footer ──────────────────────────────────────────────────────────
  "footer.noAccounts": "কোনো অ্যাকাউন্ট নেই",
  "brand.rail": "OpenMind · অনুশীলন বই · বিনামূল্যে",
  "footer.brand": "চিরকাল বিনামূল্যে, ওপেন সোর্স (MIT)।",
};

const src = fs.readFileSync("lib/i18n.ts", "utf8");
const declRe = /^(?:export )?const (\w+): Dict = \{$/gm;
let start = -1, end = -1, d;
while ((d = declRe.exec(src))) {
  if (d[1] === "bn") { start = d.index; break; }
}
if (start < 0) { console.error("bn dictionary not found"); process.exit(1); }
// The bn block closes with an indented `  };` — match the first line that is
// just a closing brace (any indentation), not the top-level objects below it.
const rel = src.slice(start).match(/\n[ \t]*\};/);
if (!rel) { console.error("bn closing brace not found"); process.exit(1); }
end = start + rel.index;

const block = src.slice(start, end);
const existing = new Set([...block.matchAll(/"([a-zA-Z0-9._-]+)":/g)].map((m) => m[1]));
const missing = Object.keys(BN).filter((k) => !existing.has(k));
const dupes = Object.keys(BN).filter((k) => existing.has(k));

const lines = Object.entries(BN)
  .filter(([k]) => !existing.has(k))
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);

if (!lines.length) { console.log("bn already complete — nothing to add"); process.exit(0); }

const out = src.slice(0, end) + "\n  // ── UI tier (authored for Bengali) ──\n" + lines.join("\n") + src.slice(end);
fs.writeFileSync("lib/i18n.ts", out);

console.log(`added ${lines.length} Bengali UI keys`);
if (dupes.length) console.log(`already present (${dupes.length}):`, dupes.join(", "));
