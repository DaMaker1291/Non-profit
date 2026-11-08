import type { AuthoredLesson } from "../../lesson-contract";

// RESPIRATION IS ROUTINELY CONFUSED WITH BREATHING, AND THE EQUATION IS OFTEN
// TAUGHT AS A SENTENCE TO RECITE. This lesson separates the two processes,
// grounds the equation in what happens inside a cell, and makes the difference
// between aerobic and anaerobic respiration a difference in yield and product
// rather than a list of two equations. The mitochondrion is taught as a
// structure whose folding exists for a reason, not as a label on a diagram.
export const BIOLOGY_RESPIRATION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "respiration",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, bioenergetics: aerobic and anaerobic respiration",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish respiration from breathing, and explain why every living cell respires continuously.",
      evidence:
        "The learner states that breathing moves air while respiration is a set of enzyme-controlled reactions inside cells, and gives a plant or yeast example that has no lungs.",
    },
    {
      statement:
        "Compare aerobic and anaerobic respiration in terms of reactants, products, energy released and where each occurs.",
      evidence:
        "The learner writes both word equations and explains that anaerobic respiration releases less energy per glucose molecule and produces lactic acid in muscle or ethanol and carbon dioxide in yeast.",
    },
    {
      statement:
        "Use the idea of an oxygen debt to explain why breathing and heart rate stay elevated after hard exercise.",
      evidence:
        "The learner links the continued oxygen supply to the removal of lactic acid and the restoration of normal cell conditions, rather than saying that the body is simply 'catching its breath'.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["enzymes", "energy-conservation"],
    check: [
      {
        id: "d1",
        question: "What does an enzyme do to a reaction, and what can stop it working?",
        answer:
          "An enzyme speeds up a reaction by providing a shape into which its substrate fits. High temperature or the wrong pH can change the active site's shape and stop the enzyme working.",
        targets: ["enzymes"],
      },
      {
        id: "d2",
        question:
          "When a cell releases energy from a fuel, is that energy created?",
        answer:
          "No. Energy is transferred from the fuel to other stores; it is not created. The total energy is conserved, but less of it remains available for useful work after each transfer.",
        targets: ["energy-conservation"],
      },
    ],
  },

  introduction: {
    hook:
      "A runner finishes a 400-metre race and stands with hands on knees, breathing hard for several minutes. The race is over, so why does the body keep demanding oxygen? During the sprint, the leg muscles were working faster than the blood could supply oxygen. They kept releasing energy anyway, using a route that does not need oxygen, and built up a substance that now has to be dealt with. The heavy breathing is not the muscles 'refilling' with air; it is the repayment of a chemical debt.",
    why:
      "Respiration is the set of reactions that releases energy from glucose inside a cell. Aerobic respiration uses oxygen and releases a relatively large amount of energy, producing carbon dioxide and water. Anaerobic respiration works without oxygen, releases much less energy from the same amount of glucose, and produces lactic acid in animal muscle or ethanol and carbon dioxide in yeast. Breathing is the movement of air that supplies oxygen and removes carbon dioxide; it is not respiration itself. Keeping those two ideas apart is the first step to understanding exercise, fermentation and why a plant in the dark still needs oxygen.",
  },

  explanation: [
    {
      heading: "Respiration is a chemical process inside cells, not the movement of air",
      paragraphs: [
        "Breathing, or ventilation, is the mechanical movement of air into and out of the lungs. It brings oxygen to the alveoli and carries carbon dioxide away. Respiration happens after that: oxygen crosses into the blood, is carried to cells, and is used in a series of enzyme-controlled reactions that release energy from glucose. A plant, a yeast cell and a bacterium all respire without having lungs, which is the simplest evidence that the two processes are not the same.",
        "The energy released is not used directly to make a muscle contract. It is transferred to molecules of ATP, which act as the cell's immediate energy currency. ATP can be broken down quickly wherever energy is needed: for muscle contraction, for active transport across a membrane, or for building larger molecules from smaller ones. Some energy is also released as heat, which is why a working muscle warms up. Respiration is therefore not one reaction but a pathway of many, each step controlled by an enzyme.",
      ],
    },
    {
      heading: "Aerobic respiration transfers energy in stages, using oxygen as the final electron acceptor",
      paragraphs: [
        "In aerobic respiration, glucose is broken down in the cytoplasm and then in the mitochondria. Oxygen is used at the end of the chain of reactions, where it accepts electrons and combines with hydrogen to form water. Carbon dioxide is produced earlier when the carbon skeleton of glucose is dismantled. The overall word equation summarises the inputs and outputs, but it hides the stages: glucose is not simply burned in one step, and the energy is released in small amounts that the cell can capture.",
        "The mitochondrion's inner membrane is folded into cristae because the folds increase the surface area available for the proteins that carry out the later stages. More membrane means more space for the enzymes and electron carriers that transfer energy in controlled steps. A cell with a high energy demand, such as a muscle fibre or a sperm cell, tends to contain many mitochondria for this reason. The structure is not decorative; it is the physical basis of the cell's capacity to release energy aerobically.",
      ],
    },
    {
      heading: "Anaerobic respiration is a short-term route with a smaller yield",
      paragraphs: [
        "When oxygen cannot reach a cell fast enough, aerobic respiration cannot continue at the required rate. Animal cells can still release a small amount of energy from glucose without oxygen, converting it to lactic acid. This route releases much less energy per glucose molecule because the breakdown is incomplete: the lactic acid still contains chemical energy that aerobic respiration would have extracted. It is fast, however, and it allows a muscle to keep contracting during a short burst of intense activity.",
        "In yeast and some plant cells, the anaerobic route produces ethanol and carbon dioxide instead of lactic acid. This is fermentation, and it is the process used in bread-making and in brewing. Yeast is not obliged to ferment: when oxygen is present it respires aerobically and releases more energy; when oxygen is used up it switches to fermentation. The switch is a response to the conditions, not a permanent property of the organism. That is why a sealed flask of yeast can build up ethanol only after the oxygen has been consumed.",
      ],
    },
    {
      heading: "The oxygen debt is the cost of clearing the anaerobic products",
      paragraphs: [
        "After hard exercise, lactic acid has accumulated in muscle and has been carried in the blood to the liver. The body continues to take in oxygen at a high rate because oxygen is needed to convert the lactic acid back to glucose or to oxidise it completely. The extra oxygen consumed after exercise, above the resting requirement, is called the oxygen debt. Breathing and heart rate stay elevated because they are supplying that oxygen and transporting the products to the liver.",
        "This explanation also shows why the debt is repaid rather than erased. The lactic acid does not disappear because the exercise stopped; it is processed using oxygen that arrives afterwards. A learner who says the body is 'catching its breath' has described the sensation but not the chemistry. The useful explanation names the substance that accumulated, the organ that processes it, and the oxygen that the process requires.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "The inner membrane of a mitochondrion is folded into cristae because the folds increase the surface area for the enzymes and electron carriers that transfer energy during aerobic respiration, so a cell with many mitochondria can release energy at a high rate.",
      notation: "folded inner membrane → large surface area → more energy-transfer proteins",
      caption:
        "The fold is the function. A smooth inner membrane would still contain the same components, but it would expose far less surface for the reactions that depend on them.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "In aerobic respiration, glucose is broken down in the cytoplasm and mitochondria, and oxygen accepts electrons at the end of the chain, forming water. The process releases a large amount of energy because glucose is broken down completely, and the energy is captured in ATP rather than released all at once.",
      notation: "glucose + oxygen → carbon dioxide + water · energy released and stored in ATP",
      caption:
        "Oxygen is a reactant, not a fuel. It allows the complete breakdown of glucose, which is why aerobic respiration releases more energy per glucose molecule than the anaerobic route.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "During a sprint, the demand for energy rises faster than oxygen can be delivered, so muscle cells convert glucose to lactic acid without oxygen. This releases energy quickly but incompletely, and the lactic acid accumulates because the cell cannot process it further until oxygen arrives.",
      notation: "glucose → lactic acid · small amount of energy released · lactic acid accumulates",
      caption:
        "The anaerobic route is not a different fuel; it is the same fuel processed part of the way. The lactic acid is the partly broken-down remainder, not a waste product created from nothing.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "Yeast in a sealed flask with glucose produces ethanol and carbon dioxide once the oxygen is used up, because the yeast switches from aerobic respiration to fermentation. If air is bubbled through the flask, the yeast respires aerobically and produces much less ethanol for the same amount of glucose.",
      notation: "sealed flask: glucose → ethanol + carbon dioxide · aerated flask: glucose + oxygen → carbon dioxide + water",
      caption:
        "The comparison controls the oxygen supply. The difference in products is the evidence that the pathway depends on oxygen availability, not on the yeast changing species.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A sprinter accelerates hard for 200 metres. Explain why her muscle cells produce lactic acid and why she continues to breathe heavily after she crosses the finish line.",
      steps: [
        {
          move:
            "Compare the rate at which the muscles need energy with the rate at which oxygen can be delivered.",
          why:
            "Aerobic respiration depends on oxygen reaching the mitochondria. During a sprint, muscle contraction uses ATP faster than the blood can supply oxygen, so the aerobic route cannot keep up with demand.",
        },
        {
          move:
            "Identify the route the muscle uses when oxygen is insufficient, and name its product.",
          why:
            "The muscle converts glucose to lactic acid without oxygen. This releases a small amount of energy quickly, enough to keep contracting for a short time, but it is incomplete and the lactic acid builds up.",
        },
        {
          move:
            "Link the lactic acid to the oxygen consumed after the race.",
          why:
            "The lactic acid is carried to the liver and processed using oxygen. The extra oxygen taken in after exercise, the oxygen debt, is what the continued heavy breathing supplies.",
        },
      ],
      answer:
        "The sprinting muscles need ATP faster than oxygen can be delivered, so they convert glucose to lactic acid anaerobically. After the race, the lactic acid is transported to the liver and processed using oxygen, so breathing stays fast to repay the oxygen debt.",
    },
    {
      id: "w2",
      prompt:
        "Two flasks contain the same amount of yeast and glucose. Flask A is sealed; flask B has air bubbled through it. After several hours, flask A smells of ethanol and flask B does not. Explain the difference.",
      steps: [
        {
          move:
            "State the difference in oxygen availability between the two flasks.",
          why:
            "Flask B is aerated, so oxygen is continuously supplied. Flask A is sealed, so the oxygen already present is used up and not replaced.",
        },
        {
          move:
            "Predict the pathway each culture uses once its oxygen status is established.",
          why:
            "With oxygen available, yeast respires aerobically and produces carbon dioxide and water. Without oxygen, it ferments glucose to ethanol and carbon dioxide.",
        },
        {
          move:
            "Connect the product to the observation and explain why the difference is not a difference in the yeast itself.",
          why:
            "Ethanol is the product of the anaerobic route, so it accumulates only in flask A. Both flasks contain the same organism; the pathway changed because the conditions changed.",
        },
      ],
      answer:
        "Flask B has oxygen, so its yeast respires aerobically and does not accumulate ethanol. Flask A runs out of oxygen, so the yeast ferments glucose to ethanol and carbon dioxide. The same organism uses a different pathway because the oxygen supply differs.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Respiration is another word for breathing.",
      whyItFails:
        "Breathing moves air into and out of the lungs. Respiration is the enzyme-controlled release of energy from glucose inside cells. A plant, a fungus or a bacterium respires without lungs, so breathing cannot be the process itself.",
      correction:
        "Use 'breathing' or 'ventilation' for the movement of air, and 'respiration' for the chemical pathway in cells. If the explanation names lungs as the site, it is describing breathing, not respiration.",
      contrast: {
        wrong: "respiration is the movement of air in and out of the lungs",
        right: "breathing supplies oxygen; respiration releases energy from glucose in cells",
      },
    },
    {
      id: "m2",
      belief: "Anaerobic respiration releases no energy at all.",
      whyItFails:
        "Anaerobic respiration releases less energy per glucose molecule than aerobic respiration, not zero. It breaks glucose down only part of the way, so the product still contains chemical energy, but the energy released is enough to keep a muscle contracting for a short burst.",
      correction:
        "Compare the yield rather than treating the route as all-or-nothing. Both routes release energy; aerobic releases more because glucose is broken down completely.",
      contrast: {
        wrong: "without oxygen, respiration stops and no energy is released",
        right: "without oxygen, glucose is partly broken down and a small amount of energy is released",
      },
    },
    {
      id: "m3",
      belief: "Plants photosynthesise and do not respire.",
      whyItFails:
        "Plants respire continuously, just as animals do. Photosynthesis produces glucose and oxygen only in the light, while respiration uses glucose and oxygen all the time. In darkness, photosynthesis stops and respiration continues, so the plant takes in oxygen and releases carbon dioxide.",
      correction:
        "Treat photosynthesis and respiration as two separate processes that can run at the same time. In daylight, the rate of photosynthesis may exceed the rate of respiration, so the plant has a net release of oxygen; at night, only respiration continues.",
      contrast: {
        wrong: "plants only respire at night and only photosynthesise by day",
        right: "plants respire all the time; photosynthesis adds another process in the light",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A cyclist climbs a steep hill and then stops at the top, still breathing rapidly. Explain why the breathing rate does not return to normal immediately.",
      hint:
        "What substance built up in the leg muscles during the climb, and what does the body need oxygen for afterwards?",
      answer:
        "The climb demanded energy faster than oxygen could be supplied, so the leg muscles produced lactic acid anaerobically. After stopping, the body still needs extra oxygen to process the lactic acid in the liver, so breathing remains fast until the oxygen debt is repaid.",
      feedback: {
        correct:
          "You linked the continued breathing to the processing of lactic acid, not simply to the muscles being tired.",
        incorrect:
          "The muscles are not 'full of air'. Think about what accumulated when oxygen was short, and where it is processed afterwards.",
      },
    },
    {
      id: "p2",
      prompt:
        "A sealed flask of yeast and glucose is left for a day. Explain why the amount of ethanol stops increasing once the yeast has used up all the oxygen and the glucose is also exhausted.",
      hint:
        "Fermentation needs a substrate. What happens to the glucose, and what happens to the pathway when there is no glucose left?",
      answer:
        "The yeast ferments glucose to ethanol and carbon dioxide only while glucose remains. Once the glucose is used up, the substrate for the pathway is gone, so no more ethanol is produced. The yeast may also be inhibited by the ethanol it has made.",
      feedback: {
        correct:
          "You identified the limiting substrate rather than assuming the yeast simply decides to stop.",
        incorrect:
          "Ethanol production needs glucose. Trace what happens to the glucose supply as fermentation continues.",
      },
    },
    {
      id: "p3",
      prompt:
        "A plant is kept in darkness for two days. Will it take in oxygen, release carbon dioxide, or both? Explain.",
      hint:
        "Which process needs light, and which process continues in the dark?",
      answer:
        "It will take in oxygen and release carbon dioxide because respiration continues in the dark while photosynthesis has stopped. Without light, the plant cannot produce oxygen or remove carbon dioxide by photosynthesis, so the gas exchange of respiration is observable.",
      feedback: {
        correct:
          "You kept respiration running in the dark and removed photosynthesis from the explanation.",
        incorrect:
          "Photosynthesis depends on light; respiration does not. Decide which process is still running at night.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why a muscle cell can keep releasing energy during a short sprint even though its oxygen supply is limited. Your answer should name the pathway, its product, and why the process cannot continue indefinitely.",
      modelAnswer:
        "The muscle cell uses anaerobic respiration, converting glucose to lactic acid without oxygen. This releases a small amount of energy quickly, which allows the muscle to keep contracting for a short time. It cannot continue indefinitely because the breakdown is incomplete, the lactic acid accumulates and lowers the cell's conditions, and the lactic acid must eventually be processed using oxygen. The oxygen debt is repaid after the sprint.",
      marking: [
        "Names anaerobic respiration and its product, lactic acid.",
        "Explains that the route releases less energy per glucose molecule because the breakdown is incomplete.",
        "Explains why the process is short-term: lactic acid accumulation and the need for oxygen to process it.",
        "Distinguishes this from aerobic respiration, which uses oxygen and releases more energy.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Write the word equation for aerobic respiration.",
      modelAnswer: "glucose + oxygen → carbon dioxide + water",
      marking: [
        "Names glucose and oxygen as the reactants.",
        "Names carbon dioxide and water as the products.",
      ],
      check: {
        accepted: [
          "glucose + oxygen → carbon dioxide + water",
          "glucose + oxygen -> carbon dioxide + water",
          "glucose plus oxygen produces carbon dioxide and water",
          "glucose + oxygen = carbon dioxide + water",
        ],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "In which organelle does most of the aerobic respiration of a eukaryotic cell take place?",
      modelAnswer: "mitochondria",
      marking: [
        "Names the mitochondrion rather than the nucleus or cytoplasm alone.",
        "Recognises that the organelle is the site of the later stages of aerobic respiration.",
      ],
      check: { accepted: ["mitochondria", "mitochondrion"] },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "Name the product of anaerobic respiration in yeast that is responsible for the smell of a fermented culture.",
      modelAnswer: "ethanol",
      marking: [
        "Names ethanol, not lactic acid.",
        "Recognises that carbon dioxide is also produced but is not the smell.",
      ],
      check: { accepted: ["ethanol", "alcohol", "ethyl alcohol"] },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A patient has a condition that damages the cristae of the mitochondria in muscle cells. Predict how this will affect the patient's ability to sustain exercise, and explain your prediction using the link between structure and function.",
      whyItTransfers:
        "The lesson explains mitochondrial folding in a healthy cell. Here the same structure is damaged, so the learner must reason from the lost surface area to a reduced capacity for aerobic respiration, rather than recall the normal function by name.",
      answer:
        "The folded cristae give the inner membrane a large surface area for the enzymes and electron carriers of aerobic respiration. If the folds are damaged, that surface area is reduced, so the cell can transfer less energy aerobically per unit time. The patient will tire more quickly during sustained exercise and will rely more on anaerobic respiration, producing lactic acid and building an oxygen debt sooner.",
      marking: [
        "Links cristae to a large surface area for aerobic respiration.",
        "Explains that reduced surface area lowers the rate of aerobic energy release.",
        "Predicts reduced endurance or a greater reliance on anaerobic respiration.",
        "Does not claim that the mitochondria stop working entirely or that breathing is the damaged process.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State one difference between breathing and respiration.",
      answer:
        "Breathing is the movement of air into and out of the lungs; respiration is the enzyme-controlled release of energy from glucose inside cells.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Write the word equation for anaerobic respiration in animal muscle.",
      answer: "glucose → lactic acid, with a small amount of energy released.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why does a plant in darkness take in oxygen and release carbon dioxide?",
      answer:
        "Photosynthesis has stopped for lack of light, but respiration continues, so the plant uses oxygen and produces carbon dioxide.",
      when: "month-later",
    },
  ],

  summary: [
    "Respiration is the enzyme-controlled release of energy from glucose inside cells; breathing only supplies oxygen and removes carbon dioxide.",
    "Aerobic respiration uses oxygen, breaks glucose down completely and releases more energy, producing carbon dioxide and water.",
    "Anaerobic respiration works without oxygen, releases less energy and produces lactic acid in muscle or ethanol and carbon dioxide in yeast.",
    "The oxygen debt is the extra oxygen taken in after exercise to process lactic acid; it explains why breathing stays fast after the effort ends.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every equation is written as a word equation in the text, and each diagram's direction and products are stated in its caption, so no meaning depends on an arrow or a colour.",
    },
    {
      need: "colour-vision",
      alternative:
        "Aerobic and anaerobic pathways are labelled by name and by their products as well as by colour, so the comparison survives a greyscale display.",
    },
    {
      need: "dyslexia",
      alternative:
        "The two pathways are separated into short sections with the same three prompts: reactants, products and energy yield, so the comparison is structured rather than buried in long paragraphs.",
    },
    {
      need: "motor",
      alternative:
        "All activities are typed or selected answers; no dragging of labels or molecules is required.",
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
        "All explanations, examples, practice and assessments are original to OpenMind.",
    },
    {
      sourceId: "gcse-biology-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for bioenergetics.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-08",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
