import type { AuthoredLesson } from "../../lesson-contract";

// MICROSCOPY IS USUALLY TAUGHT AS A LABELLED MICROSCOPE AND ONE EQUATION.
// That leaves the central idea untouched: magnification makes an image bigger,
// but resolution decides whether two close points can be distinguished at all.
// This lesson keeps those two ideas apart, makes the unit conversion part of the
// calculation rather than an afterthought, and treats the light/electron choice
// as a decision about the specimen rather than a claim that one is simply better.
export const BIOLOGY_MICROSCOPY: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "microscopy",
  version: "1.0.0",
  subject: "biology",
  curriculum: {
    reference:
      "GCSE Biology, microscopy: magnification, resolution, scale, scientific drawings and light versus electron microscopes",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. No specification, textbook or external lesson text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish magnification from resolution and explain why a larger image does not always contain more detail.",
      evidence:
        "The learner defines magnification as the size of the image compared with the object, defines resolution as the smallest separation at which two points can still be distinguished, and explains that magnifying beyond the resolving limit only enlarges a blur.",
    },
    {
      statement:
        "Use the magnification equation in all three forms, converting between millimetres, micrometres and nanometres.",
      evidence:
        "The learner calculates image size, actual size or magnification, converts both lengths to the same unit before dividing, and states that magnification itself has no unit.",
    },
    {
      statement:
        "Compare light and electron microscopes and choose an instrument for a given specimen, justifying the choice with resolution, specimen state and the information needed.",
      evidence:
        "The learner explains that light microscopes can view living, coloured specimens at lower resolution, while electron microscopes use a beam and electromagnets in a vacuum to resolve much smaller structures but require fixed, non-living specimens.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["cells", "standard-form"],
    check: [
      {
        id: "d1",
        question: "What is a cell, and name one structure inside an animal cell.",
        answer:
          "A cell is the smallest unit that can carry out the processes of life. An animal cell contains a nucleus, cytoplasm, a cell membrane and mitochondria.",
        targets: ["cells"],
      },
      {
        id: "d2",
        question: "Write 0.03 mm in metres using standard form.",
        answer:
          "There are 1,000 mm in a metre, so 0.03 mm = 0.03 ÷ 1,000 m = 0.00003 m = 3 × 10⁻⁵ m.",
        targets: ["standard-form"],
      },
    ],
  },

  introduction: {
    hook:
      "Two photographs of the same cell are printed at the same size. One was taken with a light microscope at ×1,500; the other with an electron microscope at ×50,000. The second image is not simply a larger version of the first. It shows folds and particles that are absent from the first image altogether. The extra detail did not come from making the first picture bigger. It came from using radiation with a shorter wavelength and a detector able to resolve much smaller separations.",
    why:
      "A microscope produces a magnified image, but magnification is only one of its properties. Resolution is the ability to distinguish two points that are close together. A light microscope is limited by the wavelength of visible light, so beyond about 0.2 µm two points merge into one blur no matter how much the image is enlarged. An electron microscope uses a beam of electrons with a much shorter wavelength, so it can resolve structures far below that limit. It must also operate in a vacuum and usually uses fixed, non-living specimens. Magnification, resolution and scale are different ideas, and this lesson keeps them separate.",
  },

  explanation: [
    {
      heading: "Magnification and resolution answer different questions",
      paragraphs: [
        "Magnification tells you how many times larger the image is than the object. If a 20 µm cell produces an image 40 mm across, the image is 2,000 times wider than the cell. Magnification is a ratio of two lengths, so it has no unit. A magnification of ×2,000 means the image is 2,000 times the actual size, not that the microscope can reveal 2,000 times more detail.",
        "Resolution tells you the smallest distance between two points at which they can still be seen as separate. Two mitochondria 0.3 µm apart may be distinguishable with a light microscope, while two ribosomes 0.02 µm apart are not. If the separation is below the resolving limit, the two points contribute to the same blurred spot. Increasing the magnification after that point makes the spot larger, but it does not separate the points.",
        "This is why the phrase 'empty magnification' exists. A very large image with poor resolution is a bigger blur, not a clearer specimen. The useful question is not only 'how much bigger?' but 'what is the smallest separation this instrument can resolve, and is that smaller than the structure I need to see?'",
      ],
    },
    {
      heading: "The magnification equation is a ratio, and the units must match",
      paragraphs: [
        "The relationship is magnification = image size ÷ actual size. Rearranged, image size = magnification × actual size, and actual size = image size ÷ magnification. The image and actual lengths must be measured in the same unit before dividing, because the units cancel and leave a pure number. Dividing 60 mm by 30 µm without converting gives a meaningless value 1,000 times too large.",
        "The common units are millimetres, micrometres and nanometres. One millimetre is 1,000 micrometres, and one micrometre is 1,000 nanometres. A cell 30 µm wide is 0.03 mm or 30,000 nm. Standard form keeps these scales readable: 30 µm is 3 × 10⁻⁵ m, and 20 nm is 2 × 10⁻⁸ m. Writing the conversion as a separate line is not padding; it is the step that prevents the most common error in the calculation.",
        "Micrographs often provide a scale bar instead of a stated magnification. Measure the printed bar with a ruler, read the actual length it represents, and convert both measurements to the same unit. The measured bar length divided by its actual length gives the magnification. Once the magnification is known, the actual size of any structure in the same image is its measured image size divided by that magnification. A scale bar is a claim about scale, so ignoring it makes every size estimate arbitrary.",
      ],
    },
    {
      heading: "The light microscope uses lenses and visible light",
      paragraphs: [
        "A light microscope passes visible light through a thin specimen. The objective lens, close to the specimen, forms a magnified image, and the eyepiece lens magnifies that image again. The total magnification is the objective magnification multiplied by the eyepiece magnification: a ×40 objective with a ×10 eyepiece gives ×400. The condenser and diaphragm control the light, and the stage and focus knobs position the specimen and bring it into focus.",
        "Visible light has a wavelength of roughly 0.4 to 0.7 µm, which sets a practical resolution limit near 0.2 µm. That is enough to see a cell, its nucleus, chloroplasts and some vacuoles, but not ribosomes, the internal membranes of mitochondria, or the details of a virus. The maximum useful magnification is usually quoted as about ×1,500; beyond that, the image grows but no new detail appears.",
        "The great advantage of the light microscope is that it can view living specimens in colour, often with relatively simple preparation and stains. A wet mount of onion epidermis or cheek cells can be made in minutes. Stains such as iodine or methylene blue increase contrast, but they may kill the cells. The instrument is also cheaper, smaller and more portable than an electron microscope, which is why it remains the standard tool for routine cell observation.",
      ],
    },
    {
      heading: "The electron microscope uses a beam, electromagnets and a vacuum",
      paragraphs: [
        "An electron microscope uses a beam of electrons instead of light. Glass lenses would absorb or scatter electrons, so the beam is focused by electromagnets. The whole column must be evacuated because electrons collide with gas molecules in air and the beam would spread. Electrons have a much shorter wavelength than visible light, so the resolving power is far greater: a transmission electron microscope can resolve structures on the order of 0.1 nm, and a scanning electron microscope resolves surface detail at a few nanometres.",
        "In a transmission electron microscope, the beam passes through an ultrathin section of the specimen and forms an image on a detector. In a scanning electron microscope, the beam scans the surface and the scattered electrons build a three-dimensional-looking image of the surface. Both require extensive preparation: the specimen is fixed, dehydrated, embedded and often stained with heavy metals, and it is placed in a vacuum. Living cells cannot survive this process, and the preparation can introduce artefacts that were not present in the living specimen.",
        "Electron microscopy changed cell biology because it revealed structures that light microscopy could not resolve. Ribosomes, the cristae of mitochondria, the internal membranes of chloroplasts and the details of synapses became visible. The gain was not simply 'more magnification'; it was a shorter wavelength and a detector able to separate points that light could not. That is why the electron microscope is the right choice for a ribosome or a membrane, and the wrong choice for a living cheek cell that the learner wants to watch over time.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "biology.structure-function",
      body:
        "A light microscope uses a glass objective lens close to the specimen and a second eyepiece lens because each lens refracts light to form a magnified image, and the two magnifications multiply to give the total. The condenser and diaphragm control illumination because a transparent specimen needs contrast as well as size.",
      notation:
        "objective lens × eyepiece lens = total magnification · condenser and diaphragm control light",
      caption:
        "The lenses enlarge the image; they do not change the wavelength of light. That wavelength is why the resolution has a limit even when the magnification is increased.",
    },
    {
      id: "r2",
      kind: "biology.process",
      body:
        "Magnification is calculated as image size divided by actual size because both are lengths and the ratio says how many times the image has been enlarged. The two lengths must be in the same unit because the units cancel; the result is a pure number, while the answer to an actual-size calculation carries a unit.",
      notation:
        "magnification = image ÷ actual · image = magnification × actual · actual = image ÷ magnification",
      caption:
        "The equation is a ratio, not a formula to memorise separately in three forms. Rearranging it is the same operation as solving any other ratio.",
    },
    {
      id: "r3",
      kind: "biology.process",
      body:
        "An electron microscope focuses electrons with electromagnets rather than glass lenses because electrons are scattered by air and by glass. The column is evacuated because the beam must travel without colliding with gas molecules. The shorter electron wavelength gives a much higher resolution, which is why structures below the light limit become visible.",
      notation:
        "electron beam → electromagnets → vacuum column → detector · shorter wavelength → higher resolution",
      caption:
        "A vacuum and fixed specimens are consequences of using electrons, not arbitrary rules. They are also why an electron microscope cannot show a living cell.",
    },
    {
      id: "r4",
      kind: "biology.experiment",
      body:
        "To use a scale bar, measure the printed bar with a ruler, read the actual length written beside it, and convert both to the same unit. Dividing the measured length by the actual length gives the magnification. The actual size of any structure in the same image is then its measured image size divided by that magnification.",
      notation:
        "measured bar ÷ stated actual length = magnification · measured structure ÷ magnification = actual size",
      caption:
        "A scale bar is data, not decoration. It lets a learner recover the magnification even when the image does not state it.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A cell is 30 µm wide. In a micrograph it appears 60 mm wide. Calculate the magnification. Show the unit conversion.",
      steps: [
        {
          move: "Write the relationship: magnification = image size ÷ actual size.",
          why:
            "The equation defines magnification as a ratio of two lengths. Writing it first keeps the division in the right order; reversing it would give a number smaller than one, which cannot describe an enlarged image.",
        },
        {
          move: "Convert both lengths to the same unit. 60 mm = 60 × 1,000 µm = 60,000 µm.",
          why:
            "There are 1,000 µm in a millimetre. The actual size is already in micrometres, so converting the image to micrometres makes the units cancel cleanly.",
        },
        {
          move: "Divide: 60,000 µm ÷ 30 µm = 2,000.",
          why:
            "The micrometre units cancel, leaving a pure number. The magnification is ×2,000, not 2,000 µm; a magnification is a ratio, not a length.",
        },
        {
          move: "State the answer as ×2,000 and check its direction.",
          why:
            "The image is larger than the cell, so the magnification should be greater than 1. A result below 1 would signal that the division was inverted.",
        },
      ],
      answer:
        "60 mm = 60,000 µm. Magnification = 60,000 µm ÷ 30 µm = 2,000. The magnification is ×2,000.",
    },
    {
      id: "w2",
      prompt:
        "A micrograph has a magnification of ×1,200. A cell in the image is 24 mm wide. Calculate the actual width of the cell in micrometres.",
      steps: [
        {
          move: "Rearrange the equation: actual size = image size ÷ magnification.",
          why:
            "The image has already been enlarged by the microscope, so dividing by the magnification reverses that enlargement. Multiplying would make the real cell larger than the image, which is impossible.",
        },
        {
          move: "Substitute the image size: 24 mm ÷ 1,200 = 0.02 mm.",
          why:
            "The division gives the actual size in millimetres because the image was measured in millimetres. The magnification has no unit, so it does not change the unit of the answer.",
        },
        {
          move: "Convert to micrometres: 0.02 mm × 1,000 = 20 µm.",
          why:
            "Cell dimensions are usually quoted in micrometres. Multiplying by 1,000 converts millimetres to micrometres; the number becomes larger because a micrometre is a smaller unit.",
        },
        {
          move: "Check the result against the image: 20 µm × 1,200 = 24,000 µm = 24 mm.",
          why:
            "The check reconstructs the image size. It catches both a division error and a conversion error in one step.",
        },
      ],
      answer:
        "Actual width = 24 mm ÷ 1,200 = 0.02 mm = 20 µm. The check gives 20 µm × 1,200 = 24,000 µm = 24 mm, which matches the image.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "Magnification and resolution are the same thing, so the highest magnification always gives the clearest image.",
      whyItFails:
        "Magnification is how many times larger the image is. Resolution is the smallest separation at which two points can still be distinguished. Beyond the microscope's resolving limit, increasing magnification enlarges a blur instead of revealing new detail.",
      correction:
        "Ask two separate questions: how large is the image, and what is the smallest structure the instrument can resolve? A large image with poor resolution is still a blur.",
      contrast: {
        wrong: "the highest magnification always shows the most detail",
        right: "resolution limits detail; magnification beyond that limit only enlarges the blur",
      },
    },
    {
      id: "m2",
      belief: "An electron microscope can be used to watch living cells because it magnifies them more.",
      whyItFails:
        "Electron microscopes operate in a vacuum and usually use fixed, dehydrated, heavy-metal-stained specimens. Living cells cannot survive that preparation. The instrument's greater resolution does not remove the need for a vacuum and a dead specimen.",
      correction:
        "Choose the instrument from the specimen and the question: a light microscope for a living cell or a colour observation, an electron microscope for fixed sub-cellular detail.",
      contrast: {
        wrong: "electron microscopes can view living cells, just at a higher magnification",
        right: "electron microscopes require fixed specimens in a vacuum; light microscopes can view living cells",
      },
    },
    {
      id: "m3",
      belief: "A light microscope can see ribosomes if the magnification is high enough.",
      whyItFails:
        "Ribosomes are about 20 nm across, far below the roughly 0.2 µm resolution limit set by visible light. No amount of extra magnification can separate structures smaller than the wavelength allows. The limit is physical, not a matter of a stronger lens or a larger eyepiece.",
      correction:
        "Compare the structure's size with the resolution limit before choosing the instrument. If the structure is below the limit, magnification cannot rescue the image; a shorter-wavelength instrument is needed.",
      contrast: {
        wrong: "a light microscope can see ribosomes at ×2,000 or more",
        right: "ribosomes are below the light microscope's resolution limit; an electron microscope is needed",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A learner enlarges a light micrograph from ×1,000 to ×10,000 and says the new image must show more detail. Explain why this is not necessarily true.",
      hint:
        "What limits resolution in a light microscope? What happens to a blurred point when the image is enlarged?",
      answer:
        "The light microscope's resolution is limited by the wavelength of visible light to about 0.2 µm. If two structures are closer than that, they already contribute to the same blurred spot at ×1,000. Enlarging the image to ×10,000 makes the spot larger, but it cannot separate structures that the instrument never resolved. The extra magnification is empty magnification.",
      feedback: {
        correct:
          "You separated image size from resolving power and explained why enlarging a blur does not create detail.",
        incorrect:
          "The issue is not the screen or the eyepiece. Name the property that sets the smallest separable distance, then explain what happens beyond it.",
      },
    },
    {
      id: "p2",
      prompt:
        "Convert 0.05 mm to micrometres and 250 nm to micrometres. Show the conversion factor you used.",
      hint:
        "1 mm = 1,000 µm; 1 µm = 1,000 nm. Decide whether the number should get larger or smaller.",
      answer:
        "0.05 mm × 1,000 = 50 µm. 250 nm ÷ 1,000 = 0.25 µm. A millimetre is larger than a micrometre, so the number of micrometres is larger; a nanometre is smaller than a micrometre, so the number of micrometres is smaller.",
      feedback: {
        correct:
          "You used the correct direction for each conversion and checked it against the relative sizes of the units.",
        incorrect:
          "Write the conversion factor as a fraction and cancel the unit. A larger unit gives a larger number; a smaller unit gives a smaller number.",
      },
    },
    {
      id: "p3",
      prompt:
        "A learner wants to observe a living cheek cell and then identify its ribosomes. Choose the appropriate microscope for each task and justify both choices.",
      hint:
        "Which instrument can keep the cell alive? Which one can resolve a structure about 20 nm across?",
      answer:
        "Use a light microscope to observe the living cheek cell because it can view living, unstained or lightly stained specimens in colour, even though its resolution is limited. Use an electron microscope to identify ribosomes because they are about 20 nm across, below the light microscope's resolution limit. The electron microscope requires a fixed, dehydrated specimen in a vacuum, so the cell will no longer be alive.",
      feedback: {
        correct:
          "You chose the instrument from the specimen's state and the size of the structure, not from magnification alone.",
        incorrect:
          "A light microscope cannot resolve a ribosome, and an electron microscope cannot keep the cell alive. Match each instrument to the constraint that matters for that task.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "Explain why an electron microscope can reveal ribosomes inside a cell while a light microscope cannot, even if the light microscope's image is enlarged to the same size. Refer to resolution, wavelength and the specimen preparation.",
      modelAnswer:
        "A light microscope uses visible light, whose wavelength sets a resolution limit of about 0.2 µm. Ribosomes are about 20 nm across, below that limit, so they cannot be distinguished; enlarging the image only makes a blur larger. An electron microscope uses a beam of electrons with a much shorter wavelength, giving a much smaller resolving distance, so it can separate structures at the nanometre scale. It focuses the beam with electromagnets in an evacuated column and uses a fixed, dehydrated specimen, so the cell is no longer alive. The gain in detail comes from the shorter wavelength and higher resolution, not from magnification alone.",
      marking: [
        "States that resolution is the smallest separable distance, not the same as magnification.",
        "Links the light microscope's limit to the wavelength of visible light, about 0.2 µm.",
        "States that ribosomes are below that limit, so extra magnification only enlarges a blur.",
        "Links the electron microscope's higher resolution to the shorter electron wavelength.",
        "Mentions the vacuum and fixed specimen, and does not claim the cell is still alive.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A cell is 40 µm wide and appears 80 mm wide in a micrograph. Calculate the magnification.",
      modelAnswer: "2000",
      marking: [
        "Converts 80 mm to 80,000 µm before dividing.",
        "Divides image size by actual size to get 2,000, not 0.0005.",
      ],
      check: {
        accepted: ["2000", "2,000", "×2000", "x2000", "2000x"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Name the type of microscope that uses a beam of electrons.",
      modelAnswer: "electron microscope",
      marking: [
        "Names an electron microscope, not a light microscope.",
        "Recognises that the instrument uses electrons rather than visible light.",
      ],
      check: {
        accepted: [
          "electron microscope",
          "electron microscopes",
          "transmission electron microscope",
          "tem",
          "scanning electron microscope",
          "sem",
        ],
      },
    },
    {
      id: "a4",
      kind: "short-answer",
      prompt: "Give one advantage of a light microscope over an electron microscope.",
      modelAnswer: "It can view living specimens.",
      marking: [
        "Names a genuine advantage, such as viewing living specimens.",
        "Does not claim that a light microscope has higher resolution than an electron microscope.",
      ],
      check: {
        accepted: [
          "it can view living specimens",
          "can view living cells",
          "living specimens",
          "living cells",
          "it shows colour",
          "colour images",
          "it is cheaper",
          "it is more portable",
          "it can be used without a vacuum",
        ],
      },
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A hospital laboratory has a light microscope and a transmission electron microscope. One sample is a living biopsy that must be checked for a parasite; another is a fixed tissue sample in which a ribosome defect is suspected. Choose the appropriate microscope for each sample and justify both choices using resolution, specimen state and the information required.",
      whyItTransfers:
        "The lesson compares the two instruments through resolution, wavelength and specimen preparation. Here the learner must apply that comparison to two unfamiliar diagnostic tasks, where the correct choice depends on whether the specimen must stay alive and whether the target is below the light limit, not on which microscope has the larger magnification.",
      answer:
        "Use the light microscope for the living biopsy. It can view living cells, often in colour, and the parasite is likely to be large enough to see at the light microscope's resolution. The specimen can remain alive during the observation. Use the transmission electron microscope for the ribosome defect because ribosomes are about 20 nm across, below the roughly 0.2 µm resolution limit of visible light. The electron microscope's shorter wavelength resolves structures at the nanometre scale, but the tissue must be fixed, dehydrated and placed in a vacuum, so it is no longer living. The choice is determined by the specimen's state and the size of the target, not by magnification alone.",
      marking: [
        "Chooses the light microscope for the living biopsy and justifies it with living-specimen capability.",
        "Chooses the electron microscope for the ribosome defect and justifies it with resolution/wavelength.",
        "States that ribosomes are below the light microscope's resolution limit.",
        "Recognises that the electron microscope requires a fixed specimen in a vacuum.",
        "Does not claim that the electron microscope can view the living biopsy.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt: "State the equation linking magnification, image size and actual size.",
      answer:
        "Magnification = image size ÷ actual size. Rearranged, image size = magnification × actual size, and actual size = image size ÷ magnification.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "Define resolution and explain why it is not the same as magnification.",
      answer:
        "Resolution is the smallest distance at which two points can still be distinguished. Magnification is how many times larger the image is. Increasing magnification beyond the resolving limit only makes the blur larger.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "Convert 2 µm to nanometres and 0.5 mm to micrometres.",
      answer: "2 µm = 2,000 nm; 0.5 mm = 500 µm.",
      when: "month-later",
    },
  ],

  summary: [
    "Magnification enlarges an image; resolution sets the smallest separation at which two points can still be distinguished.",
    "Magnification = image size ÷ actual size. Convert both lengths to the same unit before dividing, and remember that magnification has no unit.",
    "A light microscope uses glass lenses and visible light, resolves to about 0.2 µm, and can view living, coloured specimens.",
    "An electron microscope uses a beam of electrons focused by electromagnets in a vacuum. It resolves much smaller structures but requires fixed, non-living specimens.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every calculation is written as a word equation and then as a numerical substitution, so the relationship does not depend on the visual triangle. The scale-bar method is described as an ordered list.",
    },
    {
      need: "colour-vision",
      alternative:
        "The light and electron microscope comparisons are labelled by instrument name and by their properties, not by colour. No image relies on a colour difference to carry meaning.",
    },
    {
      need: "dyslexia",
      alternative:
        "The lesson separates magnification, resolution, light microscopes and electron microscopes into short headed sections. Unit conversions are written one line at a time, and the equation is repeated in its three rearranged forms.",
    },
    {
      need: "motor",
      alternative:
        "All practice and assessment answers are typed or selected. No dragging of labels, focusing a real microscope or measuring a physical scale bar is required.",
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
      sourceId: "gcse-biology-microscopy",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE biology subject content for microscopy and cells.",
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
