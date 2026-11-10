import type { AuthoredLesson } from "../../lesson-contract";

// A METAL IS NOT AN IONIC SOLID WITH THE SIGNS RUBBED OUT.
//
// The lesson starts with the structure: positive metal ions occupy lattice
// sites and the outer electrons are delocalised across the whole piece. That
// one picture explains conductivity, malleability and ductility. The alloy
// section then shows why changing the size of some atoms makes sliding harder
// without changing the metallic nature of the bonding. The final section keeps
// material choice honest: a property is not a score, and the best metal for a
// wire is not the best metal for a bridge.
export const CHEMISTRY_METALLIC_BONDING: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "metallic-bonding",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, bonding, structure and the properties of matter: metallic bonding, the properties of metals and alloys",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against published GCSE subject content for metallic bonding, metals and alloys. Every explanation, example, practice item and assessment is original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Describe metallic bonding as positive metal ions in a lattice with delocalised outer electrons, and explain why the structure is not an ionic compound.",
      evidence:
        "The learner describes a metal as cations surrounded by a shared electron sea, states that there are no negative ions, and explains why the metal is neutral overall.",
    },
    {
      statement:
        "Explain electrical and thermal conductivity in a metal using mobile delocalised electrons.",
      evidence:
        "The learner explains why a copper wire conducts in the solid state, while an ionic solid does not, and identifies electrons rather than ions as the charge carriers.",
    },
    {
      statement:
        "Explain malleability and ductility using layers of ions that can slide without breaking the metallic attraction.",
      evidence:
        "The learner explains why a metal bends rather than shatters, and why the same structure can be strong in tension yet allow permanent shape change.",
    },
    {
      statement:
        "Explain why alloys are harder than pure metals and why an alloy is a mixture with variable composition rather than a compound with a fixed formula.",
      evidence:
        "The learner explains how different-sized atoms disrupt the sliding of layers in brass or steel, and states that the composition of an alloy can vary.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements", "ionic-bonding"],
    check: [
      {
        id: "d1",
        question:
          "Why does solid sodium chloride not conduct electricity, while molten sodium chloride does?",
        answer:
          "In the solid, the Na⁺ and Cl⁻ ions are fixed in the lattice and cannot move. Melting releases the ions, so they become mobile charge carriers and the liquid conducts.",
        targets: ["ionic-bonding"],
      },
      {
        id: "d2",
        question:
          "Sodium has the configuration 2, 8, 1. Which electrons are lost when it forms a positive ion, and why is the ion stable?",
        answer:
          "The single outer electron is lost, leaving Na⁺ with the configuration 2, 8. The full second shell is the stable arrangement, and the ion has one more proton than electron, giving a 1+ charge.",
        targets: ["atoms-elements", "ionic-bonding"],
      },
    ],
  },

  introduction: {
    hook:
      "A copper wire can carry a current, be bent around a corner and still conduct. A steel bridge can hold a load, flex slightly and not shatter. A gold leaf can be hammered thinner than a micrometre. These are not three unrelated facts about three metals: they come from one structure, in which positive ions sit in a lattice and their outer electrons are shared across the whole piece.",
    why:
      "Metals are the materials of wires, frames, engines, coins, cutlery and implants. Their useful properties are consequences of metallic bonding, not a list to memorise. The same model explains why a pure metal is often too soft for a tool, why an alloy is harder, why a metal conducts while an ionic crystal does not, and why a material choice is always a compromise between conductivity, strength, mass, cost and corrosion.",
  },

  explanation: [
    {
      heading: "Metal atoms release outer electrons into a shared sea",
      paragraphs: [
        "A metal atom has relatively few outer electrons and a large, positively charged nucleus. In a solid metal, the atoms pack into a lattice, but they do not keep all of their outer electrons. Those electrons become delocalised: they are not attached to one atom, and they can move throughout the piece. What remains at each lattice site is a positive metal ion. The structure is therefore a lattice of cations in a sea of mobile electrons.",
        "This is different from an ionic solid, which contains both positive and negative ions. A metal contains no separate negative ions; the negative charge is carried by the delocalised electrons. The numbers still balance: the total positive charge of all the cations is cancelled by the total negative charge of the electrons. A piece of metal is neutral overall, even though its interior contains charged particles.",
        "The number of electrons contributed per atom depends on the metal and its position in the periodic table. Sodium contributes one outer electron per atom, magnesium contributes two, and aluminium contributes three in the simple model used here. Transition metals are more complicated because d electrons can also participate. The important idea is not a single universal number; it is that the outer electrons are shared across the lattice rather than transferred to a non-metal.",
        "The metallic bond is the electrostatic attraction between the positive ions and the delocalised electrons. It is not a bond between one pair of atoms, and it has no single direction. Each cation is attracted to the electron sea around it, and the sea is attracted to all the cations it surrounds. That non-directional attraction is why a metal can be deformed without a clean fracture: the bonding can reorganise around a new shape.",
      ],
    },
    {
      heading: "Mobile electrons explain conductivity",
      paragraphs: [
        "Electrical conductivity requires charge carriers that can move through the material. In a metal, the delocalised electrons provide them. When a potential difference is applied across a wire, the electrons drift through the lattice and carry charge from one end to the other. The metal ions themselves stay near their lattice positions; they do not have to travel from one electrode to the other.",
        "This is why a metal conducts while solid. An ionic solid does not, because its ions are fixed in the lattice and its electrons are localised in the ions. Melting an ionic solid releases its ions and makes it conductive, but a metal does not need to melt: its charge carriers are already mobile. The comparison is not “charged particles versus no charged particles”; it is “charged particles that can move versus charged particles that cannot”.",
        "Metals also conduct heat well. The delocalised electrons can carry kinetic energy through the lattice, and vibrations of the ions transfer energy as well. A metal spoon in hot soup warms at the handle because energy moves along the metal. The electron sea is not a liquid that flows out of the metal; it is a distribution of electrons that remains within the piece while individual electrons move through it.",
        "Conductivity is not the same as strength. Copper is an excellent conductor and is soft enough to bend into wire; steel is stronger but a poorer conductor. A material choice for an electrical cable therefore weighs conductivity against cost, mass, strength and corrosion. The best conductor is not automatically the best engineering material.",
      ],
    },
    {
      heading: "Layers can slide without the attraction switching off",
      paragraphs: [
        "When a metal is bent, one set of lattice planes slides over another. The positive ions move to new positions, and the delocalised electrons move with them. The metallic attraction is not a set of rigid struts that snap when the layers shift; it is an attraction between the ions and the electron sea, and it can persist in the new arrangement. This is why metals are malleable: they can be hammered into sheets. It is also why they are ductile: they can be drawn into wires.",
        "Ionic crystals behave differently. A shift of one lattice plane can place ions that share the same charge side by side, and the repulsion splits the crystal. A metal does not have that alternating positive-negative order, so a shift does not create a wall of like charges. The electrons redistribute around the new shape and the piece remains held together.",
        "Malleability does not mean that metallic bonds are weak. Many metals have high melting points because the attraction between the cations and the electron sea is strong. The layers slide because the attraction is non-directional, not because it is absent. A metal can be both strong and ductile: it resists being pulled apart while allowing permanent bending.",
        "Pure metals are often relatively soft because their layers are all made of the same-sized atoms. The layers can slide past one another fairly easily. That is useful for shaping, but it can be a disadvantage in a cutting tool or a structural part. Alloying is the practical way to make sliding harder without losing the metallic bonding that makes the material useful.",
      ],
    },
    {
      heading: "Alloys make the layers harder to slide",
      paragraphs: [
        "An alloy is a mixture of a metal with one or more other elements, usually other metals. Brass is mainly copper and zinc; steel is mainly iron with carbon and often other elements; solder is a mixture chosen to melt at a useful temperature. The components are not joined in a fixed chemical formula. Their proportions can be varied, which is why an alloy is a mixture rather than a compound.",
        "In a substitutional alloy, atoms of a different element replace some of the host metal atoms in the lattice. If the replacement atoms are a different size, the layers are no longer flat and regular. When the material is stressed, the layers cannot slide past one another as easily, so the alloy is harder and stronger than the pure metal. The metallic bonding is still present; the change is in how easily the planes can move.",
        "In an interstitial alloy, smaller atoms fit into the gaps between the larger metal atoms. Carbon in steel is the important example. The carbon atoms distort the iron lattice and make it harder for layers of iron atoms to slip. A small amount of carbon can therefore change the strength of steel substantially. The carbon is not forming a separate ionic compound throughout the metal; it is part of the alloy's structure.",
        "Alloying is not a guarantee of every better property. It usually increases hardness and strength, but it can reduce conductivity, change melting point, make shaping more difficult or increase cost. The benefit depends on the alloy and its use. A pure metal may be chosen when maximum conductivity or easy shaping matters; an alloy may be chosen when strength, wear resistance or a particular melting range matters more.",
      ],
    },
    {
      heading: "A material choice is a compromise, not a league table",
      paragraphs: [
        "Copper is used for electrical wiring because it conducts well and can be drawn into flexible wire. Aluminium also conducts, and it is much less dense, which is why it is used in overhead power lines and aircraft structures. Its conductivity per unit mass is attractive, but it is not simply “better than copper”: it has different strength, corrosion and joining requirements. Material selection depends on the job.",
        "Steel is strong and relatively cheap, which is why it is used in bridges and building frames. Stainless steel contains chromium, which helps form a protective oxide layer and improves corrosion resistance. The alloy is still metallic, but its surface chemistry is different from pure iron. Brass is easy to machine and resists corrosion in some environments, which is why it is used in fittings and instruments. Solder is chosen for a low melting point so that it can join components without melting them.",
        "The properties of a metal are not all explained by the electron sea alone. Density, melting point, hardness and corrosion resistance depend on the identity of the metal, its lattice, its alloying elements and its surface. The metallic model gives the shared explanation for conductivity, malleability and ductility; it does not replace the specific chemistry of each material.",
        "A good material answer names the property required by the use, explains it with the structure, and then names a trade-off. “Steel is strong” is not enough for a bridge; “steel is strong and can be welded, but it needs protection from corrosion” is a material choice. “Copper conducts” is not enough for a wire; “copper conducts well and is ductile, but it is denser and more expensive than aluminium” is a comparison.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.particle-model",
      body:
        "A metal lattice contains positive ions at regular sites. The outer electrons are not assigned to one ion; they are delocalised across the whole structure. The attraction between the positive ions and this electron sea is the metallic bond.",
      notation:
        "metal lattice: Mⁿ⁺ ions + delocalised electrons   ·   Na contributes 1 outer electron per atom   ·   Mg contributes 2   ·   Al contributes 3",
      caption:
        "There are no negative ions in the lattice. The electrons supply the negative charge, and the whole piece remains neutral because the positive and negative totals balance.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "A metal atom can be represented as losing one or more outer electrons to the shared sea. The electron is not given to a particular non-metal atom, so this is not the formation of an ionic compound.",
      notation:
        "Na → Na⁺ + e⁻   ·   Mg → Mg²⁺ + 2e⁻   ·   Al → Al³⁺ + 3e⁻   ·   the electrons are delocalised, not transferred to an anion",
      caption:
        "The equations account for charge, but the product is a lattice of cations plus mobile electrons. Writing a separate negative ion would describe an ionic solid, not a metal.",
    },
    {
      id: "r3",
      kind: "chemistry.particle-model",
      body:
        "Pure metals have layers of identical atoms. The layers can slide because the metallic attraction is non-directional and continues after the shift. An alloy contains atoms of different sizes, so the layers are distorted and sliding becomes harder.",
      notation:
        "pure metal: regular layers, easy slip, softer   ·   substitutional alloy: different-sized atoms replace host atoms, layers distorted, harder   ·   interstitial alloy: small atoms fit between host atoms, lattice strained, harder",
      caption:
        "Hardness is not the same as bond strength. The alloy is harder because its layers cannot slide as easily, not because its metallic bonds have disappeared.",
    },
    {
      id: "r4",
      kind: "chemistry.formula",
      body:
        "An alloy has a variable composition, so it does not have a single formula in the way a compound does. Its composition is described by mass percentage or by the elements present.",
      notation:
        "brass: mainly Cu with Zn, composition variable   ·   steel: mainly Fe with C and other elements   ·   solder: a low-melting alloy whose composition depends on its use",
      caption:
        "“Brass is CuZn” would suggest a fixed compound. Brass is a mixture, and its properties change with the proportions and with other elements added.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Magnesium has a higher melting point than sodium. Both are metals with the same kind of metallic bonding. Explain the difference using the charge on the ions and the number of delocalised electrons.",
      steps: [
        {
          move:
            "Identify the ions and the outer electrons each metal contributes.",
          why:
            "Sodium forms Na⁺ and contributes one outer electron per atom. Magnesium forms Mg²⁺ and contributes two. The comparison is not just “two different metals”; the charge and electron count are different.",
        },
        {
          move:
            "Compare the strength of the attraction between the ions and the electron sea.",
          why:
            "Mg²⁺ has a larger positive charge than Na⁺, and there are two delocalised electrons per magnesium atom rather than one per sodium atom. The electrostatic attraction is therefore stronger in magnesium.",
        },
        {
          move:
            "Link the stronger attraction to the energy needed to melt the metal.",
          why:
            "Melting lets the ions leave their lattice positions. Stronger attractions require more energy to overcome, so magnesium has the higher melting point.",
        },
        {
          move:
            "State the conclusion without claiming that one metal has a different kind of bond.",
          why:
            "Both are held by metallic bonding. The difference is the strength of that bonding, not a switch from metallic to ionic or covalent.",
        },
      ],
      answer:
        "Magnesium has Mg²⁺ ions and contributes two delocalised electrons per atom, while sodium has Na⁺ ions and contributes one. The greater charge and greater electron density give stronger attraction to the lattice, so more energy is needed to melt magnesium. The bonding is metallic in both metals; magnesium's is stronger.",
    },
    {
      id: "w2",
      prompt:
        "Brass is harder than pure copper, but it still conducts electricity. Explain both observations using the structure of an alloy.",
      steps: [
        {
          move:
            "Describe brass as a mixture of copper and zinc, not a compound with a fixed formula.",
          why:
            "The zinc atoms replace some copper atoms in the lattice, and the proportions can vary. The material is still an alloy with metallic bonding.",
        },
        {
          move:
            "Explain why the different-sized zinc atoms make sliding harder.",
          why:
            "The zinc atoms do not fit exactly like the copper atoms, so the layers are distorted. When a force is applied, the layers cannot slide past one another as easily as in pure copper, so brass is harder.",
        },
        {
          move:
            "Explain why conductivity survives alloying.",
          why:
            "The alloy still has delocalised electrons. The electrons can move through the lattice even though the positive ions are a mixture of copper and zinc ions, so brass remains an electrical conductor.",
        },
        {
          move:
            "Separate hardness from conductivity instead of treating them as one property.",
          why:
            "Hardness depends on how easily layers slide; conductivity depends on mobile electrons. An alloy can change the first while retaining the second.",
        },
      ],
      answer:
        "Brass contains copper and zinc atoms of different sizes. The zinc atoms distort the layers, so the layers cannot slide as easily as in pure copper and the alloy is harder. The alloy still has delocalised electrons, so it still conducts electricity. Hardness and conductivity come from different features of the same metallic structure.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A metal is held together by ionic bonds between positive metal ions and negative non-metal ions.",
      whyItFails:
        "A metal contains no non-metal anions. Its lattice sites are occupied by positive metal ions, and the negative charge is supplied by delocalised electrons spread throughout the structure. Calling the bonding ionic would predict fixed ions and a non-conducting solid, which is the opposite of a metal's behaviour.",
      correction:
        "Name both parts of the metallic model: positive metal ions and delocalised electrons. Check that the structure has no separate negative ions before calling it ionic.",
      contrast: {
        wrong:
          "magnesium is held by Mg²⁺ and some negative ions in a lattice",
        right:
          "magnesium is held by Mg²⁺ ions and delocalised electrons shared across the lattice",
      },
    },
    {
      id: "m2",
      belief:
        "Metals are soft because their bonds are weak, which is why the layers slide.",
      whyItFails:
        "Metallic bonding can be very strong; many metals have high melting points. The layers slide because the attraction is non-directional and can continue in a new arrangement, not because the attraction is weak. A metal can be strong and malleable at the same time.",
      correction:
        "Separate strength from the direction of the bond. Strong non-directional attraction holds the lattice together, while allowing planes of ions to move without a clean fracture.",
      contrast: {
        wrong:
          "copper bends easily because its metallic bonds are weak",
        right:
          "copper bends because its layers can slide while the metallic attraction persists in the new shape",
      },
    },
    {
      id: "m3",
      belief:
        "An alloy is a compound with a fixed formula, so brass can be written as CuZn.",
      whyItFails:
        "An alloy is a mixture whose composition can be varied. Brass may contain different proportions of copper and zinc, and may include small amounts of other elements. A fixed formula would imply a definite ratio of atoms in a compound, which is not what an alloy is.",
      correction:
        "Describe an alloy by its elements and their proportions, not by a single formula. Use mass percentages or “mainly copper with zinc” when the exact composition is not specified.",
      contrast: {
        wrong:
          "brass is the compound CuZn, so every brass has equal copper and zinc atoms",
        right:
          "brass is a mixture mainly of copper and zinc; its composition and properties can vary",
      },
    },
    {
      id: "m4",
      belief:
        "The delocalised electrons are electrons that have escaped from the metal and are no longer part of it.",
      whyItFails:
        "The electrons remain within the metal and are attracted by its positive ions. If they escaped, the metal would acquire a large positive charge and the structure would not be neutral. They are delocalised, meaning shared across the lattice, not removed from it.",
      correction:
        "Say that the electrons are mobile within the metal and attracted by the lattice of cations. Delocalised describes where they are shared, not whether they have left the material.",
      contrast: {
        wrong:
          "the electrons have left the metal, leaving only positive ions behind",
        right:
          "the electrons are shared across the metal and remain attracted to its positive ions",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Explain why a copper wire conducts electricity in the solid state, while a crystal of sodium chloride does not.",
      hint:
        "Identify the charge carrier in each material, then ask whether that carrier can move in the solid.",
      answer:
        "Copper contains delocalised electrons that can move through the metal lattice, so it conducts as a solid. Sodium chloride contains Na⁺ and Cl⁻ ions, but in the solid they are fixed in the lattice and cannot move, so it does not conduct. The difference is the mobility of the charge carriers, not simply the presence of charge.",
      feedback: {
        correct:
          "Correct. Copper's electrons are mobile in the solid; sodium chloride's ions are not.",
        incorrect:
          "Do not stop at “copper has electrons and salt has ions”. Explain where each charge carrier is and whether it can move through the solid.",
      },
    },
    {
      id: "p2",
      prompt:
        "Pure iron is relatively soft. Steel is an alloy of iron with a small amount of carbon. Explain why steel is harder, and state why steel is not a compound with the formula FeC.",
      hint:
        "Where do the carbon atoms sit in the iron lattice, and what do they do to the layers?",
      answer:
        "The carbon atoms fit into the iron lattice and distort it, making it harder for layers of iron atoms to slide. Steel is harder because the layers are disrupted, not because a new ionic or covalent compound has formed. Its composition can vary, and carbon does not combine with iron in a single fixed ratio, so FeC is not the formula of steel.",
      feedback: {
        correct:
          "Correct. Carbon distorts the iron lattice and the composition is variable, so steel is an alloy rather than a fixed compound.",
        incorrect:
          "Focus on the layers and the variable composition. Carbon makes sliding harder by distorting the lattice; it does not turn the whole material into a compound with one fixed formula.",
      },
    },
    {
      id: "p3",
      prompt:
        "Sodium melts at about 98 °C and magnesium at about 650 °C. Both are metals. Explain the difference using the ions and delocalised electrons.",
      hint:
        "Compare the charge on Na⁺ and Mg²⁺, and count the outer electrons each atom contributes.",
      answer:
        "Magnesium forms Mg²⁺ and contributes two delocalised electrons per atom; sodium forms Na⁺ and contributes one. The stronger attraction between the more highly charged magnesium ions and the denser electron sea requires more energy to overcome, so magnesium has the higher melting point. Both are held by metallic bonding.",
      feedback: {
        correct:
          "Correct. Higher ionic charge and more delocalised electrons strengthen the attraction and raise the melting point.",
        incorrect:
          "Compare both the charge and the electron count. Mg²⁺ has a greater charge than Na⁺, and magnesium contributes two electrons per atom rather than one, so its metallic attraction is stronger.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Brass is an alloy of copper and zinc. Give one reason brass is harder than pure copper.",
      modelAnswer:
        "The zinc atoms are a different size from the copper atoms, so they distort the layers and make it harder for the layers to slide.",
      marking: [
        "Identifies that the alloy contains atoms of different sizes.",
        "Explains that the different sizes disrupt the regular layers.",
        "Links the disruption to the layers being unable to slide as easily.",
      ],
      check: {
        accepted: [
          "The zinc atoms are a different size from the copper atoms, so they distort the layers and make it harder for the layers to slide.",
          "the atoms are different sizes",
          "different-sized atoms",
          "different sized atoms",
          "zinc atoms are a different size",
          "the different sizes disrupt the layers",
        ],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "How many outer electrons does one aluminium atom contribute to the delocalised electron sea in the simple metallic model?",
      modelAnswer: "3",
      marking: [
        "Uses aluminium's position in group 3, or its configuration 2, 8, 3.",
        "Counts the three electrons in the outer shell.",
        "Gives the answer as 3, not the total number of electrons in the atom.",
      ],
      check: {
        accepted: ["3", "3 electrons", "three", "three electrons"],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why a metal conducts electricity and why it can be bent into a new shape without shattering.",
      modelAnswer:
        "A metal contains positive ions in a lattice and delocalised outer electrons. The delocalised electrons are free to move through the structure, so they carry charge and the metal conducts. When the metal is bent, layers of positive ions slide over one another. The metallic attraction is non-directional, so it persists in the new arrangement rather than snapping like a set of fixed bonds. The electrons redistribute around the new shape, allowing the metal to deform without a clean fracture.",
      marking: [
        "Identifies delocalised electrons as the mobile charge carriers.",
        "Explains conductivity by the movement of those electrons through the lattice.",
        "Explains bending by layers of ions sliding.",
        "Explains why the metallic attraction persists after the layers move, rather than breaking.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "An engineer is choosing a material for an aircraft frame. Pure aluminium is light and conducts electricity, but the frame is made from an aluminium alloy. Explain why an alloy is used, why the frame is still a metal rather than a compound, and why conductivity alone would not decide the choice.",
      whyItTransfers:
        "The lesson used brass and steel to explain hardness. Here the learner must apply the same layer-sliding model to a different alloy and weigh strength, mass and conductivity in a real material choice instead of repeating the brass example.",
      answer:
        "The aluminium alloy contains aluminium with other elements whose atoms are a different size. These atoms distort the aluminium lattice and make it harder for layers to slide, so the alloy is stronger and more suitable for a frame than pure aluminium. It is still a metal because it retains a lattice of positive ions and delocalised electrons; it is a mixture with variable composition, not a compound with a fixed formula. Conductivity is useful, but an aircraft frame needs strength, stiffness, low mass, fatigue resistance and corrosion resistance. A material with better conductivity but insufficient strength or durability would not be the better choice.",
      marking: [
        "Explains alloy hardening by different-sized atoms disrupting the layers.",
        "States that the alloy remains metallic and is a mixture rather than a fixed compound.",
        "Names properties other than conductivity that matter for an aircraft frame.",
        "Makes a trade-off rather than declaring one property to be universally best.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Describe the particles in a metal lattice and state what holds them together.",
      answer:
        "The lattice contains positive metal ions and delocalised outer electrons. The electrostatic attraction between the positive ions and the mobile electrons is the metallic bond.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why a metal can be bent without breaking, but an ionic crystal can cleave when its layers are displaced.",
      answer:
        "A metal's layers can slide while the non-directional attraction to the electron sea persists. In an ionic crystal, displacement can bring ions of the same charge next to one another; their repulsion splits the crystal.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why steel is harder than pure iron, and why steel cannot be represented by a single formula such as FeC.",
      answer:
        "Carbon atoms fit into the iron lattice and distort it, making it harder for iron layers to slide. Steel is an alloy whose composition can vary, so it is a mixture rather than a compound with one fixed ratio of iron to carbon. FeC would imply a fixed compound and does not describe the range of steels.",
      when: "month-later",
    },
  ],

  summary: [
    "Metallic bonding is the attraction between positive metal ions and delocalised outer electrons shared across the lattice.",
    "Mobile electrons explain electrical and thermal conductivity; there are no separate negative ions in the metal.",
    "Layers of ions can slide while the non-directional metallic attraction persists, so metals are malleable and ductile rather than brittle.",
    "Alloys contain atoms of different sizes that distort the layers, making sliding harder. An alloy is a mixture with variable composition, not a fixed compound.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The metallic structure is described in words before any diagram: positive ions at lattice sites, delocalised electrons shared across the piece, no negative ions. Conductivity and bending are each read as a two-step cause and effect.",
    },
    {
      need: "colour-vision",
      alternative:
        "Positive ions and electrons are labelled with words and charge signs, never distinguished by colour alone. Pure-metal and alloy layers are described as “regular” and “distorted” in the text.",
    },
    {
      need: "dyslexia",
      alternative:
        "The alloy explanation follows a fixed four-part pattern: pure layers, different-sized atoms, distorted layers, harder to slide. The same pattern is used in the worked example and the guided item.",
    },
    {
      need: "motor",
      alternative:
        "All responses are typed or selected. No lattice has to be drawn, and answers about layers can be given in words rather than by dragging atoms.",
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
        "All explanations, examples, practice items, assessments and the aircraft-frame transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against published GCSE chemistry subject content for metallic bonding, metals and alloys.",
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
