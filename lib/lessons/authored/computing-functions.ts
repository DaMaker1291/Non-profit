import type { AuthoredLesson } from "../../lesson-contract";

// A FUNCTION IS A CONTRACT BETWEEN A CALLER AND A BODY.
//
// The lesson makes the call the object of study: arguments bind to parameters,
// the body runs in a local scope, and return is how a value travels back. The
// code lab starts with a function that prints instead of returning, because
// that produces a visible `None` in the caller and makes the distinction
// impossible to hand-wave.
export const COMPUTING_FUNCTIONS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "functions-code",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference:
      "GCSE Computer Science, programming: functions, parameters and arguments, return values, local scope and decomposition",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Define a function with parameters and a return value, and trace the values bound during a call.",
      evidence:
        "The learner traces total_area(3, 4, 5) through area(3, 4) to 60 and states which value each parameter holds.",
    },
    {
      statement:
        "Distinguish printing a value inside a function from returning it to the caller.",
      evidence:
        "The learner repairs a function that prints 60 and then returns None, and explains why the caller cannot use the printed value.",
    },
    {
      statement:
        "Explain local scope and decompose a repeated calculation into smaller named functions.",
      evidence:
        "The learner explains why a variable created inside a function is unavailable outside it, then writes a helper function used by a larger calculation.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["variables", "conditionals"],
    check: [
      {
        id: "d1",
        question: "What does the assignment total = total + 5 do?",
        answer:
          "It reads the old value of total, adds five and stores the result back under the same name. The right-hand side is evaluated before the name is updated.",
        targets: ["variables"],
      },
      {
        id: "d2",
        question: "When does the body of an if statement run?",
        answer:
          "Only when its condition evaluates to True. If the condition is False, the indented block is skipped.",
        targets: ["conditionals"],
      },
    ],
  },

  introduction: {
    hook:
      "A school calculates the cost of a trip for every pupil. The same three steps happen each time: multiply the ticket price by the number of pupils, add the coach cost, then subtract any deposit already paid. Copying those steps into every button and every report guarantees that one copy will eventually use a different rule. A function gives the calculation one name, one place to edit and one result to test.",
    why:
      "A function is a named block of code that runs when it is called. Its parameters are names for the inputs, and its arguments are the actual values supplied at the call. The body can create local variables, make decisions and call other functions. A return statement sends one value back to the caller and ends the function immediately. Printing is different: it displays a value for a human but does not hand it back to the program. Scope decides where a name exists, so a variable made inside a function is not available in the caller unless it is returned or stored somewhere the caller can read.",
  },

  explanation: [
    {
      heading: "A definition describes a job; a call performs it",
      paragraphs: [
        "The def keyword defines a function. The indented body does not run when Python reads the definition; it runs when a later line calls the function by name with parentheses. area(3, 4) is a call: Python binds 3 to width and 4 to height, executes the body, and uses the returned value in the expression where the call appeared. A definition with no call produces no calculation and no output.",
        "A function should have one clear job. A name such as total_area says what the caller gets back; a name such as do_stuff forces the reader to inspect the body. The name is not checked by Python, but it is checked by every person who later has to change the program. Small functions with descriptive names also make tests specific: area can be tested independently of the trip calculation that uses it.",
      ],
    },
    {
      heading: "Arguments bind to parameters in order",
      paragraphs: [
        "Parameters are the names in the definition; arguments are the values in the call. In def area(width, height), width and height are parameters. In area(3, 4), 3 is bound to width and 4 to height. The order matters when the values have different meanings: a call that swaps them may raise no error and still produce a plausible but wrong answer.",
        "A function can return a value with return expression. The expression is evaluated, the function stops, and that value becomes the result of the call. Code after a return in the same branch does not run. A function with no explicit return returns None, which is a real value and can travel silently into later arithmetic. The caller must know what type and meaning it is receiving.",
      ],
    },
    {
      heading: "A local name exists inside the call, not outside it",
      paragraphs: [
        "Variables assigned inside a function are local to that call. A local named subtotal is created when the function runs and disappears when it returns. The caller cannot read subtotal afterwards; doing so raises NameError. This is useful: the function can use a short internal name without colliding with the caller's variables, and a bug in one function is less likely to leak into another.",
        "Parameters are local too. Rebinding a parameter inside the function does not change the caller's variable, because the parameter holds a value supplied to the call. For mutable objects such as lists, changing the object's contents is different from rebinding the name; that distinction becomes important later. In this lesson, keep the rule concrete: return the value the caller needs instead of expecting an internal name to survive.",
      ],
    },
    {
      heading: "Decomposition makes a program testable one piece at a time",
      paragraphs: [
        "Decomposition means splitting a problem into named jobs. A trip cost can become ticket_cost, coach_cost and amount_due. Each function has a small contract: its parameters describe what it needs, and its return value describes what it produces. A larger function composes them. When the total is wrong, each piece can be called and checked separately instead of searching a long block of code.",
        "Trace a call from the outside in. Write the arguments, bind them to the parameters, evaluate the body, then replace the call with its return value. For total_area(3, 4, 5), first area(3, 4) returns 12, then 12 × 5 returns 60. If a function prints instead of returning, the trace shows the printed line but the call's value is None, which is exactly the defect the caller will experience.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This function is meant to return a discounted price, but it prints the answer and returns nothing. Run it and notice the extra None: the caller receives None, not the number that appeared on screen.",
      notation: `def apply_discount(price, percent):
    print(price - price * percent / 100)

print(apply_discount(80, 25))`,
      caption:
        "The screen shows 60.0 and then None. Printing is output for a person; returning is the value the program can use.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Trace a nested call. The inner function runs first and its return value replaces the inner call in the outer expression.",
      notation:
        "total_area(3, 4, 5) → bind width = 3, height = 4, count = 5 · area(3, 4) → 3 × 4 = 12 · 12 × count(5) = 60 · total_area returns 60",
      caption:
        "The outer function does not need to know how area works; it needs the contract area returns a number.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "A function contract is tested at its boundaries. These calls check a normal value, a zero, and a value that should expose a missing return.",
      notation:
        "apply_discount(80, 25) = 60.0 · apply_discount(80, 0) = 80.0 · apply_discount(80, 100) = 0.0 · a function that prints instead of returning gives None",
      caption:
        "Testing only the normal case would miss both the zero boundary and the difference between a printed value and a returned one.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "The function creates subtotal locally, then the caller tries to read it. The name does not exist outside the call, so Python raises NameError.",
      notation: `def total(prices):
    subtotal = 0
    for price in prices:
        subtotal = subtotal + price
    return subtotal

print(total([4, 6]))  # 10
print(subtotal)       # NameError`,
      caption:
        "Returning subtotal is what makes the value available. The caller should store the return value in a name it owns.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace this program and state its output:\ndef add_ten(n):\n    return n + 10\n\nx = 3\ny = add_ten(x)\nprint(add_ten(y))",
      steps: [
        {
          move: "x is assigned 3 before any function is called.",
          why:
            "A function call can only use values that exist at the moment of the call. The assignment establishes the argument for the first call.",
        },
        {
          move: "add_ten(x) binds n = 3, evaluates 3 + 10 and returns 13; y becomes 13.",
          why:
            "The return value replaces the call in the assignment. The local n disappears after the call, but its returned value survives in y.",
        },
        {
          move: "add_ten(y) binds n = 13, evaluates 13 + 10 and returns 23.",
          why:
            "Each call creates a fresh local binding. The second call does not reuse the first call's n; it receives y's value, 13.",
        },
        {
          move: "print receives 23 and displays it.",
          why:
            "The outer call returns a value to print. If add_ten had only printed, print would receive None and display None.",
        },
      ],
      answer:
        "The output is 23. The first call returns 13 to y, and the second call adds ten to 13.",
    },
    {
      id: "w2",
      prompt:
        "This program is meant to print 15, but it prints 15 and then None:\ndef add_fee(price):\n    print(price + 5)\n\nprint(add_fee(10))\nExplain the two outputs and repair the function.",
      steps: [
        {
          move: "Identify the first output as the function's print.",
          why:
            "The function displays the price with the fee added while it is running. That line is output, not a value handed back to the caller.",
        },
        {
          move: "Identify the second output as the caller printing the function's return value.",
          why:
            "A function with no return statement returns None. The outer print therefore displays None, even though the number appeared above it.",
        },
        {
          move: "Replace print inside the function with return.",
          why:
            "The caller needs the number for further work, not only for display. Returning it makes the call evaluate to 15.",
        },
        {
          move: "Keep one print in the caller, then check the output is only 15.",
          why:
            "The caller decides whether to display the result. Mixing display inside the function with display outside it creates two outputs for one calculation.",
        },
      ],
      answer:
        "The function prints 15 and returns None, so the caller prints None. Change the inner line to return price + 5; the outer print then displays 15 once.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Printing a value inside a function is the same as returning it.",
      whyItFails:
        "Print sends characters to the screen for a human. Return sends a value back to the caller and ends the function. A caller that tries to calculate with a printed value receives None, because printing does not become the call's result.",
      correction:
        "Ask who needs the value. If the caller will use it, return it. If a human only needs to see it, the caller can print the returned value.",
      contrast: {
        wrong: "the function prints 60, so the caller can multiply it",
        right: "the function returns 60; the caller stores or prints that returned value",
      },
    },
    {
      id: "m2",
      belief: "A function runs as soon as Python reads its def line.",
      whyItFails:
        "A definition creates a name for a block of code; it does not execute the body. The body runs when a call supplies arguments and Python enters the function. A program with a definition and no call does no work beyond creating the function.",
      correction:
        "Separate definition from invocation. Read def as 'here is the recipe' and read name(...) as 'make it now with these inputs'.",
      contrast: {
        wrong: "def area(width, height): is the calculation",
        right: "area(3, 4) is the call that performs the calculation",
      },
    },
    {
      id: "m3",
      belief: "A variable created inside a function can be read anywhere after the function runs.",
      whyItFails:
        "Local variables belong to one call. When the function returns, its local names are gone. The caller cannot read them, even if the function was called on the previous line. The returned value is the supported way to pass a result out.",
      correction:
        "Return the value and store it in a caller-owned name. If a name must be shared, pass it in as a parameter or use an explicit structure rather than relying on a local leaking out.",
      contrast: {
        wrong: "print(subtotal) works because total() created subtotal",
        right: "result = total(prices); print(result) uses the returned value",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "What is printed?\ndef add_two(n):\n    return n + 2\n\nprint(add_two(add_two(3)))",
      hint: "Evaluate the inner call first. Its return value becomes the argument to the outer call.",
      answer:
        "The inner add_two(3) returns 5, then add_two(5) returns 7, so the program prints 7.",
      feedback: {
        correct:
          "You traced from the inner call outward and replaced each call with its return value.",
        incorrect:
          "The inner call is not skipped. add_two(3) returns 5, and that 5 is passed to the outer call.",
      },
    },
    {
      id: "p2",
      prompt:
        "What is printed, and why?\ndef add_five(n):\n    n + 5\n\nprint(add_five(10))",
      hint: "Trace the function to its end. What value does a function return when it has no return statement?",
      answer:
        "It prints None. The function calculates 10 + 5 but never returns it, so the call's value is None; the outer print displays that None.",
      feedback: {
        correct:
          "You noticed the missing return rather than assuming the expression's value escapes the function.",
        incorrect:
          "The expression's result is not automatically returned. Without return, the function returns None.",
      },
    },
    {
      id: "p3",
      prompt:
        "This function is called with the arguments reversed from the intended calculation:\ndef subtract(first, second):\n    return first - second\n\nprint(subtract(10, 4))\nWhat does it print, what would subtract(4, 10) print, and which call gives 4 - 10?",
      hint: "Bind the first argument to first and the second to second. Do not reorder the parameters to fit this one call.",
      answer:
        "It prints 6, because first = 10 and second = 4. subtract(4, 10) prints -6, which is 4 - 10. The argument order must match the parameter meanings.",
      feedback: {
        correct:
          "You bound the arguments in order and separated the intended calculation from the call that produced it.",
        incorrect:
          "The call subtract(10, 4) means first 10 and second 4, so it is 6. The call for 4 - 10 is subtract(4, 10), which prints -6.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Repair this function so it returns the discounted price instead of printing it. Run the program; it should print only 60.0.",
      modelAnswer:
        "def apply_discount(price, percent):\n    return price - price * percent / 100\n\nprint(apply_discount(80, 25))",
      code: {
        starterCode:
          "def apply_discount(price, percent):\n    print(price - price * percent / 100)\n\nprint(apply_discount(80, 25))",
        timeoutMs: 12000,
        tests: [{ name: "the function returns 60.0 and prints it once", expectedStdout: "60.0" }],
      },
      marking: [
        "Replaces print inside the function with return.",
        "Returns the calculated value rather than a string or a stored global.",
        "Leaves one print in the caller, so the output is 60.0 once rather than 60.0 followed by None.",
        "Explains that the caller can now use the returned value in another calculation.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is printed?\ndef greet(name):\n    return \"Hello, \" + name\n\nmessage = greet(\"Ada\")\nprint(message)\nprint(greet(\"Lin\"))",
      modelAnswer: "Hello, Ada\nHello, Lin",
      marking: [
        "Binds Ada to name in the first call and stores the returned string in message.",
        "Calls greet again with Lin for the second line; the two calls have separate local bindings.",
      ],
      check: { accepted: ["Hello, Ada\nHello, Lin", "Hello, Ada Hello, Lin"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Explain why a variable assigned inside a function cannot be read by the caller after the function returns. What should the function do instead?",
      modelAnswer:
        "The variable is local to that call and stops existing when the function returns, so the caller has no name to read. The function should return the value; the caller can then store that return value in a variable it owns.",
      marking: [
        "Names local scope or explains that the name belongs to the call.",
        "States that the local name is unavailable after return.",
        "Recommends returning the value and storing it in the caller.",
      ],
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "Complete the function so it returns the area of a rectangle:\ndef rectangle_area(width, height):\n    # your line here\n\nWhat should rectangle_area(6, 4) return?",
      modelAnswer: "24",
      marking: [
        "Uses a return statement, not print.",
        "Returns width * height, giving 24 for 6 and 4.",
      ],
      check: { accepted: ["24", "twenty four", "twenty-four"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A cinema charges £8 per child and £12 per adult, then adds a £5 booking fee. Write a function total_cost(children, adults) that returns the total, using at least one helper function. Explain how your decomposition makes the booking fee easy to change later.",
      whyItTransfers:
        "The lesson repairs a single discount function. Here the learner must compose two prices and a fixed fee, choose a helper boundary, and explain a maintenance consequence rather than only return a number. The unfamiliar part is the design of the decomposition, not the arithmetic.",
      answer:
        "def ticket_cost(children, adults):\n    return children * 8 + adults * 12\n\ndef total_cost(children, adults):\n    return ticket_cost(children, adults) + 5\n\nprint(total_cost(2, 3))  # 57\n\nThe booking fee appears once, in total_cost. Changing it to £6 requires one edit and leaves ticket_cost untouched, so every caller gets the new rule without copies drifting apart.",
      marking: [
        "Defines a helper that returns a ticket subtotal, with parameters for both groups.",
        "Defines total_cost that calls the helper and adds the booking fee.",
        "Returns values rather than printing inside the helper.",
        "Explains that one named fee removes duplicated constants and makes the change local.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between a parameter and an argument?",
      answer:
        "A parameter is the name in the function definition; an argument is the actual value supplied by a call.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does a function that only prints return None?",
      answer:
        "Printing displays a value but does not supply a return value. Without an explicit return, Python returns None.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does local scope mean for a variable assigned inside a function?",
      answer:
        "It exists only during that call. The caller cannot read it after the function returns; the function must return any value the caller needs.",
      when: "month-later",
    },
  ],

  summary: [
    "A function is defined once and called with arguments; the arguments bind to parameters in order.",
    "return hands a value back to the caller, while print only displays it. A function without return gives None.",
    "Variables assigned inside a function are local to that call and cannot be read by the caller without being returned.",
    "Decomposition gives each calculation a named, testable job; the caller composes the returned values.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every code block is short enough to be read line by line, and the trace names the parameter, argument and returned value in words.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson uses one statement per line and repeats the function name at each call, so the reader does not have to track an abbreviation.",
    },
    {
      need: "colour-vision",
      alternative:
        "Return values, printed output and local names are labelled in text; no step depends on syntax highlighting or colour.",
    },
    {
      need: "motor",
      alternative:
        "The code lab requires typing, not dragging or timed clicking; the starter program can be copied and run again after a timeout.",
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
        "All explanations, examples, practice, assessments and code in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-computing-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE computer science subject content for programming and decomposition.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-08",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
