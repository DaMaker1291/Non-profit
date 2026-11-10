import type { AuthoredLesson } from "../../lesson-contract";

// A DICTIONARY IS A LOOKUP BY MEANING, NOT BY POSITION.
//
// The code lab deliberately uses `counts[word] += 1` on a key that has never
// been seen. That is not a syntax error; it is a missing-key error at run
// time. The learner must decide what an absent key should mean before the
// program can count anything, which is the conceptual work of the lesson.
export const COMPUTING_DICTIONARIES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "dictionaries",
  version: "1.0.0",
  subject: "computing",
  curriculum: {
    reference:
      "GCSE Computer Science, programming: key-value data structures, dictionary access, updates, iteration and frequency counting",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content; dictionaries extend the list and array work with lookup by key.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Create a dictionary, access and update values by key, and explain why a missing key raises KeyError.",
      evidence:
        "The learner updates an existing key without changing the dictionary's size and repairs a missing-key access with get or a membership check.",
    },
    {
      statement:
        "Iterate over a dictionary and count occurrences with get(key, 0) + 1, distinguishing a key from a value.",
      evidence:
        "The learner produces a frequency table for a short word list and states the count for a repeated word and an absent word.",
    },
    {
      statement:
        "Choose a dictionary for labelled lookup and a list for ordered traversal, and state one limitation of each.",
      evidence:
        "The learner explains that a dictionary finds a value by its key while a list must be searched by position, and that dictionary keys must be unique and immutable.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["lists-arrays"],
    check: [
      {
        id: "d1",
        question: "What does values[1] mean for a list?",
        answer:
          "The item at index 1, which is the second item because list indices start at zero.",
        targets: ["lists-arrays"],
      },
      {
        id: "d2",
        question: "How would you find whether \"Ada\" is in a list of names, and what does the check cost?",
        answer:
          "Use \"Ada\" in names. Python checks the items one by one, so the time grows with the length of the list.",
        targets: ["lists-arrays"],
      },
    ],
  },

  introduction: {
    hook:
      "A school office does not identify a pupil by position in a queue. It uses the pupil's name or admission number, and that label points to one record: year group, tutor, emergency contact, dinner balance. Reordering the queue changes every position but no record's label. A dictionary is the programming version of that idea: a key identifies a value directly, without counting through everything before it.",
    why:
      "A dictionary stores key-value pairs. The key is a label, not a position: scores[\"Ada\"] asks for the value stored under the key \"Ada\". Keys are unique, so assigning to an existing key replaces its value rather than adding a duplicate. Looking up a missing key raises KeyError unless the program asks safely with get or checks membership first. Dictionaries are especially useful when the labels are meaningful and the collection must be searched repeatedly, as in a frequency count or a small database. They are not a replacement for a list when order and position are the point.",
  },

  explanation: [
    {
      heading: "A key identifies a value; an index identifies a position",
      paragraphs: [
        "Create a dictionary with curly braces and colon-separated pairs: scores = {\"Ada\": 8, \"Lin\": 10, \"Sam\": 7}. The strings are keys and the integers are values. scores[\"Lin\"] returns 10. There is no scores[1] that means the second pupil; 1 would be a key, and the dictionary has no integer key 1. This is the central difference from a list: a lookup is by label rather than by counting positions.",
        "Keys are unique. Assigning scores[\"Ada\"] = 9 updates Ada's existing entry; it does not create a second Ada. The dictionary's length counts distinct keys, not assignments. A duplicate key written in a literal keeps only the last value. Keys must be immutable and hashable, so strings, numbers and tuples can be keys, while a list cannot. Values can be any type, including lists or other dictionaries.",
      ],
    },
    {
      heading: "Missing keys are a decision, not an accident",
      paragraphs: [
        "Reading a key that is absent raises KeyError. That is useful when absence is a bug: a program that expects every pupil to have a score should stop rather than silently invent one. It is inconvenient when absence is normal, such as checking whether a new word has been seen. The program must choose which meaning it intends instead of hoping the missing case behaves like zero.",
        "The get method makes the choice explicit. scores.get(\"Ada\") returns 8, while scores.get(\"Kai\") returns None. scores.get(\"Kai\", 0) returns 0 as a default. The default is used only when the key is absent; an existing key with the value 0 still returns 0. Membership with \"Kai\" in scores also returns a Boolean without raising. Use get for a read with a fallback, and use an explicit in check when the program needs to distinguish 'absent' from 'present with a false-looking value'.",
      ],
    },
    {
      heading: "Counting is the dictionary's natural worked example",
      paragraphs: [
        "To count words, start with an empty dictionary. For each word, read the current count and add one, then store it back under the same key. The safe expression is counts[word] = counts.get(word, 0) + 1. When the key is new, get supplies 0 and the assignment creates the key with 1. When the key exists, get supplies its current count and the assignment updates it.",
        "The unsafe expression counts[word] = counts[word] + 1 assumes the key already exists. On the first occurrence it raises KeyError and stops the whole program, so no later word is counted. The safe form does not hide errors in general; it states the correct meaning of an unseen word: its previous count is zero. That is a semantic decision about the data, not a trick for avoiding error messages.",
      ],
    },
    {
      heading: "Choose by the question the program asks",
      paragraphs: [
        "A list is ordered and accessed by position; finding a value usually means checking items until it appears, which is linear in the number of items. A dictionary is accessed by key and, on average, finds a value without scanning the whole collection. That is why a dictionary is appropriate for a register keyed by admission number or a frequency table keyed by word. It is inappropriate when the program needs the item in position 3 or must preserve an order that is not the key order.",
        "Dictionaries also make good records: a pupil can be represented by name, year and balance, with each field a named key. A list of such dictionaries is a small table. Iterating with for name in scores visits keys, while scores.values() visits values and scores.items() gives key-value pairs. Choose the iteration form that names what the body needs, and do not assume a dictionary is a sequence just because it can be looped over.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "This program is meant to count three words, but the first unseen word raises KeyError before anything is printed. Run it, then make an unseen word mean a previous count of zero.",
      notation: `counts = {}
for word in ["pen", "book", "pen"]:
    counts[word] = counts[word] + 1
print(counts["pen"])`,
      caption:
        "The first word has no existing count, so counts[word] cannot be read. The fix must define the initial count, not catch the error and continue.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "Trace a frequency count with get. The second column is the value read before the update; the third is what is stored back.",
      notation:
        "word = pen: get(pen, 0) → 0; pen becomes 1 · word = book: get(book, 0) → 0; book becomes 1 · word = pen: get(pen, 0) → 1; pen becomes 2",
      caption:
        "The default 0 is used only on the first two words. On the third word the key exists, so get returns the stored count 1.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "These checks separate an existing key, an absent key with a default and an absent key without one. The last case is expected to raise; that is part of the contract.",
      notation:
        "scores = {\"Ada\": 8} · scores.get(\"Ada\", 0) = 8 · scores.get(\"Kai\", 0) = 0 · \"Kai\" in scores = False · scores[\"Kai\"] raises KeyError",
      caption:
        "A test for absence is not the same as a test for a value of zero. get can return 0 for both, while membership can tell them apart.",
    },
    {
      id: "r4",
      kind: "computing.debug",
      body:
        "The key already exists, so assignment replaces the old value. If the intention is to add stock, read the old value before assigning the new one.",
      notation: `stock = {"pens": 3}
stock["pens"] = 5
print(stock["pens"])  # 5, not 8

stock["pens"] = stock["pens"] + 5
print(stock["pens"])  # 10`,
      caption:
        "A dictionary assignment is not an append. It sets the value for that key; the previous value survives only if the new expression uses it.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace this program and state what is printed:\ncounts = {}\nfor word in [\"pen\", \"book\", \"pen\"]:\n    counts[word] = counts.get(word, 0) + 1\nprint(counts[\"pen\"])\nprint(counts[\"book\"])\nprint(len(counts))",
      steps: [
        {
          move: "Start with an empty dictionary; there are no keys and len is 0.",
          why:
            "A frequency table has no entries before any item has been seen. Starting empty is what makes the first occurrence a genuine new case.",
        },
        {
          move: "For pen, get(pen, 0) returns 0; assign 0 + 1 = 1 under pen.",
          why:
            "The key is absent, so the default applies. The assignment creates the key and stores the first count.",
        },
        {
          move: "For book, the same step creates book = 1; for the second pen, get returns 1 and stores 2.",
          why:
            "The repeated key is updated, not duplicated. The number of keys is still two, while the sum of the counts is three.",
        },
        {
          move: "The three print statements produce 2, 1 and 2.",
          why:
            "pen was seen twice, book once, and len counts distinct keys. The dictionary has two keys, not three occurrences.",
        },
      ],
      answer:
        "The output is 2, then 1, then 2. pen has count 2, book has count 1, and len(counts) counts the two distinct keys.",
    },
    {
      id: "w2",
      prompt:
        "A register stores scores = {\"Ada\": 8, \"Lin\": 10}. A new pupil Kai has no entry. Explain what scores[\"Kai\"] does, what scores.get(\"Kai\", 0) does, and which one a program should use when it wants to treat an unseen pupil as having zero.",
      steps: [
        {
          move: "scores[\"Kai\"] looks for an existing key and finds none, so it raises KeyError.",
          why:
            "Square-bracket access makes a claim that the key exists. Python does not invent a value, because silently returning zero would hide a misspelled name or a missing record.",
        },
        {
          move: "scores.get(\"Kai\", 0) returns the supplied default 0 without adding Kai to the dictionary.",
          why:
            "get reads with an explicit fallback. The fallback is a return value, not an insertion; the register still has only Ada and Lin.",
        },
        {
          move: "Use get when absence means zero for this calculation, and use an in check when the program must know whether the entry exists.",
          why:
            "The two intentions differ. A zero score and no record at all can require different actions, even though both produce the number 0 in a total.",
        },
        {
          move: "If the program should add Kai, assign scores[\"Kai\"] = 0 first, then update normally.",
          why:
            "Creating the record is a separate decision from reading a default. Making it explicit keeps the dictionary's contents understandable.",
        },
      ],
      answer:
        "The bracket access raises KeyError; get returns 0 and leaves the dictionary unchanged. Use get when an unseen pupil should count as zero, but add the key explicitly if Kai should become part of the register.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A dictionary is accessed by a number in the same way as a list, so scores[1] means the second pupil.",
      whyItFails:
        "The value in brackets is a key, not a position. If the keys are names, scores[1] looks for the key 1 and raises KeyError unless an integer key exists. A dictionary is not a sequence with a first, second and third item.",
      correction:
        "Read the bracket as 'value stored under this label'. Use the actual key, such as scores[\"Lin\"], and iterate the dictionary when position is not the question.",
      contrast: {
        wrong: "scores[1] returns the second pupil",
        right: "scores[\"Lin\"] returns the value stored under the key Lin",
      },
    },
    {
      id: "m2",
      belief: "Reading a missing key returns 0 or None, so a dictionary can be used without checking.",
      whyItFails:
        "Square-bracket access raises KeyError for a missing key. It does not guess a default. A missing entry and an entry whose value is zero are different states, and a program that treats them as the same can hide a misspelled key.",
      correction:
        "Decide what absence means. Use get(key, default) for a read with a stated fallback, or check key in dictionary before accessing it when the two states need different handling.",
      contrast: {
        wrong: "counts[word] starts at 0 automatically",
        right: "counts.get(word, 0) supplies zero only for the read; the assignment then creates or updates the entry",
      },
    },
    {
      id: "m3",
      belief: "Assigning a value to an existing key adds a second entry with the same name.",
      whyItFails:
        "Keys are unique. Assignment updates the value associated with the key; it does not append a duplicate. The length counts distinct keys, so replacing Ada's score leaves the dictionary the same size.",
      correction:
        "Separate creating a key from updating a key. Both use the same bracket syntax, but the dictionary's length tells you whether a new key was created. Use a new key only when the label is genuinely new.",
      contrast: {
        wrong: "scores[\"Ada\"] = 9 makes a second Ada entry",
        right: "scores[\"Ada\"] = 9 replaces Ada's value and leaves the key count unchanged",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "What is printed?\nages = {\"Ada\": 15, \"Lin\": 16}\nprint(ages[\"Lin\"])\nages[\"Ada\"] = 16\nprint(ages[\"Ada\"])\nprint(ages.get(\"Sam\", 0))",
      hint: "Read the key in brackets. Assignment to an existing key updates its value; get supplies the default only when the key is absent.",
      answer:
        "It prints 16, then 16, then 0. Lin's value is 16; Ada's value is updated to 16; Sam is absent, so get returns the supplied default 0 without adding Sam.",
      feedback: {
        correct:
          "You distinguished a lookup, an update to an existing key and a read of an absent key with a default.",
        incorrect:
          "ages[\"Ada\"] = 16 does not create a second Ada. The third print reads Sam, who is not in the dictionary, so get uses 0.",
      },
    },
    {
      id: "p2",
      prompt:
        "What is printed?\ncounts = {}\nfor letter in [\"a\", \"b\", \"a\"]:\n    counts[letter] = counts.get(letter, 0) + 1\nprint(counts[\"a\"])\nprint(counts.get(\"z\", 0))",
      hint: "Trace the count after each letter. The key z is never added by get.",
      answer:
        "It prints 2, then 0. The first a creates count 1, b creates count 1, and the second a updates count to 2. z was never seen, so get returns 0.",
      feedback: {
        correct:
          "You traced the stored count and also noticed that get does not insert the absent key.",
        incorrect:
          "The second a reads the existing count 1 and stores 2. The final get(\"z\", 0) returns 0 without adding z to the dictionary.",
      },
    },
    {
      id: "p3",
      prompt:
        "This program crashes on its second line:\ninventory = {\"pen\": 3}\ninventory[\"book\"] += 1\nExplain the error and repair it so book starts at 1 if it is missing.",
      hint: "The right-hand side reads book before the assignment. Does book exist in the literal?",
      answer:
        "book is not a key, so inventory[\"book\"] raises KeyError before the addition can happen. Repair it with inventory[\"book\"] = inventory.get(\"book\", 0) + 1, which supplies 0 for the missing key and stores 1.",
      feedback: {
        correct:
          "You located the missing-key read and repaired the meaning of an unseen item rather than catching the error blindly.",
        incorrect:
          "The dictionary literal contains only pen. Reading inventory[\"book\"] on the right-hand side raises KeyError; use get with 0 to define the initial stock.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "code",
      prompt:
        "Repair this frequency counter so it counts every word without crashing. It should print 3 for pen and 2 for the number of distinct words.",
      modelAnswer:
        "def word_count(words):\n    counts = {}\n    for word in words:\n        counts[word] = counts.get(word, 0) + 1\n    return counts\n\nresult = word_count([\"pen\", \"book\", \"pen\", \"pen\"])\nprint(result[\"pen\"])\nprint(len(result))",
      code: {
        starterCode:
          "def word_count(words):\n    counts = {}\n    for word in words:\n        counts[word] = counts[word] + 1\n    return counts\n\nresult = word_count([\"pen\", \"book\", \"pen\", \"pen\"])\nprint(result[\"pen\"])\nprint(len(result))",
        timeoutMs: 12000,
        tests: [
          {
            name: "pen is counted three times and the dictionary has two keys",
            expectedStdout: "3\n2",
          },
        ],
      },
      marking: [
        "Uses get(word, 0) or a membership check so the first occurrence is handled.",
        "Stores the incremented count back under the same key.",
        "Returns the completed dictionary rather than printing inside the counting loop.",
        "Prints 3 for pen and 2 for len(result), showing the difference between occurrences and distinct keys.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is printed?\nscores = {\"Ada\": 8, \"Lin\": 10}\nprint(scores[\"Lin\"])\nprint(scores.get(\"Sam\", 0))\nprint(len(scores))",
      modelAnswer: "10\n0\n2",
      marking: [
        "Reads Lin's stored value of 10.",
        "Returns 0 for Sam without adding a third key.",
        "Reports len(scores) as 2, the number of distinct keys.",
      ],
      check: { accepted: ["10\n0\n2", "10 0 2"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Explain the difference between scores[\"Kai\"] and scores.get(\"Kai\", 0) when Kai is not in the dictionary.",
      modelAnswer:
        "scores[\"Kai\"] raises KeyError because the key is absent. scores.get(\"Kai\", 0) returns 0 without adding Kai; the second argument is a default for a missing key. Use bracket access when absence is an error and get when zero is the intended meaning.",
      marking: [
        "States that bracket access raises KeyError for a missing key.",
        "States that get returns the supplied default and does not insert the key.",
        "Connects the choice to the intended meaning of absence.",
      ],
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "A program must record how many times each product code is scanned. Would you use a list or a dictionary? Give one reason and one limitation of your choice.",
      modelAnswer:
        "A dictionary, keyed by product code. Each scan can update that code's count without searching the whole collection, and a repeated code updates one entry. A limitation is that the keys must be unique and immutable, and a dictionary is not accessed by position when order matters.",
      marking: [
        "Chooses a dictionary and names lookup or update by key as the reason.",
        "States a real limitation: unique keys, immutable keys or no positional access.",
        "Distinguishes counting occurrences from storing an ordered sequence.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Write a function word_count(text) that returns a dictionary mapping each lowercase word in a sentence to the number of times it appears. Assume words are separated by spaces and punctuation has already been removed. Then explain why the dictionary's length is not the same as the number of words in the sentence.",
      whyItTransfers:
        "The lesson counts a supplied list of words. Here the learner must split an unfamiliar sentence into tokens, normalise the case, reuse the frequency pattern and interpret the result. The last question tests the occurrence-versus-distinct-key distinction in a new context.",
      answer:
        "def word_count(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts\n\nprint(word_count(\"the cat and the dog\"))\n\nThe function returns {\"the\": 2, \"cat\": 1, \"and\": 1, \"dog\": 1}, whose length is 4. The sentence has five words, because \"the\" occurs twice. len(counts) counts distinct keys, not occurrences.",
      marking: [
        "Splits the text into words and lowercases them before counting.",
        "Uses get(word, 0) or an equivalent explicit initial count for unseen words.",
        "Stores the updated count under the word and returns the dictionary.",
        "Explains that length counts distinct keys, not total occurrences.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "What does scores[\"Ada\"] mean, and how is it different from scores[0]?",
      answer:
        "It looks up the value stored under the key Ada. scores[0] would look for the key 0, not the first position; dictionaries are not indexed by position.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does counts[word] += 1 fail for a new word, and what expression handles it?",
      answer:
        "The right-hand side reads a missing key and raises KeyError. Use counts[word] = counts.get(word, 0) + 1, which supplies zero for the first occurrence.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "When is a list a better choice than a dictionary?",
      answer:
        "When order and position matter, when the collection needs to grow at one end, or when the same value may appear repeatedly without a unique label. A dictionary is for lookup by a unique key.",
      when: "month-later",
    },
  ],

  summary: [
    "A dictionary maps unique keys to values; access is by key, not by position.",
    "Assigning to an existing key updates its value, while reading a missing key raises KeyError.",
    "Use get(key, default) when absence has a defined meaning, and use in when the program must distinguish absence from a stored value.",
    "Frequency counting works because each key holds its own running count; len(counts) counts distinct keys, not occurrences.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every dictionary literal is short enough to read one pair at a time, and each trace states key, stored value and updated value in words.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson uses one statement per line, names keys in full and avoids relying on brace counting or punctuation alone to convey structure.",
    },
    {
      need: "colour-vision",
      alternative:
        "Keys and values are named in prose and separated by labels, not distinguished by colour or shading.",
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
        "Scope cited against the published GCSE computer science subject content for programming and data structures.",
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
