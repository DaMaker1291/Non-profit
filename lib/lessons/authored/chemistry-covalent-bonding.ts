import type { AuthoredLesson } from "../../lesson-contract";

// COVALENT BONDING IS NOT "SHARING" IN THE EVERYDAY SENSE. The lesson starts
// from the electron count that makes a bond necessary, then keeps three claims
// separate that are often merged: a shared pair is not a transferred electron;
// a double bond is one bond of order two, not two single bonds; and a simple
// molecular substance melts by overcoming forces BETWEEN molecules, not by
// breaking the covalent bonds inside them. The giant covalent section exists
// because diamond, graphite and silicon dioxide are the cases where the simple
// molecular model would give the wrong answer.
export const CHEMISTRY_COVALENT_BONDING: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "covalent-bonding",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, bonding, structure and the properties of matter: covalent bonding, simple molecules, giant covalent structures and allotropes of carbon",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content for covalent bonding and structure. No specification, examination question or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain a covalent bond as a shared pair of electrons and use outer-electron counts to predict how many bonds an atom forms.",
      evidence:
        "Given hydrogen, oxygen, nitrogen, carbon and a formula such as CH₄, H₂O, NH₃, CO₂ or N₂, the learner counts the outer electrons, states how many each atom needs, and explains why the atoms share rather than transfer electrons.",
    },
    {
      statement:
        "Interpret dot-and-cross and displayed formulas, including single, double and triple bonds, and explain how bond order affects length and strength.",
      evidence:
        "The learner draws or describes the bonding in H₂O and CH₄, counts bonding and lone pairs in CO₂ and N₂, and explains why a C=C bond is shorter and stronger than a C–C bond without calling it two separate single bonds.",
    },
    {
      statement:
        "Explain why simple molecular substances have relatively low melting and boiling points and do not conduct electricity.",
      evidence:
        "The learner states that melting and boiling overcome weak intermolecular forces rather than covalent bonds, that the molecules remain intact, and that there are no free ions or delocalised electrons to carry charge.",
    },
    {
      statement:
        "Explain the properties of diamond, graphite and silicon dioxide from their giant covalent structures, including why graphite conducts but diamond does not.",
      evidence:
        "The learner links diamond's tetrahedral network to its hardness, graphite's layers and delocalised electrons to its softness and conductivity, and silicon dioxide's continuous network to its high melting point.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["electron-shells", "atoms-elements"],
    check: [
      {
        id: "d1",
        question:
          "Oxygen has 8 electrons. Write its shell configuration and state how many electrons are in its outer shell.",
        answer:
          "Oxygen is 2, 6: two electrons in the first shell and six in the second. It has six outer electrons, so it needs two more to complete the second shell.",
        targets: ["electron-shells"],
      },
      {
        id: "d2",
        question:
          "Why is a full outer shell stable, and what are the two ways a non-metal atom can reach one?",
        answer:
          "A full outer shell is at a lower energy and is stable. An atom can gain or lose electrons to form an ion, or it can share electrons with another atom. Covalent bonding is the sharing route.",
        targets: ["electron-shells", "atoms-elements"],
      },
    ],
  },

  introduction: {
    hook:
      "Two hydrogen atoms each have one electron. Separately, each is one electron short of a full first shell; together they share a pair, and each atom can count both electrons in that pair as its own. The result is H₂, a gas that boils at −253 °C even though the bond holding the two atoms together is extremely strong. The strength of the bond and the ease of boiling are not measuring the same thing.",
    why:
      "Covalent bonding is the main way non-metals combine: water, carbon dioxide, methane, ammonia, oxygen, nitrogen, plastics and the molecules of life are all held together by shared electron pairs. The model explains both what holds a molecule together and why many molecular substances melt easily or do not conduct. It also has a boundary: diamond, graphite and silicon dioxide are covalent, but they are not simple molecules. Learning one sentence — 'non-metals share electrons' — is not enough to predict either set of properties.",
  },

  explanation: [
    {
      heading: "A covalent bond is a shared pair, not a transferred electron",
      paragraphs: [
        "A covalent bond forms when two atoms share a pair of electrons. The shared pair is attracted to both nuclei at once, and that attraction is what holds the atoms together. Neither atom loses an electron outright, so no positive and negative ions are produced. The molecule is neutral overall, even though individual bonds may be polar because the shared pair is pulled more strongly towards one nucleus.",
        "Hydrogen is the simplest case. Each hydrogen atom has one outer electron and needs two for a full first shell. If each atom contributes one electron to a shared pair, both atoms can count the pair as a full shell. The same counting rule is used throughout the second row of the periodic table: an atom shares enough pairs to reach eight outer electrons. Oxygen has six outer electrons and needs two; nitrogen has five and needs three; carbon has four and needs four; fluorine has seven and needs one.",
        "A dot-and-cross diagram makes the bookkeeping visible. The outer shell of each atom is drawn, one atom's electrons are shown as dots and the other's as crosses, and the overlapping pair is the covalent bond. In H₂O, oxygen contributes six electrons and each hydrogen contributes one. Two of oxygen's electrons are shared with the two hydrogen atoms, leaving two lone pairs on oxygen. Each hydrogen has its own electron in a bonding pair, so each has a full duet. The diagram is not a picture of the electron's path; it is a count of where the outer electrons are assigned.",
        "This is the important difference from ionic bonding. Sodium chloride is held together by Na⁺ and Cl⁻ ions in a lattice. A covalent molecular substance such as water contains neutral molecules; the shared electrons stay associated with the atoms in each molecule. That difference is why solid sodium chloride does not conduct until it is melted or dissolved, while liquid water also does not conduct: water molecules are neutral, and its few ions come from self-ionisation, not from the covalent bonds themselves.",
      ],
    },
    {
      heading: "Count the outer electrons to predict the bonds an atom forms",
      paragraphs: [
        "The number of covalent bonds an atom forms is usually the number of electrons it needs to complete its outer shell, not the number of electrons it already has. Carbon has four outer electrons and needs four more, so it forms four bonds. Nitrogen needs three, oxygen needs two, and fluorine needs one. Hydrogen needs one more electron for a duet, so it forms one bond. These are the counts that build the common formulas.",
        "In methane, CH₄, carbon forms four single bonds, one to each hydrogen. In ammonia, NH₃, nitrogen forms three single bonds and keeps one lone pair. In water, H₂O, oxygen forms two single bonds and keeps two lone pairs. In carbon dioxide, CO₂, carbon still forms four bonds in total, but they are arranged as two double bonds, one to each oxygen. In nitrogen, N₂, each nitrogen forms three bonds to the other, giving a triple bond.",
        "A molecular formula and a displayed formula answer different questions. The formula CO₂ says there is one carbon atom for every two oxygen atoms; it does not show whether the bonds are single or double. The displayed formula O=C=O shows the connectivity and the bond order. A learner who counts atoms in CO₂ and concludes that carbon forms two bonds has counted the wrong thing: carbon forms four bonds in total, distributed over two oxygens.",
        "The same method extends to larger molecules. Ethene, C₂H₄, has a C=C double bond and four C–H single bonds. Each carbon has four bonds, and each hydrogen has one. The formula alone does not reveal the double bond; the structure does. This is why organic chemistry is taught from displayed formulas and skeletal structures rather than from formulas alone.",
      ],
    },
    {
      heading: "Bond order changes length and strength",
      paragraphs: [
        "A single bond is one shared pair, a double bond is two shared pairs, and a triple bond is three. The bond order counts the pairs, not the number of atoms joined. A double bond is not two separate single bonds lying side by side: it is one bond with order two, formed by two shared pairs between the same two atoms. The two pairs are constrained together, so rotation about the bond is restricted. That restriction is why ethene has a rigid planar shape around its C=C bond.",
        "For the same pair of atoms, increasing the bond order usually makes the bond shorter and stronger. The extra shared pairs add electrostatic attraction between the nuclei and the electron density, so more energy is needed to break the bond. Nitrogen's N≡N bond is shorter and stronger than a typical N–N single bond, which is why nitrogen gas is so unreactive. Carbon dioxide's C=O bonds are shorter and stronger than a C–O single bond for the same reason.",
        "Bond strength is not the same as the strength of the substance. A candle made of a simple molecular hydrocarbon contains strong C–C and C–H bonds, but it melts and softens at a low temperature because the forces between the molecules are weak. The covalent bonds do not need to break when the candle melts. Keeping these two levels separate is the central skill in this topic.",
        "When a bond does break in a chemical reaction, the shared pair is rearranged. The electrons are not destroyed; they are redistributed into new bonds or returned to atoms as ions or radicals. That is why a balanced equation conserves atoms and why bond breaking and bond formation are the accounting behind energy changes.",
      ],
    },
    {
      heading: "Simple molecular substances melt by overcoming forces between molecules",
      paragraphs: [
        "A simple molecular substance is made of discrete molecules. Inside each molecule, the atoms are held by strong covalent bonds. Between one molecule and the next, there are weaker attractions called intermolecular forces. When the substance melts or boils, the molecules gain enough energy to move past one another or escape from the liquid; the intermolecular forces are overcome, but the covalent bonds inside each molecule remain intact.",
        "This is why many simple molecular substances are gases or liquids at room temperature, and why solids such as iodine or sugar have relatively low melting points compared with giant ionic or giant covalent solids. Water is a useful reminder that 'low' is relative: its boiling point is 100 °C, high for a molecule of its size because hydrogen bonds between water molecules are stronger than the dispersion forces between methane molecules. Even so, boiling water does not break the O–H covalent bonds; steam is still H₂O.",
        "Simple molecular substances do not conduct electricity when solid or liquid because they contain no free ions and no delocalised electrons. The molecules are neutral and the electrons are localised in covalent bonds and lone pairs. A molecular substance can conduct after it reacts with water to produce ions — hydrogen chloride is a molecular gas, but hydrochloric acid contains H⁺ and Cl⁻ ions in solution — and that is a chemical change, not a property of the intact molecule.",
        "The forces between molecules are not all the same strength. Larger molecules have more electrons and usually stronger dispersion forces, so their boiling points tend to be higher. Polar molecules have additional dipole–dipole attractions, and molecules with O–H or N–H groups can form hydrogen bonds. These differences explain trends within a family, but they do not change the key rule: the covalent bonds inside the molecules are much stronger than the forces between them.",
      ],
    },
    {
      heading: "Giant covalent structures are networks, not molecules",
      paragraphs: [
        "In a giant covalent structure, covalent bonds connect the atoms into a continuous network. There are no discrete molecules to separate. Diamond is the clearest example: each carbon atom is bonded to four others in a tetrahedral arrangement, and those four are bonded onwards in three dimensions. To melt diamond, many strong C–C bonds must be broken, so its melting point is extremely high and it is very hard. All four of carbon's outer electrons are used in bonding, so diamond has no delocalised electrons and does not conduct electricity.",
        "Graphite is also a giant covalent structure, but its connectivity is different. Each carbon is bonded to three others in a hexagonal layer, and the fourth outer electron is delocalised across the layer. The layers are held together by weak forces, so they can slide over one another; that is why graphite is soft and useful as a lubricant and in pencil leads. The delocalised electrons can move along the layers, so graphite conducts electricity. Its ions do not move; the charge carriers are electrons.",
        "Diamond and graphite are allotropes of carbon: different structural forms of the same element. Their different properties come from their different arrangements, not from a different kind of atom. Graphene is a single layer of graphite, and fullerenes such as C₆₀ are molecular forms of carbon with weak forces between the cages. The existence of these forms is a warning against treating 'carbon' or 'covalent' as a single property.",
        "Silicon dioxide, SiO₂, is another giant covalent network. Each silicon atom is bonded to four oxygen atoms, and each oxygen is bonded to two silicon atoms, so the formula gives the ratio rather than a small molecule. The network is held together by strong Si–O bonds throughout, giving quartz a high melting point and considerable hardness. Like diamond, it has no free electrons or mobile ions, so it does not conduct electricity.",
        "The test is structural, not a label. Ask whether the substance is made of separate molecules or a continuous network, then ask which forces must be overcome for the change being described. A high melting point points to a giant structure or strong ionic attractions; a low melting point with no conductivity points to a simple molecular substance; conductivity in a solid points to delocalised electrons, as in graphite or a metal.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.formula",
      body:
        "The same counting rule produces every common formula in this lesson. Carbon needs four bonds, nitrogen three, oxygen two and hydrogen one. A double bond uses two of an atom's bonds; a triple bond uses three.",
      notation:
        "H₂: H–H (1 shared pair)   ·   CH₄: four C–H bonds (4 pairs)   ·   NH₃: three N–H bonds and one lone pair on N   ·   H₂O: two O–H bonds and two lone pairs on O   ·   CO₂: O=C=O (4 shared pairs in total)   ·   N₂: N≡N (3 shared pairs)",
      caption:
        "Count bonds, not atoms. Carbon dioxide has two oxygen atoms but four shared pairs, because each C=O bond is a double bond. The molecular formula alone would not tell you that.",
    },
    {
      id: "r2",
      kind: "chemistry.particle-model",
      body:
        "A dot-and-cross diagram is an electron bookkeeping diagram. One atom's outer electrons are dots and the other's are crosses; the pair in the overlap is shared. In water, oxygen brings six outer electrons and each hydrogen brings one, so the molecule has four pairs around oxygen: two bonding pairs and two lone pairs.",
      notation:
        "H• + •H → H:H   ·   O with 2 H: two O–H bonding pairs and two lone pairs on O   ·   each H counts the shared pair as a full duet",
      caption:
        "The shared pair belongs to both atoms for the purpose of counting a full shell. That is why one pair can complete two atoms at once, and why the bond is not an electron transfer.",
    },
    {
      id: "r3",
      kind: "chemistry.formula",
      body:
        "Bond order is the number of shared pairs between the same two atoms. More shared pairs mean a shorter, stronger bond. The effect is not the same as placing two separate single bonds side by side, and it restricts rotation around the bond.",
      notation:
        "single: 1 pair   ·   double: 2 pairs   ·   triple: 3 pairs   ·   C–C > C=C > C≡C in length, and C–C < C=C < C≡C in strength (for the same pair of atoms)",
      caption:
        "A C=C bond is one bond of order two. It is shorter and stronger than a C–C single bond, and the two carbon atoms cannot rotate freely relative to each other.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "In a simple molecular substance, the strong covalent bonds are inside each molecule and the weak attractions are between molecules. Melting and boiling overcome the forces between molecules; the molecules themselves stay intact. There are no free ions or delocalised electrons, so the substance does not conduct.",
      notation:
        "inside a molecule: strong covalent bonds   ·   between molecules: weak intermolecular forces   ·   boiling: molecules separate, covalent bonds do not break",
      caption:
        "Steam is still H₂O. Boiling water overcomes the attractions between water molecules, not the O–H bonds inside them. This is why a molecular substance can have strong bonds and a low boiling point at the same time.",
    },
    {
      id: "r5",
      kind: "chemistry.particle-model",
      body:
        "Diamond and graphite have the same atoms but different networks. Diamond's tetrahedral network has no free electrons. Graphite's layers contain delocalised electrons and are held together by weak forces, so the layers slide and the electrons conduct along them.",
      notation:
        "diamond: C bonded to 4 C in 3-D, all electrons localised, hard, does not conduct   ·   graphite: C bonded to 3 C in layers, one delocalised electron per C, soft, conducts along the layer   ·   SiO₂: Si–O network, high melting point, does not conduct",
      caption:
        "The property follows the structure. Graphite is soft because its layers slide and conducts because its delocalised electrons move; diamond is hard because its network is rigid in three dimensions and has no mobile electrons.",
    },
    {
      id: "r6",
      kind: "chemistry.equation",
      body:
        "A covalent bond can be written as an equation in which two atoms contribute one electron each to the same shared pair. The equation is a bookkeeping statement: the atoms remain distinct, but the pair is counted in both outer shells. For hydrogen, two hydrogen atoms form one H–H bond.",
      notation: "H· + ·H → H–H   ·   one shared pair = one single bond",
      caption:
        "The arrow does not mean the nuclei merge. It means the two atoms are now held together by the shared pair, and each hydrogen counts both electrons in that pair as its full duet.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Draw or describe a dot-and-cross diagram for a water molecule. Explain why oxygen forms two bonds while each hydrogen forms one, and state how many lone pairs are on the oxygen.",
      steps: [
        {
          move:
            "Count the outer electrons on each atom and the number each needs for a full shell.",
          why:
            "Oxygen has six outer electrons and needs two more for an octet. Each hydrogen has one and needs one more for a duet. The number needed is the number of bonds the atom forms, because each shared pair supplies one electron to each atom.",
        },
        {
          move:
            "Pair each hydrogen's electron with one of oxygen's unpaired electrons.",
          why:
            "A bond is one shared pair. Two hydrogens therefore need two of oxygen's six electrons, leaving four electrons on oxygen as two lone pairs.",
        },
        {
          move:
            "Draw the two O–H bonding pairs in the overlaps and put the two lone pairs on oxygen.",
          why:
            "The diagram must account for all eight outer electrons in the molecule: four in the two bonding pairs and four in the two lone pairs. Oxygen is surrounded by eight; each hydrogen is surrounded by two.",
        },
        {
          move:
            "Check the count against the formula and the octet rule.",
          why:
            "One oxygen and two hydrogens give H₂O. Oxygen has two bonds and two lone pairs, so its outer shell is full. Each hydrogen has one bond, so its duet is full. No atom has an unpaired outer electron.",
        },
      ],
      answer:
        "Oxygen has six outer electrons and forms two shared pairs, one with each hydrogen; the other four electrons remain as two lone pairs. Each hydrogen forms one shared pair. The oxygen is surrounded by eight electrons (two bonding pairs plus two lone pairs), and each hydrogen is surrounded by two. The molecule is H₂O.",
    },
    {
      id: "w2",
      prompt:
        "Diamond melts at about 3,550 °C, while carbon dioxide sublimes at −78 °C. Both contain strong covalent bonds. Explain the difference using their structures, and state which forces are overcome in each case.",
      steps: [
        {
          move:
            "Classify each substance by structure: diamond is a giant covalent network; carbon dioxide is a simple molecular substance.",
          why:
            "The presence of covalent bonds is not enough to predict a melting point. The question is whether those bonds form a continuous network or are confined inside separate molecules.",
        },
        {
          move:
            "Identify what must be overcome when diamond melts.",
          why:
            "In diamond, every carbon is bonded to four others and the network extends throughout the solid. Melting requires many strong C–C covalent bonds to be broken, so a very large amount of energy is needed.",
        },
        {
          move:
            "Identify what must be overcome when carbon dioxide sublimes.",
          why:
            "Solid carbon dioxide contains discrete CO₂ molecules held together by weak intermolecular forces. Sublimation separates the molecules; the C=O covalent bonds inside each molecule are not broken. The energy needed is much smaller.",
        },
        {
          move:
            "Use the comparison to state the general rule, not just the two facts.",
          why:
            "A giant covalent substance has strong bonds throughout the structure, so it has a high melting point. A simple molecular substance has strong bonds only within each molecule; its melting or boiling point is controlled by the weaker forces between molecules.",
        },
      ],
      answer:
        "Diamond is a giant covalent network: each carbon is bonded to four others, and melting requires many strong C–C bonds to be broken, so its melting point is very high. Carbon dioxide is simple molecular: the CO₂ molecules are held to one another by weak intermolecular forces, and sublimation overcomes those forces without breaking the C=O bonds. The covalent bonds in CO₂ are strong, but they are not the forces that hold the solid together.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A covalent bond is formed when one atom gives electrons to another, so the atoms become ions.",
      whyItFails:
        "That is the ionic model. In a covalent bond the electrons are shared, not transferred, and the atoms remain part of a neutral molecule. A polar bond can have unequal sharing, but the electrons are still shared rather than donated completely. If ions were formed, the substance would contain charged particles and would behave like an ionic compound, not like a simple molecule.",
      correction:
        "Describe the bond as a shared pair attracted to both nuclei. Count the electrons each atom contributes, then check that each atom reaches a full shell by counting the shared pair for both atoms.",
      contrast: {
        wrong:
          "sodium gives chlorine an electron, so the bond in hydrogen chloride is ionic",
        right:
          "hydrogen and chlorine share a pair in HCl; the molecule is covalent, and the shared pair is pulled more towards chlorine",
      },
    },
    {
      id: "m2",
      belief:
        "A double bond is two single bonds that can rotate independently.",
      whyItFails:
        "A double bond is one bond with two shared pairs between the same two atoms. The extra pair adds attraction, making the bond shorter and stronger, and it restricts rotation. It is not two separate connections that happen to be drawn next to each other. Counting it as two single bonds also gives the wrong number of shared pairs in CO₂, ethene and N₂.",
      correction:
        "Count each line in a displayed formula as one shared pair: a double line is two pairs but one bond of order two. Use the bond order when comparing length, strength and rotation.",
      contrast: {
        wrong:
          "ethene has two single bonds between its carbons, so it can rotate freely",
        right:
          "ethene has one C=C bond made of two shared pairs; it is shorter and stronger than C–C, and rotation is restricted",
      },
    },
    {
      id: "m3",
      belief:
        "When a simple molecular substance boils, its covalent bonds break.",
      whyItFails:
        "Boiling separates molecules from one another; it does not split the molecules into atoms. The covalent bonds inside each molecule are much stronger than the intermolecular forces being overcome. If the covalent bonds broke, the vapour would contain atoms or fragments rather than the same molecules, and the energy needed would be far greater.",
      correction:
        "Name the forces being overcome: intermolecular forces between molecules. Check that the molecule survives the change — steam is still H₂O, and iodine vapour is still I₂.",
      contrast: {
        wrong:
          "boiling water breaks the O–H bonds, so steam contains hydrogen and oxygen atoms",
        right:
          "boiling water overcomes hydrogen bonds between water molecules; steam is still H₂O, with its O–H covalent bonds intact",
      },
    },
    {
      id: "m4",
      belief:
        "Graphite conducts because its ions are free to move, and diamond does not conduct because it has no ions.",
      whyItFails:
        "Graphite contains carbon atoms, not a lattice of carbon ions. Its conductivity comes from delocalised electrons in the layers: each carbon uses three of its four outer electrons in bonding and the fourth is free to move along the layer. Diamond has no such delocalised electrons because all four outer electrons are used in its three-dimensional bonding network.",
      correction:
        "Identify the charge carrier before explaining conductivity. In graphite it is delocalised electrons; in a metal it is delocalised electrons; in an ionic melt or solution it is mobile ions. Diamond has localised electrons and no mobile ions, so it does not conduct.",
      contrast: {
        wrong:
          "graphite conducts because its carbon ions move through the layers",
        right:
          "graphite conducts because delocalised electrons move along its layers; the carbon atoms stay in the network",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Ammonia is NH₃. State the number of bonding pairs and lone pairs on the nitrogen atom, and explain why nitrogen does not form four bonds in this molecule.",
      hint:
        "Nitrogen has five outer electrons and needs three more for an octet. After forming three N–H bonds, how many of its own outer electrons are left?",
      answer:
        "Nitrogen forms three N–H bonding pairs and keeps one lone pair. It has five outer electrons: three are used in the three shared pairs, and the remaining two form the lone pair. Adding a fourth hydrogen would require nitrogen to use the lone pair as a bonding pair, which would give it more than eight outer electrons in this simple model. The formula is therefore NH₃, not NH₄, unless nitrogen is forming an ammonium ion with a coordinate bond.",
      feedback: {
        correct:
          "You counted nitrogen's five outer electrons and kept the lone pair separate from the three bonding pairs.",
        incorrect:
          "Nitrogen needs three electrons, so it forms three bonds and keeps the other two outer electrons as a lone pair. A fourth bond would use the lone pair and overfill the octet in a neutral NH₃ molecule.",
      },
    },
    {
      id: "p2",
      prompt:
        "Carbon dioxide is O=C=O. How many shared pairs and how many shared electrons are in one molecule? Is carbon dioxide a simple molecular or a giant covalent substance?",
      hint:
        "Each double bond contains two shared pairs. Count both C=O bonds, then multiply the number of pairs by two to get the number of electrons.",
      answer:
        "Each C=O bond is a double bond containing two shared pairs, so the two bonds contain four shared pairs in total. Four pairs contain eight shared electrons. Carbon dioxide is a simple molecular substance: it consists of discrete CO₂ molecules with weak intermolecular forces between them, which is why it sublimes at a low temperature.",
      feedback: {
        correct:
          "You counted two pairs per double bond and kept the number of shared pairs separate from the number of electrons.",
        incorrect:
          "There are two C=O double bonds, so 2 × 2 = 4 shared pairs, which is 8 shared electrons. The molecule is simple molecular, not a giant network.",
      },
    },
    {
      id: "p3",
      prompt:
        "Water and methane are both simple molecular substances, but water boils at 100 °C and methane boils at −162 °C. Explain the difference in terms of the forces that are overcome.",
      hint:
        "Both have strong covalent bonds inside their molecules. The difference is in the attractions between molecules. Which molecule can form hydrogen bonds?",
      answer:
        "Both liquids boil when their molecules gain enough energy to overcome the intermolecular forces between them; the covalent bonds inside the molecules do not break. Water molecules form hydrogen bonds, which are stronger than the dispersion forces between methane molecules. More energy is therefore needed to separate water molecules, so water has the higher boiling point. Methane is non-polar and its intermolecular forces are weaker, so it boils at a much lower temperature.",
      feedback: {
        correct:
          "You compared the forces between molecules, not the covalent bonds inside them, and linked the stronger hydrogen bonds in water to the higher boiling point.",
        incorrect:
          "The O–H and C–H covalent bonds are not the forces overcome on boiling. Water's hydrogen bonds between molecules are stronger than methane's dispersion forces, so more energy is needed to separate water molecules.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Describe the bonding in methane, CH₄, and in ammonia, NH₃. For each molecule, state the number of bonding pairs and lone pairs on the central atom, and explain why carbon forms four bonds while nitrogen forms three.",
      modelAnswer:
        "Methane has one carbon atom bonded to four hydrogen atoms. Carbon has four outer electrons and needs four more for an octet, so it forms four C–H bonding pairs and has no lone pairs. Each hydrogen contributes one electron and reaches a duet. Ammonia has one nitrogen atom bonded to three hydrogen atoms. Nitrogen has five outer electrons and needs three more, so it forms three N–H bonding pairs and keeps the remaining two outer electrons as one lone pair. The nitrogen is surrounded by eight electrons: six in the three bonding pairs and two in the lone pair. Carbon forms four bonds because it needs four electrons; nitrogen forms three because it needs three, and the fourth pair remains non-bonding.",
      marking: [
        "States that methane has four C–H bonding pairs and no lone pairs on carbon.",
        "States that ammonia has three N–H bonding pairs and one lone pair on nitrogen.",
        "Uses the outer-electron count to explain why carbon forms four bonds and nitrogen forms three.",
        "Checks that carbon and nitrogen each have eight outer electrons in the completed molecule.",
        "Distinguishes a bonding pair from a lone pair rather than counting all outer electrons as bonds.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A nitrogen molecule, N₂, contains a triple bond. How many electrons in total are shared between the two nitrogen atoms?",
      modelAnswer: "6",
      marking: [
        "Recognises that a triple bond contains three shared pairs.",
        "Multiplies three pairs by two electrons per pair to get six shared electrons.",
      ],
      check: { accepted: ["6", "six", "6 electrons", "six electrons"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Name the force that must be overcome for liquid water to boil. Do not name the O–H covalent bond.",
      modelAnswer: "intermolecular forces between water molecules",
      marking: [
        "Names intermolecular forces (or hydrogen bonds between molecules) rather than covalent bonds.",
        "Locates the force between molecules, not inside a molecule.",
      ],
      check: {
        accepted: [
          "intermolecular forces",
          "intermolecular force",
          "forces between molecules",
          "hydrogen bonds",
          "hydrogen bonding",
          "intermolecular forces between water molecules",
        ],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "Diamond and graphite are both giant covalent structures made of carbon. Explain why diamond is hard and does not conduct electricity, while graphite is soft and conducts along its layers.",
      modelAnswer:
        "In diamond, each carbon atom is bonded to four other carbon atoms in a tetrahedral three-dimensional network. Every carbon–carbon bond is strong and extends throughout the solid, so the structure is rigid and hard; melting would require many strong bonds to be broken. All four of each carbon's outer electrons are used in bonding, so there are no delocalised electrons and diamond does not conduct. In graphite, each carbon is bonded to three others in a hexagonal layer, and the fourth outer electron is delocalised. The layers are held together by weak forces, so they can slide over one another, making graphite soft. The delocalised electrons can move along the layers and carry charge, so graphite conducts. Both are allotropes of carbon; their different properties come from their different arrangements.",
      marking: [
        "Describes diamond as a three-dimensional tetrahedral network with four bonds per carbon.",
        "Explains diamond's hardness by the strong network of covalent bonds that must be broken.",
        "Explains that diamond has no delocalised electrons because all four outer electrons are used in bonding.",
        "Describes graphite as layers with three bonds per carbon and weak forces between layers.",
        "Explains graphite's softness by layers sliding and its conductivity by delocalised electrons moving along the layers.",
        "States that diamond and graphite are allotropes of the same element, so the difference is structural.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A workshop uses a diamond-tipped saw, graphite powder as a dry lubricant, and solid carbon dioxide (dry ice) as a coolant. Explain, in terms of structure and bonding, why diamond is hard, graphite is slippery, and dry ice sublimes at a low temperature. Explain why graphite can conduct electricity while diamond and dry ice do not.",
      whyItTransfers:
        "The lesson's examples are pure substances with familiar names. A workshop asks the learner to choose the right structural model for three materials used for different jobs, then to explain conductivity from the charge carrier rather than from the name of the element. The same carbon atoms appear in two of the materials with completely different properties.",
      answer:
        "Diamond is a giant covalent network in which each carbon is bonded to four others in three dimensions. The many strong C–C bonds make it hard and give it a very high melting point. Graphite is also a giant covalent structure, but each carbon is bonded to three others in layers; the layers are held by weak forces and can slide, so graphite is slippery. The fourth outer electron on each carbon is delocalised, so graphite conducts along its layers. Dry ice is solid carbon dioxide, a simple molecular substance: discrete CO₂ molecules are held by weak intermolecular forces, so it sublimes at a low temperature without breaking the C=O bonds. Dry ice does not conduct because its molecules are neutral and it has no free ions or delocalised electrons. Diamond does not conduct because all four of each carbon's outer electrons are localised in covalent bonds. The key is to identify the structure and the mobile charge carrier, not to assume that all carbon materials behave alike.",
      marking: [
        "Identifies diamond as a three-dimensional giant covalent network and links it to hardness.",
        "Identifies graphite as layered with delocalised electrons and links the layers to slipperiness.",
        "Identifies dry ice as simple molecular and links sublimation to weak intermolecular forces.",
        "Explains graphite's conductivity by delocalised electrons, not by moving ions.",
        "Explains why diamond and dry ice lack mobile charge carriers.",
        "Uses structure and bonding for all three materials rather than repeating their names.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "How many shared pairs and how many shared electrons are in a nitrogen molecule, N₂?",
      answer:
        "Nitrogen has a triple bond: three shared pairs, which is six shared electrons.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Why does graphite conduct electricity, and why does diamond not?",
      answer:
        "Graphite has one delocalised electron per carbon that can move along its layers. Diamond uses all four outer electrons in its three-dimensional covalent network, so it has no delocalised electrons.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "What is overcome when a simple molecular substance boils, and what is not overcome?",
      answer:
        "The weak intermolecular forces between molecules are overcome; the strong covalent bonds inside each molecule are not broken, so the molecules remain intact.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "Why can silicon dioxide have a very high melting point even though its formula, SiO₂, looks like a small molecule?",
      answer:
        "The formula gives the ratio of silicon to oxygen, not the size of a molecule. Silicon dioxide is a giant covalent network in which each silicon is bonded to four oxygens and each oxygen to two silicons, so melting requires many strong Si–O bonds to be broken.",
      when: "month-later",
    },
  ],

  summary: [
    "A covalent bond is a shared pair of electrons attracted to both nuclei; it is not an electron transfer.",
    "Outer-electron counts predict the number of bonds: carbon four, nitrogen three, oxygen two, hydrogen one. A double or triple bond uses two or three shared pairs between the same atoms.",
    "Simple molecular substances have strong covalent bonds inside molecules and weak forces between molecules; boiling overcomes the forces between molecules, so the molecules survive.",
    "Diamond, graphite and silicon dioxide are giant covalent networks. Diamond is hard and non-conducting; graphite is soft and conducts through delocalised electrons; silicon dioxide is a hard, high-melting network.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every formula and dot-and-cross description is stated in words as well as symbols, and each structural claim names the atoms, the number of bonds and the property it explains, so no diagram is the only carrier of the answer.",
    },
    {
      need: "colour-vision",
      alternative:
        "The lesson does not use colour to distinguish dots from crosses or one substance from another. Bonds are labelled single, double or triple in words, and the properties of diamond, graphite and silicon dioxide are stated explicitly.",
    },
    {
      need: "dyslexia",
      alternative:
        "The teaching is divided into short headed sections, with formulas, counts and contrasts repeated in the representations, summary and retrieval items. Key comparisons are written as complete sentences rather than symbolic shorthand alone.",
    },
    {
      need: "motor",
      alternative:
        "Assessment answers are typed or described in words; no learner is required to draw a diagram by hand, handle apparatus or complete a timed task. The dot-and-cross answer may be given as a written count of bonding and lone pairs.",
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
        "All explanations, examples, practice, assessment and retrieval items in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE chemistry subject content for bonding, structure and the properties of matter.",
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
