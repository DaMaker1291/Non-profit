import { defineGapLesson } from "./_gap-lesson";

// PHYSICS GAP BATCH 4 — the nucleus, radioactivity, gravity and astrophysics.

export const PHYSICS_ATOMS_NUCLEUS = defineGapLesson({
  conceptId: "atoms-nucleus",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, atomic structure: the nuclear model, atomic number, mass number and isotopes",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for atomic structure. The carbon and uranium examples are original.",
  },
  objectives: [
    {
      statement:
        "Describe the nuclear model of the atom and the charges and relative masses of protons, neutrons and electrons.",
      evidence:
        "The learner states that the nucleus contains protons and neutrons, that electrons occupy shells, and that the atom is mostly empty space.",
    },
    {
      statement:
        "Use atomic number and mass number to find the numbers of protons, neutrons and electrons.",
      evidence:
        "For carbon-14, the learner identifies 6 protons, 8 neutrons and 6 electrons.",
    },
    {
      statement:
        "Explain what isotopes are and why they have the same chemical properties but different masses.",
      evidence:
        "The learner describes isotopes as atoms of the same element with different neutron numbers and gives an example.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["electricity-circuits"],
    check: [
      {
        id: "d1",
        question: "What are the charges of a proton, a neutron and an electron?",
        answer:
          "A proton is positive, a neutron is neutral and an electron is negative.",
        targets: ["electricity-circuits"],
      },
      {
        id: "d2",
        question: "Why is an atom electrically neutral?",
        answer:
          "It has equal numbers of positive protons and negative electrons, so the charges cancel.",
        targets: ["electricity-circuits"],
      },
    ],
  },
  introduction: {
    hook:
      "Most of an atom is empty space. A nucleus about a hundred thousand times smaller than the atom contains almost all its mass. The number of protons fixes the element; the number of neutrons can vary without changing the element. That is why carbon-12 and carbon-14 are both carbon but have different masses and different stability.",
    why:
      "The nuclear model is a story of evidence, not a diagram to memorise. Rutherford's gold-foil experiment showed that positive charge and mass are concentrated in a tiny nucleus, because most alpha particles passed straight through while a few bounced back. Atomic number and mass number are bookkeeping on that model. Isotopes follow from varying the neutron count, and they explain why relative atomic masses are not whole numbers.",
  },
  explanation: [
    {
      heading: "The nucleus and the shells",
      paragraphs: [
        "An atom has a tiny, dense nucleus made of protons and neutrons, surrounded by electrons in shells. The nucleus is positively charged because of the protons; the neutrons add mass but no charge. Electrons are negatively charged and occupy most of the atom's volume, but contribute very little to its mass. The positive charge of the protons is balanced by an equal number of electrons in a neutral atom.",
        "The nuclear model replaced earlier models because of scattering evidence. In the gold-foil experiment, most alpha particles passed through, some were deflected and a few bounced back. That pattern is consistent with a small, dense, positive nucleus and mostly empty space, not with a uniformly spread positive charge. The model is an idealisation: it ignores the internal structure of protons and neutrons and treats the nucleus as a cluster of particles.",
      ],
    },
    {
      heading: "Atomic number and mass number",
      paragraphs: [
        "The atomic number Z is the number of protons. It identifies the element: every carbon atom has 6 protons, and changing the proton number changes the element. The mass number A is the total number of protons and neutrons. The neutron number is A − Z. For carbon-14, Z = 6 and A = 14, so there are 6 protons, 8 neutrons and, in a neutral atom, 6 electrons.",
        "The notation for a nuclide places the mass number as a superscript and the atomic number as a subscript before the symbol, as in carbon-14 or uranium-238. The mass number is not the same as the relative atomic mass on the periodic table, which is a weighted average over the naturally occurring isotopes. A single atom has an integer mass number; a sample has an average.",
      ],
    },
    {
      heading: "Isotopes and why they matter",
      paragraphs: [
        "Isotopes are atoms of the same element with different numbers of neutrons. They have the same electron configuration, so their chemical properties are nearly identical, but their masses and nuclear stability differ. Carbon-12 and carbon-14 both form the same compounds; carbon-14 is radioactive and decays, which is why it is used for dating.",
        "The relative atomic mass of an element is the weighted mean of its isotopes' masses, weighted by their abundances. Chlorine's two main isotopes, chlorine-35 and chlorine-37, give an average near 35.5. The model assumes the isotopes are simply mixed and that chemical behaviour is unaffected by the mass difference; small kinetic isotope effects exist but are usually neglected at this level.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "The mass number is the number of protons plus the number of neutrons. The neutron number is the mass number minus the atomic number.",
      notation: "A = Z + N; N = A − Z",
      caption:
        "For carbon-14, Z = 6 and A = 14, so N = 8. The atom has 6 protons, 8 neutrons and 6 electrons when neutral.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The charge of a nucleus is the number of protons times the elementary charge. A neutral atom has an equal number of electrons.",
      notation: "nuclear charge = +Ze; neutral atom: electrons = Z",
      caption:
        "Carbon has Z = 6, so its nucleus has charge +6e and a neutral carbon atom has 6 electrons.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Proton and neutron numbers are counts, not lengths or masses. Atomic masses are often quoted in atomic mass units, while the kilogram is the SI unit.",
      notation: "Z, N, A: counts · mass: u or kg · charge: C",
      caption:
        "A count has no unit. The mass number 14 means 14 nucleons, not 14 kilograms or 14 atomic mass units exactly, because binding energy changes the mass slightly.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A neutral carbon-14 atom has atomic number 6 and mass number 14. Find its numbers of protons, neutrons and electrons.",
      steps: [
        {
          move: "The atomic number gives the protons: Z = 6.",
          why:
            "The atomic number is defined as the number of protons, and it fixes the element as carbon.",
        },
        {
          move: "Neutrons = A − Z = 14 − 6 = 8.",
          why:
            "The mass number counts protons plus neutrons, so subtracting the protons leaves the neutrons.",
        },
        {
          move: "A neutral atom has electrons equal to protons, so 6 electrons.",
          why:
            "The positive and negative charges must balance for the atom to be neutral. An ion would have a different electron count.",
        },
      ],
      answer: "Carbon-14 has 6 protons, 8 neutrons and 6 electrons.",
    },
    {
      id: "w2",
      prompt:
        "A uranium-238 nucleus has atomic number 92 and mass number 238. Find its proton and neutron numbers.",
      steps: [
        {
          move: "Protons = atomic number = 92.",
          why:
            "The atomic number identifies uranium and counts its protons.",
        },
        {
          move: "Neutrons = mass number − atomic number = 238 − 92 = 146.",
          why:
            "The mass number includes both protons and neutrons. Subtracting the protons isolates the neutrons.",
        },
        {
          move: "The nucleus has 92 protons and 146 neutrons, for 238 nucleons in total.",
          why:
            "The total nucleon count matches the mass number, which is a check on the subtraction.",
        },
      ],
      answer: "Uranium-238 has 92 protons and 146 neutrons.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The mass number is the same as the relative atomic mass on the periodic table.",
      whyItFails:
        "The mass number is an integer count of nucleons in one atom. The relative atomic mass is a weighted average of the isotopes in a natural sample and is often not a whole number. For chlorine, the mass number of an atom may be 35 or 37, while the relative atomic mass is about 35.5.",
      correction:
        "Distinguish a single atom from a sample. Use the mass number for one nuclide; use the weighted average for an element's natural abundance.",
      contrast: {
        wrong: "Chlorine's mass number is 35.5.",
        right: "A chlorine-35 atom has mass number 35; the relative atomic mass of the mixture is about 35.5.",
      },
    },
    {
      id: "m2",
      belief: "Isotopes have different chemical properties because they have different masses.",
      whyItFails:
        "Chemical properties are determined mainly by the electron arrangement, which is the same for isotopes of the same element because the proton number is the same. The mass difference affects physical properties and nuclear stability, but not the basic bonding behaviour.",
      correction:
        "Compare the electron configurations. Isotopes of an element have the same number of electrons in the same shells, so they form the same compounds.",
      contrast: {
        wrong: "Carbon-14 behaves chemically like a different element.",
        right: "Carbon-14 has the same chemistry as carbon-12 but a different mass and nuclear stability.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "An atom has 11 protons and 12 neutrons. What is its mass number?",
      hint: "Add the proton and neutron counts.",
      answer: "A = 11 + 12 = 23.",
      feedback: {
        correct: "You added the nucleon counts to get the mass number.",
        incorrect:
          "The mass number counts both protons and neutrons, so it is 23, not 11 or 12.",
      },
    },
    {
      id: "p2",
      prompt:
        "An atom has atomic number 17 and mass number 35. How many neutrons does it have?",
      hint: "Subtract the atomic number from the mass number.",
      answer: "35 − 17 = 18 neutrons.",
      feedback: {
        correct: "You subtracted the protons from the total nucleons.",
        incorrect:
          "Neutrons = 35 − 17 = 18. Adding would give the nucleon total, not the neutron count.",
      },
    },
    {
      id: "p3",
      prompt: "Why are atoms mostly empty space?",
      hint: "Compare the size of the nucleus with the size of the whole atom.",
      answer:
        "The nucleus is tiny compared with the atom, and the electrons occupy the much larger region outside it.",
      feedback: {
        correct: "You used the relative sizes of the nucleus and the atom.",
        incorrect:
          "The nucleus is about a hundred thousand times smaller than the atom, so most of the atom's volume contains no nucleus.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "How many protons does a carbon-14 atom have?",
      modelAnswer: "6 protons",
      marking: [
        "Uses the atomic number of carbon.",
        "States 6 protons.",
      ],
      check: { accepted: ["6", "6 protons", "six"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "How many neutrons does a carbon-14 atom have?",
      modelAnswer: "8 neutrons",
      marking: [
        "Subtracts the atomic number 6 from the mass number 14.",
        "States 8 neutrons.",
      ],
      check: { accepted: ["8", "8 neutrons", "eight"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how the gold-foil experiment supports the nuclear model, and why isotopes of an element have the same chemical properties.",
      modelAnswer:
        "Most alpha particles passed straight through the gold foil, some were deflected and a few bounced back. This is consistent with a tiny, dense, positively charged nucleus and mostly empty space. Isotopes have the same number of protons and therefore the same electron arrangement, so their chemical properties are the same; they differ in neutron number, which changes mass and nuclear stability but not the basic bonding.",
      marking: [
        "Describes the scattering pattern of most, some and few alpha particles.",
        "Connects the pattern to a small dense positive nucleus.",
        "Explains that isotopes share an electron arrangement and differ in neutrons.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A sample of magnesium contains 79% magnesium-24, 10% magnesium-25 and 11% magnesium-26. Calculate its relative atomic mass and explain why the answer is not a whole number. State an assumption.",
      whyItTransfers:
        "The lesson counts nucleons in a single atom. The sample calculation moves from one atom to a weighted mixture, so the learner must use abundances and interpret an average rather than a count.",
      answer:
        "Relative atomic mass = 0.79 × 24 + 0.10 × 25 + 0.11 × 26 = 18.96 + 2.50 + 2.86 = 24.32. The answer is not a whole number because it is a weighted average over atoms with different mass numbers. The calculation assumes the quoted percentages are accurate and that no other isotopes contribute significantly.",
      marking: [
        "Multiplies each mass number by its fractional abundance.",
        "Adds the contributions to get about 24.3.",
        "Explains the average and states an assumption about the abundances.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What does the atomic number represent?",
      answer: "The number of protons in the nucleus; it identifies the element.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does the mass number represent?",
      answer: "The total number of protons and neutrons in the nucleus.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What are isotopes?",
      answer:
        "Atoms of the same element with the same proton number but different neutron numbers.",
      when: "month-later",
    },
  ],
  summary: [
    "The nucleus contains protons and neutrons and is tiny compared with the atom.",
    "Atomic number counts protons; mass number counts protons plus neutrons.",
    "A neutral atom has electrons equal to its protons.",
    "Isotopes differ in neutrons, so they have different masses but the same chemistry.",
  ],
});

export const PHYSICS_RADIOACTIVITY = defineGapLesson({
  conceptId: "radioactivity",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, atomic structure: radioactive decay, nuclear radiation and half-life",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for radioactivity. The half-life examples are original.",
  },
  objectives: [
    {
      statement:
        "Describe alpha, beta and gamma radiation in terms of what they are and how they penetrate matter.",
      evidence:
        "The learner states that alpha is stopped by paper, beta by a few millimetres of aluminium and gamma is reduced by thick lead.",
    },
    {
      statement:
        "Use half-life to find the mass or activity remaining after a number of half-lives.",
      evidence:
        "For 80 g with a 5-day half-life, the learner finds 10 g remains after 15 days.",
    },
    {
      statement:
        "Explain why radioactive decay is random and why a large sample still shows a predictable pattern.",
      evidence:
        "The learner distinguishes the unpredictable decay of one nucleus from the statistical regularity of a large population.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["atoms-nucleus", "growth-decay"],
    check: [
      {
        id: "d1",
        question: "What is an isotope?",
        answer:
          "An atom of the same element with a different number of neutrons.",
        targets: ["atoms-nucleus"],
      },
      {
        id: "d2",
        question: "What does exponential decay mean?",
        answer:
          "A quantity falls by a constant factor in each equal time interval.",
        targets: ["growth-decay"],
      },
    ],
  },
  introduction: {
    hook:
      "A radioactive source cannot be switched off, and no one can predict when a particular nucleus will decay. Yet a sample of thousands of nuclei follows a reliable pattern: after one half-life, half of them have decayed. The randomness of the individual event and the regularity of the crowd are both true, and the half-life is the bridge between them.",
    why:
      "Radioactivity is often taught as a list of three radiations and a formula. The deeper idea is that unstable nuclei decay randomly, releasing energy and changing into different nuclei. Alpha and beta decay change the proton number, so they change the element; gamma decay changes only the energy. Half-life turns the random process into a measurable clock, which is why it is used in dating, medicine and safety.",
  },
  explanation: [
    {
      heading: "Three radiations with different penetration",
      paragraphs: [
        "An alpha particle is two protons and two neutrons, identical to a helium nucleus. It is relatively heavy and strongly ionising, so it loses energy quickly and is stopped by a sheet of paper or a few centimetres of air. A beta particle is a fast electron emitted when a neutron changes into a proton; it is lighter and less ionising, stopped by a few millimetres of aluminium. Gamma radiation is a high-energy electromagnetic wave, weakly ionising and needing thick lead or concrete to reduce it.",
        "The penetration and ionisation are inversely related: the more strongly a radiation ionises, the faster it loses energy and the shorter its range. Alpha is the most ionising and least penetrating; gamma is the least ionising and most penetrating. The model treats the radiations as distinct, but a real source may emit more than one type and the shielding depends on energy.",
      ],
    },
    {
      heading: "Decay changes the nucleus",
      paragraphs: [
        "Alpha decay reduces the mass number by 4 and the atomic number by 2, producing a nucleus of a different element. Beta decay leaves the mass number unchanged but increases the atomic number by 1, because a neutron becomes a proton and an electron. Gamma emission does not change the mass or atomic number; it removes excess energy from an excited nucleus.",
        "These changes are conservation laws in action: charge and nucleon number are conserved across the decay. In beta decay, the electron carries away negative charge while the nucleus gains a positive charge, so the total charge is unchanged. The model assumes the decay happens at rest and ignores the neutrino, which is a useful simplification at GCSE but not a complete description.",
      ],
    },
    {
      heading: "Half-life and the statistics of large samples",
      paragraphs: [
        "Half-life is the time for half the nuclei in a sample to decay. After one half-life, half remain; after two, one quarter; after three, one eighth. For 80 g with a 5-day half-life, 15 days is three half-lives, so 80 → 40 → 20 → 10 g remains. The activity in becquerels follows the same halving pattern.",
        "Individual decays are random: a nucleus does not age or become more likely to decay as time passes. The half-life is a statistical property of a large sample. A sample of a few atoms would show large fluctuations, and the smooth curve only emerges when many nuclei are present. The model assumes a large sample and no new source or loss of material; a short half-life source becomes noticeably weaker during a measurement.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "After n half-lives, the remaining amount is the original amount multiplied by one half n times.",
      notation: "remaining = initial × (1/2)ⁿ",
      caption:
        "For 80 g and three half-lives, remaining = 80 × (1/2)³ = 10 g. The exponent counts half-lives, not days.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Activity follows the same halving rule as the number of undecayed nuclei.",
      notation: "A = A₀ × (1/2)ⁿ",
      caption:
        "A source of 800 Bq after three half-lives has activity 100 Bq. The becquerel is one decay per second.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Activity is measured in becquerels, time in seconds or the unit given for the half-life, and absorbed dose in grays.",
      notation: "A: Bq · t: s · dose: Gy",
      caption:
        "A becquerel is one nuclear decay per second. The half-life may be quoted in seconds, days or years; convert the elapsed time to the same unit before counting half-lives.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A sample contains 80 g of a radioactive isotope with a half-life of 5 days. How much remains after 15 days?",
      steps: [
        {
          move: "Find the number of half-lives: 15 days / 5 days = 3.",
          why:
            "The elapsed time must be divided by the half-life to count how many halvings have occurred.",
        },
        {
          move: "Halve the mass three times: 80 g → 40 g → 20 g → 10 g.",
          why:
            "Each half-life leaves half of the previous amount. Three halvings multiply the original by one eighth.",
        },
        {
          move: "The remaining mass is 10 g.",
          why:
            "This is the undecayed material. The rest has transformed into other nuclei and radiation.",
        },
      ],
      answer: "10 g remains after 15 days.",
    },
    {
      id: "w2",
      prompt:
        "A source has an activity of 800 Bq and a half-life of 2 hours. What is its activity after 6 hours?",
      steps: [
        {
          move: "Number of half-lives = 6 h / 2 h = 3.",
          why:
            "The elapsed time is three times the half-life, so the activity halves three times.",
        },
        {
          move: "Halve three times: 800 Bq → 400 Bq → 200 Bq → 100 Bq.",
          why:
            "Activity is proportional to the number of undecayed nuclei, so it follows the same halving pattern.",
        },
        {
          move: "The activity is 100 Bq.",
          why:
            "One becquerel is one decay per second, so the source now decays 100 times per second.",
        },
      ],
      answer: "The activity is 100 Bq after 6 hours.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "After two half-lives, all the radioactive material has gone.",
      whyItFails:
        "Each half-life removes half of what remains, not half of the original total. After two half-lives, one quarter remains; after three, one eighth. The amount approaches zero but never reaches it in a finite number of half-lives.",
      correction:
        "Halve the remaining amount at each step. Do not subtract half the original each time.",
      contrast: {
        wrong: "Two half-lives leave 0 g.",
        right: "Two half-lives leave one quarter of the original mass.",
      },
    },
    {
      id: "m2",
      belief: "A radioactive nucleus becomes more likely to decay as it gets older.",
      whyItFails:
        "Decay is random and memoryless. A nucleus does not age, and its probability of decaying in the next second is the same regardless of how long it has existed. The half-life describes the population, not the individual.",
      correction:
        "Separate the individual from the sample. Any one nucleus may decay at any time; the half-life is the time for half of a large sample to decay.",
      contrast: {
        wrong: "An old nucleus is due to decay.",
        right: "Each nucleus has the same probability per unit time; the sample follows a half-life.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A 40 g sample has a half-life of 3 years. How much remains after 9 years?",
      hint: "Count how many half-lives fit into 9 years, then halve that many times.",
      answer: "Three half-lives, so 40 → 20 → 10 → 5 g.",
      feedback: {
        correct: "You counted three half-lives and halved three times.",
        incorrect:
          "9 years is three half-lives, so 5 g remains. Subtracting 20 g per half-life would be wrong.",
      },
    },
    {
      id: "p2",
      prompt: "Which radiation is stopped by a sheet of paper?",
      hint: "Think about which radiation is the most strongly ionising.",
      answer: "Alpha radiation.",
      feedback: {
        correct: "You linked strong ionisation to a short range.",
        incorrect:
          "Alpha particles are the most ionising and are stopped by paper; beta needs aluminium and gamma needs thick lead.",
      },
    },
    {
      id: "p3",
      prompt:
        "Why can the decay of a single nucleus not be predicted, even though the half-life is known?",
      hint: "The half-life describes a large sample, not one nucleus.",
      answer:
        "Decay is random for each nucleus; the half-life is a statistical property of a large population.",
      feedback: {
        correct: "You separated the random individual event from the statistical sample.",
        incorrect:
          "The half-life does not schedule a particular nucleus. It describes the fraction of a large sample that decays in a given time.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A 80 g sample has a half-life of 5 days. How much remains after 15 days?",
      modelAnswer: "10 g",
      marking: [
        "Counts three half-lives.",
        "Halves 80 g three times to get 10 g.",
      ],
      check: { accepted: ["10 g", "10g", "10"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A source has an activity of 800 Bq and a half-life of 2 hours. What is its activity after 6 hours?",
      modelAnswer: "100 Bq",
      marking: [
        "Counts three half-lives.",
        "Halves 800 Bq three times to get 100 Bq.",
      ],
      check: { accepted: ["100 Bq", "100Bq", "100"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why alpha radiation is more ionising but less penetrating than gamma radiation, and why a half-life can be used to date a sample.",
      modelAnswer:
        "Alpha particles are heavy and carry a double positive charge, so they interact strongly with matter and lose energy quickly, giving high ionisation and a short range. Gamma rays are electromagnetic waves with no charge and interact weakly, so they penetrate farther but ionise less. A half-life is a fixed time for half of a sample to decay, so measuring the remaining fraction gives the elapsed time.",
      marking: [
        "Links alpha's charge and mass to strong ionisation and short range.",
        "Contrasts gamma's weak interaction with its greater penetration.",
        "Explains that the remaining fraction encodes the number of half-lives elapsed.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A bone sample contains 12 g of carbon-14 when a living organism dies. The half-life of carbon-14 is 5,700 years. After how many years will 1.5 g remain, and why is the method unreliable for a sample older than about 50,000 years? State an assumption.",
      whyItTransfers:
        "The lesson halves a mass over a known number of half-lives. The dating problem asks for the time rather than the remaining mass, and the reliability question requires reasoning about measurable amounts.",
      answer:
        "1.5 g is one eighth of 12 g, so three half-lives have passed. The time is 3 × 5,700 = 17,100 years. After about 50,000 years, roughly nine half-lives have passed and the remaining carbon-14 is a tiny fraction of the original, so contamination and measurement uncertainty dominate. The calculation assumes the initial amount is known, the half-life is constant, and no carbon has entered or left the sample.",
      marking: [
        "Recognises 1.5 g as one eighth and counts three half-lives.",
        "Multiplies by 5,700 to get 17,100 years.",
        "Explains the small remaining fraction and states an assumption about contamination or closure.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What are alpha, beta and gamma radiation?",
      answer:
        "Alpha is a helium nucleus, beta is a fast electron, and gamma is a high-energy electromagnetic wave.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is half-life?",
      answer:
        "The time for half the nuclei in a sample to decay, or for the activity to halve.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why is radioactive decay described as random?",
      answer:
        "The time at which an individual nucleus decays cannot be predicted; only the behaviour of a large sample is statistical.",
      when: "month-later",
    },
  ],
  summary: [
    "Alpha, beta and gamma radiations differ in charge, mass, ionisation and penetration.",
    "Alpha decay changes the nucleus by 4 in mass number and 2 in atomic number; beta decay changes the atomic number by 1.",
    "Half-life is the time for half a sample to decay; each half-life leaves half of what remains.",
    "Individual decays are random, but a large sample follows a predictable statistical pattern.",
  ],
});

export const PHYSICS_GRAVITY_FIELDS = defineGapLesson({
  conceptId: "gravity-fields",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, forces: gravitational fields, weight and the inverse-square law",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for gravity and gravitational fields. The Earth and orbit examples are original.",
  },
  objectives: [
    {
      statement:
        "Calculate the gravitational force between two masses using Newton's law of gravitation.",
      evidence:
        "The learner uses F = Gm₁m₂/r² and reports the force with its unit.",
    },
    {
      statement:
        "Explain the inverse-square relationship between distance and gravitational field strength.",
      evidence:
        "The learner states that doubling the distance quarters the field strength and applies it to a weight calculation.",
    },
    {
      statement:
        "Explain why an orbiting satellite is falling around Earth rather than escaping it.",
      evidence:
        "The learner describes gravity as the centripetal force that continuously changes the satellite's direction.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["newton-laws", "proportion"],
    check: [
      {
        id: "d1",
        question: "What is Newton's law of gravitation in words?",
        answer:
          "Every mass attracts every other mass with a force proportional to the product of the masses and inversely proportional to the square of their separation.",
        targets: ["newton-laws"],
      },
      {
        id: "d2",
        question: "What happens to y when x is doubled in an inverse-square relationship?",
        answer: "y becomes one quarter of its original value.",
        targets: ["proportion"],
      },
    ],
  },
  introduction: {
    hook:
      "The Moon does not fall into the Earth, and the International Space Station does not float beyond gravity. Both are falling continuously, but their sideways motion carries them around the Earth instead of into it. Gravity is the centripetal force that keeps them in orbit, and its strength falls with the square of the distance.",
    why:
      "Gravity is the first force a learner meets that acts at a distance with no visible contact. The inverse-square law explains why weight changes with altitude and why planets farther from the Sun move more slowly. The orbit explanation corrects the common belief that astronauts are weightless because there is no gravity. This lesson connects the force law to the field strength and then to circular motion.",
  },
  explanation: [
    {
      heading: "Every mass attracts every other mass",
      paragraphs: [
        "Newton's law of gravitation states that the force between two point masses is proportional to the product of the masses and inversely proportional to the square of the distance between their centres. The constant G is the gravitational constant. The force is always attractive and acts along the line joining the centres.",
        "For a uniform sphere, the field outside it behaves as if all the mass were concentrated at its centre. That is why the Earth can be treated as a point mass for satellite calculations. The model assumes point masses or uniform spheres and ignores the effects of rotation, which makes the effective weight slightly less at the equator than at the poles.",
      ],
    },
    {
      heading: "Field strength is force per unit mass",
      paragraphs: [
        "The gravitational field strength g is the force per kilogram at a point. Near Earth's surface it is about 9.8 N/kg, so a 1 kg mass weighs 9.8 N. Far from Earth, g is smaller. The field strength of a spherical mass is g = GM/r², which is the force law divided by the test mass.",
        "The inverse-square law means that doubling the distance from the centre quarters the field strength. At twice Earth's radius, g would be about 2.45 N/kg, so a 100 kg astronaut would weigh about 245 N instead of 980 N. The astronaut's mass is still 100 kg; only the weight changes. The model assumes the mass distribution is spherically symmetric and the distance is measured from the centre.",
      ],
    },
    {
      heading: "Orbits are continuous free fall",
      paragraphs: [
        "A satellite in a circular orbit moves sideways fast enough that the Earth's surface curves away beneath it at the same rate it falls. Gravity provides the centripetal force, changing the direction of the velocity without changing its magnitude. The satellite is in free fall, which is why objects inside it appear weightless relative to the spacecraft.",
        "A geostationary satellite has a period of 24 hours and orbits above the equator in the same direction as Earth's rotation, so it stays above one point. A lower orbit has a shorter period because the required centripetal force is larger at a smaller radius. The model assumes a circular orbit and a spherical Earth; real orbits are slightly elliptical and are perturbed by the Moon, the Sun and Earth's uneven mass distribution.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Newton's law of gravitation gives the attractive force between two masses separated by a distance measured between their centres.",
      notation: "F = Gm₁m₂/r²",
      caption:
        "The force is proportional to both masses and inversely proportional to the square of the separation. Doubling r quarters the force.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Gravitational field strength is the force per unit mass. For a spherical mass, it is GM divided by the square of the distance from the centre.",
      notation: "g = F/m = GM/r²",
      caption:
        "At Earth's surface, g is about 9.8 N/kg. At twice the radius, the field strength is one quarter as large.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Force is measured in newtons, mass in kilograms, distance in metres and field strength in newtons per kilogram.",
      notation: "F: N · m: kg · r: m · g: N/kg · G: N m²/kg²",
      caption:
        "The units of G are chosen so that Gm₁m₂/r² gives newtons. Field strength in N/kg is numerically the same as acceleration in m/s².",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Calculate the weight of a 100 kg astronaut at Earth's surface. Take g = 9.8 N/kg.",
      steps: [
        {
          move: "Use W = mg.",
          why:
            "Weight is the gravitational force on the mass. The field strength g tells you the force per kilogram.",
        },
        {
          move: "Substitute W = 100 kg × 9.8 N/kg.",
          why:
            "The kilograms cancel, leaving newtons. The mass is 100 kg, but the weight depends on the field strength.",
        },
        {
          move: "W = 980 N.",
          why:
            "This is the gravitational force at the surface. At a higher altitude, g would be smaller and the weight would be less.",
        },
      ],
      answer: "The astronaut weighs 980 N at Earth's surface.",
    },
    {
      id: "w2",
      prompt:
        "At twice Earth's radius from the centre, what is the gravitational field strength? Take the surface value as 9.8 N/kg.",
      steps: [
        {
          move: "The field strength follows an inverse-square law, so g ∝ 1/r².",
          why:
            "Doubling the distance from the centre increases r² by a factor of four, so g falls by a factor of four.",
        },
        {
          move: "Calculate g = 9.8 N/kg / 4.",
          why:
            "The surface value is at one Earth radius; at twice that distance, the field is one quarter as strong.",
        },
        {
          move: "g = 2.45 N/kg.",
          why:
            "A 100 kg astronaut would weigh 245 N there. The mass is unchanged; only the gravitational force is smaller.",
        },
      ],
      answer: "The field strength is 2.45 N/kg.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Astronauts on the International Space Station are weightless because there is no gravity there.",
      whyItFails:
        "The station is only a few hundred kilometres above the surface, where Earth's gravity is still almost as strong as at the ground. The astronauts and the station are both falling around Earth at the same rate, so they appear to float relative to the station. This is free fall, not the absence of gravity.",
      correction:
        "Distinguish apparent weightlessness from zero gravity. Gravity provides the centripetal force for the orbit, and everything inside the station is in the same free fall.",
      contrast: {
        wrong: "There is no gravity in orbit, so astronauts float.",
        right: "Gravity is still strong; astronauts float because they and the station are falling together.",
      },
    },
    {
      id: "m2",
      belief: "Doubling the distance between two masses halves the gravitational force.",
      whyItFails:
        "The force follows an inverse-square law, so doubling the distance reduces the force to one quarter, not one half. The square applies to the distance, not to the force.",
      correction:
        "Square the distance factor before taking the reciprocal. A factor of 2 in distance gives a factor of 4 in the denominator.",
      contrast: {
        wrong: "Double the distance, halve the force.",
        right: "Double the distance, quarter the force.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt: "What is the weight of a 60 kg person where g = 9.8 N/kg?",
      hint: "Multiply the mass by the gravitational field strength.",
      answer: "W = 60 × 9.8 = 588 N.",
      feedback: {
        correct: "You multiplied mass by field strength and kept the force unit.",
        incorrect:
          "Weight is 60 × 9.8 = 588 N. The mass is 60 kg, but weight is a force.",
      },
    },
    {
      id: "p2",
      prompt:
        "If the distance between two masses is tripled, what happens to the gravitational force?",
      hint: "The force is inversely proportional to the square of the distance.",
      answer: "It becomes one ninth of its original value.",
      feedback: {
        correct: "You squared the distance factor and took the reciprocal.",
        incorrect:
          "Tripling the distance makes the denominator nine times larger, so the force is one ninth, not one third.",
      },
    },
    {
      id: "p3",
      prompt: "Why does a satellite not fall straight down?",
      hint: "It has a sideways velocity as well as a downward acceleration.",
      answer:
        "Its sideways velocity carries it around Earth as it falls, so it continuously misses the surface.",
      feedback: {
        correct: "You described the orbit as continuous free fall with a tangential velocity.",
        incorrect:
          "Gravity does pull the satellite down, but its sideways motion makes it curve around Earth instead of hitting it.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt: "What is the weight of a 100 kg astronaut at Earth's surface, where g = 9.8 N/kg?",
      modelAnswer: "980 N",
      marking: [
        "Uses W = mg.",
        "Multiplies 100 by 9.8 to get 980 N.",
      ],
      check: { accepted: ["980 N", "980N", "980"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "At twice Earth's radius from the centre, what is the gravitational field strength? Take the surface value as 9.8 N/kg.",
      modelAnswer: "2.45 N/kg",
      marking: [
        "Uses the inverse-square law.",
        "Divides 9.8 by 4 to get 2.45 N/kg.",
      ],
      check: { accepted: ["2.45 N/kg", "2.45 N kg^-1", "2.45"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why the gravitational field strength decreases with distance, why an astronaut in orbit appears weightless, and why a geostationary satellite stays above the same point.",
      modelAnswer:
        "The field strength is the force per unit mass, and the force is inversely proportional to the square of the distance from the centre, so g decreases as distance increases. An astronaut in orbit is in free fall with the spacecraft, so both accelerate together and the astronaut appears to float; gravity is still acting. A geostationary satellite has a 24-hour period, orbits above the equator and moves in the same direction as Earth's rotation, so it stays above the same point.",
      marking: [
        "Connects the inverse-square force law to the decrease in g.",
        "Explains apparent weightlessness as free fall, not zero gravity.",
        "States the 24-hour period and equatorial, same-direction orbit for geostationary.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A 500 kg satellite orbits Earth at a distance of 7.0 × 10⁶ m from the centre. Using g = GM/r² with GM = 3.98 × 10¹⁴ m³/s², find the field strength and the gravitational force on the satellite. Explain why the force does not change the satellite's speed in a circular orbit. State an assumption.",
      whyItTransfers:
        "The lesson calculates surface weight and a field-strength ratio. The satellite problem uses the field strength at a non-surface distance and connects the force to circular motion, so the learner must reason beyond a simple weight calculation.",
      answer:
        "g = GM/r² = 3.98 × 10¹⁴ / (7.0 × 10⁶)² ≈ 8.1 N/kg. The force is F = mg = 500 × 8.1 ≈ 4,050 N. In a circular orbit the force is perpendicular to the velocity, so it changes the direction of motion but not the speed. The calculation assumes a circular orbit and a spherically symmetric Earth.",
      marking: [
        "Squares the distance and divides GM by it to get about 8.1 N/kg.",
        "Multiplies by 500 kg to get about 4,050 N.",
        "Explains that a perpendicular force changes direction, not speed, and states an assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "State Newton's law of gravitation.",
      answer:
        "The force between two masses is proportional to their product and inversely proportional to the square of their separation: F = Gm₁m₂/r².",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What happens to gravitational field strength when distance is doubled?",
      answer: "It becomes one quarter as strong, because g is inversely proportional to r².",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Why does a satellite stay in orbit instead of falling straight down?",
      answer:
        "It has a sideways velocity, so it continuously falls around Earth rather than into it.",
      when: "month-later",
    },
  ],
  summary: [
    "Every mass attracts every other mass with F = Gm₁m₂/r².",
    "Gravitational field strength is force per unit mass and follows an inverse-square law.",
    "Orbiting objects are in continuous free fall; gravity provides the centripetal force.",
    "A geostationary satellite has a 24-hour period above the equator and stays over one point.",
  ],
});

export const PHYSICS_ASTROPHYSICS = defineGapLesson({
  conceptId: "astrophysics",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, space physics: orbits, stellar life cycles, redshift and the expanding universe",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for astrophysics. The orbital and redshift examples are original.",
  },
  objectives: [
    {
      statement:
        "Explain how gravity keeps planets and satellites in orbit and why orbital speed depends on radius.",
      evidence:
        "The learner describes gravity as the centripetal force and explains that a smaller orbit requires a faster speed.",
    },
    {
      statement:
        "Describe the life cycle of a star and how the outcome depends on its mass.",
      evidence:
        "The learner distinguishes a Sun-like star's white dwarf end from a massive star's neutron star or black hole.",
    },
    {
      statement:
        "Use Hubble's law to relate redshift to distance and explain why it supports an expanding universe.",
      evidence:
        "For H₀ = 70 km/s/Mpc and a galaxy 100 Mpc away, the learner finds a recession speed of about 7,000 km/s.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["gravity-fields", "waves-basics"],
    check: [
      {
        id: "d1",
        question: "What force keeps a satellite in orbit?",
        answer:
          "Gravity, acting as the centripetal force toward the body being orbited.",
        targets: ["gravity-fields"],
      },
      {
        id: "d2",
        question: "What happens to the wavelength of a wave moving away from an observer?",
        answer:
          "It increases, which is a redshift for light.",
        targets: ["waves-basics"],
      },
    ],
  },
  introduction: {
    hook:
      "The light from distant galaxies is shifted towards the red end of the spectrum. The farther away a galaxy is, the larger the shift. That pattern is Hubble's law, and it is the main evidence that the universe is expanding. The same gravity that keeps a satellite in orbit also assembles stars and determines whether they end as white dwarfs, neutron stars or black holes.",
    why:
      "Astrophysics applies familiar physics on an enormous scale. Orbits use gravity and circular motion; stars use gravity, pressure and nuclear fusion; redshift uses wave properties and the Doppler effect. The topics are often taught as separate facts, but they share one question: how do we know? The evidence for expansion is a relationship between distance and recession speed, not a picture of the Big Bang. This lesson keeps the evidence and the model distinct.",
  },
  explanation: [
    {
      heading: "Orbits are governed by gravity",
      paragraphs: [
        "A planet orbits a star because gravity provides the centripetal force needed to keep it moving in a curve. The force is directed towards the star and changes the planet's direction, not its speed, in a circular orbit. A smaller orbital radius requires a larger speed for the same central mass, which is why Mercury orbits faster than Neptune.",
        "The orbital period is the time for one complete orbit. For a circular orbit, speed is the circumference divided by the period. The model assumes a circular orbit and a central mass much larger than the orbiting body; an elliptical orbit has a varying speed, and a binary system requires both masses to be considered.",
      ],
    },
    {
      heading: "Stars form, fuse and die",
      paragraphs: [
        "Stars form from clouds of gas and dust that collapse under gravity. As the core compresses, it heats until hydrogen nuclei fuse into helium, releasing energy that balances the inward pull of gravity. The star spends most of its life on the main sequence, fusing hydrogen in its core.",
        "When the hydrogen runs out, the core contracts and the outer layers expand. A Sun-like star becomes a red giant, sheds its outer layers and leaves a white dwarf. A much more massive star can fuse heavier elements, then explode as a supernova, leaving a neutron star or, if the remnant is massive enough, a black hole. The model assumes the star is isolated and that mass loss during the late stages is not extreme; a close companion can change the outcome.",
      ],
    },
    {
      heading: "Redshift and the expanding universe",
      paragraphs: [
        "When a source moves away, the observed wavelength of its light increases, shifting the spectrum towards the red end. The fractional shift gives the recession speed for speeds much less than the speed of light. Hubble found that recession speed is proportional to distance: v = H₀d. For H₀ = 70 km/s per megaparsec and a galaxy 100 Mpc away, v = 7,000 km/s.",
        "The relationship is evidence that the universe is expanding: the farther a galaxy is, the faster it recedes. It is not evidence that Earth is at the centre; the expansion looks the same from every galaxy. The model assumes the Hubble constant is the same everywhere and that peculiar velocities are small. At very large distances, the simple linear law needs correction for the history of the expansion.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "For a circular orbit, the orbital speed is the circumference divided by the period.",
      notation: "v = 2πr/T",
      caption:
        "A geostationary orbit with r = 4.22 × 10⁷ m and T = 86,400 s has v ≈ 3.1 × 10³ m/s.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "Hubble's law relates recession speed to distance through the Hubble constant.",
      notation: "v = H₀d",
      caption:
        "With H₀ = 70 km/s/Mpc and d = 100 Mpc, v = 7,000 km/s. The units cancel to leave a speed.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Orbital speed is in metres per second, period in seconds, distance in metres or megaparsecs and the Hubble constant in kilometres per second per megaparsec.",
      notation: "v: m/s or km/s · T: s · r: m · d: Mpc · H₀: km/s/Mpc",
      caption:
        "The Hubble constant's unit looks like a speed per distance, which is a reciprocal time. The megaparsec is a distance unit used for galaxies.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A satellite orbits at a radius of 4.22 × 10⁷ m with a period of 86,400 s. Calculate its orbital speed.",
      steps: [
        {
          move: "Find the circumference: 2πr = 2π × 4.22 × 10⁷ m ≈ 2.65 × 10⁸ m.",
          why:
            "The satellite travels one circumference in one period, so the circumference is the distance covered.",
        },
        {
          move: "Use v = 2πr/T.",
          why:
            "Speed is distance divided by time. The period is the time for one complete orbit.",
        },
        {
          move: "Substitute v ≈ 2.65 × 10⁸ m / 86,400 s ≈ 3.1 × 10³ m/s.",
          why:
            "The result is about 3.1 km/s. A geostationary satellite must travel this fast to stay above the same point.",
        },
      ],
      answer: "The orbital speed is about 3.1 × 10³ m/s.",
    },
    {
      id: "w2",
      prompt:
        "A galaxy is 100 Mpc away. Using H₀ = 70 km/s/Mpc, calculate its recession speed.",
      steps: [
        {
          move: "Use Hubble's law v = H₀d.",
          why:
            "The recession speed is proportional to distance, with the Hubble constant as the constant of proportionality.",
        },
        {
          move: "Substitute v = 70 km/s/Mpc × 100 Mpc.",
          why:
            "The megaparsec units cancel, leaving kilometres per second.",
        },
        {
          move: "v = 7,000 km/s.",
          why:
            "The galaxy is receding at about 7,000 km/s. A galaxy twice as far would recede twice as fast.",
        },
      ],
      answer: "The recession speed is 7,000 km/s.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "The universe is expanding into empty space from a centre where the Big Bang happened.",
      whyItFails:
        "The expansion is a stretching of space between galaxies, not galaxies flying outward through a pre-existing space from a central point. Every observer sees distant galaxies receding, so no galaxy is at a privileged centre. The Big Bang happened everywhere at once, not at a single location.",
      correction:
        "Describe expansion as increasing separation between galaxies, with no centre. The redshift–distance relation is the evidence, not a map of a blast.",
      contrast: {
        wrong: "Galaxies fly away from a central explosion point.",
        right: "Space expands between galaxies; the pattern looks the same from any galaxy.",
      },
    },
    {
      id: "m2",
      belief: "All stars end as black holes if they are old enough.",
      whyItFails:
        "The end state depends on mass. A Sun-like star leaves a white dwarf; a more massive star can leave a neutron star or, above a higher mass threshold, a black hole. Age alone does not determine the outcome.",
      correction:
        "Compare the star's mass with the thresholds for white dwarf, neutron star and black hole formation. The life cycle branches by mass.",
      contrast: {
        wrong: "Every old star becomes a black hole.",
        right: "Sun-like stars become white dwarfs; only the most massive stars can become black holes.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A satellite orbits at 8,000 m/s with a period of 5,000 s. What is the orbital radius?",
      hint: "Rearrange v = 2πr/T to make r the subject.",
      answer: "r = vT/(2π) = 8,000 × 5,000/(2π) ≈ 6.37 × 10⁶ m.",
      feedback: {
        correct: "You rearranged the orbital-speed relationship and kept the units.",
        incorrect:
          "Multiply speed by period to get the circumference, then divide by 2π: about 6.37 × 10⁶ m.",
      },
    },
    {
      id: "p2",
      prompt:
        "A galaxy at 50 Mpc recedes at 3,500 km/s. What is the Hubble constant?",
      hint: "Rearrange v = H₀d to make H₀ the subject.",
      answer: "H₀ = 3,500/50 = 70 km/s/Mpc.",
      feedback: {
        correct: "You divided the speed by the distance.",
        incorrect:
          "The Hubble constant is speed divided by distance: 3,500/50 = 70 km/s/Mpc.",
      },
    },
    {
      id: "p3",
      prompt: "What happens to a Sun-like star after its main-sequence stage?",
      hint: "It expands, sheds layers and leaves a dense core.",
      answer:
        "It becomes a red giant, sheds its outer layers and leaves a white dwarf.",
      feedback: {
        correct: "You described the red giant and white dwarf stages.",
        incorrect:
          "A Sun-like star becomes a red giant, then a planetary nebula and a white dwarf; it does not become a black hole.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A satellite orbits at 4.22 × 10⁷ m with a period of 86,400 s. Calculate its orbital speed to two significant figures.",
      modelAnswer: "3.1 × 10³ m/s",
      marking: [
        "Uses v = 2πr/T.",
        "Computes about 3.1 × 10³ m/s.",
      ],
      check: { accepted: ["3.1 × 10³ m/s", "3.1 x 10^3 m/s", "3,100 m/s", "3100 m/s"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A galaxy is 100 Mpc away. Using H₀ = 70 km/s/Mpc, what is its recession speed?",
      modelAnswer: "7,000 km/s",
      marking: [
        "Uses v = H₀d.",
        "Multiplies 70 by 100 to get 7,000 km/s.",
      ],
      check: { accepted: ["7,000 km/s", "7000 km/s", "7000"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how redshift provides evidence for an expanding universe, and why the expansion does not imply that Earth is at the centre.",
      modelAnswer:
        "Light from distant galaxies is shifted towards longer wavelengths, and the shift increases with distance. Hubble's law relates the recession speed to distance, which is consistent with space expanding between galaxies. The same relationship would be observed from any galaxy, so no observer is at a privileged centre; the expansion is not a movement away from a single point.",
      marking: [
        "Links redshift to increasing wavelength and recession.",
        "States Hubble's law and the distance–speed relationship.",
        "Explains that the pattern is the same from any galaxy, so there is no centre.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A galaxy is observed with a recession speed of 14,000 km/s. Using H₀ = 70 km/s/Mpc, estimate its distance. Explain why this estimate is uncertain for very distant galaxies and state an assumption.",
      whyItTransfers:
        "The lesson uses Hubble's law to find speed from distance. The transfer reverses the calculation and asks about the limits of the model, so the learner must rearrange the law and reason about its assumptions.",
      answer:
        "d = v/H₀ = 14,000/70 = 200 Mpc. For very distant galaxies, the simple linear law is uncertain because the Hubble constant may not have been constant over the light's travel time, peculiar velocities and measurement errors matter, and the expansion history affects the distance. The estimate assumes H₀ = 70 km/s/Mpc and that the galaxy's motion is dominated by cosmic expansion.",
      marking: [
        "Rearranges Hubble's law to d = v/H₀.",
        "Calculates 200 Mpc.",
        "Explains a limitation for distant galaxies and states an assumption.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "What force keeps a planet in orbit?",
      answer: "Gravity, acting as the centripetal force towards the star.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is Hubble's law?",
      answer: "Recession speed is proportional to distance: v = H₀d.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What determines whether a star ends as a white dwarf, neutron star or black hole?",
      answer: "Its mass, with more massive stars leaving neutron stars or black holes.",
      when: "month-later",
    },
  ],
  summary: [
    "Gravity provides the centripetal force for orbits, and smaller orbits require faster speeds.",
    "Stars form from collapsing gas, fuse hydrogen, and end according to their mass.",
    "Redshift increases with distance and supports an expanding universe.",
    "Hubble's law v = H₀d relates recession speed to distance, with no galaxy at a privileged centre.",
  ],
});
