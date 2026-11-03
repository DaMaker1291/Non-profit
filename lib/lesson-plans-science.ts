import type { LessonLens } from "./lesson-plans-lens";

/** Concept-specific teaching for physics, chemistry and biology concepts that
 *  do not yet have a pilot-authored plan. */
export const SCIENCE_LENSES: Record<string, LessonLens> = {
  "forces-basics": {
    intuition:
      "A book resting on a table is pulled down by gravity and pushed up by the table at the same time. The forces are balanced, which is why the book stays still rather than because no forces act on it.",
    move:
      "Draw a free-body diagram: one arrow for each force, starting on the object, with the arrow's length showing size and its direction showing push or pull. Add the forces as vectors to find the resultant.",
    check:
      "Balanced forces mean constant velocity — at rest or moving steadily — not necessarily zero motion. An unbalanced resultant predicts acceleration in its direction.",
    trap: [
      "Says there is no force on a stationary object because it is not moving.",
      "Stationary means the forces cancel, not that none exist. Gravity still pulls down and the table still pushes up; the resultant is zero, so the velocity does not change.",
    ],
  },
  "motion-graphs": {
    intuition:
      "A distance–time graph of a walk that stops for a rest is flat while the time passes. The slope tells you the speed at each moment, and a flat section means zero speed.",
    move:
      "On a distance–time graph, gradient = speed. On a velocity–time graph, gradient = acceleration and area under the line = displacement. Label the axes and units before reading any value.",
    check:
      "A steeper distance–time graph means faster motion, while a steeper velocity–time graph means greater acceleration. The area under a velocity–time graph must have units of distance.",
    trap: [
      "Reads the height of a distance–time graph as the speed.",
      "Height is the distance from the start; speed is the gradient. A high flat line means the object is far away and stationary, not moving quickly.",
    ],
  },
  "newton-laws": {
    intuition:
      "A shopping trolley is easy to push when empty and hard when full. The same push produces less acceleration as the mass grows, which is the heart of F = ma.",
    move:
      "Find the resultant force first, then use F = ma with consistent units. For a falling object, weight is mg; for a system, draw each body separately and remember that equal-and-opposite forces act on different bodies.",
    check:
      "The acceleration is in the direction of the resultant force. If the forces are balanced, a must be zero; if the mass is in kilograms and the force in newtons, the acceleration is in m/s².",
    trap: [
      "Adds action and reaction forces on the same body and concludes they cancel.",
      "Newton's third-law pairs act on DIFFERENT bodies, so they never cancel in one free-body diagram. Weight and the normal reaction on a book are not a third-law pair.",
    ],
  },
  momentum: {
    intuition:
      "A moving truck is harder to stop than a moving bicycle even at the same speed. Momentum combines mass and velocity, so it measures how much motion is carried.",
    move:
      "Calculate p = mv for each object before and after an interaction. In a collision or explosion, set total momentum before equal to total momentum after, taking direction signs seriously.",
    check:
      "Momentum is a vector: choose a positive direction and keep the signs. The total momentum after must equal the total before; kinetic energy need not be conserved in an inelastic collision.",
    trap: [
      "Adds the speeds of two objects moving towards each other without giving one a negative velocity.",
      "Momentum has direction. If one object moves left and the other right, one velocity must be negative; otherwise the collision is modelled as if both moved the same way.",
    ],
  },
  "energy-conservation": {
    intuition:
      "A roller coaster at the top of a hill has gravitational potential energy; at the bottom it has kinetic energy. The total is not created or destroyed, only moved between stores.",
    move:
      "Identify the stores before and after: kinetic ½mv², gravitational mgh, elastic ½ke², thermal, chemical. Set the total before equal to the total after, accounting for energy transferred to the surroundings.",
    check:
      "Every joule must be accounted for. If the final kinetic energy is greater than the initial potential energy, either a force did work or the mass/height values are wrong.",
    trap: [
      "Assumes all potential energy becomes kinetic energy even when friction is present.",
      "Friction transfers some energy to thermal stores and the surroundings. The kinetic energy is less than mgh, and the missing amount is the work done against friction.",
    ],
  },
  "work-power": {
    intuition:
      "Carrying a box up stairs takes the same work whether you walk or run, but running takes more power because the same energy is transferred in less time.",
    move:
      "Work = force × distance moved in the direction of the force. Power = work ÷ time. Efficiency = useful output ÷ total input, expressed as a fraction or percentage.",
    check:
      "Work is in joules, power in watts and efficiency between 0 and 1. A machine cannot be more than 100% efficient; a value above 1 means the useful and total outputs were swapped.",
    trap: [
      "Calculates efficiency as wasted energy divided by useful energy.",
      "Efficiency compares useful output with TOTAL input: useful ÷ total. The wasted fraction is 1 − efficiency, not the efficiency itself.",
    ],
  },
  "waves-basics": {
    intuition:
      "A wave on a rope carries a pulse from one end to the other while the rope itself moves up and down. The wave transfers energy without carrying the material along with it.",
    move:
      "Use v = fλ, where f is frequency in hertz and λ is wavelength in metres. For a transverse wave, the oscillation is perpendicular to travel; for a longitudinal wave, it is parallel.",
    check:
      "The wave speed is set by the medium, while frequency and wavelength trade off. Doubling the frequency halves the wavelength if the speed stays the same.",
    trap: [
      "Thinks a louder sound must have a higher frequency.",
      "Amplitude controls loudness and frequency controls pitch; they are independent. A loud low note and a quiet high note can have either property without the other.",
    ],
  },
  "light-optics": {
    intuition:
      "A straw looks bent at the water surface because light changes speed as it passes from water to air. The eye traces the ray back in a straight line and places the straw in the wrong position.",
    move:
      "Draw the normal at the surface, measure the angle of incidence from the normal, and apply reflection or refraction at that boundary. For a lens, trace rays parallel to the axis and through the centre.",
    check:
      "Angles are always measured from the normal, not the surface. Light bending towards the normal means it is entering a denser medium; bending away means it is leaving one.",
    trap: [
      "Measures the angle of incidence between the ray and the water surface.",
      "Optical angles are measured from the normal, the line perpendicular to the surface. Measuring from the surface gives the complement of the correct angle and the wrong sine.",
    ],
  },
  "sound-acoustics": {
    intuition:
      "A drum is loud because its surface moves a large distance, not because it vibrates faster. The pitch comes from how quickly it vibrates; the volume comes from how far.",
    move:
      "Sound is a longitudinal wave: particles vibrate along the direction of travel. Use v = fλ, and remember that sound needs a medium, while light does not.",
    check:
      "A higher frequency means a higher pitch, and a larger amplitude means a louder sound. In a vacuum, the sound speed is not defined because there is no medium to carry it.",
    trap: [
      "Says sound travels through space because light does.",
      "Sound is a mechanical vibration and needs particles to pass it on. Space is effectively a vacuum, so it is silent; light is an electromagnetic wave and needs no medium.",
    ],
  },
  magnetism: {
    intuition:
      "A compass needle turns to line up with the Earth's magnetic field. A wire carrying current creates its own field, which is why a current can deflect a compass or turn a motor.",
    move:
      "Draw field lines from north to south outside a magnet. For a current-carrying wire, use the right-hand grip rule; for the force on a wire, use Fleming's left-hand rule with field, current and force.",
    check:
      "Field lines never cross and are closest together where the field is strongest. Reversing the current reverses the force but not the magnetic field direction.",
    trap: [
      "Uses the left-hand rule to predict the current induced by moving a magnet.",
      "Fleming's left-hand rule gives the force on a current in a field (a motor). Induction is the opposite effect and uses the right-hand rule: motion plus field gives current.",
    ],
  },
  "em-induction": {
    intuition:
      "Push a magnet into a coil and a voltage appears; hold it still and the voltage disappears. It is the CHANGE in magnetic flux, not the presence of a magnet, that generates electricity.",
    move:
      "Increase the induced voltage by moving the magnet faster, using more turns, or using a stronger magnet. For a transformer, use V₁/V₂ = N₁/N₂ and remember it needs alternating current.",
    check:
      "No change in flux means no induced voltage. Reversing the direction of motion reverses the voltage; a transformer cannot step up power, only voltage while reducing current.",
    trap: [
      "Expects a transformer to work with a steady direct current.",
      "A transformer relies on a changing magnetic flux. A steady DC produces a constant field, so there is no induced voltage in the secondary coil.",
    ],
  },
  "thermal-physics": {
    intuition:
      "A metal spoon in hot soup heats quickly while a wooden handle stays cooler. Both touch the same hot liquid, but they transfer thermal energy at different rates.",
    move:
      "Use Q = mcΔT for heating and cooling, and distinguish temperature (average particle energy) from thermal energy (total, depending on mass). For state changes, use latent heat instead of a temperature change.",
    check:
      "Temperature is in °C or K, energy in joules, and specific heat capacity in J/kg°C. A larger mass needs more energy for the same temperature rise.",
    trap: [
      "Treats a small cup of boiling water as storing more energy than a full bath at 50 °C.",
      "Thermal energy depends on mass as well as temperature. The bath contains far more water, so its total thermal energy is much larger despite the lower temperature.",
    ],
  },
  "pressure-fluids": {
    intuition:
      "A sharp knife cuts with the same force as a blunt one because the force is concentrated on a much smaller area. Pressure is force per unit area, not force alone.",
    move:
      "Use P = F/A for solids and P = ρgh for the pressure due to a fluid column. Density is mass ÷ volume; pressure in a fluid acts equally in all directions at a given depth.",
    check:
      "Pressure is in pascals, and 1 Pa = 1 N/m². A larger area with the same force gives a smaller pressure; a deeper point in the same fluid gives a larger pressure.",
    trap: [
      "Uses the total force on a dam rather than the pressure at a point to compare depths.",
      "Pressure at a depth is ρgh, independent of the area of the container. The total force on a wall is pressure × area, so a wider dam has a larger force at the same depth.",
    ],
  },
  radioactivity: {
    intuition:
      "A radioactive sample is like a room full of popping corn: you cannot predict which kernel will pop next, but the fraction that pops in a given time is predictable.",
    move:
      "Identify alpha, beta or gamma by its penetration and charge. For half-life, multiply the remaining amount by ½ for each half-life; for a fraction, use (½)ⁿ where n is the number of half-lives.",
    check:
      "After one half-life, half remains; after two, one quarter; after three, one eighth. The count never reaches zero in a finite number of half-lives.",
    trap: [
      "Says the sample is completely gone after two half-lives.",
      "Each half-life removes half of what is LEFT, not half of the original. Two half-lives leave one quarter, not zero; the decay continues indefinitely.",
    ],
  },
  astrophysics: {
    intuition:
      "The Moon stays in orbit because it is falling towards Earth while moving sideways fast enough to keep missing it. Gravity supplies the centripetal force that curves its path.",
    move:
      "For a circular orbit, set gravitational force equal to the centripetal force: GMm/r² = mv²/r. For stars, use mass to predict the end state; for galaxies, use redshift to infer expansion.",
    check:
      "A larger orbital radius means a longer period and a slower speed for a given central mass. Redshift means the source is moving away, not that it is necessarily larger.",
    trap: [
      "Says astronauts float because there is no gravity in space.",
      "Gravity is what keeps the spacecraft in orbit. Astronauts float because they and the craft are falling together, so there is no normal force between them.",
    ],
  },
  "atoms-nucleus": {
    intuition:
      "Rutherford's gold-foil experiment fired particles at a thin sheet and found that a few bounced almost straight back. That was only possible if the atom's positive charge is concentrated in a tiny nucleus.",
    move:
      "Read the atomic number as protons and the mass number as protons plus neutrons. Isotopes have the same protons but different neutrons; ions have a different electron count and therefore a charge.",
    check:
      "The number of protons identifies the element; changing it changes the element. The mass number is always at least the atomic number, and the neutron number is mass number minus atomic number.",
    trap: [
      "Treats the mass number as the number of neutrons.",
      "The mass number is protons + neutrons. Carbon-14 has 6 protons and 8 neutrons, not 14 neutrons; the atomic number supplies the proton count.",
    ],
  },
  "gravity-fields": {
    intuition:
      "The same satellite feels a weaker gravitational pull when it is farther from Earth. Double the distance and the force is not halved — it falls to a quarter, because gravity follows an inverse-square law.",
    move:
      "Use F = Gm₁m₂/r² and measure r from the centres of mass. Near a planet's surface, use W = mg with g ≈ 9.8 N/kg; for orbits, equate gravitational and centripetal forces.",
    check:
      "Doubling r divides the force by four; tripling r divides it by nine. Mass is not the same as weight: the mass stays the same on the Moon, but the weight is smaller because g is smaller.",
    trap: [
      "Says there is no gravity on the International Space Station because the astronauts float.",
      "The station is still deep in Earth's gravity; that gravity provides its centripetal force. The astronauts float because they are in free fall around Earth, not because gravity has vanished.",
    ],
  },
  "atoms-elements": {
    intuition:
      "Gold, oxygen and carbon are different because their atoms have different numbers of protons. The periodic table is organised around that one fact. That count is the atomic number.",
    move:
      "Read an element's symbol and atomic number, then count protons, neutrons and electrons. In a neutral atom, electrons equal protons; an ion has gained or lost electrons.",
    check:
      "The atomic number must match the element's position in the periodic table, and the mass number must be a whole number of nucleons. A chemical reaction rearranges atoms but does not change one element into another.",
    trap: [
      "Thinks a chemical reaction can turn lead into gold by rearranging atoms.",
      "Chemical reactions rearrange atoms into new compounds; they do not change an atom's proton count. Turning lead into gold requires a nuclear reaction, not a chemical one.",
    ],
  },
  "compounds-mixtures": {
    intuition:
      "Salt dissolves in water and can be recovered by evaporation; hydrogen and oxygen in water cannot be separated by filtering. A compound is chemically joined; a mixture is only physically combined.",
    move:
      "Use the fixed-ratio test: a compound has a definite formula and can only be separated by a chemical reaction. A mixture's components keep their own properties and can be separated by filtration, distillation or chromatography.",
    check:
      "If the composition can vary and the components can be separated physically, it is a mixture. If the ratio is fixed by a formula, it is a compound.",
    trap: [
      "Calls seawater a compound because it contains water.",
      "Seawater is a mixture of water and dissolved salts; its composition varies and the salt can be separated by evaporation. Water itself is the compound H₂O.",
    ],
  },
  "periodic-table": {
    intuition:
      "Elements in the same column react in similar ways because they have the same number of outer electrons. The table is a map of electron arrangement, not just an alphabetical list.",
    move:
      "Locate the element's group and period, then use the group to predict outer electrons and reactivity. Across a period, metallic character decreases; down a group, atoms get larger.",
    check:
      "Group 1 metals become MORE reactive down the group; group 7 halogens become LESS reactive down the group. The two trends run in opposite directions for the same underlying reason: distance from the nucleus.",
    trap: [
      "Says group 1 metals become less reactive as you go down the group.",
      "The outer electron is further from the nucleus and lost more easily, so reactivity INCREASES down group 1. For group 7 the opposite is true because those atoms are gaining an electron.",
    ],
  },
  "electron-shells": {
    intuition:
      "Sodium has 11 electrons and reacts vigorously with water; argon has 18 and is almost inert. The difference is not the total count but whether the outer shell is full.",
    move:
      "Fill shells in order: 2 in the first, 8 in the second and 8 in the third for these elements. Write the configuration (2, 8, 1) and identify the outer electrons that drive bonding.",
    check:
      "The configuration must add up to the total electron count. A full outer shell is stable; an atom with one or seven outer electrons is likely to lose or gain to reach a full shell.",
    trap: [
      "Puts all remaining electrons into the third shell regardless of the rule.",
      "The shell capacities are fixed: 2, 8, 8 for the first three. A shell fills before the next one starts, so the count cannot simply continue. Potassium's 19 electrons are 2, 8, 8, 1, not 2, 8, 9.",
    ],
  },
  "ionic-bonding": {
    intuition:
      "Sodium gives away its one outer electron and chlorine needs one to complete its shell. The resulting positive and negative ions attract and pack into a regular lattice.",
    move:
      "Work out the charge each ion needs to reach a full outer shell, then balance the charges to write the formula. The lattice is held together by electrostatic attraction in every direction.",
    check:
      "The total positive charge must equal the total negative charge. Ionic compounds conduct when molten or dissolved, because the ions become free to move.",
    trap: [
      "Writes the formula for aluminium oxide as AlO because the symbols appear once each.",
      "The charges are Al³⁺ and O²⁻; the smallest whole-number ratio that balances them is Al₂O₃. The formula follows charge balance, not a one-to-one pairing.",
    ],
  },
  "covalent-bonding": {
    intuition:
      "Two hydrogen atoms each have one electron and need two for a full shell. Sharing a pair gives both the full shell and a strong bond between them.",
    move:
      "Count the outer electrons, decide how many each atom needs, and pair them into shared electron pairs. For a displayed formula, draw one line for each shared pair.",
    check:
      "Each atom should end with a full outer shell (two for hydrogen, eight for the second row). A molecule with an unpaired electron or an atom with too many bonds is drawn incorrectly.",
    trap: [
      "Thinks a double bond is two separate single bonds that can rotate freely.",
      "A double bond is a pair of shared electron pairs; it is shorter and stronger than a single bond and restricts rotation. It is one bond with order two, not two independent connections.",
    ],
  },
  "metallic-bonding": {
    intuition:
      "A metal conducts electricity because its outer electrons are not tied to one atom. They form a sea that moves when a voltage is applied, carrying charge through the solid.",
    move:
      "Describe a metal as positive ions in a sea of delocalised electrons. Use that model to explain conductivity, malleability and why alloys are harder than pure metals.",
    check:
      "Conduction requires mobile charge; in a solid metal the delocalised electrons provide it. An ionic solid does not conduct until its ions are free to move.",
    trap: [
      "Explains why metals conduct by saying their ions move through the solid.",
      "The ions in a solid metal are fixed in the lattice. It is the delocalised electrons that move and carry the current; the ions only move when the metal is molten.",
    ],
  },
  "moles-calcs": {
    intuition:
      "A dozen means 12, and a mole means 6.02 × 10²³. The mole is a counting unit that lets chemists weigh out a known number of particles. It connects the microscopic count to a measurable mass.",
    move:
      "Use moles = mass ÷ Mr for a pure substance, and concentration = moles ÷ volume for a solution. Convert the balanced equation's coefficients into a mole ratio before comparing masses.",
    check:
      "The units must cancel: grams ÷ grams per mole leaves moles. A mole ratio comes from the equation's coefficients, not from the masses in the question.",
    trap: [
      "Multiplies mass by Mr instead of dividing by it.",
      "moles = mass ÷ Mr. Dividing by a molar mass turns grams into moles; multiplying gives a number with units of g²/mol, which cannot be a particle count.",
    ],
  },
  "rates-reaction": {
    intuition:
      "A powder dissolves faster than a solid lump because more surface is exposed to the liquid. Reaction rate depends on how often particles collide and how many of those collisions have enough energy.",
    move:
      "Change one variable at a time and measure rate as amount ÷ time. Temperature, concentration, surface area and catalysts affect collision frequency or the fraction of successful collisions.",
    check:
      "A catalyst lowers the activation energy and speeds up the reaction without being used up; it does not change the final amount of product. Increasing temperature increases rate, but it also changes the energy distribution.",
    trap: [
      "Says a catalyst increases the yield of a reversible reaction.",
      "A catalyst speeds up the forward and reverse reactions equally, so equilibrium is reached sooner but the final position is unchanged. Yield is controlled by temperature, pressure and equilibrium, not by the catalyst.",
    ],
  },
  "energy-changes": {
    intuition:
      "Burning fuel gives out heat because the bonds formed in the products release more energy than the bonds broken in the reactants. The net difference is the energy change.",
    move:
      "Use bond energies: energy absorbed to break bonds minus energy released forming bonds. A negative result means exothermic; a positive result means endothermic.",
    check:
      "Exothermic reactions release energy to the surroundings and feel warmer; endothermic reactions absorb energy and feel cooler. The sign of the energy change must match the direction of the arrow on a reaction profile.",
    trap: [
      "Thinks breaking bonds releases energy because the reaction gives out heat overall.",
      "Breaking bonds always ABSORBS energy; forming bonds releases it. A reaction is exothermic when the energy released by forming products exceeds the energy absorbed by breaking reactants.",
    ],
  },
  "acids-bases": {
    intuition:
      "Lemon juice and vinegar taste sour because they release hydrogen ions; soap feels slippery because it is alkaline. The pH scale measures the balance between H⁺ and OH⁻.",
    move:
      "Identify the acid and base, then neutralise: acid + base → salt + water. Use the acid's name to predict the salt (hydrochloric → chloride, sulfuric → sulfate, nitric → nitrate).",
    check:
      "A neutral solution has pH 7 at room temperature. Strong and concentrated are different: a dilute strong acid is fully ionised but has few acid particles per litre.",
    trap: [
      "Uses 'strong' and 'concentrated' as if they mean the same thing.",
      "Strength is how completely an acid ionises; concentration is how much acid is dissolved per litre. A dilute strong acid can have a higher pH than a concentrated weak acid.",
    ],
  },
  electrolysis: {
    intuition:
      "Electrolysis uses electricity to force a non-spontaneous chemical change. Positive ions move to the negative electrode and negative ions move to the positive electrode, where they lose or gain electrons.",
    move:
      "Identify the ions in the molten or aqueous compound, then follow the rule: cations go to the cathode (−) and are reduced; anions go to the anode (+) and are oxidised. Write the half-equations and balance the electrons.",
    check:
      "The charge must balance in each half-equation, and the electrons lost at the anode must equal those gained at the cathode. A solid ionic compound will not conduct, so it cannot be electrolysed.",
    trap: [
      "Says positive ions move to the positive electrode because opposites attract.",
      "Positive ions are attracted to the NEGATIVE cathode. The names can mislead: cations go to the cathode, anions go to the anode.",
    ],
  },
  "organic-intro": {
    intuition:
      "Crude oil is a mixture of carbon compounds with different chain lengths. Heating it in a fractionating column separates them because longer chains have higher boiling points.",
    move:
      "Name alkanes with the CₙH₂ₙ₊₂ pattern and alkenes with the CₙH₂ₙ pattern. For cracking, balance the equation so the carbon and hydrogen atoms are conserved; for combustion, add oxygen and produce CO₂ and water.",
    check:
      "A saturated hydrocarbon has only single C–C bonds; an alkene has a C=C double bond and decolourises bromine water. Balance every combustion equation atom by atom.",
    trap: [
      "Calls an alkene saturated because it contains only carbon and hydrogen.",
      "Saturation is about bonds, not elements. Alkanes are saturated (single bonds); alkenes are unsaturated because the C=C double bond can add more atoms.",
    ],
  },
  equilibria: {
    intuition:
      "A reversible reaction reaches a balancing point where the forward and reverse rates are equal. The amounts stop changing, but the reaction has not stopped — both directions are still running.",
    move:
      "Apply Le Chatelier's principle: when a condition changes, the equilibrium shifts in the direction that opposes the change. Count gas molecules on each side for pressure changes, and identify the endothermic direction for temperature changes.",
    check:
      "The equilibrium constant and the position of equilibrium are different ideas. A catalyst changes how fast equilibrium is reached, not where it lies.",
    trap: [
      "Says increasing pressure always shifts the equilibrium to the side with more gas molecules.",
      "Increasing pressure shifts the equilibrium towards the side with FEWER gas molecules, because that reduces the pressure. Count the molecules on each side before predicting the direction.",
    ],
  },
  "analysis-tests": {
    intuition:
      "A flame test identifies a metal ion by the colour it gives off; a gas test identifies a gas by a visible reaction. Each test is a fingerprint, not a guess.",
    move:
      "For metal ions, use the flame colour or the precipitate formed with sodium hydroxide. For gases, use the standard tests: hydrogen gives a squeaky pop, oxygen relights a glowing splint, carbon dioxide turns limewater cloudy, chlorine bleaches damp litmus.",
    check:
      "A test must distinguish the substance from the other possibilities, not merely react with it. Use a confirmatory test when two ions could give a similar result.",
    trap: [
      "Identifies a gas as hydrogen because it burns.",
      "Many gases burn; hydrogen is identified by the squeaky pop with a lit splint. A burning splint alone is not a confirmatory test.",
    ],
  },
  microscopy: {
    intuition:
      "A light microscope can show a cell's nucleus but not the details of its mitochondria. Magnification makes an image larger; resolution decides whether two close points can be told apart.",
    move:
      "Use magnification = image size ÷ actual size, and convert units before dividing. For electron micrographs, read the scale bar and use standard form to keep the powers of ten manageable.",
    check:
      "The magnification has no units, while image and actual size must be in the same unit. A larger magnification with poor resolution gives a bigger blur, not more detail.",
    trap: [
      "Assumes the highest magnification always gives the clearest image.",
      "Resolution limits the detail that can be seen. Beyond the resolving power of the microscope, increasing magnification only enlarges a blurred image.",
    ],
  },
  enzymes: {
    intuition:
      "A lock accepts only the right key; an enzyme's active site accepts only its substrate. That is why amylase digests starch but not protein. Shape determines which reaction is catalysed.",
    move:
      "Describe the enzyme–substrate complex, then explain how temperature, pH, substrate concentration or inhibitors change the rate. Denaturation changes the active site's shape, so the substrate no longer fits.",
    check:
      "The rate rises with temperature up to an optimum, then falls sharply as the enzyme denatures. A graph that plateaus with substrate concentration means the enzyme is saturated, not denatured.",
    trap: [
      "Says an enzyme is killed when it is denatured.",
      "Enzymes are proteins, not living organisms, so they are not killed. Denaturation changes the active site's shape and stops the enzyme working; the effect is irreversible.",
    ],
  },
  digestion: {
    intuition:
      "A piece of bread is not absorbed as bread; it is broken into sugars small enough to cross the gut wall. Digestion is the process that turns food into molecules the body can use.",
    move:
      "Follow each food group through its enzyme: amylase breaks starch to sugar, protease breaks protein to amino acids, lipase breaks fat to fatty acids and glycerol. Bile emulsifies fat and neutralises stomach acid.",
    check:
      "Absorption happens through the villi, so surface area matters. A substance that has not been broken down cannot cross the gut wall, no matter how much of it is eaten.",
    trap: [
      "Thinks bile digests fat because it acts on fat in the small intestine.",
      "Bile does not contain an enzyme; it emulsifies fat into smaller droplets, increasing the surface area for lipase. The digestion itself is done by lipase.",
    ],
  },
  circulation: {
    intuition:
      "Blood passes through the heart twice on one complete circuit: once to the lungs to pick up oxygen, then to the body to deliver it. That double loop keeps oxygenated and deoxygenated blood separate.",
    move:
      "Trace the path: right atrium → right ventricle → lungs → left atrium → left ventricle → body. Relate the vessel's structure to its job: arteries thick and elastic, veins valved, capillaries one cell thick.",
    check:
      "The left ventricle has the thickest wall because it pumps to the whole body. The pulmonary artery carries deoxygenated blood, which is the exception to the 'arteries carry oxygenated blood' shorthand.",
    trap: [
      "Says all arteries carry oxygenated blood and all veins carry deoxygenated blood.",
      "The pulmonary artery carries deoxygenated blood to the lungs, and the pulmonary vein carries oxygenated blood back. Arteries are defined by direction away from the heart, not by oxygen content.",
    ],
  },
  "breathing-gas": {
    intuition:
      "Alveoli are tiny, moist, one-cell-thick air sacs surrounded by capillaries. Their huge total surface area lets oxygen diffuse into the blood and carbon dioxide diffuse out.",
    move:
      "Explain gas exchange with three features: a steep concentration gradient, a short diffusion distance and a large surface area. For breathing, describe volume and pressure changes: diaphragm contracts, volume increases, pressure falls, air enters.",
    check:
      "Oxygen diffuses from the alveolus into the blood because its concentration there is higher; carbon dioxide moves the other way. The direction is always down the gradient, never 'the lungs pump oxygen into the blood'.",
    trap: [
      "Says breathing and respiration are the same process.",
      "Breathing is the mechanical movement of air into and out of the lungs. Respiration is the chemical release of energy from glucose inside cells; it happens in every living cell, not just the lungs.",
    ],
  },
  diffusion: {
    intuition:
      "A drop of ink spreads through water without stirring. Particles move randomly from a region of higher concentration to one of lower concentration, and the net movement continues until the gradient is gone.",
    move:
      "Compare diffusion, osmosis and active transport by what moves and whether energy is needed. Diffusion moves any particle down a gradient; osmosis moves water through a partially permeable membrane; active transport moves substances against a gradient using energy.",
    check:
      "The net movement is always down the concentration gradient for diffusion and osmosis. If a substance moves from low to high concentration, the process must be active transport and must use energy.",
    trap: [
      "Says osmosis is the movement of water from a high concentration of water to a low concentration of water, then calls the sugar concentration the water concentration.",
      "Osmosis is water moving through a partially permeable membrane from a dilute solution (high water potential) to a concentrated solution (low water potential). Track the water, not the solute.",
    ],
  },
  respiration: {
    intuition:
      "A sprinter's muscles burn and they keep breathing hard after the race. Anaerobic respiration releases energy without oxygen and leaves lactic acid, which has to be broken down afterwards.",
    move:
      "Write the word equation for aerobic respiration and compare it with anaerobic respiration in muscles and yeast. Link exercise to the increased demand for oxygen and the oxygen debt."
,
    check:
      "Respiration releases energy; breathing only supplies oxygen and removes carbon dioxide. Anaerobic respiration releases less energy per glucose molecule than aerobic respiration.",
    trap: [
      "Says respiration is the same as breathing.",
      "Respiration is a chemical reaction in cells that releases energy from glucose. Breathing is ventilation — the movement of air — and is only one part of supplying the oxygen respiration needs.",
    ],
  },
  "nervous-system": {
    intuition:
      "Touch a hot pan and your hand pulls back before you feel the pain. A reflex arc routes the signal through the spinal cord, so the response is faster than a decision made in the brain.",
    move:
      "Follow the reflex arc: receptor → sensory neurone → relay neurone → motor neurone → effector. For a voluntary response, include the brain. Synapses slow the signal by converting it to a chemical message.",
    check:
      "The response is automatic and protective; the brain is informed afterwards. A reflex does not require conscious thought, which is why it can happen so quickly.",
    trap: [
      "Says the brain is not involved in a reflex at all.",
      "The brain is not needed to trigger the reflex, but it is informed as the signal travels up the spinal cord. The response can be conscious after the protective movement has begun.",
    ],
  },
  hormones: {
    intuition:
      "A thermostat switches the heating on when a room cools and off when it warms. The body uses hormones in a similar negative-feedback loop to keep blood glucose, temperature and water balance steady.",
    move:
      "Identify the receptor, the coordination centre and the effector, then name the hormone and its effect. For blood glucose, insulin lowers it and glucagon raises it; for water balance, ADH increases reabsorption in the kidneys.",
    check:
      "Negative feedback reverses the original change. If the response makes the change larger, it is positive feedback, which is unusual in homeostasis and usually needs a specific example such as childbirth.",
    trap: [
      "Says insulin raises blood glucose because it is released after a meal.",
      "Insulin LOWERS blood glucose by helping cells take it up and storing it as glycogen. Glucagon has the opposite effect; releasing a hormone after a meal does not mean the hormone raises the level.",
    ],
  },
  genetics: {
    intuition:
      "A child inherits one allele from each parent. A dominant allele shows even when only one copy is present; a recessive allele needs two copies, which is why two brown-eyed parents can have a blue-eyed child.",
    move:
      "Write the parental genotypes, put one allele from each parent along the top and side of a Punnett square, and fill the boxes. Count the phenotypes and express the ratio in its simplest form.",
    check:
      "The total number of boxes must equal the number of possible combinations (four for a monohybrid cross). The ratio of phenotypes should add to the total number of boxes.",
    trap: [
      "Says a recessive allele is weaker or less common than a dominant allele.",
      "Dominance is about whether the allele is expressed when heterozygous, not about strength or frequency. A recessive allele can be common in a population, and a dominant allele can be rare.",
    ],
  },
  evolution: {
    intuition:
      "Bacteria that survive an antibiotic pass on their resistance; the drug does not create resistant bacteria, it selects the ones that already are. Evolution is a change in the inherited characteristics of a population over generations.",
    move:
      "Explain variation, selection and inheritance in order: individuals vary, some variants survive and reproduce more, and the successful alleles become more common. For speciation, add isolation and enough time for reproductive separation.",
    check:
      "Evolution happens to populations, not individuals. An individual does not evolve during its lifetime; the allele frequencies in the population change across generations.",
    trap: [
      "Says an animal grows a useful feature because it needs it.",
      "Need does not cause a genetic change. Variation arises randomly; selection then favours the variants that already exist. A trait acquired during life is not passed on in the way evolution requires.",
    ],
  },
  ecosystems: {
    intuition:
      "A food chain rarely has more than four or five levels because most energy is lost at each transfer. The pyramid of energy is widest at the producers and narrows sharply towards the top.",
    move:
      "Draw the food web with arrows showing energy flow, then calculate the energy lost at each level. For material cycles, trace the element through producers, consumers, decomposers and the abiotic environment.",
    check:
      "Energy flows and is lost as heat; matter cycles. A food chain arrow points from the organism being eaten to the eater, because the arrow shows the direction of energy transfer.",
    trap: [
      "Draws a food-chain arrow from the predator to the prey.",
      "The arrow shows where the energy goes: grass → rabbit means the rabbit eats the grass. Reversing it describes the wrong direction of energy flow.",
    ],
  },
  biodiversity: {
    intuition:
      "A forest with many species can recover from a disease or a drought better than a field of one crop. Biodiversity is variety at the level of genes, species and ecosystems, and that variety is a form of resilience.",
    move:
      "Separate the three levels of biodiversity and name the human pressure in the question. For conservation, match the method to the threat: protected areas for habitat loss, quotas for overfishing, seed banks for genetic diversity.",
    check:
      "A conservation method must address the specific cause of the decline. A reserve does not help a species threatened by climate change if the reserve itself is becoming unsuitable.",
    trap: [
      "Treats biodiversity as simply the number of species in one place.",
      "Biodiversity includes genetic variation within a species and the variety of ecosystems, not only species count. A population with no genetic variation is vulnerable even if it is the only species present.",
    ],
  },
  "immune-health": {
    intuition:
      "A vaccine shows the immune system a harmless version of a pathogen, so it can make memory cells without the danger of the disease. A later infection is then met by a faster, stronger response.",
    move:
      "Describe the barriers first (skin, mucus, acid), then the immune response: phagocytes engulf pathogens, lymphocytes produce antibodies specific to an antigen, and memory cells remain after recovery or vaccination.",
    check:
      "Antibodies are specific to one antigen, and antibiotics work on bacteria, not viruses. A treatment that targets a bacterial cell wall cannot affect a virus, which has no cell wall.",
    trap: [
      "Says antibiotics can cure a cold because both are infections.",
      "Colds are caused by viruses, and antibiotics target bacterial structures such as cell walls. Taking antibiotics for a viral infection does not work and encourages resistance.",
    ],
  },
};
