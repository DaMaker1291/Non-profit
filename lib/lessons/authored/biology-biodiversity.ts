import type { AuthoredLesson } from "../../lesson-contract";

// BIODIVERSITY IS EASY TO REDUCE TO A SPECIES COUNT. That count is useful, but
// it cannot see genetic variation, relative abundance or the variety of
// habitats, and it cannot tell a learner why a reserve may fail to save a
// species whose threat operates outside its boundary. This lesson teaches the
// three levels of variety, the evidence a survey can and cannot provide, and
// the rule that a conservation method must answer the pressure that is actually
// driving the decline.
export const BIOLOGY_BIODIVERSITY: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "biodiversity",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference: "GCSE Biology, ecology: biodiversity and ecosystems",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published ecology subject content. No specification, examination question or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish genetic, species and ecosystem diversity, and explain why a species count alone is an incomplete description of a community.",
      evidence:
        "The learner gives an example in which two habitats have the same number of species but different diversity because the abundance of those species differs.",
    },
    {
      statement:
        "Use quadrat data to estimate the density of organisms and to compare species richness with evenness.",
      evidence:
        "The learner divides a mean count by the quadrat area to obtain a density per square metre and separates the number of species from how evenly individuals are distributed among them.",
    },
    {
      statement:
        "Match a conservation measure to the pressure it addresses, and explain why a protected area alone may not remove a threat.",
      evidence:
        "The learner names the specific pressure, chooses a measure that acts on it, and identifies at least one way the measure could fail without monitoring or action outside the protected area.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["ecosystems"],
    check: [
      {
        id: "d1",
        question:
          "In an ecosystem, does energy cycle round forever, or does it flow in one direction? What happens to matter?",
        answer:
          "Energy flows through the community and is gradually lost as heat, so a food chain needs a continuous input from producers. Matter is recycled by decomposers and can be used again.",
        targets: ["ecosystems"],
      },
      {
        id: "d2",
        question:
          "What job do decomposers do in a food web, and why would a community struggle without them?",
        answer:
          "Decomposers break down dead organisms and waste, releasing mineral nutrients into the soil or water. Without them, nutrients would remain locked in dead material and producers would run short.",
        targets: ["ecosystems"],
      },
    ],
  },

  introduction: {
    hook:
      "A mown lawn may contain a dozen kinds of plant and still support far less life than a nearby hedgerow. The lawn's plants are mostly the same few grasses, cut to the same height, with little shelter and few flowers. The hedgerow has more layers, more variation within each species and many more places to feed, nest and hide. Counting the names on each list would not reveal that difference. Biodiversity is not a score awarded for the length of a species list; it is the variety of living material at several levels, and the way that variety is arranged.",
    why:
      "Biological diversity is usually described at three connected levels. Genetic diversity is the variation in inherited information within a species. Species diversity is the number of species in a community together with their relative abundance. Ecosystem diversity is the range of habitats and the interactions among them across a landscape. All three can support stability and provide resources people depend on, but none is automatically protected by giving a place a name. Surveys turn impressions into evidence, and conservation has to act on the pressure that is actually reducing the variety.",
  },

  explanation: [
    {
      heading: "Variety exists at three connected levels",
      paragraphs: [
        "Genetic diversity is the variety of alleles within a population. It is the raw material on which natural selection acts, and it can differ greatly between two populations that look alike. A field of one cloned crop variety may cover many hectares yet contain almost no genetic variation for disease resistance. A wild grass population of the same size may contain many combinations of alleles, so a new pathogen is less likely to be able to infect every plant. The population is not healthier because it has more species; it is more resilient because its individuals are not all the same.",
        "Species diversity combines two measurements: species richness and evenness. Species richness is the number of different species present. Evenness describes how individuals are divided among those species. Two ponds can both contain five species, but if one pond has roughly equal numbers of all five and the other is ninety per cent one species, the first is more diverse in the sense ecologists usually mean. Ecosystem diversity adds a larger scale: a landscape with a river, reedbed, woodland and dry meadow contains more kinds of habitat, and more ways of life, than a landscape of the same area given over to one uniform field.",
      ],
    },
    {
      heading: "Variety provides insurance, not a guarantee",
      paragraphs: [
        "A community with many species is not automatically stable, but it often has more capacity to absorb a disturbance. Different species respond to heat, drought, disease or a change in water level in different ways, so a community with a wider range of responses is less likely to lose all of its functions at once. Ecologists describe this as response diversity. Functional redundancy adds another layer: several species may perform a similar role, such as pollination or decomposition, so the loss of one does not immediately remove the process entirely. The protection is partial, and a community can still cross a threshold if the disturbance is severe or sustained.",
        "The same argument applies within a species. Genetic variation allows some individuals to tolerate a new disease, a warmer period or a change in food supply, and their offspring can carry those alleles forward. Very small populations lose variation through genetic drift and may suffer inbreeding, which can reduce fertility and offspring survival. Diversity also underpins ecosystem services: pollination, pest control, soil formation, flood regulation, carbon storage and the provisioning of food, timber and medicines. These are practical benefits, not merely aesthetic ones, though the value people place on a species or landscape is also a legitimate reason to protect it.",
      ],
    },
    {
      heading: "A survey is evidence only when its method is stated",
      paragraphs: [
        "Species richness can be estimated by recording the species present in a sample, but the result depends on the area sampled, the time of year, the effort spent looking and the skill of the observer. A single visit to a wood in winter will miss many plants and insects that a summer survey would find. Quadrats make sampling more comparable when they are placed randomly, used repeatedly and applied to the same area at the same time of year. Random placement matters because an observer who chooses a frame position may unconsciously choose a flower-rich patch or avoid a nettle bed, which biases the estimate.",
        "A quadrat can be used to count individuals or to estimate percentage cover. If the quadrats are each half a square metre, the mean count per quadrat is not yet a density per square metre; it must be divided by the quadrat's area. For example, a mean of fifteen daisies in a half-square-metre quadrat gives thirty daisies per square metre. Repeats reduce the effect of an unusual patch, but they do not remove the need to describe where the samples came from. A survey that reports only a total species count, with no area, season, effort or method, cannot support a strong comparison between two places.",
      ],
    },
    {
      heading: "Conservation has to act on the pressure",
      paragraphs: [
        "Habitat loss is often the largest pressure, but it is not the only one. Fragmentation leaves small patches that may hold small populations and offer little movement between them. Overexploitation removes adults faster than a population can replace them. Nutrient pollution can trigger eutrophication, in which an algal bloom dies, decomposers consume oxygen and fish suffocate. Invasive species can compete with, prey on or infect native organisms, and climate change can shift the conditions to which a species is adapted. A measure chosen without identifying which pressure is operating is a guess dressed as a plan.",
        "Protected areas can be valuable, especially when they are large, well managed and connected to other habitat. A corridor can allow movement between patches, a quota can limit the number of adults removed, and a biosecurity rule can stop an invasive species from arriving. Seed banks and captive breeding can preserve genetic material or individuals when a wild population is close to loss, but they are insurance rather than a substitute for repairing habitat. Conservation also has to be monitored. If a measure is not reducing the pressure, or the population does not respond, the plan should change rather than being declared successful because the area is now on a map.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A wildlife corridor is a strip of habitat that joins two larger patches. It has value for movement because animals can cross between patches without entering unsuitable land, which lets individuals find mates and allows a population to recolonise a patch after a local loss. Its usefulness depends on its width, the cover it provides and whether the land around it is hostile; a narrow strip beside a busy road is not the same corridor as a broad band of native vegetation.",
      notation: "habitat patch A ↔ connected native corridor ↔ habitat patch B",
      caption:
        "The corridor is not merely a line on a map. It is a structure whose function is movement, and it works only if an animal will actually enter it, survive the crossing and find suitable habitat at the other end.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Habitat fragmentation divides a continuous area into isolated pieces. A small patch supports a smaller population, so genetic drift and inbreeding become more likely because there are fewer unrelated mates available. Edges also increase: the boundary of a patch is drier, windier and more exposed than its interior, and species that need deep shade or undisturbed soil can disappear from a patch that still looks green from above.",
      notation: "continuous habitat → road or clearing → isolated patches → smaller populations → reduced gene flow",
      caption:
        "The sequence explains why a landscape can lose species even when the total area of green space stays the same. The damage is in the division and the new edges, not only in the number of hectares removed.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "Fertiliser washed from fields carries nitrate and phosphate into a river. Those nutrients cause an algal bloom because the algae have been released from a limiting factor. When the algae die, decomposers break them down and use oxygen from the water, so oxygen levels fall and fish and invertebrates may suffocate. The pollution is not the algae themselves; it is the nutrient input that sets the whole sequence in motion.",
      notation: "nutrient runoff → algal bloom → decomposition → oxygen depletion → animals die",
      caption:
        "A food chain can be damaged without a poison being sprayed directly into the water. The added nutrient changes the growth of one group, and the oxygen demand of the decomposers then affects everything else.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A quadrat survey places a square frame at coordinates generated randomly within the study area, because random placement avoids the observer choosing unusually flower-rich ground. The same frame size and the same number of repeats are used at each site, and the survey is repeated at the same season. The count from each quadrat is recorded separately before a mean is calculated, so that one unusually crowded quadrat remains visible in the data.",
      notation: "quadrat area 0.5 m² · counts 14, 16, 12, 18 · mean 15 per quadrat · density 30 per m²",
      caption:
        "The method is part of the result. A quadrat sample estimates a larger area only when its placement, size, number of repeats and season are stated, and the estimate carries the variation between quadrats as well as the mean.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A student surveys daisies in a meadow with four quadrats, each covering half a square metre. The counts are 14, 16, 12 and 18. Estimate the mean number of daisies per square metre.",
      steps: [
        {
          move:
            "Check that the four samples cover the same area and were taken in the same way.",
          why:
            "A mean can be compared only when the samples are comparable. If one quadrat were one square metre and the others half a square metre, its count would represent twice the ground area and would inflate the estimate.",
        },
        {
          move:
            "Add the four counts and divide by four to find the mean number per quadrat.",
          why:
            "The four counts are separate observations of the same-sized sample. Their mean is the best simple estimate of the number in a typical half-square-metre quadrat, and it is 15.",
        },
        {
          move:
            "Divide the mean count by the area of one quadrat to convert it to a density per square metre.",
          why:
            "Fifteen daisies occupy half a square metre, so one square metre would hold twice as many if the habitat were uniform. The calculation is 15 divided by 0.5, which gives 30.",
        },
      ],
      answer: "The estimated mean density is 30 daisies per square metre.",
    },
    {
      id: "w2",
      prompt:
        "A lake contains 20 fish species. One introduced species makes up 85 per cent of all the fish caught. Ten years earlier the same 20 species were present, but the most abundant species made up only 20 per cent of the catch. Explain what has changed and why a species count alone would hide it.",
      steps: [
        {
          move:
            "Compare the species richness of the two surveys before comparing anything else.",
          why:
            "Both surveys list 20 species, so richness has not changed. If the investigation stopped at that number, it would report no difference and miss the change in the community entirely.",
        },
        {
          move:
            "Compare how evenly the individuals are divided among the species.",
          why:
            "Ten years ago the commonest species held one fifth of the catch, leaving the other nineteen species to share four fifths. Now one species holds 85 per cent, so the others are compressed into a much smaller share. Evenness has fallen sharply even though richness has not.",
        },
        {
          move:
            "Link the loss of evenness to a likely ecological consequence and say what evidence would test it.",
          why:
            "A community dominated by one introduced fish may have lost native predators, competitors or prey, and the other species may be at risk of local extinction. Counts alone cannot show whether the native species are breeding, so the next evidence should include juvenile numbers, repeated surveys and the abundance of each species.",
        },
      ],
      answer:
        "The lake still has 20 species, but its evenness has fallen because one introduced species now dominates the catch. Species richness is unchanged, so a count that stopped at 20 would hide the shift. The decline in native species' share is evidence of a changed community, but breeding and repeated survey data would be needed to show whether those species are being lost.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Biodiversity is just the number of different species in a place.",
      whyItFails:
        "A species list ignores how individuals are divided among those species, the genetic variation inside each one and the variety of habitats across the landscape. A field with ten weed species, nine of which are represented by a single plant, is not equivalent to a meadow where all ten are abundant and interacting.",
      correction:
        "Describe diversity at the level the question is asking about. Use species richness for the count, evenness for the balance of abundance, genetic diversity for variation within a population and ecosystem diversity for the range of habitats in an area.",
      contrast: {
        wrong: "both sites have eight species, so both are equally biodiverse",
        right: "both sites have eight species, but the site where those species are more evenly abundant and genetically varied is the more diverse",
      },
    },
    {
      id: "m2",
      belief: "Once a species is inside a protected reserve, it is safe.",
      whyItFails:
        "A reserve protects only the area inside its boundary. A migratory animal may be hunted or lose habitat elsewhere, polluted water or air can cross the boundary, an invasive predator can enter, and climate change can make the reserve unsuitable even if its fence is intact. Legal protection also depends on enforcement and on the species being able to breed.",
      correction:
        "Name the specific pressure and check whether the reserve actually removes it. If the pressure operates outside the boundary, the plan also needs action there: corridors, quotas, pollution controls, biosecurity, restoration or monitoring.",
      contrast: {
        wrong: "the colony is in a nature reserve, so the species is conserved",
        right: "the reserve protects the nesting site, but the birds also need safe feeding areas and a reduction in fishing bycatch along their migration route",
      },
    },
    {
      id: "m3",
      belief: "Planting trees always increases biodiversity.",
      whyItFails:
        "Tree cover is a structure, not a community. A plantation of one fast-growing species can shade out a flower-rich grassland, provide little food for insects that need native plants, and produce a uniform canopy with few nesting sites. If the trees are planted on a peat bog or a species-rich meadow, the change can reduce both species and ecosystem diversity.",
      correction:
        "Ask what habitat was there before, what the planting is meant to achieve and which species will use it. Restoration usually needs a mixture of native species, varied structure, connected habitat and a plan for grazing, water and long-term monitoring.",
      contrast: {
        wrong: "more trees means more biodiversity, so any plantation is an improvement",
        right: "the right trees in the right place can restore habitat, but a monoculture on a rare grassland can destroy more diversity than it creates",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Two ponds each contain the same five invertebrate species. In Pond A the five species have similar numbers. In Pond B one species makes up 90 per cent of the individuals. Which pond has the greater species diversity, and which measurement stays the same?",
      hint:
        "Keep the number of species separate from the balance of their abundances. Which of those two measurements is unchanged by the dominance of one species?",
      answer:
        "Pond A has the greater species diversity because its individuals are more evenly divided among the five species. Species richness is the same in both ponds, because both contain five species.",
      feedback: {
        correct:
          "You separated richness from evenness. The number of species is identical; the difference is in how the individuals are distributed.",
        incorrect:
          "A species count alone cannot tell these ponds apart. Compare the share of individuals in each species as well as the number of species.",
      },
    },
    {
      id: "p2",
      prompt:
        "A plant population is reduced to 25 individuals after its habitat is divided by a road. Suggest why its genetic diversity may now be low, and name one measure that could protect the remaining variation.",
      hint:
        "A small population has fewer unrelated mates, and a road can stop movement. Think about both the cause of the loss and a way to keep alleles available.",
      answer:
        "With only 25 individuals, the population is likely to lose variation through genetic drift and inbreeding, and the road prevents gene flow from neighbouring populations. A seed bank could store seeds from the remaining plants, while a corridor or carefully planned translocation could allow movement between fragments; both need monitoring.",
      feedback: {
        correct:
          "You linked population size and isolation to genetic diversity, then proposed a measure that addresses the loss rather than only the habitat.",
        incorrect:
          "The question is about variation inside the species, not the number of species. Consider how many unrelated mates remain and whether the road prevents gene flow.",
      },
    },
    {
      id: "p3",
      prompt:
        "A river receives a large input of nitrate from farmland. Predict two changes that may follow downstream and explain why the second one can kill fish.",
      hint:
        "Nitrate is a nutrient. Follow the growth of algae, then ask what happens to the oxygen when those algae die.",
      answer:
        "The nitrate can cause an algal bloom, and when the algae die decomposers break them down and use oxygen from the water. Oxygen levels fall, so fish and other animals that need dissolved oxygen may suffocate.",
      feedback: {
        correct:
          "You followed the nutrient through the bloom and the decomposers to the oxygen supply, which is the mechanism rather than just a list of effects.",
        incorrect:
          "Nitrate does not poison fish directly in this sequence. Trace what the added nutrient makes grow, and what happens to oxygen when that growth dies.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A survey of birds in two woods recorded these counts over the same four mornings. Woodland A: 22 blue tits, 20 great tits, 18 robins and 16 blackbirds. Woodland B: 60 blue tits, 6 great tits, 5 robins and 5 blackbirds. Both woods contain the same four species. Explain which woodland has the greater species diversity and what additional evidence you would collect before calling one woodland better for birds.",
      modelAnswer:
        "Both woods have the same species richness, because both contain four species. Woodland A has the greater species diversity because its individuals are much more evenly divided among the four species; Woodland B is dominated by blue tits. Before calling one woodland better for birds I would need evidence on breeding, not just a count: repeated surveys at the same season, records of nests and juveniles, the area and structure of each wood, and whether the birds are surviving and returning. A count from four mornings could also miss species that are present but quiet or scarce.",
      marking: [
        "States that species richness is equal because both woods contain four species.",
        "Identifies Woodland A as more diverse because its abundance is more even, not because it has more species.",
        "Explains that abundance and breeding evidence, not just a count, are needed to judge the wood's value for birds.",
        "Names at least one further source of evidence, such as repeated or seasonal surveys, nesting records, habitat structure or survival.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A quadrat covering 0.25 square metres contains 18 daisies. Estimate the density of daisies in daisies per square metre.",
      modelAnswer: "72 daisies per square metre",
      marking: [
        "Divides the count by the quadrat area rather than reporting 18 as the density.",
        "Reports the answer in daisies per square metre.",
      ],
      check: {
        accepted: [
          "72",
          "72 daisies per square metre",
          "72 daisies per square meter",
          "72 per square metre",
          "72 per square meter",
          "72/m2",
        ],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Two woodlands each contain six species. In Woodland X, the species have similar numbers of individuals. In Woodland Y, one species makes up most of the individuals. Which woodland has the greater species diversity?",
      modelAnswer:
        "Woodland X, because its species are more evenly represented.",
      marking: [
        "Chooses Woodland X rather than Woodland Y.",
        "Gives evenness, or the balance of abundance, as the reason rather than species richness.",
      ],
      check: {
        accepted: [
          "Woodland X, because its species are more evenly represented.",
          "Woodland X",
          "X",
          "the first woodland",
          "woodland x because it is more even",
          "woodland x because the individuals are more evenly distributed",
        ],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A coastal fish stock is declining because too many adults are caught before they can breed. A proposal is to create a no-take reserve covering 15 per cent of the fishing ground. Explain why the reserve may help but is unlikely to be enough on its own, and propose two additional measures.",
      modelAnswer:
        "The reserve can protect adults inside its boundary, allowing them to grow and breed and possibly supplying young to nearby water. But fishing continues across the other 85 per cent, so adults are still removed before breeding there, and the reserve may be too small or in the wrong place to protect the stock's spawning and nursery grounds. Additional measures could include a catch quota or a minimum size that lets fish breed before capture, a closed season during spawning, restrictions on bycatch and gear, and monitoring of the stock so the limits can be adjusted. The measures must be enforced and must address the cause, which is the rate of removal, not merely the location of fishing.",
      marking: [
        "Explains that the reserve protects only part of the stock or habitat, so the pressure continues outside it.",
        "Names the relevant pressure as the removal of adults before breeding, not simply 'fishing'.",
        "Proposes at least two measures that act on that pressure, such as quotas, size limits, a closed season, bycatch reduction or enforcement.",
        "Recognises that monitoring or adjustment is needed to show whether the measures work.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "An island bird population has fallen to about 40 individuals. Conservationists propose moving 12 birds from a mainland population of the same species to breed with the island birds. Evaluate the proposal. Your answer should consider both the possible genetic benefit and the risks, and say what evidence should be collected before and after the move.",
      whyItTransfers:
        "The lesson explains genetic diversity and conservation in familiar habitats. Here the learner must apply the same reasoning to a tiny island population, weigh a genetic rescue against ecological and disease risks, and specify evidence rather than assuming that adding individuals is automatically beneficial.",
      answer:
        "The island population is small enough to have lost genetic variation through drift and inbreeding, so introducing unrelated birds could raise variation and improve the chances of healthy offspring. This is a genetic rescue. The risks are equally real: the mainland birds may carry a disease or parasite to which the island population has little resistance, their adaptations may be poorly matched to island conditions, and mixing two populations that have been separated for a long time can sometimes reduce offspring fitness rather than improve it. The release could also fail if the island habitat is still limiting. Before the move, the team should screen both populations for disease, check that they are the same species and that the habitat can support more birds, and set a baseline for genetic variation, survival and breeding. After the move, they should monitor survival, nesting success, offspring health and the island population's trend, with a plan to stop or reverse the introduction if it causes harm.",
      marking: [
        "Identifies the island population's small size and isolation as reasons for low genetic diversity.",
        "Explains the potential benefit of adding unrelated alleles, rather than treating all movement as automatically good.",
        "Names at least two risks, such as disease, maladaptation, outbreeding effects or continued habitat limitation.",
        "Specifies pre-release screening and post-release monitoring with a measurable outcome.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Name the three levels at which biodiversity is usually described.",
      answer:
        "Genetic diversity within species, species diversity within communities, and ecosystem or habitat diversity across a landscape.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A quadrat of 0.5 square metres contains a mean of 9 beetles. What is the estimated density per square metre?",
      answer:
        "18 beetles per square metre, because 9 divided by 0.5 is 18.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why can two habitats with the same species richness have different species diversity?",
      answer:
        "Species diversity also depends on evenness: in one habitat the individuals may be spread fairly evenly among the species, while in the other one species may dominate.",
      when: "month-later",
    },
  ],

  summary: [
    "Biodiversity has three connected levels: genetic variation within a species, species diversity within a community and the variety of ecosystems across a landscape.",
    "Species diversity depends on both the number of species present and how evenly individuals are divided among them; a species count alone is incomplete.",
    "Diverse communities and populations are often more resilient because different species and alleles respond differently to change, but diversity is not an absolute guarantee of stability.",
    "Conservation has to identify the pressure and act on it; a reserve, a seed bank or a tree-planting scheme helps only when it addresses the cause of the decline and is monitored.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every survey table is also described in prose, and the direction of each process is written in words as well as shown by an arrow, so no meaning depends on layout or symbol shape.",
    },
    {
      need: "colour-vision",
      alternative:
        "Habitats and species are identified by labels and names, never by colour alone; the corridor and fragmentation diagrams can be understood from their captions in greyscale.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson is divided into short headed sections, each new term is defined where it first appears, and the key comparisons are repeated in the summary and retrieval prompts.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers can be typed or selected; no diagram labels need to be dragged, and no timed action is required.",
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
        "All explanations, survey examples, practice and assessments are original to OpenMind.",
    },
    {
      sourceId: "gcse-biology-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for ecology and biodiversity.",
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
