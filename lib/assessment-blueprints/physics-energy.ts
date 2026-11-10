import type { AssessmentBlueprint } from "../assessment-intelligence";

// ─────────────────────────────────────────────────────────────────────────────
// THE SECOND SUBJECT, TO TEST WHETHER THE CONTRACT GENERALISES.
//
// The first blueprint is a school-derived biology unit marked largely by
// explanation. This one is a public-specification GCSE physics unit built
// around equations, units and practical measurement — a different assessment
// style on purpose. If the contract only fitted prose marking it would not have
// generalised; if it only fitted calculations it would not have fitted biology.
//
// The source is the public AQA GCSE Physics (8463) specification, used ONLY to
// place the unit and to read its assessment style. No specification sentence,
// examination question or mark scheme is stored or reproduced. The items are
// newly authored and `unreviewed`: no physics teacher has read them.
// ─────────────────────────────────────────────────────────────────────────────

export const PHYSICS_ENERGY_BLUEPRINT: AssessmentBlueprint = {
  contract: "openmind.assessment-blueprint/1.0",
  id: "physics.energy-transfer.gcse",
  version: "1.0.0",
  title: "Energy transfer and efficiency: assessment blueprint",
  subject: "physics",
  level: "GCSE / upper secondary (14–16)",
  curriculumContext:
    "A GCSE physics unit on energy stores and transfers, specific heat capacity, power and efficiency. It is tied to that unit only; it is not a claim about A-level, another board or another country's specification.",

  sources: [
    {
      id: "pe-aqa-8463",
      label: "AQA GCSE Physics (8463) specification",
      kind: "public-specification",
      curriculumContext: "GCSE physics, energy: stores, transfers, specific heat capacity, power and efficiency",
      sha256: "b0ece1dba5a0f5d5aa1d72dda48ec8846773fee4e00f8cebde98fbc554e36bb1",
      availability: "publicly-available",
      rights: "unknown",
      licensing: "unknown",
      allowedUse: "pattern-extraction-only",
      reproduction: "none",
      containsSourceText: false,
      studentDataObserved: false,
      note:
        "A public specification used for unit placement and assessment style: equation-led calculations, unit discipline, required-practical method and a context-evaluation item. The file is not stored in this repository and no sentence from it is reproduced.",
    },
  ],

  archetypes: [
    {
      id: "recall-units",
      command: "identify",
      demand: "recall",
      markRange: [1, 2],
      evidence:
        "The learner names a physical quantity's unit, or recognises which quantity a unit measures, without a calculation.",
      progression:
        "A unit is the first check on every later calculation; a learner who cannot name the joule cannot check that an energy answer is an energy answer.",
    },
    {
      id: "equation-substitution",
      command: "calculate",
      demand: "apply",
      markRange: [2, 2],
      evidence:
        "The learner selects the relationship, substitutes values with their units and reports a result in the quantity's own unit.",
      progression:
        "Moves from naming to using a relationship, with the method and the answer marked separately so an arithmetic slip does not erase correct physics.",
    },
    {
      id: "unit-discipline",
      command: "identify",
      demand: "apply",
      markRange: [1, 2],
      evidence:
        "The learner converts a quantity to the unit the equation requires, or states the unit that makes an answer a physical quantity rather than a bare number.",
      progression:
        "Targets the most common lost mark in physics: a correct number with the wrong or missing unit.",
    },
    {
      id: "practical-error",
      command: "suggest",
      demand: "apply",
      markRange: [2, 3],
      evidence:
        "The learner identifies a measurement error and proposes a change that would reduce it, linking the change to the measured quantity.",
      progression:
        "Transfers an equation to a real apparatus and distinguishes the quantity measured from the quantity wanted.",
    },
    {
      id: "explain-transfer",
      command: "explain",
      demand: "understand",
      markRange: [3, 4],
      evidence:
        "The learner follows energy from an input store to a useful output and a wasted transfer, using conservation language rather than 'energy is lost'.",
      progression:
        "Requires a mechanism, not a definition: the same total energy is redistributed, and efficiency describes the useful fraction.",
    },
    {
      id: "compare-systems",
      command: "compare",
      demand: "analyse",
      markRange: [3, 4],
      evidence:
        "The learner compares two systems on a named property and supports the comparison with a consequence for the energy transfer.",
      progression:
        "A comparison has two sides; describing only one system is capped below full marks.",
    },
    {
      id: "evaluate-context",
      command: "evaluate",
      demand: "evaluate",
      markRange: [4, 6],
      evidence:
        "The learner combines specific heat capacity, density or flow rate with a practical limitation to judge an unfamiliar engineering choice.",
      progression:
        "The transfer item: no source question is reused, and the learner must choose which property matters and admit what the data does not settle.",
    },
  ],

  misconceptions: [
    {
      id: "power-is-energy",
      label: "Power and energy are the same quantity",
      whyWrong:
        "Energy is the amount transferred; power is the rate of transfer. A 100 W lamp left on for 10 s transfers 1000 J; a 10 W lamp left on for 100 s transfers the same energy at a tenth of the power. The units differ for the same reason: joules measure an amount, watts measure joules per second.",
      diagnosticSignal:
        "The answer gives the joule as the unit of power, or says a more powerful device always transfers more energy without naming a time.",
      feedback:
        "Write the relationship P = E ÷ t. A power is only comparable to another power when both are rates; an energy compares only with an energy over the same or a stated time.",
    },
    {
      id: "efficiency-is-energy-loss",
      label: "Efficiency means energy has been lost",
      whyWrong:
        "Energy is conserved. An inefficient device does not destroy energy; it transfers a smaller fraction of its input usefully and the rest to the surroundings, usually by heating. Efficiency is the ratio of useful output to total input, not the amount that disappeared.",
      diagnosticSignal:
        "The answer says energy is 'lost', 'used up' or 'destroyed', or treats a low efficiency as a violation of conservation.",
      feedback:
        "Say where the non-useful energy went: to the thermal store of the surroundings by heating, or to sound. Then compute efficiency as useful ÷ total × 100%.",
    },
    {
      id: "specific-heat-is-total",
      label: "Specific heat capacity is the total energy needed to heat an object",
      whyWrong:
        "Specific heat capacity is the energy needed to raise 1 kg of a substance by 1 °C. The total energy for an object also depends on its mass and on the temperature change, which is why Q = m c ΔT has three factors and not one.",
      diagnosticSignal:
        "The answer treats specific heat capacity as a fixed total for the object, or ignores mass or temperature change when comparing two heatings.",
      feedback:
        "Keep the 'specific' in mind: per kilogram, per degree. A large specific heat capacity means a substance takes more energy for the same temperature rise, not that it always needs a fixed amount.",
    },
    {
      id: "temperature-is-energy",
      label: "A higher temperature always means more thermal energy",
      whyWrong:
        "Temperature measures the average kinetic energy of particles; thermal energy also depends on how many particles there are and on the substance's specific heat capacity. A small cup of water at 90 °C can contain less thermal energy than a bath at 40 °C.",
      diagnosticSignal:
        "The answer compares temperatures alone as if they were amounts of energy, or says the hotter object must transfer more energy.",
      feedback:
        "Compare mass, specific heat capacity and temperature change together. A temperature difference drives a transfer; it is not itself the amount transferred.",
    },
  ],

  progression: ["recall", "apply", "understand", "analyse", "evaluate"],

  items: [
    {
      id: "pe-01",
      conceptId: "energy-conservation",
      archetypeId: "recall-units",
      prompt: "Name the SI unit of energy and the SI unit of power.",
      marks: 2,
      responseKind: "short-answer",
      modelAnswer: "The unit of energy is the joule (J); the unit of power is the watt (W).",
      criteria: [
        {
          id: "pe-01-c1",
          kind: "evidence",
          marks: 1,
          credit: "names the joule (J) as the unit of energy",
          acceptable: ["joule", "joules", "j"],
        },
        {
          id: "pe-01-c2",
          kind: "evidence",
          marks: 1,
          credit: "names the watt (W) as the unit of power",
          acceptable: ["watt", "watts", "w"],
          misconceptionId: "power-is-energy",
          signals: ["joule", "joules"],
          nonCredit:
            "Gives the joule as the unit of power; a joule measures an amount of energy, while a watt measures energy per second.",
        },
      ],
      partialCreditRule:
        "Each unit earns its own mark. Naming the unit once for both quantities earns at most one mark, because only one quantity has been answered.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "pe-02",
      conceptId: "energy-conservation",
      archetypeId: "equation-substitution",
      prompt:
        "A 2.5 kg aluminium block is heated from 18 °C to 58 °C. The specific heat capacity of aluminium is 900 J/kg °C. Calculate the energy transferred to the block. Give your answer in joules and show your method.",
      marks: 2,
      responseKind: "numeric",
      numeric: {
        answer: 90000,
        unit: "J",
        unitRequired: true,
        tolerance: { abs: 1, display: "90 000 J" },
      },
      modelAnswer:
        "Energy transferred = mass × specific heat capacity × temperature change = 2.5 × 900 × 40 = 90 000 J.",
      criteria: [
        {
          id: "pe-02-c1",
          kind: "method",
          marks: 1,
          credit: "substitutes mass × specific heat capacity × temperature change",
          acceptable: [
            "2.5 × 900 × 40",
            "2.5*900*40",
            "2.5 x 900 x 40",
            "2.5 × 900 × 40 = 90000",
            "2.5 × 900 × 40 = 90 000",
          ],
        },
        {
          id: "pe-02-c2",
          kind: "answer",
          marks: 1,
          credit: "reports 90 000 J (or 90 kJ) with the unit",
          acceptable: ["90000 J", "90 000 J", "9.0 × 10^4 J", "90 kJ"],
          nonCredit:
            "Reports 90 000 without a unit; the number alone does not say whether it is an energy, a power or a mass.",
        },
      ],
      partialCreditRule:
        "The method mark is kept when the substitution is correct even if the arithmetic is wrong. The answer mark needs the value and its unit.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "pe-03",
      conceptId: "energy-conservation",
      archetypeId: "equation-substitution",
      prompt:
        "An electric heater transfers 180 000 J of energy in 5.0 minutes. Calculate its power. Give your answer in watts and show your method.",
      marks: 2,
      responseKind: "numeric",
      numeric: {
        answer: 600,
        unit: "W",
        unitRequired: true,
        tolerance: { abs: 0.5, display: "600 W" },
      },
      modelAnswer: "Five minutes is 300 s. Power = energy ÷ time = 180 000 ÷ 300 = 600 W.",
      criteria: [
        {
          id: "pe-03-c1",
          kind: "method",
          marks: 1,
          credit: "converts 5.0 minutes to 300 s and divides energy by time",
          acceptable: [
            "180000 / 300",
            "180000 ÷ 300",
            "180000/300",
            "180 000 ÷ 300",
            "180000 ÷ 300 = 600",
          ],
        },
        {
          id: "pe-03-c2",
          kind: "answer",
          marks: 1,
          credit: "reports 600 W with the unit",
          acceptable: ["600 W", "600W"],
          nonCredit:
            "Reports 36 000 W by dividing by 5 instead of 300; the time must be in seconds before it is used in the equation.",
        },
      ],
      partialCreditRule:
        "The method mark requires the time conversion and the division. The answer mark requires the value with its unit.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "pe-04",
      conceptId: "energy-conservation",
      archetypeId: "unit-discipline",
      prompt:
        "An electric motor is supplied with 500 J of energy and transfers 350 J usefully. Calculate its efficiency as a percentage. Give your answer in %.",
      marks: 2,
      responseKind: "numeric",
      numeric: {
        answer: 70,
        unit: "%",
        unitRequired: true,
        tolerance: { abs: 0.1, display: "70%" },
      },
      modelAnswer: "Efficiency = useful output ÷ total input × 100% = 350 ÷ 500 × 100% = 70%.",
      criteria: [
        {
          id: "pe-04-c1",
          kind: "method",
          marks: 1,
          credit: "divides the useful output by the total input and multiplies by 100",
          acceptable: [
            "350 / 500 × 100",
            "350 ÷ 500 × 100",
            "350/500*100",
            "350/500 x 100",
            "350 ÷ 500 = 0.7, then × 100",
          ],
        },
        {
          id: "pe-04-c2",
          kind: "answer",
          marks: 1,
          credit: "reports 70%",
          acceptable: ["70%", "70 %"],
          nonCredit:
            "Reports 0.7 without converting to a percentage, or reports 30% by calculating the wasted fraction instead of the useful one.",
        },
      ],
      partialCreditRule:
        "The method mark is the ratio; the answer mark is the percentage. 0.7 alone shows the ratio but has not answered the question's unit.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "pe-05",
      conceptId: "energy-conservation",
      archetypeId: "explain-transfer",
      prompt:
        "A filament lamp and an LED are both supplied with 10 J of electrical energy. The filament lamp transfers 2 J as useful light; the LED transfers 8 J as useful light. Explain, using energy conservation, why the LED is described as more efficient. Do not say that the filament lamp 'loses' energy.",
      marks: 4,
      responseKind: "extended-response",
      modelAnswer:
        "Both lamps transfer the same 10 J of electrical energy, so neither creates nor destroys energy. In the filament lamp, 2 J leaves as useful light and the other 8 J is transferred to the surroundings by heating; in the LED, 8 J leaves as useful light and 2 J is transferred by heating. Efficiency is the useful fraction of the input: 20% for the filament lamp and 80% for the LED. The LED is more efficient because a larger fraction of the same input is transferred usefully, not because the filament lamp's energy has disappeared.",
      criteria: [
        {
          id: "pe-05-c1",
          kind: "evidence",
          marks: 1,
          credit: "identifies light as the useful transfer and heating as the non-useful transfer for each lamp",
          acceptable: ["light is useful", "heat is wasted", "heating is not useful"],
        },
        {
          id: "pe-05-c2",
          kind: "evidence",
          marks: 1,
          credit: "states that the total energy is conserved and the non-useful energy is transferred to the surroundings",
          acceptable: ["energy is conserved", "total energy stays the same", "energy goes to the surroundings"],
          misconceptionId: "efficiency-is-energy-loss",
          signals: ["energy is lost", "energy is destroyed", "energy disappears", "used up"],
          nonCredit:
            "Says the filament lamp 'loses' energy or that the missing energy has been destroyed; conservation forbids both.",
        },
        {
          id: "pe-05-c3",
          kind: "evidence",
          marks: 1,
          credit: "calculates or states the useful fractions: 2/10 = 20% and 8/10 = 80%",
          acceptable: ["20%", "80%", "2/10", "8/10", "0.2 and 0.8"],
        },
        {
          id: "pe-05-c4",
          kind: "evidence",
          marks: 1,
          credit: "concludes that the LED is more efficient because a larger fraction of the same input is useful",
          acceptable: ["larger fraction is useful", "more of the input becomes light", "the led converts more energy to light"],
        },
      ],
      partialCreditRule:
        "Each independent point earns one mark. A description of only one lamp earns at most 2 marks; the conclusion needs the comparison, not a second description.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "pe-06",
      conceptId: "energy-conservation",
      archetypeId: "practical-error",
      prompt:
        "A student measures the specific heat capacity of water by heating it with an immersion heater and recording the temperature rise. State one variable the student should control, explain one reason the measured value may be too low, and suggest one improvement.",
      marks: 3,
      responseKind: "extended-response",
      modelAnswer:
        "The student should use the same mass of water and the same starting temperature each time, and read the thermometer at eye level. The measured value may be too low because some of the heater's energy is transferred to the surroundings instead of the water, so the temperature rise is smaller than the energy supplied would produce. Insulating the container and using a lid would reduce that transfer; stirring also helps the thermometer read the water's mean temperature.",
      criteria: [
        {
          id: "pe-06-c1",
          kind: "evidence",
          marks: 1,
          credit: "names a controlled variable, such as the mass of water or the starting temperature",
          acceptable: ["same mass", "same starting temperature", "same volume of water", "same time"],
        },
        {
          id: "pe-06-c2",
          kind: "evidence",
          marks: 1,
          credit: "explains a measurement reason the value is too low, such as energy transferred to the surroundings",
          acceptable: ["heat loss to the surroundings", "energy escapes", "not all the energy reaches the water"],
          misconceptionId: "specific-heat-is-total",
          signals: ["total energy needed", "specific heat is the total"],
          nonCredit:
            "Says the specific heat capacity is a fixed total for the water; it is a per-kilogram, per-degree property, and the measured value depends on mass and temperature change.",
        },
        {
          id: "pe-06-c3",
          kind: "evidence",
          marks: 1,
          credit: "suggests an improvement that reduces the named error, such as insulating the container or using a lid",
          acceptable: ["insulate the container", "use a lid", "stir the water", "repeat and average"],
          nonCredit: "Says only 'be more careful' without naming a change to the apparatus.",
        },
      ],
      partialCreditRule:
        "The control, the error and the improvement are marked independently. The improvement must address the error the learner named.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
    {
      id: "pe-07",
      conceptId: "energy-conservation",
      archetypeId: "evaluate-context",
      prompt:
        "A data centre needs to remove 2.0 MW of heat. An engineer proposes cooling the servers with water instead of air. Using specific heat capacity, density and flow rate, explain why water can remove the same heat with a smaller temperature rise, and evaluate one practical limitation of the proposal.",
      marks: 5,
      responseKind: "extended-response",
      modelAnswer:
        "The energy removed by a coolant is Q = m c ΔT. Water has a much larger specific heat capacity than air, so each kilogram of water absorbs more energy for the same temperature rise. Water is also much denser, so a given volume carries more mass, and a practical flow rate therefore carries more energy per second. For the same 2.0 MW, water can leave with a smaller temperature rise than air, or the same rise with a much smaller flow rate. A limitation is that water near electronics needs leak protection, corrosion control and pumps; a leak can damage the servers, and pumping and treatment add cost and energy use. The comparison also depends on the inlet temperature and the flow rate actually available, which the proposal has not stated.",
      criteria: [
        {
          id: "pe-07-c1",
          kind: "evidence",
          marks: 1,
          credit: "uses Q = m c ΔT to link the energy removed to mass, specific heat capacity and temperature rise",
          acceptable: ["q = m c δt", "mass × specific heat capacity × temperature rise", "mcδt"],
        },
        {
          id: "pe-07-c2",
          kind: "evidence",
          marks: 1,
          credit: "states that water has a higher specific heat capacity than air, so it absorbs more energy per kilogram per degree",
          acceptable: ["water has a higher specific heat capacity", "more energy per kilogram per degree", "air has a lower specific heat capacity"],
          misconceptionId: "temperature-is-energy",
          signals: ["hotter means more energy", "temperature is the energy"],
          nonCredit:
            "Compares temperatures alone; a higher temperature is not a larger amount of energy without the mass and specific heat capacity.",
        },
        {
          id: "pe-07-c3",
          kind: "evidence",
          marks: 1,
          credit: "explains that water's greater density means a given flow rate carries more mass per second",
          acceptable: ["water is denser", "more mass per second", "greater density for the same flow rate"],
        },
        {
          id: "pe-07-c4",
          kind: "evidence",
          marks: 1,
          credit: "concludes that water needs a smaller temperature rise or flow rate for the same 2.0 MW",
          acceptable: ["smaller temperature rise", "smaller flow rate", "same heat with less water"],
        },
        {
          id: "pe-07-c5",
          kind: "evidence",
          marks: 1,
          credit: "evaluates a real limitation, such as leaks, corrosion, pump energy or an unstated inlet temperature",
          acceptable: ["leak", "corrosion", "pump energy", "maintenance cost", "inlet temperature is not stated"],
          nonCredit: "Says only that water is 'dangerous' without naming the mechanism or the consequence.",
        },
      ],
      partialCreditRule:
        "Each link earns one mark. A property named without a consequence for the heat transfer earns at most one mark; the evaluation mark requires a limitation and why it matters.",
      originality: "newly-authored",
      sourceTextReproduced: 0,
      reviewStatus: "unreviewed",
    },
  ],

  limitations: [
    "This is a design prototype, not a validated examination. No physics teacher or learner has reviewed it.",
    "The source is a public specification, used for unit placement and assessment style only; it is not a question paper or a mark scheme, and no specification text is reproduced.",
    "The blueprint is tied to a GCSE energy unit. It must not be applied to A-level, another board or another country without a separate curriculum mapping.",
    "The data-centre item uses a simplified Q = mcΔT model and does not calculate pumping power or the full heat-exchanger performance.",
    "No learner has attempted the items; there is no evidence yet that the marking criteria agree with an examiner.",
  ],
  reviews: [],
  reviewStatus: "unreviewed",
  teacherReviewed: false,
  learnerTested: false,
  humanReviewCount: 0,
};
