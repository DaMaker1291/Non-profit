import type { AuthoredLesson } from "../../lesson-contract";

// NERVES ARE NOT WIRES WITH A DECISION AT THE END. A learner can recite
// “receptor, sensory, relay, motor, effector” and still believe that a reflex
// never reaches the brain, that an impulse jumps across a synapse as
// electricity, or that a reflex and a measured reaction are the same event.
// This lesson separates the pathway from the decision, makes the synapse a
// chemical junction with a direction, and treats reaction time as evidence
// collected under conditions rather than a fixed personal property.
export const BIOLOGY_NERVOUS_SYSTEM: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "nervous-system",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, homeostasis and response: the nervous system, reflex actions and reaction time",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Describe the pathway from a stimulus to a response, and distinguish the central nervous system from the peripheral nervous system.",
      evidence:
        "The learner names a receptor, a sensory neurone, a relay neurone, a motor neurone and an effector in order, and says where the relay neurone of a spinal reflex lies.",
    },
    {
      statement:
        "Explain how a nerve impulse crosses a synapse and why the junction is one-way.",
      evidence:
        "The learner describes neurotransmitter release, diffusion across the cleft and receptor binding, and explains that vesicles and receptors are on opposite sides.",
    },
    {
      statement:
        "Explain why a reflex is faster than a voluntary response, and interpret reaction-time evidence without claiming more than the data show.",
      evidence:
        "The learner traces a reflex arc, compares it with a voluntary pathway, calculates a change in reaction time, and names a control or repeated measure that would strengthen a conclusion.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells"],
    check: [
      {
        id: "d1",
        question:
          "What is a cell membrane, and why must a neurone have one?",
        answer:
          "A cell membrane is a selectively permeable boundary around the cell. A neurone needs it to separate the inside from the outside, maintain an electrical difference across the surface and control which ions and molecules enter or leave.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question:
          "Why does a cell need mitochondria and a supply of ATP?",
        answer:
          "Mitochondria release energy from respiration as ATP. ATP powers processes that need energy, including the pumps that maintain ion gradients and the release of neurotransmitter at a synapse.",
        targets: ["cells"],
      },
    ],
  },

  introduction: {
    hook:
      "A goalkeeper sees a penalty taken and moves before there is time to think about it. A hand touches a hot pan and pulls away before the person feels the burn. Neither response is magic and neither is a single wire running from the skin to the brain and back. The body detects a change, carries an electrical signal along a chain of specialised cells, crosses chemical junctions, and activates a muscle or gland. The speed comes from the route and from the small number of junctions, not from the brain deciding faster.",
    why:
      "The nervous system is a fast coordination system. A receptor detects a stimulus such as pressure, light, temperature or a chemical. A sensory neurone carries the resulting impulse towards the central nervous system, which consists of the brain and spinal cord. In a reflex, a relay neurone in the spinal cord can connect the sensory input to a motor neurone without waiting for the brain. The motor neurone carries the impulse to an effector, usually a muscle or a gland, which produces the response. A voluntary response uses the brain and therefore involves more processing and usually more synapses. At each synapse, the electrical impulse causes the release of a neurotransmitter, which diffuses across a small gap and binds to receptors on the next cell. The junction is one-way because transmitter is stored only on the sending side and receptors are found only on the receiving side. Reaction time measures the whole pathway, including detection, processing and movement, so it is evidence about the circuit rather than a direct reading of one neurone.",
  },

  explanation: [
    {
      heading: "A stimulus is detected, carried and answered",
      paragraphs: [
        "A stimulus is a change in the internal or external environment that a receptor can detect. Light-sensitive cells in the retina, temperature receptors in the skin and stretch receptors in a muscle are all receptors, but they detect different changes. The receptor does not decide what to do. It produces an electrical change that can start an impulse in a sensory neurone, and the information travels towards the central nervous system.",
        "The central nervous system is the brain and spinal cord. The peripheral nervous system is the network of nerves that carries signals between the central nervous system and the rest of the body. A nerve is a bundle of many neurones, not one long cell. Sensory neurones carry impulses towards the central nervous system, motor neurones carry impulses away from it, and relay neurones connect the two inside the central nervous system.",
        "A neurone has a cell body containing the nucleus, dendrites that receive signals from other cells, and an axon that carries the impulse away. The axon may be covered by a myelin sheath made by specialised cells. At the far end, the axon branches into terminals that form synapses with the next cell. The structure matters because a signal has to be received, conducted and passed on, and each part serves one of those jobs.",
        "The impulse is an electrical change across the neurone's membrane. At rest, the inside of the membrane is negatively charged relative to the outside. A sufficient stimulus opens ion channels, the charge difference briefly reverses, and a local current can trigger the next region of membrane. The impulse therefore travels along the axon rather than through the blood. A stronger stimulus does not make one impulse larger; it usually makes impulses occur more frequently.",
        "Myelin increases the speed of conduction because it insulates the axon and restricts the exchange of ions to small gaps called nodes of Ranvier. The impulse appears to jump from node to node, a process called saltatory conduction. A wider axon also conducts faster because there is less resistance along its interior. These structural features explain why a myelinated motor neurone can carry a signal at many metres per second while a small unmyelinated neurone is much slower. When myelin is damaged, conduction slows or fails, which is why demyelinating disease can cause weakness, numbness and poor coordination.",
      ],
    },
    {
      heading: "A synapse converts the signal from electricity to chemistry",
      paragraphs: [
        "A synapse is a small gap between two neurones, or between a neurone and an effector such as a muscle. The sending side is the presynaptic neurone, and its terminal contains vesicles filled with neurotransmitter. The receiving side is the postsynaptic membrane, which carries receptor proteins. The two cells do not touch, so the electrical impulse cannot simply continue along the same membrane.",
        "When an impulse reaches the presynaptic terminal, it causes calcium ions to enter. The rise in calcium causes vesicles to fuse with the membrane and release neurotransmitter into the synaptic cleft. The molecules diffuse across the short gap and bind to receptors on the postsynaptic membrane. Binding changes the permeability of that membrane, which can start a new electrical impulse in the next neurone or, depending on the signal, make it less likely to fire.",
        "The synapse is one-way because vesicles are found only at the presynaptic terminal and the matching receptors are found only on the postsynaptic membrane. Transmitter released into the cleft cannot travel backwards to a place that can release it. This direction is not a property of the chemical itself; it is a consequence of where the molecules and receptors are placed.",
        "Every synapse introduces a short delay because the signal must be released, diffuse and bind before the next cell responds. That delay is small, but a pathway with many synapses accumulates more of it than a pathway with few. A reflex arc has few synapses, which is one reason it is faster than a voluntary response that travels through the brain and involves more processing. The synapse also filters signals: weak inputs may not reach the threshold, while several inputs arriving together can sum to start an impulse.",
        "Neurotransmitter must be removed after it has acted, or the postsynaptic cell would remain stimulated. Some transmitter is taken back into the presynaptic neurone, and some is broken down by enzymes in the cleft. At the neuromuscular junction, acetylcholinesterase breaks down acetylcholine. Many drugs and poisons affect the nervous system by changing transmitter release, receptor binding or the removal of transmitter, which is why the synapse is a sensitive point in the circuit.",
      ],
    },
    {
      heading: "A reflex arc takes the shortest protective route",
      paragraphs: [
        "A reflex is an automatic, involuntary response to a stimulus. A reflex arc is the pathway that produces it: receptor, sensory neurone, relay neurone, motor neurone and effector. In a spinal reflex, the relay neurone is in the spinal cord rather than the brain. The response can therefore begin before the conscious brain has interpreted the stimulus, although the brain is informed by other branches of the sensory pathway.",
        "When a hand touches a hot pan, temperature and pain receptors in the skin are stimulated. A sensory neurone carries impulses to the spinal cord. A relay neurone connects to a motor neurone, which carries impulses to a muscle in the arm. The muscle contracts and the hand moves away. The person may feel the pain a moment later because the conscious sensation depends on the signal reaching the brain, but the protective movement has already started.",
        "The knee-jerk reflex is a useful exception to the general relay arrangement. A tap on the patellar tendon stretches a receptor in the thigh muscle. The sensory neurone synapses almost directly onto a motor neurone that causes the same muscle to contract. There is no relay neurone in the spinal cord for this monosynaptic reflex, so it is especially fast. The simplicity of the circuit is the reason the response is so consistent.",
        "A reflex is not always completely independent of the brain. Descending signals can inhibit or facilitate a reflex, and a person can sometimes override a withdrawal response by holding a position deliberately. The important claim is not that the brain is absent everywhere; it is that the brain is not required to initiate this protective response. The reflex arc can produce a response even when the conscious decision would be too slow.",
        "A voluntary response uses a different route. The sensory signal reaches the brain, the brain processes it and compares it with memory and intention, and a motor command travels to the effector. This allows choice and fine control, but it takes longer because it involves more synapses and more processing. A reflex and a voluntary action are therefore not distinguished by whether muscles are used; they are distinguished by the route that produced the movement.",
      ],
    },
    {
      heading: "Reaction time is measured under conditions",
      paragraphs: [
        "Reaction time is the time between a stimulus and the response to it. It includes detection by the sense organ, transmission to the central nervous system, processing, transmission to the effector and the movement itself. It is not a direct measurement of one synapse or one neurone. A ruler-drop test, a computer button test and a sports timing gate all measure the whole pathway, so they can be compared only when the conditions are similar.",
        "A simple ruler-drop test uses the distance the ruler falls before it is caught. The distance is related to time by the equation for free fall, d = ½gt², where g is about 9.8 m/s². A fall of 20 cm gives a time of about 0.20 s. This is an estimate: the ruler is released and caught by a person, the reaction includes movement, and the measurement has uncertainty. A mean of several trials is more reliable than one attempt because random variation partly cancels.",
        "A fair comparison changes one factor at a time. The same participant, hand, starting position, ruler and instruction should be used, and trials should be repeated in a randomised order. A control condition, such as a decaffeinated drink when testing caffeine, helps separate the effect of the substance from expectation. Practice, fatigue, sleep, background noise and age can all affect reaction time, so a difference between two conditions is not automatically caused by the factor the experimenter intended to test.",
        "A mean reaction time is a summary of several measurements, not a guarantee about one attempt. A difference between two means can be evidence of an association, but it does not by itself prove causation. Larger samples, repeated sessions and a control condition strengthen a conclusion. This is the same reasoning used when interpreting any biological measurement: the design determines what can be concluded, and a number without a method is not evidence.",
        "Reaction-time tests are used in research and in clinical assessment, but they are not a diagnosis on their own. A person with slowed conduction may have a longer reaction time, but so may a person who is tired, distracted or unfamiliar with the task. The test is useful when it is combined with a clinical history, examination and other evidence. The biological lesson is that a measured delay can have several causes, and the pathway must be tested rather than assumed.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A motor neurone has dendrites that receive signals, a cell body with the nucleus, a long axon that carries the impulse away and terminal branches that form synapses. The axon is wrapped in a myelin sheath that insulates it and restricts ion movement to the nodes of Ranvier, which allows the impulse to be conducted by saltatory conduction rather than continuously along every part of the membrane. The structure therefore serves speed and direction: signals enter at the dendrites, travel along the axon and leave at the terminals.",
      notation:
        "dendrites → cell body → axon (myelin sheath, nodes of Ranvier) → axon terminals → synapse",
      caption:
        "The myelin does not carry the signal itself. It reduces the membrane area that must be depolarised, so the impulse effectively jumps between nodes and arrives sooner.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "An impulse arriving at the presynaptic terminal causes calcium ions to enter, which causes vesicles to fuse with the membrane and release neurotransmitter into the synaptic cleft. The transmitter diffuses across the gap and binds to receptors on the postsynaptic membrane, so that a new electrical change can start in the next cell. The junction is one-way because transmitter vesicles are present only on the sending side and receptors are present only on the receiving side.",
      notation:
        "impulse → Ca²⁺ entry → vesicle fusion → neurotransmitter release → diffusion across cleft → receptor binding → postsynaptic impulse or inhibition",
      caption:
        "The chemical step is not a delay that the body forgot to remove. It is what allows the signal to cross a gap, be filtered and be directed one way.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "In a spinal withdrawal reflex, a sensory neurone carries the impulse from the receptor to the spinal cord, where a relay neurone connects to a motor neurone. The motor neurone carries the impulse to the effector, so the muscle contracts and the body moves away from the harmful stimulus before the brain has produced a conscious decision. The pathway is faster because it has fewer synapses and less processing than a voluntary response, not because the signal travels through a different kind of electricity.",
      notation:
        "receptor → sensory neurone → relay neurone (spinal cord) → motor neurone → effector → response",
      caption:
        "The brain is informed by other sensory branches, but it is not needed to start this protective movement. That is why the hand can move before the person feels the pain.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A reaction-time experiment compares a participant's mean response under two conditions while keeping the task the same. The ruler is held at the same starting point, released without warning, and caught with the same hand; the fall distance is converted to time; several trials are averaged; and the order of conditions is randomised. A control condition and a larger sample reduce the chance that expectation, practice or fatigue explains the difference. The conclusion must be limited to the effect measured in that sample, not promoted to a claim about all people.",
      notation:
        "same task + same hand + repeated trials + randomised order + control → mean reaction time → compare conditions → qualified conclusion",
      caption:
        "A reaction-time difference is evidence about the whole pathway, not a direct measurement of synaptic delay. The method is part of the claim.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A learner touches a hot pan and pulls their hand away before feeling the pain. Trace the reflex arc and explain why the response can begin before the conscious sensation.",
      steps: [
        {
          move:
            "Start at the receptor that detects the harmful stimulus.",
          why:
            "Temperature and pain receptors in the skin respond to the heat and start an impulse in a sensory neurone. Without a receptor there is no signal for the rest of the pathway to carry.",
        },
        {
          move:
            "Follow the sensory neurone to the spinal cord.",
          why:
            "The sensory neurone carries the impulse towards the central nervous system. The spinal cord is the coordination point for this spinal reflex, so the signal does not have to travel to the brain before a response is organised.",
        },
        {
          move:
            "Connect the sensory input to a motor output through a relay neurone.",
          why:
            "The relay neurone synapses with a motor neurone in the spinal cord. This connection allows the sensory signal to activate a motor command quickly, with fewer synapses than a pathway through the brain.",
        },
        {
          move:
            "Name the effector and the response.",
          why:
            "The motor neurone carries the impulse to a muscle in the arm. The muscle contracts and moves the hand away, which is the protective response. The brain receives sensory information through other branches and produces the conscious feeling of pain slightly later.",
        },
      ],
      answer:
        "Heat stimulates temperature and pain receptors in the skin. A sensory neurone carries the impulse to the spinal cord, where a relay neurone connects to a motor neurone. The motor neurone carries the impulse to an arm muscle, which contracts and pulls the hand away. The brain is informed by sensory pathways but is not required to initiate this spinal reflex, so the protective movement can begin before the conscious sensation of pain.",
    },
    {
      id: "w2",
      prompt:
        "A student records a mean reaction time of 0.25 s without caffeine and 0.20 s with caffeine. Calculate the percentage reduction and explain whether the result proves that caffeine improves reaction time.",
      steps: [
        {
          move:
            "Identify the baseline and the change.",
          why:
            "The without-caffeine mean is the comparison baseline, 0.25 s. The change is 0.25 − 0.20 = 0.05 s. Dividing by the baseline gives the proportional change, and multiplying by 100 expresses it as a percentage.",
        },
        {
          move:
            "Calculate the percentage reduction.",
          why:
            "0.05 ÷ 0.25 = 0.20, and 0.20 × 100 = 20%. The reaction time in this sample was 20% lower with caffeine. The calculation describes the size of the difference; it does not explain why the difference occurred.",
        },
        {
          move:
            "Separate evidence of an association from proof of causation.",
          why:
            "The student changed the condition and observed a difference, but expectation, practice, fatigue or the order of trials could also affect reaction time. A single comparison cannot rule those out, so the result is evidence of an association in this sample, not proof that caffeine caused the improvement in everyone.",
        },
        {
          move:
            "Name the design changes that would strengthen the conclusion.",
          why:
            "A placebo control, randomised order, repeated sessions and more participants would reduce confounding and chance. Those changes make the comparison fairer and allow a more confident causal claim, while still limiting the conclusion to the population and conditions tested.",
        },
      ],
      answer:
        "The reduction is (0.25 − 0.20) ÷ 0.25 × 100 = 20%. This sample reacted 20% faster with caffeine, but the result does not prove causation: expectation, practice, fatigue or trial order could explain part of the difference. A placebo control, randomised order, repeated trials and a larger sample would strengthen the conclusion.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A reflex does not involve the brain at all, so the brain has nothing to do with a reflex action.",
      whyItFails:
        "The brain is not required to initiate a spinal reflex, but sensory information is sent onwards and the brain becomes aware of the stimulus. Descending signals can also influence whether a reflex is strong or suppressed. Saying the brain is absent confuses “not needed to start the response” with “not involved in the experience”.",
      correction:
        "Say that the reflex arc can produce the protective movement without waiting for a conscious decision, while the brain is informed and may later modulate the response. The distinction is about the route that starts the movement, not about a brain that is switched off.",
      contrast: {
        wrong:
          "the brain is completely uninvolved, so you cannot feel the hot pan until much later",
        right:
          "the spinal reflex starts the movement without the brain, and the brain receives the sensory signal and produces the conscious feeling",
      },
    },
    {
      id: "m2",
      belief:
        "The impulse jumps across the synapse as electricity, or the two neurones touch so the current passes by contact.",
      whyItFails:
        "There is a physical gap between the neurones. The electrical impulse cannot cross it directly. The presynaptic terminal releases neurotransmitter, which diffuses across the cleft and binds to receptors on the postsynaptic membrane. That binding starts a new electrical change in the next cell.",
      correction:
        "Describe the synapse as a chemical junction. The signal is converted from electrical to chemical and back again. The conversion explains both the small delay and the one-way direction of transmission.",
      contrast: {
        wrong:
          "the electrical signal leaps the gap like a spark",
        right:
          "neurotransmitter is released, diffuses across the gap and binds to receptors, starting a new impulse in the next neurone",
      },
    },
    {
      id: "m3",
      belief:
        "A reflex and a reaction time are the same thing, so a fast reaction proves a person has a fast reflex.",
      whyItFails:
        "A reflex is an automatic response along a defined arc. A reaction-time test measures the whole pathway from stimulus detection to a voluntary movement, including decision and motor execution. A fast button press can reflect practice or anticipation, and a slow response can reflect attention or fatigue rather than a slow reflex.",
      correction:
        "Keep the terms separate. A reflex is a specific automatic circuit; reaction time is a measurement of the time taken by a task. The measurement can involve reflexes, but it is not a direct readout of one reflex arc.",
      contrast: {
        wrong:
          "my reaction time is fast, so my reflex arc must be faster than everyone else's",
        right:
          "my reaction time measures the whole task; a reflex is one automatic pathway that may or may not be the main contributor",
      },
    },
    {
      id: "m4",
      belief:
        "Myelin is the electrical signal, or it makes the impulse travel by carrying current itself.",
      whyItFails:
        "Myelin is an insulating sheath formed by specialised cells around the axon. It does not carry the impulse. It reduces ion movement across the membrane and restricts it to the nodes of Ranvier, so the impulse is regenerated at successive nodes. The axon membrane still produces the electrical change.",
      correction:
        "Describe myelin as insulation that changes where the impulse can be regenerated. Saltatory conduction is faster because fewer regions of membrane have to be depolarised, not because the myelin is a wire carrying electricity.",
      contrast: {
        wrong:
          "the myelin sheath is the wire that carries the electrical current",
        right:
          "the axon membrane carries the impulse, while myelin insulates it and makes the impulse jump between nodes",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Put these in the order of a spinal withdrawal reflex: motor neurone, receptor, effector, relay neurone, sensory neurone. Then say where the relay neurone is.",
      hint:
        "Start with the change that is detected, then follow the signal towards the spinal cord and out to the muscle.",
      answer:
        "Receptor → sensory neurone → relay neurone → motor neurone → effector. In a spinal withdrawal reflex the relay neurone is in the spinal cord, not the brain.",
      feedback: {
        correct:
          "You followed the signal from detection to response and placed the relay in the spinal cord.",
        incorrect:
          "The order runs from the receptor inwards to the spinal cord, through the relay, then out along the motor neurone to the effector. The relay is in the spinal cord.",
      },
    },
    {
      id: "p2",
      prompt:
        "Explain why a synapse transmits an impulse in one direction only.",
      hint:
        "Where are the neurotransmitter vesicles, and where are the receptors?",
      answer:
        "Neurotransmitter is stored in vesicles at the presynaptic terminal and released into the cleft. Receptors that respond to it are on the postsynaptic membrane. Because the vesicles and receptors are on opposite sides, the signal can cross from the presynaptic cell to the postsynaptic cell but not in the reverse direction.",
      feedback: {
        correct:
          "You located the direction in the structure of the junction, not in a property of the impulse.",
        incorrect:
          "The one-way direction comes from the arrangement: transmitter is released only from the presynaptic side, and receptors are only on the postsynaptic side.",
      },
    },
    {
      id: "p3",
      prompt:
        "A learner wants to test whether listening to music changes reaction time. Describe two features of a fair test and one conclusion that the data would not justify.",
      hint:
        "What should stay the same, what should be repeated, and what can a difference in means not prove on its own?",
      answer:
        "Use the same task, hand and starting position in both conditions; repeat trials and randomise the order. A difference in mean reaction time would not justify saying that music causes faster reactions in all people, because practice, expectation, fatigue and sample size could affect the result.",
      feedback: {
        correct:
          "You controlled the task and separated an observed difference from a universal causal claim.",
        incorrect:
          "A fair test keeps the task and conditions as similar as possible and repeats trials. A difference between two means is evidence in that sample, not proof of a universal effect.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain the pathway of a spinal withdrawal reflex and why it can produce a protective movement before the person consciously feels pain. Include the role of the relay neurone and the effector.",
      modelAnswer:
        "A harmful stimulus such as heat is detected by temperature and pain receptors in the skin. A sensory neurone carries impulses to the spinal cord. A relay neurone in the spinal cord connects the sensory input to a motor neurone. The motor neurone carries impulses to a muscle, the effector, which contracts and moves the body away. The brain is informed by sensory pathways, but it is not required to initiate this spinal reflex. The reflex arc therefore has fewer synapses and less processing than a voluntary response, so the protective movement can begin before the conscious sensation of pain is produced.",
      marking: [
        "Names receptor, sensory neurone, relay neurone, motor neurone and effector in the correct order.",
        "Places the relay neurone in the spinal cord and the effector at the muscle.",
        "Explains that the brain is informed but not required to initiate the reflex.",
        "Links the speed to fewer synapses or less processing than a voluntary response.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A student's mean reaction time is 0.25 s without caffeine and 0.20 s with caffeine. Calculate the percentage reduction in mean reaction time.",
      modelAnswer: "20%",
      marking: [
        "Finds the difference: 0.25 − 0.20 = 0.05 s.",
        "Divides the difference by the original mean and multiplies by 100: 0.05/0.25 × 100 = 20%.",
      ],
      check: {
        accepted: ["20%", "20", "20 per cent", "twenty per cent"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Which substance carries the signal across a synaptic cleft?",
      modelAnswer: "A neurotransmitter",
      marking: [
        "Names a neurotransmitter rather than an electrical impulse or a hormone.",
        "Recognises that it is released from the presynaptic neurone and binds to receptors on the postsynaptic membrane.",
      ],
      check: {
        accepted: [
          "neurotransmitter",
          "a neurotransmitter",
          "neurotransmitters",
          "chemical transmitter",
        ],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A student concludes that caffeine improves reaction time because the mean after caffeine was lower than the mean before it. Explain why this conclusion is not yet justified and describe how the experiment could be improved.",
      modelAnswer:
        "The student has measured an association in one sample, not proved causation. Reaction time can be affected by practice, fatigue, expectation, sleep, background noise, age and the order of the trials. The before-and-after design does not control for these factors. A stronger experiment would use a placebo control, randomise the order of the caffeine and control conditions, repeat the trials across several sessions, and include more participants. The conclusion should then be limited to the effect measured under those conditions rather than extended to all people.",
      marking: [
        "States that a difference between means is evidence of an association, not proof of causation.",
        "Names at least one confounding variable that could affect reaction time.",
        "Proposes a control, randomisation, repeated trials or a larger sample.",
        "Limits the conclusion to the sample and conditions tested.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A patient has a disease that damages the myelin sheath of motor neurones. Explain why their movements may become slower and weaker, and why a reflex may still be initiated even though the response is impaired.",
      whyItTransfers:
        "The lesson teaches myelin as insulation that speeds conduction and the reflex arc as a pathway that can start in the spinal cord. A demyelinating disease applies both ideas to a new clinical situation, so the learner must separate the initiation of a reflex from the quality of the motor response.",
      answer:
        "Myelin normally insulates the axon and restricts ion movement to the nodes of Ranvier, so the impulse is regenerated at successive nodes and conduction is fast. If myelin is damaged, current leaks across the membrane between nodes, the impulse may fail to reach threshold or may travel more slowly, and fewer motor impulses may reach the muscle. The muscle therefore receives a weaker or less well-timed signal, so movement can be slow, weak or poorly coordinated. A reflex can still be initiated because the sensory receptor, sensory neurone and spinal relay are separate from the damaged motor myelin. The reflex may produce a smaller or delayed movement, but the sensory input can still start the arc. The disease affects the quality of conduction, not the existence of the reflex pathway.",
      marking: [
        "Explains that myelin insulates the axon and enables saltatory conduction at the nodes of Ranvier.",
        "Explains that demyelination slows or blocks conduction, so fewer or less well-timed impulses reach the muscle.",
        "Separates initiation of the reflex in the sensory and relay pathway from transmission along the damaged motor neurone.",
        "Recognises that the reflex may still occur but the response is impaired.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Name the five parts of a spinal reflex arc in order.",
      answer:
        "Receptor → sensory neurone → relay neurone → motor neurone → effector. The relay neurone is in the spinal cord.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "What happens at a synapse when an impulse arrives?",
      answer:
        "Calcium ions enter the presynaptic terminal, vesicles release neurotransmitter into the cleft, the transmitter diffuses and binds to receptors on the postsynaptic membrane, and a new electrical change starts in the next cell.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why is a reflex faster than a voluntary response?",
      answer:
        "A reflex arc has fewer synapses and does not wait for processing in the brain; a voluntary response travels through the brain and involves more synapses and decision-making.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "What does a reaction-time measurement include, and why can it not prove the speed of one reflex?",
      answer:
        "It includes detection, transmission, processing and movement. It measures the whole task, so practice, attention, fatigue and the motor response can affect it; it is not a direct measurement of one reflex arc.",
      when: "month-later",
    },
  ],

  summary: [
    "Receptors detect stimuli, sensory neurones carry impulses to the central nervous system, and motor neurones carry impulses to effectors.",
    "A reflex arc uses a relay neurone in the spinal cord to produce a fast, automatic protective response without waiting for a conscious decision.",
    "At a synapse, neurotransmitter is released from the presynaptic terminal, diffuses across the cleft and binds to receptors on the postsynaptic membrane, making the junction one-way.",
    "Myelin speeds conduction by restricting ion movement to the nodes of Ranvier, and reaction time is a measured whole-pathway result that must be interpreted with its method.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The neurone, synapse and reflex arc are described as ordered sequences in prose as well as notation, so the pathway can be followed without seeing a diagram.",
    },
    {
      need: "colour-vision",
      alternative:
        "Sensory, relay and motor neurones are named in the text and captions; no part of the pathway depends on colour to distinguish it.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each section separates one mechanism, key terms are defined at first use, and the summary restates the pathway and the synapse rule in short sentences.",
    },
    {
      need: "motor",
      alternative:
        "All guided and assessment answers can be typed; no diagram labelling, dragging or timed interaction is required.",
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
