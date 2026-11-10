import type { AuthoredLesson } from "../../lesson-contract";

// A RATE IS A CHANGE PER UNIT TIME, NOT AN AMOUNT.
//
// The lesson starts with a measurement because the commonest error is not a
// missing factor of temperature: it is reporting “40 cm³” as though that were a
// speed. Once rate has units, collision theory has a job to do. Every lever —
// temperature, concentration or pressure, surface area and a catalyst — changes
// either how often particles meet or what fraction of those meetings clears the
// activation barrier. The distinction matters because a catalyst changes the
// second without changing the final amount, while temperature changes both and
// can also change the equilibrium position in a reversible reaction.
//
// The graph is the third representation. A curve that is steep at the start and
// flat at the end is not a decorative line: its gradient is the rate, and its
// plateau says a reactant has run out. A learner who can read that shape can
// answer “why did the rate fall?” without guessing.
export const CHEMISTRY_RATES_REACTION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "rates-reaction",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, rates of reaction: measuring rate, collision theory, temperature, concentration, surface area, catalysts and rate graphs",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against published GCSE subject content for rates of reaction. Every explanation, example, graph description, practice item and assessment is original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Calculate a mean rate from a measured change and a time interval, and state the unit that makes the number a rate.",
      evidence:
        "Given 72 cm³ of gas collected in 3.0 minutes, the learner reports 0.40 cm³/s, shows the division by 180 seconds, and explains why 72 cm³ alone is an amount rather than a rate.",
    },
    {
      statement:
        "Use collision theory to explain how temperature, concentration or pressure, and surface area change the rate of a reaction.",
      evidence:
        "For a reaction between marble chips and acid, the learner explains that powdering increases the exposed surface and therefore the frequency of collisions, without claiming that the activation energy has changed.",
    },
    {
      statement:
        "Explain what a catalyst does to the activation energy and the rate, and what it does not change.",
      evidence:
        "The learner states that a catalyst provides an alternative route with lower activation energy, is not used up, and does not change the final amount or the equilibrium position of a reversible reaction.",
    },
    {
      statement:
        "Interpret a rate graph, distinguishing the initial rate from a later mean rate and explaining a plateau.",
      evidence:
        "On a graph of gas volume against time, the learner identifies the steepest gradient at the start, calculates a mean rate over a stated interval, and explains that the plateau occurs when a reactant has been used up.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["energy-conservation"],
    check: [
      {
        id: "d1",
        question:
          "A mixture of hydrogen and oxygen releases a large amount of energy when it reacts, yet it can sit at room temperature without reacting. What must the molecules do before the reaction can start?",
        answer:
          "The molecules must collide with enough energy to break the bonds that have to break before the new bonds can form. At room temperature only a very small fraction of collisions has that energy, so the reaction is extremely slow even though the overall energy change is favourable.",
        targets: ["energy-conservation"],
      },
      {
        id: "d2",
        question:
          "What is activation energy, and why is it a barrier rather than the overall energy change of the reaction?",
        answer:
          "Activation energy is the minimum energy colliding particles need to reach the transition state and begin breaking the old bonds. It is measured from the reactants to the peak, while the overall energy change is the difference between the reactant and product levels; a reaction can have a large barrier and still release little or no net energy.",
        targets: ["energy-conservation"],
      },
    ],
  },

  introduction: {
    hook:
      "A glow stick is brightest in the first minute and dim after an hour. The same amount of chemical is in the tube at both times, but the light-producing reaction is faster at the start. A marble chip dropped into acid fizzes slowly; the same mass of powdered marble in the same acid fizzes vigorously. Neither change is a change in what the products are. Both are changes in how quickly the reactants become products.",
    why:
      "Rates matter outside the laboratory. A medicine has to act quickly enough to help and slowly enough to last; a fuel has to burn at a controlled speed; food spoils faster in warmth because the reactions that break it down speed up. Collision theory explains all of those cases with one picture: particles must meet, and the meeting must have enough energy. Once a learner can separate the frequency of collisions from the fraction that succeeds, temperature, concentration, surface area and catalysts stop being four facts to memorise.",
  },

  explanation: [
    {
      heading: "A rate is a change divided by the time it took",
      paragraphs: [
        "Rate answers the question “how much change in how long?”. If 72 cm³ of gas is collected in 3.0 minutes, the mean rate is 72 cm³ ÷ 180 s = 0.40 cm³/s. The unit is part of the answer because it says what changed and what the change was measured against. A volume, a mass or a concentration on its own is an amount; dividing by time turns it into a rate.",
        "A mean rate over a long interval hides the shape of the reaction. Most reactions are fastest at the beginning, when the reactants are most concentrated, and slow down as they are used up. The initial rate is the gradient at the very start of the graph, before the concentration has fallen much. A later mean rate is the gradient of a chord drawn between two times. Both are legitimate measurements, but they answer different questions and should not be reported as the same number.",
        "A rate graph also shows when a reaction has stopped. The curve flattens when a reactant is used up, not because the particles have stopped moving. Adding more of the limiting reactant can restart the reaction; adding more of an excess reactant cannot, because the other reactant is already gone. The plateau is therefore evidence about amount, while the slope before it is evidence about speed.",
      ],
    },
    {
      heading: "Collisions must happen, and they must be energetic enough",
      paragraphs: [
        "For a reaction to occur, reactant particles must collide. Not every collision produces products: the particles must be oriented so that the reacting parts meet, and together they must have at least the activation energy needed to break the bonds that must break. Collision theory separates the rate into two factors: how often collisions occur, and what fraction of those collisions has enough energy. Anything that raises either factor raises the rate.",
        "Concentration is the number of particles in a given volume. A more concentrated solution has more reactant particles in the same space, so collisions are more frequent and the rate is higher. Increasing the pressure of a gas has a similar effect because it squeezes the same number of particles into a smaller volume. The particles do not become more energetic; there are simply more opportunities for them to meet.",
        "Surface area matters when one reactant is a solid. A reaction can happen only at the exposed surface, where the solid meets the solution or gas. Breaking a lump into smaller pieces exposes more surface for the same mass, so collisions between the solid and the other reactant are more frequent. The activation energy has not changed. A powder is not “more reactive” in the sense of a different chemistry; it simply offers more places for the reaction to occur.",
      ],
    },
    {
      heading: "Temperature changes both the frequency and the success fraction",
      paragraphs: [
        "Heating a reaction makes the particles move faster on average. Faster particles collide more often, which raises the collision frequency. Temperature also changes the distribution of kinetic energy: a larger fraction of collisions now has at least the activation energy, so a larger fraction of meetings succeeds. Both effects point the same way, which is why a modest temperature rise can produce a large increase in rate.",
        "It is not accurate to say that heat “makes the particles expand” or “gives the reaction more energy” in a vague sense. The particles have a distribution of energies at any temperature; heating shifts that distribution toward higher energies. The activation barrier stays where it is. More particles can clear it, rather than each particle receiving a fixed extra amount.",
        "Temperature can do something the other levers cannot: in a reversible reaction it can change the equilibrium position, because the forward and reverse reactions do not usually have the same activation energy. Concentration, pressure and surface area change how quickly equilibrium is reached, but they do not change the equilibrium constant at a fixed temperature. A rate answer should say which effect is being claimed.",
      ],
    },
    {
      heading: "A catalyst lowers the barrier without being used up",
      paragraphs: [
        "A catalyst provides an alternative pathway with a lower activation energy. With a lower hill to climb, a larger fraction of collisions has enough energy to react, so the rate increases. The catalyst is not consumed by the overall reaction: it takes part in one step and is regenerated in another, so a small amount can catalyse a large amount of reaction. It does not become a product, and it does not change the balanced equation.",
        "A catalyst does not change the energy of the reactants or the products, so it does not change the overall energy change. In a reversible reaction it lowers the barrier for both the forward and reverse directions, so equilibrium is reached sooner but is not pushed to one side. This is why a catalyst can make a process faster and cheaper without increasing the yield at equilibrium — a distinction that matters in industrial chemistry.",
        "Enzymes are biological catalysts. Their specificity comes from shape: a substrate fits a region of the enzyme, and the enzyme holds it in the orientation that makes the reaction easier. High temperature or the wrong pH can change that shape and stop the catalysis, which is why an enzyme has an optimum rather than a simple “hotter is always faster” rule. The same collision-theory language applies, with the shape of the catalyst adding a condition.",
      ],
    },
    {
      heading: "Read the gradient, then read the plateau",
      paragraphs: [
        "A rate graph is a record of amount against time. Its gradient at any point is the rate at that moment. The gradient is steepest at the beginning, when the reactant concentration is highest, and becomes shallower as the reactant is consumed. If the graph is a straight line, the rate is constant over that interval; if it curves, the rate is changing. A mean rate is a chord, while an instantaneous rate is a tangent.",
        "The end of the graph is just as informative. When the curve becomes flat, the amount of product is no longer changing, so the rate has fallen to an unmeasurably small value. In a closed system with a limiting reactant, this usually means that reactant has been used up. If the same reaction is repeated with twice as much of the limiting reactant, the plateau will generally be higher because more product can form; if the other reactant is in excess, adding more of it may not change the final amount.",
        "The choice of measurement is part of the method. Gas volume is convenient when a gas is produced; mass loss is convenient when a gas escapes from an open flask; colour or turbidity is convenient when a visible change occurs. Each method has a limit. A colour change may be hard to time precisely, and a mass loss may be too small early in the reaction. The best method is the one that changes clearly over the interval being measured.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.equation",
      body:
        "The reaction of magnesium with hydrochloric acid produces hydrogen gas, so the volume of gas collected is a direct observable of how far the reaction has gone.",
      notation: "Mg + 2HCl → MgCl₂ + H₂",
      caption:
        "The equation is balanced: one magnesium, two hydrogen and two chlorine atoms on each side. The gas volume rises as H₂ is produced, and the rate is the change in that volume divided by the time.",
    },
    {
      id: "r2",
      kind: "chemistry.particle-model",
      body:
        "Reactant particles move through the mixture and collide. A collision can succeed only when the particles have at least the activation energy and meet in a suitable orientation. Increasing concentration increases the number of collisions; heating increases both the number and the fraction that succeed.",
      notation:
        "rate = collision frequency × fraction of collisions with energy ≥ Eₐ",
      caption:
        "The equation is a summary, not a calculation to memorise. Surface area changes the exposed area where collisions can occur; a catalyst lowers Eₐ and therefore raises the successful fraction.",
    },
    {
      id: "r3",
      kind: "chemistry.calculation",
      body:
        "Mean rate is found by dividing the measured change by the time interval. The units must be converted to a consistent time unit before dividing, and the answer carries the unit of the change divided by the unit of time.",
      notation: "mean rate = change in amount ÷ time taken",
      caption:
        "For 48 cm³ in 2.0 minutes: 2.0 minutes is 120 s, so the mean rate is 48 ÷ 120 = 0.40 cm³/s. A rate is not the same as the total volume collected.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "A catalyst offers a different route between the same reactants and products. The new route has a lower peak, so more collisions have enough energy to cross it, but the starting and finishing levels are unchanged.",
      notation:
        "uncatalysed route: higher Eₐ   ·   catalysed route: lower Eₐ   ·   reactants and products unchanged",
      caption:
        "The catalyst is regenerated at the end of the route. It changes the rate and the time needed to reach equilibrium, not the final position or the overall energy change.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "In an experiment, 0.080 g of magnesium ribbon reacts with excess hydrochloric acid. The mass loss after 20.0 s is 0.080 g. Calculate the mean rate of mass loss in g/s and explain why the instantaneous rate at the start is higher.",
      steps: [
        {
          move: "Write the mean rate as the mass change divided by the time interval: 0.080 g ÷ 20.0 s.",
          why:
            "A mean rate needs both the amount that changed and the time over which it changed; dividing by time is what turns the mass into a rate.",
        },
        {
          move: "Carry out the division: 0.080 ÷ 20.0 = 0.0040 g/s.",
          why:
            "The unit is grams per second because the numerator is in grams and the denominator is in seconds; quoting only 0.0040 would hide what was measured.",
        },
        {
          move: "State that the instantaneous rate at the start is higher because the acid concentration is highest then.",
          why:
            "More acid particles per unit volume means more frequent collisions between the acid and the magnesium surface, so the initial gradient is steeper than the mean over the whole interval.",
        },
        {
          move: "Distinguish the plateau from a change in the particles' speed.",
          why:
            "When the magnesium is used up, the mass stops changing even though the particles continue to move; the flat graph is evidence that the limiting reactant has been consumed, not that motion has stopped.",
        },
      ],
      answer:
        "Mean rate = 0.080 g ÷ 20.0 s = 0.0040 g/s. The initial rate is higher because the acid is most concentrated at the start, so collisions with the metal surface are more frequent. The rate then falls as the acid is used up, and the mass becomes constant when the magnesium is exhausted.",
    },
    {
      id: "w2",
      prompt:
        "Two experiments use 2.0 g of calcium carbonate and 25 cm³ of the same hydrochloric acid at the same temperature. Experiment A uses one large chip; Experiment B uses the same mass of powder. Experiment A collects 40 cm³ of gas in 60 s; Experiment B collects 40 cm³ in 15 s. Calculate both mean rates and explain the difference.",
      steps: [
        {
          move: "Calculate the mean rate for the chip: 40 cm³ ÷ 60 s = 0.67 cm³/s.",
          why:
            "The volume of gas collected is divided by the time taken, giving a rate in cubic centimetres per second for this experiment.",
        },
        {
          move: "Calculate the mean rate for the powder: 40 cm³ ÷ 15 s = 2.7 cm³/s.",
          why:
            "The same volume is produced in a quarter of the time, so the powder's mean rate is about four times larger.",
        },
        {
          move: "Explain the difference using exposed surface area rather than a different activation energy.",
          why:
            "The powder has a much larger surface in contact with the acid, so acid particles collide with the solid more frequently; the activation energy for the reaction itself is unchanged.",
        },
        {
          move: "Check that the final volume can still be the same.",
          why:
            "Both experiments use the same mass of calcium carbonate, so they can produce the same maximum volume of gas; the powder simply reaches that limit sooner.",
        },
      ],
      answer:
        "Chip mean rate = 40 ÷ 60 = 0.67 cm³/s. Powder mean rate = 40 ÷ 15 = 2.7 cm³/s (both to two significant figures). The powder is faster because the same mass has a much larger exposed surface area, so collisions between acid particles and the solid are more frequent. The final volume is the same because the amount of calcium carbonate is the same.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A catalyst increases the yield of a reversible reaction.",
      whyItFails:
        "A catalyst lowers the activation energy for both the forward and reverse reactions, so equilibrium is reached sooner. It does not change the energy of the reactants or the products, so it does not move the equilibrium position or change the equilibrium constant at a fixed temperature. The final amount at equilibrium is controlled by the conditions, not by how quickly the mixture gets there.",
      correction:
        "Separate rate from position: a catalyst changes how quickly equilibrium is reached, while temperature, pressure and concentration change where the equilibrium lies. A catalyst can raise the yield per unit time without raising the yield at equilibrium.",
      contrast: {
        wrong: "the catalyst pushes the reaction to the products, so there is more product at equilibrium",
        right:
          "the catalyst helps both directions reach equilibrium sooner, but the equilibrium amount is unchanged",
      },
    },
    {
      id: "m2",
      belief: "Heating a reaction makes the particles expand, so there is more space for them to react.",
      whyItFails:
        "Particles do not expand in the way this explanation suggests. Heating increases their average kinetic energy, so they move faster and collide more often. It also shifts the distribution of energies so that a larger fraction of collisions has at least the activation energy. The barrier itself does not move.",
      correction:
        "Explain temperature with collision frequency and the fraction of collisions that clear Eₐ. In a gas, heating can also change the volume or pressure, but that is a separate effect on concentration.",
      contrast: {
        wrong: "the particles get bigger and spread out, so the reaction has more room",
        right:
          "the particles move faster and more of them have enough energy to clear the activation barrier",
      },
    },
    {
      id: "m3",
      belief: "A rate is the amount of product formed.",
      whyItFails:
        "The amount of product is a quantity, not a speed. A reaction can make a large amount slowly or a small amount quickly. Rate is the change in amount divided by the time, so the same final volume can be produced at a high rate or a low rate. Reporting only the volume loses the time information that makes it a rate.",
      correction:
        "Always write the division by time and the unit. If a question asks for a rate, the answer needs a per-second, per-minute or per-unit-time form; if it asks for the amount, it does not.",
      contrast: {
        wrong: "the rate is 40 cm³ because that is how much gas was collected",
        right:
          "the rate is 40 cm³ ÷ 60 s = 0.67 cm³/s; 40 cm³ is the amount collected",
      },
    },
    {
      id: "m4",
      belief: "Powdering a solid makes it more reactive by lowering its activation energy.",
      whyItFails:
        "Breaking a solid into smaller pieces increases the exposed surface area. More surface means more frequent collisions between the solid and the other reactant, so the rate rises. The activation energy is a property of the reaction pathway, not of the particle size, and it is unchanged by powdering.",
      correction:
        "Use surface area to explain the change in collision frequency. Use a catalyst to explain a change in activation energy. The two explanations both raise the rate, but they are not the same mechanism.",
      contrast: {
        wrong: "the powder has a lower activation energy, so it reacts faster",
        right:
          "the powder exposes more surface, so collisions are more frequent; the activation energy is the same",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A reaction collects 72 cm³ of gas in 3.0 minutes. Calculate the mean rate in cm³/s.",
      hint:
        "Convert the time to seconds first, then divide the volume by that time; the unit of the answer comes from the division.",
      answer: "3.0 minutes = 180 s, so the mean rate is 72 ÷ 180 = 0.40 cm³/s.",
      feedback: {
        correct:
          "Correct. You converted the time and kept the unit, so the answer is a rate rather than a volume.",
        incorrect:
          "Check two things: 3.0 minutes is 180 seconds, not 3 seconds, and the volume must be divided by the time. The result should be smaller than 72 because it is a rate per second.",
      },
    },
    {
      id: "p2",
      prompt:
        "A reaction starts quickly and then slows down. Explain why the rate falls even though the temperature is kept constant.",
      hint:
        "Think about what happens to the concentration of the reactants as the reaction proceeds, and what that does to the frequency of collisions.",
      answer:
        "As the reactants are converted into products, their concentration falls. Fewer reactant particles per unit volume means fewer collisions per second, so the rate decreases. The temperature and the activation energy are unchanged; the change is in the collision frequency.",
      feedback: {
        correct:
          "Correct. You separated the falling concentration from a change in temperature or activation energy, which is the distinction the graph is testing.",
        incorrect:
          "The temperature is constant, so the particles are not getting slower overall. What falls is the concentration of reactants, which reduces how often they collide.",
      },
    },
    {
      id: "p3",
      prompt:
        "A catalyst makes a reaction faster, but the final volume of gas collected is the same. Explain why the volume is unchanged.",
      hint:
        "Ask what the catalyst changes about the pathway and what it leaves unchanged about the reactants and products.",
      answer:
        "The catalyst lowers the activation energy, so the reaction reaches the same products sooner. It does not change the amount of reactant present or the stoichiometry of the reaction, so the same maximum volume of gas is produced. The catalyst is regenerated rather than consumed.",
      feedback: {
        correct:
          "Correct. You linked the lower barrier to a faster approach to the same final amount, rather than to a larger yield.",
        incorrect:
          "A catalyst changes the route and the rate, not the balanced equation or the amount of reactant. The same reactant can produce only the same maximum amount of product.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "In an experiment, 0.10 g of magnesium reacts with excess acid and the mass loss after 25 s is 0.10 g. Calculate the mean rate of mass loss in g/s.",
      modelAnswer: "0.0040 g/s",
      marking: [
        "Divides the mass change by the time: 0.10 ÷ 25.",
        "Reports 0.0040 g/s with both the value and the unit.",
      ],
      check: {
        accepted: ["0.0040 g/s", "0.004 g/s", "4.0 × 10⁻³ g/s", "0.0040", "0.004"],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A reaction collects 48 cm³ of gas in 2.0 minutes. Calculate the mean rate in cm³/s.",
      modelAnswer: "0.40 cm³/s",
      marking: [
        "Converts 2.0 minutes to 120 seconds.",
        "Divides 48 cm³ by 120 s and reports 0.40 cm³/s.",
      ],
      check: {
        accepted: ["0.40 cm³/s", "0.4 cm³/s", "0.40", "0.4"],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "A reaction is repeated with the same amounts at the same temperature, once with a catalyst and once without. Explain why the catalysed reaction reaches the same final amount of product sooner.",
      modelAnswer:
        "The catalyst provides an alternative pathway with a lower activation energy, so a larger fraction of collisions has enough energy to react and the rate is higher. The catalyst is not used up and does not change the reactants or products, so the same balanced reaction produces the same final amount. It reaches that amount sooner because the rate is greater, not because the equilibrium position or the yield has changed.",
      marking: [
        "Explains that the catalyst lowers the activation energy by providing an alternative pathway.",
        "Links the lower barrier to a larger fraction of successful collisions and a higher rate.",
        "States that the catalyst does not change the amount or identity of the products and is not consumed.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A glow stick is bright for the first minute and then becomes dim over several hours. A second glow stick is placed in a freezer and glows dimly for much longer. Explain both observations using collision theory and the idea of a rate, rather than saying that the chemical “runs out”. Both sticks contain the same amounts.",
      whyItTransfers:
        "The lesson measured gas volume from a reaction in a flask. Here the observable is light, the reaction is the same in both sticks, and the learner must transfer the rate explanation to a different measurement and a different temperature without inventing a new chemical reaction.",
      answer:
        "The glow is produced by a reaction, so its brightness is a measure of the reaction rate. At room temperature the reactant particles collide frequently and a large fraction has enough energy to react, so the initial rate is high and the stick is bright. As the reactants are used up, their concentration falls and the rate decreases, so the light fades. In the freezer, the particles have less kinetic energy: collisions are less frequent and a smaller fraction clears the activation energy. The reaction is slower, so the light is dimmer but lasts longer. The total amount of reactant is the same in both sticks, so the total light-producing reaction is the same; only the time over which it happens is different.",
      marking: [
        "Identifies brightness with reaction rate and fading with falling reactant concentration.",
        "Explains the freezer using lower kinetic energy, fewer collisions and a smaller fraction with enough energy.",
        "Distinguishes the total amount of reactant from the rate at which it is used.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State the two conditions collision theory requires for a collision to produce a reaction.",
      answer:
        "The particles must collide with enough energy to clear the activation barrier, and they must meet in an orientation that allows the reacting bonds to change. A collision without enough energy is not successful even if the particles touch.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "A reaction collects 120 cm³ of gas in 4.0 minutes. Calculate the mean rate in cm³/s.",
      answer: "4.0 minutes = 240 s, so the mean rate is 120 ÷ 240 = 0.50 cm³/s.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain the difference between what a catalyst changes and what it does not change in a reversible reaction.",
      answer:
        "A catalyst lowers the activation energy for both directions, so the reaction reaches equilibrium sooner. It does not change the energy levels of the reactants and products, so it does not change the equilibrium position, the equilibrium constant at a fixed temperature or the final yield.",
      when: "month-later",
    },
  ],

  summary: [
    "Rate is a change in amount divided by time; the unit is part of the answer, and a mean rate over a long interval is not the initial rate.",
    "Collision theory requires collisions with enough energy and a suitable orientation; concentration and surface area change collision frequency, while a catalyst changes the fraction that clears the barrier.",
    "Heating increases both collision frequency and the fraction of collisions with at least the activation energy; it can also change an equilibrium position in a reversible reaction.",
    "A rate graph's gradient is the rate, its steep start is the highest concentration, and its plateau is evidence that a limiting reactant has been used up.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every equation and calculation is also stated in words, and the rate graph is described as a sequence of gradients and a final plateau rather than as a picture that must be seen.",
    },
    {
      need: "colour-vision",
      alternative:
        "Fast and slow rates are labelled with numbers and words, not distinguished by colour alone; the graph's axes, units and plateau carry text labels.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each rate calculation follows the same three-line pattern: the relationship, the substitution with units, and the result with its unit; the collision explanation is repeated in a short summary after each section.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no diagram has to be dragged, drawn or resized, and the lesson does not require a timed animation to understand the rate.",
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
        "All explanations, experiments, calculations, practice items, assessments and the glow-stick transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE chemistry subject content for rates of reaction.",
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
