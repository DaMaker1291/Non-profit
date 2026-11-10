import type { AuthoredLesson } from "../../lesson-contract";

// ELECTROLYSIS IS REDOX DRIVEN BY A POWER SUPPLY, NOT "ELECTRICITY SPLITTING A
// LIQUID". The lesson keeps four questions separate: are the ions mobile? which
// ion reaches which electrode? what competes with it in water? and how much
// charge has passed? The electrode names are the first trap (cations go to the
// cathode), the aqueous competition is the second (water supplies H⁺ and OH⁻),
// and the third is that electrons travel through the wires while ions carry the
// current through the electrolyte.
export const CHEMISTRY_ELECTROLYSIS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "electrolysis",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, chemical changes and electrochemistry: electrolysis of molten and aqueous ionic compounds, electrode reactions, half-equations and industrial applications",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content for electrolysis. No specification, examination question or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain why electrolysis requires mobile ions and a direct-current supply, and why a solid ionic compound does not conduct.",
      evidence:
        "The learner distinguishes a solid lattice, a molten salt and an aqueous solution by the mobility of their ions, and explains why the same compound can conduct in one state and not another.",
    },
    {
      statement:
        "Assign the cathode and anode correctly and write balanced half-equations for the oxidation and reduction at each electrode.",
      evidence:
        "For molten sodium chloride and molten lead(II) bromide, the learner places the metal at the cathode, the non-metal at the anode, writes both half-equations and checks that the electrons lost equal the electrons gained.",
    },
    {
      statement:
        "Predict the products of aqueous electrolysis by identifying the ions competing at each electrode, including the effect of concentration and the use of reactive electrodes.",
      evidence:
        "For concentrated brine, dilute sodium chloride, copper(II) sulfate with inert electrodes and copper purification, the learner names the product at each electrode and explains the competition or electrode reaction that produces it.",
    },
    {
      statement:
        "Relate the quantity of product to the charge passed and explain the purpose of the membrane cell, cryolite and electroplating.",
      evidence:
        "The learner calculates charge from current and time, explains why doubling the time doubles the amount deposited at the same current, and describes why a membrane cell separates chlorine from sodium hydroxide and why cryolite lowers the operating temperature of aluminium extraction.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["ionic-bonding", "electricity-circuits"],
    check: [
      {
        id: "d1",
        question:
          "Why does solid sodium chloride not conduct electricity, while molten sodium chloride does?",
        answer:
          "In the solid, Na⁺ and Cl⁻ ions are fixed in a lattice and cannot move. When it melts, the lattice breaks down and the ions become mobile, so they can carry charge through the liquid.",
        targets: ["ionic-bonding"],
      },
      {
        id: "d2",
        question:
          "What is electric current, and what carries the current through a metal wire?",
        answer:
          "Current is the rate of flow of charge. In a metal wire, delocalised electrons carry the current; in an electrolyte, mobile ions carry it.",
        targets: ["electricity-circuits"],
      },
    ],
  },

  introduction: {
    hook:
      "A solid crystal of lead(II) bromide does not light a lamp in a circuit. Heat it until it melts, dip two carbon electrodes into the liquid, and the lamp lights while a silvery metal forms at one electrode and a brown vapour at the other. The power supply has not created charge; it has given mobile ions a direction to move in and a place to exchange electrons.",
    why:
      "Electrolysis is how aluminium is extracted, chlorine and sodium hydroxide are made from brine, metals are purified and objects are electroplated. It also exposes the difference between a charge carrier and a wire: electrons move through the metal circuit, but ions move through the electrolyte. Predicting the products requires more than remembering two words. The learner has to identify the ions present, decide which one is discharged at each electrode, and explain what happens when water competes with the salt.",
  },

  explanation: [
    {
      heading: "Electrolysis is forced redox, and it needs mobile ions",
      paragraphs: [
        "Electrolysis is the decomposition of an ionic compound by passing a direct current through it. The compound must contain ions that can move. In a solid ionic lattice the ions vibrate but stay in place, so there is no flow of charge through the solid. When the compound is melted, the lattice breaks down and the ions become mobile. When it dissolves in water, the ions separate and are surrounded by water molecules, so the solution also contains mobile ions.",
        "The power supply does work on the ions. At one electrode, electrons are supplied to positive ions so that they are reduced; at the other, electrons are removed from negative ions so that they are oxidised. Reduction is gain of electrons and oxidation is loss of electrons — OIL RIG. The electrons travel through the wires and the power supply, not through the electrolyte. Inside the electrolyte, the current is carried by the moving ions.",
        "A solid ionic compound therefore cannot be electrolysed even though it contains ions. The ions are present but not mobile. A molten salt or an aqueous solution can be electrolysed because its ions can move to the electrodes. This is the same distinction that explains why solid sodium chloride does not conduct but molten sodium chloride does.",
      ],
    },
    {
      heading: "The electrode names are not the charge signs",
      paragraphs: [
        "In an electrolytic cell, the cathode is the negative electrode and the anode is the positive electrode. Positive ions (cations) are attracted to the negative cathode, where they gain electrons and are reduced. Negative ions (anions) are attracted to the positive anode, where they lose electrons and are oxidised. The names can mislead: a cation goes to the cathode, and an anion goes to the anode.",
        "A half-equation shows the electron transfer at one electrode. For molten sodium chloride, the cathode reaction is Na⁺ + e⁻ → Na and the anode reaction is 2Cl⁻ → Cl₂ + 2e⁻. Each sodium ion gains one electron; each chloride ion loses one, and two chloride ions are needed to make one chlorine molecule. The electrons gained at the cathode must equal the electrons lost at the anode, so the two half-equations are combined only after the electron counts match.",
        "Writing the half-equations is also a charge check. The left and right sides must have the same total charge as well as the same atoms. In Na⁺ + e⁻ → Na, the left is 1+ plus 1−, which is neutral, and the right is neutral. In 2Cl⁻ → Cl₂ + 2e⁻, the left is 2− and the right is 0 plus 2−. A half-equation that balances atoms but not charge is not finished.",
      ],
    },
    {
      heading: "Molten compounds have only one source of ions",
      paragraphs: [
        "A molten binary compound contains only the cations and anions of that compound. There is no water to compete. Molten lead(II) bromide contains Pb²⁺ and Br⁻ ions. At the cathode, Pb²⁺ + 2e⁻ → Pb, so lead metal forms. At the anode, 2Br⁻ → Br₂ + 2e⁻, so bromine vapour forms. The observations match the equations: a silvery metal at the cathode and a brown vapour at the anode.",
        "The same logic gives aluminium from molten aluminium oxide. Al₂O₃ contains Al³⁺ and O²⁻ ions. At the cathode, Al³⁺ + 3e⁻ → Al; at the anode, 2O²⁻ → O₂ + 4e⁻. The industrial cell does not use pure molten alumina, because its melting point is very high. It dissolves the alumina in molten cryolite, which lowers the operating temperature, and uses carbon anodes. The oxygen produced at the anode reacts with the hot carbon, so the anodes are gradually consumed and carbon dioxide is released.",
        "A molten salt is not the same as a solution of the same salt. Molten sodium chloride gives sodium metal and chlorine. Aqueous sodium chloride gives hydrogen at the cathode and, in concentrated brine, chlorine at the anode; sodium hydroxide remains in solution. The extra ions from water change the products, even though the salt is the same.",
      ],
    },
    {
      heading: "In water, the products are a competition",
      paragraphs: [
        "Water is a very weak electrolyte, but it supplies a small concentration of H⁺ and OH⁻ ions through self-ionisation. In an aqueous solution, those ions compete with the ions from the dissolved salt. At the cathode, a metal ion and H⁺ compete for electrons. A very reactive metal such as sodium, magnesium or aluminium remains in solution, and hydrogen is produced from water instead. A less reactive metal such as copper or silver is deposited as the metal.",
        "At the anode, halide ions compete with OH⁻ ions. In concentrated brine, chloride ions are discharged and chlorine forms. In dilute sodium chloride solution, the hydroxide ions are discharged instead and oxygen forms. The concentration matters because it changes which ion arrives at the anode in sufficient number; it is not a different rule for each solution. In copper(II) sulfate with inert electrodes, OH⁻ is discharged at the anode and oxygen forms, while Cu²⁺ is reduced at the cathode and copper is deposited.",
        "The electrode material can also take part. In copper purification, the anode is impure copper and the cathode is pure copper. At the anode, copper atoms lose electrons and dissolve as Cu²⁺: Cu → Cu²⁺ + 2e⁻. At the cathode, Cu²⁺ gains electrons and is deposited: Cu²⁺ + 2e⁻ → Cu. The net effect is the transfer of copper from the impure anode to the pure cathode, while less reactive impurities fall to the bottom as sludge. In electroplating, the object to be plated is the cathode, the plating metal is the anode and the electrolyte contains the plating metal's ions.",
      ],
    },
    {
      heading: "Charge, current and the industrial cell",
      paragraphs: [
        "The amount of product depends on the charge that passes, not only on the current. Charge is current multiplied by time: Q = I × t, with current in amperes, time in seconds and charge in coulombs. A current of 2.0 A for 300 s passes 600 C. At the same current, doubling the time doubles the charge and therefore doubles the amount of substance deposited or released, provided the electrode reaction does not change.",
        "The charge alone does not give the mass directly, because different ions need different numbers of electrons. Copper(II) needs two electrons per atom, silver needs one and aluminium needs three. The same charge therefore deposits different amounts of different metals. At a higher level, the number of moles of electrons is charge divided by the Faraday constant, 96 500 C/mol, and the charge on the ion converts moles of electrons to moles of metal.",
        "Industrial cells separate the products so that they do not react back together. A membrane cell for brine keeps chlorine produced at the anode away from hydrogen and sodium hydroxide at the cathode. The three products have different uses: chlorine for sterilising water and making plastics, hydrogen as a fuel and for ammonia, and sodium hydroxide for soap and paper. The cell is a system for separating oxidation and reduction, not a single reaction vessel in which everything is allowed to mix.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.particle-model",
      body:
        "An electrolytic cell has two electrodes dipping into an electrolyte and connected to a direct-current supply. The electrode connected to the negative terminal is the cathode; the electrode connected to the positive terminal is the anode. Positive ions move towards the cathode and negative ions towards the anode. Electrons move through the wires and the supply, not through the liquid.",
      notation:
        "cathode (−): cations arrive, gain electrons, reduction   ·   anode (+): anions arrive, lose electrons, oxidation   ·   electrolyte: mobile ions carry the current   ·   external circuit: electrons carry the current",
      caption:
        "The polarity belongs to the power supply, not to the ion. A cation is attracted to the negative cathode; an anion is attracted to the positive anode. The names are not synonyms for the signs.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "In a molten binary compound, the only ions present come from the compound itself. The metal cation is reduced at the cathode and the non-metal anion is oxidised at the anode. The two half-equations must transfer the same number of electrons before they are combined.",
      notation:
        "molten NaCl: cathode Na⁺ + e⁻ → Na   ·   anode 2Cl⁻ → Cl₂ + 2e⁻   ·   overall 2Na⁺ + 2Cl⁻ → 2Na + Cl₂\nmolten PbBr₂: cathode Pb²⁺ + 2e⁻ → Pb   ·   anode 2Br⁻ → Br₂ + 2e⁻\nmolten Al₂O₃: cathode Al³⁺ + 3e⁻ → Al   ·   anode 2O²⁻ → O₂ + 4e⁻",
      caption:
        "The metal appears at the cathode because its ions gain electrons there. The non-metal appears at the anode because its ions lose electrons there. A molten salt has no water to provide a competing H⁺ or OH⁻.",
    },
    {
      id: "r3",
      kind: "chemistry.equation",
      body:
        "In aqueous solution, water supplies a small concentration of H⁺ and OH⁻ ions. These compete with the salt's ions. The product depends on which ion is discharged, which in turn depends on the identity and concentration of the ions and on the electrode material.",
      notation:
        "cathode, water: 2H₂O + 2e⁻ → H₂ + 2OH⁻   ·   cathode, copper: Cu²⁺ + 2e⁻ → Cu\nanode, hydroxide: 4OH⁻ → O₂ + 2H₂O + 4e⁻   ·   anode, concentrated chloride: 2Cl⁻ → Cl₂ + 2e⁻\ncopper anode: Cu → Cu²⁺ + 2e⁻",
      caption:
        "The half-equation names what actually reacts. Hydrogen at the cathode does not mean sodium metal formed and then reacted; it means H⁺ from water was reduced instead of Na⁺. Oxygen at the anode comes from OH⁻, not from O²⁻ ions in the solution.",
    },
    {
      id: "r4",
      kind: "chemistry.formula",
      body:
        "The same salt can give different products in different states or at different concentrations. The observations are part of the evidence: a gas, a metal deposit, a colour change or a pH change tells the learner which electrode reaction occurred.",
      notation:
        "molten NaCl: Na at cathode, Cl₂ at anode   ·   concentrated brine: H₂ at cathode, Cl₂ at anode, NaOH left in solution   ·   dilute NaCl: H₂ at cathode, O₂ at anode   ·   CuSO₄ with inert electrodes: Cu at cathode, O₂ at anode   ·   CuSO₄ with copper electrodes: Cu transferred from anode to cathode",
      caption:
        "Do not memorise one product list for sodium chloride. First decide whether the compound is molten or aqueous, then identify the ions competing at each electrode. Concentration and electrode material can change the answer.",
    },
    {
      id: "r5",
      kind: "chemistry.calculation",
      body:
        "The charge passed is the product of current and time. At a fixed electrode reaction, twice the charge transfers twice as many electrons, so twice as many ions are discharged. The mass also depends on the charge on the ion: a 2+ ion needs two electrons per atom, while a 1+ ion needs one.",
      notation:
        "Q = I × t   ·   current in A, time in s, charge in C\n2.0 A × 300 s = 600 C\n1 mol e⁻ = 96 500 C   ·   moles of metal = (Q ÷ 96 500) ÷ charge on the ion",
      caption:
        "Current is not the same as charge. A small current for a long time can pass more charge than a large current for a short time. The question must give both, or give the charge directly.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Molten lead(II) bromide is electrolysed using inert electrodes. Write the half-equation at each electrode, state the observation at each electrode, and write the overall equation.",
      steps: [
        {
          move:
            "Identify the ions in molten lead(II) bromide: Pb²⁺ and Br⁻.",
          why:
            "Lead is in Group 2, so it forms a 2+ ion; bromine is in Group 7, so it forms a 1− ion. Because the compound is molten, these are the only ions present. There is no water to compete.",
        },
        {
          move:
            "Send Pb²⁺ to the cathode and Br⁻ to the anode, then write the electron transfer.",
          why:
            "The cathode is negative, so it attracts the positive lead ion, which gains two electrons: Pb²⁺ + 2e⁻ → Pb. The anode is positive, so it attracts the negative bromide ion, which loses one electron. Two bromide ions are needed to make one Br₂ molecule: 2Br⁻ → Br₂ + 2e⁻.",
        },
        {
          move:
            "Check that the electrons lost equal the electrons gained and combine the half-equations.",
          why:
            "One Pb²⁺ gains two electrons, and two Br⁻ lose two electrons in total. The electron counts already match: Pb²⁺ + 2Br⁻ → Pb + Br₂. The overall equation conserves both atoms and charge.",
        },
        {
          move:
            "Translate each half-equation into an observation.",
          why:
            "Lead is a silvery liquid or solid metal at the cathode. Bromine is a brown vapour at the anode. The observations match the products the equations predict, which is how the model is checked against the experiment.",
        },
      ],
      answer:
        "Cathode: Pb²⁺ + 2e⁻ → Pb, giving silvery lead. Anode: 2Br⁻ → Br₂ + 2e⁻, giving brown bromine vapour. Overall: Pb²⁺ + 2Br⁻ → Pb + Br₂. The molten salt supplies only Pb²⁺ and Br⁻, so there is no competing water reaction.",
    },
    {
      id: "w2",
      prompt:
        "Copper(II) sulfate solution is electrolysed with inert electrodes. Predict the product at each electrode, write the half-equations, and explain the colour and pH changes.",
      steps: [
        {
          move:
            "List the ions present: Cu²⁺, SO₄²⁻, H⁺ and OH⁻ from water.",
          why:
            "Copper(II) sulfate supplies Cu²⁺ and SO₄²⁻. Water supplies a small amount of H⁺ and OH⁻. The sulfate ion is not discharged in this cell; the competition at the anode is between sulfate and hydroxide.",
        },
        {
          move:
            "Choose the cathode reaction: Cu²⁺ is less reactive than hydrogen, so copper is deposited.",
          why:
            "At the cathode, Cu²⁺ and H⁺ compete for electrons. Copper is below hydrogen in the reactivity series, so Cu²⁺ is reduced more readily: Cu²⁺ + 2e⁻ → Cu. A pink-brown copper deposit forms and the blue colour of the solution fades as Cu²⁺ is removed.",
        },
        {
          move:
            "Choose the anode reaction: OH⁻ is oxidised to oxygen with inert electrodes.",
          why:
            "Sulfate ions are not oxidised in this electrolysis. Hydroxide ions from water lose electrons: 4OH⁻ → O₂ + 2H₂O + 4e⁻. Oxygen bubbles form at the anode. Removing OH⁻ leaves the solution more acidic, so its pH falls.",
        },
        {
          move:
            "Combine the electron counts and check the overall change.",
          why:
            "Two Cu²⁺ ions gain four electrons in total, matching the four electrons lost by four OH⁻ ions: 2Cu²⁺ + 2H₂O → 2Cu + O₂ + 4H⁺. The solution loses Cu²⁺ and gains H⁺, which explains both the fading blue colour and the lower pH.",
        },
      ],
      answer:
        "Cathode: Cu²⁺ + 2e⁻ → Cu, giving a pink-brown copper deposit. Anode: 4OH⁻ → O₂ + 2H₂O + 4e⁻, giving oxygen bubbles. The blue colour fades as Cu²⁺ is removed, and the solution becomes more acidic as OH⁻ is removed. The sulfate ion is a spectator in this cell; it is not discharged.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief:
        "Positive ions move to the positive electrode because opposite charges attract.",
      whyItFails:
        "The rule is the opposite: positive ions are attracted to the negative electrode. The cathode is the negative electrode in an electrolytic cell, so cations move to the cathode. Confusing the electrode's name with its charge reverses both half-equations and puts the metal at the wrong electrode.",
      correction:
        "Say the charge with the name every time: cathode is negative, so cations go there; anode is positive, so anions go there. Then check that reduction (gain of electrons) happens at the cathode and oxidation (loss) at the anode.",
      contrast: {
        wrong: "Cu²⁺ is positive, so it is attracted to the positive anode and deposited there",
        right: "Cu²⁺ is attracted to the negative cathode, gains two electrons and is deposited there as copper",
      },
    },
    {
      id: "m2",
      belief:
        "A solid ionic compound can be electrolysed because it contains ions.",
      whyItFails:
        "Electrolysis needs mobile charge carriers. In a solid ionic lattice the ions are held in fixed positions, so they cannot travel to the electrodes. The ions exist, but their lack of movement means there is no current through the solid. Melting or dissolving removes that restriction.",
      correction:
        "Check the state before predicting products. A solid ionic compound does not conduct and cannot be electrolysed; a molten salt or an aqueous solution can, because its ions are free to move.",
      contrast: {
        wrong: "solid sodium chloride contains Na⁺ and Cl⁻, so it can be electrolysed without melting",
        right: "solid sodium chloride has fixed ions and does not conduct; molten or dissolved sodium chloride has mobile ions and can be electrolysed",
      },
    },
    {
      id: "m3",
      belief:
        "Aqueous sodium chloride always gives sodium metal at the cathode and chlorine at the anode.",
      whyItFails:
        "Water competes. At the cathode, H⁺ from water is reduced instead of Na⁺ because sodium is very reactive, so hydrogen forms. At the anode, concentrated chloride gives chlorine but dilute chloride gives oxygen from OH⁻. The salt's name alone does not determine the products.",
      correction:
        "Name the ions present, including H⁺ and OH⁻ from water, then decide which is discharged at each electrode. State the concentration and the electrode material when they affect the answer.",
      contrast: {
        wrong: "aqueous NaCl always makes sodium at the cathode, just like molten NaCl",
        right: "aqueous NaCl makes hydrogen at the cathode because water is reduced; concentrated brine makes chlorine at the anode, while dilute NaCl makes oxygen",
      },
    },
    {
      id: "m4",
      belief:
        "Electrons travel through the electrolyte from one electrode to the other.",
      whyItFails:
        "Electrons move through the metal wires and the power supply, but they do not travel through the solution as free electrons. Inside the electrolyte, the current is carried by ions moving in opposite directions. At the electrodes, the ions exchange electrons with the circuit.",
      correction:
        "Trace the charge path separately: electrons in the wires, ions in the electrolyte, and electron transfer at each electrode. The cathode supplies electrons to cations; the anode removes electrons from anions.",
      contrast: {
        wrong: "electrons flow through the salt water from the anode to the cathode",
        right: "electrons flow through the wire from anode to cathode; in the solution, anions move to the anode and cations to the cathode",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Molten sodium chloride is electrolysed with inert electrodes. Name the product at each electrode, write both half-equations and write the overall equation.",
      hint:
        "The ions are Na⁺ and Cl⁻. The cathode is negative and reduces cations; the anode is positive and oxidises anions. Remember that chlorine is Cl₂, so two chloride ions are needed.",
      answer:
        "At the cathode, Na⁺ + e⁻ → Na, so sodium metal forms. At the anode, 2Cl⁻ → Cl₂ + 2e⁻, so chlorine gas forms. The electron counts match as written: one sodium ion gains one electron, and two chloride ions lose two electrons in total. The overall equation is 2Na⁺ + 2Cl⁻ → 2Na + Cl₂.",
      feedback: {
        correct:
          "You placed the metal at the cathode, the non-metal at the anode, and balanced the electrons before combining the half-equations.",
        incorrect:
          "The cathode is negative: Na⁺ gains an electron there. The anode is positive: two Cl⁻ ions lose two electrons to make Cl₂. The overall equation needs two Na⁺ for every Cl₂ so that the electrons balance.",
      },
    },
    {
      id: "p2",
      prompt:
        "Concentrated brine and dilute sodium chloride solution are both electrolysed. Explain why concentrated brine gives chlorine at the anode while dilute sodium chloride gives oxygen.",
      hint:
        "Both solutions contain Cl⁻ and OH⁻ at the anode. Which ion is present in sufficient concentration to be discharged in each case?",
      answer:
        "Both solutions contain chloride ions from the salt and hydroxide ions from water. In concentrated brine, chloride ions are present in high concentration and are discharged at the anode: 2Cl⁻ → Cl₂ + 2e⁻. In dilute sodium chloride solution, the chloride concentration is low, so hydroxide ions are discharged instead: 4OH⁻ → O₂ + 2H₂O + 4e⁻. The rule is the same; the concentration changes which ion reaches the anode in sufficient number to be oxidised.",
      feedback: {
        correct:
          "You kept the same competition at the anode and changed only the concentration of chloride, rather than inventing a different rule for each solution.",
        incorrect:
          "Chloride and hydroxide compete at the anode in both solutions. Concentrated brine discharges chloride and makes chlorine; dilute solution discharges hydroxide and makes oxygen. The concentration, not the identity of the salt alone, decides.",
      },
    },
    {
      id: "p3",
      prompt:
        "A current of 0.50 A flows through a copper(II) sulfate solution for 10 minutes. Calculate the charge passed. Explain how the amount of copper deposited would change if the current were doubled while the time stayed the same.",
      hint:
        "Convert minutes to seconds before multiplying. Charge = current × time. Doubling the current doubles the charge, so what happens to the number of electrons and the number of copper ions reduced?",
      answer:
        "10 minutes is 600 s. Q = I × t = 0.50 × 600 = 300 C. Doubling the current to 1.0 A for the same 600 s gives 600 C, twice the charge. Twice as many electrons are supplied, so twice as many Cu²⁺ ions can be reduced and twice as much copper is deposited, provided the electrode reaction stays the same.",
      feedback: {
        correct:
          "You converted the time to seconds, multiplied current by time, and linked double the charge to double the electrons and double the copper.",
        incorrect:
          "10 minutes is 600 s, so Q = 0.50 × 600 = 300 C. At 1.0 A for 600 s the charge is 600 C, twice as much; twice the electrons reduce twice as many Cu²⁺ ions, so twice the mass of copper is deposited.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Aluminium is extracted from aluminium oxide by electrolysis. Explain why the oxide is dissolved in molten cryolite rather than electrolysed as a pure melt, why the cathode reaction produces aluminium, and why the carbon anodes are gradually used up.",
      modelAnswer:
        "Pure aluminium oxide has a very high melting point, so dissolving it in molten cryolite lowers the operating temperature and reduces the energy needed. The melt contains Al³⁺ and O²⁻ ions. At the negative cathode, Al³⁺ + 3e⁻ → Al, so aluminium is reduced and collects as molten metal. At the positive anode, 2O²⁻ → O₂ + 4e⁻, so oxygen is oxidised. The oxygen reacts with the hot carbon anode to form carbon dioxide, so the anode is consumed and must be replaced periodically. The overall extraction is 2Al₂O₃ → 4Al + 3O₂, with the carbon reacting with the oxygen.",
      marking: [
        "States that cryolite lowers the melting point or operating temperature of the electrolyte.",
        "Identifies Al³⁺ as the ion reduced at the cathode and writes Al³⁺ + 3e⁻ → Al.",
        "Identifies O²⁻ as the ion oxidised at the anode and writes 2O²⁻ → O₂ + 4e⁻.",
        "Explains that oxygen reacts with the carbon anode to form carbon dioxide, consuming the anode.",
        "Keeps the electrode reactions separate from the overall extraction and does not claim that water is present.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A current of 2.0 A flows through an electrolytic cell for 5.0 minutes. Calculate the charge passed, in coulombs.",
      modelAnswer: "600",
      marking: [
        "Converts 5.0 minutes to 300 seconds.",
        "Uses Q = I × t rather than adding current and time.",
        "Multiplies 2.0 A by 300 s to obtain 600 C.",
      ],
      check: { accepted: ["600", "600 C", "600 coulombs"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "During electrolysis of aqueous sodium chloride, which gas forms at the cathode?",
      modelAnswer: "hydrogen",
      marking: [
        "Names hydrogen, not sodium, because H⁺ from water is reduced in preference to Na⁺.",
        "Does not confuse the cathode with the anode or name chlorine.",
      ],
      check: { accepted: ["hydrogen", "H2", "H₂", "hydrogen gas"] },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "Concentrated brine is electrolysed in a membrane cell. Name the product at each electrode and the substance left in solution, and explain why the membrane is needed. Include one half-equation.",
      modelAnswer:
        "At the cathode, water is reduced instead of Na⁺ because sodium is very reactive: 2H₂O + 2e⁻ → H₂ + 2OH⁻, so hydrogen forms. At the anode, concentrated chloride ions are oxidised: 2Cl⁻ → Cl₂ + 2e⁻, so chlorine forms. Sodium hydroxide remains in solution. The membrane separates the anode and cathode compartments so that chlorine does not mix with hydrogen or react with sodium hydroxide; mixing would reduce the yield and could form unwanted products. The three products are collected separately.",
      marking: [
        "Names hydrogen at the cathode and chlorine at the anode.",
        "States that sodium hydroxide remains in solution.",
        "Explains that water competes at the cathode and chloride is discharged at the anode in concentrated brine.",
        "Writes a correct cathode or anode half-equation.",
        "Explains that the membrane keeps the products apart and prevents them reacting or mixing.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A company wants to extract aluminium from aluminium oxide and also to purify copper for electrical wiring. Explain why aluminium is extracted from a molten electrolyte containing cryolite, while copper is purified from an aqueous copper sulfate electrolyte with copper electrodes. Include the electrode reactions and one reason the two processes cannot simply swap electrolytes.",
      whyItTransfers:
        "The lesson teaches molten and aqueous cells separately. A real extraction plant asks the learner to choose between them for two metals with different reactivity, and to justify the choice from the ions present rather than from a memorised product list. Aluminium cannot be deposited from aqueous solution because water would be reduced first; copper can be purified in water because Cu²⁺ is less reactive than hydrogen.",
      answer:
        "Aluminium is very reactive, so it cannot be extracted by heating its oxide with carbon. In the molten alumina–cryolite electrolyte, Al³⁺ is reduced at the cathode: Al³⁺ + 3e⁻ → Al. O²⁻ is oxidised at the anode: 2O²⁻ → O₂ + 4e⁻. Cryolite lowers the melting point and saves energy. If aqueous aluminium ions were used, water would be reduced to hydrogen at the cathode instead of Al³⁺, so aluminium metal would not be deposited. Copper is less reactive than hydrogen, so aqueous copper sulfate can be used: Cu²⁺ + 2e⁻ → Cu at the cathode. With a copper anode, Cu → Cu²⁺ + 2e⁻ at the anode, so copper dissolves from the impure anode and is deposited on the pure cathode. The electrolytes are not interchangeable: the molten route is needed for a reactive metal, while the aqueous route works for a less reactive metal and allows copper purification.",
      marking: [
        "Writes the cathode and anode half-equations for aluminium extraction.",
        "Explains the role of cryolite in lowering the operating temperature.",
        "Explains why aqueous aluminium ions would give hydrogen instead of aluminium.",
        "Writes the cathode reaction for copper deposition and the copper-anode reaction.",
        "Contrasts the reactive metal with the less reactive metal rather than treating the cells as arbitrary choices.",
        "Uses ion identity and competition to justify the electrolyte choice.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Which electrode is the cathode in an electrolytic cell, and which ions move towards it?",
      answer:
        "The cathode is the negative electrode. Positive ions (cations) move towards it and gain electrons there.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Why does aqueous sodium chloride give hydrogen rather than sodium at the cathode?",
      answer:
        "Sodium is very reactive, so Na⁺ is not reduced in preference to H⁺ from water. Water is reduced instead: 2H₂O + 2e⁻ → H₂ + 2OH⁻.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "What is the difference between the anode reaction in copper purification and the anode reaction in copper(II) sulfate electrolysis with inert electrodes?",
      answer:
        "With a copper anode, copper atoms are oxidised and dissolve: Cu → Cu²⁺ + 2e⁻. With an inert anode, hydroxide ions are oxidised and oxygen forms: 4OH⁻ → O₂ + 2H₂O + 4e⁻.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "Why does the same charge deposit different masses of copper and silver?",
      answer:
        "Copper(II) needs two electrons per atom while silver needs one. The same charge therefore supplies enough electrons to deposit half as many copper atoms as silver atoms, and the masses also depend on the relative atomic masses.",
      when: "month-later",
    },
  ],

  summary: [
    "Electrolysis is forced redox in an ionic compound with mobile ions; a solid ionic lattice does not conduct because its ions cannot move.",
    "In an electrolytic cell the cathode is negative and reduces cations; the anode is positive and oxidises anions. Electrons travel through the wires, while ions carry charge through the electrolyte.",
    "Molten binary compounds give the metal at the cathode and the non-metal at the anode. In water, H⁺ and OH⁻ compete, so reactive metals give hydrogen and dilute halides can give oxygen instead of a halogen.",
    "Charge is current × time. At a fixed electrode reaction, more charge means more product, but the mass also depends on the charge on the ion and its relative atomic mass.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every half-equation, electrode assignment and product prediction is written in words as well as symbols. The cell's polarity and the direction of ion movement are stated explicitly, so no diagram is the only source of the answer.",
    },
    {
      need: "colour-vision",
      alternative:
        "The lesson never relies on the colour of a flame or solution as the only evidence. Products are named, and the copper sulfate colour change is accompanied by the ion that causes it; electrode signs are written as plus and minus, not shown only by colour.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each section is short and headed, half-equations are repeated in the representations and worked examples, and the assessment accepts the answer 600 or 600 C rather than requiring a particular spacing or unit symbol.",
    },
    {
      need: "motor",
      alternative:
        "The learner types the numerical answer or writes the half-equations in words; no apparatus, drawing or timed manipulation is required. The calculation can be done on paper and entered as a single number.",
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
        "Scope cited against the published GCSE chemistry subject content for electrolysis, electrode reactions and industrial electrochemistry.",
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
