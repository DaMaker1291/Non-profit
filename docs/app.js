/* OpenMind — the static build's application.
 *
 * This is the loop the server runs, run in a browser: an answer becomes an
 * evidence event, the event is appended to an append-only ledger, the learner
 * model is REPLAYED from that ledger, and the next action comes from the one
 * decision door. No step is skipped and no shortcut is taken — the difference
 * from the deployment is only WHO holds the ledger:
 *
 *   server build   route handler holds the ledger and the answer key
 *   this build     your browser holds both, because there is no server
 *
 * That difference is stated to the learner (footer, and the access page) rather
 * than hidden. It is the one thing a static host cannot provide: a client that
 * grades itself and keeps its own history is self-reported evidence.
 */
(function () {
  "use strict";

  var E = window.OpenMindEngine;
  var root = document.getElementById("view");

  if (!E) {
    root.innerHTML = "<p>This build could not load its engine. Reload the page; if it persists, the published bundle is incomplete.</p>";
    return;
  }

  var DB_KEY = "openmind.static.v1";
  var DRAW_ATTEMPTS = 40;

  // ── Storage ───────────────────────────────────────────────────────────────
  // One device, one learner, one blob. The LEDGER is the engine's own
  // in-memory store (lib/ledger.ts), hydrated from that blob and dumped back
  // after every append — so the idempotence rule is the engine's, not a copy of
  // it written in HTML.

  function load() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (!raw) return { ledgers: {}, profiles: {}, ui: { lang: "en", learnerId: null } };
      var parsed = JSON.parse(raw);
      return {
        ledgers: parsed.ledgers || {},
        profiles: parsed.profiles || {},
        ui: parsed.ui || { lang: "en", learnerId: null },
      };
    } catch (e) {
      return { ledgers: {}, profiles: {}, ui: { lang: "en", learnerId: null } };
    }
  }

  var db = load();
  var LEDGER = E.ledger.memoryLedger(db.ledgers);

  function save() {
    db.ledgers = LEDGER.dump();
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      /* A full or blocked storage means the next answer is not durable, and the
         answer path says so instead of pretending it was recorded. */
      return false;
    }
    return true;
  }

  // ── Language ──────────────────────────────────────────────────────────────

  function lang() {
    return db.ui.lang || "en";
  }
  function t(key) {
    return E.i18n.translator(lang())(key);
  }
  function fill(s, vars) {
    return E.i18n.fill(String(s == null ? "" : s), vars || {});
  }
  function ctitle(id) {
    return E.contentI18n.ctitle(lang(), id);
  }
  /** A key's text, or "" when NO dictionary defines it. The translator renders a
   *  key nobody defines as its own name, which is a fine development signal and
   *  a bad thing to show a learner — so surfaces ask this first. */
  function maybe(key) {
    var s = t(key);
    return s === key ? "" : s;
  }

  // ── The learner ───────────────────────────────────────────────────────────

  function me() {
    var id = db.ui.learnerId;
    return id ? db.profiles[id] || null : null;
  }
  function saveProfile(state) {
    db.profiles[state.profile.id] = state;
    save();
  }
  function profileId() {
    return db.ui.learnerId;
  }
  function subjectOf() {
    var st = me();
    var list = (st && st.profile.subjects) || [];
    return list[0] || "maths";
  }
  function activeSpec(subject) {
    var st = me();
    return E.specifications.specForProfile(st.profile, subject || subjectOf());
  }

  /** The learner's ledger, as the decision door wants it. */
  function events() {
    return LEDGER.read(profileId());
  }

  /** THE ONE DOOR. Every "what next?" on this page comes through here.
   *
   *  `tt` is not decoration: the engine composes its reason, its "why now" and
   *  its expected outcome from i18n keys, and without a translator it falls back
   *  to its own English table — which is how a learner reading Arabic gets an
   *  Arabic interface around an English recommendation. The server passes the
   *  learner's language here too; this build passes the interface language it is
   *  actually rendering in. */
  function decide(max) {
    var st = me();
    var ev = events();
    var ctx = E.decision.decisionContext(st, ev);
    return E.decision.decide(ctx, { max: max || 4, title: ctitle, tt: E.i18n.translator(lang()) });
  }

  function projection() {
    return E.evidence.projectLearner(events());
  }

  // ── Course, concepts, served questions ───────────────────────────────────

  function hasQuestions(conceptId) {
    return E.questions.hasGenerator(conceptId);
  }

  function coursesFor(subject) {
    var st = me();
    return E.specifications.specOptionsFor(st.profile.country || "XX", subject);
  }

  function board() {
    var st = me();
    return st.profile.board;
  }

  /** The concept list a learner actually sees, for one subject: the ideas their
   *  course covers, each marked with whether questions exist for it. Nothing is
   *  hidden and nothing is invented — a concept with no bank is shown as having
   *  no questions rather than being quietly dropped or faked. */
  function conceptList(subject) {
    var active = activeSpec(subject);
    var covered = E.specifications.coverageOf(active);
    var inCourse = covered.filter(function (c) { return c.subject === subject; });
    var list = inCourse.length ? inCourse : E.genome.bySubject(subject);
    return list.map(function (c) {
      return { id: c.id, title: ctitle(c.id), blurb: E.contentI18n.cblurb(lang(), c.id), stage: c.stage, ready: hasQuestions(c.id) };
    }).sort(function (a, b) { return a.stage - b.stage || a.title.localeCompare(b.title); });
  }

  function subjectsInGenome() {
    var out = [];
    E.genome.CONCEPTS.forEach(function (c) { if (out.indexOf(c.subject) < 0) out.push(c.subject); });
    return out;
  }

  /** Practice difficulty: the tier is the anchor, the learner's own record moves
   *  the rung. The same rule the server's serve action uses, so a learner sees
   *  the same item either way. */
  function serveTarget(conceptId) {
    var st = me();
    var concept = E.genome.getConcept(conceptId);
    var active = activeSpec(concept ? concept.subject : undefined);
    var tier = E.specifications.difficultyFor(active);
    var rec = st.progress[conceptId];
    var due = E.retention.isRetentionDue(st, conceptId);
    var target = E.questionBank.practiceTarget({
      tier: tier,
      attempts: (rec && rec.attempts) || 0,
      correct: (rec && rec.correct) || 0,
      streak: (rec && rec.streak) || 0,
      misconceptionHits: rec && rec.misconceptions ? Object.keys(rec.misconceptions).reduce(function (s, k) { return s + rec.misconceptions[k]; }, 0) : 0,
    });
    return { target: target, tier: tier, due: due, aim: due ? tier : target.difficulty };
  }

  function serveQuestion(conceptId) {
    var info = serveTarget(conceptId);
    var seed = "s" + Date.now() + ":" + conceptId + ":" + Math.floor(Math.random() * 1e9);
    var q = E.questions.generateQuestionNear(conceptId, seed, info.aim, DRAW_ATTEMPTS);
    if (!q) return null;
    return { q: q, info: info };
  }

  /** A question reframed through this learner's curriculum vocabulary. */
  function questionText(q) {
    if (lang() !== "en") return q.prompt;
    return E.specifications.applyTerminology(q.prompt, board());
  }
  function explanationText(s) {
    if (lang() !== "en") return s;
    return E.specifications.applyTerminology(s, board());
  }

  // ── The write path: answer → event → append → replay → adopt ────────────

  /** Record one answer. Returns true when the evidence is DURABLY recorded and
   *  the model has moved with it; false when it is not, in which case the model
   *  has not moved either. That is the whole contract. */
  function recordAnswer(opts) {
    var st = me();
    var q = opts.question;
    var ev = E.evidence.answerEvidence({
      learnerId: profileId(),
      at: Date.now(),
      source: opts.source,
      subject: q.subject || (E.genome.getConcept(q.conceptId) || {}).subject || null,
      conceptId: q.conceptId,
      specificationId: st.profile.spec || null,
      questionId: q.id,
      correct: opts.correct,
      chosen: opts.chosen,
      mode: opts.mode,
      hints: opts.hints,
      ms: opts.ms == null ? null : opts.ms,
      tags: q.misconceptionTags || [],
      deviceAt: E.evidence.deviceClaimAt(opts.deviceAt, Date.now()),
    });
    E.ledger.commitAndProject(profileId(), st, [ev], LEDGER);
    if (!save()) {
      // The blob could not be written: the ledger in memory has it, the device
      // does not. Say so rather than implying it is safe.
      toast(t("err.unknown"));
    }
    saveProfile(st);
    return true;
  }

  function recordHint(question) {
    var st = me();
    var ev = E.evidence.hintEvidence({
      learnerId: profileId(),
      at: Date.now(),
      subject: question.subject || null,
      conceptId: question.conceptId,
      specificationId: st.profile.spec || null,
      questionId: question.id,
      level: 1,
    });
    E.ledger.commitAndProject(profileId(), st, [ev], LEDGER);
    save();
    saveProfile(st);
  }

  // ── Small DOM helpers ─────────────────────────────────────────────────────

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) node.setAttribute(k, attrs[k]);
    if (html != null) node.innerHTML = html;
    return node;
  }
  function toast(msg) {
    var n = document.getElementById("toast");
    n.textContent = msg;
    n.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { n.hidden = true; }, 6000);
  }

  // ── Routes ────────────────────────────────────────────────────────────────

  var NAV = [
    ["#/home", "nav.home"],
    ["#/learn", "nav.learn"],
    ["#/curriculum", "nav.currTitle"],
    ["#/evidence", "prog.nav"],
    ["#/access", "nav.accessTitle"],
  ];

  function setNav(route) {
    var nav = document.getElementById("nav");
    nav.innerHTML = NAV.map(function (pair) {
      return '<a href="' + pair[0] + '"' + (route.indexOf(pair[0]) === 0 ? ' aria-current="page"' : "") + ">" + esc(t(pair[1])) + "</a>";
    }).join("");
    var sel = document.getElementById("lang");
    sel.innerHTML = E.i18n.LANGS.map(function (l) {
      return '<option value="' + l.code + '"' + (l.code === lang() ? " selected" : "") + ">" + esc(l.name) + "</option>";
    }).join("");
  }

  function route() {
    var h = location.hash || "#/";
    return h.slice(1) || "/";
  }

  function go(path) {
    location.hash = path;
  }

  function render() {
    var path = route();
    var base = path.split("?")[0];
    var hasProfile = !!me();

    if (base === "/" || base === "") return viewLanding();
    if (base === "/setup") return viewSetup();
    if (!hasProfile) return viewLanding();

    if (base === "/diag") return viewDiagnostic();
    if (base === "/home") return viewHome();
    if (base === "/learn") return viewLearn(query("concept"));
    if (base === "/curriculum") return viewCurriculum(query("subject"));
    if (base === "/evidence") return viewEvidence(query("concept"));
    if (base === "/access") return viewAccess();
    return viewHome();
  }

  function query(name) {
    var q = route().split("?")[1] || "";
    var parts = q.split("&");
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split("=");
      if (kv[0] === name) return decodeURIComponent(kv[1] || "");
    }
    return "";
  }

  // ── The landing page ──────────────────────────────────────────────────────

  function viewLanding() {
    setNav("/");
    var concepts = E.genome.CONCEPTS.length;
    var ready = E.genome.CONCEPTS.filter(function (c) { return hasQuestions(c.id); }).length;
    root.className = "landing";
    root.innerHTML =
      '<h1 style="font-size:2.1rem">' + esc(t("home.heroTitle")) + "</h1>" +
      '<p class="muted" style="max-width:34rem">' + esc(t("home.heroSub")) + "</p>" +
      '<p style="margin:1.25rem 0"><a class="btn primary" href="#/setup">' + esc(t("home.cta")) + "</a></p>" +
      '<div class="note">' + esc(t("sb.note")) + "</div>" +
      '<hr class="rule">' +
      '<div class="section"><p class="eyebrow">' + esc(t("home.subjects")) + "</p>" +
      '<ul class="items">' +
      subjectsInGenome().map(function (s) {
        var inSub = E.genome.bySubject(s);
        var readySub = inSub.filter(function (c) { return hasQuestions(c.id); }).length;
        return '<li><span>' + esc(t("common.subject") + ": " + s) + "</span>" +
          '<span class="meta">' + readySub + " / " + inSub.length + " " + esc(t("home.concepts")) + "</span></li>";
      }).join("") +
      "</ul>" +
      '<p class="small muted" style="margin-top:.6rem">' + ready + " / " + concepts + " " + esc(t("home.concepts")) + "</p>" +
      "</div>";
  }

  // ── Setup ─────────────────────────────────────────────────────────────────

  function viewSetup() {
    setNav("/setup");
    root.className = "";
    var countries = E.i18n.COUNTRIES.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    root.innerHTML =
      "<h1>" + esc(t("onb.setup")) + "</h1>" +
      '<p class="muted">' + esc(t("onb.lead")) + "</p>" +
      '<div class="field"><label for="f-name">' + esc(t("onb.handle")) + "</label><input id=\"f-name\" maxlength=\"24\" placeholder=\"student\"></div>" +
      '<div class="grid2">' +
      '<div class="field"><label for="f-country">' + esc(t("onb.country")) + "</label><select id=\"f-country\">" +
      '<option value="XX">' + esc(t("curr.unmapped")) + "</option>" +
      countries.map(function (c) { return '<option value="' + esc(c.code) + '">' + esc(c.name) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label for="f-grade">' + esc(t("onb.grade")) + "</label><input id=\"f-grade\" maxlength=\"16\" placeholder=\"Year 10\"></div>" +
      "</div>" +
      '<div class="field"><label for="f-subject">' + esc(t("onb.subjects")) + '</label><select id="f-subject" multiple size="5" style="height:auto">' +
      subjectsInGenome().map(function (s) {
        return '<option value="' + esc(s) + '"' + (s === "maths" ? " selected" : "") + ">" + esc(s) + "</option>";
      }).join("") +
      '</select><p class="small muted" id="f-subnote">' + esc(t("onb.subjectsNote")) + "</p></div>" +
      '<div class="field"><label for="f-exam">' + esc(t("onb.examDate")) + "</label><input id=\"f-exam\" type=\"date\"></div>" +
      '<div class="field"><label for="f-time">' + esc(t("onb.timePerDay")) + "</label><input id=\"f-time\" type=\"number\" min=\"5\" max=\"300\" step=\"5\" value=\"30\"></div>" +
      '<p><button class="primary" data-act="create">' + esc(t("onb.start")) + "</button></p>" +
      '<div id="f-courses"></div>';

    // The course per subject, from the country the learner actually chose: a
    // maths-only paper can never be offered as a Biology course.
    var country = document.getElementById("f-country");
    var subj = document.getElementById("f-subject");
    function drawCourses() {
      var chosen = Array.prototype.slice.call(subj.selectedOptions).map(function (o) { return o.value; });
      var host = document.getElementById("f-courses");
      if (!chosen.length) { host.innerHTML = '<p class="small muted" id="f-subnote">' + esc(t("onb.subjectsNote")) + "</p>"; return; }
      host.innerHTML = chosen.map(function (s) {
        // One option per COURSE AND TIER. The tier is not a detail: it chooses
        // the stage window, the difficulty band and the terminology, so it is
        // the learner's own choice here rather than a default nobody sees.
        var options = [];
        E.specifications.specOptionsFor(country.value, s).forEach(function (spec) {
          var levels = spec.levels && spec.levels.length ? spec.levels : [{ id: "" }];
          levels.forEach(function (lv) {
            options.push({
              value: spec.id + "|" + (lv.id || ""),
              label: (spec.name || spec.id) + (lv.id ? " · " + (maybe("lvl." + lv.id) || lv.id) : ""),
            });
          });
        });
        return '<div class="field"><label for="c-' + esc(s) + '">' + esc(t("curr.course")) + " · " + esc(s) + "</label>" +
          '<select id="c-' + esc(s) + '" data-subject="' + esc(s) + '">' +
          options.map(function (o) {
            return '<option value="' + esc(o.value) + '">' + esc(o.label) + "</option>";
          }).join("") +
          "</select></div>";
      }).join("");
    }
    country.addEventListener("change", drawCourses);
    subj.addEventListener("change", drawCourses);
    drawCourses();
  }

  function createProfile() {
    var name = (document.getElementById("f-name").value || "").trim() || "student";
    var country = document.getElementById("f-country").value;
    var grade = (document.getElementById("f-grade").value || "").trim();
    var examDate = document.getElementById("f-exam").value || undefined;
    var time = parseInt(document.getElementById("f-time").value, 10) || 30;
    var subjects = Array.prototype.slice.call(document.getElementById("f-subject").selectedOptions).map(function (o) { return o.value; });
    if (!subjects.length) subjects = ["maths"];

    var id = "learner-" + Math.random().toString(36).slice(2, 10);
    var courses = {};
    subjects.forEach(function (s) {
      var sel = document.getElementById("c-" + s);
      if (!sel || !sel.value) return;
      var parts = sel.value.split("|");
      courses[s] = { spec: parts[0] || undefined, specLevel: parts[1] || undefined };
    });
    var first = courses[subjects[0]] || {};

    var state = E.learnerProfile.newProfileState(id, {
      handle: name,
      country: country,
      language: lang(),
      teachingLang: lang(),
      grade: grade,
      subjects: subjects,
      subjectCourses: courses,
      spec: first.spec,
      specLevel: first.specLevel,
      exam: examDate ? "Exam" : undefined,
      examDate: examDate,
      timePerDay: time,
      onboardedAt: Date.now(),
    });
    db.ui.learnerId = id;
    saveProfile(state);
    go("#/diag");
  }

  // ── The diagnostic ────────────────────────────────────────────────────────

  var diag = null; // { session, last: question|null, at: number, asked: number }

  function viewDiagnostic() {
    setNav("/diag");
    root.className = "";
    if (!diag) {
      var subject = subjectOf();
      var session = E.diagnostic.newDiagnosticSession(subject, "baseline", activeSpec(subject));
      diag = { session: session, last: null, at: Date.now(), asked: 0, subject: subject };
    }
    if (!diag.last) {
      var q = E.diagnostic.nextQuestion(diag.session);
      if (!q) return finishDiagnostic();
      diag.last = q;
    }
    drawQuestion();
  }

  function drawQuestion() {
    var q = diag.last;
    var total = diag.session.concepts.length;
    var done = diag.session.concepts.filter(function (c) { return c.done; }).length;
    var cur = E.diagnostic.currentConcept(diag.session);
    var view = E.questions.serveView(q, lang(), board());
    var prompt = lang() !== "en" ? view.prompt : questionText(q);
    // The count is IDEAS finished, not answers given: "8 / 4 questions" is what
    // a question counter over a concept list reads like, and it is nonsense.
    root.innerHTML =
      '<p class="eyebrow">' + esc(t("diag.title")) + "</p>" +
      '<div class="spread"><h1 style="font-size:1.15rem">' + esc(cur ? ctitle(cur.conceptId) : "") + "</h1>" +
      '<span class="progress-line">' + done + " / " + total + " " + esc(t("home.concepts")) + "</span></div>" +
      '<p class="q">' + esc(prompt) + "</p>" +
      '<div class="choices" id="choices">' +
      view.choices.map(function (c, i) {
        return '<button class="choice" data-act="diag-answer" data-i="' + i + '"><span class="k">' + "ABCD".charAt(i) + "</span><span>" + esc(c) + "</span></button>";
      }).join("") +
      "</div>" +
      '<p><button class="quiet" data-act="diag-skip">' + esc(t("diag.skip")) + "</button> " +
      '<button class="quiet" data-act="diag-finish">' + esc(t("diag.done")) + "</button></p>";
  }

  function answerDiagnostic(choice) {
    var q = diag.last;
    var graded = E.diagnostic.gradeAnswer(diag.session, q.conceptId, q, choice);
    // Measurement: this probe was hint-free, which is why it records both that
    // it is diagnostic evidence and that it is independent evidence.
    recordAnswer({ question: q, chosen: choice, correct: graded.correct, mode: "independent", hints: 0, source: "diagnostic" });
    diag.asked++;
    var nxt = E.diagnostic.nextQuestion(diag.session);
    diag.last = nxt;
    // The diagnostic's own advance: `diag.last` already holds the next probe,
    // or null when the sitting is over. The verdict box names the action, so the
    // one click handler can serve both surfaces without guessing which is open.
    showVerdict(graded.correct, explanationText(graded.explanation), q, choice, "diag-next", null, 0);
  }

  function finishDiagnostic() {
    var st = me();
    var session = diag.session;
    var at = Date.now();
    var sitting = {
      type: "diagnostic_completed",
      id: E.evidence.newEvidenceId(),
      schemaVersion: E.evidence.EVIDENCE_SCHEMA_VERSION,
      learnerId: profileId(),
      provenance: "server",
      at: at,
      source: "diagnostic",
      subject: diag.subject,
      conceptId: null,
      specificationId: st.profile.spec || null,
      concepts: session.concepts.filter(function (c) { return c.done; }).length,
      seeds: session.concepts.filter(function (c) { return c.asked > 0; }).map(function (c) {
        return {
          conceptId: c.conceptId, asked: c.asked, correct: c.correct, done: c.done,
          stage: c.stage, askedThisStage: c.askedThisStage, correctThisStage: c.correctThisStage,
          servedDifficulty: c.servedDifficulty.slice(),
        };
      }),
    };
    E.ledger.commitAndProject(profileId(), st, [sitting], LEDGER);
    E.diagnostic.markObservedConcepts(st, session, at);
    saveProfile(st);
    var result = E.diagnostic.buildResult(session);
    diag = null;
    drawDiagnosticResult(result);
  }

  function drawDiagnosticResult(result) {
    // One row per demand level, and a level the sitting did NOT measure says so
    // — never 0%. `measured` is the flag the report itself sets; a level whose
    // confidence is merely low was still measured, and is reported as such.
    var rows = (result.skills || []).map(function (s) {
      var est = s.estimate || {};
      if (!est.measured) {
        return '<tr class="unmeasured"><td>' + esc(t("skill." + s.skill)) + '</td><td class="num">' +
          esc(t("diag.notMeasured")) + '</td><td class="num">' + esc(s.inBank ? "" : "—") + "</td></tr>";
      }
      return "<tr><td>" + esc(t("skill." + s.skill)) + '</td><td class="num">' +
        Math.round((est.value || 0) * 100) + "%</td><td class=\"num\">" +
        esc(t("conf." + est.confidence)) + " · " + esc(est.correct + "/" + est.attempts) + "</td></tr>";
    }).join("");
    root.innerHTML =
      '<p class="eyebrow">' + esc(t("diag.title")) + "</p>" +
      "<h1>" + esc(t("diag.foundTitle")) + "</h1>" +
      '<table><thead><tr><th>' + esc(t("diag.skillsTitle")) + "</th><th class=\"num\">" + esc(t("prog.mastery")) + "</th><th class=\"num\">" + esc(t("prog.confidence")) + "</th></tr></thead><tbody>" + rows + "</tbody></table>" +
      '<p class="small muted" style="margin-top:.6rem">' + esc(t("diag.estNote")) + "</p>" +
      ((result.skills || []).some(function (s) { return !s.inBank; })
        ? '<p class="small muted">' + esc(t("diag.unreachableNote")) + "</p>"
        : "") +
      '<p class="small muted">' + esc(t("diag.bankNote")) + "</p>" +
      '<p style="margin-top:1.25rem"><a class="btn primary" href="#/home">' + esc(t("curr.start")) + "</a> " +
      '<button class="quiet" data-act="retake">' + esc(t("sb.retakeDiag")) + "</button></p>";
  }

  // ── Home ──────────────────────────────────────────────────────────────────

  function viewHome() {
    setNav("/home");
    root.className = "";
    var st = me();
    var actions = decide(4);
    var head = actions[0];
    var rest = actions.slice(1);

    var plan = head && head.plan && head.plan.length
      ? '<ul class="plan">' + head.plan.map(function (p) {
        return "<li><span>" + esc(t("plan." + p.kind)) + "</span><b>×" + p.count + "</b></li>";
      }).join("") + "</ul>"
      : "";

    var cites = head ? E.evidenceView.citationsFor(head.evidenceIds, events(), { titleFor: ctitle, t: t, locale: lang() }) : [];
    var basis = head ? basisLine(head.basis) : "";

    var days = E.deadline.daysUntil(st.profile.examDate);
    var band = E.deadline.deadlineBand(st.profile.examDate);
    var exam =
      days == null
        ? '<p class="small muted">' + esc(t("next.why.noExam")) + "</p>"
        : '<div class="section"><p class="eyebrow">' + esc(t("onb.examDate")) + "</p><p>" +
          esc(band === "past" ? t("home.examPast") : band === "today" ? t("home.examNear") : fill(t("home.examCountdown"), { days: days })) +
          "</p></div>";

    var recent = E.evidenceView.recentAnswers(events(), 5);
    var recentHtml = recent.length
      ? '<ul class="items">' + recent.map(function (a) {
        return '<li><span>' + esc(ctitle(a.conceptId)) + "</span>" +
          '<span class="meta">' + esc(t("evv.source." + a.source)) + " · " + (a.correct ? "✓" : "✗") + "</span></li>";
      }).join("") + "</ul>"
      : '<p class="muted">' + esc(t("ev.none")) + "</p>";

    root.innerHTML =
      '<p class="eyebrow">' + esc(t("dash.hi")) + (st.profile.handle ? ", " + esc(st.profile.handle) : "") + "</p>" +
      courseLine() +
      (head
        ? '<div class="next">' +
          '<p class="eyebrow">' + esc(t("next.eyebrow")) + "</p>" +
          "<h2>" + esc(head.title) + "</h2>" +
          '<p class="why">' + esc(head.reason) + "</p>" +
          '<p class="why"><b>' + esc(t("next.whyNow")) + "</b> " + esc(head.why) + "</p>" +
          '<div class="meta"><span>' + head.minutes + " " + esc(t("next.ev.min")) + "</span>" +
          (head.urgency !== "none" ? '<span class="tag due">' + esc(head.urgency) + "</span>" : "") +
          (head.expectedOutcome ? "<span>" + esc(head.expectedOutcome) + "</span>" : "") +
          "</div>" +
          '<p><a class="btn primary" href="' + esc(routeFor(head)) + '">' + esc(t("next.start")) + "</a></p>" +
          plan +
          '<details class="evidence"><summary>' + esc(t("evv.basedOn")) + "</summary>" +
          (cites.length
            ? '<ul>' + cites.map(citationLine).join("") + "</ul>"
            : '<p class="small muted">' + esc(basis) + "</p>") +
          "</details>" +
          "</div>"
        : '<div class="note">' + esc(t("ev.none")) + "</div>") +
      (rest.length
        ? '<div class="section"><p class="eyebrow">' + esc(t("next.alsoReady")) + '</p><ul class="items">' +
          rest.map(function (a) {
            return '<li><a href="' + esc(routeFor(a)) + '">' +
              "<span>" + esc(a.title) + "</span><span class=\"meta\">" + a.minutes + " " + esc(t("next.ev.min")) + "</span></a></li>";
          }).join("") + "</ul></div>"
        : "") +
      exam +
      '<div class="section"><p class="eyebrow">' + esc(t("prog.recent")) + "</p>" + recentHtml + "</div>" +
      '<div class="section"><p class="eyebrow">' + esc(t("sb.dims")) + '</p><p><a href="#/evidence">' + esc(t("evv.timeline")) + "</a></p></div>";
  }

  /** One cited answer, rendered from the citation record itself: what kind of
   *  work it was, which concept, when, and whether it was right. */
  function citationLine(c) {
    return "<li>" + esc((c.kind || t("learn.practice")) + " · " + ctitle(c.concept) + " · " + c.when) +
      " " + (c.correct ? "✓" : "✗") + (c.offline ? ' <span class="tag">' + esc(t("evv.offline")) + "</span>" : "") + "</li>";
  }

  /** Where a decision sends the learner IN THIS BUILD.
   *
   *  The engine's actions carry the SERVER's routes (`/learn/maths/standard-form`),
   *  which do not exist here — a static host has no such page, and following one
   *  lands the learner on a 404 in the middle of their own study session. So the
   *  action's own concept is routed to the screen that can actually serve it. */
  function routeFor(action) {
    if (action && action.conceptId) return "#/learn?concept=" + encodeURIComponent(action.conceptId);
    return "#/learn";
  }

  function basisLine(basis) {
    if (basis === "cited") return t("evv.because");
    if (basis === "unattributed") return t("evv.noCitations");
    return t("ev.none");
  }

  function courseLine() {
    var st = me();
    var specs = (st.profile.subjects || []).map(function (s) {
      var active = E.specifications.specForProfile(st.profile, s);
      return s + " · " + (active.spec ? active.spec.name || active.spec.id : "?") + (active.level ? " (" + (t("lvl." + active.level.id) || active.level.id) + ")" : "");
    });
    return '<p class="small muted">' + esc(specs.join("  ·  ")) + "</p>";
  }

  // ── Learn (practice) ──────────────────────────────────────────────────────

  var practice = null; // { conceptId, q, info, hints, startedAt, done:false }

  function viewLearn(conceptId) {
    setNav("/learn");
    root.className = "";
    if (!conceptId) {
      var top = decide(1)[0];
      conceptId = (top && top.conceptId) || null;
    }
    if (!conceptId) {
      root.innerHTML = '<h1>' + esc(t("sb.pickIdea")) + '</h1><p class="muted"><a href="#/curriculum">' + esc(t("nav.currTitle")) + "</a></p>";
      return;
    }
    var concept = E.genome.getConcept(conceptId);
    if (!concept) {
      root.innerHTML = "<h1>" + esc(t("learn.notFound")) + "</h1>";
      return;
    }
    if (!hasQuestions(conceptId)) {
      root.innerHTML = '<p class="eyebrow">' + esc(ctitle(conceptId)) + "</p><h1>" + esc(t("sb.noContent")) + "</h1>" +
        '<p><a class="btn" href="#/curriculum">' + esc(t("nav.currTitle")) + "</a></p>";
      return;
    }
    if (!practice || practice.conceptId !== conceptId || practice.done) startPractice(conceptId);
    drawPractice();
  }

  function startPractice(conceptId) {
    var served = serveQuestion(conceptId);
    if (!served) {
      practice = { conceptId: conceptId, q: null, info: null, hints: 0, startedAt: Date.now(), done: true, missing: true };
      return;
    }
    practice = { conceptId: conceptId, q: served.q, info: served.info, hints: 0, startedAt: Date.now(), done: false };
  }

  function drawPractice() {
    var q = practice.q;
    if (!q) {
      root.innerHTML = '<p class="eyebrow">' + esc(ctitle(practice.conceptId)) + "</p><h1>" + esc(t("sb.noContent")) + "</h1>";
      return;
    }
    var view = E.questions.serveView(q, lang(), board());
    var prompt = lang() !== "en" ? view.prompt : questionText(q);
    var why = practice.info.due
      ? t("retention.review")
      : practice.info.target.reason === "stretch"
        ? t("next.title.stretch")
        : practice.info.target.reason === "repair"
          ? t("next.title.fix")
          : t("next.title.practise");

    root.innerHTML =
      '<div class="spread"><p class="eyebrow">' + esc(t("learn.practice")) + " · " + esc(ctitle(practice.conceptId)) + "</p>" +
      '<a class="progress-line" href="#/curriculum">' + esc(t("nav.currTitle")) + "</a></div>" +
      '<p class="q">' + esc(prompt) + "</p>" +
      '<div class="choices" id="choices">' +
      view.choices.map(function (c, i) {
        return '<button class="choice" data-act="answer" data-i="' + i + '"><span class="k">' + "ABCD".charAt(i) + "</span><span>" + esc(c) + "</span></button>";
      }).join("") +
      "</div>" +
      '<div id="hint-slot"></div>' +
      '<div id="verdict-slot"></div>' +
      '<div class="row"><button class="quiet" data-act="hint">' + esc(t("learn.hint")) + " (" + practice.hints + ")</button>" +
      '<button class="quiet" data-act="tutor-open">' + esc(t("learn.ask")) + "</button>" +
      '<span class="progress-line" style="margin-inline-start:auto">' + esc(t("sb.whyThis")) + ": " + esc(why) + "</span></div>" +
      '<div id="tutor-slot"></div>';
  }

  function answerPractice(choice) {
    var q = practice.q;
    var correct = choice === q.answer;
    var ms = Date.now() - practice.startedAt;
    recordAnswer({
      question: q,
      chosen: choice,
      correct: correct,
      mode: practice.hints > 0 ? "guided" : "independent",
      hints: practice.hints,
      source: practice.info.due ? "retrieval" : "practice",
      ms: ms,
    });
    practice.done = true;
    var st = me();
    var rec = st.progress[q.conceptId] || {};
    showVerdict(correct, explanationText(q.explanation), q, choice, "next-q", rec);
  }

  function showVerdict(correct, explanation, q, choice, nextAct, rec, hints) {
    var usedHints = hints == null ? (practice && practice.hints) || 0 : hints;
    var slot = document.getElementById("verdict-slot") || root;
    var buttons = document.querySelectorAll("#choices .choice");
    Array.prototype.forEach.call(buttons, function (b) {
      var i = parseInt(b.getAttribute("data-i"), 10);
      b.setAttribute("disabled", "disabled");
      if (i === q.answer) b.setAttribute("data-state", "right");
      else if (i === choice) b.setAttribute("data-state", "wrong");
    });
    // The name and the coaching line come from the catalogue when the
    // dictionary has no translation for the belief: `mcName` falls back to the
    // ARGUMENT it is given, so an empty one renders nothing at all — which is
    // how a detected misconception disappears from the screen that detected it.
    var mcId = (q.misconceptionTags || [])[0] || "";
    var mcEntry = mcId ? E.misconceptions.MISCONCEPTIONS_BY_ID[mcId] : null;
    var second = mcId ? E.contentI18n.mcName(lang(), mcId, mcEntry ? mcEntry.name : mcId) : "";
    var coaching = mcId ? E.contentI18n.mcCoaching(lang(), mcId, mcEntry ? mcEntry.coaching || "" : "") : "";
    var change = rec
      ? '<p class="small mono">' + esc(t("learn.attempts")) + ": " + (rec.attempts || 0) + " · " + esc(t("prog.accuracy")) + ": " +
        Math.round(((rec.accuracy || 0) * 100)) + "% · " + esc(t("prog.mastery")) + ": " + Math.round((rec.mastery || 0) * 100) + "%</p>"
      : "";
    var box = '<div class="verdict ' + (correct ? "good" : "bad") + '">' +
      '<p class="head">' + esc(correct ? t("learn.correct") : t("learn.wrong")) + "</p>" +
      (!correct ? '<p class="small">' + esc(t("sb.correctWas")) + ": <b class=\"mono\">" + esc(q.choices[q.answer]) + "</b></p>" : "") +
      '<p class="expl">' + esc(explanation) + "</p>" +
      (second ? '<p class="small muted"><b>' + esc(t("ev.issue")) + ":</b> " + esc(second) +
        (coaching ? " — " + esc(coaching) : "") + "</p>" : "") +
      (usedHints > 0 ? '<p class="small muted">' + esc(t("sb.hintGuided")) + "</p>" : "") +
      change +
      "</div>" +
      '<p><button class="primary" data-act="' + esc(nextAct) + '">' + esc(t("learn.nextQ")) + "</button> " +
      '<a class="btn" href="#/evidence">' + esc(t("prog.nav")) + "</a></p>";
    if (slot === root) {
      // The diagnostic draws its verdict into the page body; 
      var host = document.getElementById("verdict-host");
      if (!host) {
        host = el("div", { id: "verdict-host" });
        root.appendChild(host);
      }
      host.innerHTML = box;
    } else {
      slot.innerHTML = box;
    }
  }

  function requestHint() {
    if (!practice || practice.done) return;
    practice.hints++;
    recordHint(practice.q);
    var level = Math.min(practice.hints, E.hints.HINT_LEVELS.length);
    var hint = E.hints.buildHint({ prompt: practice.q.prompt, explanation: practice.q.explanation }, level);
    // A Hint is an i18n KEY for the generic rungs of the ladder (level 1–2), or
    // the question's own curriculum text at the top of it (level 3–4). Both can
    // be present; rendering only one of them is how "Hint 1 —" with nothing
    // after it happens.
    var body = [hint.key ? t(hint.key) : "", hint.text || ""].filter(Boolean).join(" ");
    var slot = document.getElementById("hint-slot");
    slot.innerHTML = '<div class="hintbox"><b>' + esc(t("learn.hint")) + " " + level + " · " +
      esc(maybe(E.hints.HINT_LEVELS[level - 1].labelKey) || E.hints.HINT_LEVELS[level - 1].labelKey) + "</b> — " + esc(body) + "</div>" +
      (level < E.hints.HINT_LEVELS.length ? '<p class="small muted">' + esc(t("hint.howMuch")) + "</p>" : "");
  }

  // ── Curriculum ────────────────────────────────────────────────────────────

  function viewCurriculum(subject) {
    setNav("/curriculum");
    root.className = "";
    var st = me();
    var subjects = st.profile.subjects || ["maths"];
    subject = subject && subjects.indexOf(subject) >= 0 ? subject : subjects[0];
    var list = conceptList(subject);
    var proj = projection();

    root.innerHTML =
      "<h1>" + esc(t("curr.title")) + "</h1>" +
      '<p class="muted">' + esc(t("curr.sub")) + "</p>" +
      '<p class="lang-list">' + subjects.map(function (s) {
        return '<button class="chip" data-act="subject" data-s="' + esc(s) + '"' + (s === subject ? ' aria-current="true"' : "") + ">" + esc(s) + "</button>";
      }).join("") + "</p>" +
      '<p class="small muted">' + esc(t("curr.specsNote")) + "</p>" +
      '<hr class="rule">' +
      '<ul class="items">' + list.map(function (c) {
        var rec = proj.byConcept[c.id];
        var asked = (rec && rec.attempts) || 0;
        var state = asked
          ? (rec.correct / asked >= 0.8 ? "good" : rec.correct / asked < 0.5 ? "weak" : "")
          : "";
        var meta = asked
          ? Math.round((rec.correct / asked) * 100) + "% · " + asked + " " + esc(t("learn.attempts"))
          : esc(t("evv.unmeasured"));
        return "<li>" + (c.ready
          ? '<a href="#/learn?concept=' + encodeURIComponent(c.id) + '"><span>' + esc(c.title) + "</span>" +
            '<span class="meta">' + (state ? '<span class="tag ' + state + '">' : "") + meta + (state ? "</span>" : "") + "</span></a>"
          : '<div style="display:flex;justify-content:space-between;gap:1rem"><span>' + esc(c.title) + '</span><span class="meta">' + esc(t("sb.noContent")) + "</span></div>") +
          '<p class="small muted" style="margin:.15rem 0 0">' + esc(c.blurb) + "</p></li>";
      }).join("") + "</ul>";
  }

  // ── Evidence ──────────────────────────────────────────────────────────────

  function viewEvidence(conceptId) {
    setNav("/evidence");
    root.className = "";
    var ev = events();
    var proj = E.evidence.projectLearner(ev);
    var ideas = Object.keys(proj.byConcept).filter(function (id) { return (proj.byConcept[id].attempts || 0) > 0; });
    conceptId = conceptId || ideas[0] || null;

    var detail = "";
    if (conceptId) {
      var k = E.evidenceView.conceptKnowledge(proj, conceptId, t);
      detail =
        "<h2>" + esc(ctitle(conceptId)) + "</h2>" +
        '<table><thead><tr><th>' + esc(t("sb.dims")) + '</th><th class="num">' + esc(t("prog.attempts")) + '</th><th class="num">' + esc(t("prog.accuracy")) + "</th></tr></thead><tbody>" +
        k.rows.map(function (r) {
          var n = (r.rate && r.rate.asked) || 0;
          var good = r.rate && r.rate.correct ? r.rate.correct : 0;
          return "<tr" + (r.unmeasured ? ' class="unmeasured"' : "") + "><td>" + esc(r.label) + "</td>" +
            '<td class="num">' + (r.unmeasured ? "—" : n) + '</td><td class="num">' +
            (r.unmeasured ? esc(t("evv.unmeasured")) : Math.round((good / n) * 100) + "%") + "</td></tr>";
        }).join("") + "</tbody></table>" +
        (k.unmeasuredLabels.length ? '<p class="small muted">' + esc(t("evv.notYet")) + " " + esc(k.unmeasuredLabels.join(", ")) + "</p>" : "");
    }

    var answers = E.evidenceView.recentAnswers(ev, 20);
    var action = decide(1)[0];
    var cites = action ? E.evidenceView.citationsFor(action.evidenceIds, ev, { titleFor: ctitle, t: t, locale: lang() }) : [];

    root.innerHTML =
      "<h1>" + esc(t("prog.title")) + "</h1>" +
      '<p class="muted">' + esc(t("prog.sub")) + "</p>" +
      (ideas.length
        ? '<p class="lang-list">' + ideas.map(function (id) {
          return '<button class="chip" data-act="pick-concept" data-c="' + esc(id) + '"' + (id === conceptId ? ' aria-current="true"' : "") + ">" + esc(ctitle(id)) + "</button>";
        }).join("") + "</p>"
        : '<div class="note">' + esc(t("prog.empty")) + "</div>") +
      detail +
      '<hr class="rule">' +
      '<div class="section"><p class="eyebrow">' + esc(t("evv.theEvidence")) + '</p>' +
      (answers.length
        ? '<ul class="items">' + answers.map(function (a) {
          return '<li><span>' + esc(ctitle(a.conceptId)) + " " + (a.correct ? "✓" : "✗") + "</span>" +
            '<span class="meta">' + esc(t("evv.source." + a.source)) + " · " + new Date(a.at).toLocaleDateString() +
            (a.mode !== "independent" ? " · " + esc(a.mode) : "") + "</span></li>";
        }).join("") + "</ul>"
        : '<p class="muted">' + esc(t("ev.none")) + "</p>") +
      "</div>" +
      (action
        ? '<div class="section"><p class="eyebrow">' + esc(t("evv.because")) + '</p><p>' + esc(action.reason) + "</p>" +
          (cites.length ? '<ul class="small">' + cites.map(citationLine).join("") + "</ul>" : '<p class="small muted">' + esc(basisLine(action.basis)) + "</p>") +
          "</div>"
        : "");
  }

  // ── Access: language, deadlines, data ────────────────────────────────────

  function viewAccess() {
    setNav("/access");
    root.className = "";
    var st = me();
    root.innerHTML =
      "<h1>" + esc(t("nav.accessTitle")) + "</h1>" +
      '<div class="field"><label for="a-lang">' + esc(t("common.language")) + "</label><select id=\"a-lang\">" +
      E.i18n.LANGS.map(function (l) { return '<option value="' + l.code + '"' + (l.code === lang() ? " selected" : "") + ">" + esc(l.name) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="field"><label for="a-exam">' + esc(t("onb.examDate")) + '</label><input id="a-exam" type="date" value="' + esc(st.profile.examDate || "") + '"></div>' +
      '<div class="field"><label for="a-time">' + esc(t("onb.timePerDay")) + '</label><input id="a-time" type="number" min="5" max="300" step="5" value="' + (st.profile.timePerDay || 30) + '"></div>' +
      '<p><button class="primary" data-act="save-settings">' + esc(t("common.save")) + "</button></p>" +
      '<hr class="rule">' +
      '<div class="section"><p class="eyebrow">' + esc(t("plan.export")) + '</p>' +
      '<p><button data-act="export">' + esc(t("sb.export")) + '</button> <button class="danger" data-act="reset">' + esc(t("sb.reset")) + "</button></p>" +
      '<p class="small muted">' + esc(t("sb.note")) + "</p></div>" +
      '<div class="section"><p class="eyebrow">' + esc(t("ai.on")) + "</p>" +
      '<p class="small muted">' + esc(t("sb.tutorKeyNote")) + "</p>" +
      '<div class="field"><label for="a-key">' + esc(t("sb.tutorKey")) + '</label><input id="a-key" type="password" autocomplete="off" value="' + esc(db.ui.apiKey || "") + '"></div>' +
      '<div class="field"><label for="a-endpoint">Endpoint</label><input id="a-endpoint" value="' + esc(db.ui.endpoint || "https://api.openai.com/v1/chat/completions") + '"></div>' +
      '<div class="field"><label for="a-model">Model</label><input id="a-model" value="' + esc(db.ui.model || "gpt-4o-mini") + '"></div>' +
      '<p><button data-act="save-tutor">' + esc(t("common.save")) + "</button></p></div>";
  }

  function saveSettings() {
    var st = me();
    st.profile.examDate = document.getElementById("a-exam").value || undefined;
    st.profile.timePerDay = parseInt(document.getElementById("a-time").value, 10) || 30;
    saveProfile(st);
    toast(t("curr.saved"));
  }

  function exportData() {
    var blob = new Blob([JSON.stringify({ profile: me().profile, events: events() }, null, 2)], { type: "application/json" });
    var a = el("a", { href: URL.createObjectURL(blob), download: "openmind-evidence.json" });
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function resetAll() {
    if (!confirm(t("sb.resetAsk"))) return;
    db = { ledgers: {}, profiles: {}, ui: { lang: lang(), learnerId: null } };
    LEDGER = E.ledger.memoryLedger({});
    save();
    go("#/");
  }

  // ── Tutor ─────────────────────────────────────────────────────────────────
  // Grounded in the SAME decision the page shows — the concept, the reason, the
  // citations — and never able to write: it returns text, nothing else. With a
  // key it calls the model from this browser; without one it answers from
  // OpenMind's own offline engine and SAYS so.

  var chat = [];

  function openTutor() {
    var slot = document.getElementById("tutor-slot");
    slot.innerHTML =
      '<div class="note"><p class="small">' + esc(t("tutor.whyThis") ? fill(t("tutor.whyThis"), { concept: ctitle(practice.conceptId), reason: tutorReason() }) : "") + "</p>" +
      '<p class="small muted">' + esc(db.ui.apiKey ? t("sb.tutorKey") : t("sb.tutorLocal")) + "</p></div>" +
      '<div id="chat"></div>' +
      '<div class="row"><input id="ask" placeholder="' + esc(t("tutor.ph")) + '"><button data-act="ask">' + esc(t("learn.ask")) + "</button></div>" +
      '<p class="small muted">' + esc(t("sb.tutorKeyNote")) + "</p>";
    drawChat();
  }

  function tutorReason() {
    var a = decide(1)[0];
    return (a && a.reason) || t("ev.none");
  }

  function drawChat() {
    var host = document.getElementById("chat");
    if (!host) return;
    host.innerHTML = chat.map(function (m) {
      return '<p><b>' + esc(m.who === "you" ? t("tutor.you") : t("tutor.title")) + ":</b> " + esc(m.text) + "</p>";
    }).join("");
  }

  function askTutor(text) {
    if (!text) return;
    chat.push({ who: "you", text: text });
    drawChat();
    var grounding = {
      concept: ctitle(practice.conceptId),
      question: questionText(practice.q),
      reason: tutorReason(),
      misconceptions: (practice.q.misconceptionTags || []).map(function (id) { return E.contentI18n.mcName(lang(), id, id); }),
    };
    if (!db.ui.apiKey) {
      chat.push({ who: "tutor", text: E.socratic.socraticReply(practice.conceptId, text, lang()) + " [" + t("sb.tutorLocal") + "]" });
      drawChat();
      return;
    }
    chat.push({ who: "tutor", text: t("common.loading") });
    drawChat();
    var messages = [
      { role: "system", content: "You are OpenMind's tutor. The learner is working on: " + grounding.concept + ". The question is: " + grounding.question + ". OpenMind chose it because: " + grounding.reason + ". Known misconceptions here: " + (grounding.misconceptions.join(", ") || "none recorded") + ". Never state a grade, a mastery number or an answer to the current question outright: guide, explain and question." },
    ];
    chat.slice(0, -1).forEach(function (m) { messages.push({ role: m.who === "you" ? "user" : "assistant", content: m.text }); });
    fetch(db.ui.endpoint || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + db.ui.apiKey },
      body: JSON.stringify({ model: db.ui.model || "gpt-4o-mini", messages: messages, max_tokens: 400 }),
    })
      .then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r.json(); })
      .then(function (j) {
        var text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        if (!text) throw new Error("malformed");
        chat[chat.length - 1] = { who: "tutor", text: text };
        drawChat();
      })
      .catch(function () {
        // A genuine outcome, not an error page: the offline engine answers and
        // says which engine answered.
        chat[chat.length - 1] = { who: "tutor", text: E.socratic.socraticReply(practice.conceptId, text, lang()) + " [" + t("tutor.fallbackNote") + "]" };
        drawChat();
      });
  }

  // ── Events ────────────────────────────────────────────────────────────────

  document.addEventListener("click", function (e) {
    var node = e.target.closest("[data-act]");
    if (!node) return;
    var act = node.getAttribute("data-act");
    if (act === "create") return createProfile();
    if (act === "diag-answer") return answerDiagnostic(parseInt(node.getAttribute("data-i"), 10));
    if (act === "diag-skip") {
      var cur = E.diagnostic.currentConcept(diag.session);
      if (cur) cur.done = true;
      diag.last = E.diagnostic.nextQuestion(diag.session);
      if (!diag.last) return finishDiagnostic();
      return drawQuestion();
    }
    if (act === "diag-finish") return finishDiagnostic();
    if (act === "retake") { diag = null; return go("#/diag"); }
    if (act === "answer") return answerPractice(parseInt(node.getAttribute("data-i"), 10));
    if (act === "hint") return requestHint();
    if (act === "next-q") { startPractice(practice.conceptId); return drawPractice(); }
    if (act === "diag-next") {
      if (diag && diag.last) return drawQuestion();
      return finishDiagnostic();
    }
    if (act === "tutor-open") return openTutor();
    if (act === "ask") {
      var input = document.getElementById("ask");
      var value = input.value.trim();
      input.value = "";
      return askTutor(value);
    }
    if (act === "subject") return go("#/curriculum?subject=" + encodeURIComponent(node.getAttribute("data-s")));
    if (act === "pick-concept") return go("#/evidence?concept=" + encodeURIComponent(node.getAttribute("data-c")));
    if (act === "save-settings") return saveSettings();
    if (act === "export") return exportData();
    if (act === "reset") return resetAll();
    if (act === "save-tutor") {
      db.ui.apiKey = document.getElementById("a-key").value.trim();
      db.ui.endpoint = document.getElementById("a-endpoint").value.trim();
      db.ui.model = document.getElementById("a-model").value.trim();
      save();
      return toast(t("curr.saved"));
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.id === "ask") {
      e.preventDefault();
      var value = e.target.value.trim();
      e.target.value = "";
      askTutor(value);
    }
  });

  document.getElementById("lang").addEventListener("change", function (e) {
    db.ui.lang = e.target.value;
    save();
    var st = me();
    if (st) {
      st.profile.language = db.ui.lang;
      saveProfile(st);
    }
    applyDirection();
    paint();
  });

  function applyDirection() {
    var rtl = E.i18n.isRtl(lang());
    document.documentElement.lang = lang();
    document.body.setAttribute("dir", rtl ? "rtl" : "ltr");
  }

  function paint() {
    document.getElementById("foot-lang").textContent = E.i18n.LANGS.filter(function (l) { return l.code === lang(); })[0].name;
    document.getElementById("foot-note").textContent = t("sb.note");
    document.getElementById("brand-note").textContent = t("brand.tagline");
    render();
  }

  window.addEventListener("hashchange", function () {
    diag = null;
    practice = null;
    render();
  });

  // ── Boot ──────────────────────────────────────────────────────────────────

  applyDirection();
  paint();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* offline caching is a bonus, not a requirement */ });
  }
})();
