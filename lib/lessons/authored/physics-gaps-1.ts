import { defineGapLesson } from "./_gap-lesson";

// PHYSICS GAP BATCH 1 — forces, momentum and energy transfer.

export const PHYSICS_NEWTON_LAWS = defineGapLesson({
  conceptId: "newton-laws",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, forces and motion: Newton's three laws, resultant force, mass and weight",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for forces and Newton's laws. The examples and explanations are original.",
  },
  objectives: [
    {
      statement:
        "Use Newton's second law, F = ma, to relate resultant force, mass and acceleration.",
      evidence:
        "For a 1,200 kg car with a resultant force of 3,600 N, the learner calculates an acceleration of 3 m/s² and states the unit.",
    },
    {
      statement:
        "Distinguish mass from weight and calculate weight with W = mg.",
      evidence:
        "The learner finds the weight of a 5 kg mass on Earth as 49 N and explains that the mass stays 5 kg on the Moon while the weight changes.",
    },
    {
      statement:
        "Identify Newton's third-law pairs and explain why they do not cancel.",
      evidence:
        "The learner names the force of a swimmer on the water and the water on the swimmer as an equal and opposite pair acting on different bodies.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["forces-basics", "motion-graphs"],
    check: [
      {
        id: "d1",
        question: "What is a resultant force?",
        answer:
          "The single force that has the same effect as all the forces acting on an object combined.",
        targets: ["forces-basics"],
      },
      {
        id: "d2",
        question: "What does the gradient of a velocity–time graph represent?",
        answer: "Acceleration, measured in metres per second squared.",
        targets: ["motion-graphs"],
      },
    ],
  },
  introduction: {
    hook:
      "A shopping trolley accelerates when pushed, but a loaded trolley accelerates less for the same push. A swimmer pushes water backwards and moves forwards. A book resting on a table pushes down on the table while the table pushes up on the book. These three observations are the three laws: force changes motion, mass resists the change, and forces come in pairs acting on different objects.",
    why:
      "Newton's laws are often reduced to three sentences, but the sentences are easy to misapply. The second law is about the resultant force, not any single force. Weight is a force, while mass is a property of the object. Third-law pairs act on different bodies, so they never cancel on the same body. This lesson keeps those distinctions explicit and checks each calculation against the physical situation.",
  },
  explanation: [
    {
      heading: "The first law: no resultant force means no change in velocity",
      paragraphs: [
        "An object remains at rest or moves at a constant velocity unless a resultant force acts on it. Constant velocity includes moving in a straight line at a steady speed, so a car cruising on a straight motorway has no resultant force even though the engine is working. The engine's forward force balances friction and air resistance; the forces are present, but their sum is zero.",
        "The first law is not a statement that motion requires a force. It is a statement that a change in motion requires a resultant force. A spacecraft far from any star can drift at constant velocity with no engine on. The law also explains why passengers lurch forward when a bus brakes: their bodies continue at the original velocity while the bus slows.",
      ],
    },
    {
      heading: "The second law: F = ma connects force, mass and acceleration",
      paragraphs: [
        "The resultant force on an object equals its mass times its acceleration. The force and acceleration point in the same direction. A larger mass needs a larger force for the same acceleration, which is why a loaded trolley is harder to get moving. If the resultant force is zero, the acceleration is zero, and the first law follows as a special case.",
        "The equation uses the resultant force, not the applied force alone. If a 1,200 kg car has a driving force of 4,000 N and 400 N of resistance, the resultant is 3,600 N, so the acceleration is 3 m/s². Using 4,000 N would overstate the acceleration. The model assumes the mass is constant and the resultant force is steady; a real car's mass changes as fuel burns and its resistance changes with speed.",
      ],
    },
    {
      heading: "The third law: equal and opposite forces on different bodies",
      paragraphs: [
        "When A exerts a force on B, B exerts an equal and opposite force on A. The two forces are the same kind, act along the same line and act on different objects. A swimmer pushes water backwards; the water pushes the swimmer forwards. The pair does not cancel because each force acts on a different body, and only forces on the same body can be added to find a resultant.",
        "Mass and weight are often confused because both are measured in everyday language with the same scales. Mass is the amount of matter, measured in kilograms, and does not change with location. Weight is the gravitational force on that mass, measured in newtons, and depends on the gravitational field strength g. On Earth g is about 9.8 N/kg, so a 5 kg mass weighs 49 N; on the Moon g is about 1.6 N/kg, so the same mass weighs 8 N.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Newton's second law relates the resultant force to mass and acceleration. The force must be the vector sum of all forces on the object.",
      notation: "F = ma",
      caption:
        "A resultant force of 3,600 N on a 1,200 kg car gives a = 3,600/1,200 = 3 m/s². The acceleration is in the same direction as the resultant force.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Weight is the gravitational force on a mass. The field strength g is the force per kilogram at that location.",
      notation: "W = mg",
      caption:
        "A 5 kg mass on Earth, where g = 9.8 N/kg, has weight 49 N. The mass remains 5 kg on the Moon, but the weight becomes about 8 N because g is smaller.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Force is measured in newtons, mass in kilograms and acceleration in metres per second squared. The units of F = ma must agree on both sides.",
      notation: "F: N · m: kg · a: m/s² · g: N/kg",
      caption:
        "One newton is one kilogram metre per second squared. Weight in newtons divided by mass in kilograms gives the field strength in newtons per kilogram, which is numerically the same as metres per second squared.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A car of mass 1,200 kg experiences a driving force of 4,000 N and a total resistance of 400 N. Calculate its acceleration.",
      steps: [
        {
          move: "Find the resultant force: F = 4,000 N − 400 N = 3,600 N.",
          why:
            "The driving force and resistance act in opposite directions, so the resultant is their difference. Newton's second law uses the resultant, not the driving force alone.",
        },
        {
          move: "Rearrange F = ma to a = F/m.",
          why:
            "The unknown is acceleration, so the equation is rearranged before substituting. This keeps the units visible and avoids plugging numbers into the wrong arrangement.",
        },
        {
          move: "Substitute a = 3,600 N / 1,200 kg = 3 m/s².",
          why:
            "Newtons divided by kilograms give metres per second squared. The acceleration is in the direction of the resultant forward force.",
        },
      ],
      answer: "The acceleration is 3 m/s².",
    },
    {
      id: "w2",
      prompt:
        "Calculate the weight of a 5 kg mass on Earth, where g = 9.8 N/kg, and state its mass on the Moon.",
      steps: [
        {
          move: "Use W = mg.",
          why:
            "Weight is the gravitational force, so the mass is multiplied by the field strength at the location.",
        },
        {
          move: "Substitute W = 5 kg × 9.8 N/kg = 49 N.",
          why:
            "The kilograms cancel, leaving newtons. The weight is a force, so the unit must be newtons, not kilograms.",
        },
        {
          move: "The mass on the Moon is still 5 kg, because mass does not depend on g.",
          why:
            "Only the weight changes when the field strength changes. The amount of matter in the object is the same everywhere.",
        },
      ],
      answer: "The weight on Earth is 49 N, and the mass on the Moon is still 5 kg.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "An object moving at constant velocity must have a forward force acting on it.",
      whyItFails:
        "Constant velocity means the acceleration is zero, so the resultant force is zero. The forward force may be non-zero, but it is balanced by resistance. Motion does not require a resultant force; only a change in motion does.",
      correction:
        "Add all the forces as vectors. If they balance, the velocity stays constant. A cruising car has a forward force equal to its resistance, not a net forward force.",
      contrast: {
        wrong: "The car is moving, so the engine force must be larger than friction.",
        right: "The car is moving at constant velocity, so the engine force equals friction.",
      },
    },
    {
      id: "m2",
      belief: "Newton's third-law forces cancel because they are equal and opposite.",
      whyItFails:
        "The two forces act on different bodies. Cancelling requires forces on the same body. The water's force on the swimmer is not cancelled by the swimmer's force on the water, because one acts on the swimmer and the other on the water.",
      correction:
        "Name the body each force acts on. Only forces on the same body can be combined into a resultant. Third-law pairs always act on two different bodies.",
      contrast: {
        wrong: "The swimmer does not move because the two forces cancel.",
        right: "The water's forward force on the swimmer is unbalanced on the swimmer, so the swimmer accelerates.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A 2 kg trolley has a resultant force of 6 N. What is its acceleration?",
      hint: "Rearrange F = ma to make acceleration the subject, then divide the force by the mass.",
      answer: "a = 6 N / 2 kg = 3 m/s².",
      feedback: {
        correct: "You divided the resultant force by the mass and kept the unit.",
        incorrect:
          "The acceleration is 6/2 = 3 m/s², not 12 m/s². Dividing by mass is the correct rearrangement of F = ma.",
      },
    },
    {
      id: "p2",
      prompt: "What is the weight of a 10 kg mass where g = 9.8 N/kg?",
      hint: "Weight is mass times gravitational field strength, so multiply 10 kg by 9.8 N/kg.",
      answer: "W = 10 kg × 9.8 N/kg = 98 N.",
      feedback: {
        correct: "You multiplied mass by field strength and gave the force in newtons.",
        incorrect:
          "Weight is a force, so the answer is 98 N. The mass is 10 kg, but the weight depends on g.",
      },
    },
    {
      id: "p3",
      prompt:
        "A book rests on a table. Name the third-law pair to the book's weight and say which body each force acts on.",
      hint: "The pair is not the normal reaction on the book; think about what the book pulls on.",
      answer:
        "The book pulls the Earth upwards with a force equal to its weight; the Earth pulls the book downwards. The pair acts on the Earth and the book, respectively.",
      feedback: {
        correct: "You identified the gravitational pair and kept the bodies separate.",
        incorrect:
          "The book's weight and the table's normal reaction are not a third-law pair; they act on the same body. The pair to the book's weight is the book's upward pull on the Earth.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A 1,200 kg car has a resultant force of 3,600 N. Calculate its acceleration, stating the unit.",
      modelAnswer: "3 m/s²",
      marking: [
        "Rearranges F = ma to a = F/m.",
        "Divides 3,600 by 1,200 and gives 3 m/s².",
      ],
      check: { accepted: ["3 m/s²", "3 m/s2", "3 m s^-2", "3"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Calculate the weight of a 5 kg mass on Earth, where g = 9.8 N/kg.",
      modelAnswer: "49 N",
      marking: [
        "Uses W = mg.",
        "Multiplies 5 by 9.8 and gives 49 N.",
      ],
      check: { accepted: ["49 N", "49N", "49"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain the difference between mass and weight, and explain why the forces in a Newton's third-law pair do not cancel.",
      modelAnswer:
        "Mass is the amount of matter in an object, measured in kilograms, and it does not change with location. Weight is the gravitational force on that mass, measured in newtons, and it depends on the gravitational field strength. A third-law pair consists of equal and opposite forces acting on two different bodies, so they cannot be added to find a resultant on one body and do not cancel.",
      marking: [
        "Defines mass in kilograms as a property that does not change with location.",
        "Defines weight as a force in newtons that depends on g.",
        "Explains that third-law forces act on different bodies and so do not cancel.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A rocket burns fuel and pushes gas downwards. Explain, using all three laws, why the rocket accelerates upwards even though the gas and the rocket exert equal and opposite forces on each other. Include what happens to the acceleration as the rocket's mass falls.",
      whyItTransfers:
        "The lesson applies the laws to a car and a book. The rocket combines a third-law pair with a changing mass, so the learner must separate the forces on the rocket from the pair and reason about F = ma with m decreasing.",
      answer:
        "The rocket pushes gas downwards; the gas pushes the rocket upwards with an equal and opposite force. That upward force is the external force on the rocket, so it is not cancelled by the downward force on the gas, which acts on the gas. The resultant upward force accelerates the rocket in accordance with F = ma. As fuel is burned, the rocket's mass decreases, so for the same thrust the acceleration increases. Once the rocket is in space with no atmosphere, there is no drag to balance the thrust, and the first law says it keeps accelerating while the thrust continues.",
      marking: [
        "Identifies the third-law pair and says the forces act on different bodies.",
        "Uses the resultant force on the rocket and F = ma to explain the acceleration.",
        "Explains that decreasing mass increases acceleration for the same thrust.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "State Newton's second law in words and as an equation.",
      answer:
        "The resultant force on an object equals its mass times its acceleration: F = ma.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the difference between mass and weight?",
      answer:
        "Mass is the amount of matter in kilograms and does not change with location; weight is the gravitational force in newtons and depends on g.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why do Newton's third-law forces not cancel?",
      answer:
        "They act on different bodies, so they cannot be combined into a resultant on a single object.",
      when: "month-later",
    },
  ],
  summary: [
    "No resultant force means no change in velocity, not necessarily no motion.",
    "F = ma uses the resultant force and gives acceleration in the same direction.",
    "Weight is W = mg, a force in newtons; mass in kilograms does not change with location.",
    "Third-law pairs are equal and opposite but act on different bodies, so they never cancel each other.",
  ],
});

export const PHYSICS_MOMENTUM = defineGapLesson({
  conceptId: "momentum",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, forces and motion: momentum, conservation of momentum and impulse",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for momentum and collisions. The trolley and ball examples are original.",
  },
  objectives: [
    {
      statement:
        "Calculate momentum with p = mv and state its unit.",
      evidence:
        "For a 2 kg trolley moving at 3 m/s, the learner calculates 6 kg m/s.",
    },
    {
      statement:
        "Apply conservation of momentum to a collision in which two objects join together.",
      evidence:
        "The learner sets 2 × 3 = (2 + 1)v and finds v = 2 m/s.",
    },
    {
      statement:
        "Use impulse FΔt to explain why a longer collision time reduces the force for the same momentum change.",
      evidence:
        "The learner calculates the force stopping a 0.5 kg ball from 8 m/s in 0.02 s as 200 N and explains the airbag principle.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["newton-laws"],
    check: [
      {
        id: "d1",
        question: "What is the relationship between resultant force, mass and acceleration?",
        answer: "F = ma; the acceleration is in the direction of the resultant force.",
        targets: ["newton-laws"],
      },
      {
        id: "d2",
        question: "What is conserved in a closed system?",
        answer:
          "Total momentum remains constant when no external resultant force acts.",
        targets: ["newton-laws"],
      },
    ],
  },
  introduction: {
    hook:
      "A loaded lorry at 5 m/s is much harder to stop than a cyclist at 5 m/s, even though their speeds are equal. Momentum captures that difference: it is mass times velocity. In a collision, the total momentum before equals the total after, provided no external force acts. An airbag does not change the momentum change; it stretches the time over which it happens, reducing the force.",
    why:
      "Momentum is a conserved quantity, which makes it a powerful shortcut for collisions that are too complicated to analyse force by force. The conservation law applies to the system, not to each object: one object can gain momentum while another loses it. Impulse is the bridge between momentum and force, and it explains safety features that otherwise look like magic. This lesson keeps the before/after bookkeeping and the direction signs visible.",
  },
  explanation: [
    {
      heading: "Momentum is mass times velocity",
      paragraphs: [
        "Momentum is p = mv, measured in kilogram metres per second. It is a vector: an object moving left has negative momentum if right is positive. A heavy slow object can have more momentum than a light fast one. A 2 kg trolley at 3 m/s has 6 kg m/s; a 0.5 kg ball at 8 m/s has 4 kg m/s. The comparison is not about speed alone.",
        "The direction sign matters in a collision. If two objects move towards each other, their momenta have opposite signs before impact, and the total is the difference. Adding the sizes as if both were positive is the most common error. Choose a positive direction, write every velocity with its sign, and keep that convention through the calculation.",
      ],
    },
    {
      heading: "Total momentum is conserved in a closed system",
      paragraphs: [
        "If no external resultant force acts on a system, the total momentum before an interaction equals the total after. In a collision where two trolleys join, the combined mass moves with a single velocity: m₁u₁ + m₂u₂ = (m₁ + m₂)v. If the second trolley is stationary, its initial momentum is zero, so 2 × 3 = 3v and v = 2 m/s.",
        "Conservation does not mean each object keeps its momentum. The first trolley slows while the second speeds up; the total stays the same. The law is about the system. External forces such as friction eventually remove momentum from the system, which is why the conservation statement is restricted to the short interaction before friction has had a significant effect.",
      ],
    },
    {
      heading: "Impulse connects force and time",
      paragraphs: [
        "Impulse is force multiplied by the time over which it acts, and it equals the change in momentum: FΔt = Δp. For a 0.5 kg ball travelling at 8 m/s and stopped in 0.02 s, the momentum change is 4 kg m/s, so the average force is 4/0.02 = 200 N. Stopping the same ball in 0.2 s would require only 20 N.",
        "This is why airbags, crumple zones and catching a ball with relaxed hands work. The momentum change is fixed by the collision, but a longer stopping time lowers the average force. The model assumes the force is constant over the interval and neglects other forces during the short collision. It also treats the objects as rigid enough that the interaction time is well defined, which is an idealisation.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Momentum is the product of mass and velocity. Its direction is the direction of the velocity.",
      notation: "p = mv",
      caption:
        "A 2 kg trolley at 3 m/s has momentum 6 kg m/s. Reversing the direction makes the momentum −6 kg m/s.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "In a closed system, total momentum is conserved. For two objects that join, the combined mass moves with one final velocity.",
      notation: "m₁u₁ + m₂u₂ = (m₁ + m₂)v",
      caption:
        "For a 2 kg trolley at 3 m/s hitting a stationary 1 kg trolley and joining, 6 = 3v, so v = 2 m/s.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Momentum is measured in kilogram metres per second, force in newtons and time in seconds. Impulse and momentum change share the same unit.",
      notation: "p: kg m/s · F: N · t: s · Δp: kg m/s",
      caption:
        "A newton second is the same as a kilogram metre per second, because a newton is a kilogram metre per second squared and multiplying by seconds leaves kilogram metres per second.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 2 kg trolley moving at 3 m/s collides with a stationary 1 kg trolley and they move off together. Find their common velocity.",
      steps: [
        {
          move: "Calculate the momentum before: p = 2 kg × 3 m/s + 1 kg × 0 m/s = 6 kg m/s.",
          why:
            "Momentum is mass times velocity. The stationary trolley contributes zero, so the total is just the first trolley's momentum.",
        },
        {
          move: "After the collision the combined mass is 2 kg + 1 kg = 3 kg, moving at v.",
          why:
            "The trolleys join, so they have one common velocity. The total mass is the sum, not the difference.",
        },
        {
          move: "Apply conservation: 6 kg m/s = 3 kg × v, so v = 2 m/s.",
          why:
            "Total momentum is unchanged in the collision. Dividing by the combined mass gives the common velocity.",
        },
      ],
      answer: "The common velocity is 2 m/s in the original direction.",
    },
    {
      id: "w2",
      prompt:
        "A 0.5 kg ball moving at 8 m/s is stopped in 0.02 s. Calculate the average force on the ball.",
      steps: [
        {
          move: "Find the momentum change: Δp = 0.5 kg × (0 − 8 m/s) = −4 kg m/s.",
          why:
            "The final velocity is zero, so the change is final minus initial. The negative sign shows the momentum change is opposite to the ball's motion.",
        },
        {
          move: "Use FΔt = Δp and rearrange to F = Δp/Δt.",
          why:
            "Impulse equals the change in momentum. The average force is the momentum change divided by the contact time.",
        },
        {
          move: "Substitute F = −4 kg m/s / 0.02 s = −200 N.",
          why:
            "The magnitude is 200 N, directed opposite to the ball's initial motion. The negative sign is consistent with a stopping force.",
        },
      ],
      answer: "The average stopping force has magnitude 200 N.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Momentum is conserved for each object in a collision.",
      whyItFails:
        "Individual momenta change; that is the point of a collision. The conserved quantity is the total momentum of the system. One trolley loses momentum while the other gains an equal amount, so the sum stays constant.",
      correction:
        "Add the momenta of all objects before and after. Check that the totals match. Do not expect each object's momentum to stay the same.",
      contrast: {
        wrong: "The moving trolley keeps 6 kg m/s and the stationary one also gains 6 kg m/s.",
        right: "The total is 6 kg m/s before and after, shared between the two trolleys.",
      },
    },
    {
      id: "m2",
      belief: "An airbag reduces the momentum change, which is why it reduces injury.",
      whyItFails:
        "The momentum change is fixed by the crash: the passenger must be brought to rest. The airbag increases the time over which the change happens, so the average force is smaller. Reducing the momentum change would mean not stopping the passenger.",
      correction:
        "Use F = Δp/Δt. Keep Δp fixed and increase Δt to reduce F. The airbag changes the force, not the required change in momentum.",
      contrast: {
        wrong: "The airbag absorbs some of the momentum.",
        right: "The airbag lengthens the stopping time, lowering the force for the same momentum change.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Calculate the momentum of a 4 kg object moving at 2.5 m/s.",
      hint: "Multiply the mass in kilograms by the velocity in metres per second.",
      answer: "p = 4 kg × 2.5 m/s = 10 kg m/s.",
      feedback: {
        correct: "You multiplied mass by velocity and kept the unit.",
        incorrect:
          "Momentum is 4 × 2.5 = 10 kg m/s. Dividing would give a speed, not momentum.",
      },
    },
    {
      id: "p2",
      prompt:
        "A 3 kg trolley at 4 m/s collides with a stationary 1 kg trolley and they join. Find the common velocity.",
      hint: "The total momentum before equals the combined mass times the common velocity.",
      answer: "12 = (3 + 1)v, so v = 3 m/s.",
      feedback: {
        correct: "You conserved the total momentum and used the combined mass.",
        incorrect:
          "The total momentum is 12 kg m/s and the combined mass is 4 kg, so v = 3 m/s, not 4 m/s.",
      },
    },
    {
      id: "p3",
      prompt:
        "Why does a longer collision time reduce the force on an object for the same momentum change?",
      hint: "Look at F = Δp/Δt with Δp fixed.",
      answer:
        "The same change in momentum divided by a longer time gives a smaller average force.",
      feedback: {
        correct: "You used the impulse relationship and held the momentum change fixed.",
        incorrect:
          "The momentum change is fixed by the before and after velocities. Increasing the time in F = Δp/Δt decreases the force.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A 2 kg trolley at 3 m/s hits a stationary 1 kg trolley and they move off together. What is their common velocity?",
      modelAnswer: "2 m/s",
      marking: [
        "Calculates the total momentum as 6 kg m/s.",
        "Divides by the combined mass 3 kg to get 2 m/s.",
      ],
      check: { accepted: ["2 m/s", "2m/s", "2"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A 0.5 kg ball at 8 m/s is stopped in 0.02 s. What is the magnitude of the average force?",
      modelAnswer: "200 N",
      marking: [
        "Finds the momentum change as 4 kg m/s.",
        "Divides by 0.02 s to get 200 N.",
      ],
      check: { accepted: ["200 N", "200N", "200"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain conservation of momentum in a collision and use the impulse relationship to explain why a crumple zone reduces the force on passengers.",
      modelAnswer:
        "In a closed system with no external resultant force, the total momentum before a collision equals the total after. The passengers must change momentum from their initial value to rest, so Δp is fixed. The crumple zone extends the collision time, and since F = Δp/Δt, a longer time produces a smaller average force and reduces injury.",
      marking: [
        "States that total momentum is conserved in a closed system.",
        "Identifies the passengers' momentum change as fixed by the crash.",
        "Uses F = Δp/Δt to explain the smaller force from a longer time.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A 0.02 kg bullet is fired at 400 m/s from a 4 kg rifle. Find the rifle's recoil velocity and explain why the rifle's speed is much smaller than the bullet's. State any assumption.",
      whyItTransfers:
        "The lesson conserves momentum in a join-together collision. The rifle is an explosion with objects moving apart, so the learner must use opposite signs and interpret the mass difference.",
      answer:
        "Initial total momentum is zero. After firing, 0.02 × 400 + 4 × v = 0, so 8 + 4v = 0 and v = −2 m/s. The rifle recoils at 2 m/s opposite the bullet. The rifle's larger mass means it needs a smaller speed for the same magnitude of momentum. The calculation assumes no external force during firing and neglects the mass of the expelled gases.",
      marking: [
        "Sets the total momentum before firing to zero.",
        "Solves 8 + 4v = 0 for v = −2 m/s.",
        "Explains the smaller recoil speed by the larger mass and states an assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the equation for momentum, and what is its unit?",
      answer: "p = mv, measured in kg m/s.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is conserved in a collision in a closed system?",
      answer: "Total momentum, provided no external resultant force acts.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How does increasing collision time affect the force?",
      answer:
        "For the same momentum change, a longer time gives a smaller average force because F = Δp/Δt.",
      when: "month-later",
    },
  ],
  summary: [
    "Momentum is p = mv, a vector measured in kg m/s.",
    "Total momentum is conserved in a closed system; individual momenta can change.",
    "For objects that join, m₁u₁ + m₂u₂ = (m₁ + m₂)v.",
    "Impulse FΔt equals the change in momentum, so a longer collision time reduces the force.",
  ],
});

export const PHYSICS_WORK_POWER = defineGapLesson({
  conceptId: "work-power",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, energy: work, power and efficiency",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for work, power and efficiency. The lifting and machine examples are original.",
  },
  objectives: [
    {
      statement:
        "Calculate work done when a force moves an object through a distance in the force's direction.",
      evidence:
        "For a 2 kg mass lifted 1.5 m, the learner calculates the work done against gravity as 29.4 J.",
    },
    {
      statement:
        "Calculate power as work done divided by time and state the unit.",
      evidence:
        "The learner finds that doing 29.4 J of work in 0.5 s requires 58.8 W.",
    },
    {
      statement:
        "Calculate efficiency as useful output divided by total input and explain where the remaining energy goes.",
      evidence:
        "The learner finds an efficiency of 0.75 for a motor that uses 200 J to deliver 150 J of useful work and accounts for the 50 J transferred to the surroundings.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["energy-conservation"],
    check: [
      {
        id: "d1",
        question: "What is the principle of conservation of energy?",
        answer:
          "Energy cannot be created or destroyed; it is transferred between stores, with the total remaining constant.",
        targets: ["energy-conservation"],
      },
      {
        id: "d2",
        question: "What is gravitational potential energy, and how is it calculated?",
        answer:
          "Energy stored by an object raised in a gravitational field; near Earth it is mgh.",
        targets: ["energy-conservation"],
      },
    ],
  },
  introduction: {
    hook:
      "Lifting a box onto a shelf and carrying it up a ladder can do the same amount of work against gravity, but the ladder takes longer. Work measures the energy transferred by the force; power measures how quickly that transfer happens. A 60 W lamp transfers 60 J every second, while a 1,200 W kettle transfers the same 60 J in a twentieth of a second.",
    why:
      "Work and power are often treated as synonyms for effort, which hides the physics. Work is force times displacement in the direction of the force, so carrying a box horizontally does no work against gravity even though it is tiring. Power is the rate of energy transfer, and efficiency compares useful output with total input. This lesson separates the three quantities and uses units to keep them distinct.",
  },
  explanation: [
    {
      heading: "Work is force times displacement in the force's direction",
      paragraphs: [
        "Work done by a force is W = Fs, where s is the displacement in the direction of the force. The unit is the joule: one newton metre. Lifting a 2 kg mass by 1.5 m requires a force equal to its weight, 19.6 N, so the work is 19.6 × 1.5 = 29.4 J. The work is energy transferred to the gravitational store.",
        "If the force and displacement are perpendicular, the force does no work. Carrying a box horizontally at constant height does no work against gravity, because the displacement is not in the direction of the weight. The carrier may still do work on the box to overcome air resistance or to accelerate it, but that is a different force. The formula is about the component of force along the displacement.",
      ],
    },
    {
      heading: "Power is the rate of doing work",
      paragraphs: [
        "Power is P = W/t, measured in watts. One watt is one joule per second. Doing 29.4 J of work in 0.5 s requires 58.8 W; doing the same work in 2 s requires only 14.7 W. The energy transferred is the same, but the rate is different. A more powerful machine does not necessarily do more work; it does the same work faster.",
        "The relationship also applies to electrical power, where P = VI, and to mechanical power, where P = Fv for a constant force. The unifying idea is energy per unit time. The calculation assumes the force is constant and the displacement is measured along its direction; a varying force would require an average or an area under a force–distance graph.",
      ],
    },
    {
      heading: "Efficiency compares useful output with total input",
      paragraphs: [
        "Efficiency is useful energy output divided by total energy input, often expressed as a percentage. A motor that draws 200 J and delivers 150 J of useful work has an efficiency of 0.75, or 75%. The remaining 50 J is not destroyed; it is transferred to the surroundings, usually by heating and sound. Efficiency can never exceed 1 in an ordinary machine.",
        "The model assumes the input and output are measured over the same time and that all the losses are accounted for. In practice, some energy may be stored in the machine itself, so a snapshot measurement can appear to have an efficiency above one. The conservation law is not violated; the missing energy is in a store that was not included in the measurement.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Work is the energy transferred when a force moves an object through a displacement in the direction of the force.",
      notation: "W = Fs",
      caption:
        "A 19.6 N weight lifted 1.5 m gives W = 19.6 × 1.5 = 29.4 J. The displacement must be along the force.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Power is the rate of energy transfer, equal to work done divided by time.",
      notation: "P = W/t",
      caption:
        "29.4 J transferred in 0.5 s gives 58.8 W. The same work in 2 s gives 14.7 W, because the rate is lower.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Work and energy are measured in joules, power in watts, force in newtons and time in seconds.",
      notation: "W: J · P: W · F: N · s: m · t: s",
      caption:
        "One joule is one newton metre, and one watt is one joule per second. Dividing joules by seconds gives watts; multiplying newtons by metres gives joules.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 2 kg mass is lifted vertically by 1.5 m. Calculate the work done against gravity, taking g = 9.8 N/kg.",
      steps: [
        {
          move: "Calculate the weight: W = mg = 2 kg × 9.8 N/kg = 19.6 N.",
          why:
            "The lifting force must balance the weight to raise the mass at a steady speed, so the force needed is the weight.",
        },
        {
          move: "Use work = force × distance: W = 19.6 N × 1.5 m.",
          why:
            "The displacement is vertical, in the same direction as the lifting force, so the full distance counts.",
        },
        {
          move: "Substitute: W = 29.4 J.",
          why:
            "The joule is the unit of energy transferred. The work is stored as gravitational potential energy.",
        },
      ],
      answer: "The work done against gravity is 29.4 J.",
    },
    {
      id: "w2",
      prompt:
        "A motor uses 200 J of electrical energy and delivers 150 J of useful mechanical work. Calculate its efficiency and the energy wasted.",
      steps: [
        {
          move: "Use efficiency = useful output / total input = 150 J / 200 J.",
          why:
            "Efficiency compares the useful energy with the total energy supplied. Both quantities must be in the same unit.",
        },
        {
          move: "Divide: efficiency = 0.75, or 75%.",
          why:
            "The ratio is dimensionless. Multiplying by 100 expresses it as a percentage.",
        },
        {
          move: "Wasted energy = 200 J − 150 J = 50 J.",
          why:
            "Conservation of energy means the missing energy is transferred to the surroundings, usually by heating and sound, not destroyed.",
        },
      ],
      answer: "The efficiency is 0.75, and 50 J is transferred to the surroundings.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Carrying a box horizontally does work against gravity because the carrier gets tired.",
      whyItFails:
        "The weight acts downwards while the displacement is horizontal, so the force and displacement are perpendicular and the work done against gravity is zero. The tiredness comes from muscles doing internal work and from accelerating and supporting the box, not from lifting it.",
      correction:
        "Use only the component of force along the displacement. For a horizontal carry at constant height, the vertical weight has no displacement in its direction.",
      contrast: {
        wrong: "Carrying a box across a room does mgh of work.",
        right: "Carrying it at constant height does no work against gravity; lifting it does.",
      },
    },
    {
      id: "m2",
      belief: "A more powerful machine always does more work.",
      whyItFails:
        "Power is the rate of work, not the total. A 2,000 W motor running for 1 s does 2,000 J, while a 100 W motor running for 100 s does 10,000 J. The more powerful machine can do work faster, but the total depends on time as well.",
      correction:
        "Multiply power by time to compare total work. Use P = W/t and rearrange to W = Pt when the rate and duration are known.",
      contrast: {
        wrong: "The 2,000 W motor does more work because its power is higher.",
        right: "The total work depends on power and time; the 100 W motor running longer can do more.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A force of 50 N moves a crate 4 m in the direction of the force. Calculate the work done.",
      hint: "Multiply the force in newtons by the distance in metres.",
      answer: "W = 50 N × 4 m = 200 J.",
      feedback: {
        correct: "You multiplied force by displacement and gave the energy in joules.",
        incorrect:
          "Work is 50 × 4 = 200 J. Dividing by distance would give a force, not work.",
      },
    },
    {
      id: "p2",
      prompt: "A machine does 600 J of work in 3 s. Calculate its power.",
      hint: "Divide the work in joules by the time in seconds.",
      answer: "P = 600 J / 3 s = 200 W.",
      feedback: {
        correct: "You divided work by time and kept the watt unit.",
        incorrect:
          "Power is 600/3 = 200 W. Multiplying would give 1,800 J s, which is not a power.",
      },
    },
    {
      id: "p3",
      prompt:
        "A lamp uses 100 J of electrical energy and produces 20 J of useful light. What is its efficiency?",
      hint: "Divide useful output by total input, then multiply by 100 if a percentage is wanted.",
      answer: "20/100 = 0.2, or 20%.",
      feedback: {
        correct: "You compared useful output with total input.",
        incorrect:
          "The efficiency is 20 J / 100 J = 0.2. The remaining 80 J is transferred by heating.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Calculate the work done in lifting a 2 kg mass by 1.5 m, taking g = 9.8 N/kg.",
      modelAnswer: "29.4 J",
      marking: [
        "Calculates the weight as 19.6 N.",
        "Multiplies by 1.5 m to get 29.4 J.",
      ],
      check: { accepted: ["29.4 J", "29.4J", "29.4", "29 J"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "If that 29.4 J of work is done in 0.5 s, what is the power?",
      modelAnswer: "58.8 W",
      marking: [
        "Uses P = W/t.",
        "Divides 29.4 by 0.5 to get 58.8 W.",
      ],
      check: { accepted: ["58.8 W", "58.8W", "58.8", "59 W"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why carrying a box horizontally does no work against gravity, and why a machine's efficiency cannot be greater than 1.",
      modelAnswer:
        "The weight acts vertically while the displacement is horizontal, so the force has no component along the displacement and the work against gravity is zero. Efficiency is useful output divided by total input. Energy is conserved, so the useful output cannot exceed the total input; any difference is transferred to the surroundings, and an efficiency above 1 would mean energy was created.",
      marking: [
        "Explains that the force and displacement are perpendicular for a horizontal carry.",
        "Defines efficiency as useful output over total input.",
        "Uses conservation of energy to rule out efficiency above 1.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A pump lifts 30 kg of water through a height of 5 m every 10 s. Calculate the work done per second and the pump's useful power, then find its efficiency if it draws 200 W. State an assumption.",
      whyItTransfers:
        "The lesson calculates work and power for a single lift. The pump repeats the lift continuously, so the learner must combine mgh with a rate and then compare useful power with input power.",
      answer:
        "Work per lift = mgh = 30 × 9.8 × 5 = 1,470 J. Doing this every 10 s gives a useful power of 147 W. Efficiency = 147/200 = 0.735, or 73.5%. The calculation assumes the water is lifted at a steady rate, all the lifted water reaches the same height, and losses other than the input–output difference are neglected.",
      marking: [
        "Calculates the work per lift as 1,470 J.",
        "Divides by 10 s to get 147 W.",
        "Divides useful power by input power for about 73.5% and states an assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is work, and what is its unit?",
      answer:
        "Work is force times displacement in the force's direction, measured in joules.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is power, and how is it calculated?",
      answer:
        "Power is the rate of energy transfer, P = W/t, measured in watts.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How is efficiency calculated?",
      answer:
        "Useful output energy divided by total input energy, often expressed as a percentage.",
      when: "month-later",
    },
  ],
  summary: [
    "Work is force times displacement in the direction of the force, measured in joules.",
    "Power is work divided by time, measured in watts; it measures the rate, not the total.",
    "Efficiency compares useful output with total input and cannot exceed 1.",
    "Energy that is not useful is transferred to the surroundings, usually by heating and sound.",
  ],
});
