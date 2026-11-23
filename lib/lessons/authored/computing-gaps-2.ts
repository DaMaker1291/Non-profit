import { defineGapLesson } from "./_gap-lesson";

// COMPUTING GAP BATCH 2 — security, storage and communication.
//
// The framework requires code, a trace and a test in each lesson. The code
// exercises here are small enough to run in the browser sandbox and observe one
// deterministic output; the reasoning is assessed separately in prose.

export const COMPUTING_CYBERSECURITY = defineGapLesson({
  conceptId: "cybersecurity",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, cyber security and digital systems",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for threats, vulnerabilities and protective measures. All scenarios and programs are original.",
  },
  objectives: [
    {
      statement:
        "Distinguish a threat, a vulnerability and a defence, using a concrete system rather than a list of words.",
      evidence:
        "For a school account system, the learner names phishing as a threat, a reused password as a vulnerability, and two-factor authentication as a defence.",
    },
    {
      statement:
        "Explain why hashing is used for stored passwords while encryption is used for data that must be read again.",
      evidence:
        "The learner states that a hash is one-way and a correct password is checked by hashing the attempt, while encrypted data is reversible with the key.",
    },
    {
      statement:
        "Choose a proportionate defence for a stated attack and explain the residual risk it does not remove.",
      evidence:
        "The learner chooses input validation against injection and notes that it does not stop a phishing message from stealing a password.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["networks", "logic-maths"],
    check: [
      {
        id: "d1",
        question: "What does DNS do when a browser requests a website by name?",
        answer:
          "It resolves the human-readable domain name to an IP address the network can route packets to.",
        targets: ["networks"],
      },
      {
        id: "d2",
        question: "Why is an “and” condition false when only one of its parts is true?",
        answer:
          "Both inputs must be true for the conjunction to be true; one false input is enough to make the whole condition false.",
        targets: ["logic-maths"],
      },
    ],
  },
  introduction: {
    hook:
      "A pupil receives an email that looks exactly like the school's password-reset page. It asks them to sign in, and the page passes the password to an attacker. The school's server was never broken into, its encryption was never cracked, and its firewall did nothing wrong. The weakest link was a person making a fast judgement about a link.",
    why:
      "Security is usually taught as a glossary: malware, phishing, firewall, encryption. That list does not help a learner decide what to do when a message asks for a password. The useful model is a chain: an attacker wants something, finds a way in, and the defender tries to raise the cost or reduce the damage. Every control protects a particular link, and every control leaves something out. Naming that remainder is the difference between security awareness and a poster.",
  },
  explanation: [
    {
      heading: "A threat needs a route into a system",
      paragraphs: [
        "A threat is something that can cause harm: a phishing campaign, a stolen laptop, a malicious insiders. A vulnerability is a weakness the threat can use: a reused password, an unpatched server, an input field that trusts whatever it receives. A defence reduces the chance or the impact of the threat reaching the vulnerability. These are different objects, and mixing them produces useless advice such as “the threat is weak passwords” when the password is the vulnerability and the attacker is the threat.",
        "The route matters because defences are local. A firewall filters network traffic but cannot stop a user typing a password into a fake page. Two-factor authentication helps when a password is stolen but does not repair a server that exposes every record. Good security work starts by drawing the path from attacker to asset, then asks which step is cheapest to block and what remains if that block fails.",
      ],
    },
    {
      heading: "Hashing is a fingerprint; encryption is a locked box",
      paragraphs: [
        "A cryptographic hash turns any input into a fixed-length value. It is designed to be one-way and collision-resistant: changing the password changes the hash unpredictably, and finding two inputs with the same hash should be impractical. A site stores the hash, not the password. At login it hashes the attempt and compares the results. A stolen database therefore does not hand the attacker the passwords directly, though a fast hash is still vulnerable to guessing, which is why a slow password hash with a salt is used.",
        "Encryption is reversible with the right key. It is the right tool for a message or a file that must be read later by someone authorised. Sending encrypted data without protecting the key just moves the problem. Hashing cannot be used for a message that must be decrypted, and encryption should not be used as a password store because anyone with the key can recover every password. The purpose decides the primitive: verification uses a hash; confidentiality uses encryption.",
      ],
    },
    {
      heading: "Input is data until it is proved otherwise",
      paragraphs: [
        "Injection happens when a program treats user input as code or as part of a query. A login form that builds a database query by pasting the typed username can be made to return every row. The defence is not a longer blocklist of punctuation; it is parameterised queries and validation that accepts only the shape the field needs. Output encoding is the matching defence when data is placed into a page, because the same character can be harmless as text and dangerous as markup.",
        "No single control removes every risk. Validation stops malformed input but not a correct password entered on a fake site. Patching closes a known hole but not a new one. Backups reduce the impact of ransomware but do not stop the infection. A defensible answer therefore names the attack, the control, and the residual risk. That last sentence is what makes a security plan honest rather than a checklist.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The function checks a password's shape before it is hashed. It returns a reason, not only a boolean, so the learner can see which requirement failed.",
      notation:
        "def password_problem(password):\n    if len(password) < 12:\n        return \"too short\"\n    if password.lower() == password:\n        return \"add an uppercase letter\"\n    if password.isalpha():\n        return \"add a digit or symbol\"\n    return \"ok\"\n\nprint(password_problem(\"correcthorse\"))\nprint(password_problem(\"CorrectHorse7!\"))",
      caption:
        "Length is checked first because it gives the largest gain against guessing. The function describes a policy, not a guarantee: a long password can still be phished.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace follows a phishing attempt through the user, the fake page and the real service. It shows where each defence acts and which step has no control at all.",
      notation:
        "step 1: attacker sends link -> user clicks\nstep 2: fake page collects password = true\nstep 3: attacker logs in -> MFA challenge -> access = denied\nstep 4: no MFA -> access = granted; server logs one new-country login",
      caption:
        "MFA blocks the stolen password at the login step, but it does not stop the fake page from collecting it. The trace makes the residual risk visible.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "A test for a security control should include the attack it is meant to stop and a legitimate case it must not break.",
      notation:
        "assert password_problem(\"short\") == \"too short\"\nassert password_problem(\"CorrectHorse7!\") == \"ok\"\nassert password_problem(\"alllowercase1\") == \"add an uppercase letter\"\n# A rejected valid password is a denial of service against the user.",
      caption:
        "The legitimate long password is as important as the attack case. A control that blocks everything is secure and unusable.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A school stores pupils' passwords. Explain why it should store a salted password hash rather than an encrypted password.",
      steps: [
        {
          move: "The server only needs to verify a login attempt, not recover the original password.",
          why:
            "Verification is a yes/no comparison. Reversibility is unnecessary, and unnecessary capability becomes a liability if the key or database is stolen.",
        },
        {
          move: "Hash the attempt with the same salt and compare the hashes; store the salt beside the hash.",
          why:
            "The salt makes precomputed tables useless and ensures two pupils with the same password do not share a stored value. The comparison still works without keeping the original.",
        },
        {
          move: "Use a deliberately slow password hash so guessing many candidates is expensive.",
          why:
            "A general-purpose fast hash makes a stolen database cheap to attack. A password hash is designed to make each guess costly while a legitimate login remains tolerable.",
        },
      ],
      answer:
        "Store a salted, slow hash; verify by hashing the attempt, never by decrypting the original.",
    },
    {
      id: "w2",
      prompt:
        "A login form builds a user query by pasting the typed name into the SQL string. Explain the injection and one repair.",
      steps: [
        {
          move: "If the learner types a quote and a condition, the typed text becomes part of the SQL structure rather than a value.",
          why:
            "String concatenation erases the boundary between the query the developer wrote and the data the user supplied. The database cannot tell which quote was intended.",
        },
        {
          move: "Replace concatenation with a parameterised query that sends the typed value separately.",
          why:
            "The database parses the query first and treats the parameter as data, so a quote in the value cannot change the query's structure.",
        },
        {
          move: "Validate the expected shape and return a generic error, but do not rely on blocking a list of “bad” characters.",
          why:
            "Blocklists are incomplete and can be bypassed by encoding. Parameterisation removes the structural risk; validation reduces malformed input and error leakage.",
        },
      ],
      answer:
        "Use a parameterised query; validation is a second layer, not a substitute for separating code from data.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Encryption and hashing are two words for the same protection.",
      whyItFails:
        "Encryption is reversible with a key, so it is suitable for data that must be read later. A hash is designed to be one-way, so it is suitable for verifying a password without storing it. Using encryption for passwords gives anyone with the key every password; using a hash for a message destroys the message.",
      correction:
        "Ask what the system must do next: recover the original (encryption) or compare a new input with a stored fingerprint (hashing). Choose the primitive from that purpose.",
      contrast: {
        wrong: "We encrypted the passwords, so even we cannot read them.",
        right: "We stored salted hashes, so we can verify a password without storing a reversible copy.",
      },
    },
    {
      id: "m2",
      belief: "A firewall is enough to keep a system secure.",
      whyItFails:
        "A firewall controls network traffic at its boundary, but it does not stop a user entering a password on a fake site, a colleague installing malware, or an application with a broken permission check. Security is a property of the whole system, including people and code.",
      correction:
        "Layer controls and name what each one covers. A firewall, patching, least privilege, input validation, MFA and backups protect different links; none replaces the others.",
      contrast: {
        wrong: "We have a firewall, so phishing cannot affect us.",
        right: "The firewall filters traffic; MFA and user reporting reduce the chance a phished password becomes an account takeover.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A pupil uses the same password for school and a gaming site. The gaming site is breached. What is the vulnerability, and what defence would have limited the damage?",
      hint:
        "The attacker now has a working password. What makes it work on the school account?",
      answer:
        "Password reuse is the vulnerability. A unique password per service, a password manager and MFA would limit the damage because the stolen password would not open the school account alone.",
      feedback: {
        correct: "You separated the breach from the reuse that turned it into a school compromise.",
        incorrect:
          "The breach is the threat event; reuse is the weakness that lets it spread. Unique passwords and MFA are the controls that break the chain.",
      },
    },
    {
      id: "p2",
      prompt:
        "Why does a salted hash make a stolen password database harder to attack than an unsalted one?",
      hint: "What can an attacker precompute for common passwords, and what does a unique salt do to that work?",
      answer:
        "A salt makes the same password hash differently for each user, so an attacker cannot reuse one precomputed table across the database and must attack each hash separately.",
      feedback: {
        correct: "You explained the salt as uniqueness per record, not as a secret key.",
        incorrect:
          "A salt is stored with the hash; its job is to make precomputation and identical hashes useless, not to encrypt the password by itself.",
      },
    },
    {
      id: "p3",
      prompt:
        "A school blocks every email from outside its domain. Name one security benefit and one serious cost.",
      hint: "Think about legitimate senders such as parents, universities or exam boards.",
      answer:
        "It reduces some phishing, but it blocks legitimate external mail and can push users to personal accounts where the school has less control. The control is disproportionate without an allowlist or quarantine.",
      feedback: {
        correct: "You named a real benefit and a cost that changes how people work around the control.",
        incorrect:
          "A block can reduce one route, but it also blocks legitimate senders and may create a shadow channel. Security controls have usability costs that must be designed for.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "What is the one-way process called that stores a fingerprint of a password rather than the password itself?",
      modelAnswer: "hashing",
      marking: [
        "Names a one-way function, not encryption.",
        "Connects the stored value to verification rather than recovery.",
      ],
      check: { accepted: ["hashing", "hash", "a hash"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is the name of the attack that tricks a person into entering credentials on a fake page?",
      modelAnswer: "phishing",
      marking: [
        "Names the human-targeted deception rather than a software exploit.",
        "Recognises that the fake page can be separate from the real service.",
      ],
      check: { accepted: ["phishing", "a phishing attack"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete the password policy function so it rejects a password shorter than 12 characters, then rejects an all-lowercase password, then rejects an all-letter password. Return “ok” only when all three checks pass.",
      modelAnswer:
        "Check the length first, compare the password with its lower-cased copy to detect the missing uppercase letter, and use isalpha to require a non-letter character before returning ok.",
      marking: [
        "Checks all three conditions in a clear order and returns a specific reason.",
        "Accepts a long password that contains uppercase and a non-letter character.",
      ],
      code: {
        starterCode:
          "def password_problem(password):\n    # Add the three checks.\n    return \"ok\"\n\nprint(password_problem(\"CorrectHorse7!\"))\n",
        tests: [
          { name: "a valid long password is accepted", expectedStdout: "ok" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A small charity stores donor details on a laptop. It uses a strong login password but no backup, no encryption and no automatic updates. Rank two changes by risk reduced per pound spent, and name the residual risk that remains after both.",
      whyItTransfers:
        "The lesson's examples are school accounts and login forms. The charity changes the asset, the budget and the attacker's likely route, so the learner must reason about impact and cost rather than repeat a control list.",
      answer:
        "Enable automatic updates and encrypted backups first: patching closes known remote holes, and a backup restores data after ransomware or theft. Encryption protects a stolen laptop. Residual risk remains from phishing, weak staff judgement and a stolen backup key; training, MFA and an offline copy reduce but do not eliminate it.",
      marking: [
        "Chooses controls by the risk they reduce, not by familiarity.",
        "Explains both a preventive control and a recovery control.",
        "Names a residual risk that survives the chosen changes.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the difference between a threat and a vulnerability?",
      answer:
        "A threat is something that can cause harm; a vulnerability is a weakness that the threat can exploit.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why is a password hash salted?",
      answer:
        "A unique salt makes identical passwords hash differently and defeats precomputed tables, so each stolen hash must be attacked separately.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does parameterised SQL separate?",
      answer:
        "It separates the query's structure from the user-supplied values, so typed data cannot change the query.",
      when: "month-later",
    },
  ],
  summary: [
    "A threat needs a route to an asset; a vulnerability is the weakness on that route and a defence interrupts it.",
    "Hashing is one-way verification; encryption is reversible confidentiality with a key.",
    "Parameterised queries separate code from data and are stronger than a blocklist of characters.",
    "Every control leaves residual risk, so a security answer should name what it does not cover.",
  ],
});

export const COMPUTING_DATABASES = defineGapLesson({
  conceptId: "databases-sql",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, databases and structured query language",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for data organisation and querying. The schema, queries and Python example are original.",
  },
  objectives: [
    {
      statement:
        "Read a relational schema and write a SELECT query that filters rows and chooses columns.",
      evidence:
        "Given a students table, the learner writes a query returning names for grades above 80 and explains which clause filters before the result is projected.",
    },
    {
      statement:
        "Explain the role of a primary key and a foreign key in keeping related tables consistent.",
      evidence:
        "The learner identifies the primary key of each table and explains that a foreign key must reference an existing row or be null, depending on the relationship.",
    },
    {
      statement:
        "Choose an index for a stated query and explain its read benefit and write cost.",
      evidence:
        "The learner proposes an index on a frequently filtered column and notes that inserts and updates must maintain it.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["dictionaries"],
    check: [
      {
        id: "d1",
        question: "What does a dictionary store, and how do you retrieve a value?",
        answer:
          "It stores key-value pairs; a value is retrieved by its key, usually with a lookup that returns a default when the key is absent.",
        targets: ["dictionaries"],
      },
      {
        id: "d2",
        question: "Why is a unique identifier useful when two records have the same name?",
        answer:
          "A unique identifier distinguishes the records even when their visible fields are identical, so an update or delete affects exactly one row.",
        targets: ["dictionaries"],
      },
    ],
  },
  introduction: {
    hook:
      "A school secretary needs every Year 10 pupil whose art grade is above 80, with their tutor group. The names and grades are in one table, the tutor groups in another, and the year group is a number in a third column. Asking a person to read a printout is possible for 200 pupils and impossible for a national dataset. A query states the rows and columns once, and the database does the repetition.",
    why:
      "A database is not a spreadsheet with more rows. Its power comes from separating entities into tables, linking them by keys and letting a query combine them without copying data. SQL is the language of that request. The lesson teaches the shape of a query before syntax: which rows, which columns, which related table, and in what order. That order also explains why a filter can use an index while a calculation on every row cannot.",
  },
  explanation: [
    {
      heading: "Tables, rows and keys",
      paragraphs: [
        "A relational table stores one kind of entity: students, courses, enrolments. Each row is one instance and each column is one attribute with a type. A primary key is a column (or combination) that uniquely identifies a row, so no two students share it and it cannot be null. A foreign key is a column that refers to a primary key in another table, such as an enrolment's student_id. The database can then enforce that an enrolment cannot point at a student who does not exist.",
        "Separating entities avoids duplication. If every enrolment repeated the student's name, address and tutor group, changing an address would require finding every copy. In a normalised design the address lives once in students and the enrolment stores only the key. The join reconstructs the view when it is needed. This is a trade: fewer inconsistencies and less storage, at the cost of a join at query time.",
      ],
    },
    {
      heading: "A query has a logical order",
      paragraphs: [
        "SELECT chooses columns, FROM names the table, WHERE filters rows, GROUP BY combines rows, HAVING filters groups, and ORDER BY sorts the result. Written SQL puts SELECT first, but the logical evaluation starts with FROM and WHERE: the rows are found and filtered before the chosen columns are produced. That is why a WHERE clause cannot usually refer to a column alias defined in SELECT.",
        "A join combines rows from two tables using a matching condition, usually a foreign key equals a primary key. An inner join keeps only matches; a left join keeps every row from the left table and fills missing right-side values with null. The choice changes the answer, not just the formatting. A query that silently uses an inner join can drop pupils with no enrolments, which is a data-quality bug disguised as a report.",
      ],
    },
    {
      heading: "Indexes trade write work for read speed",
      paragraphs: [
        "An index is a separate structure that keeps a column's values in an order that supports fast lookup, much like a book's index. A query filtering on an indexed column can jump to the matching rows instead of scanning the table. The benefit grows with table size and selectivity: an index on a column with two possible values may still leave half the table to read.",
        "Every insert, update or delete must also maintain the index, so indexes are not free. A table with many indexes writes more slowly and uses more storage. The engineering question is which queries are frequent and important enough to justify that cost. A primary key is normally indexed because uniqueness and joins depend on fast lookup; a low-value report column may not be.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The query names the columns it needs, filters on a numeric condition and sorts the result. It does not use SELECT star, so a later schema change cannot silently add columns to the report.",
      notation:
        "SELECT name, tutor_group\nFROM students\nWHERE year_group = 10 AND art_grade > 80\nORDER BY name ASC;",
      caption:
        "FROM chooses the table, WHERE filters rows, SELECT projects two columns and ORDER BY sorts. The order of the written clauses is not the order the database evaluates them.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace follows a join from an enrolment to a student. The foreign key is the bridge; a missing match is visible as a null rather than silently disappearing.",
      notation:
        "students: (id=7, name=\"Ada\", tutor=\"10B\")\nenrolments: (student_id=7, course=\"Art\")\njoin on students.id = enrolments.student_id\nresult: (name=\"Ada\", course=\"Art\")\nmissing student 9 -> left join keeps the enrolment with name = NULL",
      caption:
        "An inner join would drop the unmatched enrolment. A left join keeps it and exposes the missing reference, which is why the join type is part of the question.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The test checks the query's result shape and a boundary value, not only that the SQL runs without an error.",
      notation:
        "assert query(\"grade > 80\") == [\"Ada\", \"Ben\"]\nassert query(\"grade > 81\") == [\"Ben\"]\nassert query(\"grade = 80\") == [\"Cleo\"]\n# A grade exactly 80 is included by >= and excluded by >.",
      caption:
        "The boundary case distinguishes a strict comparison from an inclusive one. A query can be syntactically valid and still answer the wrong question.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Write a query returning the names of Year 10 pupils with an art grade of at least 80, highest first.",
      steps: [
        {
          move: "Start with FROM students because the rows come from one table.",
          why:
            "The logical evaluation begins with the table. Naming it first keeps the source of the rows separate from the columns the report will show.",
        },
        {
          move: "Filter with WHERE year_group = 10 AND art_grade >= 80.",
          why:
            "Both conditions must hold. The >= includes a pupil exactly on the boundary, which is different from the > in the lesson's earlier example.",
        },
        {
          move: "Project name and sort with ORDER BY art_grade DESC.",
          why:
            "The report asks for names in grade order. Sorting after filtering avoids sorting rows that will be discarded.",
        },
      ],
      answer:
        "SELECT name FROM students WHERE year_group = 10 AND art_grade >= 80 ORDER BY art_grade DESC;",
    },
    {
      id: "w2",
      prompt:
        "Explain why an enrolment table stores student_id rather than the student's name and address.",
      steps: [
        {
          move: "The student's name and address describe the student, so they belong in the students table.",
          why:
            "Each fact should have one home. Repeating an address in every enrolment creates multiple copies that can disagree.",
        },
        {
          move: "The enrolment stores student_id as a foreign key referencing students.id.",
          why:
            "The key is stable and compact, and the database can enforce that it points to a real student. The join reconstructs the name when a report needs it.",
        },
        {
          move: "An address change is then one update in students, not a search through every enrolment.",
          why:
            "Normalisation reduces the chance of an inconsistent record. The cost is a join, which is usually cheaper than repairing duplicated data.",
        },
      ],
      answer:
        "Store student_id as a foreign key; the student's details live once in the students table.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Selecting every column is always the safest query because it returns everything.",
      whyItFails:
        "Returning every column transfers data the report does not need and makes the result depend on the table's current shape. A later schema change can add a sensitive column to a report nobody reviewed. It also prevents the database from using a covering index for a narrow query.",
      correction:
        "Name the columns the consumer actually needs. That makes the query's contract explicit, reduces transfer and keeps a schema change from silently changing the output.",
      contrast: {
        wrong: "SELECT * FROM students;",
        right: "SELECT name, tutor_group FROM students;",
      },
    },
    {
      id: "m2",
      belief: "A primary key and a foreign key are the same thing in every table.",
      whyItFails:
        "A primary key uniquely identifies a row in its own table and cannot be null. A foreign key is a reference to a primary key in another table and may be null when the relationship is optional. The same column can be both in a one-to-one design, but the roles are not interchangeable.",
      correction:
        "Ask which table owns the identity and which table refers to it. The owner has the primary key; the referring table has the foreign key and a referential constraint.",
      contrast: {
        wrong: "enrolments.id is the foreign key because it is called id.",
        right: "enrolments.student_id is the foreign key; students.id is the primary key it references.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "Which SQL clause filters individual rows before grouping?",
      hint: "It is not HAVING, which filters groups after aggregation.",
      answer: "WHERE filters rows before grouping; HAVING filters the groups afterwards.",
      feedback: {
        correct: "You separated row filtering from group filtering.",
        incorrect:
          "WHERE acts on rows before grouping; HAVING acts on the aggregated groups. Using HAVING for a row condition can produce the right answer slowly or not at all.",
      },
    },
    {
      id: "p2",
      prompt:
        "A query joins students to enrolments with an inner join. A pupil with no enrolments disappears. Which join keeps that pupil?",
      hint: "Which table must be preserved even when the other side has no match?",
      answer:
        "A LEFT JOIN with students on the left keeps every pupil and fills the enrolment columns with null where no match exists.",
      feedback: {
        correct: "You preserved the left table and accepted nulls on the missing side.",
        incorrect:
          "An inner join keeps only matches. A left join starting from students keeps the pupil and shows the absent enrolment as null.",
      },
    },
    {
      id: "p3",
      prompt:
        "Why can an index on a low-selectivity column fail to speed up a query?",
      hint: "Think about how many rows still match when the column has only two possible values.",
      answer:
        "If half the rows match, the database may still read a large fraction of the table; the index adds lookup work without narrowing the search enough. The optimiser may ignore it.",
      feedback: {
        correct: "You connected selectivity to the fraction of rows the query must still read.",
        incorrect:
          "An index is useful when it eliminates most rows. A column with two values leaves too many matches, so a scan may be cheaper than following many index entries.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Which SQL clause filters rows before they are grouped or returned?",
      modelAnswer: "WHERE",
      marking: [
        "Names the row-level filter rather than HAVING.",
        "Places it before grouping in the logical order.",
      ],
      check: { accepted: ["WHERE", "where", "the WHERE clause"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What kind of key uniquely identifies each row in its own table?",
      modelAnswer: "primary key",
      marking: [
        "Names the key that owns identity in the table.",
        "Distinguishes it from a foreign key that references another table.",
      ],
      check: { accepted: ["primary key", "a primary key"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete filter_students(rows, minimum) so it returns the names of students whose grade is at least minimum, preserving their original order. Do not mutate the input list.",
      modelAnswer:
        "Iterate over the rows, compare each grade with the minimum using a greater-than-or-equal test, collect the matching names in a new list and return it.",
      marking: [
        "Includes a grade exactly equal to the minimum.",
        "Returns a new list and preserves the input order.",
      ],
      code: {
        starterCode:
          "def filter_students(rows, minimum):\n    names = []\n    # Add the filter.\n    return names\n\nprint(filter_students([(\"Ada\", 82), (\"Ben\", 80), (\"Cleo\", 79)], 80))\n",
        tests: [
          { name: "the boundary is included", expectedStdout: "['Ada', 'Ben']" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A national dataset has 40 million exam records. A report filters by subject and year, then groups by school. Explain which index you would add first, why the order of columns in a composite index matters, and what write cost the school data pipeline accepts.",
      whyItTransfers:
        "The lesson's queries are small enough to check by eye. The national report adds scale and a composite filter, so the learner must apply selectivity and index order rather than repeat a single-column example.",
      answer:
        "Index (subject, year) or (year, subject), putting the more selective equality filter first, then the other equality column; both are equality predicates, so the order mainly affects prefix reuse. The index lets the database find the matching records without scanning 40 million rows. Every insert and update maintains the index, so the nightly load becomes slower and uses more storage; that is the accepted cost.",
      marking: [
        "Proposes an index covering the filter columns, not an arbitrary column.",
        "Explains that a composite index is ordered and supports a left prefix.",
        "Names the write and storage cost of maintaining the index.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does a WHERE clause do?",
      answer:
        "It filters individual rows before grouping or projection, keeping only rows whose condition is true.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is a foreign key?",
      answer:
        "A column that references a primary key in another table, enforcing that the relationship points to a real row.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why can an index make writes slower?",
      answer:
        "Every insert, update or delete must also update the index structure, which costs time and storage.",
      when: "month-later",
    },
  ],
  summary: [
    "A relational database stores entities in tables, identifies rows with primary keys and links tables with foreign keys.",
    "A query chooses rows with WHERE, columns with SELECT, related rows with JOIN and order with ORDER BY.",
    "An inner join drops unmatched rows; a left join preserves the left table and exposes missing matches as null.",
    "Indexes speed up selective reads but add write and storage cost, so they are chosen for real query patterns.",
  ],
});

export const COMPUTING_NETWORKS = defineGapLesson({
  conceptId: "networks",
  subject: "computing",
  curriculum: {
    reference: "GCSE Computer Science, computer networks and the internet",
    level: "Key Stage 4",
    note:
      "Scope cites the published computing subject content for networks, protocols and packet switching. The trace and programs are original.",
  },
  objectives: [
    {
      statement:
        "Explain how a message is split into packets, addressed, routed and reassembled, naming the role of IP and TCP.",
      evidence:
        "The learner describes a packet carrying source and destination addresses, being routed hop by hop, and TCP using sequence numbers to restore order and request missing data.",
    },
    {
      statement:
        "Distinguish latency from bandwidth and choose which one explains a stated slow experience.",
      evidence:
        "The learner says a video call stutters because of latency and jitter, while a large download is slow because of limited bandwidth.",
    },
    {
      statement:
        "Trace a DNS lookup and an HTTP request from a browser to a server, naming the client-server boundary.",
      evidence:
        "The learner orders DNS resolution, TCP connection, HTTP request, server response and rendering, and identifies which steps run on the client.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["binary-data"],
    check: [
      {
        id: "d1",
        question: "Why is data sent over a network represented in binary?",
        answer:
          "Digital links carry discrete signals, so text, images and instructions are encoded as sequences of bits that the receiver can decode.",
        targets: ["binary-data"],
      },
      {
        id: "d2",
        question: "What does an IP address identify on a network?",
        answer:
          "It identifies an interface's location on a network so packets can be addressed and routed toward it.",
        targets: ["binary-data"],
      },
    ],
  },
  introduction: {
    hook:
      "A message leaves a phone as one file and arrives at a server as many small packets. Some take a different route, one arrives late, and one is lost. The receiver still reconstructs the original message in the right order. The internet is not a wire from your device to a website; it is a collection of networks that agree on how to pass small addressed pieces toward a destination.",
    why:
      "Most explanations of the internet stop at “data travels in packets”. That is true and nearly useless without the addressing, routing and reassembly that make packets work. This lesson separates the jobs: IP moves a packet toward an address, TCP checks that the stream is complete and ordered, DNS turns a name into an address, and HTTP gives meaning to the request. Keeping those layers separate explains why a DNS failure, a packet loss and a slow server produce different symptoms.",
  },
  explanation: [
    {
      heading: "Packets are addressed pieces, not tiny messages",
      paragraphs: [
        "A packet carries a header and a payload. The header includes source and destination IP addresses, a protocol number and enough information for routers to forward it. The payload is a slice of the original data. Splitting a file into packets lets different pieces travel independently and lets the network share links among many conversations. A packet does not need to know the whole route; each router chooses the next hop toward the destination.",
        "Packets can arrive out of order, be duplicated or be lost. IP itself does not repair that; it is a best-effort delivery service. TCP adds sequence numbers, acknowledgements and retransmission so an application sees a reliable, ordered stream. UDP omits those guarantees and is used where timeliness matters more than completeness, such as a live call. The choice of transport is a design decision, not a detail hidden from the programmer.",
      ],
    },
    {
      heading: "DNS is a distributed name service",
      paragraphs: [
        "People use names; routers use addresses. DNS resolves a domain name to an IP address through a hierarchy of servers and caches. A resolver may answer from its cache, or ask a root server, a top-level-domain server and the authoritative server for the domain. The answer has a time-to-live so caches eventually refresh. DNS is itself a distributed database, and its caching is why a change can take time to appear everywhere.",
        "A DNS failure looks different from a server failure. If the name cannot resolve, the browser never reaches the address; if the address resolves but the server is down, the connection fails later. Understanding the order narrows the diagnosis. It also explains why a stale cache can send a user to an old address even after the service has moved.",
      ],
    },
    {
      heading: "Latency and bandwidth are different constraints",
      paragraphs: [
        "Bandwidth is the amount of data a link can carry per second; latency is the time a small message takes to travel to the destination and back. A satellite link can have high bandwidth and high latency. A large file may download quickly once started, while a video call still feels delayed because each turn taking a long round trip. Jitter is variation in latency, and it is what makes a call stutter even when the average delay looks acceptable.",
        "A network engineer measures the constraint that matters. Upgrading bandwidth will not fix a turn-taking delay caused by distance; moving a server closer or using a relay can reduce latency without adding capacity. Conversely, lowering latency will not make a huge backup transfer faster if the link is saturated. The symptom should decide the metric, not the other way round.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "computing.code",
      body:
        "The simulation splits a message into numbered packets and reassembles them by sequence number. It is a model, not a real TCP stack, but it shows why the number is necessary.",
      notation:
        "def packetize(message, size=4):\n    return [(i, message[i:i + size]) for i in range(0, len(message), size)]\n\ndef reassemble(packets):\n    ordered = sorted(packets, key=lambda packet: packet[0])\n    return \"\".join(payload for _, payload in ordered)\n\nparts = packetize(\"NETWORKS\")\nprint(reassemble(list(reversed(parts))))",
      caption:
        "The sequence number is the index of the slice. Sorting by it restores the original order even when the packets arrive reversed, which is the core of TCP's ordering job.",
    },
    {
      id: "r2",
      kind: "computing.trace",
      body:
        "The trace follows one request through resolution, connection and response. Each line names the layer doing the work, so a failure can be located rather than described as “the internet is down”.",
      notation:
        "browser: GET https://school.example\nDNS result = 203.0.113.10 (cache miss)\nTCP connection = established on 443 (3-way handshake)\nTLS session keys = derived; certificate = valid\nHTTP status = 200 OK; body = 18 KB HTML\nbrowser: parse HTML, request CSS and images",
      caption:
        "DNS happens before a connection can be made. The HTTP request happens after the connection and TLS are established, so a certificate error and a 404 are different failures.",
    },
    {
      id: "r3",
      kind: "computing.test",
      body:
        "The test checks loss and reordering, the two behaviours a toy reassembler must survive. A test that only sends packets in order would not exercise the sequence number at all.",
      notation:
        "parts = packetize(\"ABCDEFGH\")\nassert reassemble(parts) == \"ABCDEFGH\"\nassert reassemble(list(reversed(parts))) == \"ABCDEFGH\"\nassert reassemble([parts[0], parts[2], parts[1]]) == \"ABCDEFGH\"\n# A missing packet would leave a gap; TCP requests it again.",
      caption:
        "Reversing and shuffling the packets proves that reassembly uses the sequence number rather than arrival order. A missing packet is a separate reliability case.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 12 KB file is split into 1 KB packets. Explain what the receiver needs besides the payloads to reconstruct the file.",
      steps: [
        {
          move: "Each packet needs a sequence number or byte offset so the receiver knows where its payload belongs.",
          why:
            "Arrival order is not guaranteed. Without a position, the receiver can collect every piece and still not know how to join them.",
        },
        {
          move: "The receiver needs a known total length or an end marker to know when the file is complete.",
          why:
            "A missing final packet can look like a shorter file. The end condition distinguishes “finished” from “still waiting”.",
        },
        {
          move: "TCP acknowledgements and retransmission recover a missing packet; IP alone would leave a gap.",
          why:
            "IP is best effort. The reliability guarantee belongs to the transport layer, which is why the application can read a continuous stream.",
        },
      ],
      answer:
        "Payloads plus sequence positions, a known total length and a reliability mechanism such as TCP acknowledgements.",
    },
    {
      id: "w2",
      prompt:
        "A user can load a small page quickly but a video call lags. Which metric explains the call, and why is bandwidth not the first suspect?",
      steps: [
        {
          move: "The small page proves the connection works and has enough bandwidth for a modest transfer.",
          why:
            "A page loading quickly is evidence about capacity and reachability, but it does not measure how long a round trip takes under continuous interaction.",
        },
        {
          move: "A call depends on round-trip latency and jitter, because each participant waits for the other's audio.",
          why:
            "Conversation is turn-taking. A long or variable delay is audible even when the link can carry the video stream's bitrate.",
        },
        {
          move: "Measure round-trip time and jitter before adding bandwidth; a closer relay may help more.",
          why:
            "The symptom points to delay, not capacity. Buying more bandwidth would not shorten the distance or stabilise the delay.",
        },
      ],
      answer:
        "Latency and jitter explain the call; bandwidth is not the bottleneck when small transfers are fast.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A packet always follows the same route from sender to receiver.",
      whyItFails:
        "Routers choose a next hop based on their current routing information, and different packets can take different paths. A route can change while a connection is active. That is why packets carry addresses and sequence information rather than relying on a fixed circuit.",
      correction:
        "Think of each packet as addressed independently. The receiver reassembles by sequence number, and TCP handles loss or reordering across whatever paths were used.",
      contrast: {
        wrong: "The file travels down one wire from the server to me.",
        right: "The file is split into addressed packets that may take different routes and are reassembled at my device.",
      },
    },
    {
      id: "m2",
      belief: "More bandwidth always fixes a slow internet connection.",
      whyItFails:
        "Bandwidth is capacity, not delay. A call or game can be slow because each round trip takes too long, even when the link is mostly idle. Adding capacity does not reduce the speed of light or the number of hops.",
      correction:
        "Measure latency, jitter and packet loss as well as throughput. Choose the fix that matches the symptom: capacity for bulk transfer, proximity or routing for delay, and loss recovery for a damaged link.",
      contrast: {
        wrong: "The video call lags, so upgrade to a faster plan.",
        right: "The call lags because round-trip time is high; a closer server or relay may help more than extra bandwidth.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "What does DNS return for a domain name?",
      hint: "It is not the web page itself; it is the address a connection can use.",
      answer: "An IP address (and related records) that the client can use to reach the service.",
      feedback: {
        correct: "You separated name resolution from the page request.",
        incorrect:
          "DNS resolves the name to an address. The HTTP request for the page happens after the client knows where to connect.",
      },
    },
    {
      id: "p2",
      prompt:
        "Why can a packet arrive after a later packet, and what restores the order?",
      hint: "Routers forward independently; the transport layer has a number for each piece.",
      answer:
        "Different packets can take different routes or wait in different queues, so arrival order varies. TCP uses sequence numbers to restore the original order.",
      feedback: {
        correct: "You separated routing from the transport-layer ordering guarantee.",
        incorrect:
          "IP does not promise order. TCP's sequence numbers let the receiver sort the stream and detect a missing piece.",
      },
    },
    {
      id: "p3",
      prompt:
        "A school has a 1 Gbit/s link but a video call still stutters. Name one measurement to take before buying more bandwidth.",
      hint: "The link has capacity; what else affects a live conversation?",
      answer:
        "Measure round-trip latency, jitter and packet loss. A call can stutter because delay varies or packets are lost even when throughput is plentiful.",
      feedback: {
        correct: "You measured the quality of the path rather than assuming capacity is the only constraint.",
        incorrect:
          "Bandwidth is only one property. Latency, jitter and loss directly affect a live call and can be poor on a fast link.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Which service translates a human-readable domain name into an IP address?",
      modelAnswer: "DNS",
      marking: [
        "Names the domain name system rather than HTTP or TCP.",
        "Recognises that resolution happens before the connection.",
      ],
      check: { accepted: ["DNS", "the DNS", "domain name system"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "What is the small addressed unit called that carries a slice of data across an IP network?",
      modelAnswer: "packet",
      marking: [
        "Names the network-layer unit, not a file or a frame only.",
        "Recognises that the original data is split into several units.",
      ],
      check: { accepted: ["packet", "a packet", "data packet"] },
    },
    {
      id: "a3",
      kind: "code",
      prompt:
        "Complete packetize and reassemble so a message is split into numbered four-character packets and restored in sequence even when the packet list is shuffled.",
      modelAnswer:
        "Packetize with a loop over the message in steps of four, storing the start index with each slice; reassemble by sorting the pairs on that index and joining the payloads.",
      marking: [
        "Stores a sequence position with every payload.",
        "Sorts by the position before joining, rather than trusting arrival order.",
      ],
      code: {
        starterCode:
          "def packetize(message, size=4):\n    return []\n\ndef reassemble(packets):\n    return \"\"\n\nparts = packetize(\"NETWORKS\")\nprint(reassemble(list(reversed(parts))))\n",
        tests: [
          { name: "reversed packets reassemble in order", expectedStdout: "NETWORKS" },
        ],
      },
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A rural clinic loses connectivity during a storm. It needs to send a 20 MB patient record and make an urgent voice call. Explain how packet loss, latency and bandwidth affect each task differently, and propose one network design change that helps the call without assuming more bandwidth.",
      whyItTransfers:
        "The lesson separates the layers on a healthy network. The clinic adds loss and a life-critical priority, so the learner must choose a fix for the actual symptom and state the trade-off rather than repeat a definition.",
      answer:
        "The 20 MB record is bandwidth-sensitive and can tolerate some delay; TCP retransmits lost packets, so it eventually completes if the link stays up. The call is latency- and loss-sensitive: retransmission arrives too late for conversation, so packet loss causes gaps and jitter makes turn-taking unstable. A closer relay or a lower-latency route helps the call; prioritising voice traffic can protect it from the bulk transfer, at the cost of slowing the record.",
      marking: [
        "Distinguishes the bulk transfer's bandwidth sensitivity from the call's latency and loss sensitivity.",
        "Explains why TCP retransmission is unsuitable for real-time audio.",
        "Proposes a routing or prioritisation change and names its trade-off.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What is the job of IP addressing?",
      answer:
        "It gives a packet a destination so routers can forward it toward the right network; delivery is best effort.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Why does TCP use sequence numbers?",
      answer:
        "To restore the original order and detect missing or duplicated data when packets arrive out of order.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What is the difference between latency and bandwidth?",
      answer:
        "Latency is delay for a message to travel; bandwidth is how much data a link can carry per unit time.",
      when: "month-later",
    },
  ],
  summary: [
    "IP addresses and routes packets on a best-effort basis; packets can take different paths and arrive out of order.",
    "TCP adds sequence numbers, acknowledgements and retransmission so an application sees a reliable ordered stream.",
    "DNS resolves names to addresses before a client can connect; HTTP carries the request after the connection exists.",
    "Latency, jitter and bandwidth explain different slow experiences, so the symptom should choose the measurement.",
  ],
});
