import type { AuthoredLesson } from "../../lesson-contract";

// BINARY DATA IS NOT A LIST OF UNITS. It is the first place a learner has to
// separate a PATTERN from the VALUE it represents: 1000 is not one thousand,
// and the same byte can be a number, a character or a colour channel depending
// on the encoding. The lesson makes place value and overflow the objects of
// study, then uses hexadecimal only as a readable shorthand for four bits.
export const COMPUTING_BINARY: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "binary-data",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference:
      "GCSE Computer Science, data representation: binary and denary conversion, binary addition, byte range, hexadecimal and character encoding",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content; no specification text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Convert unsigned whole numbers between 8-bit binary and denary using place values, and check the result against the original value.",
      evidence:
        "The learner writes the powers of two above the bit positions and produces 156 = 1001 1100, not a pattern copied from a table.",
    },
    {
      statement:
        "Add two 8-bit binary patterns with carries, and explain why a result that needs a ninth bit does not fit in one byte.",
      evidence:
        "The learner shows each carry, distinguishes the four-bit result from the carry out, and states that eight bits hold 256 patterns rather than every whole number.",
    },
    {
      statement:
        "Explain why hexadecimal is used for human-readable binary and why a byte has two hexadecimal digits.",
      evidence:
        "The learner groups bits into nibbles, converts 1001 1100 to 9C, and states that the computer stores bits while hexadecimal is a notation for people.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["number-bases"],
    check: [
      {
        id: "d1",
        question: "In the denary number 452, what does the 4 contribute?",
        answer:
          "It contributes four hundreds, because its position is the hundreds column. The value of a digit depends on its position, not only on the digit itself.",
        targets: ["number-bases"],
      },
      {
        id: "d2",
        question: "What is 10³ as an ordinary denary number?",
        answer:
          "10³ = 10 × 10 × 10 = 1,000. In a base-10 positional system the third place to the left of the units is the thousands place.",
        targets: ["number-bases"],
      },
    ],
  },

  introduction: {
    hook:
      "A photograph on a phone is not stored as a tiny picture. It is stored as a very long pattern of ones and zeros: each pixel contributes numbers for red, green and blue, and each of those numbers is itself a pattern of bits. A text message works the same way. The computer is not storing the letter or the colour directly; it is storing patterns and a rule that says what those patterns mean.",
    why:
      "A bit is a value with exactly two possibilities, written 0 and 1. Eight bits make a byte, and a byte has 256 possible patterns. Binary is a positional notation: the rightmost bit is worth 1, the next is worth 2, then 4, 8 and so on, so the pattern 1000 is eight, not one thousand. Hexadecimal groups four bits into one digit, which is why a byte is written with two hexadecimal digits. Encoding adds the meaning: the same eight bits can be the number 65, the character A, or one channel of a colour. This lesson keeps the pattern, the value and the meaning separate, because confusing them is the main source of errors in data representation.",
  },

  explanation: [
    {
      heading: "A bit is one choice; a byte is eight of them",
      paragraphs: [
        "A bit has two states, 0 and 1. One bit can therefore distinguish two possibilities, two bits can distinguish four, and n bits can distinguish 2ⁿ patterns. A byte is eight bits, so it has 2⁸ = 256 patterns. Those patterns are normally used for the whole numbers 0 to 255, which is 256 values because zero is one of them.",
        "The same pattern can mean different things. The byte 01000001 is the denary number 65, and it is also the ASCII code for the capital letter A. A red pixel channel with the value 255 is a bright red contribution; the same byte could be a small integer in a calculation. The bits do not carry their meaning inside them. A convention, called an encoding, says how to interpret them.",
      ],
    },
    {
      heading: "Place value turns a bit pattern into a number",
      paragraphs: [
        "Write the place values above an eight-bit pattern from left to right: 128, 64, 32, 16, 8, 4, 2, 1. Each place is a power of two. Multiply each bit by its place value and add the results. For 1001 1100, the ones sit in the 128, 16, 8 and 4 columns, so the value is 128 + 16 + 8 + 4 = 156. The spaces between nibbles are only for readability; they do not change the value.",
        "To convert in the other direction, subtract the largest place value that fits, write a 1 there, and continue with the remainder. For 202, 128 fits and leaves 74; 64 fits and leaves 10; 8 fits and leaves 2; 2 fits and leaves 0. The remaining places receive 0, giving 1100 1010. Always add the selected place values back at the end. That check catches a bit placed in the wrong column, which is the most common conversion error.",
      ],
    },
    {
      heading: "Addition carries left, and a fixed width can overflow",
      paragraphs: [
        "Binary addition uses the same column method as denary. Starting at the right, 0 + 0 = 0 and 1 + 0 = 1. When 1 + 1 = 10 in binary, write 0 in the current column and carry 1 to the next column to the left. Three ones in a column produce 11: write 1 and carry 1. The carry is not an extra number added at the end; it is part of the next column's sum.",
        "An eight-bit register has only eight columns. Adding 1111 1111 (255) and 0000 0001 (1) produces a 1 in a ninth column and zeros in the original eight. If the carry out is discarded, the stored byte reads 0000 0000, which is not the arithmetic answer. That is overflow: the true result needs more bits than the storage provides. A program must detect it, use a wider type, or reject the value rather than silently treating the wrapped result as correct.",
      ],
    },
    {
      heading: "Hexadecimal is shorthand, and encoding supplies meaning",
      paragraphs: [
        "Four bits have 16 possible patterns, so one hexadecimal digit can stand for exactly one nibble. The digits are 0 to 9 and A to F, where A is ten and F is fifteen. A byte is two nibbles, so it is always two hexadecimal digits: 1001 1100 becomes 9C. Hexadecimal is not what the processor stores; the hardware stores bit states. Hex is a compact notation that makes long binary patterns easier for a person to read, copy and compare.",
        "Encoding is a separate decision. ASCII maps a limited set of characters to numbers, while Unicode provides a much larger set, including characters from many writing systems and emoji. An image encoder might store three bytes per pixel for red, green and blue, and a sound encoder stores samples of amplitude at regular time intervals. In every case the bits are the same kind of thing; the encoding is the rule that turns them into a character, a colour or a sound. Changing the encoding can change the meaning without changing a single bit.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This function converts a whole number from 0 to 255 into an eight-bit string. It checks the range first, then tests each place value from 128 down to 1, subtracting a place whenever it fits. The returned string shows leading zeros, because an eight-bit byte always has eight positions.",
      notation: `def to_binary(value):
    if value < 0 or value > 255:
        raise ValueError("one byte holds 0 to 255")
    bits = ""
    for place in (128, 64, 32, 16, 8, 4, 2, 1):
        if value >= place:
            bits = bits + "1"
            value = value - place
        else:
            bits = bits + "0"
    return bits

print(to_binary(156))`,
      caption:
        "Run it with 156, 0 and 255. The guard is part of the representation: a function that silently accepts 256 is not converting to one byte.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Trace the function with value = 156. The place values that fit are 128, 16, 8 and 4; each subtraction leaves a smaller remainder, and every other place receives a zero.",
      notation:
        "place 128: 156 >= 128 -> bit 1, remainder 28 · place 64: 28 < 64 -> 0, remainder 28 · place 32: 28 < 32 -> 0, remainder 28 · place 16: 28 >= 16 -> 1, remainder 12 · place 8: 12 >= 8 -> 1, remainder 4 · place 4: 4 >= 4 -> 1, remainder 0 · place 2: 0 < 2 -> 0 · place 1: 0 < 1 -> 0 · result = 10011100",
      caption:
        "The trace records the remainder after each decision, so the final bits can be checked against the arithmetic rather than trusted as a string.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "These tests cover both ends of the byte range, a normal value and the first value that cannot fit. The boundary cases are the ones that expose an off-by-one error or a missing range check.",
      notation:
        'to_binary(0) = "00000000" · to_binary(156) = "10011100" · to_binary(255) = "11111111" · to_binary(256) raises ValueError',
      caption:
        "Testing only 156 would pass even if the function had no leading zeros and accepted values above 255.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "A learner wants to display the byte 9C but prints 0x9c. Python's hex function adds a prefix and uses lower-case letters. Formatting the value with two upper-case hexadecimal digits gives the byte-sized notation the learner intended.",
      notation: `value = 156
print(hex(value))            # 0x9c
print(format(value, "02X"))  # 9C`,
      caption:
        "The prefix and case are notation choices, not a different value. The repair is to choose the display format, not to change the number.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt: "Convert the denary number 156 into an eight-bit binary pattern. Show how the place values are used.",
      steps: [
        {
          move: "Write the eight place values above the columns: 128, 64, 32, 16, 8, 4, 2, 1.",
          why:
            "Binary is positional. The leftmost bit is worth 128 in an eight-bit byte, not 10 or 100 as it would be in denary, so the columns must be labelled before any bit is chosen.",
        },
        {
          move:
            "The largest place that fits is 128, so write 1 there and subtract: 156 − 128 = 28. The next two places, 64 and 32, are larger than 28, so write 0 and 0.",
          why:
            "A place value is either used once or not at all. Subtracting the used place keeps the remainder as the value still to be represented.",
        },
        {
          move:
            "16 fits into 28, leaving 12; 8 fits, leaving 4; 4 fits, leaving 0. The remaining places, 2 and 1, receive 0.",
          why:
            "Each subtraction removes the part of the value already represented by a 1. When the remainder reaches zero, every remaining place must be 0.",
        },
        {
          move:
            "Read the bits left to right: 1001 1100. Check: 128 + 16 + 8 + 4 = 156.",
          why:
            "Adding the selected place values back is an independent check. It catches a bit written in the wrong column, even if the pattern looks plausible.",
        },
      ],
      answer:
        "156 = 1001 1100. The ones are in the 128, 16, 8 and 4 columns; the other four bits are zero.",
    },
    {
      id: "w2",
      prompt:
        "Add the two eight-bit patterns 1011 0110 and 0010 1101. Show the carries and state whether the result overflows one byte.",
      steps: [
        {
          move:
            "Read the values as a check: 1011 0110 is 182, and 0010 1101 is 45. The true sum is 227, which is below 256, so an eight-bit result is possible.",
          why:
            "A denary estimate tells you whether a carry out should exist. Without it, a missing carry can look like a valid but wrong byte.",
        },
        {
          move:
            "Add the right nibble: 0110 (6) + 1101 (13) = 19, which is 1 0011 in binary. Write 0011 and carry 1 into the next nibble.",
          why:
            "Nineteen needs five bits, but only four belong to this nibble. The fifth bit is the carry into the next column, not a digit that can be dropped.",
        },
        {
          move:
            "Add the left nibble, including the carry: 1011 (11) + 0010 (2) + 1 = 14, which is 1110. There is no carry out of the eighth bit.",
          why:
            "The carry from the lower nibble is part of the next column's sum. Leaving it out produces 1101, which is 13 instead of 14 and gives the wrong final byte.",
        },
        {
          move:
            "Combine the nibbles: 1110 0011. In denary this is 128 + 64 + 32 + 2 + 1 = 227, matching 182 + 45.",
          why:
            "Checking both the denary sum and the place-value sum verifies the result. No ninth bit was produced, so the byte has not overflowed.",
        },
      ],
      answer:
        "1011 0110 + 0010 1101 = 1110 0011, which is 227. The right nibble produced a carry of 1; the left nibble used it and produced no further carry.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "The binary pattern 10 means ten, because the digits are read as a decimal number.",
      whyItFails:
        "The digits in a positional system are multiplied by the place values of that base. In binary the places are powers of two, so 10 means one 2 and zero 1s, which is two. In denary the same two digits mean ten because the place values are powers of ten.",
      correction:
        "Label the columns before reading a pattern. In an eight-bit value, 0000 0010 is two and 0000 1010 is ten; the written digits alone do not tell you the value.",
      contrast: {
        wrong: "10 in binary is ten because the digits are 1 and 0",
        right: "10 in binary is 2, because the left digit is worth 2 and the right is worth 1",
      },
    },
    {
      id: "m2",
      belief: "Hexadecimal is the language the computer uses internally, so a program stores hex digits.",
      whyItFails:
        "The hardware stores bit states. Hexadecimal is a base-16 notation that groups four bits into one digit, which makes a byte readable as two characters instead of eight. The processor does not need hex; a person reads it.",
      correction:
        "Treat hexadecimal as a display and editing notation. Convert it back to nibbles when you need to see the actual bits: 9C is 1001 1100, not a separate kind of storage.",
      contrast: {
        wrong: "The byte is stored as the characters 9C",
        right: "The byte is stored as eight bits; 9C is a compact way to write those bits",
      },
    },
    {
      id: "m3",
      belief: "An eight-bit byte can store 256, because 2⁸ = 256.",
      whyItFails:
        "256 is the number of distinct patterns, not the largest value. The patterns run from 0000 0000 (0) to 1111 1111 (255). Adding one to 255 requires a ninth bit, so 256 cannot be represented in one byte.",
      correction:
        "Count the patterns and the endpoints separately: n bits give 2ⁿ patterns and, for unsigned whole numbers, a maximum of 2ⁿ − 1. For eight bits that is 256 patterns from 0 to 255.",
      contrast: {
        wrong: "eight bits can hold any value up to 256",
        right: "eight bits hold 256 patterns, representing 0 to 255",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt: "Convert the binary pattern 1011 0110 into denary. Show the place values you use.",
      hint:
        "Start at the left with 128 and halve the place value each time. Add only the places where the bit is 1.",
      answer:
        "1011 0110 = 128 + 32 + 16 + 4 + 2 = 182.",
      feedback: {
        correct:
          "You labelled the positions with powers of two and added only the selected places, rather than reading the digits as a denary number.",
        incorrect:
          "The leftmost bit is worth 128, not 100. Check each 1 against its place value before adding.",
      },
    },
    {
      id: "p2",
      prompt: "Convert 202 into an eight-bit binary pattern.",
      hint:
        "Subtract the largest power of two that fits, then continue with the remainder. Remember to keep leading zeros.",
      answer:
        "202 = 128 + 64 + 8 + 2, so the pattern is 1100 1010.",
      feedback: {
        correct:
          "You used the largest fitting place values and kept all eight positions, including the trailing zero.",
        incorrect:
          "Start with 128 and subtract it. The remainder is 74, then 64 fits, and the remaining 10 is made from 8 and 2.",
      },
    },
    {
      id: "p3",
      prompt:
        "Add 1011 and 0110 in a four-bit register. Give the four-bit result and explain whether overflow occurred.",
      hint:
        "Add from the right. When a column produces 1 + 1, write 0 and carry 1. Does the final carry have a column inside four bits?",
      answer:
        "1011 (11) + 0110 (6) = 10001 (17), which needs five bits. A four-bit register keeps 0001 and produces a carry out, so the stored result 0001 is not the true sum: overflow occurred.",
      feedback: {
        correct:
          "You separated the five-bit arithmetic result from the four-bit stored result and named the discarded carry as overflow.",
        incorrect:
          "The sum is not 1001. Work from the right: 1 + 0 = 1, 1 + 1 = 0 carry 1, 0 + 1 + 1 = 0 carry 1, and the final 1 + 0 + 1 produces a carry out.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Write a Python function to_hex_byte(value) that returns exactly two upper-case hexadecimal digits for a whole number from 0 to 255. Reject values outside that range. State the output for 156 and for 10.",
      modelAnswer:
        'def to_hex_byte(value):\n    if value < 0 or value > 255:\n        raise ValueError("outside one byte")\n    digits = "0123456789ABCDEF"\n    high = value // 16\n    low = value % 16\n    return digits[high] + digits[low]\n\nprint(to_hex_byte(156))  # 9C\nprint(to_hex_byte(10))   # 0A',
      marking: [
        "Rejects negative values and values above 255 instead of silently truncating them.",
        "Uses the high nibble and low nibble, for example by dividing by 16 and taking the remainder.",
        "Maps the values 10 to 15 to A to F and always returns two digits, including a leading zero for 0A.",
        "States 9C for 156 and 0A for 10, and the tests cover at least one boundary value.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "What is the denary value of the binary pattern 1100 1010?",
      modelAnswer: "202",
      marking: [
        "Uses the place values 128, 64, 8 and 2.",
        "Adds the selected values to obtain 202, rather than treating the pattern as 1100 + 1010.",
      ],
      check: { accepted: ["202"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Explain why the sum 1111 1111 + 0000 0001 cannot be stored correctly in one eight-bit byte.",
      modelAnswer:
        "1111 1111 is 255, and adding 1 gives 256. The sum in binary is 1 0000 0000, which has a 1 in the ninth column. An eight-bit byte has no ninth column, so the carry out is lost if the result is stored there; this is overflow. The remaining eight bits are 0000 0000, which is 0, not 256.",
      marking: [
        "Identifies 1111 1111 as 255 and the sum as 256.",
        "Shows the result needs a ninth bit, or a carry out beyond the eight columns.",
        "Explains that discarding the carry gives the wrong value and names the event overflow.",
      ],
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt: "Write 202 as two hexadecimal digits.",
      modelAnswer: "CA",
      marking: [
        "Splits 202 into the nibbles 1100 and 1010.",
        "Maps 1100 to C and 1010 to A, giving CA.",
      ],
      check: { accepted: ["CA", "ca", "0xCA", "0xca"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A light sensor is specified to send one eight-bit byte for each reading. On a very bright day it sends the value 300. Explain why the protocol cannot carry that reading, what a careless receiver might store instead, and what the system should do about it.",
      whyItTransfers:
        "The lesson converts values in both directions and treats overflow as a boundary. Here the same boundary appears in a real protocol: the learner must decide whether 300 fits, work out the low eight bits, and choose a safe response rather than assuming the sensor is always right.",
      answer:
        "300 is greater than 1111 1111 (255), so it needs at least nine bits: 1 0010 1100. A receiver that keeps only the low eight bits would store 0010 1100, which is 44, and would report a much darker reading than the sensor measured. A safe system should detect the out-of-range value and reject it, clamp it with an explicit saturation flag, or use a wider field such as 16 bits. It should not silently accept the wrapped byte.",
      marking: [
        "States that 300 needs nine bits or is above the maximum unsigned byte value 255.",
        "Shows 300 in binary and identifies the low eight bits as 0010 1100 (44).",
        "Explains that discarding the ninth bit changes the meaning of the reading.",
        "Chooses a safe response: reject, flag saturation, or use a wider field.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What are the place values of the eight bits in a byte, from left to right?",
      answer: "128, 64, 32, 16, 8, 4, 2 and 1.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why is a byte written as two hexadecimal digits?",
      answer:
        "Each hexadecimal digit represents four bits, and a byte has eight bits, so two hexadecimal digits represent the whole byte.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How many different patterns can eight bits hold, and what is the largest unsigned whole number they can represent?",
      answer:
        "Eight bits hold 2⁸ = 256 patterns, representing the unsigned whole numbers 0 to 255. The largest is therefore 255, not 256.",
      when: "month-later",
    },
  ],

  summary: [
    "A bit has two states; eight bits form a byte with 2⁸ = 256 possible patterns, used for the unsigned values 0 to 255.",
    "Binary is positional: the place values are powers of two, so 1001 1100 is 128 + 16 + 8 + 4 = 156.",
    "Binary addition carries a 1 into the next column; a carry beyond the fixed width is overflow, and discarding it changes the value.",
    "Hexadecimal groups four bits into one digit, so a byte is two hexadecimal digits; encoding is the separate rule that gives a pattern meaning as text, colour or sound.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every code block is short enough to be read line by line, and the trace states each place value and remainder in words before the final bit string.",
    },
    {
      need: "dyslexia",
      alternative:
        "Code uses one statement per line, and place values are written as a left-to-right list rather than relying on spatial alignment alone.",
    },
    {
      need: "colour-vision",
      alternative:
        "Bit values are written as 0 and 1 and labelled in text; no step depends on colour highlighting or on distinguishing red from green.",
    },
    {
      need: "motor",
      alternative:
        "The lesson requires typing, not dragging or timed clicking; every code block can be copied into any Python environment and run without special hardware.",
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
        "Scope cited against the published GCSE computer science subject content for data representation.",
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
