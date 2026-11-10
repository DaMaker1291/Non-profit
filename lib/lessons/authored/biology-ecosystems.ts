import type { AuthoredLesson } from "../../lesson-contract";

// AN ECOSYSTEM IS NOT A LIST OF ORGANISMS. It is a working system with two
// different flows: energy arrives as light and leaves as heat, while the atoms
// of carbon, water and nitrogen are reused again and again. Learners often
// collapse those two into one "cycle", or treat a food chain as a statement
// about who eats whom rather than a route for energy. This lesson keeps the
// flows separate, makes the ten-per-cent transfer a calculation of the previous
// level rather than the original input, and treats decomposition as the process
// that makes matter available to producers. The transfer task applies the same
// reasoning to a dam, where the organisms and the intervention are unfamiliar.
export const BIOLOGY_ECOSYSTEMS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "ecosystems",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, ecology: ecosystems, trophic levels, energy transfer and material cycles",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published ecology subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish a population, a community, a habitat and an ecosystem, and identify the biotic and abiotic factors that affect the organisms in one place.",
      evidence:
        "The learner places a named organism in each level of organisation and separates a living influence such as a predator from a non-living influence such as oxygen concentration.",
    },
    {
      statement:
        "Trace energy through a food web, calculate the energy reaching a later trophic level, and explain why energy pyramids are upright even when pyramids of numbers are not.",
      evidence:
        "The learner follows an arrow in the direction of energy transfer, applies the ten-per-cent transfer to the previous level rather than the producer's original input, and names respiration and heat as the main reasons for the loss.",
    },
    {
      statement:
        "Describe how carbon, water and nitrogen move between organisms and the non-living environment, and explain why decomposers are essential to the continuation of those cycles.",
      evidence:
        "The learner traces an atom through photosynthesis, feeding, respiration and decomposition, and explains that mineral ions released by decomposers become available to producers again.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["photosynthesis", "respiration"],
    check: [
      {
        id: "d1",
        question:
          "What are the inputs and outputs of photosynthesis, and why does the process need a continuous supply of light?",
        answer:
          "Photosynthesis takes in carbon dioxide and water and uses light energy to make glucose, releasing oxygen. The light provides the energy that drives the reactions, so without it the plant cannot keep fixing carbon.",
        targets: ["photosynthesis"],
      },
      {
        id: "d2",
        question:
          "Why do living cells respire continuously, and what happens to the energy released when glucose is broken down?",
        answer:
          "Respiration releases energy from glucose for processes such as movement, growth and active transport. Some energy is captured in usable form and the rest is released as heat, so the process must continue while the cell is alive.",
        targets: ["respiration"],
      },
    ],
  },

  introduction: {
    hook:
      "A fallen oak trunk can look like the end of a life, but it is also a crowded nursery. Beetle larvae tunnel through the wood, fungi spread threads through the damp fibres, bacteria break the remains into simpler compounds, and birds visit to hunt the insects. The carbon that the tree once took from the air is slowly returning to the atmosphere, while mineral ions that were locked in its tissues are entering the soil where another plant can use them. Nothing in that description is a closed loop on its own. Light still has to arrive, and heat still leaves.",
    why:
      "An ecosystem is a community of organisms together with the non-living conditions around it. Its living parts are linked by feeding relationships, and its non-living parts supply water, oxygen, minerals and a place to live. Energy and matter behave differently inside that system: energy is captured, transferred and eventually lost as heat, while the atoms of matter are reused. That difference explains why a food chain is short, why a pyramid of energy never stands on its point, and why removing decomposers can starve the producers at the base of the web. The same principles apply to a pond, a woodland, a salt marsh or a river changed by a dam.",
  },

  explanation: [
    {
      heading: "An ecosystem is a community and its non-living surroundings",
      paragraphs: [
        "Ecologists use a series of nested terms. A population is all the individuals of one species living in a defined area. A community is all the populations of different species that live and interact there. A habitat is the particular place where an organism lives, described by its physical conditions and resources. An ecosystem is the community together with the non-living environment with which it exchanges energy and matter. The boundaries of an ecosystem are chosen for the question being asked, so a pond, a woodland, a field and the whole catchment of a river can each be treated as an ecosystem when the investigation is framed that way.",
        "The non-living, or abiotic, factors include light intensity, temperature, water availability, oxygen concentration, pH, mineral ion concentration and the structure of the soil or rock. These are not background scenery. A plant that has enough light but too little nitrate cannot make as much protein, and a fish that has enough food but too little dissolved oxygen cannot release the energy from that food efficiently. The living, or biotic, factors include predation, competition, disease, grazing and the availability of mates. A change in any one of them can alter the abundance of a population, and the effect may reach other species through the food web.",
        "The living and non-living parts are connected by exchanges. Producers take carbon dioxide from the atmosphere or water and mineral ions from the soil, and they release oxygen. Consumers obtain carbon and nitrogen by eating other organisms, and they return carbon dioxide to the environment through respiration. Decomposers break down dead tissue and waste, releasing carbon dioxide and mineral ions. Water moves between the soil, organisms, the atmosphere and bodies of water. An ecosystem is therefore open: energy and matter cross its boundaries, and the boundary is a decision about what the investigation will count as inside.",
      ],
    },
    {
      heading: "Feeding links move energy in one direction",
      paragraphs: [
        "Producers, also called autotrophs, capture energy from sunlight and store it in organic compounds through photosynthesis. Plants, algae and some bacteria are producers. Consumers are heterotrophs: they cannot make their own organic food, so they obtain energy by eating other organisms. A primary consumer eats producers, a secondary consumer eats primary consumers, and a tertiary consumer eats secondary consumers. Omnivores feed at more than one level, and decomposers obtain energy from dead tissue and waste rather than by hunting. A food chain follows one route through these feeding relationships; a food web combines the routes into a network because most consumers eat more than one kind of food.",
        "The arrow in a food chain shows the direction in which energy moves, not the direction in which an animal looks. Grass → grasshopper → frog → snake means that energy passes from the grass to the grasshopper, then to the frog, then to the snake. It also means that the grasshopper eats the grass, but the eating is the mechanism and the energy transfer is the reason the arrow is drawn that way. Reversing the arrow describes a different claim: that the grass obtains energy from the grasshopper, which is false. A food web with several arrows into and out of a consumer shows that the consumer has more than one possible energy route, but it does not mean that every route supplies the same amount of energy.",
        "At each transfer, only a fraction of the energy becomes new biomass in the next trophic level. A commonly used working figure is about ten per cent, although the real value varies with the organisms, their activity and the environment. The rest is not destroyed; it is transformed and lost from the food chain. Respiration releases some of the chemical energy as heat, movement uses energy, growth and repair use energy, and uneaten parts, faeces and excreted waste leave the consumer. The energy that remains in the consumer's body is the energy available to the next consumer, which is why the transfer is calculated from the previous level rather than from the producer's original input.",
        "A pyramid of energy records the energy available at each trophic level per unit area or volume over a period of time. It is always upright because the energy available to the next level is a fraction of the energy available to the one below; the heat lost during respiration cannot be recovered by producers. A pyramid of numbers counts individuals instead, and it can be inverted: one large tree may support thousands of insects, so the producer level has one individual while the primary consumer level has many. A pyramid of biomass can also be inverted in some aquatic systems when the producers reproduce and are eaten quickly, so a small standing crop supports a larger standing crop of consumers. The shape of the pyramid therefore depends on what is being measured.",
        "The loss of energy at each transfer explains why food chains are usually short. After four transfers, a producer's energy has been reduced to about one ten-thousandth of its original amount, so a top predator needs a very large area of producers to support it. It also explains why top predators are rare and why removing them can have effects that travel down the web. The ten-per-cent figure is a model, not a law: a warm-blooded predator spends a large share of its energy on maintaining body temperature, while a cold-blooded consumer may retain a different proportion. The direction of the loss is general even when the exact percentage is not.",
      ],
    },
    {
      heading: "Matter is recycled through living and non-living reservoirs",
      paragraphs: [
        "The carbon cycle moves carbon between the atmosphere, the ocean, living organisms, soil and fossil fuel deposits. Photosynthesis removes carbon dioxide from the atmosphere or from water and fixes it into glucose and other organic compounds. Consumers obtain carbon by eating producers or other consumers. Respiration in plants, animals and decomposers releases carbon dioxide back to the environment. Decomposition of dead tissue and waste also releases carbon dioxide, and combustion of wood or fossil fuels releases carbon that was stored for a long time. The ocean dissolves carbon dioxide, and some carbon is stored in shells, limestone and fossil deposits. These reservoirs exchange carbon at different rates, which is why a change in one part of the cycle can take a long time to work through the others.",
        "The water cycle is driven by energy from the sun and by gravity. Heat evaporates water from the ocean, lakes and soil, and plants lose water vapour through transpiration. The vapour rises, cools and condenses into clouds, and precipitation returns the water to the surface. Some water runs over the ground into rivers, some soaks into the soil and rock, and some is taken up by organisms. Gravity returns the water to lower ground and eventually to the ocean. The cycle supplies the water that photosynthesis and transport need, and it also moves dissolved minerals and pollutants through the ecosystem.",
        "The nitrogen cycle is more chemically varied because atmospheric nitrogen gas is very unreactive. Nitrogen-fixing bacteria convert nitrogen gas into ammonia or ammonium; some live in the root nodules of legumes, and others live freely in the soil. Nitrifying bacteria convert ammonium into nitrite and then nitrate, which plants can absorb. Plants use the nitrogen to make amino acids, proteins and nucleic acids, and animals obtain nitrogen by eating plants or other animals. Decomposers break down dead organisms and waste and release ammonia in a process called ammonification. Denitrifying bacteria convert nitrate back to nitrogen gas in waterlogged, low-oxygen conditions, returning it to the atmosphere. Lightning also fixes a small amount of nitrogen, and industrial fertiliser production adds a large amount that would otherwise remain in the atmosphere.",
        "Decomposers are the bridge between dead matter and the living community. Bacteria and fungi secrete enzymes that break down proteins, carbohydrates and other compounds in dead tissue, and they absorb the soluble products. As they respire, they release carbon dioxide; as they break down nitrogen-containing compounds, they release ammonium and other mineral ions. Earthworms and other detritivores fragment the material, increasing the surface area for microbial action. Decomposition is faster when the material is warm, moist and well supplied with oxygen, because the decomposers' own respiration needs oxygen and their enzymes work faster at moderate temperatures. In waterlogged soil, oxygen is limited, so decomposition slows and denitrification may dominate. The nutrients are not lost from the ecosystem in the same sense that energy is; they are held in a different reservoir until another organism takes them up.",
      ],
    },
    {
      heading: "Interdependence makes disturbance travel",
      paragraphs: [
        "A food web is a map of dependence, and a change at one point can reach organisms that are not directly connected to it. If a predator is removed, its prey may increase, and the plants or animals that the prey eats may decline. That is a direct effect followed by an indirect one. A sea otter eats sea urchins, and sea urchins graze kelp. When otters are removed, urchin numbers can rise, kelp can be reduced to bare rock, and the fish and invertebrates that depended on the kelp forest can lose food and shelter. The otter is not the only influence on the kelp, but its removal can change the strength of the urchin-kelp link enough to reorganise the community.",
        "Some species have an effect on the community that is much larger than their abundance would suggest; these are often called keystone species. The term is a description of the role, not a licence to assume that every large or popular species is keystone. Other species may be functionally redundant, meaning that several of them perform a similar role, so the loss of one does not immediately remove the process. Redundancy is not a guarantee of stability: if a disturbance removes several species with the same role at once, or pushes the system past a threshold, the remaining species may not be able to compensate. Ecological systems can change abruptly as well as gradually, and a community that looks stable over a short study may still be changing slowly.",
        "Disturbance can be natural or human. A storm, a drought, a disease, a fire, a dam, a fertiliser spill or the removal of dead wood can all alter the flows of energy and matter. A dam changes the speed of a river, traps sediment and nutrients, and separates populations that once mixed. Clearing a forest removes producers, releases stored carbon when the timber is burned or decomposed, and exposes soil to erosion. Adding fertiliser can increase plant growth in the short term but can also unbalance a water body when the extra nutrients run into it. The effects are not always immediate or easy to predict, because organisms have different life cycles and the web has more than one route. Monitoring before and after a change is therefore part of understanding the ecosystem, not an optional extra.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A food web is a structure of feeding links with several routes into and out of each consumer. That structure matters because a consumer with more than one prey can keep feeding when one prey becomes scarce, which lets the consumer persist through a local shortage. The structure also has a limit: the alternative prey may be too small, too difficult to catch or itself dependent on the same plant, so the presence of an arrow does not guarantee that the consumer can survive on that route alone.",
      notation:
        "grass → grasshopper → frog → snake; grass → rabbit → fox; grasshopper → bird → fox",
      caption:
        "The web shows possible energy routes, not a set of equivalent meals. The number of arrows into a consumer is a clue to its flexibility, while the abundance of each prey and the strength of each link decide whether that flexibility is enough.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Energy enters the community when producers capture light and store it in organic compounds. At each feeding transfer, only part of the energy becomes new consumer biomass because respiration releases some energy as heat, movement and growth consume more, and uneaten or undigested material leaves the chain. The energy available to the next level therefore falls at every step, so a pyramid of energy is widest at the producers and narrows towards the top.",
      notation:
        "producers 20,000 kJ → primary consumers 2,000 kJ → secondary consumers 200 kJ → tertiary consumers 20 kJ",
      caption:
        "Each figure is ten per cent of the figure before it, not ten per cent of the producer's original capture. The missing energy has been transformed and lost as heat or removed in waste, so it cannot be used by a later consumer.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "Photosynthesis removes carbon dioxide from the atmosphere and fixes the carbon into glucose, while respiration in producers, consumers and decomposers releases carbon dioxide back into the atmosphere. Combustion of fossil fuels releases carbon that was stored underground, and decomposition releases carbon from dead tissue. The cycle continues because organisms both take carbon from a reservoir and return it to one, so the same atoms can pass through living tissue many times.",
      notation:
        "atmosphere CO₂ → photosynthesis → producer biomass → consumer biomass → respiration and decomposition → atmosphere CO₂; fossil fuels → combustion → atmosphere CO₂",
      caption:
        "Carbon is recycled, but the reservoirs are not all the same size or equally fast. A molecule released by combustion can remain in the atmosphere for a long time before photosynthesis removes it, which is why the balance of the cycle matters.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A decomposition experiment can compare leaf litter kept in moist, well-aerated soil with litter kept in dry soil and litter kept in waterlogged soil. Equal masses of the same litter are sealed in mesh bags so the material can be recovered, and the bags are weighed at intervals. The moist, aerated treatment should lose mass fastest because decomposers have water, oxygen and a suitable temperature; the dry treatment limits microbial activity, and the waterlogged treatment limits oxygen. The initial mass, litter type, bag mesh and exposure time must be kept the same so that the moisture and oxygen conditions are the only intended difference.",
      notation:
        "independent variable: moisture and oxygen conditions; dependent variable: mass of litter remaining; controlled: litter type, initial mass, mesh size, temperature, time",
      caption:
        "Mass loss is evidence of decomposition, but it is not a direct count of decomposers. A conclusion should compare the treatments and acknowledge that some material may have been fragmented and lost through the mesh.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "The producers in a salt marsh capture 25,000 kilojoules of energy per square metre per year. Assume that ten per cent of the energy available at each trophic level is transferred to the next. Calculate the energy available to secondary consumers, and explain why the answer is not 2,500 kilojoules.",
      steps: [
        {
          move:
            "Identify the producer level and count the transfers to secondary consumers.",
          why:
            "Secondary consumers are two feeding steps above producers: producers to primary consumers is the first transfer, and primary consumers to secondary consumers is the second. Counting the steps prevents the answer from stopping one level too early.",
        },
        {
          move:
            "Calculate the energy reaching primary consumers as ten per cent of the producers' energy.",
          why:
            "The transfer is calculated from the energy actually available at the previous level, which is 25,000 kilojoules. Ten per cent of that is 2,500 kilojoules, so this is the energy available to primary consumers, not to secondary consumers.",
        },
        {
          move:
            "Calculate the energy reaching secondary consumers as ten per cent of the primary consumers' energy.",
          why:
            "The secondary consumers eat the primary consumers, so they can receive only a fraction of the 2,500 kilojoules that reached that level. Ten per cent of 2,500 is 250 kilojoules, which is the answer to the question.",
        },
        {
          move:
            "Account for the energy that is not passed on and state the answer with its unit.",
          why:
            "Most of the missing energy is released as heat during respiration, used for movement and growth, or lost in uneaten parts and waste. It has not vanished, but it is no longer available to the next consumer. The answer is 250 kilojoules per square metre per year.",
        },
      ],
      answer:
        "Secondary consumers receive 250 kilojoules per square metre per year. The 2,500-kilojoule figure is the energy at the primary-consumer level, not the secondary-consumer level.",
    },
    {
      id: "w2",
      prompt:
        "On a rocky shore, kelp is eaten by sea urchins, and sea urchins are eaten by sea otters. Kelp is also eaten by small fish, which are eaten by the same otters. Divers remove most of the otters. Explain the likely direct and indirect effects on the kelp and the small fish, and explain why the outcome is not certain.",
      steps: [
        {
          move:
            "Identify the two prey groups that are released from otter predation.",
          why:
            "Otters eat both sea urchins and small fish, so removing the predator reduces the mortality of both groups directly. That is the first effect, and it is not yet a statement about what happens to the kelp.",
        },
        {
          move:
            "Follow the direct effect on urchins to their food, the kelp.",
          why:
            "If more urchins survive, the total amount of kelp they graze can rise. Heavy grazing can reduce the kelp forest and create urchin barrens, so the direct release of urchins becomes an indirect negative effect on kelp.",
        },
        {
          move:
            "Follow the effect on small fish and then the indirect effect of kelp loss.",
          why:
            "Small fish may initially benefit from reduced predation, but they also use kelp for shelter and food. If the kelp forest shrinks, that benefit can be reversed by habitat loss, so the two direct effects push the fish in opposite directions.",
        },
        {
          move:
            "Name the reasons the prediction cannot be certain.",
          why:
            "The strength of each link varies with urchin and fish abundance, disease, storms, fishing and the time lag between changes. A short study may see only the first effect, so repeated monitoring of all three groups is needed before concluding that the web has reorganised.",
        },
      ],
      answer:
        "Removing otters directly releases both urchins and small fish from predation. More urchins can graze down the kelp, which indirectly removes shelter and food from small fish, so the fish may not benefit for long. The outcome depends on how strongly each link operates, on other disturbances and on time, so it is a prediction to test rather than a guaranteed result.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "Energy is recycled through an ecosystem in the same way that carbon and nitrogen are recycled.",
      whyItFails:
        "Energy is transformed at every transfer, and a large share leaves the food chain as heat during respiration. Heat is too dispersed to be captured by producers and used to drive photosynthesis, so the community needs a continuous input of new energy from the sun. Matter is different: atoms of carbon, nitrogen and water can be reused because they are not consumed in the same way as energy.",
      correction:
        "Trace energy as a one-way flow from sunlight to producers to consumers, with losses at every step. Trace matter as atoms moving between organisms and the non-living environment. Both descriptions can be true at once, but they are not the same cycle.",
      contrast: {
        wrong:
          "the carbon and the energy both go round, so a food chain can keep running without new sunlight",
        right:
          "the carbon atoms are reused, but the energy is lost as heat at each transfer, so photosynthesis must keep capturing new light",
      },
    },
    {
      id: "m2",
      belief:
        "At every trophic level, an organism receives ten per cent of the energy that the producer originally captured.",
      whyItFails:
        "The ten-per-cent figure describes the transfer from one level to the level immediately above it. Once the energy has been reduced at the first transfer, the next transfer is calculated from that smaller amount. Applying ten per cent of the original capture at every level would leave far too much energy near the top of the chain and would not explain why top predators are rare.",
      correction:
        "Multiply by ten per cent at each step, using the energy available at the previous level. For a producer input of 25,000 kilojoules, primary consumers receive 2,500 and secondary consumers receive 250, not 2,500.",
      contrast: {
        wrong:
          "secondary consumers get ten per cent of 25,000, which is 2,500 kilojoules",
        right:
          "secondary consumers get ten per cent of the 2,500 kilojoules at the primary-consumer level, which is 250 kilojoules",
      },
    },
    {
      id: "m3",
      belief:
        "Decomposers only consume dead material, so they do not affect the living plants and animals in an ecosystem.",
      whyItFails:
        "Decomposition releases mineral ions such as nitrate and phosphate from dead tissue, and those ions are the raw materials that producers need to build proteins, nucleic acids and other compounds. It also releases carbon dioxide. If decomposition stopped, nutrients would remain locked in dead matter and waste, soil fertility would fall and producers would eventually run short of the materials they need to grow.",
      correction:
        "Treat decomposers as recyclers rather than as a separate trophic level that only tidies up. Their activity makes nutrients available to producers again, and the rate depends on moisture, oxygen and temperature. A compost heap works for the same reason that a waterlogged bog preserves material: the conditions change how quickly the decomposers can act.",
      contrast: {
        wrong:
          "the dead leaves are waste, and the plants get everything they need from the soil regardless of what happens to them",
        right:
          "the dead leaves are a nutrient reservoir, and decomposers release the minerals that let the next generation of plants grow",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "In the food chain grass → grasshopper → frog → snake, name the secondary consumer and explain what the arrow from grass to grasshopper means.",
      hint:
        "Count the feeding steps from the producer. Then decide whether the arrow shows the direction of eating or the direction of energy transfer.",
      answer:
        "The frog is the secondary consumer because it eats the grasshopper, which is the primary consumer. The arrow from grass to grasshopper means that energy passes from the grass to the grasshopper; it also means that the grasshopper eats the grass, but the energy direction is the reason the arrow points that way.",
      feedback: {
        correct:
          "You counted the trophic levels correctly and read the arrow as a transfer of energy rather than as a label on the organism.",
        incorrect:
          "Start at the producer and count one step to the primary consumer, then another to the secondary consumer. The arrow points towards the organism that receives the energy, so it points from the food to the eater.",
      },
    },
    {
      id: "p2",
      prompt:
        "Explain why a pyramid of energy is always upright, while a pyramid of numbers can be inverted.",
      hint:
        "One pyramid measures energy available at each level; the other counts individuals. Which quantity must fall at every transfer, and which can be large at the producer level but small in number?",
      answer:
        "A pyramid of energy is upright because energy is lost at every transfer, mainly as heat from respiration, so each level has less energy available than the one below. A pyramid of numbers counts individuals, and one large producer such as a tree can support many small consumers such as insects, so the producer bar can be shorter than the primary-consumer bar.",
      feedback: {
        correct:
          "You separated the quantity being measured from the shape of the pyramid. Energy must decrease; numbers depend on the size and life cycle of the organisms.",
        incorrect:
          "The shape depends on what is measured. Energy is lost at each transfer, but a single tree can be one producer supporting thousands of insect consumers, so a count of individuals need not decrease in the same way.",
      },
    },
    {
      id: "p3",
      prompt:
        "A gardener digs dead leaves into damp, well-aerated soil. Explain how decomposers make the leaves useful to the plants that grow there.",
      hint:
        "The leaves contain carbon and mineral elements. What do decomposers release, and in what form can a plant absorb those elements?",
      answer:
        "Bacteria and fungi break down the dead leaves and release carbon dioxide, nitrate, phosphate and other mineral ions. The plants can absorb the mineral ions through their roots and use the carbon dioxide in photosynthesis. The damp, aerated soil supplies the water and oxygen that the decomposers need, so the leaves become a source of available nutrients rather than remaining locked in dead tissue.",
      feedback: {
        correct:
          "You followed the matter from dead tissue to a form that a producer can absorb, and you linked the rate of decomposition to the conditions the decomposers need.",
        incorrect:
          "The leaves are not absorbed whole. Decomposers break them down and release mineral ions and carbon dioxide, and the plant takes up those simpler substances through its roots and leaves.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why energy is said to flow through an ecosystem while carbon is said to cycle. Use a named food chain and at least two processes from the carbon cycle in your answer.",
      modelAnswer:
        "Energy flows because it enters the community as light captured by producers and is transferred along a food chain such as grass to rabbit to fox. At each transfer, respiration releases some energy as heat, and movement, growth and waste remove more, so the energy available to the next level falls and cannot be reused by producers. Carbon cycles because carbon atoms are taken from carbon dioxide by photosynthesis, passed to consumers when they eat, and returned to the atmosphere by respiration, decomposition and combustion. The same carbon atoms can pass through living tissue repeatedly, but the energy that drives those reactions must be continually replaced by sunlight.",
      marking: [
        "States that energy enters as light and is transferred along a food chain, naming a producer and at least one consumer.",
        "Explains that energy is lost at each transfer, mainly as heat from respiration, so it cannot be recycled by producers.",
        "Describes at least two carbon-cycle processes, such as photosynthesis, respiration, decomposition or combustion.",
        "Distinguishes the reuse of carbon atoms from the one-way flow of energy rather than treating both as the same cycle.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Producers in a marsh capture 40,000 kilojoules of energy per square metre per year. If ten per cent of the energy at each level is transferred to the next, how much energy reaches the secondary consumers? Give your answer in kilojoules per square metre per year.",
      modelAnswer: "400 kilojoules per square metre per year",
      marking: [
        "Calculates the primary-consumer level as 4,000 kilojoules rather than stopping at the producer input.",
        "Calculates the secondary-consumer level as 400 kilojoules, using ten per cent of the previous level rather than ten per cent of 40,000.",
      ],
      check: {
        accepted: [
          "400",
          "400 kJ",
          "400 kilojoules",
          "400 kilojoules per square metre per year",
          "400 kJ per square metre per year",
          "400 kilojoules per square meter per year",
        ],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Name the group of organisms that converts nitrogen gas into a form that plants can use, and state one place where this conversion happens.",
      modelAnswer:
        "Nitrogen-fixing bacteria, for example Rhizobium in the root nodules of legumes.",
      marking: [
        "Names nitrogen-fixing bacteria or Rhizobium rather than a decomposer or a nitrifying bacterium.",
        "Gives a valid location, such as root nodules or the soil.",
      ],
      check: {
        accepted: [
          "Nitrogen-fixing bacteria, for example Rhizobium in the root nodules of legumes.",
          "Nitrogen-fixing bacteria, for example Rhizobium in the root nodules of legumes",
          "nitrogen-fixing bacteria",
          "nitrogen fixing bacteria",
          "rhizobium",
          "rhizobium in root nodules",
          "nitrogen-fixing bacteria in root nodules",
          "nitrogen fixing bacteria in the soil",
        ],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A forest is cleared and the timber is burned. Explain the effect on the carbon cycle and on the amount of energy available to the remaining food web. Include one effect that lasts after the fire has ended.",
      modelAnswer:
        "Burning the timber releases carbon that was stored in the trees as carbon dioxide, so the atmosphere receives a rapid input of carbon instead of the slower release that would have occurred through decomposition. Clearing the trees also removes the producers that were capturing carbon through photosynthesis, so the rate of carbon removal falls. The remaining food web receives less energy because the producers are gone and the stored energy in the timber has been converted to heat and carbon dioxide rather than passed to consumers. After the fire, ash may add some minerals to the soil, but repeated burning and erosion can remove nutrients, and the loss of leaf litter reduces the material available to decomposers, so the ecosystem may take a long time to recover its carbon and nutrient stores.",
      marking: [
        "Explains that combustion releases stored carbon as carbon dioxide rather than recycling it directly into the food web.",
        "Explains that removing producers reduces photosynthesis and therefore the energy entering the community.",
        "Names a lasting effect, such as nutrient loss, erosion, reduced decomposition or slow recovery of carbon storage.",
        "Uses the distinction between energy flow and matter cycling rather than treating the fire as a complete cycle.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A new dam slows a river and traps sediment that used to travel downstream. Explain two ways this could change the downstream food web and the cycling of carbon or nitrogen. Include one direct effect and one indirect effect, and describe the evidence you would collect to test your explanation.",
      whyItTransfers:
        "The lesson uses a woodland and a rocky shore to teach energy transfer, decomposition and nutrient cycling. A dam is a different system with a human-made boundary, so the learner must decide which of the same principles still apply, separate a direct change from an indirect one, and specify measurements rather than assuming that a slower river is automatically better or worse.",
      answer:
        "The dam traps sediment and the organic matter and minerals attached to it, so downstream producers may receive fewer nutrients; that is a direct effect on the material available at the base of the food web. The clearer water and changed flow may also alter the temperature, oxygen and light conditions, which can change which algae and plants grow. An indirect effect could travel through the web: if the abundance of a small fish changes because its food or shelter changes, the birds or larger fish that eat it may also change. The river downstream may also receive fewer dead leaves and less coarse material, so decomposers have less to break down and the release of carbon dioxide and mineral ions may fall. To test the explanation, I would measure nutrient concentrations, sediment deposition, algal and plant abundance, dissolved oxygen, the abundance of the main consumers, and decomposition rates in leaf bags above and below the dam, before and after the change. I would also sample more than one site and repeat over seasons, because a single visit cannot separate the dam's effect from natural variation.",
      marking: [
        "Names a direct effect of the dam on sediment, nutrients, flow, temperature or light at the base of the food web.",
        "Names an indirect effect that travels through at least one feeding link or through decomposition.",
        "Links the change to carbon or nitrogen cycling, rather than only to the number of fish.",
        "Specifies repeatable measurements before and after the dam, with at least one control or comparison site.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the difference between a population and a community.",
      answer:
        "A population is all the individuals of one species in an area, while a community is all the populations of different species living and interacting there.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Why is a pyramid of energy always upright?",
      answer:
        "Energy is lost at every transfer, mainly as heat from respiration, so each trophic level has less energy available than the level below it.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Describe the roles of nitrogen-fixing, nitrifying and denitrifying bacteria in the nitrogen cycle.",
      answer:
        "Nitrogen-fixing bacteria convert nitrogen gas into ammonia or ammonium; nitrifying bacteria convert ammonium into nitrite and then nitrate; denitrifying bacteria convert nitrate back into nitrogen gas, especially in low-oxygen conditions.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "Why is dead plant material not simply waste in an ecosystem?",
      answer:
        "Decomposers break it down and release carbon dioxide and mineral ions, which become available to producers again; it is a nutrient reservoir, not a dead end.",
      when: "month-later",
    },
  ],

  summary: [
    "An ecosystem is a community of organisms together with the non-living conditions around it; populations, communities and habitats describe different levels within that system.",
    "Energy enters as light captured by producers and moves along feeding links; at each transfer, much of it is lost as heat and in waste, so pyramids of energy are upright and food chains are short.",
    "Carbon, water and nitrogen move between organisms and non-living reservoirs, and decomposers release mineral ions and carbon dioxide that make the cycles continue.",
    "Feeding webs are interdependent, so a disturbance can have direct and indirect effects; the outcome depends on the strength of the links, other pressures and time, and must be monitored rather than assumed.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every arrow in the food web and every stage of the carbon and nitrogen cycles is described in words in the surrounding prose, so the meaning does not depend on the direction of a symbol that a screen reader might not announce.",
    },
    {
      need: "colour-vision",
      alternative:
        "Trophic levels, decomposers and the two energy pathways are identified by names and labels rather than by colour alone; the food web can be followed from the written links in greyscale.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson is divided into short headed sections, each technical term is defined where it first appears, and the key distinctions are repeated in the summary and retrieval prompts.",
    },
    {
      need: "motor",
      alternative:
        "All guided and assessment answers can be typed or selected; no diagram labels need to be dragged, and no part of the lesson is timed.",
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
        "Scope cited against the published GCSE biology subject content for ecology and ecosystems.",
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
