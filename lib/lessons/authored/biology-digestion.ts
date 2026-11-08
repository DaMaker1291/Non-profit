import type { AuthoredLesson } from "../../lesson-contract";

// DIGESTION IS OFTEN TAUGHT AS AN ORGAN LIST WITH THREE ENZYME NAMES ATTACHED.
// That leaves the two hard ideas untouched: why a large insoluble molecule
// cannot cross a membrane, and why the gut is folded rather than a smooth tube.
// This lesson treats mechanical breakdown as surface-area preparation, chemical
// digestion as hydrolysis, bile as an emulsifier rather than an enzyme, and the
// villus as a transport surface. The calculation is deliberately small: it
// shows that cutting food does not change what the molecules are, only how much
// surface is exposed to the enzymes.
export const BIOLOGY_DIGESTION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "digestion",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, animal organisation and digestion: mechanical and chemical digestion, enzymes, bile and absorption in the small intestine",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish mechanical from chemical digestion and explain why both are needed before food can be absorbed.",
      evidence:
        "The learner explains that chewing and churning increase surface area without changing the molecules, while enzymes hydrolyse large molecules into small soluble products that can cross the gut wall.",
    },
    {
      statement:
        "Name the main digestive enzymes, their substrates and products, and explain how pH and bile affect their action.",
      evidence:
        "The learner matches amylase to starch and maltose, protease to protein and amino acids, and lipase to fat and fatty acids plus glycerol, and explains why pepsin works in acid while pancreatic enzymes need a neutral or alkaline environment.",
    },
    {
      statement:
        "Explain how the structure of a villus increases absorption, and predict the effect of damage to the villi or a blocked bile duct.",
      evidence:
        "The learner links villi and microvilli to surface area, the one-cell-thick epithelium to a short diffusion distance, and capillaries and lacteals to transport; they predict reduced absorption of nutrients and fat-soluble vitamins when the structure is damaged.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["enzymes"],
    check: [
      {
        id: "d1",
        question: "What does an enzyme do, and why is its active site specific?",
        answer:
          "An enzyme is a protein catalyst that speeds up a reaction without being used up. Its active site has a shape complementary to one substrate, so only that substrate fits and the reaction is catalysed.",
        targets: ["enzymes"],
      },
      {
        id: "d2",
        question: "Why does an enzyme stop working at a high temperature or the wrong pH?",
        answer:
          "High temperature or the wrong pH changes the ionic bonds and other interactions that hold the protein in shape. The active site loses its complementary shape, the substrate no longer fits, and the enzyme is denatured.",
        targets: ["enzymes"],
      },
    ],
  },

  introduction: {
    hook:
      "A slice of bread contains starch, a polymer built from hundreds or thousands of glucose units. A villus in the small intestine is covered by a layer of cells only one cell thick. If a starch molecule touched that surface, it could not walk through: it is too large to cross the membrane and not soluble enough to pass through in solution. The body therefore has to dismantle the bread before it can absorb it. Chewing helps, but chewing alone never turns starch into glucose. Something else has to cut the chemical bonds.",
    why:
      "Digestion is the breakdown of large, insoluble food molecules into small, soluble molecules that can be absorbed into the blood. Mechanical digestion, such as chewing and churning, increases the surface area exposed to enzymes but does not change the molecules. Chemical digestion uses enzymes to hydrolyse bonds: amylase breaks starch down to maltose, maltase breaks maltose down to glucose, proteases break proteins down to amino acids, and lipase breaks fats down to fatty acids and glycerol. Bile is not an enzyme; it emulsifies fat into smaller droplets and neutralises acidic chyme so pancreatic enzymes can work. The small intestine is the main site of absorption because its folded wall, villi and microvilli give an enormous surface area, a thin barrier and a dense blood supply. This lesson follows the food, the enzymes and the surface, and explains what each one contributes.",
  },

  explanation: [
    {
      heading: "Digestion changes molecules, not just pieces",
      paragraphs: [
        "Food contains three main large nutrients: carbohydrates such as starch, proteins, and lipids such as fats and oils. These molecules are polymers or large assemblies. Starch is a chain of glucose units, a protein is a chain of amino acids, and a fat is a glycerol molecule joined to three fatty acids. A cell membrane is a lipid bilayer with proteins embedded in it; a large polymer cannot simply diffuse through it. Absorption therefore depends on two things: the molecule must be small enough to cross the membrane, and it must be soluble enough to reach the membrane in the watery contents of the gut.",
        "Mechanical digestion is the physical reduction of food into smaller pieces. Teeth cut and grind, the stomach churns, and the small intestine mixes its contents by segmentation. These movements increase the surface area of food, but a small piece of bread is still starch. Its chemical bonds have not been broken. Chemical digestion is the enzyme-controlled hydrolysis of those bonds. Hydrolysis means water is used to split a bond: a large molecule is broken into smaller molecules, and the products are more soluble and more easily absorbed. The two processes work together because enzymes act at surfaces. More exposed surface means more opportunities for enzyme molecules to bind, so chemical digestion is faster after mechanical breakdown.",
        "This distinction explains why a person can chew food thoroughly and still fail to absorb it if the gut wall is damaged, and why a person can have normal enzymes but still produce fatty stools if bile cannot reach the intestine. Chewing is not digestion on its own, and an enzyme is not useful if it cannot reach its substrate. The lesson therefore follows both the food and the surface it meets.",
      ],
    },
    {
      heading: "The gut is a production line with different conditions in each part",
      paragraphs: [
        "Digestion begins in the mouth. Teeth break food into smaller pieces, saliva moistens it and contains salivary amylase, which begins the hydrolysis of starch to maltose. The tongue rolls the food into a bolus and starts swallowing. Saliva also contains mucus, which lubricates the bolus, and its near-neutral pH is close to the optimum for salivary amylase. The enzyme does not complete starch digestion in the mouth; most of the starch is still intact when the bolus is swallowed.",
        "The oesophagus is a muscular tube. Its walls contain circular and longitudinal muscle, and waves of contraction called peristalsis push the bolus towards the stomach. Circular muscles contract behind the bolus, narrowing the tube and pushing the food forward. The circular muscles ahead relax to open the lumen, while the longitudinal muscles contract and shorten that segment. This wave travels down the oesophagus, so food moves even when a person is lying down or upside down. Peristalsis is not the same as gravity, and it continues throughout the gut.",
        "The stomach is a muscular bag with very acidic contents, roughly pH 1.5 to 3.5, produced by parietal cells. The acid kills many ingested microbes, denatures proteins so their polypeptide chains unfold, and converts inactive pepsinogen into active pepsin. Pepsin begins protein digestion, breaking proteins into shorter polypeptides. The stomach also churns food with gastric juice to form chyme. It absorbs some water, alcohol and certain drugs, but it is not the main site of nutrient absorption. The acidic chyme is released in small amounts through the pyloric sphincter into the duodenum.",
        "The duodenum is the first part of the small intestine. It receives pancreatic juice, which contains pancreatic amylase, proteases such as trypsin, and lipase, and it receives bile from the liver via the gall bladder and bile duct. The pancreas also secretes hydrogencarbonate ions, which neutralise the acidic chyme and raise the pH towards the optimum for the pancreatic enzymes. The jejunum and ileum continue digestion and are the main sites of absorption. The ileum is especially important for absorbing vitamin B12 and bile salts. The large intestine absorbs water and mineral ions and compacts the remaining material into faeces; it is not the main site of nutrient absorption.",
      ],
    },
    {
      heading: "Enzymes are specific, and their environment decides whether they work",
      paragraphs: [
        "Amylase is a carbohydrase. It hydrolyses the glycosidic bonds in starch, producing maltose. Maltase, on the membranes of the intestinal epithelium, then hydrolyses maltose to glucose. Salivary amylase starts the process in the mouth; pancreatic amylase continues it in the small intestine. Proteases hydrolyse peptide bonds between amino acids. Pepsin works in the stomach at low pH, while trypsin and other pancreatic proteases work in the small intestine at a higher pH. Lipase hydrolyses the ester bonds in triglycerides, releasing fatty acids and glycerol. Each enzyme has an active site complementary to its substrate, which is why amylase does not digest protein and protease does not digest starch.",
        "The pH of the surroundings changes which amino-acid side chains are ionised, and those charges help hold the active site in its working shape. Pepsin is adapted to the acid stomach; it is inactive or denatured at the alkaline pH of the small intestine. Pancreatic enzymes are adapted to the slightly alkaline small intestine; they work poorly in the acid stomach. This is not a minor detail: it explains why the body must neutralise chyme as it enters the duodenum, and why a drug that neutralises stomach acid can change protein digestion in the stomach.",
        "Enzymes are catalysts, not reactants. They are not used up in the reaction, so a small amount of enzyme can catalyse the breakdown of many substrate molecules. They do not supply energy to the reaction; they lower the activation energy, making the reaction faster at body temperature. A denatured enzyme has lost the shape of its active site and cannot be restored by simply cooling it, because the change in the protein's tertiary structure is usually irreversible.",
      ],
    },
    {
      heading: "Bile emulsifies fat; it does not digest it",
      paragraphs: [
        "Bile is produced by the liver, stored in the gall bladder, and released into the duodenum through the bile duct. It contains bile salts, bile pigments, cholesterol and hydrogencarbonate ions, but it contains no digestive enzymes. Its first job is emulsification: bile salts reduce the size of large fat droplets and keep the smaller droplets dispersed in the watery contents of the gut. This increases the total surface area of fat exposed to lipase, so lipase can hydrolyse the fat faster. The fat molecules are not chemically changed by emulsification; the droplets are simply smaller.",
        "Bile's second job is to neutralise the acidic chyme entering the duodenum. The hydrogencarbonate ions in bile raise the pH, which helps pancreatic lipase and pancreatic proteases work at their optimum. This is why a blocked bile duct can cause more than one problem: less emulsification means slower fat digestion, and less neutralisation means pancreatic enzymes work less well. The undigested fat passes into the large intestine and appears in the faeces, making them pale, greasy and bulky. This condition is called steatorrhoea.",
        "Bile salts also help absorb fat-soluble vitamins A, D, E and K. The products of fat digestion and these vitamins are packaged into small structures called micelles, which carry them to the surface of the intestinal epithelium. If bile flow is blocked, the absorption of these vitamins falls even if the person is eating enough of them. A deficiency of vitamin D can affect calcium absorption and bone health; a deficiency of vitamin K can affect blood clotting. This is a consequence of the fat-digestion pathway, not a separate disease.",
      ],
    },
    {
      heading: "Absorption is solved by a very large, very thin surface",
      paragraphs: [
        "The small intestine is several metres long, and its inner wall is folded into circular folds. The surface is covered with finger-like projections called villi, and the epithelial cells covering each villus have microscopic projections called microvilli. These three levels of folding multiply the surface area enormously. A villus also contains a network of blood capillaries close to the surface and a central lacteal, which is a vessel of the lymphatic system. The epithelium is only one cell thick, so the distance from the gut contents to the blood or lacteal is very short.",
        "These features map directly onto the factors that affect diffusion: a large surface area gives more space for molecules to cross, a short distance gives a steeper gradient over the barrier, and a good blood supply removes absorbed molecules so the concentration gradient is maintained. Glucose and amino acids are absorbed by active transport and facilitated diffusion, depending on the molecule and its concentration. Fatty acids and glycerol diffuse into the epithelial cells, where they are recombined into triglycerides and packaged into chylomicrons before entering the lacteal. Water is absorbed by osmosis, and mineral ions by a mixture of diffusion and active transport.",
        "The villus is therefore not just a bump that increases surface area. It is a structure with a transport system inside it. A villus with a thin epithelium but no capillaries would still have a short diffusion distance, but the absorbed molecules would not be carried away efficiently. A villus with capillaries but a thick epithelium would have a good blood supply but a long diffusion distance. The structure works as a set of linked features, which is why damage to the villi can cause weight loss, anaemia and vitamin deficiencies at the same time.",
        "The colon absorbs water and mineral ions from the remaining material. If the colon is inflamed or overly active, less water is absorbed and the faeces become loose. If material moves too slowly, more water is absorbed and the faeces become hard. Neither case is primarily a failure of enzyme digestion; it is a failure of the water-handling part of the gut. This is another reason to keep the roles of the organs separate rather than treating the gut as one uniform tube.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A villus is a finger-like projection of the small intestine wall covered by a one-cell-thick epithelium, with a dense network of capillaries and a central lacteal inside it. The projections and the microvilli on their surface increase the area available for absorption because a larger area gives more space for molecules to cross, the thin epithelium shortens the diffusion distance because molecules have less distance to travel, and the capillaries and lacteal carry absorbed molecules away so that the concentration gradient is maintained.",
      notation:
        "villi + microvilli → large surface area · one-cell epithelium → short diffusion distance · capillaries and lacteal → transport away from the surface",
      caption:
        "The shape is only useful because the inside of the villus contains a transport system. Surface area, distance and blood flow are three separate adaptations working together.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Peristalsis moves food along the gut because circular muscles contract behind the bolus, narrowing the tube and pushing the food forward. The circular muscles ahead relax to open the lumen, while the longitudinal muscles ahead contract and shorten that segment. This creates a wave of contraction that pushes the bolus forward. The wave is generated by the gut wall itself, so food can move even when gravity is not helping.",
      notation:
        "circular muscle contracts behind → tube narrows → bolus pushed forward · circular muscle ahead relaxes · longitudinal muscle contracts ahead → segment shortens, lumen opens",
      caption:
        "Peristalsis is a muscular wave, not a fall through a tube. It continues in the oesophagus, stomach and intestines.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "Chemical digestion happens because each enzyme's active site binds a specific substrate and hydrolyses a bond. Amylase binds starch and breaks it into maltose, proteases bind proteins and break them into amino acids, and lipase binds triglycerides and breaks them into fatty acids and glycerol. The enzyme is not used up, so it can catalyse many reactions.",
      notation:
        "starch --amylase--> maltose --maltase--> glucose · protein --protease--> amino acids · fat --lipase--> fatty acids + glycerol",
      caption:
        "The arrow is a chemical reaction, not a physical movement. The enzyme lowers the activation energy; it does not supply energy or become part of the product.",
    },
    {
      id: "r4",
      kind: "biology.process",
      body:
        "Bile emulsifies fat because bile salts break large fat droplets into many smaller droplets and keep them dispersed in the watery gut contents. The total volume of fat is unchanged, but the surface area exposed to lipase increases, so lipase can hydrolyse the fat faster. Bile also neutralises acidic chyme, which gives pancreatic enzymes a more suitable pH.",
      notation:
        "large fat droplet + bile salts → many small droplets → larger surface area for lipase · acid chyme + bile → less acidic",
      caption:
        "Emulsification is physical, not chemical. Bile contains no lipase; it makes the fat easier for lipase to reach.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 1 mm cube of food is broken into 1,000 smaller cubes, each with an edge length of 0.1 mm. Calculate the total surface area before and after the change, and explain why this matters for enzyme digestion.",
      steps: [
        {
          move: "Write the surface-area formula for a cube: surface area = 6 × (edge length)².",
          why:
            "A cube has six square faces. Squaring the edge length gives the area of one face, and multiplying by six gives the total exposed surface. Writing the formula first prevents the common error of multiplying the edge length by six.",
        },
        {
          move: "Calculate the surface area of the original cube: 6 × (1 mm)² = 6 mm².",
          why:
            "The original cube has a relatively small surface for its volume. Only the outer surface can be reached by enzyme molecules in the gut.",
        },
        {
          move:
            "Calculate the surface area of one small cube: 6 × (0.1 mm)² = 6 × 0.01 = 0.06 mm².",
          why:
            "Each small cube has the same shape but a much smaller edge. Its surface area is not one thousandth of the original; it is smaller by a factor of 100, because area scales with the square of length.",
        },
        {
          move:
            "Multiply by the number of small cubes: 0.06 mm² × 1,000 = 60 mm². Compare with 6 mm²: the total surface area has increased tenfold.",
          why:
            "The volume and mass are unchanged, and the food is still the same substance. Only the exposed surface has increased. More surface means more enzyme molecules can bind at once, so chemical digestion can proceed faster.",
        },
      ],
      answer:
        "The original cube has a surface area of 6 mm². The 1,000 small cubes have a total surface area of 60 mm², ten times as much. The food molecules have not changed, but the greater exposed area gives enzymes more places to act, so digestion is faster. This is why chewing, churning and emulsification matter: they prepare the food physically for chemical digestion.",
    },
    {
      id: "w2",
      prompt:
        "A patient has a gallstone that blocks the bile duct. Their lipase production is normal. Explain why they develop pale, greasy faeces and may become deficient in vitamin D.",
      steps: [
        {
          move:
            "Locate the blockage: bile is made in the liver, stored in the gall bladder and carried by the bile duct to the duodenum. A gallstone in the duct prevents bile from reaching the small intestine.",
          why:
            "The site of the blockage determines which process fails. The pancreas can still make lipase, but the lipase is released into the duodenum, downstream of the blocked bile duct.",
        },
        {
          move:
            "Explain what happens to fat droplets without bile: large fat droplets remain large, so the surface area exposed to lipase is much smaller.",
          why:
            "Lipase works at the surface of a fat droplet. If the droplets are not emulsified, most of the fat is inside a large droplet and cannot be reached quickly, so fat digestion is slow and incomplete.",
        },
        {
          move:
            "Explain the effect on the faeces: undigested fat passes into the large intestine and is lost in the stool, making it pale, bulky and greasy.",
          why:
            "Fat that is not digested cannot be absorbed. Its presence in the colon changes the appearance and consistency of the faeces, which is why the symptom is a clue to fat malabsorption rather than to a lack of lipase alone.",
        },
        {
          move:
            "Explain the vitamin D deficiency: vitamin D is fat-soluble and is absorbed with the products of fat digestion. Less fat absorption means less vitamin D absorption, even if the diet contains enough.",
          why:
            "The vitamin is not destroyed by the blockage; it is not carried across the gut efficiently. This is a secondary consequence of the fat-digestion failure, not a separate defect in the vitamin itself.",
        },
      ],
      answer:
        "The blocked bile duct prevents bile from reaching the duodenum. Fat is not emulsified, so lipase has less surface area to act on and fat digestion is incomplete. Undigested fat is lost in the faeces, producing pale, greasy stools. Vitamin D is fat-soluble and is absorbed with fat, so its absorption also falls, which can lead to deficiency. Lipase is present, but it cannot work efficiently without bile.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Bile digests fat because it acts on fat in the small intestine.",
      whyItFails:
        "Bile contains no digestive enzymes. It emulsifies fat into smaller droplets and neutralises acid, but it does not hydrolyse the bonds in fat. Lipase is the enzyme that digests fat.",
      correction:
        "Describe bile as an emulsifier and a neutraliser, and lipase as the enzyme that breaks fat into fatty acids and glycerol. Emulsification increases surface area; it does not change the fat molecules.",
      contrast: {
        wrong: "bile breaks fat molecules into fatty acids and glycerol",
        right: "bile makes smaller fat droplets; lipase breaks the fat molecules down",
      },
    },
    {
      id: "m2",
      belief: "Most nutrients are absorbed in the stomach because food stays there for a long time.",
      whyItFails:
        "The stomach absorbs some water, alcohol and certain drugs, but its main roles are storage, churning and the start of protein digestion. Most nutrient absorption happens in the small intestine, where villi and microvilli provide a huge surface area and a rich blood supply.",
      correction:
        "Separate the roles: the stomach prepares chyme and starts protein digestion; the small intestine completes digestion and absorbs the products. The length and folding of the small intestine are adaptations for absorption, not storage.",
      contrast: {
        wrong: "the stomach absorbs most of the nutrients from a meal",
        right: "the small intestine absorbs most nutrients; the stomach mainly stores and churns food",
      },
    },
    {
      id: "m3",
      belief: "Villi are just bumps that catch food, so a larger number of them is the only thing that matters.",
      whyItFails:
        "A villus is a transport structure, not a net. It increases surface area, its epithelium is one cell thick, and it contains capillaries and a lacteal. Without the thin barrier and the transport vessels, a large surface alone would not maintain absorption.",
      correction:
        "Explain villi as a set of linked adaptations: surface area, short diffusion distance, and transport away from the epithelium. Damage to any one of these can reduce absorption even if the gut still has folds.",
      contrast: {
        wrong: "villi catch food molecules and hold them until they are absorbed",
        right: "villi increase surface area and contain blood and lymph vessels that carry absorbed molecules away",
      },
    },
    {
      id: "m4",
      belief: "Digestion is the same as absorption, so food is absorbed as soon as it is broken into smaller pieces.",
      whyItFails:
        "Digestion is the breakdown of large molecules into small soluble ones. Absorption is the movement of those products across the gut wall into the blood or lymph. A piece of food can be physically small and still not be absorbed if its molecules are too large or the gut wall is damaged.",
      correction:
        "Use two separate verbs: digest for the chemical breakdown, absorb for the transport across the epithelium. A small crumb of bread is not the same as glucose, and a villus is the surface where the glucose is taken up.",
      contrast: {
        wrong: "once food is chewed into small pieces, it is absorbed",
        right: "food must be chemically digested into small soluble molecules before absorption",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A learner says, 'Chewing bread digests it because it breaks the bread into smaller pieces.' Explain why this is only partly correct. Refer to mechanical digestion, chemical digestion and the size of the molecules.",
      hint:
        "What happens to the starch molecules when the bread is chewed? What has to break the chemical bonds between the glucose units?",
      answer:
        "Chewing is mechanical digestion. It breaks the bread into smaller pieces and increases the surface area exposed to saliva, but it does not break the glycosidic bonds in starch. The starch molecules are still large polymers, so they cannot be absorbed. Salivary amylase begins chemical digestion by hydrolysing starch to maltose. Pancreatic amylase continues producing maltose in the small intestine, and maltase on the intestinal epithelium breaks maltose into glucose. Chewing helps the enzymes reach the starch faster, but it is not digestion by itself.",
      feedback: {
        correct:
          "You separated the physical reduction of the bread from the chemical hydrolysis of starch, and explained why the smaller pieces still cannot be absorbed.",
        incorrect:
          "Smaller bread is still starch. Identify what mechanical digestion changes, then name the enzyme and the bond it breaks.",
      },
    },
    {
      id: "p2",
      prompt:
        "Put these events in the correct order and explain the cause of each step: lipase hydrolyses fat; bile salts emulsify fat; fatty acids and glycerol are absorbed into the epithelium; fatty acids and glycerol enter the lacteal.",
      hint:
        "Start with the physical state of the fat, then the enzyme, then the route across the epithelium and into the transport vessel.",
      answer:
        "Bile salts emulsify the fat into smaller droplets, increasing the surface area for lipase. Lipase then hydrolyses the fat into fatty acids and glycerol. These products diffuse into the epithelial cells, where they are recombined into triglycerides and packaged into chylomicrons, which enter the lacteal. The order is: emulsification → hydrolysis → absorption into the epithelium → entry into the lacteal.",
      feedback: {
        correct:
          "You put emulsification before hydrolysis, and you kept the epithelial uptake separate from the entry into the lacteal.",
        incorrect:
          "Lipase needs a surface to work on, so emulsification comes first. Then trace the products across the epithelium and into the lacteal.",
      },
    },
    {
      id: "p3",
      prompt:
        "A patient takes a drug that stops the stomach from producing acid. Predict two effects on protein digestion in the stomach, and explain why the patient can still digest some protein in the small intestine.",
      hint:
        "Which inactive enzyme needs acid to become active? What is the optimum pH for pepsin? Where else are proteases released?",
      answer:
        "Less acid means less pepsinogen is converted to pepsin, and the pH is further from pepsin's optimum, so protein digestion in the stomach is reduced. Proteins are also less denatured without acid, so pepsin has less access to peptide bonds. However, the pancreas releases proteases such as trypsin into the small intestine, and these work at a higher pH, so protein digestion can continue there. The stomach is not the only site of protein digestion.",
      feedback: {
        correct:
          "You linked acid to pepsin activation and to the optimum pH, then recognised the pancreatic proteases as the compensating route.",
        incorrect:
          "Acid has two jobs here: it activates pepsinogen and provides pepsin's optimum pH. Then ask where else proteases act.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain how the structure of the small intestine is adapted for absorption. Your answer should refer to surface area, diffusion distance, blood supply and the role of villi.",
      modelAnswer:
        "The small intestine is long and its inner wall has circular folds, villi and microvilli. These increase the surface area available for absorption. The epithelium covering a villus is one cell thick, so digested molecules have a short distance to diffuse or be transported across. Each villus contains a network of blood capillaries, which carry glucose and amino acids away and help maintain a concentration gradient, and a lacteal, which absorbs the products of fat digestion. Together these features allow rapid absorption of small soluble molecules into the blood or lymph.",
      marking: [
        "Names villi and microvilli and links them to an increased surface area.",
        "Explains that the epithelium is thin, giving a short diffusion distance.",
        "Explains that capillaries carry absorbed glucose and amino acids away and maintain a gradient.",
        "Names the lacteal as the route for products of fat digestion.",
        "Does not claim that absorption happens mainly in the stomach or that villi are enzymes.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt: "Name the enzyme that digests starch.",
      modelAnswer: "amylase",
      marking: [
        "Names amylase, not protease or lipase.",
        "Recognises that amylase is a carbohydrase that hydrolyses starch.",
      ],
      check: {
        accepted: ["amylase", "salivary amylase", "pancreatic amylase"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Name the two products of lipase digestion of a fat.",
      modelAnswer: "fatty acids and glycerol",
      marking: [
        "Names fatty acids, not just fat or glucose.",
        "Names glycerol as the other product.",
      ],
      check: {
        accepted: [
          "fatty acids and glycerol",
          "glycerol and fatty acids",
          "fatty acid and glycerol",
          "glycerol and fatty acid",
        ],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt: "Name the process that moves food along the oesophagus.",
      modelAnswer: "peristalsis",
      marking: [
        "Names peristalsis, not diffusion or absorption.",
        "Recognises that it is caused by waves of muscle contraction in the gut wall.",
      ],
      check: {
        accepted: ["peristalsis", "peristaltic movement", "peristaltic waves"],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "Coeliac disease is an immune reaction to gluten that damages the villi of the small intestine, making them shorter and flatter. A patient eats a normal diet but loses weight and becomes anaemic. Explain how the damaged villi can cause both problems, even though the patient's stomach and pancreas are working normally.",
      whyItTransfers:
        "The lesson explains absorption through surface area, diffusion distance, capillaries and lacteals in a healthy villus. Here the structure is damaged, so the learner must reason from the lost surface and transport capacity to reduced absorption of energy-providing nutrients and iron, rather than repeat the normal description.",
      answer:
        "The immune reaction to gluten damages the villi, especially in the duodenum and jejunum, so the total surface area of the small intestine falls and the number of microvilli is reduced. There is less area for digested nutrients to be absorbed, and the damaged epithelium can increase the diffusion distance and reduce the number of transport proteins. Less glucose and amino acid absorption means less energy and raw material for growth, so the patient loses weight. The duodenum and jejunum are also the main site of iron absorption, so less iron is taken up; iron is needed to make haemoglobin, so iron-deficiency anaemia can follow. The stomach and pancreas can still produce acid and enzymes, but the products cannot be absorbed efficiently if the intestinal surface is damaged.",
      marking: [
        "Links the immune reaction to gluten to damaged villi and a reduced surface area for absorption.",
        "Explains that shorter or flatter villi reduce the number of microvilli and transport proteins.",
        "Links reduced absorption of glucose and amino acids to weight loss.",
        "Links reduced iron absorption in the duodenum and jejunum to anaemia and haemoglobin production.",
        "Does not claim that the stomach or pancreas has stopped producing enzymes.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Name the three main digestive enzymes and state the food type each one breaks down.",
      answer:
        "Amylase breaks down starch, protease breaks down protein, and lipase breaks down fat.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Explain why bile is not an enzyme but still increases the rate of fat digestion.",
      answer:
        "Bile emulsifies fat into smaller droplets, which increases the surface area exposed to lipase. It also neutralises acidic chyme so pancreatic lipase can work at a suitable pH. It does not hydrolyse fat itself, so it is not an enzyme.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why is the small intestine, rather than the stomach, the main site of nutrient absorption?",
      answer:
        "The small intestine is long and folded, with villi and microvilli that give a very large surface area, a one-cell-thick epithelium for a short diffusion distance, and capillaries and lacteals to transport absorbed molecules away. The stomach mainly stores, churns and begins protein digestion.",
      when: "month-later",
    },
  ],

  summary: [
    "Mechanical digestion increases the surface area of food but does not change its molecules; chemical digestion uses enzymes to hydrolyse large molecules into small soluble products.",
    "Amylase breaks starch down to maltose, maltase breaks maltose down to glucose, proteases break proteins down to amino acids, and lipase breaks fats down to fatty acids and glycerol.",
    "Bile is made by the liver and stored in the gall bladder. It emulsifies fat and neutralises acidic chyme, but it contains no digestive enzymes.",
    "The small intestine is the main site of absorption because villi and microvilli provide a large surface area, the epithelium is one cell thick, and capillaries and lacteals carry absorbed molecules away.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every diagram is described in words, including the direction of peristalsis and the route from fat droplet to lacteal. Enzyme reactions are written as word equations as well as arrows, so no meaning depends on a visual symbol.",
    },
    {
      need: "colour-vision",
      alternative:
        "The organs, enzymes and products are named in the text and in the captions as well as being shown in the diagrams. No distinction depends on colour alone.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson separates the journey, the enzymes, bile and absorption into short headed sections. The surface-area calculation is broken into one line per move, and the three enzyme reactions share a consistent substrate-enzyme-product pattern.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed or selected. No dragging of food, labels or organs is required.",
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
      sourceId: "gcse-biology-digestion",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for animal organisation and digestion.",
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
