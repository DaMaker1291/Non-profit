import type { AuthoredLesson } from "../../lesson-contract";

// FORCES IS WHERE PHYSICS STARTS TO GO WRONG FOR MOST LEARNERS: they can recite
// "balanced forces mean no acceleration" and still believe a moving object needs
// a force pushing it. The lesson is built around the free-body diagram and the
// resultant, because that is the representation every later mechanics topic
// reads. Units are not decoration here; a force without newtons is a number.
export const PHYSICS_FORCES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "forces-basics",
  version: "1.0.0",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, forces: contact and non-contact forces, free-body diagrams and Newton's first law",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Draw and read a free-body diagram, showing each force on one object with its direction and magnitude in newtons.",
      evidence:
        "For a box pulled along a floor, the learner draws weight down, normal contact force up, the pull forwards and friction backwards, and labels each arrow with a value in N.",
    },
    {
      statement:
        "Explain why balanced forces produce constant velocity rather than rest, and apply that to a moving object.",
      evidence:
        "The learner states that a car travelling at a steady speed has zero resultant force, and that the driving force equals the total resistive force rather than exceeding it.",
    },
    {
      statement:
        "Calculate a resultant force and use F = m a to find an acceleration, stating the unit of each quantity.",
      evidence:
        "For a 2.0 kg trolley with 6.0 N forwards and 2.0 N of friction, the learner finds a resultant of 4.0 N and an acceleration of 2.0 m/s².",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question:
          "Two people push a box from opposite sides, each with 30 N. Describe the motion of the box.",
        answer:
          "The forces cancel, so the resultant is zero. If the box is already still it stays still; if it is already moving it continues at a constant speed in a straight line.",
        targets: ["forces-basics"],
      },
      {
        id: "d2",
        question: "What is the difference between mass and weight?",
        answer:
          "Mass is the amount of matter, measured in kilograms, and does not change with location. Weight is the force of gravity on that mass, measured in newtons, and changes with the gravitational field strength.",
        targets: ["forces-basics"],
      },
    ],
  },

  introduction: {
    hook:
      "A book rests on a table. Two forces act on it: its weight pulls it down and the table pushes it up. The two are equal, so the book does not move. Now imagine the table is in a lift that starts to rise: for a moment the book feels heavier, and if you were standing on bathroom scales the reading would jump. Nothing about the book changed. The forces on it did.",
    why:
      "Forces explain changes in motion, not motion itself. That single distinction is the one most learners miss: they look for a force to keep something moving, when the force is needed only to change how it moves. A free-body diagram is how a physicist makes that visible, because it shows every force acting on one object and nothing else. Once the diagram is right, the arithmetic is usually one subtraction and one division.",
  },

  explanation: [
    {
      heading: "A force is an interaction between two objects",
      paragraphs: [
        "A force is a push or a pull that one object exerts on another, measured in newtons. Forces come in pairs: if you push a wall, the wall pushes back on you with the same size force in the opposite direction. That is why a force is never a property of a single object on its own. When a diagram shows the forces on a box, it shows the pushes and pulls that other things are exerting on the box, not the forces the box exerts on them.",
        "Forces are either contact forces, which need the objects to touch, or non-contact forces, which act at a distance. Friction, air resistance, tension and the normal contact force from a surface are contact forces. Gravity, magnetism and electrostatic attraction are non-contact. The weight of a book is the Earth pulling it, and that pull acts even though the Earth is not touching it.",
      ],
    },
    {
      heading: "A free-body diagram strips a situation down to the forces on one object",
      paragraphs: [
        "A free-body diagram shows one object as a point or a simple shape, with an arrow for each force acting on it. The arrow's direction is the force's direction, its length represents the size, and its label gives the value in newtons. Everything else is left out: the table, the hand, the rope and the ground appear only through the forces they exert. That stripping is the point, because a diagram of the whole scene hides which force acts on which object.",
        "Once the arrows are drawn, the resultant force is found by adding the forces that point the same way and subtracting the ones that point the opposite way. A resultant of zero means the forces are balanced. A non-zero resultant means the forces are unbalanced, and the object's motion will change in the direction of the resultant. This is the only rule needed for most Key Stage 3 and GCSE force questions.",
      ],
    },
    {
      heading: "Balanced forces mean constant velocity, not rest",
      paragraphs: [
        "An object with balanced forces keeps doing what it was already doing. If it is still, it stays still. If it is moving at 5 m/s, it continues at 5 m/s in a straight line. This is Newton's first law, and it is why a puck sliding on ice travels so far: the ice removes most of the friction, so there is almost no resultant force to slow it down. A moving object does not need a forward force to keep moving; it needs a forward force only to overcome friction or to speed up.",
        "A car travelling at a steady 70 mph on a motorway has a driving force from the engine and a total resistive force from air resistance and friction. Those two are equal, so the resultant is zero and the velocity is constant. Press the accelerator and the driving force becomes larger than the resistance, so the resultant is forwards and the car accelerates. Release it and the resistance becomes larger, so the resultant is backwards and the car slows. In both cases the change in motion follows the direction of the resultant, not the direction of the largest single force.",
      ],
    },
    {
      heading: "Units are part of the answer",
      paragraphs: [
        "A force is measured in newtons, a mass in kilograms, and an acceleration in metres per second squared. Those units are not labels added at the end: they are how you know which quantity you have calculated. Weight is a force, so it is in newtons; mass is not a force, so it is in kilograms. A statement that a box weighs 5 is incomplete in a way that no amount of correct arithmetic can fix.",
        "The equation linking them is F = m a, where F is the resultant force in newtons, m is the mass in kilograms and a is the acceleration in metres per second squared. The equation applies to the resultant force, not to any single force, which is why the free-body diagram comes first. For a falling object near the Earth's surface, the weight is W = m g, where g is about 9.8 N/kg; that value is a field strength, not an acceleration in the equation until you divide the weight by the mass.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Newton's second law links the resultant force on an object, its mass and its acceleration. The force must be the resultant, because two equal and opposite forces produce no acceleration however large each one is.",
      notation: "F = m × a   ·   W = m × g",
      caption:
        "F is in newtons, m in kilograms and a in metres per second squared. A 2 kg object with a 6 N resultant accelerates at 3 m/s², not at 6 m/s².",
    },
    {
      id: "r2",
      kind: "physics.units",
      body:
        "Every quantity in a mechanics answer has a unit, and the unit tells you what kind of quantity it is. Writing the unit at each step also catches a wrong equation before the arithmetic hides it.",
      notation: "force: N · mass: kg · acceleration: m/s² · velocity: m/s · weight: N",
      caption:
        "A weight in kilograms is a mass, not a weight. The unit check is often the fastest way to see that a rearrangement has gone wrong.",
    },
    {
      id: "r3",
      kind: "physics.model",
      body:
        "A trolley is pushed to the right with 6.0 N while friction acts to the left with 2.0 N. Its weight and the normal contact force are equal and opposite, so they cancel; the resultant is 4.0 N to the right.",
      notation: "forwards 6.0 N · friction 2.0 N · weight 20 N down · normal 20 N up",
      caption:
        "The vertical forces cancel because the trolley does not leave the floor. Only the horizontal pair changes the motion, which is why the resultant is found along that line.",
    },
    {
      id: "r4",
      kind: "physics.experiment",
      body:
        "A falling object reaches terminal velocity when air resistance has grown until it equals the weight. The resultant is then zero, so the object stops accelerating and continues at a constant speed rather than stopping.",
      notation: "weight constant · air resistance increases with speed · terminal velocity when the two are equal",
      caption:
        "The object is still moving at terminal velocity, often quickly. Balanced forces mean constant velocity, not rest, which is the same rule as the book on the table.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 2.0 kg trolley is pushed with a force of 6.0 N. Friction on the trolley is 2.0 N. Calculate the acceleration of the trolley.",
      steps: [
        {
          move:
            "Find the resultant force: 6.0 N forwards minus 2.0 N backwards gives 4.0 N forwards.",
          why:
            "The two horizontal forces act in opposite directions, so they partially cancel. Using either force alone would give the wrong acceleration.",
        },
        {
          move: "Rearrange F = m a to a = F ÷ m.",
          why:
            "The equation gives force from mass and acceleration, but the question gives force and mass and asks for acceleration. Dividing both sides by m isolates a.",
        },
        {
          move: "Substitute the values: a = 4.0 N ÷ 2.0 kg = 2.0 m/s².",
          why:
            "The resultant force is 4.0 N, not 6.0 N, because friction has already been subtracted. The unit follows from newtons divided by kilograms.",
        },
      ],
      answer: "The acceleration is 2.0 m/s² forwards.",
    },
    {
      id: "w2",
      prompt:
        "A 0.50 kg ball is dropped from a window. Taking g = 9.8 N/kg and ignoring air resistance, calculate its weight and its acceleration.",
      steps: [
        {
          move: "Name the equation for weight: W = m g.",
          why:
            "Weight is the force of gravity on a mass, so it needs the field strength as well as the mass. Using W = m a would confuse weight with the resultant force.",
        },
        {
          move: "Substitute: W = 0.50 kg × 9.8 N/kg = 4.9 N.",
          why:
            "The kilograms cancel with the per-kilogram in the field strength, leaving newtons, which is the correct unit for a force.",
        },
        {
          move: "Use F = m a with F equal to the weight: 4.9 N = 0.50 kg × a, so a = 9.8 m/s².",
          why:
            "The only force on the ball is its weight, so the resultant equals the weight. Dividing by the mass returns the field strength, which is why all objects fall at the same rate when air resistance is ignored.",
        },
      ],
      answer: "The weight is 4.9 N and the acceleration is 9.8 m/s² downwards.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "If the forces on an object are balanced, the object must be stationary.",
      whyItFails:
        "Balanced forces mean the resultant is zero, and a zero resultant means the velocity does not change. An object already moving at 3 m/s continues at 3 m/s. Stillness is only one possible constant velocity, not the definition of balance.",
      correction:
        "Ask what the object is already doing before asking what the forces do. Balanced forces preserve the current motion; they do not require the current motion to be zero.",
      contrast: {
        wrong: "balanced forces, so the object must be still",
        right: "balanced forces, so the object keeps its current velocity, including a non-zero one",
      },
    },
    {
      id: "m2",
      belief: "A moving object must have a force pushing it in the direction of motion.",
      whyItFails:
        "Motion does not need a force; a change in motion does. A puck sliding on ice keeps moving because the resultant force is nearly zero, not because something continues to push it. The everyday experience of a pushed box slowing down is evidence of friction, not evidence that motion requires a push.",
      correction:
        "Identify the resistive forces. A moving object slows because friction or air resistance gives a resultant opposite to its motion; remove them and it continues at constant velocity.",
      contrast: {
        wrong: "it is moving, so something must be pushing it forwards",
        right: "it is moving, and the forwards force balances friction, so the velocity is constant",
      },
    },
    {
      id: "m3",
      belief: "Weight and mass are the same thing, so a weight can be given in kilograms.",
      whyItFails:
        "Mass is the amount of matter and is measured in kilograms; weight is the gravitational force on that mass and is measured in newtons. On the Moon the mass is unchanged but the weight is about one sixth as large, which would be impossible if they were the same quantity.",
      correction:
        "Decide whether the question asks how much matter there is or how strong the gravitational pull is. Use kilograms for the first and newtons for the second, and use W = m g to convert.",
      contrast: {
        wrong: "the box weighs 5 kg",
        right: "the box has a mass of 5 kg and a weight of about 49 N on Earth",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A box is pulled to the right with 50 N while friction acts to the left with 20 N. Calculate the resultant force and state its direction.",
      hint:
        "The forces act along the same line in opposite directions. Subtract the smaller from the larger and keep the direction of the larger.",
      answer: "The resultant is 30 N to the right.",
      feedback: {
        correct:
          "You subtracted the opposing force and kept the direction of the larger one, which is the whole rule for collinear forces.",
        incorrect:
          "Adding the two forces would only be right if they pointed the same way. Here they oppose each other, so the resultant is a difference.",
      },
    },
    {
      id: "p2",
      prompt:
        "A cyclist travels at a steady 8 m/s on a flat road. Describe the horizontal forces on the cyclist and explain your answer.",
      hint: "Steady speed means the velocity is not changing. What must the resultant be?",
      answer:
        "The driving force from pedalling equals the total resistive force from air resistance and friction, so the resultant is zero and the velocity stays constant.",
      feedback: {
        correct:
          "You used constant velocity to conclude a zero resultant, rather than assuming the driving force must be larger.",
        incorrect:
          "At a steady speed the cyclist is not accelerating, so the forces must balance. A larger driving force would make the cyclist speed up.",
      },
    },
    {
      id: "p3",
      prompt:
        "A 4.0 kg box has a resultant force of 12 N acting on it. Calculate its acceleration and give the unit.",
      hint: "Use a = F ÷ m, and check that the unit is the one for acceleration, not for force.",
      answer: "a = 12 N ÷ 4.0 kg = 3.0 m/s².",
      feedback: {
        correct:
          "You divided by the mass and gave the acceleration unit, so the answer is a complete physical quantity.",
        incorrect:
          "Check both the rearrangement and the unit. Newtons divided by kilograms gives metres per second squared, not newtons.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A skydiver jumps from a plane and eventually falls at a steady speed. Explain, in terms of the forces on the skydiver, why the speed becomes steady and why it does not fall back to zero.",
      modelAnswer:
        "At first the only significant force is weight, so the resultant is downwards and the skydiver accelerates. As speed increases, air resistance increases. When air resistance becomes equal to weight, the resultant is zero, so the skydiver stops accelerating and continues at a constant speed, the terminal velocity. The speed does not fall to zero because a zero resultant means constant velocity, not rest; the forces are balanced while the skydiver is still moving quickly.",
      marking: [
        "Identifies weight downwards and air resistance upwards.",
        "Explains that air resistance increases with speed until it equals weight.",
        "States that the resultant becomes zero, so acceleration becomes zero.",
        "Distinguishes constant velocity from rest at terminal velocity.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A 5.0 kg box is pushed with a resultant force of 15 N. Calculate its acceleration, showing the equation you used.",
      modelAnswer: "3.0 m/s²",
      marking: [
        "Rearranges or names a = F ÷ m.",
        "Substitutes 15 N and 5.0 kg and gives 3.0 m/s² with the unit.",
      ],
      check: {
        accepted: ["3 m/s²", "3.0 m/s²", "3 m/s2", "3.0 m/s2"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Explain why stating that a force is 12, without a unit, is not a complete answer.",
      modelAnswer:
        "A force must be measured in newtons, so 12 could be 12 N, 12 kg or 12 m/s; without the unit the quantity is undefined and cannot be checked against the situation.",
      marking: [
        "States that force is measured in newtons.",
        "Explains that the number alone does not identify the quantity or allow a check.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A cup of water is placed on a table in a train. When the train accelerates forwards, the water surface tilts rather than staying horizontal, even though the cup has not moved relative to the table. Explain this using the forces on a small parcel of water at the surface.",
      whyItTransfers:
        "The lesson used boxes, trolleys and a skydiver, where the object was treated as a point. Here the learner has to apply the same resultant-force reasoning to a fluid surface, where the evidence is a shape rather than a speed, and where the table is accelerating.",
      answer:
        "In the accelerating train, the cup is pushed forwards by the table, but the water at the surface is not pushed directly. Relative to the train, a parcel of surface water behaves as if a backward force acts on it, so the surface tilts until the pressure gradient provides the forwards acceleration. The surface becomes perpendicular to the effective resultant of gravity and the pseudo-force, which is why it is not horizontal.",
      marking: [
        "Recognises that the cup and the train are accelerating while the water surface responds to the effective forces.",
        "Uses the idea that a resultant force is needed to accelerate a parcel of water.",
        "Explains the tilt as the surface becoming perpendicular to the effective resultant, not as the water being left behind.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "A car travels at a constant speed. What is the resultant force on it, and what does that tell you about the driving and resistive forces?",
      answer:
        "The resultant is zero, so the driving force equals the total resistive force.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "State the equation linking force, mass and acceleration, with the unit of each quantity.",
      answer: "F = m a, with F in newtons, m in kilograms and a in metres per second squared.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A ball is thrown upwards. Describe the forces on it at the highest point of its flight and explain why it does not stay there.",
      answer:
        "The only force is its weight, acting downwards, so the resultant is downwards and the ball accelerates downwards. At the highest point its velocity is momentarily zero, but the force is not, so it immediately begins to fall.",
      when: "month-later",
    },
  ],

  summary: [
    "A force is an interaction between two objects, measured in newtons; contact forces need touch, non-contact forces do not.",
    "A free-body diagram shows only the forces on one object, and the resultant is found by adding or subtracting them along their line.",
    "Balanced forces mean constant velocity, not rest; a change in motion needs an unbalanced resultant.",
    "F = m a applies to the resultant force, and every answer carries its unit.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every free-body diagram is described as a list of forces with their direction and magnitude, and the resultant is stated in words before the calculation.",
    },
    {
      need: "colour-vision",
      alternative:
        "Force arrows are distinguished by direction and labels rather than by colour, so the diagram works without colour perception.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation is set out in the same three lines — equation, substitution, answer with unit — so the structure is predictable across examples.",
    },
    {
      need: "motor",
      alternative:
        "Answers are typed, not dragged; no diagram has to be manipulated to complete the lesson.",
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
      sourceId: "gcse-physics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE physics subject content for forces.",
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
