import type { AuthoredLesson } from "../../lesson-contract";

// ENERGY IS THE ACCOUNTING RULE THE REST OF PHYSICS BORROWS.
//
// `electricity-circuits` already declares this concept as prior knowledge, but
// it had no authored lesson: a learner following that prerequisite was sent to
// a genome paragraph. The lesson therefore starts with the accounting idea —
// stores, transfers and a closed system — before either formula. The two
// formulas are introduced as ways of counting a store, not as definitions to
// memorise, because the common failure is not arithmetic: it is believing that
// energy disappears when something stops.
export const PHYSICS_ENERGY: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "energy-conservation",
  version: "1.0.0",
  subject: "physics",
  curriculum: {
    reference:
      "GCSE Physics, energy: energy stores and systems, conservation of energy, kinetic and gravitational potential energy",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. All explanations, examples and questions are original; no specification text or examination question is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Name the energy store that changes in a simple process and describe the transfer that fills or empties it.",
      evidence:
        "For a ball falling from a shelf, the learner names the gravitational potential store decreasing, the kinetic store increasing, and the heating of the air and ground as the transfer that eventually removes the energy from the ball's motion.",
    },
    {
      statement:
        "Calculate gravitational potential energy and kinetic energy, stating the unit of each answer.",
      evidence:
        "The learner calculates the gravitational potential energy of a 2 kg book lifted 1.5 m as 29.4 J, and the kinetic energy of a 0.20 kg ball moving at 5 m/s as 2.5 J, with the correct unit in both answers.",
    },
    {
      statement:
        "Use conservation of energy to explain why a moving object slows down without claiming that its energy has been destroyed.",
      evidence:
        "The learner explains that friction transfers energy from the kinetic store to the thermal store of the surroundings, so the total energy is unchanged even though the object's speed falls.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question:
          "A force is measured in newtons and a distance in metres. What unit do you get when you multiply a force by a distance, and what kind of quantity is it?",
        answer:
          "The unit is the newton metre, which is the joule. A joule is a unit of energy, so multiplying a force by the distance moved in its direction counts energy transferred.",
        targets: ["energy-conservation"],
      },
      {
        id: "d2",
        question:
          "A car doubles its speed from 10 m/s to 20 m/s. Does it have twice as much kinetic energy, more than twice, or less than twice? Explain your reasoning.",
        answer:
          "It has more than twice as much, because kinetic energy depends on the square of speed. Doubling the speed multiplies the kinetic energy by four, assuming the mass is unchanged.",
        targets: ["energy-conservation"],
      },
    ],
  },

  introduction: {
    hook:
      "A roller coaster climbs slowly to the top of its first hill, pauses for a moment, then races down. At the top it is barely moving; at the bottom it is moving fastest. Nothing has been added to the car between those two points. The climb stored something, and the descent spent it. The same story is told by a book lifted onto a shelf, a stretched rubber band and a battery powering a torch.",
    why:
      "Energy is the quantity physicists use to keep that story honest. It is not a substance that flows through wires or hides inside a moving object; it is a number that can be counted in different stores and followed through a transfer. Once a learner can say which store is emptying, which store is filling, and where the rest went, a large family of problems becomes one accounting question. The formulas for gravitational potential energy and kinetic energy are the two most common ways of counting those stores.",
  },

  explanation: [
    {
      heading: "Energy is stored, not used up",
      paragraphs: [
        "A system has energy when it can cause a change. A moving ball can dent a wall, a raised mass can turn a turbine as it falls, and a stretched spring can launch a toy. Physicists describe these possibilities as energy stores: kinetic for motion, gravitational potential for position in a gravitational field, elastic potential for a stretched or compressed shape, thermal for the random motion of particles, chemical for the arrangement of atoms in a fuel or food, and nuclear for the arrangement of particles in a nucleus.",
        "A transfer moves energy from one store to another. Lifting a box transfers energy from the chemical store of your muscles to the gravitational potential store of the box and the Earth. Dropping the box reverses that transfer: the gravitational store empties as the kinetic store fills. When the box lands, the kinetic store empties and the thermal store of the box, floor and air fills. The energy has not been used up; it has been spread into stores that are harder to use. That spreading is what physicists mean by dissipation.",
      ],
    },
    {
      heading: "Gravitational potential energy depends on mass, height and gravity",
      paragraphs: [
        "The gravitational potential energy gained by lifting an object is the work done against its weight. Weight is mass times gravitational field strength, and the distance moved is the change in height, so the energy transferred is mass times gravitational field strength times height. Near the Earth's surface the field strength is about 9.8 newtons per kilogram, and it is treated as constant over the heights in a school laboratory. That is an assumption: over hundreds of kilometres, the field strength changes and the simple formula no longer applies.",
        "The formula counts a change, not an absolute amount. A book on a table has zero gravitational potential energy only because we chose the table as the reference level. Lifting it one metre above the table gives it the same increase in energy as lifting it one metre above the floor, even though the absolute height is different. The reference level cancels when the object falls back to where it started, which is why energy problems can choose any convenient zero.",
      ],
    },
    {
      heading: "Kinetic energy depends on mass and the square of speed",
      paragraphs: [
        "An object's kinetic energy is the energy it has because it is moving. Doubling the mass doubles the kinetic energy, but doubling the speed multiplies it by four, because speed appears squared. That is why a car's braking distance grows so quickly with speed: at twice the speed, the brakes must remove four times as much kinetic energy, and the distance needed is much greater than double. The relationship is not a linear rule that can be read off a graph by eye.",
        "The square also explains why a light object can carry more kinetic energy than a heavy one. A 0.10 kg ball moving at 20 m/s has 20 J, while a 2.0 kg ball moving at 2 m/s has only 4 J. Mass matters, but speed matters more sharply. A learner who compares only masses will predict the wrong object, which is why the lesson separates the two factors before any calculation.",
      ],
    },
    {
      heading: "Conservation lets you follow the whole transfer",
      paragraphs: [
        "In a closed system, the total energy stays constant. Energy can move between stores and can be transferred to the surroundings, but it cannot be created or destroyed. A falling ball is a closed system only if the ball, the Earth and the surrounding air are all included. If the system is just the ball, its gravitational and kinetic energy decrease as thermal energy is transferred to the air and ground, and the missing energy is outside the system rather than gone.",
        "This is the rule that turns a description into a calculation. If no energy is transferred to the surroundings by friction or air resistance, the loss from the gravitational store equals the gain in the kinetic store. If some energy is transferred by heating, the same accounting still works, but the kinetic energy gained is smaller than the gravitational energy lost. The difference is not a loss of energy; it is the amount transferred to the thermal store of the surroundings.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Gravitational potential energy is the energy stored by raising a mass. The formula counts the change in height, so the reference level cancels when the object returns to its starting point.",
      notation: "GPE = m × g × h",
      caption:
        "GPE is in joules, m in kilograms, g in newtons per kilogram and h in metres. A 2 kg book lifted 1.5 m gains 2 × 9.8 × 1.5 = 29.4 J.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Kinetic energy is the energy of motion. Speed is squared, so a small change in speed can change the energy much more than the same proportional change in mass.",
      notation: "KE = ½ × m × v²",
      caption:
        "KE is in joules, m in kilograms and v in metres per second. A 0.20 kg ball at 5 m/s has ½ × 0.20 × 25 = 2.5 J.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Every quantity in an energy calculation has a unit, and the unit is how you check that the formula has been rearranged correctly. A bare number is not a physical answer.",
      notation: "energy: J · mass: kg · height: m · speed: m/s · g: N/kg",
      caption:
        "Kilograms times newtons per kilogram gives newtons; newtons times metres gives joules. If the unit does not come out as joules, the rearrangement or the substitution is wrong.",
    },
    {
      id: "r4",
      kind: "physics.model",
      body:
        "A roller coaster car at the top of a hill has a large gravitational potential store and almost no kinetic store. As it descends, the gravitational store empties and the kinetic store fills; at the bottom, friction and air resistance have also transferred some energy to the thermal store of the track and air.",
      notation: "top: GPE large, KE small → bottom: GPE small, KE large + thermal + sound",
      caption:
        "The car is not creating energy as it speeds up. It is converting stored gravitational energy into kinetic energy, while some is dissipated to the surroundings.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 0.50 kg ball is released from rest and falls 1.8 m. Take g = 9.8 N/kg and ignore air resistance. Calculate the gravitational potential energy lost and the speed of the ball just before it lands.",
      steps: [
        {
          move: "Use GPE = m × g × h and substitute the values: GPE = 0.50 kg × 9.8 N/kg × 1.8 m = 8.82 J.",
          why:
            "The ball loses gravitational potential energy as its height falls by 1.8 m. Multiplying mass, field strength and height counts that loss in joules.",
        },
        {
          move:
            "With no air resistance, the gravitational energy lost equals the kinetic energy gained: KE = 8.82 J.",
          why:
            "The ball and the Earth form a closed system, and the only transfer is from the gravitational store to the kinetic store. No energy is transferred to the air by heating.",
        },
        {
          move:
            "Rearrange KE = ½ × m × v² to make v the subject: v = √(2 × KE ÷ m) = √(2 × 8.82 J ÷ 0.50 kg) = 5.94 m/s.",
          why:
            "Dividing the kinetic energy by half the mass gives the square of the speed; taking the square root returns the speed in metres per second.",
        },
      ],
      answer:
        "The ball loses 8.82 J of gravitational potential energy and reaches about 5.9 m/s just before landing.",
    },
    {
      id: "w2",
      prompt:
        "A 60 kg cyclist freewheels from rest down a 12 m hill. Take g = 9.8 N/kg and ignore friction and air resistance. Calculate the gravitational potential energy lost and the speed at the bottom.",
      steps: [
        {
          move: "Name the equation GPE = m × g × h, then substitute: GPE = 60 kg × 9.8 N/kg × 12 m = 7056 J.",
          why:
            "The cyclist's height falls by 12 m, so the gravitational store empties by the mass times the field strength times that height. The result is about 7.1 kilojoules.",
        },
        {
          move:
            "Use conservation: the kinetic energy at the bottom equals the gravitational energy lost, so KE = 7056 J.",
          why:
            "Ignoring friction and air resistance makes the cyclist and the Earth a closed system with only one transfer, from the gravitational store to the kinetic store.",
        },
        {
          move:
            "Rearrange KE = ½ × m × v²: v = √(2 × 7056 J ÷ 60 kg) = √235.2 = 15.3 m/s.",
          why:
            "The speed is found from the energy and the mass, not from the height directly. The square root is needed because the formula contains the square of the speed.",
        },
      ],
      answer:
        "The cyclist loses about 7060 J of gravitational potential energy and reaches about 15.3 m/s at the bottom, if friction and air resistance are ignored.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "When a moving object stops, its energy has been used up and no longer exists.",
      whyItFails:
        "The object's kinetic store empties, but the energy is transferred by friction, air resistance or an impact to the thermal store of the object and its surroundings. The total energy of the wider system is unchanged; only its usefulness for making the object move has gone.",
      correction:
        "Follow the energy into the surroundings. Say that the kinetic store empties and the thermal store of the surfaces and air fills, rather than saying the energy disappears.",
      contrast: {
        wrong: "the ball stopped, so its energy was used up",
        right:
          "the ball's kinetic store emptied into the thermal store of the floor and air, so the total energy stayed the same",
      },
    },
    {
      id: "m2",
      belief: "A heavier object always has more kinetic energy than a lighter object.",
      whyItFails:
        "Kinetic energy depends on the square of speed as well as on mass. A 0.10 kg ball at 20 m/s has 20 J, while a 2.0 kg ball at 2 m/s has only 4 J, so the lighter object can have five times as much kinetic energy.",
      correction:
        "Compare both mass and speed before deciding. Calculate one half times mass times speed squared, or compare the products of mass and speed squared when the factor of one half is common.",
      contrast: {
        wrong: "the 2 kg ball must have more kinetic energy because it is heavier",
        right:
          "the 0.10 kg ball at 20 m/s has 20 J, which is more than the 2.0 kg ball's 4 J at 2 m/s",
      },
    },
    {
      id: "m3",
      belief: "An object at the top of a hill has no energy until it starts moving.",
      whyItFails:
        "Gravitational potential energy is stored because of the object's position in the gravitational field, not because of its motion. The raised object can do work if it is released, which is exactly what having a store of energy means.",
      correction:
        "Treat height above a chosen reference level as a store. The object at rest at the top has gravitational potential energy even though its kinetic energy is zero.",
      contrast: {
        wrong: "the car is stationary at the top, so it has no energy",
        right:
          "the car has gravitational potential energy because of its height, and that store can be transferred to kinetic energy as it descends",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A 2.0 kg book is lifted from a table to a shelf 1.5 m above it. Take g = 9.8 N/kg. Calculate the gravitational potential energy gained.",
      hint:
        "Use mass times gravitational field strength times the change in height. The table can be the reference level, so the height change is 1.5 m.",
      answer: "GPE = 2.0 kg × 9.8 N/kg × 1.5 m = 29.4 J.",
      feedback: {
        correct:
          "You used the change in height rather than an absolute height, and the unit is joules because the calculation counts energy.",
        incorrect:
          "Check that you multiplied by both the mass and the height change. A common slip is to use only the mass or only the height, which cannot give an energy in joules.",
      },
    },
    {
      id: "p2",
      prompt:
        "A 0.20 kg ball is moving at 5.0 m/s. Calculate its kinetic energy and state the unit.",
      hint:
        "Kinetic energy is one half times mass times speed squared. Square the speed before multiplying by the mass.",
      answer: "KE = ½ × 0.20 kg × (5.0 m/s)² = 2.5 J.",
      feedback: {
        correct:
          "You squared the speed first, then multiplied by the mass and one half, and the answer is in joules.",
        incorrect:
          "If you multiplied by 5 rather than by 25, you used the speed instead of its square. Kinetic energy depends on the square of the speed.",
      },
    },
    {
      id: "p3",
      prompt:
        "A roller coaster car has 20,000 J of gravitational potential energy at the top of a hill. At the bottom it has 15,000 J of kinetic energy. Explain what happened to the other 5,000 J.",
      hint:
        "The car is not a perfectly closed system on its own. Look for a transfer to the track and the air.",
      answer:
        "The missing 5,000 J was transferred by friction and air resistance to the thermal store of the track, the car and the surrounding air, and some became sound. The total energy is still 20,000 J.",
      feedback: {
        correct:
          "You accounted for the difference as a transfer to the surroundings rather than as energy that vanished.",
        incorrect:
          "Energy is conserved. The 5,000 J did not disappear; it was transferred to the thermal store of the surroundings and to sound by friction and air resistance.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A ball is thrown upwards and then falls back to the thrower's hand. Describe the energy transfers during the whole motion, including what happens when air resistance is not ignored. Explain why the ball's speed when it returns is lower than its speed when it was thrown.",
      modelAnswer:
        "As the ball rises, its kinetic store empties and its gravitational potential store fills; at the highest point the kinetic energy is zero and the gravitational potential energy is greatest. As it falls, the transfer reverses. Air resistance transfers energy from the kinetic store to the thermal store of the air and ball throughout the motion, so the total mechanical energy decreases. The ball returns with less kinetic energy, and therefore less speed, than it had when thrown; the missing mechanical energy is in the thermal store of the surroundings, not destroyed.",
      marking: [
        "Describes kinetic to gravitational potential transfer on the way up and the reverse on the way down.",
        "Identifies the highest point as zero kinetic energy and maximum gravitational potential energy.",
        "Explains that air resistance transfers energy to the thermal store of the surroundings.",
        "Concludes that the return speed is lower because mechanical energy has been dissipated, not destroyed.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A 0.25 kg ball moves at 8.0 m/s. Calculate its kinetic energy, showing the equation and the unit.",
      modelAnswer: "8 J",
      marking: [
        "Uses KE = ½ × m × v² rather than m × v.",
        "Substitutes 0.25 kg and 8.0 m/s and gives 8 J with the unit.",
      ],
      check: {
        accepted: ["8 J", "8.0 J", "8J", "8.0J"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A book is lifted onto a shelf and then left there. Explain whether it has energy while it is stationary, and name the store.",
      modelAnswer:
        "Yes. It has gravitational potential energy because of its height above the reference level, even though its kinetic energy is zero.",
      marking: [
        "States that the stationary book still has energy.",
        "Names the gravitational potential store and links it to height.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A hydroelectric reservoir stores water behind a dam. Water flows down through a turbine and then out into a river. Trace the energy stores and transfers from the water in the reservoir to the electrical output, and explain why the height of the reservoir and the mass of water matter.",
      whyItTransfers:
        "The lesson used a falling ball and a cyclist on a hill. Here the same gravitational store is connected to a turbine and a generator, so the learner must follow a longer chain of transfers and distinguish the energy that becomes electrical from the energy dissipated to the surroundings.",
      answer:
        "Water at the top of the reservoir has gravitational potential energy. As it flows down, that store empties and the water's kinetic store fills. The moving water turns the turbine, transferring energy mechanically to the turbine and generator, which transfer it electrically to the grid. Friction in the pipes and turbulence in the water transfer some energy to the thermal store of the water and surroundings, and sound is produced. A greater height gives each kilogram of water more gravitational potential energy, and a greater mass of water gives more energy in total, so both increase the electrical output for the same flow conditions.",
      marking: [
        "Names gravitational potential energy in the reservoir and kinetic energy in the moving water.",
        "Follows the transfer through the turbine and generator to electrical energy.",
        "Accounts for thermal and sound transfers rather than claiming all the stored energy becomes electrical.",
        "Explains that height affects energy per kilogram and mass affects the total energy.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State the law of conservation of energy in one sentence.",
      answer:
        "In a closed system, energy cannot be created or destroyed; it can only be transferred between stores.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A 3.0 kg box is lifted 2.0 m. Taking g = 9.8 N/kg, calculate the gravitational potential energy gained.",
      answer: "GPE = 3.0 kg × 9.8 N/kg × 2.0 m = 58.8 J.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A ball bounces back to a lower height than it was dropped from. Does this violate conservation of energy? Explain.",
      answer:
        "No. Some of the ball's mechanical energy is transferred to the thermal store of the ball, floor and air, and to sound, so the total energy is unchanged even though the ball reaches a lower height.",
      when: "month-later",
    },
  ],

  summary: [
    "Energy is counted in stores, including kinetic, gravitational potential, elastic potential, thermal, chemical and nuclear stores.",
    "Gravitational potential energy is mass times gravitational field strength times the change in height, measured in joules.",
    "Kinetic energy is one half times mass times the square of speed, so doubling the speed multiplies the kinetic energy by four.",
    "In a closed system the total energy is constant; friction and air resistance transfer energy to the thermal store of the surroundings rather than destroying it.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every equation is also stated in words, and the roller coaster model is described as an ordered list of stores and transfers rather than as a colour-coded picture.",
    },
    {
      need: "colour-vision",
      alternative:
        "Energy stores are labelled with names and arrows, and no meaning depends on telling two colours apart.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation follows the same three-line pattern: the equation, the substitution with units, and the answer with its unit, so the structure is predictable across examples.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no diagram has to be dragged or resized to complete the lesson.",
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
        "All explanations, examples, practice items and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-physics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE physics subject content for energy.",
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
