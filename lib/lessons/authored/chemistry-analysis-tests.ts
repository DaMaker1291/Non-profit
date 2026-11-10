import type { AuthoredLesson } from "../../lesson-contract";

// CHEMICAL ANALYSIS IS NOT A COLOUR-MATCHING GAME. A flame colour, a precipitate
// and a gas test are each evidence for a particular ion or gas, but several
// observations can be produced by more than one substance. This lesson teaches a
// sequence of tests: identify the metal ion, remove carbonate before testing for
// sulfate, add nitric acid before silver nitrate, and use a confirmatory result
// rather than a single striking colour. The instrumental section makes the same
// point at a larger scale: a signal identifies or quantifies only after it has
// been calibrated against a known standard.
export const CHEMISTRY_ANALYSIS_TESTS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "analysis-tests",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, chemical analysis: flame tests, hydroxide precipitates, gas tests, carbonate, sulfate and halide tests, chromatography and instrumental methods",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content for chemical analysis. No specification, examination question or textbook text is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Use flame tests and sodium hydroxide precipitates to identify a metal ion, including the effect of adding excess sodium hydroxide and the limits of a colour observation.",
      evidence:
        "Given an unknown that gives a blue-green flame and a blue precipitate with sodium hydroxide, the learner identifies copper(II), explains why the result is not proof of the anion, and distinguishes it from the white precipitates of aluminium, calcium, magnesium and zinc.",
    },
    {
      statement:
        "Carry out the standard gas tests and the carbonate, sulfate and halide sequence, choosing the acid that removes an interfering ion without introducing the ion being tested for.",
      evidence:
        "The learner tests a carbonate with dilute acid and limewater, acidifies with dilute hydrochloric acid before barium chloride for sulfate, and uses dilute nitric acid before silver nitrate for a halide, explaining each choice.",
    },
    {
      statement:
        "Calculate an Rf value from a chromatogram and explain how flame emission spectroscopy, mass spectrometry and chromatography identify or quantify a substance.",
      evidence:
        "The learner calculates Rf as the distance travelled by the spot divided by the distance travelled by the solvent front, keeps the value at or below one, and states that an instrumental result needs a calibration or a reference standard.",
    },
    {
      statement:
        "Design a short identification sequence that discriminates between plausible substances rather than merely producing a reaction.",
      evidence:
        "For an unknown containing a metal ion and an anion, the learner orders the tests, names the observation that would eliminate each alternative, and says what a negative result would rule out.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements", "compounds-mixtures"],
    check: [
      {
        id: "d1",
        question:
          "What is an ion, and why does a metal compound contain charged particles rather than neutral metal atoms?",
        answer:
          "An ion is an atom or group of atoms with an overall charge because it has gained or lost electrons. A metal atom loses one or more electrons to form a positive ion, and the oppositely charged ions are held together in a lattice.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question:
          "How would you separate sand from salty water, and why is that separation a physical change?",
        answer:
          "Filter the mixture to remove the sand, then evaporate the water or crystallise the salt from the filtrate. No new substance is formed; the sand and the salt keep their identities, so the change is physical.",
        targets: ["compounds-mixtures"],
      },
    ],
  },

  introduction: {
    hook:
      "Four white solids sit in unlabelled jars on a laboratory bench. One is sodium chloride, one is potassium sulfate, one is copper sulfate and one is calcium carbonate. Three of them look almost identical in the jar, and two of them dissolve to give a colourless solution. A flame test turns one flame lilac and another green-blue; adding acid makes one fizz; adding a colourless solution to another produces a white solid. None of those observations means anything on its own. The identification comes from choosing the tests in an order that eliminates the alternatives.",
    why:
      "Chemical analysis is the discipline of turning an observation into a justified identification. A flame colour tells you about a metal ion, not about the compound; a white precipitate may be one of several insoluble hydroxides; a white precipitate with barium chloride may be barium sulfate or barium carbonate. The same logic applies when a laboratory uses an instrument instead of a test tube: a peak or a colour is only a measurement after it has been compared with a known standard. Learning the tests without the order produces a learner who can recite colours but cannot identify an unknown safely.",
  },

  explanation: [
    {
      heading: "A flame test identifies a metal ion, not the compound",
      paragraphs: [
        "A flame test uses the light emitted by excited atoms. A clean nichrome or platinum wire is dipped in concentrated hydrochloric acid, heated in the flame until it gives no colour, dipped in the sample, and held at the edge of a non-luminous flame. The acid converts a small amount of the metal compound into a volatile chloride, which enters the flame. Lithium gives a crimson flame, sodium an intense yellow, potassium lilac, calcium orange-red and copper green-blue. Barium can give a pale green, but the colour is easily masked and is not a reliable sole identifier.",
        "The colour comes from electrons, not from the substance burning. Heat excites electrons to higher energy levels; as they fall back, they emit light of characteristic wavelengths. That is why the test identifies the metal ion: the same copper ion gives a green-blue flame whether it is in copper sulfate, copper chloride or copper nitrate. The anion does not determine the flame colour, so a flame test cannot tell you whether the unknown is a sulfate, a chloride or a carbonate.",
        "The test has practical limits. A mixture of metal ions can produce a colour dominated by one component, sodium contamination can swamp a weaker colour, and some metals give colours that are difficult to distinguish by eye. The intensity of the colour is not a reliable measure of concentration, because the amount on the wire, the flame temperature and the viewing conditions all change it. A flame test is therefore a useful first clue and a confirmatory observation, not a complete analysis.",
      ],
    },
    {
      heading: "Hydroxide precipitates make the metal ion visible",
      paragraphs: [
        "Adding a few drops of dilute sodium hydroxide to a solution of a metal salt produces an insoluble metal hydroxide. The colour and the behaviour of that precipitate identify the metal ion. Copper(II) gives a blue precipitate, iron(II) a green precipitate that may oxidise to brown on standing, and iron(III) a red-brown precipitate. These three colours are distinctive enough to be useful, but the result still needs to be read as evidence for the ion rather than as a label on the compound.",
        "Several metal ions give a white precipitate, so colour alone cannot distinguish them. Aluminium, calcium, magnesium and zinc all produce white hydroxides. Adding excess sodium hydroxide separates two of them: aluminium hydroxide and zinc hydroxide dissolve in excess alkali because they are amphoteric, forming soluble aluminate and zincate complexes, while calcium hydroxide and magnesium hydroxide remain insoluble. The test therefore has two stages: add a few drops and record the precipitate, then add excess and record whether it dissolves.",
        "The ionic equation shows what is happening. Copper(II) ions react with hydroxide ions to form solid copper(II) hydroxide: Cu²⁺ + 2OH⁻ → Cu(OH)₂(s). Iron(III) needs three hydroxide ions: Fe³⁺ + 3OH⁻ → Fe(OH)₃(s). The formula of the precipitate follows from the charges, not from a separate list to memorise. For aluminium, the initial precipitate is Al(OH)₃; in excess hydroxide it reacts further to form the soluble [Al(OH)₄]⁻ ion. A white precipitate that dissolves in excess is therefore evidence for aluminium or zinc, while a white precipitate that remains is evidence for calcium or magnesium — still not a complete identification on its own.",
      ],
    },
    {
      heading: "Gas tests and anion tests are a sequence, not a collection",
      paragraphs: [
        "The standard gas tests are quick because each gas produces a different observation. Hydrogen gives a squeaky pop with a lighted splint. Oxygen relights a glowing splint. Carbon dioxide turns limewater cloudy or milky because it forms insoluble calcium carbonate: CO₂ + Ca(OH)₂ → CaCO₃(s) + H₂O. Chlorine bleaches damp litmus paper and may turn it red first as it dissolves. The observations must be made on a fresh sample and with the correct test, because a burning splint and a glowing splint answer different questions.",
        "Carbonate is tested by adding dilute acid. The fizz is carbon dioxide, and the gas turns limewater milky. The carbonate ion accepts protons: CO₃²⁻ + 2H⁺ → CO₂ + H₂O. This test must come before the sulfate and halide tests, because carbonate ions also form white precipitates with barium ions and silver ions. If carbonate is present and is not removed, a white precipitate in a later test may be barium carbonate or silver carbonate rather than the substance the learner intended to identify.",
        "Sulfate is tested by first adding dilute hydrochloric acid, then barium chloride solution. A white precipitate of barium sulfate confirms sulfate: Ba²⁺ + SO₄²⁻ → BaSO₄(s). The acid removes carbonate by converting it to carbon dioxide, so a white precipitate that appears only because of carbonate cannot survive acidification; barium sulfate is insoluble in the acid and remains. Nitric acid is not the first choice here because it can oxidise sulfite to sulfate and create the ion being tested for.",
        "Halides are tested by first adding dilute nitric acid, then silver nitrate solution. Chloride gives a white precipitate, bromide a cream precipitate and iodide a yellow precipitate. The acid removes carbonate without adding a halide ion. The precipitates can be distinguished further by their solubility in ammonia: silver chloride dissolves in dilute ammonia, silver bromide in concentrated ammonia and silver iodide is insoluble. Hydrochloric acid would be the wrong acid here because it introduces chloride ions and could create a false positive.",
      ],
    },
    {
      heading: "Chromatography separates before it identifies",
      paragraphs: [
        "Paper chromatography separates substances by how far they travel up a stationary phase as a solvent moves past them. A small spot is placed on a pencil baseline, the paper is stood in a solvent so that the solvent rises through the spot, and the solvent front is marked when it nears the top. A substance that is more soluble in the moving solvent, or less strongly attracted to the paper, travels further. The result is a pattern of spots that can be compared with known substances run on the same paper under the same conditions.",
        "The Rf value turns the pattern into a number. Measure from the baseline to the centre of the spot, and from the baseline to the solvent front, then divide the first distance by the second: Rf = distance travelled by the spot ÷ distance travelled by the solvent front. Rf has no units and cannot exceed one, because the spot cannot travel beyond the solvent front. A spot that travels 4.5 cm while the solvent front travels 9.0 cm has Rf = 4.5 ÷ 9.0 = 0.50.",
        "An Rf value is not a universal fingerprint. It changes with the solvent, the paper, the temperature and the length of the run, so a comparison is only valid when the known and unknown are run side by side under the same conditions. Matching Rf values make an identification likely; they do not prove it, because two different substances can have the same Rf in one solvent. A second solvent or an instrumental method can resolve the ambiguity, and a mixture may produce several spots rather than one.",
      ],
    },
    {
      heading: "Instrumental methods turn a signal into a calibrated measurement",
      paragraphs: [
        "Flame emission spectroscopy uses the same excitation and emission as a flame test, but measures the wavelength and intensity of the emitted light rather than relying on the eye. Each metal has characteristic emission lines, and the intensity at a chosen wavelength can be compared with solutions of known concentration. The instrument can detect much smaller amounts than a visual flame test, can distinguish elements with similar colours, and can measure concentration rather than merely detecting presence. The result still depends on a calibration graph and on matching the sample's conditions to the standards.",
        "Mass spectrometry ionises a sample and separates the ions by their mass-to-charge ratio. The pattern of molecular and fragment ions can give the relative molecular mass and structural clues, and the intensity can be used for quantification if the instrument has been calibrated. Chromatography can be coupled to mass spectrometry so that a mixture is separated first and each separated substance is then identified. These methods are sensitive, fast and accurate, and they need only a small sample; they are also expensive, need trained operators and reference standards, and a peak that has not been calibrated is only a signal.",
        "The choice of method follows the question. A flame test is cheap and immediate but cannot quantify reliably; a precipitation test is useful for a known set of ions but can be confused by a mixture; chromatography separates components but needs a comparison; mass spectrometry can identify and quantify but requires a standard and a clean interpretation. Analytical chemists combine methods so that one test's limitation is covered by another's evidence, which is the same principle as using a confirmatory test in a test tube.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.formula",
      body:
        "Flame colours are evidence for the metal ion. The wire must be clean and the flame non-luminous, because contamination changes the colour. A flame test does not identify the anion and does not measure concentration.",
      notation:
        "Li crimson · Na yellow · K lilac · Ca orange-red · Cu green-blue · Ba pale green (easily masked)",
      caption:
        "Read the colour as a clue to the metal, then confirm it with a hydroxide precipitate or an instrumental method. Sodium's yellow is intense enough to hide other colours, so a contaminated wire can make every sample look like sodium.",
    },
    {
      id: "r2",
      kind: "chemistry.equation",
      body:
        "The charge on the metal ion decides how many hydroxide ions are needed. The precipitate's colour is an observation; its behaviour in excess sodium hydroxide is a second, independent observation that separates the white hydroxides.",
      notation:
        "Cu²⁺ + 2OH⁻ → Cu(OH)₂(s) blue   ·   Fe³⁺ + 3OH⁻ → Fe(OH)₃(s) red-brown   ·   Al(OH)₃(s) + OH⁻ → [Al(OH)₄]⁻ soluble   ·   Zn(OH)₂(s) + 2OH⁻ → [Zn(OH)₄]²⁻ soluble",
      caption:
        "Copper and iron precipitates have distinctive colours. Aluminium and zinc hydroxides are white but dissolve in excess alkali; calcium and magnesium hydroxides are white and remain insoluble. A white precipitate alone is not an identification.",
    },
    {
      id: "r3",
      kind: "chemistry.equation",
      body:
        "The anion tests are ordered to remove an interfering ion before the confirming precipitate is formed. Carbonate is removed by acid; the acid is chosen so that it does not add the ion being tested for.",
      notation:
        "CO₃²⁻ + 2H⁺ → CO₂ + H₂O   ·   Ba²⁺ + SO₄²⁻ → BaSO₄(s)   ·   Ag⁺ + Cl⁻ → AgCl(s)   ·   Ag⁺ + Br⁻ → AgBr(s)   ·   Ag⁺ + I⁻ → AgI(s)",
      caption:
        "Add dilute hydrochloric acid before barium chloride for sulfate, and dilute nitric acid before silver nitrate for a halide. The first acid removes carbonate without adding sulfate; the second removes carbonate without adding a halide. The wrong acid can create the result it is supposed to test for.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "In solution, copper(II) ions and hydroxide ions are separate and mobile. When the solutions are mixed, the oppositely charged ions attract one another and arrange into a solid lattice. The lattice cannot stay in solution, so it appears as a blue precipitate. Adding excess sodium hydroxide does not dissolve this lattice, which is why copper(II) remains a precipitate while the amphoteric aluminium and zinc hydroxides redissolve.",
      notation:
        "Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)   ·   mobile ions → ordered solid lattice",
      caption:
        "The precipitate is not a colour added to the solution; it is a new solid phase formed when the ions leave the solution and pack into a lattice. The excess-alkali test asks whether that lattice can react further with hydroxide ions.",
    },
    {
      id: "r5",
      kind: "chemistry.calculation",
      body:
        "Chromatography gives a distance for the spot and a distance for the solvent front. Their ratio, measured from the same baseline, is the Rf value. It is dimensionless and cannot exceed one.",
      notation:
        "Rf = distance from baseline to spot centre ÷ distance from baseline to solvent front = 4.5 cm ÷ 9.0 cm = 0.50",
      caption:
        "Changing the solvent, paper or temperature changes Rf, so an unknown is compared with standards run on the same plate under the same conditions. A matching value is evidence, not proof.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A white solid dissolves in water to give a blue solution. A flame test on the solid gives a green-blue flame. Adding sodium hydroxide solution dropwise gives a blue precipitate. The precipitate remains when excess sodium hydroxide is added. Identify the metal ion, and explain why these observations do not identify the anion.",
      steps: [
        {
          move:
            "Use the flame colour to propose a metal ion, then treat it as a proposal rather than a conclusion.",
          why:
            "A green-blue flame suggests copper(II), but flame colours can be masked by contamination or by another metal in the mixture. The flame test is a clue to the metal, not proof of the whole compound.",
        },
        {
          move:
            "Use the hydroxide precipitate to confirm the metal ion and to eliminate the ions with different colours.",
          why:
            "Copper(II) hydroxide is blue, iron(II) hydroxide is green and iron(III) hydroxide is red-brown. A blue precipitate therefore supports copper(II) and makes iron(II), iron(III), aluminium, calcium, magnesium and zinc less likely.",
        },
        {
          move:
            "Add excess sodium hydroxide and record whether the precipitate dissolves.",
          why:
            "The blue precipitate remains, so this is not the amphoteric behaviour of aluminium or zinc hydroxide. The excess test makes the identification stronger than the colour observation alone, because it checks a second property of the same precipitate.",
        },
        {
          move:
            "Separate the cation result from the anion question, then test the anion with its own sequence.",
          why:
            "The flame and hydroxide tests say nothing about sulfate, chloride or carbonate. The anion needs its own test: acidify and add barium chloride for sulfate, or acidify with nitric acid and add silver nitrate for a halide. The blue colour must not be allowed to stand in for that evidence.",
        },
      ],
      answer:
        "The metal ion is copper(II), Cu²⁺. The green-blue flame suggests it, and the blue precipitate that is insoluble in excess sodium hydroxide confirms a copper(II) hydroxide rather than an amphoteric white hydroxide. The observations do not identify the anion: the flame colour comes from the metal, and copper(II) hydroxide contains only copper, oxygen and hydrogen. A separate sulfate or halide test is required.",
    },
    {
      id: "w2",
      prompt:
        "A solution gives a white precipitate when barium chloride is added. The same solution fizzes when dilute hydrochloric acid is added, and the gas turns limewater milky. A student concludes that the white precipitate proves sulfate. Explain why that conclusion is unsafe and describe the test that would confirm sulfate.",
      steps: [
        {
          move:
            "Identify the gas from the acid test before interpreting the barium result.",
          why:
            "A fizz that turns limewater milky is carbon dioxide, so the solution contains carbonate. Carbonate is not a minor detail here: it reacts with barium ions to form barium carbonate, which is also a white precipitate.",
        },
        {
          move:
            "Explain why the white precipitate is ambiguous.",
          why:
            "The observation is consistent with barium sulfate, but it is equally consistent with barium carbonate. The student has treated one possible cause of a white precipitate as if it were the only cause, so the conclusion is not supported by the evidence.",
        },
        {
          move:
            "Acidify a fresh sample with dilute hydrochloric acid, then add barium chloride.",
          why:
            "The acid converts carbonate to carbon dioxide and water, removing the ion that would produce barium carbonate. If the white precipitate is barium sulfate, it is insoluble in the acid and still forms; if the only source of the earlier precipitate was carbonate, no precipitate remains.",
        },
        {
          move:
            "State the confirmatory observation and the limitation.",
          why:
            "A white precipitate that persists after acidification is evidence for sulfate. The test should be repeated on a fresh sample and compared with a blank, because a contaminated reagent or an incomplete acidification can still mislead.",
        },
      ],
      answer:
        "The fizz and milky limewater show that carbonate is present, and carbonate also gives a white precipitate with barium ions. The first result alone cannot distinguish barium carbonate from barium sulfate. Acidify a fresh sample with dilute hydrochloric acid to remove carbonate, then add barium chloride; a white precipitate that remains confirms sulfate, because barium sulfate is insoluble in the acid.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A flame test identifies the compound, and a brighter flame means a more concentrated solution.",
      whyItFails:
        "The flame colour comes from the metal ion, so copper sulfate, copper chloride and copper nitrate can all give the same green-blue flame. The anion is invisible to this test. The intensity depends on the amount on the wire, the flame temperature and the viewing conditions, so it is not a reliable concentration measurement.",
      correction:
        "Use the flame test to propose the metal ion, then identify the anion with a separate sequence. Treat brightness as a qualitative observation, not a concentration, and use a calibrated instrument when a number is needed.",
      contrast: {
        wrong:
          "the flame was green-blue, so the substance is copper sulfate",
        right:
          "the green-blue flame suggests copper(II); a separate sulfate test is needed before naming the compound",
      },
    },
    {
      id: "m2",
      belief:
        "A white precipitate with sodium hydroxide identifies the metal ion, because only one metal gives a white hydroxide.",
      whyItFails:
        "Aluminium, calcium, magnesium and zinc all give white hydroxides. Colour alone cannot separate them. The behaviour in excess sodium hydroxide separates aluminium and zinc, whose hydroxides dissolve, from calcium and magnesium, whose hydroxides remain insoluble. Even that result leaves a pair of possibilities unless a flame test or another confirmatory test is used.",
      correction:
        "Record both stages: the precipitate with a few drops, then its behaviour in excess. Use the excess result to narrow the white hydroxides, and confirm the remaining possibility with a flame test or an instrumental method.",
      contrast: {
        wrong:
          "the precipitate is white, so the metal is calcium",
        right:
          "the white precipitate could be aluminium, calcium, magnesium or zinc; excess sodium hydroxide and a flame test are needed to discriminate",
      },
    },
    {
      id: "m3",
      belief:
        "A white precipitate with barium chloride proves that sulfate is present.",
      whyItFails:
        "Barium carbonate is also a white precipitate. If the solution contains carbonate, barium chloride can produce a white solid even when no sulfate is present. The test is only specific once carbonate has been removed by acidification, and the acid must not itself introduce sulfate or oxidise another ion to sulfate.",
      correction:
        "Acidify with dilute hydrochloric acid first, then add barium chloride. A white precipitate that remains in the acid is evidence for sulfate. Use a fresh sample and a blank, and do not use nitric acid as the acidifying agent because it can oxidise sulfite to sulfate.",
      contrast: {
        wrong:
          "barium chloride gave a white precipitate, so the solution contains sulfate",
        right:
          "the white precipitate could be barium carbonate; after acidification, a white precipitate that persists confirms sulfate",
      },
    },
    {
      id: "m4",
      belief:
        "One positive test is enough to identify a substance, and an instrumental result is automatically more accurate than a test-tube observation.",
      whyItFails:
        "A test can react without discriminating: carbonate and sulfate both give white precipitates with barium ions, and several metal ions give white hydroxides. An instrument produces a signal, but the signal becomes an identification or a concentration only after calibration against known standards and correct interpretation. A expensive instrument with a poor standard is not more reliable than a well-designed confirmatory sequence.",
      correction:
        "Ask what alternative would produce the same observation, then choose a test that separates the alternatives. For an instrument, state the calibration, the reference standard and the detection limit before treating the result as a measurement.",
      contrast: {
        wrong:
          "the test was positive, so the identification is complete",
        right:
          "the test narrows the possibilities; a confirmatory test or a calibrated instrument is needed before the identification is complete",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A solution may contain carbonate and sulfate. Describe the sequence you would use to test for sulfate, and explain why the order matters.",
      hint:
        "Carbonate also gives a white precipitate with barium ions. Which reagent removes carbonate before the barium test, and what would you observe if sulfate were absent?",
      answer:
        "Add dilute hydrochloric acid to a fresh sample. Carbonate reacts to form carbon dioxide, which turns limewater milky; the acid removes the carbonate. Then add barium chloride. A white precipitate that remains in the acidic solution is barium sulfate and confirms sulfate. If sulfate were absent, the carbonate would have been removed and no white precipitate would remain after acidification.",
      feedback: {
        correct:
          "You removed the interfering ion before forming the confirming precipitate, and you said what the negative result would look like.",
        incorrect:
          "Adding barium chloride first cannot distinguish barium carbonate from barium sulfate. Acidify first, then add barium chloride, and check that the white precipitate persists.",
      },
    },
    {
      id: "p2",
      prompt:
        "A flame test gives an intense yellow colour. What metal ion does this suggest, and why must the wire be cleaned before the next sample?",
      hint:
        "The yellow comes from a common metal that can contaminate a wire. What would happen to a lilac potassium result if sodium were still on the wire?",
      answer:
        "The yellow flame suggests sodium ions. The wire must be cleaned in concentrated hydrochloric acid and heated until it gives no colour, because sodium contamination is intense and can mask a weaker colour such as the lilac of potassium. A contaminated wire would make the next sample appear to contain sodium even if it did not.",
      feedback: {
        correct:
          "You named the ion and treated contamination as a cause of a false observation, not as a minor practical detail.",
        incorrect:
          "The yellow is sodium, and sodium is a common contaminant. A dirty wire can hide another metal's colour, so clean and heat it until the flame is colourless before the next test.",
      },
    },
    {
      id: "p3",
      prompt:
        "On a chromatogram, a spot travels 3.6 cm from the baseline and the solvent front travels 9.0 cm. Calculate the Rf value. A known sample of the same substance gives Rf = 0.40 on the same plate. What does the comparison suggest, and what does it not prove?",
      hint:
        "Rf is the spot distance divided by the solvent-front distance, both measured from the same baseline. A match is evidence, not a unique fingerprint.",
      answer:
        "Rf = 3.6 ÷ 9.0 = 0.40. The unknown and the known sample have the same Rf on the same plate under the same conditions, so the unknown is likely to contain the same substance. It is not proof: another substance could have the same Rf in this solvent, and the plate should be repeated in a second solvent or confirmed with an instrumental method.",
      feedback: {
        correct:
          "You calculated a dimensionless ratio and treated the match as evidence that still needs confirmation.",
        incorrect:
          "Divide the spot distance by the solvent-front distance: 3.6 ÷ 9.0 = 0.40. A matching Rf makes identity likely, but it does not rule out a different substance with the same value.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A white solid is thought to be potassium sulfate. Describe a sequence of tests you would use to identify the metal ion and the anion. For each test, state the observation that would support the identification and one alternative that the test would rule out.",
      modelAnswer:
        "A flame test on a clean wire gives a lilac flame, which supports potassium and rules out sodium, calcium and copper, whose colours are different. Potassium does not give a hydroxide precipitate, so sodium hydroxide is not useful for confirming it. To test the anion, dissolve the solid in water and add dilute hydrochloric acid; if no fizz is produced, carbonate is not the main source of a later precipitate. Add barium chloride to the acidic solution. A white precipitate that remains in the acid supports sulfate; it rules out carbonate, which would have produced carbon dioxide with the acid and would not leave barium carbonate after acidification. A blank and a known potassium sulfate sample make the comparison stronger.",
      marking: [
        "Uses a flame test and gives lilac as the observation for potassium.",
        "States that the flame test identifies the metal ion, not the anion.",
        "Acidifies before adding barium chloride and names a white precipitate as evidence for sulfate.",
        "Explains that acidification removes carbonate, which would otherwise give a false white precipitate.",
        "Includes a comparison or blank to control the conclusion rather than relying on one observation.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A spot on a chromatogram travels 4.5 cm from the baseline. The solvent front travels 9.0 cm from the same baseline. Calculate the Rf value.",
      modelAnswer: "0.50",
      marking: [
        "Measures both distances from the same baseline.",
        "Divides the spot distance by the solvent-front distance, not the reverse.",
        "Gives a dimensionless value at or below one: 4.5 ÷ 9.0 = 0.50.",
      ],
      check: { accepted: ["0.5", "0.50", "1/2", "0.50 (4.5 ÷ 9.0)"] },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt: "Name the gas that relights a glowing splint.",
      modelAnswer: "oxygen",
      marking: [
        "Names oxygen, not hydrogen or carbon dioxide.",
        "Associates the glowing-splint test with oxygen rather than with the lighted-splint test for hydrogen.",
      ],
      check: { accepted: ["oxygen", "O2", "O₂"] },
    },
    {
      id: "a4",
      kind: "constructed-response",
      prompt:
        "A learner tests a solution for chloride by adding silver nitrate after hydrochloric acid. Explain why the hydrochloric acid makes the result unreliable, and state the acid that should be used instead.",
      modelAnswer:
        "Hydrochloric acid contains chloride ions, so adding it introduces the very ion the learner is trying to detect. Silver nitrate would then produce a white precipitate of silver chloride even if the original solution contained no chloride. Dilute nitric acid should be used instead: it removes carbonate, which could otherwise form a white silver carbonate precipitate, without adding chloride. A fresh sample and a blank are still needed, and the precipitate can be checked by its solubility in ammonia.",
      marking: [
        "Identifies that hydrochloric acid introduces chloride ions.",
        "Explains that this creates a false positive with silver nitrate.",
        "Names dilute nitric acid as the correct acidification step.",
        "Explains that nitric acid removes carbonate without adding a halide.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A museum conservator finds a green crust on a bronze coin. She wants to know whether the crust contains copper and chloride, and whether the green colour alone is enough to decide. Design a test sequence using the methods in this lesson, and explain how an instrumental method could add a measurement that the bench tests cannot provide.",
      whyItTransfers:
        "The lesson uses clean salt solutions and known unknowns. A corroded coin is a mixture with a coloured matrix, so the learner must separate the colour from the evidence, choose tests that work in the presence of carbonate and other ions, and explain what an instrument adds beyond a yes-or-no observation.",
      answer:
        "The green colour is only a clue, not an identification: copper compounds are often green or blue, but the colour does not prove copper and says nothing about chloride. A flame test on a small cleaned sample can suggest copper if it gives a green-blue flame, but the crust's matrix may mask it. Dissolve a sample in dilute nitric acid and add sodium hydroxide; a blue precipitate that is insoluble in excess supports copper(II). To test for chloride, acidify a fresh portion with dilute nitric acid, add silver nitrate, and look for a white precipitate; a precipitate that dissolves in dilute ammonia is consistent with silver chloride. Carbonate must be removed by the nitric acid or it could produce a white silver carbonate. For a measurement, flame emission spectroscopy or mass spectrometry can compare the signal with calibrated standards and estimate how much copper or chloride is present, which the bench tests cannot do. A blank and a known sample are needed because the coin's other metals can interfere.",
      marking: [
        "States that the green colour alone is not sufficient evidence for copper or chloride.",
        "Uses a flame test or a sodium hydroxide precipitate to test for copper(II), with the expected observation.",
        "Acidifies with dilute nitric acid before silver nitrate and explains the carbonate interference.",
        "Explains that an instrumental method can quantify against calibration standards, while bench tests are qualitative.",
        "Includes a control or comparison to address the mixed matrix rather than treating one positive result as conclusive.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State the flame colours of lithium, sodium, potassium and copper ions.",
      answer:
        "Lithium crimson, sodium yellow, potassium lilac and copper green-blue.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Which gas gives a squeaky pop with a lighted splint, which relights a glowing splint, and which turns limewater milky?",
      answer:
        "Hydrogen gives the squeaky pop, oxygen relights a glowing splint, and carbon dioxide turns limewater milky.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Why is dilute hydrochloric acid added before barium chloride in a sulfate test, and why is dilute nitric acid used before silver nitrate in a halide test?",
      answer:
        "The acid removes carbonate, which would otherwise form a white precipitate and give a false positive. Hydrochloric acid is suitable before barium chloride because it does not add sulfate; nitric acid is used before silver nitrate because hydrochloric acid would add chloride ions.",
      when: "week-later",
    },
    {
      id: "x4",
      prompt:
        "How is an Rf value calculated, and why can two substances with the same Rf still be different?",
      answer:
        "Rf is the distance travelled by the spot divided by the distance travelled by the solvent front, both measured from the baseline. Two different substances can have the same Rf in one solvent, so a match is supporting evidence rather than proof and should be checked under another condition or with an instrument.",
      when: "month-later",
    },
  ],

  summary: [
    "A flame test identifies a metal ion, not the compound, and its colour is not a reliable concentration measurement.",
    "Sodium hydroxide precipitation identifies several metal ions, but the white hydroxides need the excess-alkali test to separate aluminium and zinc from calcium and magnesium.",
    "Gas tests identify hydrogen, oxygen, carbon dioxide and chlorine; anion tests must remove carbonate first and must use an acid that does not introduce the ion being tested for.",
    "Chromatography gives an Rf ratio that is evidence only under matched conditions, and instrumental methods turn a signal into an identification or a concentration only after calibration.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every ion and formula is read in words as well as symbols, and each precipitate's colour and excess-alkali behaviour is stated in prose, so the table is not the only carrier of the result.",
    },
    {
      need: "colour-vision",
      alternative:
        "No identification depends on colour alone: flame colours are named, precipitates are described by colour and by solubility in excess, and the anion sequence names the observation and the alternative it rules out.",
    },
    {
      need: "dyslexia",
      alternative:
        "The tests are presented as short ordered steps, each with the observation and the reason, and the key contrasts are repeated in the summary and retrieval prompts.",
    },
    {
      need: "motor",
      alternative:
        "The lesson asks for typed or selected answers and describes the practical sequence without requiring the learner to handle a flame, wire or hot apparatus; no task is timed.",
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
        "All explanations, examples, practice, assessment and retrieval items in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE chemistry subject content for chemical analysis.",
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
