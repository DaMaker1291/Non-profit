import type { AuthoredLesson } from "../../lesson-contract";

// ACIDS AND BASES IS OFTEN TAUGHT AS A LIST OF FORMULAE AND A COLOUR CHART.
// That produces a learner who calls every acid dangerous, every strong acid
// concentrated, and every neutralisation neutral. This lesson starts from the
// proton transfer that defines the reaction, makes pH a logarithmic count of
// H⁺ rather than a vague colour, and keeps strength and concentration on two
// separate axes with the evidence that distinguishes them.
export const CHEMISTRY_ACIDS_BASES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "acids-bases",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, acids, bases and salts: proton transfer, pH, neutralisation, strong and weak acids",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Classify an acid as a proton donor and a base as a proton acceptor, and distinguish an alkali from a base.",
      evidence:
        "Given ammonia, sodium hydroxide and calcium carbonate, the learner places each on the acid–base axis and explains the classification by what accepts H⁺, not by whether the formula contains OH.",
    },
    {
      statement:
        "Interpret pH as a logarithmic measure of H⁺ concentration and calculate the effect of a tenfold dilution.",
      evidence:
        "The learner states that pH 3 has one hundred times the H⁺ concentration of pH 5, and that diluting a strong acid tenfold raises its pH by one unit, not by a factor of ten.",
    },
    {
      statement:
        "Predict the salt from an acid–base reaction, write a balanced equation, and separate strong from concentrated using ionisation and conductivity evidence.",
      evidence:
        "The learner writes a balanced equation for sulfuric acid and potassium hydroxide, identifies the spectator ions, and explains why 0.1 mol dm⁻³ ethanoic acid is a weaker conductor than 0.1 mol dm⁻³ hydrochloric acid.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["compounds-mixtures", "ionic-bonding"],
    check: [
      {
        id: "d1",
        question:
          "Hydrogen chloride has the formula HCl. What does that formula tell you about the ratio of atoms, and what does it not tell you about how the substance behaves in water?",
        answer:
          "It says there is one hydrogen atom for every chlorine atom. It does not say whether the bond breaks when the substance dissolves, so the formula alone does not tell you whether the solution is acidic.",
        targets: ["compounds-mixtures"],
      },
      {
        id: "d2",
        question:
          "Solid sodium chloride does not conduct electricity, but a sodium chloride solution does. Explain the difference.",
        answer:
          "In the solid, the ions are held in fixed positions and cannot move. When it dissolves, the ions separate and become mobile, so they can carry charge through the solution.",
        targets: ["ionic-bonding"],
      },
    ],
  },

  introduction: {
    hook:
      "Lemon juice, vinegar and the acid in your stomach share a property that has nothing to do with how dangerous they look: they can donate a hydrogen ion. Soap and bleach feel slippery for a different reason — they are alkaline. A swimming pool can be clear and still sting your eyes because its pH is wrong, and a bottle labelled 'strong acid' can be less acidic than a concentrated weak acid if it is very dilute.",
    why:
      "Proton transfer explains why an antacid settles a stomach, why limestone raises the pH of a lake, and why a titration can find an unknown concentration. The pH scale compresses a huge range of H⁺ concentrations into small numbers, which is useful only if you remember that each step is a factor of ten. And the distinction between strong and concentrated is a safety distinction as well as a chemical one: it tells you whether the danger comes from complete ionisation or from how much acid is present.",
  },

  explanation: [
    {
      heading: "An acid donates a proton; a base accepts one",
      paragraphs: [
        "In aqueous solution, an acid releases hydrogen ions, H⁺. A hydrogen ion is a proton, so the modern definition is broader than 'contains H': an acid is a proton donor. Hydrogen chloride ionises completely in water, HCl → H⁺ + Cl⁻, and nitric acid behaves in the same way. A base is a proton acceptor. Hydroxide ions accept H⁺ to form water, OH⁻ + H⁺ → H₂O, which is why soluble hydroxides such as sodium hydroxide are alkaline. Ammonia is also a base: NH₃ + H⁺ → NH₄⁺, even though its formula contains no OH.",
        "An alkali is a base that dissolves in water. All alkalis are bases, but not all bases are alkalis: copper(II) oxide and calcium carbonate are bases that do not dissolve to give an alkaline solution. Bases do not have to contain hydroxide either. Metal oxides, hydroxides and carbonates all accept protons, and the reaction with an acid produces a salt. Keeping the definition at the level of proton transfer stops the formula from being treated as the definition.",
      ],
    },
    {
      heading: "pH is logarithmic, so one unit is a factor of ten",
      paragraphs: [
        "At 25 °C, a neutral aqueous solution has pH 7. Values below 7 are acidic and values above 7 are alkaline. The number is not a linear amount of acid: pH is defined as −log₁₀[H⁺], where [H⁺] is the concentration of hydrogen ions in mol dm⁻³. A solution of pH 3 therefore has 10⁻³ mol dm⁻³ of H⁺, and a solution of pH 5 has 10⁻⁵ mol dm⁻³. pH 3 is one hundred times more concentrated in H⁺ than pH 5, because the difference of two pH units corresponds to two factors of ten.",
        "This is why pH 0 does not mean 'no acid' and pH 14 does not mean 'the most dangerous substance'. It also explains why a dilute strong acid can have a higher pH than a concentrated weak acid: pH measures the H⁺ that is actually free in solution, not the amount of acid put into the bottle. Universal indicator gives an approximate colour, while a calibrated pH meter gives a number. At temperatures other than 25 °C the neutral pH is not exactly 7, so 'neutral' is defined by equal H⁺ and OH⁻ concentrations, not by the number alone.",
      ],
    },
    {
      heading: "Neutralisation transfers a proton and leaves a salt",
      paragraphs: [
        "An acid reacting with a hydroxide base produces a salt and water: acid + base → salt + water. The cation of the salt comes from the base and the anion comes from the acid. Hydrochloric acid gives chloride salts, sulfuric acid gives sulfates, nitric acid gives nitrates, and ethanoic acid gives ethanoates. The balanced equation must respect the charges as well as the atoms: sulfuric acid has two protons to donate, so it needs two hydroxide ions, as in H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O.",
        "The essential change is H⁺ + OH⁻ → H₂O. Sodium and sulfate ions are spectators: they are present before and after and do not change. Metal oxides and carbonates are also bases, but they do not fit the simple 'salt + water' pattern: a carbonate also releases carbon dioxide, as in 2HCl + Na₂CO₃ → 2NaCl + H₂O + CO₂. A neutralisation reaction is not the same as a neutral solution. The mixture is at pH 7 only when the acid and base have reacted in exactly the right proportions and both are strong; a weak acid with a strong base can leave an alkaline solution at the equivalence point.",
      ],
    },
    {
      heading: "Strong and concentrated are independent axes",
      paragraphs: [
        "Strong describes how completely an acid ionises in water. Hydrochloric and nitric acids are strong: essentially every molecule donates its proton. Ethanoic acid is weak: only a small fraction of its molecules ionise, so the solution contains mostly intact molecules and relatively few H⁺ ions. Concentrated describes how much acid is dissolved per unit volume. It says nothing about the fraction that ionises. A solution can be strong and dilute, strong and concentrated, weak and dilute, or weak and concentrated.",
        "The evidence separates the two ideas. At the same concentration, the strong acid has more mobile ions, so its solution conducts electricity better and usually has a lower pH. A weak acid can be made more concentrated and become more acidic, but it is still weak: dilution does not turn a strong acid weak, and concentration does not turn a weak acid strong. When a label says 'strong', ask what is fully ionised; when it says 'concentrated', ask how much is present per litre. A hazard assessment needs both, along with the actual pH.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.equation",
      body:
        "Hydrochloric acid neutralises sodium hydroxide. The sodium and chloride ions are spectators; the proton and hydroxide ion combine to form water.",
      notation: "HCl + NaOH → NaCl + H₂O   ·   H⁺ + OH⁻ → H₂O",
      caption:
        "The full equation accounts for every ion. The ionic equation shows only the species that change. Neither equation says the final solution is neutral: that depends on the amounts mixed.",
    },
    {
      id: "r2",
      kind: "chemistry.particle-model",
      body:
        "Two solutions of the same concentration. Hydrochloric acid is fully ionised, so it supplies many H⁺ ions and conducts well. Ethanoic acid is only partly ionised, so most of its molecules remain intact, fewer H⁺ ions are free, and the solution conducts less.",
      notation:
        "0.1 mol dm⁻³ HCl: fully ionised, pH ≈ 1   ·   0.1 mol dm⁻³ CH₃COOH: partly ionised, pH ≈ 3",
      caption:
        "The difference is the fraction ionised, not the amount dissolved. Both solutions are 0.1 mol dm⁻³, so concentration is held constant while strength changes.",
    },
    {
      id: "r3",
      kind: "chemistry.calculation",
      body:
        "Diluting a strong acid by a known factor lowers the H⁺ concentration by that factor. Because pH is logarithmic, a tenfold dilution raises the pH by one unit; a hundredfold dilution raises it by two.",
      notation:
        "pH = −log₁₀[H⁺]   ·   10 cm³ of pH 2 diluted to 1000 cm³ is a 100-fold dilution, so pH 2 → pH 4",
      caption:
        "This calculation assumes the acid is strong and the dilution is well above the point where water's own ionisation matters. Near pH 7, adding water cannot simply be treated as another factor of ten.",
    },
    {
      id: "r4",
      kind: "chemistry.formula",
      body:
        "The acid's anion names the salt family. The base's cation names the first part of the salt. Charges decide how many of each ion are needed, so the formula is built from the ions rather than copied from the acid.",
      notation:
        "HCl → chloride   ·   H₂SO₄ → sulfate   ·   HNO₃ → nitrate   ·   CH₃COOH → ethanoate",
      caption:
        "Sulfuric acid can donate two protons, so a sulfate salt needs two singly charged cations: KOH gives K₂SO₄, while NaOH gives Na₂SO₄.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Write the balanced equation and the ionic equation for the reaction between sulfuric acid and potassium hydroxide.",
      steps: [
        {
          move:
            "Identify the ions: H⁺ and SO₄²⁻ from the acid; K⁺ and OH⁻ from the base.",
          why:
            "Sulfuric acid can donate two protons, so its anion carries a 2− charge. Potassium hydroxide supplies one K⁺ for every OH⁻. Writing the ions first prevents the formula being assembled by guesswork.",
        },
        {
          move:
            "Combine one sulfate ion with two potassium ions, and balance the proton transfer with two hydroxide ions: H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O.",
          why:
            "The two negative charges on sulfate need two positive potassium ions. The two H⁺ from sulfuric acid need two OH⁻ to become two water molecules. Every atom and every charge now balances.",
        },
        {
          move: "Remove the spectator ions to obtain H⁺ + OH⁻ → H₂O.",
          why:
            "Potassium and sulfate ions appear unchanged on both sides. The ionic equation keeps the reaction that actually happens and shows why every acid–hydroxide neutralisation has the same core.",
        },
      ],
      answer:
        "H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O; the ionic equation is H⁺ + OH⁻ → H₂O, with K⁺ and SO₄²⁻ as spectators.",
    },
    {
      id: "w2",
      prompt:
        "10 cm³ of a strong acid solution of pH 2 is diluted with pure water to a final volume of 1000 cm³. Calculate the new pH.",
      steps: [
        {
          move: "Find the dilution factor: 1000 ÷ 10 = 100.",
          why:
            "The same amount of acid is spread through a hundred times the volume, so its concentration falls by a factor of one hundred. The dilution factor is a ratio of volumes, not a subtraction.",
        },
        {
          move:
            "Reduce the H⁺ concentration by that factor: from 10⁻² to 10⁻⁴ mol dm⁻³.",
          why:
            "pH 2 means [H⁺] = 10⁻². Dividing by 100 subtracts two from the exponent, giving 10⁻⁴. The acid is strong, so the H⁺ concentration is taken as the acid's concentration for this school-level calculation.",
        },
        {
          move: "Convert back to pH: −log₁₀(10⁻⁴) = 4.",
          why:
            "Each factor of ten changes pH by one unit, and there were two factors of ten, so the pH rises by two. The answer is pH 4, not pH 200 or pH 7: dilution lowers concentration but does not remove every acid particle.",
        },
      ],
      answer: "The new pH is 4.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A strong acid is the same thing as a concentrated acid.",
      whyItFails:
        "Strength is the fraction of acid molecules that ionise; concentration is how many moles are dissolved per litre. A 0.001 mol dm⁻³ hydrochloric acid solution is strong because it is fully ionised, but it is very dilute and has pH 3. A concentrated ethanoic acid solution can have a lower pH than that while remaining weak. The two words answer different questions.",
      correction:
        "Describe both axes separately: 'strong' means fully ionised, 'concentrated' means a large amount per litre. Then quote the pH or the concentration as evidence rather than using either word as a substitute for the other.",
      contrast: {
        wrong: "it is strong, so it must be concentrated and dangerous",
        right: "it is strong because it fully ionises, but at this dilution its pH is only 3",
      },
    },
    {
      id: "m2",
      belief: "pH is a linear amount, so pH 4 is twice as acidic as pH 2.",
      whyItFails:
        "The pH scale is logarithmic. pH 2 means [H⁺] = 10⁻² mol dm⁻³ and pH 4 means 10⁻⁴ mol dm⁻³, so pH 2 has one hundred times the H⁺ concentration of pH 4, not twice. Reversing the comparison is just as wrong: the lower pH is the more acidic solution.",
      correction:
        "Turn each pH into a power of ten before comparing. A difference of one pH unit is a factor of ten in H⁺ concentration; a difference of two units is a factor of one hundred.",
      contrast: {
        wrong: "pH 4 is twice pH 2",
        right: "pH 2 has 100 times the H⁺ concentration of pH 4",
      },
    },
    {
      id: "m3",
      belief: "Every base contains OH⁻, and every neutralisation leaves a neutral solution.",
      whyItFails:
        "Ammonia is a base because it accepts H⁺ to form NH₄⁺, even though it contains no hydroxide. A base is defined by proton acceptance, and an alkali is simply a base that dissolves. Separately, a neutralisation reaction can leave an acidic or alkaline solution if the amounts are not at the equivalence point, or if a weak acid is mixed with a strong base.",
      correction:
        "Classify bases by what they do to H⁺, not by whether OH appears in the formula. Treat 'neutralisation' as the reaction and 'neutral' as a statement about the final pH; test the result rather than assuming it.",
      contrast: {
        wrong: "ammonia cannot be a base because it has no OH, and all neutralisations end at pH 7",
        right: "ammonia accepts H⁺, so it is a base; the final pH depends on the amounts and the acid–base pair",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Ammonia solution turns universal indicator blue and reacts with hydrochloric acid to form ammonium chloride. Is ammonia an acid, a base or an alkali? Explain using proton transfer.",
      hint:
        "Look at what ammonia does to H⁺. Does it donate a proton or accept one? Then decide whether it is soluble.",
      answer:
        "Ammonia is a base because it accepts a proton: NH₃ + H⁺ → NH₄⁺. It is also an alkali because it dissolves in water to give an alkaline solution. It does not need to contain OH⁻ to be a base.",
      feedback: {
        correct:
          "You classified ammonia by accepting a proton and kept 'base' separate from 'contains hydroxide'.",
        incorrect:
          "The absence of OH in NH₃ does not stop it being a base. Ask whether it accepts H⁺; that is the definition that decides.",
      },
    },
    {
      id: "p2",
      prompt:
        "Write the balanced equation for the reaction between nitric acid and calcium hydroxide, and name the salt formed.",
      hint:
        "Calcium ions have a 2+ charge and nitrate has a 1− charge, so two nitrate ions are needed. Balance the protons with two hydroxide ions.",
      answer:
        "2HNO₃ + Ca(OH)₂ → Ca(NO₃)₂ + 2H₂O. The salt is calcium nitrate.",
      feedback: {
        correct:
          "You used the ion charges to fix the formula and balanced the two protons with two hydroxide ions.",
        incorrect:
          "Calcium nitrate needs two nitrate ions, not one. Check both the atom count and the charge before balancing the water.",
      },
    },
    {
      id: "p3",
      prompt:
        "A strong acid solution has pH 2. It is diluted tenfold. Calculate the new pH and explain why it is not pH 20.",
      hint:
        "Tenfold dilution divides [H⁺] by ten. What does that do to the exponent in 10⁻²?",
      answer:
        "The new pH is 3. Tenfold dilution changes 10⁻² mol dm⁻³ to 10⁻³ mol dm⁻³, and −log₁₀(10⁻³) = 3. pH is logarithmic, so adding one unit represents a factor of ten, not multiplying the number by ten.",
      feedback: {
        correct:
          "You treated dilution as a change in concentration and then converted back through the logarithm.",
        incorrect:
          "Diluting tenfold does not multiply pH by ten. Convert pH 2 to 10⁻², divide by ten, then take the negative logarithm.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A learner says: 'The 0.1 mol dm⁻³ hydrochloric acid is stronger and more concentrated than the 0.1 mol dm⁻³ ethanoic acid, so of course it has the lower pH.' Which parts of this statement are right, and which are wrong? Explain using ionisation.",
      modelAnswer:
        "The hydrochloric acid is strong because it is fully ionised, and at the same concentration it has the lower pH because it produces more H⁺ ions. But it is not more concentrated: both solutions are 0.1 mol dm⁻³. Concentration is the amount dissolved per litre, and it has been held constant. The reason for the lower pH is the greater degree of ionisation, not a greater amount of acid.",
      marking: [
        "Correctly states that hydrochloric acid is strong because it fully ionises.",
        "Correctly states that both solutions have the same concentration.",
        "Explains the lower pH by the greater H⁺ concentration produced by ionisation.",
        "Separates strength from concentration rather than treating the words as synonyms.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A strong acid solution has pH 3. It is diluted with pure water until its volume is 100 times greater. Calculate the new pH.",
      modelAnswer: "pH 5",
      marking: [
        "Recognises that a 100-fold dilution reduces [H⁺] by a factor of 100.",
        "Uses the logarithmic scale correctly: pH rises by two units.",
        "Gives pH 5, not pH 300 or pH 7.",
      ],
      check: { accepted: ["5", "pH 5", "five"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Name the salt formed when sulfuric acid reacts with potassium hydroxide.",
      modelAnswer: "potassium sulfate",
      marking: [
        "Names potassium as the cation from the base.",
        "Names sulfate as the anion from sulfuric acid.",
        "Does not write potassium sulfide, which would come from a different acid.",
      ],
      check: {
        accepted: [
          "potassium sulfate",
          "potassium sulphate",
          "K2SO4",
          "K₂SO₄",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A lake has become acidic at pH 4.5 because of acid rain. An engineer proposes adding water from a nearby river to raise the pH. Explain why dilution is a poor way to solve the problem, and why adding powdered limestone (calcium carbonate) is more effective. Include the ionic equation for the reaction that removes H⁺.",
      whyItTransfers:
        "The lesson develops pH as a logarithmic scale and neutralisation as proton transfer. Here the learner must apply both to an environmental decision, compare dilution with chemical removal, and write the proton-transfer equation for a carbonate rather than a hydroxide.",
      answer:
        "Dilution lowers the concentration of H⁺, but because pH is logarithmic, raising the pH from 4.5 to 6 requires a very large increase in volume; the acid has not been removed. Limestone contains carbonate ions, which accept H⁺: CaCO₃ + 2H⁺ → Ca²⁺ + H₂O + CO₂. This consumes the acid and raises the pH chemically. The limestone must still be added in controlled amounts and the lake monitored, because excess base can make the water alkaline.",
      marking: [
        "Explains that dilution changes concentration without removing the acid.",
        "Uses the logarithmic pH scale to explain why a small pH change needs a large dilution.",
        "Gives the balanced carbonate-and-acid equation, including water and carbon dioxide.",
        "States that the pH must be monitored to avoid overshooting into alkalinity.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Define an acid, a base and an alkali in one sentence each.",
      answer:
        "An acid is a proton donor; a base is a proton acceptor; an alkali is a base that dissolves in water to give an alkaline solution.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "How many times greater is the H⁺ concentration at pH 3 than at pH 6?",
      answer:
        "One thousand times, because the difference is three pH units and each unit is a factor of ten.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why does 0.1 mol dm⁻³ ethanoic acid conduct electricity less well than 0.1 mol dm⁻³ hydrochloric acid?",
      answer:
        "Ethanoic acid is weak and only partly ionises, so it has fewer mobile ions in solution even though the amount dissolved is the same.",
      when: "month-later",
    },
  ],

  summary: [
    "An acid donates a proton; a base accepts one. An alkali is a soluble base, and bases do not have to contain OH⁻.",
    "pH is logarithmic: one unit is a tenfold change in H⁺ concentration, and 7 is neutral only at 25 °C.",
    "Neutralisation is proton transfer to water; the acid's anion names the salt, and spectator ions are removed from the ionic equation.",
    "Strength is the degree of ionisation; concentration is the amount per litre. Equal concentrations do not mean equal pH.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every formula is read as its elements and charges — H plus, O H minus, S O four two minus — and each equation is also described in words, so the chemistry does not depend on the visual layout.",
    },
    {
      need: "colour-vision",
      alternative:
        "The pH scale is labelled with numbers and the words acidic, neutral and alkaline as well as colour, so no conclusion depends on distinguishing red from green.",
    },
    {
      need: "dyslexia",
      alternative:
        "The two axes are named as a repeated pair, strength = fraction ionised and concentration = amount per litre, and each worked step is one sentence.",
    },
    {
      need: "motor",
      alternative:
        "The lesson uses typing and selecting, not dragging or precise indicator colour matching; all representations are readable without interaction.",
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
        "Scope cited against the published GCSE chemistry subject content for acids, bases and salts.",
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
