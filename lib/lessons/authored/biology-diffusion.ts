import type { AuthoredLesson } from "../../lesson-contract";

// DIFFUSION IS OFTEN TAUGHT AS "PARTICLES SPREAD OUT", WHICH IS A DESCRIPTION
// RATHER THAN A MECHANISM. This lesson starts from random motion, shows why a
// net movement appears only when a gradient exists, and then treats osmosis and
// active transport as the two variations a learner must be able to tell apart:
// water through a membrane, and a pump that spends energy to go uphill.
export const BIOLOGY_DIFFUSION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "diffusion",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, transport in cells: diffusion, osmosis and active transport",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain diffusion as the net movement of particles down a concentration gradient, caused by random motion.",
      evidence:
        "The learner states that particles move in all directions and that a net movement appears only because more particles start on one side, not because particles aim for the low-concentration side.",
    },
    {
      statement:
        "Predict the direction of osmosis across a partially permeable membrane and explain the effect on plant and animal cells.",
      evidence:
        "The learner moves water from the more dilute solution to the more concentrated one and predicts turgidity, plasmolysis or lysis with a reason.",
    },
    {
      statement:
        "Explain why active transport needs energy and how it differs from diffusion.",
      evidence:
        "The learner states that active transport moves substances against their gradient using energy from respiration, and gives a root hair cell or gut example.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells"],
    check: [
      {
        id: "d1",
        question: "What controls what enters and leaves a cell?",
        answer:
          "The cell membrane, a thin partially permeable layer around the cell that lets some substances pass through and not others.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question: "Why does a cell need oxygen and need to remove carbon dioxide?",
        answer:
          "Oxygen is used in respiration to release energy, and carbon dioxide is a waste product that must leave so it does not build up.",
        targets: ["cells"],
      },
    ],
  },

  introduction: {
    hook:
      "Open a window at one end of a room and someone opens a bottle of perfume at the other. Within a minute you can smell it, even though no air current carried it across. The perfume molecules have spread by moving randomly and colliding with air molecules. Nothing pushed them towards your nose; they simply ended up spread through the room because there were more of them at the bottle than anywhere else.",
    why:
      "Diffusion is the net movement of particles from a region of higher concentration to a region of lower concentration, caused by random motion. The word net is essential: individual particles move both ways, but more move from the crowded side, so the overall effect is a flow down the gradient. Osmosis is water diffusing through a partially permeable membrane, and active transport is the exception that uses energy to move substances the other way. Together they explain how oxygen reaches a muscle, how a root absorbs water, and why a plant wilts.",
  },

  explanation: [
    {
      heading: "Diffusion is a net movement produced by random motion",
      paragraphs: [
        "Particles in a gas or a liquid are moving constantly and in random directions. When one region has a higher concentration than another, a particle chosen at random is more likely to be in the crowded region, so more particles cross from crowded to empty than the other way. That imbalance is the diffusion flow. It is not a force pulling particles apart, and it does not require the particles to sense where they are going.",
        "As the concentrations become equal, the two flows become equal and the net movement stops. This is dynamic equilibrium: particles continue to cross the boundary in both directions, but there is no longer a net change. A cell at equilibrium is not still; it is balanced. That distinction matters because a learner who thinks diffusion stops when the concentrations match will misread every graph of oxygen uptake.",
      ],
    },
    {
      heading: "The gradient, the distance and the area set the rate",
      paragraphs: [
        "The rate of diffusion depends on the size of the concentration difference: a steeper gradient produces a faster net movement. It also depends on temperature, because warmer particles move faster, and on the distance across which the substance must travel. A thin barrier allows faster diffusion than a thick one, which is why the walls of an alveolus are one cell thick.",
        "Surface area is the third major factor. More membrane exposed to the gradient means more particles can cross per second. That is why a root hair cell is long and thin, why the small intestine is folded into villi, and why a red blood cell is flattened. The same reasoning explains the surface-area-to-volume problem: a large cell has proportionally less membrane, so diffusion alone cannot supply its interior quickly enough.",
      ],
    },
    {
      heading: "Osmosis is water diffusion through a partially permeable membrane",
      paragraphs: [
        "A partially permeable membrane lets water molecules pass but blocks larger solute molecules. If one side has a more dilute solution and the other a more concentrated one, water moves from the dilute side to the concentrated side. The solute cannot cross to balance the concentrations, so water movement is the only way the system can respond. This is osmosis, and it is diffusion of water rather than a different process.",
        "In a plant cell, water entering the vacuole pushes the membrane against the cell wall, making the cell turgid and the tissue firm. If the cell loses water to a concentrated solution, the vacuole shrinks and the membrane pulls away from the wall; this is plasmolysis, and the plant wilts. An animal cell has no wall, so it can swell and burst in pure water or shrink in a strong solution. The direction is always the same rule: water moves towards the more concentrated solution.",
      ],
    },
    {
      heading: "Active transport moves substances against the gradient",
      paragraphs: [
        "Sometimes a cell needs a substance that is already more concentrated inside than outside. Diffusion would carry it out, so the cell cannot rely on diffusion. Active transport uses carrier proteins in the membrane and energy released by respiration to move the substance against its gradient. Root hair cells use it to absorb mineral ions from soil even when the soil solution is more dilute than the cell contents.",
        "Active transport differs from diffusion in three ways that are worth naming. It can move a substance from low to high concentration, it requires energy, and it can be saturated: once every carrier protein is occupied, adding more substance does not increase the rate. That saturation is the evidence that a finite number of proteins are doing the work, just as enzyme saturation shows a finite number of active sites.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.process",
      body:
        "Oxygen diffuses from the alveolus into the blood because its concentration is higher in the air than in the blood arriving at the lungs. Carbon dioxide diffuses the other way because respiration has made its concentration higher in the blood, so the gradient drives it out.",
      notation: "alveolus: high oxygen → blood: low oxygen · blood: high carbon dioxide → alveolus: low carbon dioxide",
      caption:
        "Both gases move down their own gradients. The lungs do not pump oxygen into the blood; breathing maintains the gradients that make diffusion continue.",
    },
    {
      id: "r2",
      kind: "biology.structure-function",
      body:
        "A root hair cell is long and thin because that shape gives a large surface area in contact with the soil, which lets water and mineral ions cross the membrane faster than a short, round cell could manage.",
      notation: "long extension → large surface area → faster absorption",
      caption:
        "The extension adds surface far more than it adds volume, which is the same trade a radiator makes when it is built with fins.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "Water moves across a partially permeable membrane from the dilute solution to the concentrated one because the solute cannot cross to equalise the concentrations, so water is the only particle that can reduce the difference.",
      notation: "dilute side: more water → concentrated side: less water",
      caption:
        "The membrane is the deciding condition. If it were fully permeable, the solute would diffuse too and there would be no lasting osmotic flow.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "Potato cylinders placed in sucrose solutions lose mass in concentrated solutions and gain mass in pure water. The change is caused by water leaving or entering the cells by osmosis, so the graph crosses zero at the concentration where the cell contents are in balance with the solution.",
      notation: "mass change: positive in water · zero at the balance point · negative in concentrated sucrose",
      caption:
        "The zero crossing is the useful measurement: it estimates the concentration inside the potato cells without opening them.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Explain why oxygen diffuses into a muscle cell while carbon dioxide diffuses out of it.",
      steps: [
        {
          move: "State where each substance is more concentrated.",
          why:
            "Diffusion is driven by a concentration gradient, so the first step is always to compare the two regions rather than to describe the cell as needing the gas.",
        },
        {
          move: "Link each gradient to its direction of net movement.",
          why:
            "Oxygen is higher in the blood than in the respiring muscle, so the net movement is inward. Carbon dioxide is produced by respiration, so it is higher inside and moves outward.",
        },
        {
          move: "Explain what keeps the gradients in place.",
          why:
            "Respiration continuously uses oxygen and produces carbon dioxide, so the gradients are maintained rather than reaching equilibrium. Blood flow removes carbon dioxide and brings more oxygen.",
        },
      ],
      answer:
        "Oxygen is more concentrated in the blood than in the muscle, so it diffuses inward; carbon dioxide is produced by respiration and is more concentrated inside, so it diffuses outward. Respiration and blood flow keep both gradients steep.",
    },
    {
      id: "w2",
      prompt:
        "A plant cell is placed in pure water, and another in a concentrated sugar solution. Predict and explain what happens to each cell.",
      steps: [
        {
          move: "Compare the water concentration on each side of the membrane.",
          why:
            "Osmosis depends on the water gradient, not on the sugar concentration alone. Pure water has the highest water concentration; the sugar solution has less water per unit volume.",
        },
        {
          move: "Predict water movement from the dilute side to the concentrated side.",
          why:
            "Water enters the cell in pure water because the cell contents are more concentrated than the surroundings. Water leaves the cell in sugar solution because the surroundings are more concentrated than the cell contents.",
        },
        {
          move: "Translate the water movement into the visible state of each cell.",
          why:
            "Water entering the vacuole presses the membrane against the wall, making the cell turgid. Water leaving shrinks the vacuole and pulls the membrane away from the wall, which is plasmolysis.",
        },
      ],
      answer:
        "In pure water the cell takes in water by osmosis, becomes turgid and stays firm. In concentrated sugar solution it loses water, the vacuole shrinks and the membrane pulls away from the wall, so the cell becomes plasmolysed and the tissue wilts.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Diffusion stops once the concentrations are equal.",
      whyItFails:
        "At equilibrium the particles are still moving and crossing the boundary in both directions. What stops is the NET movement, because the two flows are equal. The system is dynamic, not frozen, which is why a cell can continue exchanging gases at a steady rate.",
      correction:
        "Describe equilibrium as equal rates in both directions, not as no movement. A graph of concentration against time flattens because the net change is zero, not because the particles have stopped.",
      contrast: {
        wrong: "the particles settle and diffusion ends",
        right: "the particles keep moving; the net flow becomes zero",
      },
    },
    {
      id: "m2",
      belief: "Osmosis is water moving from a high water concentration to a low water concentration through any membrane.",
      whyItFails:
        "The membrane must be partially permeable. If it were fully permeable, the solute would diffuse as well and the water movement would not be the only way to balance the concentrations. The membrane is what makes osmosis a distinct process.",
      correction:
        "Name both conditions: water moves down its own gradient across a partially permeable membrane. Check the membrane first, then the water concentrations on each side.",
      contrast: {
        wrong: "water always moves towards the stronger solution, whatever the barrier",
        right: "water moves down its gradient through a partially permeable membrane",
      },
    },
    {
      id: "m3",
      belief: "Active transport is just diffusion with a protein helping it along.",
      whyItFails:
        "Active transport moves a substance against its concentration gradient, from low to high, which diffusion cannot do. It requires energy from respiration and can be stopped by a respiratory inhibitor, whereas diffusion continues without energy.",
      correction:
        "Ask which way the substance is moving relative to its gradient, and whether the cell is spending energy. If it is moving from low to high and the process stops when respiration stops, it is active transport.",
      contrast: {
        wrong: "a carrier protein turns diffusion into active transport",
        right: "active transport uses energy to move a substance against its gradient",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "An alveolus has a high oxygen concentration and the blood arriving at it has a low one. Explain why oxygen continues to enter the blood rather than stopping immediately.",
      hint: "What happens to the oxygen once it enters the blood, and what does blood flow do?",
      answer:
        "Oxygen keeps diffusing in because the blood's oxygen is used by respiring cells and carried away, so the concentration in the blood stays lower than in the alveolus. The gradient is maintained, so net diffusion continues.",
      feedback: {
        correct:
          "You explained the continuing gradient rather than assuming diffusion stops as soon as the first molecules arrive.",
        incorrect:
          "Diffusion needs a difference. Think about what removes oxygen from the blood and keeps its concentration low.",
      },
    },
    {
      id: "p2",
      prompt:
        "A potato cylinder loses mass in a concentrated salt solution. Explain what happened to the cells.",
      hint: "Compare the water concentration in the salt solution with the water concentration inside the potato cells.",
      answer:
        "Water moved out of the potato cells by osmosis, from the more dilute cell contents to the more concentrated salt solution. The cells lost water, their vacuoles shrank, and the potato's mass decreased.",
      feedback: {
        correct:
          "You moved water down its gradient and linked the loss to the vacuole and the mass change.",
        incorrect:
          "Salt did not move into the potato to make it heavier. Water left the cells, so the mass fell.",
      },
    },
    {
      id: "p3",
      prompt:
        "A root hair cell absorbs mineral ions from soil in which the ion concentration is lower than inside the cell. Explain how this is possible.",
      hint: "Which direction is the gradient, and what does the cell have that diffusion does not use?",
      answer:
        "The ions are moving against their gradient, from low concentration in the soil to high concentration in the cell. This requires active transport, using carrier proteins and energy from respiration.",
      feedback: {
        correct:
          "You identified the direction against the gradient and the energy requirement.",
        incorrect:
          "If the soil is more dilute, diffusion would carry ions out, not in. Name the process that uses energy to reverse the direction.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain how a root hair cell obtains water and mineral ions from the soil. Refer to osmosis, active transport and the shape of the cell.",
      modelAnswer:
        "The root hair cell's long extension gives it a large surface area for absorption. Soil water is usually more dilute than the cell contents, so water enters by osmosis through the partially permeable membrane, down its water gradient. Mineral ions may be more concentrated inside the cell than in the soil, so they cannot enter by diffusion; they are taken up by active transport, using carrier proteins and energy from respiration. The large surface area increases the rate of both processes.",
      marking: [
        "Links the long extension to a large surface area and a faster rate of absorption.",
        "Explains water entry as osmosis down a water gradient through a partially permeable membrane.",
        "Explains mineral uptake as active transport against the gradient, requiring energy.",
        "Names respiration or carrier proteins as part of the active transport mechanism.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "In which direction does diffusion produce a net movement of particles?",
      modelAnswer: "From a higher concentration to a lower concentration.",
      marking: [
        "States high to low concentration, or down the concentration gradient.",
        "Does not say that particles move only in one direction.",
      ],
      check: {
        accepted: [
          "high to low",
          "from high to low concentration",
          "down the concentration gradient",
          "higher to lower concentration",
          "from a higher concentration to a lower concentration",
        ],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Name the process by which water moves across a partially permeable membrane.",
      modelAnswer: "Osmosis.",
      marking: [
        "Names osmosis rather than diffusion alone.",
        "Recognises that the membrane must be partially permeable.",
      ],
      check: { accepted: ["osmosis"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A dialysis machine removes urea from a patient's blood. Blood flows on one side of a partially permeable membrane and dialysis fluid on the other. Urea leaves the blood, but red blood cells and large proteins stay in it. Explain why, using diffusion and the properties of the membrane.",
      whyItTransfers:
        "The lesson explains transport across a cell membrane. Here the same principles are applied to an artificial membrane in a machine, with a mixture of solutes and cells of different sizes. The learner must use the gradient and the membrane's selectivity together, rather than recall a cell example.",
      answer:
        "Urea is more concentrated in the blood than in the dialysis fluid, so it diffuses down its gradient across the membrane. Red blood cells and large proteins cannot pass through the pores because they are too large, so the partially permeable membrane retains them. The fluid is continually replaced to keep the urea gradient steep.",
      marking: [
        "Explains urea movement as diffusion down its concentration gradient.",
        "Explains that the membrane is partially permeable and excludes large particles.",
        "Links the continuous replacement of fluid to maintaining the gradient.",
        "Distinguishes diffusion of a small solute from filtration of cells by size.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Define diffusion in one sentence.",
      answer:
        "The net movement of particles from a higher to a lower concentration, caused by random motion.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A cell is placed in a solution more concentrated than its contents. Which way does water move, and why?",
      answer:
        "Water moves out of the cell by osmosis, from the more dilute cell contents to the more concentrated solution.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Give one difference between diffusion and active transport, and one example of each.",
      answer:
        "Diffusion moves substances down their gradient without energy, for example oxygen into a cell; active transport moves them against the gradient using energy, for example mineral ions into a root hair cell.",
      when: "month-later",
    },
  ],

  summary: [
    "Diffusion is a net movement down a concentration gradient, produced by random particle motion; at equilibrium the flows are equal, not zero.",
    "Rate depends on the steepness of the gradient, the distance, the temperature and the surface area available.",
    "Osmosis is water diffusion through a partially permeable membrane, from the more dilute to the more concentrated solution.",
    "Active transport moves substances against their gradient using carrier proteins and energy from respiration.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every gradient and membrane diagram is described as a direction and a comparison of concentrations in words, so the teaching does not depend on seeing arrows.",
    },
    {
      need: "colour-vision",
      alternative:
        "Solutions and particles are labelled by name and pattern as well as colour, and the direction of movement is stated in the caption.",
    },
    {
      need: "dyslexia",
      alternative:
        "The three processes are introduced one at a time with a one-line definition and a contrast, so diffusion, osmosis and active transport are not learned as three similar paragraphs.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing or selecting, not dragging particles across a membrane; all diagrams are readable without interaction.",
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
        "Scope cited against the published GCSE biology subject content for transport in cells.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-08",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
