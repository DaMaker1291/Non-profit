import type { AuthoredLesson } from "../../lesson-contract";

// MOTION GRAPHS ARE A READING SKILL BEFORE THEY ARE A CALCULATION.
//
// The genome's `motion-graphs` concept is the first place a learner has to keep
// two pictures apart: a distance–time graph and a velocity–time graph look
// almost identical, but one's gradient is speed and the other's is
// acceleration. Most errors are not arithmetic. They are reading the height as
// the speed, or reading a flat velocity–time line as "stopped". This lesson
// therefore spends its teaching on what each axis means and what each feature
// of the line means, then uses the two formulas as ways of reading the graph.
export const PHYSICS_MOTION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "motion-graphs",
  version: "1.0.0",
  subject: "physics",
  curriculum: {
    reference:
      "GCSE Physics, forces and motion: distance–time and velocity–time graphs, gradient and area",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. All explanations, examples and questions are original; no specification text or examination question is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read the gradient of a distance–time graph as speed, and distinguish instantaneous speed from average speed over a whole journey.",
      evidence:
        "For a journey that covers 8 m in the first 4 s and then rests for 3 s, the learner reads 2 m/s from the first gradient and 0 m/s from the flat section, then calculates the average speed over the whole journey from total distance divided by total time.",
    },
    {
      statement:
        "Read the gradient of a velocity–time graph as acceleration and the area under it as displacement, including negative values.",
      evidence:
        "For a cyclist who reaches 8 m/s from rest in 4 s, the learner calculates an acceleration of 2 m/s² and a distance of 16 m from the triangular area, with the units stated.",
    },
    {
      statement:
        "Explain why a high flat line on a distance–time graph is not a fast object, and why a flat velocity–time line is not an object at rest.",
      evidence:
        "The learner says the height of a distance–time graph is how far away the object is, so a high flat line means it is far away and stationary; a flat velocity–time line means the velocity is constant, so the object is still moving and its displacement continues to grow.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["forces-basics", "straight-lines"],
    check: [
      {
        id: "d1",
        question:
          "A straight line passes through the points (0, 0) and (4, 8). What is its gradient, and how did you find it?",
        answer:
          "The gradient is 2, because the change in the vertical value is 8 and the change in the horizontal value is 4, and 8 divided by 4 is 2.",
        targets: ["straight-lines"],
      },
      {
        id: "d2",
        question:
          "A runner covers 100 m in 20 s. What is the average speed, and what does the answer mean?",
        answer:
          "The average speed is 5 m/s, which means that if the runner had moved at one steady speed for the whole 20 s, that speed would have covered the same 100 m.",
        targets: ["forces-basics"],
      },
    ],
  },

  introduction: {
    hook:
      "A bus leaves a stop, waits at a red light, then travels steadily along a straight road. Its distance–time graph climbs, goes flat, then climbs again. The same journey drawn as velocity against time looks completely different: the bus speeds up, travels at a steady velocity, then slows to a stop.",
    why:
      "A graph is a compact story about motion, but only if you know which question each axis answers. The gradient of a distance–time graph tells you how quickly position changes; the gradient of a velocity–time graph tells you how quickly velocity changes; the area under a velocity–time graph tells you how far the object has moved. Keeping those three readings separate is the whole of this topic, and it stops a learner from memorising formulas they cannot apply to an unfamiliar graph.",
  },

  explanation: [
    {
      heading: "The axes are the first sentence of the graph",
      paragraphs: [
        "Before reading any number, name the quantity on each axis and its unit. A distance–time graph plots position against time, so its vertical axis is in metres and its horizontal axis is in seconds. A velocity–time graph plots velocity against time, so its vertical axis is in metres per second. The same rising line therefore means different things on the two graphs: on the first it is a fast object, and on the second it is an object whose velocity is increasing.",
        "The shape of the line is read between two points, not at a single point. A straight line means the gradient is constant, so the quantity represented by that gradient stays the same. A curved line means the gradient changes, so speed or acceleration is changing. A flat line means the vertical quantity is not changing, which is not the same as the object being absent or the graph being empty.",
      ],
    },
    {
      heading: "Distance–time: the gradient is speed",
      paragraphs: [
        "On a distance–time graph, gradient is the change in distance divided by the change in time. Those are the units of speed, metres per second, so the gradient is the speed. A steep line means a large distance is covered in a short time, so the object is fast. A shallow line means the object is slow, and a flat line means its distance is not changing at all, so it is stationary.",
        "For a journey with several stages, calculate the gradient of each straight section separately rather than joining the ends. A graph that rises, flattens and rises again has three different speeds, and the gradient of the whole line from start to finish is only the average velocity, not what happened at any particular moment. The average speed is a separate calculation: total distance travelled divided by total time taken. A return journey is the case that makes the difference unavoidable, because the distance travelled keeps increasing while the displacement can return to zero.",
      ],
    },
    {
      heading: "Velocity–time: the gradient is acceleration, the area is displacement",
      paragraphs: [
        "On a velocity–time graph, gradient is the change in velocity divided by the change in time, which is acceleration. A positive gradient means velocity is increasing in the positive direction; a negative gradient means it is decreasing, or becoming more negative. A flat line means the velocity is constant, so the acceleration is zero and the object is not at rest unless the flat line sits on the horizontal axis.",
        "The area between the line and the time axis gives the displacement. Split the area into rectangles and triangles rather than looking for a single formula. A rectangle of height 8 m/s and width 6 s contributes 48 m; a triangle of height 8 m/s and base 4 s contributes 16 m. If the line crosses below the time axis, that area is negative displacement, so the object is moving back towards its starting point and the signed areas must be added rather than all counted as distance.",
      ],
    },
    {
      heading: "Signs, averages and the assumptions a graph makes",
      paragraphs: [
        "Speed is a scalar: it has size but no direction, so it is never negative. Velocity is a vector: its sign says which way the object moves. That is why a graph can show a negative velocity, and why average speed and average velocity can disagree. A runner who goes 100 m out and 100 m back in 50 s has an average speed of 4 m/s but an average velocity of zero, because the displacement is zero even though the distance travelled is 200 m.",
        "The straight-line model assumes constant acceleration between the marked points, and it treats the motion as one-dimensional. Those assumptions are idealisations: a real car changes acceleration continuously, and a real road bends. The graph is still useful because it captures the part of the motion we care about, but an answer should say when the model is being used outside the range where it is a good approximation.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "The gradient of a straight line is the change in the vertical quantity divided by the change in the horizontal quantity. On a motion graph, the axes decide which physical quantity that gradient represents.",
      notation: "gradient = change in vertical value / change in horizontal value",
      caption:
        "On a distance–time graph the gradient is speed in metres per second. On a velocity–time graph the gradient is acceleration in metres per second squared. The units are the clue: dividing metres by seconds gives metres per second.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The area under a velocity–time graph is the displacement. A rectangle contributes height times width, and a triangle contributes one half times base times height.",
      notation: "displacement = area under velocity–time graph",
      caption:
        "A velocity of 8 m/s held for 6 s gives an area of 48 m. A velocity rising steadily from zero to 8 m/s over 4 s gives a triangle of area 16 m. The area's unit is metres because metres per second multiplied by seconds is metres.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Every reading from a motion graph carries a unit, and the unit is how you check that you have read the right feature. A bare number cannot tell you whether it is a distance, a speed or an acceleration.",
      notation:
        "distance: m · time: s · speed: m/s · velocity: m/s · acceleration: m/s²",
      caption:
        "Metres divided by seconds gives metres per second. A change in metres per second divided by seconds gives metres per second squared. If the unit does not match the question, the gradient or area has been read from the wrong graph.",
    },
    {
      id: "r4",
      kind: "physics.model",
      body:
        "The two graphs answer different questions. A distance–time graph says where the object is; a velocity–time graph says how its velocity is changing and how far it has travelled.",
      notation:
        "distance–time: height = position, gradient = speed, flat = stationary\nvelocity–time: height = velocity, gradient = acceleration, flat = constant velocity, area = displacement",
      caption:
        "A flat distance–time line means the object has stopped. A flat velocity–time line means the object is moving at a steady velocity. The same shape has opposite meanings because the vertical axes are different quantities.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A walker moves 8 m away from a sensor in the first 4 s, rests for 3 s, then walks 6 m back towards the sensor in the next 3 s. Calculate the speed during each stage, the total distance, the displacement and the average speed for the whole 10 s.",
      steps: [
        {
          move:
            "For the first stage, gradient = change in distance / change in time = 8 m / 4 s = 2 m/s.",
          why:
            "The distance–time gradient is speed, and the first section is a straight line, so the walker's speed is constant at 2 m/s away from the sensor.",
        },
        {
          move:
            "The middle stage is flat, so its gradient is 0 m / 3 s = 0 m/s, which means the walker is stationary.",
          why:
            "A flat distance–time line means the distance from the sensor is not changing, so the walker is at rest for those 3 s.",
        },
        {
          move:
            "The final stage has gradient = 6 m / 3 s = 2 m/s back towards the sensor, so the velocity is negative if away is positive.",
          why:
            "The distance is falling, so the change is negative; the speed is 2 m/s but the direction is opposite to the first stage.",
        },
        {
          move:
            "Total distance = 8 m + 6 m = 14 m; displacement = 8 m − 6 m = 2 m away; average speed = 14 m / 10 s = 1.4 m/s.",
          why:
            "Distance counts both directions, while displacement counts the straight-line change from start to finish. Average speed uses the total distance, not the displacement.",
        },
      ],
      answer:
        "The speeds are 2 m/s, 0 m/s and 2 m/s; the total distance is 14 m, the displacement is 2 m away from the sensor, and the average speed is 1.4 m/s.",
    },
    {
      id: "w2",
      prompt:
        "A cyclist accelerates uniformly from rest to 8 m/s in 4 s, then travels at 8 m/s for 6 s. Calculate the acceleration during the first stage and the total displacement shown by the velocity–time graph.",
      steps: [
        {
          move:
            "For the first stage, acceleration = change in velocity / change in time = 8 m/s / 4 s = 2 m/s².",
          why:
            "The velocity–time gradient is acceleration. The velocity rises by 8 m/s in 4 s, so the acceleration is 2 metres per second squared.",
        },
        {
          move:
            "The first stage's area is a triangle: one half times base times height = one half times 4 s times 8 m/s = 16 m.",
          why:
            "The velocity rises steadily from zero, so the area under that section is a triangle rather than a rectangle.",
        },
        {
          move:
            "The second stage's area is a rectangle: 8 m/s times 6 s = 48 m. Total displacement = 16 m + 48 m = 64 m.",
          why:
            "A constant velocity for 6 s contributes height times width, and the two areas add because both stages move in the same direction.",
        },
      ],
      answer:
        "The acceleration is 2 m/s² and the total displacement is 64 m.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The height of a distance–time graph tells you how fast the object is moving.",
      whyItFails:
        "Height is the object's distance from the starting point, not its speed. A high flat line means the object is far away and stationary, while a line starting at zero and rising steeply means the object is close but moving quickly. The speed is the gradient, which is how steeply the line rises, not how high it has reached.",
      correction:
        "Read speed from the gradient of the distance–time line. Read position from its height. A flat line at any height means zero speed.",
      contrast: {
        wrong: "the line is high, so the object must be moving fast",
        right: "the line is high but flat, so the object is far away and stationary",
      },
    },
    {
      id: "m2",
      belief: "A flat velocity–time graph means the object has stopped.",
      whyItFails:
        "A flat velocity–time line means the velocity is not changing, so the object is moving at a constant velocity. It has stopped only if the line lies on the horizontal axis at zero. A flat line above the axis shows a steady speed, and the area beneath it continues to add displacement every second.",
      correction:
        "A flat velocity–time line means zero acceleration, not zero velocity. Check the height of the line to see whether the constant velocity is zero or non-zero.",
      contrast: {
        wrong: "the velocity–time line is flat, so the car is parked",
        right: "the line is flat at 8 m/s, so the car is moving steadily at 8 m/s",
      },
    },
    {
      id: "m3",
      belief: "Negative acceleration always means the object is slowing down.",
      whyItFails:
        "Acceleration is a vector. A negative acceleration means the acceleration points in the negative direction. An object already moving in the negative direction speeds up when its acceleration is negative, while an object moving in the positive direction slows down. The sign alone does not tell you whether the speed is rising or falling; you need the direction of motion as well.",
      correction:
        "Compare the signs of velocity and acceleration. If they point the same way, the object speeds up; if they point in opposite directions, it slows down. Negative acceleration is not a synonym for deceleration.",
      contrast: {
        wrong: "acceleration is negative, so the object must be slowing",
        right: "the object is moving left and accelerating left, so its speed is increasing",
      },
    },
  ],

  guidedPractice: [
    {
      id: "g1",
      prompt:
        "A distance–time graph shows a cyclist moving 6 m in the first 2 s, stopping for 3 s, then moving 9 m in the next 3 s. Calculate the speed in each stage and the average speed over the whole 8 s.",
      hint:
        "Find the gradient of each straight section separately. For the average, add the distances first and divide by the total time, including the stop.",
      answer:
        "The speeds are 3 m/s, 0 m/s and 3 m/s. The total distance is 15 m over 8 s, so the average speed is 1.875 m/s, or about 1.9 m/s.",
      feedback: {
        correct:
          "You read each gradient separately and used total distance over total time for the average. The stop still counts in the time, so it lowers the average.",
        incorrect:
          "If you averaged the two moving speeds and ignored the stop, you would overstate the average. The average uses the whole 8 s, including the 3 s at zero speed.",
      },
    },
    {
      id: "g2",
      prompt:
        "A car travelling at 20 m/s brakes uniformly to rest in 5 s. Calculate its acceleration and the distance it travels while braking.",
      hint:
        "The gradient of a velocity–time graph is acceleration. The distance is the area of the triangle under the line.",
      answer:
        "Acceleration = (0 − 20) m/s / 5 s = −4 m/s². Distance = one half × 5 s × 20 m/s = 50 m.",
      feedback: {
        correct:
          "The negative sign shows the acceleration opposes the motion, and the triangular area gives 50 m. The car slows down, so the acceleration and velocity have opposite signs.",
        incorrect:
          "A common slip is to use the area of a rectangle, 20 × 5 = 100 m. The velocity falls steadily to zero, so the area is a triangle and the distance is half of that.",
      },
    },
    {
      id: "g3",
      prompt:
        "A velocity–time graph rises from 0 to 6 m/s in 2 s, stays at 6 m/s for 3 s, then falls to 0 m/s in 3 s. Calculate the acceleration in each stage and the total displacement.",
      hint:
        "Use the gradient for each acceleration and split the area into a triangle, a rectangle and a triangle.",
      answer:
        "Accelerations: 3 m/s², 0 m/s² and −2 m/s². Displacements: 6 m + 18 m + 9 m = 33 m.",
      feedback: {
        correct:
          "You kept the three stages separate and added their signed areas. The flat stage has zero acceleration but still adds displacement because the velocity is not zero.",
        incorrect:
          "If you treated the flat stage as zero displacement, you would miss 18 m. A constant velocity still covers distance; it simply does not change speed.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A velocity–time graph shows a train moving at 12 m/s for 4 s, then decelerating uniformly to rest in 6 s. Describe what the gradient and the area represent in each stage, and calculate the total displacement. Explain why the deceleration does not make the displacement negative.",
      modelAnswer:
        "In the first stage the gradient is zero, so the acceleration is zero, and the area is a rectangle of 12 m/s × 4 s = 48 m. In the second stage the gradient is negative, so the train decelerates, and the area is a triangle of one half × 6 s × 12 m/s = 36 m. The total displacement is 84 m. The deceleration is negative because the velocity is falling, but the velocity itself stays positive, so the train keeps moving forward and both areas add rather than cancel.",
      marking: [
        "Reads the first stage as zero acceleration and a rectangular area of 48 m.",
        "Reads the second stage as negative acceleration and a triangular area of 36 m.",
        "Adds the areas to 84 m and explains that positive velocity keeps the displacement positive even while the train slows.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A train accelerates uniformly from rest to 12 m/s in 6.0 s. Calculate the distance it travels during this acceleration, stating the unit.",
      modelAnswer: "36 m",
      marking: [
        "Uses the triangular area under the velocity–time graph, or the equivalent uniform-acceleration relationship.",
        "Substitutes 12 m/s and 6.0 s and gives 36 m with the unit.",
      ],
      check: {
        accepted: ["36 m", "36m", "36"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A runner completes one lap of a 400 m track and returns to the starting point in 80 s. Explain why the average speed is 5 m/s but the average velocity is zero.",
      modelAnswer:
        "The distance travelled is 400 m, so the average speed is 400 m divided by 80 s, which is 5 m/s. The displacement is zero because the runner returns to the starting point, so the average velocity is zero divided by 80 s, which is zero.",
      marking: [
        "Distinguishes distance travelled from displacement.",
        "Calculates average speed as 5 m/s and explains that zero displacement makes average velocity zero.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A ball is thrown vertically upwards and caught at the same height. Its velocity–time graph is a straight line with a negative gradient throughout. Explain what the gradient represents, why the line crosses the time axis, and why the displacement over the whole flight is zero.",
      whyItTransfers:
        "The lesson used horizontal journeys and a braking cyclist. Here the same velocity–time reading is applied to vertical motion, where the sign of the velocity changes while the acceleration stays constant, so the learner must follow the direction as well as the size.",
      answer:
        "The gradient is the acceleration due to gravity, about −9.8 m/s² if upwards is positive, because gravity acts downwards throughout. The line crosses the time axis at the highest point, where the velocity is momentarily zero before the ball falls back. The area above the axis is positive displacement on the way up and the equal area below is negative displacement on the way down, so the signed areas cancel and the total displacement is zero. With air resistance, the upward and downward areas would not be exactly equal, and the ball would return with less speed than it was thrown.",
      marking: [
        "Names the gradient as the acceleration due to gravity and keeps its direction fixed.",
        "Explains the axis crossing as the turning point where velocity is zero, not where acceleration is zero.",
        "Uses signed areas to show that equal up and down displacements cancel to zero, and can say how air resistance changes the result.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State what the gradient of a distance–time graph represents, and what a flat section means.",
      answer:
        "The gradient is speed. A flat section means the distance is not changing, so the object is stationary.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A car accelerates uniformly from rest to 20 m/s in 10 s. Calculate its acceleration and the distance travelled.",
      answer:
        "Acceleration = 20 m/s divided by 10 s = 2 m/s². Distance = one half × 10 s × 20 m/s = 100 m.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain the difference between a flat line on a distance–time graph and a flat line on a velocity–time graph.",
      answer:
        "A flat distance–time line means the object is stationary because its position is not changing. A flat velocity–time line means the velocity is constant, so the object is moving steadily with zero acceleration and its displacement continues to increase.",
      when: "month-later",
    },
  ],

  summary: [
    "On a distance–time graph, gradient is speed and height is position; a flat line means the object is stationary.",
    "On a velocity–time graph, gradient is acceleration and the area under the line is displacement; a flat line means constant velocity, not rest.",
    "Average speed uses total distance over total time, while average velocity uses displacement over time; a return journey can have a non-zero average speed and zero average velocity.",
    "A signed velocity–time graph can have negative area, which subtracts from displacement rather than adding to the distance travelled.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every graph is described as an ordered list of stages with the axis quantities, the gradient and the area stated in words, so no meaning depends on seeing the line.",
    },
    {
      need: "colour-vision",
      alternative:
        "The two graph types are named in the text and labelled by their axis quantities; no distinction relies on telling two colours apart.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation follows the same pattern: name the quantity, write the relationship, substitute with units, then state the answer with its unit.",
    },
    {
      need: "motor",
      alternative:
        "All assessment answers are typed; no graph has to be dragged, drawn or resized to complete the lesson.",
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
        "Scope cited against the published GCSE physics subject content for forces and motion.",
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
