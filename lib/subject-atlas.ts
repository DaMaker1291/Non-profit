// ─────────────────────────────────────────────────────────────────────────────
// THE UNIVERSAL SUBJECT ATLAS.
//
// WHAT THIS IS: a route into every subject the product can honestly name, for
// every country, in every interface language. Five subjects are taught and
// graded by OpenMind. Twenty-one further subjects open an external open course
// (BBC Bitesize, Khan Academy) that contains video and diagrams, and carry a
// subject map showing the five questions the route covers.
//
// WHAT THIS IS NOT: a claim that OpenMind has a national syllabus mapping, a
// question bank or a translated teaching body for those twenty-one subjects. The
// UI says "external course — not graded by OpenMind" on every one. Pretending
// otherwise would turn "all subjects" into a marketing sentence a learner
// discovers is false at the first question.
//
// WHY THE MAP IS HONEST: it shows the five topics a route covers. The lines are
// "covered by this route", not prerequisites, and the caption says so. A map
// that drew causal arrows between history topics would be inventing a claim no
// historian made.
//
// EVERY URL was resolved (HTTP 200) at the source when this file was written.
// The course page is a LINK, never an iframe, embed or download. Caption status
// is `unknown` until a person watches the track: an unverified "captions" badge
// is worse than telling the learner to look for the CC control.
// ─────────────────────────────────────────────────────────────────────────────

export type AtlasCourseFormat = "video-and-text" | "video-and-practice";

/** An external open course, with the honest scope of its use. */
export interface AtlasCourse {
  readonly url: string;
  readonly title: string;
  readonly source: string;
  /** Language of the AUDIO/teaching, as a BCP-47 tag. */
  readonly language: string;
  /** Whether the source is known to caption every video. `unknown` is honest. */
  readonly captions: "human" | "auto" | "none" | "unknown";
  readonly format: AtlasCourseFormat;
  /** What the learner will find there, in one sentence. */
  readonly summary: string;
}

export interface AtlasSubject {
  /** Stable id. Also the suffix of its dictionary name key (`atlas.<id>`). */
  readonly id: string;
  readonly labelKey: string;
  /** True only for a subject OpenMind teaches, marks and keeps evidence for. */
  readonly graded: boolean;
  /** Where a graded subject's lessons live. Absent for an external route. */
  readonly href?: string;
  /** The external route. Absent only for a graded subject. */
  readonly course?: AtlasCourse;
  /** The question the subject exists to answer, in English source prose. */
  readonly question: string;
  /** Exactly five questions/topics the route covers. English source prose. */
  readonly topics: readonly string[];
}

const external = (
  id: string,
  question: string,
  topics: readonly string[],
  course: AtlasCourse,
): AtlasSubject => ({
  id,
  labelKey: `atlas.${id}`,
  graded: false,
  course,
  question,
  topics,
});

/** The five subjects with a bank, a lesson plan and recorded evidence. */
const GRADED: readonly AtlasSubject[] = [
  {
    id: "maths",
    labelKey: "subj.maths",
    graded: true,
    href: "/learn/maths",
    question: "How do we describe number, shape and change so that the answer can be checked?",
    topics: ["Place value", "Fractions", "Algebra", "Geometry", "Probability"],
  },
  {
    id: "physics",
    labelKey: "subj.physics",
    graded: true,
    href: "/learn/physics",
    question: "How do matter, motion, energy and fields behave, and how do we predict them?",
    topics: ["Forces", "Motion", "Energy", "Waves", "Electricity"],
  },
  {
    id: "chemistry",
    labelKey: "subj.chemistry",
    graded: true,
    href: "/learn/chemistry",
    question: "What are substances made of, and how and why do they change?",
    topics: ["Atoms", "Bonding", "The mole", "Reactions", "Acids"],
  },
  {
    id: "biology",
    labelKey: "subj.biology",
    graded: true,
    href: "/learn/biology",
    question: "How do living systems work, stay alive and pass themselves on?",
    topics: ["Cells", "Photosynthesis", "DNA", "Homeostasis", "Ecology"],
  },
  {
    id: "computing",
    labelKey: "subj.computing",
    graded: true,
    href: "/learn/computing",
    question: "How do we turn a problem into steps a machine can execute, and prove they work?",
    topics: ["Algorithms", "Variables", "Control flow", "Data structures", "Networks"],
  },
];

/**
 * Twenty-one external routes, chosen because each source publishes a real course
 * page with teaching, practice and diagrams — and, except where noted, video.
 * They are not translations of one another and are not national syllabi.
 */
const EXTERNAL: readonly AtlasSubject[] = [
  external(
    "english",
    "How do words, sentences and whole texts make meaning — and how do I make that meaning clear?",
    ["Reading for meaning", "Grammar and sentence structure", "Vocabulary and word choice", "Writing for a purpose", "Comparing texts and viewpoints"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zt3rkqt",
      title: "English",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's English subject page: language and literature guides, exam-style practice and subject video playlists.",
    },
  ),
  external(
    "history",
    "How do we know what happened, why it happened, and what it meant to the people who lived it?",
    ["Chronology and evidence", "Causation and consequence", "Change and continuity", "Sources and interpretation", "Significance and argument"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z7svr82",
      title: "History",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's History subject page: period guides, source work and video playlists for revision.",
    },
  ),
  external(
    "geography",
    "How do physical and human systems shape places, and how do maps and fieldwork change what we can see?",
    ["Maps and scale", "Physical processes", "Human systems", "Place and interdependence", "Sustainability and fieldwork"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z2f3cdm",
      title: "Geography",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Geography subject page: physical and human geography guides, map skills and video playlists.",
    },
  ),
  external(
    "economics",
    "How do people and societies choose what to produce, consume and share when resources are limited?",
    ["Scarcity and choice", "Supply and demand", "Markets and prices", "Inflation and growth", "Personal finance"],
    {
      url: "https://www.khanacademy.org/economics-finance-domain",
      title: "Economics",
      source: "Khan Academy",
      language: "en",
      captions: "unknown",
      format: "video-and-practice",
      summary: "Khan Academy's Economics course: microeconomics, macroeconomics, finance and personal finance, taught with video and practice.",
    },
  ),
  external(
    "civics",
    "How are power, rights and responsibilities organised — and how can a person take part?",
    ["Rights and responsibilities", "Democracy and voting", "Law and justice", "Government and public money", "Media and participation"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z7f3cdm",
      title: "Citizenship",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Citizenship subject page: democracy, law, rights and participation, with guides and video.",
    },
  ),
  external(
    "psychology",
    "How can behaviour and mental life be studied, explained and sometimes changed?",
    ["Research methods", "Memory and attention", "Learning and conditioning", "Development and personality", "Mental health and bias"],
    {
      url: "https://www.khanacademy.org/test-prep/mcat/behavioral-sciences",
      title: "Behavioral sciences",
      source: "Khan Academy",
      language: "en",
      captions: "unknown",
      format: "video-and-practice",
      summary: "Khan Academy's behavioral-sciences course: psychology, neuroscience and research methods, with video, diagrams and practice.",
    },
  ),
  external(
    "sociology",
    "How do societies shape people, and how do people reproduce or change those societies?",
    ["Socialisation", "Culture and identity", "Institutions", "Inequality and power", "Research and evidence"],
    {
      url: "https://www.khanacademy.org/test-prep/mcat/society-and-culture",
      title: "Society and culture",
      source: "Khan Academy",
      language: "en",
      captions: "unknown",
      format: "video-and-practice",
      summary: "Khan Academy's society-and-culture course: social structures, culture, inequality and research, with video and practice.",
    },
  ),
  external(
    "philosophy",
    "What can we know, how should we live, and what makes an argument sound rather than merely convincing?",
    ["Arguments and validity", "Knowledge and doubt", "Mind and self", "Ethics and justice", "Political philosophy"],
    {
      url: "https://www.khanacademy.org/partner-content/wi-phi",
      title: "Philosophy",
      source: "Khan Academy · Wi-Phi",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "Wi-Phi's philosophy videos on argument, knowledge, mind, ethics and political philosophy, hosted by Khan Academy.",
    },
  ),
  external(
    "art",
    "How do visual choices create meaning, and how do I make and justify my own?",
    ["Elements of art", "Colour and composition", "Materials and process", "Context and meaning", "Critique and portfolio"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z8tnvcw",
      title: "Art and Design",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Art and Design subject page: techniques, artists, analysis and portfolio guidance, with video.",
    },
  ),
  external(
    "music",
    "How does organised sound create rhythm, mood, form and meaning?",
    ["Rhythm and metre", "Pitch and melody", "Harmony and texture", "Form and structure", "Listening and performance"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z9xhfg8",
      title: "Music",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Music subject page: elements, styles, composition and performance, with audio and video.",
    },
  ),
  external(
    "drama",
    "How do performers use body, voice and space to create a world an audience believes in?",
    ["Character and objective", "Voice and movement", "Scene and tension", "Devising and rehearsal", "Performance and evaluation"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zk6pyrd",
      title: "Drama",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Drama subject page: performance skills, devising, theatre makers and written analysis, with video.",
    },
  ),
  external(
    "pe-health",
    "How does the body move, adapt and stay well — and how do we train it safely?",
    ["Training principles", "Anatomy and movement", "Nutrition and recovery", "Health and wellbeing", "Sport and participation"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zdhs34j",
      title: "Physical Education",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Physical Education subject page: anatomy, training, health and sport, with diagrams and video.",
    },
  ),
  external(
    "media",
    "Who made this message, for whom, and how would I know whether it is true?",
    ["Audience and purpose", "Language and representation", "Institutions and ownership", "Algorithms and platforms", "Misinformation and verification"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zwpfb9q",
      title: "Media Studies",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Media Studies subject page: media language, representation, audiences and institutions, with video.",
    },
  ),
  external(
    "religious-studies",
    "What do people believe, how do they practise it, and how do beliefs shape ethics and public life?",
    ["Beliefs and texts", "Practice and ritual", "Ethics and values", "Comparative religion", "Religion in public life"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zmyb4wx",
      title: "Religious Studies",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Religious Studies subject page: beliefs, practices and ethical themes across religions and worldviews, with video.",
    },
  ),
  external(
    "design-tech",
    "How do we turn a human need into a safe, buildable product — and prove it works?",
    ["Design brief and user", "Materials and properties", "Structures and mechanisms", "Electronics and control", "Prototype and evaluate"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zykw2hv",
      title: "Design and Technology",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Design and Technology subject page: materials, mechanisms, electronics and the design process, with video.",
    },
  ),
  external(
    "business",
    "How does an organisation find customers, manage money and make decisions that last?",
    ["Customers and markets", "Operations and costs", "Finance and cash flow", "Marketing and brand", "Enterprise and ethics"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zjnygk7",
      title: "Business",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Business subject page: enterprise, marketing, finance and operations, with case studies and video.",
    },
  ),
  external(
    "languages",
    "How do I understand and use another language in real situations, not just recite its rules?",
    ["Listening and speaking", "Reading and translation", "Vocabulary and grammar", "Culture and context", "Writing and accuracy"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zrqmhyc",
      title: "Modern Foreign Languages",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Modern Foreign Languages subject page: listening, speaking, reading, writing and grammar across languages, with audio and video.",
    },
  ),
  external(
    "dance",
    "How do dancers build movement, rehearse it safely and make an audience feel something?",
    ["Technique and alignment", "Choreography", "Performance", "Appreciation", "Health and safety"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zg9jtfr",
      title: "Dance",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Dance subject page: technique, choreography, performance and safe practice, with performance video.",
    },
  ),
  external(
    "film",
    "How do moving images, sound and editing construct a story — and who controls what we see?",
    ["Cinematography", "Editing", "Sound", "Narrative", "Industry and audience"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z6w8rmn",
      title: "Film and Screen",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Film and Screen subject page: cinematic language, editing, sound, narrative and production, with film analysis.",
    },
  ),
  external(
    "environment",
    "How do ecosystems work, what is changing them, and what can people actually do about it?",
    ["Ecosystems", "Climate", "Resources", "Biodiversity", "Action and systems"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/z8mfsk7",
      title: "Learning for Sustainability",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Learning for Sustainability subject page: ecosystems, climate, resources and sustainable action, with video and case studies.",
    },
  ),
  external(
    "engineering",
    "How do we design, build and test a structure or machine that works safely in the real world?",
    ["Forces and structures", "Materials", "Energy and power", "Systems and control", "Design and testing"],
    {
      url: "https://www.bbc.co.uk/bitesize/subjects/zb3cjxs",
      title: "Engineering science",
      source: "BBC Bitesize",
      language: "en",
      captions: "unknown",
      format: "video-and-text",
      summary: "BBC Bitesize's Engineering science subject page: structures, materials, energy, control systems and engineering design, with diagrams and video.",
    },
  ),
];

export const SUBJECT_ATLAS: readonly AtlasSubject[] = [...GRADED, ...EXTERNAL];

/** Counts the page prints. Derived, never typed into a sentence. */
export const ATLAS_GRADED_COUNT = GRADED.length;
export const ATLAS_EXTERNAL_COUNT = EXTERNAL.length;
export const ATLAS_TOTAL_COUNT = SUBJECT_ATLAS.length;

export function atlasSubject(id: string): AtlasSubject | undefined {
  return SUBJECT_ATLAS.find((s) => s.id === id);
}

// ── The subject map, as data ────────────────────────────────────────────────
// The map is a route overview, not a causal diagram. Keep the geometry here so
// the renderer cannot invent a different claim from the one the gate checks.

export const ATLAS_MAP_WIDTH = 720;
export const ATLAS_MAP_HEIGHT = 360;
export const ATLAS_MAP_NODE_WIDTH = 336;
export const ATLAS_MAP_NODE_HEIGHT = 48;

export interface AtlasMapBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface AtlasMapNode extends AtlasMapBox {
  readonly index: number;
  readonly label: string;
  readonly lines: readonly string[];
}

export interface AtlasMapEdge {
  readonly index: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface AtlasMapLayout {
  readonly centre: AtlasMapBox;
  readonly nodes: readonly AtlasMapNode[];
  readonly edges: readonly AtlasMapEdge[];
}

/** Split a topic label into at most two lines that fit the 336px node. */
export function wrapAtlasLabel(label: string, max = 40): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= max || !current) lines[lines.length - 1] = candidate;
    else if (lines.length < 2) lines.push(word);
    else lines[1] = `${lines[1]} ${word}`.slice(0, max - 1) + "…";
  }
  return lines;
}

/** Five nodes on the right, one centre box on the left. */
export function atlasMapLayout(subject: AtlasSubject): AtlasMapLayout {
  const topics = subject.topics.slice(0, 5);
  const centre: AtlasMapBox = { x: 16, y: 145, width: 208, height: 70 };
  const nodes: AtlasMapNode[] = topics.map((label, index) => ({
    index,
    label,
    lines: wrapAtlasLabel(label),
    x: 352,
    y: 10 + index * 66,
    width: ATLAS_MAP_NODE_WIDTH,
    height: ATLAS_MAP_NODE_HEIGHT,
  }));
  const edges: AtlasMapEdge[] = nodes.map((node) => ({
    index: node.index,
    x1: centre.x + centre.width,
    y1: centre.y + centre.height / 2,
    x2: node.x - 8,
    y2: node.y + node.height / 2,
  }));
  return { centre, nodes, edges };
}
