---
code: IN
name: India
status: INITIAL_RESEARCH
income_group: lower-middle
routes: 1
specs: in-cbse, in-icse
updated: 2026-11-13
---

# India (IN)

> **Research status: `INITIAL_RESEARCH`.** India has national and state boards,
> private and government schools, and wide rural/urban differences. This profile
> records a first set of sourced signals; it does not establish one Indian
> classroom, one syllabus, or a reviewed CBSE/ICSE/state mapping.

## 1. National school structure

The registry records **India · Secondary**, Classes 8–12, with CBSE and ICSE
specifications and a state-board option. The registry's source is the CBSE Class
X mathematics syllabus; it is a structural source, not a review of every board.

The route does not model state board syllabi separately, even though the registry
lists a state-board option. Technical, vocational, open schooling and
non-formal routes are not modelled.

## 2. Curriculum

CBSE Class X mathematics has a published syllabus on file. The full Class 8–12
sequence, science and computing syllabi, practical requirements and state-board
differences have **not** been reviewed. The registry's concept mapping remains
`mapped`, not reviewed.

## 3. Examinations

The registry records AISSE/AISSCE for CBSE and ICSE/ISC for CISCE, plus state
SSC/HSC. Examination formats, internal assessment, practicals and board-specific
grading have not been reviewed.

## 4. Learning outcomes

| Value | Unit | Population | Geography | Year | Source | Methodology | Confidence | Limitations |
|---:|---|---|---|---|---|---|---|---|
| 23.4 | % able to read at least a Std II text | Std III children in government schools | Rural India | 2024 | [ASER 2024](https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-National-findings.pdf) | Household sample, 19 languages | High for the survey | Government schools only; rural; not a grade-level curriculum test |
| 27.6 | % able to solve at least a Std II subtraction problem | Std III children in government schools | Rural India | 2024 | Same ASER source | Household sample | High for the survey | Arithmetic subtask, not general mathematics |
| 27.1 | % of all Std III children able to read a Std II text | Std III | Rural India | 2024 | Same ASER source | Household sample | High for the survey | All school types; rural only |
| 90 | % of 14–16-year-olds reporting smartphone access at home | Age 14–16 | Rural India | 2024 | ASER 2024, as summarised in the source provided for this research | Household survey | Medium | Access at home is not ownership or permission to use |
| 26.9 | % of girls aged 14–16 owning their own smartphone | Girls 14–16 | Rural India | 2024 | Same ASER summary | Household survey | Medium | Ownership, not access; exact table not re-extracted here |
| 36.2 | % of boys aged 14–16 owning their own smartphone | Boys 14–16 | Rural India | 2024 | Same ASER summary | Household survey | Medium | Same caveat |

The household smartphone result is a warning against equating "phone at home"
with "personal learning device". A family phone may be shared, borrowed or
controlled by an adult.

## 5. Foundational skills

ASER 2024 shows improvement from 2022 but still a large share of Std III children
below Std II reading and arithmetic. The implication is the same as elsewhere:
school year is not mastery, and a Class 8 learner may need foundational work.

## 6. Teacher conditions

No current national class-size or teacher-ratio figure has been extracted for this
profile. Teacher qualifications, deployment and in-service support differ by
state and school type and remain unverified.

## 7. Classroom conditions

No national classroom observation has been reviewed. The design must not assume a
device per pupil: ASER's household data show that even where a smartphone is at
home, individual ownership is far from universal. Shared-device and no-device
modes are required.

## 8. Textbook availability

No current national pupil-textbook ratio has been verified here. The lesson must
not require a textbook in every pupil's hands.

## 9. Language policy

India has 22 scheduled languages and many state-level languages of instruction.
The language of instruction, the language of the board examination and the
pupil's strongest language can all differ. The exact policy for a given state and
school type has not been reviewed.

## 10. Common teaching languages

Hindi and English are widely used, but state languages are central in many
schools. A learner's strongest language cannot be inferred from the national
language or the board.

## 11. Technology access

Household smartphone access is not school connectivity. No current school-level
internet or computer figure has been verified in this pass. The product must
work offline and with shared devices.

## 12. Electricity

No current school electricity figure has been verified. The lesson must not
require mains power during teaching; a charged teacher device and a printed pack
are the resilient baseline.

## 13. Internet

No current school internet figure has been verified. The lesson must be usable
after download or print, without a live request during the class.

## 14. Devices

The ASER ownership figures show that a household phone is not a personal device.
OpenMind must support several learners sharing one phone, with separate local
progress and privacy, and a no-account practice path.

## 15. Gender and inclusion

The ASER ownership gap (26.9% of girls versus 36.2% of boys) is a direct design
signal: a product that requires a personal phone excludes girls disproportionately.
Caste, disability, language, rural and income barriers are not resolved by that
one figure and remain unverified.

## 16. Rural and urban differences

ASER is a rural survey; it does not describe urban schools. The registry's
national route does not distinguish state boards, rural schools or private
schools. No national average should be treated as the typical Indian classroom.

## 17. Offline requirements

The family-shared phone is a first-class case:

- practice must work offline after a download;
- several learners must be able to use one phone without merging their records;
- a pupil must not need a personal email account;
- printed worksheets and a teacher key must be available;
- the teacher must be able to run the lesson with no pupil devices.

## 18. Cost constraints

A requirement for personal data, a personal device or home printing would impose
a real cost on a family. The essential path must not depend on any of them.

## 19. Relevant educational interventions

Foundational catch-up, structured pedagogy and shared-device practice are
relevant. This pass did not review an Indian trial of OpenMind or a specific
intervention's effect size. No claim of proven impact in India is made.

## 20. OpenMind product implications

1. **Let the learner choose the actual board and state system**; do not collapse
   CBSE, ICSE and state boards into one Indian course.
2. **Support a family-shared phone** with separate local profiles, no personal
   email requirement and offline practice.
3. **Place by prerequisite**, not by Class 8/9/10 label.
4. **Keep explanation language separate from examination language.**
5. **Print the worksheet and key**; do not assume home printing.
6. **Do not claim CBSE/ICSE/state alignment** beyond the one structural source.

## 21. Unverified questions

- Which state boards and syllabi are in use, and how do they differ from CBSE/ICSE?
- What is the current language-of-instruction policy in each state?
- What are actual class sizes, textbook ratios and school connectivity?
- How common is shared phone use, and how do families manage privacy?
- Which learners are out of school, over-age or in non-formal/open schooling?
- What disability and caste-related barriers exist in the classroom?
- Which OpenMind examples, units and terminology are unfamiliar in a given state?

## 22. Source bibliography

- ASER Centre, *Annual Status of Education Report (Rural) 2024*.
  https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-National-findings.pdf
- ASER Centre, *ASER 2024 National Findings*.
  https://asercentre.org/wp-content/uploads/2022/12/ASER-2024-Final-Report_13_2_24.pdf
- People's Archive of Rural India, *Annual Status of Education Report (Rural) 2024* (smartphone access and ownership summary).
  https://wagtail.ruralindiaonline.org/en/library/resource/annual-status-of-education-report-rural-2024/
- CBSE, *Mathematics Secondary Curriculum 2025–26* (registry structural source).
  https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf
- World Bank, *World Bank Country and Lending Groups*, FY2027 classification.
  https://datahelpdesk.worldbank.org/knowledgebase/articles/906519-world-bank-country-and-lending-groups
