import type { AuthoredLesson } from "../../lesson-contract";

// THE PERIODIC TABLE IS TAUGHT AS A WALL CHART AND EXAMINED AS A SET OF
// EXPLANATIONS. The chart is not the lesson: the lesson is that position is a
// consequence of electron arrangement, and that reactivity is a consequence of
// how strongly the nucleus holds the outer electrons. Every claim here is tied
// back to that one model.
export const CHEMISTRY_PERIODIC_TABLE: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "periodic-table",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference: "GCSE Chemistry, atomic structure and the periodic table: groups, periods and trends",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Use proton number to place an element in the table and explain why its group and period follow from its electron configuration.",
      evidence:
        "For an element with 17 protons and the configuration 2,8,7, the learner places it in group 7 and period 3, and explains that the group is set by the outer-shell count and the period by the number of occupied shells.",
    },
    {
      statement:
        "Explain the trend in reactivity down group 1 and down group 7 in terms of the attraction between the nucleus and the outer electrons.",
      evidence:
        "The learner states that group 1 reactivity increases down the group because the outer electron is further from the nucleus and shielded, while group 7 reactivity decreases for the same reason applied to an incoming electron.",
    },
    {
      statement:
        "Predict the formula of an ionic compound from the group numbers of its elements and explain the electron transfer that produces it.",
      evidence:
        "For magnesium and chlorine, the learner explains that magnesium loses two electrons and each chlorine gains one, so two chloride ions are needed and the formula is MgCl₂.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements", "electron-shells"],
    check: [
      {
        id: "d1",
        question: "What does the atomic number of an element tell you?",
        answer:
          "The number of protons in the nucleus, which is also the number of electrons in a neutral atom and is what identifies the element.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question: "Write the electron configuration of sodium, which has 11 electrons.",
        answer:
          "2, 8, 1: two electrons in the first shell, eight in the second and one in the third.",
        targets: ["electron-shells"],
      },
      {
        id: "d3",
        question: "Why is the outer shell important in chemistry?",
        answer:
          "Chemical behaviour depends on the outer electrons, because a full outer shell is stable and atoms lose, gain or share electrons to reach one.",
        targets: ["electron-shells"],
      },
    ],
  },

  introduction: {
    hook:
      "Sodium and potassium sit one above the other in the same column, and both fizz when they hit water. Sodium skates around the surface; potassium catches fire and can explode. Their atoms differ by one shell, and that one shell is the whole difference between a demonstration and a hazard. The table is arranged so that a column tells you the behaviour, and the reason is buried in the electron arrangement.",
    why:
      "The periodic table is not a list to memorise. It is a map of proton number, and the repeating pattern exists because outer electron arrangements repeat. Once you can read an element's position, you can predict how many electrons it will lose or gain, what formula its compound will have, and whether it will be more or less reactive than its neighbours. That is prediction, not recall.",
  },

  explanation: [
    {
      heading: "The table is ordered by proton number, not by weight",
      paragraphs: [
        "Elements are arranged in order of increasing proton number, which is the number of protons in the nucleus and therefore the number of electrons in a neutral atom. Mendeleev arranged his table by relative atomic mass and left gaps where the pattern demanded an element that had not been found; the modern table keeps the pattern and orders it by proton number, which is why a few pairs appear in the opposite order to their masses.",
        "Argon is placed before potassium even though argon atoms are slightly heavier, because argon has 18 protons and potassium has 19. Ordering by proton number puts each element exactly where its chemistry belongs, and the pattern does not need exceptions. That is the difference between a table that describes and a table that predicts.",
      ],
    },
    {
      heading: "A group is a column of the same outer-shell count",
      paragraphs: [
        "The group number of a main-group element is the number of electrons in its outer shell. Group 1 elements have one outer electron, group 7 have seven, and group 0 have a full outer shell. Elements in the same group behave similarly because the outer electrons are the ones involved in bonding, so a group is a set of elements with the same bonding toolkit.",
        "The period number is the number of occupied shells. Sodium, with the configuration 2,8,1, is in period 3 and group 1; chlorine, with 2,8,7, is in period 3 and group 7. Reading position from configuration, and configuration from position, is the skill the table is designed to support. A learner who can do both can work out where an unfamiliar element belongs.",
      ],
    },
    {
      heading: "Reactivity down a group is about distance and shielding",
      paragraphs: [
        "Going down group 1, the atoms get larger and the outer electron occupies a shell further from the nucleus. The inner shells also shield the outer electron from the positive charge. Both effects weaken the attraction between the nucleus and the outer electron, so it is easier to remove, and the element reacts more vigorously. Potassium reacts more fiercely than sodium for the same reason lithium is calmer than both.",
        "Going down group 7, the trend reverses because the process is the opposite. A halogen reacts by gaining an electron, so the question is how strongly the nucleus attracts an incoming electron. A larger atom has its outer shell further out and more shielded, so the attraction is weaker and the element is less reactive. Fluorine is the most reactive halogen and iodine the least, which is why astatine is expected to be even less reactive.",
      ],
    },
    {
      heading: "Formulae follow from electron transfer",
      paragraphs: [
        "A metal in group 1 loses one electron and a metal in group 2 loses two, leaving a positive ion with a full outer shell. A non-metal in group 7 gains one electron and a non-metal in group 6 gains two, leaving a negative ion. The number of electrons lost must equal the number gained, because the compound is neutral overall.",
        "That balance is where a formula comes from. Magnesium loses two electrons, and each chlorine atom gains one, so one magnesium ion combines with two chloride ions to give MgCl₂. Sodium loses one and chlorine gains one, so the formula is NaCl. Predicting the formula is not a memory exercise; it is counting the electrons that have to move.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.particle-model",
      body:
        "A sodium atom has one outer electron beyond a full second shell, so it loses that electron to form a positive ion with the stable configuration 2,8. A chlorine atom has seven outer electrons, so it gains one to reach 2,8,8 and form a negative ion, because both ions are more stable with a full outer shell.",
      notation: "Na 2,8,1 → Na⁺ 2,8 · Cl 2,8,7 → Cl⁻ 2,8,8",
      caption:
        "The arrow is an electron transfer, not a change of element. The proton number is unchanged in each ion, which is why the element stays the same.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "Sodium and chlorine react to form sodium chloride. Two sodium atoms are needed for each chlorine molecule because chlorine is diatomic and each chlorine atom accepts one electron.",
      notation: "2Na + Cl₂ → 2NaCl",
      caption:
        "The equation balances because every sodium atom lost exactly one electron and every chlorine atom gained one. The 2 in front of NaCl counts formula units, not atoms of sodium.",
    },
    {
      id: "r3",
      kind: "chemistry.equation",
      body:
        "Potassium reacts with water to form potassium hydroxide and hydrogen. The reaction is more vigorous than sodium's because potassium's outer electron is further from the nucleus and easier to remove.",
      notation: "2K + 2H₂O → 2KOH + H₂",
      caption:
        "Hydrogen is produced as a gas and potassium hydroxide stays in solution. The balanced equation shows two potassium atoms displacing one hydrogen molecule from two water molecules.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "Down group 1 the outer electron sits in a higher shell that is further from the nucleus and shielded by more inner electrons, so the attraction holding it is weaker and less energy is needed to remove it; that is why reactivity increases down the group.",
      notation: "Li 2,1 · Na 2,8,1 · K 2,8,8,1",
      caption:
        "The pattern is not that the atoms are bigger, but that the outer electron is further away and screened. Both facts point the same way: the electron is easier to lose.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Magnesium is in group 2 and chlorine is in group 7. Predict the formula of the compound they form and explain your reasoning.",
      steps: [
        {
          move:
            "State what each atom must do to reach a full outer shell: magnesium loses two electrons, and each chlorine atom gains one.",
          why:
            "Group 2 means two outer electrons, which are lost to leave the full shell below. Group 7 means seven outer electrons, so one more completes the shell.",
        },
        {
          move:
            "Balance the electrons: one magnesium losing two electrons supplies exactly what two chlorine atoms need.",
          why:
            "The compound must be electrically neutral overall, so the total positive charge must equal the total negative charge. One magnesium ion with a 2+ charge needs two chloride ions with a 1− charge each.",
        },
        {
          move: "Write the formula as MgCl₂.",
          why:
            "The subscript counts the chloride ions needed per magnesium ion. Writing MgCl would leave one electron unaccounted for and would not be neutral.",
        },
      ],
      answer: "The formula is MgCl₂, because one magnesium ion with a 2+ charge balances two chloride ions with a 1− charge.",
    },
    {
      id: "w2",
      prompt:
        "Explain why potassium reacts more vigorously with water than sodium does, even though both are in group 1.",
      steps: [
        {
          move:
            "Identify what the two elements have in common: both have one outer electron, which they lose in the reaction.",
          why:
            "The similarity is why both react at all, and it is a consequence of being in the same group. A trend question always starts from the shared property.",
        },
        {
          move:
            "Compare the shells: potassium's outer electron is in the fourth shell, while sodium's is in the third.",
          why:
            "Going down the group adds a shell, so the outer electron is further from the nucleus. That distance is the variable the trend depends on.",
        },
        {
          move:
            "Explain the consequence: the outer electron is further away and more shielded, so it is easier to remove, and potassium reacts more vigorously.",
          why:
            "Reactivity here means how readily the atom loses its outer electron. Weaker attraction means less energy is needed, so the reaction proceeds faster and releases more energy in the same time.",
        },
      ],
      answer:
        "Potassium's outer electron is in a shell further from the nucleus and is more shielded than sodium's, so it is easier to remove and potassium reacts more vigorously.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The group number tells you how many electron shells an atom has.",
      whyItFails:
        "The group number counts the outer-shell electrons; the period number counts the occupied shells. Sodium is in group 1 and period 3: it has one outer electron and three occupied shells. Reading the group as the shell count would put sodium's electron in the first shell, which contradicts its configuration of 2,8,1.",
      correction:
        "Separate the two readings: group equals outer electrons, period equals number of shells. Check both against the configuration before using either to predict a reaction.",
      contrast: {
        wrong: "sodium is in group 1, so it has one shell",
        right: "sodium is in group 1 and period 3, so it has one outer electron in the third shell",
      },
    },
    {
      id: "m2",
      belief: "All group 1 metals react in exactly the same way, so the trend does not matter.",
      whyItFails:
        "They react in the same way because they all lose one electron, but they do not react equally vigorously. The vigour increases down the group as the outer electron becomes easier to remove. Lithium fizzes steadily, sodium skates and fizzes, and potassium can ignite the hydrogen it produces.",
      correction:
        "State the shared behaviour and the trend separately: the same type of reaction, at an increasing rate down the group, for a reason that names distance and shielding.",
      contrast: {
        wrong: "they are all group 1, so they all react identically",
        right: "they all lose one electron, but the rate increases down the group as that electron gets easier to remove",
      },
    },
    {
      id: "m3",
      belief: "Noble gases are unreactive because they are rare or heavy.",
      whyItFails:
        "Rarity has nothing to do with reactivity; helium is abundant in the universe and still unreactive. The cause is the full outer shell. With no spare capacity and no tendency to lose an electron, there is no low-energy route to a bond, so the element stays as separate atoms.",
      correction:
        "Explain unreactivity from the electron configuration: a full outer shell means the atom neither needs to gain nor easily loses electrons, so it does not form bonds under ordinary conditions.",
      contrast: {
        wrong: "noble gases do not react because they are rare",
        right: "noble gases do not react because their outer shells are full",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "An element has the electron configuration 2,8,2. Identify its group and period, and predict whether it is a metal or a non-metal.",
      hint: "Count the outer electrons for the group and the occupied shells for the period.",
      answer:
        "It is in group 2 and period 3. It is a metal, because it has two outer electrons to lose rather than a nearly full shell to gain from.",
      feedback: {
        correct:
          "You read the group from the outer electrons and the period from the number of shells, then used the electron loss to identify a metal.",
        incorrect:
          "Do not count all the electrons for the group. The group comes from the outer shell only; the period comes from how many shells are occupied.",
      },
    },
    {
      id: "p2",
      prompt:
        "Chlorine and bromine are both in group 7. Predict which reacts more vigorously with sodium, and explain why.",
      hint: "Going down a group, the outer shell gets further from the nucleus. For a halogen, does it need to gain or lose an electron?",
      answer:
        "Chlorine reacts more vigorously. It is above bromine in group 7, so its outer shell is closer to the nucleus and less shielded, which means it attracts an incoming electron more strongly.",
      feedback: {
        correct:
          "You applied the group 7 trend in the right direction, using the attraction for an incoming electron rather than the ease of losing one.",
        incorrect:
          "Check the direction: group 7 reactivity decreases down the group. The atom needs to gain an electron, so a smaller, less shielded atom does it more strongly.",
      },
    },
    {
      id: "p3",
      prompt:
        "Calcium is in group 2 and oxygen is in group 6. Predict the formula of calcium oxide and explain the electron transfer.",
      hint: "Calcium loses two electrons and oxygen needs two to complete its outer shell.",
      answer:
        "The formula is CaO, because one calcium atom loses two electrons and one oxygen atom gains two, so one of each is needed.",
      feedback: {
        correct:
          "You matched the two electrons lost with the two electrons gained, which is what makes the formula neutral.",
        incorrect:
          "Do not assume the formula needs subscripts. Count the electrons each atom loses or gains first; here they already match one to one.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why sodium and potassium both react with water, and why potassium reacts more vigorously. Refer to electron configuration in your answer.",
      modelAnswer:
        "Both are in group 1, so both have one electron in their outer shell, which they lose to form a 1+ ion with a full shell below. That is why they react in the same way. Potassium's outer electron is in the fourth shell while sodium's is in the third, so potassium's outer electron is further from the nucleus and shielded by more inner electrons. The attraction is weaker, so less energy is needed to remove the electron, and potassium reacts more vigorously.",
      marking: [
        "States that both have one outer electron because both are in group 1.",
        "Connects the shared outer electron to the same type of reaction.",
        "Compares the shells: potassium's outer electron is further from the nucleus.",
        "Explains weaker attraction and easier electron loss as the cause of greater vigour.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Calcium is in group 2 and chlorine is in group 7. Predict the formula of calcium chloride and explain your reasoning.",
      modelAnswer:
        "Calcium loses two electrons and each chlorine gains one, so two chloride ions are needed for every calcium ion and the formula is CaCl₂.",
      marking: [
        "States that calcium loses two electrons and chlorine gains one.",
        "Balances the charges to give two chloride ions per calcium ion and the formula CaCl₂.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "An element has the electron configuration 2,8,7. Which group is it in?",
      modelAnswer: "group 7",
      marking: [
        "Answers group 7.",
        "Gives the outer-shell count as the reason.",
      ],
      check: {
        accepted: ["group 7", "7", "group VII", "VII", "group seven"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Argon has a greater relative atomic mass than potassium, yet it is placed before potassium in the periodic table. Explain why this does not break the table's ordering, and predict one property of astatine from its position below iodine in group 7.",
      whyItTransfers:
        "The first part asks the learner to defend the ordering principle against a counter-example that looks like a failure, and the second asks for a prediction about an element the lesson never mentions. Neither can be answered by recalling a fact about sodium or chlorine.",
      answer:
        "The table is ordered by proton number, not by relative atomic mass. Argon has 18 protons and potassium has 19, so argon comes first even though its atoms are slightly heavier; ordering by proton number keeps the repeating chemical pattern without exceptions. Astatine is below iodine in group 7, so it should be less reactive than iodine, because its outer shell is further from the nucleus and more shielded, making it a weaker attractor of an incoming electron.",
      marking: [
        "States that the ordering is by proton number and gives the proton counts that place argon first.",
        "Explains that proton number preserves the repeating pattern.",
        "Predicts that astatine is less reactive than iodine.",
        "Justifies the prediction with distance and shielding of the outer shell.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between a group and a period in the periodic table?",
      answer:
        "A group is a column of elements with the same number of outer-shell electrons; a period is a row with the same number of occupied shells.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does reactivity decrease down group 7?",
      answer:
        "The atoms get larger, so an incoming electron is further from the nucleus and more shielded, and is attracted less strongly.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why the formula of magnesium oxide is MgO even though magnesium is in group 2 and oxygen in group 6.",
      answer:
        "Magnesium loses two electrons and oxygen gains two, so one ion of each balances the charge and no subscripts are needed.",
      when: "month-later",
    },
  ],

  summary: [
    "The table is ordered by proton number; the repeating pattern comes from repeating outer-electron arrangements.",
    "Group equals outer-shell electrons and period equals occupied shells, which is why position predicts chemistry.",
    "Group 1 reactivity increases down the group and group 7 reactivity decreases, both explained by distance and shielding.",
    "An ionic formula balances the electrons lost by the metal against those gained by the non-metal.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every electron configuration is read aloud as a list of shell counts, and group and period are stated in words before any notation is shown.",
    },
    {
      need: "colour-vision",
      alternative:
        "Groups and periods are labelled in text rather than distinguished by colour, so the table's structure does not depend on shading.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each trend is presented as the same three-part chain — what changes, why the attraction changes, what the reactivity does — so the reasoning can be followed in order.",
    },
    {
      need: "low-vision",
      alternative:
        "Chemical formulae are set in a font size at least as large as body text, with subscripts rendered as real subscripts rather than relying on position alone.",
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
      authoredAt: "2026-11-07",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
