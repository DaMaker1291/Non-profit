import type { AuthoredLesson } from "../../lesson-contract";

// CIRCULATION IS OFTEN REDUCED TO A HEART DIAGRAM AND THE SENTENCE "ARTERIES
// CARRY OXYGENATED BLOOD". Neither explains why there are two circuits, why the
// left ventricle is thicker, or why a coronary blockage can stop a heart whose
// chambers are full of blood. This lesson treats the heart as two pumps in
// series, the vessels as a pressure-and-exchange system, and the coronary
// arteries as the heart's own supply. The calculations are small enough to
// check by hand so that cardiac output is understood as a product, not a number
// to recall.
export const BIOLOGY_CIRCULATION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "circulation",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, animal organisation and the circulatory system: the heart, blood vessels, blood and coronary heart disease",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Trace blood through the pulmonary and systemic circuits, naming the chambers, valves and main vessels, and explain why blood passes through the heart twice in one complete circuit.",
      evidence:
        "The learner follows a red blood cell from the vena cava to the aorta, places the lungs between the right and left sides, and explains that the two circuits serve different destinations at different pressures.",
    },
    {
      statement:
        "Relate the structure of arteries, veins and capillaries to the pressure, flow and exchange each vessel must support.",
      evidence:
        "The learner explains elastic walls and a narrow lumen in arteries, valves and skeletal-muscle pumping in veins, and a one-cell-thick wall and large total cross-sectional area in capillaries.",
    },
    {
      statement:
        "Use the cardiac cycle and the cardiac-output relationship to explain how heart rate and stroke volume change during exercise, and why a coronary artery blockage damages the heart muscle.",
      evidence:
        "The learner calculates cardiac output as stroke volume multiplied by heart rate, interprets a change in both factors, and explains that a coronary blockage reduces the blood supply to the myocardium rather than emptying the heart's chambers.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells", "pressure-fluids"],
    check: [
      {
        id: "d1",
        question:
          "What controls what enters and leaves a cell, and why can a substance that is too large not simply diffuse across it?",
        answer:
          "The cell membrane is a phospholipid bilayer with embedded proteins. It is selectively permeable: small molecules may diffuse through it, but a large or charged substance needs a channel, a carrier or a vesicle, so size and solubility limit simple diffusion.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question:
          "Why does a fluid flow from a region of higher pressure to a region of lower pressure, and what happens to flow if the resistance of the tube increases?",
        answer:
          "A pressure difference provides the force that moves the fluid. Flow increases with the pressure difference and decreases as resistance rises; a narrower tube or a longer tube has greater resistance.",
        targets: ["pressure-fluids"],
      },
    ],
  },

  introduction: {
    hook:
      "A heart can be full of blood and still be failing. In a myocardial infarction, the chambers may contain enough blood to pump, but the muscular wall itself is being starved of oxygen because one of the coronary arteries is blocked. The heart is not a bag that pushes whatever happens to be inside it; it is a muscular pump that needs its own blood supply, its own valves and a coordinated electrical signal. The same design explains why blood visits the lungs before it is sent around the body, and why the left ventricle has a much thicker wall than the right.",
    why:
      "The circulatory system is a transport network organised around a pressure difference. The right side of the heart receives deoxygenated blood from the body and pumps it to the lungs, where oxygen enters and carbon dioxide leaves. The left side receives oxygenated blood from the lungs and pumps it to the body. Because the blood passes through the heart on the way to the lungs and again on the way to the body, this is called double circulation. Arteries carry blood away from the heart under high pressure; veins return it at low pressure; capillaries are the exchange surface where the distance is short enough for diffusion. The cardiac cycle, valves and pacemaker keep that flow one-way, and cardiac output is the product of how much blood each beat ejects and how many beats occur each minute.",
  },

  explanation: [
    {
      heading: "Double circulation is two circuits in series",
      paragraphs: [
        "The heart has four chambers. The right atrium receives deoxygenated blood from the body through the superior and inferior vena cavae. It contracts and pushes blood through the tricuspid valve into the right ventricle. The right ventricle contracts and pushes blood through the pulmonary valve into the pulmonary artery, which divides and carries it to the left and right lungs. In the lungs, blood picks up oxygen and releases carbon dioxide across the alveolar-capillary membrane. Oxygenated blood returns through the pulmonary veins to the left atrium. It passes through the bicuspid, or mitral, valve into the left ventricle, which contracts and ejects it through the aortic valve into the aorta and around the systemic circulation. The blood then returns to the right atrium, and the circuit repeats.",
        "This is double circulation because the blood passes through the heart twice in one complete circuit: once on the pulmonary side and once on the systemic side. The two circuits are in series, not in parallel. The output of the right ventricle becomes the input of the left ventricle, so the two sides must pump the same volume over time. Their pressures are different, however. The pulmonary circulation is short and the lungs are delicate, so the right ventricle generates a lower pressure. The systemic circulation is long and must overcome greater resistance, so the left ventricle has a much thicker muscular wall. The septum separates the two sides so that oxygenated and deoxygenated blood do not mix in a healthy heart.",
        "The naming of arteries and veins follows direction, not oxygen content. An artery carries blood away from the heart; a vein carries blood towards it. The pulmonary artery carries deoxygenated blood away from the right ventricle to the lungs, and the pulmonary vein carries oxygenated blood back to the left atrium. Everywhere else in the systemic circuit the usual pattern holds, but the pulmonary vessels are the exception that proves the rule. A learner who uses colour alone to decide oxygen status will mislabel both of them.",
      ],
    },
    {
      heading: "Vessel structure follows pressure and exchange",
      paragraphs: [
        "Arteries receive blood directly from the heart during systole, so they must withstand a pressure wave without bursting. Their walls have a thick tunica media containing elastic fibres and smooth muscle, and their lumen is relatively narrow. Elastic recoil helps maintain pressure between beats: the wall stretches as blood is ejected and recoils as the ventricle relaxes, smoothing the flow. Smaller arteries and arterioles can constrict or dilate to change resistance and direct blood to different organs. The pulse is the expansion and recoil of an artery wall, not the blood itself pushing through a rigid tube.",
        "Veins carry blood back at low pressure. Their walls are thinner and less elastic, and their lumens are wider, so they offer less resistance and can hold a large volume of blood. Many veins, especially in the legs, contain pocket valves that prevent backflow when the pressure falls. These valves do not pump blood on their own; they work with the squeezing of surrounding skeletal muscles. When those muscles contract during walking, they compress the vein and push blood towards the heart; the valves close behind it. If a person stands still for a long time, the muscle pump is inactive, blood can pool in the legs and venous return falls. That is why movement helps maintain circulation.",
        "Capillaries are the exchange vessels. Their walls are one cell thick, so the diffusion distance between blood and tissue fluid is very short. They have a very small diameter, often barely wider than a red blood cell, and they branch into dense networks. Although each capillary is narrow, the total cross-sectional area of all capillaries is much larger than that of the aorta, so blood velocity falls. Slower flow gives more time for diffusion. Oxygen, carbon dioxide, glucose, amino acids, ions, hormones and urea move between blood and tissues across the capillary wall. The capillary itself does not actively push most of these substances; it provides a thin, moist surface and a concentration gradient.",
        "The three vessel types are not interchangeable. An artery has to survive high pressure and maintain it; a vein has to return a large volume at low pressure; a capillary has to exchange quickly. A diagram that draws all three as the same tube with different labels misses the reason their structures differ.",
      ],
    },
    {
      heading: "The cardiac cycle is a coordinated sequence of pressure changes",
      paragraphs: [
        "The cardiac cycle describes one complete heartbeat. In diastole, the atria and ventricles relax. Pressure in the ventricles falls below atrial pressure, so the atrioventricular valves open and blood flows passively from the atria into the ventricles. The semilunar valves in the pulmonary artery and aorta are closed because aortic and pulmonary pressure is higher than ventricular pressure. Near the end of diastole, the atria contract and complete ventricular filling. This atrial systole contributes a final push, but most filling has already happened passively.",
        "In ventricular systole, the ventricles contract. Pressure rises rapidly, the atrioventricular valves close because ventricular pressure exceeds atrial pressure, and the first heart sound is produced. For a short time both sets of valves are closed and the ventricles contract against a fixed volume. When ventricular pressure exceeds the pressure in the aorta and pulmonary artery, the semilunar valves open and blood is ejected. As the ventricles relax, pressure falls, the semilunar valves close to prevent backflow, and the second heart sound is produced. The cycle then returns to diastole. The valves are passive: they open and close because of the pressure difference across them, not because a muscle pulls them open.",
        "The rhythm is initiated by the sinoatrial node, the pacemaker, in the wall of the right atrium. It generates an electrical impulse that spreads through the atria, causing them to contract, and reaches the atrioventricular node. The impulse is delayed briefly so the atria can empty before the ventricles contract, then travels down the bundle of His and the Purkinje fibres to the ventricular muscle. This delay is functionally important: if the ventricles contracted at the same instant as the atria, they would not be filled. The pacemaker sets the resting rate, while the autonomic nervous system and hormones such as adrenaline modify it during exercise or stress.",
        "Cardiac output is the volume of blood pumped by one ventricle in one minute. It is calculated as stroke volume multiplied by heart rate. Stroke volume is the volume ejected in one beat, and heart rate is the number of beats per minute. If stroke volume is 70 millilitres and heart rate is 70 beats per minute, cardiac output is 4,900 millilitres per minute, or 4.9 litres per minute. During exercise, both factors can rise: the heart beats faster and each beat may eject more blood because the ventricles fill more completely and contract more forcefully. The body also redistributes blood, sending a greater share to skeletal muscle and less to the digestive system, but the total output still has to be sufficient to meet the increased demand.",
      ],
    },
    {
      heading: "The heart muscle needs its own blood supply",
      paragraphs: [
        "The blood inside the ventricles does not nourish the ventricular muscle. The myocardium is too thick for oxygen to diffuse from the chamber to every muscle cell, so it is supplied by the coronary arteries, which branch from the aorta just above the aortic valve. The right coronary artery and the left coronary artery, with its circumflex and anterior interventricular branches, run over the surface of the heart and send smaller vessels into the muscle. Coronary veins collect the deoxygenated blood and return it to the right atrium through the coronary sinus. This is a separate circulation from the pulmonary and systemic circuits, even though it branches from the aorta.",
        "If a coronary artery is narrowed by atherosclerosis, the muscle downstream receives less oxygen, especially when demand rises. The result can be angina, a crushing chest pain brought on by exertion and relieved by rest, because the narrowed vessel can supply enough blood at rest but not during exercise. If the plaque ruptures and a blood clot completely blocks the artery, the muscle cells beyond the blockage are deprived of oxygen and may die. This is a myocardial infarction, commonly called a heart attack. The damage is to the heart muscle, not to the blood inside the chambers. A large infarct can weaken the pump and cause heart failure or an arrhythmia.",
        "Treatments act on different parts of this problem. Aspirin reduces platelet aggregation, statins lower cholesterol and stabilise plaques, and drugs such as beta-blockers reduce heart rate and oxygen demand. A stent can hold a narrowed artery open, and coronary artery bypass surgery can route blood around a blocked segment using a vessel from elsewhere in the body. These treatments restore or improve blood flow, but they do not remove the underlying risk. Smoking, high blood pressure, high LDL cholesterol, diabetes, obesity, physical inactivity and a family history all contribute, and prevention addresses those causes rather than waiting for a blockage.",
      ],
    },
    {
      heading: "Blood is a transport medium with several jobs",
      paragraphs: [
        "Blood is a liquid tissue. Plasma is the straw-coloured liquid that carries dissolved glucose, amino acids, ions, hormones, urea, carbon dioxide and plasma proteins. Red blood cells are packed with haemoglobin, which picks up oxygen in the lungs and gives it up in tissues where the oxygen concentration is lower. The biconcave shape gives a large surface area for diffusion and allows the cell to squeeze through capillaries. Mature human red blood cells have no nucleus, which leaves more room for haemoglobin but means they cannot divide or repair themselves; they are replaced from stem cells in the bone marrow.",
        "White blood cells defend the body. Some engulf pathogens by phagocytosis, while lymphocytes produce antibodies or coordinate other immune responses. Platelets are cell fragments that help form clots when a vessel is damaged. Blood also distributes heat: vasodilation of arterioles near the skin increases skin blood flow and heat loss, while vasoconstriction reduces it. This is why the skin can look flushed during exercise and pale in the cold. The circulatory system is therefore not only a delivery service for oxygen; it connects the respiratory, digestive, excretory, endocrine and immune systems.",
        "Carbon dioxide is carried in three main forms: dissolved in plasma, bound to haemoglobin, and as hydrogencarbonate ions after reacting with water. Most carbon dioxide is transported as hydrogencarbonate. The enzyme carbonic anhydrase, inside red blood cells, speeds up the reaction between carbon dioxide and water. This matters because carbon dioxide is produced continuously by respiring cells and must be removed efficiently; an accumulation would lower blood pH. The lungs remove it by diffusion into the alveoli, where the concentration is lower because ventilation continually replaces the air.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "Follow the path rather than the colours. Deoxygenated blood enters the right atrium through the vena cavae, passes the tricuspid valve into the right ventricle, and is ejected through the pulmonary valve into the pulmonary artery. After gas exchange in the lungs it returns through the pulmonary veins to the left atrium, passes the mitral valve into the left ventricle, and leaves through the aortic valve into the aorta. The septum separates the two sides, and the valves prevent backflow. The route is arranged this way because the lungs must receive blood before the body does, and the valves allow flow in one direction only.",
      notation:
        "vena cava -> right atrium -> tricuspid valve -> right ventricle -> pulmonary valve -> pulmonary artery -> lungs -> pulmonary vein -> left atrium -> mitral valve -> left ventricle -> aortic valve -> aorta -> body",
      caption:
        "The route shows why this is double circulation: the blood enters the heart twice, once before the lungs and once before the body. The pulmonary artery and pulmonary vein are named by direction, not by oxygen content.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "The cardiac cycle is a pressure sequence. During diastole the ventricles relax, the atrioventricular valves open and blood fills them. Atrial systole adds a final volume. During ventricular systole the atrioventricular valves close, pressure rises, the semilunar valves open when ventricular pressure exceeds arterial pressure, and blood is ejected. When the ventricles relax, the semilunar valves close and the cycle starts again. Each valve opens or closes because the pressure on one side becomes greater than the pressure on the other.",
      notation:
        "diastole: AV valves open, semilunar valves closed -> atrial systole: final filling -> ventricular systole: AV valves close, semilunar valves open -> ejection -> relaxation: semilunar valves close",
      caption:
        "The valves are passive gates. They open and close because the pressure on one side becomes greater than the pressure on the other, which is why the sequence of contraction and relaxation produces one-way flow.",
    },
    {
      id: "r3",
      kind: "biology.structure-function",
      body:
        "Compare the three vessel types by the job each must do. An artery carries blood away from the heart at high pressure, so it has a thick elastic wall, smooth muscle and a narrow lumen. A vein returns blood at low pressure, so it has a thinner wall, a wider lumen and valves that work with skeletal-muscle compression. A capillary exchanges materials, so its wall is one cell thick and its total cross-sectional area is large, which slows the blood and gives diffusion time. The elastic artery wall allows the vessel to stretch and recoil, the thin capillary wall allows a short diffusion distance, and the wide vein lumen allows a large volume to return at low pressure.",
      notation:
        "artery: thick elastic wall, narrow lumen, high pressure\nvein: thin wall, wide lumen, valves, low pressure\ncapillary: one-cell-thick wall, dense network, slow flow, exchange",
      caption:
        "The structures are solutions to different transport problems. A vessel is not an artery because it is red or a vein because it is blue; its identity depends on whether it carries blood away from or towards the heart.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A learner can estimate cardiac output without measuring it directly. Count the pulse for 30 seconds and multiply by two to obtain beats per minute, then use a stated stroke volume from the data provided. Repeat the measurement after two minutes of step-ups and again after recovery. The calculation is only as good as its assumptions: stroke volume is not measured by the pulse count, and a single reading may be affected by nerves, temperature or recent activity.",
      notation:
        "heart rate = beats in 30 s x 2\ncardiac output = stroke volume x heart rate\nrest: 70 mL x 70 bpm = 4.9 L/min\nexercise: 100 mL x 150 bpm = 15.0 L/min",
      caption:
        "The experiment separates what is measured from what is assumed. A pulse count gives heart rate, not stroke volume, so a cardiac-output estimate must state where the stroke volume came from and treat the result as an estimate.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Trace a red blood cell from the vena cava to the aorta. Name the chambers and valves it passes, and explain why it must visit the lungs before it is sent to the body.",
      steps: [
        {
          move:
            "Enter the right atrium and pass through the tricuspid valve into the right ventricle.",
          why:
            "The vena cavae return deoxygenated blood from the body to the right atrium. The tricuspid valve opens when atrial pressure exceeds ventricular pressure, so the blood moves into the right ventricle without flowing backwards.",
        },
        {
          move:
            "Leave through the pulmonary valve into the pulmonary artery and travel to the lungs.",
          why:
            "The right ventricle pumps the blood to the lungs, where the concentration gradients allow oxygen to enter and carbon dioxide to leave. This is the pulmonary circuit, and it operates at a lower pressure than the systemic circuit.",
        },
        {
          move:
            "Return through the pulmonary veins to the left atrium, pass the mitral valve into the left ventricle, and leave through the aortic valve into the aorta.",
          why:
            "The oxygenated blood has completed gas exchange and is now on the systemic side. The left ventricle generates the higher pressure needed for the long journey to the body, and the aortic valve prevents backflow into the ventricle when it relaxes.",
        },
      ],
      answer:
        "Vena cava -> right atrium -> tricuspid valve -> right ventricle -> pulmonary valve -> pulmonary artery -> lungs -> pulmonary vein -> left atrium -> mitral valve -> left ventricle -> aortic valve -> aorta. The blood must visit the lungs first because it arrives from the body deoxygenated; gas exchange there reloads oxygen and removes carbon dioxide before the left side pumps it to the tissues.",
    },
    {
      id: "w2",
      prompt:
        "A learner has a resting stroke volume of 70 mL and a resting heart rate of 70 beats per minute. During exercise, stroke volume rises to 100 mL and heart rate to 150 beats per minute. Calculate cardiac output at rest and during exercise, and explain the change.",
      steps: [
        {
          move:
            "Use the relationship cardiac output = stroke volume x heart rate, and keep the units consistent.",
          why:
            "Stroke volume is in millilitres per beat and heart rate is in beats per minute. Multiplying gives millilitres per minute because the beats cancel. Dividing by 1,000 converts the result to litres per minute.",
        },
        {
          move:
            "Calculate the resting value: 70 mL x 70 beats per minute = 4,900 mL per minute = 4.9 L per minute.",
          why:
            "This is the volume one ventricle ejects in a minute at rest. It is a product, not a property of the heart alone: a change in either factor changes the output.",
        },
        {
          move:
            "Calculate the exercise value: 100 mL x 150 beats per minute = 15,000 mL per minute = 15.0 L per minute.",
          why:
            "Both factors have risen. The heart is beating more often and ejecting more blood per beat, so the output is more than three times the resting value. The body needs the extra oxygen and must remove the extra carbon dioxide produced by exercising muscle.",
        },
        {
          move:
            "Compare the two values and state what the increase means rather than only subtracting.",
          why:
            "The increase is 10.1 L per minute, from 4.9 to 15.0. That extra flow delivers more oxygen and glucose and carries carbon dioxide away faster, while blood is also redistributed towards skeletal muscle and away from organs such as the digestive system.",
        },
      ],
      answer:
        "Resting cardiac output is 70 x 70 = 4,900 mL/min = 4.9 L/min. During exercise it is 100 x 150 = 15,000 mL/min = 15.0 L/min, an increase of 10.1 L/min. Both stroke volume and heart rate contribute, and the greater output supports the higher oxygen demand of exercising muscle.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Arteries always carry oxygenated blood and veins always carry deoxygenated blood.",
      whyItFails:
        "Vessel names describe direction, not oxygen content. The pulmonary artery carries deoxygenated blood away from the right ventricle to the lungs, and the pulmonary vein carries oxygenated blood back to the left atrium. The rule works for the systemic circuit but fails at the lungs, which is exactly where a learner is most likely to need it.",
      correction:
        "Ask which direction the vessel carries blood relative to the heart, then ask which circuit it belongs to. An artery leaves the heart; a vein returns to it. Oxygen content depends on whether the blood has just passed through the lungs or the tissues.",
      contrast: {
        wrong: "the pulmonary artery must carry oxygenated blood because it is an artery",
        right: "the pulmonary artery carries deoxygenated blood away from the heart to the lungs; the pulmonary vein returns oxygenated blood to the heart",
      },
    },
    {
      id: "m2",
      belief:
        "The heart is one pump that sends the same blood to the lungs and the body at the same pressure.",
      whyItFails:
        "The right and left ventricles are separate pumps in series. The right ventricle sends blood to the lungs at a lower pressure because the pulmonary circulation is short and the alveoli are delicate. The left ventricle sends blood around the much longer systemic circuit at a higher pressure, which is why its muscular wall is thicker. The septum keeps the two streams separate in a healthy heart.",
      correction:
        "Treat the heart as two pumps that must move the same volume over time but against different resistances. The right side serves the lungs; the left side serves the body. The pressures differ because the circuits differ, not because the blood is different.",
      contrast: {
        wrong: "both ventricles push blood into the same circuit at the same pressure",
        right: "the right ventricle pumps to the lungs at lower pressure; the left ventricle pumps to the body at higher pressure",
      },
    },
    {
      id: "m3",
      belief:
        "A heart attack happens because the heart chambers run out of blood, so the heart has nothing left to pump.",
      whyItFails:
        "The chambers can be full and the heart can still be damaged. The muscle of the heart is supplied by the coronary arteries, which branch from the aorta. A blockage in a coronary artery starves the muscle downstream of oxygen, so those muscle cells cannot contract. The problem is the muscle's own blood supply, not an empty chamber.",
      correction:
        "Distinguish the blood inside the heart from the blood supplying the heart. A coronary blockage causes ischaemia and can kill myocardium; this can weaken the pump or disturb its rhythm even while the chambers contain blood.",
      contrast: {
        wrong: "the heart stopped because there was no blood inside it",
        right: "a coronary artery was blocked, so the heart muscle downstream could not get oxygen and could not contract",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A blood sample is taken from the pulmonary artery and another from the pulmonary vein. Which sample has the higher oxygen concentration, and why?",
      hint:
        "Decide where each vessel is carrying blood: towards the lungs or away from them. The name of the vessel tells you the direction, not the oxygen level.",
      answer:
        "The pulmonary vein has the higher oxygen concentration because it carries blood from the lungs, where oxygen has diffused into the blood, back to the left atrium. The pulmonary artery carries deoxygenated blood from the right ventricle to the lungs.",
      feedback: {
        correct:
          "You used the direction of travel and the site of gas exchange rather than the artery-versus-vein label. That is the exception the question is testing.",
        incorrect:
          "The pulmonary artery is not oxygenated just because it is an artery. Follow the blood to or from the lungs and ask where gas exchange has just happened.",
      },
    },
    {
      id: "p2",
      prompt:
        "A patient has a stroke volume of 80 mL and a heart rate of 75 beats per minute. Calculate the cardiac output in litres per minute.",
      hint:
        "Multiply the volume per beat by the number of beats per minute, then divide by 1,000 to convert millilitres to litres.",
      answer:
        "80 mL x 75 beats per minute = 6,000 mL per minute = 6.0 litres per minute.",
      feedback: {
        correct:
          "You kept the units consistent and converted at the end. The answer is 6.0 litres per minute, not 6,000 litres.",
        incorrect:
          "Cardiac output is stroke volume multiplied by heart rate. Check whether your answer is in millilitres or litres before comparing it with a normal resting output.",
      },
    },
    {
      id: "p3",
      prompt:
        "The left ventricle has a thicker muscular wall than the right ventricle. Explain why this difference is useful rather than wasteful.",
      hint:
        "Compare the distance and resistance of the two circuits. Which ventricle has to generate the greater pressure?",
      answer:
        "The left ventricle pumps blood around the systemic circulation, which is long and has greater resistance, so it must generate a higher pressure. The right ventricle pumps to the lungs, a shorter circuit with lower resistance, so a thinner wall is sufficient. A thicker left wall provides the force needed without exposing the lungs to the same pressure.",
      feedback: {
        correct:
          "You linked wall thickness to the pressure needed by each circuit. The difference is functional, not an arbitrary asymmetry.",
        incorrect:
          "The left side is not thicker because it holds more blood. Think about the resistance of the body circuit compared with the pulmonary circuit and the pressure each ventricle must produce.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why the human circulatory system is described as a double circulation. Your answer should trace the route of blood through the heart and lungs, and explain one advantage of keeping the pulmonary and systemic circuits separate.",
      modelAnswer:
        "Blood passes through the heart twice in one complete circuit. Deoxygenated blood from the body enters the right atrium, passes the tricuspid valve to the right ventricle, and is pumped through the pulmonary artery to the lungs. Oxygenated blood returns through the pulmonary veins to the left atrium, passes the mitral valve to the left ventricle, and is pumped through the aorta to the body. The two circuits are in series, so the output of the right side becomes the input of the left. Keeping them separate allows the left ventricle to generate the high pressure needed for the body while the right ventricle pumps to the lungs at a lower pressure, and the septum prevents oxygenated and deoxygenated blood from mixing.",
      marking: [
        "States that blood passes through the heart twice in one complete circuit.",
        "Traces the pulmonary route with the right atrium, right ventricle, pulmonary artery, lungs and pulmonary vein.",
        "Traces the systemic route with the left atrium, left ventricle, aorta and body.",
        "Explains an advantage of separation, such as different pressures for the two circuits or prevention of mixing.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A patient has a stroke volume of 80 mL and a heart rate of 75 beats per minute. Calculate the cardiac output in litres per minute.",
      modelAnswer: "6 litres per minute",
      marking: [
        "Multiplies stroke volume by heart rate rather than adding the two values.",
        "Converts 6,000 mL per minute to 6 litres per minute and states the unit.",
      ],
      check: {
        accepted: [
          "6",
          "6 litres per minute",
          "6 liters per minute",
          "6 L/min",
          "6 l/min",
          "6 litres/min",
          "6 liters/min",
          "6000 mL/min",
          "6000 ml per minute",
        ],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Which blood vessel carries deoxygenated blood away from the heart to the lungs?",
      modelAnswer: "the pulmonary artery",
      marking: [
        "Names the pulmonary artery rather than the pulmonary vein.",
        "Recognises that the vessel is named by its direction from the heart, not by its oxygen content.",
      ],
      check: {
        accepted: [
          "the pulmonary artery",
          "pulmonary artery",
          "pulmonary",
          "the pulmonary arteries",
        ],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A 58-year-old experiences chest pain when climbing stairs, but the pain disappears after a few minutes of rest. A coronary artery is found to be narrowed. Explain why the pain is brought on by exertion, why it improves at rest, and why a stent may help without removing the underlying risk.",
      modelAnswer:
        "The narrowed coronary artery can still supply enough blood to the heart muscle at rest, but during exercise the heart beats faster and more forcefully and needs more oxygen. The narrowed vessel cannot increase flow enough, so the muscle becomes ischaemic and the pain of angina results. At rest, the demand falls and the supply is again sufficient, so the pain settles. A stent holds the artery open and improves blood flow to the muscle, which can relieve symptoms. It does not remove the atherosclerosis, high blood pressure, smoking, diabetes or high cholesterol that caused the plaque, so lifestyle changes and medication are still needed to reduce the risk of another blockage.",
      marking: [
        "Explains that exertion increases the heart's oxygen demand while the narrowed artery limits the increase in supply.",
        "Explains that rest lowers demand, so the same narrowed vessel can meet it and the pain resolves.",
        "Explains that a stent improves blood flow by holding the artery open.",
        "Recognises that a stent treats the narrowing but not the underlying risk factors or the disease process.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A baby is born with a small hole in the septum between the ventricles. Explain why this can cause tiredness during feeding, and why blood usually flows from the left ventricle into the right ventricle through the hole rather than in the opposite direction.",
      whyItTransfers:
        "The lesson explains double circulation and the pressure difference between the two ventricles. This unfamiliar clinical case requires the learner to apply both ideas: the left ventricle generates a higher pressure, and a connection between the circuits changes the volume and pressure the lungs and body receive.",
      answer:
        "The left ventricle normally produces a higher pressure than the right ventricle because it pumps to the systemic circuit. If there is a hole in the septum, blood can move from the higher-pressure left ventricle into the lower-pressure right ventricle during systole. That extra blood is pumped to the lungs, so the pulmonary circulation receives more blood than usual and the lungs may become congested. The heart has to work harder to move the extra volume, and the baby may tire during feeding because feeding requires sustained effort and oxygen. A small defect may cause few symptoms, but a larger one can lead to poor growth and heart failure. The direction is usually left-to-right because of the pressure gradient; if pulmonary pressure becomes very high, the direction can reverse, which is why the defect needs monitoring.",
      marking: [
        "Identifies the left ventricle as the higher-pressure side and uses that to explain the direction of flow.",
        "Explains that extra blood reaches the pulmonary circulation, increasing the work of the right side and the lungs.",
        "Links the extra work and oxygen demand to tiredness during feeding.",
        "Recognises that the size of the defect and the pulmonary pressure affect the severity, and that the direction can change.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Name the vessel that carries deoxygenated blood from the right ventricle to the lungs, and the vessel that returns oxygenated blood to the left atrium.",
      answer:
        "The pulmonary artery carries deoxygenated blood to the lungs; the pulmonary veins return oxygenated blood to the left atrium.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "State the equation for cardiac output and calculate it for a stroke volume of 60 mL and a heart rate of 80 beats per minute.",
      answer:
        "Cardiac output = stroke volume x heart rate. 60 mL x 80 beats per minute = 4,800 mL per minute = 4.8 litres per minute.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why can a coronary artery blockage damage the heart muscle even when the chambers are full of blood?",
      answer:
        "The coronary arteries supply the heart muscle itself. A blockage reduces the oxygen reaching the myocardium downstream, so those muscle cells cannot respire or contract, even though blood is present inside the chambers.",
      when: "month-later",
    },
  ],

  summary: [
    "Double circulation means blood passes through the heart twice: the right side pumps it to the lungs and the left side pumps it to the body.",
    "Arteries carry blood away from the heart under high pressure, veins return it at low pressure with valves, and capillaries provide a thin exchange surface with slow flow.",
    "The cardiac cycle is a pressure sequence in which the atrioventricular and semilunar valves open and close passively, while the sinoatrial node sets the rhythm.",
    "Cardiac output is stroke volume multiplied by heart rate; exercise raises both, and the coronary arteries must supply the working heart muscle itself.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The heart route is written as an ordered list of chambers, valves and vessels, and every diagram label is repeated in the surrounding prose, so the path can be followed without seeing the drawing.",
    },
    {
      need: "colour-vision",
      alternative:
        "Oxygenated and deoxygenated blood are identified by names and arrows, never by red and blue alone; the vessel comparison uses words as well as layout.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson is divided into short headed sections with key terms defined at first use, and the cardiac-output calculation is broken into numbered moves with the units stated at each step.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers can be typed; no valve, vessel or heart chamber has to be dragged, and no task is timed.",
    },
    {
      need: "low-vision",
      alternative:
        "The text and tables reflow at large sizes, and the route is available as a linear text sequence rather than only as a labelled diagram.",
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
        "All explanations, clinical examples, practice and assessments are original to OpenMind.",
    },
    {
      sourceId: "gcse-biology-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for animal organisation and the circulatory system.",
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
