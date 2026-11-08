import type { AuthoredLesson } from "../../lesson-contract";

// CELLS IS THE FIRST BIOLOGY IDEA, AND THE ONE MOST OFTEN TAUGHT AS A LABEL
// LIST. A learner can name the nucleus, the cytoplasm and the membrane and still
// be unable to say why a red blood cell has no nucleus or why a root hair cell is
// long. This lesson teaches the two questions that make the list mean something:
// what does this structure DO, and what job is this cell shaped for?
export const BIOLOGY_CELLS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "cells",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, cell biology: cell structure, specialised cells and surface area",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Name the structures shared by animal cells and explain what each one does for the cell, rather than only labelling it.",
      evidence:
        "The learner describes the membrane as the boundary that controls what enters and leaves, the cytoplasm as where the reactions happen, the nucleus as the store of genetic material, and the mitochondria as where energy is released from glucose.",
    },
    {
      statement:
        "Explain how a specialised cell's shape helps it carry out one particular job.",
      evidence:
        "For a root hair cell, the learner links the long extension to a larger surface area, and therefore a faster rate of absorption of water and mineral ions.",
    },
    {
      statement:
        "Explain why most cells are small, using the relationship between surface area and volume.",
      evidence:
        "The learner states that as a cell grows its volume increases faster than its surface area, so the membrane can no longer supply enough oxygen and remove enough waste for the whole cell.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "What is the smallest unit that a living thing is made of?",
        answer:
          "The cell. Some living things are a single cell, and every larger organism is built from many cells working together.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question:
          "A house has walls, rooms and a heating system. Which part of a cell is most like the wall, and which is most like the heating system?",
        answer:
          "The cell membrane is like the wall, because it separates the inside from the outside, and the mitochondria are like the heating system, because they release energy.",
        targets: ["cells"],
      },
    ],
  },

  introduction: {
    hook:
      "Break the surface of your skin and, within days, the gap closes. Nothing has been added from outside. The cells at the edge of the cut have divided and filled the space, which is only possible because a cell is a workshop that can copy itself. The same is true of a cut on a plant stem, a scrape on a fish's scale and a wound in a leaf.",
    why:
      "A cell is the smallest unit that can carry out all the processes of life: it takes in material, releases energy, builds molecules and copies its instructions. Almost every question in biology is a question about what a cell is doing, which is why the structures inside it matter. A list of organelles is not an explanation. The explanation is that each structure exists because of a job, and that a cell's shape is evidence of the job it does.",
  },

  explanation: [
    {
      heading: "A cell is a boundary around a chemical workshop",
      paragraphs: [
        "Every cell is surrounded by a membrane, a thin layer that separates the inside from the outside and controls what passes through. That control is the important part: if the membrane were simply a wall, the cell could not take in glucose or oxygen, and it could not remove the waste it makes. Inside the membrane is the cytoplasm, a watery solution where most of the cell's reactions happen, and the genetic material that carries the instructions for building and running the cell.",
        "Animal cells keep their genetic material inside a nucleus, and they contain mitochondria, which are the sites where energy is released from glucose during respiration. Plant cells have the same basic set, plus three additions. Each addition answers a problem that a plant has and an animal does not: a plant cannot move to find light or water, and it cannot use a skeleton to stand upright.",
      ],
    },
    {
      heading: "Plant cells add three structures, each for a reason",
      paragraphs: [
        "A plant cell has a cell wall outside the membrane. The wall is made of cellulose, it is strong, and that strength lets a plant stand up without bones. The membrane still exists inside the wall and still controls what enters, which is why a plant cell is not simply a box. When a plant cell takes in water, the vacuole swells and pushes the membrane against the wall, and that pressure is what keeps a soft stem firm rather than flopping.",
        "Chloroplasts contain chlorophyll, which absorbs light so that the plant can make glucose from carbon dioxide and water. A root cell has no chloroplasts because no light reaches it underground, which is why the plant depends on its leaves for sugar. The permanent vacuole stores water and dissolved substances, and it is permanent in a plant cell rather than a small temporary droplet. Each of these structures is evidence of the way a plant lives.",
      ],
    },
    {
      heading: "Specialisation is a shape doing a job",
      paragraphs: [
        "Most cells in a large organism are specialised, which means they have a shape and a set of structures suited to one task. A red blood cell is biconcave, with a dent on each side, so that it has a large surface area for its volume and can absorb and release oxygen quickly. It also loses its nucleus as it matures, which leaves more room for haemoglobin, the pigment that carries oxygen. It cannot divide or repair itself, and it survives for about four months.",
        "A root hair cell has a long, thin extension into the soil, which increases its surface area for absorbing water and mineral ions. A sperm cell has a tail for movement and many mitochondria to release the energy that movement needs. A nerve cell is long so that one cell can carry a signal across a large distance. In each case the shape is not decoration: it is the physical form of the job.",
      ],
    },
    {
      heading: "Why cells stay small",
      paragraphs: [
        "As a cell grows, its volume increases much faster than its surface area, because volume scales with the cube of a length while area scales with the square. A cell that doubles in width has eight times the volume but only four times the membrane. Since oxygen and glucose enter through the membrane and waste leaves through it, a large cell cannot supply its interior fast enough, however well its membrane works.",
        "That is why large organisms are built from many small cells rather than a few enormous ones, and why cells that need a high rate of exchange are shaped to increase their surface: flattened, elongated or folded. A root hair cell is a small cell with a long extension, so it gains surface without gaining much volume. The same reasoning explains why the lining of the small intestine has finger-like projections rather than a smooth tube.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "An animal cell has a membrane that controls what enters and leaves, a cytoplasm where reactions happen, a nucleus that holds the genetic instructions, and mitochondria that release energy from glucose, so that each part of the cell has a job rather than merely a name.",
      notation: "membrane · cytoplasm · nucleus · mitochondria · ribosomes",
      caption:
        "The membrane is the boundary, not the wall of a room: it chooses what crosses. A cell whose membrane lost that control would fill with whatever surrounded it and lose the substances it needs.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Oxygen moves into a cell because its concentration outside is higher than inside, so it diffuses down that gradient; carbon dioxide moves out for the same reason in reverse, because respiration produces it faster than it is used.",
      notation: "oxygen: high outside → low inside · carbon dioxide: high inside → low outside",
      caption:
        "Diffusion needs a difference in concentration and a short path. A flattened cell keeps both, which is why the shape of a red blood cell is part of its function rather than an accident of drawing.",
    },
    {
      id: "r3",
      kind: "biology.structure-function",
      body:
        "A root hair cell is long and thin because that shape gives a large surface area in contact with the soil, which lets the cell absorb water and mineral ions faster than a short, round cell of the same volume could.",
      notation: "long extension → large surface area → faster absorption",
      caption:
        "The extension does not make the cell larger in volume by much, so the gain is almost entirely in surface. That is the same trade a radiator makes when it is built with fins.",
    },
    {
      id: "r4",
      kind: "biology.structure-function",
      body:
        "A plant cell has a cellulose wall outside its membrane because the wall is strong in tension, which allows the cell to hold its shape and the plant to stand upright without a skeleton; the vacuole presses the membrane against the wall so that the tissue stays firm.",
      notation: "cell wall: cellulose · vacuole: water storage and turgor",
      caption:
        "A plant that has lost water wilts because the vacuoles have shrunk and the membrane is no longer pressed against the wall. The wall is still there, which is why the plant does not collapse completely.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A root hair cell has a long, thin extension into the soil. Explain how this shape helps the plant absorb water and mineral ions.",
      steps: [
        {
          move:
            "Identify the job of the cell: it absorbs water and mineral ions from the soil.",
          why:
            "The shape can only be explained against a function. Without naming the job first, the extension is just a feature to memorise.",
        },
        {
          move:
            "Link the extension to surface area: the long, thin shape gives a large membrane surface in contact with the soil.",
          why:
            "Absorption happens across the membrane, so the rate depends on how much membrane is exposed. A longer extension exposes more membrane for almost the same volume.",
        },
        {
          move:
            "Link surface area to rate: more surface means more water and ions can cross per second, so the plant absorbs faster.",
          why:
            "Diffusion and active transport both depend on the area available. The shape does not change the soil, the concentration or the plant's need; it changes how quickly material can cross.",
        },
      ],
      answer:
        "The long extension gives the cell a large surface area in contact with the soil, so water and mineral ions can cross the membrane faster than they could through a short, round cell.",
    },
    {
      id: "w2",
      prompt:
        "A red blood cell has no nucleus. A student says this means it cannot be a living cell. Evaluate the student's claim.",
      steps: [
        {
          move:
            "State what the nucleus normally does: it holds the genetic instructions and controls the cell's activities.",
          why:
            "The claim depends on what a nucleus is for. A cell without one has genuinely lost something important, so the claim is not silly.",
        },
        {
          move:
            "Explain what the red blood cell gains by losing it: more room for haemoglobin, so each cell carries more oxygen.",
          why:
            "The loss is a trade, not a failure. A cell packed with haemoglobin transports more oxygen per cell, which is the function the cell exists for.",
        },
        {
          move:
            "Conclude that it is still a living cell, but a specialised one that cannot divide and has a limited life.",
          why:
            "It carries out respiration and other reactions, so it is alive by the same criteria as other cells. It cannot repair itself or divide, which is why the body must keep making new ones from stem cells.",
        },
      ],
      answer:
        "The claim is wrong: the cell is alive because it still carries out reactions such as respiration, but it has lost its nucleus in exchange for more haemoglobin, so it cannot divide and lasts only about four months.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A plant cell has a cell wall instead of a membrane.",
      whyItFails:
        "The wall is outside the membrane, not a replacement for it. The membrane is still there and still controls what enters and leaves; a cell with only a wall would be an open box. The wall provides strength, while the membrane provides control.",
      correction:
        "Draw the wall as an outer layer and the membrane as a separate inner layer, then ask what each one does. Strength and selectivity are different jobs, so a plant cell needs both.",
      contrast: {
        wrong: "the wall is the outer covering, so the membrane is not needed",
        right: "the wall is outside the membrane; the membrane still controls what crosses",
      },
    },
    {
      id: "m2",
      belief: "Red blood cells have no nucleus because they are simple cells.",
      whyItFails:
        "They start with a nucleus and lose it as they mature. The loss is a specialisation that makes room for haemoglobin, not evidence that the cell is primitive. A cell that never had a nucleus could not have been built from the instructions to make haemoglobin in the first place.",
      correction:
        "Describe the red blood cell's development: a stem cell divides, fills with haemoglobin, and loses its nucleus. The mature cell is specialised, not simple.",
      contrast: {
        wrong: "no nucleus means a simple, early cell",
        right: "the nucleus is lost during maturation so the cell can carry more oxygen",
      },
    },
    {
      id: "m3",
      belief: "A larger cell is better because it has more room for the cell's reactions.",
      whyItFails:
        "A larger cell does have more volume, but its surface area grows more slowly than its volume. Since oxygen and waste cross the membrane, the interior of a large cell is supplied more slowly, not more quickly. Size is a trade between capacity and exchange.",
      correction:
        "Compare surface area to volume as a cell grows. If exchange is the limiting process, a cell must stay small or change shape to increase its surface rather than its volume.",
      contrast: {
        wrong: "bigger cell, more space, so it works better",
        right: "bigger cell, less surface per unit volume, so exchange becomes limiting",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A sperm cell has many mitochondria in the section of the cell just behind its head. Explain why this is useful.",
      hint:
        "What does a mitochondrion release, and what does the tail of a sperm cell need in order to move?",
      answer:
        "Mitochondria release energy from glucose during respiration, and the tail needs energy to move the sperm cell towards the egg, so many mitochondria supply that energy close to where it is used.",
      feedback: {
        correct:
          "You linked the structure to the energy demand of movement, which is the reasoning this question is testing.",
        incorrect:
          "The mitochondria do not store the sperm's genetic material. Name the process that releases energy and the part of the cell that uses it.",
      },
    },
    {
      id: "p2",
      prompt:
        "A cell in a pond is 1 mm across, much larger than a typical cell. Explain one problem this creates for the cell.",
      hint:
        "Compare the cell's surface area with its volume, and think about how oxygen reaches the inside.",
      answer:
        "Its volume is large compared with its surface area, so oxygen diffusing in through the membrane cannot reach the interior fast enough to supply the whole cell, and waste cannot diffuse out fast enough.",
      feedback: {
        correct:
          "You used the surface-area-to-volume relationship rather than simply saying the cell is too big.",
        incorrect:
          "Being big is not a problem by itself. The problem is the ratio of surface to volume and what that does to diffusion.",
      },
    },
    {
      id: "p3",
      prompt:
        "A plant is left without water and its stem droops. Explain what has happened inside the stem's cells.",
      hint: "What normally presses the membrane against the cell wall?",
      answer:
        "The vacuoles have lost water and shrunk, so they no longer press the membrane against the cell wall. Without that pressure the cells lose their firmness and the stem droops.",
      feedback: {
        correct:
          "You connected water loss to the vacuole, to pressure on the wall, and to the plant's shape.",
        incorrect:
          "The cell wall has not disappeared. Think about what fills the vacuole and what that does to the cell's internal pressure.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why a sperm cell has many mitochondria and a large tail, while a red blood cell has neither, even though both are specialised cells.",
      modelAnswer:
        "Both cells are specialised for a particular job, so their structures differ. A sperm cell must travel to the egg, so it has a tail for movement and many mitochondria to release the energy that movement requires. A red blood cell must carry oxygen, so it has a biconcave shape for a large surface area and loses its nucleus to make room for haemoglobin. It does not need to move itself or divide, so a tail and a large number of mitochondria would take up space that is better used for haemoglobin.",
      marking: [
        "States that both cells are specialised for different functions.",
        "Links the sperm cell's tail to movement and its mitochondria to energy release.",
        "Links the red blood cell's shape to surface area and its missing nucleus to haemoglobin capacity.",
        "Explains the difference as a trade between two jobs rather than as one cell being better.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A leaf cell and a root cell come from the same plant. Explain one difference between them and why it exists.",
      modelAnswer:
        "A leaf cell contains chloroplasts and a root cell does not, because light reaches the leaf but not the soil, so only the leaf can photosynthesise.",
      marking: [
        "Names a real difference, such as chloroplasts or the absence of light underground.",
        "Explains the difference in terms of the cell's function and its environment.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Which organelle releases energy from glucose in an animal cell?",
      modelAnswer: "The mitochondrion.",
      marking: [
        "Names the mitochondrion.",
        "Distinguishes it from the nucleus, which stores instructions rather than releasing energy.",
      ],
      check: {
        accepted: ["mitochondrion", "mitochondria", "the mitochondrion", "the mitochondria"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A single-celled organism lives in a pond and is much larger than a typical cell. It has a flattened, plate-like shape and many small contractile vacuoles that pump water out. Explain how its shape and its vacuoles help it survive, using the idea of surface area and volume.",
      whyItTransfers:
        "The organism is not a cell from a textbook diagram, and no structure is labelled for the learner. The same surface-area reasoning has to be applied to an unfamiliar shape and to a problem, water balance, that the lesson did not name.",
      answer:
        "A flattened shape gives a larger surface area for its volume, so oxygen can diffuse in and waste can diffuse out fast enough for a large cell. The contractile vacuoles pump out excess water that enters by osmosis, because a freshwater organism takes in water continuously and would otherwise swell and burst.",
      marking: [
        "Links the flattened shape to a larger surface-area-to-volume ratio and to faster exchange.",
        "Explains that water enters by osmosis from the pond.",
        "Explains that the vacuoles remove excess water and prevent the cell bursting.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Name three structures found in a plant cell but not in an animal cell.",
      answer: "Cell wall, chloroplasts and a permanent vacuole.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does a root hair cell have no chloroplasts?",
      answer:
        "Chloroplasts absorb light for photosynthesis, and no light reaches a root underground, so the cell does not need them.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why a cell that grows too large cannot rely on diffusion alone.",
      answer:
        "Its volume increases faster than its surface area, so the membrane cannot supply enough oxygen or remove waste fast enough for the whole cell.",
      when: "month-later",
    },
  ],

  summary: [
    "A cell is a membrane-bound unit in which the reactions of life happen; each structure inside it exists because of a job.",
    "Plant cells add a cellulose wall, chloroplasts and a permanent vacuole, each answering a problem a plant faces.",
    "Specialised cells are shaped for one function, and the shape is evidence of that function.",
    "Cells stay small because surface area grows more slowly than volume, which limits exchange.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each cell diagram is described as a list of structures with their function and position, so the description carries the teaching rather than only the labels.",
    },
    {
      need: "colour-vision",
      alternative:
        "Structures in every diagram are labelled with their names as well as shaded, so no part depends on colour alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each structure is introduced in the same three-part pattern — name, job, why the job matters — so the reading load is predictable.",
    },
    {
      need: "motor",
      alternative:
        "The lesson needs typing or selecting, not dragging; diagrams are readable without interaction.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note:
        "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-biology-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for cell biology.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-07",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
