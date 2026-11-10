import type { AuthoredLesson } from "../../lesson-contract";

// THE MOLE IS A BRIDGE, NOT A FORMULA TO RECITE.
//
// The lesson starts with a measured mass and converts it, so the learner meets
// the mole as the thing that makes a weighable sample countable. It then adds
// solution concentration, the equation's mole ratio and the limiting reagent in
// the order a calculation actually needs them. Every worked example keeps the
// unit check visible, because most wrong answers here come from dividing by the
// wrong quantity or using cubic centimetres where cubic decimetres are needed.
export const CHEMISTRY_MOLES_CALCS: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "moles-calcs",
  version: "1.0.0",
  subject: "chemistry",
  curriculum: {
    reference:
      "GCSE Chemistry, quantitative chemistry: the mole, relative formula mass, concentration, reacting masses and limiting reactants",
    level: "Key Stage 4 / GCSE",
    note:
      "Scope cited against published GCSE subject content for quantitative chemistry. Every explanation, example, practice item and assessment is original; no specification text, examination question or mark scheme is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Explain the mole as a fixed count of particles and use relative formula mass to convert between mass and amount in moles.",
      evidence:
        "The learner calculates the relative formula mass of NaOH as 40, converts 8.0 g to 0.20 mol, and reverses the calculation to recover 8.0 g from 0.20 mol.",
    },
    {
      statement:
        "Calculate the amount of solute in a solution from its concentration and volume, converting cubic centimetres to cubic decimetres first.",
      evidence:
        "The learner calculates that 25.0 cm³ of 0.100 mol/dm³ solution contains 0.00250 mol, and explains why using 25 instead of 0.0250 would be a factor-of-1000 error.",
    },
    {
      statement:
        "Use the coefficients of a balanced equation as a mole ratio to calculate the amount of product formed.",
      evidence:
        "For C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, the learner converts 4.4 g of propane to 0.10 mol, applies the 1:4 ratio to water, and obtains 0.40 mol or 7.2 g of water.",
    },
    {
      statement:
        "Identify the limiting reactant by comparing amounts divided by their coefficients, and use it to calculate the maximum product.",
      evidence:
        "Given 4.0 mol H₂ and 1.0 mol O₂ for 2H₂ + O₂ → 2H₂O, the learner identifies oxygen as limiting and calculates 2.0 mol of water, leaving 2.0 mol of hydrogen in excess.",
    },
  ],

  priorKnowledge: {
    conceptIds: ["atoms-elements", "compounds-mixtures", "proportion"],
    check: [
      {
        id: "d1",
        question:
          "What does the formula CO₂ tell you about the number of carbon and oxygen atoms in one molecule?",
        answer:
          "One CO₂ molecule contains one carbon atom and two oxygen atoms. The subscript 2 belongs only to the oxygen symbol before it, so it is not two of the whole formula.",
        targets: ["atoms-elements"],
      },
      {
        id: "d2",
        question:
          "A compound has a fixed formula, while a mixture can vary in composition. Why does that difference matter when counting particles?",
        answer:
          "A compound's formula fixes the ratio of its atoms, so one formula unit always contains the same numbers of each kind of atom. A mixture can contain different proportions of its components, so a sample cannot be described by one fixed particle formula.",
        targets: ["compounds-mixtures"],
      },
      {
        id: "d3",
        question:
          "A recipe uses 2 eggs for every 200 g of flour. What does it mean to say the eggs are the limiting ingredient?",
        answer:
          "It means the number of eggs determines how many full recipes can be made. The flour may be left over; adding more flour cannot make another recipe once the eggs run out. The limiting quantity is the one that is used up first in the required ratio.",
        targets: ["proportion"],
      },
    ],
  },

  introduction: {
    hook:
      "You cannot count 6.02 × 10²³ particles one at a time, but you can weigh a sample. The mole is the bridge between those two actions: it is a fixed number of particles, chosen so that one mole of a substance has a mass in grams equal to its relative formula mass. That lets a chemist turn a mass on a balance into a number of reacting particles, and then back into a mass of product.",
    why:
      "Every quantitative chemistry calculation depends on the same move: get the amount in moles before you use a ratio. A mass, a solution volume and a balanced equation cannot be compared directly. The mole gives them a common currency. It also decides what a reaction can make: the reactant that runs out first caps the product, no matter how much of the other reactant is present.",
  },

  explanation: [
    {
      heading: "A mole is a count that can be weighed",
      paragraphs: [
        "A mole is the amount of substance containing 6.02 × 10²³ particles. That number is Avogadro's constant. It is not a mass, a volume or a concentration; it is a count, written in a unit large enough to be useful because atoms and molecules are exceedingly small.",
        "The number is chosen so that one mole of a substance has a mass in grams equal to its relative formula mass. One mole of carbon-12 has a mass of 12 g, one mole of water has a mass of about 18 g, and one mole of sodium hydroxide has a mass of 40 g. Each sample contains the same number of formula units, even though the masses differ.",
        "The relative formula mass, Mᵣ, is found by adding the relative atomic masses of every atom in the formula. For NaOH, Mᵣ = 23 + 16 + 1 = 40. For CO₂, Mᵣ = 12 + 2 × 16 = 44. The subscript belongs only to the atom before it, so the 2 in CO₂ doubles oxygen and does not double carbon.",
        "The relationship is n = m ÷ Mᵣ, where n is the amount in moles, m is the mass in grams and Mᵣ is the mass of one mole in grams per mole. The unit check is grams divided by grams per mole, which leaves moles. Multiplying mass by Mᵣ instead would produce a quantity with units of grams squared per mole, which cannot be an amount of substance.",
      ],
    },
    {
      heading: "Work in moles, then convert back to the unit asked for",
      paragraphs: [
        "Most questions give one quantity and ask for another. Convert the given quantity into moles first, use the chemical relationship, and convert the result into the requested unit at the end. This order keeps the coefficients and the arithmetic separate, so a mistake in one does not hide inside the other.",
        "For 8.0 g of sodium hydroxide: Mᵣ = 23 + 16 + 1 = 40 g/mol, so n = 8.0 ÷ 40 = 0.20 mol. To reverse it, m = n × Mᵣ = 0.20 × 40 = 8.0 g. The reverse calculation is the check: it returns the mass in the question. If it does not, the molar mass or the division was wrong.",
        "A solution question gives concentration and volume instead of mass. Concentration is the amount of solute per cubic decimetre of solution, measured in mol/dm³. One cubic decimetre is 1000 cm³, so a volume in cm³ must be divided by 1000 before it is used. The relationship is n = c × V, with V in dm³.",
        "For 25.0 cm³ of 0.100 mol/dm³ sodium hydroxide: V = 25.0 ÷ 1000 = 0.0250 dm³, then n = 0.100 × 0.0250 = 0.00250 mol. Using 25 instead of 0.0250 would give 2.5 mol, a thousand times too large and physically impossible for that small volume. The unit conversion is part of the calculation, not an optional polish.",
        "The same logic works in reverse. To find a concentration, divide the amount by the volume in dm³: c = n ÷ V. To find a volume, divide the amount by the concentration: V = n ÷ c. Write the unit beside each substitution, because a number that is plausible in one unit can be absurd in another.",
      ],
    },
    {
      heading: "The balanced equation gives a mole ratio",
      paragraphs: [
        "The coefficients in a balanced equation tell you the ratio in which particles react. In 2H₂ + O₂ → 2H₂O, the equation pairs two hydrogen molecules with a single oxygen molecule and produces two water molecules. Scaling up gives the same ratio in moles: two moles of hydrogen react with one mole of oxygen to make two moles of water.",
        "The coefficients are not masses. Two moles of H₂ has a mass of about 4 g, while one mole of O₂ has a mass of about 32 g. If you compared 4 g with 32 g and used the ratio 4:32, you would be comparing masses, not reacting amounts. Convert each mass to moles before applying the coefficients.",
        "Propane burning is a complete example: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. The coefficients give a ratio of 1 mol propane : 5 mol oxygen : 3 mol carbon dioxide : 4 mol water. If 4.4 g of propane reacts, its molar mass is 44 g/mol, so n = 4.4 ÷ 44 = 0.10 mol. The ratio then gives 0.40 mol of water, whose mass is 0.40 × 18 = 7.2 g.",
        "The ratio is a property of the balanced equation, not of the sample size. A different mass of propane changes how many moles react, but it does not change the 1:4 ratio between propane and water. Balance the equation first; an unbalanced equation has no reliable ratio to offer.",
      ],
    },
    {
      heading: "The limiting reactant runs out first",
      paragraphs: [
        "Reactants are often not supplied in the exact ratio the equation requires. One is used up first; that reactant limits the amount of product, while the other is in excess and some remains. The limiting reactant is not always the one with the smaller mass, and it is not always the one with the smaller number of moles.",
        "Divide each reactant's amount by its coefficient in the balanced equation. The smallest quotient identifies the limiting reactant. For 2H₂ + O₂ → 2H₂O with 4.0 mol H₂ and 1.0 mol O₂, hydrogen gives 4.0 ÷ 2 = 2.0 and oxygen gives 1.0 ÷ 1 = 1.0. Oxygen has the smaller quotient, so oxygen limits the reaction. The product is 2.0 mol of water, and 2.0 mol of hydrogen remains unused.",
        "A quick stoichiometric check gives the same answer. Two moles of hydrogen need one mole of oxygen. Four moles of hydrogen would need two moles of oxygen, but only one is present, so oxygen runs out first. This check is often easier to explain in words, but the divided-by-coefficient comparison is the reliable general method.",
        "Once the limiting reactant is identified, use its amount with the equation's ratio. Do not add the products from both reactants, and do not use the excess reactant's amount as though it all reacted. The maximum product is fixed by the reactant that is exhausted first.",
      ],
    },
    {
      heading: "Check the unit, the magnitude and the reverse calculation",
      paragraphs: [
        "Three checks catch most mole errors. First, the unit: mass divided by molar mass gives moles, concentration multiplied by volume in dm³ gives moles, and moles multiplied by molar mass gives grams. Second, the magnitude: a few grams of a typical compound is usually a fraction of a mole, not hundreds of moles. Third, the reverse: multiply the answer back by the quantity you divided by and see whether you recover the starting value.",
        "Keep the unit conversion for volume outside the mole ratio. Converting 25.0 cm³ to 0.0250 dm³ is a measurement conversion; applying the coefficients is a separate chemical step. Doing both in one unlabelled line makes it impossible to see which factor caused a wrong answer.",
        "Round only at the end, and give the unit the question asks for. An answer of 0.0025 mol is clear; 0.0025 without a unit could be a mass, a volume or a count. A concentration answer needs mol/dm³, a mass answer needs grams, and an amount answer needs moles. The unit is part of the result, not a decoration after it.",
        "Finally, ask whether the answer makes chemical sense. A reaction cannot produce more product than the limiting reactant allows, a solution cannot contain more solute than the amount you put in, and a mass cannot appear from nowhere. The arithmetic and the chemical story should agree.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "chemistry.formula",
      body:
        "The mole relationship converts a measured mass into an amount. The relative formula mass is the mass of one mole, so it is the conversion factor between grams and moles.",
      notation: "n = m ÷ Mᵣ        m = n × Mᵣ        units: g ÷ (g/mol) = mol",
      caption:
        "For sodium hydroxide, Mᵣ = 23 + 16 + 1 = 40 g/mol. 8.0 g ÷ 40 g/mol = 0.20 mol, and 0.20 mol × 40 g/mol = 8.0 g.",
    },
    {
      id: "r2",
      kind: "chemistry.formula",
      body:
        "Concentration is an amount per volume of solution. Convert the volume to cubic decimetres before substituting, because 1 dm³ is 1000 cm³.",
      notation: "c = n ÷ V        n = c × V        V in dm³        cm³ ÷ 1000 = dm³",
      caption:
        "25.0 cm³ = 0.0250 dm³, so 0.100 mol/dm³ × 0.0250 dm³ = 0.00250 mol. Using 25 dm³ would be a thousand times too large.",
    },
    {
      id: "r3",
      kind: "chemistry.equation",
      body:
        "The coefficients are the mole ratio. They are not a mass ratio, so convert every mass to moles before applying them.",
      notation:
        "C₃H₈ + 5O₂ → 3CO₂ + 4H₂O       1 mol : 5 mol : 3 mol : 4 mol",
      caption:
        "4.4 g of propane is 0.10 mol because Mᵣ(C₃H₈) = 44 g/mol. The 1:4 ratio then gives 0.40 mol of water, which has a mass of 7.2 g.",
    },
    {
      id: "r4",
      kind: "chemistry.particle-model",
      body:
        "One mole of any substance contains the same number of particles, but the particles themselves have different masses. A mole of water and a mole of carbon dioxide both contain 6.02 × 10²³ formula units; their masses differ because H₂O and CO₂ have different relative formula masses.",
      notation:
        "1 mol H₂O = 6.02 × 10²³ formula units ≈ 18 g   ·   1 mol CO₂ = 6.02 × 10²³ formula units ≈ 44 g",
      caption:
        "The count is the same; the mass per particle is not. That is why a mole is a bridge between a particle count and a weighable mass, not a fixed mass in its own right.",
    },
    {
      id: "r5",
      kind: "chemistry.calculation",
      body:
        "When reactants are not in the exact ratio, divide each amount by its coefficient. The smallest quotient belongs to the limiting reactant and controls the product.",
      notation:
        "2H₂ + O₂ → 2H₂O   ·   4.0 mol H₂ ÷ 2 = 2.0   ·   1.0 mol O₂ ÷ 1 = 1.0   ·   O₂ is limiting   ·   2.0 mol H₂O forms",
      caption:
        "Oxygen runs out first, so the product stops at 2.0 mol even though hydrogen is still present. The 2.0 mol of hydrogen left over is the excess.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "Calculate the number of moles in 8.0 g of sodium hydroxide, NaOH. Use Na = 23, O = 16 and H = 1. Then calculate the mass of 0.20 mol of NaOH.",
      steps: [
        {
          move:
            "Calculate the relative formula mass by adding every atom in the formula.",
          why:
            "NaOH contains one sodium, one oxygen and one hydrogen: 23 + 16 + 1 = 40. The relative formula mass is 40 g/mol, the mass of one mole.",
        },
        {
          move:
            "Divide the mass by the relative formula mass: n = 8.0 ÷ 40.",
          why:
            "The unit check is grams ÷ grams per mole = moles. Dividing by the molar mass converts a weighable mass into an amount of particles.",
        },
        {
          move:
            "Calculate n = 0.20 mol, then reverse the operation for the second part.",
          why:
            "0.20 × 40 = 8.0 g. Recovering the starting mass shows that the division and the molar mass are consistent.",
        },
      ],
      answer:
        "Mᵣ(NaOH) = 23 + 16 + 1 = 40 g/mol. 8.0 g ÷ 40 g/mol = 0.20 mol. The mass of 0.20 mol is 0.20 × 40 = 8.0 g.",
    },
    {
      id: "w2",
      prompt:
        "A solution has a concentration of 0.100 mol/dm³. Calculate the amount of solute in 25.0 cm³ of the solution.",
      steps: [
        {
          move:
            "Convert the volume from cubic centimetres to cubic decimetres.",
          why:
            "Concentration is in mol/dm³, so the volume must be in dm³. 1 dm³ = 1000 cm³, so 25.0 cm³ = 0.0250 dm³.",
        },
        {
          move:
            "Multiply concentration by volume: n = c × V.",
          why:
            "0.100 mol/dm³ × 0.0250 dm³ gives 0.00250 mol. The dm³ units cancel, leaving moles.",
        },
        {
          move:
            "Check the magnitude and the reverse calculation.",
          why:
            "A small volume of a dilute solution should contain a small amount. Dividing 0.00250 by 0.0250 returns 0.100 mol/dm³, the original concentration.",
        },
      ],
      answer:
        "25.0 cm³ = 0.0250 dm³. n = 0.100 × 0.0250 = 0.00250 mol.",
    },
    {
      id: "w3",
      prompt:
        "For 2H₂ + O₂ → 2H₂O, 4.0 mol of hydrogen is mixed with 1.0 mol of oxygen. Identify the limiting reactant and calculate the maximum amount of water formed. How much hydrogen remains?",
      steps: [
        {
          move:
            "Divide each reactant's amount by its coefficient in the balanced equation.",
          why:
            "Hydrogen: 4.0 ÷ 2 = 2.0. Oxygen: 1.0 ÷ 1 = 1.0. The smallest quotient identifies the reactant that runs out first, which is oxygen.",
        },
        {
          move:
            "Use the limiting reactant's amount with the equation's product ratio.",
          why:
            "One mole of O₂ produces two moles of H₂O, so 1.0 mol O₂ produces 2.0 mol H₂O. The product is capped by oxygen, not by the larger amount of hydrogen.",
        },
        {
          move:
            "Subtract the hydrogen that reacted from the hydrogen supplied.",
          why:
            "Two moles of H₂ react with one mole of O₂, so 2.0 mol of H₂ is used. Starting with 4.0 mol leaves 2.0 mol of hydrogen in excess.",
        },
      ],
      answer:
        "Oxygen is limiting because 1.0 ÷ 1 is smaller than 4.0 ÷ 2. The reaction forms 2.0 mol of water, and 2.0 mol of hydrogen remains unreacted.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief:
        "A mole is a mass, so one mole of every substance has the same mass.",
      whyItFails:
        "A mole is a count of 6.02 × 10²³ particles, not a fixed mass. One mole of carbon-12 has a mass of 12 g, while one mole of water has a mass of about 18 g, because their particles have different masses. The number of particles is the same; the mass per particle is not.",
      correction:
        "Keep the count and the mass separate: one mole always contains Avogadro's number of particles, while its mass in grams equals the relative formula mass of that particular substance.",
      contrast: {
        wrong:
          "one mole of any substance weighs the same because a mole is a mass",
        right:
          "one mole contains the same number of particles, but its mass equals that substance's relative formula mass in grams",
      },
    },
    {
      id: "m2",
      belief:
        "The coefficients in a balanced equation can be used directly as a ratio of masses.",
      whyItFails:
        "The coefficients count particles or moles, not grams. Two moles of hydrogen has a mass of about 4 g, while one mole of oxygen has a mass of about 32 g; the mass ratio is not 2:1. Using masses as though they were coefficients gives the wrong amount of product.",
      correction:
        "Convert every mass to moles first. Apply the coefficient ratio to the amounts in moles, then convert the product back to the unit the question asks for.",
      contrast: {
        wrong:
          "2H₂ + O₂ → 2H₂O means 2 g of hydrogen reacts with 1 g of oxygen",
        right:
          "the equation means 2 mol of hydrogen reacts with 1 mol of oxygen; convert grams to moles before using that ratio",
      },
    },
    {
      id: "m3",
      belief:
        "The limiting reactant is the one present in the smaller mass or the smaller number of moles.",
      whyItFails:
        "The limiting reactant is the one that runs out first in the ratio required by the equation. A reactant with a smaller amount may still be in excess if the equation needs much less of it. Comparing raw amounts without dividing by the coefficients can identify the wrong reactant.",
      correction:
        "Divide each reactant's amount by its coefficient and compare the quotients. The smallest quotient is the limiting reactant; use its amount to calculate the product.",
      contrast: {
        wrong:
          "oxygen is limiting because 1 mol is a smaller number than 4 mol of hydrogen",
        right:
          "oxygen is limiting because 1.0 ÷ 1 is smaller than 4.0 ÷ 2 when the coefficients are included",
      },
    },
    {
      id: "m4",
      belief:
        "A volume in cubic centimetres can be substituted directly into n = c × V.",
      whyItFails:
        "Concentration is measured per cubic decimetre, not per cubic centimetre. Substituting 25.0 cm³ as 25 dm³ makes the answer 1000 times too large. The arithmetic is only valid after the units match.",
      correction:
        "Convert the volume to dm³ first: divide the number of cubic centimetres by 1000. Then multiply by the concentration in mol/dm³ and cancel the volume unit.",
      contrast: {
        wrong:
          "25.0 cm³ of 0.100 mol/dm³ contains 0.100 × 25 = 2.5 mol",
        right:
          "25.0 cm³ = 0.0250 dm³, so the amount is 0.100 × 0.0250 = 0.00250 mol",
      },
    },
  ],

  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Calculate the relative formula mass of calcium carbonate, CaCO₃, using Ca = 40, C = 12 and O = 16. Then calculate the amount in moles in 10.0 g of CaCO₃.",
      hint:
        "Add one calcium, one carbon and three oxygens. Then divide the mass by the total.",
      answer:
        "Mᵣ(CaCO₃) = 40 + 12 + 3 × 16 = 100 g/mol. n = 10.0 ÷ 100 = 0.10 mol.",
      feedback: {
        correct:
          "Correct. The three oxygens contribute 48, so the molar mass is 100 g/mol and 10.0 g is 0.10 mol.",
        incorrect:
          "Check the subscript on oxygen: CaCO₃ has three oxygen atoms, contributing 3 × 16 = 48. The molar mass is 40 + 12 + 48 = 100 g/mol, so divide 10.0 by 100.",
      },
    },
    {
      id: "p2",
      prompt:
        "A solution contains 0.0500 mol of solute in 250 cm³ of solution. Calculate its concentration in mol/dm³.",
      hint:
        "Convert 250 cm³ to dm³ before dividing the amount by the volume.",
      answer:
        "250 cm³ = 0.250 dm³. c = n ÷ V = 0.0500 ÷ 0.250 = 0.200 mol/dm³.",
      feedback: {
        correct:
          "Correct. The volume is 0.250 dm³, and dividing 0.0500 mol by it gives 0.200 mol/dm³.",
        incorrect:
          "Do not divide by 250. Convert the volume first: 250 cm³ = 0.250 dm³, then divide 0.0500 by 0.250.",
      },
    },
    {
      id: "p3",
      prompt:
        "For C₃H₈ + 5O₂ → 3CO₂ + 4H₂O, 0.10 mol of propane burns completely. Calculate the amount of carbon dioxide formed and its mass. Use Mᵣ(CO₂) = 44 g/mol.",
      hint:
        "The coefficient of CO₂ is 3, while propane's coefficient is 1. Apply that ratio before converting to mass.",
      answer:
        "The ratio of propane to carbon dioxide is 1:3, so 0.10 mol of propane gives 0.30 mol of CO₂. Its mass is 0.30 × 44 = 13.2 g.",
      feedback: {
        correct:
          "Correct. Multiply by 3 for the mole ratio, then by 44 for the mass.",
        incorrect:
          "The equation produces three moles of CO₂ for every one mole of propane. Use 0.10 × 3 = 0.30 mol, then multiply by 44 g/mol.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Calculate the amount in moles in 8.0 g of sodium hydroxide, NaOH. Use Mᵣ = 40 g/mol.",
      modelAnswer: "0.20 mol",
      marking: [
        "Uses n = mass ÷ relative formula mass.",
        "Substitutes 8.0 g and 40 g/mol.",
        "Gives 0.20 mol with the unit.",
      ],
      check: {
        accepted: ["0.20 mol", "0.2 mol", "0.20", "0.2"],
      },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "Calculate the amount of solute in 25.0 cm³ of a 0.100 mol/dm³ solution. Give your answer in moles.",
      modelAnswer: "0.00250 mol",
      marking: [
        "Converts 25.0 cm³ to 0.0250 dm³.",
        "Uses n = c × V.",
        "Gives 0.00250 mol with the unit.",
      ],
      check: {
        accepted: ["0.00250 mol", "0.0025 mol", "0.00250", "0.0025"],
      },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "For 2H₂ + O₂ → 2H₂O, 4.0 mol of hydrogen is mixed with 1.0 mol of oxygen. Identify the limiting reactant, calculate the maximum amount of water formed, and explain why the other reactant is in excess.",
      modelAnswer:
        "Divide each amount by its coefficient: hydrogen gives 4.0 ÷ 2 = 2.0, and oxygen gives 1.0 ÷ 1 = 1.0. Oxygen has the smaller quotient, so oxygen is limiting. One mole of oxygen produces two moles of water, so 2.0 mol of water forms. Two moles of hydrogen react with that one mole of oxygen, leaving 2.0 mol of the original 4.0 mol of hydrogen unused. The hydrogen is in excess because more of it was supplied than the oxygen can consume.",
      marking: [
        "Divides each reactant amount by its coefficient.",
        "Identifies oxygen as the limiting reactant.",
        "Uses the 1:2 oxygen-to-water ratio to obtain 2.0 mol of water.",
        "Explains that 2.0 mol of hydrogen remains because only that amount reacted.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "A student has 10.0 g of calcium carbonate, CaCO₃, and excess hydrochloric acid. The reaction is CaCO₃ + 2HCl → CaCl₂ + CO₂ + H₂O. Calculate the mass of carbon dioxide that can be produced. Use Mᵣ(CaCO₃) = 100 g/mol and Mᵣ(CO₂) = 44 g/mol.",
      whyItTransfers:
        "The lesson used propane combustion to join mass, moles and a balanced-equation ratio. Here the learner must apply the same chain to a different reaction with a 1:1 gas ratio and an excess reactant, rather than repeating the propane numbers.",
      answer:
        "10.0 g of CaCO₃ is 10.0 ÷ 100 = 0.10 mol. The equation gives one mole of CO₂ for every mole of CaCO₃, so 0.10 mol of CO₂ forms. Its mass is 0.10 × 44 = 4.4 g. The acid is in excess, so it does not limit the product; the calcium carbonate is the limiting reactant.",
      marking: [
        "Calculates the amount of CaCO₃ as 0.10 mol.",
        "Applies the 1:1 mole ratio to obtain 0.10 mol of CO₂.",
        "Converts 0.10 mol of CO₂ to 4.4 g.",
        "Identifies CaCO₃ as limiting because the acid is in excess.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State what a mole is and explain why one mole of water and one mole of carbon dioxide have different masses.",
      answer:
        "A mole is 6.02 × 10²³ particles. One mole of water has a mass of about 18 g and one mole of carbon dioxide has a mass of 44 g because their particles have different relative formula masses, even though the number of particles is the same.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "Calculate the amount of solute in 50.0 cm³ of 0.200 mol/dm³ solution.",
      answer:
        "50.0 cm³ = 0.0500 dm³. n = c × V = 0.200 × 0.0500 = 0.0100 mol.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "For N₂ + 3H₂ → 2NH₃, 2.0 mol of nitrogen is mixed with 3.0 mol of hydrogen. Identify the limiting reactant and calculate the amount of ammonia formed.",
      answer:
        "Nitrogen: 2.0 ÷ 1 = 2.0. Hydrogen: 3.0 ÷ 3 = 1.0. Hydrogen is limiting. The equation gives two moles of ammonia for every three moles of hydrogen, so 3.0 mol of hydrogen produces 2.0 mol of ammonia.",
      when: "month-later",
    },
  ],

  summary: [
    "A mole is 6.02 × 10²³ particles; its mass in grams is the relative formula mass of the substance.",
    "Convert mass to moles with n = m ÷ Mᵣ, and convert a solution volume to dm³ before using n = c × V.",
    "A balanced equation's coefficients give a mole ratio, not a mass ratio; convert every mass to moles first.",
    "The limiting reactant has the smallest amount divided by its coefficient. It caps the product; the other reactant is in excess.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Each formula is read with its units, and every substitution is followed by its unit check in words: grams divided by grams per mole gives moles.",
    },
    {
      need: "colour-vision",
      alternative:
        "The limiting reactant is identified by the numerical quotient and the word limiting, not by colour. The excess reactant is labelled in text and its remaining amount is stated.",
    },
    {
      need: "dyslexia",
      alternative:
        "Calculations follow a fixed four-line layout: formula, substitution, arithmetic, answer with unit. The same layout is used in all worked examples and assessments.",
    },
    {
      need: "motor",
      alternative:
        "All answers are typed. No equation has to be dragged or balanced by moving tiles, and a mole answer can be entered with ordinary digits such as 0.0025.",
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
        "All explanations, calculations, practice items, assessments and the calcium carbonate transfer are original to OpenMind.",
    },
    {
      sourceId: "gcse-chemistry-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against published GCSE chemistry subject content for quantitative chemistry and the mole.",
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
