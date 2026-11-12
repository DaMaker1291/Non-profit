import type { AuthoredLesson } from "../../lesson-contract";

// FILLING AND WRAPPING ARE TWO DIFFERENT MEASUREMENTS.
//
// The reported error in this topic is almost never arithmetic: a learner
// multiplies three lengths and calls the answer "area", or wraps a box and
// reports square centimetres as if they were millilitres. The lesson therefore
// opens with a tank that asks both questions about the same dimensions, keeps
// cubic and square units visible in every line, and treats the scale factor as
// a statement about DIMENSIONS — lengths once, area twice, volume three times.
// Capacity is included because a volume in cm³ and a bottle in litres are the
// same quantity in two languages, and the conversion is where mixed units hide.
export const MATHS_VOLUME: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "volume",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: volume and surface area of cuboids, prisms and cylinders, and capacity in cubic units",
    level: "Key Stage 3 to GCSE Foundation and Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the fish-tank transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain volume as the number of unit cubes a solid contains, and give a volume in cubic units rather than square units.",
      evidence:
        "The learner explains why a 3 cm by 4 cm by 5 cm cuboid holds 60 centimetre cubes and writes the result as 60 cm³, not 60 cm².",
    },
    {
      statement:
        "Calculate the volume of a cuboid, a prism and a cylinder using the area of the cross-section times the length or height.",
      evidence:
        "The learner finds a cuboid volume from lwh, a prism volume from cross-section area times length, and a cylinder volume from πr²h, choosing the radius rather than the diameter.",
    },
    {
      statement:
        "Calculate surface area from a net, keeping square units distinct from the volume's cubic units.",
      evidence:
        "The learner finds the surface area of a 3 cm by 4 cm by 5 cm cuboid as 94 cm² by adding all six faces, and does not report it in cm³.",
    },
    {
      statement:
        "Use the scaling laws: multiplying every length by k multiplies area by k² and volume by k³.",
      evidence:
        "The learner explains why doubling a cube's side multiplies its volume by 8 and its surface area by 4, and applies the same rule to a cylinder.",
    },
    {
      statement:
        "Convert between cubic centimetres, millilitres, litres and cubic metres in a practical capacity problem.",
      evidence:
        "The learner converts 72,000 cm³ to 72 L and 2.5 L to 2,500 cm³, and does not use 100 cm³ for 1 m³.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["area-perimeter"],
    check: [
      {
        id: "d1",
        question: "Find the area of a rectangle 7 cm by 4 cm.",
        answer:
          "A = 7 × 4 = 28 cm². Area is measured in square units because it counts unit squares.",
        targets: ["area-perimeter"],
      },
      {
        id: "d2",
        question: "Find the area of a triangle with base 10 cm and perpendicular height 6 cm.",
        answer:
          "A = ½ × 10 × 6 = 30 cm². The height must be perpendicular to the base.",
        targets: ["area-perimeter"],
      },
      {
        id: "d3",
        question: "Find the area of a circle with radius 3 cm, leaving π in the answer.",
        answer:
          "A = πr² = π × 3² = 9π cm², approximately 28.3 cm². The radius is squared, not doubled.",
        targets: ["area-perimeter"],
      },
      {
        id: "d4",
        question: "How many square centimetres are in 1 m²?",
        answer:
          "1 m = 100 cm, so 1 m² = 100 × 100 = 10,000 cm². A length factor of 100 becomes 100² for area.",
        targets: ["area-perimeter"],
      },
    ],
  },

  introduction: {
    hook:
      "A fish tank is 60 cm long, 30 cm wide and 40 cm high. How much water will fill it? How much glass is needed to make it? The same three measurements answer both questions, but the answers are not the same kind of quantity: the water is 72,000 cm³ (72 litres), while the glass is 9,000 cm². One is a count of cubic centimetres inside the tank; the other is a count of square centimetres on its surface. Confusing them is the central error in this topic, and the units are the clue that tells them apart.",
    why:
      "Volume and surface area describe the two things a container does: it holds something, and it is made of something. Builders order concrete by the cubic metre and paint by the square metre; cooks convert millilitres to cubic centimetres; biologists use the surface-area-to-volume ratio to explain why cells stay small and large animals cannot simply be scaled-up mice. The formulas are short, but the reasoning — choose the right cross-section, keep the units, and scale by the right power — is what transfers to every unfamiliar solid.",
  },

  explanation: [
    {
      heading: "Volume counts unit cubes",
      paragraphs: [
        "A cubic centimetre is a cube with every edge 1 cm. A cuboid 3 cm by 4 cm by 5 cm can be packed with a layer of 3 × 4 = 12 cubes, and there are 5 such layers, so it holds 12 × 5 = 60 cubes. Its volume is 60 cm³. The multiplication l × w × h is not a formula to memorise separately from the picture: it is the count of cubes in one layer times the number of layers.",
        "Every length is measured in the same unit before multiplying. If a box is 1 m by 40 cm by 30 cm, converting to centimetres gives 100 × 40 × 30 = 120,000 cm³. Multiplying 1 × 40 × 30 gives 1,200, but the unit of that calculation is not a centimetre cubed or a metre cubed — it is a mixture, and a mixed-unit answer is not a volume. Convert first, then calculate.",
        "The answer is always in cubic units: cm³, m³, mm³. A volume cannot be 60 cm². The index is the number of dimensions multiplied, and it is the quickest check that the right quantity was calculated.",
      ],
    },
    {
      heading: "A prism is a constant cross-section pushed through a length",
      paragraphs: [
        "A prism has the same cross-section all the way along. A toblerone box, a triangular tent and a circular pipe are prisms in this sense. The volume is the area of the cross-section multiplied by the length or height through which it is pushed: V = A × l. The cross-section can be a triangle, a trapezium, a circle or any other flat shape; the rule is the same.",
        "A cylinder is the circular case. Its cross-section is a circle of area πr², so V = πr²h. A cylinder with radius 2 cm and height 10 cm has V = π × 2² × 10 = 40π cm³, approximately 125.7 cm³. The radius is 2 cm, not the diameter 4 cm. Using the diameter by mistake gives π × 4² × 10 = 160π cm³, four times too large, because the diameter is twice the radius and the radius is squared.",
        "The height must be perpendicular to the cross-section. A slanted cylinder has a longer slant edge, but the volume uses the perpendicular height between the two circular faces, not the slant length. The same distinction appears with a slanted prism: the cross-section area times the perpendicular length is the volume.",
      ],
    },
    {
      heading: "Surface area wraps every face",
      paragraphs: [
        "Surface area is the total area of the outside. Imagine cutting a box along its edges and unfolding it into a net. A cuboid's net has six rectangles: top and bottom, front and back, and two ends. For length l, width w and height h, the area is 2lw + 2lh + 2wh, usually written 2(lw + lh + wh). The factor 2 is there because each pair of opposite faces is congruent.",
        "For the 3 cm by 4 cm by 5 cm cuboid, the three different face areas are 3 × 4 = 12, 3 × 5 = 15 and 4 × 5 = 20 cm². Each appears twice, so the surface area is 2(12 + 15 + 20) = 2 × 47 = 94 cm². The volume of the same cuboid is 3 × 4 × 5 = 60 cm³. There is no reason for 94 and 60 to match, and they do not: one counts the wrapping, the other counts the filling.",
        "A cylinder's surface area has two circular ends and one curved rectangle. The rectangle's width is the circumference 2πr and its height is h, so its area is 2πrh. The total is 2πr² + 2πrh. For radius 2 cm and height 10 cm: 2π(4) + 2π(2)(10) = 8π + 40π = 48π cm², approximately 150.8 cm². If the cylinder is open at one end, subtract one circle; if it is a pipe open at both ends, subtract both. Read what the object actually is before choosing the number of faces.",
      ],
    },
    {
      heading: "Scaling: lengths once, area twice, volume three times",
      paragraphs: [
        "If every length of a solid is multiplied by the same factor k, the area is multiplied by k² and the volume by k³. A cube of side 3 cm has volume 27 cm³ and surface area 6 × 9 = 54 cm². A cube of side 6 cm has volume 216 cm³ and surface area 6 × 36 = 216 cm². The side doubled, so the volume became 8 times larger (2³) and the surface area became 4 times larger (2²).",
        "The rule follows from the formulas. Volume multiplies three lengths, so each factor k contributes once: k × k × k = k³. Surface area multiplies two lengths, so it gets k². A single length, such as a perimeter or an edge, gets k. This is why the rule is about dimensions rather than about cubes: it applies to any solid, not only to a cube.",
        "The same rule explains the surface-area-to-volume ratio. A small object has a large surface compared with its volume; a large object of the same shape has a smaller ratio, because volume grows as k³ while surface area grows only as k². This is why a large animal cannot lose heat as easily as a small one, and why a single cell cannot grow indefinitely: its surface cannot supply its increasing volume.",
      ],
    },
    {
      heading: "Capacity is volume in everyday units",
      paragraphs: [
        "A cubic centimetre holds one millilitre: 1 cm³ = 1 mL. A litre is 1,000 millilitres, so 1 L = 1,000 cm³. A cubic metre is 100 cm by 100 cm by 100 cm, so 1 m³ = 100 × 100 × 100 = 1,000,000 cm³ = 1,000 L. That last conversion is the one to remember: a cubic metre is a thousand litres, not a hundred.",
        "The fish tank's volume is 60 × 30 × 40 = 72,000 cm³. Dividing by 1,000 gives 72 L. A 2.5 L bottle holds 2,500 cm³. The arithmetic is the same volume calculation as before; the conversion only changes the unit to one a person can picture. Keep the unit with the number at every step, so the final sentence can say what the answer means.",
        "Capacity is conventionally used for the space inside a container, and volume for the space a solid occupies, but the underlying quantity is the same. A tank that holds 72 L has an internal volume of 72,000 cm³. The distinction matters when the walls have thickness: the outside dimensions give the external volume, while the capacity uses the inside dimensions. The difference is the volume of the material itself.",
      ],
    },
    {
      heading: "Check the quantity, the units and the size",
      paragraphs: [
        "Before calculating, name what is wanted: filling (volume), wrapping (surface area), or a length (edge, height, radius). The formula follows from that choice. If the question asks how much water, how much concrete or how much air, it is volume. If it asks how much paint, how much glass or how much wrapping paper, it is surface area. If it asks how long, it is neither.",
        "After calculating, check the unit and the size. A volume must be in cubic units; a surface area must be in square units. A box 3 cm by 4 cm by 5 cm has a volume of 60 cm³, so a claim of 94 cm³ or 60 cm² is wrong even if the multiplication is right. A cylinder's volume should be roughly three times the volume of a cuboid with the same base square and height, because π is a little more than 3.",
        "Keep exact values until the end. Writing 40π cm³ and then rounding to 125.7 cm³ is better than rounding π at the start and carrying the error through several steps. If the final answer is rounded, say so, and keep the same number of significant figures as the measurements justify. A check is part of the solution: it catches a diameter used as a radius, a missing factor of 2, or a volume reported as an area.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "A cuboid's volume is the number of unit cubes it contains: one layer of length times width, repeated height times.",
      notation:
        "V = lwh   ·   3 cm × 4 cm × 5 cm → V = 60 cm³",
      caption:
        "The three lengths are multiplied, so the unit is cubed. A layer holds 12 cubes and there are 5 layers.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A prism's volume is its constant cross-section area times the length through which it is pushed. A cylinder is the circular case.",
      notation:
        "V = A × h   ·   cylinder: V = πr²h   ·   r = 2 cm, h = 10 cm → V = 40π ≈ 125.7 cm³",
      caption:
        "The radius is 2 cm; the diameter is 4 cm. Squaring the diameter instead would make the volume four times too large.",
    },
    {
      id: "r3",
      kind: "maths.expression",
      body:
        "Surface area is the area of the net. A cuboid has three pairs of congruent faces; a closed cylinder has two circles and one curved rectangle.",
      notation:
        "cuboid: S = 2(lw + lh + wh)   ·   2(12 + 15 + 20) = 94 cm²   ·   cylinder: S = 2πr² + 2πrh",
      caption:
        "Surface area is in square units. The same 3 × 4 × 5 cuboid has volume 60 cm³ and surface area 94 cm²; the numbers answer different questions.",
    },
    {
      id: "r4",
      kind: "maths.expression",
      body:
        "Under a scale factor k, every length is multiplied by k, every area by k² and every volume by k³.",
      notation:
        "k = 2: length × 2   ·   area × 4   ·   volume × 8   ·   cube 3 cm → 6 cm: 27 cm³ → 216 cm³",
      caption:
        "The volume factor is 2 × 2 × 2, not 2. The surface area factor is 2 × 2, not 2.",
    },
    {
      id: "r5",
      kind: "maths.expression",
      body:
        "Capacity converts a volume into litres or millilitres using the size of the unit, not a different volume formula.",
      notation:
        "1 cm³ = 1 mL   ·   1 L = 1,000 cm³   ·   1 m³ = 1,000,000 cm³ = 1,000 L   ·   72,000 cm³ = 72 L",
      caption:
        "A cubic metre is 100 cm on every edge, so the factor is 100³ = 1,000,000, not 100.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A cuboid is 3 cm long, 4 cm wide and 5 cm high. Find its volume and its surface area.",
      steps: [
        {
          move:
            "Name the two quantities: volume is the filling, surface area is the wrapping. They need separate calculations even though the dimensions are shared.",
          why:
            "Choosing the quantity first prevents a volume formula being used for a surface-area question, or a square unit being reported for a volume.",
        },
        {
          move:
            "Volume: multiply the three lengths, 3 × 4 × 5 = 60. The unit is cm³ because three lengths are multiplied.",
          why:
            "The multiplication counts a 3-by-4 layer of cubes, repeated 5 times. The cubic unit records the three dimensions.",
        },
        {
          move:
            "Surface area: list the three different faces, 3 × 4 = 12, 3 × 5 = 15 and 4 × 5 = 20 cm². Each appears twice on opposite sides.",
          why:
            "A cuboid has six faces in three congruent pairs. Missing the factor of 2 is the most common surface-area error.",
        },
        {
          move:
            "Add one of each pair and double: 2 × (12 + 15 + 20) = 2 × 47 = 94 cm².",
          why:
            "The bracket is the area of three different faces; doubling accounts for the opposite face of each pair. The unit is square because area multiplies two lengths.",
        },
        {
          move:
            "The volume is 60 cm³ and the surface area is 94 cm². Check: the volume counts 60 unit cubes, while the surface area counts 94 unit squares, so the two numbers need not match.",
          why:
            "The final sentence names both quantities with their own units. Reporting 94 cm³ would confuse the wrapping with the filling.",
        },
      ],
      answer: "Volume 60 cm³; surface area 94 cm²",
    },
    {
      id: "w2",
      prompt:
        "A closed cylinder has radius 2 cm and height 10 cm. Find its volume and total surface area, leaving π in the answer and then giving a decimal approximation.",
      steps: [
        {
          move:
            "Identify the radius and height: r = 2 cm and h = 10 cm. The diameter is 4 cm, but the formulas use the radius.",
          why:
            "The radius is the distance from the centre to the edge. Substituting the diameter would make every circular area four times too large.",
        },
        {
          move:
            "Volume: V = πr²h = π × 2² × 10 = π × 4 × 10 = 40π cm³.",
          why:
            "The circular cross-section has area πr² = 4π cm², and the cylinder is that cross-section pushed through 10 cm.",
        },
        {
          move:
            "Surface area: two circular ends give 2πr² = 2π × 4 = 8π cm². The curved rectangle has width equal to the circumference 2πr = 4π cm and height 10 cm, so its area is 40π cm².",
          why:
            "Unrolling the curved surface produces a rectangle. Its width is the distance around the circle, not the diameter.",
        },
        {
          move:
            "Add the parts: 8π + 40π = 48π cm². The exact volume is 40π cm³ and the exact surface area is 48π cm².",
          why:
            "The two answers have different units. The volume is cubic because it fills space; the surface area is square because it covers the outside.",
        },
        {
          move:
            "Approximate with π ≈ 3.14159: the volume is about 125.7 cm³ and the surface area is about 150.8 cm². Check that the volume is a little more than 3 × 4 × 10 = 120 cm³, as π is a little more than 3.",
          why:
            "The rough cuboid comparison catches a missing factor of π or a diameter used as a radius. The decimal answers keep the units.",
        },
      ],
      answer: "Volume 40π ≈ 125.7 cm³; surface area 48π ≈ 150.8 cm²",
    },
    {
      id: "w3",
      prompt:
        "A cube has side 3 cm. Its side is then doubled to 6 cm. By what factors do its volume and surface area change?",
      steps: [
        {
          move:
            "Start with the smaller cube: volume = 3³ = 27 cm³ and surface area = 6 × 3² = 6 × 9 = 54 cm².",
          why:
            "A cube is a cuboid with all three lengths equal. Its six faces are congruent squares.",
        },
        {
          move:
            "Calculate the larger cube: volume = 6³ = 216 cm³ and surface area = 6 × 6² = 6 × 36 = 216 cm².",
          why:
            "The side has doubled, so each length in the formulas is replaced by 2 × 3. The arithmetic gives the new totals directly.",
        },
        {
          move:
            "Compare the volumes: 216 ÷ 27 = 8. The volume has been multiplied by 8.",
          why:
            "Three lengths each double, so the volume factor is 2 × 2 × 2 = 2³ = 8. It is not 2.",
        },
        {
          move:
            "Compare the surface areas: 216 ÷ 54 = 4. The surface area has been multiplied by 4.",
          why:
            "Area multiplies two lengths, so its factor is 2 × 2 = 2² = 4. The surface area grows, but not as fast as the volume.",
        },
        {
          move:
            "The volume changes by a factor of 8 and the surface area by a factor of 4: 27 → 216 cm³ and 54 → 216 cm², because k = 2 gives k³ = 8 and k² = 4.",
          why:
            "The final line states the general rule as well as this example. The larger cube has eight times the filling but only four times the wrapping.",
        },
      ],
      answer: "Volume ×8 (27 cm³ → 216 cm³); surface area ×4 (54 cm² → 216 cm²)",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Volume and surface area are the same calculation, so either number will do.",
      whyItFails:
        "Volume counts unit cubes inside a solid; surface area counts unit squares on its outside. For a 3 cm by 4 cm by 5 cm cuboid the volume is 60 cm³ and the surface area is 94 cm². They are different quantities with different units, and one cannot substitute for the other.",
      correction:
        "Decide first whether the question is about filling or wrapping. Use lwh or cross-section × length for volume, and add every face for surface area. Keep cm³ for volume and cm² for area.",
      contrast: {
        wrong: "The box holds 94 cm³ because 2(12 + 15 + 20) = 94",
        right: "The box holds 60 cm³ (3 × 4 × 5); its surface area is 94 cm²",
      },
    },
    {
      id: "m2",
      belief: "If every length doubles, the volume doubles too.",
      whyItFails:
        "Volume multiplies three lengths, so doubling each one multiplies the volume by 2 × 2 × 2 = 8. A 3 cm cube has volume 27 cm³; a 6 cm cube has 216 cm³, which is eight times larger. Surface area multiplies only two lengths, so it grows by 4.",
      correction:
        "Use the dimension count: length × k, area × k², volume × k³. For k = 2, volume ×8 and surface area ×4. Check with a simple cube before applying the rule to a complicated solid.",
      contrast: {
        wrong: "Double the sides, so double the volume",
        right: "Double the sides, so volume ×2³ = ×8 and surface area ×2² = ×4",
      },
    },
    {
      id: "m3",
      belief: "1 m³ is 100 cm³, because 1 m is 100 cm.",
      whyItFails:
        "A cubic metre is 100 cm long, 100 cm wide and 100 cm high, so it contains 100 × 100 × 100 = 1,000,000 cm³. The length factor is 100, but volume uses the cube of that factor. Similarly, 1 m² is 10,000 cm², not 100 cm².",
      correction:
        "Convert every length to the same unit before multiplying, or raise the length conversion factor to the power of the dimension: 100² for area, 100³ for volume. Then 1 m³ = 1,000,000 cm³ = 1,000 L.",
      contrast: {
        wrong: "1 m³ = 100 cm³ = 0.1 L",
        right: "1 m³ = 1,000,000 cm³ = 1,000 L",
      },
    },
    {
      id: "m4",
      belief: "A cylinder's volume is πrh, or πd²h using the diameter.",
      whyItFails:
        "The circular cross-section has area πr², not πr. Using πrh omits one factor of r and gives an answer in the wrong dimension. Using the diameter in place of the radius makes the area four times too large, because d = 2r and d² = 4r².",
      correction:
        "Write the cross-section area first: A = πr². Then multiply by the height: V = πr²h. Identify the radius before substituting; if the diameter is given, halve it first.",
      contrast: {
        wrong: "r = 2, h = 10, so V = π × 2 × 10 = 20π",
        right: "r = 2, h = 10, so V = π × 2² × 10 = 40π cm³",
      },
    },
    {
      id: "m5",
      belief: "The surface area of a cuboid is the sum of its three different faces.",
      whyItFails:
        "A cuboid has six faces, not three. Each of the three different rectangles has an opposite face with the same area. Adding only 12 + 15 + 20 = 47 cm² omits the other three faces and gives half the true surface area.",
      correction:
        "Use the net or the formula 2(lw + lh + wh). The factor 2 accounts for each pair of opposite faces. For an open box, subtract only the faces that are actually missing.",
      contrast: {
        wrong: "Surface area = 12 + 15 + 20 = 47 cm²",
        right: "Surface area = 2(12 + 15 + 20) = 94 cm²",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "A cuboid is 2 cm by 7 cm by 10 cm. Find its volume.",
      hint: "Multiply the three lengths, then use cubic units.",
      answer: "140 cm³",
      feedback: {
        correct:
          "V = 2 × 7 × 10 = 140 cm³. Three lengths are multiplied, so the unit is cubed.",
        incorrect:
          "Multiply all three lengths: 2 × 7 = 14, then 14 × 10 = 140. The answer is 140 cm³, not 140 cm².",
      },
    },
    {
      id: "p2",
      prompt: "A cylinder has radius 3 cm and height 5 cm. Find its volume, leaving π in the answer.",
      hint: "The circular cross-section has area πr²; multiply that by the height.",
      answer: "45π cm³",
      feedback: {
        correct:
          "V = πr²h = π × 3² × 5 = 45π cm³, approximately 141.4 cm³. The radius is squared before multiplying by the height.",
        incorrect:
          "Square the radius first: 3² = 9. Then V = π × 9 × 5 = 45π cm³. Using 3 × 5 alone would give 15π, which is not a volume.",
      },
    },
    {
      id: "p3",
      prompt: "A cube has side 4 cm. Find its total surface area.",
      hint: "A cube has six congruent square faces.",
      answer: "96 cm²",
      feedback: {
        correct:
          "Each face is 4 × 4 = 16 cm². Six faces give 6 × 16 = 96 cm².",
        incorrect:
          "Find one face first: 4² = 16 cm². A cube has six faces, so the surface area is 6 × 16 = 96 cm², not 64 cm² (which would be the volume).",
      },
    },
    {
      id: "p4",
      prompt:
        "Every length of a solid is multiplied by 3. By what factors do its surface area and volume change?",
      hint: "Area uses two lengths; volume uses three.",
      answer: "Surface area ×9; volume ×27",
      feedback: {
        correct:
          "k = 3, so surface area ×k² = ×9 and volume ×k³ = ×27. The volume grows three times faster than the surface area in factor terms.",
        incorrect:
          "Use the powers of the scale factor: area ×3² = ×9 and volume ×3³ = ×27. Multiplying both by 3 would ignore the dimensions.",
      },
    },
    {
      id: "p5",
      prompt:
        "A tank is 50 cm long, 20 cm wide and 30 cm high. Find its capacity in litres.",
      hint: "Find the volume in cm³ first, then divide by 1,000.",
      answer: "30 L",
      feedback: {
        correct:
          "V = 50 × 20 × 30 = 30,000 cm³. Since 1 L = 1,000 cm³, the capacity is 30,000 ÷ 1,000 = 30 L.",
        incorrect:
          "The volume is 30,000 cm³. A litre is 1,000 cm³, so divide by 1,000 to get 30 L; do not divide by 100.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "A cuboid is 6 cm long, 4 cm wide and 2.5 cm high. Find its volume.",
      modelAnswer: "60 cm³",
      marking: [
        "Multiplies the three lengths: 6 × 4 × 2.5.",
        "Obtains 60 and gives the unit as cm³.",
      ],
      check: {
        accepted: ["60 cm³", "60 cm3", "60"],
      },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A closed cylinder has radius 5 cm and height 12 cm. Find its volume and total surface area, leaving π in the answers. Explain why the volume is in cm³ while the surface area is in cm².",
      modelAnswer:
        "Volume: V = πr²h = π × 5² × 12 = 300π cm³, approximately 942.5 cm³. Surface area: two ends give 2πr² = 2π × 25 = 50π cm²; the curved surface gives 2πrh = 2π × 5 × 12 = 120π cm²; total 170π cm², approximately 534.1 cm². The volume multiplies three lengths, so its unit is cubed; the surface area adds areas, each of which multiplies two lengths, so its unit is squared. They are different quantities and need not be numerically equal.",
      marking: [
        "Uses the radius 5, not the diameter 10, and squares it in the volume.",
        "Obtains 300π cm³ for the volume.",
        "Adds two circular ends and the curved surface to obtain 170π cm².",
        "Explains the cubic unit by three multiplied lengths and the square unit by area.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A container has a rectangular base 25 cm by 10 cm and holds 2.5 litres. Find the height of the water when the container is full.",
      modelAnswer: "10 cm",
      marking: [
        "Converts 2.5 L to 2,500 cm³.",
        "Divides by the base area 250 cm² to obtain 10 cm.",
      ],
      check: {
        accepted: ["10 cm", "10"],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "A cube has side 5 cm. Find its volume and its total surface area.",
      modelAnswer: "Volume 125 cm³; surface area 150 cm²",
      marking: [
        "Cubes the side for volume: 5³ = 125 cm³.",
        "Multiplies one face by six for surface area: 6 × 25 = 150 cm².",
      ],
      check: {
        accepted: [
          "Volume 125 cm³; surface area 150 cm²",
          "125 cm³ and 150 cm²",
          "125 cm3 and 150 cm2",
          "volume 125, surface area 150",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangular fish tank is 60 cm long, 30 cm wide and 40 cm high and has no lid. Find how many litres of water fill it, and the area of glass needed for its base and four sides. Then every length is doubled: explain, without recalculating every face, how the capacity and the glass area change.",
      whyItTransfers:
        "The learner must separate filling from wrapping in one object, handle an open top rather than a closed cuboid, convert cm³ to litres, and then reason with k² and k³ instead of repeating the arithmetic. The open top is the detail that stops a memorised six-face formula from being applied without reading the object.",
      answer:
        "Volume = 60 × 30 × 40 = 72,000 cm³ = 72 L. The base is 60 × 30 = 1,800 cm²; the two long sides are each 60 × 40 = 2,400 cm²; the two short sides are each 30 × 40 = 1,200 cm². Glass area = 1,800 + 2 × 2,400 + 2 × 1,200 = 1,800 + 4,800 + 2,400 = 9,000 cm². If every length doubles, k = 2, so the capacity is multiplied by k³ = 8 and becomes 576 L, while the glass area is multiplied by k² = 4 and becomes 36,000 cm². The tank holds eight times as much but needs only four times the glass, because volume uses three lengths and area uses two.",
      marking: [
        "Calculates 72,000 cm³ and converts it to 72 L.",
        "Uses the base and four sides, not six faces, for the open tank.",
        "Obtains 9,000 cm² for the glass.",
        "Applies k³ = 8 for capacity and k² = 4 for area, with an explanation in terms of dimensions.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "A cuboid is 4 cm by 5 cm by 6 cm. Find its volume.",
      answer:
        "V = 4 × 5 × 6 = 120 cm³. Three lengths are multiplied, so the unit is cubic.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "A cube has side 5 cm. Find its total surface area.",
      answer:
        "One face is 5² = 25 cm², and a cube has six faces, so the surface area is 6 × 25 = 150 cm². The volume would be 125 cm³.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A cylinder has radius 2 cm and height 9 cm. Find its volume in terms of π.",
      answer:
        "V = πr²h = π × 2² × 9 = 36π cm³, approximately 113.1 cm³. The radius is squared, not doubled.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "Both the radius and the height of a cylinder are doubled. By what factor does its volume change?",
      answer:
        "The volume is πr²h. Doubling r multiplies r² by 4, and doubling h multiplies the height by 2, so the volume is multiplied by 4 × 2 = 8. This is k³ with k = 2, because all three lengths in the volume are doubled.",
      when: "month-later",
    },
  ],

  summary: [
    "Volume counts unit cubes and is measured in cubic units; surface area counts unit squares and is measured in square units.",
    "A cuboid's volume is lwh; a prism's volume is cross-section area × length; a cylinder's volume is πr²h.",
    "Surface area is the area of the net: a cuboid has three pairs of faces, and a closed cylinder has two circles plus a curved rectangle.",
    "Use the radius, not the diameter, in πr²; the diameter is twice the radius and squaring it makes the area four times too large.",
    "Under a scale factor k, lengths ×k, areas ×k² and volumes ×k³. Doubling every length multiplies volume by 8 and surface area by 4.",
    "1 cm³ = 1 mL, 1 L = 1,000 cm³, and 1 m³ = 1,000,000 cm³ = 1,000 L.",
    "Convert every length to the same unit before multiplying; a mixed-unit product is not a volume.",
    "Decide whether the question is about filling or wrapping before choosing a formula, and check the unit at the end.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every formula is read aloud in words as well as symbols: “volume equals length times width times height”, “surface area equals two times the sum of length-times-width, length-times-height and width-times-height”. The shape is described by its faces, not only by a diagram.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation is on its own line, with the quantity named before the numbers. Volume and surface area are separated into their own worked examples so the two routines are not interleaved.",
    },
    {
      need: "cognitive",
      alternative:
        "The lesson uses one repeated routine: name the quantity, choose the formula, substitute one unit, calculate, check the unit and the size. The fish-tank transfer is broken into capacity, glass and scaling rather than one multi-part question.",
    },
    {
      need: "colour-vision",
      alternative:
        "Faces and dimensions are labelled with words and numbers, not distinguished by colour. The net is described as six rectangles in three congruent pairs, so the meaning survives without seeing the drawing.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed or selected; no measuring, dragging or physical model is required. A learner may sketch a net on paper, but the lesson supplies the face list in words.",
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
        "All teaching prose, examples, practice, assessment and the fish-tank transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for volume and surface area of cuboids, prisms and cylinders.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-11",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
