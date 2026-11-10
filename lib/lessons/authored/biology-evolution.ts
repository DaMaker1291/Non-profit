import type { AuthoredLesson } from "../../lesson-contract";

// EVOLUTION IS OFTEN TAUGHT AS A STORY OF PROGRESS. That framing produces the
// same errors every year: an individual "adapts" because it needs to, the
// fittest is the strongest, antibiotics create resistance, and evolution is
// assumed to be random. This lesson keeps three claims separate: variation
// arises without regard to need, selection changes which inherited variants
// leave descendants, and a population changes only when allele frequencies
// change across generations. Antibiotic resistance is the worked example
// because it is observable, medically important and easy to mistranslate into
// "the body became resistant". Speciation is treated as a consequence of
// isolation and reproductive separation, not as a ladder of improvement.
export const BIOLOGY_EVOLUTION: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "evolution",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, inheritance, variation and evolution: natural selection, speciation, evidence for evolution and antibiotic resistance",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain how heritable variation arises, and distinguish a change in an individual during its lifetime from a change in the allele frequencies of a population over generations.",
      evidence:
        "The learner identifies mutation, meiosis and random fertilisation as sources of variation, and states that an acquired characteristic is not inherited in the way natural selection requires.",
    },
    {
      statement:
        "Explain natural selection as differential survival and reproduction acting on existing variation, and calculate or interpret a change in allele frequency.",
      evidence:
        "The learner orders the steps from variation to changed allele frequency, distinguishes selection from genetic drift, and calculates a frequency before and after a selection event.",
    },
    {
      statement:
        "Explain how antibiotic resistance evolves and how geographic isolation can lead to reproductive isolation and a new species, using evidence rather than assumption.",
      evidence:
        "The learner explains that the antibiotic selects resistant bacteria rather than creating them, and describes the sequence from separated populations to a population that can no longer produce fertile offspring with the original one.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["genetics"],
    check: [
      {
        id: "d1",
        question:
          "What is an allele, and how does an offspring receive one from each parent?",
        answer:
          "An allele is a version of a gene. A diploid offspring receives one allele of each gene from each parent through the gametes, so its two copies may be the same or different.",
        targets: ["genetics"],
      },
      {
        id: "d2",
        question:
          "Why can two parents produce offspring with combinations of alleles that neither parent has?",
        answer:
          "Meiosis shuffles the parents' alleles through crossing over and independent assortment, and fertilisation combines one gamete from each parent at random. The offspring's combination can therefore differ from either parent's.",
        targets: ["genetics"],
      },
    ],
  },

  introduction: {
    hook:
      "A hospital patient is given an antibiotic for a chest infection. Most of the bacteria in the patient's lungs are killed, and the patient begins to feel better. A few bacteria survive because they already carry a variant that the drug does not affect. Those survivors reproduce, and the population that remains is dominated by their descendants. The antibiotic did not teach the bacteria anything, and the patient's body did not become resistant. A population changed because a drug removed its susceptible members and left the resistant ones to multiply.",
    why:
      "Evolution is a change in the inherited characteristics of a population over generations. At the level of genetics, it is a change in allele frequencies: the relative abundance of different versions of genes in a population's gene pool. Natural selection is one mechanism that can cause that change. Individuals vary, some variants leave more surviving offspring in a particular environment, and the alleles associated with those variants become more common. Selection is not a conscious process and it has no goal; it works on the variation that is already present. The same logic explains the beaks of Darwin's finches, the spread of antibiotic resistance and the divergence of populations that become separate species.",
  },

  explanation: [
    {
      heading: "Variation is inherited, and mutation is not a response to need",
      paragraphs: [
        "A population is a group of individuals of the same species living in the same area and able to interbreed. Its gene pool is the sum of the alleles carried by those individuals. Evolution occurs when the frequencies of alleles in that gene pool change across generations. An individual does not evolve during its lifetime in the sense that matters here: an animal may grow larger, learn a skill or become resistant to a disease, but those changes are not passed on unless they involve heritable material in the gametes. A population evolves when the inherited variants that reach the next generation become more or less common.",
        "Heritable variation has several sources. Mutation changes the DNA sequence and can create a new allele. Meiosis produces gametes with different combinations of alleles through crossing over and independent assortment, and fertilisation combines two gametes at random. These processes generate variation in the offspring without any need for the environment to direct it. A mutation is random with respect to whether it will be useful: most mutations are neutral or harmful, and a small minority happen to improve survival or reproduction in a particular environment. The environment does not cause the mutation that solves the problem; it determines whether the variant that already exists is favoured.",
        "An organism's phenotype is the observable result of its genotype interacting with the environment. A plant may be short because it has short-stem alleles, because it grew in poor light, or because both are true. Natural selection can act only on the heritable part of that variation. If a trait is acquired during life, such as a suntan, a scar or a skill, it does not change the alleles passed to offspring in the way evolution requires. This is why the phrase 'it adapted during its lifetime' is not a complete explanation: it describes a change in an individual, not a change in the population's gene pool.",
      ],
    },
    {
      heading: "Natural selection changes the frequencies of alleles",
      paragraphs: [
        "A selection pressure is a factor that makes some variants more likely than others to survive and reproduce. Predators, disease, competition for food, extremes of temperature, difficulty finding a mate and a drug used to treat an infection can all act as pressures. The individuals that survive are not necessarily the strongest or the fastest; they are the ones that leave more surviving offspring in that environment. A small, well-camouflaged insect may leave more descendants than a larger insect that is easier for a bird to see. Fitness is therefore a measure of reproductive success in a particular context, not a general score of physical power.",
        "The sequence is often written as variation, selection, inheritance and repetition. Variation already exists in the population because of mutation, meiosis and random fertilisation. A selection pressure makes some variants more likely to survive and reproduce. The survivors pass their alleles to the next generation, so the frequencies of those alleles rise. The next generation still varies, and the process can continue if the pressure persists. The population may become better adapted to that environment over many generations, but it has not chosen to change and it is not striving towards a goal. If the environment changes again, the direction of selection can change with it.",
        "Genetic drift is a different mechanism. It is a random change in allele frequencies, especially in small populations, caused by chance events such as a storm, a landslide or simply which individuals happen to reproduce. Drift can make an allele more common or remove it entirely without that allele being better or worse. Selection and drift can operate at the same time, which is why a change in frequency is not automatically proof that the variant was advantageous. A strong conclusion needs evidence that survival or reproduction was associated with the trait, not merely that the frequency changed.",
        "The phrase 'survival of the fittest' is misleading if 'fittest' is read as 'strongest'. A trait that is useful in one environment can be a disadvantage in another: a thick coat helps in the cold and costs energy in the heat, and a large beak can crack hard seeds but may be less efficient for small soft ones. Selection also depends on mate choice and on the number of offspring that survive, not only on the ability to win a fight. The useful question is not 'which animal is best?' but 'which inherited variants leave the most descendants in this environment, and why?'",
      ],
    },
    {
      heading: "Antibiotic resistance is evolution in action",
      paragraphs: [
        "A population of bacteria usually contains variation in its genes, including genes involved in the cell wall, drug uptake, drug efflux or the target of an antibiotic. When an antibiotic is used, it kills or inhibits the bacteria that are susceptible. Bacteria that already carry a variant that reduces the drug's effect are more likely to survive and reproduce. Their descendants inherit the resistance allele, and the frequency of that allele in the population rises. The antibiotic is a selection pressure; it does not create the resistance allele, and it does not teach the bacterium to resist.",
        "Resistance can spread quickly because bacteria reproduce rapidly and can pass resistance genes between cells, sometimes on plasmids. That horizontal transfer means a resistance gene can move between species, not only from parent to daughter cell. Incomplete courses, unnecessary prescriptions, low doses and widespread use in agriculture can all increase the opportunity for resistant variants to survive and multiply. A course of antibiotics should be used only when appropriate, at the prescribed dose and for the prescribed duration; stopping early because the patient feels better can leave surviving bacteria behind.",
        "It is the bacteria that become resistant, not the human body. A patient may carry a resistant strain and feel unwell again, but their immune system has not 'learned' to resist the drug in the way a vaccine trains memory cells. The resistance is a property of the bacterial population, encoded in its genes. This is also why resistant infections can spread between people: the bacteria, and the genes they carry, move from one host to another. Infection control, surveillance and careful prescribing are therefore part of managing evolution, not separate from it.",
      ],
    },
    {
      heading: "Speciation follows isolation and reproductive separation",
      paragraphs: [
        "A species is often defined as a group of organisms that can interbreed to produce fertile offspring under natural conditions. Members of the same species usually share a gene pool, so alleles can move between populations when individuals mate. If a population is divided by a physical barrier such as a mountain range, a river, a new road or a stretch of sea, the two groups can no longer exchange genes easily. Each group then has its own gene pool and its own supply of new mutations.",
        "Separated populations can diverge because they experience different selection pressures, because chance events affect their allele frequencies differently, and because new mutations arise independently. Over many generations, the differences can accumulate. Reproductive isolation develops when the two groups can no longer interbreed successfully: they may breed at different times, use different courtship signals, live in different habitats, or produce offspring that are infertile or do not survive. At that point, the groups are separate species under the biological species concept, even if they could still be brought together by people.",
        "Geographic isolation is not the only route. In plants, a change in chromosome number during cell division can produce polyploid individuals that cannot breed successfully with the original population, creating reproductive isolation in one step. In other cases, selection within a shared range can produce enough divergence that the groups stop interbreeding. Isolation does not guarantee speciation, and speciation does not have to be complete before the groups look different. The process is a continuum, which is why the boundary between varieties and species can be difficult to draw.",
      ],
    },
    {
      heading: "Several independent kinds of evidence support common ancestry",
      paragraphs: [
        "The fossil record provides evidence of organisms that lived in the past and of changes in form over time. Fossils can show transitional features, and their positions in rock layers give relative ages; radioactive dating can provide absolute ages. The record is incomplete because most organisms do not fossilise, and a gap in the record is not evidence that no intermediate form existed. A fossil is most useful when its age, anatomy and geological context are all considered together.",
        "Comparative anatomy provides another line of evidence. Homologous structures have the same underlying origin but may have different functions in different species, such as the bones in a human arm, a bat wing and a whale flipper. Their similarities are evidence of shared ancestry, while their differences reflect adaptation to different ways of life. Analogous structures, such as the wings of insects and birds, have similar functions but different origins; they are evidence of similar selection pressures, not of close ancestry. Embryonic development and the sequences of DNA and proteins add independent comparisons: species that share a recent common ancestor tend to have more similar sequences than species that diverged longer ago.",
        "Observed evolution provides direct evidence of the process. Antibiotic resistance in bacteria and pesticide resistance in insects can be measured across generations, and laboratory experiments can follow changes in allele frequencies under controlled selection. These observations do not by themselves tell us the full history of life, but they show that the mechanism is real. Evolutionary trees combine fossil, anatomical and molecular evidence; they are hypotheses that can be revised when new data arrive. The strength of the evidence comes from different lines of inquiry pointing in the same direction, not from a single fossil or a single experiment.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A finch's beak is a feeding structure whose function depends on the food available. A deep, strong beak can crack large hard seeds, while a slender beak is better at picking up small soft seeds. Because the two shapes are suited to different foods, a bird whose beak matches the common food in its habitat can feed more efficiently, which lets it survive and raise more offspring when that food is scarce. The beak is not designed by the bird's need; the population's inherited variation is sorted by which shapes work in that environment.",
      notation:
        "small soft seeds → slender beak; large hard seeds → deep, strong beak",
      caption:
        "The structure is not good or bad in the abstract. Its function is a match between the beak and the food, and that match changes when the food supply changes.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Natural selection begins with inherited variation that already exists in a population. A selection pressure makes some variants more likely to survive and reproduce, so those individuals leave more offspring and the alleles associated with their traits become more common. The change is repeated across generations because the offspring inherit the alleles and the pressure continues to act. The process has no goal, and it can reverse if the environment changes.",
      notation:
        "inherited variation → selection pressure → differential survival and reproduction → more offspring with favoured alleles → allele frequencies change → repeat",
      caption:
        "The arrow from variation to selection is not a plan. The variation arises without direction, and the environment only affects which variants leave descendants.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "Speciation can begin when a population is divided by a barrier that stops gene flow. The separated groups experience different selection pressures and different chance events because the barrier prevents alleles from moving between them, so their allele frequencies diverge over many generations. Reproductive isolation evolves when the groups can no longer produce fertile offspring together, and at that point they are separate species. The divergence is a consequence of isolation and accumulated difference, not a single deliberate change.",
      notation:
        "one population → geographic isolation → separate gene pools → different selection, mutation and drift → reproductive isolation → two species",
      caption:
        "The barrier starts the separation, but it is the accumulated genetic and reproductive difference that completes it. Without reproductive isolation, the groups can still exchange alleles if they meet.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A serial-transfer experiment can measure the evolution of antibiotic resistance. A control population is grown without the antibiotic, while a treatment population is exposed to a gradually increasing concentration over many transfers. Samples are taken before and after, the minimum inhibitory concentration is measured, and resistance genes can be sequenced. The control is essential because it shows what would have happened without the antibiotic, and replicate populations are needed because mutation and drift are chance events. The treatment should show a larger increase in resistance if the antibiotic is selecting resistant variants.",
      notation:
        "control: no antibiotic · treatment: increasing concentration · measure: minimum inhibitory concentration and resistance alleles · replicate: several populations",
      caption:
        "A change in one flask is not enough. The comparison between treated and untreated populations, repeated across replicates, is what supports the claim that the antibiotic selected resistance rather than chance producing it.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A diploid insect population has a gene pool of 4,000 alleles, of which 400 are the resistance allele R. After a disease, 1,500 insects survive; their gene pool contains 3,000 alleles, of which 1,200 are R. Calculate the frequency of R before and after the disease, and explain whether the population evolved.",
      steps: [
        {
          move:
            "Divide the number of R alleles before the disease by the total number of alleles before it.",
          why:
            "Allele frequency is the share of a gene pool made up of that allele, not the number of individuals that carry it. The calculation is 400 divided by 4,000, which gives 0.10, or ten per cent.",
        },
        {
          move:
            "Divide the number of R alleles in the survivors by the total number of alleles in the surviving gene pool.",
          why:
            "The surviving population has 1,500 diploid individuals, so its gene pool has 3,000 alleles. The calculation is 1,200 divided by 3,000, which gives 0.40, or forty per cent.",
        },
        {
          move:
            "Compare the two frequencies and state whether the population evolved.",
          why:
            "The frequency of R rose from 0.10 to 0.40 across the disease event. A change in allele frequency across generations is evolution, so the population evolved.",
        },
        {
          move:
            "Distinguish selection from drift and state what further evidence would be needed to claim selection.",
          why:
            "A change in frequency alone does not prove that R was advantageous; the survivors might have been lucky. Selection is supported if insects with R survived or reproduced more often than those without it, and if the change repeats in independent populations. If the change was due to chance, especially in a small population, it is drift.",
        },
      ],
      answer:
        "The frequency of R was 0.10 before the disease and 0.40 after it. The population evolved because the allele frequency changed, but selection is not proved by the change alone; survival and reproduction data are needed to separate selection from drift.",
    },
    {
      id: "w2",
      prompt:
        "A drought leaves mostly large, hard seeds on an island. Before the drought, the finches' beak depth varies. After several generations, the average beak depth is greater. Explain whether this is evolution, and describe the evidence that would show natural selection rather than a coincidence.",
      steps: [
        {
          move:
            "Establish that the population already contained variation in beak depth before the drought.",
          why:
            "Selection cannot create a new variant on demand; it can only change the frequency of variants that are already present. The pre-drought measurements show whether the variation existed before the environment changed.",
        },
        {
          move:
            "Explain how the drought changes the food supply and why beak depth affects survival.",
          why:
            "Large, hard seeds are difficult for a small beak to crack. Birds with deeper beaks can use that food more efficiently, so they are more likely to survive and reproduce when small seeds are scarce. This is the selection pressure.",
        },
        {
          move:
            "Show that the surviving birds pass the trait to their offspring and that the population's allele frequencies change.",
          why:
            "Beak depth is heritable, so the offspring of deep-beaked survivors tend to have deeper beaks. If the survivors leave more offspring, the alleles associated with the trait become more common in the next generation, which is evolution.",
        },
        {
          move:
            "Name the evidence that would distinguish selection from chance.",
          why:
            "The claim is stronger if the researchers measure survival by beak depth, show that deep beaks are heritable, repeat the observation across seasons or islands, and rule out other changes such as a shift in the birds' food or a chance event. A change in the average alone is a pattern; the survival and inheritance data are the mechanism.",
        },
      ],
      answer:
        "The change is evolution if the average beak depth rises because deep-beaked birds survive and reproduce more and the trait is inherited. The evidence needed is a measured association between beak depth and survival, evidence of heritability, and replication across independent populations or years; a change in the average alone could also be caused by drift or by a change in which birds are present.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "An individual evolves during its lifetime because it needs to adapt to a new environment.",
      whyItFails:
        "An individual can change during its life, but those acquired changes are not inherited in the way natural selection requires. Evolution is a change in the allele frequencies of a population across generations. The variation that selection acts on must already be present, and a need does not cause the relevant mutation to appear.",
      correction:
        "Describe the population, not the individual. State that inherited variation exists, identify the selection pressure, and explain which variants leave more offspring. If a trait is acquired during life, it can affect the individual's survival but it does not by itself change the population's gene pool.",
      contrast: {
        wrong:
          "the beetles needed to survive the new pesticide, so they changed colour and passed the change on",
        right:
          "the population already contained colour variants; the pesticide killed more of one colour, so the survivors left more offspring and the colour allele frequencies changed",
      },
    },
    {
      id: "m2",
      belief:
        "Survival of the fittest means that the strongest or fastest individual always survives and evolves.",
      whyItFails:
        "Fitness in evolution is measured by reproductive success, not by strength or speed. A small, camouflaged or well-hidden organism may leave more surviving offspring than a larger, more conspicuous one. A trait that is advantageous in one environment can be a disadvantage in another, and an individual does not evolve at all; the population does.",
      correction:
        "Ask which inherited variants leave the most descendants in this environment, and why. Consider survival to reproduction, mate choice, fertility and offspring survival together. The 'fittest' is a description of the outcome in a particular environment, not a permanent title.",
      contrast: {
        wrong:
          "the biggest male is the fittest, so he must be the one that evolution selects",
        right:
          "the male that leaves the most surviving offspring is the fittest in this environment, and that may depend on camouflage, timing or mate choice rather than size",
      },
    },
    {
      id: "m3",
      belief:
        "Antibiotics create resistant bacteria, or a person's body becomes resistant to antibiotics after taking them.",
      whyItFails:
        "The resistance allele exists in some bacteria before the antibiotic is used, arising through mutation or transfer. The antibiotic kills susceptible bacteria and leaves the resistant ones, so the resistant population grows. The drug is a selective pressure, not a mutagen that deliberately creates the trait. The resistance is carried by the bacteria, not learned by the human body.",
      correction:
        "Explain the bacterial population before and after treatment: variation, killing of susceptible cells, survival and reproduction of resistant cells, and inheritance of the resistance allele. Then distinguish that from the patient's immune memory, which is a different system and is not made resistant to an antibiotic by taking it.",
      contrast: {
        wrong:
          "the antibiotic taught the bacteria to resist it, and now the patient's body is resistant too",
        right:
          "the antibiotic killed the susceptible bacteria and left the resistant variants, so the bacterial population is now mostly resistant; the patient's body has not become resistant",
      },
    },
    {
      id: "m4",
      belief:
        "Evolution is random, so any outcome is equally likely.",
      whyItFails:
        "Mutation and the shuffling of alleles are random with respect to need, but selection is not random: variants that leave more offspring become more common, and that biases the outcome in a particular environment. Genetic drift is a separate random process that can matter in small populations. The combination of random variation and non-random selection is not the same as 'anything can happen'.",
      correction:
        "Separate the sources of randomness from the sorting. Mutation, meiosis and drift are chance processes; natural selection is the non-random consequence of differences in survival and reproduction. The outcome is constrained by the variation available and by the environment, so it is not arbitrary.",
      contrast: {
        wrong:
          "evolution is random, so a population could just as easily become any shape",
        right:
          "the variation appears by chance, but selection consistently favours the variants that work in that environment, so the population is biased in a particular direction",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A population of beetles contains green and brown individuals. Birds hunt them on brown soil. Predict how the allele frequencies will change over many generations and explain why the individual beetles do not change colour.",
      hint:
        "Which colour is easier to see against the soil? Ask which beetles survive and reproduce, not which ones need to change.",
      answer:
        "Brown beetles are better camouflaged on brown soil, so they are less likely to be eaten and more likely to survive and reproduce. The alleles for brown colour become more common in the population, while the green allele becomes less common. An individual beetle does not change colour; the change is in the proportion of colour variants across generations.",
      feedback: {
        correct:
          "You separated the survival of existing variants from a change in an individual, and you described the population's allele frequencies rather than a goal.",
        incorrect:
          "The beetles do not choose to change colour. Start with the variation already present, identify which variant the birds remove more often, and follow the survivors' offspring into the next generation.",
      },
    },
    {
      id: "p2",
      prompt:
        "A waterfall divides a population of fish into two groups that can no longer meet. Explain how the two groups could eventually become separate species.",
      hint:
        "Start with the loss of gene flow. Then add different selection pressures, new mutations and enough time for reproductive isolation.",
      answer:
        "The waterfall prevents the two groups from interbreeding, so each has its own gene pool and its own mutations. Different food, predators or water conditions can select different variants in each group, and chance events can change allele frequencies. Over many generations, the accumulated differences may make the groups unable to produce fertile offspring together, which is reproductive isolation and therefore a new species.",
      feedback: {
        correct:
          "You began with isolation and gene flow, then connected selection and accumulated difference to reproductive isolation.",
        incorrect:
          "The waterfall is the starting condition, not the whole explanation. Without gene flow, the groups can diverge through selection, mutation and drift; the final step is reproductive isolation.",
      },
    },
    {
      id: "p3",
      prompt:
        "A patient feels better after three days of a seven-day antibiotic course and stops taking the medicine. Explain why this can increase the proportion of resistant bacteria.",
      hint:
        "Some bacteria may have survived because they already resist the drug. What happens when the drug is removed and those bacteria are left?",
      answer:
        "Some bacteria in the population may already carry a resistance variant. The antibiotic kills the susceptible ones, but the resistant ones survive. If the patient stops early, those survivors are left in a relatively empty niche and can reproduce, so the resistant proportion rises. Completing the prescribed course, when appropriate, reduces the chance that survivors are left to multiply.",
      feedback: {
        correct:
          "You treated the antibiotic as a selective pressure and followed the survivors, rather than saying the body or the drug created resistance.",
        incorrect:
          "The drug does not teach the bacteria to resist. Think about the few bacteria that already survive the treatment, and what happens when the drug is stopped before they are cleared.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain how a population of bacteria can become resistant to an antibiotic. Use the ideas of variation, selection, inheritance and allele frequency, and explain why the antibiotic did not create the resistance.",
      modelAnswer:
        "The bacterial population contains variation, including some bacteria with alleles that reduce the antibiotic's effect. When the antibiotic is used, it kills or inhibits the susceptible bacteria, while the resistant ones are more likely to survive. The survivors reproduce and pass the resistance alleles to their offspring, so the frequency of those alleles in the population rises. The antibiotic is a selection pressure: it changes which variants leave descendants, but it does not cause the resistance allele to appear. The resistance can also spread between bacteria by horizontal gene transfer, which is why the population can become resistant quickly.",
      marking: [
        "States that variation in resistance already exists in the bacterial population before the antibiotic is applied.",
        "Explains that the antibiotic selects resistant bacteria by killing or inhibiting susceptible ones, rather than creating the resistance.",
        "Explains that survivors reproduce and pass resistance alleles to offspring, so the allele frequency rises.",
        "Uses the idea of a population change across generations and does not claim that an individual bacterium or the patient's body evolves.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A population's gene pool contains 4,000 alleles. 400 of them are the resistance allele R. Calculate the frequency of R. Give your answer as a decimal.",
      modelAnswer: "0.1",
      marking: [
        "Divides the number of R alleles by the total number of alleles in the gene pool.",
        "Gives the frequency as 0.1, not as 400 or 10.",
      ],
      check: {
        accepted: ["0.1", "0.10", "10%", "10 per cent", "1/10", "0.1 (10%)"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "The same bone arrangement is found in a human arm, a bat wing and a whale flipper, although the structures have different functions. What kind of evidence for common ancestry is this?",
      modelAnswer: "Homologous structures",
      marking: [
        "Names homologous structures rather than analogous structures.",
        "Recognises that the similarity is in underlying origin, not merely in function.",
      ],
      check: {
        accepted: [
          "homologous structures",
          "homologous",
          "homologous anatomy",
          "homologous bones",
          "homologous anatomical structures",
        ],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "Two populations of lizards live on separate islands. One island has soft fruit, while the other has hard seeds. After many generations, the lizards' jaws differ in shape. Explain how this difference could have evolved and how the two populations could become separate species. Describe one piece of evidence that would support your explanation.",
      modelAnswer:
        "Each island's lizard population already contained variation in jaw shape. On the fruit island, lizards with jaws suited to soft fruit may feed more efficiently; on the seed island, deeper jaws may crack hard seeds more effectively. The survivors on each island leave more offspring, so the alleles associated with the local jaw shape become more common. Because the islands are separate, the populations do not exchange alleles, and different selection, mutations and chance events can make them diverge further. If the differences accumulate so that the lizards no longer produce fertile offspring together, they have become separate species. Evidence could include measurements showing that jaw shape is associated with survival or feeding on each island, that the trait is heritable, and that the two populations are reproductively isolated when brought together.",
      marking: [
        "Starts with inherited variation in jaw shape rather than saying the lizards grew the jaws they needed.",
        "Explains selection on each island through feeding efficiency, survival and reproduction.",
        "Explains that isolation prevents gene flow and allows accumulated differences to produce reproductive isolation.",
        "Names relevant evidence, such as survival or feeding data, heritability, or a test of interbreeding and fertile offspring.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A farmer sprays a field with a new pesticide. After several years, a large share of the aphids survive the spray. Explain how this happened, why the pesticide did not create the resistance, and propose two practices that could slow the evolution of resistance.",
      whyItTransfers:
        "The lesson uses antibiotic resistance and Darwin's finches to teach selection. The pesticide case is a different species and a different environment, so the learner must apply the same variation-selection-inheritance sequence, keep the distinction between selecting and creating a variant, and turn the explanation into a practical management decision.",
      answer:
        "The aphid population already contained variation in its response to the pesticide. The spray killed or weakened susceptible aphids, while those with alleles that reduced its effect were more likely to survive and reproduce. Their offspring inherited the resistant alleles, so the frequency of resistance in the population rose over generations. The pesticide did not create the resistance; it changed which variants left descendants. To slow resistance, the farmer could use the pesticide only when needed and at the recommended dose, rotate between pesticides with different modes of action, leave untreated refuges where susceptible aphids can survive, and combine chemical control with biological or cultural methods. Monitoring the population is needed to check whether the practices are working.",
      marking: [
        "States that resistant variants already existed in the aphid population before the pesticide was used.",
        "Explains selection: susceptible aphids are removed, resistant ones survive and reproduce, and resistance alleles become more common.",
        "Explicitly rejects the idea that the pesticide created the resistance or taught the aphids to resist.",
        "Proposes at least two practices that reduce selection for resistance and includes monitoring or adjustment.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "Define evolution in terms of a population's alleles.",
      answer:
        "Evolution is a change in the frequencies of alleles in a population's gene pool across generations.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Why is 'survival of the fittest' not a statement about physical strength?",
      answer:
        "Fitness is reproductive success in a particular environment, so a smaller or better-camouflaged organism can leave more offspring than a stronger one; the trait's value depends on the environment.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "What two ingredients are needed for two separated populations to become separate species?",
      answer:
        "Reduced or absent gene flow between the populations, and enough accumulated genetic difference to produce reproductive isolation, so they can no longer produce fertile offspring together.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "Name two independent kinds of evidence that support common ancestry.",
      answer:
        "Any two of the fossil record, homologous structures, embryonic development, DNA or protein sequence similarity, and biogeography; analogous structures are not evidence of close ancestry.",
      when: "month-later",
    },
  ],

  summary: [
    "Evolution is a change in allele frequencies in a population across generations; individuals do not evolve during their lifetime.",
    "Heritable variation arises through mutation, meiosis and random fertilisation, and selection acts on the variation that already exists rather than creating it in response to need.",
    "Natural selection changes allele frequencies when some variants survive and reproduce more successfully in a particular environment; genetic drift is a separate chance process.",
    "Antibiotic and pesticide resistance evolve by selection of resistant variants, and speciation follows isolation plus enough accumulated difference for reproductive isolation.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "The natural-selection and speciation sequences are written as numbered steps in the prose as well as shown with arrows, so the order and the causal links do not depend on the arrow characters being announced.",
    },
    {
      need: "colour-vision",
      alternative:
        "Alleles, resistant and susceptible bacteria, and the two separated populations are identified by labels and names, never by colour alone; the worked example states every frequency in words as well as digits.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson uses short headed sections, defines allele, gene pool, fitness and reproductive isolation at first use, and repeats the key distinctions in the summary and retrieval questions.",
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
        "Scope cited against the published GCSE biology subject content for inheritance, variation and evolution.",
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
