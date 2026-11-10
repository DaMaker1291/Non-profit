import type { AuthoredLesson } from "../../lesson-contract";

// EQUILIBRIUM IS A STATE, NOT A FINISHED REACTION.
//
// The lesson starts with the observation that a reversible reaction can look
// still while both directions are still running. It then separates four ideas
// that are often collapsed into one: dynamic equilibrium, the direction a
// change pushes the position, the equilibrium constant, and the conditions that
// are a compromise between yield and rate. The Haber process is the worked
// case because every one of those ideas is visible in it.
export const CHEMISTRY_EQUILIBRIA: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "equilibria",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "A-level Chemistry, reversible reactions and equilibrium: dynamic equilibrium, Le Chatelier's principle, the equilibrium constant and the Haber process",
    level: "A-level / advanced secondary",
    note:
      "Scope cited against published A-level subject content. Every explanation, example, practice item and assessment is original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain dynamic equilibrium as equal forward and reverse rates with constant amounts, not as a reaction that has stopped.",
      evidence:
        "The learner explains why a sealed tube of N₂O₄ and NO₂ can look unchanged while both gases are still reacting, and distinguishes constant concentrations from zero rate.",
    },
    {
      statement:
        "Predict the direction of a concentration, pressure or temperature change using Le Chatelier's principle, counting gas molecules where pressure is involved.",
      evidence:
        "For N₂ + 3H₂ ⇌ 2NH₃, the learner predicts that more pressure favours ammonia because four gas molecules become two, and that more heat favours the endothermic reverse reaction.",
    },
    {
      statement:
        "Write an equilibrium constant expression and calculate Kc from equilibrium concentrations, keeping the position of equilibrium distinct from the value of Kc.",
      evidence:
        "The learner writes Kc = [HI]² / ([H₂][I₂]), calculates 64 from 0.20, 0.20 and 1.60 mol/dm³, and states that only a temperature change alters Kc.",
    },
    {
      statement:
        "Explain the Haber process as a compromise between a high yield and a useful rate, including the role of the iron catalyst.",
      evidence:
        "The learner explains why 450 °C is used although a lower temperature would give a higher equilibrium yield: the rate would be too slow, and the catalyst does not change the position.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["rates-reaction", "energy-changes"],
    check: [
      {
        id: "d1",
        question:
          "Why does increasing the temperature usually make a reaction faster, even when the reaction is exothermic?",
        answer:
          "A higher temperature gives a larger fraction of collisions enough energy to clear the activation barrier. The enthalpy change decides whether the reaction releases energy overall, not how fast it reaches the products.",
        targets: ["rates-reaction"],
      },
      {
        id: "d2",
        question:
          "For an exothermic reaction, is ΔH positive or negative, and does the reaction warm or cool its surroundings?",
        answer:
          "ΔH is negative because the products have lower enthalpy than the reactants. The system loses enthalpy to the surroundings, so the surroundings warm.",
        targets: ["energy-changes"],
      },
    ],
  },

  introduction: {
    hook:
      "Seal nitrogen dioxide in a tube and it fades towards a pale brown. Leave it, and the colour stops changing — but it has not stopped. The forward reaction is still making N₂O₄ and the reverse reaction is still breaking it apart, at the same rate. That is dynamic equilibrium: a balance of rates, not a lack of activity.",
    why:
      "Equilibrium is where chemistry stops asking only \"how fast?\" and starts asking \"how much?\". The answer depends on conditions, which is why an industrial plant chooses a pressure and a temperature rather than accepting whatever a reaction gives. The same ideas explain why a fizzy drink goes flat when opened, why a catalyst does not improve a yield, and why a high equilibrium constant can still be useless if the reaction is too slow to reach it.",
  },

  explanation: [
    {
      heading: "At equilibrium the rates are equal, so the amounts stop changing",
      paragraphs: [
        "A reversible reaction can proceed in both directions. When the forward rate and the reverse rate become equal, the concentrations of reactants and products stop changing. Nothing has switched off: at the molecular level, reactant molecules are still becoming products and product molecules are still becoming reactants. The two changes cancel, so a measurement of concentration sees a still mixture.",
        "This is why equilibrium is described as dynamic. If the reaction had truly stopped, adding more reactant would not restart it; in a dynamic equilibrium it does. The position of equilibrium says how much product is present at that balance. It does not say how quickly the balance was reached, and a mixture can be at equilibrium at any proportion from mostly reactants to mostly products.",
      ],
    },
    {
      heading: "Le Chatelier: a change is opposed, not reversed",
      paragraphs: [
        "Le Chatelier's principle says that when a system at equilibrium is disturbed, the position of equilibrium moves in the direction that opposes the disturbance. Adding a reactant pushes the reaction towards products; removing a product also pulls it towards products. The principle predicts the direction of the shift, not the new amounts and not how long the shift takes.",
        "For a pressure change, count gas molecules rather than looking at coefficients of solids or liquids. N₂ + 3H₂ ⇌ 2NH₃ has four gas molecules on the left and two on the right. Increasing pressure favours the side with fewer gas molecules, because that reduces the pressure. A reaction with equal gas molecules on both sides has no pressure shift. Adding an inert gas at constant volume does not change the partial pressures, so it does not shift this equilibrium.",
        "For a temperature change, identify the endothermic direction. Increasing temperature favours the endothermic direction, because that absorbs the added thermal energy. In the Haber process the forward reaction is exothermic, so a higher temperature lowers the equilibrium yield. Decreasing temperature favours the exothermic direction, but it also slows both reactions, so a plant cannot simply cool the reactor to get a large yield in a useful time.",
      ],
    },
    {
      heading: "Kc measures the balance; the position says where it sits",
      paragraphs: [
        "For a general equilibrium, the equilibrium constant is the product concentrations multiplied together, each raised to its coefficient, divided by the reactant concentrations treated the same way. Concentrations are equilibrium values in mol/dm³. Solids and pure liquids are omitted because their concentration is effectively constant. Kc depends only on temperature: changing concentration or pressure moves the position but leaves Kc unchanged at that temperature.",
        "A large Kc means the equilibrium mixture is product-rich; a small Kc means it is reactant-rich. The value does not say how fast equilibrium is reached. A reaction can have a very favourable Kc and still be too slow to be useful without a catalyst. This is why a catalyst is not a way to improve the equilibrium yield: it lowers the activation energy of both directions equally, so the system reaches the same position sooner.",
      ],
    },
    {
      heading: "The Haber process chooses a compromise, not a perfect yield",
      paragraphs: [
        "The Haber process makes ammonia from nitrogen and hydrogen: N₂(g) + 3H₂(g) ⇌ 2NH₃(g), with ΔH negative in the forward direction. High pressure favours ammonia because four gas molecules become two. Low temperature also favours ammonia because the forward reaction is exothermic, but at low temperature the rate is too slow for an economical plant.",
        "The industrial compromise is about 450 °C and 200 atm with an iron catalyst. The temperature is higher than the yield alone would suggest, because it gives a useful rate; the pressure is high enough to improve the yield without making the plant impossibly expensive; and the catalyst reaches equilibrium faster without changing Kc. Ammonia is removed by cooling and condensing it, which pulls the equilibrium forward as it is used up. The unreacted nitrogen and hydrogen are recycled.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.equation",
      body:
        "The Haber equation is reversible. Four gas molecules on the left become two on the right, and the forward reaction releases energy. Those two facts decide the pressure and temperature predictions.",
      notation: "N₂(g) + 3H₂(g) ⇌ 2NH₃(g)   forward →   ΔH < 0",
      caption:
        "High pressure favours the two-molecule side. High temperature favours the endothermic reverse direction, so it lowers the ammonia yield.",
    },
    {
      id: "r2",
      kind: "chemistry.formula",
      body:
        "The equilibrium constant is a ratio of product concentrations to reactant concentrations, each raised to its balanced-equation coefficient.",
      notation: "Kc = [NH₃]² / ([N₂][H₂]³)",
      caption:
        "Only temperature changes Kc. Adding nitrogen or removing ammonia changes the position, but at the same temperature the value of Kc is unchanged.",
    },
    {
      id: "r3",
      kind: "chemistry.calculation",
      body:
        "For H₂ + I₂ ⇌ 2HI, the equilibrium concentrations are substituted directly. The numerator is squared because the equation produces two HI molecules.",
      notation: "Kc = (1.60)² / (0.20 × 0.20) = 64",
      caption:
        "Kc has no units here because there are two gas molecules on each side of the equation; the units cancel.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "At equilibrium both arrows are still active. The forward and reverse collisions occur at equal rates, so the number of each kind of molecule stays constant even though individual molecules are changing.",
      notation: "N₂ + 3H₂ ⇌ 2NH₃ (both directions active)",
      caption:
        "A still colour is not a stopped reaction. The balance is between rates, and it can be disturbed by changing concentration, pressure or temperature.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), ΔH is negative. Predict the effect on the equilibrium yield of ammonia of (a) increasing the pressure and (b) increasing the temperature. Explain each prediction.",
      steps: [
        {
          move: "Count the gas molecules on each side: four on the left, two on the right.",
          why:
            "Pressure changes only shift an equilibrium when the number of gas molecules differs between the two sides.",
        },
        {
          move: "Increasing pressure favours the side with fewer gas molecules, so it favours ammonia.",
          why:
            "The system opposes the increase in pressure by moving to the side that occupies less volume; two gas molecules occupy less than four at the same temperature.",
        },
        {
          move: "Identify the forward reaction as exothermic, so the reverse reaction is endothermic.",
          why:
            "Le Chatelier's temperature rule is about the direction that absorbs the added thermal energy, and that is the endothermic direction.",
        },
        {
          move: "Increasing temperature favours the endothermic reverse reaction, so the ammonia yield falls.",
          why:
            "The system absorbs the added heat by shifting towards the direction that takes energy in, even though that reduces the amount of product.",
        },
      ],
      answer:
        "Increasing pressure increases the ammonia yield; increasing temperature decreases it. The pressure effect comes from four gas molecules becoming two, and the temperature effect comes from the forward reaction being exothermic.",
    },
    {
      id: "w2",
      prompt:
        "At equilibrium, a mixture has [H₂] = 0.20 mol/dm³, [I₂] = 0.20 mol/dm³ and [HI] = 1.60 mol/dm³ for H₂ + I₂ ⇌ 2HI. Calculate Kc and state its units.",
      steps: [
        {
          move: "Write the expression with the product concentration squared: Kc = [HI]² / ([H₂][I₂]).",
          why:
            "The coefficient of HI is 2 in the balanced equation, so its concentration is raised to the power 2; the reactants each have coefficient 1.",
        },
        {
          move: "Substitute the equilibrium values: Kc = (1.60)² / (0.20 × 0.20).",
          why:
            "Kc uses equilibrium concentrations, not initial amounts and not changes. Substituting before the mixture has settled would calculate a different quantity.",
        },
        {
          move: "Calculate the numerator and denominator: 2.56 / 0.040 = 64.",
          why:
            "The arithmetic gives the value of the constant at this temperature; the large value means the equilibrium mixture is product-rich.",
        },
        {
          move: "Cancel the concentration units: two powers of concentration on top and two underneath, so Kc is dimensionless here.",
          why:
            "The units of Kc depend on the sum of the product coefficients minus the sum of the reactant coefficients; here 2 − (1 + 1) = 0.",
        },
      ],
      answer: "Kc = 64, with no units for this reaction.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "At equilibrium the reaction has stopped, so the concentrations are zero or no collisions are happening.",
      whyItFails:
        "Equilibrium is dynamic: both directions continue at equal rates. The concentrations are constant, not zero, and individual molecules are still reacting. If the reaction had stopped, changing a concentration would not restart it, but in a dynamic equilibrium it does.",
      correction:
        "Describe equilibrium as two rates that are equal, not two amounts that are zero. The observable is a constant concentration, while the molecular process continues in both directions.",
      contrast: {
        wrong: "the forward reaction has finished, so the mixture stops changing",
        right:
          "the forward and reverse reactions are still running at equal rates, so the amounts stop changing",
      },
    },
    {
      id: "m2",
      belief: "Increasing pressure always shifts an equilibrium towards the side with more gas molecules.",
      whyItFails:
        "Increasing pressure favours the side with FEWER gas molecules, because that side occupies less volume and opposes the pressure increase. The rule only applies when the two sides have different numbers of gas molecules; if they are equal, pressure has no effect on the position.",
      correction:
        "Count the gas molecules on each side before predicting. More pressure goes towards fewer gas molecules; equal counts mean no shift.",
      contrast: {
        wrong: "more pressure pushes the equilibrium towards the side with more molecules",
        right:
          "more pressure pushes the equilibrium towards the side with fewer gas molecules",
      },
    },
    {
      id: "m3",
      belief: "A catalyst increases the equilibrium yield because it makes the forward reaction faster.",
      whyItFails:
        "A catalyst lowers the activation energy of both the forward and reverse reactions by the same amount. Both rates increase, so equilibrium is reached sooner, but the position and Kc are unchanged. A catalyst changes the rate, not the thermodynamics.",
      correction:
        "Separate rate from position: a catalyst shortens the time to equilibrium; only a temperature change alters Kc. The yield at equilibrium is decided by the conditions, not by how fast they are reached.",
      contrast: {
        wrong: "the catalyst makes more ammonia because the reaction is faster",
        right:
          "the catalyst reaches the same equilibrium sooner; the equilibrium yield is unchanged",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "For 2SO₂(g) + O₂(g) ⇌ 2SO₃(g), an equilibrium mixture has [SO₂] = 0.40, [O₂] = 0.20 and [SO₃] = 0.80 mol/dm³. Calculate Kc and give its units.",
      hint:
        "Square [SO₃] and [SO₂] because their coefficient is 2. For the units, subtract the sum of reactant powers from the sum of product powers.",
      answer:
        "Kc = (0.80)² / ((0.40)² × 0.20) = 0.64 / 0.032 = 20. The powers give 2 − 3 = −1, so the units are mol⁻¹ dm³.",
      feedback: {
        correct:
          "Correct. Kc = 20 with units mol⁻¹ dm³; the negative unit power comes from three gas molecules on the left becoming two on the right.",
        incorrect:
          "Check the powers: both SO₂ and SO₃ are squared, while O₂ is not. The denominator is 0.40² × 0.20 = 0.032, not 0.40 × 0.20.",
      },
    },
    {
      id: "p2",
      prompt:
        "A reversible reaction is endothermic in the forward direction. Predict the effect of increasing the temperature on the equilibrium yield of the products, and explain using both rate and position.",
      hint:
        "Le Chatelier gives the position; collision theory gives the rate. State both, because they can point in the same direction or in opposite directions.",
      answer:
        "Increasing temperature favours the endothermic forward direction, so the equilibrium yield of products increases. It also increases the rates of both forward and reverse reactions, so equilibrium is reached sooner. The position prediction comes from Le Chatelier; the rate prediction comes from the larger fraction of collisions with enough energy.",
      feedback: {
        correct:
          "Correct. The yield rises because the forward direction absorbs heat, and the rate rises because more collisions clear the activation barrier.",
        incorrect:
          "Separate the two questions. Temperature changes both the rate and the equilibrium position; saying \"the reaction gets faster\" does not say which side is favoured.",
      },
    },
    {
      id: "p3",
      prompt:
        "Explain why increasing the pressure has no effect on the equilibrium position of H₂(g) + I₂(g) ⇌ 2HI(g).",
      hint:
        "Count the gas molecules on each side before applying the pressure rule.",
      answer:
        "There are two gas molecules on the left and two on the right, so the two sides occupy the same volume for a given amount of gas. Increasing pressure does not favour either direction, so the position of equilibrium is unchanged. Kc is also unchanged at constant temperature.",
      feedback: {
        correct:
          "Correct. Equal gas-molecule counts mean no pressure shift; the pressure changes the concentrations but not the balance between them.",
        incorrect:
          "The pressure rule is not \"pressure always shifts the equilibrium\". Count the gas molecules first: two on each side means no shift.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "For N₂(g) + 3H₂(g) ⇌ 2NH₃(g), ΔH is negative. State the effect of increasing pressure and of increasing temperature on the equilibrium yield of ammonia.",
      modelAnswer:
        "Increasing pressure increases the ammonia yield; increasing temperature decreases it.",
      marking: [
        "States that increasing pressure increases the yield, because four gas molecules become two.",
        "States that increasing temperature decreases the yield, because the forward reaction is exothermic and the reverse is endothermic.",
      ],
      check: {
        accepted: [
          "Increasing pressure increases the ammonia yield; increasing temperature decreases it.",
          "pressure increases yield; temperature decreases yield",
          "pressure increases, temperature decreases",
          "pressure raises yield, temperature lowers yield",
        ],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "For PCl₅(g) ⇌ PCl₃(g) + Cl₂(g), an equilibrium mixture has [PCl₅] = 0.50, [PCl₃] = 0.10 and [Cl₂] = 0.10 mol/dm³. Calculate Kc, including its units.",
      modelAnswer: "Kc = 0.020 mol/dm³",
      marking: [
        "Writes Kc = [PCl₃][Cl₂] / [PCl₅].",
        "Substitutes the equilibrium concentrations and calculates 0.10 × 0.10 ÷ 0.50 = 0.020.",
        "Gives the unit mol/dm³, because two product gas molecules form from one reactant gas molecule.",
      ],
      check: {
        accepted: [
          "Kc = 0.020 mol/dm³",
          "0.020 mol/dm³",
          "0.02 mol/dm³",
          "0.020 mol dm-3",
          "0.02 mol dm-3",
          "0.020",
          "0.02",
        ],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "A catalyst makes the Haber process reach equilibrium faster, but it does not increase the equilibrium yield. Explain why both statements are true.",
      modelAnswer:
        "A catalyst provides an alternative route with a lower activation energy for both the forward and reverse reactions. Both rates increase, so the system reaches equilibrium sooner. The catalyst does not change the energy of the reactants or products, so it does not change the position of equilibrium or Kc. The equilibrium yield is decided by temperature, pressure and the initial amounts, not by the rate at which equilibrium is reached.",
      marking: [
        "Explains that the catalyst lowers the activation energy of both directions.",
        "Links the lower barrier to a faster approach to equilibrium, not to a different equilibrium position.",
        "States that Kc and the equilibrium yield are unchanged because the reactant and product energy levels are unchanged.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Carbonated water contains dissolved carbon dioxide in equilibrium with the gas above it: CO₂(aq) ⇌ CO₂(g). When the bottle is opened, the pressure above the liquid falls. Predict the effect on the amount of dissolved carbon dioxide, and explain why the drink eventually goes flat.",
      whyItTransfers:
        "The lesson used an industrial reactor with a gas-phase equilibrium. Here the same pressure rule applies to a gas dissolving in a liquid, and the learner must connect the falling pressure to the escape of carbon dioxide rather than to a reaction that has stopped.",
      answer:
        "Lowering the pressure above the liquid favours the direction that produces more gas molecules, which is the escape of CO₂ from solution. The equilibrium shifts towards CO₂(g), so dissolved carbon dioxide leaves and the drink becomes less carbonated. It eventually goes flat because the gas continues to escape until the new equilibrium is reached, and opening the bottle keeps the partial pressure of CO₂ above the liquid low.",
      marking: [
        "Predicts that lowering the pressure shifts the equilibrium towards CO₂(g).",
        "Explains that dissolved carbon dioxide escapes, reducing the amount in solution.",
        "Uses the pressure-dependent position of equilibrium rather than saying the reaction has stopped or that the gas is destroyed.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Define dynamic equilibrium in one sentence, naming both rates.",
      answer:
        "Dynamic equilibrium is the state of a reversible reaction in which the forward and reverse reaction rates are equal, so the concentrations of reactants and products remain constant while both reactions continue.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "For H₂ + I₂ ⇌ 2HI, Kc = 64 at a certain temperature. A mixture has [H₂] = 0.50, [I₂] = 0.50 and [HI] = 2.00 mol/dm³. Calculate the reaction quotient and state which direction the reaction must go to reach equilibrium.",
      answer:
        "Q = (2.00)² / (0.50 × 0.50) = 4.00 / 0.25 = 16. Q is less than Kc, so the forward reaction must increase the products and reduce the reactants until Q reaches 64.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why the Haber process uses 450 °C even though a lower temperature would give a higher equilibrium yield of ammonia.",
      answer:
        "A lower temperature would favour the exothermic forward reaction and raise the equilibrium yield, but it would also make both reactions much slower, so equilibrium would take too long to reach. 450 °C is a compromise: it gives a useful rate while still producing a worthwhile yield at high pressure with an iron catalyst.",
      when: "month-later",
    },
  ],

  summary: [
    "Dynamic equilibrium means the forward and reverse rates are equal; the amounts are constant, but both reactions continue.",
    "Le Chatelier predicts the direction of a shift: more pressure favours fewer gas molecules, more heat favours the endothermic direction, and a catalyst changes only the rate.",
    "Kc is an equilibrium constant in terms of concentrations; it changes with temperature, not with pressure or concentration, and a catalyst leaves it unchanged.",
    "The Haber process is a compromise: high pressure favours ammonia, a moderate temperature gives a useful rate, and the iron catalyst reaches equilibrium faster without changing the yield.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every equation is also read as a sentence, and the Haber compromise is presented as an ordered list of conditions and effects rather than as a diagram alone.",
    },
    {
      need: "colour-vision",
      alternative:
        "Forward and reverse directions are labelled with words and arrows, never distinguished by colour; equilibrium shifts are stated as \"towards products\" or \"towards reactants\".",
    },
    {
      need: "dyslexia",
      alternative:
        "The Kc calculation follows a fixed four-line pattern: expression, substitution, arithmetic and units. The same pattern is used in the worked example and the practice item.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no graph has to be dragged or drawn, and the pressure rule is answered by counting typed gas molecules.",
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
        "All explanations, examples, practice items, assessments and the Haber compromise are original to OpenMind.",
    },
    {
      sourceId: "a-level-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against published A-level chemistry subject content for equilibrium and reversible reactions.",
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
