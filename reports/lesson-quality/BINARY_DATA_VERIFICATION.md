# Binary data — independent lesson verification

Date: 2026-11-08

Scope: `lib/lessons/authored/computing-binary.ts`, its catalogue record, and its
learner-facing page at 1280, 768, 375 and 320 px.

This is a verification record, not a claim that the lesson teaches well. It has
no subject-teacher review and no learner-testing record.

## 1. Independent Learning Completeness

| Criterion | Evidence |
|---|---|
| Measurable objectives | 3: 8-bit conversion with a check; binary addition and overflow; hexadecimal as four-bit shorthand |
| Prerequisite knowledge and diagnostic | 2 checks, both targeting the declared prerequisite `number-bases` |
| Conceptual introduction | Hook separates a stored pattern from its meaning; rationale separates bits, place value, hexadecimal and encoding |
| Accurate explanations or representations | 4 explanation sections and 4 computing blocks: code, trace, test, debug |
| Fully reasoned worked examples | 2: `156 → 1001 1100`, and `1011 0110 + 0010 1101`; every move has a reason |
| Misconceptions with failure explanations | 3: `10` read as ten; hexadecimal treated as machine storage; `2⁸` treated as the maximum value |
| Guided practice with usable hints | 3: binary-to-denary, denary-to-binary, four-bit addition with overflow |
| Independently markable assessment | 4 items: a code task plus 3 deterministic short answers; 4/2/3/2 marking criteria |
| Transfer challenge with explanation | 1: an eight-bit sensor reports 300; 4 criteria |
| Meaningful retrieval | 3 prompts at next-day, week-later and month-later |
| Appropriate feedback | Correct and incorrect feedback for every guided item; code and short-answer marking notes |
| Mathematical and scientific validation | Place values, conversions, carries, overflow, hexadecimal and encoding checked below |
| Learner-facing rendering | 18 prose paragraphs, 4 representation blocks, 230-word transfer, 64-word retrieval |

The catalogue marks this `machine_checked` after the contract gate passes. That
rung means the deterministic checks pass; it does **not** mean a teacher approved
the lesson or that a learner understood it.

## 2. Scientific and technical validation

Sources inspected:

- Cambridge IGCSE Computer Science 0478 syllabus, 2026–2028:
  https://www.cambridgeinternational.org/Images/697167-2026-2028-syllabus.pdf
- Cambridge IGCSE Computer Science 0478 syllabus, 2029–2031, for the later
  wording of the same number-system outcomes:
  https://www.cambridgeinternational.org/Images/763431-2029-2031-syllabus.pdf

The 2026–2028 syllabus covers binary representation, denary/binary/hexadecimal
conversion, the benefit of hexadecimal, adding two positive 8-bit integers, and
overflow when a value exceeds 255 in an 8-bit register. It also covers text,
sound and image representation in the following section. The lesson stays within
those outcomes; it does not introduce two’s complement, shifts or compression.

| Claim checked | Finding |
|---|---|
| Computers use binary because a storage element has two stable states | Consistent with the syllabus rationale that all data is converted to binary for processing and storage. |
| Eight bits give 256 patterns, representing unsigned values 0–255 | Correct. `2⁸ = 256`; the largest pattern is `1111 1111 = 255`. |
| `156 = 1001 1100` | Correct: `128 + 16 + 8 + 4 = 156`. |
| `202 = 1100 1010` | Correct: `128 + 64 + 8 + 2 = 202`. |
| `156 = 9C` and `202 = CA` in hexadecimal | Correct: `1001 1100` → `9C`; `1100 1010` → `CA`. |
| `10` in hexadecimal is `0A`, not decimal ten | Correct. A byte has two nibbles, so the high nibble is `0`. |
| `1011 0110 + 0010 1101 = 1110 0011` | Correct: `182 + 45 = 227`; the right nibble `6 + 13 = 19` leaves `0011` and carries 1; `11 + 2 + 1 = 14 = 1110`. |
| `1011 + 0110` overflows a four-bit register | Correct: `11 + 6 = 17 = 10001`; four bits hold only `0001` and the fifth bit is the carry out. |
| `300 = 1 0010 1100`; its low eight bits are `0010 1100 = 44` | Correct. Three hundred needs nine bits, so an eight-bit field cannot represent it. |
| ASCII maps `0100 0001` to `A`; Unicode extends the character set | Correct. The lesson keeps the code point separate from the stored bits. |
| An RGB pixel uses three colour channels; sound uses samples of amplitude | Correct at the intended level. The lesson does not claim a fixed bit depth for every format. |

The code in the lesson was executed independently. It returns:

- `to_binary(0) = 00000000`
- `to_binary(156) = 10011100`
- `to_binary(255) = 11111111`
- `to_hex_byte(156) = 9C`
- `to_hex_byte(10) = 0A`

The code rejects values outside `0..255` rather than wrapping silently, and the
transfer task distinguishes the arithmetic truth (`300`) from the low eight bits
a careless receiver might store (`44`).

## 3. Technical verification

| Check | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run verify` | 4,630 passed, 0 failed |
| `npm run verify:lessons` | exit 0, including the 89-assertion biology gate and the 61-assertion chemistry gate |
| `npm run build` | exit 0 |
| `npm run verify:lesson` | 389 passed, 0 failed |
| Browser widths for `binary-data` | 1280 × 900, 768 × 1024, 375 × 667, 320 × 640; no sideways scroll |
| `npm run verify:a11y` | 61 passed, 0 failed on a clean run; one gated surface was not audited |

The first post-walk accessibility run failed one existing `/access` control
assertion at 72 passed, 1 failed. The `/access` checks passed on a clean rerun,
which means the audit is not a stable enough measurement to support a broad
accessibility claim. Screen-reader announcements, switch/eye-gaze input, 200%
text reflow and colour-contrast ratios remain unmeasured.

## 4. Limitations

- **No educator review.** The Cambridge outcomes and the arithmetic are checked,
  but no computer-science teacher has approved the wording, code style or
  difficulty for a particular route.
- **No learner evidence.** No pupil has been tested for independent transfer or
  delayed retention.
- **Automated checks cannot detect every future error.** They pin the claims and
  calculations above, not every sentence an author may add later.
- **The build was compiled, not served.** No production server was restarted and
  nothing was deployed.

## Verdict

`binary-data` satisfies the 13 structural criteria and the checked scientific and
arithmetic claims. It remains `draft` in source and `machine_checked` in the
catalogue, with **0 educator reviews and 0 learner-testing records**. It is ready
for subject-teacher review, not for a claim of proven teaching quality.
