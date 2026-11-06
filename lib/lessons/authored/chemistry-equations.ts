import type { AuthoredLesson } from "../../lesson-contract";

// One representative Chemistry lesson, authored to openmind.lesson/1.0.
//
// WHY THIS CONCEPT. A balanced equation is the point where a learner stops
// describing a reaction and starts predicting it. The skill it replaces —
// "copy the formula and adjust the numbers until it looks balanced" — produces
// correct-looking equations about substances that do not exist.
export const CHEMISTRY_EQUATIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "equations-stoich",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference: "GCSE Chemistry, quantitative chemistry: chemical equations and the mole",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Balance a symbol equation by changing coefficients only, and explain why a subscript may never be changed.",
      evidence:
        "Given propane burning, the learner writes C₃H₈ + 5O₂ → 3CO₂ + 4H₂O and says that changing H₂O to H₂O₂ would have invented a different substance rather than balanced the same reaction.",
    },
    {
      statement:
        "Read a balanced equation as a ratio of amounts in moles, not as a recipe in grams.",
      evidence:
        "The learner states that two moles of hydrogen produce two moles of water, and that the ratio is two to two regardless of how many grams are used.",
    },
    {
      statement:
        "Calculate the mass of a product from the mass of a reactant using relative formula mass and the mole ratio.",
      evidence:
        "From 4.4 g of propane the learner finds 0.1 mol, scales to 0.4 mol of water by the ratio, and answers 7.2 g rather than 4.4 g doubled.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements", "linear-equations"],
    check: [
      {
        id: "d1",
        question: "In a chemical reaction, what happens to the atoms?",
        answer:
          "They are rearranged into new combinations. No atom is created or destroyed, which is why the number of each element must match on both sides of an equation.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question: "Solve 3x = 12 for x, and say what you did to both sides.",
        answer: "x = 4, because both sides were divided by three.",
        targets: ["linear-equations"],
      },
    ],
  },

  introduction: {
    hook:
      "A gas hob burns methane with a clean blue flame. A faulty boiler burns the same methane with a yellow flame and produces a gas that kills people in their sleep. Same fuel, same air supply in principle — and a different product, because the amount of oxygen that actually reached the flame changed.",
    why:
      "Chemistry's central bookkeeping claim is that atoms are never created or destroyed in a reaction, only rearranged. That claim is what an equation has to record. Once the record is correct, it also tells you how much of each substance is needed and produced — which is how a factory, a boiler or a lung knows whether it has enough oxygen.",
  },

  explanation: [
    {
      heading: "An equation is a conservation statement, not a description",
      paragraphs: [
        "A balanced symbol equation records that the same atoms appear before and after a reaction, in the same numbers, arranged differently. Methane burning is written CH₄ plus two O₂ giving CO₂ plus two H₂O. One carbon, four hydrogen and four oxygen appear on each side; the only thing that changed is which atoms are joined to which.",
        "That is why an equation can be checked without knowing anything about the reaction's mechanism. Count each element on both sides. If a count differs, the equation describes a process that would create or destroy matter, and no such process exists.",
      ],
    },
    {
      heading: "Coefficients change the amount; subscripts change the substance",
      paragraphs: [
        "The number written in front of a formula is a coefficient, and it multiplies the whole species: two O₂ means four oxygen atoms. The small number inside a formula is a subscript, and it is part of the substance's identity. H₂O is water; H₂O₂ is hydrogen peroxide, a bleach. Changing a subscript to make the counts match does not balance the reaction — it answers a question nobody asked, about a different chemical.",
        "So the only permitted move is to place or change coefficients until every element's count matches. This is algebra with atoms: you are finding whole-number multipliers, and the smallest whole-number set is the conventional answer.",
      ],
    },
    {
      heading: "A balanced equation is a ratio of amounts",
      paragraphs: [
        "The coefficients do not only balance atoms; they state the ratio in which particles react. Two H₂ plus one O₂ giving two H₂O means two molecules of hydrogen react with one molecule of oxygen to make two molecules of water, and — scaled up by Avogadro's number — two moles react with one mole to make two moles.",
        "The ratio is about amounts, not masses. One mole of oxygen molecules has a mass of thirty-two grams while one mole of hydrogen molecules has a mass of two grams, so the mass ratio is nothing like the mole ratio. Confusing the two is the most common quantitative error in the subject.",
      ],
    },
    {
      heading: "Mass, moles and the bridge between them",
      paragraphs: [
        "A mole is Avogadro's number of particles, and its mass in grams is the relative formula mass. So the bridge from a mass to an amount is: moles equal mass divided by relative formula mass. From there the equation's ratio takes you to the amount of another substance, and multiplying by that substance's relative formula mass returns you to grams.",
        "Every quantitative calculation in this topic is that same three-step journey. What changes is only the numbers. Writing the three steps down before substituting keeps the units honest and makes a wrong answer visible: if you have not divided by a relative formula mass at some point, you are still holding grams where the ratio needs moles.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.equation",
      body:
        "Methane burning completely in oxygen. One carbon, four hydrogen and four oxygen on each side.",
      notation: "CH₄ + 2O₂ → CO₂ + 2H₂O",
      caption:
        "The coefficients are the amounts. Changing the two in front of O₂ would leave oxygen unaccounted for; changing the subscript in H₂O would produce hydrogen peroxide instead of water.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "Propane burning completely. The coefficients are found by balancing carbon, then hydrogen, then oxygen last.",
      notation: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
      caption:
        "Carbon forces three CO₂, hydrogen forces four H₂O, and oxygen is left to be counted: three times two plus four times one is ten oxygen atoms, which is five O₂ molecules.",
    },
    {
      id: "r3",
      kind: "chemistry.particle-model",
      body:
        "The same reaction drawn as particles: one methane molecule and two oxygen molecules on the left; one carbon dioxide and two water molecules on the right. Every atom on the left can be traced to its place on the right.",
      notation: "1 CH₄ + 2 O₂ → 1 CO₂ + 2 H₂O (particle counts)",
      caption:
        "Nothing is created and nothing disappears; the atoms are rearranged. This is the picture the symbol equation is compressing into one line.",
    },
    {
      id: "r4",
      kind: "chemistry.calculation",
      body:
        "The three-step journey from a mass of one substance to a mass of another.",
      notation: "n = m / Mᵣ  →  ratio from the balanced equation  →  m = n × Mᵣ",
      caption:
        "Divide by relative formula mass to reach moles, apply the equation's ratio, multiply by the other relative formula mass to return to grams. Skipping the first step is the error this caption exists to prevent.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Balance the equation for propane burning: C₃H₈ + O₂ → CO₂ + H₂O.",
      steps: [
        {
          move: "Balance carbon first: three carbons on the left need three CO₂ on the right.",
          why:
            "Carbon appears in only one product, so its coefficient can be fixed without affecting anything else. Starting with an element that appears in several places makes every later step provisional.",
        },
        {
          move: "Balance hydrogen next: eight hydrogens on the left need four H₂O, because each water molecule has two.",
          why:
            "Four water molecules hold eight hydrogen atoms. Hydrogen also appears in only one product, so this coefficient is now fixed too.",
        },
        {
          move: "Count oxygen last: three CO₂ hold six oxygen atoms and four H₂O hold four, so ten are needed, which is five O₂.",
          why:
            "Oxygen appears in both products, so it can only be counted once the other coefficients are settled. Five O₂ supplies ten atoms, which matches the right-hand side exactly.",
        },
      ],
      answer: "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O",
    },
    {
      id: "w2",
      prompt:
        "What mass of water is produced when 4.4 g of propane burns completely? The relative formula mass of propane is 44 and of water is 18.",
      steps: [
        {
          move: "Convert the mass of propane to moles: 4.4 divided by 44 is 0.1 mol.",
          why:
            "The equation's ratio is a ratio of amounts, not of grams, so the first job is always to reach moles. Dividing by the relative formula mass is the only route from grams.",
        },
        {
          move: "Use the ratio from the balanced equation: one mole of propane gives four moles of water, so 0.1 mol gives 0.4 mol.",
          why:
            "The coefficient of water is four and of propane is one, so every mole of propane produces four moles of water. The ratio is independent of how much you start with.",
        },
        {
          move: "Convert back to mass: 0.4 mol times 18 is 7.2 g.",
          why:
            "Moles times relative formula mass gives grams. Multiplying the original 4.4 g by four would have been wrong, because four is a ratio of amounts and water molecules are lighter than propane molecules.",
        },
      ],
      answer: "7.2 g of water",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "You balance an equation by changing the small numbers inside the formulas.",
      whyItFails:
        "A subscript is part of the substance's identity. Turning H₂O into H₂O₂ balances the hydrogen count and simultaneously stops describing water: hydrogen peroxide is a different compound with different properties. The equation would be balanced and false.",
      correction:
        "Balance with coefficients in front of complete formulas. The formula is fixed by the substance; only how many of it you have is yours to choose.",
      contrast: {
        wrong: "CH₄ + O₂ → CO₂ + H₂O₂ (balanced by editing a subscript)",
        right: "CH₄ + 2O₂ → CO₂ + 2H₂O (balanced with coefficients)",
      },
    },
    {
      id: "m2",
      belief:
        "The equation is balanced if there are the same number of molecules on each side.",
      whyItFails:
        "Counting molecules is not counting atoms. One molecule of propane and five of oxygen make eight product molecules, yet the atom counts balance. The reverse error is just as easy: equal molecule counts can hide unequal atom counts, because molecules differ in size.",
      correction:
        "Count each element separately on both sides. The check is per element, never per species.",
      contrast: {
        wrong: "one molecule each side, so it balances",
        right: "one carbon, four hydrogen and four oxygen on each side, so it balances",
      },
    },
    {
      id: "m3",
      belief: "The coefficients are masses, so 4.4 g of propane gives four times as much water.",
      whyItFails:
        "The coefficients count particles, and different particles have different masses. Four moles of water have a mass of seventy-two grams while one mole of propane has a mass of forty-four, so the mass ratio is not four to one. Treating a mole ratio as a mass ratio gives an answer with the wrong size and the wrong units.",
      correction:
        "Convert to moles first, apply the ratio, then convert back to mass. The three steps are not optional; each one changes the currency you are holding.",
      contrast: {
        wrong: "4.4 g × 4 = 17.6 g of water",
        right: "4.4 g → 0.1 mol → 0.4 mol → 7.2 g of water",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Balance: H₂ + O₂ → H₂O.",
      hint:
        "Count the oxygen atoms on the left first: there are two in one O₂ molecule, so the right-hand side needs to supply two as well.",
      answer: "2H₂ + O₂ → 2H₂O",
      feedback: {
        correct:
          "Two water molecules account for both oxygen atoms, and four hydrogen atoms on the right are matched by two H₂ on the left.",
        incorrect:
          "If you wrote H₂ + O₂ → H₂O, the oxygen count is two on the left and one on the right. Only coefficients may change.",
      },
    },
    {
      id: "p2",
      prompt: "How many moles of water are produced when 4 mol of hydrogen burns in excess oxygen?",
      hint: "Use the balanced equation 2H₂ + O₂ → 2H₂O and compare the coefficients of hydrogen and water.",
      answer: "4 mol of water",
      feedback: {
        correct:
          "The coefficients of hydrogen and water are both two, so the ratio is one to one and four moles give four moles.",
        incorrect:
          "If you answered eight, you multiplied by the coefficient instead of using the ratio. The coefficient tells you the proportion, not a multiplier to apply twice.",
      },
    },
    {
      id: "p3",
      prompt:
        "What mass of carbon dioxide is produced when 12 g of carbon burns completely? The relative formula mass of carbon dioxide is 44.",
      hint:
        "Carbon is 12 g per mole. Find the moles of carbon, then use C + O₂ → CO₂ for the ratio.",
      answer: "44 g of carbon dioxide",
      feedback: {
        correct:
          "Twelve grams of carbon is one mole, the ratio is one to one, and one mole of carbon dioxide has a mass of forty-four grams.",
        incorrect:
          "Check whether you added the mass of oxygen to the mass of carbon by accident and then also multiplied. The route is grams to moles, ratio, moles to grams.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A learner balances methane burning as CH₄ + O₂ → CO₂ + H₂O₂. Explain why this is not a correct balanced equation, even though the hydrogen and oxygen counts now match.",
      modelAnswer:
        "Changing the subscript in water turns it into hydrogen peroxide, which is a different substance. Balancing must not change which chemicals are present, so the formula has to stay H₂O and the coefficient in front of it must be increased to two instead. The corrected equation is CH₄ + 2O₂ → CO₂ + 2H₂O.",
      marking: [
        "States that a subscript is part of the substance's identity and H₂O₂ is a different compound.",
        "States that only coefficients may be changed when balancing.",
        "Gives the correct balanced equation with the coefficient two in front of H₂O and O₂.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "8.8 g of propane burns completely. What mass of carbon dioxide is produced? The relative formula mass of propane is 44 and of carbon dioxide is 44.",
      modelAnswer:
        "8.8 g of propane is 0.2 mol. The equation C₃H₈ + 5O₂ → 3CO₂ + 4H₂O gives three moles of carbon dioxide per mole of propane, so 0.6 mol of carbon dioxide is produced. At 44 g per mole that is 26.4 g.",
      marking: [
        "Converts the mass of propane to moles by dividing by 44.",
        "Uses the coefficient ratio of three to one from the balanced equation.",
        "Converts the moles of carbon dioxide back to a mass and states the unit.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "In a poorly ventilated room a heater burns methane with a limited supply of air, producing carbon monoxide and water rather than carbon dioxide and water. Write a balanced equation for the incomplete combustion of methane to carbon monoxide, and explain why the same fuel can give two different products.",
      whyItTransfers:
        "The learner must construct an equation for a reaction not shown in the lesson, and explain a change of product in terms of a changed reactant amount. It is the same conservation reasoning applied to an unfamiliar case, which is exactly what combustion safety requires.",
      answer:
        "2CH₄ + 3O₂ → 2CO + 4H₂O. With less oxygen available, each carbon can only reach carbon monoxide rather than carbon dioxide, so the products differ while the atoms are still conserved.",
      marking: [
        "Gives a balanced equation with the same number of each element on both sides.",
        "States that the products depend on how much oxygen is available.",
        "Explains the difference in terms of the oxygen supply, not in terms of the fuel changing.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Balance: Fe + O₂ → Fe₂O₃.",
      answer: "4Fe + 3O₂ → 2Fe₂O₃",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why the coefficients in a balanced equation cannot be used as a mass ratio.",
      answer:
        "They count particles or moles, and different particles have different masses, so the mass ratio differs from the mole ratio unless the substances happen to have equal relative formula mass.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "24 g of magnesium burns in oxygen. What mass of magnesium oxide forms? Magnesium is 24 and magnesium oxide is 40.",
      answer: "One mole of magnesium gives one mole of magnesium oxide, so 40 g.",
      when: "month-later",
    },
  ],

  summary: [
    "An equation balances atoms because atoms are conserved in a reaction.",
    "Coefficients change the amount; subscripts change the substance.",
    "A balanced equation is a ratio of amounts in moles, not a ratio of masses.",
    "Quantitative work is three steps: mass to moles, ratio, moles to mass.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Formulas are announced element by element with their subscripts read as words — C H four — and coefficients are announced as 'two molecules of'.",
    },
    {
      need: "low-vision",
      alternative:
        "Equations render at large size with the coefficients and subscripts visually separated, so a coefficient is never mistaken for a subscript.",
    },
    {
      need: "dyslexia",
      alternative:
        "The balancing method is given as a fixed order — carbon, then hydrogen, then oxygen — repeated in every worked example.",
    },
    {
      need: "colour-vision",
      alternative:
        "The particle model labels each atom with its symbol rather than relying on colour coding.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note: "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Scope cited against the published GCSE chemistry subject content for quantitative chemistry.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-04",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
