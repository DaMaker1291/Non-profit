import type { AuthoredLesson } from "../../lesson-contract";

// PERIMETER IS A LENGTH; AREA IS A COUNT OF SQUARES.
//
// The reported failure is older than this lesson: learners add the sides to find
// area, convert 1 m² to 100 cm², and treat a triangle as a rectangle. Every one
// of those is a category error, not a forgotten formula. This lesson therefore
// starts with what each quantity measures, derives the triangle, parallelogram
// and trapezium from the rectangle, and makes the unit conversion a square of
// the length factor. Compound shapes are taught as splitting or subtracting
// regions and as walking the boundary, so the two calculations are never
// allowed to collapse into one.
export const MATHS_AREA_PERIMETER: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "area-perimeter",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, geometry and measures: perimeter and area of rectangles, triangles, parallelograms and trapezia; compound shapes; units of area",
    level: "Key Stage 3 to GCSE Foundation",
    note:
      "Scope cited against the published GCSE mathematics subject content and the National Curriculum. No specification, textbook or commercial lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish perimeter from area, choose the correct unit for each, and calculate both for a rectangle.",
      evidence:
        "A learner finds the perimeter of a 7.5 m by 4 m rectangle as 23 m, its area as 30 m², and explains why 30 m is not an area and 23 m² is not a perimeter.",
    },
    {
      statement:
        "Derive and use the area formulas for triangles, parallelograms and trapezia, including choosing the perpendicular height.",
      evidence:
        "The learner calculates a triangle with base 12 cm and height 9 cm as 54 cm², a parallelogram with the same base and height as 108 cm², and a trapezium with parallel sides 6 cm and 10 cm and height 5 cm as 40 cm², explaining the half in the triangle formula.",
    },
    {
      statement:
        "Find the area and perimeter of a compound shape by splitting or subtracting rectangles and reconstructing missing sides, and convert between square units correctly.",
      evidence:
        "For a 10 m by 6 m rectangle with a 3 m by 2 m corner removed, the learner gives area 54 m² and perimeter 32 m; for a 2 m by 50 cm rectangle, the learner gives 1 m² and 10,000 cm² and explains the square of the length factor.",
    },
  ],

  priorKnowledge: {
    // The genome declares no prerequisites for `area-perimeter`. These two are
    // named because the lesson uses them directly, and both are probed: a
    // guessed course order is not evidence that the learner has the idea.
    conceptIds: ["multiplication", "decimals"],
    check: [
      {
        id: "d1",
        question: "Work out 6 × 7.",
        answer:
          "42. The rectangle formula multiplies two perpendicular lengths, so the area count is built from a multiplication rather than from adding the side lengths.",
        targets: ["multiplication"],
      },
      {
        id: "d2",
        question: "Work out 2.5 × 4.",
        answer:
          "10. The decimal is a length, not a decoration: 2.5 metres by 4 metres is 10 square metres, and the place value does not change the multiplication rule.",
        targets: ["decimals"],
      },
    ],
  },

  introduction: {
    hook:
      "A gardener has a 7.5 m by 4 m lawn. The edging goes around the outside and the turf covers the inside. The edging is 23 m long; the turf covers 30 m². Both numbers came from the same rectangle, but they answer different questions: one is the length of the boundary, the other is the number of square metres of surface. Confusing them is like buying 30 metres of edging and discovering it cannot cover a single square metre of ground.",
    why:
      "Perimeter and area are the two measurements of a flat shape, and they scale differently. Perimeter is a length, so it is measured in metres or centimetres. Area is a region, so it is measured in square metres or square centimetres. The rectangle formula A = lw counts the unit squares inside; the perimeter formula P = 2(l + w) walks the edge. Triangles, parallelograms and trapezia are not separate facts to memorise: each is a rectangle cut, doubled or averaged, which is why the same base-and-height idea keeps returning. This lesson derives those formulas, applies them to compound shapes, and treats unit conversion as a change of scale rather than a label change.",
  },

  explanation: [
    {
      heading: "Perimeter is a length; area is a count of square units",
      paragraphs: [
        "A perimeter is the distance all the way around a shape. A 6 cm by 4 cm rectangle has two sides of 6 cm and two of 4 cm, so its perimeter is 6 + 4 + 6 + 4 = 20 cm. The answer is a length, and it is written in centimetres. The area is the amount of surface inside the same rectangle. It can be covered by a grid of unit squares: six squares along the length and four rows of them, so 6 × 4 = 24 squares, each 1 cm². The area is 24 cm². The two numbers, 20 and 24, are not interchangeable, and neither is the unit.",
        "For a rectangle, the area is the product of two perpendicular side lengths and the perimeter is twice their sum. A square is the special case where both lengths are equal: a 5 cm square has perimeter 4 × 5 = 20 cm and area 5 × 5 = 25 cm². The area formula is not a definition to recite; it is counting rows of unit squares. That is also why the units are squared: a row of six centimetre squares has length 6 cm, but the surface it covers is measured in cm². If a question asks for the distance around a field, adding lengths is right. If it asks how much paint covers the field, adding lengths is the wrong quantity altogether.",
      ],
    },
    {
      heading: "Triangles, parallelograms and trapezia are made from rectangles",
      paragraphs: [
        "A triangle is half of a parallelogram with the same base and perpendicular height. Two identical triangles can be fitted together to make that parallelogram, so the triangle's area is half of base × height: A = ½bh. A parallelogram is a rectangle whose vertical height has been preserved while its top has been shifted: its area is base × perpendicular height, A = bh. The slant side is longer than the height, so using the slant side in the formula overcounts. A trapezium has two parallel sides of different lengths; its average width is (a + b) ÷ 2, and multiplying that average by the perpendicular height gives A = ½(a + b)h.",
        "The word 'height' means the perpendicular distance between the parallel sides, not the length of a sloping side. In a triangle with base 12 cm and height 9 cm, the area is ½ × 12 × 9 = 54 cm². A parallelogram with the same base and height has twice that area, 108 cm², because it is the two triangles fitted together. A trapezium with parallel sides 6 cm and 10 cm and height 5 cm has average width 8 cm and area 8 × 5 = 40 cm². The formulas are connected: the trapezium becomes a rectangle when the parallel sides are equal, and the triangle becomes half a rectangle when one parallel side shrinks to zero.",
      ],
    },
    {
      heading: "Compound shapes are split, completed or subtracted",
      paragraphs: [
        "A compound shape is made from simpler shapes. To find its area, split it into rectangles and triangles, calculate each part, and add the parts. To find its perimeter, walk around the outside: every outer edge is counted once, including the edges created by the cut. A 10 m by 6 m rectangle with a 3 m by 2 m rectangle removed from one corner has area 60 − 6 = 54 m². Its perimeter is still 32 m, not 32 + 2(3 + 2): removing a corner replaces a 3 m edge and a 2 m edge with the same two lengths turning inward, so the distance around the boundary is unchanged.",
        "The split-and-add method and the complete-and-subtract method must agree. For the same L-shape, split it into a 7 m by 6 m rectangle and a 3 m by 4 m rectangle: 42 + 12 = 54 m². Subtraction gives 60 − 6 = 54 m² as well. If the two methods disagree, a side has been mislabelled or a region counted twice. The bounding rectangle's area is not the L-shape's area, and the sum of the labelled sides is not always the perimeter: some sides are not labelled, and the learner has to reconstruct them from the others before adding.",
      ],
    },
    {
      heading: "A square unit is the length unit squared, and area scales by the square",
      paragraphs: [
        "One metre is 100 centimetres, so a square metre is a square 100 cm by 100 cm. Its area is 100 × 100 = 10,000 cm², not 100 cm². The same square factor applies to every conversion: 1 cm = 10 mm, so 1 cm² = 100 mm²; 1 km = 1,000 m, so 1 km² = 1,000,000 m². A rectangle 2 m by 50 cm must be converted to one unit before multiplying. In metres it is 2 × 0.5 = 1 m². In centimetres it is 200 × 50 = 10,000 cm². Both answers describe the same surface, and the conversion factor between them is 10,000, not 100.",
        "Area and perimeter do not scale in the same way. If every length is multiplied by k, the perimeter is multiplied by k, but the area is multiplied by k². Doubling a rectangle's sides doubles its perimeter and quadruples its area. That is why a scale drawing can look twice as wide and still represent four times the surface, and why a 1 m² tile cannot be replaced by a hundred 10 cm × 10 cm tiles without checking the arithmetic: 100 tiles of 100 cm² make 10,000 cm², which is 1 m². A final check should ask whether the answer is a length or a surface, whether the unit matches, and whether the size is plausible.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.area-model",
      body:
        "A 7.5 m by 4 m rectangle can be covered by rows of unit squares. The area counts the squares; the perimeter walks the four sides.",
      notation:
        "A = 7.5 × 4 = 30 m²   ·   P = 2(7.5 + 4) = 2 × 11.5 = 23 m",
      caption:
        "Thirty square metres of turf cover the inside; twenty-three metres of edging go around the outside. The numbers come from the same rectangle, but one is a surface and the other is a length.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "The triangle is half a parallelogram; the parallelogram is a rectangle with a shifted top; the trapezium uses the average of its two parallel sides.",
      notation:
        "triangle: ½ × 12 × 9 = 54 cm²   ·   parallelogram: 12 × 9 = 108 cm²   ·   trapezium: ½(6 + 10) × 5 = 40 cm²",
      caption:
        "The triangle's 54 cm² is half the parallelogram's 108 cm² because two identical triangles make the parallelogram. The trapezium's average width is 8 cm, so its area is 8 × 5 = 40 cm².",
    },
    {
      id: "r3",
      kind: "maths.area-model",
      body:
        "An L-shape is a 10 m by 6 m rectangle with a 3 m by 2 m corner removed. The area subtracts the corner; the perimeter follows the new outside edge.",
      notation:
        "A = 10 × 6 − 3 × 2 = 60 − 6 = 54 m²   ·   P = 2(10 + 6) = 32 m",
      caption:
        "The notch removes 6 m² from the surface, but it does not add to the distance around the outside: the two cut edges replace the two outer edges they came from, so the perimeter stays 32 m.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A lawn is 7.5 m long and 4 m wide. Find its area and its perimeter, with units.",
      steps: [
        {
          move: "Choose the formula for each quantity: area is length × width; perimeter is 2(length + width).",
          why:
            "The two questions ask for different measurements. Writing the formula first prevents the common slip of calculating one and labelling it as the other.",
        },
        {
          move: "Calculate the area: 7.5 × 4 = 30, so the area is 30 m².",
          why:
            "Multiplication counts the square metres inside the rectangle. The unit is squared because the answer is a surface, not a length.",
        },
        {
          move: "Calculate the perimeter: 7.5 + 4 = 11.5, and 2 × 11.5 = 23, so the perimeter is 23 m.",
          why:
            "The perimeter is the distance around the four sides, so the two different side lengths are added and then doubled. The unit stays in metres because it is a length.",
        },
      ],
      answer: "area = 30 m²; perimeter = 23 m",
    },
    {
      id: "w2",
      prompt:
        "A triangle has base 12 cm and perpendicular height 9 cm. A parallelogram has the same base and height. A trapezium has parallel sides 6 cm and 10 cm and height 5 cm. Find all three areas.",
      steps: [
        {
          move: "Triangle: A = ½ × base × height = ½ × 12 × 9 = 54 cm².",
          why:
            "Two identical triangles make a parallelogram with the same base and height, so the triangle is half of 12 × 9. Omitting the ½ doubles the area.",
        },
        {
          move: "Parallelogram: A = base × height = 12 × 9 = 108 cm².",
          why:
            "The parallelogram is the rectangle with the same base and perpendicular height; its area is exactly twice the triangle's. The slant side is not the height.",
        },
        {
          move: "Trapezium: average the parallel sides, then multiply by height: ½(6 + 10) × 5 = 8 × 5 = 40 cm².",
          why:
            "The average width is 8 cm, so the trapezium has the same area as a rectangle 8 cm wide and 5 cm high. This is why the formula uses the sum of the parallel sides, not either one alone.",
        },
      ],
      answer: "triangle = 54 cm²; parallelogram = 108 cm²; trapezium = 40 cm²",
    },
    {
      id: "w3",
      prompt:
        "A rectangular yard is 10 m by 6 m. A 3 m by 2 m rectangular store is built in one corner. Find the remaining area and the perimeter of the remaining yard.",
      steps: [
        {
          move: "Find the whole rectangle's area: 10 × 6 = 60 m².",
          why:
            "The completed rectangle is the starting region. Subtracting the store is easier than splitting the L-shape into two rectangles, provided the store really touches the corner.",
        },
        {
          move: "Subtract the store's area: 3 × 2 = 6 m², so the yard is 60 − 6 = 54 m².",
          why:
            "The store occupies part of the rectangle and is not yard, so its area must be removed. The subtraction is an area calculation, not a perimeter calculation.",
        },
        {
          move: "Find the perimeter from the outer dimensions: 2(10 + 6) = 32 m.",
          why:
            "Removing a corner replaces the two outer edges with two inward edges of the same lengths, so the distance around the boundary is unchanged. Adding the notch's edges on top would count them twice.",
        },
      ],
      answer: "remaining area = 54 m²; perimeter = 32 m",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "To find the area, add the side lengths. A 6 cm by 4 cm rectangle has area 20 cm.",
      whyItFails:
        "Adding the sides gives the perimeter, 20 cm, which is a distance around the edge. The area is the surface inside: six columns of four unit squares, or 24 cm². The wrong answer has the wrong quantity and the wrong unit, so it cannot be repaired by adding a squared symbol afterwards.",
      correction:
        "Ask what is being measured. For a boundary, add the sides and keep the length unit. For a surface, multiply two perpendicular lengths and write the square unit. Check with a small grid: a 6 by 4 rectangle contains 24 unit squares, not 20.",
      contrast: {
        wrong: "the area is 6 + 4 + 6 + 4 = 20 cm",
        right: "the area is 6 × 4 = 24 cm²; the perimeter is 20 cm",
      },
    },
    {
      id: "m2",
      belief:
        "Since 1 m = 100 cm, 1 m² = 100 cm²; converting a square unit means multiplying by the same factor once.",
      whyItFails:
        "A square metre is a square 100 cm by 100 cm, so its area is 100 × 100 = 10,000 cm². The length factor is applied in both directions, which is why the area factor is the square of the length factor. Multiplying by 100 once leaves a square only 1 cm wide and 100 cm long, not a square metre.",
      correction:
        "Convert the lengths first, then multiply, or square the length factor deliberately. One metre is 100 centimetres; one square metre is 100² = 10,000 square centimetres. For a 2 m by 50 cm rectangle, use 2 × 0.5 = 1 m² or 200 × 50 = 10,000 cm²; both agree.",
      contrast: {
        wrong: "1 m² = 100 cm²",
        right: "1 m² = 100 cm × 100 cm = 10,000 cm²",
      },
    },
    {
      id: "m3",
      belief:
        "A triangle's area is base × height, so a triangle with base 12 cm and height 9 cm has area 108 cm².",
      whyItFails:
        "Base × height gives the area of the parallelogram formed by two copies of the triangle. One triangle is half of that parallelogram, so 108 cm² counts the triangle twice. The missing ½ is not a decoration; it is the relationship between the triangle and the rectangle.",
      correction:
        "Draw the parallelogram made from two identical triangles, then halve it. Write A = ½bh, substitute ½ × 12 × 9, and keep the square unit: 54 cm². If the answer is exactly twice a plausible triangle area, check whether the ½ was omitted.",
      contrast: {
        wrong: "area = 12 × 9 = 108 cm²",
        right: "area = ½ × 12 × 9 = 54 cm²",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "A rectangle is 9 cm long and 4 cm wide. Find its area and perimeter.",
      hint:
        "Area multiplies the two perpendicular lengths; perimeter adds one length and one width, then doubles.",
      answer:
        "Area = 9 × 4 = 36 cm². Perimeter = 2(9 + 4) = 2 × 13 = 26 cm. Check: 9 + 4 + 9 + 4 = 26.",
      feedback: {
        correct:
          "You kept the surface and the boundary separate and gave each the correct unit.",
        incorrect:
          "Do not give 26 cm² or 36 cm. The area is 36 cm²; the perimeter is 26 cm. The unit tells you which quantity you calculated.",
      },
    },
    {
      id: "p2",
      prompt:
        "A triangle has base 14 m and perpendicular height 6 m. Find its area and explain the half.",
      hint:
        "Two identical triangles make a parallelogram with the same base and height. The triangle is half of that parallelogram.",
      answer:
        "Area = ½ × 14 × 6 = 42 m². The half is there because two copies of the triangle make a parallelogram of area 14 × 6 = 84 m², and one triangle is half of it.",
      feedback: {
        correct:
          "You used the perpendicular height and explained the ½ through the parallelogram, not just as a formula.",
        incorrect:
          "The area is 42 m², not 84 m². Base × height gives the parallelogram made from two triangles; one triangle is half of that.",
      },
    },
    {
      id: "p3",
      prompt:
        "An L-shape is made by removing a 2 m by 3 m rectangle from a corner of an 8 m by 5 m rectangle. Find its area and perimeter.",
      hint:
        "Subtract the removed area. For the perimeter, compare the cut edges with the outer edges they replace.",
      answer:
        "Area = 8 × 5 − 2 × 3 = 40 − 6 = 34 m². Perimeter = 2(8 + 5) = 26 m, because removing a corner replaces two outer edges with two inward edges of the same total length.",
      feedback: {
        correct:
          "You subtracted the corner for area but did not add its edges again for perimeter.",
        incorrect:
          "The area is 34 m², not 40 m². The perimeter is 26 m, not 26 + 10 m: the cut edges replace outer edges rather than adding a second boundary.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A rectangle is 2 m long and 50 cm wide. Explain why its area is 1 m², not 100 m², and why its perimeter is 5 m, not 500 m. Then explain how you would find the area and perimeter of an L-shape made by removing a corner from a rectangle.",
      modelAnswer:
        "Convert 50 cm to 0.5 m before multiplying: 2 × 0.5 = 1 m². In centimetres the rectangle is 200 cm by 50 cm, so the area is 10,000 cm²; 1 m² is 100 cm × 100 cm = 10,000 cm², so the two answers agree. The perimeter is 2(2 + 0.5) = 5 m, which is 500 cm, not 500 m. For an L-shape, subtract the removed rectangle's area from the bounding rectangle's area. For the perimeter, walk the outside boundary; removing a corner replaces two outer edges with two inward edges of the same total length, so the perimeter is unchanged, while the area is reduced.",
      marking: [
        "Converts 50 cm to 0.5 m, or converts both lengths to centimetres, before multiplying.",
        "Explains that 1 m² is 100 cm × 100 cm = 10,000 cm², not 100 cm².",
        "Distinguishes the perimeter 5 m (500 cm) from the area 1 m² and uses the correct units.",
        "Describes subtracting the corner's area and walking the outside boundary for perimeter, without double-counting the notch.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "A rectangle is 2.4 m long and 1.5 m wide. Find its area in m².",
      modelAnswer: "3.6 m²",
      marking: [
        "Uses area = length × width, not the perimeter formula.",
        "Calculates 2.4 × 1.5 = 3.6.",
        "Writes the answer in square metres.",
      ],
      check: { accepted: ["3.6", "3.6 m²", "3.6 m2", "3.6 square metres"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "A trapezium has parallel sides 5 cm and 9 cm and perpendicular height 4 cm. Find its area.",
      modelAnswer: "28 cm²",
      marking: [
        "Uses the trapezium formula with the average of the parallel sides.",
        "Calculates ½(5 + 9) × 4 = 7 × 4 = 28.",
        "Writes the answer in square centimetres.",
      ],
      check: { accepted: ["28", "28 cm²", "28 cm2", "28 square centimetres"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A rectangular lawn is 7.5 m by 4 m. A 1 m wide path is laid around it, touching all four sides. Find the area of the path and the perimeter of the outside edge of the path. Explain why the path's area is not the lawn's perimeter multiplied by 1 m.",
      whyItTransfers:
        "The lesson finds the area inside one rectangle. Here the learner must enlarge the rectangle on every side, subtract the original region, and compare a one-metre width with a perimeter. The arithmetic is familiar; the decision about what the path covers, especially at the corners, is new.",
      answer:
        "The outside rectangle is 7.5 + 2 = 9.5 m by 4 + 2 = 6 m. Its area is 9.5 × 6 = 57 m², and the lawn is 30 m², so the path is 27 m². Its outside perimeter is 2(9.5 + 6) = 31 m. The lawn's perimeter is 23 m, but multiplying 23 × 1 = 23 m² would miss the four corner squares: the path is a border one metre wide on every side, not a strip of length 23 m and width 1 m. The corner regions belong to the path and must be included once.",
      marking: [
        "Adds 2 m to both the length and the width to get the outside rectangle, not 1 m to only one side.",
        "Calculates the outside area 9.5 × 6 = 57 m² and subtracts the lawn's 30 m² to get 27 m².",
        "Calculates the outside perimeter as 31 m and distinguishes it from the path's area.",
        "Explains why perimeter × width misses the corner regions of the border.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "A triangle has base 16 cm and perpendicular height 7 cm. Find its area.",
      answer: "Area = ½ × 16 × 7 = 56 cm².",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A rectangle is 1.5 m long and 40 cm wide. Find its area in m² and its perimeter in metres.",
      answer:
        "40 cm = 0.4 m, so the area is 1.5 × 0.4 = 0.6 m². The perimeter is 2(1.5 + 0.4) = 3.8 m.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A 9 m by 5 m rectangle has a 2 m by 2 m square removed from one corner. Find the remaining area and perimeter.",
      answer:
        "Area = 9 × 5 − 2 × 2 = 45 − 4 = 41 m². Perimeter = 2(9 + 5) = 28 m, because removing a corner does not change the distance around the outside.",
      when: "month-later",
    },
  ],

  summary: [
    "Perimeter is a length around the boundary; area is a surface measured in square units.",
    "Rectangle: A = lw and P = 2(l + w). Triangle: A = ½bh. Parallelogram: A = bh. Trapezium: A = ½(a + b)h.",
    "For a compound shape, split or subtract regions for area, and walk the outside boundary for perimeter; removing a corner leaves the perimeter unchanged.",
    "1 m = 100 cm but 1 m² = 10,000 cm²; if every length is multiplied by k, area is multiplied by k².",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every shape is described by its dimensions and the position of any removed corner before the calculation. The formulas are written in words as well as symbols, and no answer depends on reading a diagram.",
    },
    {
      need: "low-vision",
      alternative:
        "Dimensions and formulas are set in the text at the reader's chosen size; there is no small diagram label carrying information that is not also written in the prose.",
    },
    {
      need: "dyslexia",
      alternative:
        "The calculation follows one visible order: choose the quantity, write the formula, substitute, calculate, then write the unit. Area and perimeter answers are kept on separate lines.",
    },
    {
      need: "colour-vision",
      alternative:
        "Sides and regions are named by their lengths and positions, never by colour alone. The difference between area and perimeter is carried by the words and the unit.",
    },
    {
      need: "motor",
      alternative:
        "All practice is typed; no dragging, measuring or drawing is required. A learner may sketch a compound shape on paper but is not assessed on the drawing.",
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
        "All explanations, examples, practice, assessments and the path-around-a-lawn transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content and the National Curriculum for geometry and measures.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-09",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
