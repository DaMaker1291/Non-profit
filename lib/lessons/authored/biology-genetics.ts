import type { AuthoredLesson } from "../../lesson-contract";

// GENETICS IS EASY TO TURN INTO LETTERS WITHOUT MEANING. A learner can fill a
// Punnett square and still believe that a dominant allele is the stronger or
// more common one, that a recessive allele disappears in a carrier, or that a
// 3 : 1 ratio promises three purple plants in every family of four. This lesson
// keeps the physical objects separate from the notation: a gene is a DNA
// sequence, an allele is one version of it, a genotype is the pair an organism
// carries, and a phenotype is what that pair produces in an environment.
// Meiosis explains why gametes carry one allele; fertilisation explains why the
// square has four equally likely boxes; probability explains why the prediction
// is about many offspring rather than a guarantee for the next one.
export const BIOLOGY_GENETICS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "genetics",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, inheritance, variation and evolution: DNA, genes and alleles, meiosis, monohybrid inheritance, sex determination and test crosses",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, examination question, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish DNA, a gene, an allele, a genotype and a phenotype, and use dominant, recessive, homozygous and heterozygous correctly.",
      evidence:
        "The learner labels a pair of alleles as a genotype, states the phenotype it produces, and explains why a recessive allele can be present without being expressed.",
    },
    {
      statement:
        "Explain how meiosis produces haploid gametes and how random fertilisation produces the combinations shown in a Punnett square.",
      evidence:
        "The learner states that homologous chromosomes separate in meiosis so each gamete carries one allele, and uses that to place the correct gametes around a 2 by 2 square.",
    },
    {
      statement:
        "Use a monohybrid cross or a test cross to predict genotype and phenotype probabilities, and interpret the result without treating a probability as a guarantee.",
      evidence:
        "The learner calculates a 1 in 4 probability from two heterozygous parents, explains why a family of four need not contain exactly one affected child, and uses offspring data to distinguish a homozygous from a heterozygous parent.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells", "probability-basics"],
    check: [
      {
        id: "d1",
        question:
          "Where is DNA found in a eukaryotic cell, and what is a chromosome?",
        answer:
          "Most DNA is in the nucleus, packaged with proteins into chromosomes. A chromosome is a long DNA molecule carrying many genes; humans have 23 pairs of chromosomes in a diploid body cell.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question:
          "If two gametes each carry one of two possible alleles with equal chance, how many equally likely combinations can they form, and what is the probability of one particular combination?",
        answer:
          "Two possible alleles from one parent and two from the other give four equally likely combinations, so one particular combination has a probability of one quarter.",
        targets: ["probability-basics"],
      },
    ],
  },

  introduction: {
    hook:
      "Two purple-flowered pea plants are crossed, and one of their offspring has white flowers. The white allele was present in both parents, but neither parent showed it. Nothing was blended away and nothing was lost: each parent carried one white allele alongside one purple allele, and the offspring happened to receive the white allele from both. A single cross can produce a result that looks surprising, while a large number of crosses reveals a stable ratio. Genetics is the study of how those inherited instructions are stored, copied, separated into gametes and combined again.",
    why:
      "DNA carries the instructions a cell uses to build and operate. A gene is a section of that DNA that specifies a product, usually a protein or a functional RNA. An allele is one version of a gene, and a diploid organism carries two alleles of each gene, one on each homologous chromosome. The pair of alleles is the genotype; the observable characteristic is the phenotype. A dominant allele is expressed when one copy is present, while a recessive allele is expressed only when both copies are the same recessive version. Meiosis separates the homologous chromosomes so each gamete receives one allele, and fertilisation combines two gametes at random. A Punnett square is a way of listing those possible combinations, not a promise about the next child or the next plant.",
  },

  explanation: [
    {
      heading: "DNA, genes and alleles are different things",
      paragraphs: [
        "DNA is a double-stranded molecule whose sequence of bases stores information. In a eukaryotic cell, most of it is in the nucleus, packaged with proteins into chromosomes. A gene is a section of DNA that contains the instructions for a product, usually a protein; the position of that section on a chromosome is its locus. A chromosome carries many genes, and a diploid organism has two copies of each chromosome, one inherited from each parent. The two copies carry the same genes in the same order, but the DNA sequence of a gene can differ slightly between them.",
        "An allele is one version of a gene. If the two alleles are identical, the organism is homozygous for that gene; if they differ, it is heterozygous. The combination of alleles is the genotype, while the phenotype is the observable or measurable characteristic that results. A dominant allele is expressed in the phenotype when at least one copy is present. A recessive allele is expressed only when both copies are the recessive version. A heterozygous organism carrying one recessive allele is often called a carrier: it has the allele but does not show the recessive phenotype. Dominance describes which allele is expressed in a heterozygote; it does not mean that the allele is stronger, better or more common.",
        "Not every pair of alleles follows a simple dominant-recessive pattern. In codominance, both alleles are expressed in the heterozygote, as in the AB blood group. In incomplete dominance, the heterozygote shows an intermediate phenotype, such as pink flowers from red and white parents. Many characteristics are also influenced by several genes and by the environment, so a single pair of letters is a model for a particular trait rather than a complete description of a person. The model is still useful because it makes the inheritance of a single gene, and the probability of its combinations, visible.",
        "New alleles arise by mutation, a change in the DNA sequence. Mutations can happen during DNA replication or be caused by radiation, chemicals or other agents, and they are not directed by what the organism needs. Most mutations are neutral or harmful, and a small minority produce a variant that is useful in a particular environment. A mutation in a body cell may affect that individual but is not passed to offspring; a mutation in a gamete can be inherited. Mutation is therefore a source of new alleles, while meiosis and fertilisation reshuffle the alleles that already exist.",
      ],
    },
    {
      heading: "Meiosis halves the chromosome number and shuffles the alleles",
      paragraphs: [
        "A diploid cell has two sets of chromosomes. In humans, a body cell has 46 chromosomes arranged as 23 pairs. Meiosis is a cell division that produces gametes with one set of chromosomes, so a human gamete has 23 chromosomes rather than 46. In the first division, the homologous chromosomes pair up and then separate, so each daughter cell receives one chromosome from each pair. In the second division, the sister chromatids separate, producing four haploid cells. Each gamete therefore carries one allele of each gene, not both.",
        "Meiosis generates variation in two main ways. During crossing over, homologous chromosomes exchange sections before they separate, so the alleles on a chromosome can be recombined. During independent assortment, the pairs of homologous chromosomes line up and separate independently of one another, so the combination of chromosomes in a gamete is one of many possibilities. In humans, independent assortment alone can produce a very large number of different gametes. Fertilisation then combines one gamete from each parent at random, adding another source of variation in the offspring.",
        "Meiosis is not the same as mitosis. Mitosis produces genetically identical daughter cells for growth and repair, while meiosis produces haploid gametes with new combinations of alleles. The distinction matters because a body cell with a mutation is not automatically a gamete with that mutation. It also matters for inheritance: the alleles a parent passes on are a sample of the parent's two copies, not a blend of them. A parent who is heterozygous can pass either allele to a child, and which one is passed is a matter of chance for each child.",
      ],
    },
    {
      heading: "Monohybrid crosses predict probabilities, not guarantees",
      paragraphs: [
        "A monohybrid cross follows one gene with two alleles. The first step is to write the parental genotypes, using a capital letter for the dominant allele and a lower-case letter for the recessive allele. A plant that is heterozygous for purple flowers is written Pp, while a white-flowered plant with two recessive alleles is pp. Each parent produces gametes carrying one allele, so the Pp parent produces P and p gametes in equal proportion, and the pp parent produces only p gametes. A Punnett square places those gametes along the top and side and fills each box with the combination that would result from that pair.",
        "For a cross between two heterozygous purple plants, both parents produce P and p gametes. The four boxes are PP, Pp, Pp and pp. The genotype ratio is one PP to two Pp to one pp, and the phenotype ratio is three purple to one white, because PP and Pp both show the dominant purple phenotype. The probability that a particular offspring receives pp is one quarter, or 0.25, assuming the alleles separate fairly and each combination is equally likely. That is a statement about the chance for each offspring, not a rule that every family of four will contain exactly one white plant. Each fertilisation is an independent event, so a run of purple offspring does not make a white one more likely.",
        "A test cross is used when an organism shows the dominant phenotype but its genotype is unknown. The unknown organism is crossed with a homozygous recessive individual. If any offspring show the recessive phenotype, the unknown parent must have carried a recessive allele and was heterozygous. If all the offspring show the dominant phenotype, the unknown parent may be homozygous, but a small number of offspring cannot prove it: a heterozygous parent can produce a run of dominant offspring by chance. The more offspring produced, the more confident the conclusion. A test cross is therefore an experiment in probability as well as inheritance.",
        "The expected ratio is a prediction about a large number of offspring, not a description of every family. Random variation is largest when the sample is small. A couple who are both carriers of a recessive allele have a one-in-four chance of an affected child for each pregnancy, but they can have three unaffected children and still be following the same probability rule. The ratio describes the expected proportion over many independent trials; it does not remember how many unaffected children have already been born, and it does not owe the family an affected child.",
      ],
    },
    {
      heading: "Sex determination is a chromosome story",
      paragraphs: [
        "Human body cells usually contain 22 pairs of autosomes and one pair of sex chromosomes. A female usually has two X chromosomes, written XX, while a male usually has one X and one Y, written XY. The Y chromosome carries the gene that triggers male development, so the presence of a Y is usually what makes a zygote develop as male. Eggs carry an X chromosome, while sperm can carry either an X or a Y. If an X-bearing sperm fertilises the egg, the zygote is XX; if a Y-bearing sperm fertilises it, the zygote is XY.",
        "The father therefore determines the chromosomal sex of the child, because the mother contributes an X-containing egg and the father contributes either an X or a Y. The chance of a male or female child is about one half for each pregnancy, assuming the sperm are produced in equal proportions and fertilisation is random. A family with three daughters is not evidence that the next child is more likely to be a son: each pregnancy is a new event, and the previous children do not change the probability for the next one. The 50 : 50 figure is an expectation over many births, not a guarantee for a particular family.",
        "Some genes are carried on the X chromosome and are described as X-linked. A male has only one X, so a recessive allele on that X can be expressed even though a female with the same allele on one of her two X chromosomes might be a carrier. This is why some X-linked conditions are more common in males. A Punnett square can still be used, but the sex chromosomes must be written as X and Y rather than as two identical autosomes. The same rules of segregation and probability apply; the difference is that the two sexes do not carry the same number of X chromosomes.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A gene is a section of DNA whose sequence specifies the order of amino acids in a protein, or the structure of a functional RNA. That sequence matters because the protein it encodes can act as an enzyme, a structural component or a signalling molecule, which lets the gene affect a characteristic of the cell or organism. A change in the DNA sequence can change the protein, but the link from gene to phenotype is not a straight line: several genes and the environment can influence the same characteristic.",
      notation:
        "DNA → gene → RNA → protein → cell activity → phenotype",
      caption:
        "The arrow is a chain of dependence, not a claim that one gene alone determines a complex human trait. The gene specifies a product; the phenotype emerges from the product working in a cell and an environment.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Meiosis halves the chromosome number because the homologous chromosomes separate in the first division, so each daughter cell receives one chromosome from each pair. Crossing over and independent assortment shuffle the alleles before that separation, which is why the gametes are genetically different from one another. The second division separates the sister chromatids, producing four haploid cells from one diploid cell.",
      notation:
        "diploid cell (2n) → homologous chromosomes separate → two haploid cells (n) → sister chromatids separate → four gametes (n)",
      caption:
        "The halving is the point: a gamete carries one allele of each gene, so fertilisation can restore the diploid number without doubling the chromosome set.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "In a cross between two heterozygous parents, each parent produces two kinds of gamete in equal proportion because the two alleles separate during meiosis. Fertilisation combines one gamete from each parent at random, so the four possible combinations are equally likely. The resulting genotypes are one PP, two Pp and one pp, which gives three dominant phenotypes to one recessive phenotype if the alleles show a simple dominant-recessive relationship.",
      notation:
        "Pp × Pp → gametes P and p from each parent → PP, Pp, Pp, pp → 1 PP : 2 Pp : 1 pp → 3 purple : 1 white",
      caption:
        "The square lists possibilities, not results that must occur in a family of four. The ratio is an expectation over many independent fertilisations.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "A test cross is used to find whether a dominant-looking organism is homozygous or heterozygous. The unknown organism is crossed with a homozygous recessive partner because that partner can contribute only a recessive allele, so any recessive offspring must have received the other recessive allele from the unknown parent. If recessive offspring appear, the unknown parent was heterozygous. If all the offspring show the dominant phenotype, the unknown parent may be homozygous, but the conclusion depends on the number of offspring: a heterozygous parent can produce an all-dominant run by chance.",
      notation:
        "unknown purple × white (pp) → white offspring prove the unknown carried p; all purple offspring in a large sample suggest PP, not proof",
      caption:
        "The test is a comparison between two possible genotypes, and the evidence is the offspring ratio. A small family is weak evidence because chance can hide the recessive allele.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "In pea plants, purple flower colour (P) is dominant to white (p). Two heterozygous purple plants are crossed. Calculate the probability that an offspring will have white flowers, and state the expected phenotype ratio.",
      steps: [
        {
          move:
            "Write the genotype of each parent and the gametes each can produce.",
          why:
            "Both parents show the dominant purple phenotype but are heterozygous, so each is Pp. Each parent produces P and p gametes in equal proportion because the two alleles separate during meiosis.",
        },
        {
          move:
            "Place the gametes on the top and side of a 2 by 2 Punnett square and fill the four boxes.",
          why:
            "Each box represents one equally likely combination of one gamete from each parent. The four boxes are PP, Pp, Pp and pp, so the square contains every possible offspring genotype for this cross.",
        },
        {
          move:
            "Count the genotypes and identify which ones produce white flowers.",
          why:
            "PP and Pp both contain at least one dominant P allele, so they produce purple flowers. Only pp contains two recessive alleles, so only pp produces white flowers. There is one pp box out of four, giving a probability of one quarter.",
        },
        {
          move:
            "State the expected phenotype ratio and explain why it is not a guarantee for four offspring.",
          why:
            "The expected ratio is three purple to one white. Each offspring is an independent fertilisation, so a family of four need not contain exactly one white plant; the ratio is an expectation over many crosses, and small samples vary by chance.",
        },
      ],
      answer:
        "The probability of a white-flowered offspring is one quarter, or 0.25. The expected phenotype ratio is three purple to one white.",
    },
    {
      id: "w2",
      prompt:
        "A purple-flowered pea plant of unknown genotype is crossed with a white-flowered plant. Of 40 offspring, 19 have white flowers and 21 have purple flowers. Deduce the genotype of the unknown purple parent and explain your reasoning.",
      steps: [
        {
          move:
            "Write the genotype of the white parent and the genotypes of the white offspring.",
          why:
            "White is the recessive phenotype, so the white parent must be pp and every white offspring must also be pp. A white offspring received one p allele from each parent, which means the unknown purple parent contributed a p allele.",
        },
        {
          move:
            "Use the presence of white offspring to decide whether the unknown parent could be PP.",
          why:
            "A PP parent can produce only P gametes, so every offspring from a cross with pp would receive a P and be purple. The appearance of white offspring is therefore impossible if the unknown parent is PP. The unknown parent must be heterozygous, Pp.",
        },
        {
          move:
            "Check the observed ratio against the expectation for a Pp by pp cross.",
          why:
            "A Pp parent produces P and p gametes in equal proportion, while the pp parent produces only p. The expected offspring are half Pp (purple) and half pp (white). Nineteen white and twenty-one purple is close to the expected 1 : 1 ratio, allowing for chance in a sample of 40.",
        },
        {
          move:
            "State the conclusion and explain why the result is stronger than a single offspring.",
          why:
            "The unknown parent is heterozygous. A single white offspring is already enough to rule out PP, but the larger sample makes the 1 : 1 ratio visible and reduces the chance that the result is a misleading small-sample fluctuation.",
        },
      ],
      answer:
        "The unknown plant is heterozygous, Pp. The white parent is pp, and the approximately equal numbers of purple and white offspring fit the 1 : 1 expectation for a Pp by pp cross.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A dominant allele is the stronger, better or more common version of a gene.",
      whyItFails:
        "Dominance describes which allele is expressed when an organism carries two different alleles; it says nothing about strength, health or frequency. A recessive allele can be common in a population, and a dominant allele can be rare. A dominant allele may produce a working protein while the recessive version produces a non-working one, but that is a molecular detail, not a general rule that dominant is superior.",
      correction:
        "Define dominance in terms of expression in a heterozygote, then use the actual allele frequencies when discussing how common a trait is. Ask whether the question is about the phenotype of one organism or the distribution of alleles in a population; those are different measurements.",
      contrast: {
        wrong:
          "brown eyes are dominant, so the brown allele must be more common than the blue allele",
        right:
          "brown is dominant in this simple model because one brown allele is enough to show the phenotype, but a dominant allele can still be less common in the population than a recessive one",
      },
    },
    {
      id: "m2",
      belief:
        "A recessive allele disappears in a heterozygous carrier, or the carrier shows a blend of the two phenotypes.",
      whyItFails:
        "The recessive allele is still present in the DNA of a heterozygote; it is simply not expressed in the phenotype under the simple dominant-recessive model. The carrier can pass it to offspring. A blend would require both alleles to contribute equally to the phenotype, which is incomplete dominance, not ordinary recessiveness.",
      correction:
        "Separate the genotype from the phenotype. A carrier has one dominant and one recessive allele, shows the dominant phenotype, and can pass either allele to a gamete. A Punnett square should include the hidden recessive allele as a possible gamete, not omit it because it is not visible in the parent.",
      contrast: {
        wrong:
          "the purple parent has lost the white allele because it looks purple, so it cannot have a white offspring",
        right:
          "the purple parent is Pp, so it still carries the white allele and can pass p to an offspring that also receives p from the other parent",
      },
    },
    {
      id: "m3",
      belief:
        "A 3 : 1 ratio means that every family of four offspring must contain exactly three with the dominant phenotype and one with the recessive phenotype.",
      whyItFails:
        "The ratio is an expected proportion over many independent fertilisations, not a rule that fixes the result of a small family. Each offspring is a separate event, and chance can produce all dominant offspring or more than one recessive offspring in a small sample. The expected ratio becomes apparent only as the number of offspring increases.",
      correction:
        "Use the ratio to describe the probability for each offspring and the expected proportion in a large sample. Do not treat previous offspring as if they change the chance of the next one, and do not describe a small family that differs from 3 : 1 as evidence that the genetics is wrong.",
      contrast: {
        wrong:
          "the first three children are unaffected, so the fourth must be affected to make the 3 : 1 ratio",
        right:
          "each child has the same one-in-four chance of being affected; the ratio describes the expected proportion over many children, not a debt owed to a particular family",
      },
    },
    {
      id: "m4",
      belief:
        "The mother determines the sex of a baby because the baby develops inside her body.",
      whyItFails:
        "A mother's eggs carry an X chromosome, while a father's sperm can carry either an X or a Y. The zygote's sex chromosomes are XX if an X-bearing sperm fertilises the egg and XY if a Y-bearing sperm does. The father therefore contributes the chromosome that usually determines the sex, and the chance is about one half for each pregnancy.",
      correction:
        "Trace the gametes: egg X, sperm X or Y. The combination at fertilisation determines XX or XY. The mother's body supports the pregnancy, but it does not choose which sex chromosome the father's sperm carries.",
      contrast: {
        wrong:
          "the mother's body decided the baby's sex, so the father has no role in it",
        right:
          "the egg carries an X and the sperm carries X or Y, so the sperm's chromosome determines whether the zygote is XX or XY",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "In pea plants, P gives purple flowers and p gives white flowers. A plant has the genotype Pp. State its phenotype, whether it is homozygous or heterozygous, and the alleles it can pass to its gametes.",
      hint:
        "Which allele is expressed when both are present? A gamete carries one allele, not the pair.",
      answer:
        "The plant is heterozygous and has purple flowers because P is dominant. It can pass either P or p to a gamete, in roughly equal proportions.",
      feedback: {
        correct:
          "You separated the genotype from the phenotype and remembered that a gamete carries only one allele from the pair.",
        incorrect:
          "Pp is a pair of alleles, not a single gamete. The plant shows the dominant phenotype, but it still carries the recessive allele and can pass either one on.",
      },
    },
    {
      id: "p2",
      prompt:
        "A heterozygous black rabbit (Bb) is crossed with a white rabbit (bb). What is the probability of a white offspring? Show the gametes and the possible combinations.",
      hint:
        "The white parent can contribute only b. The heterozygous parent contributes B or b with equal chance.",
      answer:
        "The heterozygous parent produces B and b gametes; the white parent produces only b. The possible offspring are Bb and bb in equal proportions, so the probability of a white (bb) offspring is one half, or 0.5.",
      feedback: {
        correct:
          "You used the gametes rather than the whole genotype and counted the bb boxes correctly.",
        incorrect:
          "Write the gametes first. The Bb parent can give B or b, while the bb parent can give only b, so half the combinations are bb.",
      },
    },
    {
      id: "p3",
      prompt:
        "A couple has three daughters. What is the probability that their next child will be a son? Explain your answer.",
      hint:
        "Each pregnancy is a new fertilisation. Does the sex of the previous children change the sperm that will be involved next time?",
      answer:
        "The probability is about one half, or 50 per cent, assuming X- and Y-bearing sperm are equally likely. Each pregnancy is an independent event, so three daughters do not make a son more likely; the previous children do not change the next fertilisation.",
      feedback: {
        correct:
          "You treated each pregnancy as an independent event rather than assuming the family is due a boy.",
        incorrect:
          "The previous children do not alter the chance for the next one. The father's sperm carries X or Y, and the probability for each pregnancy is about one half.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Two heterozygous purple-flowered pea plants are crossed. Explain how a white-flowered offspring can occur, and explain why the probability of a white offspring is one quarter rather than a guarantee that one in every four offspring will be white.",
      modelAnswer:
        "Both parents are Pp, so each produces P and p gametes in equal proportion. The four possible combinations are PP, Pp, Pp and pp, and only pp produces white flowers. That gives a probability of one quarter for a white offspring. The probability is a statement about each independent fertilisation, not a rule that fixes the result of a family of four; a small family can contain no white offspring or more than one, and the expected ratio becomes apparent over many crosses.",
      marking: [
        "Identifies both parents as heterozygous and states that each produces P and p gametes.",
        "Uses the four possible combinations and identifies pp as the only white genotype.",
        "Calculates the probability as one quarter or 0.25.",
        "Explains that the probability applies to each independent offspring and does not guarantee a particular result in a small family.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "In a monohybrid cross between two heterozygous parents, what is the probability that an offspring shows the recessive phenotype? Give your answer as a decimal.",
      modelAnswer: "0.25",
      marking: [
        "Uses the four equally likely genotype combinations from the cross.",
        "Gives the probability as 0.25, not 0.5 or 1.",
      ],
      check: {
        accepted: ["0.25", "1/4", "25%", "25 per cent", "one quarter"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "What pair of sex chromosomes is usually found in a human male?",
      modelAnswer: "XY",
      marking: [
        "Gives XY rather than XX.",
        "Recognises that the Y chromosome is the usual male-determining chromosome.",
      ],
      check: {
        accepted: ["XY", "X and Y", "one X and one Y", "x and y"],
      },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A pedigree shows two unaffected parents who have one child with a recessive condition. Explain the parents' genotypes, the probability that their next child will be affected, and why the fact that their first three children are unaffected does not change that probability.",
      modelAnswer:
        "Because the condition is recessive, the affected child must be homozygous recessive, receiving one recessive allele from each parent. Both parents are unaffected, so each must carry one recessive allele and one dominant allele: they are heterozygous carriers. The probability that the next child inherits the recessive allele from both parents is one quarter, or 0.25. The first three children are separate fertilisations, so their outcomes do not change the probability for the next child; the expected one-in-four proportion applies over many independent pregnancies, not as a fixed pattern in one family.",
      marking: [
        "Identifies both unaffected parents as heterozygous carriers of the recessive allele.",
        "Explains that the affected child must have received a recessive allele from each parent.",
        "Gives the probability for the next child as one quarter or 0.25.",
        "Explains that previous children do not change the independent probability for the next child.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A cattle breeder has a black bull that may be homozygous (BB) or heterozygous (Bb) for a recessive red coat allele. Explain how a test cross could help determine the bull's genotype, what results would support each possibility, and why the breeder should not decide from a single calf.",
      whyItTransfers:
        "The lesson uses pea plants and a rabbit cross to teach gametes and test crosses. The bull is a different organism and a real breeding decision, so the learner must apply the same logic to an unknown dominant phenotype, choose a homozygous recessive partner, interpret the offspring ratio, and recognise the limits of a small sample.",
      answer:
        "The breeder should cross the black bull with a red cow, because red is the recessive phenotype and the cow must be bb. A red calf must receive a b allele from each parent, so if any red calf is produced, the bull must carry b and is heterozygous (Bb). If all the calves are black over a large number of matings, the bull may be homozygous (BB), because a BB bull can pass only B. A single black calf is weak evidence: a heterozygous bull can pass B by chance, and one calf cannot show the expected ratio. The breeder should record several offspring and use the proportion of red calves to judge, while recognising that a small herd can still depart from the expected ratio by chance.",
      marking: [
        "Chooses a homozygous recessive (red) partner and explains that it can contribute only a recessive allele.",
        "Explains that any red calf proves the bull carries the recessive allele and is heterozygous.",
        "Explains that an all-black run is consistent with a homozygous bull but does not prove it from a single calf.",
        "Refers to the expected ratio over several offspring and the effect of chance in a small sample.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the difference between a gene and an allele.",
      answer:
        "A gene is a section of DNA that specifies a product; an allele is one version of that gene, so a diploid organism can carry two different alleles of the same gene.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Name two ways meiosis produces genetic variation.",
      answer:
        "Crossing over between homologous chromosomes, and independent assortment of the homologous pairs; random fertilisation adds further variation after meiosis.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Two heterozygous parents are crossed. What is the probability of a recessive-phenotype offspring, and why?",
      answer:
        "One quarter, because only the homozygous recessive combination out of the four equally likely boxes shows the recessive phenotype.",
      when: "month-later",
    },
    {
      id: "x4",
      prompt:
        "Why can a family with three unaffected children still have a one-in-four chance of an affected child next time?",
      answer:
        "Each pregnancy is an independent fertilisation, so the previous children do not change the probability for the next one; the one-in-four figure is an expectation over many independent trials.",
      when: "month-later",
    },
  ],

  summary: [
    "DNA stores the instructions; a gene is a section that specifies a product, and an allele is one version of that gene.",
    "Genotype is the pair of alleles an organism carries; phenotype is the observable result, and a dominant allele is expressed in a heterozygote while a recessive allele is expressed only when both copies are recessive.",
    "Meiosis halves the chromosome number and shuffles alleles through crossing over and independent assortment; fertilisation combines gametes at random.",
    "A Punnett square gives probabilities for each offspring, not a guarantee for a small family, and a test cross uses a homozygous recessive partner to reveal an unknown dominant genotype.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every Punnett square is described in words, with the parental gametes and the four boxes named in order, so the result does not depend on a visual grid being announced correctly.",
    },
    {
      need: "colour-vision",
      alternative:
        "Alleles and phenotypes are identified by letters and names rather than by colour; the purple and white flowers are labelled in the text and captions.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson uses short headed sections, defines genotype, phenotype, homozygous, heterozygous and carrier at first use, and repeats the key probability ideas in the summary and retrieval questions.",
    },
    {
      need: "motor",
      alternative:
        "All guided and assessment answers can be typed or selected; no Punnett-square boxes need to be dragged, and no part of the lesson is timed.",
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
