// ─────────────────────────────────────────────────────────────────────────────
// THE SYLLABUS MAPPINGS — a course's concepts, tied to a published document.
//
// WHY THIS FILE EXISTS. `lib/curricula/registry.ts` records how far a pathway's
// STRUCTURE has been checked (`recordReview`) and how far its CONCEPT MAPPING
// has (`mappingReview`), and it is honest about the second: every pathway in
// production reads `mappingReview: "mapped"`, which means "OpenMind mapped this
// onto its genome and nobody else has looked". That label is correct and it is
// also, on its own, unfalsifiable — a reader cannot check it, because there is
// nothing to check it AGAINST. A mapping a ministry cannot audit is a claim, not
// a record.
//
// So this file holds the missing half: for a course that has one, the published
// document each concept was placed against, the verbatim heading it sits under,
// and a plain statement of what the syllabus asks for. Written out, it is
// reviewable line by line by a subject specialist, and `scripts/curriculum-gate.mjs`
// fails the build when an entry names a concept the genome does not hold, a
// concept the course does not cover, or a heading the source does not publish.
//
// WHAT THIS DOES *NOT* CLAIM, and the field that keeps it honest:
//
//   · `verification: "document"` means the HEADINGS were read from the official
//     document and are quoted verbatim. It does not mean every sentence of the
//     source was read, and it is not a claim about depth or tiering.
//   · `verification: "portal"` means the document's URL and structure were
//     confirmed but its text could not be machine-read here, so the headings are
//     recorded from the published syllabus and MUST be checked against the PDF by
//     the reviewer. Two countries are mapped at different strengths on purpose:
//     pretending both were read equally well would be the defect this repository
//     keeps having to fix.
//   · `reviewer` is `null` for both, because no qualified person has read these
//     yet. `mappingReview` therefore stays `"mapped"`; this file does not upgrade
//     it, and nothing here may be read as a review. When a specialist signs one
//     off they fill in `reviewer` and `reviewedAt`, the gate accepts it, and the
//     pathway's status moves — that is the whole workflow.
//
// ADDING A COURSE is a data change: an entry with its source, its headings and
// one line per concept. It is deliberately not a big file — a mapping that is
// short and checkable beats one that is exhaustive and unreviewed.
// ─────────────────────────────────────────────────────────────────────────────

/** The published document a mapping was placed against. `published` is the
 *  document's OWN date, not the year it was introduced — the UK GCSE content was
 *  published in 2013 and taught from 2015, and writing "2015" would be wrong in a
 *  citation a ministry quotes back at us. */
export interface MappingSource {
  title: string;
  publisher: string;
  published: string;
  url: string;
  /** `document`: headings read from the official file and quoted verbatim.
   *  `portal`: the file's URL and existence are confirmed, its text was not
   *  machine-readable here, so a reviewer must check the headings. */
  verification: "document" | "portal";
  note?: string;
}

/** One concept, under one published heading. `ref` is the heading verbatim;
 *  `statement` is what the source asks for, in OpenMind's words, kept short
 *  enough that a reviewer can disagree with a single line. */
export interface MappingEntry {
  conceptId: string;
  ref: string;
  statement: string;
}

export interface ConceptMapping {
  /** The pathway this mapping belongs to (lib/curricula/registry.ts). */
  pathwayId: string;
  /** The specification whose concepts these are (lib/specifications.ts). */
  specId: string;
  /** The subject the entries cover. A course spanning several subjects needs
   *  one mapping per subject, because a reviewer of mathematics is not a
   *  reviewer of biology. */
  subject: "maths" | "physics" | "chemistry" | "biology" | "computing";
  source: MappingSource;
  entries: MappingEntry[];
  /** The specialist who read it, and when. Null until somebody has. */
  reviewer: string | null;
  reviewedAt: string | null;
  notes?: string;
}

// ── England · GCSE Mathematics ──────────────────────────────────────────────
//
// The six subject areas below are the DfE's own headings, in the DfE's own
// order. They are the granularity the published content document actually uses:
// the N1/A1/R1 style references live in AWARDING-BODY specifications (AQA and
// others), not in the DfE document, so citing "N1" here would attribute a
// numbering to a publisher that does not use it. A reviewer who wants to make
// this finer can add the awarding body's reference in `statement`.
const DFE_GCSE_MATHS: MappingSource = {
  title: "GCSE mathematics: subject content and assessment objectives",
  publisher: "Department for Education (England)",
  published: "2013-11-01",
  url: "https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives",
  verification: "document",
  note:
    "Published 1 November 2013, for teaching from 2015. The six subject-area " +
    "headings are quoted verbatim from the published content; the finer-grained " +
    "topic references belong to awarding-body specifications and are not cited here.",
};

const UK_GCSE_MATHS: ConceptMapping = {
  pathwayId: "gb-national",
  specId: "uk-gcse",
  subject: "maths",
  source: DFE_GCSE_MATHS,
  reviewer: null,
  reviewedAt: null,
  notes:
    "Foundation and Higher are one mapping here: the DfE document states the " +
    "content both tiers draw on and marks what is Higher-only in its text, and a " +
    "concept-level mapping cannot represent that distinction without splitting " +
    "every entry. A reviewer should add a per-entry tier note before this is used " +
    "for tier placement.",
  entries: [
    // Number
    { conceptId: "place-value", ref: "Number", statement: "The number system and place value, including ordering and comparing numbers of any size." },
    { conceptId: "addition", ref: "Number", statement: "Four operations applied to integers and decimals, including fluency without a calculator." },
    { conceptId: "subtraction", ref: "Number", statement: "Four operations, including subtraction of negative numbers and in context." },
    { conceptId: "multiplication", ref: "Number", statement: "Four operations, including multiplication of decimals and by powers of ten." },
    { conceptId: "division", ref: "Number", statement: "Four operations, including division with remainders and exact division of decimals." },
    { conceptId: "negatives", ref: "Number", statement: "Negative numbers in context, and the four operations applied to them." },
    { conceptId: "fractions", ref: "Number", statement: "Fraction notation, equivalence, and fractions of quantities." },
    { conceptId: "fraction-ops", ref: "Number", statement: "Addition, subtraction, multiplication and division of fractions and mixed numbers." },
    { conceptId: "decimals", ref: "Number", statement: "Decimals, including recurring decimals and conversion between fractions, decimals and percentages." },
    { conceptId: "percentages", ref: "Number", statement: "Percentage change, reverse percentages, and percentage problems in context." },
    { conceptId: "rounding", ref: "Number", statement: "Rounding, estimation and checking answers to a required degree of accuracy." },
    { conceptId: "order-ops", ref: "Number", statement: "The conventional order of operations, including brackets and index notation." },
    { conceptId: "indices-intro", ref: "Number", statement: "Index laws for numerical and algebraic expressions, including negative and fractional indices." },
    { conceptId: "standard-form", ref: "Number", statement: "Standard form for very large and very small numbers, and its use in calculation." },
    { conceptId: "surds", ref: "Number", statement: "Surds and rationalising denominators (Higher tier)." },
    { conceptId: "bounds", ref: "Number", statement: "Limits of accuracy: upper and lower bounds and error intervals." },
    // Algebra
    { conceptId: "algebra-expressions", ref: "Algebra", statement: "Notation, vocabulary and manipulation: collecting terms, substitution and formulae." },
    { conceptId: "algebra-expand", ref: "Algebra", statement: "Expanding brackets and factorising, including quadratics." },
    { conceptId: "linear-equations", ref: "Algebra", statement: "Solving linear equations in one unknown, including those with the unknown on both sides." },
    { conceptId: "inequalities", ref: "Algebra", statement: "Solving linear inequalities and representing solutions on a number line." },
    { conceptId: "simultaneous", ref: "Algebra", statement: "Solving two simultaneous linear equations algebraically and graphically." },
    { conceptId: "sequences", ref: "Algebra", statement: "Sequences: term-to-term and position-to-term rules, and the nth term of linear and quadratic sequences." },
    { conceptId: "quadratics", ref: "Algebra", statement: "Solving quadratic equations by factorising, completing the square and the formula." },
    { conceptId: "completing-square", ref: "Algebra", statement: "Completing the square, and its use in solving quadratics and identifying turning points." },
    { conceptId: "quadratic-graphs", ref: "Algebra", statement: "Recognising and sketching quadratic graphs, and identifying roots, intercepts and turning points." },
    { conceptId: "straight-lines", ref: "Algebra", statement: "Straight-line graphs: gradient, intercepts, and the equation of a line through two points." },
    { conceptId: "coordinates", ref: "Algebra", statement: "Coordinates in all four quadrants, and the geometry of straight lines on a grid." },
    { conceptId: "functions", ref: "Algebra", statement: "Function notation and inverse and composite functions." },
    { conceptId: "algebraic-fractions", ref: "Algebra", statement: "Simplifying algebraic fractions and solving equations that contain them." },
    { conceptId: "iteration", ref: "Algebra", statement: "Finding approximate solutions to equations using iterative methods." },
    { conceptId: "proof", ref: "Algebra", statement: "Algebraic argument and proof, including proofs of identities and statements about integers." },
    { conceptId: "logic-maths", ref: "Algebra", statement: "Logical argument, including the use of counter-examples." },
    // Ratio, proportion and rates of change
    { conceptId: "ratio", ref: "Ratio, proportion and rates of change", statement: "Ratio notation, dividing a quantity in a given ratio, and ratio problems in context." },
    { conceptId: "proportion", ref: "Ratio, proportion and rates of change", statement: "Direct and inverse proportion, including the constant of proportionality." },
    { conceptId: "proportional-graphs", ref: "Ratio, proportion and rates of change", statement: "Graphs that represent direct and inverse proportion, and interpreting their gradients." },
    { conceptId: "growth-decay", ref: "Ratio, proportion and rates of change", statement: "Growth and decay problems, including compound interest and depreciation." },
    { conceptId: "financial-maths", ref: "Ratio, proportion and rates of change", statement: "Financial mathematics: interest, percentage change, and money problems in context." },
    { conceptId: "mixture-problems", ref: "Ratio, proportion and rates of change", statement: "Modelling with ratio and proportion, including mixtures and rates." },
    // Geometry and measures
    { conceptId: "angles-lines", ref: "Geometry and measures", statement: "Angle facts for lines and polygons, and the angle sum of polygons." },
    { conceptId: "area-perimeter", ref: "Geometry and measures", statement: "Perimeter and area of rectilinear and compound shapes, and of triangles and parallelograms." },
    { conceptId: "volume", ref: "Geometry and measures", statement: "Volume and surface area of prisms, cylinders, pyramids, cones and spheres." },
    { conceptId: "pythagoras", ref: "Geometry and measures", statement: "Pythagoras' theorem, including in three dimensions and in proof of a right angle." },
    { conceptId: "trig-ratios", ref: "Geometry and measures", statement: "Trigonometric ratios in right-angled triangles, and their exact values." },
    { conceptId: "trig-rule", ref: "Geometry and measures", statement: "The sine and cosine rules and the area formula for any triangle (Higher tier)." },
    { conceptId: "circle-area-arc", ref: "Geometry and measures", statement: "Arc length, sector area, and the circumference and area of a circle." },
    { conceptId: "circle-theorems", ref: "Geometry and measures", statement: "Circle theorems and their use in geometric argument (Higher tier)." },
    { conceptId: "transformations", ref: "Geometry and measures", statement: "Translation, rotation, reflection and enlargement, including negative scale factors." },
    { conceptId: "vectors", ref: "Geometry and measures", statement: "Vector notation, addition and scalar multiplication, and geometric proof with vectors." },
    { conceptId: "bearings", ref: "Geometry and measures", statement: "Bearings and scale drawings, including three-figure bearings in navigation problems." },
    { conceptId: "loci-constructions", ref: "Geometry and measures", statement: "Constructions with ruler and compasses, and loci." },
    // Probability
    { conceptId: "probability-basics", ref: "Probability", statement: "Probability scale, equally likely outcomes, and the probability of complementary events." },
    { conceptId: "tree-diagrams", ref: "Probability", statement: "Combined events: tree diagrams, conditional probability, and the addition and multiplication rules." },
    { conceptId: "sets-venn", ref: "Probability", statement: "Sets, Venn diagrams and their use in probability." },
    // Statistics
    { conceptId: "averages", ref: "Statistics", statement: "Mean, median, mode and range, including from grouped and ungrouped data." },
    { conceptId: "data-charts", ref: "Statistics", statement: "Charts and diagrams for discrete and continuous data, and interpreting them." },
    { conceptId: "scatter-correlation", ref: "Statistics", statement: "Scatter graphs, correlation and lines of best fit." },
  ],
};

// ── India · CBSE Class X Mathematics ────────────────────────────────────────
//
// The CBSE syllabus document is public and its UNIT names are stable, but the
// PDF could not be machine-read here — so this is `verification: "portal"` and
// the reviewer's first job is to check each heading against the file. That is
// stated rather than blurred, because the difference between "I read the
// published document" and "I know the document says this" is the difference this
// file exists to make visible.
const CBSE_CLASS_X: MappingSource = {
  title: "Mathematics (Subject Code 041 & 241), Classes IX–X — syllabus",
  publisher: "Central Board of Secondary Education (India), Academic Unit",
  published: "2025-26 session",
  url: "https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf",
  verification: "portal",
  note:
    "The unit names below follow the published Class X syllabus. The PDF could " +
    "not be read programmatically here, so a reviewer must confirm each heading " +
    "against the file before this mapping is raised above 'mapped'. CBSE's index " +
    "for 2026-27 exists; this mapping cites the session it was written against.",
};

const IN_CBSE_MATHS: ConceptMapping = {
  pathwayId: "in-national",
  specId: "in-cbse",
  subject: "maths",
  source: CBSE_CLASS_X,
  reviewer: null,
  reviewedAt: null,
  notes:
    "Class X only. CBSE's Class IX content shares most of these concepts at a " +
    "lower depth, and the ICSE board (in-icse) publishes a different syllabus — " +
    "neither is covered by this mapping.",
  entries: [
    { conceptId: "negatives", ref: "Number Systems", statement: "Integers and their operations, including the number line." },
    { conceptId: "fractions", ref: "Number Systems", statement: "Rational numbers: representation and operations between them." },
    { conceptId: "decimals", ref: "Number Systems", statement: "Decimal representation of rational numbers, including terminating and recurring decimals." },
    { conceptId: "surds", ref: "Number Systems", statement: "Irrational numbers, surds and rationalising denominators." },
    { conceptId: "place-value", ref: "Number Systems", statement: "Place value and the decimal system, revisited through rational and irrational numbers." },
    { conceptId: "order-ops", ref: "Number Systems", statement: "Conventions for the order of operations on real numbers." },
    { conceptId: "polynomials", ref: "Algebra", statement: "Polynomials: degree, zeros, and the relationship between zeros and coefficients." },
    { conceptId: "algebra-expand", ref: "Algebra", statement: "Expansion and factorisation of algebraic expressions, including identities." },
    { conceptId: "linear-equations", ref: "Algebra", statement: "Linear equations in two variables, solved algebraically and represented graphically." },
    { conceptId: "quadratics", ref: "Algebra", statement: "Quadratic equations solved by factorisation and the quadratic formula." },
    { conceptId: "sequences", ref: "Algebra", statement: "Arithmetic progressions: nth term and sum of the first n terms." },
    { conceptId: "coordinates", ref: "Coordinate Geometry", statement: "Distance formula, section formula and the area of a triangle from coordinates." },
    { conceptId: "pythagoras", ref: "Geometry", statement: "Similarity of triangles, the basic proportionality theorem, and the proof of Pythagoras' theorem from similarity." },
    { conceptId: "circle-theorems", ref: "Geometry", statement: "Tangents to a circle and the tangent-secant relationships." },
    { conceptId: "trig-ratios", ref: "Trigonometry", statement: "Trigonometric ratios of acute angles, and standard-angle values." },
    { conceptId: "trig-identity", ref: "Trigonometry", statement: "Trigonometric identities and their use in simplification and proof." },
    { conceptId: "area-perimeter", ref: "Mensuration", statement: "Areas of sectors and segments, and of combinations of plane figures." },
    { conceptId: "volume", ref: "Mensuration", statement: "Surface areas and volumes of combinations of solids." },
    { conceptId: "averages", ref: "Statistics", statement: "Mean, median and mode of grouped and ungrouped data." },
    { conceptId: "data-charts", ref: "Statistics", statement: "Graphical representation of data, including histograms and cumulative frequency curves." },
    { conceptId: "probability-basics", ref: "Probability", statement: "Classical probability of simple and compound events." },
  ],
};

// ── The registry of mappings ────────────────────────────────────────────────

export const CONCEPT_MAPPINGS: ConceptMapping[] = [UK_GCSE_MATHS, IN_CBSE_MATHS];

/** The mapping for a specification, if one has been written. A course with no
 *  mapping is not an error — it is the honest state of 28 of the 30
 *  specifications, and the caller says so rather than inventing one. */
export function mappingForSpec(specId: string | undefined | null): ConceptMapping | null {
  if (!specId) return null;
  return CONCEPT_MAPPINGS.find((m) => m.specId === specId) ?? null;
}

/** The mapping a pathway leads to, when it leads to exactly one mapped course.
 *  A pathway with two mapped specifications (none do today) would be ambiguous,
 *  and answering with one of them would be the silent choice this repo forbids. */
export function mappingForPathway(pathwayId: string | undefined | null): ConceptMapping | null {
  if (!pathwayId) return null;
  const hits = CONCEPT_MAPPINGS.filter((m) => m.pathwayId === pathwayId);
  return hits.length === 1 ? hits[0] : null;
}

/** Has a qualified person read this mapping? The ONLY thing that may raise a
 *  pathway's `mappingReview` above "mapped", and it needs both the name and the
 *  date — a mapping signed without a date cannot be reviewed again later. */
export function mappingIsReviewed(m: ConceptMapping | null): boolean {
  return Boolean(m && m.reviewer && m.reviewedAt);
}

/** The concepts a mapping covers, as a set — what a surface can say "mapped" about
 *  without claiming the whole course. */
export function mappedConceptIds(m: ConceptMapping | null): Set<string> {
  return new Set((m?.entries ?? []).map((e) => e.conceptId));
}

/** A one-line citation for a learner or teacher: document, publisher, date. The
 *  date is the document's own — a citation a ministry can check. */
export function mappingCitation(m: ConceptMapping | null): string {
  if (!m) return "";
  return `${m.source.title} — ${m.source.publisher}, ${m.source.published}`;
}
