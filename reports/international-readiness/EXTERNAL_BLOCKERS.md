# External blockers and human handoffs

These are the tasks no coding agent can complete by assertion. Each one has a prepared artefact and an exact human step.

## educator-review

- **State:** Human review required
- **Human need:** Qualified subject teachers
- **Why a script cannot finish it:** A person, not a script, must judge subject accuracy, curriculum accuracy, teaching quality and assessment validity.
- **What is ready:** Version- and hash-pinned review packs, an authenticated intake route, persistence and an improvement queue.
- **Exact human step:** A teacher reads the pack for one exact version and records an approve or changes-requested decision through /lesson-review/<concept>.

## learner-pilot

- **State:** Externally blocked
- **Human need:** Supervised learners and a teacher
- **Why a script cannot finish it:** Independent transfer and delayed retention cannot be established from completion, satisfaction or a synthetic browser learner.
- **What is ready:** A learner pilot protocol with baseline, post-assessment, unfamiliar transfer, delayed retrieval and reporting limits.
- **Exact human step:** Run the protocol under consent and safeguarding, then record the actual results without promotion by completion.

## native-language-review

- **State:** Human review required
- **Human need:** Native-speaking subject teachers
- **Why a script cannot finish it:** Machine translation is not native-speaker or educator approval.
- **What is ready:** Two machine-translated lessons, explicitly labelled unreviewed; 15 interface dictionaries.
- **Exact human step:** Review one translated lesson against the English source and record language, scope and findings.

## assistive-technology

- **State:** Human review required
- **Human need:** Assistive-technology users
- **Why a script cannot finish it:** A structural scan cannot establish screen-reader announcement, switch access or motor usability.
- **What is ready:** A recorded manual protocol and automated structural checks.
- **Exact human step:** Run a real screen-reader and keyboard session, then record the failures.

## jurisdiction-legal-review

- **State:** Human review required
- **Human need:** A qualified local reviewer
- **Why a script cannot finish it:** Privacy, safeguarding and legal compliance depend on the deployment jurisdiction and cannot be inferred from code.
- **What is ready:** Security, data-minimisation and deletion controls, plus a documented deployment posture.
- **Exact human step:** Name the target jurisdiction, obtain qualified review, and record its scope and findings.

## Rule

A blocked human-validation item is never a reason to stop unrelated code work. The backlog above keeps the code-completable items separate.
