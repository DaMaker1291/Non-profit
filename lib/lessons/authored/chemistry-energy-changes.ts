import type { AuthoredLesson } from "../../lesson-contract";

// ENERGY CHANGES IS TWO ACCOUNTINGS THAT MUST AGREE.
//
// The first is the bond ledger: breaking bonds costs energy, making bonds pays
// it back, and the sign of ΔH says which side was larger. The second is the
// calorimeter: q = m c ΔT measures the heat the surroundings gained or lost,
// and dividing by the amount that reacted turns that heat into a molar change.
// The lesson keeps them separate before joining them, because the commonest
// error is not arithmetic — it is reporting q as though it were ΔH per mole, or
// saying that a reaction which feels hot must have released energy when its
// bonds broke.
//
// The reaction profile is the third representation: a barrier (activation
// energy) and a difference between levels (ΔH) are not the same height, and a
// catalyst changes only the first. A learner who can say which quantity the
// question is asking about can read the diagram instead of guessing from it.
export const CHEMISTRY_ENERGY_CHANGES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "energy-changes",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, energy changes: exothermic and endothermic reactions, bond energies, reaction profiles and calorimetry",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content for energy changes. All explanations, examples, practice items and assessments are original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Classify a reaction as exothermic or endothermic from its temperature change and the sign of its enthalpy change.",
      evidence:
        "For a hand warmer, a cold pack and the combustion of methane, the learner states whether the surroundings warm or cool, gives the sign of ΔH, and explains that the sign describes the system rather than the thermometer.",
    },
    {
      statement:
        "Calculate the enthalpy change of a reaction from bond enthalpies and explain why the answer is an estimate.",
      evidence:
        "For H₂ + Cl₂ → 2HCl, the learner adds the bonds broken (436 + 243 = 679), adds the bonds formed (2 × 432 = 864), reports ΔH = −185 kJ/mol and says that average bond enthalpies make the result approximate.",
    },
    {
      statement:
        "Use q = m c ΔT to calculate the heat exchanged in a calorimetry experiment, then convert it to an enthalpy change per mole.",
      evidence:
        "The learner calculates q for a stated mass and temperature rise, converts joules to kilojoules, divides by the amount that reacted, and assigns the sign from whether the water warmed or cooled.",
    },
    {
      statement:
        "Distinguish activation energy from enthalpy change on a reaction profile and explain what a catalyst changes.",
      evidence:
        "The learner marks Eₐ as the climb from reactants to the peak and ΔH as the difference between the reactant and product levels, then states that a catalyst lowers Eₐ without moving either level.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["rates-reaction", "energy-conservation"],
    check: [
      {
        id: "d1",
        question:
          "Why does a mixture of hydrogen and oxygen not react at room temperature, even though the reaction releases a great deal of energy?",
        answer:
          "The molecules must collide with enough energy to break the bonds that have to break before new bonds can form. At room temperature very few collisions have that energy, so the reaction is extremely slow despite being energetically favourable.",
        targets: ["rates-reaction"],
      },
      {
        id: "d2",
        question:
          "A ball falls and hits the floor, then stops. Has its energy been destroyed? Explain what happened to it.",
        answer:
          "No. The ball's kinetic store emptied, and the energy was transferred to the thermal store of the ball, floor and air, and to sound. The total energy of the wider system is unchanged.",
        targets: ["energy-conservation"],
      },
    ],
  },

  introduction: {
    hook:
      "Open a hand warmer and it becomes hot; crack the seal on a cold pack and it becomes cold. Both are chemical reactions, and neither is plugged in. The difference is which way the energy went: the hand warmer's products hold less enthalpy than its reactants, so the difference leaves as heat, while the cold pack's products hold more, so the difference is taken from your hand.",
    why:
      "Energy changes are how chemistry pays for itself. A fuel is useful because its combustion releases energy; a cold pack is useful because dissolving a salt absorbs it. The same accounting explains why a reaction profile has a hill before it has a slope, why a catalyst can make a reaction faster without making it release more energy, and why a calorimetry experiment reports a temperature rise that must be divided by the amount that actually reacted. None of those questions can be answered by memorising one definition of exothermic.",
  },

  explanation: [
    {
      heading: "The sign of ΔH says which way the energy went",
      paragraphs: [
        "Enthalpy is the energy a system holds at constant pressure. A reaction changes that holding: the products may sit at a lower enthalpy than the reactants, or at a higher one. ΔH is the difference, measured as products minus reactants. When the products hold less, the difference is negative and the reaction is exothermic; the energy that left the system warms the surroundings. When the products hold more, ΔH is positive and the reaction is endothermic, taking energy from the surroundings and cooling them.",
        "The thermometer reads the surroundings, not the system, which is why the sign can feel backwards. An exothermic reaction has a negative ΔH but makes the solution warmer; an endothermic reaction has a positive ΔH but makes it colder. A reaction that feels neither hot nor cold is not necessarily a reaction with no energy change: the enthalpy change may be small, or the reaction may be slow enough that the heat is lost as quickly as it is produced.",
      ],
    },
    {
      heading: "Breaking bonds costs energy; making bonds pays it back",
      paragraphs: [
        "A covalent bond is a stable arrangement of shared electrons. Pulling the atoms apart requires energy, so every bond broken in the reactants is a cost. Forming a new bond releases energy, so every bond made in the products is a payment. A reaction is exothermic when the payments exceed the costs. It is not that breaking a bond releases energy; it is that the overall ledger has more coming in than going out.",
        "Bond enthalpies are averages measured for a particular bond in the gaseous state, so the total is an estimate rather than a precise value. The same O–H bond has slightly different enthalpies in water and in an alcohol, and the tabulated value is an average across many compounds. The method therefore predicts the sign and approximate size of ΔH well, but it cannot replace a calorimeter when an accurate value is needed. The calculation also assumes every bond listed actually breaks, which is true for the atoms but not always for the mechanism.",
      ],
    },
    {
      heading: "Calorimetry measures the heat, then the mole divides it",
      paragraphs: [
        "A calorimetry experiment lets the reaction heat or cool a known mass of water. The energy exchanged is the mass of water multiplied by its specific heat capacity and by the temperature change. Specific heat capacity is the energy needed to raise one gram of a substance by one degree Celsius; for water it is about 4.18 joules per gram per degree. The result, q, is the heat for the amount that actually reacted in that experiment, not for a whole mole.",
        "To report an enthalpy change per mole, divide q by the number of moles that reacted. Convert joules to kilojoules first if the answer is to be in kilojoules per mole, then choose the sign from the direction of the temperature change: the water warming means the reaction released heat, so ΔH is negative. The division is where many answers go wrong, because q itself is a total energy and has no per-mole meaning until it is divided by the amount.",
      ],
    },
    {
      heading: "A profile shows a barrier and a difference",
      paragraphs: [
        "A reaction profile plots energy against the progress of the reaction. Reactants sit at one level, products at another, and between them is a peak. The climb from the reactants to the peak is the activation energy, the minimum energy colliding particles need for the reaction to begin. The difference between the reactant and product levels is ΔH. These are two different heights, and confusing them is the error the diagram is best at exposing.",
        "A catalyst provides an alternative route with a lower peak, so more collisions have enough energy and the rate increases. It does not move the reactant or product levels, so ΔH is unchanged. For an exothermic reaction the products sit below the reactants; for an endothermic reaction they sit above. The profile is schematic: it shows the barrier and the difference, not the several steps a real mechanism may contain.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.equation",
      body:
        "The balanced equation fixes how many bonds are broken and how many are formed. One hydrogen molecule and one chlorine molecule break three bonds in total; two hydrogen chloride molecules form two new bonds.",
      notation: "H₂ + Cl₂ → 2HCl",
      caption:
        "The equation is balanced: two hydrogen atoms and two chlorine atoms on each side. Using H–H 436, Cl–Cl 243 and H–Cl 432 kJ/mol gives ΔH = 679 − 864 = −185 kJ/mol.",
    },
    {
      id: "r2",
      kind: "chemistry.calculation",
      body:
        "The calorimetry equation counts the heat gained by the water. The mass must be in grams, the specific heat capacity in joules per gram per degree, and the temperature change in degrees Celsius; the result is in joules.",
      notation: "q = m × c × ΔT",
      caption:
        "For 100 g of water warmed by 6.8 °C, q = 100 × 4.18 × 6.8 = 2842.4 J. This is the heat for the amount that reacted, not yet an enthalpy change per mole.",
    },
    {
      id: "r3",
      kind: "chemistry.particle-model",
      body:
        "At the peak, the colliding particles have enough energy for the old bonds to begin breaking. The peak is a transition state, not a stable product. Particles that do not reach it bounce apart unchanged, which is why a reaction can be energetically favourable and still slow.",
      notation: "reactants → transition state → products",
      caption:
        "The barrier is the activation energy; the difference between the reactant and product levels is ΔH. A catalyst lowers the barrier, not the difference.",
    },
    {
      id: "r4",
      kind: "chemistry.formula",
      body:
        "The bond ledger is a subtraction, and the order matters. Add every bond broken in the reactants, add every bond formed in the products, then subtract the second total from the first. A negative result means the bonds formed released more than the bonds broken absorbed.",
      notation: "ΔH = Σ(bonds broken) − Σ(bonds formed)",
      caption:
        "For H₂ + Cl₂ → 2HCl: 679 − 864 = −185 kJ/mol. The answer is an estimate because the bond enthalpies are averages, not values for this one reaction.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Calculate ΔH for H₂ + Cl₂ → 2HCl using H–H 436, Cl–Cl 243 and H–Cl 432 kJ/mol. State whether the reaction is exothermic or endothermic.",
      steps: [
        {
          move: "List the bonds broken in the reactants: one H–H and one Cl–Cl.",
          why:
            "Bond breaking is the energy cost, so every reactant bond that breaks must be counted before any product bond is considered.",
        },
        {
          move: "Add the bond enthalpies: 436 + 243 = 679 kJ/mol absorbed.",
          why:
            "These values are averages for the gaseous bonds, so the total estimates the energy needed to separate the reactants into atoms.",
        },
        {
          move: "List and add the bonds formed: two H–Cl bonds, so 2 × 432 = 864 kJ/mol released.",
          why:
            "Two H–Cl bonds form because the balanced equation produces two molecules of hydrogen chloride, not one.",
        },
        {
          move: "Subtract the energy released from the energy absorbed: ΔH = 679 − 864 = −185 kJ/mol.",
          why:
            "A negative result means the energy released by forming bonds exceeds the energy absorbed by breaking bonds, so the reaction is exothermic.",
        },
      ],
      answer: "ΔH = −185 kJ/mol, so the reaction is exothermic.",
    },
    {
      id: "w2",
      prompt:
        "A reaction raises the temperature of 100 g of water by 6.8 °C. The amount reacting is 0.0500 mol. Taking c = 4.18 J/g °C, calculate ΔH per mole.",
      steps: [
        {
          move: "Calculate the heat gained by the water: q = 100 × 4.18 × 6.8 = 2842.4 J.",
          why:
            "The water's mass, specific heat capacity and temperature rise give the energy it absorbed, measured in joules.",
        },
        {
          move: "Convert the heat to kilojoules: 2842.4 ÷ 1000 = 2.8424 kJ.",
          why:
            "Enthalpy changes per mole are conventionally reported in kilojoules per mole, so the joule value must be converted first.",
        },
        {
          move: "Divide by the amount reacting: 2.8424 ÷ 0.0500 = 56.848 kJ/mol.",
          why:
            "The experiment measured the heat for 0.0500 mol, not for a whole mole, so the total must be scaled to one mole.",
        },
        {
          move: "Choose the sign: the water warmed, so the reaction released heat and ΔH = −56.8 kJ/mol.",
          why:
            "The thermometer measures the surroundings, so a temperature rise means the system lost enthalpy to them.",
        },
      ],
      answer: "ΔH = −56.8 kJ/mol, so the reaction is exothermic.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Breaking bonds releases energy, because a burning fuel gives out heat.",
      whyItFails:
        "Breaking any bond requires an input of energy; a bond is a stable arrangement, and pulling it apart costs. A fuel burns exothermically because the bonds formed in carbon dioxide and water release more energy than the bonds broken in the fuel and oxygen absorbed. The heat comes from the difference, not from the breaking.",
      correction:
        "Write the ledger in two lines: bonds broken are a cost, bonds formed are a payment. The sign of ΔH is the sign of payments minus costs.",
      contrast: {
        wrong: "the bonds in the fuel break and release the heat",
        right:
          "breaking the fuel's bonds costs energy; forming carbon dioxide and water releases more, so the difference leaves as heat",
      },
    },
    {
      id: "m2",
      belief: "An exothermic reaction has a positive ΔH because the temperature rises.",
      whyItFails:
        "The sign of ΔH describes the system, while the temperature describes the surroundings. In an exothermic reaction the system loses enthalpy to the surroundings, so ΔH is negative even though the thermometer reading rises. An endothermic reaction has a positive ΔH and cools the surroundings.",
      correction:
        "Decide the sign from the direction of the energy transfer, not from the thermometer's direction. Exothermic: energy leaves the system, ΔH is negative.",
      contrast: {
        wrong: "the mixture got hotter, so ΔH must be positive",
        right:
          "the mixture got hotter because the system released enthalpy, so ΔH is negative",
      },
    },
    {
      id: "m3",
      belief: "The q calculated from m c ΔT is already the enthalpy change per mole.",
      whyItFails:
        "q is the heat exchanged for the amount that actually reacted in that experiment, measured in joules. Enthalpy per mole needs q divided by the number of moles, converted to kilojoules per mole, with the sign taken from the temperature change. Reporting q alone gives a total energy, and its size depends on how much you happened to use.",
      correction:
        "Carry the units: q is in joules, n is in moles, and q ÷ n is in joules per mole. Convert to kilojoules per mole only after the division.",
      contrast: {
        wrong: "q = 2842.4 J, so ΔH = 2842.4 kJ/mol",
        right:
          "q = 2842.4 J for 0.0500 mol, so ΔH = −2.8424 ÷ 0.0500 = −56.8 kJ/mol",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Use bond enthalpies to calculate ΔH for N₂ + 3H₂ → 2NH₃. N≡N 945, H–H 436 and N–H 391 kJ/mol.",
      hint:
        "Count three H–H bonds broken and six N–H bonds formed; the coefficients in the balanced equation decide both counts.",
      answer:
        "Bonds broken = 945 + 3 × 436 = 2253 kJ/mol. Bonds formed = 6 × 391 = 2346 kJ/mol. ΔH = 2253 − 2346 = −93 kJ/mol, so the reaction is exothermic.",
      feedback: {
        correct:
          "Correct. The six N–H bonds come from two NH₃ molecules, each with three N–H bonds; the negative sign means the bonds formed released more than the bonds broken absorbed.",
        incorrect:
          "Check the counts: three H–H bonds break, and two NH₃ molecules form six N–H bonds. Then subtract bonds formed from bonds broken.",
      },
    },
    {
      id: "p2",
      prompt:
        "25.0 cm³ of 1.00 mol/dm³ hydrochloric acid is neutralised by excess sodium hydroxide. The temperature rises by 6.5 °C. Calculate q, then ΔH per mole of water formed. Assume the solution has the density and specific heat capacity of water.",
      hint:
        "25.0 cm³ of solution is about 25.0 g. Convert the volume to dm³ before finding the moles: 25.0 cm³ = 0.0250 dm³.",
      answer:
        "q = 25.0 × 4.18 × 6.5 = 679.25 J = 0.679 kJ. Moles of acid = 1.00 × 0.0250 = 0.0250 mol, and each mole of acid forms one mole of water. ΔH = −0.679 ÷ 0.0250 = −27.2 kJ/mol.",
      feedback: {
        correct:
          "Correct. The sign is negative because the temperature rose, and the division by 0.0250 mol is what turns the measured heat into a molar enthalpy change.",
        incorrect:
          "Two checks: 25.0 cm³ is 0.0250 dm³, not 25 dm³; and q must be divided by the moles before it is called ΔH per mole.",
      },
    },
    {
      id: "p3",
      prompt:
        "An exothermic reaction has reactants at 120 kJ/mol and products at 50 kJ/mol. The peak of its profile is at 270 kJ/mol. State the activation energy and ΔH, then explain what a catalyst changes and what it does not change.",
      hint:
        "Eₐ is the climb from the reactants to the peak; ΔH is the products' level minus the reactants' level.",
      answer:
        "Eₐ = 270 − 120 = 150 kJ/mol. ΔH = 50 − 120 = −70 kJ/mol. A catalyst lowers the peak, so Eₐ falls, but it does not move the reactant or product levels, so ΔH stays at −70 kJ/mol.",
      feedback: {
        correct:
          "Correct. The barrier is measured from the reactants, while ΔH is measured between the two levels, which is why a catalyst can change one without changing the other.",
        incorrect:
          "Eₐ is the climb from the reactants to the peak (150 kJ/mol), not the peak's height above zero; ΔH is products minus reactants, so 50 − 120 = −70 kJ/mol.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Calculate ΔH for H₂ + Br₂ → 2HBr using H–H 436, Br–Br 193 and H–Br 366 kJ/mol.",
      modelAnswer: "ΔH = −103 kJ/mol",
      marking: [
        "Adds the bonds broken: 436 + 193 = 629 kJ/mol.",
        "Adds the bonds formed: 2 × 366 = 732 kJ/mol, then reports 629 − 732 = −103 kJ/mol.",
      ],
      check: {
        accepted: [
          "−103 kJ/mol",
          "-103 kJ/mol",
          "ΔH = −103 kJ/mol",
          "ΔH = -103 kJ/mol",
          "−103",
          "-103",
        ],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A reaction raises the temperature of 50.0 g of water by 4.0 °C. Calculate the heat gained by the water. Take c = 4.18 J/g °C.",
      modelAnswer: "836 J",
      marking: [
        "Uses q = m c ΔT with the mass in grams and the temperature change in degrees.",
        "Reports 50.0 × 4.18 × 4.0 = 836 J with the unit.",
      ],
      check: {
        accepted: ["836 J", "836", "0.836 kJ"],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "A catalyst makes a reaction faster, but the enthalpy change measured with and without the catalyst is the same. Explain why both statements are true.",
      modelAnswer:
        "A catalyst provides an alternative reaction route with a lower activation energy, so a larger fraction of collisions has enough energy to react and the rate increases. It does not change the energy of the reactants or the products. ΔH is the difference between those two levels, so it is unchanged: the catalyst lowers the barrier between them, not the levels themselves. The catalyst is also not used up, so it can repeat the same alternative route many times.",
      marking: [
        "Explains that a catalyst lowers the activation energy by providing an alternative route.",
        "Links the lower barrier to a larger fraction of successful collisions and therefore a faster rate.",
        "States that the reactant and product energy levels, and therefore ΔH, are unchanged.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A cold pack contains solid ammonium nitrate separated from water by a seal. When the seal is broken, the salt dissolves and the pack becomes cold. Explain, using ΔH and the surroundings, why the pack cools, and predict the sign of ΔH for the dissolving.",
      whyItTransfers:
        "The lesson used a reaction between two chemicals. Here the process is dissolving, and the learner must transfer the same system-versus-surroundings accounting to a physical change rather than a reaction, then choose the sign from the direction of the energy transfer.",
      answer:
        "Dissolving ammonium nitrate is endothermic: the process takes in more energy than it releases. The system (the salt and water) gains enthalpy, so ΔH is positive. That energy comes from the surroundings, including the water and the pack, so their thermal energy falls and the pack feels cold. Energy has not been destroyed; it has moved from the surroundings into the system. The pack is useful because the cold sensation lasts while the salt continues to dissolve.",
      marking: [
        "Identifies the process as endothermic and gives ΔH a positive sign.",
        "Explains that energy is taken from the surroundings, lowering their temperature.",
        "Uses conservation of energy rather than saying the cold is created or that energy disappears.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State the relationship between bond breaking, bond making and the sign of ΔH.",
      answer:
        "Breaking bonds absorbs energy and making bonds releases it. ΔH is the energy absorbed minus the energy released; a negative ΔH means more was released than absorbed, so the reaction is exothermic.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A reaction raises the temperature of 150 g of water by 10.0 °C. Taking c = 4.18 J/g °C, calculate the heat gained by the water.",
      answer: "q = 150 × 4.18 × 10.0 = 6270 J, or 6.27 kJ.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why the activation energy on a reaction profile is not the same quantity as ΔH.",
      answer:
        "Activation energy is the height from the reactants to the peak, the barrier a collision must clear. ΔH is the difference between the reactant and product levels. A catalyst can lower the barrier without changing ΔH.",
      when: "month-later",
    },
  ],

  summary: [
    "ΔH is products' enthalpy minus reactants' enthalpy: negative for exothermic, positive for endothermic.",
    "Breaking bonds costs energy and making bonds releases it, so ΔH = bonds broken − bonds formed; average bond enthalpies make the result an estimate.",
    "Calorimetry gives q = m c ΔT for the amount that reacted; divide by the moles and convert to kilojoules per mole to report ΔH.",
    "On a reaction profile, Eₐ is the barrier from reactants to the peak and ΔH is the difference between reactant and product levels; a catalyst changes only the barrier.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every equation and calculation is also stated in words, and the reaction profile is described as an ordered list of levels and heights rather than as a coloured curve.",
    },
    {
      need: "colour-vision",
      alternative:
        "Exothermic and endothermic are labelled with words and signs, not distinguished by colour alone; the profile's peak and levels carry text labels.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation follows the same four-line pattern: the relationship, the substitution with units, the result in kilojoules, and the sign with its reason.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no diagram has to be dragged, drawn or resized to complete the lesson.",
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
        "All explanations, examples, practice items, assessments and the reaction-profile description are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE chemistry subject content for energy changes.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-10",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
