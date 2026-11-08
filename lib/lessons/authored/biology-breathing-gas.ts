import type { AuthoredLesson } from "../../lesson-contract";

// BREATHING IS OFTEN TAUGHT AS A LIST OF ORGANS AND A SENTENCE ABOUT OXYGEN
// GOING IN. That leaves three different processes fused into one: ventilation
// moves air, gas exchange diffuses gases across a surface, and cellular
// respiration releases energy in the mitochondria. This lesson keeps them
// apart, then shows why the alveolus is shaped the way it is and why breathing
// faster cannot repair a surface that has been destroyed. The calculations use
// minute ventilation because it makes "breathe faster" a quantity rather than
// an instruction.
export const BIOLOGY_BREATHING_GAS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "breathing-gas",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, gas exchange in humans: the respiratory system, alveoli and ventilation",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish ventilation, gas exchange and cellular respiration, and explain what each one does.",
      evidence:
        "The learner identifies ventilation as the bulk movement of air, gas exchange as diffusion across the alveolar wall, and respiration as the enzyme-controlled release of energy in cells, and can explain why a plant respires without lungs.",
    },
    {
      statement:
        "Explain how alveolar structure and ventilation together maintain steep concentration gradients for oxygen and carbon dioxide.",
      evidence:
        "The learner names the large surface area, thin moist barrier and capillary network, and explains that breathing replaces alveolar air while blood flow removes oxygen and brings carbon dioxide, so neither gradient disappears.",
    },
    {
      statement:
        "Interpret data on breathing rate and tidal volume, and predict how reduced surface area or a thicker diffusion barrier changes gas exchange.",
      evidence:
        "The learner calculates minute ventilation with correct units and explains why faster breathing cannot fully compensate for destroyed alveoli or a thickened alveolar wall.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells", "diffusion"],
    check: [
      {
        id: "d1",
        question: "What is the cell membrane, and why does a thin exchange surface matter?",
        answer:
          "The cell membrane is a thin, partially permeable boundary around the cell. A thin surface means substances have a short distance to diffuse across, so exchange can happen faster.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question: "What is net diffusion, and what happens when the concentrations on both sides become equal?",
        answer:
          "Net diffusion is the movement of particles from a region of higher concentration to a region of lower concentration, caused by random motion. When the concentrations are equal, particles still cross in both directions, but there is no net movement.",
        targets: ["diffusion"],
      },
    ],
  },

  introduction: {
    hook:
      "A person at rest breathes about twelve times a minute. During a hard run the rate can rise to thirty or forty, and each breath can be several times larger. The air still contains about 21% oxygen in both cases, so the runner is not breathing a richer mixture. What has changed is how often the air inside the lungs is replaced, and how hard the blood is being driven past it. The lungs are not balloons that fill with oxygen; they are a surface across which oxygen and carbon dioxide diffuse.",
    why:
      "Ventilation is the movement of air into and out of the lungs. Gas exchange is the diffusion of oxygen from the alveolar air into the blood, and of carbon dioxide from the blood into the alveolar air. Cellular respiration is the release of energy from glucose inside cells, which uses oxygen and produces carbon dioxide. Breathing supports respiration by maintaining the gradients that make diffusion continue, but breathing is not itself respiration. This lesson traces the whole route: air is pumped to the alveoli, gases diffuse across a thin moist barrier, blood carries them away, and the brain adjusts the pump when the blood's carbon dioxide concentration changes.",
  },

  explanation: [
    {
      heading: "Ventilation, gas exchange and respiration are three different jobs",
      paragraphs: [
        "Ventilation is the bulk movement of air from the atmosphere to the alveoli and back. It is mechanical: muscles change the volume of the thorax, which changes the pressure, which moves air. Gas exchange is a separate step that happens at the alveolar surface, where oxygen diffuses into the blood and carbon dioxide diffuses out. Cellular respiration is a third step, inside the mitochondria of every living cell, where glucose is broken down and energy is transferred to ATP.",
        "The three are linked but not interchangeable. A person can ventilate normally and still have poor gas exchange if the alveolar wall is thickened or the surface area is destroyed. A cell can respire without lungs at all, which is why a plant, a yeast cell and a bacterium can release energy while having no breathing system. The lungs exist to keep the blood's oxygen and carbon dioxide concentrations suitable for the cells that respire; they do not respire on the cells' behalf.",
      ],
    },
    {
      heading: "Ventilation is a pressure pump, not suction",
      paragraphs: [
        "During inhalation, the diaphragm contracts and flattens, and the external intercostal muscles contract to raise the ribs and sternum. Both movements increase the volume of the thoracic cavity. Because the same amount of gas now occupies a larger volume, the pressure inside the lungs falls below atmospheric pressure. Air flows from the higher-pressure atmosphere into the lower-pressure lungs. The lungs themselves have no muscle to pull air in; they are inflated by the pressure difference created around them.",
        "At rest, exhalation is mostly passive. The diaphragm relaxes, the ribs move down and in, and the elastic recoil of the lungs and chest wall reduces the thoracic volume. The pressure inside rises above atmospheric pressure, so air flows out. During forceful exhalation, the internal intercostal muscles and abdominal muscles contract to reduce the volume further. The same principle runs in reverse: a smaller volume produces a higher pressure, and air moves down the pressure gradient.",
        "This is why a puncture wound to the chest can be dangerous even if the airway is open. If air enters the pleural space, the pressure difference that keeps the lung expanded is lost, and the lung can collapse. The problem is not a lack of oxygen in the air; it is a failure of the pump that moves the air.",
      ],
    },
    {
      heading: "The alveolus is a surface built for diffusion",
      paragraphs: [
        "The lungs contain roughly 300 million alveoli, giving an internal surface area of about 70 square metres in an adult. That is far larger than the outside of the body because gas exchange depends on area: more membrane exposed to the gradient means more oxygen and carbon dioxide can cross each second. The alveolar wall and the capillary wall are each about one cell thick, so the total diffusion distance is extremely short. The surface is moist, because the gases must dissolve before they can diffuse, and it is surrounded by a dense network of capillaries that carries blood close to the air.",
        "Oxygen moves from the alveolar air, where its partial pressure is higher, through the alveolar wall and capillary wall, into the blood. Carbon dioxide moves in the opposite direction, from the blood to the alveolar air, because respiration has made its partial pressure higher in the blood arriving at the lungs. The direction is set by the gradient, not by the lungs pushing one gas in and the other out. The barrier is selectively permeable in the sense that it lets these small gases pass, but it is not a filter that decides which gas is useful.",
        "The gradient would fade if either side stopped being refreshed. Ventilation replaces the alveolar air, keeping alveolar oxygen high and carbon dioxide low. Blood flow carries oxygen away and brings more carbon dioxide, keeping the blood-side gradients steep. If a person stops breathing, alveolar oxygen falls and carbon dioxide rises; if the heart stops, blood flow stops and the gradients at the tissue and lung collapse. Both ventilation and circulation are therefore part of the exchange system, even though neither one is diffusion itself.",
      ],
    },
    {
      heading: "Blood, control and disease",
      paragraphs: [
        "Most oxygen is carried by haemoglobin inside red blood cells, with a small amount dissolved in plasma. Haemoglobin binds oxygen in the lungs and releases it in tissues where the partial pressure is lower. Carbon dioxide is carried mostly as hydrogencarbonate ions in plasma, with some dissolved and some bound to haemoglobin. These transport forms matter because they keep the free gas concentrations low on the blood side, which helps maintain the diffusion gradient.",
        "Breathing is controlled mainly by the medulla oblongata in the brainstem. Central chemoreceptors detect a rise in carbon dioxide and the corresponding fall in pH, and the medulla increases the rate and depth of breathing. Peripheral chemoreceptors in the carotid bodies and aortic arch also respond to changes in oxygen, carbon dioxide and pH. During exercise, carbon dioxide production and hydrogen ion concentration rise before arterial oxygen falls, so the increase in breathing is driven mainly by the need to remove carbon dioxide, not by a sudden shortage of oxygen in the blood.",
        "In a healthy person at sea level, haemoglobin is already almost fully saturated with oxygen at rest. Breathing faster during exercise therefore does not usually raise arterial oxygen saturation much further. It helps by replacing alveolar air and removing carbon dioxide, while the heart increases output and tissues extract more oxygen. This is why 'breathe faster' is not a complete explanation of exercise: ventilation, blood flow and tissue demand change together.",
        "Disease can break the chain at different points. In asthma, the bronchioles narrow and mucus can block them, so ventilation of the alveoli becomes uneven. In emphysema, the walls between alveoli are destroyed and many small air sacs merge into larger spaces, reducing the total surface area for diffusion. In pulmonary fibrosis, the alveolar wall becomes thicker, increasing the diffusion distance. Each disease changes a different factor in the same exchange equation, which is why the same symptom, breathlessness, can have different causes.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "An alveolus has a very large total surface area and a wall one cell thick, because a large area gives more space for gases to cross and a short distance lets them cross quickly. The moist surface allows oxygen and carbon dioxide to dissolve, and the surrounding capillaries keep blood close to the air so the gradient is maintained.",
      notation: "large surface area + thin moist wall + capillary network → fast diffusion",
      caption:
        "No single feature is enough. A large surface with a thick wall would still diffuse slowly; a thin wall with a tiny surface would exchange too little. The structure works as a set of linked adaptations.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "During inhalation, the diaphragm contracts and flattens while the external intercostal muscles raise the ribs. Thoracic volume increases because the chest cavity expands, so pressure inside the lungs falls below atmospheric pressure and air flows in. During resting exhalation, the muscles relax, elastic recoil reduces the volume, pressure rises and air flows out.",
      notation: "diaphragm contracts → thorax volume increases → pressure falls → air enters · muscles relax → volume decreases → pressure rises → air leaves",
      caption:
        "The cause is the pressure difference, not a force pulling air. The muscles change the volume; the pressure change does the rest.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "At the alveolar surface, oxygen diffuses from the alveolar air into the blood because its partial pressure is higher in the air than in the blood arriving at the lungs. Carbon dioxide diffuses from the blood into the alveolar air because respiration has raised its partial pressure in the blood. Blood flow carries oxygen away and brings more carbon dioxide, while ventilation replaces the alveolar air.",
      notation: "alveolus: high O₂ → blood: low O₂ · blood: high CO₂ → alveolus: low CO₂",
      caption:
        "Both gases move down their own gradients. The lungs do not pump oxygen into the blood; they maintain the conditions in which diffusion can continue.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A comparison of dry inhaled and exhaled air shows that oxygen falls from about 21% to about 16%, carbon dioxide rises from about 0.04% to about 4%, and nitrogen remains close to 78%. Exhaled air is also warmer and more humid. The oxygen has not been turned into carbon dioxide; some oxygen has been used in respiration, and carbon dioxide has been added by respiring cells.",
      notation: "inhaled: O₂ ≈ 21%, CO₂ ≈ 0.04% · exhaled: O₂ ≈ 16%, CO₂ ≈ 4% · N₂ ≈ 78% in both",
      caption:
        "The percentages are approximate and refer to dry air. The important comparison is the direction of change, not a claim that exhaled air is pure carbon dioxide.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "At rest, a learner breathes 12 times per minute with a tidal volume of 0.50 litres. During exercise, the learner breathes 30 times per minute with a tidal volume of 2.0 litres. Calculate the minute ventilation in each state and explain what the increase achieves.",
      steps: [
        {
          move:
            "Write the relationship: minute ventilation = breathing rate × tidal volume.",
          why:
            "The units must agree: breaths per minute multiplied by litres per breath gives litres per minute. Writing the relationship first prevents the common error of adding the two values.",
        },
        {
          move:
            "Calculate the resting value: 12 × 0.50 = 6.0 litres per minute.",
          why:
            "This is the volume moved into and out of the lungs each minute at rest. It is not the same as the volume reaching the alveoli, because some air remains in the airways, but it is the standard measure of ventilation.",
        },
        {
          move:
            "Calculate the exercising value: 30 × 2.0 = 60 litres per minute.",
          why:
            "The exercising ventilation is ten times the resting value. The increase comes from both a faster rate and a larger tidal volume, not from one alone.",
        },
        {
          move:
            "Explain the effect: more fresh air reaches the alveoli per minute, keeping alveolar oxygen high and carbon dioxide low, so the gradients for diffusion remain steep while respiring muscles use oxygen and produce carbon dioxide.",
          why:
            "The point is not that each breath contains more oxygen than air does at rest; the percentage is about the same. The point is that the alveolar air is replaced more often, and carbon dioxide is removed faster.",
        },
      ],
      answer:
        "Resting minute ventilation is 12 × 0.50 = 6.0 litres per minute. Exercising minute ventilation is 30 × 2.0 = 60 litres per minute. The increase replaces alveolar air more often, maintains a high alveolar oxygen partial pressure and a low carbon dioxide partial pressure, and therefore keeps the diffusion gradients steep while muscles respire faster.",
    },
    {
      id: "w2",
      prompt:
        "Explain why oxygen continues to diffuse from the alveolar air into the blood even though the blood already contains oxygen.",
      steps: [
        {
          move:
            "Compare the oxygen partial pressure in the alveolar air with that in the blood arriving at the lungs.",
          why:
            "Diffusion depends on a difference in concentration or partial pressure. The blood arriving at the lungs has returned from tissues where oxygen was used, so its oxygen partial pressure is lower than the fresh alveolar air.",
        },
        {
          move:
            "Describe the barrier the oxygen must cross and the form in which it travels.",
          why:
            "Oxygen dissolves in the moist film, diffuses through the alveolar wall and capillary wall, and enters the plasma. The barrier is very thin, so the distance is short and diffusion is fast.",
        },
        {
          move:
            "Explain why the blood-side concentration stays low enough for diffusion to continue.",
          why:
            "Haemoglobin binds most of the oxygen that enters the blood, removing it from the dissolved pool, and blood flow carries the red blood cells away. Both processes keep the free oxygen concentration in the arriving blood lower than in the alveolar air.",
        },
        {
          move:
            "Explain why the alveolar side is replenished.",
          why:
            "Ventilation replaces the air in the alveoli, restoring oxygen and removing carbon dioxide. Without that replacement, the alveolar oxygen partial pressure would fall and the gradient would weaken.",
        },
      ],
      answer:
        "Oxygen diffuses from the alveolar air into the blood because its partial pressure is higher in the fresh alveolar air than in the blood arriving at the lungs. The barrier is thin and moist, so oxygen crosses quickly. Haemoglobin binds the oxygen and blood flow carries it away, while ventilation replenishes the alveolar air, so the gradient is maintained rather than reaching equilibrium.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Breathing and respiration are the same process.",
      whyItFails:
        "Breathing moves air into and out of the lungs. Respiration is the enzyme-controlled release of energy from glucose inside cells. A plant or a yeast cell respires without lungs, so breathing cannot be the source of the energy.",
      correction:
        "Use ventilation or breathing for the movement of air, gas exchange for diffusion at the alveoli, and respiration for the chemistry inside cells. If an explanation says the lungs release energy from glucose, it has merged two processes.",
      contrast: {
        wrong: "the lungs respire to release energy from glucose",
        right: "ventilation supplies oxygen; cells respire and release energy from glucose",
      },
    },
    {
      id: "m2",
      belief: "Exhaled air contains no oxygen; all of it has been turned into carbon dioxide.",
      whyItFails:
        "Exhaled air still contains about 16% oxygen, compared with about 21% in inhaled air. Only part of the oxygen is used, and the carbon dioxide in exhaled air comes from respiration, not from oxygen being converted into it.",
      correction:
        "Compare the approximate percentages rather than treating the gases as all-or-nothing. Oxygen falls, carbon dioxide rises, and nitrogen is largely unchanged. The carbon dioxide is a product of respiration, not a transformed oxygen molecule.",
      contrast: {
        wrong: "exhaled air is pure carbon dioxide because all the oxygen has been used",
        right: "exhaled air still has oxygen, but less; carbon dioxide has increased",
      },
    },
    {
      id: "m3",
      belief: "The lungs pump oxygen into the blood, and breathing faster always raises the blood's oxygen percentage.",
      whyItFails:
        "Oxygen moves by diffusion down a partial-pressure gradient; the lungs do not have a pump for oxygen. In a healthy person at sea level, haemoglobin is already almost fully saturated at rest, so faster breathing does not usually raise arterial oxygen saturation much. It mainly removes carbon dioxide and helps maintain the gradient during exercise.",
      correction:
        "Explain gas exchange as diffusion, and treat ventilation as the process that maintains the gradient. During exercise, cardiac output and tissue oxygen extraction also increase; breathing faster is one part of the response, not a pump that forces more oxygen into already-saturated blood.",
      contrast: {
        wrong: "breathing faster pushes more oxygen into the blood, so saturation keeps rising",
        right: "oxygen diffuses down its gradient; faster breathing helps maintain that gradient and remove carbon dioxide",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Put these events of inhalation into the correct order and explain the link between each pair: air enters the lungs; the diaphragm contracts and flattens; thoracic volume increases; pressure inside the lungs falls below atmospheric pressure.",
      hint:
        "Start with the muscle, then ask what happens to the volume, then to the pressure, then to the air.",
      answer:
        "The diaphragm contracts and flattens, increasing thoracic volume. The larger volume lowers the pressure inside the lungs below atmospheric pressure. Air then flows from the higher-pressure atmosphere into the lower-pressure lungs. The sequence is: diaphragm contracts → thoracic volume increases → pressure falls → air enters.",
      feedback: {
        correct:
          "You followed the causal chain from muscle to volume to pressure to flow, rather than starting with the air.",
        incorrect:
          "Air does not enter because the lungs pull it. Start with the muscle that changes the volume, then use the pressure difference to explain the flow.",
      },
    },
    {
      id: "p2",
      prompt:
        "In an alveolus, the partial pressure of oxygen is 13.3 kPa. The blood arriving at the capillary has an oxygen partial pressure of 5.3 kPa. State the direction of oxygen diffusion and explain what keeps the blood-side value low.",
      hint:
        "Diffusion goes from higher to lower partial pressure. What binds oxygen in the blood, and what carries it away?",
      answer:
        "Oxygen diffuses from the alveolar air into the blood, from 13.3 kPa to 5.3 kPa. Haemoglobin binds the oxygen that enters the blood, and blood flow carries the red blood cells away, so the free oxygen partial pressure in the arriving blood stays lower than in the alveolar air.",
      feedback: {
        correct:
          "You used the numerical gradient to set the direction and then explained why the gradient is maintained.",
        incorrect:
          "The direction is from the higher partial pressure to the lower one. Then explain why the blood does not simply reach the same value: binding and blood flow remove oxygen.",
      },
    },
    {
      id: "p3",
      prompt:
        "A runner's breathing rate increases within the first minute of exercise, before arterial oxygen saturation has fallen. Explain what has triggered the increase and why it helps.",
      hint:
        "Which gas rises first as muscles respire faster, and which part of the brain detects it?",
      answer:
        "Carbon dioxide production rises as the muscles respire faster, and the medulla detects the resulting rise in carbon dioxide and fall in pH. It increases the rate and depth of breathing. This removes carbon dioxide faster and replaces alveolar air, helping to maintain the gradients for oxygen and carbon dioxide diffusion.",
      feedback: {
        correct:
          "You used carbon dioxide and the medulla rather than claiming that the blood has already run out of oxygen.",
        incorrect:
          "Arterial oxygen has not fallen yet. Think about the gas that rises first when respiration increases, and the brainstem's response to it.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain how the structure of an alveolus and the process of ventilation together maintain a steep concentration gradient for oxygen diffusion. Your answer should refer to surface area, diffusion distance, moisture and blood flow.",
      modelAnswer:
        "The alveolus has a very large total surface area and a wall one cell thick, so many oxygen molecules can cross a short distance. The moist surface allows oxygen to dissolve before diffusing. Ventilation replaces the alveolar air, keeping its oxygen partial pressure high, while blood flow removes oxygen from the capillary and brings blood with a lower oxygen partial pressure. Haemoglobin binding also keeps the free oxygen concentration in the blood low. Together these features maintain a steep gradient from alveolar air to blood, so net diffusion continues.",
      marking: [
        "Names the large surface area of the alveoli and links it to the amount of gas that can diffuse.",
        "Names the thin alveolar and capillary walls and links them to a short diffusion distance.",
        "Explains the role of moisture in allowing the gases to dissolve.",
        "Explains that ventilation and blood flow maintain the concentration or partial-pressure gradient.",
        "Does not claim that the lungs pump oxygen into the blood.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Name the dome-shaped muscle that contracts and flattens during inhalation.",
      modelAnswer: "diaphragm",
      marking: [
        "Names the diaphragm, not the intercostal muscles or the lungs.",
        "Recognises that the diaphragm is the muscle that changes thoracic volume, rather than the lungs themselves.",
      ],
      check: { accepted: ["diaphragm", "the diaphragm"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "State the direction in which carbon dioxide diffuses at the alveolar wall.",
      modelAnswer: "from the blood into the alveolar air",
      marking: [
        "Names the blood as the higher-carbon-dioxide side.",
        "Names the alveolar air as the lower-carbon-dioxide side.",
      ],
      check: {
        accepted: [
          "from the blood into the alveolar air",
          "from blood to alveolar air",
          "from the blood to the alveolar air",
          "blood to alveolus",
          "blood to alveolar air",
          "from blood to alveolus",
          "into the alveolus",
        ],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt:
        "A person breathes 15 times per minute with a tidal volume of 0.40 litres. Calculate the minute ventilation, including the unit.",
      modelAnswer: "6.0 litres per minute",
      marking: [
        "Multiplies breathing rate by tidal volume.",
        "States the answer as 6.0 litres per minute, not 6.0 litres.",
      ],
      check: {
        accepted: ["6", "6.0", "6 L/min", "6.0 L/min", "6 litres per minute", "6.0 litres per minute"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A patient with emphysema has destroyed alveolar walls, so many small alveoli have merged into fewer, larger air spaces. Predict how this affects the rate of oxygen diffusion, even if the patient increases their breathing rate, and explain your prediction.",
      whyItTransfers:
        "The lesson explains how surface area, diffusion distance and gradient maintenance work together in a healthy lung. Here the surface itself is damaged, so the learner must reason from the lost area to a reduced rate of diffusion and recognise the limit of compensation, rather than repeat the normal description.",
      answer:
        "The total surface area available for diffusion is reduced because many small alveoli have merged into larger spaces. A smaller surface area means fewer oxygen molecules can cross per unit time, so the rate of diffusion falls even if the gradient is maintained. Breathing faster can help replace alveolar air and keep the gradient steep, but it cannot restore the lost surface area. The patient is therefore likely to have lower blood oxygen and become breathless during exercise.",
      marking: [
        "Identifies the reduction in total alveolar surface area.",
        "Links the reduced area to a lower rate of diffusion.",
        "Recognises that faster breathing maintains the gradient but cannot restore surface area.",
        "Predicts lower blood oxygen or breathlessness, with a reason.",
        "Does not claim that the larger air spaces have a larger total surface area.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State two features of alveoli that make gas exchange efficient, and explain each one.",
      answer:
        "A large total surface area gives more space for gases to cross, and a wall one cell thick gives a short diffusion distance. The moist surface lets the gases dissolve, and the capillary network maintains the gradient.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why exhaled air still contains oxygen even though the body has been respiring.",
      answer:
        "Only part of the oxygen in each breath is used in respiration. Exhaled air contains about 16% oxygen, compared with about 21% in inhaled air, so it is not pure carbon dioxide.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A patient's alveolar walls become thicker. Explain what happens to the rate of diffusion and why.",
      answer:
        "A thicker wall increases the diffusion distance, so oxygen and carbon dioxide cross more slowly. The gradient may still exist, but the greater distance reduces the rate of diffusion.",
      when: "month-later",
    },
  ],

  summary: [
    "Ventilation moves air; gas exchange diffuses oxygen and carbon dioxide across the alveolar wall; cellular respiration releases energy from glucose inside cells.",
    "Inhalation happens because the diaphragm and external intercostal muscles increase thoracic volume, lowering pressure so air flows in. Resting exhalation is mainly elastic recoil.",
    "Alveoli have a large surface area, a thin moist wall and a dense capillary network, which together allow fast diffusion. Ventilation and blood flow maintain the gradients.",
    "Minute ventilation is breathing rate multiplied by tidal volume. Faster or deeper breathing helps maintain gradients, but it cannot restore surface area destroyed by emphysema or shorten a thickened fibrotic wall.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every diagram is described in words, including the direction of each gas and the sequence of ventilation. The data comparison is written as a sentence as well as a table, so no value depends on a visual layout.",
    },
    {
      need: "colour-vision",
      alternative:
        "Oxygen and carbon dioxide are identified by name and by the direction of their arrows, not by colour alone. The alveolar and blood sides are labelled in the text.",
    },
    {
      need: "dyslexia",
      alternative:
        "The three processes are separated into short sections with explicit headings. Ventilation is presented as a numbered causal chain, and the calculation is broken into one line per step.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed or selected. No dragging of labels, gases or organs is required.",
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
        "Scope cited against the published GCSE biology subject content for gas exchange in humans.",
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
