import type { AuthoredLesson } from "../../lesson-contract";

// One representative Biology lesson, authored to openmind.lesson/1.0.
//
// WHY THIS CONCEPT. Photosynthesis is the concept learners most often leave
// school able to recite and unable to use: the equation is memorised, the
// limiting-factor graph is not read, and the idea that a plant respires as well
// as photosynthesises is lost. The lesson is built so the graph is the point,
// not an illustration of it.
export const BIOLOGY_PHOTOSYNTHESIS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "photosynthesis",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, bioenergetics: photosynthesis and limiting factors",
    level: "Key Stage 3 to GCSE",
    note: "Scope cited against the published subject content; no specification text reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "State the reactants, products and location of photosynthesis, and explain what the plant does with each product.",
      evidence:
        "The learner names carbon dioxide and water as reactants, glucose and oxygen as products, places the process in the chloroplast, and says glucose is used for growth, storage as starch or respiration, while oxygen leaves the leaf.",
    },
    {
      statement:
        "Read a rate-versus-light-intensity graph and identify which factor is limiting at a given point.",
      evidence:
        "At the steep part of the curve the learner names light intensity as limiting; at the plateau the learner says another factor, such as carbon dioxide concentration or temperature, has taken over and proposes how to test that.",
    },
    {
      statement:
        "Explain why a plant both photosynthesises and respires, and why the net gas exchange of a leaf depends on which rate is greater.",
      evidence:
        "The learner states that respiration runs all the time in every living cell, while photosynthesis runs only in the light, so in darkness a leaf takes in oxygen and releases carbon dioxide and in bright light the reverse is net.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["enzymes"],
    check: [
      {
        id: "d1",
        question: "What does an enzyme do, and what happens to it when it gets too hot?",
        answer:
          "It catalyses a reaction by holding its substrate in an active site. Too hot and the active site changes shape, so the enzyme is denatured and the rate falls.",
        targets: ["enzymes"],
      },
      {
        id: "d2",
        question: "Why does a reaction inside a cell stop rising in rate once the enzyme is saturated?",
        answer:
          "Every active site is occupied, so adding more substrate cannot increase the rate. Something other than substrate concentration has become limiting.",
        targets: ["enzymes"],
      },
    ],
  },

  introduction: {
    hook:
      "A potato left in a dark cupboard for a month grows a pale, spindly shoot. Put the same potato on a windowsill and the shoot is short and green. The plant had the same store of energy in both places. What it did not have in the cupboard was light.",
    why:
      "Photosynthesis converts light energy into the chemical energy of glucose. Everything a plant builds, and every food chain on Earth, starts with that conversion. But a plant is not a solar panel that runs only in sunshine: it also respires, continuously, in every cell. Understanding the ratio between those two rates is what explains why a leaf's gas exchange changes direction between day and night.",
  },

  explanation: [
    {
      heading: "The reaction, and where it happens",
      paragraphs: [
        "Photosynthesis takes carbon dioxide and water and uses light energy to build glucose, releasing oxygen. In symbols, six carbon dioxide plus six water give one glucose plus six oxygen. The reaction happens in chloroplasts, which contain the green pigment chlorophyll that absorbs light. A plant without chloroplasts — a root cell, for example — cannot photosynthesise, which is why roots depend on the leaves for sugar.",
        "The glucose is not simply fuel. Some is used in respiration, some is converted to starch for storage, some becomes cellulose for cell walls, and some is combined with nitrogen to make amino acids. The oxygen is a by-product of splitting water and leaves the leaf by diffusion.",
      ],
    },
    {
      heading: "Rate is set by whichever factor is in shortest supply",
      paragraphs: [
        "Increasing light intensity increases the rate, but only until something else runs out. On a graph of rate against light, the rising section means light is limiting: more light gives more photosynthesis. The flat section means light is no longer limiting; carbon dioxide concentration or temperature has become the bottleneck, and adding more light changes nothing.",
        "This is the same saturation idea that governs enzymes, and it is the reason a greenhouse raises carbon dioxide as well as letting light in. Temperature is a limiting factor in a different way: it speeds up the enzyme-controlled reactions, but beyond an optimum the enzymes denature and the rate falls sharply.",
      ],
    },
    {
      heading: "Plants respire too, all the time",
      paragraphs: [
        "Respiration releases energy from glucose and happens in every living cell, in darkness as well as light. Photosynthesis only happens where there is chlorophyll and light. So a leaf is running both processes at once during the day, and only respiration at night.",
        "That is why gas exchange changes direction. In darkness, oxygen diffuses in and carbon dioxide diffuses out. In bright light, photosynthesis usually exceeds respiration, so carbon dioxide diffuses in and oxygen diffuses out. At the compensation point the two rates are equal and there is no net exchange, which is a fact about a ratio rather than about the plant switching processes on and off.",
      ],
    },
    {
      heading: "Testing the claim, not just stating it",
      paragraphs: [
        "A pondweed in water releases oxygen bubbles. Moving the lamp further away lowers the bubble count, and plotting rate against distance shows the falling curve. But bubbles are a proxy: they count a product of photosynthesis, and the count is only meaningful if everything else — temperature, carbon dioxide concentration, the plant's health — is held constant.",
        "A claim about a limiting factor is a claim about a controlled comparison. Vary one factor, hold the rest, and look for the point where the rate stops responding. Without the control, a change in rate could be attributed to the wrong cause, which is the single most common weakness in answers to this kind of question.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.process",
      body:
        "Light is absorbed by chlorophyll in the chloroplast, which drives the splitting of water and the fixing of carbon dioxide into glucose; oxygen leaves the leaf by diffusion because its concentration inside the leaf is higher than outside.",
      notation: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂",
      caption:
        "The arrow is driven by light energy absorbed by chlorophyll. Remove the light and the process stops, even though every reactant is still present.",
    },
    {
      id: "r2",
      kind: "biology.structure-function",
      body:
        "A palisade cell is packed with chloroplasts near the top of the leaf, because that position and density let it absorb the most light per unit area before the light is intercepted by cells below.",
      notation: "palisade mesophyll: chloroplast-dense, upper layer",
      caption:
        "The structure exists for the function. A leaf that put its chloroplasts at the bottom would absorb far less light for the same cost of building the leaf.",
    },
    {
      id: "r3",
      kind: "biology.structure-function",
      body:
        "A leaf has stomata on its underside and air spaces between spongy mesophyll cells, so that carbon dioxide can diffuse in and oxygen out along a short, moist path.",
      notation: "stoma + air space: short diffusion path, large surface area",
      caption:
        "Diffusion needs a gradient and a short path. The leaf's internal architecture supplies both, which is why a thick, dry leaf would photosynthesise poorly even in full sun.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "Pondweed is placed at increasing distances from a lamp and the oxygen bubbles are counted for one minute at each distance. Temperature and carbon dioxide concentration are kept constant, and the plant is left to settle before each count.",
      notation: "distance 10, 20, 30, 40 cm · bubbles per minute recorded · other factors controlled",
      caption:
        "Bubble count is a proxy for rate. The controlled variables are what make a fall in the count attributable to distance rather than to the plant warming up or running out of carbon dioxide.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A student measures the rate of photosynthesis of pondweed at increasing light intensities. The rate rises and then levels off. Explain what is happening at each part of the graph and how the student could test the explanation.",
      steps: [
        {
          move:
            "On the rising section, identify light intensity as the limiting factor, because increasing it increases the rate.",
          why:
            "A factor is limiting when changing it changes the rate. The rise is direct evidence that light is the factor in shortest supply at those points.",
        },
        {
          move:
            "At the plateau, conclude that light is no longer limiting and that another factor has taken over — most likely carbon dioxide concentration or temperature.",
          why:
            "The rate has stopped responding to the variable being changed. That only happens when a different factor has become the bottleneck, so the plateau is evidence about a second factor rather than about light.",
        },
        {
          move:
            "Propose a controlled test: repeat the experiment with a higher carbon dioxide concentration, keeping light intensity, temperature and the plant the same, and see whether the plateau is higher.",
          why:
            "The claim is that carbon dioxide is now limiting. Testing it means changing only that factor; if the plateau rises, the claim is supported, and if it does not, temperature is the better candidate.",
        },
      ],
      answer:
        "Light is limiting on the rising section and carbon dioxide (or temperature) is limiting at the plateau; raising carbon dioxide while holding everything else constant should raise the plateau if that is the limiting factor.",
    },
    {
      id: "w2",
      prompt:
        "A leaf is sealed in a transparent chamber. In bright light the carbon dioxide concentration in the chamber falls; in darkness it rises. Explain both observations using the two processes happening in the leaf.",
      steps: [
        {
          move:
            "Identify that photosynthesis takes in carbon dioxide and respiration releases it, and that both are happening in the leaf.",
          why:
            "The observation cannot be explained by one process alone. Both are always available; what differs between light and dark is the rate of photosynthesis.",
        },
        {
          move:
            "In bright light, conclude that the rate of photosynthesis exceeds the rate of respiration, so the net effect is uptake of carbon dioxide.",
          why:
            "Net exchange is a difference between two rates, not a switch. Photosynthesis is using carbon dioxide faster than respiration is producing it.",
        },
        {
          move:
            "In darkness, conclude that photosynthesis has stopped while respiration continues, so the net effect is release of carbon dioxide.",
          why:
            "Respiration does not depend on light. With photosynthesis at zero, the only process moving carbon dioxide is respiration, which releases it.",
        },
      ],
      answer:
        "In light, photosynthesis outpaces respiration and the leaf takes up carbon dioxide; in darkness photosynthesis stops while respiration continues, so the leaf releases carbon dioxide.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Plants photosynthesise instead of respiring, so they only take in carbon dioxide.",
      whyItFails:
        "Respiration happens in every living cell, continuously, including in plants and including in the light. Photosynthesis is an additional process, not a replacement. If a plant did not respire, it could not release the energy stored in the glucose it has just made.",
      correction:
        "Both processes run during the day; only respiration runs at night. What you observe as gas exchange is the NET of the two rates, which is why the direction can reverse.",
      contrast: {
        wrong: "plants take in carbon dioxide and give out oxygen, full stop",
        right: "plants respire always and photosynthesise in light; net gas exchange depends on which rate is greater",
      },
    },
    {
      id: "m2",
      belief: "The flat part of a light-intensity graph means photosynthesis has stopped.",
      whyItFails:
        "A plateau is a rate that has stopped rising, not a rate that has fallen to zero. Photosynthesis is still happening at the plateau — often faster than at any earlier point on the graph. What has stopped is the response to light.",
      correction:
        "Read the plateau as a change of limiting factor. The rate is set by something else now, and the graph tells you that increasing light further will not help.",
      contrast: {
        wrong: "the rate is zero, so photosynthesis has stopped",
        right: "the rate is constant and high, so another factor has become limiting",
      },
    },
    {
      id: "m3",
      belief: "A plant gets its food from the soil.",
      whyItFails:
        "Soil supplies water and mineral ions, not energy. The mass of a tree comes overwhelmingly from carbon dioxide in the air, fixed into glucose by photosynthesis. A plant in distilled water with light and air can still grow; a plant with soil and no light cannot.",
      correction:
        "Separate raw materials from energy. Water and minerals are raw materials absorbed by roots; the energy and the carbon come from light and air. Glucose is the plant's food, and the plant makes it.",
      contrast: {
        wrong: "the plant eats nutrients from the soil",
        right: "the plant builds glucose from carbon dioxide and water using light, and takes minerals from the soil",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A greenhouse is kept warm and well lit, but the plants still grow slowly. Suggest one change that could increase the rate of photosynthesis, and explain your reasoning.",
      hint: "Warm and well lit means two factors are already supplied. Which reactant has not been mentioned?",
      answer:
        "Raise the carbon dioxide concentration, for example with a paraffin burner or a CO₂ enrichment system, because light and temperature are already adequate so carbon dioxide is the likely limiting factor.",
      feedback: {
        correct:
          "You identified the factor that had not been supplied and used the limiting-factor idea to justify the change.",
        incorrect:
          "Adding more light or heat will not help if those are already adequate. Look for the reactant or condition the prompt has not mentioned.",
      },
    },
    {
      id: "p2",
      prompt:
        "Explain why a variegated leaf with white edges photosynthesises less than an all-green leaf of the same size.",
      hint: "What does the white part lack, and what is that substance for?",
      answer:
        "The white areas contain no chlorophyll, so they cannot absorb light energy and cannot carry out photosynthesis, leaving a smaller effective area for the same leaf size.",
      feedback: {
        correct:
          "You linked the missing pigment to the missing function, which is the structure-to-function reasoning this topic requires.",
        incorrect:
          "The leaf is not short of water or carbon dioxide. Check what the white region does not contain.",
      },
    },
    {
      id: "p3",
      prompt:
        "A leaf in bright light is found to have a higher oxygen concentration inside than outside. Explain why oxygen leaves the leaf.",
      hint: "Diffusion moves particles from where there are more to where there are fewer.",
      answer:
        "Photosynthesis is producing oxygen faster than respiration uses it, so the concentration inside the leaf is higher than outside and oxygen diffuses out down the gradient.",
      feedback: {
        correct:
          "You combined the two rates with the direction of diffusion, which is the full explanation.",
        incorrect:
          "The leaf is not pushing oxygen out. Name the process that moves it and the gradient that drives it.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why the net gas exchange of a leaf changes direction between day and night.",
      modelAnswer:
        "Respiration occurs continuously in all living cells and releases carbon dioxide while taking in oxygen. Photosynthesis only occurs in the light, and takes in carbon dioxide while releasing oxygen. During the day photosynthesis is usually faster than respiration, so the net exchange is uptake of carbon dioxide and release of oxygen. At night photosynthesis stops while respiration continues, so the net exchange reverses.",
      marking: [
        "States that respiration occurs all the time and photosynthesis only in light.",
        "States the gas directions for each process correctly.",
        "Explains net exchange as the difference between two rates rather than as a switch between processes.",
        "Applies the reasoning to both the day and the night case.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A student claims that a plant placed in a sealed lit container will eventually stop photosynthesising because it uses up all the carbon dioxide. Explain what will actually happen and why the claim is only partly right.",
      modelAnswer:
        "Photosynthesis will slow and eventually stop as carbon dioxide concentration falls, because carbon dioxide becomes the limiting factor. But the plant continues to respire, releasing carbon dioxide, so a small concentration remains and a low rate may persist. The claim is right that carbon dioxide becomes limiting, but wrong that the plant's photosynthesis simply ends at a clean boundary.",
      marking: [
        "Identifies carbon dioxide as the factor that becomes limiting.",
        "States that respiration continues and releases carbon dioxide.",
        "Concludes that the rate falls to a low value rather than stopping abruptly.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A lake has become cloudy because of algal growth near the surface. Plants living on the lake bed, several metres down, are dying. Use the limiting-factor idea to explain why, and suggest why adding nutrients to the lake could make the problem worse rather than better.",
      whyItTransfers:
        "The setting is an ecosystem rather than a leaf, and the causal chain runs through light penetration, photosynthesis on the lake bed and competition at the surface. The learner must apply the same limiting-factor reasoning without a graph or a labelled diagram.",
      answer:
        "The algae absorb light near the surface, so less light reaches the bottom and light becomes the limiting factor for the submerged plants, which photosynthesise too slowly to survive. Adding nutrients feeds the algae further, making the water cloudier and reducing light penetration even more.",
      marking: [
        "Identifies light as the limiting factor for the submerged plants.",
        "Connects reduced light to a lower rate of photosynthesis and to the plants' death.",
        "Explains that extra nutrients increase algal growth and further reduce light penetration.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "Name the reactants and products of photosynthesis and the organelle where it happens.",
      answer:
        "Reactants carbon dioxide and water; products glucose and oxygen; in the chloroplast.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Why does raising the temperature of a photosynthesising plant increase the rate up to a point and then decrease it sharply?",
      answer:
        "Warmer conditions increase the rate of the enzyme-controlled reactions up to an optimum; beyond that the enzymes denature and the rate falls.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "A plant is kept in the dark for two days. Explain why its leaves still produce carbon dioxide.",
      answer:
        "Respiration continues in all living cells regardless of light, releasing carbon dioxide, while photosynthesis has stopped.",
      when: "month-later",
    },
  ],

  summary: [
    "Photosynthesis uses light energy to build glucose from carbon dioxide and water in the chloroplast.",
    "The rate is set by whichever factor is in shortest supply; a plateau means the limiting factor has changed.",
    "Plants respire continuously as well as photosynthesising, so gas exchange is a net effect of two rates.",
    "Structure serves function: chloroplast density, stomata and air spaces all exist to make the process efficient.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The process diagram is described as an ordered list of steps with the driver of each step named, and the graph is given as a table of values alongside its description.",
    },
    {
      need: "colour-vision",
      alternative:
        "The light and dark cases in the graph are distinguished by line style and labels, not by colour.",
    },
    {
      need: "dyslexia",
      alternative:
        "The two processes are set out in a two-column comparison so the day and night cases can be read across rather than extracted from prose.",
    },
    {
      need: "low-vision",
      alternative:
        "All diagrams can be enlarged, and every label is available as text at the same size as body copy.",
    },
  ],

  provenance: [
    {
      sourceId: "openmind-authored",
      basis: "openmind-authored",
      licence: "OpenMind internal",
      attribution: "Written for OpenMind.",
      reproduction: "none",
      note: "All explanations, examples, practice and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-biology-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution: "Scope cited against the published GCSE biology subject content for bioenergetics.",
      reproduction: "none",
    },
  ],

  authors: [
    {
      author: "OpenMind curriculum team",
      role: "instructional author",
      authoredAt: "2026-11-04",
      method: "ai-assisted-then-edited",
    },
  ],

  reviews: [],
  learnerTesting: [],
  translations: [],
};
