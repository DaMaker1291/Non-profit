// ─────────────────────────────────────────────────────────────────────────────
// LEARNING RESEARCH — what was read, what it says, and what may be reused.
//
// THIS MODULE IS THE RESEARCH RECORD, NOT A BIBLIOGRAPHY. Its job is to make three
// things impossible to do quietly:
//
//   1. CLAIM AN INSPECTION THAT DID NOT HAPPEN. Every record states whether it was
//      actually read (`inspected`), merely located (`identified`), or could not be
//      reached (`blocked`), and `validateResearch` refuses an `inspected` record
//      that does not say what was read and when. A list of links is not research;
//      this file is where that sentence becomes a rule the suite enforces.
//
//   2. REUSE A LICENCE THAT FORBIDS IT. OpenMind's teaching content is CC BY-SA
//      4.0. A NoCommercial (NC) or NoDerivatives (ND) work cannot be adapted into a
//      BY-SA product, so the validator refuses any NC/ND record marked reusable.
//      The consequence is uncomfortable and deliberately recorded: the best-known
//      resources in this field — PhET, OpenStax, CK-12 — are NC, so they are
//      REFERENCE ONLY. What OpenMind embeds it must own or license permissively.
//
//   3. HIDE A DISAGREEMENT. Where the literature conflicts, the dossier records
//      the conflict rather than the view that suits the design. The circuit dossier
//      does exactly that: the classic "current is used up" finding is measured, and
//      a 2024 study argues that substance-based language is a resource rather than
//      a predictor of that error.
//
// WHAT THIS FILE IS NOT: a substitute for educator review. Every dossier carries
// `educatorReview: "pending"` until a named subject teacher has read the material,
// and no code path may set it.
// ─────────────────────────────────────────────────────────────────────────────

/** OpenMind's own content licence. The reason the reuse rules below are strict:
 *  everything shipped beside it must be distributable under these terms. */
export const PRODUCT_LICENCE = "CC BY-SA 4.0";

/** The licence families this project may ADAPT or EMBED, and the ones it may only
 *  look at. Kept as data so the validator and the documentation cannot drift. */
export const REUSE_ALLOWED = ["CC0", "public domain", "CC BY 4.0", "CC BY-SA 4.0", "OpenMind original"] as const;

export type SourceFormat =
  | "interactive-simulation"
  | "video"
  | "textbook"
  | "worksheet"
  | "quiz"
  | "slides"
  | "research-paper"
  | "framework"
  | "policy"
  | "diagram";

/** How far a record got. `blocked` is a first-class state: a source that could not
 *  be reached is recorded as such, never silently dropped and never upgraded. */
export type Inspection = "inspected" | "identified" | "blocked";

/** HOW FAR the inspection went. `inspected` used to be one word covering a page of
 *  metadata and a full paper, which is how a title gets reported as research. The
 *  ladder makes the difference visible, and `validateResearch` refuses a claim
 *  that does not match its rung:
 *
 *    discovered          — located; no content read
 *    metadata            — title, creator, description, licence page
 *    abstract            — abstract/summary only (paywalled or skimmed)
 *    section             — named sections, tables or answers read in the document
 *    full-text           — the document read through
 *    asset               — slides, worksheet or diagrams themselves examined
 *    transcript          — a published transcript read; the video NOT watched
 *    video-frames-sampled — frames decoded and looked at; audio NOT heard
 *    video-segment       — a timestamped segment actually viewed
 *    video-watched       — the whole video viewed
 *    audio-evaluated     — the audio itself heard and judged
 *    slides-text         — slide text extracted; the deck NOT rendered
 *    slides-visual       — the slides rendered and seen
 *    slides-media        — images, animations or embedded video inspected
 *    slides-full         — deck reviewed as text and visuals together
 *    interactive-tested  — the resource operated, not merely opened
 *
 * `transcript` and `video-frames-sampled` are separate rungs on purpose. Reading
 * what was said is not watching it, and four decoded frames are not a watch. A
 * sampled record must carry the timestamps and say what happened to the audio; a
 * `slides-text` record must say the visuals were not rendered. */
export type InspectionDepth =
  | "discovered"
  | "metadata"
  | "abstract"
  | "section"
  | "full-text"
  | "asset"
  | "transcript"
  | "video-frames-sampled"
  | "video-segment"
  | "video-watched"
  | "audio-evaluated"
  | "slides-text"
  | "slides-visual"
  | "slides-media"
  | "slides-full"
  | "interactive-tested";

export const INSPECTION_DEPTHS: readonly InspectionDepth[] = [
  "discovered",
  "metadata",
  "abstract",
  "section",
  "full-text",
  "asset",
  "transcript",
  "video-frames-sampled",
  "video-segment",
  "video-watched",
  "audio-evaluated",
  "slides-text",
  "slides-visual",
  "slides-media",
  "slides-full",
  "interactive-tested",
];

/** What the project may do with it, decided from the licence and not from
 *  convenience. */
export type Reuse = "adapt" | "embed" | "reference-only";

export interface ResearchSource {
  readonly id: string;
  readonly title: string;
  readonly creator: string;
  readonly institution: string;
  readonly url: string;
  readonly format: SourceFormat;
  readonly published: string | null;
  /** ISO date this project actually looked at it. Required when inspected. */
  readonly accessedOn: string | null;
  readonly language: string;
  readonly ageRange: string | null;
  readonly licence: {
    readonly name: string;
    readonly url: string | null;
    readonly reuse: Reuse;
  };
  readonly attribution: string;
  readonly inspection: Inspection;
  /** How far the inspection went. Required for every record, because "identified"
   *  and "inspected" hide a factor of ten in effort otherwise. */
  readonly depth: InspectionDepth;
  /** Exactly what was read or seen. Required when `inspection === "inspected"`;
   *  absent means the record cannot honestly claim inspection. */
  readonly whatWasInspected?: string;
  /** What it taught the project, in its own terms. */
  readonly findings: string;
  readonly limitations: string;
  readonly concepts: readonly string[];
  /** What OpenMind intends to do with it — including "nothing but learn from it". */
  readonly intendedUse: string;
}

/** A concept's research state. `researched` is a claim the validator checks
 *  against inspected sources; `identified` says plainly that the material has been
 *  located and not yet studied. */
export type DossierStatus = "researched" | "identified";

export interface ConceptDossier {
  readonly conceptId: string;
  readonly subject: "maths" | "physics" | "chemistry" | "biology" | "computing";
  readonly status: DossierStatus;
  /** The teaching decision the research supports, in one paragraph. */
  readonly designDecision: string;
  /** Misconceptions the material documents, with the source that documents them. */
  readonly misconceptions: readonly { readonly id: string; readonly statement: string; readonly sourceId: string }[];
  /** Where sources disagree. An empty array means "no disagreement found", which is
   *  a finding too. */
  readonly disagreements: readonly { readonly question: string; readonly sourceIds: readonly string[]; readonly note: string }[];
  /** What the next research session must establish. */
  readonly nextStep: string;
  /** No code path may set this. A named teacher does, by editing this file. */
  readonly educatorReview: "pending" | "reviewed";
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const ACCESSED = iso(2026, 11, 24);

export const RESEARCH_SOURCES: readonly ResearchSource[] = [
  // ── Maths: number lines, negatives and decimals ───────────────────────────
  {
    id: "steinle-stacey-1998-decimals",
    title: "The incidence of misconceptions of decimal notation amongst students in Grades 5 to 10",
    creator: "V. Steinle & K. Stacey",
    institution: "MERGA (conference proceedings)",
    url: "https://www2.merga.net.au/documents/RP_Steinle_Stacey_1998.pdf",
    format: "research-paper",
    published: iso(1998, 7, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "10–16",
    licence: { name: "Conference proceedings (author copy)", url: null, reuse: "reference-only" },
    attribution: "Steinle & Stacey, MERGA 1998",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The misconception taxonomy section defining 'string length thinking' and 'numerator focussed thinking', with its worked examples (4.63 read as bigger than 4.8; 4.03 as bigger than 4.3).",
    findings:
      "The error is a WORKING RULE from whole numbers applied to places: more digits reads as more value. It survives because it produces right answers until the digits after the point differ in length — which is why the model moves in tenths and names the place.",
    limitations:
      "Grade 5–10 sample from one education system; read as the taxonomy chapter, not the whole paper.",
    concepts: ["decimals", "place-value"],
    intendedUse: "Names the belief the number-line model refutes by moving in tenths.",
  },
  {
    id: "widodo-2018-number-line-misconceptions",
    title: "Misconceptions of negative integers and decimals on the number line",
    creator: "International Journal of Innovation in Teaching and Learning",
    institution: "Iqra University",
    url: "https://journals.iiu.edu.pk/index.php/IJITL/article/download/314/145",
    format: "research-paper",
    published: iso(2018, 6, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–16",
    licence: { name: "Journal article (open access)", url: null, reuse: "reference-only" },
    attribution: "IJITL Vol. IV Issue I (2018)",
    inspection: "inspected",
    depth: "abstract",
    whatWasInspected:
      "The abstract and the misconception findings: the 'opposite sign' error (positives placed in the negative region and vice versa), Translating Positive/Negative Interval errors, and the 'decimal-point-ignored' error.",
    findings:
      "Errors are about PLACEMENT on the line, not just comparison — which is why the model puts a marker on the line and states the neighbours either side of it, rather than printing a comparison of two numbers.",
    limitations:
      "Small study; read as abstract plus the named misconception categories.",
    concepts: ["negatives", "decimals", "place-value"],
    intendedUse: "Justifies showing the marker's two neighbours so order is read off the line.",
  },
  {
    id: "young-booth-2015-negative-magnitude",
    title: "Student magnitude knowledge of negative numbers",
    creator: "A. Young & J. Booth",
    institution: "Journal of Numerical Cognition",
    url: "https://jnc.psychopen.eu/index.php/jnc/article/download/5677/5677.html?inline=1",
    format: "research-paper",
    published: iso(2015, 10, 29),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–16",
    licence: { name: "Open access journal (PsychOpen)", url: null, reuse: "reference-only" },
    attribution: "Young & Booth, J. Numer. Cogn. 2015",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The framing section on the two components of negative numbers — direction (left of zero) and magnitude (distance from zero) — and the note that magnitude alone does not give the value.",
    findings:
      "Direction and magnitude are separable in learners' thinking, which is exactly why 'further from zero is bigger' feels right: the magnitude is larger. The model's sentence reports the distance AND the position so the two are not conflated.",
    limitations:
      "Read as the theoretical framing and abstract, not the full experimental method.",
    concepts: ["negatives"],
    intendedUse: "Supports printing distance-from-zero and side-of-zero as separate facts.",
  },
  {
    id: "mrbarton-negative-numbers-probes",
    title: "Ordering negative numbers — probing questions",
    creator: "Mr Barton Maths",
    institution: "mrbartonmaths.com",
    url: "https://mrbartonmaths.com/ordering-negative-numbers-probing-questions",
    format: "worksheet",
    published: iso(2026, 2, 7),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–14",
    licence: { name: "Site terms (teaching resource)", url: null, reuse: "reference-only" },
    attribution: "Mr Barton Maths, ordering negative numbers probing questions",
    inspection: "inspected",
    depth: "asset",
    whatWasInspected:
      "The four probing questions and their revealed answers: -1000 < 0.001, 'the number furthest from zero is the greatest' marked SOMETIMES with the negative counter-example, zero as neither positive nor negative, and 'more digits is larger' marked SOMETIMES.",
    findings:
      "The misconception is stated as a rule with a domain — true on the positive side, false on the negative side — which is the shape the model's sentence uses ('further left means smaller').",
    limitations:
      "A teacher-facing question set, not a study: it reports no frequencies. No asset reused.",
    concepts: ["negatives", "decimals"],
    intendedUse: "Wording of the two refuted beliefs in the number-line model.",
  },
  // ── Maths: fractions (the last pilot dossier to be researched) ──────────────
  {
    id: "ejceel-2024-fractions-basic7",
    title: "Misconceptions and associated errors made by Basic 7 learners in fractions",
    creator: "European Journal of Contemporary Education and E-Learning",
    institution: "EJCEEL",
    url: "https://ejceel.com/index.php/journal/article/download/165/126",
    format: "research-paper",
    published: iso(2024, 11, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "12–14",
    licence: { name: "Open access journal (EJCEEL)", url: "https://ejceel.com/index.php/journal/about", reuse: "reference-only" },
    attribution: "EJCEEL 2(6), 2024",
    inspection: "inspected",
    depth: "full-text",
    whatWasInspected:
      "The method (63 Basic 7 learners, written pre-test plus interviews) and the item-by-item results: 74.2% failed the unlike-denominator addition items, 67.7% failed the like-denominator item, 25.8% ordered unlike denominators correctly with 41.9% not attempting, and the discussion of 1/8 chosen as larger than 1/2 because the denominator is bigger.",
    findings:
      "Two errors dominate, and they pull in opposite directions: learners either add numerators and denominators separately (overgeneralising multiplication or whole-number addition) or compare fractions by denominator size alone. The paper also reports the learner explanation that the teacher 'sometimes adds the top numbers and down numbers together, sometimes finds common multiples', which is the instruction producing the confusion — not carelessness.",
    limitations:
      "One Ghanaian district, 63 learners, one grade; frequencies are not transferable. The paper is a journal article, not an open-licensed asset: no worksheet, figure or wording is reused.",
    concepts: ["fractions", "fraction-ops"],
    intendedUse: "Evidence for both fraction models: the denominator-size error behind the line model, and the tops-and-bottoms error the sum model draws.",
  },
  {
    id: "pmc-2016-fraction-ordering",
    title: "Error patterns in ordering fractions among at-risk fourth-grade students",
    creator: "Bailey, D. H., et al.",
    institution: "National Institutes of Health (PMC)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5018237",
    format: "research-paper",
    published: iso(2016, 8, 3),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "9–10 (studied)",
    licence: { name: "Open access (PMC), author manuscript", url: null, reuse: "reference-only" },
    attribution: "Bailey et al., 2016, PMC5018237",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The abstract, the error-coding definitions (whole-number ordering error; smallest-denominator–biggest-fraction error), Tables 2 and 5, and the discussion: n = 227, 81% of nine ordering problems answered incorrectly, 65% of errors whole-number logic, 18% smallest-denominator–biggest-fraction, and number-line estimation predicting whole-number errors while part-whole understanding did not.",
    findings:
      "THIS IS THE FINDING THAT CHANGED THE MODEL. Shading a part of a shape — the pilot fraction bar — did not predict fewer ordering errors once magnitude estimation was controlled; accuracy on a number line did. A part-whole picture is necessary and not sufficient, so the concept now shows a position on a line and keeps the bar only as the explanation of piece size.",
    limitations:
      "At-risk fourth-graders in one US setting; the paper studies ordering, not addition, so it supports the line model and not the sum model. Read as abstract, coding scheme, tables and discussion, not every page.",
    concepts: ["fractions"],
    intendedUse: "Justifies the number-line model and the half-benchmark comparison; cited in the dossier and in FRACTION_BELIEFS.",
  },
  {
    id: "newstead-murray-1998-fractions",
    title: "Young students' constructions of fractions",
    creator: "K. Newstead & H. Murray",
    institution: "Mathematics Learning and Teaching Initiative (PME proceedings)",
    url: "http://academic.sun.ac.za/mathed/malati/files/fractions98.pdf",
    format: "research-paper",
    published: iso(1998, 7, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "9–12",
    licence: { name: "Conference proceedings (author copy)", url: null, reuse: "reference-only" },
    attribution: "Newstead & Murray, PME 22 (1998)",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The method (370 Grade 4 and 382 Grade 6 learners, written tests in three languages), Table 1's success rates and misconception categories, and the discussion of whole-number schemes, the 5 as common denominator error, and the finding that denominator-only comparison was MORE prevalent in Grade 6 than Grade 4.",
    findings:
      "The denominator-only comparison got more common with age, not less. The authors attribute it partly to an introduction built on pre-partitioned area models and a limited range of fractions — which is a warning about the bar-only design, not a defence of it. The same whole-number scheme that fails at addition succeeds at multiplication, which is exactly why learners keep reaching for it.",
    limitations:
      "South African primary sample from the 1990s; frequencies and curriculum context do not transfer. Read as method, table and discussion, not every page. No item or figure reused.",
    concepts: ["fractions", "fraction-ops"],
    intendedUse: "Evidence that the bar alone can entrench the error, and that the addition rule must be shown as a choice about piece size rather than asserted.",
  },
  {
    id: "ejmste-2022-fraction-misconceptions",
    title: "Misconception on addition and subtraction of fractions in seventh-grade middle school students",
    creator: "Eurasia Journal of Mathematics, Science and Technology Education",
    institution: "EJMSTE",
    url: "https://www.ejmste.com/download/misconception-on-addition-and-subtraction-of-fractions-in-seventh-grade-middle-school-students-12070.pdf",
    format: "research-paper",
    published: iso(2022, 5, 7),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "12–13",
    licence: { name: "Open access journal (EJMSTE)", url: "https://www.ejmste.com", reuse: "reference-only" },
    attribution: "EJMSTE 18(6), 2022",
    inspection: "inspected",
    depth: "abstract",
    whatWasInspected:
      "The published abstract and its mastery table: 40 UAE seventh-grade students, over 60% treating fraction addition as whole-number addition, many unable to distinguish numerator from denominator, and the certainty-of-response method used to separate confident errors from guesses.",
    findings:
      "The error is CONFIDENT, not tentative: learners who add tops and bottoms believe they are applying a rule. That is why the model shows the wrong answer as an amount instead of saying the rule is wrong — a belief needs a counter-example it can check itself.",
    limitations:
      "ABSTRACT ONLY: the full text was not read, so item wording and interview detail are unavailable. One class, 40 learners. No frequency from this paper is printed in the product.",
    concepts: ["fraction-ops"],
    intendedUse: "Supports the impossible-sum test in the fraction-ops model; abstract-level claim only.",
  },

  {
    id: "wwc-2010-fractions-guide",
    title: "Developing effective fractions instruction for kindergarten through 8th grade",
    creator: "S. Siegler, T. Carpenter, F. Fennell, D. Geary, J. Lewis, Y. Okamoto, L. Thompson, J. Wray",
    institution: "What Works Clearinghouse, US Institute of Education Sciences",
    url: "https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/fractions_pg_093010.pdf",
    format: "framework",
    published: iso(2010, 9, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "5–14 (teachers)",
    licence: { name: "US federal government publication (public access)", url: null, reuse: "reference-only" },
    attribution: "What Works Clearinghouse, Developing Effective Fractions Instruction, 2010",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "Recommendation 2 and its suggested approach (number lines as the central representation; locate and compare fractions on minimally labelled lines; 6/7 located against 0, 1/2 and 1), the warning that students may treat the whole 0–5 line rather than 0–1 as the unit, and Appendix D's evidence ratings and effect sizes for number-line instruction.",
    findings:
      "THE TEACHING SEQUENCE THE FRACTION MODELS FOLLOW, from a national practice guide: fractions are numbers with magnitudes, number lines are the central representation, and the common errors — including adding numerators and denominators — stem from not understanding that. Two operational cautions are now built in: the line must be labelled as ONE whole (0 to 1), because learners otherwise locate a fraction as a proportion of the whole visible line, and a minimally labelled line with a 1/2 landmark is preferable to a densely pre-partitioned one.",
    limitations:
      "A practice guide, not a single experiment: its number-line evidence is strongest for whole numbers and decimals, and the panel rates the fraction-specific evidence differently by recommendation. Read as named recommendations and Appendix D, not every page.",
    concepts: ["fractions", "fraction-ops", "decimals", "place-value"],
    intendedUse: "Sets the sequence and the labelling rule for the fraction-line model; supports the decimal and place-value lines' 0-based framing.",
  },

  // ── Chemistry: atoms ───────────────────────────────────────────────────────
  {
    id: "rsc-atoms-isotopes-14-16",
    title: "Atoms and isotopes — developing understanding (14–16 years)",
    creator: "Royal Society of Chemistry",
    institution: "Royal Society of Chemistry",
    url: "https://edu.rsc.org/structure-of-the-atom/atoms-and-isotopes-developing-understanding-14-16-years/4021540.article",
    format: "worksheet",
    published: iso(2025, 6, 10),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "14–16",
    licence: { name: "RSC Education terms of use (classroom use)", url: "https://www.rsc.org/terms-and-conditions", reuse: "reference-only" },
    attribution: "Royal Society of Chemistry, Atoms and isotopes — developing understanding",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The teacher-guidance page (objectives, Johnstone's triangle note, when-to-use and timing) and the worked answers to the four multi-part worksheet questions, including the proton/neutron/electron tables and the statement that an atom with 7 protons is nitrogen and therefore NOT an isotope of carbon.",
    findings:
      "The resource separates the three questions a learner confuses: which element (protons), which isotope (neutrons), which charge (electrons). Its answers state identity first and numbers second, which is the order this model prints.",
    limitations:
      "Classroom-use licence, not an open licence: read and learned from, not copied. Full worksheet is a PDF; the answers were read, not every page of the student sheet.",
    concepts: ["atoms-elements"],
    intendedUse: "Reference for the proton-first sentence order and the isotope/ion distinction in the atom model. No asset reused.",
  },
  {
    id: "arc-vic-atomic-structure",
    title: "Atomic structure — Level 9/10 lesson plan",
    creator: "Victorian Department of Education (Arc)",
    institution: "State Government of Victoria",
    url: "https://arc.educationapps.vic.gov.au/learning/sites/science-chemical-lesson-plans/10347",
    format: "framework",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "14–16",
    licence: { name: "Victorian government education site terms", url: null, reuse: "reference-only" },
    attribution: "State Government of Victoria, Arc — Atomic structure",
    inspection: "inspected",
    depth: "metadata",
    whatWasInspected:
      "The lesson page's vocabulary list and the 'teaching considerations' section, which names two misconceptions and the teaching response to each (isotopes introduced early; chlorine-35/37 as the pair).",
    findings:
      "Names the exact error this model exists to refute — 'if two atoms have different masses, they must be different elements' — and prescribes showing chlorine-35 and chlorine-37 before the periodic-table mass is discussed.",
    limitations:
      "A curriculum support page, not a study: it reports common misconceptions without frequencies. No open licence, so it is a reference only.",
    concepts: ["atoms-elements"],
    intendedUse: "Justifies leading with isotope examples where mass differs and identity does not. No asset reused.",
  },
  {
    id: "canterbury-2015-atomic-structure",
    title: "The investigation of student understanding of atomic structure and bonding",
    creator: "University of Canterbury (thesis)",
    institution: "University of Canterbury",
    url: "https://ir.canterbury.ac.nz/server/api/core/bitstreams/b45fa563-2f01-40a4-8673-289cdd61f519/content",
    format: "research-paper",
    published: iso(2015, 7, 20),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "secondary",
    licence: { name: "All rights reserved (institutional repository)", url: null, reuse: "reference-only" },
    attribution: "University of Canterbury, 2015",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "Table 1 and its discussion (N = 110): the response splits for 'protons are found in the nucleus' (91% true in all cases) and 'the number of protons determines the identity of the atom' (64% true in all cases, 20% 'true in some cases').",
    findings:
      "Proton location is secure for most learners; proton-as-identity is not — a fifth of the sample would only say it is 'sometimes' true. That is the gap the model's proton control targets.",
    limitations:
      "A thesis with one sample (N = 110); read as a table and discussion, not the whole document. Not generalisable by itself, and not a licence to redistribute.",
    concepts: ["atoms-elements"],
    intendedUse: "Evidence that identity-by-proton is the misconception in play, and therefore the control to put in the learner's hands.",
  },
  {
    id: "schmidt-2003-isotopes",
    title: "Changing ideas about the periodic table of elements and students' alternative concepts of isotopes and allotropes",
    creator: "H.-J. Schmidt",
    institution: "Journal of Research in Science Teaching (Wiley)",
    url: "https://onlinelibrary.wiley.com/doi/abs/10.1002/tea.10076",
    format: "research-paper",
    published: iso(2003, 3, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "16–18",
    licence: { name: "Publisher copyright (Wiley)", url: "https://onlinelibrary.wiley.com/terms-and-conditions", reuse: "reference-only" },
    attribution: "Schmidt, J. Res. Sci. Teach. 40 (2003) 257–277",
    inspection: "inspected",
    depth: "abstract",
    whatWasInspected:
      "The published abstract only (3074 senior high students, multiple-choice plus six interviews): the alternative concept that a 'standard' atom has equal protons and neutrons, masses as integers, and graphite/diamond treated as isotopes.",
    findings:
      "Learners hold a norm of 'equal neutrons and protons', so an isotope reads as an anomaly rather than a variant — which is why the model states the neutron count as a separate fact from the element name.",
    limitations:
      "ABSTRACT ONLY: full text is paywalled, so the method and item wording were not read. Frequencies are not available from the abstract and are not quoted anywhere in the product.",
    concepts: ["atoms-elements"],
    intendedUse: "Supports the neutron misconception entry. No claim beyond the abstract is made.",
  },
  {
    id: "acs-2006-nuclear-misconceptions",
    title: "Identifying students' misconceptions about nuclear chemistry",
    creator: "Journal of Chemical Education",
    institution: "American Chemical Society",
    url: "https://pubs.acs.org/doi/10.1021/ed083p1712",
    format: "research-paper",
    published: iso(2006, 11, 1),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "15–16",
    licence: { name: "Publisher copyright (ACS)", url: null, reuse: "reference-only" },
    attribution: "J. Chem. Educ. 2006, 83, 1712",
    inspection: "inspected",
    depth: "abstract",
    whatWasInspected:
      "The published abstract (157 tenth-grade students, diagnostic multiple-choice): students use 'atom', 'element' and 'matter' interchangeably and have not grasped the isotope concept.",
    findings:
      "The word-level confusion is the mechanism: if atom = element, then a change in either particle count reads as a change of element. The model therefore names the element from protons and prints the other two counts as modifiers.",
    limitations:
      "ABSTRACT ONLY; paywalled full text. No frequencies used in the product.",
    concepts: ["atoms-elements"],
    intendedUse: "Supports naming the element before listing neutrons and electrons.",
  },
  // ── Biology: cells ─────────────────────────────────────────────────────────
  {
    id: "eric-2015-draw-write-cells",
    title: "Prospective science teachers' levels of understanding and explanation of animal and plant cells: draw-write",
    creator: "ERICA (ERIC EJ1426889)",
    institution: "ERIC / US Department of Education",
    url: "https://files.eric.ed.gov/fulltext/EJ1426889.pdf",
    format: "research-paper",
    published: iso(2015, 9, 18),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "teacher education",
    licence: { name: "ERIC full text (publicly accessible)", url: "https://eric.ed.gov", reuse: "reference-only" },
    attribution: "ERIC EJ1426889",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The organelle-frequency table (N≈153 drawings) and the paragraph discussing it: 6.5% drew a cell wall in an animal cell, 1.3% drew a chloroplast there, and 13.1% drew a centrosome in a plant cell.",
    findings:
      "Direction matters: the errors are not only 'plant cell = animal cell + extras' — learners also add animal-only parts to plant cells. The model therefore switches the whole organelle set with the cell type instead of letting parts be dragged across.",
    limitations:
      "Sample is prospective teachers, not school pupils; frequencies are small in the animal-cell case. Read as a table plus its discussion, not the whole paper.",
    concepts: ["cells"],
    intendedUse: "Justifies a type switch that cannot be made wrong, and a failure sentence for each missing part.",
  },
  {
    id: "apfslt-2009-cell-teaching",
    title: "A sample teaching design of 'cell' concept and its organelles",
    creator: "Asia-Pacific Forum on Science Learning and Teaching",
    institution: "Education University of Hong Kong",
    url: "https://www.eduhk.hk/apfslt/download/v9_issue2_files/muammer.pdf",
    format: "framework",
    published: iso(2009, 1, 23),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–16",
    licence: { name: "Journal open access (APFSLT)", url: null, reuse: "reference-only" },
    attribution: "APFSLT 9(2), 2009",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The four misconceptions the author lists with citations, the conceptual-change text appendix, and the note that pupils place chloroplasts in ALL plant cells and draw the nucleus always central ('fried-egg model').",
    findings:
      "'Every plant cell has chloroplasts' is wrong for root and storage cells — a real omission this pilot's model shares, because it has no cell-type dimension. Recorded as a limitation rather than hidden.",
    limitations:
      "A teaching design, not an empirical study of misconception frequency.",
    concepts: ["cells"],
    intendedUse: "Source of the 'chloroplast in every plant cell' limitation now printed beside the cell model.",
  },
  {
    id: "atlantis-2021-organelle-misconceptions",
    title: "Analysis of students' misconceptions on structure and function of cell organelles using the four-tier diagnostic test",
    creator: "Atlantis Press (proceedings)",
    institution: "Atlantis Press",
    url: "https://www.atlantis-press.com/article/125957858.pdf",
    format: "research-paper",
    published: iso(2021, 6, 7),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "16–18",
    licence: { name: "Proceedings open access", url: null, reuse: "reference-only" },
    attribution: "Atlantis Press, 2021",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The misconception-by-subconcept table and the discussion of the organelle-function items, including the misconception that the ribosome is the cell's 'power house' (10.31% of responses).",
    findings:
      "Function confusion is specific and nameable — ribosome vs mitochondrion — so the model prints a JOB for each part and what stops when that job stops, rather than a label alone.",
    limitations:
      "One cohort; percentages refer to item responses, not to pupils. Read as results and discussion.",
    concepts: ["cells"],
    intendedUse: "Justifies role-plus-failure framing in the cell model.",
  },
  {
    id: "eric-2025-photosynthesis-misconceptions",
    title: "Misconceptions about the concept of photosynthesis",
    creator: "ERICA (ERIC EJ1468417)",
    institution: "ERIC / US Department of Education",
    url: "https://files.eric.ed.gov/fulltext/EJ1468417.pdf",
    format: "research-paper",
    published: iso(2025, 3, 22),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "secondary",
    licence: { name: "ERIC full text (publicly accessible)", url: "https://eric.ed.gov", reuse: "reference-only" },
    attribution: "ERIC EJ1468417",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The misconception table and its discussion: science students holding that chlorophyll is the organelle where photosynthesis happens, and that photosynthesis needs sunlight to occur at all.",
    findings:
      "Chlorophyll is a pigment inside the chloroplast, not the organelle — the model names the chloroplast as the part and keeps 'absorbs light' as its job, so the part/role distinction is structural.",
    limitations:
      "Small qualitative sample; read as table plus discussion.",
    concepts: ["cells"],
    intendedUse: "Wording of the chloroplast job sentence.",
  },
  // ── Computing: searching ───────────────────────────────────────────────────
  {
    id: "oak-binary-search-ks4",
    title: "Binary search — KS4 Computer Science (OCR) lesson",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/computing-secondary-ks4-gcse-ocr/units/searching-and-sorting-algorithms/lessons/binary-search",
    format: "slides",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "14–16",
    licence: { name: "Oak National Academy terms (openly available, not CC)", url: "https://www.thenational.academy/legal/terms", reuse: "reference-only" },
    attribution: "Oak National Academy, Binary search (KS4)",
    inspection: "inspected",
    depth: "metadata",
    whatWasInspected:
      "The lesson overview: learning outcome, the four key learning points, keywords, the 'common misconception' block ('A binary search can be performed on any data') and the teacher tip to run a binary search on an unordered list to show why it fails. The downloadable slide deck itself was NOT opened.",
    findings:
      "The lesson treats the precondition as the teaching point, not a footnote, and demonstrates the failure rather than asserting it. This model refuses to run on an unsorted list for the same reason.",
    limitations:
      "Slides not opened: the description page was read, the PPTX was not inspected. Reference only, no asset reused.",
    concepts: ["algorithms-search"],
    intendedUse: "Frames the precondition, and supplies the 'run it and watch it fail' teaching move.",
  },
  {
    id: "oak-comparing-searching",
    title: "Comparing searching algorithms — KS4 lesson",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/computing-secondary-ks4-gcse-ocr/units/searching-and-sorting-algorithms/lessons/comparing-searching-algorithms",
    format: "slides",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "14–16",
    licence: { name: "Oak National Academy terms", url: "https://www.thenational.academy/legal/terms", reuse: "reference-only" },
    attribution: "Oak National Academy, Comparing searching algorithms (KS4)",
    inspection: "inspected",
    depth: "metadata",
    whatWasInspected:
      "The lesson overview and its quiz items: the key points ('the algorithm you use depends on the data and context', 'coding a binary search is more complex'), and the three sample questions with answers, including 'linear search works on both sorted and unsorted lists'.",
    findings:
      "The comparison is taught as a judgement about data and context, not a league table — which is exactly the belief this model has to leave intact while still showing binary's advantage on a long sorted list.",
    limitations:
      "Description page and quiz items only; the PPTX was not opened.",
    concepts: ["algorithms-search"],
    intendedUse: "Frames the deliberate 'it depends' conclusion of the search model.",
  },
  {
    id: "cmu-15122-binsearch",
    title: "Lecture 6: Binary Search (15-122 Principles of Imperative Computation)",
    creator: "Carnegie Mellon University",
    institution: "Carnegie Mellon University",
    url: "https://www.cs.cmu.edu/~15122-archive/n17/lec/06-binsearch.pdf",
    format: "slides",
    published: iso(2017, 2, 6),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "undergraduate",
    licence: { name: "Course material (institutional)", url: null, reuse: "reference-only" },
    attribution: "CMU 15-122 lecture notes",
    inspection: "inspected",
    depth: "asset",
    whatWasInspected:
      "The algorithm statement and the cost argument in the notes' text: the sorted-array requirement, halving each iteration, and the c·log2 n bound with the n = 13 → 16 rounding example.",
    findings:
      "The cost argument is about halving, not about speed in general; the notes make the precondition and the log bound the same argument. The model's comparison count is the same quantity the notes bound.",
    limitations:
      "Undergraduate lecture notes: the level is above this pilot, so only the counting argument is borrowed, not the presentation.",
    concepts: ["algorithms-search"],
    intendedUse: "Basis for counting comparisons per step and the 'each step halves the window' claim.",
  },
  {
    id: "pressbooks-open-guide-search",
    title: "Search — An Open Guide to Data Structures and Algorithms",
    creator: "PALNI Pressbooks",
    institution: "Private Academic Library Network of Indiana",
    url: "https://pressbooks.palni.org/anopenguidetodatastructuresandalgorithms/chapter/search",
    format: "textbook",
    published: iso(2023, 10, 31),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "undergraduate",
    licence: { name: "Open textbook (Pressbooks, CC)", url: "https://pressbooks.palni.org/anopenguidetodatastructuresandalgorithms/", reuse: "reference-only" },
    attribution: "PALNI Pressbooks, An Open Guide to Data Structures and Algorithms",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The Linear Search and Binary Search sections: the O(n) worst case, the sorted-order precondition and the sentence that the requirement is 'not cost-free'.",
    findings:
      "Names the cost the precondition hides — sorting is work — which is the counterweight to 'binary is better'.",
    limitations:
      "Undergraduate text; only the two sections were read.",
    concepts: ["algorithms-search"],
    intendedUse: "Supports the model's 'it depends' conclusion and the note that sorting is not free.",
  },
  // ── Physics: circuits ──────────────────────────────────────────────────────
  {
    id: "phet-cck-dc",
    title: "Circuit Construction Kit: DC",
    creator: "PhET Interactive Simulations",
    institution: "University of Colorado Boulder",
    url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc",
    format: "interactive-simulation",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–18",
    licence: { name: "CC BY-NC 4.0", url: "https://phet.colorado.edu/en/licensing", reuse: "reference-only" },
    attribution: "PhET Interactive Simulations, University of Colorado Boulder",
    inspection: "inspected",
    // THIS RECORD USED TO SAY THE SIM HAD NEVER BEEN RUN. It said so at depth
    // `metadata`, and that was true at the time. It is now an operated record: the
    // sim was launched, entered and driven through its own controls, and the scene
    // was read from the rendered frame. The older, weaker sentence is gone rather
    // than kept beside the new one, because two claims about the same act is how a
    // register starts to look like a bibliography.
    depth: "interactive-tested",
    whatWasInspected:
      "The simulation operated, not opened: launched, entered the Intro screen from its two-card launcher, then clicked the sim's own component controls to add a battery, a light bulb and three wires into the construction area, and read the result from the rendered frame (components placed, every terminal circled as unconnected). Also switched the launcher card to read the Lab description and read the sim's accessibility description of the play area, component toolbox and sensor toolbox.",
    findings:
      "What the sim asks a learner to DO is the finding. (a) Every component arrives with its terminals circled and nothing joins itself: the sim's first demand is that the loop be closed, terminal by terminal, before any reading appears. (b) No current is shown until the loop and switch are closed, so 'no reading' is the visible consequence of an open circuit — the same choice our model makes, reached independently. (c) The display panel makes the CONVENTION explicit: Electrons (blue dots along the wire) or Conventional (red arrows), a choice our model silently makes for the learner. (d) Values are off by default behind a checkbox — the right default for a first look, and the reason our model prints readings beside the drawing instead of in a panel. (e) The interaction pattern, not the artwork, is what OpenMind's model copies: one loop, two readings, controls for cells, bulbs and the switch.",
    limitations:
      "The sim was operated only through its component controls: components could be added and the scene read, but they could not be dragged into contact in this browser automation, so NO closed circuit was built, no bulb was lit and no ammeter reading was taken — this record must never be cited as if one had been. Nothing in our model was checked against a measurement here. CC BY-NC: it may not be adapted or redistributed inside a CC BY-SA product, so it is reference-only and is not embedded.",
    concepts: ["electricity-circuits"],
    intendedUse: "Design reference for OpenMind's original model; not embedded, not copied.",
  },
  {
    id: "phet-licensing",
    title: "PhET Licensing Information",
    creator: "PhET Interactive Simulations",
    institution: "University of Colorado Boulder",
    url: "https://phet.colorado.edu/en/licensing",
    format: "policy",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: null,
    licence: { name: "PhET terms of use", url: "https://phet.colorado.edu/en/licensing", reuse: "reference-only" },
    attribution: "PhET Interactive Simulations",
    inspection: "inspected",
    depth: "full-text",
    whatWasInspected:
      "The licensing page text: regular HTML simulation files are CC BY-NC 4.0; simulations published before 29 March 2026 were CC BY 4.0; commercial use is defined and requires a partnership.",
    findings:
      "The licence changed in 2026, so a blanket statement about PhET's terms would now be wrong. It is NC for current files and BY for older ones.",
    limitations: "Non-commercial terms are incompatible with re-licensing inside a CC BY-SA work.",
    concepts: ["electricity-circuits"],
    intendedUse: "Licence gate for any future decision to use a PhET asset.",
  },
  {
    id: "iop-2021-analogical-simulation",
    title: "An analogical simulation for teaching electric circuits: a rationale for use in lower secondary school",
    creator: "Physics Education (IOP)",
    institution: "IOP Publishing",
    url: "https://iopscience.iop.org/article/10.1088/1361-6552/ac03fe",
    format: "research-paper",
    published: "2021-06-17",
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–16 (studied)",
    licence: { name: "© IOP Publishing (all rights reserved)", url: null, reuse: "reference-only" },
    attribution: "Physics Education, IOP Publishing",
    inspection: "inspected",
    depth: "abstract",
    whatWasInspected:
      "The abstract and the enumerated alternative conceptions (a)–(d): current used up proportional to resistance; battery as constant current; voltage as a property of current; current travelling element-by-element.",
    findings:
      "Four named alternative conceptions, each testable against a model: (a) used-up current, (b) constant-current battery, (c) voltage as a property of current, (d) element-by-element travel. OpenMind's circuit beliefs are drawn from these and (a), (b), (d) are the ones the model can refute by observation.",
    limitations: "Paywalled full text; only the abstract and the listed conceptions were read.",
    concepts: ["electricity-circuits"],
    intendedUse: "Design evidence for the model's two-ammeter display and its belief list.",
  },
  {
    id: "physrevper-2024-conceptual-resources",
    title: "Student conceptual resources for understanding electric circuits",
    creator: "Physical Review Physics Education Research",
    institution: "APS",
    url: "https://link.aps.org/doi/10.1103/PhysRevPhysEducRes.20.020128",
    format: "research-paper",
    published: "2024-10-11",
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "upper secondary / introductory university",
    licence: { name: "© American Physical Society (all rights reserved)", url: null, reuse: "reference-only" },
    attribution: "Phys. Rev. Phys. Educ. Res. 20, 020128",
    inspection: "inspected",
    depth: "abstract",
    whatWasInspected:
      "The abstract, including its account of the 'battery is a constant current source' literature and the 2024 finding that substance-based language is often productive rather than predictive of error.",
    findings:
      "The constant-current misconception is described as the most pervasive and persistent difficulty in DC circuits — and this paper argues that substance-based reasoning about current is not, on its own, evidence of a misconception.",
    limitations: "Abstract only; the instrument and analysis are behind the paywall.",
    concepts: ["electricity-circuits"],
    intendedUse: "Cited in the dossier's disagreement record; shapes feedback so it corrects a prediction rather than a vocabulary.",
  },
  {
    id: "tused-2007-simple-circuits",
    title: "Secondary School Students' Misconceptions about Simple Electric Circuits",
    creator: "Journal of Turkish Science Education",
    institution: "TUSED",
    url: "https://www.tused.org/index.php/tused/article/download/663/568/1140",
    format: "research-paper",
    published: "2007-09-22",
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "secondary",
    licence: { name: "© TUSED (all rights reserved)", url: null, reuse: "reference-only" },
    attribution: "Journal of Turkish Science Education, 2007",
    inspection: "inspected",
    depth: "section",
    whatWasInspected:
      "The listed misconceptions with response frequencies, including current consumed by components, clashing currents from both poles, batteries as constant current sources (36.8% of responses in one item) and sequential reasoning about position in a series loop.",
    findings:
      "Sequential reasoning — 'a change before the bulb matters, a change after it does not' — is reported as its own error, which is why OpenMind's model puts one reading before the bulb and one after and never lets them differ.",
    limitations: "Sample of 76 students in one national context; frequencies are not transferable, the phenomena are.",
    concepts: ["electricity-circuits"],
    intendedUse: "Misconception catalogue behind CIRCUIT_BELIEFS.",
  },
  {
    id: "pacificu-2006-electricity-misconceptions",
    title: "Toward Learning and Understanding Electricity: Challenging Persistent Misconceptions",
    creator: "Wainwright",
    institution: "Pacific University",
    url: "https://fg.ed.pacificu.edu/wainwright/Publications/MisconceptionsArticle.06.pdf",
    format: "research-paper",
    published: "2006-12-20",
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "secondary / teacher education",
    licence: { name: "© author (all rights reserved)", url: null, reuse: "reference-only" },
    attribution: "Wainwright, Pacific University, 2006",
    inspection: "inspected",
    depth: "full-text",
    whatWasInspected:
      "The enumerated misconceptions: current consumption, local reasoning, battery agency and clashing currents — including the specific claim that a single bulb 'will light if connected to a cell with one wire'.",
    findings:
      "Clashing currents is the belief the open-switch state exists to refute: one wire is not a circuit. Local reasoning (equal division at a junction) is noted for the parallel case, which this model does not yet teach.",
    limitations: "Conference-style paper, not a controlled study.",
    concepts: ["electricity-circuits"],
    intendedUse: "Source for the clashing-currents belief and for the model's open-switch copy.",
  },

  // ── Licences and reuse policy (apply to every subject) ─────────────────────
  {
    id: "openstax-licensing",
    title: "OpenStax textbook licensing",
    creator: "OpenStax",
    institution: "Rice University",
    url: "https://help.openstax.org/s/article/Openstax-textbook-licensing-and-customization",
    format: "policy",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: null,
    licence: { name: "CC BY-NC-SA 4.0 (the library's current terms)", url: "https://creativecommons.org/licenses/by-nc-sa/4.0/", reuse: "reference-only" },
    attribution: "OpenStax, Rice University",
    inspection: "inspected",
    depth: "full-text",
    whatWasInspected:
      "The licensing help page and the 2026 announcement that the library moved from a mix of CC BY and CC BY-NC-SA to CC BY-NC-SA across titles.",
    findings:
      "The NC term is the blocker, not the SA term: an NC work cannot be redistributed inside a product whose content is CC BY-SA. OpenStax is therefore a knowledge source (accuracy checks, worked-example style), not an asset source.",
    limitations: "Titles published earlier under CC BY remain reusable under that grant; each edition must be checked individually.",
    concepts: [],
    intendedUse: "Licence doctrine; no OpenStax text or figure is reused.",
  },
  {
    id: "ck12-license",
    title: "CK-12 Curriculum Materials License",
    creator: "CK-12 Foundation",
    institution: "CK-12 Foundation",
    url: "https://info.ck12.org/curriculum-materials-license",
    format: "policy",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: null,
    licence: { name: "CK-12 Curriculum Materials License", url: "https://info.ck12.org/curriculum-materials-license", reuse: "reference-only" },
    attribution: "CK-12 Foundation",
    inspection: "inspected",
    depth: "full-text",
    whatWasInspected: "The licence summary: educational purposes only, modifications must carry the same licence, attribution required.",
    findings: "A bespoke licence with educational-purpose limits and a share-back grant; not a CC licence, so it cannot be mixed into BY-SA material.",
    limitations: "Bespoke terms require legal reading before any use beyond reading.",
    concepts: [],
    intendedUse: "Recorded so a future author cannot assume 'CK-12 is free' means 'reusable'.",
  },
  {
    id: "youtube-developer-policies",
    title: "YouTube API Services Developer Policies",
    creator: "Google / YouTube",
    institution: "Google",
    url: "https://developers.google.com/youtube/terms/developer-policies/",
    format: "policy",
    published: null,
    accessedOn: null,
    language: "en",
    ageRange: null,
    licence: { name: "YouTube Terms of Service", url: "https://www.youtube.com/t/terms", reuse: "reference-only" },
    attribution: "YouTube",
    inspection: "identified",
    depth: "discovered",
    findings:
      "Downloading, caching, importing or storing audiovisual content requires prior written approval; embedding through the official player is the supported route. OpenMind therefore links out (its existing lesson video cards are links, not embeds) and stores no video bytes.",
    limitations: "Not re-read for this pass: recorded as identified, not inspected.",
    concepts: [],
    intendedUse: "The rule the existing video card already follows.",
  },
  {
    id: "cc-remixing",
    title: "Remixing CC-Licensed Work (CC Certificate, unit 4.4)",
    creator: "Creative Commons",
    institution: "Creative Commons",
    url: "https://creativecommons.org/course/cc-cert-edu/unit-4-using-cc-licenses-and-cc-licensed-works/4-4-remixing-cc-licensed-work",
    format: "policy",
    published: "2025-03-27",
    accessedOn: ACCESSED,
    language: "en",
    ageRange: null,
    licence: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/", reuse: "reference-only" },
    attribution: "Creative Commons",
    inspection: "inspected",
    depth: "full-text",
    whatWasInspected: "The remixing rules: ND forbids sharing an adaptation; SA obliges the adaptation to carry the same or a compatible licence; attribution is always required.",
    findings: "This is the rule that turns 'nice resource' into 'reference only' for ND material, and the rule that keeps BY-SA and BY material admissible.",
    limitations: "Guidance for course authors rather than a source of subject content.",
    concepts: [],
    intendedUse: "The doctrine `validateResearch` enforces.",
  },
  {
    id: "csunplugged-licence",
    title: "CS Unplugged copyright and licence page",
    creator: "CS Unplugged",
    institution: "University of Canterbury",
    url: "https://csunplugged.org/en/copyright/",
    format: "policy",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: null,
    licence: { name: "not established (page unavailable)", url: null, reuse: "reference-only" },
    attribution: "CS Unplugged",
    inspection: "blocked",
    depth: "discovered",
    findings: "The licence page returned HTTP 404, so the terms could not be established. Unestablished terms are treated as non-reusable.",
    limitations: "404 at the recorded URL; a later pass must find the current licence page before any use.",
    concepts: ["algorithms-search"],
    intendedUse: "Recorded as blocked. Nothing from CS Unplugged is used.",
  },

  // ── Frameworks (design constraints, not assets) ────────────────────────────
  {
    id: "cast-udl-3-0",
    title: "Universal Design for Learning Guidelines 3.0",
    creator: "CAST",
    institution: "CAST",
    url: "https://udlguidelines.cast.org/",
    format: "framework",
    published: "2024",
    accessedOn: null,
    language: "en",
    ageRange: null,
    licence: { name: "CAST terms (check before reuse)", url: null, reuse: "reference-only" },
    attribution: "CAST",
    inspection: "identified",
    depth: "discovered",
    findings:
      "Multiple means of engagement, representation and action/expression. Used as a checklist: every model offers a text readout as well as a drawing, and the lesson already supports a text-only preference.",
    limitations: "Guidelines not read in full for this pass.",
    concepts: [],
    intendedUse: "Design constraint on components, not content.",
  },
  {
    id: "eef-metacognition",
    title: "Metacognition and self-regulated learning guidance",
    creator: "Education Endowment Foundation",
    institution: "EEF",
    url: "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition",
    format: "framework",
    published: "2025",
    accessedOn: null,
    language: "en",
    ageRange: null,
    licence: { name: "EEF terms (check before reuse)", url: null, reuse: "reference-only" },
    attribution: "Education Endowment Foundation",
    inspection: "identified",
    depth: "discovered",
    findings: "Activate prior knowledge, model thinking, guided practice, independent practice, reflection — the order the lesson already uses (retrieval → worked example → faded together → practice → traps).",
    limitations: "Not read in full for this pass.",
    concepts: [],
    intendedUse: "Confirms the existing stage order; no content copied.",
  },
  {
    id: "worldbank-structured-pedagogy",
    title: "Structured pedagogy (World Bank education approach paper)",
    creator: "World Bank",
    institution: "World Bank",
    url: "https://documents1.worldbank.org/curated/en/099063023145523057/pdf/P17857701e1a0a0e008dc00c2c22f619135.pdf",
    format: "framework",
    published: "2023",
    accessedOn: null,
    language: "en",
    ageRange: null,
    licence: { name: "World Bank open access (check terms)", url: null, reuse: "reference-only" },
    attribution: "World Bank",
    inspection: "identified",
    depth: "discovered",
    findings: "Materials must work in real classrooms: large classes, shared devices, multilingual delivery, formative assessment. This is why every new component has an offline/text path and why the teacher route exists.",
    limitations: "Not read in full for this pass.",
    concepts: [],
    intendedUse: "Design constraint on classroom viability.",
  },

  // ── EXTERNAL MULTIMEDIA, READ AT TRANSCRIPT DEPTH ────────
  //
  // Five published lesson transcripts, one per pilot subject. These are the first
  // records in the register written from a VIDEO's own words rather than from a
  // paper about the topic. The rung is `transcript`, not `video-segment`, on
  // purpose: what was read is the published transcript, and no frame was watched.
  // A project that prints "watched" for a transcript has not inspected the video.
  //
  // WHAT THEY TAUGHT US is a technique, not a fact — the register already holds
  // the research on misconceptions. Each record says which technique was adopted
  // and that the words were rewritten rather than copied.
  {
    id: "oak-linear-search-video",
    title: "Linear search (lesson video and transcript)",
    creator: "Mrs Holborow",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/pupils/programmes/computing-secondary-year-10-gcse-aqa/units/searching-and-sorting-algorithms/lessons/linear-search/video",
    format: "video",
    published: iso(2026, 7, 22),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "14–16",
    licence: {
      name: "Open Government Licence v3.0 (Oak National Academy)",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Linear search' lesson video (2026), OGL v3.0",
    inspection: "inspected",
    depth: "video-segment",
    whatWasInspected:
      "The complete published transcript, followed by the segment 04:40–06:45 of the same 20:31 video actually played in a browser with the 'British English CC' subtitle track on, and paused for frame inspection at 04:53 and 06:31. In the 04:53 frame: a purple title bar reading 'Describe how linear search finds an item', a slide headed 'Each number is hidden under a cup. The cups are arranged in a random order. From the cups, the number to find (search item) is 126.', nine red cups labelled cup 1 to cup 9 in a row, a five-step instruction list underneath, and the presenter in a picture-in-picture inset. In the 06:31 frame: cup 4 lifted out of the row above a dashed box labelled 'current' and showing the value 9, with step 3 ('Compare the item at the current position to the search item') emphasised in the list while steps 1–2 are greyed.",
    findings:
      "The teaching technique is the one our model was missing: BEST-CASE AND WORST-CASE are named as separate ideas before any complexity language appears, and the front-of-list item is used to show that one at a time wins in one look. The demonstration is physical — nine cups, one turned at a time — so the count is performed rather than asserted. Watching it adds three things a transcript cannot show: (a) the five-step instruction list stays on screen for the whole demonstration and the step being executed is emphasised in place, so the algorithm is read as a state rather than remembered as a list; (b) the cup at the cursor is lifted ABOVE the row and the position is marked by a dashed 'current' box, so the thing being compared is visually separated from the things not yet touched; (c) NO COMPARISON COUNT IS EVER DISPLAYED. The learner has to count the cups themselves, and the number of looks is only stated afterwards, in the worked answer on paper cards. That gap is exactly what the search model's look counter fills, and it is the strongest design lesson from the segment: the demonstration shows position, not cost.",
    limitations:
      "Three of the video's twenty-one minutes were viewed (04:40–06:45), not the whole lesson; the rest is known only from the transcript. Audio was not independently heard — the player was muted and the words were read from the British English caption track — so this record does not claim the narration was listened to. Slides and worksheet attached to the lesson were not opened. It is a single lesson, not a syllabus.",
    concepts: ["algorithms-search"],
    intendedUse:
      "LINKED as an optional external video, with its licence printed on the card. OGL v3.0 is NOT on this project's cleared list for adaptation, so nothing is adapted: the best-case/worst-case framing and the 'first item' comparison are rewritten from the idea, and no transcript text is reproduced.",
  },
  {
    id: "khan-fractions-number-line-video",
    title: "Fractions on a number line (video)",
    creator: "Sal Khan",
    institution: "Khan Academy",
    url: "https://www.khanacademy.org/math/cc-third-grade-math/imp-fractions/imp-fractions-on-the-number-line/v/fractions-on-a-number-line",
    format: "video",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "8–11",
    licence: {
      name: "CC BY-NC-SA 4.0 (stated on the page)",
      url: "https://creativecommons.org/licenses/by-nc-sa/4.0",
      reuse: "reference-only",
    },
    attribution: "Khan Academy, 'Fractions on a number line' (4:16), CC BY-NC-SA 4.0",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The complete video transcript, 4:16 by the page's own duration: the circle cut into five, the same five cuts carried onto the 0–1 interval of a number line, the labels 1/5 to 5/5, and the explicit statement that 5/5 is 1.",
    findings:
      "The bridge from part-whole to magnitude is built in ONE move: the same five pieces that shade a circle are laid onto the segment from 0 to 1, and the count of pieces becomes the distance travelled towards 1. The narration says the quiet part out loud — 'this is actually a number … not just what part of a pizza pie I have eaten' — which is exactly the shift the fraction-line model exists to make.",
    limitations:
      "Transcript only. NC licence: reference-only in this project, so nothing is embedded or adapted from it. One short video, no research evidence in it — it is a teaching demonstration, not a study.",
    concepts: ["fractions"],
    intendedUse:
      "Reference for the sequence the fraction-line model follows (bar first, then the same cut on the line, then the label). Not linked by default because the audio is English only and the licence does not permit reuse.",
  },
  {
    id: "oak-fractions-numbers-video",
    title: "Checking and securing understanding of fractions (lesson video)",
    creator: "Ms Coo",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/pupils/programmes/maths-secondary-year-7/units/comparing-and-ordering-fractions-and-decimals-positive-and-negative/lessons/checking-and-securing-understanding-of-fractions/video",
    format: "video",
    published: iso(2025, 8, 26),
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "11–12",
    licence: {
      name: "Open Government Licence v3.0 (Oak National Academy)",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Checking and securing understanding of fractions' lesson video (2025), OGL v3.0",
    inspection: "inspected",
    depth: "video-frames-sampled",
    // THE PLAYER WOULD NOT RUN. Oak's mux-player never upgraded in this browser
    // (its script host did not resolve and the element kept no shadow root), so the
    // video was taken from the signed stream the page itself requested and frames
    // were decoded at four timestamps. That is a real watch of four moments, not a
    // continuous viewing, and the record says exactly that.
    whatWasInspected:
      "Four frames decoded from the lesson's own signed video stream at 02:30, 07:00, 11:40 and 16:40 of a 23:11 video, and viewed. 02:30, section headed 'Using fractions to describe diagrams': 'What fraction of the whole rectangle is shaded?', a 2×5 rectangle with three cells shaded, answered 'This is 3/10'. 07:00: 'Which is larger 1/5 or 3/5?', followed by 1/5 drawn as one large block of a long bar and 3/5 as three small blocks of a short bar, closing with 'Paying attention to what is defined as the whole is important when using fractions to describe diagrams.' 11:40, a 'Check' slide: a staircase of ten labelled bars (w, r, g, p, y, d, b, t, B, O) on a grid, with d = 1 whole, asking for the missing lengths of g = 1/2, r = 1/3 and y = 5/6. 16:40, section headed 'Fractions as numbers on the number line': a line from 0 to 7 with seven equal divisions and the sentence 'Divide the line equally into 7 parts between 0 and 7. This means each section will be worth 1.'",
    findings:
      "Two techniques this project did not have. (a) THE WHOLE IS REDEFINED IN FRONT OF THE LEARNER: the same question ('which is larger') is asked with 1/5 of a long bar and 3/5 of a short one, so the larger fraction has the smaller piece, and the only way out is to ask what the whole is. Our fraction-line model fixes the whole at exactly 1 and therefore cannot show this at all — it is written into the model's limitations. (b) THE TASK RUNS BACKWARDS: given the length that stands for 1 whole, find the length of 5/6, which is the inverse of the position task our model performs. A learner who can only go fraction→position has a procedure; the return trip is the understanding. The video also carries its own section headers ('Using fractions to describe diagrams', 'Check', 'Fractions as numbers on the number line') on screen throughout, the same keep-the-structure-visible technique the linear-search lesson used.",
    limitations:
      "Four sampled frames of twenty-three minutes, with the published transcript for the rest; the audio was not heard and the narration was not evaluated for clarity or pace. The player itself could not be operated in this automation (Oak's mux-player did not initialise), so playback, pause and caption rendering were not checked. Worksheet and slides attached to the lesson were not opened, and the page reported a worksheet asset that its pupil view never links. OGL v3.0 is not on this project's cleared list for adaptation, so nothing is adapted from it.",
    concepts: ["fractions"],
    intendedUse:
      "Design reference for the fraction line and the authored fractions lesson: the 'what is the whole' trap is now written into the lesson's traps, and the reverse task is recorded as the next extension the model needs. Not embedded and not linked.",
  },
  {
    id: "drfrost-fractions-slides",
    title: "Year 7 Fractions (lesson PowerPoint)",
    creator: "Dr J Frost",
    institution: "Dr Frost Learning (registered charity 1194954)",
    url: "https://www.drfrost.org/uploads/JFrost/files/Yr7-Fractions.pptx",
    format: "slides",
    published: iso(2015, 10, 13),
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "11–12",
    licence: {
      name: "Dr Frost Learning website terms: personal/student use, modification for educational purposes only, no commercial use, attribution required",
      url: "https://www.drfrost.org/website-terms",
      reuse: "reference-only",
    },
    attribution: "Dr J Frost, 'Year 7 Fractions', Dr Frost Learning (last modified 13 October 2015)",
    inspection: "inspected",
    depth: "slides-text",
    whatWasInspected:
      "The PowerPoint file itself: downloaded as a 1.3 MB PPTX, opened as a package and read slide by slide — 28 slides, 66 embedded media files. Read: the title/objectives slide, the four-lesson teacher-guidance slide, and every teaching slide from 'STARTER :: Equivalent Fractions' through 'Adding Fractions', 'A Quicker (Mental) Method', mixed and improper numbers, adding and subtracting mixed numbers, multiplying and cross-cancelling, multiplying mixed numbers, dividing fractions, embedded fractions, 'Fractions of Amounts', 'Reverse Fractions of Amounts' and the four exercise slides.",
    findings:
      "The structure is a worked-example chain, not a page of questions: each skill gets a statement of the method, one worked example, a 'Check Your Understanding' slide, then an exercise. Two authoring moves are worth taking. (a) The deck NAMES the wrong answer rather than describing it — a slide is headed 'Schoolboy Error: thinking the answer is …' and shows the wrong result produced by multiplying across mixed numbers. That is the same principle as our per-option notes: a distractor is worth more when it says what it is. (b) The sequence builds to 'Fractions of Amounts' and then immediately to 'Reverse Fractions of Amounts' (given 3/7 of a number is 18, find the number), the same return trip the Oak fractions video demonstrates at 11:40 — two independent UK resources treating the inverse as part of the same unit.",
    limitations:
      "TEXT ONLY: the 66 embedded images, diagrams and animations were not rendered, so the visual explanations and any fraction-bar artwork are not part of this record. Answers on the slides are typed as '?' placeholders, so several worked answers exist only as animation steps that the text extraction cannot see. The terms permit classroom modification but not commercial use and require attribution, which is not a Creative Commons licence: nothing may be embedded or adapted.",
    concepts: ["fractions", "fraction-ops"],
    intendedUse:
      "Reference for the shape of an OpenMind lesson sequence and for the reverse-fraction idea; the 'name the wrong answer' move is already what our per-option notes do. Not embedded, not adapted, not redistributed.",
  },
  {
    id: "jaques-fractions-worksheet",
    title: "Fractions of Amounts — Year 3 worksheet",
    creator: "Mini Minds Hub",
    institution: "Jaques of London",
    url: "https://www.jaqueslondon.co.uk/blogs/resources/fractions-of-amounts-year-3-worksheet",
    format: "worksheet",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "7–8",
    licence: {
      name: "Free to print for home and classroom use (stated on every page)",
      url: "https://www.jaqueslondon.co.uk/blogs/resources/fractions-of-amounts-year-3-worksheet",
      reuse: "reference-only",
    },
    attribution: "Mini Minds Hub / Jaques of London, 'Fractions of Amounts' worksheet (Year 3)",
    inspection: "inspected",
    depth: "asset",
    whatWasInspected:
      "The two-page PDF itself, read in full. Page 1: a name/date/score header, 18 numbered items in three named sections (Warm up, Practise, Stretch yourself) plus a Challenge, all of the form 'A quarter of 32 =', 'A tenth of 40 =', 'A fifth of 40 =', 'A third of 12 =', and the challenge 'A bag has 6 sweets. One part out of 2 equal parts is red. How many sweets are red?'. Page 2: an answer key for every item, plus 'Notes for adults' and a listed curriculum link (Year 3: recognise, find and write fractions of a discrete set of objects, including unit fractions with small denominators).",
    findings:
      "The sheet's whole design is ONE relation — a unit fraction of an amount is a division — and it sequences it deliberately: quarters and halves of numbers that divide exactly, then tenths and fifths, then thirds, then a single word problem where the fraction has to be read out of a sentence. The answers are on a separate page with the adult notes, so the sheet is built for a classroom or a parent rather than for self-marking. Useful as a model of a PRINTABLE version of a digital interaction: it does the same job our fraction model does for amounts (divide by the denominator) with no device.",
    limitations:
      "No number-line items and no reasoning items: nothing on the sheet asks a learner to compare fractions, so it cannot address the denominator misconception that our fraction line exists for. Copyright is 'free to print', not a Creative Commons licence, and there is no permission to adapt or redistribute — so this is reference-only and no item is copied into our bank.",
    concepts: ["fractions", "percentages"],
    intendedUse:
      "Design reference for the printable side of the fractions lesson: the sheet keeps every answer on a page the learner does not hold, which this project's printed path does not do (`lib/lesson-print.ts` carries no answers), so the gap is recorded for the educator review rather than copied. Not embedded, not adapted.",
  },
  {
    id: "oak-electric-current-video",
    title: "Electric current (KS3 lesson video and transcript)",
    creator: "Mrs Hudson",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/pupils/programmes/science-secondary-year-8/units/series-circuits/lessons/electric-current/video",
    format: "video",
    published: null,
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "12–14",
    licence: {
      name: "Open Government Licence v3.0 (Oak National Academy)",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Electric current' lesson video, OGL v3.0",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The complete published transcript: keyword definitions, the lemon-cell demonstration, the electron-direction checks, the river analogy with a question asking what the water represents, the 'current is the same at every point' sequence with three identical lamps, and the closing task and summary.",
    findings:
      "Two techniques worth taking. (a) THE CHARGE IS NOT ABSENT WHEN THE CIRCUIT IS BROKEN — it is present in the cell, wires and bulb and simply not moving, which is the sentence that unseats 'the battery makes electricity'. (b) The river analogy is immediately TESTED ('what does the model use to represent charge?'), so the analogy is a claim with an answer rather than decoration. The lesson also states that electrons drift at millimetres per second while the lamps light at once, which is the fact learners disbelieve.",
    limitations:
      "Transcript only; video not watched, slides and worksheet not opened. The lesson is qualitative — it does not use V = IR, so it does not support our model's quantitative readings on its own.",
    concepts: ["electricity-circuits"],
    intendedUse:
      "Linked as an optional external video where language and data preference allow; nothing is adapted from it. The 'charge is present but not moving' idea is rewritten into the circuit model's open-switch readout in our own words.",
  },
  {
    id: "oak-atoms-elements-video",
    title: "Atoms and elements (KS3 lesson video and transcript)",
    creator: "Mrs Mytum-Smithson",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/pupils/programmes/science-secondary-year-8/units/atoms-elements-and-compounds/lessons/atoms-and-elements/video",
    format: "video",
    published: iso(2026, 10, 11),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "12–14",
    licence: {
      name: "Open Government Licence v3.0 (Oak National Academy)",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Atoms and elements' lesson video (2026), OGL v3.0",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The complete published transcript: matter defined by volume and mass with a helium balloon weighed on a balance, the gold bar cut in half repeatedly, the grain of sand counted at 30 quadrillion atoms, Dalton's indivisible sphere, the element definition and 118 count, symbol conventions, three checks for understanding and a correction task.",
    findings:
      "SCALE IS TAUGHT BY COUNTING, not by saying 'very small': a grain of sand holds about 30 quadrillion atoms and an onion-skin cell about 100 trillion. Dalton's sphere is presented as a MODEL with a date and a limitation, which is the same move our assumptions register makes. The checks correct named pupils' sentences, so the error is attributed to a character rather than to the learner.",
    limitations:
      "Transcript only; video, slides and worksheet not opened. Dalton's model is historical, and the transcript does not reach isotopes or ions, which our model adds for 14–16.",
    concepts: ["atoms-elements"],
    intendedUse:
      "Linked where language and data preference allow. The counting-by-scale technique informed the teacher notes; no text copied.",
  },
  {
    id: "oak-animal-cell-video",
    title: "Animal cell structures and their functions (KS3 lesson video and transcript)",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/pupils/programmes/science-secondary-year-7/units/cells/lessons/animal-cell-structures-and-their-functions/video",
    format: "video",
    published: iso(2026, 10, 2),
    accessedOn: ACCESSED,
    language: "en",
    ageRange: "11–12",
    licence: {
      name: "Open Government Licence v3.0 (Oak National Academy)",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Animal cell structures and their functions' lesson video (2026), OGL v3.0",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The complete published transcript: 2D versus 3D cells, the plasticine model task, the four animal-cell structures and their jobs, the house analogy, and a full evaluation of three cell models (bag, sponge, box) against the real cell.",
    findings:
      "THE MODEL IS EVALUATED IN FRONT OF THE LEARNER: a bag is like a membrane but does not control what passes; a sponge shows 3D cytoplasm but its mitochondria are flat; a box has no membrane at all. That is the same discipline as our `couldIntroduce` field, done aloud — and it is more honest than a caption saying 'this is only a model'. The analogy (cell = one house in a town) is used to give each organelle a job, not to replace the vocabulary.",
    limitations:
      "Transcript only; video, slides and worksheet not opened. Animal cells only: no plant cell, no root-hair cell, so the 'every plant cell has chloroplasts' belief is untouched by this lesson.",
    concepts: ["cells"],
    intendedUse:
      "Linked where language and data preference allow. The evaluate-the-model technique is adopted in the cell model's limitations text and in the teacher's printable alternative; no text copied.",
  },
  // ── Physics, chemistry and biology: lesson transcripts, read not watched ───
  // These three are `transcript`, not `video-segment` or `video-watched`. The
  // published caption track was read in full; the video was not played and the
  // audio was not heard. The slide deck and worksheet downloads returned an HTML
  // page rather than a file, so neither was examined and neither is claimed.
  {
    id: "oak-ks3-electric-current-transcript",
    title: "Electric current (KS3 Science, Series circuits)",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/science-secondary-ks3/units/series-circuits/lessons/electric-current",
    format: "video",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "11–14",
    licence: {
      name: "Open Government Licence v3.0",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, Electric current (KS3 Science)",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The published transcript of the lesson video, read in full (229 captions, 3,751 words): the cell/terminal treatment, the drift-speed passage ('the individual electrons only move a few millimeters per second'), and the series-current statements ('the current is the same at any point in a series circuit'; identical lamps 'come on at the same time with the same brightness').",
    findings:
      "The transcript asserts series-current invariance and equal brightness for identical lamps, and separates the slow drift of electrons from the immediate lighting of the bulbs. It never quantifies current, resistance or power, and it does not say what happens to brightness when the NUMBER of lamps changes. The circuit model's 0.25 A → 0.13 A result on adding a second 6 Ω bulb is consistent with the lesson's invariance claim but is a quantitative extension the lesson does not make; a teacher should present the numbers as beyond this lesson rather than as a restatement of it.",
    limitations:
      "The video was not watched and its audio was not heard; only the caption track was read. The slide deck and worksheet download route returned an HTML page instead of a file, so the slides and worksheet were NOT examined. No quantitative claim in the lesson could be checked against a demonstration.",
    concepts: ["electricity-circuits"],
    intendedUse: "Comparator for the circuit model's series-current and drift statements, and for the teacher note that the model's numbers go further than the KS3 lesson.",
  },
  {
    id: "oak-ks3-atoms-and-elements-transcript",
    title: "Atoms and elements (KS3 Science, Atoms, elements and compounds)",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/science-secondary-ks3/units/atoms-elements-and-compounds/lessons/atoms-and-elements",
    format: "video",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "11–14",
    licence: {
      name: "Open Government Licence v3.0",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, Atoms and elements (KS3 Science)",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The published transcript of the lesson video, read in full (213 captions, 3,059 words), including the Dalton passage ('an atom is like a sphere that cannot be broken up'), the definition of an element as 'a substance that's made up of only one type of atom', and the count of 118 elements.",
    findings:
      "This lesson's model of the atom is Dalton's indivisible sphere, and the words electron, proton, neutron and nucleus do not occur anywhere in its 3,059-word transcript. The atom model begins from protons, neutrons, electrons and charge, so it assumes subatomic prior knowledge that this lesson does not supply. That is a sequencing dependency, not a contradiction: used after this lesson it extends the picture; used instead of it, it asks a learner to hold two models at once without being told why the sphere was abandoned.",
    limitations:
      "The video was not watched and its audio was not heard; only the caption track was read. Slides and worksheet were not downloadable as files in this pass and were NOT examined, so the diagrams that carry the Dalton model were not seen.",
    concepts: ["atoms-elements"],
    intendedUse: "Names the prior-knowledge boundary for the atom model and the teacher note that must introduce the subatomic model as a replacement, not a decoration.",
  },
  {
    id: "oak-ks3-animal-cell-transcript",
    title: "Animal cell structures and their functions (KS3 Science, Cells)",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/science-secondary-ks3/units/cells/lessons/animal-cell-structures-and-their-functions",
    format: "video",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "11–14",
    licence: {
      name: "Open Government Licence v3.0",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, Animal cell structures and their functions (KS3 Science)",
    inspection: "inspected",
    depth: "transcript",
    whatWasInspected:
      "The published transcript of the lesson video, read in full (310 captions, 4,668 words): the membrane/cytoplasm/nucleus/mitochondria definitions and functions, and the extended 2D-versus-3D model discussion, including the evaluation of physical models ('if you cut them one way, look like sausages, but if you cut them the other way, they might look like circles in a 2D image').",
    findings:
      "The lesson supplies the same organelle set and functions the cell model draws (mitochondria: energy from cellular respiration; nucleus: DNA and control; membrane: what enters and leaves), and it spends substantial time on the fact that a 2D diagram is a projection of a 3D object. That directly supports the model's stated limitation about a generic 2D cell drawing. It does NOT state that plant cells contain mitochondria, so it is not evidence for the 'only animals have mitochondria' misconception; that belief remains sourced from the misconceptions literature and from the plant-cell comparison in the dossier.",
    limitations:
      "The video was not watched and its audio was not heard; only the caption track was read. The slides, worksheet and the 3D model images were not examined, so the visual treatment of the organelles was not seen.",
    concepts: ["cells"],
    intendedUse: "Comparator for the cell model's organelle set and its 2D/3D limitation; it is explicitly not used as evidence for the plant-mitochondria misconception.",
  },
  {
    id: "oak-electric-current-quiz",
    title: "Electric current (KS3): starter and exit quizzes",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/science-secondary-ks3/units/series-circuits/lessons/electric-current",
    format: "quiz",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "12–14",
    licence: {
      name: "Open Government Licence v3.0",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Electric current' starter and exit quizzes, OGL v3.0",
    inspection: "inspected",
    depth: "asset",
    whatWasInspected:
      "The 12 assessment items embedded in the lesson page — six starter and six exit questions — read from the page's structured data: each stem, option set, marked key and feedback. The items themselves; not a downloaded worksheet and not a rendered quiz.",
    findings:
      "The exit quiz tests the two facts the transcript dwells on: electrons are the moving charge, and their normal drift speed is 'a few millimetres per second'. It also asks what pushes the charges ('chemicals that react') and what makes a simple cell (two different metals, a weak acid solution and wires), so the lemon-cell demonstration becomes retrievable knowledge rather than a story. No item asks for V = IR, a current reading or a brightness comparison, so the quiz supports the model's qualitative prior but not its quantitative claim.",
    limitations:
      "Embedded quiz data only: any diagram or image inside an option was not rendered, and no learner answered the items. Slides and worksheet remained unavailable. These are Oak's assessment items, not a validated instrument.",
    concepts: ["electricity-circuits"],
    intendedUse:
      "Reference for what Oak treats as the retrievable core before and after the lesson; informs the teacher notes' prior-knowledge check. No item is copied into our bank.",
  },
  {
    id: "oak-atoms-elements-quiz",
    title: "Atoms and elements (KS3): starter and exit quizzes",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/science-secondary-ks3/units/atoms-elements-and-compounds/lessons/atoms-and-elements",
    format: "quiz",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "12–14",
    licence: {
      name: "Open Government Licence v3.0",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Atoms and elements' starter and exit quizzes, OGL v3.0",
    inspection: "inspected",
    depth: "asset",
    whatWasInspected:
      "The 12 assessment items embedded in the lesson page — six starter and six exit — read as structured data: mass conservation, units of mass, pure substances and particle diagrams in the starter; the atom as the building block, Dalton's sphere, ordering by size, symbols and element identification in the exit.",
    findings:
      "The exit quiz marks Dalton's sphere as the answer ('According to Dalton's model of an atom, how are atoms represented? — As a sphere') and tests symbols and size ordering, which matches the transcript's historical framing. The starter's particle-diagram items assume the particle model before the atom is named. No item reaches isotopes, ions, electron shells or the nucleus, so the quiz marks the same boundary the model's prior-knowledge note states.",
    limitations:
      "Embedded quiz data only: matching and ordering items were read as text, and any diagrams or images were not rendered. No learner answered the items. Slides and worksheet remained unavailable.",
    concepts: ["atoms-elements"],
    intendedUse:
      "Reference for the prior-knowledge boundary and for the order in which Oak assesses it; the teacher notes already state that the subatomic model replaces Dalton's rather than decorating it. No item is copied.",
  },
  {
    id: "oak-animal-cell-quiz",
    title: "Animal cell structures and their functions (KS3): starter and exit quizzes",
    creator: "Oak National Academy",
    institution: "Oak National Academy",
    url: "https://www.thenational.academy/teachers/programmes/science-secondary-ks3/units/cells/lessons/animal-cell-structures-and-their-functions",
    format: "quiz",
    published: null,
    accessedOn: iso(2026, 11, 25),
    language: "en",
    ageRange: "11–14",
    licence: {
      name: "Open Government Licence v3.0",
      url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
      reuse: "reference-only",
    },
    attribution: "Oak National Academy, 'Animal cell structures and their functions' starter and exit quizzes, OGL v3.0",
    inspection: "inspected",
    depth: "asset",
    whatWasInspected:
      "The 12 assessment items embedded in the lesson page — six starter and six exit — read as structured data: cells, microscopes, scientific drawings and life processes in the starter; the 2D model, the structure an animal cell lacks, organelle jobs, mitochondria and respiration, why models are used, and the key word for a model's strengths and weaknesses in the exit.",
    findings:
      "The exit quiz asks directly what type of model a scientific drawing of a cell is and marks '2D model', and asks which structure is not found in an animal cell ('brain'). That is the same 2D-projection limitation the cell model states, and it is assessed rather than merely mentioned. The 'why models are used' and strengths/weaknesses items make the model's status explicit at the same level.",
    limitations:
      "Embedded quiz data only: matching items and any cell images were not rendered, and no learner answered the items. Slides and worksheet remained unavailable. No item tests plant cells or root hair cells, so the quiz neither supports nor contradicts the plant-mitochondria misconception.",
    concepts: ["cells"],
    intendedUse:
      "Reference for how the 2D-model limitation is assessed and for the organelle set the model should match; it is not used as evidence about plant cells. No item is copied.",
  },
];

/** The five pilot concepts the transformation starts with: one per subject. */
export const PILOT_CONCEPTS = ["fractions", "electricity-circuits", "atoms-elements", "cells", "algorithms-search"] as const;
export type PilotConcept = (typeof PILOT_CONCEPTS)[number];

export const CONCEPT_DOSSIERS: readonly ConceptDossier[] = [
  {
    conceptId: "electricity-circuits",
    subject: "physics",
    status: "researched",
    designDecision:
      "Teach the loop before the formula. The model shows two readings of ONE loop, so the series-current rule is an observation rather than a definition, and every control the learner has (cells, bulbs, switch) changes both readings together. V = IR then arrives as the arithmetic of what they just watched.",
    misconceptions: [
      { id: "current-used-up", statement: "Current is consumed by a bulb, so less reaches the next one.", sourceId: "tused-2007-simple-circuits" },
      { id: "battery-constant-current", statement: "A cell supplies a fixed current regardless of the circuit.", sourceId: "physrevper-2024-conceptual-resources" },
      { id: "clashing-currents", statement: "One wire from the cell is enough to light a bulb.", sourceId: "pacificu-2006-electricity-misconceptions" },
      { id: "sequential-reasoning", statement: "What comes before the bulb in the loop matters more than what comes after.", sourceId: "tused-2007-simple-circuits" },
    ],
    disagreements: [
      {
        question: "Does 'substance' language about current (flowing, using up) predict the used-up error?",
        sourceIds: ["tused-2007-simple-circuits", "physrevper-2024-conceptual-resources"],
        note: "The 2007 study reports the error with frequencies; the 2024 study finds substance-based reasoning is often productive and not predictive of it. The model therefore corrects a PREDICTION (the two readings) instead of policing vocabulary.",
      },
    ],
    nextStep:
      "Research the parallel-circuit case (local reasoning at a junction) before extending the model, and have a physics teacher check the series arithmetic and the two-ammeter framing.",
    educatorReview: "pending",
  },
  {
    conceptId: "fractions",
    subject: "maths",
    status: "researched",
    designDecision:
      "A fraction is taught as a POSITION before it is practised as a calculation. The learner cuts one whole into equal pieces, sees each piece shrink as the denominator rises, and then reads the same fraction as a marker on a 0–1 line against a 1/2 benchmark. The bar stays because it explains piece size; the line leads because accuracy at estimating magnitude on a line predicted fewer whole-number ordering errors, while part-whole shading did not (Bailey et al. 2016). Comparison is taught by renaming both fractions in the same piece size, and the model says out loud when comparing the bottoms would happen to give the right answer — because that coincidence is what keeps the wrong rule alive.",
    misconceptions: [
      { id: "bigger-bottom-bigger-piece", statement: "1/8 is bigger than 1/2 because 8 is bigger than 2.", sourceId: "ejceel-2024-fractions-basic7" },
      { id: "compare-by-denominator", statement: "To compare two fractions, compare the bottom numbers.", sourceId: "newstead-murray-1998-fractions" },
      { id: "whole-number-ordering", statement: "Fractions can be ordered by treating the numerator and denominator as separate whole numbers.", sourceId: "pmc-2016-fraction-ordering" },
    ],
    disagreements: [],
    nextStep:
      "A maths teacher must check the 0–1 range, the half-benchmark wording and the 3/4 versus 5/8 comparison, and a curriculum specification should be inspected for the exact language and notation learners are marked on. The model has no mixed numbers or fractions greater than one, which is a real limit for later years.",
    educatorReview: "pending",
  },
  {
    conceptId: "atoms-elements",
    subject: "chemistry",
    status: "researched",
    designDecision:
      "Identity first, then the modifiers. The learner changes protons, neutrons and electrons and the model prints ONE sentence whose order is the lesson: the proton count names the element, neutrons only make a heavier version of it, electrons only make it charged. Zero protons is not 'hydrogen gone wrong' — it is not an element, and the model says so.",
    misconceptions: [
      { id: "mass-decides-element", statement: "Two atoms with different masses must be different elements.", sourceId: "arc-vic-atomic-structure" },
      { id: "neutrons-equal-protons", statement: "An atom has as many neutrons as protons.", sourceId: "schmidt-2003-isotopes" },
      { id: "ion-is-different-element", statement: "An ion is a different element from the atom it came from.", sourceId: "rsc-atoms-isotopes-14-16" },
      { id: "protons-only-sometimes-decide", statement: "The proton count only sometimes decides which element an atom is.", sourceId: "canterbury-2015-atomic-structure" },
      { id: "atom-equals-element-word", statement: "'Atom', 'element' and 'matter' are interchangeable words.", sourceId: "acs-2006-nuclear-misconceptions" },
    ],
    disagreements: [],
    nextStep:
      "Have a chemistry teacher check the twenty-element table and the ion/isotope wording, and inspect the exam-board specification for the exact phrasing learners will be marked against.",
    educatorReview: "pending",
  },
  {
    conceptId: "fraction-ops",
    subject: "maths",
    status: "researched",
    designDecision:
      "The bottom number is never added, and the learner is given a test they can run themselves rather than a rule to memorise. The model renames both fractions in the smallest shared piece size, shades the sum, and draws the 'add the tops and the bottoms' answer to its own scale beside it — so the wrong answer is visibly smaller than one of the numbers being added, which no sum of two positive fractions can be. The correct route is an observation about piece size, not an algorithm announced in advance.",
    misconceptions: [
      { id: "add-tops-and-bottoms", statement: "1/2 + 1/3 = 2/5, by adding the tops and the bottoms.", sourceId: "ejmste-2022-fraction-misconceptions" },
      { id: "multiply-rule-for-addition", statement: "The multiplication rule (multiply tops, multiply bottoms) also adds fractions.", sourceId: "ejceel-2024-fractions-basic7" },
      { id: "denominator-as-quantity", statement: "The denominator is how many pieces there are, so it is a quantity to add.", sourceId: "newstead-murray-1998-fractions" },
    ],
    disagreements: [],
    nextStep:
      "A maths teacher must check the impossible-sum test, the simplification wording and the denominators the model allows; the model has no mixed numbers, no subtraction and no fractions greater than one yet, so it does not yet cover the full operations sequence.",
    educatorReview: "pending",
  },
  {
    conceptId: "negatives",
    subject: "maths",
    status: "researched",
    designDecision:
      "Order is read off a line, not off digits. The learner moves a marker in ones on a line that runs either side of zero, and the sentence prints the two neighbours either side of it, so '−5 is less than −2' is a position rather than a rule to memorise. Distance from zero and side of zero are reported separately, because 'further from zero feels bigger' is exactly the confusion (Young & Booth 2015).",
    misconceptions: [
      { id: "further-is-bigger", statement: "−5 is greater than −2, because 5 is greater than 2.", sourceId: "mrbarton-negative-numbers-probes" },
      { id: "opposite-sign-placement", statement: "Negative numbers belong on the right of zero, or positives on the left.", sourceId: "widodo-2018-number-line-misconceptions" },
      { id: "distance-is-value", statement: "The number furthest from zero is the greatest.", sourceId: "young-booth-2015-negative-magnitude" },
    ],
    disagreements: [],
    nextStep:
      "A maths teacher should check the line's range and the two refuted beliefs, and inspect a curriculum specification for the exact ordering and inequality notation learners are marked on.",
    educatorReview: "pending",
  },
  {
    conceptId: "decimals",
    subject: "maths",
    status: "researched",
    designDecision:
      "Place value is shown by MOVING in tenths, not by comparing digit strings. The model's step is one tenth, the ticks are counted in tenths, and the sentence says how many tenths the marker is from zero — which is the fact 'longer is larger' ignores (Steinle & Stacey 1998).",
    misconceptions: [
      { id: "string-length", statement: "4.63 is bigger than 4.8 because it has more digits.", sourceId: "steinle-stacey-1998-decimals" },
      { id: "decimal-point-ignored", statement: "0.65 is the whole number 65.", sourceId: "widodo-2018-number-line-misconceptions" },
      { id: "more-digits-is-bigger", statement: "0.45 is greater than 0.5, because 45 is greater than 5.", sourceId: "mrbarton-negative-numbers-probes" },
    ],
    disagreements: [],
    nextStep:
      "A maths teacher should confirm the tenths framing and the 0–2 range, and a curriculum source should be inspected for the decimal notation and rounding vocabulary the mark scheme uses.",
    educatorReview: "pending",
  },
  {
    conceptId: "place-value",
    subject: "maths",
    status: "researched",
    designDecision:
      "A place is a NUMBER OF MOVES, so the line's step is the place being taught: on a 0–1000 line one move is ten, and 340 is 34 moves from zero. The WWC guide's warning is built in — the whole visible line is labelled as the extent of the number system rather than implicitly one unit, and the tick count is named in tens so a learner cannot read the line as 0 to 34.",
    misconceptions: [
      { id: "string-length", statement: "More digits means a larger number, whatever the place.", sourceId: "steinle-stacey-1998-decimals" },
      { id: "decimal-point-ignored", statement: "The digits after a point are separate whole numbers rather than places.", sourceId: "widodo-2018-number-line-misconceptions" },
      { id: "whole-line-as-unit", statement: "A fraction is located as a proportion of the whole visible line rather than of the 0–1 interval.", sourceId: "wwc-2010-fractions-guide" },
    ],
    disagreements: [],
    nextStep:
      "A maths teacher must check that the tens step and the 0–1000 range match the year group, and the model should gain a hundreds step (and a decimal-place step) before it claims to cover place value beyond tens.",
    educatorReview: "pending",
  },
  {
    conceptId: "cells",
    subject: "biology",
    status: "researched",
    designDecision:
      "Structure is taught as the job it does, and switching a part off says what stops — never 'the cell dies'. The cell type is switched as a whole set (a plant cell is not an animal cell plus extras, and learners add animal-only parts to plant cells as well as the reverse), and the model's own gap — that not every plant cell has chloroplasts — is printed beside it rather than hidden.",
    misconceptions: [
      { id: "plant-is-animal-plus-extras", statement: "A plant cell is an animal cell with a wall and chloroplasts added.", sourceId: "eric-2015-draw-write-cells" },
      { id: "chloroplast-in-every-plant-cell", statement: "Every plant cell has chloroplasts.", sourceId: "apfslt-2009-cell-teaching" },
      { id: "ribosome-is-powerhouse", statement: "The ribosome is the cell's energy producer.", sourceId: "atlantis-2021-organelle-misconceptions" },
      { id: "chlorophyll-is-the-organelle", statement: "Chlorophyll is the organelle where photosynthesis happens.", sourceId: "eric-2025-photosynthesis-misconceptions" },
    ],
    disagreements: [],
    nextStep:
      "Have a biology teacher confirm the organelle set and the failure sentences, and decide whether a root-hair or storage cell belongs in the model so 'chloroplasts in every plant cell' is refuted rather than only noted.",
    educatorReview: "pending",
  },
  {
    conceptId: "algorithms-search",
    subject: "computing",
    status: "researched",
    designDecision:
      "Count the looks, do not describe them. The learner steps linear and binary search on the same fourteen-item list and reads two counts; binary refuses to start on an unsorted list, so the precondition is experienced as a failure rather than quoted. The conclusion is deliberately 'it depends': a target near the front of a short list is found in one look by the 'worse' algorithm, and sorting first is work.",
    misconceptions: [
      { id: "binary-on-any-data", statement: "Binary search can be run on any data.", sourceId: "oak-binary-search-ks4" },
      { id: "binary-always-better", statement: "Binary search is always the better choice.", sourceId: "oak-comparing-searching" },
      { id: "linear-needs-order", statement: "Linear search needs a sorted list.", sourceId: "oak-comparing-searching" },
      { id: "halving", statement: "Each step of binary search halves the items still to check.", sourceId: "cmu-15122-binsearch" },
      { id: "sorting-is-free", statement: "The sorted list costs nothing to have.", sourceId: "pressbooks-open-guide-search" },
    ],
    disagreements: [],
    nextStep:
      "A computing teacher should check the comparison counts and the 'it depends' conclusion against their exam board, and the off-by-one case (target at the boundary of a window) should be added as a deliberate step-through.",
    educatorReview: "pending",
  },
];

// ── The validator ───────────────────────────────────────────────────────────

const NC_OR_ND = /non-?commercial|\bNC\b|\bND\b|no-?deriv/i;

/** Everything wrong with the register, as sentences a person can act on. Empty
 *  means the register is honest, licensed and traceable.
 *
 *  It is a pure function so the SAME rules run in `npm run research-check` and in
 *  the suite: a gate that exists in two copies is a gate that disagrees with
 *  itself eventually. */
export function validateResearch(
  sources: readonly ResearchSource[] = RESEARCH_SOURCES,
  dossiers: readonly ConceptDossier[] = CONCEPT_DOSSIERS,
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const s of sources) {
    const where = `source ${s.id}`;
    if (ids.has(s.id)) problems.push(`${where}: duplicate id`);
    ids.add(s.id);
    if (!s.title.trim() || !s.creator.trim() || !s.url.trim()) problems.push(`${where}: title, creator and url are required`);
    if (s.inspection === "inspected") {
      if (!s.whatWasInspected || s.whatWasInspected.trim().length < 20) {
        problems.push(`${where}: claims inspection without saying what was read`);
      }
      if (!s.accessedOn) problems.push(`${where}: claims inspection without an access date`);
    }
    if (s.inspection === "blocked" && !s.limitations) problems.push(`${where}: blocked sources must record why`);
    // DEPTH MUST MATCH THE CLAIM. "Inspected" used to cover a metadata page and a
    // full paper alike; the ladder exists so the report cannot say "full document"
    // about a title and a description.
    if (!INSPECTION_DEPTHS.includes(s.depth)) {
      problems.push(`${where}: unknown inspection depth "${String(s.depth)}"`);
    } else if (s.inspection === "inspected" && s.depth === "discovered") {
      problems.push(`${where}: claims inspection but records only that it was discovered`);
    } else if (s.inspection === "identified" && !["discovered", "metadata"].includes(s.depth)) {
      problems.push(`${where}: marked "identified" but records depth "${s.depth}" — promote the inspection or lower the depth`);
    } else if (s.inspection === "blocked" && s.depth !== "discovered") {
      problems.push(`${where}: blocked sources can only have been discovered, not read ("${s.depth}")`);
    }
    // A WATCHED SEGMENT NEEDS A TIMESTAMP. Without one the record cannot be
    // checked by the next reader, and "watched" becomes an assertion.
    if (s.depth === "video-segment" && !/\b\d{1,2}:\d{2}\b/.test(s.whatWasInspected ?? "")) {
      problems.push(`${where}: claims a video segment was watched without a timestamp in whatWasInspected`);
    }
    // SAMPLED FRAMES ARE NOT A WATCH. The timestamps establish which moments were
    // seen; naming what happened to the audio is what stops the record being read
    // as a viewing of the video.
    if (s.depth === "video-frames-sampled") {
      if (!/\b\d{1,2}:\d{2}\b/.test(s.whatWasInspected ?? "")) {
        problems.push(`${where}: claims sampled video frames without a timestamp in whatWasInspected`);
      }
      if (!/audio/i.test(`${s.whatWasInspected ?? ""} ${s.limitations}`)) {
        problems.push(`${where}: sampled frames must say what happened to the audio`);
      }
    }
    if (s.depth === "video-watched" && !/(watched|viewed)/i.test(s.whatWasInspected ?? "")) {
      problems.push(`${where}: claims a whole video was watched without saying it was watched`);
    }
    if (s.depth === "audio-evaluated" && !/(heard|listened)/i.test(s.whatWasInspected ?? "")) {
      problems.push(`${where}: claims the audio was evaluated without saying it was heard`);
    }
    // EXTRACTED TEXT IS NOT A VIEWED DECK. The limitation line is where the
    // difference lives, because the slide text itself looks complete without it.
    if (s.depth === "slides-text" && !/(text only|not rendered|visuals? not|images not)/i.test(s.limitations)) {
      problems.push(`${where}: slide text extracted must record that the visuals were not rendered`);
    }
    if (s.depth === "interactive-tested" && !/(operated|clicked|typed|dragged|ran the|used the)/i.test(s.whatWasInspected ?? "")) {
      problems.push(`${where}: claims an interactive resource was tested without saying what was operated`);
    }
    // THE LICENCE RULE: an NC/ND work may never be marked reusable, whatever the
    // project would like. Checked against the licence NAME because the reuse field
    // is the thing a hurried author gets wrong.
    if (NC_OR_ND.test(s.licence.name) && s.licence.reuse !== "reference-only") {
      problems.push(`${where}: ${s.licence.name} is NonCommercial/NoDerivatives but is marked "${s.licence.reuse}" — OpenMind's content is ${PRODUCT_LICENCE}`);
    }
    if (s.licence.reuse !== "reference-only" && !s.attribution.trim()) {
      problems.push(`${where}: reused material needs an attribution string`);
    }
    if (s.licence.reuse === "adapt" && !REUSE_ALLOWED.includes(s.licence.name as (typeof REUSE_ALLOWED)[number])) {
      // Not a failure for a named permissive licence the list has not seen, but the
      // register must say which one it is: "adapt" plus an unfamiliar licence is how
      // a mis-licensed asset enters a BY-SA product.
      problems.push(`${where}: marked adaptable under "${s.licence.name}", which is not one of the licences this project has cleared (${REUSE_ALLOWED.join(", ")})`);
    }
  }

  const dossierIds = new Set<string>();
  for (const d of dossiers) {
    const where = `dossier ${d.conceptId}`;
    if (dossierIds.has(d.conceptId)) problems.push(`${where}: duplicate dossier`);
    dossierIds.add(d.conceptId);
    for (const m of d.misconceptions) {
      if (!ids.has(m.sourceId)) problems.push(`${where}: misconception "${m.id}" cites unknown source ${m.sourceId}`);
    }
    for (const dg of d.disagreements) {
      if (dg.sourceIds.length < 2) problems.push(`${where}: a disagreement needs at least two sources`);
      for (const sid of dg.sourceIds) if (!ids.has(sid)) problems.push(`${where}: disagreement cites unknown source ${sid}`);
    }
    const inspected = sources.filter((s) => s.concepts.includes(d.conceptId) && s.inspection === "inspected").length;
    if (d.status === "researched" && inspected < 3) {
      problems.push(`${where}: claims "researched" on ${inspected} inspected source(s); three are required`);
    }
    if (d.status === "identified" && inspected >= 3) {
      problems.push(`${where}: has ${inspected} inspected sources but is still marked "identified" — record the design decision as researched`);
    }
  }

  for (const concept of PILOT_CONCEPTS) {
    if (!dossierIds.has(concept)) problems.push(`pilot concept ${concept}: no dossier`);
  }
  return problems;
}

/** A one-line state for a screen or a report: how much of the register is actually
 *  read, and how much of the pilot is actually researched. */
export function researchSummary(): {
  readonly sources: number;
  readonly inspected: number;
  readonly identified: number;
  readonly blocked: number;
  readonly byDepth: Readonly<Record<InspectionDepth, number>>;
  readonly reconciled: boolean;
  readonly researchedConcepts: readonly string[];
} {
  const rec = researchReconciliation();
  return {
    sources: RESEARCH_SOURCES.length,
    inspected: RESEARCH_SOURCES.filter((s) => s.inspection === "inspected").length,
    identified: RESEARCH_SOURCES.filter((s) => s.inspection === "identified").length,
    blocked: RESEARCH_SOURCES.filter((s) => s.inspection === "blocked").length,
    byDepth: rec.byDepth,
    reconciled: rec.reconciled,
    researchedConcepts: CONCEPT_DOSSIERS.filter((d) => d.status === "researched").map((d) => d.conceptId),
  };
}

/** THE COUNT THAT WENT WRONG IN A REPORT. One summary said 32 sources while its
 *  own categories accounted for 31; the register actually held 31, and the extra
 *  came from adding a total by hand. This function is the only permitted way to
 *  state the totals: it counts the records, counts them again by depth, and says
 *  whether the two agree. A dashboard prints `reconciled`, not arithmetic done in
 *  prose. */
export function researchReconciliation(): {
  readonly total: number;
  readonly byDepth: Readonly<Record<InspectionDepth, number>>;
  readonly byState: { readonly inspected: number; readonly identified: number; readonly blocked: number };
  readonly depthSum: number;
  readonly reconciled: boolean;
} {
  const byDepth = Object.fromEntries(
    INSPECTION_DEPTHS.map((d) => [d, RESEARCH_SOURCES.filter((s) => s.depth === d).length]),
  ) as Record<InspectionDepth, number>;
  const byState = {
    inspected: RESEARCH_SOURCES.filter((s) => s.inspection === "inspected").length,
    identified: RESEARCH_SOURCES.filter((s) => s.inspection === "identified").length,
    blocked: RESEARCH_SOURCES.filter((s) => s.inspection === "blocked").length,
  };
  const depthSum = Object.values(byDepth).reduce((a, b) => a + b, 0);
  const stateSum = byState.inspected + byState.identified + byState.blocked;
  return {
    total: RESEARCH_SOURCES.length,
    byDepth,
    byState,
    depthSum,
    reconciled: depthSum === RESEARCH_SOURCES.length && stateSum === RESEARCH_SOURCES.length,
  };
}
