import type { AuthoredLesson } from "../../lesson-contract";

// One representative Physics lesson, authored to openmind.lesson/1.0.
//
// WHY THIS CONCEPT. Circuits is where a learner first has to hold a MODEL and a
// MEASUREMENT at the same time: charge is conserved, energy is transferred, and
// the two bookkeeping rules (same current in series, same voltage in parallel)
// are consequences rather than facts to memorise.
export const PHYSICS_CIRCUITS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "electricity-circuits",
  version: "1.0.0",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, electricity: current, potential difference and resistance",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited from the published subject content; no specification text reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Use the relationship between potential difference, current and resistance to find any one of the three when the other two are known.",
      evidence:
        "Given a twelve volt supply driving three amps, the learner rearranges to resistance equals voltage divided by current and answers four ohms, with the unit.",
    },
    {
      statement:
        "Predict whether current or potential difference is shared in a series and in a parallel circuit, and justify the prediction from conservation.",
      evidence:
        "The learner says the current is the same at every point in a series loop because charge cannot pile up, and that the potential differences add because energy per coulomb is transferred in stages.",
    },
    {
      statement:
        "Explain why adding a second bulb in parallel makes each bulb as bright as before, while adding it in series dims both.",
      evidence:
        "The learner attributes the parallel case to each branch having the full supply voltage, and the series case to the supply voltage being shared between two resistances.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["energy-conservation"],
    check: [
      {
        id: "d1",
        question: "What does a battery do to the charge that flows through it?",
        answer:
          "It transfers energy to the charge, so each coulomb leaves with more energy than it arrived with. That energy per coulomb is the potential difference.",
        targets: ["energy-conservation"],
      },
      {
        id: "d2",
        question:
          "A torch uses twenty joules of energy in four seconds. What is its power, and what does the number mean?",
        answer:
          "Five watts, which means five joules of energy are transferred every second.",
        targets: ["energy-conservation"],
      },
    ],
  },

  introduction: {
    hook:
      "Two identical bulbs, one battery. Wire them one after the other and both look dim. Wire them side by side, each with its own path back to the battery, and both look as bright as a single bulb on its own.",
    why:
      "The bulbs did not change and the battery did not change, so the difference must be in what each bulb is given. A circuit is an energy story told in two currencies: charge, which flows and is never used up, and energy per charge, which is transferred and is used up. Keeping those two separate is the whole of this topic.",
  },

  explanation: [
    {
      heading: "Current is charge passing, not charge consumed",
      paragraphs: [
        "Current is the rate at which charge passes a point, measured in amperes: one amp is one coulomb each second. Charge is conserved, so in a single loop the same charge passes every point in the same time. The current is therefore the same before the bulb, inside the bulb and after it. A bulb does not use up current; it transfers energy from the charge that passes through it.",
        "This is why an ammeter reads the same value anywhere in a series circuit, and why the readings either side of a component are not 'before and after'. If current were consumed, charge would accumulate inside the bulb, and nothing in the physics allows that.",
      ],
    },
    {
      heading: "Potential difference is energy per charge, and it is what gets shared",
      paragraphs: [
        "The battery gives each coulomb a certain amount of energy. As charge passes through a component, some of that energy is transferred to the surroundings — as light and heat in a bulb. The potential difference across the component is the energy transferred per coulomb passing through it, measured in volts: one volt is one joule per coulomb.",
        "In a series loop the charge passes through every component in turn, so the energy per coulomb is handed out in stages and the potential differences add to the supply voltage. In a parallel circuit each branch connects directly across the supply, so every branch gets the full energy per coulomb and the potential difference across each branch equals the supply voltage. The current then divides between the branches, because the same total charge per second has more than one route.",
      ],
    },
    {
      heading: "Resistance is the opposition that sets the current",
      paragraphs: [
        "For a component at constant temperature, the current through it is proportional to the potential difference across it. The constant of proportionality is the resistance: potential difference equals current times resistance, with resistance in ohms. Rearranging is the everyday skill — resistance is voltage divided by current, and current is voltage divided by resistance.",
        "The relationship assumes the temperature stays constant. A filament bulb heats up, its resistance rises, and the graph of current against voltage curves rather than staying straight. Naming that assumption is part of using the equation honestly, and a thermistor or a diode breaks it in a different direction on purpose.",
      ],
    },
    {
      heading: "Series and parallel are consequences, not conventions",
      paragraphs: [
        "In series there is one path, so the current has nowhere else to go and is the same throughout; the resistances add because the charge is pushed through each obstacle in turn. In parallel there are several paths, so the current splits; the total resistance falls because adding a path makes it easier for charge to flow, which is why a parallel circuit draws more current from the same supply.",
        "Both rules come from the same two conservation statements: charge is conserved at a junction, and energy per coulomb is conserved around a loop. A learner who can derive the rules from those statements can answer a circuit question they have not seen; a learner who has memorised 'series adds' will meet a combination circuit and have nothing to fall back on.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "The relationship between potential difference, current and resistance. Rearrange before substituting, so the quantity you want is alone on the left.",
      notation: "V = I R",
      caption:
        "V is the potential difference in volts, I the current in amperes and R the resistance in ohms. The equation holds for a component at constant temperature.",
    },
    {
      id: "r2",
      kind: "physics.units",
      body:
        "Each symbol is a quantity with a unit, and the unit is what makes an answer checkable.",
      notation: "V in volts (V) · I in amperes (A) · R in ohms (Ω) · P in watts (W)",
      caption:
        "An answer of four is not an answer. Four ohms is, and four volts would be a different physical claim entirely.",
    },
    {
      id: "r3",
      kind: "physics.model",
      body:
        "Two circuits side by side. In the series circuit one path runs through both bulbs, so the same current passes each and the supply voltage divides between them. In the parallel circuit each bulb has its own branch across the supply, so each branch has the full supply voltage and the current divides.",
      notation: "series: one path · parallel: two branches across the same supply",
      caption:
        "The arrows matter. In series the current arrow has one route; in parallel it splits at the junction and rejoins. The voltage label is written across each branch, not across the whole circuit.",
    },
    {
      id: "r4",
      kind: "physics.graph",
      body:
        "Current against potential difference for a fixed resistor and for a filament bulb. The resistor gives a straight line through the origin; the bulb curves as it heats and its resistance rises.",
      notation: "resistor: straight through origin · bulb: curve steepening then flattening",
      caption:
        "The gradient of the straight line is one over the resistance. The curve is not a mistake: the assumption of constant temperature has stopped holding.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "A twelve volt supply drives a current of three amps through a resistor. Find its resistance.",
      steps: [
        {
          move: "Write the equation and rearrange it for the quantity asked for: R = V / I.",
          why:
            "The question gives V and I and asks for R, so R must be alone on one side before any numbers go in. Substituting first and rearranging afterwards is where sign and division errors enter.",
        },
        {
          move: "Substitute the values: R = 12 / 3.",
          why:
            "Twelve volts and three amps are in the correct units already, so no conversion is needed. Writing the units beside the numbers keeps track of what the division means.",
        },
        {
          move: "Calculate and state the unit: R = 4 Ω.",
          why:
            "Volts divided by amps gives ohms. A bare four would not say whether it was four ohms, four volts or four amps.",
        },
      ],
      answer: "4 Ω",
    },
    {
      id: "w2",
      prompt:
        "Two six ohm resistors are connected in series across a twelve volt supply. Find the current through the circuit and the potential difference across each resistor.",
      steps: [
        {
          move: "Find the total resistance: R = 6 + 6 = 12 Ω.",
          why:
            "In series the charge passes through both resistors in turn, so the two obstacles add. The same current flows through each.",
        },
        {
          move: "Rearrange V = I R for current: I = V / R = 12 / 12.",
          why:
            "The supply voltage acts across the whole series combination, so the total resistance is the correct denominator for the total current.",
        },
        {
          move: "Calculate: I = 1 A, and then find each potential difference with V = I R = 1 × 6.",
          why:
            "The current is the same through both resistors, so each takes one amp. Each potential difference is therefore six volts, and the two add to the twelve volt supply, which is the check that the energy bookkeeping is consistent.",
        },
      ],
      answer: "1 A, with 6 V across each resistor",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Current is used up as it goes round the circuit, so the bulb uses some of it.",
      whyItFails:
        "Charge is conserved. If a bulb consumed current, charge would have to accumulate inside it, and there is nothing in the physics that allows that. What the bulb takes is energy, not charge, so the current after the bulb is the same as the current before it.",
      correction:
        "Separate the two currencies. Charge flows round the loop and is never consumed; energy per charge is transferred at each component. The ammeter reading is the same everywhere in a series loop, and the voltmeter reading is what changes.",
      contrast: {
        wrong: "the current after the bulb is smaller because the bulb used some up",
        right: "the current is the same; the bulb transferred energy from the charge passing through it",
      },
    },
    {
      id: "m2",
      belief: "The voltage is the same everywhere in a series circuit.",
      whyItFails:
        "Potential difference is energy transferred per coulomb, and in a series loop each coulomb passes through every component in turn. If every component took the full supply voltage, the charge would gain energy it was never given. The potential differences must add to the supply voltage.",
      correction:
        "In series the current is shared (it is the same everywhere) and the potential differences add. In parallel the potential difference is shared (it is the same across every branch) and the currents add. The two rules are mirror images.",
      contrast: {
        wrong: "series: 12 V across each of two bulbs",
        right: "series: 6 V across each of two equal bulbs, adding to 12 V",
      },
    },
    {
      id: "m3",
      belief: "Adding a second bulb in parallel makes the circuit harder to push current through, so both bulbs dim.",
      whyItFails:
        "Adding a parallel branch gives the charge another route, which makes it easier to flow, not harder. The total resistance falls and the supply delivers more current. Each branch still sits directly across the supply, so each bulb keeps the full voltage and stays as bright as it was alone.",
      correction:
        "In series the resistances add and every component shares the voltage, so both dim. In parallel the branches each see the full supply voltage, so brightness is unchanged and the battery supplies more total current.",
      contrast: {
        wrong: "parallel: two bulbs share 12 V, so each gets 6 V",
        right: "parallel: each branch gets 12 V and the currents add",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A resistor of resistance eight ohms carries a current of two amps. What is the potential difference across it?",
      hint: "You are asked for V, and the equation already has V alone on the left.",
      answer: "16 V",
      feedback: {
        correct:
          "You substituted into V = I R and kept the unit: two amps times eight ohms is sixteen volts.",
        incorrect:
          "Check which quantity you calculated. Dividing instead of multiplying would give a quarter, which is a resistance-like answer to a voltage question.",
      },
    },
    {
      id: "p2",
      prompt:
        "Three identical bulbs are connected in series to a twelve volt supply. What is the potential difference across each bulb, and what current flows if each has resistance four ohms?",
      hint:
        "The supply voltage is shared equally because the bulbs are identical. Find the total resistance first, then the current.",
      answer: "4 V across each bulb, and a current of 1 A",
      feedback: {
        correct:
          "Twelve volts shared between three identical bulbs is four volts each, and twelve volts across twelve ohms is one amp.",
        incorrect:
          "If you gave each bulb twelve volts, the potential differences would add to thirty-six volts from a twelve volt supply. In series the voltages share and the current is common.",
      },
    },
    {
      id: "p3",
      prompt:
        "Two bulbs are connected in parallel across a six volt supply. Each has resistance three ohms. Find the current in each branch and the total current from the supply.",
      hint:
        "Each branch sits directly across the supply, so each branch has the full six volts. Work out one branch first.",
      answer: "2 A in each branch, so 4 A in total",
      feedback: {
        correct:
          "Each branch took the full six volts and drew two amps, and the currents add at the junction because charge is conserved.",
        incorrect:
          "If you halved the voltage between the branches, you treated a parallel circuit as though it were series. Each branch is connected straight across the supply.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why adding a second identical bulb in parallel does not make the first bulb dimmer, while adding it in series does.",
      modelAnswer:
        "In parallel each branch is connected directly across the supply, so each bulb has the full supply potential difference and transfers the same energy per coulomb as before; the supply simply delivers more total current because there are two routes. In series there is one route, so the charge passes through both bulbs and the supply potential difference is shared between them; each bulb now transfers less energy per coulomb, so both are dimmer.",
      marking: [
        "States that each parallel branch has the full supply potential difference.",
        "States that in series the potential difference is shared between the components.",
        "Links the potential difference across a bulb to the energy transferred per coulomb, and therefore to brightness.",
        "Explains the change in total current in the parallel case as an additional route, not as a change to each branch.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A twelve volt supply is connected to a series combination of a four ohm resistor and an eight ohm resistor. Find the current and the potential difference across each resistor.",
      modelAnswer:
        "Total resistance is twelve ohms, so the current is one amp. The four ohm resistor takes four volts and the eight ohm resistor takes eight volts, which add to the twelve volt supply.",
      marking: [
        "Adds the resistances for a series combination.",
        "Uses I = V / R with the total resistance to find one amp.",
        "Uses V = I R on each resistor separately to get four volts and eight volts, and checks they add to the supply.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A car has two identical headlight bulbs. With both connected, the battery supplies more current than with one. A student says this proves the second bulb is using extra energy that the first no longer gets. Use the parallel rules to explain what is actually happening and why the first bulb is unaffected.",
      whyItTransfers:
        "The setting is a vehicle rather than a drawn circuit, and the wrong explanation is plausible because the total current really does rise. The learner has to separate the branch quantity from the supply quantity, which is the same reasoning in a context with no diagram.",
      answer:
        "The bulbs are in parallel, so each branch has the full battery voltage and draws the same current it did alone. The battery supplies more total current because there are two branches, not because the first bulb lost anything. Energy per coulomb across the first bulb is unchanged, so its brightness is unchanged.",
      marking: [
        "Identifies the parallel connection and states each branch has the full supply voltage.",
        "Distinguishes total current from branch current.",
        "Concludes that the first bulb's potential difference, and therefore its brightness, is unchanged.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "A two ohm and a six ohm resistor are in parallel across a twelve volt supply. What is the current in each branch?",
      answer: "Six amps in the two ohm branch and two amps in the six ohm branch.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain, in terms of energy per coulomb, what a voltmeter reading of six volts across a bulb means.",
      answer:
        "Six joules of energy are transferred from the charge to the bulb's surroundings, per coulomb of charge passing through it — as light and heat.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A filament bulb's current-voltage graph curves upward. What does that tell you about its resistance as it heats, and which assumption in V = I R has stopped holding?",
      answer:
        "The resistance rises as the filament heats, so the graph is not a straight line. The assumption that temperature stays constant has stopped holding.",
      when: "month-later",
    },
  ],

  summary: [
    "Charge is conserved and flows; energy per charge is transferred. Current and potential difference are those two ideas measured.",
    "In series the current is the same everywhere and the potential differences add; in parallel the potential difference is the same across each branch and the currents add.",
    "V = I R holds for a component at constant temperature, and the unit is part of the answer.",
    "Brightness follows the energy transferred per coulomb, which is the potential difference across the bulb.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Circuit diagrams are described as connected components in reading order, with each branch's voltage label announced before the components it belongs to.",
    },
    {
      need: "low-vision",
      alternative:
        "The circuit model can be viewed at large scale with high-contrast arrows, and every value is also printed as text beside the diagram.",
    },
    {
      need: "dyslexia",
      alternative:
        "The two circuit rules are given as a matched pair of short sentences, and the worked examples follow the same rearrange, substitute, unit sequence every time.",
    },
    {
      need: "motor",
      alternative:
        "No interaction is required: the parallel and series cases are shown side by side rather than built by the learner.",
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
      sourceId: "gcse-physics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Scope cited against the published GCSE physics subject content for electricity.",
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
