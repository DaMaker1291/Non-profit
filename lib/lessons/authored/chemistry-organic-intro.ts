import type { AuthoredLesson } from "../../lesson-contract";

// CARBON IS THE ELEMENT THAT CAN BUILD ITS OWN FRAMEWORK.
//
// The lesson begins with the four bonds that make chains possible, then uses
// that structure to explain the two families a learner meets first: saturated
// alkanes and unsaturated alkenes. Crude oil supplies the mixture; fractional
// distillation separates it by chain length; cracking turns a long, low-value
// alkane into a short alkene; addition polymerisation joins those alkenes into
// plastics. The order matters because every later idea is a consequence of the
// carbon skeleton, not a list of industrial vocabulary.
export const CHEMISTRY_ORGANIC_INTRO: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "organic-intro",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, organic chemistry: hydrocarbons, alkanes and alkenes, crude oil, fractional distillation, cracking, combustion and addition polymers",
    level: "Key Stage 4 / GCSE",
    note:
      "Scope cited against published GCSE subject content for organic chemistry. Every explanation, example, equation, practice item and assessment is original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain why carbon forms four covalent bonds and use that to account for chains, branched chains and rings.",
      evidence:
        "The learner explains that carbon has four outer electrons and needs four more, then represents methane, ethane, propane and a branched isomer with the correct number of bonds around every carbon.",
    },
    {
      statement:
        "Distinguish alkanes from alkenes using their general formulas, bond types and reaction with bromine water.",
      evidence:
        "The learner gives CₙH₂ₙ₊₂ for an alkane and CₙH₂ₙ for an alkene (n ≥ 2), identifies the C=C bond as the reason an alkene is unsaturated, and predicts that bromine water is decolourised by an alkene but not by an alkane.",
    },
    {
      statement:
        "Explain how fractional distillation and cracking produce useful fuels and feedstock from crude oil.",
      evidence:
        "The learner links chain length to boiling point and condensation height, then balances a cracking equation such as C₁₀H₂₂ → C₈H₁₈ + C₂H₄ and identifies the alkene as the reactive product.",
    },
    {
      statement:
        "Describe addition polymerisation and write the repeat unit of a polymer from its alkene monomer.",
      evidence:
        "The learner explains that the C=C bond opens to join monomers, draws the repeat unit of poly(ethene) with continuation bonds, and states that no small molecule is eliminated in an addition polymerisation.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["covalent-bonding"],
    check: [
      {
        id: "d1",
        question:
          "Carbon has four outer electrons. How many covalent bonds does a carbon atom form in a simple organic molecule, and why?",
        answer:
          "Carbon forms four covalent bonds. It needs four more electrons to complete its outer shell, so it shares four pairs, one with each of four neighbouring atoms or distributed across double bonds.",
        targets: ["covalent-bonding"],
      },
      {
        id: "d2",
        question:
          "Ethene is C₂H₄. How many covalent bonds does each carbon form, and what does the C=C bond tell you about the molecule?",
        answer:
          "Each carbon forms four covalent bonds: one double bond to the other carbon and two single bonds to hydrogen. The C=C double bond is two shared pairs between the same two carbons, and it is the part that can open in an addition reaction.",
        targets: ["covalent-bonding"],
      },
    ],
  },

  introduction: {
    hook:
      "A candle burns, a plastic bottle holds water, and a car travels on petrol. All three depend on compounds of carbon, and the carbon atoms in them can join into chains of almost any length. The same element that makes diamond also makes the gas methane and the polymer in a shopping bag. What changes is not the element but the arrangement.",
    why:
      "Organic chemistry is not a separate kind of chemistry with a new periodic table. It is the chemistry of carbon's four bonds. Once a learner can see a carbon skeleton and count its bonds, the formulas, the fractions of crude oil, the cracking equations and the polymer repeat units stop being separate facts. They become the same structural idea at different scales.",
  },

  explanation: [
    {
      heading: "Four bonds let carbon build chains, branches and rings",
      paragraphs: [
        "A carbon atom has four outer electrons and needs four more to complete its outer shell. In an organic compound it usually forms four covalent bonds, sharing one pair with each neighbouring atom. That is why carbon can sit in the middle of a chain and continue in two directions, while hydrogen can only sit at an end with one bond. The count is the whole reason carbon can form millions of compounds.",
        "The simplest hydrocarbon is methane, CH₄. Carbon forms four single bonds, one to each hydrogen. Ethane, C₂H₆, has a carbon–carbon bond and three hydrogens on each carbon. Propane, C₃H₈, adds another carbon to the chain. Butane, C₄H₁₀, adds a fourth. The names and formulas change in a regular way because each new carbon brings two hydrogens with it and the chain ends stay capped.",
        "Carbon can also branch. Butane and 2-methylpropane both have the molecular formula C₄H₁₀, but their atoms are connected differently: butane is a straight chain of four carbons, while 2-methylpropane has a central carbon bonded to three methyl groups. These are structural isomers. They have the same formula and different properties because the arrangement, not the count, is different.",
        "A ring is the same idea closed on itself. Cyclohexane, C₆H₁₂, has six carbons in a ring, with two hydrogens on each carbon. The general formula for a cycloalkane is CₙH₂ₙ, the same as an alkene, which is a reminder that a molecular formula alone does not identify a structure. The displayed formula or a structural description is needed to show whether the carbon atoms form a ring or a double bond.",
      ],
    },
    {
      heading: "Alkanes are saturated; alkenes contain a C=C bond",
      paragraphs: [
        "A hydrocarbon contains only carbon and hydrogen. An alkane is a hydrocarbon in which every carbon–carbon bond is a single bond. Its carbon atoms are saturated: each one already has four single bonds, so no more atoms can add to the chain without replacing one. The general formula of a non-cyclic alkane is CₙH₂ₙ₊₂. Methane is CH₄, ethane C₂H₆, propane C₃H₈, butane C₄H₁₀, and octane C₈H₁₈.",
        "An alkene contains at least one carbon–carbon double bond. The two carbons share two pairs of electrons, so the bond is one bond of order two. The general formula of a non-cyclic alkene with one double bond is CₙH₂ₙ, with n at least 2. Ethene is C₂H₄, propene C₃H₆, and butene C₄H₈. The double bond is the reactive part of the molecule: it can open and allow other atoms to add across it.",
        "Saturated and unsaturated are statements about bonding, not about whether the compound contains only carbon and hydrogen. Both alkanes and alkenes are hydrocarbons. An alkane is saturated because it has only single bonds; an alkene is unsaturated because its double bond can accept more atoms. Calling an alkene saturated because it contains only C and H confuses the elements present with the bonds they form.",
        "Bromine water is a simple test that separates the two families. Bromine water is orange-brown. An alkane does not react with it under ordinary conditions, so the colour remains. An alkene reacts by addition across the C=C bond, and the orange-brown colour is decolourised. The test is evidence of unsaturation, not a way of naming which alkene is present: ethene, propene and butene all decolourise it.",
      ],
    },
    {
      heading: "Crude oil is separated by boiling point, not by a chemical reaction",
      paragraphs: [
        "Crude oil is a mixture of hydrocarbons with different chain lengths. It is not a single compound and it is not ready to use. The mixture is heated until most of it vaporises, and the vapour passes up a fractionating column. The column is hotter at the bottom and cooler at the top. A fraction condenses at the height where the temperature matches its boiling range, so the mixture is separated without changing any molecule into a different compound.",
        "Longer hydrocarbon chains have stronger intermolecular forces, so they need more energy to separate from the liquid and have higher boiling points. They condense lower down the column, where it is hotter. Shorter chains have weaker forces between molecules, boil at lower temperatures, and rise further before condensing. This is a physical separation: the molecules are the same before and after; only the mixture has been divided.",
        "The fractions have different uses because their properties differ. Refinery gas and gasoline contain short chains, are volatile and burn easily. Kerosene and diesel contain medium chains and are used as fuels. Fuel oil and bitumen contain long chains, are viscous and less volatile, and are used for lubrication or surfacing roads. The trend is not a set of arbitrary labels: chain length controls boiling point, viscosity and flammability together.",
        "Fractional distillation does not make enough of the short, useful alkenes that the chemical industry needs. It separates what is already there. Cracking is the chemical step that changes the supply: a long alkane is broken into a shorter alkane and an alkene, often with heat and a catalyst. The shorter products are more useful as fuels and the alkene is feedstock for polymers and other chemicals.",
      ],
    },
    {
      heading: "Cracking and combustion rearrange the same atoms",
      paragraphs: [
        "Cracking breaks a large hydrocarbon molecule into smaller ones. It is not a reaction that destroys carbon or creates energy from nothing. The atoms in the products are the same atoms that were in the reactant, rearranged into shorter chains and a double bond. A balanced cracking equation therefore has the same number of carbon and hydrogen atoms on both sides.",
        "For example, decane can crack into octane and ethene: C₁₀H₂₂ → C₈H₁₈ + C₂H₄. The left has ten carbons and twenty-two hydrogens; the right has eight plus two carbons and eighteen plus four hydrogens. The octane is a shorter alkane, and the ethene is an alkene. The ethene is the valuable feedstock because its C=C bond can undergo addition reactions, including polymerisation.",
        "Combustion is a different reaction. A hydrocarbon burns in oxygen to produce carbon dioxide and water when the supply of oxygen is sufficient. For propane: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. The equation is balanced atom by atom: three carbons, eight hydrogens and ten oxygens on each side. The products are gases at ordinary temperatures, which is why a burning hydrocarbon seems to disappear rather than leave a solid residue.",
        "When oxygen is limited, incomplete combustion produces carbon monoxide and/or carbon instead of all the carbon dioxide. Carbon monoxide is colourless, odourless and poisonous because it binds strongly to haemoglobin and reduces the blood's ability to carry oxygen. A yellow, smoky flame is a warning sign, but the absence of visible smoke is not proof that the products are safe. The balanced equation and the air supply are separate observations.",
      ],
    },
    {
      heading: "Addition polymerisation joins alkenes without eliminating anything",
      paragraphs: [
        "An addition polymer is formed when many alkene monomers join through their double bonds. The C=C bond opens, and each monomer forms new single bonds to the monomers on either side. The polymer chain repeats the same unit many times. No small molecule is eliminated in this addition reaction, so the empirical formula of the polymer is the same as that of the monomer.",
        "Ethene, C₂H₄, polymerises to poly(ethene). The repeat unit is written with continuation bonds on both sides: –CH₂–CH₂–. The double bond is gone, and each carbon now has four single bonds: two to hydrogen and two to carbon. The n outside the brackets shows that the unit repeats many times; it is not a precise molecular formula for one particular chain length.",
        "Propene, C₃H₆, gives poly(propene). Its repeat unit is –CH₂–CH(CH₃)–, with the methyl group attached to one of the two carbons of the original double bond. The repeat unit must preserve the connectivity of the monomer: the atoms are not rearranged into a new skeleton, only the double bond is opened. A repeat unit that moves the methyl group to the wrong carbon describes a different polymer.",
        "The properties of a polymer depend on chain length, chain branching and the forces between chains, not only on the monomer. Long chains with regular packing can form strong plastics; branched chains cannot pack as closely and are often more flexible. This is why two materials made from the same monomer can behave differently. The repeat unit identifies the monomer, but it does not by itself predict every physical property of the plastic.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.formula",
      body:
        "The general formula is a count, not a name. An alkane with n carbons has 2n + 2 hydrogens; an alkene with one C=C bond has 2n hydrogens. The formulas differ by two hydrogens because the double bond replaces one C–C single bond and removes two C–H bonds.",
      notation:
        "alkane: CₙH₂ₙ₊₂   ·   alkene: CₙH₂ₙ (n ≥ 2)   ·   propane: C₃H₈   ·   propene: C₃H₆",
      caption:
        "Propane and propene both have three carbons. Propane has eight hydrogens and only single bonds; propene has six hydrogens and one C=C bond. The two fewer hydrogens are the structural difference that makes propene unsaturated.",
    },
    {
      id: "r2",
      kind: "chemistry.particle-model",
      body:
        "Crude oil is a mixture of molecules of different lengths. Heating vaporises the shorter molecules first; as the vapour rises and cools, each fraction condenses when the column temperature falls below its boiling range. The molecules themselves are unchanged.",
      notation:
        "hot at the bottom → long chains condense low   ·   cool at the top → short chains condense high   ·   refinery gas < gasoline < kerosene < diesel < fuel oil < bitumen",
      caption:
        "Chain length controls the boiling point. A long-chain fraction condenses lower down, where the column is hotter, because its molecules need more energy to stay apart.",
    },
    {
      id: "r3",
      kind: "chemistry.equation",
      body:
        "Cracking conserves every atom. A long alkane becomes a shorter alkane plus an alkene; the alkene is the reactive product and the shorter alkane is useful as a fuel. The equation must balance carbon and hydrogen separately.",
      notation:
        "C₁₀H₂₂ → C₈H₁₈ + C₂H₄   ·   10 C and 22 H on each side   ·   the C=C in C₂H₄ is the site for addition",
      caption:
        "Decane is not destroyed; its ten carbons are redistributed. Octane has eight carbons and ethene has two, so the carbon count is conserved and the hydrogen count is conserved.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "Addition polymerisation opens the C=C bond and links monomers into a chain. The repeat unit is the part between the continuation bonds; the n shows how many times it repeats. Nothing is lost as a small molecule.",
      notation:
        "n CH₂=CH₂ → –(CH₂–CH₂)ₙ–   ·   monomer: ethene   ·   polymer: poly(ethene)   ·   repeat unit: –CH₂–CH₂–",
      caption:
        "The double bond becomes two single bonds to neighbouring units. The empirical formula is unchanged because every atom of every monomer is incorporated into the chain.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "An alkane has six carbon atoms. Write its molecular formula and calculate its relative molecular mass. Use C = 12 and H = 1.",
      steps: [
        {
          move:
            "Use the alkane general formula CₙH₂ₙ₊₂ with n = 6.",
          why:
            "The general formula counts the hydrogens that cap a saturated chain. For six carbons, 2n + 2 = 12 + 2 = 14 hydrogens, so the formula is C₆H₁₄.",
        },
        {
          move:
            "Multiply each atom count by its relative atomic mass and add.",
          why:
            "Six carbons contribute 6 × 12 = 72; fourteen hydrogens contribute 14 × 1 = 14. The relative molecular mass is 72 + 14 = 86.",
        },
        {
          move:
            "Check the formula against the naming pattern.",
          why:
            "Hexane is the six-carbon alkane. Its formula C₆H₁₄ fits the same pattern as propane C₃H₈ and butane C₄H₁₀, so the count is consistent with the homologous series.",
        },
      ],
      answer: "C₆H₁₄; relative molecular mass = 86.",
    },
    {
      id: "w2",
      prompt:
        "Decane, C₁₀H₂₂, is cracked to give octane and ethene. Write a balanced equation and explain why the product mixture contains an alkene.",
      steps: [
        {
          move:
            "Write the formulas of the three hydrocarbons and balance carbon first.",
          why:
            "Decane has ten carbons. Octane has eight, so the other product must contain two carbons. Ethene, C₂H₄, supplies those two carbons.",
        },
        {
          move:
            "Check the hydrogen count on both sides.",
          why:
            "C₁₀H₂₂ has 22 hydrogens; C₈H₁₈ has 18 and C₂H₄ has 4, giving 22 in total. The equation C₁₀H₂₂ → C₈H₁₈ + C₂H₄ is balanced.",
        },
        {
          move:
            "Identify the bond that makes the product unsaturated.",
          why:
            "Ethene contains a C=C double bond, so it is an alkene. Octane contains only single bonds, so it is a saturated alkane. Cracking produces the alkene because the long chain is split into a shorter saturated piece and an unsaturated piece.",
        },
      ],
      answer:
        "C₁₀H₂₂ → C₈H₁₈ + C₂H₄. The ethene is an alkene because it contains a C=C double bond; the octane is a saturated alkane.",
    },
    {
      id: "w3",
      prompt:
        "Ethene is polymerised to poly(ethene). Draw the repeat unit and explain why the polymer is described as an addition polymer.",
      steps: [
        {
          move:
            "Open the C=C bond in the monomer and join each carbon to a neighbouring monomer.",
          why:
            "The two shared pairs in the double bond become two single bonds to the neighbouring units. Each carbon keeps its two hydrogens and gains a bond to the next carbon in the chain.",
        },
        {
          move:
            "Write the repeat unit with continuation bonds on both sides.",
          why:
            "The repeating section is –CH₂–CH₂–. The continuation bonds show that the chain does not stop at that unit; the n outside the brackets records the number of repeats.",
        },
        {
          move:
            "Check whether any small molecule is eliminated.",
          why:
            "Every atom of every ethene monomer appears in the polymer. No water, hydrogen chloride or other small molecule leaves, which is what makes this an addition polymerisation rather than a condensation polymerisation.",
        },
      ],
      answer:
        "The repeat unit is –CH₂–CH₂–, repeated n times. It is an addition polymer because the monomers join through the C=C bond and no small molecule is eliminated.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "Organic compounds are the ones made by living things, so a chemical made in a factory is not organic.",
      whyItFails:
        "In chemistry, organic means a compound based on carbon skeletons, whether it was made by a plant, an animal or a factory. Ethene made by cracking crude oil is organic; the same molecule can also be produced by a plant. The source does not decide the classification.",
      correction:
        "Classify by structure: an organic compound contains carbon atoms joined into a skeleton, usually with hydrogen and often with other elements. A few carbon-containing compounds, such as carbon dioxide and carbonates, are conventionally treated as inorganic.",
      contrast: {
        wrong:
          "this plastic is synthetic, so it is not an organic compound",
        right:
          "this plastic is an organic polymer because its chain is built from carbon atoms, however it was manufactured",
      },
    },
    {
      id: "m2",
      belief:
        "An alkene is saturated because it contains only carbon and hydrogen.",
      whyItFails:
        "Saturation is about the bonds, not the elements. An alkane has only single carbon–carbon bonds and is saturated. An alkene has a C=C double bond, which can open to add more atoms, so it is unsaturated. Both families contain only carbon and hydrogen.",
      correction:
        "Look for the C=C bond. If every carbon–carbon bond is single, the hydrocarbon is saturated; if there is a double bond, it is unsaturated and will decolourise bromine water by addition.",
      contrast: {
        wrong:
          "propene is saturated because it is a hydrocarbon",
        right:
          "propene is unsaturated because it contains a C=C bond, even though it contains only carbon and hydrogen",
      },
    },
    {
      id: "m3",
      belief:
        "Fractional distillation chemically changes the long hydrocarbons into shorter, more useful ones.",
      whyItFails:
        "Fractional distillation separates the molecules that are already present by boiling point. The molecules that condense in each fraction are the same molecules that entered the column. Cracking is the separate chemical process that breaks long chains into shorter ones.",
      correction:
        "Keep the physical separation and the chemical conversion apart: distillation divides the mixture, while cracking rearranges the molecules. A fraction's name describes its boiling range, not a reaction it has undergone.",
      contrast: {
        wrong:
          "the refinery turns crude oil into petrol by distilling it",
        right:
          "distillation separates crude oil into fractions; cracking then breaks some long chains into shorter alkanes and alkenes",
      },
    },
    {
      id: "m4",
      belief:
        "A polymer is made by mixing small molecules together, so its formula is just the monomer formula with an n in front.",
      whyItFails:
        "Mixing would not join the molecules. Addition polymerisation opens the C=C bond and forms new covalent bonds between monomers, producing a long chain. The repeat unit is not the same as the monomer: ethene is CH₂=CH₂, while the repeat unit is –CH₂–CH₂–.",
      correction:
        "Show the opened double bond and the continuation bonds. The n counts repeat units in the chain; it is not a multiplier attached to a unchanged monomer formula.",
      contrast: {
        wrong:
          "poly(ethene) is n × C₂H₄ with the double bonds still present",
        right:
          "poly(ethene) has the repeat unit –CH₂–CH₂–, because the C=C bonds opened to join the monomers",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "An alkene has four carbon atoms and one C=C bond. Write its molecular formula and name it.",
      hint:
        "Use CₙH₂ₙ for a non-cyclic alkene with one double bond. The four-carbon alkene is butene.",
      answer: "C₄H₈; butene.",
      feedback: {
        correct:
          "Correct. Four carbons give 2 × 4 = 8 hydrogens, and the four-carbon alkene is butene.",
        incorrect:
          "Use the alkene formula CₙH₂ₙ, not the alkane formula. With n = 4, the hydrogen count is 8, so the formula is C₄H₈ and the name is butene.",
      },
    },
    {
      id: "p2",
      prompt:
        "Balance this cracking equation: C₁₂H₂₆ → C₈H₁₈ + C₂H₄. Is it already balanced? Explain.",
      hint:
        "Count carbon and hydrogen on each side before changing any coefficient.",
      answer:
        "It is not balanced. The left has 12 carbons and 26 hydrogens; the right has 10 carbons and 22 hydrogens. A balanced split is C₁₂H₂₆ → C₈H₁₈ + 2C₂H₄, which gives 12 carbons and 18 + 8 = 26 hydrogens.",
      feedback: {
        correct:
          "Correct. Two ethene molecules are needed to account for the remaining four carbons and eight hydrogens.",
        incorrect:
          "Count the atoms: C₈H₁₈ + C₂H₄ gives only 10 carbons and 22 hydrogens. Add a second C₂H₄ so the products contain 12 carbons and 26 hydrogens.",
      },
    },
    {
      id: "p3",
      prompt:
        "Propene, C₃H₆, is addition-polymerised. Write the repeat unit of the polymer and name the polymer.",
      hint:
        "Open the C=C bond and keep the methyl group on the carbon where it started.",
      answer:
        "The repeat unit is –CH₂–CH(CH₃)–, repeated n times; the polymer is poly(propene).",
      feedback: {
        correct:
          "Correct. The double bond opens, the methyl group stays on one carbon of the original double bond, and the repeat unit has continuation bonds on both sides.",
        incorrect:
          "Do not leave the C=C bond in the repeat unit. Open it into two single bonds to neighbouring units, and keep the CH₃ branch attached to the same carbon.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "An alkane has five carbon atoms. Write its molecular formula and state how many hydrogen atoms it contains.",
      modelAnswer: "C₅H₁₂; 12 hydrogen atoms.",
      marking: [
        "Uses the alkane general formula CₙH₂ₙ₊₂.",
        "Substitutes n = 5 to obtain 2 × 5 + 2 = 12 hydrogens.",
        "Writes the formula C₅H₁₂ with the correct number of hydrogen atoms.",
      ],
      check: {
        accepted: [
          "C5H12, 12",
          "C₅H₁₂, 12",
          "C5H12; 12",
          "C₅H₁₂; 12",
          "C5H12, 12 hydrogen atoms",
          "C₅H₁₂, 12 hydrogen atoms",
          "C5H12; 12 hydrogen atoms.",
          "C₅H₁₂; 12 hydrogen atoms.",
        ],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Name the alkene with three carbon atoms and write its molecular formula.",
      modelAnswer: "propene, C₃H₆",
      marking: [
        "Uses the alkene general formula CₙH₂ₙ.",
        "Substitutes n = 3 to obtain C₃H₆.",
        "Names the three-carbon alkene as propene.",
      ],
      check: {
        accepted: [
          "propene, C3H6",
          "propene, C₃H₆",
          "propene C3H6",
          "propene C₃H₆",
          "propene; C3H6",
          "propene; C₃H₆",
        ],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how cracking and addition polymerisation can turn decane into poly(ethene). Include a balanced cracking equation, the monomer used for the polymer, and the repeat unit.",
      modelAnswer:
        "Decane can be cracked into octane and ethene: C₁₀H₂₂ → C₈H₁₈ + C₂H₄. The equation conserves ten carbons and twenty-two hydrogens. Ethene is the monomer because it contains a C=C bond. In addition polymerisation the double bond opens and each ethene unit joins to its neighbours, giving the repeat unit –CH₂–CH₂– and the polymer poly(ethene). No small molecule is eliminated, so all the atoms of the monomer remain in the polymer.",
      marking: [
        "Writes a balanced cracking equation that produces ethene and conserves carbon and hydrogen.",
        "Identifies ethene as the monomer and its C=C bond as the site of addition.",
        "Writes the poly(ethene) repeat unit as –CH₂–CH₂– with continuation bonds.",
        "Explains that addition polymerisation eliminates no small molecule.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A factory cracks a long alkane to make propene, then polymerises the propene to make a food container. Explain why the container is not simply a mixture of propene molecules, and state the repeat unit of the polymer. Use the idea of atom conservation to explain why the mass of polymer formed equals the mass of propene used.",
      whyItTransfers:
        "The lesson used ethene and decane to connect cracking, unsaturation and addition polymerisation. This task changes the monomer to propene and asks for the same structural reasoning in an industrial context, rather than repeating the ethene example.",
      answer:
        "The container is a polymer, not a mixture, because the propene monomers have reacted: their C=C bonds opened and new covalent bonds joined the units into long chains. The repeat unit is –CH₂–CH(CH₃)–. Addition polymerisation eliminates no small molecule, so every atom of the propene that reacts is incorporated into the polymer; by conservation of mass, the mass of polymer formed equals the mass of propene consumed.",
      marking: [
        "Distinguishes a polymer from a mixture by the new covalent bonds between monomers.",
        "Gives the correct poly(propene) repeat unit, –CH₂–CH(CH₃)–.",
        "Explains that addition polymerisation eliminates nothing.",
        "Uses conservation of atoms to account for the mass of polymer.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the general formula of an alkane and explain why propane and propene have different numbers of hydrogen atoms.",
      answer:
        "An alkane is CₙH₂ₙ₊₂. Propane, C₃H₈, has only single bonds. Propene, C₃H₆, has one C=C double bond, which replaces two C–H bonds and makes it unsaturated.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why a long-chain fraction of crude oil condenses lower in a fractionating column than a short-chain fraction.",
      answer:
        "Longer chains have stronger intermolecular forces and higher boiling points, so they condense at the hotter lower part of the column. Shorter chains have weaker forces, lower boiling points and condense higher up where the column is cooler.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Ethene is addition-polymerised. Write the repeat unit and explain why the polymer has the same empirical formula as the monomer.",
      answer:
        "The repeat unit is –CH₂–CH₂–. Addition polymerisation opens the C=C bond and joins the monomers without eliminating any small molecule, so every carbon and hydrogen from the monomer remains in the polymer and the empirical formula is unchanged.",
      when: "month-later",
    },
  ],

  summary: [
    "Carbon forms four covalent bonds, which lets it build chains, branches and rings; organic compounds are classified by their carbon skeletons, not by whether they come from living things.",
    "Alkanes are saturated hydrocarbons with general formula CₙH₂ₙ₊₂; alkenes contain a C=C double bond and have general formula CₙH₂ₙ (n ≥ 2).",
    "Crude oil is separated by fractional distillation according to boiling point; cracking is a chemical reaction that breaks long alkanes into shorter alkanes and alkenes.",
    "Addition polymerisation opens the C=C bond and joins monomers into a chain with no small molecule eliminated; the repeat unit preserves the monomer's connectivity.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every formula is read with its subscripts as counts: C-three-H-eight is propane, not a string of letters. The repeat unit is described as a repeating –CH₂–CH₂– unit with bonds continuing on both sides.",
    },
    {
      need: "colour-vision",
      alternative:
        "The bromine-water result is stated in words, not shown only as an orange-to-colourless change. Alkane and alkene labels are written beside the structures rather than distinguished by colour.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each equation follows a fixed layout: reactants, arrow, products, then a separate atom-count check. Long hydrocarbon names are broken into their prefix and family, such as hex-ane and prop-ene.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed. A polymer repeat unit can be written as text with ordinary parentheses and hyphens; no structure has to be dragged or drawn with a mouse.",
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
        "All explanations, equations, examples, practice items, assessments and the propene transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against published GCSE chemistry subject content for organic chemistry and hydrocarbons.",
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
