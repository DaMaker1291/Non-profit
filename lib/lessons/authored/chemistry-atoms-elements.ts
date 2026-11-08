import type { AuthoredLesson } from "../../lesson-contract";

// ATOMS AND ELEMENTS IS USUALLY TAUGHT AS A DIAGRAM TO LABEL AND A NUMBER TO
// COPY. That produces a learner who can say "protons and neutrons" and cannot
// explain why chlorine's relative atomic mass is 35.5 when no chlorine atom has
// that mass. This lesson starts from the particle counts, makes the proton count
// the definition of the element, and treats relative atomic mass as a weighted
// average over a real mixture of isotopes.
export const CHEMISTRY_ATOMS_ELEMENTS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "atoms-elements",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference: "GCSE Chemistry, atomic structure: atoms, elements, isotopes and relative atomic mass",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Use atomic number and mass number to count the protons, neutrons and electrons in an atom or ion.",
      evidence:
        "Given a symbol or a particle count, the learner states the number of each particle and explains why the charge is zero or not.",
    },
    {
      statement:
        "Explain what makes an element an element, and why isotopes of one element have the same chemical properties.",
      evidence:
        "The learner states that the proton count defines the element, and that isotopes differ only in neutrons, which do not affect the electron arrangement or bonding.",
    },
    {
      statement:
        "Calculate a relative atomic mass from isotope abundances and explain why it need not be a whole number.",
      evidence:
        "The learner computes a weighted mean and explains that it is an average over a mixture of atoms, not the mass of any single atom.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question: "What is everything around you made of, at the smallest chemical level?",
        answer:
          "Matter is made of atoms, and an element is a substance made of one type of atom.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question: "What is the difference between a proton and an electron?",
        answer:
          "A proton has a positive charge and sits in the nucleus; an electron has a negative charge and occupies a shell around the nucleus.",
        targets: ["atoms-elements"],
      },
    ],
  },

  introduction: {
    hook:
      "A gold ring and a lump of charcoal look nothing alike, but both are elements. So is the oxygen you are breathing, and so is the chlorine in a swimming pool. There are only about 118 elements, yet they combine into millions of substances. The reason is that an element is not defined by its colour or its state; it is defined by one number, the count of protons in its atoms.",
    why:
      "Once the proton count is fixed, the rest of the atom follows: the electrons balance the charge, the shells explain the chemistry, and the neutrons explain why atoms of the same element can weigh different amounts. Chemical reactions rearrange atoms but do not change one element into another, which is why matter is conserved. This lesson builds the atom from its particles and uses that structure to explain the periodic table and relative atomic mass.",
  },

  explanation: [
    {
      heading: "The atom is mostly empty space around a tiny nucleus",
      paragraphs: [
        "An atom has a nucleus containing protons and neutrons, surrounded by electrons in shells. A proton carries a charge of +1, a neutron carries no charge, and an electron carries a charge of −1. The nucleus holds almost all of the atom's mass but occupies a tiny fraction of its volume; the electrons are spread through the much larger region around it.",
        "The number of protons is the atomic number, written Z. In a neutral atom the number of electrons equals the number of protons, so the positive and negative charges cancel. The mass number, written A, is the number of protons plus the number of neutrons. It is a count of particles in one atom, not a mass in grams, and it is always a whole number for a particular isotope.",
      ],
    },
    {
      heading: "The proton count is the element's identity",
      paragraphs: [
        "Every atom of an element has the same number of protons. Change the proton count and you have a different element: an atom with 6 protons is carbon, and an atom with 7 protons is nitrogen. A chemical reaction can move electrons, break bonds and rearrange atoms, but it cannot change the number of protons in a nucleus. That is why elements are not transmuted by burning or dissolving.",
        "Electrons can be added or removed to make an ion without changing the element. A sodium atom that loses one electron becomes a sodium ion with a +1 charge, but it still has 11 protons and is still sodium. This distinction matters: the proton count tells you what the element is, while the electron count tells you its charge and often its reactivity.",
      ],
    },
    {
      heading: "Isotopes: same element, different neutron count",
      paragraphs: [
        "Atoms of the same element always have the same number of protons, but they can have different numbers of neutrons. These variants are called isotopes. Carbon-12 has 6 protons and 6 neutrons; carbon-14 has 6 protons and 8 neutrons. Both are carbon, because both have 6 protons, but their mass numbers are 12 and 14.",
        "Isotopes have the same chemical properties because chemistry depends on electrons, and the electron arrangement is determined by the proton count, not the neutron count. Their physical properties can differ slightly because their masses differ, which is why isotopes can be separated by techniques that depend on mass. Some isotopes are unstable and decay radioactively, which is a nuclear change rather than a chemical one.",
      ],
    },
    {
      heading: "Relative atomic mass is a weighted average",
      paragraphs: [
        "A sample of an element usually contains a mixture of isotopes in fixed proportions. Chlorine on Earth is about 75% chlorine-35 and about 25% chlorine-37. No single chlorine atom has a mass of 35.5; that number is the weighted average of the mixture, which is why it is called relative atomic mass rather than mass number.",
        "To calculate it, multiply each isotope's mass number by its abundance, add the results, and divide by the total abundance. With a ratio of 3 chlorine-35 atoms to 1 chlorine-37 atom, the calculation is (3 × 35 + 1 × 37) ÷ 4 = 142 ÷ 4 = 35.5. The answer lies between the two mass numbers, closer to the more abundant isotope. That is the check that catches an average taken the wrong way round.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.particle-model",
      body:
        "An aluminium atom has 13 protons and 14 neutrons in its nucleus, with 13 electrons in shells around it. The proton count makes it aluminium; the 13 electrons make it neutral; the 14 neutrons give this isotope a mass number of 27.",
      notation: "protons = 13 · neutrons = 14 · electrons = 13 · mass number = 27",
      caption:
        "The electrons are shown in shells rather than at exact positions, because an electron's position is not a fixed point. What matters for chemistry is the arrangement, especially the outer shell.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "Hydrogen burns in oxygen to form water. The equation is balanced because the same atoms appear on both sides: four hydrogen atoms and two oxygen atoms in, and four hydrogen atoms and two oxygen atoms out. The reaction rearranges atoms; it does not create or destroy them.",
      notation: "2H2 + O2 → 2H2O",
      caption:
        "A coefficient multiplies the whole species: 2H2 means four hydrogen atoms, not two. Balancing is counting, not adjusting formulae.",
    },
    {
      id: "r3",
      kind: "chemistry.formula",
      body:
        "An element is written as its symbol, a molecule of an element may contain several atoms, and a compound contains atoms of more than one element in a fixed ratio. Al, Cl2 and H2O illustrate the three cases, and the formula is a claim about the particles, not a recipe in grams.",
      notation: "Al (element) · Cl2 (molecule of an element) · H2O (compound)",
      caption:
        "The subscript belongs to the atom immediately before it. H2O has two hydrogen atoms and one oxygen atom, not two of each.",
    },
    {
      id: "r4",
      kind: "chemistry.calculation",
      body:
        "The relative atomic mass of chlorine is calculated from the ratio of its isotopes. Three atoms of chlorine-35 for every one atom of chlorine-37 give a weighted mean of 35.5, which lies between the two mass numbers and closer to the more abundant one.",
      notation: "Ar = (3 × 35 + 1 × 37) ÷ 4 = 142 ÷ 4 = 35.5",
      caption:
        "Relative atomic mass has no unit because it is a comparison with one twelfth of a carbon-12 atom. The mass number is a count of particles in one isotope.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "An atom has 13 protons, 14 neutrons and 13 electrons. Identify the element, state its mass number, and explain whether it is neutral.",
      steps: [
        {
          move: "Use the proton count to identify the element.",
          why:
            "The atomic number is the number of protons, and it is what fixes the element's identity. Thirteen protons is aluminium, whatever the other particles are.",
        },
        {
          move: "Add protons and neutrons to get the mass number.",
          why:
            "The mass number counts the particles in the nucleus, because the electrons have negligible mass. 13 + 14 = 27.",
        },
        {
          move: "Compare protons and electrons to decide the charge.",
          why:
            "Each proton is +1 and each electron is −1. There are 13 of each, so the charges cancel and the atom is neutral.",
        },
      ],
      answer:
        "The element is aluminium, its mass number is 27, and it is neutral because 13 protons and 13 electrons balance.",
    },
    {
      id: "w2",
      prompt:
        "A sample of chlorine contains chlorine-35 and chlorine-37 in the ratio 3:1. Calculate its relative atomic mass.",
      steps: [
        {
          move: "Translate the ratio into abundances out of four atoms.",
          why:
            "A ratio of 3:1 means three atoms of chlorine-35 for every one atom of chlorine-37, so the total is four atoms and the fractions are three quarters and one quarter.",
        },
        {
          move: "Multiply each mass number by its abundance and add: 3 × 35 + 1 × 37.",
          why:
            "Each isotope contributes in proportion to how many atoms of it there are, which is what a weighted average means. 105 + 37 = 142.",
        },
        {
          move: "Divide by the total abundance, 4, to get 35.5.",
          why:
            "Dividing by the number of atoms converts the total into a mean per atom. The result must lie between 35 and 37, which is the check that the calculation is sensible.",
        },
      ],
      answer:
        "The relative atomic mass is 35.5, a weighted average that lies between the two mass numbers.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The mass number of an element is the same as its relative atomic mass.",
      whyItFails:
        "The mass number belongs to one atom of one isotope: chlorine-35 has mass number 35, and chlorine-37 has mass number 37. Relative atomic mass is the weighted average over the mixture of isotopes, so it can be 35.5 even though no atom has that mass.",
      correction:
        "Keep the two phrases apart: mass number is a count of protons plus neutrons in a single atom; relative atomic mass is an average over the sample. A whole-number answer to an average should make you check whether the sample is pure.",
      contrast: {
        wrong: "chlorine atoms weigh 35.5, so the mass number is 35.5",
        right: "chlorine atoms weigh 35 or 37; the sample averages 35.5",
      },
    },
    {
      id: "m2",
      belief: "Atoms are neutral because they contain no charged particles.",
      whyItFails:
        "Atoms contain positive protons and negative electrons. They are neutral only because the numbers of protons and electrons are equal, so the charges cancel. Remove an electron and the atom becomes a positively charged ion even though the nucleus is unchanged.",
      correction:
        "Count the charges rather than saying there are none. A neutral atom has equal numbers of protons and electrons; an ion has a different number of electrons from protons.",
      contrast: {
        wrong: "there are no charges inside an atom",
        right: "the +1 and −1 charges cancel because the counts are equal",
      },
    },
    {
      id: "m3",
      belief: "An element can be broken down into simpler substances by a chemical reaction.",
      whyItFails:
        "A chemical reaction rearranges atoms but does not change their proton counts, so it cannot turn one element into another. Compounds can be broken down into elements or simpler compounds, but an element is already the simplest chemical substance.",
      correction:
        "Distinguish an element from a compound. A compound contains atoms of more than one element and can be decomposed chemically; an element contains only one kind of atom and cannot be decomposed by chemistry.",
      contrast: {
        wrong: "heating an element hard enough can split it into new elements",
        right: "chemical reactions rearrange atoms; only nuclear changes alter the element",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "An atom has 11 protons, 12 neutrons and 11 electrons. Identify the element, state its mass number and its charge.",
      hint: "Use the proton count for the element, add protons and neutrons for the mass number, and compare the electron count with the proton count.",
      answer:
        "It is sodium, because 11 protons is sodium's atomic number. Its mass number is 11 + 12 = 23, and it is neutral because it has 11 electrons and 11 protons.",
      feedback: {
        correct:
          "You used each particle count for the question it answers rather than treating all three numbers as the same kind of information.",
        incorrect:
          "The proton count identifies the element, but the mass number also includes the neutrons. Check whether the electron count matches the proton count before deciding the charge.",
      },
    },
    {
      id: "p2",
      prompt:
        "Magnesium has three stable isotopes: 24 (79%), 25 (10%) and 26 (11%). Calculate its relative atomic mass to two decimal places.",
      hint: "Multiply each mass number by its percentage, add the three products, then divide by 100. Check that the answer lies between 24 and 26.",
      answer:
        "24 × 0.79 = 18.96; 25 × 0.10 = 2.50; 26 × 0.11 = 2.86. The sum is 24.32, so the relative atomic mass is 24.32.",
      feedback: {
        correct:
          "You weighted each isotope by its abundance and checked that the result lies between the extreme mass numbers.",
        incorrect:
          "A simple mean of 24, 25 and 26 would ignore the fact that most atoms are magnesium-24. Multiply each mass by its own abundance before adding.",
      },
    },
    {
      id: "p3",
      prompt:
        "Chlorine's relative atomic mass is 35.5, yet no chlorine atom has a mass of 35.5. Explain why this is not a contradiction.",
      hint: "What is a sample of chlorine made of, and what does an average describe?",
      answer:
        "A sample contains a mixture of chlorine-35 and chlorine-37 atoms. The relative atomic mass is the weighted average of their masses, so it can lie between them even though each individual atom has a whole-number mass number.",
      feedback: {
        correct:
          "You distinguished the average over a sample from the mass of one atom.",
        incorrect:
          "The value 35.5 is not a measurement of one atom. Think about what a sample contains and what an average does with a mixture.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain, using atomic structure, why two atoms of the same element can have different mass numbers but the same chemical properties.",
      modelAnswer:
        "Both atoms have the same number of protons, which is what defines the element. They differ in the number of neutrons, so their mass numbers differ; these variants are isotopes. Chemical properties depend on the electron arrangement, which is determined by the proton count, so isotopes with the same number of electrons behave the same chemically even though their masses differ.",
      marking: [
        "States that the atoms have the same proton count and that this defines the element.",
        "Explains that the difference is in the number of neutrons, giving different mass numbers.",
        "Links chemical properties to the electron arrangement rather than to the mass.",
        "Concludes that isotopes of an element are chemically the same but physically slightly different.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "How many protons are in an atom with atomic number 17?",
      modelAnswer: "17",
      marking: [
        "States 17, because the atomic number is the proton count.",
        "Does not confuse the atomic number with the mass number.",
      ],
      check: { accepted: ["17", "seventeen"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "An element is 80% isotope-10 and 20% isotope-11 by abundance. Calculate its relative atomic mass.",
      modelAnswer: "10.2",
      marking: [
        "Multiplies each mass number by its fractional abundance.",
        "Adds the contributions and gives the answer as 10.2, between 10 and 11.",
      ],
      check: { accepted: ["10.2", "10.20"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A magnesium sample from a meteorite has a relative atomic mass of 24.5, different from the 24.3 of magnesium on Earth. Explain whether the meteorite sample is still magnesium and why its chemical behaviour is unchanged.",
      whyItTransfers:
        "The lesson calculates a relative atomic mass from a stated ratio. Here the abundance is different and the learner must decide what that changes and what it does not. The reasoning transfers to any sample from an unfamiliar source and tests whether isotope abundance has been confused with element identity.",
      answer:
        "It is still magnesium, because its atoms have 12 protons; the different average mass comes from a different mixture of isotopes, not from a different element. Its chemical behaviour is unchanged because chemistry depends on the electron arrangement, which is determined by the 12 protons, so the sample forms the same ions and compounds as Earth magnesium.",
      marking: [
        "States that the sample is magnesium because the proton count is unchanged.",
        "Explains the different relative atomic mass as a different isotope abundance.",
        "Links unchanged chemical behaviour to the electron arrangement.",
        "Distinguishes a physical difference in mass from a chemical difference in identity.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the charges and locations of protons, neutrons and electrons in an atom.",
      answer:
        "Protons are positive and in the nucleus; neutrons are neutral and in the nucleus; electrons are negative and occupy shells around the nucleus.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why can relative atomic mass be a decimal when mass number is a whole number?",
      answer:
        "Mass number counts the particles in one atom; relative atomic mass is a weighted average over a mixture of isotopes, so it can lie between two whole numbers.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Adding an electron changes an atom's charge but not its element. Explain why.",
      answer:
        "The proton count is unchanged, so the element is unchanged; only the balance of charge changes, making an ion.",
      when: "month-later",
    },
  ],

  summary: [
    "An atom has a nucleus of protons and neutrons surrounded by electrons; atomic number is the proton count and mass number is protons plus neutrons.",
    "The proton count defines the element; changing electrons makes an ion, while changing protons would make a different element.",
    "Isotopes have the same proton count but different neutron counts, so they are the same element with different masses.",
    "Relative atomic mass is a weighted average over the isotopes in a sample, which is why it need not be a whole number.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every particle model is described as counts and positions in words, so the nucleus, shells and particle numbers are available without the diagram.",
    },
    {
      need: "colour-vision",
      alternative:
        "Protons, neutrons and electrons are labelled with their names and charges as well as shaded, and the isotope calculation is written out in full rather than shown only as a bar chart.",
    },
    {
      need: "dyslexia",
      alternative:
        "The symbols Z, A and Ar are introduced with their full names and meanings before they appear in calculations, and each worked step is one sentence.",
    },
    {
      need: "motor",
      alternative:
        "The lesson uses typing and selecting, not dragging particles; the diagrams are readable without interaction.",
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
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE chemistry subject content for atomic structure and the periodic table.",
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
