import type { AuthoredLesson } from "../../lesson-contract";

// ELECTRON CONFIGURATION IS THE GRAMMAR OF BONDING, AND IT IS USUALLY TAUGHT AS
// A NUMBER SEQUENCE TO COPY. This lesson makes the sequence follow from the
// shells, makes the outer shell the explanation of group behaviour, and derives
// ion charges from the electron count rather than asking a learner to memorise a
// table of charges.
export const CHEMISTRY_ELECTRON_SHELLS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "electron-shells",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference: "GCSE Chemistry, atomic structure: electron configuration, groups and ion formation",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Write the electron configuration of the first 20 elements and relate it to their position in the periodic table.",
      evidence:
        "Given an atomic number, the learner fills the shells in order and states the period and group from the number of shells and outer electrons.",
    },
    {
      statement:
        "Explain why elements in the same group have similar chemical properties.",
      evidence:
        "The learner links group membership to the same number of outer-shell electrons, and explains that reactions depend on the outer shell rather than on the total number of electrons.",
    },
    {
      statement:
        "Predict the charge on an ion formed by a main-group element and derive a formula from charge balance.",
      evidence:
        "The learner states how many electrons are lost or gained to reach a full outer shell, gives the ion charge, and combines two ions in the ratio that makes the charges cancel.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements"],
    check: [
      {
        id: "d1",
        question: "What does the atomic number of an element tell you?",
        answer:
          "The number of protons in its atoms, which is also the number of electrons in a neutral atom.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question: "Where are electrons found in an atom?",
        answer:
          "In shells around the nucleus, at increasing distances from it.",
        targets: ["atoms-elements"],
      },
    ],
  },

  introduction: {
    hook:
      "Sodium reacts so violently with water that it skitters across the surface and sometimes catches fire. Argon, the gas in some light bulbs, reacts with almost nothing. Both atoms have the same filled inner shells. The difference is one electron in sodium's outer shell, and that single electron is the whole explanation for the difference in behaviour.",
    why:
      "Electrons occupy shells at increasing distance from the nucleus, and the arrangement is written as a sequence such as 2, 8, 1. The outer shell is where chemistry happens: a full outer shell is stable, while an atom with one or two electrons beyond a full shell tends to lose them, and an atom a few short tends to gain them. This is why the periodic table repeats, why group 1 metals behave alike, and why ions have the charges they do.",
  },

  explanation: [
    {
      heading: "Shells fill in order, and the sequence is the configuration",
      paragraphs: [
        "Electrons occupy shells around the nucleus, and for the first 20 elements the filling order is simple: 2 electrons in the first shell, 8 in the second, 8 in the third, and the remaining electrons in the fourth. Sodium has 11 electrons, so its configuration is 2, 8, 1. Calcium has 20, so its configuration is 2, 8, 8, 2.",
        "The sequence is not arbitrary. Each shell can hold a limited number before the next one begins to fill, and the outer shell is the last to receive electrons. A configuration is therefore a map of where the atom's electrons are, and the number of occupied shells tells you the period: sodium's three shells place it in period 3, and calcium's four place it in period 4.",
      ],
    },
    {
      heading: "The outer shell is the chemistry",
      paragraphs: [
        "Atoms with a full outer shell are stable and do not readily gain, lose or share electrons. The noble gases, group 0, have full outer shells: helium has 2, neon has 2 and 8, and argon has 2, 8 and 8. That is why they are unreactive. The rule is not that a full shell is magic; it is that the arrangement has no low-energy gap for another electron and no loosely held electron to lose.",
        "For every other element, the outer-shell electron count predicts the group. Group 1 elements have one outer electron, group 2 have two, group 7 have seven, and group 0 have eight (or two for helium). Across a period the outer shell fills, so the elements change from metals that lose electrons to non-metals that gain them. Down a group the outer electron is further from the nucleus and less strongly held, which is why reactivity changes in a regular way.",
      ],
    },
    {
      heading: "Ions form by gaining or losing electrons to complete a shell",
      paragraphs: [
        "A sodium atom with configuration 2, 8, 1 can lose its single outer electron to leave 2, 8, which is the configuration of neon. It then has 11 protons and 10 electrons, so its charge is +1 and it is written Na+. A chlorine atom with 2, 8, 7 can gain one electron to reach 2, 8, 8, the configuration of argon; it then has 17 protons and 18 electrons, so its charge is −1 and it is written Cl−.",
        "The number of electrons lost or gained is the shortest route to a full outer shell, which is why magnesium (2, 8, 2) forms Mg2+ and oxygen (2, 6) forms O2−. The proton count never changes in this process, so the element stays the same; only the charge changes. This is the difference between forming an ion and transmuting an element.",
      ],
    },
    {
      heading: "Charge balance gives the formula",
      paragraphs: [
        "Ionic compounds contain positive and negative ions in the ratio that makes the total charge zero. Sodium ions are +1 and chloride ions are −1, so one of each gives NaCl. Magnesium ions are +2 and chloride ions are −1, so two chloride ions are needed for each magnesium ion, giving MgCl2.",
        "The same rule handles aluminium oxide: Al3+ and O2− require two aluminium ions and three oxide ions, because 2 × (+3) + 3 × (−2) = 0, giving Al2O3. The formula is not a memorised string; it is the smallest whole-number ratio that cancels the charges. Writing the charges above the symbols first is the habit that prevents a formula from being guessed.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.particle-model",
      body:
        "Sodium has 11 electrons in shells of 2, 8 and 1; chlorine has 17 in shells of 2, 8 and 7; argon has 18 in shells of 2, 8 and 8. Sodium and chlorine each have one electron beyond or short of a full outer shell, which is why they form ions, while argon's full shell makes it unreactive.",
      notation: "Na: 2, 8, 1 · Cl: 2, 8, 7 · Ar: 2, 8, 8",
      caption:
        "The shell diagram is a model of arrangement, not a picture of orbits. What matters is how many electrons are in each shell, especially the outer one.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "Sodium reacts with chlorine to form sodium chloride. Sodium loses one electron and chlorine gains it, so the equation balances in atoms as well as in charge: two sodium atoms and two chlorine atoms on each side.",
      notation: "2Na + Cl2 → 2NaCl",
      caption:
        "The product is an ionic lattice, not a molecule of NaCl. The formula gives the ratio of ions, and the equation gives the ratio in which the elements react.",
    },
    {
      id: "r3",
      kind: "chemistry.formula",
      body:
        "Ionic formulae follow from charge balance: sodium chloride needs one +1 and one −1, magnesium chloride needs one +2 and two −1, and aluminium oxide needs two +3 and three −2. Each formula is the smallest ratio that makes the total charge zero.",
      notation: "NaCl · MgCl2 · Al2O3",
      caption:
        "The subscript applies to the ion before it. MgCl2 means one magnesium ion and two chloride ions, not two magnesium ions.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "When sodium loses its outer electron, the remaining 10 electrons fill the first two shells completely. The nucleus still has 11 protons, so the particle has one more positive charge than negative charge, which is why the ion is Na+.",
      notation: "Na atom: 11p, 11e, 2,8,1 → Na+ ion: 11p, 10e, 2,8",
      caption:
        "The electron count changes, but the proton count does not. That is why the element is still sodium after it becomes an ion.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Write the electron configuration of calcium (atomic number 20), state its period and group, and predict the charge on its ion.",
      steps: [
        {
          move: "Fill the shells in order with 20 electrons: 2, 8, 8, 2.",
          why:
            "The first shell takes 2, the second 8, the third 8, and the remaining 2 go into the fourth. The sum must equal the atomic number because a neutral atom has equal protons and electrons.",
        },
        {
          move: "Read the period from the number of occupied shells.",
          why:
            "Calcium's electrons occupy four shells, so it is in period 4. The period is the row, and it counts the shells in use.",
        },
        {
          move: "Read the group from the outer-shell electrons and predict the ion.",
          why:
            "Two outer electrons place calcium in group 2. Losing those two electrons leaves the full 2, 8, 8 arrangement, so the ion is Ca2+.",
        },
      ],
      answer:
        "Calcium is 2, 8, 8, 2; it is in period 4 and group 2, and it forms a Ca2+ ion by losing its two outer electrons.",
    },
    {
      id: "w2",
      prompt:
        "Explain why chlorine forms a Cl− ion while sodium forms a Na+ ion, using their electron configurations.",
      steps: [
        {
          move: "Write both configurations and identify the outer shell.",
          why:
            "Sodium is 2, 8, 1 and chlorine is 2, 8, 7. The comparison has to start from the actual outer-shell counts, because the two elements are on opposite sides of a full shell.",
        },
        {
          move: "Decide whether losing or gaining is the shorter route to a full shell.",
          why:
            "Sodium has one electron beyond a full shell, so losing one is shorter than gaining seven. Chlorine is one short of a full shell, so gaining one is shorter than losing seven.",
        },
        {
          move: "Translate the electron change into the charge.",
          why:
            "Sodium ends with 11 protons and 10 electrons, giving +1. Chlorine ends with 17 protons and 18 electrons, giving −1. The proton count is unchanged in both cases.",
        },
      ],
      answer:
        "Sodium (2, 8, 1) loses one electron to reach 2, 8 and becomes Na+. Chlorine (2, 8, 7) gains one electron to reach 2, 8, 8 and becomes Cl−. Each moves to the nearest full shell, and the charge is the imbalance left between protons and electrons.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The third shell always holds eight electrons, so potassium must be 2, 8, 9.",
      whyItFails:
        "A shell has a maximum capacity, and the third shell is not filled beyond eight before the fourth begins for the first 20 elements. Potassium has 19 electrons: 2, 8, 8, 1. Writing 2, 8, 9 puts an electron into a shell that is already at its working capacity for this sequence.",
      correction:
        "Fill in the order 2, 8, 8, then the fourth shell. Check that the total equals the atomic number, and that no shell is over its capacity for the first 20 elements.",
      contrast: {
        wrong: "keep adding to the third shell until it has all the rest",
        right: "the third shell takes eight, then the fourth begins with one",
      },
    },
    {
      id: "m2",
      belief: "Atoms become ions by gaining or losing protons.",
      whyItFails:
        "Protons are in the nucleus and are not gained or lost in chemical reactions. Ion formation involves electrons, which are outside the nucleus and can be transferred. Changing the proton count would change the element itself.",
      correction:
        "Count protons and electrons separately. The proton count stays fixed and identifies the element; the electron count changes and produces the charge.",
      contrast: {
        wrong: "sodium loses a proton and becomes neon",
        right: "sodium loses an electron and becomes Na+",
      },
    },
    {
      id: "m3",
      belief: "The group number is the number of electron shells.",
      whyItFails:
        "The period is the number of occupied shells, because rows correspond to shells being filled. The group is the number of outer-shell electrons, because columns correspond to the outer-shell count. Confusing them swaps a row for a column.",
      correction:
        "Read down for shells and across for outer electrons. Sodium has three shells and one outer electron, so it is period 3, group 1.",
      contrast: {
        wrong: "sodium is group 3 because it has three shells",
        right: "sodium is period 3 and group 1",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Write the electron configuration of potassium (atomic number 19) and state the charge on its ion.",
      hint: "Fill 2, then 8, then 8, then put the remaining electron in the fourth shell.",
      answer:
        "Potassium is 2, 8, 8, 1. It loses its single outer electron to reach 2, 8, 8, so its ion is K+.",
      feedback: {
        correct:
          "You filled the shells in order and used the outer electron to predict the charge.",
        incorrect:
          "Do not put a ninth electron in the third shell. After 2, 8, 8, the next electron starts the fourth shell.",
      },
    },
    {
      id: "p2",
      prompt:
        "Explain why argon (2, 8, 8) is unreactive while chlorine (2, 8, 7) is reactive.",
      hint: "What is different about the outer shell in each atom?",
      answer:
        "Argon has a full outer shell, so it has no low-energy need to gain or lose electrons. Chlorine is one electron short of a full shell, so it readily gains an electron to form Cl−.",
      feedback: {
        correct:
          "You linked reactivity to the outer-shell count rather than to the total number of electrons.",
        incorrect:
          "Both atoms have three shells. The difference is how full the outer one is.",
      },
    },
    {
      id: "p3",
      prompt:
        "Derive the formula of aluminium oxide from the ions Al3+ and O2−.",
      hint: "Find the smallest whole-number ratio whose total charge is zero.",
      answer:
        "Two Al3+ ions give +6 and three O2− ions give −6, so the charges cancel. The formula is Al2O3.",
      feedback: {
        correct:
          "You balanced the total charge rather than copying a formula.",
        incorrect:
          "One of each would give +3 and −2, which does not cancel. Find the lowest common multiple of 3 and 2.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why sodium and potassium react in similar ways, and why potassium reacts more vigorously. Refer to electron configuration and the periodic table.",
      modelAnswer:
        "Both are group 1 metals, so both have one electron in their outer shell. Their reactions involve losing that electron to form a +1 ion, which is why the type of reaction is the same. Potassium's outer electron is in a shell further from the nucleus and is shielded by more inner shells, so it is held less strongly and is lost more easily. That makes potassium more reactive than sodium.",
      marking: [
        "Places both elements in group 1 and identifies one outer-shell electron.",
        "Explains that both lose one electron to form a +1 ion.",
        "Explains the greater reactivity of potassium in terms of distance and shielding from the nucleus.",
        "Concludes that similar outer-shell counts give similar reactions, while the ease of losing the electron changes the vigour.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Write the electron configuration of chlorine (atomic number 17).",
      modelAnswer: "2, 8, 7",
      marking: [
        "Fills the first shell with 2 and the second with 8.",
        "Places the remaining 7 in the third shell, giving 2, 8, 7.",
      ],
      check: { accepted: ["2, 8, 7", "2,8,7", "2.8.7", "287", "2 8 7"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "What charge does an aluminium ion have after losing three electrons?",
      modelAnswer: "3+",
      marking: [
        "Gives a charge of 3+ rather than 3−.",
        "Recognises that losing electrons leaves more protons than electrons.",
      ],
      check: { accepted: ["3+", "+3", "al3+", "al 3+"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "An element X has the configuration 2, 8, 2. An element Y has the configuration 2, 8, 7. Predict the formula of the compound they form, name the type of bonding, and explain your reasoning.",
      whyItTransfers:
        "The lesson derives formulae for named ions. Here the elements are unnamed and the learner must read the configurations, decide the ion each would form, and balance the charges. The reasoning is the same, but the context is unfamiliar and no charge table is supplied.",
      answer:
        "X loses its two outer electrons to form X2+, and Y gains one electron to form Y−. The charges balance with one X2+ for every two Y−, so the formula is XY2. The bonding is ionic, because a metal loses electrons and a non-metal gains them, forming oppositely charged ions held in a lattice.",
      marking: [
        "Reads X as forming a 2+ ion and Y as forming a 1− ion from their outer-shell counts.",
        "Balances the charges to give XY2 rather than XY.",
        "Names ionic bonding and explains it as electron transfer between a metal and a non-metal.",
        "Justifies the prediction from the configurations rather than from the element names.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "How many electrons can the first, second and third shells hold in the first 20 elements?",
      answer: "2, 8 and 8 respectively, before the fourth shell begins to fill.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why do elements in the same group react similarly?",
      answer:
        "They have the same number of outer-shell electrons, and reactions depend on the outer shell.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Explain how magnesium (2, 8, 2) forms its ion and what charge it has.",
      answer:
        "It loses its two outer electrons to reach 2, 8, leaving 12 protons and 10 electrons, so the ion is Mg2+.",
      when: "month-later",
    },
  ],

  summary: [
    "Electrons fill shells in the order 2, 8, 8, 2 for the first 20 elements; the configuration is the list of electrons per shell.",
    "The period is the number of occupied shells and the group is the number of outer-shell electrons.",
    "A full outer shell is stable, which is why noble gases are unreactive; other atoms gain or lose electrons to reach one.",
    "Ion charge is the imbalance between protons and electrons, and an ionic formula is the smallest ratio that cancels the charges.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every configuration is written as a number sequence and read aloud as 'two, eight, one', so the shell diagram is not the only representation.",
    },
    {
      need: "colour-vision",
      alternative:
        "Electrons, protons and ions are labelled by name and charge as well as shaded; the shell counts are printed beside each diagram.",
    },
    {
      need: "dyslexia",
      alternative:
        "The sequence is introduced with a worked example before the rule is stated, and each configuration is kept on its own line to reduce visual crowding.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing or selecting, not dragging electrons into shells; all diagrams are readable without interaction.",
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
