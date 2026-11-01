// ─────────────────────────────────────────────────────────────────────────────
// AUTHORED INSTRUCTIONAL CONTENT
//
// The adaptive engine chooses among these activities; it never writes them.
// Every entry is static, named, and carries the arithmetic it depends on. An
// activity with no validation record is not served. This is the content-side
// half of the rule "do not let AI invent mathematical content".
//
// The modular-arithmetic pilot is deliberately a complete vertical slice: all
// nine strategies for one ability, targeted variants for the beliefs the brief
// names, and the two prerequisite abilities' first lessons.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  EvidenceType,
  InstructionStrategy,
  InstructionalActivity,
} from "./types";

const EXPECTED = {
  application: ["application"] as readonly EvidenceType[],
  independence: ["independence"] as readonly EvidenceType[],
  discovery: ["discovery"] as readonly EvidenceType[],
  proof: ["proof"] as readonly EvidenceType[],
  transfer: ["transfer"] as readonly EvidenceType[],
};

const CORE: InstructionalActivity[] = [
  {
    id: "mod-residue-foundational",
    abilityId: "nt-mod-residue-classes",
    strategy: "FOUNDATIONAL",
    title: "A remainder is a class, not a number",
    objective: "Explain why 17, 22 and 32 can share a remainder even though they are different numbers.",
    body: [
      "Divide 17 by 5: 17 = 3 × 5 + 2. The quotient is 3 and the remainder is 2. Divide 22 by 5: 22 = 4 × 5 + 2. The quotient changed, but the remainder did not.",
      "The remainder names a whole class of numbers: every number that leaves 2 when divided by 5. That class contains 2, 7, 12, 17, 22 and infinitely many more. Sharing a remainder does not make those numbers equal.",
      "A modulus is the number you divide by. Choosing modulus 5 asks: which remainder class does this number belong to? The answer is a class, not the original number.",
    ],
    hints: [
      "Write each number as quotient × 5 + remainder before comparing them.",
      "The quotient is allowed to change; the remainder is the property being compared.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Names the remainder of each number on division by 5.",
      "Says the numbers are in the same class, not that they are equal.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "17 = 3×5+2, 22 = 4×5+2, 32 = 6×5+2; all have remainder 2 on division by 5.",
    },
  },
  {
    id: "mod-congruence-foundational",
    abilityId: "nt-mod-congruence",
    strategy: "FOUNDATIONAL",
    title: "What the congruence symbol claims",
    objective: "Read a ≡ b (mod n) as a statement about divisibility, not equality.",
    body: [
      "17 ≡ 2 (mod 5) is read '17 is congruent to 2 modulo 5'. It does not say 17 = 2. It says that 17 and 2 leave the same remainder when divided by 5.",
      "The precise test is: n divides a − b. Here 17 − 2 = 15, and 5 divides 15, so the congruence is true. This definition is the one to use when a proof or a negative number makes the remainder picture awkward.",
      "The modulus is part of the claim. 17 ≡ 2 (mod 5) is true, while 17 ≡ 2 (mod 7) is false because 7 does not divide 15. A congruence without its modulus is incomplete.",
    ],
    hints: [
      "Ask whether n divides the difference a − b.",
      "Check the modulus as carefully as the numbers: changing it changes the truth of the claim.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Uses the difference test rather than treating the symbol as '='.",
      "Keeps the modulus attached to the claim.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "17−2 = 15; 5 divides 15, but 7 does not.",
    },
  },
  {
    id: "mod-select-foundational",
    abilityId: "nt-mod-select-modulus",
    strategy: "FOUNDATIONAL",
    title: "Choosing the question before the modulus",
    objective: "Name the property to be tested, then choose a modulus whose remainder classes preserve that property.",
    body: [
      "A modulus is not a decoration added after the calculation. It is the choice of which distinctions you want to keep. Modulus 4 keeps the remainder on division by 4; modulus 6 keeps a different distinction.",
      "For divisibility by 4, modulus 4 is exact: n ≡ 0 (mod 4) means 4 divides n, and that is precisely the property being tested. The modulus matches the divisor.",
      "A modulus that is not the divisor can collapse two numbers into the same class even when only one has the property. 8 and 14 both leave remainder 2 on division by 6, but 8 is divisible by 4 and 14 is not. So modulus 6 cannot decide the question.",
    ],
    hints: [
      "First write the property in symbols: for example, '4 divides n'.",
      "Test the proposed modulus on two numbers that differ in the property but share a residue. If that happens, the modulus is not fit for the question.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "States the property before choosing a modulus.",
      "Uses a counterexample to reject a modulus that cannot distinguish the property.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "8 ≡ 2 (mod 6) and 14 ≡ 2 (mod 6), but 4 | 8 and 4 ∤ 14.",
    },
  },
  {
    id: "mod-select-intuitive",
    abilityId: "nt-mod-select-modulus",
    strategy: "INTUITIVE",
    title: "The clock decides what is the same",
    objective: "Use a familiar cycle to explain why a modulus is chosen for the distinction it makes.",
    body: [
      "On a 12-hour clock, 15:00 and 3:00 show the same position. We write 15 ≡ 3 (mod 12) because 15 − 3 = 12, a multiple of 12. The clock deliberately forgets how many whole turns have happened.",
      "That forgetting is useful when the question is about position, and useless when the question is about the total number of hours. The modulus has to match the question. A 24-hour clock keeps a distinction that a 12-hour clock discards.",
      "Choosing a modulus is therefore a design decision: keep the distinction the question needs, and discard the rest. There is no universally 'best' modulus, only a fit or a mismatch.",
    ],
    hints: [
      "Ask what the cycle is: 12 hours, 7 days, 4 seats.",
      "Ask what must remain visible after the cycle is applied.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Connects a modulus to a real cycle.",
      "Explains what information the modulus deliberately discards.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "15−3 = 12, so 15 ≡ 3 (mod 12); the positions agree on a 12-hour clock.",
    },
  },
  {
    id: "mod-select-derivation",
    abilityId: "nt-mod-select-modulus",
    strategy: "DERIVATION",
    title: "Why modulus d is exact for divisibility by d",
    objective: "Derive the equivalence between n ≡ 0 (mod d) and d divides n.",
    body: [
      "Write n = qd + r, where 0 ≤ r < d. The remainder is r. If n ≡ 0 (mod d), then d divides n − 0 = n, so d divides n. Conversely, if d divides n, then n = kd for some integer k, so the remainder on division by d is 0.",
      "Therefore n ≡ 0 (mod d) exactly when d divides n. This is why choosing the divisor itself is exact: no information about divisibility is lost.",
      "Now take a different modulus m. The statement n ≡ 0 (mod m) says m divides n. If m is not the divisor d, that is a different claim. It may be silent about d, or it may be stricter (when m is a multiple of d), but it is not the same test. The contrast example makes the failure visible.",
    ],
    hints: [
      "Start from the division algorithm n = qd + r.",
      "A congruence to 0 means the modulus divides the number.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Derives both directions of the equivalence.",
      "Distinguishes 'm divides n' from 'd divides n'.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "n = qd + r; n ≡ 0 (mod d) iff d | n, by the division algorithm.",
    },
  },
  {
    id: "mod-select-worked",
    abilityId: "nt-mod-select-modulus",
    strategy: "WORKED_EXAMPLE",
    title: "Choose a modulus for divisibility by 4",
    objective: "Watch a complete choice, including the rejected modulus and the reason it fails.",
    body: [
      "Question: choose a modulus that decides whether 8 and 14 are divisible by 4.",
      "Step 1. Write the property: 4 divides n. Step 2. Choose modulus 4, because n ≡ 0 (mod 4) is exactly the statement 4 divides n. Step 3. Compute: 8 ≡ 0 (mod 4), so 8 is divisible by 4; 14 ≡ 2 (mod 4), so 14 is not.",
      "Why not modulus 6? Because 8 ≡ 2 (mod 6) and 14 ≡ 2 (mod 6). They share a residue even though they differ on the property. A modulus that gives the same answer to both cases cannot decide the question. The rejection is part of the solution, not an afterthought.",
    ],
    hints: [
      "Match the modulus to the divisor named in the question.",
      "Test a rejected modulus on a pair that differs in the property but shares a residue.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Chooses modulus 4 and computes both remainders.",
      "Explains why modulus 6 is unfit using 8 and 14.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "8 ≡ 0 (mod 4), 14 ≡ 2 (mod 4); 8 ≡ 2 (mod 6) and 14 ≡ 2 (mod 6).",
    },
  },
  {
    id: "mod-select-scaffolded",
    abilityId: "nt-mod-select-modulus",
    strategy: "SCAFFOLDED",
    title: "Choose for divisibility by 9 — with the first step supplied",
    objective: "Choose and justify a modulus for 45 and 84, with the reasoning structure supplied.",
    body: [
      "Question: choose a modulus that decides whether 45 and 84 are divisible by 9.",
      "The first step is supplied: write the property as 9 divides n. Your next step is to choose the modulus that makes 'remainder 0' mean exactly that property.",
      "Compute both remainders with your chosen modulus, then test one rejected modulus against the pair. Explain what the rejected modulus fails to separate. The final sentence must name the property, not just the number.",
    ],
    hints: [
      "The exact modulus for divisibility by d is d.",
      "45 = 5 × 9, so its remainder is 0. 84 = 9 × 9 + 3, so its remainder is 3.",
      "If you try modulus 6, compare what 45 and 84 leave behind and whether that answers the question about 9.",
    ],
    expectedEvidence: EXPECTED.independence,
    successCriteria: [
      "Chooses 9 and computes 45 ≡ 0, 84 ≡ 3 (mod 9).",
      "Explains the fit between the modulus and the property.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "45 = 5×9, 84 = 9×9+3; 45 ≡ 0 (mod 9), 84 ≡ 3 (mod 9).",
    },
  },
  {
    id: "mod-select-contrastive",
    abilityId: "nt-mod-select-modulus",
    strategy: "CONTRASTIVE",
    title: "Two moduli, one question",
    objective: "Compare a modulus that decides divisibility by 4 with one that cannot.",
    body: [
      "Successful approach: to decide divisibility by 4, use modulus 4. 8 ≡ 0 and 14 ≡ 2, so the residues separate the cases and the answer is immediate.",
      "Unsuccessful approach: use modulus 6. 8 ≡ 2 and 14 ≡ 2, so the residues are identical even though 8 is divisible by 4 and 14 is not. The modulus has erased exactly the distinction the question needed.",
      "The contrast is not '6 is wrong arithmetic'. Both congruences are true. The failure is a mismatch between the modulus and the property. A modulus is fit when its residue classes do not merge two cases the question must separate.",
      "Now use the same test on 20 and 26 with modulus 6: both are 2, yet 20 is divisible by 4 and 26 is not. The pattern is not a coincidence about 8 and 14.",
    ],
    hints: [
      "Both calculations can be correct while the choice of modulus is wrong.",
      "Look for two numbers with the same residue but different answers to the property question.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Identifies the merged residue class as the failure.",
      "Uses a second pair to show the failure is structural.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "8 ≡ 2 (mod 6), 14 ≡ 2 (mod 6), 20 ≡ 2 (mod 6), 26 ≡ 2 (mod 6); 4 | 8,20 but 4 ∤ 14,26.",
    },
  },
  {
    id: "mod-select-discovery",
    abilityId: "nt-mod-select-modulus",
    strategy: "DISCOVERY",
    title: "No label: find the modulus",
    objective: "Recognise the needed modulus without being told which strategy or which modulus to use.",
    body: [
      "A workshop stamps every fourth item with a star. A quality check receives a tray of item numbers and must decide which numbers were stamped. You are not told which modulus to use.",
      "Choose a modulus, test it on at least two numbers that should receive different answers, and write a sentence explaining why the modulus preserves the distinction. If your first choice fails, keep the counterexample and revise the choice.",
      "A second tray uses a five-item cycle instead. Decide whether the same modulus still works. Do not ask for the rule first; the point of this task is to recognise the structure from the situation.",
    ],
    hints: [
      "What cycle does the situation describe?",
      "A modulus is fit only if two cases that differ in the answer cannot share a residue.",
    ],
    expectedEvidence: EXPECTED.discovery,
    successCriteria: [
      "Chooses a modulus without a supplied label.",
      "Justifies it with a case that would fail under a different modulus.",
      "Recognises when the cycle changes and the modulus must change.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "Every fourth item: n ≡ 0 (mod 4). Every fifth item: n ≡ 0 (mod 5); neither modulus answers the other cycle.",
    },
  },
  {
    id: "mod-select-proof",
    abilityId: "nt-mod-select-modulus",
    strategy: "PROOF_COACHING",
    title: "Prove the choice, not just the examples",
    objective: "Build a general argument that modulus d is exact for divisibility by d.",
    body: [
      "A learner writes: 'I tried 8, 12 and 20 with modulus 4 and they all worked.' That is evidence, not a proof. It cannot establish the claim for every integer.",
      "Claim: for every integer n, n ≡ 0 (mod d) if and only if d divides n. Proof. By the division algorithm, n = qd + r with 0 ≤ r < d. If n ≡ 0 (mod d), then d divides n − 0 = n. Conversely, if d divides n, write n = kd; the remainder is 0, so n ≡ 0 (mod d).",
      "The proof uses the definition for all n, not a list of examples. Now write the converse of a different claim and decide whether it is true: 'if n ≡ 0 (mod 6), then n ≡ 0 (mod 3)'. Prove it or give a counterexample, and say which direction fails.",
    ],
    hints: [
      "Start with the division algorithm: n = qd + r.",
      "A proof must cover every n; three examples cannot do that.",
      "For the last claim, 6 divides n implies 3 divides n, but the converse is false: 3 divides 9 while 6 does not.",
    ],
    expectedEvidence: EXPECTED.proof,
    successCriteria: [
      "Uses the division algorithm rather than examples.",
      "States both directions explicitly.",
      "Distinguishes a true implication from its false converse.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "n = qd + r; d | n iff r = 0. 6 | n implies 3 | n, but 3 | 9 and 6 ∤ 9.",
    },
  },
  {
    id: "mod-select-transfer",
    abilityId: "nt-mod-select-modulus",
    strategy: "TRANSFER",
    title: "A shelf code you have not seen",
    objective: "Apply modulus selection inside an unfamiliar combined problem.",
    body: [
      "A library gives each new book a code that increases by 1. Codes are assigned to one of seven shelves in a repeating cycle. A book's shelf is its code modulo 7. A second, independent label marks every code that is a multiple of 3.",
      "A librarian has two codes, 45 and 60, and asks two different questions: are they on the same shelf, and are they both marked by the second label? Choose the modulus for each question separately, then explain why a single modulus that encodes both cycles must use the least common multiple.",
      "Finally, a code is described as 'shelf 2 and marked'. Write the two congruence conditions, find the smallest positive code satisfying both, and prove that adding 21 preserves both conditions. This combines modulus selection with a proof about periods.",
    ],
    hints: [
      "The shelf question is about equality of residues; the label question is about a residue being zero.",
      "The two conditions have periods 7 and 3; a combined pattern repeats every 21.",
    ],
    expectedEvidence: EXPECTED.transfer,
    successCriteria: [
      "Uses modulus 7 for the shelf question and modulus 3 for the label question.",
      "Finds a code satisfying both conditions.",
      "Proves that adding 21 preserves both.",
    ],
    validation: {
      source: "authored-static",
      arithmeticCheck: "45 ≡ 3 (mod 7), 60 ≡ 4 (mod 7); 45 ≡ 0 (mod 3), 60 ≡ 0 (mod 3). Code 2 (mod 7), 0 (mod 3): 9 is the smallest positive; 9+21=30 preserves both.",
    },
  },
  {
    id: "mod-select-foundational-equals",
    abilityId: "nt-mod-select-modulus",
    strategy: "FOUNDATIONAL",
    title: "Congruence is not equality",
    objective: "Separate the claim 17 ≡ 2 (mod 5) from the false claim 17 = 2.",
    body: [
      "17 ≡ 2 (mod 5) is true. 17 = 2 is false. Both statements contain the same two numbers, so the difference has to be the symbol and the modulus.",
      "The congruence says 5 divides 17 − 2. It compares remainders, not sizes. 17 and 2 are in the same residue class modulo 5, but they are different numbers.",
      "A useful check: if a congruence were an equality, then adding the modulus would be impossible — 22 would also equal 2, and then 17 would equal 22. The notation would collapse every number in the class. It does not.",
    ],
    hints: [
      "Read the congruence aloud as 'leaves the same remainder', never as 'equals'.",
      "Use 17, 22 and 2: all congruent modulo 5, all different numbers.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "States that 17 and 2 are not equal.",
      "Explains the congruence by the difference 17 − 2 being a multiple of 5.",
    ],
    misconceptionId: "mod-equals",
    validation: {
      source: "authored-static",
      arithmeticCheck: "17−2 = 15 = 3×5, so 17 ≡ 2 (mod 5); 17 ≠ 2.",
    },
  },
  {
    id: "mod-select-intuitive-residue",
    abilityId: "nt-mod-select-modulus",
    strategy: "INTUITIVE",
    title: "The same remainder, not the same number",
    objective: "See a residue class as a set of numbers that share a landing point.",
    body: [
      "Imagine stepping around a five-seat circle. Seat numbers repeat: 1, 2, 3, 4, 0, 1, 2, 3, 4, 0. Landing on seat 2 after 17 steps and after 22 steps does not mean the journeys were the same length.",
      "The modulus describes the circle; the residue describes the seat. Different journey lengths can share a seat. That is why 17 ≡ 22 (mod 5) is a statement about landing position, not about the number of steps.",
      "When a question asks for a modulus, first ask what the circle represents. The modulus is the size of the cycle that makes the repeated position meaningful.",
    ],
    hints: [
      "Draw the five seats and count around them.",
      "The seat is the residue; the number of steps is the original number.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Explains a residue class as a set of landing positions.",
      "Does not identify the position with the journey length.",
    ],
    misconceptionId: "mod-residue-class",
    validation: {
      source: "authored-static",
      arithmeticCheck: "17 = 3×5+2 and 22 = 4×5+2; both land on seat 2 of a five-seat cycle.",
    },
  },
  {
    id: "mod-select-contrastive-arbitrary",
    abilityId: "nt-mod-select-modulus",
    strategy: "CONTRASTIVE",
    title: "Why a larger modulus is not automatically better",
    objective: "Contrast a fit modulus with an arbitrary one using the same pair of numbers.",
    body: [
      "Question: are 8 and 14 divisible by 4? With modulus 4, the answers separate: 8 ≡ 0 and 14 ≡ 2. With modulus 6, both are 2. The larger modulus kept more information about the quotient, but erased the distinction the question needed.",
      "An arbitrary choice is not neutral. It can make two different cases look identical. The test is not 'is the modulus big?' but 'can two cases with different answers share a residue?'",
      "Try modulus 10 on 8 and 18: both leave 8, while 8 is divisible by 4 and 18 is not. A modulus can be larger than the divisor and still merge the cases. Fit is about the property, not the size.",
    ],
    hints: [
      "Compare the residues of a pair that should get different answers.",
      "A larger modulus can still merge the cases the question must separate.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Rejects modulus 6 using the shared residue 2.",
      "Rejects modulus 12 using 8 and 20.",
      "States the fit criterion in terms of the property.",
    ],
    misconceptionId: "mod-arbitrary",
    validation: {
      source: "authored-static",
      arithmeticCheck: "8 ≡ 2 (mod 6) and 14 ≡ 2 (mod 6); 8 ≡ 8 (mod 10) and 18 ≡ 8 (mod 10); 4 | 8 and 4 ∤ 18.",
    },
  },
  {
    id: "mod-select-worked-negative",
    abilityId: "nt-mod-select-modulus",
    strategy: "WORKED_EXAMPLE",
    title: "A negative number still has a residue",
    objective: "Reduce −3 modulo 5 without losing the sign.",
    body: [
      "Question: what is −3 mod 5? Use the definition: −3 = q × 5 + r with 0 ≤ r < 5. Taking q = −1 gives −3 = −5 + 2, so r = 2. Therefore −3 ≡ 2 (mod 5).",
      "Check with the difference test: −3 − 2 = −5, and 5 divides −5. The congruence is true. The remainder is 2, not −3 and not −2.",
      "The common slip is to subtract in the wrong order: 3 − (−3) = 6, then notice 5 does not divide 6. The order matters because the definition is a − b, and reversing it changes the sign of the difference.",
    ],
    hints: [
      "Write the division equation with a quotient that makes the remainder lie from 0 to 4.",
      "The remainder is never negative when the modulus is positive.",
    ],
    expectedEvidence: EXPECTED.application,
    successCriteria: [
      "Finds quotient −1 and remainder 2.",
      "Checks with −3 − 2 = −5.",
    ],
    misconceptionId: "mod-negative-residue",
    validation: {
      source: "authored-static",
      arithmeticCheck: "−3 = (−1)×5 + 2, so −3 ≡ 2 (mod 5); −3−2 = −5.",
    },
  },
  {
    id: "mod-select-proof-gap",
    abilityId: "nt-mod-select-modulus",
    strategy: "PROOF_COACHING",
    title: "A proof needs the definition, not a pattern",
    objective: "Replace 'it worked for these examples' with a general argument about divisibility.",
    body: [
      "Claim: if a ≡ b (mod n) and b ≡ c (mod n), then a ≡ c (mod n). A learner writes 'I tested 17, 7 and 2 modulo 5 and it worked'. That is not a proof; it is one instance of the claim.",
      "Proof. By definition, n divides a − b and n divides b − c. Therefore n divides their sum, (a − b) + (b − c) = a − c. By definition, a ≡ c (mod n). The argument uses only the definition and works for every a, b, c and n.",
      "Now write the converse: if a ≡ c (mod n), must a ≡ b (mod n)? Decide whether it is true. If it is not, give a counterexample and say which premise is missing. The habit to build is naming the definition before the symbols do the work.",
    ],
    hints: [
      "Write both congruences as divisibility statements.",
      "Add the two differences; the b terms cancel.",
      "For the converse, choose a modulus and three numbers where the first and third agree but the middle does not.",
    ],
    expectedEvidence: EXPECTED.proof,
    successCriteria: [
      "Uses divisibility of a − b and b − c.",
      "Shows n divides a − c.",
      "Recognises the converse is not generally true.",
    ],
    misconceptionId: "mod-proof-gap",
    validation: {
      source: "authored-static",
      arithmeticCheck: "(a−b)+(b−c) = a−c; if n divides both differences, it divides their sum. Converse fails: 2 ≡ 2 (mod 5) but 2 ≢ 3 (mod 5).",
    },
  },
];

/** The target ability's nine strategies, plus the targeted variants above. */
export const INSTRUCTIONAL_CONTENT: readonly InstructionalActivity[] = CORE;

export const CONTENT_BY_ID: Readonly<Record<string, InstructionalActivity>> = Object.fromEntries(
  INSTRUCTIONAL_CONTENT.map((activity) => [activity.id, activity]),
);

export interface ActivityLookup {
  readonly abilityId: string;
  readonly strategy: InstructionStrategy;
  readonly misconceptionId?: string | null;
}

export function activityFor(lookup: ActivityLookup): InstructionalActivity {
  const exact = INSTRUCTIONAL_CONTENT.find(
    (activity) =>
      activity.abilityId === lookup.abilityId &&
      activity.strategy === lookup.strategy &&
      (lookup.misconceptionId
        ? activity.misconceptionId === lookup.misconceptionId
        : activity.misconceptionId === undefined),
  );
  const fallback =
    exact ??
    INSTRUCTIONAL_CONTENT.find(
      (activity) =>
        activity.abilityId === lookup.abilityId &&
        activity.strategy === lookup.strategy &&
        activity.misconceptionId === undefined,
    );
  if (!fallback) {
    throw new Error(
      `No validated instructional activity for ${lookup.abilityId}/${lookup.strategy}` +
        (lookup.misconceptionId ? `/${lookup.misconceptionId}` : ""),
    );
  }
  if (!fallback.validation.arithmeticCheck.trim()) {
    throw new Error(`Instructional activity ${fallback.id} has no arithmetic validation`);
  }
  return fallback;
}

/** The gate a new activity must pass before it can be served. */
export function contentValidationErrors(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const activity of INSTRUCTIONAL_CONTENT) {
    if (ids.has(activity.id)) errors.push(`duplicate activity id: ${activity.id}`);
    ids.add(activity.id);
    if (activity.body.length === 0) errors.push(`${activity.id}: empty body`);
    if (activity.successCriteria.length === 0) errors.push(`${activity.id}: no success criteria`);
    if (activity.expectedEvidence.length === 0) errors.push(`${activity.id}: no expected evidence`);
    if (!activity.validation.arithmeticCheck.trim()) errors.push(`${activity.id}: no arithmetic check`);
  }
  for (const strategy of [
    "FOUNDATIONAL",
    "INTUITIVE",
    "DERIVATION",
    "WORKED_EXAMPLE",
    "SCAFFOLDED",
    "CONTRASTIVE",
    "DISCOVERY",
    "PROOF_COACHING",
    "TRANSFER",
  ] as const) {
    if (!INSTRUCTIONAL_CONTENT.some((a) => a.abilityId === "nt-mod-select-modulus" && a.strategy === strategy)) {
      errors.push(`nt-mod-select-modulus: missing ${strategy} activity`);
    }
  }
  return errors;
}
