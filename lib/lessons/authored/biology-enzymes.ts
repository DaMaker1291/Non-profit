import type { AuthoredLesson } from "../../lesson-contract";

// ENZYMES IS THE FIRST BIOLOGY IDEA WHERE A LEARNER MUST REASON ABOUT SHAPE.
//
// The genome paragraph can say "specific, temperature- and pH-sensitive" and a
// learner can repeat all three words without being able to explain a single
// graph. This lesson makes the shape the mechanism: the active site is
// complementary to one substrate, temperature first increases collisions and
// then destroys the bonds holding that shape, and substrate concentration stops
// helping once every active site is occupied.
export const BIOLOGY_ENZYMES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "enzymes",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, enzymes: catalysts, active sites, temperature, pH and rate",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain why an enzyme only acts on particular substrates, using the shape of its active site.",
      evidence:
        "The learner states that the substrate must be complementary to the active site, so a differently shaped molecule cannot bind and cannot be converted.",
    },
    {
      statement:
        "Explain the shape of a rate-temperature graph, including why the rate falls after the optimum.",
      evidence:
        "The learner describes rising collisions up to the optimum, then denaturation above it, and identifies the point where the active site loses its shape.",
    },
    {
      statement:
        "Explain why increasing substrate concentration stops increasing the rate.",
      evidence:
        "The learner states that every active site becomes occupied, so the enzyme concentration is then the limiting factor.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells", "proportion"],
    check: [
      {
        id: "d1",
        question: "What is a protein, and which part of a cell makes it?",
        answer:
          "A protein is a chain of amino acids folded into a particular shape; ribosomes assemble the chain, and the folded shape is what lets the protein do its job.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question:
          "A recipe for four people needs 200 g of rice. What happens to the amount for eight people, and what stays the same?",
        answer:
          "The amount doubles to 400 g, because the number of people doubles; the amount per person stays the same.",
        targets: ["proportion"],
      },
    ],
  },

  introduction: {
    hook:
      "Pour hydrogen peroxide on a cut and it fizzes; pour the same liquid on a table and almost nothing happens. The difference is not the liquid. Blood and potato cells contain catalase, an enzyme that breaks hydrogen peroxide into water and oxygen fast enough for the bubbles to be visible. The enzyme was already there before the liquid arrived.",
    why:
      "An enzyme is a protein whose folded shape includes a small pocket called the active site. The substrate fits that pocket, and holding it there makes the reaction happen far faster than it would in solution alone. The enzyme is not used up, so one molecule can catalyse many reactions. Almost every question about enzymes is really a question about shape: what fits, what changes the shape, and what happens when the shape is lost.",
  },

  explanation: [
    {
      heading: "A catalyst lowers the hill without changing the destination",
      paragraphs: [
        "Many reactions that a cell needs would happen eventually without help, but far too slowly to keep the cell alive. An enzyme speeds such a reaction by providing a route with a lower activation energy, the energy barrier that molecules must overcome before they can react. It does not change the products, and it does not make an impossible reaction happen; it makes a possible one happen quickly.",
        "The enzyme itself is unchanged at the end, which is why a small amount can process a large amount of substrate. During the reaction the enzyme is temporarily bound to the substrate, but once the products leave, the active site is free again. This is why the word catalyst is not a synonym for fuel: a fuel is consumed, while a catalyst is reused.",
      ],
    },
    {
      heading: "The active site is a shape, not a slot",
      paragraphs: [
        "The active site is a region on the enzyme's surface with a shape and a pattern of charges that match one substrate, or a small group of very similar substrates. The substrate binds there to form an enzyme-substrate complex, and the reaction takes place while it is held. A molecule with a different shape cannot make the same contacts, so it does not bind and is not converted. That is what enzyme specificity means in practice.",
        "The fit is often described as lock and key, but the lock is flexible: when the substrate binds, the active site adjusts slightly around it, which is called induced fit. The important consequence is the same either way. The shape is held by bonds between parts of the protein chain, so anything that breaks those bonds changes the active site and the enzyme stops working on its usual substrate.",
      ],
    },
    {
      heading: "Temperature raises collisions, then destroys the shape",
      paragraphs: [
        "At low temperatures, substrate and enzyme molecules move slowly, so they collide rarely and the rate is low. Warming the mixture gives the molecules more kinetic energy, so collisions become more frequent and more energetic, and the rate rises. For a human enzyme this continues up to about 37 °C, the optimum temperature, where the rate is highest.",
        "Above the optimum, the extra energy begins to break the weak bonds that hold the protein's folded shape. The active site warps, the substrate no longer fits, and the rate falls sharply. This is denaturation. It is not the enzyme being digested or used up; it is a change of shape, and for most enzymes it is irreversible. Cooling a denatured enzyme does not restore its activity, which is why a cooked egg cannot be uncooked.",
      ],
    },
    {
      heading: "pH and concentration set two different limits",
      paragraphs: [
        "pH measures the concentration of hydrogen ions, and those ions affect the charges on the amino acids in and around the active site. Each enzyme has an optimum pH at which its shape and charge pattern work best: pepsin in the stomach works best near pH 2, while amylase in the mouth works best closer to neutral. Moving far from the optimum changes the interactions holding the shape, so the active site distorts and the rate falls; an extreme pH can denature the enzyme permanently.",
        "Increasing substrate concentration gives more substrate molecules to collide with active sites, so the rate rises at first. Eventually every active site is occupied for as much time as it can be, and adding more substrate cannot help. The rate plateaus because the enzyme concentration has become the limiting factor. Adding more enzyme at that point raises the plateau, which is the evidence that saturation, not substrate shortage, was the limit.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "The active site is complementary in shape and charge to one substrate, so that substrate binds while a differently shaped molecule cannot. The fit holds the substrate in the orientation the reaction needs, which is why the enzyme is specific rather than a general-purpose grinder.",
      notation: "enzyme + substrate → enzyme-substrate complex → enzyme + products",
      caption:
        "The enzyme appears on both sides of the arrow because it is reused. Only the substrate is converted.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Substrate molecules collide with the active site because they are moving randomly in solution; binding lowers the activation energy for that reaction, and the products leave because they no longer fit the site as the substrate did. The cycle repeats while substrate remains.",
      notation: "collision → binding → reaction → release → free active site",
      caption:
        "Every step depends on shape. A change to the active site stops the cycle at the binding step, before any product is made.",
    },
    {
      id: "r3",
      kind: "biology.experiment",
      body:
        "A rate-temperature graph rises gradually, reaches a peak at the optimum, and then falls steeply. The rise is caused by more frequent collisions; the fall is caused by denaturation. The two sides of the peak therefore have different explanations, even though both show a change in rate.",
      notation: "rate: low at 10 °C · rising to a peak near 37 °C · falling sharply by 60 °C",
      caption:
        "A graph with a peak is evidence for an optimum. A graph that merely rises would not distinguish enzymes from an ordinary chemical reaction.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Explain why the rate of an enzyme-controlled reaction falls when the temperature is raised well above the optimum.",
      steps: [
        {
          move: "Start with what rising temperature does before the optimum.",
          why:
            "Warmer molecules move faster, so enzyme and substrate collide more often and the rate rises. This part of the explanation must come first, or the fall looks like a contradiction.",
        },
        {
          move: "Name what happens to the bonds holding the protein's shape.",
          why:
            "The folded shape is held by weak bonds. Above the optimum, the extra kinetic energy is enough to break them, so the precise arrangement of the active site is lost.",
        },
        {
          move: "Link the lost shape to the substrate and then to the rate.",
          why:
            "A substrate that no longer fits the active site cannot bind, so fewer enzyme-substrate complexes form and the rate falls. The enzyme is denatured, not used up.",
        },
      ],
      answer:
        "Above the optimum, the extra kinetic energy breaks the weak bonds holding the enzyme's folded shape. The active site warps, the substrate no longer fits, fewer enzyme-substrate complexes form, and the rate falls sharply.",
    },
    {
      id: "w2",
      prompt:
        "A student measures the rate of an enzyme reaction at 20 °C and at 30 °C. The rates are 12 and 24 arbitrary units per minute. Calculate the factor by which the rate increased, and explain what this does and does not show.",
      steps: [
        {
          move: "Divide the higher rate by the lower rate: 24 ÷ 12.",
          why:
            "A factor compares two rates by division. It answers how many times larger the second rate is, which is more informative than the difference alone.",
        },
        {
          move: "State the result: the rate doubled.",
          why:
            "24 ÷ 12 = 2, so the rate at 30 °C is twice the rate at 20 °C. The units cancel because both rates are in the same units.",
        },
        {
          move: "Separate the evidence from the explanation.",
          why:
            "The measurement shows a doubling between these two temperatures; it does not by itself prove that collisions caused it, because the experiment has only two points and no measurement above the optimum.",
        },
      ],
      answer:
        "The rate increased by a factor of 2, from 12 to 24 arbitrary units per minute. That is consistent with more frequent collisions as temperature rises, but two points cannot locate the optimum or show that denaturation follows.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Enzymes are alive, or enzymes are a kind of cell.",
      whyItFails:
        "An enzyme is a protein molecule made by a cell, not a cell itself. It has no metabolism and cannot reproduce, so it is not alive. Cells contain many enzymes, which is why the two ideas are easy to confuse.",
      correction:
        "Describe an enzyme as a protein catalyst with a folded shape. It is made by a living cell and works inside or outside it, but it is a molecule, not an organism.",
      contrast: {
        wrong: "the enzyme is a tiny living thing doing the reaction",
        right: "the enzyme is a protein whose shape speeds up a reaction",
      },
    },
    {
      id: "m2",
      belief: "Heating an enzyme always makes it work faster.",
      whyItFails:
        "Heat raises the collision rate only until the optimum. Above that temperature, the weak bonds holding the protein's shape break, the active site distorts, and the substrate cannot bind. The fall is caused by denaturation, not by the enzyme running out of energy.",
      correction:
        "Treat temperature as having two effects: more kinetic energy up to the optimum, then loss of shape above it. Read the peak of the graph as the point where the second effect overtakes the first.",
      contrast: {
        wrong: "hotter means faster, so the rate keeps rising",
        right: "hotter means faster only to the optimum, then the active site denatures",
      },
    },
    {
      id: "m3",
      belief: "The enzyme is used up during the reaction, so more substrate always needs more enzyme.",
      whyItFails:
        "The enzyme is released unchanged after each reaction and can be used again. That is why a small amount can convert a large amount of substrate. The rate eventually plateaus because all active sites are busy, not because the enzyme has been consumed.",
      correction:
        "Show the enzyme on both sides of the reaction arrow. If it were used up, it would appear only on the left, like a reactant.",
      contrast: {
        wrong: "each substrate molecule destroys one enzyme molecule",
        right: "the enzyme is reused; the plateau is saturation, not exhaustion",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Pepsin works in the stomach at about pH 2. Predict what happens to its activity if it is moved to pH 7, and explain your prediction.",
      hint:
        "pH changes the charges on the amino acids around the active site. What does that do to the shape and to the substrate's fit?",
      answer:
        "Its activity falls sharply, because pH 7 is far from its optimum. The changed charges break the interactions holding the active site's shape, so the substrate no longer fits and the rate falls; at an extreme pH the enzyme may be denatured.",
      feedback: {
        correct:
          "You linked the pH change to the active site's shape and then to the substrate's ability to bind.",
        incorrect:
          "Pepsin does not adapt to a new pH. Name what the pH change does to the bonds and charges holding the active site.",
      },
    },
    {
      id: "p2",
      prompt:
        "A reaction mixture has plenty of substrate, and the rate has stopped increasing. Explain what is limiting the rate and what would raise it.",
      hint: "What is fully occupied when the graph flattens?",
      answer:
        "The enzyme concentration is limiting, because every active site is occupied. Adding more enzyme would provide more active sites and raise the plateau; adding more substrate would not help.",
      feedback: {
        correct:
          "You identified saturation of the active sites rather than a shortage of substrate.",
        incorrect:
          "The substrate is not the limit when the graph has flattened. Think about what there is a fixed number of.",
      },
    },
    {
      id: "p3",
      prompt:
        "A biological washing powder contains a protease. Explain why washing at 60 °C may clean less well than washing at 40 °C, even though hotter water usually dissolves stains faster.",
      hint: "The protease is an enzyme with an optimum temperature. What happens above it?",
      answer:
        "Above the protease's optimum, its active sites denature, so it can no longer break down protein stains. The hotter water may help physically, but the enzyme contribution falls, and at 60 °C the enzyme may be permanently inactive.",
      feedback: {
        correct:
          "You separated the physical effect of hot water from the enzyme's own temperature optimum.",
        incorrect:
          "Hotter water is not the only variable here. The powder contains a protein, and proteins lose their shape above their optimum.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why the rate of an enzyme-controlled reaction increases up to an optimum temperature and then falls sharply. Refer to collisions, active sites and denaturation in your answer.",
      modelAnswer:
        "As temperature rises, enzyme and substrate molecules gain kinetic energy and collide more often, so more enzyme-substrate complexes form and the rate increases. At the optimum, the rate is highest. Above it, the weak bonds holding the enzyme's folded shape break, so the active site loses its complementary shape. The substrate can no longer bind, fewer complexes form, and the rate falls. The enzyme is denatured, which is usually irreversible.",
      marking: [
        "Explains the rise in terms of more frequent collisions giving more enzyme-substrate complexes.",
        "Identifies the optimum as the temperature of maximum rate.",
        "Explains the fall in terms of bonds breaking and the active site losing its shape.",
        "Links the changed active site to the substrate no longer binding, and names denaturation.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What name is given to the temperature at which an enzyme works fastest?",
      modelAnswer: "The optimum temperature.",
      marking: [
        "Names the optimum temperature.",
        "Does not confuse it with the temperature at which the enzyme denatures.",
      ],
      check: {
        accepted: ["optimum", "optimum temperature", "the optimum temperature"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "The rate at 20 °C is 15 units per minute and the rate at 30 °C is 45 units per minute. By what factor has the rate increased?",
      modelAnswer: "3",
      marking: [
        "Divides the higher rate by the lower rate rather than subtracting.",
        "Gives the factor as 3, without units.",
      ],
      check: { accepted: ["3", "three", "3 times", "a factor of 3"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A patient has a fever of 41 °C. Their cells are producing energy faster than at 37 °C, yet the fever is dangerous. Using your knowledge of enzymes, explain why a high fever can be harmful even though a moderate rise in temperature speeds up reactions.",
      whyItTransfers:
        "The lesson explains a single enzyme graph. Here the same reasoning is applied to a whole body, where many different enzymes have different optima and some begin to denature before others. The learner must transfer the shape mechanism rather than recall the graph.",
      answer:
        "A moderate rise in temperature increases collisions and speeds up enzyme-controlled reactions, which is why the patient's cells use energy faster. Above the optimum of each enzyme, the weak bonds holding its active site break and the enzyme denatures. Different enzymes denature at different temperatures, so at 41 °C some essential reactions are already failing, and the damage can become irreversible.",
      marking: [
        "Explains the increased rate at a moderate temperature in terms of collisions.",
        "Explains denaturation as a loss of active-site shape above the optimum.",
        "Applies the idea to several enzymes with different optima in the body.",
        "Concludes that the harm comes from essential reactions failing, not from the faster reactions themselves.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What is an active site, and why is its shape important?",
      answer:
        "It is the region of an enzyme where the substrate binds; its shape and charge pattern must be complementary to the substrate.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why the rate of an enzyme reaction plateaus as substrate concentration increases.",
      answer:
        "All active sites become occupied, so the enzyme concentration limits the rate; adding more substrate cannot increase it.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A cooked egg cannot be returned to its raw state by cooling. Explain this using denaturation.",
      answer:
        "Heating broke the weak bonds holding the egg proteins' folded shapes, and the proteins aggregated irreversibly; cooling does not rebuild the original active sites or structures.",
      when: "month-later",
    },
  ],

  summary: [
    "An enzyme is a protein catalyst with an active site complementary to its substrate; it speeds a reaction without being used up.",
    "Temperature raises the collision rate up to an optimum, then denatures the enzyme by destroying the active site's shape.",
    "pH changes the charges around the active site, so each enzyme has a narrow pH range in which it works.",
    "The rate plateaus at high substrate concentration because every active site is occupied, making enzyme concentration the limit.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The rate-temperature graph is described in words as a rise, a peak at the optimum and a steep fall, so the shape and its explanation are available without seeing the curve.",
    },
    {
      need: "colour-vision",
      alternative:
        "Enzyme, substrate and product are distinguished by labels and line style as well as colour in every diagram, so no step depends on colour alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "The key terms active site, substrate, enzyme-substrate complex and denaturation are introduced one at a time with a one-line meaning before they are used in a longer explanation.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing or selecting, not dragging molecules; every diagram is readable without interaction.",
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
        "Scope cited against the published GCSE biology subject content for enzymes and rates of reaction.",
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
