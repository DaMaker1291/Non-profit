import type { AuthoredLesson } from "../../lesson-contract";

// HOMEOSTASIS IS A LOOP, NOT A LIST OF GLANDS. A learner can name insulin,
// glucagon and ADH and still believe that insulin raises glucose because it is
// released after a meal, that hormones act faster than nerves, or that negative
// feedback means a bad outcome. This lesson makes the loop the object: a
// deviation is detected, a coordination centre compares it with a set point, an
// effector produces a response, and the response reduces the original deviation.
// The two worked examples follow glucose and water through the whole loop, and
// the transfer asks why a marathon runner's urine changes after heavy sweating.
export const BIOLOGY_HORMONES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "hormones",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, homeostasis and response: the endocrine system, negative feedback, blood glucose control, diabetes, water and temperature balance",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Compare nervous and endocrine coordination, and explain how a hormone reaches a target cell without affecting every cell in the body.",
      evidence:
        "The learner states that nerves act quickly and briefly through neurones, while hormones travel in blood more slowly and for longer, and that a target cell responds because it has a specific receptor.",
    },
    {
      statement:
        "Trace a negative-feedback loop through its receptor, coordination centre and effector, and explain why the response reduces the original deviation.",
      evidence:
        "The learner orders the stages of a glucose or water-balance loop correctly and explains that the correction is triggered by the deviation itself, not by a fixed timetable.",
    },
    {
      statement:
        "Use insulin, glucagon and ADH to explain blood glucose and water balance, and distinguish type 1 from type 2 diabetes.",
      evidence:
        "The learner explains why insulin lowers glucose and glucagon raises it, why ADH increases water reabsorption, and why type 2 diabetes can involve insulin resistance rather than a complete lack of insulin.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["nervous-system", "diffusion"],
    check: [
      {
        id: "d1",
        question:
          "Why can a hormone released into the blood reach a distant organ, and what decides whether that organ responds?",
        answer:
          "The circulatory system carries the hormone around the body. A cell responds only if it has a receptor shaped to that hormone, so the target is defined by the receptor rather than by the hormone travelling directly to one place.",
        targets: ["diffusion"],
      },
      {
        id: "d2",
        question:
          "Compare a reflex nerve response with a hormonal response in speed and duration.",
        answer:
          "A nerve impulse travels along neurones and produces a fast, short-lived response. A hormone travels in the blood, acts more slowly, and its effect usually lasts longer.",
        targets: ["nervous-system"],
      },
    ],
  },

  introduction: {
    hook:
      "After a meal, blood glucose rises. The pancreas releases insulin, cells take up more glucose and the liver stores some as glycogen, and the concentration falls back towards its set point. Hours later, glucose begins to fall too far. The pancreas releases glucagon instead, the liver breaks glycogen down, and glucose rises again. Neither hormone is in charge all the time. Each is released in response to a deviation, and each response reduces that deviation. That is negative feedback: not a negative outcome, but a correction that opposes the change.",
    why:
      "The endocrine system is a set of glands that release hormones into the blood. A hormone is a chemical messenger that binds to a specific receptor on a target cell and changes that cell's activity. Because the blood reaches almost every tissue, specificity comes from the receptor, not from the hormone knowing where to go. Nervous coordination is fast and brief because impulses travel along neurones; endocrine coordination is slower and longer because the hormone must be carried in the blood and then act on a cell. Homeostasis keeps internal conditions within a narrow range, and negative feedback is the main control pattern: a receptor detects a deviation, a coordination centre compares it with the set point, an effector responds, and the response reduces the deviation.",
  },

  explanation: [
    {
      heading: "The endocrine system uses blood-borne signals",
      paragraphs: [
        "An endocrine gland is a group of cells that secretes a hormone directly into the blood. The hormone travels dissolved in plasma and can reach almost every cell in the body, but only cells with the matching receptor respond. A receptor is a protein, often on the cell surface or inside the cell, that binds the hormone and triggers a response. This is why a hormone can affect the liver, muscle and fat without affecting a cell that has no receptor for it. The target is defined by the receptor, not by the route the blood takes.",
        "Hormones and nerves are two coordination systems with different strengths. A nerve impulse travels along a neurone and releases a neurotransmitter at a synapse, producing a rapid response that usually stops quickly. A hormone is secreted into the blood, carried around the body, and often acts for minutes or hours. The endocrine response is slower to start and slower to fade, which suits conditions that need sustained adjustment rather than a split-second reaction. A reflex arc can pull a hand away from a hot pan in a fraction of a second; insulin adjusting glucose after a meal takes much longer.",
        "The endocrine system is not a collection of independent glands. The hypothalamus links the nervous and endocrine systems, the pituitary gland releases several hormones that control other glands, and the pancreas, adrenal glands, thyroid and gonads respond to the body's needs. A hormone's effect depends on its concentration, the number of receptors on the target cell, and the presence of other hormones. This is why the same hormone can produce different responses in different tissues, and why a feedback loop can fail at the receptor as well as at the gland.",
        "Hormones are not only involved in reproduction. They control growth, metabolism, blood glucose, water balance, temperature, stress and many other functions. The word hormone does not imply a particular strength or speed; it names a chemical signal. The important questions are which gland releases it, what triggers that release, which cells have the receptor, and what change the target cell makes. Those questions turn a list of gland names into an explanation of how the body keeps a condition steady.",
      ],
    },
    {
      heading: "Negative feedback reverses a deviation",
      paragraphs: [
        "Homeostasis is the maintenance of a relatively stable internal environment despite changes outside the body. A set point is the value the body is trying to keep near, such as a blood glucose concentration, a core temperature or a water potential. A receptor detects the actual value and sends information to a coordination centre, usually the brain or a gland. The coordination centre compares the value with the set point and, if a deviation is large enough, signals an effector to respond. The response reduces the deviation, so the stimulus for the response becomes weaker.",
        "This loop is called negative feedback because the response opposes the change. If glucose rises, the response lowers it; if glucose falls, the response raises it. The word negative does not mean that the outcome is harmful. A thermostat is a useful model: it switches the heating on when the room is below the set temperature and off when the room is above it. The heater does not decide to stop because a fixed time has passed; it stops because the temperature has reached the set point. The same logic applies to insulin, glucagon and ADH.",
        "Positive feedback is different: the response increases the original change, moving the system further from the set point. It is less common in ordinary homeostasis, but it occurs in specific processes such as childbirth, where oxytocin intensifies contractions and the stronger contractions release more oxytocin. Positive feedback is not a failure by definition; it is a mechanism that needs an ending, such as the birth of the baby. Most of the loops in this lesson are negative, and identifying which kind a loop is matters more than memorising the label.",
        "A feedback loop can fail at any stage. A receptor may not detect the change, a gland may secrete too little or too much hormone, or a target cell may not respond. The result is a condition that stays outside the normal range. Diabetes is an example: in type 1 the pancreas cannot produce enough insulin, while in type 2 the target cells respond poorly to insulin. Both produce high blood glucose, but the failing part of the loop is different, so the explanation and the treatment are different too.",
      ],
    },
    {
      heading: "Insulin and glucagon keep blood glucose in range",
      paragraphs: [
        "After a meal containing carbohydrate, glucose is absorbed into the blood and the concentration rises. The pancreas detects the rise and the beta cells of the islets of Langerhans secrete insulin. Insulin binds to receptors on liver, muscle and fat cells and increases their uptake of glucose. It also stimulates the liver and muscle to convert glucose into glycogen and promotes the storage of excess energy as fat. The result is that glucose leaves the blood and enters cells, so the concentration falls back towards the set point.",
        "When blood glucose falls below the set point, the alpha cells of the pancreas secrete glucagon. Glucagon binds to liver cells and stimulates the breakdown of glycogen into glucose, which is released into the blood. It also promotes the production of glucose from other molecules. The result is that glucose enters the blood and the concentration rises. Insulin and glucagon are antagonistic hormones: they have opposite effects, and the balance between them depends on the current glucose concentration rather than on a fixed schedule.",
        "The liver is central to this loop because it can store glucose as glycogen and release it again. Skeletal muscle also stores glycogen, but muscle glycogen is used mainly by the muscle itself rather than released to raise blood glucose. Adrenaline can raise blood glucose during stress or exercise by promoting glycogen breakdown, and cortisol can raise it over a longer period. These hormones do not replace insulin and glucagon; they add inputs that help the body respond to demands such as fight, flight or prolonged stress.",
        "The concentration is not held at one exact number. It fluctuates around a set point as meals, exercise and fasting change the balance. The loop responds to the direction and size of the deviation, not to a single reading. A rise after a meal is expected; a failure to return towards the set point is the sign that the loop is not working. This is why a glucose measurement is interpreted against when the person last ate and against repeated measurements, not as a single universal number.",
      ],
    },
    {
      heading: "ADH, temperature and the limits of the loop",
      paragraphs: [
        "Water balance is controlled partly by ADH, antidiuretic hormone, released from the pituitary gland. If the body loses water through sweating or produces concentrated urine, the water potential of the blood falls. Osmoreceptors in the hypothalamus detect the change and stimulate the release of ADH. ADH travels to the kidneys and increases the reabsorption of water from the collecting ducts, so less water is lost in urine and the urine becomes more concentrated. The blood water potential rises back towards the set point.",
        "If a person drinks a large amount of water, the blood water potential rises and the osmoreceptors reduce ADH release. The kidneys reabsorb less water, so more dilute urine is produced and the excess water is removed. This is still negative feedback: the response opposes the original change. The loop does not make the kidneys produce a fixed volume of urine; it adjusts the volume and concentration to the body's water status. Alcohol and some drugs can affect ADH release, which is why they change urine output.",
        "Temperature control uses both nervous and endocrine signalling. The hypothalamus acts as the coordination centre, receiving information from thermoreceptors in the skin and blood. If the core temperature rises, the body increases heat loss through sweating and vasodilation, and reduces heat production. If it falls, the body reduces heat loss through vasoconstriction and increases heat production through shivering and metabolic activity. These responses are not all hormonal, which is a reminder that homeostasis is not the same thing as the endocrine system.",
        "The loop has limits. A fever, severe dehydration, a hormone-secreting tumour or a damaged kidney can overwhelm the correction, and the body may not return to the set point without treatment. Homeostasis is not a guarantee of health; it is a set of mechanisms that work within a range of conditions. Understanding the loop means being able to say which part failed when the value stays outside the range, rather than assuming that the body will always correct itself.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A target cell has a receptor protein whose binding site is shaped to one hormone, which allows the hormone to trigger a response only in cells that carry that receptor. The receptor is the reason the hormone is specific even though the blood carries it everywhere. When the hormone binds, the receptor changes shape and starts a signalling chain inside the cell, which alters the cell's activity.",
      notation:
        "endocrine gland → hormone in blood → target-cell receptor → intracellular response",
      caption:
        "The blood is the transport route; the receptor is the address. A hormone does not decide where to go, and a cell without the receptor does not respond.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "A negative-feedback loop begins when a receptor detects a deviation from the set point. The coordination centre compares the value with the set point and signals an effector, whose response reduces the deviation. Because the original stimulus becomes weaker, the response is switched down, which is why the loop stabilises rather than running away.",
      notation:
        "deviation → receptor → coordination centre → effector → correction → deviation reduced",
      caption:
        "The arrow from correction back to deviation is the feedback. Without it, the effector would keep responding after the condition had returned to normal.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "After a carbohydrate meal, blood glucose rises and the pancreas releases insulin because the beta cells detect the rise. Insulin increases glucose uptake by cells and glycogen storage in the liver, so blood glucose falls. If glucose falls too far, the pancreas releases glucagon because the alpha cells detect the low concentration; glucagon stimulates glycogen breakdown and glucose release from the liver, so blood glucose rises. The two hormones oppose each other and are released according to the direction of the deviation.",
      notation:
        "glucose rises → insulin → uptake + glycogen storage → glucose falls\n" +
        "glucose falls → glucagon → glycogen breakdown → glucose rises",
      caption:
        "Both arrows are negative feedback. Insulin does not raise glucose after a meal; it lowers it, while glucagon raises it when glucose is low.",
    },
    {
      id: "r4",
      kind: "biology.process",
      body:
        "When blood water potential falls, osmoreceptors in the hypothalamus stimulate ADH release from the pituitary because the change in water potential is the stimulus. ADH increases water reabsorption in the kidney collecting ducts, so more water returns to the blood and the urine becomes more concentrated. The rise in blood water potential reduces the stimulus for ADH, so secretion falls again.",
      notation:
        "water loss → lower blood water potential → osmoreceptors → ADH → kidney water reabsorption → urine concentrated → water balance",
      caption:
        "ADH is released when the body needs to conserve water. A large drink reverses the loop: ADH falls and the kidneys produce more dilute urine.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A person's blood glucose is 5.0 mmol/L before a meal. After the meal it rises to 7.8 mmol/L. Explain, using the feedback loop, how the body returns it towards the set point.",
      steps: [
        {
          move:
            "Identify the deviation and the receptor that detects it.",
          why:
            "The glucose concentration has risen above the set point. The pancreas contains cells that detect the change in blood glucose, so it is the receptor and coordination centre for this loop.",
        },
        {
          move:
            "Name the hormone released and the cells that release it.",
          why:
            "The beta cells of the pancreatic islets release insulin when glucose is high. Insulin is the signal that tells target cells to take up more glucose, so it is the effector hormone for lowering the concentration.",
        },
        {
          move:
            "Describe what insulin does to the liver, muscle and fat cells.",
          why:
            "Insulin increases glucose uptake into cells and stimulates the liver and muscle to store glucose as glycogen. It also promotes fat storage. These actions remove glucose from the blood, so the concentration falls.",
        },
        {
          move:
            "Explain why the response stops when glucose returns to the set point.",
          why:
            "As glucose falls, the stimulus for insulin release becomes weaker, so less insulin is secreted. This is negative feedback: the response has reduced the deviation, and the loop switches down rather than continuing until glucose is too low.",
        },
      ],
      answer:
        "The rise is detected by the pancreas. Beta cells release insulin, which increases glucose uptake and glycogen storage, so blood glucose falls. As the concentration returns towards the set point, insulin release decreases.",
    },
    {
      id: "w2",
      prompt:
        "A runner sweats heavily during a long race and produces a small volume of concentrated urine afterwards. Explain how ADH produces this response and why drinking water reverses it.",
      steps: [
        {
          move:
            "Start with the water loss and the change it produces in the blood.",
          why:
            "Sweating removes water, so the water potential of the blood falls and the concentration of solutes rises. This is the deviation that the osmoreceptors detect.",
        },
        {
          move:
            "Trace the signal from the hypothalamus to the pituitary and the kidney.",
          why:
            "Osmoreceptors in the hypothalamus detect the lower water potential and stimulate the pituitary to release ADH. ADH travels in the blood to the kidney, where it increases the permeability of the collecting ducts to water.",
        },
        {
          move:
            "Explain why the urine becomes concentrated.",
          why:
            "More water is reabsorbed from the collecting ducts into the blood, so less water remains in the urine. The urine therefore has a smaller volume and a higher concentration of solutes, and the blood water potential rises.",
        },
        {
          move:
            "Explain the reversal after drinking water.",
          why:
            "Drinking water raises the blood water potential. The osmoreceptors detect the change, ADH release falls, and the collecting ducts reabsorb less water. The kidneys produce a larger volume of dilute urine, which removes the excess water and returns the blood towards its set point.",
        },
      ],
      answer:
        "Heavy sweating lowers blood water potential. Osmoreceptors stimulate ADH release, ADH increases water reabsorption in the kidney, and the urine becomes small and concentrated. Drinking water raises the water potential, ADH falls, and more dilute urine is produced.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "Insulin raises blood glucose because it is released after a meal, when glucose is already high.",
      whyItFails:
        "The timing of release is not the same as the direction of the effect. Insulin is released in response to a rise, but its job is to lower the concentration by increasing glucose uptake and glycogen storage. Glucagon is the hormone that raises blood glucose by promoting glycogen breakdown.",
      correction:
        "Separate the trigger from the effect: a rise in glucose triggers insulin, and insulin lowers glucose. This is negative feedback. If insulin raised glucose, the loop would amplify the original deviation instead of correcting it.",
      contrast: {
        wrong:
          "insulin is released after eating, so it must increase blood glucose to match the meal",
        right:
          "insulin is released because glucose has risen, and it lowers glucose by helping cells take it up and store it",
      },
    },
    {
      id: "m2",
      belief:
        "Hormones are faster than nerves because they travel in the blood.",
      whyItFails:
        "Blood flow is fast, but a hormone must be secreted, diluted in the circulation, carried to a target and bind a receptor before it can act. A nerve impulse travels along a dedicated neurone and releases a neurotransmitter at a synapse, producing a response in milliseconds. Hormonal effects usually begin more slowly and last longer.",
      correction:
        "Compare the two systems by their route and duration: nerves are fast and short-lived, hormones are slower and longer-lasting. A hormone can still act quickly in absolute terms, but it is not the body's rapid reflex system.",
      contrast: {
        wrong:
          "a hormone reaches the whole body through the blood, so it must act faster than a reflex",
        right:
          "a reflex travels along neurones and acts in milliseconds; a hormone is carried in blood and usually acts more slowly but for longer",
      },
    },
    {
      id: "m3",
      belief:
        "Negative feedback means a negative or harmful outcome.",
      whyItFails:
        "Negative feedback means the response opposes the original change, not that the result is bad. When glucose rises, the response lowers it; when glucose falls, the response raises it. The loop is corrective, and it is the main reason internal conditions stay within a narrow range.",
      correction:
        "Read negative as opposite in direction. The response subtracts the deviation rather than adding to it. A thermostat switching off a heater is negative feedback even though the room stays comfortably warm.",
      contrast: {
        wrong:
          "negative feedback is bad for the body because it makes the condition worse",
        right:
          "negative feedback reverses the change: a rise triggers a response that lowers the value, and a fall triggers a response that raises it",
      },
    },
    {
      id: "m4",
      belief:
        "All diabetes is caused by a complete lack of insulin, so every person with diabetes needs insulin injections.",
      whyItFails:
        "Type 1 diabetes involves the immune destruction of pancreatic beta cells, so little or no insulin is produced. Type 2 diabetes usually begins with insulin resistance: the pancreas still produces insulin, but target cells respond poorly, and eventually insulin secretion may also decline. The two types share high blood glucose but have different mechanisms and treatments.",
      correction:
        "Ask where the loop has failed. In type 1, the signal is missing; in type 2, the signal is present but the target responds weakly. That is why type 2 can sometimes be managed with diet, activity and medication that improves insulin sensitivity, while type 1 requires insulin.",
      contrast: {
        wrong:
          "diabetes always means the pancreas makes no insulin, so insulin is the only possible treatment",
        right:
          "type 1 diabetes is a lack of insulin, while type 2 often starts with cells responding poorly to insulin that is still being made",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Which hormone lowers blood glucose, and which hormone raises it? Name the gland that releases both.",
      hint:
        "One is released by beta cells after a meal; the other is released by alpha cells when glucose is low.",
      answer:
        "Insulin lowers blood glucose and glucagon raises it. Both are released by the pancreas, from the beta and alpha cells of the islets of Langerhans.",
      feedback: {
        correct:
          "You paired each hormone with its direction of effect and named the pancreas as the source of both.",
        incorrect:
          "The two hormones have opposite effects. Insulin lowers glucose after a rise; glucagon raises it when glucose falls, and both come from the pancreas.",
      },
    },
    {
      id: "p2",
      prompt:
        "A person becomes cold. Put the following in order and explain the loop: effector response, thermoreceptors detect the fall, coordination centre in the hypothalamus, heat production increases, body temperature rises.",
      hint:
        "Start with the deviation, then the detector, the coordination centre, the effector and the correction.",
      answer:
        "Thermoreceptors detect the fall; the hypothalamus coordinates the response; effectors increase heat production, for example by shivering; body temperature rises towards the set point. The rise reduces the stimulus, so the response is switched down. This is negative feedback.",
      feedback: {
        correct:
          "You ordered the loop from deviation to correction and explained why the correction reduces the original stimulus.",
        incorrect:
          "Start with the change, not the response. The receptors detect the fall, the hypothalamus coordinates, the effectors produce heat, and the resulting rise reduces the stimulus for further heat production.",
      },
    },
    {
      id: "p3",
      prompt:
        "After a long period without drinking, a person's urine is small in volume and dark in colour. Explain the role of ADH in this response.",
      hint:
        "Water loss lowers blood water potential. Which receptors detect that, and what does ADH do to the kidney collecting ducts?",
      answer:
        "Water loss lowers blood water potential. Osmoreceptors in the hypothalamus stimulate ADH release from the pituitary. ADH increases water reabsorption from the kidney collecting ducts, so less water is lost in urine; the urine becomes small in volume and concentrated. The reabsorbed water raises blood water potential, reducing the stimulus for ADH.",
      feedback: {
        correct:
          "You traced the whole loop and linked ADH to water reabsorption, not to the production of water.",
        incorrect:
          "ADH does not make new water. It increases the reabsorption of water that the kidney would otherwise lose, which concentrates the urine and raises blood water potential.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain how negative feedback controls blood glucose after a carbohydrate meal. Include the receptor, the coordination centre, the hormone, the effector and the reason the response stops.",
      modelAnswer:
        "After a carbohydrate meal, glucose is absorbed into the blood and the concentration rises above the set point. The pancreas detects the rise and its beta cells release insulin. Insulin binds to receptors on liver, muscle and fat cells, increasing glucose uptake and stimulating the liver and muscle to store glucose as glycogen. As glucose leaves the blood, the concentration falls back towards the set point. The fall reduces the stimulus for insulin release, so less insulin is secreted and the response stops. This is negative feedback because the response opposes the original rise.",
      marking: [
        "Identifies the rise in blood glucose as the deviation and the pancreas as the detector and coordination centre.",
        "Names insulin as the hormone released by beta cells.",
        "Explains that insulin increases glucose uptake and glycogen storage in target cells.",
        "Explains that the fall in glucose reduces insulin release, so the response is self-limiting.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A person's blood glucose is 5.0 mmol/L. Insulin lowers it by 1.5 mmol/L. What is the new blood glucose concentration? Include the unit.",
      modelAnswer: "3.5 mmol/L",
      marking: [
        "Subtracts 1.5 from 5.0 rather than adding.",
        "Gives 3.5 with the unit mmol/L.",
      ],
      check: {
        accepted: [
          "3.5 mmol/L",
          "3.5",
          "3.5 millimoles per litre",
          "3.5 mmol per litre",
        ],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Which hormone increases water reabsorption in the kidney collecting ducts?",
      modelAnswer: "ADH",
      marking: [
        "Names ADH or antidiuretic hormone.",
        "Does not confuse it with insulin or glucagon.",
      ],
      check: {
        accepted: ["ADH", "antidiuretic hormone", "anti-diuretic hormone"],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A person with type 2 diabetes may have a high blood glucose concentration even though their pancreas still produces insulin. Explain how this is possible and why the problem is not simply that the pancreas makes no insulin.",
      modelAnswer:
        "In type 2 diabetes, the target cells respond poorly to insulin, a condition called insulin resistance. Insulin is still being produced, but it does not increase glucose uptake and glycogen storage effectively, so glucose remains high in the blood. The pancreas may initially compensate by producing more insulin, and over time the beta cells can become exhausted and insulin production may fall. The loop fails at the target-cell response as well as, eventually, at the gland. This is different from type 1 diabetes, where the immune system destroys the beta cells and little or no insulin is produced, so insulin must be injected.",
      marking: [
        "Identifies insulin resistance or a reduced response of target cells to insulin.",
        "Explains that insulin is still produced but does not lower glucose effectively.",
        "Recognises that beta cells may eventually become exhausted, so production can fall later.",
        "Contrasts this with type 1 diabetes, where insulin production is lost.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A marathon runner sweats heavily for several hours, then drinks a large volume of plain water. Explain how ADH changes across the race and after drinking, why the urine becomes more dilute, and why drinking seawater would not correct the dehydration.",
      whyItTransfers:
        "The lesson teaches ADH through a short dehydration example. A marathon applies the same loop to a different timescale and adds a second solute load, so the learner must transfer the receptor–hormone–effector logic and explain why water alone and seawater have different effects on water potential.",
      answer:
        "During the race, sweating lowers blood water potential. Osmoreceptors in the hypothalamus stimulate ADH release from the pituitary, and ADH increases water reabsorption in the kidney collecting ducts. Less water is lost in urine, so the urine is small in volume and concentrated, and blood water potential is conserved. After drinking plain water, blood water potential rises, ADH release falls, and the collecting ducts reabsorb less water, so a larger volume of dilute urine is produced. This is negative feedback in both directions. Seawater contains a high concentration of dissolved salts, so drinking it would lower the water potential of the blood further rather than raise it; the body would need to excrete the excess salt, which would require losing even more water, worsening the dehydration.",
      marking: [
        "Explains the rise in ADH during sweating and its effect on kidney water reabsorption.",
        "Explains the fall in ADH after drinking water and the production of dilute urine.",
        "Uses the idea of blood water potential rather than saying that ADH 'makes water'.",
        "Explains why seawater adds solutes and worsens the water imbalance.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State one difference between nervous and endocrine coordination.",
      answer:
        "Nervous coordination uses impulses along neurones and is fast and short-lived; endocrine coordination uses hormones carried in blood and is usually slower and longer-lasting.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "What are the three main parts of a negative-feedback loop?",
      answer:
        "A receptor detects the deviation, a coordination centre compares it with the set point, and an effector produces a response that reduces the deviation.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "What does insulin do to blood glucose, and what does glucagon do?",
      answer:
        "Insulin lowers blood glucose by increasing uptake and glycogen storage; glucagon raises it by stimulating glycogen breakdown and glucose release from the liver.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "Why can type 2 diabetes occur while the pancreas still produces insulin?",
      answer:
        "The target cells may respond poorly to insulin (insulin resistance), so glucose uptake remains low even though insulin is present; beta-cell exhaustion can later reduce production too.",
      when: "month-later",
    },
  ],

  summary: [
    "The endocrine system releases hormones into the blood; a target cell responds only if it has the matching receptor.",
    "Nervous coordination is fast and brief, while hormonal coordination is slower and longer-lasting.",
    "Negative feedback uses a receptor, coordination centre and effector to reverse a deviation from the set point.",
    "Insulin lowers blood glucose and glucagon raises it; ADH increases water reabsorption, and type 2 diabetes can involve insulin resistance rather than a complete lack of insulin.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each feedback loop is written as an ordered sentence as well as a notation line, so the stages and their direction are available without relying on arrows or layout.",
    },
    {
      need: "colour-vision",
      alternative:
        "Insulin, glucagon and ADH are distinguished by name and direction of effect, not by colour; the diagrams' captions state which arrow raises and which lowers the value.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson defines hormone, receptor, set point, negative feedback and insulin resistance at first use, and the summary repeats the loop and the two glucose hormones in short sentences.",
    },
    {
      need: "motor",
      alternative:
        "Every guided and assessment item can be answered by typing; no diagram needs to be dragged or labelled by hand, and no task is timed.",
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
        "All explanations, examples, practice, assessment and retrieval items are original to OpenMind.",
    },
    {
      sourceId: "gcse-biology-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for homeostasis and response.",
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
