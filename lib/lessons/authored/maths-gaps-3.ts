import { defineGapLesson } from "./_gap-lesson";

// MATHS GAP BATCH 3 — accumulation, motion, proof and matrices.

export const MATHS_CALCULUS_INT = defineGapLesson({
  conceptId: "calculus-int",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, calculus: integration and areas under curves",
    level: "Key Stage 5",
    note:
      "Scope cites the published advanced mathematics subject content for integration and the fundamental theorem. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Integrate a polynomial using the reverse power rule and include the constant of integration.",
      evidence:
        "The learner integrates 3x² + 2x to x³ + x² + C and explains why the constant cannot be recovered from the derivative alone.",
    },
    {
      statement:
        "Evaluate a definite integral by subtracting the antiderivative at the lower limit from its value at the upper limit.",
      evidence:
        "The learner evaluates the integral of 3x² from 0 to 2 as 8, showing the substitution at both limits.",
    },
    {
      statement:
        "Interpret a definite integral as accumulated change and distinguish it from the gradient found by differentiation.",
      evidence:
        "For a velocity function, the learner explains that the area under the graph gives displacement while the gradient gives acceleration.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["calculus-diff"],
    check: [
      {
        id: "d1",
        question: "Differentiate x³ + x² + 7.",
        answer:
          "3x² + 2x; the constant 7 disappears because it does not change the gradient.",
        targets: ["calculus-diff"],
      },
      {
        id: "d2",
        question: "What does a definite integral's limits represent?",
        answer:
          "The lower and upper x-values between which accumulated change or area is measured.",
        targets: ["calculus-diff"],
      },
    ],
  },
  introduction: {
    hook:
      "A car's speedometer gives velocity at each instant. To find how far it travelled, you need the accumulation of those velocities over time, not the velocity at one moment. Integration adds infinitely many thin slices of rate times time. Differentiation goes the other way: it turns a total back into a rate. The two operations are inverse in a precise sense, and the definite integral makes that inverse useful for area and displacement.",
    why:
      "Integration is often taught as “add one to the power and divide”, which is a rule without a meaning. The meaning is accumulation: a rate multiplied by a small interval gives a small amount, and the integral sums those amounts as the interval shrinks. The constant of integration appears because many functions share the same derivative; the definite integral removes the ambiguity by subtracting two values.",
  },
  explanation: [
    {
      heading: "Integration reverses the power rule",
      paragraphs: [
        "Differentiation turns xⁿ into n x to the power n − 1. Reversing it means raising the power by one and dividing by the new power: the integral of xⁿ is x to the power n + 1 divided by n + 1, provided n is not −1. A constant multiplier stays in front, and a sum is integrated term by term. The rule is a search for a function whose derivative is the integrand.",
        "The reverse is not unique. x², x² + 3 and x² − 100 all differentiate to 2x, because a constant has zero derivative. The indefinite integral therefore includes + C. The constant is not decoration; it represents the family of functions that differ only by a vertical shift. A definite integral removes it because the same C is subtracted at both limits.",
      ],
    },
    {
      heading: "A definite integral is a difference of boundary values",
      paragraphs: [
        "To evaluate the integral from a to b, find an antiderivative F, then compute F(b) − F(a). The notation with limits is a instruction to subtract, not a multiplication. The result is a number, not a function, and its units are the units of the integrand multiplied by the units of x. For a velocity in metres per second integrated over seconds, the result is metres.",
        "The fundamental theorem explains why area and antiderivatives are the same idea. The accumulated area from a to x changes at a rate equal to the height of the curve at x. The derivative of the accumulation function is the original function, so the accumulation is an antiderivative. This is the bridge between the two halves of calculus, not a coincidence of notation.",
      ],
    },
    {
      heading: "Signed area and context need interpretation",
      paragraphs: [
        "A definite integral counts area below the x-axis as negative. That is useful for displacement, where moving backwards should cancel moving forwards, but it is not the same as total distance. For total distance, integrate the absolute value or split the interval at the crossings. The mathematical answer and the physical question can differ by a sign.",
        "The constant of integration and the limits both matter in modelling. An initial condition selects one member of the family: if the amount is 500 at time zero, substitute to find C. A definite integral answers a question about a specific interval. Mixing the two — adding C to a definite integral — is a sign that the role of the constant has been misunderstood.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The reverse power rule raises the exponent by one and divides by the new exponent. The constant C records the vertical shift that differentiation loses.",
      notation: "∫ xⁿ dx = x^(n+1)/(n+1) + C, for n ≠ −1",
      caption:
        "The integral of 3x² is x³ + C because the derivative of x³ is 3x². The constant can be any real number.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A definite integral is the antiderivative evaluated at the upper limit minus the same antiderivative at the lower limit.",
      notation: "∫₀² 3x² dx = [x³]₀² = 8 − 0 = 8",
      caption:
        "The square brackets mean evaluate at 2 and at 0, then subtract. The constant cancels, so a definite integral is a single number.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "The definite integral measures signed area between the curve and the x-axis. Area below the axis counts as negative, which is why displacement can be smaller than distance.",
      notation: "velocity v = 3t²; displacement from t = 0 to 4 is ∫₀⁴ 3t² dt = 64",
      caption:
        "The area under the velocity graph is 64 metres. The gradient of the velocity graph at a point would instead give acceleration.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Find the indefinite integral of 3x² + 2x with respect to x.",
      steps: [
        {
          move: "Integrate 3x²: raise the power to 3 and divide by 3, giving x³.",
          why:
            "The reverse power rule must produce a function whose derivative is 3x². The derivative of x³ is 3x², so the coefficient cancels.",
        },
        {
          move: "Integrate 2x: raise the power to 2 and divide by 2, giving x².",
          why:
            "The same rule applies term by term. The derivative of x² is 2x, which recovers the original term.",
        },
        {
          move: "Add the constant: x³ + x² + C.",
          why:
            "Every constant has zero derivative, so the antiderivative is a family. The C records the information differentiation removed.",
        },
      ],
      answer: "x³ + x² + C.",
    },
    {
      id: "w2",
      prompt: "Evaluate the definite integral of 3x² from x = 0 to x = 2.",
      steps: [
        {
          move: "Find an antiderivative: x³.",
          why:
            "The derivative of x³ is 3x², so x³ is the function whose accumulated change we need.",
        },
        {
          move: "Evaluate at the upper limit: 2³ = 8.",
          why:
            "The upper limit gives the total accumulation from the chosen starting point to x = 2.",
        },
        {
          move: "Evaluate at the lower limit: 0³ = 0, then subtract to get 8.",
          why:
            "Subtracting removes the accumulation before x = 0, leaving the part between the two limits.",
        },
      ],
      answer: "The definite integral is 8.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The integral of x² is x³, because you add one to the power.",
      whyItFails:
        "Raising the power is only half the rule. The derivative of x³ is 3x², which is three times too large, so the antiderivative must be divided by 3. Differentiating the candidate is the check that catches the missing denominator.",
      correction:
        "Raise the power and divide by the new power. Differentiate the result to confirm it returns the integrand, and include C for an indefinite integral.",
      contrast: {
        wrong: "∫ x² dx = x³ + C",
        right: "∫ x² dx = x³/3 + C",
      },
    },
    {
      id: "m2",
      belief: "A definite integral and an indefinite integral are the same calculation with extra numbers.",
      whyItFails:
        "An indefinite integral is a family of functions and needs + C. A definite integral is a single number obtained by subtracting boundary values, and the constant cancels. Adding C to a definite answer is meaningless because the result is not a function.",
      correction:
        "Decide which question is being asked: a family of antiderivatives or an accumulated amount over an interval. Use + C only for the family.",
      contrast: {
        wrong: "∫₀² 2x dx = x² + C = 4 + C",
        right: "∫₀² 2x dx = [x²]₀² = 4",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Find the indefinite integral of 4x³.",
      hint: "Raise the power to 4 and divide by 4, then add C.",
      answer: "x⁴ + C.",
      feedback: {
        correct: "You reversed the power rule and included the constant.",
        incorrect:
          "The new power is 4 and the coefficient 4 divides by 4, leaving x⁴. Do not forget + C.",
      },
    },
    {
      id: "p2",
      prompt: "Evaluate the definite integral of 2x from x = 1 to x = 3.",
      hint: "An antiderivative is x²; evaluate at 3 and at 1 and subtract.",
      answer: "3² − 1² = 9 − 1 = 8.",
      feedback: {
        correct: "You subtracted the lower-limit value from the upper-limit value.",
        incorrect:
          "The antiderivative is x², so the value is 9 − 1 = 8. Subtracting in the wrong order gives −8, which would reverse the interval.",
      },
    },
    {
      id: "p3",
      prompt: "A velocity is v = 3t² m/s. What is the displacement from t = 0 to t = 4?",
      hint: "Integrate 3t² to get t³, then evaluate from 0 to 4.",
      answer: "∫₀⁴ 3t² dt = [t³]₀⁴ = 64 m.",
      feedback: {
        correct: "You integrated the rate and attached the unit of displacement.",
        incorrect:
          "The antiderivative of 3t² is t³. Evaluating from 0 to 4 gives 64, and the unit is metres because velocity times time is displacement.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the definite integral of 3x² from x = 0 to x = 2?",
      modelAnswer: "8",
      marking: [
        "Uses x³ as the antiderivative.",
        "Evaluates 2³ − 0³ = 8.",
      ],
      check: { accepted: ["8", "eight"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the indefinite integral of 3x² + 2x? Include the constant.",
      modelAnswer: "x³ + x² + C",
      marking: [
        "Raises each power by one and divides by the new power.",
        "Includes the constant of integration.",
      ],
      check: { accepted: ["x³ + x² + C", "x^3 + x^2 + C", "x³+x²+C", "x^3+x^2+c"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why an indefinite integral needs a constant of integration but a definite integral does not. Use one example of each.",
      modelAnswer:
        "Differentiating x², x² + 3 and x² − 10 all give 2x, so the antiderivative is a family x² + C. A definite integral subtracts the antiderivative at the lower limit from its value at the upper limit, so the same C appears in both terms and cancels. For example, the integral of 2x from 0 to 3 is 9, not 9 + C.",
      marking: [
        "Explains that many functions share the same derivative because constants vanish.",
        "Shows the same constant cancelling in a definite integral.",
        "Gives a correct numerical example of the definite integral.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A factory's rate of production is modelled by r(t) = 120 − 6t items per hour for 0 ≤ t ≤ 15. Find the total production in the first 10 hours and explain why the integral of the rate, not the rate at t = 10, answers the question.",
      whyItTransfers:
        "The lesson integrates polynomial rates. The factory adds a linear decreasing rate and a time interval, so the learner must interpret the integral as accumulated output and evaluate a definite integral rather than substitute one time.",
      answer:
        "Total production = ∫₀¹⁰ (120 − 6t) dt = [120t − 3t²]₀¹⁰ = 1200 − 300 = 900 items. The rate at t = 10 is 60 items per hour, which is an instantaneous speed, not a total. The integral adds the varying rate over the whole interval.",
      marking: [
        "Sets up the definite integral of the rate over 0 to 10.",
        "Evaluates the antiderivative at both limits to get 900 items.",
        "Distinguishes an instantaneous rate from accumulated production.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the integral of x³?",
      answer: "x⁴/4 + C.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does a definite integral compute?",
      answer:
        "The accumulated change, or signed area, between the two limits; it is a number, not a family of functions.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why can the constant of integration not be recovered from a derivative?",
      answer:
        "A constant has zero derivative, so every vertical shift of an antiderivative has the same derivative.",
      when: "month-later",
    },
  ],
  summary: [
    "Integration reverses differentiation; the reverse power rule raises the exponent and divides by the new one.",
    "An indefinite integral is a family and needs + C; a definite integral is a number and the constant cancels.",
    "A definite integral accumulates a rate over an interval and counts area below the axis as negative.",
    "Differentiate an antiderivative to check it, and attach the units of rate times the input.",
  ],
});

export const MATHS_KINEMATICS = defineGapLesson({
  conceptId: "kinematics",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, mechanics: kinematics with constant acceleration",
    level: "Key Stage 5",
    note:
      "Scope cites the published mechanics subject content for motion with constant acceleration. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Select and rearrange a constant-acceleration equation from the quantities given and required.",
      evidence:
        "Given initial velocity, acceleration and time, the learner uses v = u + at; given distance instead of final velocity, the learner uses s = ut + ½at².",
    },
    {
      statement:
        "Interpret the gradient and area of a velocity-time graph as acceleration and displacement.",
      evidence:
        "The learner explains that the gradient of a velocity-time graph is acceleration and the area under it is displacement.",
    },
    {
      statement:
        "Check a kinematic answer against the physical situation, including the sign of the acceleration and the reasonableness of the speed.",
      evidence:
        "For braking from 20 m/s at 5 m/s², the learner obtains a stopping distance of 40 m and explains why the negative acceleration reduces the speed.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["straight-lines", "area-perimeter"],
    check: [
      {
        id: "d1",
        question: "What does the gradient of a straight-line graph represent?",
        answer:
          "The rate of change of the vertical quantity with respect to the horizontal quantity.",
        targets: ["straight-lines"],
      },
      {
        id: "d2",
        question: "How do you find the area of a trapezium?",
        answer:
          "Average the two parallel sides and multiply by the perpendicular height: ½(a + b)h.",
        targets: ["area-perimeter"],
      },
    ],
  },
  introduction: {
    hook:
      "A train accelerates uniformly from 10 m/s to 26 m/s in 4 seconds. How far did it travel? The average velocity is 18 m/s, so in 4 seconds it covers 72 m. The formula s = ut + ½at² gives the same answer. A velocity-time graph shows why: the area under the line is a trapezium, and its area is the distance.",
    why:
              "The constant-acceleration equations are often memorised as five letters with no link to a graph. The graph explains both the formulas and their limits: the gradient is acceleration, the area is displacement, and the equations only apply while acceleration is constant. This lesson selects the equation from the information, then checks the result against the graph and the physical direction. That check is not optional decoration; it is how a plausible arithmetic slip is caught before it becomes a reported distance.",
  },
  explanation: [
    {
      heading: "The five quantities and the equations that link them",
      paragraphs: [
        "The quantities are displacement s, initial velocity u, final velocity v, acceleration a and time t. Each constant-acceleration equation omits one of them. v = u + at links v, u, a and t; s = ut + ½at² links s, u, a and t; v² = u² + 2as links v, u, a and s; s = ½(u + v)t links s, u, v and t. Choosing the equation is a matter of listing what is known and what is wanted.",
        "The equations assume constant acceleration and motion in a straight line. If the acceleration changes, the formulas do not describe the whole journey; split the journey into intervals or use a graph. The sign convention must also be fixed before substituting: choose a positive direction and give u, v, a and s signs consistent with it.",
      ],
    },
    {
      heading: "The velocity-time graph is the model",
      paragraphs: [
        "On a velocity-time graph, the gradient is the change in velocity per unit of time, which is acceleration. A horizontal line means constant velocity and zero acceleration. A straight line with a negative gradient means constant deceleration. The area between the line and the time axis is displacement; area below the axis counts as negative displacement.",
        "For constant acceleration, the area is a trapezium with parallel sides u and v and height t, giving s = ½(u + v)t. The other equations follow from combining this area with v = u + at. The graph is not a separate method; it is a picture of the same assumptions and a check on the algebra.",
      ],
    },
    {
      heading: "Signs and stopping distances",
      paragraphs: [
        "Deceleration is not a separate quantity with its own formula; it is acceleration whose direction is opposite to the chosen positive velocity. If the car is moving forward and the brakes are applied, the velocity and acceleration have opposite signs. Substituting that signed value into v² = u² + 2as makes the squared speed fall, which is the algebraic signature of slowing down. A result that makes the car speed up while braking is a sign error, not a surprising physical effect.",
        "Stopping distance is the distance travelled before v = 0. Using v² = u² + 2as with v = 0 gives s = −u²/(2a). The negative acceleration makes the denominator negative, so the distance is positive. The result should be compared with the speed: a car at 20 m/s braking at 5 m/s² takes 4 seconds and travels 40 m, which is plausible for dry road conditions.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The constant-acceleration equations each omit one quantity. Listing the knowns and the required value selects the equation without trial.",
      notation: "v = u + at; s = ut + ½at²; v² = u² + 2as; s = ½(u + v)t",
      caption:
        "For u = 10, a = 4 and t = 4, v = 10 + 16 = 26 m/s and s = 40 + 32 = 72 m. Both answers use the same acceleration.",
    },
    {
      id: "r2",
      kind: "maths.graph",
      body:
        "The gradient of a velocity-time graph is acceleration, and the area under it is displacement. A straight line represents constant acceleration.",
      notation: "u = 10 m/s, v = 26 m/s, t = 4 s; area = ½(10 + 26) × 4 = 72 m",
      caption:
        "The trapezium's parallel sides are the initial and final velocities. Its area is the distance travelled, not the average velocity alone.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A braking distance comes from setting the final velocity to zero. The negative acceleration makes the distance positive.",
      notation: "0 = 20² + 2(−5)s ⇒ s = 400/10 = 40 m",
      caption:
        "The car travels 40 m before stopping. The time to stop is 4 s, which is consistent with a uniform deceleration from 20 m/s.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A cyclist starts at 10 m/s and accelerates at 4 m/s² for 4 s. Find the final velocity and the distance travelled.",
      steps: [
        {
          move: "List the knowns with signs: u = 10 m/s, a = 4 m/s², t = 4 s; v and s are unknown.",
          why:
            "A sign convention and a list of quantities prevent choosing an equation that contains two unknowns.",
        },
        {
          move: "Use v = u + at = 10 + 4 × 4 = 26 m/s.",
          why:
            "This equation links the four quantities that do not include distance. The velocity increases because acceleration is in the same direction.",
        },
        {
          move: "Use s = ut + ½at² = 10 × 4 + ½ × 4 × 16 = 40 + 32 = 72 m. The final velocity is 26 m/s and the distance is 72 m.",
          why:
            "The distance has two parts: the distance at the initial speed and the extra distance from acceleration. The units are metres.",
        },
      ],
      answer: "v = 26 m/s and s = 72 m.",
    },
    {
      id: "w2",
      prompt:
        "A car travelling at 20 m/s brakes uniformly at 5 m/s². Find its stopping distance.",
      steps: [
        {
          move: "Take forward as positive: u = 20 m/s, v = 0, a = −5 m/s².",
          why:
            "The acceleration opposes the motion, so it must be negative under this convention. Setting v = 0 is the stopping condition.",
        },
        {
          move: "Use v² = u² + 2as: 0 = 400 + 2(−5)s.",
          why:
            "This equation links the velocities, acceleration and distance and does not need the time. The negative term reduces the square of the velocity.",
        },
        {
          move: "Solve: 0 = 400 − 10s, so s = 40 m.",
          why:
            "The distance is positive and plausible for a car at 20 m/s. A negative distance would signal a sign error.",
        },
      ],
      answer: "The stopping distance is 40 m.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A negative acceleration always means the object is slowing down.",
      whyItFails:
        "The sign of acceleration is relative to the chosen positive direction. An object moving in the negative direction with a negative acceleration is speeding up in that direction. “Deceleration” means the acceleration opposes the velocity, not that the number is negative.",
      correction:
        "Compare the signs of velocity and acceleration. If they are the same, speed increases; if they are opposite, speed decreases. State the positive direction before interpreting either sign.",
      contrast: {
        wrong: "a = −3 m/s², so the object must be slowing.",
        right: "a = −3 m/s² slows a positive velocity but speeds up a negative one.",
      },
    },
    {
      id: "m2",
      belief: "The area under a velocity-time graph is the acceleration.",
      whyItFails:
        "The gradient of a velocity-time graph is acceleration; the area is displacement. The units confirm it: velocity (m/s) multiplied by time (s) gives metres, not m/s². Reading the area as acceleration confuses the two graphical operations.",
      correction:
        "Use gradient for rate of change and area for accumulation. On a velocity-time graph that means gradient = acceleration, area = displacement.",
      contrast: {
        wrong: "The area under the graph is the acceleration.",
        right: "The gradient is acceleration; the area is displacement.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "A car accelerates from 8 m/s at 3 m/s² for 5 s. Find its final velocity.",
      hint: "Use the equation linking final velocity, initial velocity, acceleration and time.",
      answer: "v = 8 + 3 × 5 = 23 m/s.",
      feedback: {
        correct: "You used the equation that links the four known quantities.",
        incorrect:
          "The final velocity is the initial velocity plus the change: 8 + 15 = 23 m/s.",
      },
    },
    {
      id: "p2",
      prompt: "A train decelerates from 30 m/s to rest at 2 m/s². How far does it travel?",
      hint: "Use v² = u² + 2as with v = 0 and a = −2.",
      answer: "0 = 900 − 4s, so s = 225 m.",
      feedback: {
        correct: "You set the final velocity to zero and kept the negative acceleration.",
        incorrect:
          "With v = 0, 0 = 900 + 2(−2)s, so 4s = 900 and s = 225 m. Dropping the negative sign would give a negative distance.",
      },
    },
    {
      id: "p3",
      prompt: "What does the area under a velocity-time graph represent, and what does its gradient represent?",
      hint: "Check the units of each operation.",
      answer: "Area is displacement; gradient is acceleration.",
      feedback: {
        correct: "You matched the graphical operation to the physical quantity and its units.",
        incorrect:
          "Velocity times time gives displacement; change in velocity divided by time gives acceleration. The two operations are not interchangeable.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A cyclist starts at 10 m/s and accelerates at 4 m/s² for 4 s. What is the final velocity in m/s?",
      modelAnswer: "26",
      marking: [
        "Uses v = u + at.",
        "Adds 10 and 16 to get 26 m/s.",
      ],
      check: { accepted: ["26", "26 m/s", "twenty six"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Using the same cyclist, what distance is travelled in the 4 s?",
      modelAnswer: "72",
      marking: [
        "Uses s = ut + ½at².",
        "Computes 40 + 32 = 72 m.",
      ],
      check: { accepted: ["72", "72 m", "seventy two"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why a negative acceleration does not always mean an object is slowing down, and how a velocity-time graph shows the difference.",
      modelAnswer:
        "The sign of acceleration is relative to the chosen positive direction. If velocity and acceleration have the same sign, the speed increases; if they have opposite signs, it decreases. On a velocity-time graph, acceleration is the gradient: a line moving away from zero shows increasing speed, while a line moving toward zero shows decreasing speed, regardless of whether the gradient is positive or negative.",
      marking: [
        "Explains that the sign depends on the chosen positive direction.",
        "Compares the signs of velocity and acceleration.",
        "Uses the gradient of a velocity-time graph to distinguish speeding up from slowing down.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A driver travelling at 30 m/s sees a hazard and brakes at 6 m/s² after a reaction time of 0.8 s. Calculate the total stopping distance and explain why the reaction distance is added to the braking distance.",
      whyItTransfers:
        "The lesson computes a single braking phase. The driver adds a constant-speed reaction phase before braking, so the learner must split the motion into two intervals and apply different equations to each.",
      answer:
        "During the 0.8 s reaction, the car travels 30 × 0.8 = 24 m at constant speed. Braking from 30 m/s at 6 m/s² gives 0 = 900 − 12s, so s = 75 m. The total is 99 m. The reaction distance is added because the car has not started braking yet; the two phases have different accelerations and cannot be combined in one constant-acceleration equation.",
      marking: [
        "Computes the reaction distance at constant velocity.",
        "Computes the braking distance with v = 0 and a negative acceleration.",
        "Adds the two phases and explains why one equation cannot cover both.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does the gradient of a velocity-time graph represent?",
      answer: "Acceleration, the rate of change of velocity.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Which equation links v, u, a and s without t?",
      answer: "v² = u² + 2as.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What assumption do the constant-acceleration equations make?",
      answer:
        "Acceleration is constant and motion is in a straight line; the equations do not describe a changing acceleration.",
      when: "month-later",
    },
  ],
  summary: [
    "The constant-acceleration equations link s, u, v, a and t, each omitting one quantity.",
    "On a velocity-time graph, gradient is acceleration and area is displacement.",
    "Fix a positive direction and give velocity and acceleration consistent signs.",
    "Split a journey when the acceleration changes; one SUVAT equation cannot describe both phases.",
  ],
});

export const MATHS_PROOF = defineGapLesson({
  conceptId: "proof",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, algebra: algebraic proof and reasoning",
    level: "Key Stage 4, Higher",
    note:
      "Scope cites the published GCSE mathematics subject content for proof, counterexample and algebraic argument. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Represent odd and even integers algebraically and use the representations to prove a general statement.",
      evidence:
        "The learner proves that the sum of two odd numbers is even by writing 2m + 1 and 2n + 1 and simplifying to 2(m + n + 1).",
    },
    {
      statement:
        "Disprove a universal statement with a single counterexample and explain why one is enough.",
      evidence:
        "The learner disproves “n² is odd for every integer n” with n = 2 and states that the universal claim requires every case.",
    },
    {
      statement:
        "Distinguish proof by exhaustion, direct algebraic proof and disproof by counterexample, and choose the appropriate method.",
      evidence:
        "The learner chooses exhaustion for a statement about digits, algebra for a statement about all integers, and a counterexample for a false universal claim.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["algebra-expressions", "inequalities"],
    check: [
      {
        id: "d1",
        question: "How would you write an even integer in algebra?",
        answer: "2n for an integer n, because it is a multiple of 2.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d2",
        question: "What does it mean for a statement to hold for all integers?",
        answer:
          "Every integer must satisfy it; one exception is enough to disprove the universal claim.",
        targets: ["inequalities"],
      },
    ],
  },
  introduction: {
    hook:
      "Someone says every odd number squared is one more than a multiple of eight. Checking 3, 5 and 7 works, but that is not a proof; the next odd number might fail. A proof must cover every case, not a sample. The same distinction decides how to react to a claim: one counterexample disproves a universal statement, while any number of examples cannot prove one.",
    why:
      "Proof is where mathematics stops being a set of calculations and becomes an argument. The lesson separates three methods that are often blurred: direct algebra for “all integers”, exhaustion for a finite set of cases, and a counterexample for a false claim. It also treats notation as part of the reasoning: an odd number is 2n + 1, not “an odd-looking number”, and the algebra must end in the form the claim requires.",
  },
  explanation: [
    {
      heading: "Algebra turns a pattern into a general statement",
      paragraphs: [
        "An even integer is 2n and an odd integer is 2n + 1 for some integer n. These forms are not examples; they cover every integer of that parity. Consecutive integers can be written n and n + 1, and consecutive odd integers as 2n + 1 and 2n + 3. The representation carries the property the proof needs, so the algebra can manipulate it without losing generality.",
        "A direct proof starts from the definitions, performs valid algebraic steps and ends in the form the claim requires. To prove a sum is even, the final expression must be 2 times an integer. To prove a product is a multiple of 3, it must be 3 times an integer. Ending with “it looks even” is not enough; the structure has to be visible.",
      ],
    },
    {
      heading: "One counterexample defeats a universal claim",
      paragraphs: [
        "A statement of the form “for all n” is false as soon as one valid n fails. The counterexample must satisfy the statement's conditions; testing n = 0 against a claim about positive integers is not a counterexample. Once a valid exception is found, the universal claim is disproved and no further cases are needed.",
        "A counterexample does not prove the statement false for every value; it proves the universal claim is false. Other values may still satisfy it. The correct conclusion is precise: “the statement is not true for all n, because n = 2 fails”. Saying “the statement is always false” overstates what one exception establishes.",
      ],
    },
    {
      heading: "Exhaustion is for a finite set of cases",
      paragraphs: [
        "Proof by exhaustion checks every possible case. It is appropriate when the cases are finite and small, such as the last digit of a square or the possible remainders modulo 4. It is not appropriate for all integers, because there are infinitely many and no finite checklist can cover them.",
        "The method needs a reason that the list is complete. “I checked 1, 2 and 3” is not exhaustion unless the statement is only about those three values. Stating the case split and why it covers every possibility is part of the proof, not administrative detail. Without that justification, the work is a sample, and a sample cannot establish a universal claim. That is the standard every exhaustion proof must meet.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The algebraic forms encode parity for every integer. The proof manipulates these forms and ends with the structure the claim requires.",
      notation: "odd: 2n + 1; even: 2n; consecutive: n and n + 1",
      caption:
        "The sum (2m + 1) + (2n + 1) = 2(m + n + 1), which is even because m + n + 1 is an integer.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A direct proof of the sum of two consecutive squares being odd ends with an odd form, not merely an example.",
      notation: "n² + (n + 1)² = 2n² + 2n + 1 = 2(n² + n) + 1",
      caption:
        "The final expression is one more than twice an integer, so it is odd for every integer n.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "A counterexample is a valid value that makes the universal claim false. It must meet the statement's hypotheses.",
      notation: "Claim: n² is odd for every integer n. Counterexample: n = 2, n² = 4, which is even.",
      caption:
        "One valid exception disproves the universal claim. It does not show that n² is always even; other values may be odd.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt: "Prove that the sum of two odd integers is even.",
      steps: [
        {
          move: "Let the odd integers be 2m + 1 and 2n + 1 for integers m and n.",
          why:
            "The form 2m + 1 represents every odd integer, not a particular example. Two different letters allow the two numbers to be different.",
        },
        {
          move: "Add: (2m + 1) + (2n + 1) = 2m + 2n + 2.",
          why:
            "The constants 1 + 1 combine to 2, and the terms with m and n remain. No assumption has been made about the values.",
        },
        {
          move: "Factor out 2: 2(m + n + 1). Since m + n + 1 is an integer, the sum is even.",
          why:
            "The definition of even is exactly “2 times an integer”. The factor 2 is the proof, not a coincidence of the example.",
        },
      ],
      answer: "The sum is 2(m + n + 1), which is even for all integers m and n.",
    },
    {
      id: "w2",
      prompt:
        "Prove that the sum of the squares of two consecutive integers is odd.",
      steps: [
        {
          move: "Let the consecutive integers be n and n + 1.",
          why:
            "Consecutive integers differ by one, so one letter and a shift covers every pair.",
        },
        {
          move: "Expand: n² + (n + 1)² = n² + n² + 2n + 1 = 2n² + 2n + 1.",
          why:
            "The middle term 2n comes from expanding the bracket. Collecting like terms is valid for every n.",
        },
        {
          move: "Factor: 2(n² + n) + 1, which is one more than an even number and therefore odd.",
          why:
            "The form 2k + 1 is the definition of odd. The proof ends with the required structure, not with a checked example.",
        },
      ],
      answer: "The sum is 2(n² + n) + 1, which is odd for every integer n.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Checking several examples proves a statement for all integers.",
      whyItFails:
        "Examples can only show that the statement holds for those values. They cannot rule out a later exception. A universal claim needs an argument that covers every integer, such as the algebraic form 2n + 1 or a complete case split.",
      correction:
        "Use algebra for an infinite set and exhaustion only for a genuinely finite set. State why the representation covers every case, not just the ones tested.",
      contrast: {
        wrong: "It works for 1, 2 and 3, so it works for all n.",
        right: "Write the general forms and prove the result for arbitrary n.",
      },
    },
    {
      id: "m2",
      belief: "One counterexample proves the statement is false for every value.",
      whyItFails:
        "A counterexample disproves the universal claim, but it says nothing about other values. The statement “all n satisfy P” is false, yet P may still hold for many n. The conclusion must match what the counterexample establishes.",
      correction:
        "Say “the statement is not true for all n, because n = 2 fails”. Do not claim the property never holds without a separate proof.",
      contrast: {
        wrong: "n = 2 fails, so n² is never odd.",
        right: "n = 2 fails, so the claim that n² is always odd is false.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Write an expression for an odd integer and explain why it covers every odd integer.",
      hint: "An odd integer is one more than a multiple of two.",
      answer: "2n + 1 for an integer n; every odd integer is one more than an even integer.",
      feedback: {
        correct: "You used the definition of odd rather than an example.",
        incorrect:
          "The form 2n + 1 covers every odd integer because every odd number is one more than a multiple of 2.",
      },
    },
    {
      id: "p2",
      prompt: "Disprove the claim “n² is odd for every integer n”.",
      hint: "Find an integer whose square is even.",
      answer: "n = 2 gives n² = 4, which is even, so the universal claim is false.",
      feedback: {
        correct: "You gave a valid counterexample and drew the precise conclusion.",
        incorrect:
          "n = 2 is a valid integer and 2² = 4 is even. One valid exception is enough to disprove the universal claim.",
      },
    },
    {
      id: "p3",
      prompt: "Prove that the product of two odd integers is odd.",
      hint: "Write both as 2m + 1 and 2n + 1, expand, then factor out 2 with a remainder of 1.",
      answer:
        "(2m + 1)(2n + 1) = 4mn + 2m + 2n + 1 = 2(2mn + m + n) + 1, which is odd.",
      feedback: {
        correct: "You expanded and ended with the 2k + 1 structure.",
        incorrect:
          "The product expands to 4mn + 2m + 2n + 1. Factoring 2 from the first three terms leaves 2(2mn + m + n) + 1, which is odd.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "Write an expression for an odd integer in terms of an integer n.",
      modelAnswer: "2n + 1",
      marking: [
        "Uses the definition of odd as one more than a multiple of 2.",
        "States that n is an integer.",
      ],
      check: { accepted: ["2n + 1", "2n+1", "2n plus 1"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Give a counterexample to “n² is odd for every integer n”.",
      modelAnswer: "2",
      marking: [
        "Chooses an integer whose square is even.",
        "Recognises that one valid exception disproves the universal claim.",
      ],
      check: { accepted: ["2", "n = 2", "two"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Prove that the sum of the squares of two consecutive integers is odd. State clearly why your algebra covers every pair.",
      modelAnswer:
        "Let the integers be n and n + 1. Their squares sum to n² + (n + 1)² = 2n² + 2n + 1 = 2(n² + n) + 1. Since n² + n is an integer, the result is one more than twice an integer, which is the definition of odd. The letter n represents an arbitrary integer, so the argument covers every consecutive pair.",
      marking: [
        "Represents the consecutive integers as n and n + 1.",
        "Expands and collects to 2n² + 2n + 1.",
        "Factors to 2(n² + n) + 1 and explains why this is odd for every n.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A student claims that every odd number can be written as the sum of two prime numbers. Test the claim for 9, 11 and 15, then explain whether the tests prove or disprove it. If you find a counterexample, state exactly what it establishes.",
      whyItTransfers:
        "The lesson proves algebraic statements about all integers. The prime-sum claim is a universal statement about odd numbers where examples and a counterexample play different roles, so the learner must apply the logic of disproof rather than algebra.",
      answer:
        "9 = 2 + 7 works, and 15 = 2 + 13 works, but 11 cannot be written as the sum of two primes: the only decompositions are 2 + 9, 3 + 8, 5 + 6 and 7 + 4, and each pair contains a composite number. So 11 is a counterexample and the universal claim is false. The successful cases for 9 and 15 do not prove the claim, because a universal statement needs an argument covering every odd number; one valid exception is enough to disprove it.",
      marking: [
        "Tests the stated values correctly and distinguishes a prime from a composite summand.",
        "Explains that successful examples do not prove a universal claim.",
        "States that one valid counterexample would disprove it and no conclusion beyond the tested cases follows.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "How do you write an even integer algebraically?",
      answer: "2n for an integer n.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is disproof by counterexample?",
      answer:
        "Finding one valid case that makes a universal statement false, which is enough to disprove the statement.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "When is proof by exhaustion appropriate?",
      answer:
        "When the statement concerns a finite, complete set of cases that can each be checked.",
      when: "month-later",
    },
  ],
  summary: [
    "Represent even and odd integers as 2n and 2n + 1 so an argument covers every case.",
    "A direct proof ends in the structure the claim requires, such as 2k for even or 2k + 1 for odd.",
    "One valid counterexample disproves a universal statement; examples cannot prove one.",
    "Exhaustion is valid only when the case list is genuinely complete and finite.",
  ],
});

export const MATHS_MATRICES_INTRO = defineGapLesson({
  conceptId: "matrices-intro",
  subject: "maths",
  curriculum: {
    reference: "GCSE Mathematics, matrices and transformations",
    level: "Key Stage 5",
    note:
      "Scope cites the published advanced mathematics subject content for matrices, determinants and transformations. The examples are original.",
  },
  objectives: [
    {
      statement:
        "Multiply compatible matrices and explain why the order of multiplication matters.",
      evidence:
        "The learner multiplies a 2×2 by a 2×2 matrix by taking row-by-column dot products, and shows that reversing the order can change the result.",
    },
    {
      statement:
        "Compute a 2×2 determinant and interpret its sign and magnitude as area scaling and orientation.",
      evidence:
        "For the matrix with rows (2, 3) and (1, 4), the learner computes determinant 5 and explains that areas are scaled by 5.",
    },
    {
      statement:
        "Explain why a zero determinant means no inverse and a collapse of the plane.",
      evidence:
        "The learner states that a zero determinant sends a 2D region to a line or point, so distinct inputs can map to the same output and no inverse can recover them.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["simultaneous", "vectors"],
    check: [
      {
        id: "d1",
        question: "How does a vector represent a translation?",
        answer:
          "By its components: the horizontal and vertical displacements applied to every point.",
        targets: ["vectors"],
      },
      {
        id: "d2",
        question: "What does it mean for two equations to be solved simultaneously?",
        answer:
          "The solution values satisfy both equations at the same time, usually the point where their graphs meet.",
        targets: ["simultaneous"],
      },
    ],
  },
  introduction: {
    hook:
      "A computer rotates an image by 90°, then reflects it. Applying the transformations in the other order gives a different picture. Matrices make that order explicit: each transformation is an array, and multiplying the arrays composes the operations. The product is not commutative, which is why “rotate then reflect” is not the same instruction as “reflect then rotate”.",
    why:
      "A matrix is often introduced as a grid of numbers to multiply by a rule. The rule is row-by-column because each output component is a dot product of a row with the input vector. Once that is clear, the determinant and inverse have geometric meanings: area scaling and undoing a transformation. This lesson keeps the geometry beside the arithmetic so the formulas are not arbitrary.",
  },
  explanation: [
    {
      heading: "Matrix multiplication composes transformations",
      paragraphs: [
        "A 2×2 matrix maps a vector to another vector. The first row computes the first output component from the input components; the second row computes the second. Multiplying two matrices means applying one transformation and then the other. The row-by-column rule is exactly the composition: each entry is the dot product of a row from the left matrix with a column from the right.",
        "The inner dimensions must match: a 2×3 matrix can multiply a 3×2 matrix, producing a 2×2 result, but the reverse order produces a 3×3 result. Even when both products exist, AB and BA are usually different. Matrix multiplication is associative but not commutative, which matches the fact that transformations do not generally commute.",
      ],
    },
    {
      heading: "The determinant measures area scaling",
      paragraphs: [
        "For a 2×2 matrix with rows (a, b) and (c, d), the determinant is ad − bc. Its absolute value is the factor by which the transformation scales area. A determinant of 5 means a unit square maps to a shape with area 5; a determinant of 0.5 shrinks areas by half. The sign records whether orientation is preserved or reversed.",
        "A negative determinant means the transformation reflects the plane, reversing clockwise and anticlockwise. A zero determinant means the image collapses to a line or a point: area becomes zero, distinct inputs can share an output, and the transformation cannot be undone. That is why the inverse formula divides by the determinant and fails when it is zero.",
      ],
    },
    {
      heading: "Inverses undo a transformation",
      paragraphs: [
        "The inverse of a 2×2 matrix swaps the diagonal entries, changes the signs of the off-diagonal entries, and divides by the determinant. Multiplying a matrix by its inverse gives the identity matrix, which leaves every vector unchanged. The inverse exists exactly when the determinant is non-zero.",
        "Inverse matrices solve simultaneous equations written as a matrix equation. If A times x equals b, then x equals A inverse times b, provided A is invertible. This is the same elimination method in compact form; the determinant condition is the matrix version of “the equations are independent”. When the determinant is zero, the equations share a dependency and the system has either no solution or infinitely many. That is the singular case.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "Each entry of a product is a row of the left matrix dotted with a column of the right matrix. The inner dimensions must agree.",
      notation:
        "[[a, b], [c, d]] × [[e, f], [g, h]] = [[ae + bg, af + bh], [ce + dg, cf + dh]]",
      caption:
        "The top-left entry uses the first row and first column; the top-right uses the first row and second column. The pattern is row-by-column throughout.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The determinant is the difference of the diagonal products. Its absolute value scales area and its sign records orientation.",
      notation: "det [[a, b], [c, d]] = ad − bc",
      caption:
        "For [[2, 3], [1, 4]], det = 8 − 3 = 5, so areas are multiplied by 5 and orientation is preserved.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "The inverse swaps the diagonal, negates the off-diagonal and divides by the determinant. It exists only when the determinant is non-zero.",
      notation: "A⁻¹ = (1/(ad − bc)) [[d, −b], [−c, a]]",
      caption:
        "For A = [[2, 3], [1, 4]], A⁻¹ = (1/5)[[4, −3], [−1, 2]]. Multiplying A by this gives the identity.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Multiply A = [[1, 2], [3, 4]] by B = [[2, 0], [1, 1]].",
      steps: [
        {
          move: "Compute the top-left entry: 1×2 + 2×1 = 4.",
          why:
            "The first row of A dots the first column of B. Both products use the same inner index, which is why the dimensions must match.",
        },
        {
          move: "Compute the top-right: 1×0 + 2×1 = 2. The bottom-left is 3×2 + 4×1 = 10.",
          why:
            "Each output entry pairs a row of A with a column of B. The positions come from the row and column indices, not from the order of the numbers.",
        },
        {
          move: "Compute the bottom-right: 3×0 + 4×1 = 4. The product is [[4, 2], [10, 4]].",
          why:
            "All four entries follow the same rule. Reversing the order would generally produce a different matrix.",
        },
      ],
      answer: "AB = [[4, 2], [10, 4]].",
    },
    {
      id: "w2",
      prompt:
        "Find the determinant of A = [[2, 3], [1, 4]] and explain what it says about the transformation.",
      steps: [
        {
          move: "Compute ad − bc = 2×4 − 3×1 = 8 − 3 = 5.",
          why:
            "The determinant is the difference of the diagonal products. The subtraction is what makes a zero determinant possible when the rows are dependent.",
        },
        {
          move: "The absolute value 5 means areas are scaled by 5.",
          why:
            "A unit square maps to a parallelogram whose area is the determinant. A factor larger than one enlarges areas.",
        },
        {
          move: "The determinant is 5; the positive sign means orientation is preserved, and the non-zero value means an inverse exists.",
          why:
            "A negative determinant would reverse orientation; zero would collapse area and make the matrix non-invertible.",
        },
      ],
      answer: "det A = 5; areas scale by 5, orientation is preserved, and A is invertible.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Matrix multiplication is commutative because multiplication of numbers is commutative.",
      whyItFails:
        "Matrix multiplication composes transformations, and transformations do not generally commute. Rotating then reflecting is not the same as reflecting then rotating. Even when both AB and BA are defined, the entries usually differ, so the order is part of the operation.",
      correction:
        "Read AB as “apply B, then A” under the column-vector convention. Check the order in the problem and do not swap matrices to make the arithmetic easier.",
      contrast: {
        wrong: "AB = BA for any matrices of the same size.",
        right: "AB and BA can differ; matrix multiplication is not commutative.",
      },
    },
    {
      id: "m2",
      belief: "Every 2×2 matrix has an inverse.",
      whyItFails:
        "The inverse formula divides by the determinant. If the determinant is zero, the division is undefined and the transformation collapses the plane, so information is lost. Distinct vectors can map to the same output, and no inverse can recover which input was used.",
      correction:
        "Compute the determinant first. A non-zero determinant means an inverse exists; zero means the matrix is singular and the transformation is not reversible.",
      contrast: {
        wrong: "Use the inverse formula for any matrix.",
        right: "Check det A ≠ 0 before using A⁻¹.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Compute the determinant of [[3, 1], [2, 5]].",
      hint: "Use ad − bc with the diagonals.",
      answer: "3×5 − 1×2 = 15 − 2 = 13.",
      feedback: {
        correct: "You subtracted the off-diagonal product from the main diagonal product.",
        incorrect:
          "The determinant is 3×5 − 1×2 = 13, not the sum of the diagonal products.",
      },
    },
    {
      id: "p2",
      prompt: "What does a determinant of zero mean geometrically?",
      hint: "Think about the area of the image of a unit square.",
      answer:
        "The transformation collapses the plane to a line or a point, so area becomes zero and no inverse exists.",
      feedback: {
        correct: "You connected zero area scaling to the loss of invertibility.",
        incorrect:
          "A zero determinant makes the image degenerate: a 2D region loses area, distinct points can collide, and the matrix has no inverse.",
      },
    },
    {
      id: "p3",
      prompt: "If A has determinant 4, what is the determinant of A⁻¹?",
      hint: "The inverse undoes the area scaling.",
      answer: "1/4, because the inverse scales areas by the reciprocal.",
      feedback: {
        correct: "You treated the determinant as an area factor and reversed it.",
        incorrect:
          "The inverse must undo the scaling, so its determinant is the reciprocal of 4, namely 1/4.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the determinant of [[2, 3], [1, 4]]?",
      modelAnswer: "5",
      marking: [
        "Computes 2×4 − 3×1.",
        "Subtracts the off-diagonal product rather than adding it.",
      ],
      check: { accepted: ["5", "five"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "For A = [[1, 2], [3, 4]] and B = [[2, 0], [1, 1]], what is the top-left entry of AB?",
      modelAnswer: "4",
      marking: [
        "Dots the first row of A with the first column of B.",
        "Computes 1×2 + 2×1 = 4.",
      ],
      check: { accepted: ["4", "four"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why a 2×2 matrix with determinant zero has no inverse, using the idea of area and distinct inputs.",
      modelAnswer:
        "The determinant is the factor by which the transformation scales area. If it is zero, a 2D region collapses to a line or a point, so its area becomes zero. Distinct input vectors can then map to the same output, which means the transformation loses information. An inverse would have to recover the original input, but that information is no longer present, so no inverse exists.",
      marking: [
        "Identifies the determinant as an area-scaling factor.",
        "Explains that zero area means a collapse to a line or point.",
        "Connects the lost information to the impossibility of an inverse.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A graphics pipeline applies a rotation matrix R and a reflection matrix F to every point. Explain why RF and FR can produce different images, and what the determinant of each product says about area and orientation.",
      whyItTransfers:
        "The lesson multiplies numerical matrices. The graphics pipeline asks the learner to interpret non-commutativity geometrically and to use determinant multiplicativity without recomputing every entry.",
      answer:
        "RF means reflect first and then rotate, while FR means rotate first and then reflect; the operations do not generally commute, so the final positions differ. The determinant of a product is the product of the determinants. A rotation has determinant 1 and preserves orientation; a reflection has determinant −1 and reverses it. Both products have determinant −1, so both preserve area but reverse orientation, even though the images differ.",
      marking: [
        "Explains the order convention and why the transformations do not commute.",
        "Uses det(AB) = det(A)det(B) to find the determinant of each product.",
        "Distinguishes area scaling from orientation reversal.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "How is the determinant of a 2×2 matrix calculated?",
      answer: "ad − bc for the matrix with rows (a, b) and (c, d).",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does the identity matrix do to a vector?",
      answer: "It leaves the vector unchanged.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why is matrix multiplication not commutative?",
      answer:
        "It composes transformations, and applying two transformations in the opposite order generally gives a different result.",
      when: "month-later",
    },
  ],
  summary: [
    "Matrix multiplication is row-by-column and composes transformations; order matters.",
    "The determinant ad − bc scales area, and its sign records orientation.",
    "A zero determinant collapses area and means no inverse exists.",
    "The inverse undoes a transformation and exists only when the determinant is non-zero.",
  ],
});
