import type { AuthoredLesson } from "../../lesson-contract";

// "COMPOUND" AND "MIXTURE" ARE OFTEN TAUGHT AS TWO LABELS WITH EXAMPLES.
// The labels only become useful when a learner can read a particle diagram:
// a compound has chemically bonded particles in a fixed ratio, while a mixture
// contains different particles that keep their own identities. This lesson
// makes that model do the work, then uses separation methods as evidence.
export const CHEMISTRY_COMPOUNDS_MIXTURES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "compounds-mixtures",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, atomic structure and the properties of matter: elements, compounds, mixtures and separation techniques",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Classify a substance as an element, compound or mixture from its particles and its composition.",
      evidence:
        "The learner explains that an element contains one type of atom, a compound contains two or more elements chemically bonded in a fixed ratio, and a mixture contains two or more substances that are not chemically bonded and can vary in proportion.",
    },
    {
      statement:
        "Explain why a mixture can be separated by physical methods while a compound needs a chemical reaction.",
      evidence:
        "The learner chooses filtration, evaporation, distillation or chromatography from the difference in particle size, boiling point or solubility, and explains that these methods do not break chemical bonds; breaking a compound requires electrolysis or thermal decomposition.",
    },
    {
      statement:
        "Use particle diagrams and experimental evidence, including melting point and chromatography, to distinguish pure substances from mixtures.",
      evidence:
        "The learner explains that a pure substance has a fixed melting point and one spot on a chromatogram, while a mixture melts over a range and may produce several spots.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements"],
    check: [
      {
        id: "d1",
        question: "What is an element?",
        answer:
          "A substance made of only one type of atom. Its atoms all have the same number of protons.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question:
          "In a chemical reaction, are atoms created or destroyed?",
        answer:
          "No. Atoms are rearranged into new substances, but the number of each type of atom is conserved.",
        targets: ["atoms-elements"],
      },
    ],
  },

  introduction: {
    hook:
      "Sea water looks like one clear liquid, but drinking it does not give you the same particles as drinking pure water. If you leave it to evaporate, white salt remains. The water and the salt were not chemically joined; they were mixed. Heating water to steam and condensing it can recover the water, while filtering sea water cannot remove the dissolved salt. The method you choose depends on what kind of substance you have.",
    why:
      "An element contains one type of atom. A compound contains two or more elements chemically bonded in a fixed ratio, so its particles are new substances with properties that need not resemble the elements that formed them. A mixture contains two or more substances that are not chemically bonded; its composition can vary, and its components keep their own properties. That is why mixtures can be separated by physical methods such as filtration, evaporation, distillation and chromatography, while a compound must be broken apart by a chemical reaction. This lesson uses particles, formulae and separation evidence to make the distinction operational rather than a definition to recite.",
  },

  explanation: [
    {
      heading: "The particle model tells you which label applies",
      paragraphs: [
        "An element is made of one type of atom. A compound is made of two or more elements chemically bonded together in a fixed ratio; water always has two hydrogen atoms for every oxygen atom, whether it came from a tap or a lake. A mixture contains two or more substances that are not chemically bonded. Its components can be present in any proportion, which is why air can vary slightly in composition and still be air, and why a salt solution can be made weak or strong.",
        "A particle diagram makes the difference visible. In a pure compound, every particle has the same composition and the same ratio of atoms. In a mixture, different kinds of particle are present side by side; they may be atoms, molecules or ions, but they are not joined into one new substance. The diagram is not decoration: if the particles are chemically joined in a fixed ratio, it is a compound; if different particles are merely sharing the same container, it is a mixture.",
        "Some compounds are molecular, such as water, and some are giant ionic lattices, such as sodium chloride. In both cases the elements are chemically bonded in a fixed ratio. The particle diagram for an ionic compound shows a repeating lattice of ions rather than separate molecules, so 'compound particles are always molecules' is false. The defining idea is the chemical bonding and fixed composition, not the shape of the drawing.",
      ],
    },
    {
      heading: "Compounds have new properties; mixtures keep the properties of their parts",
      paragraphs: [
        "Hydrogen is a flammable gas and oxygen supports burning, but water is a liquid that extinguishes many flames. The properties of a compound are not a simple average of its elements because the atoms have been rearranged into a new substance with new bonds. This is why a compound must be represented by a formula and why its behaviour cannot be predicted by listing its elements separately.",
        "In a mixture, the components keep their own properties. Iron filings mixed with sulfur can still be separated with a magnet, and the sulfur still looks and behaves like sulfur. If the same iron and sulfur are heated until they react, they form iron sulfide, which is a compound: it has a fixed composition, does not attract a magnet in the same way, and cannot be separated by physical methods. The comparison is a useful test because it separates 'mixed' from 'chemically joined'.",
        "Alloys are mixtures of metals. Bronze is mainly copper with tin, and steel is mainly iron with carbon and other elements. The components are not chemically bonded in a fixed formula, and their proportions can be varied to change the material's properties. That is why an alloy is a mixture even though it is a solid with a uniform appearance; 'uniform' does not mean 'chemically combined'.",
      ],
    },
    {
      heading: "Physical separation works because the components differ in a physical property",
      paragraphs: [
        "Filtration separates an insoluble solid from a liquid. The filter paper has pores that let the liquid and dissolved particles through but trap the larger insoluble particles. The solid left behind is the residue, and the liquid that passes through is the filtrate. Filtration does not remove a dissolved substance, because its particles are small enough to pass through the paper with the water.",
        "Evaporation and crystallisation recover a dissolved solid from a solution. Evaporation removes the solvent, leaving the solute behind; crystallisation is used when a solid is less soluble at lower temperature or when a crystalline product is wanted. Neither method breaks a chemical bond. If the solid is a compound, it is recovered as the same compound; the water and salt in sea water were never chemically joined.",
        "Simple distillation separates a solvent from a solution by boiling the liquid, condensing the vapour and collecting the distillate. Fractional distillation separates liquids with different boiling points, such as the fractions of crude oil. Chromatography separates substances based on how strongly they adsorb to a stationary phase and how readily they dissolve in a moving solvent. A pure substance gives one spot; a mixture may give several. Each method relies on a physical difference, not on a chemical reaction.",
      ],
    },
    {
      heading: "Pure has a scientific meaning, and evidence can test it",
      paragraphs: [
        "In chemistry, a pure substance contains only one element or one compound. Pure water contains H₂O particles and nothing else; pure orange juice is a mixture of water, sugars, acids, pigments and many other substances, even though 'pure' is used loosely in advertising. The scientific meaning is about particle composition, not about whether the product seems natural or wholesome.",
        "A pure substance melts and boils at fixed temperatures under a given pressure. An impurity usually lowers the melting point and broadens the melting range, and it can raise the boiling point. A melting range is therefore evidence of a mixture, not proof of a specific mixture; the identity of the components still needs further tests.",
        "Chromatography gives a second line of evidence. A pure substance produces one spot in a given solvent, while a mixture can produce several spots at different distances. The spots are compared by their Rf values, the distance travelled by the substance divided by the distance travelled by the solvent. A single spot is consistent with purity, but it is not absolute proof: two substances with the same Rf in that solvent would travel together. The evidence must be interpreted, not treated as a label.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.particle-model",
      body:
        "A mixture contains different particles that are not chemically bonded, so the particles keep their own identities and the proportions can vary. In salt water, water molecules and sodium and chloride ions are mixed together; the ions are not joined to the water molecules, which is why evaporation can recover the salt and distillation can recover the water.",
      notation:
        "water molecules + Na⁺ and Cl⁻ ions → mixed, not bonded · variable proportion",
      caption:
        "The particles are in the same container, not in the same chemical compound. A particle diagram of a mixture must show more than one kind of particle.",
    },
    {
      id: "r2",
      kind: "chemistry.particle-model",
      body:
        "A compound contains two or more elements chemically bonded in a fixed ratio, so every particle has the same composition and the substance has properties that differ from its elements. Water is a compound of hydrogen and oxygen in a 2:1 atom ratio; sodium chloride is a giant ionic lattice of Na⁺ and Cl⁻ ions in a 1:1 ratio.",
      notation:
        "water: 2 H : 1 O · sodium chloride: 1 Na⁺ : 1 Cl⁻ · fixed ratio, chemically bonded",
      caption:
        "A compound is not a mixture of its elements. The chemical bonds make a new substance, which is why water does not behave like hydrogen or oxygen.",
    },
    {
      id: "r3",
      kind: "chemistry.equation",
      body:
        "Hydrogen and oxygen react to form water in a fixed ratio. The equation shows that two hydrogen molecules and one oxygen molecule produce two water molecules, so the atoms are conserved and the product is a compound rather than a mixture.",
      notation: "2H₂ + O₂ → 2H₂O",
      caption:
        "The arrow means a chemical reaction has occurred. Simply mixing hydrogen and oxygen would not produce water, even if the gases were in the same container.",
    },
    {
      id: "r4",
      kind: "chemistry.equation",
      body:
        "Calcium carbonate can be broken down by heating into calcium oxide and carbon dioxide. This is a chemical change, not a physical separation, because the bonds in the carbonate are broken and new substances are formed.",
      notation: "CaCO₃ → CaO + CO₂",
      caption:
        "A compound can be decomposed by a chemical reaction. Filtering or evaporating calcium carbonate would not separate it into calcium oxide and carbon dioxide.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A clear liquid is either pure water or a salt solution. Describe two tests that could distinguish them and explain what each result would show.",
      steps: [
        {
          move:
            "Test the boiling point: heat a small sample and record the temperature at which it boils.",
          why:
            "A pure substance boils at a fixed temperature under a given pressure. Pure water boils at 100 °C at normal pressure; a salt solution usually boils over a range and at a higher temperature because the dissolved ions affect the vapour pressure.",
        },
        {
          move:
            "Evaporate a separate sample to dryness and look for a residue.",
          why:
            "The water in a salt solution evaporates, leaving the dissolved salt behind. Pure water leaves no solid residue, because there is nothing dissolved in it. The residue is the solute that was mixed with the water, not a new compound formed by evaporation.",
        },
        {
          move:
            "Interpret both results together rather than relying on one test.",
          why:
            "A boiling-point measurement can be affected by imprecise apparatus, and a residue could contain dust. Agreement between a boiling range and a visible residue is stronger evidence than either observation alone.",
        },
      ],
      answer:
        "Pure water boils at a fixed 100 °C at normal pressure and leaves no residue on evaporation. A salt solution boils over a range, usually above 100 °C, and leaves a solid residue when the water evaporates. The two tests together distinguish the mixture from the pure compound.",
    },
    {
      id: "w2",
      prompt:
        "A mixture contains sand and salt. Describe how to obtain dry sand and dry salt from the mixture, naming each separation method and explaining why it works.",
      steps: [
        {
          move: "Add water and stir. The salt dissolves; the sand does not.",
          why:
            "Salt is soluble in water and sand is insoluble. Dissolving separates the salt particles from the solid sand at the particle level, but it does not break the chemical bonds in either substance.",
        },
        {
          move: "Filter the mixture. Collect the sand as the residue and the salt solution as the filtrate.",
          why:
            "The filter paper traps the insoluble sand particles but lets the dissolved salt and water pass through. Filtration separates by particle size, so it cannot remove the dissolved salt.",
        },
        {
          move:
            "Wash the sand with a little distilled water and leave it to dry. Evaporate the filtrate slowly to recover the salt.",
          why:
            "Washing removes any salt solution clinging to the sand. Evaporating the water leaves the dissolved salt behind; slow evaporation or crystallisation gives larger, purer crystals than boiling the solution dry.",
        },
      ],
      answer:
        "Add water to dissolve the salt, filter to collect the sand as the residue, wash and dry the sand, then evaporate the filtrate to recover the salt. Dissolving, filtration and evaporation are physical methods; they separate the components without breaking chemical bonds.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A compound is just a mixture of the elements written in a formula.",
      whyItFails:
        "A compound's elements are chemically bonded in a fixed ratio, and the compound has properties that need not resemble its elements. Water is not a container of hydrogen and oxygen; its particles are H₂O, and separating them requires a chemical reaction such as electrolysis.",
      correction:
        "Read the formula as a ratio of chemically bonded atoms, then compare the properties of the compound with those of its elements. A mixture can be separated physically; a compound cannot.",
      contrast: {
        wrong: "water is a mixture of hydrogen and oxygen because it contains both",
        right: "water is a compound of hydrogen and oxygen chemically bonded in a 2:1 ratio",
      },
    },
    {
      id: "m2",
      belief: "All mixtures are liquids, and all compounds are solids.",
      whyItFails:
        "Air is a mixture of gases, brass is a solid mixture of metals, and sea water is a liquid mixture. Compounds can be gases such as carbon dioxide, liquids such as water, or solids such as sodium chloride. The state of matter does not decide the classification.",
      correction:
        "Classify by particle composition and bonding, not by appearance. A mixture can be solid, liquid or gas, and so can a compound.",
      contrast: {
        wrong: "a gas cannot be a mixture, and a liquid cannot be a compound",
        right: "air is a gaseous mixture; water is a liquid compound",
      },
    },
    {
      id: "m3",
      belief: "A pure substance is any substance that looks clean or natural, so pure orange juice is pure.",
      whyItFails:
        "In chemistry, pure means one element or one compound. Orange juice contains water, sugars, acids, pigments and other substances, so it is a mixture even if it is fresh and unadulterated. The everyday use of 'pure' means 'not contaminated' or 'from one source', not 'one chemical substance'.",
      correction:
        "Use the scientific test: does it contain only one element or compound? If it contains several substances that can be separated physically, it is a mixture, whatever the label says.",
      contrast: {
        wrong: "pure orange juice is a pure substance because nothing was added",
        right: "orange juice is a mixture of many substances; pure water is a compound",
      },
    },
    {
      id: "m4",
      belief: "A compound can be separated by filtration if its particles are large enough.",
      whyItFails:
        "The elements in a compound are chemically bonded, not present as separate particles that a filter could trap. Filtering can separate an insoluble solid from a liquid mixture, but it cannot break the bonds inside a compound. Separating a compound requires a chemical reaction, such as electrolysis or thermal decomposition.",
      correction:
        "Ask whether the substances are joined by chemical bonds. If they are, a physical method can only separate the compound from other materials; it cannot separate the compound into its elements.",
      contrast: {
        wrong: "filtering salty water removes the salt because the salt particles are large",
        right: "the salt is dissolved; evaporation recovers it, but filtration cannot separate the water and salt",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Classify each substance and explain your reasoning: air, pure water, bronze, carbon dioxide.",
      hint:
        "Ask whether it contains one type of atom, one compound, or more than one substance that is not chemically bonded.",
      answer:
        "Air is a mixture of gases, mainly nitrogen, oxygen, argon and carbon dioxide, in variable proportions. Pure water is a compound of hydrogen and oxygen in a fixed 2:1 ratio. Bronze is a mixture of copper and tin, with variable proportions. Carbon dioxide is a compound of carbon and oxygen in a fixed 1:2 ratio.",
      feedback: {
        correct:
          "You classified by particle composition and bonding, not by whether the substance is a solid, liquid or gas.",
        incorrect:
          "Start with the particles: one type of atom is an element, chemically bonded elements in a fixed ratio are a compound, and different substances sharing a container form a mixture.",
      },
    },
    {
      id: "p2",
      prompt:
        "A student has a mixture of sand and salt water. Describe the steps needed to obtain dry sand and dry salt, and name the property each step relies on.",
      hint:
        "Sand is insoluble; salt is soluble. Which method separates an insoluble solid, and which method recovers a dissolved solid?",
      answer:
        "Filter the mixture: the sand is trapped as the residue because it is insoluble, while the salt solution passes through as the filtrate. Wash and dry the sand. Evaporate the filtrate to remove the water and leave the salt. Filtration relies on particle size and solubility; evaporation relies on the difference in boiling point between water and the dissolved salt.",
      feedback: {
        correct:
          "You used filtration for the insoluble solid and evaporation for the dissolved solid, and named the physical difference behind each.",
        incorrect:
          "Filtering will not remove dissolved salt. Separate the sand first, then recover the salt from the filtrate by evaporating the water.",
      },
    },
    {
      id: "p3",
      prompt:
        "A solid melts at 801 °C. Another solid melts gradually between 790 °C and 805 °C. Which is more likely to be a pure substance, and what does the other result suggest?",
      hint:
        "What happens to the melting point when an impurity is present?",
      answer:
        "The solid melting sharply at 801 °C is more likely to be pure, because a pure substance has a fixed melting point. The solid melting over a range is likely to be a mixture or to contain an impurity; the impurity disrupts the lattice and lowers and broadens the melting range. The melting point alone does not identify the substance.",
      feedback: {
        correct:
          "You used the sharpness of the melting point as evidence about purity, while recognising that it does not identify the substance.",
        incorrect:
          "A pure substance melts at a fixed temperature; a mixture or impure sample melts over a range. Compare the width of the range, not just the starting temperature.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain the difference between a compound and a mixture, using particle diagrams and one separation method in your answer.",
      modelAnswer:
        "A compound contains two or more elements chemically bonded in a fixed ratio, so its particles are all the same kind of new substance. Water is a compound with H₂O particles in a 2:1 ratio of hydrogen to oxygen. A mixture contains two or more substances that are not chemically bonded, so different particles are present and their proportions can vary. Salt water is a mixture of water molecules and sodium and chloride ions; evaporating the water recovers the salt, which is a physical separation. A compound such as water cannot be separated into hydrogen and oxygen by evaporation; it requires a chemical reaction such as electrolysis.",
      marking: [
        "Defines a compound as chemically bonded elements in a fixed ratio.",
        "Defines a mixture as substances not chemically bonded, with variable proportions.",
        "Uses a particle description correctly, such as H₂O particles or a lattice of ions.",
        "Names a physical separation method and explains why it works for a mixture.",
        "States that separating a compound requires a chemical reaction, not a physical method.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Is air an element, a compound or a mixture?",
      modelAnswer: "a mixture",
      marking: [
        "Names a mixture, not a compound.",
        "Recognises that air contains several gases that are not chemically bonded.",
      ],
      check: {
        accepted: ["mixture", "a mixture", "it is a mixture"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Name the separation method used to remove insoluble sand from salty water.",
      modelAnswer: "filtration",
      marking: [
        "Names filtration, not evaporation or distillation.",
        "Recognises that the sand is trapped as the residue while the solution passes through.",
      ],
      check: {
        accepted: ["filtration", "filtering", "filter"],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "A liquid boils at a range of temperatures rather than one fixed point. What does this suggest about its purity?",
      modelAnswer: "impure",
      marking: [
        "Says it is impure or a mixture, not pure.",
        "Links the boiling range to the presence of more than one substance.",
      ],
      check: {
        accepted: [
          "impure",
          "it is impure",
          "a mixture",
          "it is a mixture",
          "not pure",
          "contains an impurity",
          "has an impurity",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A white solid is described as a compound, but a student says it must be a mixture because it can be broken down by heating. Evaluate the student's reasoning and explain what the observation actually shows.",
      whyItTransfers:
        "The lesson distinguishes physical separation from chemical decomposition. Here the learner must recognise that breaking a compound down by heating is evidence of a chemical reaction, not evidence that it was a mixture, and must use the products to justify the conclusion.",
      answer:
        "The student's reasoning is wrong. A compound can be broken down into simpler substances by a chemical reaction, such as heating calcium carbonate to form calcium oxide and carbon dioxide. That decomposition produces new substances and breaks chemical bonds, so it is not a physical separation. A mixture could be separated by physical means, but the ability to decompose on heating does not make the original solid a mixture. The original solid is a compound if it contains chemically bonded elements in a fixed ratio.",
      marking: [
        "Rejects the claim that decomposition on heating proves a mixture.",
        "Distinguishes a chemical reaction from a physical separation.",
        "Explains that a compound can be decomposed into simpler substances.",
        "Uses a correct example or describes the products as new substances.",
        "Does not claim that a mixture cannot be heated or that all mixtures are pure.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State one difference between a compound and a mixture in terms of chemical bonding.",
      answer:
        "A compound has its elements chemically bonded in a fixed ratio; a mixture contains substances that are not chemically bonded and can vary in proportion.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Name one physical method for separating a mixture and state the property it relies on.",
      answer:
        "Filtration separates an insoluble solid from a liquid by particle size. Distillation separates liquids by boiling point. Chromatography separates substances by solubility and adsorption.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why does a pure substance have a sharp melting point while a mixture often melts over a range?",
      answer:
        "A pure substance has one type of particle arrangement that breaks down at a fixed temperature. A mixture contains different substances, so different parts melt at different temperatures, producing a range.",
      when: "month-later",
    },
  ],

  summary: [
    "An element contains one type of atom; a compound contains chemically bonded elements in a fixed ratio; a mixture contains substances that are not chemically bonded and can vary in proportion.",
    "A compound has new properties rather than a simple average of its elements; a mixture's components keep their own properties.",
    "Mixtures can be separated by physical methods such as filtration, evaporation, distillation and chromatography because their components differ in particle size, boiling point or solubility.",
    "A compound cannot be separated into its elements by a physical method; breaking its chemical bonds requires a chemical reaction such as electrolysis or thermal decomposition.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every particle diagram is described in words, including which particles are bonded and which are merely mixed. Equations are read as word equations before the symbols.",
    },
    {
      need: "colour-vision",
      alternative:
        "Particles and substances are identified by labels and formulas as well as by colour. No classification depends on a colour difference.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson separates particle composition, properties, separation methods and purity evidence into short headed sections. Each separation method is presented as a step-by-step procedure.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed or selected. No dragging of particles or labels is required.",
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
        "All explanations, examples, practice and assessments are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-compounds-mixtures",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE chemistry subject content for elements, compounds, mixtures and separation techniques.",
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
