import type { AuthoredLesson } from "../../lesson-contract";

// IONIC BONDING IS A LATTICE, NOT A PAIR OF ATOMS HOLDING HANDS.
//
// The lesson starts with the electron bookkeeping that makes an ion, because
// "metals lose electrons" is not an explanation until a learner can count the
// outer shell. It then separates four ideas that are often merged: an ion is
// charged, an ionic formula is a ratio rather than a molecule, the lattice is
// held together in every direction, and conductivity requires ions that can
// move. The properties of sodium chloride follow from those four ideas rather
// than from a list to memorise.
export const CHEMISTRY_IONIC_BONDING: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "ionic-bonding",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, bonding, structure and the properties of matter: ionic bonding, ionic compounds, giant ionic lattices and electrolysis",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against published GCSE subject content for ionic bonding and structure. Every explanation, example, practice item and assessment is original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Use an atom's outer-electron count to explain the charge on the ion it forms, including why metals form positive ions and non-metals form negative ions.",
      evidence:
        "Given sodium (2, 8, 1), magnesium (2, 8, 2), aluminium (2, 8, 3), oxygen (2, 6) and chlorine (2, 8, 7), the learner states the ion each forms and gives the electron transfer that produces it.",
    },
    {
      statement:
        "Write the formula of an ionic compound by balancing positive and negative charges, and explain why the formula is a ratio rather than a molecule.",
      evidence:
        "The learner derives Al₂O₃ from Al³⁺ and O²⁻, checks that the total charge is zero, and explains why one aluminium ion and one oxide ion would not balance.",
    },
    {
      statement:
        "Explain the properties of a giant ionic lattice, including high melting point, brittleness and conductivity only when molten or aqueous.",
      evidence:
        "The learner explains why sodium chloride does not conduct as a solid but does when melted or dissolved, and why a crystal can cleave when its layers are displaced.",
    },
    {
      statement:
        "Distinguish an ionic substance from a simple molecular substance using structure and the particles that are free to move.",
      evidence:
        "The learner contrasts sodium chloride with water or carbon dioxide, naming mobile ions as the charge carriers in the ionic case and explaining why the solid lattice is not a collection of separate molecules.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements", "electron-shells"],
    check: [
      {
        id: "d1",
        question:
          "Sodium has 11 electrons. Write its shell configuration and state how many electrons are in its outer shell.",
        answer:
          "Sodium is 2, 8, 1: two electrons in the first shell, eight in the second and one in the third. It has one outer electron.",
        targets: ["electron-shells"],
      },
      {
        id: "d2",
        question:
          "Why are the noble gases unreactive, and what does that tell you about a full outer shell?",
        answer:
          "Their outer shells are full, so they do not need to gain, lose or share electrons to reach a stable arrangement. A full outer shell is the low-energy arrangement that other atoms are trying to reach.",
        targets: ["electron-shells", "atoms-elements"],
      },
    ],
  },

  introduction: {
    hook:
      "Sodium is a soft metal that reacts violently with water. Chlorine is a green, poisonous gas. Combine them and you get white crystals that sit on a dinner table. The atoms have not become harmless by magic: each sodium atom has lost an electron, each chlorine atom has gained one, and the charged particles are locked into a lattice. The product is safe to eat because it is a different substance, not because the danger was hidden.",
    why:
      "Ionic compounds are the salts in seawater, the minerals in rocks, the electrolyte in a battery and the ceramic in a spark plug. Their formulas, melting points and conductivity all come from one structural idea: a giant lattice of charged ions. Learning to count the transfer and balance the charges lets you predict a formula instead of remembering it, and it explains why a solid salt can be an insulator while the same salt dissolved in water completes a circuit.",
  },

  explanation: [
    {
      heading: "A metal loses electrons and a non-metal gains them",
      paragraphs: [
        "An atom is electrically neutral because its protons and electrons balance. Sodium has eleven protons and eleven electrons: 2, 8, 1. The single electron in its outer shell is far from the nucleus and is shielded by the inner shells, so removing it takes relatively little energy. The remaining particle has eleven protons and ten electrons, giving a charge of 1+. It is a sodium ion, Na⁺, with the stable configuration 2, 8.",
        "Chlorine has seventeen protons and seventeen electrons: 2, 8, 7. It needs one more electron to complete its third shell. Adding one electron gives eighteen electrons and seventeen protons, so the particle has a charge of 1−. It is a chloride ion, Cl⁻, with the configuration 2, 8, 8. The electron removed from sodium is the electron gained by chlorine. Matter is conserved, and so is charge: one positive charge and one negative charge cancel overall.",
        "The same counting works across the main groups. Magnesium is 2, 8, 2 and loses two electrons to become Mg²⁺. Aluminium is 2, 8, 3 and loses three to become Al³⁺. Oxygen is 2, 6 and gains two to become O²⁻. A group 1 metal therefore forms 1+ ions, a group 2 metal forms 2+ ions, and a group 7 halogen forms 1− ions. The charge is not a label to memorise separately from the electron count; it is the count written as a charge.",
        "Transition metals are a deliberate exception to the simple group rule. Iron can form Fe²⁺ or Fe³⁺, and copper can form Cu⁺ or Cu²⁺, because their outer and inner d electrons can be lost to different extents. A formula containing one of these metals therefore cannot be deduced from the group alone; the name or the formula must tell you which ion is present. Iron(II) chloride contains Fe²⁺, while iron(III) chloride contains Fe³⁺.",
      ],
    },
    {
      heading: "The ionic bond is the attraction throughout a lattice",
      paragraphs: [
        "It is tempting to picture one sodium atom handing an electron to one chlorine atom, after which the two ions sit together as a neat pair. The transfer is real, but the pair is not the structure. Each Na⁺ is surrounded by Cl⁻ ions in every direction, and each Cl⁻ is surrounded by Na⁺ ions. The electrostatic attraction between oppositely charged ions holds the whole arrangement together. There is no single bond that belongs to one pair, and no molecule of NaCl in the solid.",
        "The repeating arrangement is a giant ionic lattice. In sodium chloride it is cubic, with each ion surrounded by six ions of the opposite charge. The number of neighbours is a consequence of the sizes of the ions and how they pack, not a separate rule to memorise. The formula NaCl tells you the ratio of sodium ions to chloride ions in the whole crystal: one of each. It does not tell you that one sodium is bonded only to one chlorine.",
        "This is why chemists call NaCl a formula unit rather than a molecular formula. A formula unit is the smallest whole-number ratio that gives a neutral compound. In Al₂O₃ the ratio is two aluminium ions to three oxide ions, repeated throughout the lattice. A crystal can contain enormous numbers of these units, but the formula is still written in the simplest whole-number ratio.",
        "The lattice model also explains why ionic compounds are solids at room temperature. The attractions act in three dimensions, so separating the ions requires energy at many points at once. Melting does not break a few isolated bonds; it gives the whole lattice enough energy for the ions to move past one another. That is a much larger change than melting a simple molecular solid, where only the weak forces between molecules need to be overcome.",
      ],
    },
    {
      heading: "Balance the charges to get the formula",
      paragraphs: [
        "An ionic compound must be electrically neutral overall. If the positive and negative charges did not cancel, the substance would have a net charge, which is not what a stable crystal is. The formula is found by taking the smallest whole-number numbers of each ion that make the total charge zero. This is sometimes taught as the crossover method, but the reason is charge balance rather than a trick with the superscripts.",
        "Consider aluminium oxide. Aluminium forms Al³⁺ and oxygen forms O²⁻. One of each would give a total charge of 3+ plus 2−, which is 1+ and not neutral. Two Al³⁺ give 6+, and three O²⁻ give 6−, so the charges cancel. The formula is Al₂O₃. The numbers 2 and 3 are not copied from the charges in the order they appear; they are the smallest counts that make the total charge zero.",
        "Magnesium chloride is a second check. Mg²⁺ and Cl⁻ need two chloride ions for every magnesium ion: 2+ plus two 1− charges is zero. The formula is MgCl₂. Calcium oxide is simpler: Ca²⁺ and O²⁻ balance one-to-one, so the formula is CaO. In each case, the formula describes the ratio of ions, not a molecule with that number of atoms joined together.",
        "Polyatomic ions are groups of atoms that carry a charge and stay together in the lattice. The sulfate ion is SO₄²⁻ and the nitrate ion is NO₃⁻. When more than one polyatomic ion is needed, brackets keep the group intact: calcium nitrate is Ca(NO₃)₂, not CaNO₃₂. The subscript outside the bracket multiplies the whole ion, just as it would multiply a group of atoms in a molecular formula.",
      ],
    },
    {
      heading: "Properties follow from fixed ions and strong attractions",
      paragraphs: [
        "An ionic solid has a high melting point because its ions are held by strong electrostatic attractions in three dimensions. The melting point is not a measure of one bond's strength, because there is no single bond to break. It is the energy needed to let the ions leave their positions and move. Magnesium oxide, with 2+ and 2− ions, has stronger attractions and a higher melting point than sodium chloride, with 1+ and 1− ions of similar size.",
        "Solid ionic compounds do not conduct electricity. Conductivity requires charged particles that are free to move through the material. In the solid lattice, the ions are charged but fixed in place: they vibrate about their positions but cannot carry a current from one electrode to the other. The electrons are also localised in the ions rather than delocalised across the structure. A charged particle that cannot move is not a charge carrier.",
        "Melting or dissolving changes that. In a molten ionic compound, the ions are free to move through the liquid, so it conducts. When an ionic solid dissolves in water, the water molecules pull ions away from the lattice surface and surround them; the separated ions are mobile in the solution, so the solution conducts. This is why solid sodium chloride is an insulator while molten sodium chloride and sodium chloride solution are electrolytes.",
        "Ionic crystals are often brittle. If a crystal is struck and one layer shifts, ions of the same charge can be brought next to one another. The repulsion between like charges then splits the crystal along a plane. The same strong attractions that make the solid hard also make this displacement catastrophic once it happens. Brittleness is therefore a consequence of the ordered lattice, not evidence that the attractions are weak.",
        "Solubility is a separate question and should not be turned into a universal rule. Many ionic compounds dissolve in water because the attractions between ions and water molecules can compensate for the energy needed to separate the lattice. Others, such as silver chloride, are only sparingly soluble. An insoluble ionic solid is still ionic; its ions are simply held too strongly for water to pull them apart on a useful scale.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.equation",
      body:
        "Sodium loses the one electron in its outer shell and chlorine gains it. The two ions produced have full outer shells and opposite charges, so they attract. The electron is not destroyed; it is transferred.",
      notation:
        "Na → Na⁺ + e⁻   ·   Cl + e⁻ → Cl⁻   ·   Na⁺ and Cl⁻ attract in a 1:1 lattice",
      caption:
        "The charge on each ion comes from the difference between its protons and its electrons. Sodium has 11 protons and 10 electrons in Na⁺; chloride has 17 protons and 18 electrons.",
    },
    {
      id: "r2",
      kind: "chemistry.formula",
      body:
        "An ionic formula is the simplest ratio of ions that gives zero total charge. It is a formula unit for the lattice, not a molecule. The subscript belongs to the ion before it, and a bracket protects a polyatomic ion.",
      notation:
        "Na⁺ + Cl⁻ → NaCl   ·   Mg²⁺ + 2Cl⁻ → MgCl₂   ·   2Al³⁺ + 3O²⁻ → Al₂O₃   ·   Ca²⁺ + 2NO₃⁻ → Ca(NO₃)₂",
      caption:
        "In Al₂O₃ the total positive charge is 2 × 3+ = 6+ and the total negative charge is 3 × 2− = 6−. The formula is neutral, and the ratio is two Al³⁺ ions for every three O²⁻ ions.",
    },
    {
      id: "r3",
      kind: "chemistry.particle-model",
      body:
        "A giant ionic lattice has oppositely charged ions packed in a repeating three-dimensional pattern. Every ion is surrounded by ions of the opposite charge. The attractions act in all directions, which is why the solid has a high melting point and why there is no separate NaCl molecule to point to.",
      notation:
        "solid NaCl: Na⁺ and Cl⁻ fixed in a cubic lattice, six nearest neighbours of the opposite charge   ·   molten or aqueous: the same ions become mobile",
      caption:
        "The lattice is the structure; the formula is its ratio. A crystal can contain countless Na⁺ and Cl⁻ ions, but the simplest ratio is still one to one.",
    },
    {
      id: "r4",
      kind: "chemistry.calculation",
      body:
        "Charge balance is an arithmetic check, not a memory test. Multiply each ion's charge by the number of that ion in the proposed formula, add the positive and negative totals, and require zero.",
      notation:
        "Al₂O₃: (2 × +3) + (3 × −2) = +6 − 6 = 0   ·   MgCl₂: (+2) + (2 × −1) = 0   ·   CaO: (+2) + (−2) = 0",
      caption:
        "If the total is not zero, the formula is not neutral. One Al³⁺ and one O²⁻ would give +1, so AlO is not the formula of aluminium oxide.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Sodium has the configuration 2, 8, 1 and chlorine has 2, 8, 7. Explain how each atom forms an ion, give the charge on each ion, and explain why the compound formed is NaCl rather than a molecule containing one sodium atom bonded only to one chlorine atom.",
      steps: [
        {
          move:
            "Count the outer electrons and decide whether losing or gaining reaches a full shell.",
          why:
            "Sodium has one outer electron, so losing one is easier than gaining seven; chlorine has seven outer electrons, so gaining one is easier than losing seven. The noble-gas configuration is the low-energy target.",
        },
        {
          move:
            "Remove one electron from sodium and add it to chlorine, then compare protons with electrons.",
          why:
            "Na loses one electron: 11 protons and 10 electrons give 1+. Cl gains one: 17 protons and 18 electrons give 1−. The charges are equal and opposite, so the compound is neutral overall.",
        },
        {
          move:
            "Write the ions and balance the charges: one Na⁺ for one Cl⁻.",
          why:
            "One 1+ charge and one 1− charge already total zero, so the simplest whole-number ratio is 1:1. The formula is NaCl.",
        },
        {
          move:
            "Describe the arrangement rather than a single bond: each ion is surrounded by ions of the opposite charge in a giant lattice.",
          why:
            "The electrostatic attraction is not confined to one pair. The formula gives the ratio in the whole crystal, not the number of neighbours or a discrete molecule.",
        },
      ],
      answer:
        "Sodium loses its one outer electron to become Na⁺ (2, 8), and chlorine gains that electron to become Cl⁻ (2, 8, 8). One 1+ charge balances one 1− charge, so the formula is NaCl. The solid is a giant lattice of alternating Na⁺ and Cl⁻ ions, not a collection of NaCl molecules, and each ion is attracted to several ions of the opposite charge.",
    },
    {
      id: "w2",
      prompt:
        "Aluminium forms Al³⁺ and oxygen forms O²⁻. Deduce the formula of aluminium oxide and check that it is electrically neutral.",
      steps: [
        {
          move:
            "Write the charges on the two ions: Al³⁺ and O²⁻.",
          why:
            "Aluminium is in group 3 and loses three outer electrons; oxygen is in group 6 and gains two. The charges are not both 1, so one of each cannot balance.",
        },
        {
          move:
            "Find the lowest common multiple of the charge sizes, 3 and 2, which is 6.",
          why:
            "The total positive charge must equal the total negative charge. Six is the smallest total that both 3+ and 2− can divide into a whole number of ions.",
        },
        {
          move:
            "Use two Al³⁺ ions for 6+ and three O²⁻ ions for 6−.",
          why:
            "2 × 3+ = 6+ and 3 × 2− = 6−. The counts are the subscripts in the formula, so the ratio is 2:3.",
        },
        {
          move:
            "Write Al₂O₃ and check the total charge is zero.",
          why:
            "The formula is neutral and is in the simplest whole-number ratio. It describes the repeating ratio in the lattice, not a molecule with five atoms joined together.",
        },
      ],
      answer:
        "The formula is Al₂O₃. Two Al³⁺ ions give 6+ and three O²⁻ ions give 6−, so the charges cancel. The formula unit is neutral, and the crystal contains aluminium and oxide ions in a 2:3 ratio.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "An ionic bond is a single link between one metal atom and one non-metal atom, so sodium chloride exists as NaCl molecules.",
      whyItFails:
        "The transfer produces ions, but the attraction is not restricted to the original pair. Each Na⁺ is surrounded by Cl⁻ ions and each Cl⁻ by Na⁺ ions throughout a giant lattice. There is no discrete NaCl molecule in solid sodium chloride, and the formula NaCl is a ratio rather than a molecular formula.",
      correction:
        "Describe the structure as a lattice of alternating ions. Use the words formula unit and ratio, and say that each ion is attracted to several ions of the opposite charge.",
      contrast: {
        wrong:
          "one sodium atom gives one electron to one chlorine atom, making one NaCl molecule",
        right:
          "sodium ions and chloride ions attract in every direction in a giant lattice; NaCl is the simplest ratio of those ions",
      },
    },
    {
      id: "m2",
      belief:
        "Solid sodium chloride conducts electricity because it contains charged ions.",
      whyItFails:
        "Conductivity requires charge carriers that can move. In the solid lattice the ions are charged but fixed in position, so they cannot carry a current through the crystal. The electrons are also localised rather than free to move through the structure. Melting or dissolving releases the ions and only then does the substance conduct.",
      correction:
        "Name the charge carrier and its mobility. In a solid ionic compound the ions are fixed; in the melt or aqueous solution the ions are mobile; in a metal the charge carriers are delocalised electrons.",
      contrast: {
        wrong:
          "solid salt conducts because Na⁺ and Cl⁻ are charged",
        right:
          "solid salt does not conduct because its ions are fixed; molten or dissolved salt conducts because the ions are free to move",
      },
    },
    {
      id: "m3",
      belief:
        "The formula of an ionic compound is written by putting one of each symbol together, so aluminium oxide is AlO.",
      whyItFails:
        "AlO would contain one Al³⁺ and one O²⁻, giving a total charge of 1+. A stable ionic compound is neutral overall. The subscripts must give equal total positive and negative charge: two Al³⁺ give 6+ and three O²⁻ give 6−, so the formula is Al₂O₃.",
      correction:
        "Balance the charges before writing the formula. Multiply the charge by the number of each ion, add the positive and negative totals, and adjust the counts until the total is zero.",
      contrast: {
        wrong:
          "aluminium oxide is AlO because the symbols appear once each",
        right:
          "aluminium oxide is Al₂O₃ because two Al³⁺ ions balance three O²⁻ ions",
      },
    },
    {
      id: "m4",
      belief:
        "Ionic compounds have low melting points because the attractions between the ions are weak.",
      whyItFails:
        "The electrostatic attractions in an ionic lattice are strong and act in three dimensions. High melting points are the evidence: a large amount of energy is needed to let the ions leave their fixed positions. Ionic solids are brittle because a shifted layer brings like charges together, not because the attractions are weak.",
      correction:
        "Connect the property to the whole lattice: many strong attractions must be overcome at once. Distinguish that from a simple molecular solid, where only weak forces between molecules are overcome.",
      contrast: {
        wrong:
          "salt melts easily because the bond between sodium and chlorine is weak",
        right:
          "salt has a high melting point because strong attractions hold the whole ionic lattice together",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Calcium has the configuration 2, 8, 8, 2 and oxygen has 2, 6. Write the ions they form and deduce the formula of calcium oxide. Check the total charge.",
      hint:
        "Calcium loses its two outer electrons; oxygen needs two. How many of each ion would make the positive and negative totals equal?",
      answer:
        "Calcium loses two electrons to become Ca²⁺. Oxygen gains two electrons to become O²⁻. One Ca²⁺ gives 2+ and one O²⁻ gives 2−, so the charges cancel and the formula is CaO.",
      feedback: {
        correct:
          "Correct. One 2+ ion and one 2− ion already balance, so the simplest ratio is 1:1.",
        incorrect:
          "Count the electrons lost and gained first. Calcium loses two and oxygen gains two; a 2+ charge and a 2− charge need one ion of each, giving CaO.",
      },
    },
    {
      id: "p2",
      prompt:
        "Magnesium forms Mg²⁺ and chlorine forms Cl⁻. Deduce the formula of magnesium chloride and explain why the formula is not MgCl.",
      hint:
        "One Mg²⁺ has two positive charges. How many 1− chloride ions are needed to cancel them?",
      answer:
        "One Mg²⁺ needs two Cl⁻ ions because 2+ must be balanced by two 1− charges. The formula is MgCl₂. MgCl would have a total charge of 1+ and would not be neutral.",
      feedback: {
        correct:
          "Correct. The subscript 2 belongs to chloride because two chloride ions are needed for each magnesium ion.",
        incorrect:
          "Balance the charges, not the number of symbols. Mg²⁺ is 2+, so two Cl⁻ ions are required; MgCl would leave a net 1+ charge.",
      },
    },
    {
      id: "p3",
      prompt:
        "A crystal of magnesium oxide is struck and splits along a plane. Explain why an ionic crystal is brittle, and state whether the solid conducts electricity before it melts.",
      hint:
        "What happens to the charges on the two sides of a layer if the layer shifts by one ion position?",
      answer:
        "Striking the crystal can shift one layer relative to another so that ions of the same charge are brought next to one another. The repulsion between like charges pushes the layers apart and the crystal splits. The solid does not conduct because its ions are fixed in the lattice, even though they are charged.",
      feedback: {
        correct:
          "Correct. Brittleness comes from like charges being forced together, and conductivity requires mobile ions rather than fixed ones.",
        incorrect:
          "Separate the two properties. A shifted layer brings like charges together, causing repulsion and cleavage; the solid still does not conduct because its ions cannot move through the lattice.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Aluminium forms Al³⁺ and oxygen forms O²⁻. Write the formula of aluminium oxide.",
      modelAnswer: "Al₂O₃",
      marking: [
        "Uses two aluminium ions and three oxide ions.",
        "Checks that the total positive charge, 2 × 3+ = 6+, equals the total negative charge, 3 × 2− = 6−.",
        "Writes the formula in the simplest whole-number ratio.",
      ],
      check: {
        accepted: ["Al₂O₃", "Al2O3"],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "An oxide ion is O²⁻. How many electrons does one oxide ion contain?",
      modelAnswer: "10",
      marking: [
        "Uses the atomic number of oxygen, which is 8, to count its protons and electrons in the neutral atom.",
        "Adds the two electrons gained to form the 2− charge.",
        "Gives the total number of electrons as 10.",
      ],
      check: {
        accepted: ["10", "10 electrons", "ten", "ten electrons"],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why solid sodium chloride does not conduct electricity, but molten sodium chloride does. Refer to the particles and their movement in each case.",
      modelAnswer:
        "In solid sodium chloride, Na⁺ and Cl⁻ ions are held in a giant ionic lattice. The ions are charged, but they are fixed in their lattice positions and cannot move through the solid, so they cannot carry a current. When the solid is melted, the lattice breaks down and the ions become free to move through the liquid. The mobile ions carry charge from one electrode to the other, so molten sodium chloride conducts. The change is one of ion mobility, not a change in the charge on the ions.",
      marking: [
        "Describes the solid as a giant ionic lattice with ions fixed in position.",
        "Explains that fixed ions cannot carry a current even though they are charged.",
        "Explains that melting releases the ions and makes them mobile.",
        "Links mobile ions to conduction, rather than saying that electrons are freed.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Magnesium oxide is used to line high-temperature furnaces. It has the formula MgO and a melting point of about 2,850 °C. Explain why the formula is MgO, why the melting point is so high, and why the solid is not a collection of MgO molecules.",
      whyItTransfers:
        "The lesson used sodium chloride and aluminium oxide. Here the learner must apply the same charge balance, lattice attraction and formula-unit reasoning to a different compound with 2+ and 2− ions, rather than recalling the sodium chloride example.",
      answer:
        "Magnesium forms Mg²⁺ and oxygen forms O²⁻. One 2+ charge and one 2− charge cancel, so the simplest ratio is 1:1 and the formula is MgO. The solid is a giant lattice of Mg²⁺ and O²⁻ ions, and each ion is attracted to several ions of the opposite charge. Melting requires enough energy to overcome those strong attractions throughout the lattice, so the melting point is very high. The formula MgO is the ratio of ions in the lattice, not a molecule containing one magnesium atom and one oxygen atom.",
      marking: [
        "Derives MgO from Mg²⁺ and O²⁻ by charge balance.",
        "Explains the high melting point using strong attractions throughout a giant lattice.",
        "States that the formula is a ratio or formula unit, not a discrete molecule.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the charge on the ion formed by each of potassium, calcium, aluminium, oxygen and chlorine, using their group numbers.",
      answer:
        "Potassium forms K⁺, calcium forms Ca²⁺, aluminium forms Al³⁺, oxygen forms O²⁻ and chlorine forms Cl⁻. Main-group metals lose their outer electrons to reach a full shell; non-metals gain electrons.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why a crystal of sodium chloride does not conduct when solid but does conduct when dissolved in water.",
      answer:
        "In the solid, the ions are fixed in the lattice and cannot move, so there are no mobile charge carriers. When the solid dissolves, water separates the ions and they become mobile in solution. The mobile Na⁺ and Cl⁻ ions carry the current; the conductivity is not caused by free electrons.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Deduce the formula of iron(III) oxide from Fe³⁺ and O²⁻, and explain why iron(II) oxide has a different formula.",
      answer:
        "Iron(III) oxide is Fe₂O₃: two Fe³⁺ ions give 6+ and three O²⁻ ions give 6−. Iron(II) oxide contains Fe²⁺, so one Fe²⁺ balances one O²⁻ and the formula is FeO. The formula depends on the charge on the iron ion, which is why the oxidation state must be stated for a transition metal.",
      when: "month-later",
    },
  ],

  summary: [
    "A main-group metal loses outer electrons to form a positive ion; a non-metal gains electrons to form a negative ion, and both reach a full outer shell.",
    "An ionic formula is the simplest ratio of ions that gives zero total charge. Balance the charges, then check the total.",
    "An ionic solid is a giant lattice of oppositely charged ions, not a collection of molecules; the formula is a formula unit describing the ratio.",
    "High melting points come from strong attractions throughout the lattice. Ionic solids conduct only when the ions become mobile, as in a melt or aqueous solution.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every electron-transfer equation is read as a sentence, and each formula is followed by its charge check spoken as arithmetic: two aluminium ions at 3+ give 6+, three oxide ions at 2− give 6−, total zero.",
    },
    {
      need: "colour-vision",
      alternative:
        "Positive and negative ions are labelled with their charges and the words positive and negative; they are never distinguished by colour alone. Lattice diagrams also state the repeating ratio in text.",
    },
    {
      need: "dyslexia",
      alternative:
        "The charge-balance method is presented as four short steps: write the ions, find the lowest common multiple, choose the ion counts, check the total charge. The same four steps are used in both worked examples.",
    },
    {
      need: "motor",
      alternative:
        "All responses are typed or selected. No lattice has to be drawn or dragged, and a formula may be typed with ordinary numerals such as Al2O3 as well as with subscripts.",
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
        "All explanations, examples, practice items, assessments and the furnace transfer task are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against published GCSE chemistry subject content for ionic bonding, ionic compounds and electrolysis.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-10",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
