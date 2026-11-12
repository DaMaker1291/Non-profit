import type { AuthoredLesson } from "../../lesson-contract";

// A FUNCTION IS A RULE WITH ONE OUTPUT PER INPUT.
//
// The notation is where most of the errors live: f(x + 1) is not f(x) + 1, and
// f⁻¹(x) is not 1/f(x). The lesson therefore treats the bracket as the input
// slot, makes composition an order of machines, and derives the inverse by
// swapping x and y rather than by pattern-matching a reciprocal. Domain and range
// are taught as restrictions that decide whether an inverse exists at all, with
// the square function as the case that needs a restricted domain.
export const MATHS_FUNCTIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "functions",
  version: "1.0.0",
  subject: "maths",
  curriculum: {
    reference:
      "GCSE Mathematics, algebra: function notation, composite functions, inverse functions, domain and range",
    level: "Key Stage 4 to GCSE Higher",
    note:
      "Scope cited against the published GCSE mathematics subject content. All explanations, examples, practice, assessment and the temperature-conversion transfer are original. No specification, textbook or examination text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Read and evaluate function notation, including f(x + 1), by substituting the whole bracket as the input.",
      evidence:
        "For f(x) = 2x + 3, the learner evaluates f(4) = 11 and f(x + 1) = 2x + 5, and explains why the second is not 2x + 4.",
    },
    {
      statement:
        "Form and evaluate a composite function in the correct order.",
      evidence:
        "With f(x) = 2x + 3 and g(x) = x², the learner computes g(f(2)) = 49 and f(g(2)) = 11, and states that composition is not generally commutative.",
    },
    {
      statement:
        "Find an inverse function by swapping x and y, and verify it by composition.",
      evidence:
        "The learner finds f⁻¹(x) = (x − 3)/2 for f(x) = 2x + 3, checks f⁻¹(11) = 4, and explains why f⁻¹(x) is not 1/f(x).",
    },
    {
      statement:
        "State a domain restriction and explain when a function has no inverse on its full domain.",
      evidence:
        "The learner gives x ≠ 5 for 1/(x − 5), x ≥ −3 for √(x + 3), and explains that x² needs a restricted domain before its inverse is a function.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["algebra-expressions", "coordinates"],
    check: [
      {
        id: "d1",
        question: "Evaluate 3x − 2 when x = 5.",
        answer: "3 × 5 − 2 = 15 − 2 = 13.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d2",
        question: "If y = 2x + 7, rearrange the equation to make x the subject.",
        answer:
          "Subtract 7: y − 7 = 2x. Divide by 2: x = (y − 7)/2.",
        targets: ["algebra-expressions"],
      },
      {
        id: "d3",
        question: "What does the point (4, 11) mean on the graph of y = f(x)?",
        answer:
          "It means the input 4 produces the output 11, so f(4) = 11. The x-coordinate is the input and the y-coordinate is the output.",
        targets: ["coordinates"],
      },
    ],
  },

  introduction: {
    hook:
      "A vending machine takes one code and returns one item. Type the same code twice and you get the same item; type a code that does not exist and the machine does nothing. A function is that kind of rule: each allowed input has exactly one output. The notation f(4) = 11 means “the rule called f turns 4 into 11”, not “f multiplied by 4”. Once the bracket is read as the input slot, composition and inverses stop being symbol puzzles and become questions about machines joined in a row.",
    why:
      "Functions are the language later mathematics uses to describe change. A conversion formula, a cost model, a curve and a sequence rule are all functions, and an inverse answers “what input would produce this output?”. The same notation also carries the restrictions that keep a model honest: a denominator cannot be zero and a square root cannot be negative. Getting the notation right now prevents errors that would otherwise survive into graphs, calculus and data work.",
  },

  explanation: [
    {
      heading: "The bracket is the input, not a multiplication",
      paragraphs: [
        "The statement f(x) = 2x + 3 defines a rule. To evaluate f(4), replace every x in the rule with 4: f(4) = 2(4) + 3 = 11. The brackets around the 4 are function notation, not multiplication. Writing f × 4 would be a different operation and would not use the rule at all.",
        "The same substitution works when the input is an expression. f(x + 1) means “put the whole expression x + 1 wherever the rule has x”: f(x + 1) = 2(x + 1) + 3 = 2x + 2 + 3 = 2x + 5. It does not mean f(x) + 1 = 2x + 4. The function acts on the entire bracket, so the +1 is doubled along with the x.",
        "This is why brackets matter in composition as well. For f(x) = x² and an input x + 2, f(x + 2) = (x + 2)² = x² + 4x + 4, not x² + 4. The square applies to the whole input, and expanding it produces the cross term. A learner who treats the bracket as decoration loses that term and changes the function.",
      ],
    },
    {
      heading: "Composition is a row of machines, applied inside out",
      paragraphs: [
        "The composite g(f(x)) means “do f first, then feed its output into g”. With f(x) = 2x + 3 and g(x) = x², f(2) = 7, and then g(7) = 49, so g(f(2)) = 49. The inner function is evaluated first because its output is the input to the outer one.",
        "The reverse order is usually different. f(g(2)) = f(4) = 11, not 49. Composition is not generally commutative: putting on socks and then shoes is not the same as putting on shoes and then socks. A function is a process with an order, and the notation reads from the inside out.",
        "An algebraic composite can be formed before any number is chosen. g(f(x)) = g(2x + 3) = (2x + 3)². Expanding is optional unless the question asks for a simplified expression, but the substitution must keep the whole inner expression in the outer function's input slot. Evaluating at a particular x is then a check on the composite, not a substitute for forming it.",
      ],
    },
    {
      heading: "An inverse runs the machine backwards",
      paragraphs: [
        "The inverse function f⁻¹ undoes f. If f(4) = 11, then f⁻¹(11) = 4. To find it, write y = f(x), swap x and y, and solve for the new y. For f(x) = 2x + 3: y = 2x + 3 becomes x = 2y + 3 after the swap. Then x − 3 = 2y and y = (x − 3)/2, so f⁻¹(x) = (x − 3)/2.",
        "The notation f⁻¹(x) does not mean 1/f(x). The reciprocal of 2x + 3 is 1/(2x + 3), which is a different function entirely. The superscript −1 on a function name means “the inverse process”, while a power on a number means “reciprocal”. The context of the symbol decides which meaning applies.",
        "Composition verifies an inverse. f(f⁻¹(x)) should return x, and f⁻¹(f(x)) should also return x wherever both are defined. For f(x) = 2x + 3 and f⁻¹(x) = (x − 3)/2, f(f⁻¹(x)) = 2((x − 3)/2) + 3 = x, and f⁻¹(f(x)) = ((2x + 3) − 3)/2 = x. A claimed inverse that fails either composition is not the inverse, even if it looks plausible.",
      ],
    },
    {
      heading: "Domain and range are part of the rule",
      paragraphs: [
        "The domain is the set of inputs the function accepts; the range is the set of outputs it can produce. For f(x) = 1/(x − 5), the denominator cannot be zero, so x = 5 is excluded and the domain is all real numbers except 5. For f(x) = √(x + 3), the expression under the square root cannot be negative, so x + 3 ≥ 0 and x ≥ −3.",
        "A graph shows the domain as the horizontal spread of the curve and the range as its vertical spread. The vertical line test asks whether any input has more than one output: if a vertical line crosses the graph twice, the rule is not a function because one input has two outputs. The horizontal line test asks whether an inverse will also be a function: if a horizontal line crosses twice, two different inputs share an output, so undoing it would not know which input to return.",
        "The square function f(x) = x² fails the horizontal line test on all real numbers: f(2) = 4 and f(−2) = 4. Its inverse would have to return both 2 and −2 from the input 4, which is not a single output. Restricting the domain to x ≥ 0 makes the inverse √x a function. A restriction is not a technicality; it selects the part of the original process that can be reversed unambiguously.",
      ],
    },
    {
      heading: "Functions describe relationships, not only formulas",
      paragraphs: [
        "A function can be given by a formula, a table, a graph or a rule in words, provided each allowed input has one output. A table of train fares by destination is a function if every destination has exactly one fare. A graph is a function if it passes the vertical line test. The notation f(x) names the output, not the formula, so different formulas can define the same function on the same domain.",
        "In a modelling context, the domain is often narrower than the algebra suggests. A cost function C(n) = 3n + 20 may make sense for whole numbers of items, not for n = −4 or n = 2.5. The formula can be evaluated at those inputs, but the model cannot. Stating the domain is part of interpreting the answer, not an optional extra.",
        "The range follows from the domain and the rule. For f(x) = x² with domain x ≥ 0, the outputs are all non-negative, so the range is y ≥ 0. For the same formula with domain all real numbers, the range is still y ≥ 0, but the inverse is not a function. Domain and invertibility are connected: a one-to-one function, one output per input in both directions, has an inverse on that domain.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "maths.expression",
      body:
        "The bracket is the input slot. The whole expression inside it replaces every x in the rule.",
      notation: "f(x) = 2x + 3  →  f(4) = 2(4) + 3 = 11  ·  f(x + 1) = 2(x + 1) + 3 = 2x + 5",
      caption:
        "f(x + 1) is not f(x) + 1. The +1 is part of the input, so it is doubled along with x.",
    },
    {
      id: "r2",
      kind: "maths.expression",
      body:
        "A composite function applies the inner function first and feeds its output into the outer function.",
      notation: "f(x) = 2x + 3, g(x) = x²  →  g(f(2)) = g(7) = 49  ·  f(g(2)) = f(4) = 11",
      caption:
        "The order matters. g(f(x)) and f(g(x)) are generally different functions, just as shoes-then-socks differs from socks-then-shoes.",
    },
    {
      id: "r3",
      kind: "maths.graph",
      body:
        "A function passes the vertical line test; an inverse is a function only when the original passes the horizontal line test.",
      notation:
        "f(x) = x² on all real x: vertical test passes, horizontal test fails  ·  on x ≥ 0: both pass, inverse √x",
      caption:
        "f(2) = 4 and f(−2) = 4, so undoing 4 would not know whether to return 2 or −2. Restricting the domain to x ≥ 0 removes the ambiguity.",
    },
    {
      id: "r4",
      kind: "maths.proof",
      body:
        "An inverse is verified by composing it with the original function in both orders.",
      notation: "f(f⁻¹(x)) = x and f⁻¹(f(x)) = x",
      caption:
        "For f(x) = 2x + 3 and f⁻¹(x) = (x − 3)/2, both compositions return x. A reciprocal 1/(2x + 3) does not.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "For f(x) = 2x + 3, find f(4) and f(x + 1).",
      steps: [
        {
          move: "Replace x with 4: f(4) = 2(4) + 3 = 8 + 3 = 11.",
          why:
            "The number in the bracket is the input. Substituting it into the rule gives the output.",
        },
        {
          move: "Replace every x with the whole expression x + 1: f(x + 1) = 2(x + 1) + 3.",
          why:
            "The bracket is the input slot. The +1 is part of the input and must be multiplied by 2 as well.",
        },
        {
          move: "Expand: 2x + 2 + 3 = 2x + 5.",
          why:
            "Expanding the bracket gives the simplified output. It is not 2x + 4, because the constant is doubled too.",
        },
        {
          move: "Check: f(4) = 11, and for x = 1, f(2) = 7 = 2(1) + 5, so f(x + 1) = 2x + 5.",
          why:
            "A numerical check confirms the algebraic form and catches a missed term.",
        },
      ],
      answer: "f(4) = 11 and f(x + 1) = 2x + 5",
    },
    {
      id: "w2",
      prompt: "For f(x) = 2x + 3 and g(x) = x², find g(f(2)) and f(g(2)).",
      steps: [
        {
          move: "Evaluate the inner function first: f(2) = 2(2) + 3 = 7.",
          why:
            "g(f(2)) means the output of f is the input to g, so f must be evaluated before g.",
        },
        {
          move: "Feed 7 into g: g(7) = 7² = 49, so g(f(2)) = 49.",
          why:
            "The outer function acts on the inner function's output.",
        },
        {
          move: "For f(g(2)), start with g(2) = 2² = 4, then f(4) = 11.",
          why:
            "The order is inside out again, but the inner function is now g.",
        },
        {
          move: "Compare: 49 ≠ 11, so composition is not commutative here.",
          why:
            "The two composites are different functions of the input, not two names for the same value.",
        },
      ],
      answer: "g(f(2)) = 49 and f(g(2)) = 11",
    },
    {
      id: "w3",
      prompt: "Find the inverse of f(x) = 2x + 3 and verify it by composition.",
      steps: [
        {
          move: "Write y = 2x + 3.",
          why:
            "Naming the output y makes the swap of input and output explicit.",
        },
        {
          move: "Swap x and y: x = 2y + 3.",
          why:
            "The inverse must take the old output x and return the old input y, so the two roles are exchanged.",
        },
        {
          move: "Solve for y: x − 3 = 2y, so y = (x − 3)/2.",
          why:
            "Rearranging isolates the new output and gives the inverse rule.",
        },
        {
          move: "Check f(f⁻¹(x)) = 2((x − 3)/2) + 3 = x and f⁻¹(f(x)) = ((2x + 3) − 3)/2 = x.",
          why:
            "Both compositions must return the original input. A reciprocal would fail this test.",
        },
      ],
      answer: "f⁻¹(x) = (x − 3)/2",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "f(x + 1) means f(x) + 1.",
      whyItFails:
        "The bracket is the input, so f(x + 1) replaces every x with x + 1. For f(x) = 2x + 3, f(x + 1) = 2(x + 1) + 3 = 2x + 5, while f(x) + 1 = 2x + 4. The two differ by 1 for every x, so they are different functions.",
      correction:
        "Substitute the whole bracket into the rule, then expand. Check with a number: if x = 1, f(2) = 7, not f(1) + 1 = 5 + 1 = 6.",
      contrast: {
        wrong: "f(x + 1) = f(x) + 1 = 2x + 4",
        right: "f(x + 1) = 2(x + 1) + 3 = 2x + 5",
      },
    },
    {
      id: "m2",
      belief: "g(f(x)) and f(g(x)) are the same because both use f and g.",
      whyItFails:
        "Composition is ordered. With f(x) = 2x + 3 and g(x) = x², g(f(2)) = g(7) = 49, while f(g(2)) = f(4) = 11. The inner function's output is the outer function's input, so swapping the order changes the process and usually the result.",
      correction:
        "Read composition from the inside out and name each stage. If the question asks for g(f(x)), form g with f(x) in its input slot; do not reverse the order.",
      contrast: {
        wrong: "g(f(x)) = f(g(x))",
        right: "g(f(x)) applies f first, then g; f(g(x)) applies g first, then f",
      },
    },
    {
      id: "m3",
      belief: "f⁻¹(x) means 1/f(x).",
      whyItFails:
        "The inverse undoes the function, while the reciprocal divides 1 by its output. For f(x) = 2x + 3, f⁻¹(11) = 4 because f(4) = 11, but 1/f(11) = 1/25. The reciprocal does not return the input.",
      correction:
        "Find the inverse by writing y = f(x), swapping x and y, and solving for y. Verify with f(f⁻¹(x)) = x. The notation f⁻¹ is an inverse process, not a power.",
      contrast: {
        wrong: "f⁻¹(x) = 1/(2x + 3)",
        right: "f⁻¹(x) = (x − 3)/2",
      },
    },
    {
      id: "m4",
      belief: "Every function has an inverse on its whole domain.",
      whyItFails:
        "An inverse must return exactly one input for each output. f(x) = x² gives f(2) = 4 and f(−2) = 4, so undoing 4 would have to return both 2 and −2. That is not one output, so the inverse is not a function on the full domain.",
      correction:
        "Restrict the domain until each output has one input. For x², use x ≥ 0 and the inverse is √x. A function with an inverse on its domain is one-to-one there.",
      contrast: {
        wrong: "x² has inverse ±√x everywhere",
        right: "x² on x ≥ 0 has inverse √x; the full-domain inverse is not a function",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "For f(x) = 3x − 2, find f(4) and f(−2).",
      hint: "Replace x with each input separately. Keep the sign on −2 inside the bracket.",
      answer: "f(4) = 10 and f(−2) = −8",
      feedback: {
        correct:
          "f(4) = 3(4) − 2 = 10 and f(−2) = 3(−2) − 2 = −6 − 2 = −8. Each input is substituted as a whole.",
        incorrect:
          "Substitute the whole input: 3(4) − 2 = 10 for 4, and 3(−2) − 2 = −8 for −2. The negative sign belongs to the input.",
      },
    },
    {
      id: "p2",
      prompt: "For f(x) = x² + 1 and g(x) = 2x, find g(f(3)) and f(g(3)).",
      hint: "Work from the inside out. f(3) is the input to g; g(3) is the input to f.",
      answer: "g(f(3)) = 20 and f(g(3)) = 37",
      feedback: {
        correct:
          "f(3) = 10, so g(10) = 20. g(3) = 6, so f(6) = 37. The different results show the order matters.",
        incorrect:
          "Start with the inner function: f(3) = 3² + 1 = 10, then g(10) = 20. For the other order, g(3) = 6, then f(6) = 37.",
      },
    },
    {
      id: "p3",
      prompt: "Find the inverse of f(x) = 5x − 4, then check f⁻¹(11).",
      hint: "Write y = 5x − 4, swap x and y, and solve for y. Then substitute 11.",
      answer: "f⁻¹(x) = (x + 4)/5 and f⁻¹(11) = 3",
      feedback: {
        correct:
          "Swapping gives x = 5y − 4, so y = (x + 4)/5. Then f⁻¹(11) = 15/5 = 3, and f(3) = 11 confirms it.",
        incorrect:
          "The inverse is y = (x + 4)/5, not 1/(5x − 4). Substitute 11 to get 3, and check that f(3) = 11.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "For f(x) = 4x − 1, find f(3) and f(−1).",
      modelAnswer: "f(3) = 11 and f(−1) = −5",
      marking: [
        "Substitutes 3 to obtain 12 − 1 = 11.",
        "Substitutes −1 to obtain −4 − 1 = −5.",
      ],
      check: { accepted: ["f(3) = 11 and f(−1) = −5", "11 and −5", "f(3)=11, f(-1)=-5"] },
    },
    {
      id: "a2",
      kind: "constructed-response",
      prompt:
        "A learner claims that for f(x) = x², f(x + 2) = f(x) + 2. Show by expanding both expressions that the claim is false, and explain what the learner has misunderstood about function notation.",
      modelAnswer:
        "f(x + 2) = (x + 2)² = x² + 4x + 4, while f(x) + 2 = x² + 2. These are not equal: their difference is 4x + 2, which is not zero for every x. The learner treated the bracket as f(x) plus 2 rather than as the whole input. The function squares the entire input, so the +2 is squared along with x and produces the cross term 4x as well as the constant 4.",
      marking: [
        "Expands f(x + 2) to x² + 4x + 4.",
        "Writes f(x) + 2 as x² + 2 and compares the two.",
        "Explains that the bracket is the whole input, not an addition after applying f.",
      ],
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "State the domain of each function: (a) 1/(x − 5), (b) √(x + 3). Explain each restriction.",
      modelAnswer:
        "(a) x ≠ 5, because the denominator cannot be zero. (b) x ≥ −3, because the expression under the square root cannot be negative.",
      marking: [
        "Excludes x = 5 and explains the zero denominator.",
        "Requires x + 3 ≥ 0 and states x ≥ −3.",
      ],
      check: {
        accepted: [
          "(a) x ≠ 5, because the denominator cannot be zero. (b) x ≥ −3, because the expression under the square root cannot be negative.",
          "x ≠ 5; x ≥ −3",
          "(a) x ≠ 5 (b) x ≥ −3",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "The conversion from a Fahrenheit temperature F to Celsius is C = (5/9)(F − 32). Treat this as a function C(F). Find its inverse, explain what the inverse does, and show that composing the two functions returns the original temperature. State one practical domain restriction.",
      whyItTransfers:
        "The learner must read a formula as a function, reverse it by swapping input and output, and interpret the inverse in the real direction of the conversion. The composition check is not a symbol exercise: it proves the two formulas undo each other. The domain question asks the learner to notice that a temperature below absolute zero is not physically admissible, which is a restriction the algebra alone does not supply.",
      answer:
        "Write C = (5/9)(F − 32). Swap C and F: F = (5/9)(C − 32) is the swapped equation, so solving for the new F gives F = (9/5)C + 32. The inverse takes a Celsius temperature and returns the Fahrenheit temperature. Compose: C(F(C)) = (5/9)((9/5)C + 32 − 32) = C, and F(C(F)) = (9/5)((5/9)(F − 32)) + 32 = F. A practical domain is F ≥ −459.67, the Fahrenheit equivalent of absolute zero; below that the conversion formula still computes a number but does not describe a physical temperature.",
      marking: [
        "Swaps the variables and solves to obtain F = (9/5)C + 32.",
        "Explains that the inverse converts Celsius back to Fahrenheit.",
        "Composes in both orders and shows each returns the original input.",
        "States a physical domain restriction such as F ≥ −459.67.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "For f(x) = x² − 3, find f(2) and f(−2).",
      answer: "f(2) = 4 − 3 = 1 and f(−2) = 4 − 3 = 1. The two different inputs share an output.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Find the inverse of y = 3x + 1.",
      answer:
        "Swap x and y: x = 3y + 1. Then y = (x − 1)/3, so f⁻¹(x) = (x − 1)/3. Check f(f⁻¹(x)) = x.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why does f(x) = x² not have an inverse function on the domain of all real numbers?",
      answer:
        "It is not one-to-one: f(2) = 4 and f(−2) = 4, so an inverse would have to return two inputs for the output 4. Restricting the domain to x ≥ 0 makes the inverse √x a function.",
      when: "month-later",
    },
  ],

  summary: [
    "f(input) replaces every x in the rule with the whole input, so f(x + 1) is not f(x) + 1.",
    "A composite function applies the inner function first; g(f(x)) and f(g(x)) are generally different.",
    "An inverse undoes the function: swap x and y, solve for y, and verify with both compositions.",
    "f⁻¹(x) is not 1/f(x); the inverse process and the reciprocal are different operations.",
    "The domain lists allowed inputs and the range lists possible outputs; a denominator cannot be zero and a square root cannot be negative.",
    "A function has an inverse on its domain only when it is one-to-one there; x² needs a restricted domain.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Function notation is read as “f of the input” rather than as letters multiplied together, and each composition is read as a sequence: apply the inner function, then the outer one.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each substitution is shown on its own line with the input named before the rule is applied, so the bracket and the expansion are not buried in a dense paragraph of symbols.",
    },
    {
      need: "cognitive",
      alternative:
        "The lesson uses one consistent three-stage pattern for every composite: name the inner output, feed it to the outer function, then compare the order. The same pattern is repeated in the worked examples and practice.",
    },
    {
      need: "colour-vision",
      alternative:
        "The vertical and horizontal line tests are stated in words as well as drawn, so the conclusion does not depend on distinguishing two line colours.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed; no graphing, dragging or interactive manipulation is required.",
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
        "All teaching prose, examples, practice, assessment and the temperature-conversion transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-mathematics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE mathematics subject content for function notation, composite functions and inverse functions.",
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
