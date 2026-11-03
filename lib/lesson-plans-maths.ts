import type { LessonLens } from "./lesson-plans-lens";

/** Concept-specific teaching for the mathematics concepts outside the pilot
 *  plans. The genome lesson is the core; this adds the picture, the move, a
 *  self-check and one wrong turn that is particular to the idea. */
export const MATHS_LENSES: Record<string, LessonLens> = {
  "place-value": {
    intuition:
      "Two price tags, £4.05 and £4.50, use the same three digits. The 5 is worth five hundredths in the first and five tenths in the second, so position — not the digit alone — decides the amount.",
    move:
      "Write the number in columns: thousands, hundreds, tens, ones, then tenths and hundredths after the point. Read each digit with its column name before you calculate.",
    check:
      "Rebuild the number from its parts. 452 must come back as 400 + 50 + 2, and 4.05 as 4 + 0.05; if the parts do not add back, a column has been misread.",
    trap: [
      "Reads 4.05 as four pounds fifty because 05 looks like 50.",
      "The point marks where whole columns end and fractional columns begin. 0.05 is five hundredths, while 0.50 is five tenths — ten times larger.",
    ],
  },
  addition: {
    intuition:
      "You have 8 stickers and win 5 more. Adding puts the two groups into one total, and the order does not change that total: 8 + 5 and 5 + 8 both make 13.",
    move:
      "Line the numbers up by place value, add the ones column first, and carry a group of ten into the next column when a column reaches ten or more.",
    check:
      "Estimate first and compare: 198 + 47 is about 200 + 50 = 250, so an answer of 245 is plausible and 1,245 is not. Then add the columns in the opposite order as a second check.",
    trap: [
      "Writes 68 + 27 = 815 by writing the digits side by side.",
      "The columns are not separate numbers to concatenate. 68 + 27 is 95: the 8 + 7 makes 15, so the 1 is carried into the tens column.",
    ],
  },
  subtraction: {
    intuition:
      "A jumper costs £37 and you have £52. Subtraction answers both how much is left and how far apart the two amounts are; the difference is £15 either way.",
    move:
      "Line up place values and subtract column by column. If the top digit is too small, borrow one ten from the next column and turn it into ten ones.",
    check:
      "Add the answer back to the number you subtracted. 52 − 37 = 15 because 15 + 37 = 52; if the addition does not return the starting number, the borrowing went wrong.",
    trap: [
      "Always subtracts the smaller digit from the larger one, even when it is on the top.",
      "Subtraction is directional: 52 − 37 is not 37 − 52. When the top digit is smaller, borrow from the next column rather than reversing the subtraction.",
    ],
  },
  multiplication: {
    intuition:
      "Four bags with three apples in each give twelve apples. Multiplication counts equal groups without adding the same number again and again. It is repeated addition, and the order of the factors does not change the product.",
    move:
      "Break a factor into place-value parts: 23 × 4 = (20 × 4) + (3 × 4) = 80 + 12 = 92. For larger products, use a grid so every part meets every part.",
    check:
      "Estimate with rounded factors and compare the size. 23 × 4 is about 20 × 4 = 80, so 92 is sensible; a product smaller than either factor (other than zero) is not.",
    trap: [
      "Adds the digits of the factors instead of multiplying them: 23 × 4 becomes 2 + 3 + 4.",
      "Multiplication scales one quantity by the other, so the answer is usually much larger than either factor. Keep the place-value parts and multiply each one.",
    ],
  },
  division: {
    intuition:
      "Twelve sweets shared between three people gives four each. The same division also answers how many groups of three fit into twelve — sharing and grouping are two readings of one operation.",
    move:
      "Split the dividend by place value, divide each part, and carry the remainder into the next place. Record a remainder honestly instead of dropping it.",
    check:
      "Multiply the quotient by the divisor and add the remainder. 13 ÷ 4 = 3 remainder 1 because 3 × 4 + 1 = 13; the reconstruction must match the dividend.",
    trap: [
      "Drops a remainder because the answer is expected to be a whole number.",
      "A remainder is part of the answer: 13 ÷ 4 is 3 remainder 1, or 3¼, or 3.25. Dropping it loses a quarter of the quantity.",
    ],
  },
  ratio: {
    intuition:
      "A squash recipe mixes 1 part cordial with 4 parts water. The ratio 1 : 4 compares cordial to water, not cordial to the whole drink — the whole has five parts.",
    move:
      "Add the ratio parts to find the total number of equal shares, divide the whole amount by that total, then multiply by each part. For scaling, multiply every part by the same factor.",
    check:
      "Add the shares back to the original total and check the ratio simplifies to the one you were given. 150 g and 100 g are 3 : 2 and total 250 g.",
    trap: [
      "Treats a 3 : 2 ratio as 3/2 of the whole rather than three parts out of five.",
      "A ratio compares part to part; a fraction compares part to whole. In 3 : 2 there are five equal parts, so the shares are 3/5 and 2/5 of the total.",
    ],
  },
  proportion: {
    intuition:
      "Five identical notebooks cost £7.50. Double the notebooks and the cost doubles; that is direct proportion. Four workers building a wall take six days, but eight workers take three — more workers means less time, which is inverse proportion.",
    move:
      "First decide whether the quantities move together or in opposite directions. Find the constant k from one known pair, then use y = kx for direct proportion or y = k/x for inverse.",
    check:
      "Test the relationship with a second pair. If doubling x doubles y, it is direct; if doubling x halves y, it is inverse. The same k must work for every pair.",
    trap: [
      "Doubles both quantities in an inverse-proportion problem and gets a longer time with more workers.",
      "Inverse proportion means the product stays constant: 4 workers × 6 days = 24 worker-days, so 8 workers take 3 days, not 12.",
    ],
  },
  rounding: {
    intuition:
      "A crowd of 47 people is about 50, while 43 is about 40. Rounding replaces a precise number with a nearby one that is easier to say, at the cost of pretending the missing detail does not matter.",
    move:
      "Choose the place you are rounding to, look at the digit immediately to its right, and leave the digit alone below 5 or increase it by one at 5 or above. For significant figures, start counting at the first non-zero digit.",
    check:
      "Compare the rounded value with the original on a number line: it must be the nearest value at that accuracy. Then check that the rounded answer still makes sense in the original context.",
    trap: [
      "Rounds each step of a calculation and then rounds the final answer again.",
      "Every early rounding moves the value away from the true one, and the errors can add up. Keep full precision while calculating and round only the answer the question asks for.",
    ],
  },
  "standard-form": {
    intuition:
      "The Sun's mass and a red blood cell's width are both impossible to read comfortably as long strings of zeros. Standard form writes each as a number between 1 and 10 multiplied by a power of ten, so the size is visible at a glance.",
    move:
      "Move the decimal point until the number is between 1 and 10, then count the places moved: right gives a negative power, left gives a positive one. 0.000008 becomes 8 × 10⁻⁶.",
    check:
      "Multiply the coefficient and the power back out. The result must equal the original number, and the coefficient must be at least 1 but strictly below 10.",
    trap: [
      "Writes 12 × 10⁵ and calls it standard form.",
      "Standard form requires the first factor to be between 1 and 10. 12 × 10⁵ is 1.2 × 10⁶; the coefficient is out of range, not a stylistic choice.",
    ],
  },
  inequalities: {
    intuition:
      "A lift says 'maximum 8 people'. The useful statement is not one number but a whole set: every count up to 8 is allowed, and 9 is not. An inequality describes that set.",
    move:
      "Solve as you would an equation, but reverse the inequality sign whenever you multiply or divide both sides by a negative number. Draw the boundary as an open circle for < or > and a filled one for ≤ or ≥.",
    check:
      "Test a number from your solution in the original inequality. If the test fails, the sign was probably flipped the wrong way or the boundary was included when it should not be.",
    trap: [
      "Divides −2x < 6 by −2 and writes x < −3.",
      "Dividing by a negative reverses the order of the number line. The correct answer is x > −3; test x = 0, which satisfies 0 < 6 and also 0 > −3.",
    ],
  },
  simultaneous: {
    intuition:
      "One equation with two unknowns has infinitely many pairs that fit. A second, independent equation narrows the possibilities to the single pair that satisfies both at once.",
    move:
      "Elimination: make the coefficients of one variable equal, then add or subtract the equations to remove it. Substitution: rearrange one equation for a variable and put that expression into the other.",
    check:
      "Substitute the pair into BOTH original equations, not just the one you rearranged last. A pair that satisfies one but not the other is not a solution.",
    trap: [
      "Finds y correctly and then substitutes it with the wrong sign.",
      "Write the substitution with its sign visible: 3x + 2(−6) = 16 becomes 3x − 12 = 16. Most errors happen in this final step, after the hard work is done.",
    ],
  },
  "sim-equations-quad": {
    intuition:
      "A straight line and a parabola can meet at two points, one point, or not at all. Solving them together asks exactly where the two pictures cross, not merely what each one looks like.",
    move:
      "Substitute the linear expression for y into the quadratic, collect everything on one side, and solve the resulting quadratic. Then put each x back into the line to find its y.",
    check:
      "Check both coordinates in both original equations. The number of real intersection points must match the number of real roots: two crossings, one touching point, or none.",
    trap: [
      "Finds two x-values and reports them as the final answer without finding the matching y-values.",
      "A point has two coordinates. Each x must be substituted back into the line (or curve) to produce its y, and the pair must satisfy both equations.",
    ],
  },
  sequences: {
    intuition:
      "A queue of numbered seats has a pattern: 4, 7, 10, 13. The step from one term to the next is the rule, and the nth-term formula lets you jump straight to a far-away seat without listing them all.",
    move:
      "For an arithmetic sequence, find the common difference d; the nth term is dn plus an adjustment. Check n = 1 against the first term, then n = 2 against the second.",
    check:
      "Generate the first three terms from your formula and compare them with the sequence. If the first term is wrong, the constant is wrong; if the gap is wrong, the coefficient is wrong.",
    trap: [
      "Writes 3n for the sequence 4, 7, 10 because the common difference is 3.",
      "3n gives 3, 6, 9 — one less than each term. The sequence is 3n + 1; always test n = 1 against the first term before trusting the formula.",
    ],
  },
  functions: {
    intuition:
      "A function is a machine with one input slot and one output slot. Put 4 into f(x) = 2x + 3 and the machine doubles it, adds three, and returns 11.",
    move:
      "Replace every x with the input in brackets, then evaluate: f(4) = 2(4) + 3. For an inverse, swap x and y and solve for the new y; for a composition, work from the inside function outwards.",
    check:
      "Feed the output back through the inverse. If f(4) = 11, then f⁻¹(11) must return 4. Also check the domain: an input that makes a denominator zero or a square root negative is not allowed.",
    trap: [
      "Reads f(x + 1) as f(x) + 1 and changes only the final constant.",
      "The whole input is substituted: f(x + 1) = 2(x + 1) + 3 = 2x + 5. The function acts on the entire bracket, not just on x.",
    ],
  },
  "trig-ratios": {
    intuition:
      "A ladder leans against a wall. The angle at the ground and the length of one side determine the others; trigonometry is the set of ratios that makes that possible without measuring the triangle directly.",
    move:
      "Label the sides relative to the angle: opposite, adjacent, hypotenuse. Choose SOH-CAH-TOA by asking which two sides the question connects, then rearrange the ratio before substituting.",
    check:
      "The hypotenuse must be the longest side, and sin and cos of an acute angle must lie between 0 and 1. Check the calculator is in the mode the question uses — degrees or radians.",
    trap: [
      "Uses the sine ratio for the side adjacent to the angle because it is the one that looks 'next to' the angle.",
      "Sine connects the opposite side to the hypotenuse; cosine connects the adjacent side. Label the sides from the angle first, then choose the ratio that contains the two sides you know and need.",
    ],
  },
  "trig-identity": {
    intuition:
      "A point moving around a unit circle has coordinates (cos θ, sin θ). Its distance from the origin is always 1, so the squares of those coordinates must add to 1 — the identity is Pythagoras drawn on a circle.",
    move:
      "Use sin²θ + cos²θ = 1 to replace one squared ratio with the other, and tan θ = sin θ / cos θ to turn a tangent into a pair of sine and cosine terms. Work on the more complicated side first.",
    check:
      "Test the identity with a simple angle such as 30° or 45°, and check the signs in the quadrant. An identity must hold for every angle, not just the one you used.",
    trap: [
      "Cancels sin²θ from both sides of an equation as if it were a factor of every term.",
      "You may only cancel a factor common to the whole side. sin²θ + cos²θ has two separate terms, and removing one changes the value rather than simplifying it.",
    ],
  },
  "circle-theorems": {
    intuition:
      "Any triangle drawn inside a semicircle has a right angle at the circumference, wherever the third point sits. The circle constrains the angle even though the triangle can move.",
    move:
      "Mark the arc or chord the angle stands on before choosing a theorem. Then use: centre angle is twice the circumference angle on the same arc; angles in the same segment are equal; opposite angles in a cyclic quadrilateral add to 180°.",
    check:
      "Trace the arc used by each angle and confirm both angles stand on that same arc. If the theorem needs a cyclic quadrilateral or a diameter, check that the diagram actually contains one.",
    trap: [
      "Applies the centre-is-double rule to angles standing on different arcs.",
      "The theorem compares two angles subtended by the SAME arc. Mark the arc first; if the angles use different arcs, the doubling rule does not apply.",
    ],
  },
  pythagoras: {
    intuition:
      "A 3 m ladder reaches a window 2.4 m up a wall. The ladder, wall and ground form a right triangle, and the square of the ladder's length equals the squares of the other two sides.",
    move:
      "Identify the hypotenuse — the side opposite the right angle and the longest side. Substitute the two known sides into a² + b² = c², then solve for the missing one; subtract when finding a leg.",
    check:
      "The hypotenuse must be longer than either leg. If your answer for the hypotenuse is shorter than a leg, you have added when you should have subtracted, or labelled the wrong side.",
    trap: [
      "Treats the side that touches the right angle as the hypotenuse.",
      "The hypotenuse is always opposite the right angle and never touches it. Circle it before substituting; the other two sides are the legs.",
    ],
  },
  "angles-lines": {
    intuition:
      "A straight road crossing two parallel streets creates repeated angles: the same acute angle appears in matching positions at each crossing. Those repeats are what the parallel-line rules describe.",
    move:
      "Name the pattern before using a rule: corresponding angles make an F, alternate angles make a Z, and co-interior angles make a C and add to 180°. For polygons, use (n − 2) × 180° for the interior total.",
    check:
      "Angles on a straight line must total 180°, around a point 360°, and a triangle 180°. If your values violate one of these, a parallel-line rule has been applied to lines that are not parallel.",
    trap: [
      "Treats alternate and corresponding angles as interchangeable.",
      "Alternate angles are equal and lie on opposite sides of the transversal; corresponding angles are equal and sit in matching positions. Trace the Z or the F before naming the relationship.",
    ],
  },
  "area-perimeter": {
    intuition:
      "A picture frame has a length of wood around its edge and a sheet of glass inside. Perimeter measures the wood; area measures the glass. They are different quantities even when they describe the same rectangle.",
    move:
      "Split a compound shape into rectangles and triangles, calculate each area, and add or subtract the parts. Keep every length in the same unit before multiplying.",
    check:
      "Area is in square units and perimeter in ordinary units. A rectangle 2 m by 50 cm has an area of 1 m², not 100 m²; convert to the same unit first.",
    trap: [
      "Converts 1 m² to 100 cm² by multiplying by 100 once.",
      "Area scales by the square of the length factor: 1 m = 100 cm, so 1 m² = 100 × 100 = 10,000 cm². Volume would scale by 100³.",
    ],
  },
  volume: {
    intuition:
      "A box 3 cm by 4 cm by 5 cm can be filled with 60 centimetre cubes. Volume counts those cubes; surface area counts the paper needed to wrap the outside.",
    move:
      "For a cuboid use V = lwh; for a prism use the cross-sectional area times its length; for a cylinder use πr²h. For surface area, find every face and add them, using a net to avoid missing one.",
    check:
      "Volume is in cubic units and surface area in square units. If a scale factor k changes every length, area changes by k² and volume by k³ — a doubled box holds eight times as much.",
    trap: [
      "Doubles the sides of a cube and says the volume doubles.",
      "Every length is multiplied by 2, so the volume is multiplied by 2 × 2 × 2 = 8. Area would be multiplied by 4, not 2.",
    ],
  },
  transformations: {
    intuition:
      "A shape on a grid can slide, turn, flip or grow. Each move has a rule, and a complete description says which move, by how much, and from where — otherwise the same picture could be produced in different ways.",
    move:
      "For a translation give the vector; for a rotation give the angle, direction and centre; for a reflection give the mirror line; for an enlargement give the centre and scale factor. Apply the rule to each vertex.",
    check:
      "Compare side lengths and angles: translations, rotations and reflections preserve them, while an enlargement multiplies every length by the same factor. The image's orientation must match the move described.",
    trap: [
      "Describes a rotation without naming its centre.",
      "The same angle about different centres produces different images. A rotation is only fully specified by angle, direction and centre, and the mark scheme requires all three.",
    ],
  },
  vectors: {
    intuition:
      "A walk of 3 steps right and 2 steps down is a vector. The two components say how far and in which direction; another walk with the same components ends at the same displacement, wherever it starts.",
    move:
      "Add vectors component by component, tip to tail. Subtract by adding the negative. Multiply by a scalar to stretch or reverse the vector; parallel vectors are scalar multiples of one another.",
    check:
      "Reverse the journey and every component changes sign: AB = −BA. If two vectors are parallel, their components must share the same scale factor, not merely look similar.",
    trap: [
      "Adds vectors by adding their magnitudes and ignores direction.",
      "Vectors are not lengths. (3, −2) + (−1, 4) = (2, 2); a 5-unit vector plus a 4-unit vector can produce any resultant between 1 and 9 units depending on direction.",
    ],
  },
  "probability-basics": {
    intuition:
      "A fair coin has two equally likely outcomes, so heads has probability 1/2. A probability is a position on a scale from 0 (impossible) to 1 (certain), not a guarantee about the next single toss.",
    move:
      "Count the equally likely outcomes and the favourable ones, then divide. For the complement, subtract from 1. For experimental probability, divide the number of successes by the number of trials.",
    check:
      "Every probability must lie between 0 and 1, and the probabilities of all mutually exclusive outcomes must total 1. If they do not, an outcome has been missed or double-counted.",
    trap: [
      "Adds the probabilities of overlapping events and counts the overlap twice.",
      "P(A or B) = P(A) + P(B) − P(A and B). The subtraction removes the outcomes counted in both events; without it the total can exceed 1.",
    ],
  },
  "tree-diagrams": {
    intuition:
      "Two coin tosses have four equally likely paths: HH, HT, TH, TT. A tree draws each choice as a branch, so multiplying along a path counts the chance of that whole sequence.",
    move:
      "Multiply along a branch for 'and', and add the probabilities of different branches for 'or'. If an item is not replaced, change the denominator on the second branch to reflect what remains.",
    check:
      "The probabilities on every complete set of branches must total 1. For 'at least one', calculate the complement of 'none' and subtract it from 1.",
    trap: [
      "Uses the same denominator on the second draw when the first item was not replaced.",
      "Without replacement the sample space has shrunk: after one red sweet from 5 red and 3 blue, the second draw is from 4 red and 3 blue. The branches are not independent.",
    ],
  },
  averages: {
    intuition:
      "One very high salary can pull a mean far above what a typical worker earns, while the median stays near the middle. An average is a summary, and the right summary depends on what the data looks like.",
    move:
      "Mean: add and divide by the count. Median: sort and take the middle (average the two middle values if the count is even). Mode: the most frequent value. Range: largest minus smallest.",
    check:
      "Ask whether an outlier is present and whether the data is numerical or categorical. Report the median for skewed numerical data, the mode for categories, and never quote a mean without saying what it is a mean of.",
    trap: [
      "Uses the mean for a data set with one extreme outlier because it is the most familiar average.",
      "The mean uses every value, so one outlier can move it far from the typical case. The median is resistant to extremes and describes the middle more honestly.",
    ],
  },
  "data-charts": {
    intuition:
      "The same numbers can look dramatic or flat depending on where the vertical axis starts. A chart is an argument made with scale, colour and grouping, not a neutral photograph of the data.",
    move:
      "Choose the chart by the question: bars for categories, a line for change over time, a pie for shares of one whole, a scatter for two numerical variables. Label both axes and state the units.",
    check:
      "Read the axes before the shape: is the scale uniform, does it start at zero when comparing magnitudes, and are the categories in a sensible order? A missing baseline can exaggerate a small change.",
    trap: [
      "Compares the heights of bars whose vertical axis starts at a value other than zero.",
      "A truncated axis magnifies small differences: a bar from 90 to 100 can look twice as tall as one from 95 to 100. For magnitude comparisons, start at zero or state the break clearly.",
    ],
  },
  "scatter-correlation": {
    intuition:
      "Ice-cream sales and drowning deaths rise together in summer. The points on a scatter graph show a relationship, but the weather is the hidden cause of both — the graph alone cannot tell you which variable drives the other.",
    move:
      "Plot one variable on each axis, look for the direction and strength of the pattern, and draw a line of best fit through the middle of the points. Use it to interpolate inside the data range; extrapolate only with a stated reason.",
    check:
      "Correlation is not causation. Ask whether a third factor could explain both variables, whether the relationship is linear, and whether outliers are pulling the line.",
    trap: [
      "Concludes that a change in x causes a change in y because the points slope upward.",
      "A correlation can be produced by a common cause, reverse causation or chance. Only a controlled comparison or a plausible mechanism supports a causal claim.",
    ],
  },
  polynomials: {
    intuition:
      "A cubic can cross the x-axis up to three times. Each crossing is a root, and each root corresponds to a factor — so finding one root is a way into the rest of the expression.",
    move:
      "Use the factor theorem: if substituting x = a gives 0, then (x − a) is a factor. Divide the polynomial by that factor, then factorise or solve the remaining lower-degree expression.",
    check:
      "Substitute each proposed root back into the original polynomial; it must give exactly 0. The degree tells you the maximum number of real roots, so a cubic cannot have four.",
    trap: [
      "Assumes a cubic has three real roots because its degree is three.",
      "The degree gives the maximum number of roots over the complex numbers, not a guarantee of real crossings. A cubic can have one real root and two complex ones.",
    ],
  },
  binomial: {
    intuition:
      "Expanding (x + 2)³ by multiplying every bracket is slow. Pascal's triangle gives the coefficients directly: 1, 3, 3, 1, so the expansion can be written in one line. The pattern is symmetric.",
    move:
      "Use row n of Pascal's triangle for (a + b)ⁿ, or C(n, r) for a single coefficient. In each term the powers of a and b must add to n, starting with aⁿb⁰ and ending with a⁰bⁿ.",
    check:
      "The powers in every term must sum to n, and the coefficients must be symmetric. Substitute x = 1 into both the original and the expansion; the values must match.",
    trap: [
      "Uses the row above or below the one matching the power.",
      "For (a + b)ⁿ use row n, counting the top row as row 0. (x + 2)³ uses 1, 3, 3, 1; using the wrong row gives the right shape with the wrong coefficients.",
    ],
  },
  "trig-rule": {
    intuition:
      "Pythagoras only works when a triangle has a right angle. The sine and cosine rules extend the same reasoning to any triangle by relating sides to the angles opposite them.",
    move:
      "Use the sine rule when you have a matching side-and-opposite-angle pair; use the cosine rule when you have two sides and the included angle, or all three sides. For area, use ½ab sin C.",
    check:
      "The longest side must be opposite the largest angle. If your calculated angle or side violates that ordering, you have paired the wrong side with the wrong angle.",
    trap: [
      "Uses the sine rule with a side and an angle that are not opposite each other.",
      "The sine rule pairs a side with the angle across from it: a/sin A = b/sin B. Label the triangle so each side and its opposite angle are matched before substituting.",
    ],
  },
  "circle-area-arc": {
    intuition:
      "A pizza slice is a fraction of the whole pizza. The angle at the centre tells you what fraction: 90° is a quarter of 360°, so the slice has a quarter of the area and a quarter of the crust.",
    move:
      "For a sector, multiply the full circle's area or circumference by θ/360. For arc length use (θ/360) × 2πr; for sector area use (θ/360) × πr². Keep the angle in degrees unless the formula explicitly uses radians.",
    check:
      "The sector area must be smaller than the whole circle's area, and the arc must be shorter than the full circumference. A sector angle above 360° or a negative length is a sign the units or formula are wrong.",
    trap: [
      "Uses the diameter in place of the radius in πr².",
      "The formula is built on the radius: a circle of diameter 10 has r = 5 and area 25π, not 100π. Halve the diameter before substituting.",
    ],
  },
  "mixture-problems": {
    intuition:
      "A word problem is a story with numbers hiding in it. 'Three more than twice a number is 17' has to become 2x + 3 = 17 before any algebra can help.",
    move:
      "Define the unknown in words, translate each phrase into an operation, write an equation, solve it, and then answer the question the story actually asked — not merely the value of x.",
    check:
      "Put the answer back into the original sentence and read it as a sentence. If the result is impossible — a negative length, a fractional number of people — the equation or the definition of the variable is wrong.",
    trap: [
      "Solves the equation but reports x when the question asked for a total, a difference or a price.",
      "The variable is a stepping stone, not always the answer. Underline what the question asks for before solving, then use the value of x to compute that quantity.",
    ],
  },
  "growth-decay": {
    intuition:
      "Money in an account earning compound interest grows by a percentage of its current amount each year, so the interest itself starts earning interest. The curve bends upward rather than following a straight line.",
    move:
      "Write repeated percentage change as a multiplier: a 5% increase is ×1.05, a 12% decrease is ×0.88. For n periods, raise the multiplier to the power n and multiply the starting amount.",
    check:
      "A growth multiplier must be above 1 and a decay multiplier between 0 and 1. After one period the result should match a single percentage calculation; after several, it should be larger than simple interest for growth.",
    trap: [
      "Adds the same interest amount every year and calls it compound interest.",
      "Simple interest adds a fixed amount; compound interest multiplies by the same factor each period, so the amount added grows. After several years the two answers diverge sharply.",
    ],
  },
  logs: {
    intuition:
      "A logarithm answers 'what power do I need?'. log₂ 8 = 3 because 2³ = 8; it is the inverse question to exponentiation, not a separate operation to memorise. The base names the number being repeatedly multiplied.",
    move:
      "Rewrite a log equation as an exponential one, or vice versa: log_a b = c means aᶜ = b. Use the laws log(xy) = log x + log y, log(x/y) = log x − log y, and log(xⁿ) = n log x.",
    check:
      "The base must be positive and not 1, and the argument must be positive. Substitute the answer back: if log₂ 8 = 3, then 2³ must equal 8.",
    trap: [
      "Writes log(x + y) = log x + log y.",
      "The product law applies to multiplication, not addition. log(2 + 3) = log 5, while log 2 + log 3 = log 6; the two are different.",
    ],
  },
  "calculus-diff": {
    intuition:
      "A car's speedometer shows its rate of change at one instant, not an average over the journey. Differentiation finds that instantaneous rate — the gradient of a curve at a single point.",
    move:
      "For a power, multiply by the exponent and reduce it by one: y = xⁿ gives dy/dx = nxⁿ⁻¹. Differentiate each term separately, then set dy/dx = 0 to locate stationary points.",
    check:
      "The derivative of a constant is zero, and the units of dy/dx are the units of y per unit of x. At a maximum the gradient changes from positive to negative; at a minimum, the reverse.",
    trap: [
      "Differentiates x² as 2x² instead of 2x.",
      "The power rule reduces the exponent by one: x² becomes 2x¹ = 2x. Multiplying by the exponent without reducing it leaves the wrong power.",
    ],
  },
  "calculus-int": {
    intuition:
      "If a car's speedometer tells you how fast it is going, the area under that speed graph tells you how far it has travelled. Integration accumulates a rate into a total.",
    move:
      "Reverse the power rule: ∫xⁿ dx = xⁿ⁺¹/(n + 1) + c for n ≠ −1. For a definite integral, integrate and substitute the upper limit minus the lower limit.",
    check:
      "Differentiate your answer; it must return the original integrand. For a definite integral, the result should have the units of the quantity accumulated, not the rate.",
    trap: [
      "Omits the constant of integration in an indefinite integral.",
      "Differentiation destroys constants: x² + 3 and x² + 7 both differentiate to 2x. The + c records every possible starting value, and a definite integral cancels it.",
    ],
  },
  kinematics: {
    intuition:
      "A ball thrown upward slows, stops for an instant, then falls faster and faster. Its velocity changes at a constant rate, which is exactly the condition the SUVAT equations describe.",
    move:
      "List s, u, v, a and t, choose the equation containing the three quantities you know and the one you need, and decide a positive direction before substituting. For graphs, gradient is acceleration and area is displacement.",
    check:
      "Check the sign of every vector against your chosen direction, and check the units. A negative displacement means the object is on the other side of the starting point, not that the calculation failed.",
    trap: [
      "Uses SUVAT when acceleration is not constant.",
      "The equations assume constant acceleration. If the velocity–time graph is curved, the acceleration is changing and the equations do not apply; use the graph or calculus instead.",
    ],
  },
  proof: {
    intuition:
      "Checking 3² + 4² = 5² does not prove Pythagoras for every triangle. A proof is an argument whose steps follow for all cases, so no counterexample can slip through.",
    move:
      "State what is given and what must be shown. Use a general representation — an even number 2n, consecutive integers n and n + 1 — and transform it with valid algebraic steps until the claim appears.",
    check:
      "Every step must be justified by a definition, an earlier result or algebra. A single unchecked case is not a proof; a single counterexample is enough to disprove a universal claim.",
    trap: [
      "Proves a statement for several examples and concludes it holds for all values.",
      "Examples can only disprove a universal claim, not prove it. A proof must cover the general case, which is why algebra with n is used instead of a list of numbers.",
    ],
  },
  "matrices-intro": {
    intuition:
      "A matrix is a compact instruction for a transformation: it tells every point on a grid where to move. Multiplying matrices composes two transformations into one.",
    move:
      "To multiply, take each row of the first matrix with each column of the second: multiply matching entries and add. For a 2×2 matrix, the determinant ad − bc tells you how areas scale.",
    check:
      "Check the dimensions: the number of columns in the first matrix must equal the number of rows in the second. A zero determinant means the transformation collapses area, so no inverse exists.",
    trap: [
      "Multiplies matrices entry by entry instead of row by column.",
      "Matrix multiplication combines a row of the first with a column of the second, summing the products. It is not elementwise multiplication, and the order of the product matters.",
    ],
  },
  "sets-venn": {
    intuition:
      "In a class, some pupils play football, some play music, and some do both. A Venn diagram puts the overlap in the middle so nobody is counted twice.",
    move:
      "Draw one circle per set, put the intersection in the overlap, and fill the 'only' regions by subtracting the overlap from each total. For probability, divide the counted region by the total.",
    check:
      "Add every region and compare it with the total number of items. The regions must be disjoint and their sum must equal the whole; if it does not, the overlap was counted twice or a region was missed.",
    trap: [
      "Adds the two set totals without subtracting the overlap.",
      "The overlap belongs to both sets, so adding the totals counts it twice. P(A ∪ B) = P(A) + P(B) − P(A ∩ B); the subtraction is what makes the count correct.",
    ],
  },
  "financial-maths": {
    intuition:
      "A loan or savings account quotes a yearly rate, but the amount changes each period. The difference between simple and compound interest is whether the interest itself starts earning interest.",
    move:
      "For simple interest use I = PRT/100. For compound growth use A = P(1 + r/100)ⁿ; for depreciation use the same formula with a multiplier below 1. Keep the rate and the number of periods in the same time unit.",
    check:
      "After one period both methods should agree; after several, compound growth must be larger than simple. A monthly rate cannot be substituted directly into a formula built for years without converting the number of periods.",
    trap: [
      "Uses the annual rate for a monthly payment without dividing it or converting the number of periods.",
      "The formula's n counts periods, not years. A 6% annual rate compounded monthly uses 0.06/12 per month and 12n months; mixing the units overstates or understates the result.",
    ],
  },
  bounds: {
    intuition:
      "A length recorded as 3.6 cm to one decimal place could really be anything from 3.55 cm up to, but not including, 3.65 cm. The written number is a summary of a range, not an exact measurement.",
    move:
      "Find the half-step below and above the rounded value. For a sum use lower + lower and upper + upper; for a difference use lower − upper and upper − lower; for a product or quotient pair the bounds that make the result smallest and largest.",
    check:
      "The upper bound must be greater than the recorded value and the lower bound smaller. For a difference, the maximum uses the larger upper bound minus the smaller lower bound, not both uppers.",
    trap: [
      "Uses the upper bound of both quantities to find the maximum of a difference.",
      "A difference is largest when the first quantity is as large as possible and the second as small as possible. Using both upper bounds subtracts too much and gives a value that is not the maximum.",
    ],
  },
  "loci-constructions": {
    intuition:
      "A goat tethered to a post can reach every point within the rope's length — a circle. A locus is the set of all points that satisfy one rule, and the shape is the picture of that rule.",
    move:
      "Translate the rule into a distance condition: fixed distance from a point gives a circle, equidistant from two points gives the perpendicular bisector, equidistant from two lines gives an angle bisector. Construct with compasses and keep the arcs visible.",
    check:
      "Pick a point on your locus and measure its distances; they must satisfy the rule. Pick a point clearly inside and one clearly outside; the boundary should separate them.",
    trap: [
      "Draws only one side of a perpendicular bisector or angle bisector.",
      "A locus is the whole set of points satisfying the rule, on both sides of the segment or angle. A half-line is only part of the answer unless the context restricts it.",
    ],
  },
  bearings: {
    intuition:
      "A bearing is a direction given the way a compass reads it: start facing north, turn clockwise, and state the angle as three digits. 045° is northeast, 180° is due south.",
    move:
      "Draw a north line at the starting point, measure clockwise from it, and write three digits. For a return journey, add or subtract 180°; for a triangle, use the sine or cosine rule after drawing the north lines.",
    check:
      "A bearing must be between 000° and 360°, and a back-bearing differs by exactly 180°. If the return direction is not opposite the outbound one, the north lines or the angle direction are wrong.",
    trap: [
      "Measures the bearing anticlockwise from north or clockwise from the other point.",
      "Bearings are always measured clockwise from north at the point you are leaving. Measuring from the destination, or anticlockwise, gives the supplement rather than the bearing.",
    ],
  },
  "proportional-graphs": {
    intuition:
      "A straight line through the origin says that doubling x doubles y. A curve that falls as x grows says the opposite: as one quantity increases, the other decreases.",
    move:
      "For direct proportion, check that the graph is a straight line through (0, 0) and that y/x is constant. For inverse proportion, check that the graph is a hyperbola and that xy is constant.",
    check:
      "Pick two points and compute y/x (direct) or xy (inverse). The value must be the same for every pair; a straight line that misses the origin is not direct proportion.",
    trap: [
      "Calls any straight-line graph direct proportion.",
      "Direct proportion must pass through the origin, because zero of one quantity means zero of the other. A line with a non-zero intercept is linear but not proportional.",
    ],
  },
  "quadratic-graphs": {
    intuition:
      "A ball's height over time traces a parabola: it rises, turns, and falls. The turning point is the maximum height, and the points where it crosses the ground are the roots.",
    move:
      "Find the roots by factorising or using the formula, find the turning point by completing the square or using x = −b/2a, and note whether the parabola opens up or down from the sign of a.",
    check:
      "The axis of symmetry sits halfway between the roots, and the turning point lies on it. The y-intercept is c; substituting x = 0 must give that value.",
    trap: [
      "Reads the turning point directly from the roots instead of the completed-square form.",
      "The roots are where y = 0; the turning point is where the parabola reaches its maximum or minimum. Completing the square gives (h, k) directly; the midpoint of the roots gives only the x-coordinate.",
    ],
  },
  "algebraic-fractions": {
    intuition:
      "An algebraic fraction is a fraction whose top and bottom are expressions. Simplifying it is the same contract as with numbers: factor first, then cancel whole factors, never individual terms.",
    move:
      "Factorise the numerator and denominator completely, cancel factors common to the whole expression, and state any value that would make a denominator zero. For addition, build a common denominator from the factors.",
    check:
      "Substitute a value into the original and simplified expressions; they must agree wherever both are defined. Check the excluded values separately, because cancellation can hide a hole.",
    trap: [
      "Cancels the x in (x + 3)/(x + 5) to get 3/5.",
      "Cancellation removes a common FACTOR of the whole numerator and denominator, not a term inside a sum. (x + 3)/(x + 5) does not simplify; x is not a factor of either sum.",
    ],
  },
  iteration: {
    intuition:
      "Some equations have no neat algebraic solution, but a calculator can still home in on one. Start with a guess, apply the rule, feed the result back, and watch the digits settle.",
    move:
      "Rearrange the equation into the form x = g(x), choose a starting value, and substitute repeatedly. Keep enough decimal places to see whether successive values are converging, and stop when they agree to the required accuracy.",
    check:
      "The sequence should approach a fixed point, not oscillate or run away. Substitute the final value into the original equation; the two sides must agree to the required number of decimal places.",
    trap: [
      "Stops after one iteration and treats the first output as the root.",
      "One application of g(x) moves the guess; it does not solve the equation. The answer is the value that stops changing, so several iterations and a convergence check are required.",
    ],
  },
  "circle-geometry-adv": {
    intuition:
      "Two chords crossing inside a circle cut each other into segments whose products are equal. The picture looks like an X, but the lengths obey a hidden balance.",
    move:
      "For intersecting chords use PA × PB = PC × PD. For a tangent and a chord, use the alternate segment theorem: the angle between the tangent and chord equals the angle in the alternate segment. Two tangents from one external point are equal.",
    check:
      "Identify which theorem the diagram supports before writing an equation: chords inside, tangent–chord, or two tangents. Then check that every length or angle you use belongs to the same circle and the same chord.",
    trap: [
      "Uses the angle at the centre for the alternate segment theorem.",
      "The alternate segment theorem compares the tangent–chord angle with the angle in the OPPOSITE segment, not the centre. The centre angle is double the circumference angle on the same arc.",
    ],
  },
  "number-bases": {
    intuition:
      "In base 10, 452 means 4 hundreds, 5 tens and 2 ones. In base 2 the same idea uses powers of two, so 1011 means 8 + 2 + 1 — the columns have changed, not the principle.",
    move:
      "Label each column with its power of the base, multiply each digit by that power, and add. To convert from decimal, divide repeatedly by the base and read the remainders from bottom to top.",
    check:
      "Convert the result back to decimal and compare. Every digit must be smaller than the base — a digit 2 in binary is already impossible, so the representation is wrong.",
    trap: [
      "Reads 1011₂ as one thousand and eleven.",
      "The subscript 2 changes the column values to powers of two, and a binary numeral uses only 0 and 1. 1011₂ = 8 + 0 + 2 + 1 = 11, not 1011 in base 10.",
    ],
  },
  "logic-maths": {
    intuition:
      "A burglar alarm sounds if the door is open AND the system is armed. An AND statement needs both parts true; an OR statement needs at least one. Truth tables list every combination so no case is missed.",
    move:
      "Write one row for every combination of true and false inputs, then evaluate the connective for each row. For an implication, remember that 'if P then Q' is false only when P is true and Q is false.",
    check:
      "The number of rows must be 2ⁿ for n inputs. Check the final column against the meaning of the sentence in words, and look for a row where the conclusion is true but the condition is false.",
    trap: [
      "Treats 'if P then Q' as the same statement as 'if Q then P'.",
      "An implication and its converse are different: 'if it is raining, the ground is wet' does not mean 'if the ground is wet, it is raining'. A truth table shows the converse can fail while the original holds.",
    ],
  },
};
