import type { AuthoredLesson } from "../../lesson-contract";

// IMMUNITY IS NOT A WALL. A learner can list “skin, white blood cells,
// antibodies” and still believe that antibodies kill pathogens directly, that
// antibiotics work on viruses, or that a person becomes resistant to
// antibiotics rather than the bacteria. This lesson separates the layers: a
// non-specific barrier, phagocytosis that engulfs anything recognised as
// foreign, and a specific response in which a lymphocyte clone makes antibodies
// shaped to one antigen. Memory is what makes the second response faster, and
// vaccination is a controlled first exposure that creates that memory without
// the disease. Antibiotic resistance is evolution by selection in a bacterial
// population, not a change in the patient's body.
export const BIOLOGY_IMMUNE_HEALTH: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "immune-health",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, infection and response: communicable disease, plant and human defences, the immune system, vaccination and antibiotics",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Describe how pathogens cause disease and distinguish a non-specific defence from a specific immune response.",
      evidence:
        "The learner names the main pathogen groups, explains how one causes damage, and separates barriers such as skin and mucus from phagocytosis and antibody production.",
    },
    {
      statement:
        "Explain how phagocytes, lymphocytes, antibodies and memory cells deal with a pathogen, including why a second infection is usually faster.",
      evidence:
        "The learner orders phagocytosis, antigen recognition, antibody production and memory formation, and explains that memory cells allow a rapid secondary response.",
    },
    {
      statement:
        "Explain how vaccination produces immunity and why antibiotics work on bacteria but not viruses, including how antibiotic resistance evolves.",
      evidence:
        "The learner explains that a vaccine exposes the immune system to a harmless antigen, and that antibiotics select resistant bacteria rather than making the patient resistant.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells", "evolution"],
    check: [
      {
        id: "d1",
        question:
          "What is a cell, and why can a virus not reproduce without a host cell?",
        answer:
          "A cell is the basic structural and functional unit of a living organism, with a cell membrane and, in eukaryotes, a nucleus and organelles. A virus has genetic material and a protein coat but no cell machinery of its own, so it must use a host cell's ribosomes and enzymes to replicate.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question:
          "How does natural selection change the frequency of a trait in a population over generations?",
        answer:
          "Individuals vary; some variants survive and reproduce more successfully in the current environment; their inherited alleles become more common in later generations. Selection acts on populations, not by changing an individual during its lifetime.",
        targets: ["evolution"],
      },
    ],
  },

  introduction: {
    hook:
      "A child catches measles once and is usually protected for life. The first infection takes days to control: the immune system must recognise the virus, select the right lymphocytes and build an antibody response while the virus is replicating. The second exposure is different. Memory cells are already present, so the response begins sooner, produces more antibody and clears the virus before it causes the same illness. A vaccine borrows that memory without requiring the child to suffer the disease first. It presents an antigen in a form that cannot cause the disease, so the immune system learns the shape before the real pathogen arrives.",
    why:
      "A pathogen is an organism or virus that causes disease. Bacteria, fungi and protists are cellular; viruses are not cells and must replicate inside a host cell. The body has non-specific defences that act against many pathogens, such as skin, mucus, cilia and stomach acid. If a pathogen gets past them, phagocytes can engulf it, and lymphocytes can recognise a specific antigen. B lymphocytes produce antibodies shaped to that antigen, and some become memory cells. The first response has a lag because the right lymphocyte must be found and multiplied; the second is faster because memory cells are already waiting. Antibiotics attack bacterial structures or processes, so they do not affect viruses. Resistance arises when bacteria that already carry a resistance allele survive an antibiotic and reproduce, which is natural selection in the bacterial population.",
  },

  explanation: [
    {
      heading: "Pathogens cause disease by damaging cells and using resources",
      paragraphs: [
        "A pathogen is a microorganism or virus that causes disease. Bacteria are single-celled prokaryotes with their own DNA, ribosomes and cell wall; some release toxins, some damage tissue directly, and some invade cells. Fungi can grow on skin or in tissue, and protists are eukaryotic pathogens that may enter the blood or intestines. Viruses are not cells: they contain genetic material inside a protein coat and must use a host cell's machinery to replicate. That is why a virus cannot be killed by an antibiotic in the way a bacterium can.",
        "A pathogen causes symptoms by damaging cells, releasing toxins or provoking an immune response that itself causes inflammation. The severity of a disease depends on the pathogen's ability to enter the body, attach to cells, replicate and evade defences, and on the host's health and immune history. A person can carry a pathogen without becoming ill, and a person can be infectious before symptoms appear. This is why transmission cannot be judged from how well someone looks.",
        "Pathogens spread by different routes: respiratory droplets, contaminated water or food, direct contact, body fluids, insect bites and contaminated surfaces. A respiratory virus may be released in droplets when a person coughs; a bacterium that causes food poisoning may be ingested in contaminated food. Knowing the route matters because a defence that blocks one route may not block another. Handwashing, ventilation, safe water, cooking and vector control act at different points in the chain of transmission.",
        "The immune system does not have one response for all threats. A barrier such as skin is effective against many pathogens but does nothing once a virus is inside a cell. A phagocyte can engulf a bacterium but is not a precise antibody response. A specific antibody can neutralise one antigen but is less useful against a pathogen that changes that antigen. Immunity is layered because no single layer is sufficient, and a pathogen that evades one layer may still be controlled by another.",
      ],
    },
    {
      heading: "Non-specific defences act before the pathogen is identified",
      paragraphs: [
        "The first line of defence is a set of barriers that stop pathogens entering or remove them before they establish an infection. The skin is a physical barrier, and its dry, slightly acidic surface discourages many microbes. Mucus traps particles in the airways, and cilia sweep the mucus upwards so it can be swallowed or coughed out. Tears contain lysozyme, which damages bacterial cell walls, and stomach acid kills many microbes in food. These defences are non-specific because they do not distinguish one pathogen from another.",
        "If a pathogen crosses a barrier, phagocytes can engulf it. A phagocyte recognises foreign material through surface markers, extends its membrane around the particle and takes it into a vesicle. Lysosomes fuse with the vesicle and release digestive enzymes, breaking the pathogen down. The phagocyte may then display fragments of the pathogen on its surface, helping other immune cells recognise the antigen. This is not yet a targeted antibody response, but it slows the pathogen and starts the adaptive response.",
        "Inflammation is another non-specific response. Damaged cells release signals that widen blood vessels and increase their permeability, bringing more blood, phagocytes and plasma proteins to the site. The area becomes warm, red, swollen and painful. Inflammation can help clear an infection, but it can also damage tissue if it is excessive. A fever raises the body's set temperature, which can make some pathogens replicate less well and can enhance some immune processes, but a very high fever is dangerous.",
        "Non-specific defences are not a guarantee. A pathogen can enter through a cut, be inhaled in small particles, or survive the stomach. Some bacteria have capsules that make phagocytosis harder, and some viruses change their surface antigens. The specific immune response exists because a general barrier cannot recognise every possible pathogen, and because a pathogen that has entered the body needs a response tailored to its antigens.",
      ],
    },
    {
      heading: "The specific response makes antibodies and memory",
      paragraphs: [
        "An antigen is a molecule, often a protein or polysaccharide on the surface of a pathogen, that the immune system recognises as foreign. A lymphocyte carries receptors that fit one antigen. When a lymphocyte meets its matching antigen, it is selected and divides to produce a clone of cells with the same specificity. Some of the clone become plasma cells, which secrete antibodies; others become memory cells, which remain in the body and can respond quickly if the same antigen returns.",
        "An antibody is a protein with a variable region shaped to bind one antigen. Antibodies do not usually kill a pathogen directly. They can neutralise a toxin or block a virus from entering a cell, cause bacteria to clump together so phagocytes can engulf them more easily, or mark the pathogen for destruction. The specificity is the key: an antibody that fits one antigen may not fit a mutated version, and a different pathogen needs a different antibody.",
        "The first exposure to a pathogen produces a primary response. There is a lag while the correct lymphocyte is selected and multiplied, antibody concentration rises slowly, and the person may become ill before the response controls the infection. After recovery, memory cells remain. On a second exposure, memory cells divide rapidly and produce a larger antibody response sooner, often before symptoms develop. This is why immunity after an infection can last for years, although the duration and strength vary with the pathogen.",
        "The immune system has to distinguish self from non-self. Receptors that react strongly to the body's own molecules are normally removed or controlled, which is why the immune system does not usually attack its own tissues. When this control fails, an autoimmune disease can result. An allergy is a different case: the immune system responds to a harmless antigen, such as pollen, as if it were a threat. Both show that the response is specific, but specificity does not guarantee that the target is dangerous.",
      ],
    },
    {
      heading: "Vaccination, antibiotics and the evolution of resistance",
      paragraphs: [
        "A vaccine exposes the immune system to an antigen without causing the disease. The antigen may be an inactivated pathogen, a fragment of it, a weakened form that cannot replicate dangerously, or genetic material that instructs cells to make a harmless antigen. The immune system responds as it would to an infection, producing antibodies and memory cells. If the real pathogen later enters, the secondary response is faster and stronger, so the person is less likely to become ill or transmit the pathogen.",
        "Vaccination protects the individual, and a high vaccination rate can also protect people who cannot be vaccinated or whose immune system is weakened. This is herd immunity: when enough people are immune, the pathogen has fewer opportunities to pass between them, so an outbreak is less likely to spread. Herd immunity is not a property of one person and it does not make a vaccine perfectly effective; it is a population effect that depends on the proportion immune and how easily the pathogen spreads.",
        "Antibiotics treat bacterial infections by damaging bacterial structures or processes, such as the cell wall, protein synthesis or DNA replication. They do not work on viruses because viruses do not have those bacterial targets and replicate using host-cell machinery. A viral infection may still need supportive treatment, and a secondary bacterial infection may need an antibiotic, but the antibiotic is not treating the virus itself. Taking an antibiotic for a viral illness exposes bacteria in the body to selection without treating the cause.",
        "Antibiotic resistance is a change in a bacterial population, not in a person's body. Bacteria vary, and some carry alleles that let them survive an antibiotic. When the antibiotic is used, susceptible bacteria die while resistant ones survive and reproduce, so resistance becomes more common. The resistant bacteria can then spread to other people. This is natural selection, and it is why antibiotics should be used only when they are likely to help, at the right dose and duration, and why infection control matters. A person does not become resistant in the way a bacterium does; the person may carry a resistant population.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "An antibody has a variable region whose shape is complementary to one antigen, which allows it to bind that antigen specifically. Binding can neutralise a toxin, block a virus from entering a cell, or link pathogens together so phagocytes can engulf them. The constant region allows the antibody to interact with immune cells, so the same basic protein can be used in different ways against different antigens.",
      notation:
        "antigen → antibody variable region (specific fit) → neutralisation / clumping / marking → phagocytosis",
      caption:
        "The fit is the reason one antibody does not protect against every pathogen. A changed antigen can reduce the fit and allow a pathogen to evade existing immunity.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "A phagocyte recognises a pathogen as foreign, extends its membrane around it and engulfs it into a vesicle. A lysosome fuses with the vesicle and releases enzymes that digest the pathogen, and the phagocyte may display antigen fragments on its surface. This process is non-specific because it does not require a particular antibody, but it is an important bridge to the specific response.",
      notation:
        "phagocyte → recognition → engulfment → vesicle + lysosome → digestion → antigen presentation",
      caption:
        "The phagocyte does not make antibodies. It engulfs and digests, then presents fragments that help lymphocytes recognise the antigen.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "On first exposure to an antigen, the matching lymphocyte must be selected and multiplied, so antibody concentration rises only after a lag because the clone needs time to expand. Memory cells remain after the infection. On second exposure, memory cells respond rapidly and produce a larger antibody response sooner, so the pathogen is cleared before it causes the same illness. This difference is the reason a vaccine can protect without a previous infection.",
      notation:
        "first exposure → lag → small antibody response → memory cells\n" +
        "second exposure → rapid memory response → large antibody response → protection",
      caption:
        "The graph's shape is the explanation: the second response starts earlier and reaches a higher concentration. It is not simply the same response repeated faster by chance.",
    },
    {
      id: "r4",
      kind: "biology.process",
      body:
        "A vaccine presents an antigen without causing the disease because the antigen is in a form that cannot replicate dangerously, so the immune system produces antibodies and memory cells. If the real pathogen later enters, the memory response is faster and stronger, which reduces the chance of illness. When enough people are immune, transmission chains are less likely to continue, which protects people who cannot be vaccinated.",
      notation:
        "vaccine antigen → immune response → memory cells → real pathogen exposure → rapid secondary response → less illness and transmission",
      caption:
        "Vaccination trains the response before exposure. Herd immunity is the population consequence, not a guarantee that an individual cannot be infected.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A child is infected with a virus for the first time. Explain why the antibody concentration rises only after a delay, why the child may feel ill, and why a second infection with the same virus is usually milder.",
      steps: [
        {
          move:
            "Start with the pathogen and the antigen the immune system must recognise.",
          why:
            "The virus has surface antigens, and the immune system must find a lymphocyte whose receptor fits one of those antigens. That matching cell is rare, so the response cannot begin at full strength immediately.",
        },
        {
          move:
            "Explain the lag before antibody concentration rises.",
          why:
            "Once the matching lymphocyte is selected, it must divide and differentiate into plasma cells before it can secrete enough antibody. This multiplication takes time, which is the lag in the primary response.",
        },
        {
          move:
            "Connect the delay to the symptoms.",
          why:
            "While the virus is replicating and the adaptive response is still developing, the pathogen can damage cells and trigger inflammation. That is why the child can feel ill before the antibody concentration is high enough to control the infection.",
        },
        {
          move:
            "Explain the second infection using memory cells.",
          why:
            "After the first infection, memory cells specific to the virus remain. On the second exposure, they divide rapidly and produce a larger antibody response sooner, so the virus is cleared before it causes the same level of illness.",
        },
      ],
      answer:
        "The first response has a lag because the matching lymphocyte must be found, multiplied and differentiated into plasma cells. The virus can cause symptoms during that delay. Memory cells left after recovery make the second response faster and stronger, so the second infection is usually milder.",
    },
    {
      id: "w2",
      prompt:
        "A patient with influenza asks for antibiotics. Explain why antibiotics will not treat the influenza virus, and explain how antibiotic resistance could still become a problem if the patient takes them unnecessarily.",
      steps: [
        {
          move:
            "Identify why influenza is not a bacterial infection.",
          why:
            "Influenza is caused by a virus, which is not a cell and does not have the bacterial cell wall, ribosomes or DNA replication machinery that antibiotics target. The virus uses the patient's cells to replicate, so an antibiotic has no bacterial process to attack.",
        },
        {
          move:
            "Separate treating the virus from treating a possible secondary infection.",
          why:
            "An antibiotic may be justified if a doctor diagnoses a secondary bacterial infection, but it is not treating the influenza virus itself. The distinction matters because the antibiotic's target is the bacterium, not the virus.",
        },
        {
          move:
            "Explain how unnecessary antibiotic use selects resistant bacteria.",
          why:
            "The patient's body carries many bacteria, and some may have alleles that make them less susceptible to the antibiotic. The antibiotic kills susceptible bacteria while resistant ones survive and reproduce, so the resistant population becomes more common. This is natural selection acting on bacteria.",
        },
        {
          move:
            "Explain why the patient is not the thing that becomes resistant.",
          why:
            "Resistance is a property of the bacterial population, not a change in the patient's immune system. The patient may carry resistant bacteria and pass them to others, but the patient's body does not learn to resist the antibiotic in the way a bacterium does.",
        },
      ],
      answer:
        "Antibiotics target bacterial structures and processes, which influenza viruses do not have, so they do not treat the viral infection. Unnecessary use still exposes bacteria in the body to selection: resistant bacteria survive and reproduce, so the bacterial population becomes more resistant. The patient carries that population; the patient does not become resistant.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "Antibiotics can treat a viral infection such as a cold or influenza.",
      whyItFails:
        "Antibiotics act on bacterial targets such as the cell wall, bacterial ribosomes or bacterial DNA replication. Viruses are not cells, do not have those targets, and replicate using host-cell machinery. An antibiotic therefore cannot kill the virus or stop it replicating.",
      correction:
        "Match the treatment to the pathogen. Antibiotics are for bacterial infections; viral infections need supportive care and, for some viruses, specific antiviral medicines. A secondary bacterial infection may still need an antibiotic, but that is a different diagnosis.",
      contrast: {
        wrong:
          "the sore throat is probably a virus, so an antibiotic will stop it from getting worse",
        right:
          "an antibiotic cannot attack a virus; it is only useful if a bacterial infection is present or develops",
      },
    },
    {
      id: "m2",
      belief:
        "A vaccine gives you the disease it is meant to prevent, or it makes you immune immediately.",
      whyItFails:
        "Vaccines present an antigen in a form that cannot cause the disease, so the immune system can respond without the pathogen replicating dangerously. Immunity also takes time to develop because the immune system must produce antibodies and memory cells; protection is not instant.",
      correction:
        "Separate the antigen from the disease. The vaccine teaches the immune system to recognise a harmless form or fragment of the pathogen, and the response takes days to mature. Some people may have mild symptoms as the immune response develops, but that is not the same as the disease.",
      contrast: {
        wrong:
          "the vaccine contains the real pathogen, so it must be able to give me the infection",
        right:
          "the vaccine contains an antigen in a form that cannot cause the disease; it trains memory cells, which takes time",
      },
    },
    {
      id: "m3",
      belief:
        "Antibodies are cells that directly kill pathogens.",
      whyItFails:
        "Antibodies are proteins secreted by plasma cells. They bind antigens and can neutralise toxins, block entry into cells or mark pathogens for phagocytes, but they do not themselves engulf or kill a pathogen in the way a phagocyte does.",
      correction:
        "Keep the roles separate: a plasma cell makes antibodies; an antibody binds and marks; a phagocyte engulfs and digests. The immune response is a collaboration, not one cell doing every job.",
      contrast: {
        wrong:
          "an antibody is a white blood cell that eats the bacterium",
        right:
          "an antibody is a protein that binds the antigen and marks the pathogen, while a phagocyte engulfs and digests it",
      },
    },
    {
      id: "m4",
      belief:
        "A person becomes resistant to antibiotics if they take too many, so resistance is a property of the patient.",
      whyItFails:
        "Antibiotic resistance is a change in a bacterial population. Bacteria with resistance alleles survive and reproduce when the antibiotic is present, so the population becomes more resistant. The patient's own cells do not acquire bacterial resistance, although the patient can carry and transmit resistant bacteria.",
      correction:
        "Name the population that evolves. The antibiotic selects resistant bacteria; it does not train the patient's body to resist the drug. This is why antibiotic stewardship and infection control protect other people as well as the patient.",
      contrast: {
        wrong:
          "I have taken so many antibiotics that my body is now resistant to them",
        right:
          "the bacteria in and around me can become resistant; the antibiotic selects those bacteria, and I can pass them on",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Match each defence to its role: skin, mucus and cilia, stomach acid, phagocyte. Then say which are non-specific.",
      hint:
        "A barrier stops entry; mucus traps; acid kills; a phagocyte engulfs. None of these needs a specific antibody to recognise one pathogen.",
      answer:
        "Skin is a physical barrier; mucus traps particles and cilia sweep them away; stomach acid kills many ingested microbes; a phagocyte engulfs and digests pathogens. All four are non-specific because they do not depend on recognising one particular antigen.",
      feedback: {
        correct:
          "You separated the barrier and engulfment defences from the specific antibody response.",
        incorrect:
          "These defences act against many pathogens, so they are non-specific. Specificity belongs to lymphocytes and antibodies that fit one antigen.",
      },
    },
    {
      id: "p2",
      prompt:
        "A person is infected with a pathogen and later exposed to the same pathogen again. Explain why the second response is faster and produces more antibody.",
      hint:
        "What remains after the first response, and what happens when those cells meet the antigen again?",
      answer:
        "Memory cells specific to the antigen remain after the first infection. On the second exposure, they divide rapidly and differentiate into plasma cells, so antibody is produced sooner and in larger amounts. The pathogen is cleared before it can cause the same level of illness.",
      feedback: {
        correct:
          "You used memory cells rather than saying the immune system simply remembers in general.",
        incorrect:
          "The key is memory cells: they are already specific to the antigen, so the second response does not have to find a rare matching lymphocyte from scratch.",
      },
    },
    {
      id: "p3",
      prompt:
        "A patient takes an antibiotic for a bacterial infection. Explain why the antibiotic may stop working on a later infection with the same species.",
      hint:
        "Which organisms are being selected? Does the patient's body change, or does the bacterial population change?",
      answer:
        "Some bacteria in the population may carry alleles that allow them to survive the antibiotic. The antibiotic kills susceptible bacteria, so the resistant ones survive and reproduce, and resistance becomes more common in the population. A later infection may therefore be caused by bacteria that are less susceptible to the same antibiotic.",
      feedback: {
        correct:
          "You located resistance in the bacterial population and described selection rather than a change in the patient.",
        incorrect:
          "The patient does not become resistant. The antibiotic selects bacteria that already have resistance alleles, so the bacterial population changes over generations.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain how a phagocyte and a B lymphocyte work together to deal with a bacterial infection, and why memory cells make a second infection with the same bacterium milder.",
      modelAnswer:
        "A phagocyte recognises the bacterium as foreign, engulfs it into a vesicle and digests it with lysosomal enzymes. It can present antigen fragments on its surface, helping a B lymphocyte with a matching receptor to recognise the antigen. The selected B lymphocyte divides and differentiates into plasma cells, which secrete antibodies specific to the bacterial antigen. The antibodies can neutralise toxins, cause the bacteria to clump or mark them for phagocytosis. Some of the cloned lymphocytes become memory cells. On a second infection, those memory cells respond rapidly, producing a larger antibody response sooner, so the bacterium is cleared before it causes the same illness.",
      marking: [
        "Describes phagocytosis: recognition, engulfment, digestion and possible antigen presentation.",
        "Explains that a B lymphocyte is selected by its matching antigen and produces plasma cells.",
        "Explains that antibodies are specific and help neutralise or mark the bacterium for destruction.",
        "Explains that memory cells produce a faster, larger secondary response.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A vaccine trial reports 5 cases per 1,000 vaccinated people and 20 cases per 1,000 unvaccinated people. Calculate the percentage reduction in cases in the vaccinated group compared with the unvaccinated group.",
      modelAnswer: "75%",
      marking: [
        "Uses the unvaccinated rate as the baseline and finds the difference: 20 − 5 = 15 cases per 1,000.",
        "Divides the difference by the unvaccinated rate and multiplies by 100: 15/20 × 100 = 75%.",
      ],
      check: {
        accepted: ["75%", "75", "75 per cent", "seventy-five per cent"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Which cells secrete antibodies?",
      modelAnswer: "plasma cells",
      marking: [
        "Names plasma cells, not phagocytes or red blood cells.",
        "Recognises that plasma cells are differentiated B lymphocytes.",
      ],
      check: {
        accepted: ["plasma cells", "plasma cell", "B plasma cells"],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A patient with a viral infection asks for antibiotics. Explain why antibiotics will not treat the virus and how unnecessary antibiotic use can lead to a resistant bacterial population. Make clear what is becoming resistant.",
      modelAnswer:
        "Antibiotics target bacterial structures or processes, such as the cell wall, bacterial ribosomes or bacterial DNA replication. A virus is not a cell and does not have those targets; it replicates using the host cell's machinery, so the antibiotic cannot stop it. If the patient takes an antibiotic unnecessarily, bacteria in the body are exposed to it. Some bacteria may already carry alleles that make them survive the antibiotic; those bacteria survive and reproduce while susceptible ones die, so the resistant population becomes more common. The bacteria become resistant, not the patient's body. The patient can carry and transmit those resistant bacteria, which is why antibiotics should be used only when a bacterial infection is likely.",
      marking: [
        "Explains that antibiotics target bacterial structures or processes that viruses do not have.",
        "Explains that the virus replicates using host-cell machinery, so the antibiotic cannot attack it.",
        "Describes selection: resistant bacteria survive and reproduce while susceptible bacteria die.",
        "States that the bacterial population becomes resistant, not the patient's body.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A new variant of a virus has several changed surface antigens. People who were vaccinated against the original variant are only partly protected. Explain why the existing antibodies may bind less well, why memory cells can still help, and why a vaccine may need to be updated.",
      whyItTransfers:
        "The lesson teaches antibody specificity and memory through a first infection and a vaccine. A changed variant applies the same shape-and-memory logic to a pathogen that is partly unfamiliar, so the learner must explain reduced binding without claiming that the immune system has forgotten everything.",
      answer:
        "Antibodies have variable regions shaped to particular antigens. If the new variant's surface antigens have changed, the existing antibodies may fit less well or not at all, so they neutralise the virus less effectively and it may enter cells more easily. Memory cells from vaccination or previous infection are still present, and some may recognise unchanged parts of the virus or antigens shared with the original variant, so they can still mount a faster response than a completely new infection would. However, the response may be weaker or narrower than against the original variant. A vaccine can be updated to include the changed antigen, so the immune system produces new antibodies and memory cells that fit the variant better. This is still the same principle of exposing the immune system to a harmless antigen and building memory.",
      marking: [
        "Explains that antibody specificity depends on shape and that changed antigens can reduce binding.",
        "Explains that memory cells can still recognise some shared or unchanged antigens and respond faster.",
        "Explains why protection may be partial rather than all-or-nothing.",
        "Explains that updating a vaccine changes the antigen presented so new antibodies and memory cells fit the variant.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Name three non-specific defences of the human body.",
      answer:
        "Skin, mucus and cilia in the airways, stomach acid, tears containing lysozyme, and phagocytosis are examples; they act against many pathogens without recognising one specific antigen.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "What is the difference between an antigen and an antibody?",
      answer:
        "An antigen is a molecule on a pathogen that the immune system recognises; an antibody is a protein produced by plasma cells that binds specifically to that antigen.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why is the secondary immune response faster than the primary response?",
      answer:
        "Memory cells specific to the antigen remain after the first response, so on re-exposure they divide rapidly and produce a larger antibody response sooner.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "Why do antibiotics not work on viruses, and why does unnecessary use promote resistance?",
      answer:
        "Viruses lack the bacterial structures and processes antibiotics target, and they replicate using host cells. Unnecessary use selects bacteria that already carry resistance alleles, so resistant bacteria survive and become more common.",
      when: "month-later",
    },
  ],

  summary: [
    "Pathogens include bacteria, fungi, protists and viruses; viruses are not cells and must replicate inside a host cell.",
    "Non-specific defences such as skin, mucus, stomach acid and phagocytosis act before a specific antigen response.",
    "B lymphocytes selected by their matching antigen produce plasma cells and memory cells; antibodies are specific and help neutralise or mark pathogens.",
    "Vaccination creates memory without the disease, while antibiotics treat bacteria and select resistant bacteria when used unnecessarily.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The immune response is written as an ordered sequence as well as a notation line, so phagocytosis, antibody binding and memory formation do not depend on a diagram being interpreted visually.",
    },
    {
      need: "colour-vision",
      alternative:
        "Pathogens, antibodies, phagocytes and memory cells are named in the text and captions; no meaning depends on colour alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "Key terms are defined at first use, the four sections separate barriers, specific immunity, vaccination and antibiotics, and the summary repeats the core distinctions in short sentences.",
    },
    {
      need: "motor",
      alternative:
        "All guided and assessment answers can be typed; no labelling, dragging or timed interaction is required.",
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
        "Scope cited against the published GCSE biology subject content for infection and response.",
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
