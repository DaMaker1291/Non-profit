import type { AssessmentBlueprint } from "../assessment-intelligence";

// ─────────────────────────────────────────────────────────────────────────────
// ONE TOPIC, ONE EVIDENCE SET, NO COPIED QUESTIONS.
//
// The source was a teacher-provided Year 9 Biology "Diet & Digestion" set:
// a question pack, a test, and two image-based mark schemes. The set was read
// only for design signals: command words, the mark range of each part, where a
// mark scheme rewards an independent point, and which wrong ideas recur.
//
// The items below are NEW. None of the source's prompts, options, tables or
// mark-scheme sentences is stored in this file. A teacher still has to review
// the biology and the marking: `reviewStatus` is deliberately `unreviewed`.
// ─────────────────────────────────────────────────────────────────────────────

export const DIET_DIGESTION_BLUEPRINT: AssessmentBlueprint = {
  contract: "openmind.assessment-blueprint/1.0",
  id: "biology.diet-digestion.year9",
  version: "1.0.0",
  title: "Diet and digestion: assessment blueprint",
  subject: "biology",
  level: "Year 9 / lower secondary",
  curriculumContext:
    "A Year 9 biology unit on diet, digestion, absorption and the fate of undigested food. The blueprint is tied to that unit only; it is not a claim about GCSE, A-level or another country's specification.",

  sources: [
    {
      id: "dd-question-pack",
      label: "Diet & Digestion question pack",
      kind: "teacher-provided-assessment",
      curriculumContext: "Year 9 biology, diet and digestion",
      sha256: "9246e6072354939b5eecb2b1be130604a5f96db2a28557620a9cb79185959a47",
      availability: "teacher-provided",
      rights: "unknown",
      licensing: "unknown",
      allowedUse: "pattern-extraction-only",
      reproduction: "none",
      containsSourceText: false,
      studentDataObserved: false,
      note:
        "Read for question archetypes and mark allocations only. No prompt, table, diagram, option or mark-scheme sentence is retained.",
    },
    {
      id: "dd-test",
      label: "Diet & Digestion test",
      kind: "teacher-provided-assessment",
      curriculumContext: "Year 9 biology, diet and digestion",
      sha256: "636ac2e8288e078cfc00a34e59c36636c32b062826519e6f571d7581e63a4f87",
      availability: "teacher-provided",
      rights: "unknown",
      licensing: "unknown",
      allowedUse: "pattern-extraction-only",
      reproduction: "none",
      containsSourceText: false,
      studentDataObserved: false,
      note:
        "Read for the balance of recall, data interpretation and extended writing. The test's own numbers and wording are not reused.",
    },
    {
      id: "dd-mark-scheme-a",
      label: "Diet & Digestion mark scheme A",
      kind: "teacher-provided-assessment",
      curriculumContext: "Year 9 biology, diet and digestion",
      sha256: "f6a01260732c5ffcaf5141cbc2932d5f452b8990defb54745a51f84b38147013",
      availability: "teacher-provided",
      rights: "unknown",
      licensing: "unknown",
      allowedUse: "pattern-extraction-only",
      reproduction: "none",
      containsSourceText: false,
      studentDataObserved: false,
      note:
        "Image-based marking pages were OCR'd for the shape of independent credit points. OCR is not treated as an exact transcription; the blueprint does not quote it.",
    },
    {
      id: "dd-mark-scheme-b",
      label: "Diet & Digestion mark scheme B",
      kind: "teacher-provided-assessment",
      curriculumContext: "Year 9 biology, diet and digestion",
      sha256: "67e2216407282f6d21b56e04060f6683cdcb3177d61a0e129bd42504014bde30",
      availability: "teacher-provided",
      rights: "unknown",
      licensing: "unknown",
      allowedUse: "pattern-extraction-only",
      reproduction: "none",
      containsSourceText: false,
      studentDataObserved: false,
      note:
        "Used to compare how the same topic rewards a labelled structure, a linked function and a separate conclusion. No marking wording is copied.",
    },
  ],

  archetypes: [
    {
      id: "recall-knowledge",
      command: "identify",
      demand: "recall",
      markRange: [1, 2],
      evidence:
        "The learner names a substance, product or process accurately, without needing to explain it.",
      progression:
        "Establishes the vocabulary that the explanation items depend on; a wrong name here is a knowledge gap, not a reasoning gap.",
    },
    {
      id: "explain-structure-function",
      command: "explain",
      demand: "understand",
      markRange: [3, 5],
      evidence:
        "The learner links a named structure to a function and then to the consequence for the whole organism.",
      progression:
        "Moves from a label to a mechanism. Each independent link is a separate marking point, so a list of structures cannot earn an explanation mark.",
    },
    {
      id: "compare-processes",
      command: "compare",
      demand: "analyse",
      markRange: [3, 4],
      evidence:
        "The learner states a similarity and a difference between two processes and supports each with an example or a consequence.",
      progression:
        "Requires both sides of the comparison; a description of one process alone is capped below full marks.",
    },
    {
      id: "practical-method",
      command: "suggest",
      demand: "apply",
      markRange: [2, 3],
      evidence:
        "The learner identifies a source of error or an improvement and explains how it changes the measurement.",
      progression:
        "Transfers a method to an unfamiliar result and distinguishes a controlled variable from an uncontrolled one.",
    },
    {
      id: "calculate-from-data",
      command: "calculate",
      demand: "apply",
      markRange: [2, 3],
      evidence:
        "The learner selects the correct relationship, substitutes values with units and reports a sensible result.",
      progression:
        "Checks that a numerical answer is not accepted without the method when the method is what the item is testing.",
    },
    {
      id: "extended-application",
      command: "explain",
      demand: "evaluate",
      markRange: [4, 6],
      evidence:
        "The learner uses more than one idea from the unit to explain an unfamiliar clinical or practical consequence, and distinguishes evidence from assumption.",
      progression:
        "The transfer item: no source question is reused, and the learner must combine absorption, surface area and a named deficiency.",
    },
  ],

  misconceptions: [
    {
      id: "absorption-is-eating",
      label: "Absorption is the same as eating",
      whyWrong:
        "Eating puts food into the alimentary canal; absorption moves digested molecules across the gut wall into the blood. A learner can eat enough and still absorb too little if the absorbing surface is damaged.",
      diagnosticSignal:
        "The answer says 'the person absorbs food when they eat' without naming diffusion, the gut wall or the blood.",
      feedback:
        "Separate the journey: ingestion, digestion, absorption, assimilation and egestion. Name the membrane and the destination when you use the word absorption.",
    },
    {
      id: "villi-are-muscles",
      label: "Villi push food through the gut",
      whyWrong:
        "Villi are finger-like folds of the gut lining. They increase surface area and contain blood capillaries and a lacteal; they do not provide the muscular contraction that moves gut contents. Peristalsis does that.",
      diagnosticSignal:
        "The answer credits villi with 'moving' or 'pushing' food, or describes them as a muscle layer.",
      feedback:
        "A villus is a surface-area adaptation. Its epithelium is thin, and its capillary network carries absorbed molecules away; peristalsis is a separate muscular process.",
    },
    {
      id: "bile-digests-fat",
      label: "Bile is an enzyme that digests fat",
      whyWrong:
        "Bile is not an enzyme. It emulsifies fat into smaller droplets, increasing the surface area on which lipase can act. The chemical digestion is carried out by lipase.",
      diagnosticSignal:
        "The answer says bile 'breaks down' or 'digests' fat without naming lipase or small droplets.",
      feedback:
        "Bile prepares the substrate; lipase performs the hydrolysis. Write both roles when a question asks how fat is digested.",
    },
    {
      id: "energy-label-is-body-energy",
      label: "The packet's energy value is the energy the body gets from the food",
      whyWrong:
        "A food label's energy value is measured by complete combustion in a calorimeter. A school burning experiment loses heat to the surroundings, may burn the food incompletely and heats the apparatus as well as the water. The two values answer related but not identical questions.",
      diagnosticSignal:
        "The answer says the label is wrong or the food 'has less energy' without naming a measurement loss.",
      feedback:
        "Compare the methods, not just the numbers. Name where energy goes in the school apparatus and how the improvement reduces that loss.",
    },
    {
      id: "surface-area-alone",
      label: "More surface area is always enough",
      whyWrong:
        "Surface area increases the opportunity for exchange, but absorption also requires a thin barrier, a concentration gradient and a transport route. A larger surface with no blood supply or a thick barrier is not automatically more effective.",
      diagnosticSignal:
        "The answer stops at 'more surface area' and does not name the membrane, gradient or capillary.",
      feedback:
        "Treat surface area as one condition for exchange, not the whole explanation. Link it to diffusion distance and the maintenance of a gradient.",
    },
    {
      id: "egestion-is-excretion",
      label: "Egestion and excretion are the same process",
      whyWrong:
        "Egestion removes undigested food from the alimentary canal. Excretion removes metabolic waste produced by cells, such as carbon dioxide and urea. The substances and their origins are different.",
      diagnosticSignal:
        "The answer says faeces are an excretory product or that egestion removes 'waste from cells'.",
      feedback:
        "Ask where the substance was made. Undigested food never entered the cells; urea and carbon dioxide did.",
    },
    {
      id: "fat-products-are-sugars",
      label: "Fat is digested into glucose",
      whyWrong:
        "Lipase hydrolyses a fat into fatty acids and glycerol. Glucose is a product of carbohydrate digestion, not fat digestion, and the body cannot obtain it by breaking a fat with lipase.",
      diagnosticSignal:
        "The answer names glucose, or another sugar, as a product of fat digestion.",
      feedback:
        "Match the enzyme to its substrate and products: amylase and starch give sugars, protease and protein give amino acids, lipase and fat give fatty acids and glycerol.",
    },
  ],

  progression: ["recall", "understand", "apply", "analyse", "evaluate"],

  items: [
    {
      id: "dd-01",
      archetypeId: "recall-knowledge",
      conceptId: "digestion",
      responseKind: "short-answer",
      prompt: "Name the two products formed when a fat is completely digested by lipase.",
      marks: 2,
      modelAnswer: "Fatty acids and glycerol.",
      criteria: [
        {
          id: "dd-01-c1",
          kind: "evidence",
          marks: 1,
          credit: "Names fatty acids (or a correct example of a fatty acid) as one product.",
          acceptable: ["fatty acid", "fatty acids"],
          nonCredit: "Names 'fat' again; that is the substrate, not a product.",
        },
        {
          id: "dd-01-c2",
          kind: "evidence",
          marks: 1,
          credit: "Names glycerol as the other product.",
          acceptable: ["glycerol", "glycerine"],
          misconceptionId: "fat-products-are-sugars",
          signals: ["glucose", "sugar"],
          nonCredit: "Names glucose; that is a carbohydrate product, not a fat product.",
        },
      ],
      partialCreditRule: "Each named product earns one mark; a correct pair written in either order earns 2.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "dd-02",
      archetypeId: "explain-structure-function",
      conceptId: "digestion",
      responseKind: "extended-response",
      prompt:
        "The lining of the small intestine has villi. Explain two ways a villus is adapted to absorb glucose quickly into the blood.",
      marks: 4,
      modelAnswer:
        "A villus has a large surface area, increased further by microvilli on its epithelial cells, so more glucose molecules can diffuse across at once. Its epithelium is one cell thick, which gives a short diffusion distance. A dense capillary network carries glucose away, maintaining a concentration gradient from the gut lumen into the blood. Each of these is a separate reason why the rate of absorption is high.",
      criteria: [
        {
          id: "dd-02-c1",
          kind: "evidence",
          marks: 1,
          credit: "Names villi or microvilli and links them to an increased surface area.",
          acceptable: ["villi increase surface area", "microvilli increase surface area", "many villi give a large surface area"],
          misconceptionId: "villi-are-muscles",
          signals: ["push food", "move food", "muscle"],
          nonCredit: "Says only 'there are villi' without saying what the villi do.",
        },
        {
          id: "dd-02-c2",
          kind: "evidence",
          marks: 1,
          credit: "Explains that the epithelial wall is thin, giving a short diffusion distance.",
          acceptable: ["thin wall short diffusion distance", "one cell thick", "thin epithelium"],
          nonCredit: "Says 'thin' without linking it to diffusion distance or rate.",
        },
        {
          id: "dd-02-c3",
          kind: "evidence",
          marks: 1,
          credit: "Explains that a good blood supply or capillary network removes glucose and maintains a concentration gradient.",
          acceptable: ["blood supply maintains a concentration gradient", "capillaries carry glucose away", "good blood supply keeps a steep gradient"],
          misconceptionId: "surface-area-alone",
          signals: ["more surface area is enough", "only surface area", "just surface area"],
          nonCredit: "Says 'it has blood' without connecting it to the gradient or removal of glucose.",
        },
        {
          id: "dd-02-c4",
          kind: "evidence",
          marks: 1,
          credit: "Uses at least two of the adaptations to explain why the RATE of absorption is increased, rather than merely listing them.",
          nonCredit: "Lists three structures with no consequence for the rate.",
        },
      ],
      partialCreditRule:
        "Award each independent adaptation that is linked to absorption. A list of structures earns at most 1 mark; the fourth mark requires a consequence for rate.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "dd-03",
      archetypeId: "compare-processes",
      conceptId: "digestion",
      responseKind: "extended-response",
      prompt:
        "Compare mechanical digestion with chemical digestion. Give one example of each and explain why both are useful.",
      marks: 4,
      modelAnswer:
        "Mechanical digestion breaks food into smaller pieces without making new molecules; chewing and churning are examples. Chemical digestion uses enzymes to hydrolyse large molecules into smaller soluble ones; amylase breaking down starch is an example. Both are useful because smaller pieces give enzymes a larger surface area, while chemical digestion produces molecules small enough to be absorbed. Neither process alone prepares food for absorption.",
      criteria: [
        {
          id: "dd-03-c1",
          kind: "evidence",
          marks: 1,
          credit: "States that mechanical digestion is physical breakdown without a new molecule being formed.",
          acceptable: ["physical breakdown", "breaks food into smaller pieces", "does not make new molecules"],
        },
        {
          id: "dd-03-c2",
          kind: "evidence",
          marks: 1,
          credit: "Gives a correct example of mechanical digestion, such as chewing or churning.",
          acceptable: ["chewing", "teeth", "churning", "stomach contraction"],
        },
        {
          id: "dd-03-c3",
          kind: "evidence",
          marks: 1,
          credit: "States that chemical digestion uses enzymes to break large molecules into smaller soluble products, with a correct example.",
          acceptable: ["amylase breaks down starch", "protease breaks down protein", "lipase breaks down fat", "enzymes hydrolyse"],
          misconceptionId: "bile-digests-fat",
          signals: ["bile digests", "bile breaks down fat", "bile is an enzyme"],
          nonCredit: "Names bile as the enzyme; bile emulsifies but does not digest.",
        },
        {
          id: "dd-03-c4",
          kind: "evidence",
          marks: 1,
          credit: "Explains the link: smaller pieces increase the surface area for enzymes, and chemical digestion produces absorbable molecules.",
          nonCredit: "Says only 'both help digestion' without a mechanism.",
        },
      ],
      partialCreditRule:
        "Award each correct comparison or example. A one-sided description of mechanical digestion earns at most 2 marks, even if detailed.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "dd-04",
      archetypeId: "practical-method",
      conceptId: "digestion",
      responseKind: "extended-response",
      prompt:
        "A student burns a food sample under a tube of water and calculates the energy released. The value is much lower than the value printed on the food packet. Explain one reason for the difference and suggest one improvement to the method.",
      marks: 3,
      modelAnswer:
        "Some of the heat from the burning food is lost to the surroundings instead of heating the water, so the measured temperature rise is too small. The food may also burn incompletely, releasing less energy than complete combustion would. The apparatus could be insulated or shielded from draughts, and the food could be held closer to the tube so that more of the heat reaches the water.",
      criteria: [
        {
          id: "dd-04-c1",
          kind: "evidence",
          marks: 1,
          credit: "Identifies heat loss to the surroundings as a reason the measured value is too low.",
          acceptable: ["heat lost to the surroundings", "heat escapes", "not all heat reaches the water"],
          misconceptionId: "energy-label-is-body-energy",
          signals: ["food has less energy", "the packet is wrong", "the label is wrong"],
          nonCredit: "Says the food 'has less energy' than the packet claims, without a measurement reason.",
        },
        {
          id: "dd-04-c2",
          kind: "evidence",
          marks: 1,
          credit: "Identifies incomplete combustion or an unmeasured variable as another reason.",
          acceptable: ["incomplete combustion", "some food does not burn", "water evaporates", "heat absorbed by the tube"],
        },
        {
          id: "dd-04-c3",
          kind: "evidence",
          marks: 1,
          credit: "Suggests a specific improvement that reduces the identified loss, such as insulating the tube or shielding it from draughts.",
          acceptable: ["insulate the tube", "use a draught shield", "stir the water", "hold the food closer"],
          nonCredit: "Says only 'be more careful' or 'do it better'.",
        },
      ],
      partialCreditRule:
        "The reason and the improvement are marked independently. A correct improvement earns its mark even if the reason is weak, but the improvement must address a named loss.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "dd-05",
      archetypeId: "calculate-from-data",
      conceptId: "digestion",
      responseKind: "numeric",
      prompt:
        "A 2.0 g food sample raises the temperature of 20 g of water by 15 °C. Use the specific heat capacity of water, 4.2 J/g °C, to calculate the energy released per gram of food. Show your method.",
      marks: 2,
      modelAnswer:
        "Energy gained by the water = mass × specific heat capacity × temperature rise = 20 × 4.2 × 15 = 1260 J. Energy per gram = 1260 ÷ 2.0 = 630 J/g.",
      numeric: {
        answer: 630,
        unit: "J/g",
        unitRequired: true,
        tolerance: { abs: 1, display: "630 J/g" },
      },
      criteria: [
        {
          id: "dd-05-c1",
          kind: "method",
          marks: 1,
          credit: "Uses the correct relationship m × c × ΔT and obtains 1260 J for the water.",
          acceptable: ["20 × 4.2 × 15 = 1260", "1260 J", "1.26 kJ"],
        },
        {
          id: "dd-05-c2",
          kind: "answer",
          marks: 1,
          credit: "Divides by the food mass and reports 630 J/g (or 0.63 kJ/g).",
          acceptable: ["630 J/g", "630", "0.63 kJ/g"],
          nonCredit: "Reports 1260 J/g; the calculation has not divided by the 2.0 g sample.",
        },
      ],
      partialCreditRule:
        "The method mark is awarded for the correct substitution even if the final division is wrong. The answer mark requires the per-gram result.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "dd-06",
      archetypeId: "extended-application",
      conceptId: "digestion",
      responseKind: "extended-response",
      prompt:
        "A patient has part of the ileum removed. Explain why the patient may lose weight even though they are eating normally, and why they may be given vitamin B12 by injection rather than by mouth.",
      marks: 5,
      modelAnswer:
        "The ileum is the main site of absorption for digested nutrients, and its removal reduces the surface area available for absorption. Less glucose and fewer amino acids enter the blood, so the patient may take in enough food but still not obtain enough energy and building materials, causing weight loss. Fat absorption may also fall, which can reduce the intake of fat-soluble vitamins. Vitamin B12 is absorbed in the ileum, so a shortened ileum may not absorb enough from food or tablets. An injection delivers B12 directly into the body, bypassing the damaged absorption site.",
      criteria: [
        {
          id: "dd-06-c1",
          kind: "evidence",
          marks: 1,
          credit: "Identifies the ileum as a site of absorption and links its removal to reduced surface area.",
          acceptable: ["less surface area for absorption", "ileum absorbs nutrients", "shorter gut reduces absorption"],
          misconceptionId: "absorption-is-eating",
          signals: ["absorbs food when they eat", "eating is absorption", "eating is the same as absorption"],
        },
        {
          id: "dd-06-c2",
          kind: "evidence",
          marks: 1,
          credit: "Explains that less glucose or fewer amino acids enter the blood, so energy or building materials are lost.",
          acceptable: ["less glucose absorbed", "fewer amino acids absorbed", "nutrients do not reach the blood"],
          misconceptionId: "absorption-is-eating",
        },
        {
          id: "dd-06-c3",
          kind: "evidence",
          marks: 1,
          credit: "Links the reduced absorption to weight loss despite normal eating.",
          nonCredit: "Says 'they lose weight because they eat less' when the prompt says they eat normally.",
        },
        {
          id: "dd-06-c4",
          kind: "evidence",
          marks: 1,
          credit: "States that vitamin B12 is absorbed in the ileum, so the shortened ileum may not absorb enough.",
          acceptable: ["B12 absorbed in the ileum", "ileum absorbs vitamin B12", "B12 absorption is reduced"],
        },
        {
          id: "dd-06-c5",
          kind: "evidence",
          marks: 1,
          credit: "Explains that an injection bypasses the gut and delivers B12 directly, which is why it is used instead of an oral dose.",
          acceptable: ["injection bypasses digestion", "injected B12 enters the blood directly", "oral B12 would not be absorbed"],
        },
      ],
      partialCreditRule:
        "Award each independent link. A named structure without a consequence earns at most 1 mark; the final mark requires the route of administration to be explained.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "dd-07",
      archetypeId: "compare-processes",
      conceptId: "digestion",
      responseKind: "extended-response",
      prompt:
        "A student says faeces are an excretory product because they leave the body. Compare egestion with excretion and explain why the student's statement is incorrect.",
      marks: 3,
      modelAnswer:
        "Egestion removes undigested food from the alimentary canal. Excretion removes metabolic waste that cells have produced, such as urea and carbon dioxide. Faeces are not an excretory product because their material was never absorbed into the cells; it is undigested food leaving the gut. The two processes remove different substances from different origins.",
      criteria: [
        {
          id: "dd-07-c1",
          kind: "evidence",
          marks: 1,
          credit: "Defines egestion as the removal of undigested food from the alimentary canal.",
          acceptable: ["undigested food leaves the gut", "faeces are egested", "removal of food that was not absorbed"],
          misconceptionId: "egestion-is-excretion",
          signals: ["faeces are excretion", "faeces are an excretory product", "excretion removes food"],
        },
        {
          id: "dd-07-c2",
          kind: "evidence",
          marks: 1,
          credit: "Defines excretion as the removal of metabolic waste produced by cells, with a correct example.",
          acceptable: ["urea is excreted", "carbon dioxide is excreted", "waste made by cells"],
          nonCredit: "Names faeces as an example of excretion.",
        },
        {
          id: "dd-07-c3",
          kind: "evidence",
          marks: 1,
          credit: "Explains the origin distinction: undigested food never entered the cells, whereas urea and carbon dioxide were produced by cell reactions.",
          nonCredit: "Says only 'they are different' without locating where the substance came from.",
        },
      ],
      partialCreditRule:
        "Award the two definitions separately. The third mark requires the origin distinction, not merely a second example.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
  ],

  limitations: [
    "This is a design prototype, not a validated examination. No teacher or learner has reviewed it.",
    "The school's permission to use the source material for pattern extraction has not been established; the blueprint therefore stores no source text and permits no reproduction.",
    "OCR of the image-based mark schemes is not treated as an exact transcription. The marking points here are newly written and still need subject-teacher review.",
    "The blueprint is tied to a Year 9 diet-and-digestion unit. It must not be applied to another specification or country without a separate curriculum mapping.",
    "The five-mark extended item is an original transfer task, not a source question; it has not been trialled with a learner.",
    "The calculation item uses a specific heat capacity value and a simple energy-per-gram model; it does not model all heat losses or nutritional energy conventions.",
  ],
  reviews: [],
  reviewStatus: "unreviewed",
  teacherReviewed: false,
  learnerTested: false,
  humanReviewCount: 0,
};
