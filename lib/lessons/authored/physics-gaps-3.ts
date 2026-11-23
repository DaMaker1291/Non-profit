import { defineGapLesson } from "./_gap-lesson";

// PHYSICS GAP BATCH 3 — electromagnetic induction, thermal energy and fluids.

export const PHYSICS_EM_INDUCTION = defineGapLesson({
  conceptId: "em-induction",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, electromagnetism: electromagnetic induction, generators and transformers",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for electromagnetic induction and transformers. The transformer examples are original.",
  },
  objectives: [
    {
      statement:
        "Explain that a changing magnetic flux through a coil induces a voltage, and name the factors that increase it.",
      evidence:
        "The learner states that moving a magnet faster, using more turns or using a stronger magnet increases the induced voltage.",
    },
    {
      statement:
        "Use the transformer turns ratio to calculate a secondary voltage.",
      evidence:
        "For 240 V across 1,200 primary turns and 100 secondary turns, the learner finds 20 V.",
    },
    {
      statement:
        "Use power conservation in an ideal transformer to find a current.",
      evidence:
        "For a 230 V primary and a 23 V secondary delivering 2 A, the learner finds a primary current of 0.2 A.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["magnetism", "electricity-circuits"],
    check: [
      {
        id: "d1",
        question: "What happens to a wire carrying a current in a magnetic field?",
        answer:
          "It experiences a force perpendicular to both the current and the field, described by the motor effect.",
        targets: ["magnetism"],
      },
      {
        id: "d2",
        question: "What is electrical power in terms of voltage and current?",
        answer: "P = VI; power equals voltage multiplied by current.",
        targets: ["electricity-circuits"],
      },
    ],
  },
  introduction: {
    hook:
      "A magnet pushed into a coil makes a meter deflect; hold it still and the deflection stops. The meter responds to change, not to the presence of the magnet. That is electromagnetic induction: a changing magnetic flux drives a voltage. The same idea runs generators, and it is why transformers only work with alternating current.",
    why:
      "Induction is the reverse of the motor effect. A current in a field feels a force; a changing field through a coil drives a current. The symmetry is the heart of the topic. Generators convert motion into electrical energy, transformers change voltage while conserving power in an ideal device, and the requirement for change explains why DC does not pass a transformer. This lesson keeps the change and the turns ratio at the centre.",
  },
  explanation: [
    {
      heading: "Induction needs a change, not just a field",
      paragraphs: [
        "A stationary magnet near a coil produces no induced voltage, even though the coil is in a magnetic field. Moving the magnet changes the flux through the coil, and that change induces a voltage. The faster the change, the larger the voltage. Reversing the motion reverses the voltage, because the flux is changing in the opposite direction.",
        "The induced voltage also increases with the number of turns and the strength of the magnet. A coil with more turns links more flux, so each change produces a larger effect. The model assumes the coil is stationary and the flux changes uniformly; a rotating coil produces an alternating voltage because the flux through it rises and falls periodically.",
      ],
    },
    {
      heading: "Generators turn motion into alternating voltage",
      paragraphs: [
        "An AC generator rotates a coil in a magnetic field. As the coil turns, the flux through it changes from maximum to zero and back, so the induced voltage alternates. Slip rings connect the rotating coil to the external circuit without twisting the wires. A DC generator uses a commutator instead, which reverses the connections every half turn so the external current stays in one direction.",
        "The output frequency equals the number of complete rotations per second. A turbine that spins faster produces a higher frequency, and more turns or a stronger field produce a larger voltage. The model assumes a uniform field and a constant rotation rate; a real generator has losses and its output is not a perfect sine wave.",
      ],
    },
    {
      heading: "Transformers change voltage by the turns ratio",
      paragraphs: [
        "A transformer has a primary coil and a secondary coil wound on a shared iron core. Alternating current in the primary creates a changing flux in the core, which links the secondary and induces a voltage. The voltage ratio equals the turns ratio: Vp/Vs = Np/Ns. A step-down transformer has fewer secondary turns; a step-up transformer has more.",
        "In an ideal transformer, power is conserved, so VpIp = VsIs. A transformer that steps voltage down therefore steps current up. The ideal model assumes no flux leakage, no heating in the coils and a core that does not saturate. Real transformers are close to ideal but not perfect, and they cannot change DC because a steady current produces a steady flux, which induces no voltage.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "The voltage ratio across an ideal transformer equals the ratio of turns on the primary and secondary coils.",
      notation: "Vp/Vs = Np/Ns",
      caption:
        "With 240 V on 1,200 primary turns and 100 secondary turns, Vs = 240 × 100/1,200 = 20 V.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Ideal transformer power is conserved: the primary power equals the secondary power.",
      notation: "VpIp = VsIs",
      caption:
        "A 23 V secondary delivering 2 A uses 46 W, so a 230 V primary draws 0.2 A. The voltage falls by ten times and the current rises by ten times.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Voltage is measured in volts, current in amperes, power in watts and turns are counted, not measured in a physical unit.",
      notation: "V: V · I: A · P: W · N: turns",
      caption:
        "The turns ratio is dimensionless, so the voltage unit is unchanged by the ratio. A transformer changes the size of the voltage, not its unit.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A transformer has 1,200 turns on the primary and 100 turns on the secondary. The primary voltage is 240 V. Find the secondary voltage.",
      steps: [
        {
          move: "Use Vp/Vs = Np/Ns and rearrange to Vs = Vp × Ns/Np.",
          why:
            "The secondary voltage is the unknown. The turns ratio scales the primary voltage up or down.",
        },
        {
          move: "Substitute Vs = 240 V × 100/1,200.",
          why:
            "The ratio 100/1,200 is less than one, so this is a step-down transformer and the secondary voltage will be smaller.",
        },
        {
          move: "Vs = 20 V.",
          why:
            "The voltage is in volts because the turns ratio is dimensionless. The secondary has one twelfth of the primary turns, so it has one twelfth of the voltage.",
        },
      ],
      answer: "The secondary voltage is 20 V.",
    },
    {
      id: "w2",
      prompt:
        "An ideal transformer has a 230 V primary and a 23 V secondary delivering 2 A. Find the primary current.",
      steps: [
        {
          move: "Find the secondary power: Ps = VsIs = 23 V × 2 A = 46 W.",
          why:
            "Power is voltage times current. This is the power delivered to the secondary circuit.",
        },
        {
          move: "Use power conservation VpIp = VsIs and rearrange to Ip = Ps/Vp.",
          why:
            "An ideal transformer has no energy losses, so the primary power equals the secondary power.",
        },
        {
          move: "Substitute Ip = 46 W / 230 V = 0.2 A.",
          why:
            "The primary voltage is ten times the secondary, so the primary current is one tenth of the secondary current.",
        },
      ],
      answer: "The primary current is 0.2 A.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A transformer works with direct current because it still has a magnetic field.",
      whyItFails:
        "Induction requires a changing flux. A steady DC current produces a steady field, so the flux through the secondary does not change and no voltage is induced. The transformer may heat up, but it does not transfer power.",
      correction:
        "Check whether the current changes. Transformers need alternating current, or a continuously changing current, to produce a changing flux.",
      contrast: {
        wrong: "DC passes through a transformer because the primary creates a field.",
        right: "DC produces a steady flux, so no voltage is induced; transformers need AC.",
      },
    },
    {
      id: "m2",
      belief: "A step-up transformer increases power because it increases voltage.",
      whyItFails:
        "In an ideal transformer, power is conserved. Increasing the voltage decreases the current by the same factor, so the power stays the same. A real transformer loses some power to heating, so the output is slightly less than the input.",
      correction:
        "Use VpIp = VsIs. The voltage and current change in opposite directions; the product is the power.",
      contrast: {
        wrong: "A step-up transformer gives more power out than in.",
        right: "It raises voltage and lowers current, keeping ideal power constant.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A transformer has 500 primary turns and 50 secondary turns. If the primary voltage is 100 V, find the secondary voltage.",
      hint: "Use the turns ratio: the secondary voltage is the primary voltage multiplied by secondary turns over primary turns.",
      answer: "Vs = 100 × 50/500 = 10 V.",
      feedback: {
        correct: "You applied the turns ratio and recognised a step-down transformer.",
        incorrect:
          "The ratio is 50/500 = 0.1, so the secondary voltage is 10 V, not 1,000 V.",
      },
    },
    {
      id: "p2",
      prompt:
        "Why does moving a magnet faster into a coil increase the induced voltage?",
      hint: "Think about how quickly the magnetic flux through the coil is changing.",
      answer:
        "A faster movement changes the flux more quickly, and a faster change induces a larger voltage.",
      feedback: {
        correct: "You linked the voltage to the rate of change of flux.",
        incorrect:
          "The induced voltage depends on how fast the flux changes. Moving the magnet faster makes the change happen in less time, so the voltage is larger.",
      },
    },
    {
      id: "p3",
      prompt:
        "An ideal transformer has a 12 V secondary delivering 3 A from a 240 V primary. Find the primary current.",
      hint: "Find the secondary power first, then divide by the primary voltage.",
      answer: "Ps = 36 W, so Ip = 36/240 = 0.15 A.",
      feedback: {
        correct: "You conserved power and divided by the primary voltage.",
        incorrect:
          "The secondary power is 12 × 3 = 36 W. The primary current is 36/240 = 0.15 A, not 3 A.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A transformer has 1,200 primary turns, 100 secondary turns and a 240 V primary. Find the secondary voltage.",
      modelAnswer: "20 V",
      marking: [
        "Uses Vs = Vp × Ns/Np.",
        "Computes 240 × 100/1,200 = 20 V.",
      ],
      check: { accepted: ["20 V", "20V", "20"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "An ideal transformer has a 230 V primary and a 23 V secondary delivering 2 A. Find the primary current.",
      modelAnswer: "0.2 A",
      marking: [
        "Finds the secondary power as 46 W.",
        "Divides by 230 V to get 0.2 A.",
      ],
      check: { accepted: ["0.2 A", "0.2A", "0.2", "200 mA"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why a changing magnetic flux induces a voltage, why a transformer does not work with direct current, and why a step-up transformer does not increase power.",
      modelAnswer:
        "A changing flux through a coil induces a voltage; a steady flux does not. A transformer relies on alternating current to create a changing flux in the core, so direct current produces no induced secondary voltage. In an ideal transformer, power is conserved, so a step-up in voltage is accompanied by a step-down in current and the power remains the same.",
      marking: [
        "Links induction to a changing magnetic flux.",
        "Explains that DC gives a steady flux and therefore no induced voltage.",
        "Uses power conservation to explain the voltage–current trade-off.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A power station generates at 25 kV and a transformer steps this up to 400 kV for transmission. The transmission line carries 500 A at 400 kV. Find the power transmitted, the current at 25 kV before the transformer, and explain why high-voltage transmission reduces heating losses. State an assumption.",
      whyItTransfers:
        "The lesson uses a two-coil transformer. The grid example chains a step-up transformer with transmission losses, so the learner must conserve power and connect a lower current to lower heating.",
      answer:
        "Power = 400 kV × 500 A = 200,000,000 W, or 200 MW. At 25 kV the current is 200 MW / 25 kV = 8,000 A. For the same power, a higher voltage means a lower current. Heating in the cables is I²R, so a smaller current greatly reduces the power lost as heat. The calculation assumes an ideal transformer and a transmission line whose resistance is constant.",
      marking: [
        "Calculates 200 MW from 400 kV and 500 A.",
        "Uses power conservation to find 8,000 A at 25 kV.",
        "Explains that lower current reduces I²R heating and states an assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is needed to induce a voltage in a coil?",
      answer: "A changing magnetic flux through the coil.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "State the transformer turns-ratio equation.",
      answer: "Vp/Vs = Np/Ns.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does a transformer not work with DC?",
      answer:
        "DC produces a steady magnetic flux, so there is no change to induce a secondary voltage.",
      when: "month-later",
    },
  ],
  summary: [
    "A changing magnetic flux induces a voltage; a steady field does not.",
    "More turns, a stronger magnet or a faster change increases the induced voltage.",
    "Transformers use the turns ratio Vp/Vs = Np/Ns and need alternating current.",
    "Ideal transformers conserve power, so voltage and current change in opposite directions.",
  ],
});

export const PHYSICS_THERMAL_PHYSICS = defineGapLesson({
  conceptId: "thermal-physics",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, energy: conduction, convection, radiation, specific heat capacity and latent heat",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for thermal energy. The water and ice calculations are original.",
  },
  objectives: [
    {
      statement:
        "Distinguish temperature from heat and describe conduction, convection and radiation.",
      evidence:
        "The learner explains that temperature measures average particle kinetic energy while heat is energy transferred, and matches each transfer process to its mechanism.",
    },
    {
      statement:
        "Calculate the energy needed to change the temperature of a substance using E = mcΔT.",
      evidence:
        "For 2 kg of water heated by 10 °C, the learner calculates 84,000 J.",
    },
    {
      statement:
        "Calculate the energy needed for a state change using E = mL.",
      evidence:
        "For 0.5 kg of ice melted with a specific latent heat of 334,000 J/kg, the learner calculates 167,000 J.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["energy-conservation"],
    check: [
      {
        id: "d1",
        question: "What happens to energy in a closed system?",
        answer:
          "It is conserved: energy is transferred between stores but not created or destroyed.",
        targets: ["energy-conservation"],
      },
      {
        id: "d2",
        question: "What is the difference between temperature and heat?",
        answer:
          "Temperature measures the average kinetic energy of particles; heat is energy transferred because of a temperature difference.",
        targets: ["energy-conservation"],
      },
    ],
  },
  introduction: {
    hook:
      "A metal spoon in hot soup heats quickly, while a wooden handle stays cool. Both are at the same temperature at the surface, but the metal conducts energy through its lattice much faster. A radiator heats a room by convection, and the Sun heats the Earth by radiation across empty space. Three different mechanisms move the same quantity: thermal energy.",
    why:
      "Thermal physics is full of distinctions that are easy to blur: temperature versus heat, specific heat versus latent heat, conduction versus convection. The equations are simple, but they answer different questions. E = mcΔT is for a temperature change with no state change; E = mL is for a state change at constant temperature. This lesson keeps the store and the transfer separate so the right equation is chosen.",
  },
  explanation: [
    {
      heading: "Temperature, heat and the three transfer mechanisms",
      paragraphs: [
        "Temperature is a measure of the average kinetic energy of the particles in a substance. Heat is energy transferred from a hotter body to a cooler one because of the temperature difference. A small spark can be hotter than a bath, but the bath contains far more thermal energy because it has more particles. Temperature and total thermal energy are not the same quantity.",
        "Conduction transfers energy through collisions between particles, and metals conduct well because free electrons carry energy quickly. Convection transfers energy by the bulk movement of a fluid: warmer, less dense fluid rises and cooler fluid sinks. Radiation transfers energy by infrared electromagnetic waves and needs no medium, which is how the Sun's energy reaches Earth. The model assumes ordinary temperatures and no phase change; at extreme temperatures other processes matter.",
      ],
    },
    {
      heading: "Specific heat capacity: energy for a temperature change",
      paragraphs: [
        "The energy needed to raise the temperature of a mass m by ΔT is E = mcΔT, where c is the specific heat capacity. For water, c is about 4,200 J/kg°C, so 2 kg heated by 10 °C needs 2 × 4,200 × 10 = 84,000 J. Water's high specific heat capacity is why it takes a long time to boil and why coastal climates are milder.",
        "The equation assumes no state change and no heat loss to the surroundings. It also assumes c is constant over the temperature range; in reality c varies slightly. A well-insulated container and a small temperature change make the idealisation closer to reality. The unit of c, joules per kilogram per degree Celsius, shows that the energy depends on mass and temperature change.",
      ],
    },
    {
      heading: "Latent heat: energy for a state change",
      paragraphs: [
        "During melting or boiling, the temperature stays constant even though energy is being supplied. The energy breaks the bonds or overcomes the attractions between particles rather than increasing their average kinetic energy. The energy per kilogram is the specific latent heat L, and E = mL. For 0.5 kg of ice with L = 334,000 J/kg, melting needs 167,000 J.",
        "Latent heat of fusion is for solid–liquid changes; latent heat of vaporisation is for liquid–gas changes and is usually much larger because the particles must be completely separated. The model assumes the substance is pure and the pressure is constant. Impurities lower the melting point and change the measured value, so a pure sample is part of the idealisation.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "The energy transferred to change a substance's temperature depends on its mass, specific heat capacity and temperature change.",
      notation: "E = mcΔT",
      caption:
        "For 2 kg of water with c = 4,200 J/kg°C and ΔT = 10 °C, E = 84,000 J. The unit of c makes the result a joule.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The energy needed for a state change depends on the mass and the specific latent heat. The temperature does not change during the process.",
      notation: "E = mL",
      caption:
        "For 0.5 kg of ice with L = 334,000 J/kg, E = 167,000 J. The energy breaks the arrangement rather than raising the temperature.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Energy is measured in joules, mass in kilograms, temperature change in degrees Celsius and specific heat capacity in joules per kilogram per degree Celsius.",
      notation: "E: J · m: kg · ΔT: °C · c: J/(kg°C) · L: J/kg",
      caption:
        "Multiplying kilograms by joules per kilogram per degree Celsius by degrees Celsius leaves joules. Latent heat omits the temperature factor because temperature is constant.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Calculate the energy needed to heat 2 kg of water from 20 °C to 30 °C. Take c = 4,200 J/kg°C.",
      steps: [
        {
          move: "Find the temperature change: ΔT = 30 °C − 20 °C = 10 °C.",
          why:
            "The equation uses the change in temperature, not the final temperature. A change of 10 °C is the same size as a change of 10 K.",
        },
        {
          move: "Use E = mcΔT and substitute E = 2 kg × 4,200 J/kg°C × 10 °C.",
          why:
            "The mass, specific heat capacity and temperature change are all known. The units combine to give joules.",
        },
        {
          move: "E = 84,000 J.",
          why:
            "This is the energy transferred to the water, assuming no heat loss to the surroundings.",
        },
      ],
      answer: "The energy needed is 84,000 J.",
    },
    {
      id: "w2",
      prompt:
        "Calculate the energy needed to melt 0.5 kg of ice at 0 °C. The specific latent heat of fusion is 334,000 J/kg.",
      steps: [
        {
          move: "Use E = mL.",
          why:
            "Melting is a state change at constant temperature, so the temperature-change equation does not apply.",
        },
        {
          move: "Substitute E = 0.5 kg × 334,000 J/kg.",
          why:
            "The mass is in kilograms and the latent heat is energy per kilogram, so the product is in joules.",
        },
        {
          move: "E = 167,000 J.",
          why:
            "The energy breaks the ice lattice; the temperature stays at 0 °C until all the ice has melted.",
        },
      ],
      answer: "The energy needed is 167,000 J.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Adding energy to a substance always raises its temperature.",
      whyItFails:
        "During a state change, the energy changes the arrangement of particles rather than their average kinetic energy, so the temperature stays constant. The added energy is stored as latent heat, not reflected in a thermometer reading.",
      correction:
        "Check whether the substance is changing state. Use E = mcΔT only for a temperature change within one state; use E = mL during melting or boiling.",
      contrast: {
        wrong: "Ice at 0 °C rises in temperature as soon as it starts to melt.",
        right: "Melting ice stays at 0 °C until all the ice has become water.",
      },
    },
    {
      id: "m2",
      belief: "A metal at room temperature contains no thermal energy because it feels cold.",
      whyItFails:
        "Every object above absolute zero has thermal energy from particle motion. A metal feels cold because it conducts energy away from your hand quickly, not because it has no energy. Temperature is a measure of average particle kinetic energy, not a measure of total energy.",
      correction:
        "Distinguish temperature from total thermal energy. A large cool object can contain more thermal energy than a small hot one because it has more particles.",
      contrast: {
        wrong: "Cold metal has no thermal energy.",
        right: "It has thermal energy; it feels cold because it conducts heat away from the hand.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "How much energy is needed to heat 1 kg of water by 5 °C? Take c = 4,200 J/kg°C.",
      hint: "Multiply the mass, the specific heat capacity and the temperature change.",
      answer: "E = 1 × 4,200 × 5 = 21,000 J.",
      feedback: {
        correct: "You used E = mcΔT with the temperature change, not the final temperature.",
        incorrect:
          "The energy is 1 × 4,200 × 5 = 21,000 J. Using 25 °C as the change would overcount.",
      },
    },
    {
      id: "p2",
      prompt:
        "Why does a metal spoon heat up faster than a wooden spoon in hot soup?",
      hint: "Compare how easily each material conducts energy through its particles.",
      answer:
        "Metal conducts energy quickly through free electrons and particle collisions, while wood conducts poorly.",
      feedback: {
        correct: "You linked the rate to conduction and the material's structure.",
        incorrect:
          "Both spoons receive energy, but metal conducts it away from the hot end much faster because of its free electrons.",
      },
    },
    {
      id: "p3",
      prompt:
        "How much energy is needed to boil away 0.2 kg of water at 100 °C? The specific latent heat of vaporisation is 2,260,000 J/kg.",
      hint: "Use E = mL because the temperature stays at 100 °C during boiling.",
      answer: "E = 0.2 × 2,260,000 = 452,000 J.",
      feedback: {
        correct: "You used latent heat rather than a temperature-change equation.",
        incorrect:
          "Boiling is a state change, so use E = mL: 0.2 × 2,260,000 = 452,000 J. The temperature does not rise during boiling.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Calculate the energy needed to heat 2 kg of water by 10 °C. Take c = 4,200 J/kg°C.",
      modelAnswer: "84,000 J",
      marking: [
        "Uses E = mcΔT.",
        "Multiplies 2, 4,200 and 10 to get 84,000 J.",
      ],
      check: { accepted: ["84,000 J", "84000 J", "84 kJ", "84000"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Calculate the energy needed to melt 0.5 kg of ice. The specific latent heat of fusion is 334,000 J/kg.",
      modelAnswer: "167,000 J",
      marking: [
        "Uses E = mL.",
        "Multiplies 0.5 by 334,000 to get 167,000 J.",
      ],
      check: { accepted: ["167,000 J", "167000 J", "167 kJ", "167000"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain the difference between specific heat capacity and specific latent heat, and explain why the temperature stays constant during a state change.",
      modelAnswer:
        "Specific heat capacity is the energy needed to raise the temperature of one kilogram of a substance by one degree Celsius. Specific latent heat is the energy needed to change the state of one kilogram of a substance without changing its temperature. During a state change, the energy overcomes the forces between particles rather than increasing their average kinetic energy, so the temperature remains constant.",
      marking: [
        "Defines specific heat capacity per kilogram per degree.",
        "Defines specific latent heat per kilogram for a state change.",
        "Explains that the energy changes particle arrangement, not average kinetic energy.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "An electric heater supplies 500 W to 1.5 kg of water for 4 minutes. Assuming no heat loss, find the temperature rise. Then explain why the actual rise would be smaller. Take c = 4,200 J/kg°C.",
      whyItTransfers:
        "The lesson calculates the energy for a temperature change. The heater supplies power over time, so the learner must first find the energy and then rearrange E = mcΔT, while recognising the idealisation.",
      answer:
        "Energy supplied = power × time = 500 W × 240 s = 120,000 J. Rearranging E = mcΔT gives ΔT = E/(mc) = 120,000/(1.5 × 4,200) ≈ 19.0 °C. In practice some energy is lost to the surroundings, so the water's temperature rise would be smaller; the calculation assumes perfect insulation and that all the heater's energy enters the water.",
      marking: [
        "Converts 4 minutes to 240 s and finds 120,000 J.",
        "Rearranges E = mcΔT and gets about 19 °C.",
        "Explains that heat loss makes the actual rise smaller and states the assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between temperature and heat?",
      answer:
        "Temperature measures average particle kinetic energy; heat is energy transferred because of a temperature difference.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "State the equation for a temperature change.",
      answer: "E = mcΔT.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does the temperature stay constant during melting?",
      answer:
        "The energy changes the particle arrangement rather than increasing average kinetic energy.",
      when: "month-later",
    },
  ],
  summary: [
    "Temperature measures average particle kinetic energy; heat is energy in transit.",
    "Conduction, convection and radiation transfer thermal energy by different mechanisms.",
    "E = mcΔT applies to a temperature change within one state.",
    "E = mL applies to a state change at constant temperature.",
  ],
});

export const PHYSICS_PRESSURE_FLUIDS = defineGapLesson({
  conceptId: "pressure-fluids",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, forces and pressure: pressure, density and pressure in fluids",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for pressure and fluids. The hydraulic and depth examples are original.",
  },
  objectives: [
    {
      statement:
        "Calculate pressure as force divided by area and explain why the same force can produce very different pressures.",
      evidence:
        "For a 600 N force over 0.02 m², the learner calculates 30,000 Pa and explains the stiletto-heel effect.",
    },
    {
      statement:
        "Calculate the pressure at a depth in a fluid using P = ρgh.",
      evidence:
        "For water of density 1,000 kg/m³ at 5 m depth, the learner calculates 49,000 Pa.",
    },
    {
      statement:
        "Use the hydraulic principle to find a force or area in a simple hydraulic system.",
      evidence:
        "The learner uses equal pressure to find the output force when a small piston and a larger piston have known areas.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["forces-basics"],
    check: [
      {
        id: "d1",
        question: "What is pressure?",
        answer:
          "Force per unit area, measured in pascals; one pascal is one newton per square metre.",
        targets: ["forces-basics"],
      },
      {
        id: "d2",
        question: "What is density?",
        answer:
          "Mass per unit volume, measured in kilograms per cubic metre.",
        targets: ["forces-basics"],
      },
    ],
  },
  introduction: {
    hook:
      "A stiletto heel and a flat shoe can exert the same force on a floor, but the heel dents wood while the flat shoe does not. The difference is the area over which the force is spread. In a fluid, pressure grows with depth: a dam must be thicker at the bottom because the water pressure there is greater. Hydraulic brakes use the same principle to multiply a small force into a large one.",
    why:
      "Pressure links force to area, and in fluids it links depth to density. The two formulas look different but share the same idea: force spread over an area. P = F/A is direct; P = ρgh comes from the weight of the fluid column above a point. Hydraulics uses equal pressure at the same height to trade force for area. This lesson keeps the area and depth dependencies separate and checks the units at each step.",
  },
  explanation: [
    {
      heading: "Pressure is force spread over area",
      paragraphs: [
        "Pressure is P = F/A, measured in pascals. One pascal is one newton per square metre. A 600 N person standing on a 0.02 m² heel exerts 30,000 Pa; the same person on a 0.2 m² flat sole exerts 3,000 Pa. The force is the same, but the smaller area concentrates it. This is why sharp knives cut and wide tyres float on soft ground.",
        "The force in P = F/A is the component perpendicular to the surface. A force parallel to the surface produces shear, not pressure in this sense. The area is the contact area, not the total surface area of the object. The model assumes the force is evenly distributed; a real contact may have high-pressure points, which is why a rough surface can scratch even when the average pressure is low.",
      ],
    },
    {
      heading: "Pressure in a fluid increases with depth",
      paragraphs: [
        "In a static fluid, the pressure at depth h is P = ρgh, where ρ is the density and g is the gravitational field strength. The pressure comes from the weight of the fluid column above the point. For water with ρ = 1,000 kg/m³ at 5 m, P = 1,000 × 9.8 × 5 = 49,000 Pa. This is the pressure due to the water alone; the total pressure also includes atmospheric pressure at the surface.",
        "The pressure acts equally in all directions at a given depth, which is why a diver feels it on the ears and why a hole in a container sprays water sideways as well as downwards. The model assumes the fluid is incompressible and its density is constant. Water is nearly incompressible at ordinary pressures; a gas is not, so P = ρgh is a poor approximation for a tall column of gas.",
      ],
    },
    {
      heading: "Hydraulics uses equal pressure to multiply force",
      paragraphs: [
        "In a sealed hydraulic system, the pressure applied at one piston is transmitted to the other. If the second piston has a larger area, the force on it is larger: F₂ = F₁ × A₂/A₁. A 20 N force on a 0.01 m² piston produces 2,000 Pa; applied to a 0.05 m² piston, that pressure gives 100 N. The force is multiplied, but the smaller piston must move farther, so the work done is the same in an ideal system.",
        "The model assumes the fluid is incompressible, the system is sealed and friction is negligible. Real hydraulic fluid leaks, hoses expand and friction loses energy, so the output force is somewhat less than the ideal prediction. The multiplication of force is not free energy; it is a trade of distance for force.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Pressure is the force perpendicular to a surface divided by the contact area.",
      notation: "P = F/A",
      caption:
        "A 600 N force on 0.02 m² gives 30,000 Pa. The same force on 0.2 m² gives 3,000 Pa, so the larger area lowers the pressure.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The pressure due to a fluid column depends on density, gravitational field strength and depth.",
      notation: "P = ρgh",
      caption:
        "Water of density 1,000 kg/m³ at 5 m gives 49,000 Pa. Doubling the depth doubles this pressure because the column is twice as tall.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Pressure is measured in pascals, force in newtons, area in square metres, density in kilograms per cubic metre and depth in metres.",
      notation: "P: Pa · F: N · A: m² · ρ: kg/m³ · h: m",
      caption:
        "One pascal is one newton per square metre. Multiplying kilograms per cubic metre by metres per second squared by metres also gives newtons per square metre.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A force of 600 N acts on an area of 0.02 m². Calculate the pressure.",
      steps: [
        {
          move: "Use P = F/A.",
          why:
            "Pressure is force divided by the contact area. The force must be perpendicular to the surface.",
        },
        {
          move: "Substitute P = 600 N / 0.02 m².",
          why:
            "Newtons divided by square metres give pascals. The area is small, so the pressure will be large.",
        },
        {
          move: "P = 30,000 Pa.",
          why:
            "The same force over a larger area would give a smaller pressure. The pascal is the unit of pressure.",
        },
      ],
      answer: "The pressure is 30,000 Pa.",
    },
    {
      id: "w2",
      prompt:
        "Calculate the pressure due to water at a depth of 5 m. The density of water is 1,000 kg/m³ and g = 9.8 N/kg.",
      steps: [
        {
          move: "Use P = ρgh.",
          why:
            "The pressure comes from the weight of the water column above the point. Density, field strength and depth are the three factors.",
        },
        {
          move: "Substitute P = 1,000 kg/m³ × 9.8 N/kg × 5 m.",
          why:
            "The units combine to give newtons per square metre, which is pascals.",
        },
        {
          move: "P = 49,000 Pa.",
          why:
            "This is the gauge pressure due to the water. The total pressure would also include atmospheric pressure at the surface.",
        },
      ],
      answer: "The pressure due to the water is 49,000 Pa.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Pressure depends only on the force, so a larger force always means a larger pressure.",
      whyItFails:
        "Pressure is force divided by area. A large force spread over a very large area can produce a smaller pressure than a small force concentrated on a tiny area. The area is part of the definition.",
      correction:
        "Compare both force and area. Use P = F/A and check whether the area changed as well as the force.",
      contrast: {
        wrong: "The larger force always gives the larger pressure.",
        right: "Pressure depends on force per unit area; the area can reverse the comparison.",
      },
    },
    {
      id: "m2",
      belief: "The pressure at a depth depends on the total volume of water in the container.",
      whyItFails:
        "The pressure at a depth depends on the height of the fluid column above it, not on the total volume. A narrow tube and a wide tank filled to the same height have the same pressure at the bottom, because the weight per unit area is the same.",
      correction:
        "Use P = ρgh and identify the vertical depth. The shape and total volume do not enter the formula for a static fluid of uniform density.",
      contrast: {
        wrong: "A wider tank has more pressure at the same depth because it holds more water.",
        right: "The pressure at the same depth is the same; only the depth, density and g matter.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A force of 200 N acts on an area of 0.5 m². Calculate the pressure.",
      hint: "Divide the force in newtons by the area in square metres.",
      answer: "P = 200/0.5 = 400 Pa.",
      feedback: {
        correct: "You divided force by area and kept the pascal unit.",
        incorrect:
          "Pressure is 200/0.5 = 400 Pa. Multiplying would give a force times area, not a pressure.",
      },
    },
    {
      id: "p2",
      prompt:
        "Calculate the pressure due to water at a depth of 2 m. Use ρ = 1,000 kg/m³ and g = 9.8 N/kg.",
      hint: "Multiply density, gravitational field strength and depth.",
      answer: "P = 1,000 × 9.8 × 2 = 19,600 Pa.",
      feedback: {
        correct: "You applied P = ρgh with the depth in metres.",
        incorrect:
          "The pressure is 1,000 × 9.8 × 2 = 19,600 Pa. Using the volume instead of the depth would be wrong.",
      },
    },
    {
      id: "p3",
      prompt:
        "In a hydraulic system, a 30 N force acts on a 0.01 m² piston. What force acts on a 0.06 m² piston?",
      hint: "Find the pressure first, then multiply by the larger area.",
      answer: "P = 3,000 Pa, so F = 3,000 × 0.06 = 180 N.",
      feedback: {
        correct: "You used equal pressure and the larger area to multiply the force.",
        incorrect:
          "The pressure is 30/0.01 = 3,000 Pa. On 0.06 m², the force is 180 N, not 30 N.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "A force of 600 N acts on an area of 0.02 m². Calculate the pressure.",
      modelAnswer: "30,000 Pa",
      marking: [
        "Uses P = F/A.",
        "Divides 600 by 0.02 to get 30,000 Pa.",
      ],
      check: { accepted: ["30,000 Pa", "30000 Pa", "30 kPa", "30000"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Calculate the pressure due to water at 5 m depth. Use ρ = 1,000 kg/m³ and g = 9.8 N/kg.",
      modelAnswer: "49,000 Pa",
      marking: [
        "Uses P = ρgh.",
        "Multiplies 1,000, 9.8 and 5 to get 49,000 Pa.",
      ],
      check: { accepted: ["49,000 Pa", "49000 Pa", "49 kPa", "49000"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why a stiletto heel can dent a floor while a flat shoe does not, and why the pressure at the bottom of a dam depends on depth rather than on the total volume of water.",
      modelAnswer:
        "The heel and the flat shoe may exert the same force, but the heel has a much smaller contact area, so P = F/A is much larger. In a static fluid, the pressure at a depth comes from the weight of the column above that point; it depends on density, g and depth, not on the total volume or the shape of the container. A narrow tube and a wide tank at the same depth have the same pressure at the bottom.",
      marking: [
        "Uses P = F/A to compare the heel and the flat shoe.",
        "Explains that fluid pressure depends on the weight of the column above.",
        "States that depth, density and g determine the pressure, not total volume.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A hydraulic car lift has an input piston of area 0.002 m² and an output piston of area 0.08 m². A force of 150 N is applied to the input. Find the output force and the distance the output piston moves if the input piston moves 0.4 m. State an assumption.",
      whyItTransfers:
        "The lesson applies equal pressure in a simple hydraulic system. The car lift adds a distance calculation, so the learner must connect force multiplication to the conservation of work and see that the larger force moves a shorter distance.",
      answer:
        "Input pressure = 150 N / 0.002 m² = 75,000 Pa. Output force = 75,000 × 0.08 = 6,000 N. The work input is 150 N × 0.4 m = 60 J, so in an ideal system the output distance is 60 J / 6,000 N = 0.01 m. The calculation assumes an incompressible fluid, a sealed system and no friction or energy losses.",
      marking: [
        "Finds the input pressure as 75,000 Pa.",
        "Multiplies by the output area to get 6,000 N.",
        "Uses work conservation to get 0.01 m and states an assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is pressure, and what is its unit?",
      answer:
        "Force per unit area, measured in pascals; one pascal is one newton per square metre.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "How does pressure in a fluid change with depth?",
      answer:
        "It increases with depth according to P = ρgh, because the weight of fluid above increases.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why can a hydraulic system multiply force?",
      answer:
        "Equal pressure acting on a larger area produces a larger force; the smaller piston moves farther to conserve work.",
      when: "month-later",
    },
  ],
  summary: [
    "Pressure is force per unit area, measured in pascals.",
    "The same force produces a larger pressure over a smaller contact area.",
    "In a static fluid, pressure increases with depth according to P = ρgh.",
    "Hydraulic systems transmit equal pressure and trade distance for force.",
  ],
});
