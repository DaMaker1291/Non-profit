#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// THE SCIENCE FIGURES, CHECKED AS ARITHMETIC.
//
// A particle diagram is a claim that the atoms are the same on both sides; a
// cell diagram is a claim that the numbered parts exist and sit inside the cell;
// a circuit diagram is a claim that the meters are connected the way the lesson
// says. None of those is visible to a screenshot-only review, and a renderer
// test that only asserts "an SVG exists" would pass a picture that contradicts
// the caption beside it.
//
// Run: node scripts/science-figure-check.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

const require = createRequire(import.meta.url);
compileEngines();
const F = require("../.verify/figures.js");

let passed = 0;
const failures = [];
function ok(condition, label) {
  if (condition) passed++;
  else failures.push(label);
}
const inside = (value, max) => Number.isFinite(value) && value >= 0 && value <= max;

// ── particles: the equation in the lesson is balanced, and the drawing says so
const equation = {
  kind: "particles",
  left: [
    { atoms: ["H", "H"], count: 2 },
    { atoms: ["O", "O"], count: 1 },
  ],
  right: [{ atoms: ["O", "H", "H"], count: 2 }],
};
const P = F.particlesLayout(equation);
ok(P.balanced, "2H₂ + O₂ → 2H₂O draws a balanced atom count");
ok(P.leftAtoms.H === 4 && P.leftAtoms.O === 2, "the left side draws four H and two O");
ok(P.rightAtoms.H === 4 && P.rightAtoms.O === 2, "the right side draws four H and two O");
ok(P.left.length === 3, "two H₂ molecules and one O₂ molecule are three drawn molecules");
ok(P.right.length === 2, "the coefficient 2 draws two water molecules");
for (const molecule of [...P.left, ...P.right]) {
  ok(molecule.bonds.every(([a, b]) => molecule.atoms[a] && molecule.atoms[b]), "every drawn bond joins two drawn atoms");
  for (const atom of molecule.atoms) {
    ok(inside(atom.x, P.width) && inside(atom.y, P.height), "every atom is inside the figure");
  }
}
const unbalanced = F.particlesLayout({
  kind: "particles",
  left: [{ atoms: ["H", "H"], count: 1 }],
  right: [{ atoms: ["O", "H", "H"], count: 1 }],
});
ok(!unbalanced.balanced, "an unbalanced equation is reported as unbalanced, not silently called balanced");

// ── cell: numbered parts are unique, inside the frame, and variant-correct
const plant = F.cellLayout({ kind: "cell", variant: "plant" });
const animal = F.cellLayout({ kind: "cell", variant: "animal" });
ok(new Set(plant.numbers.map((n) => n.n)).size === plant.numbers.length, "plant-cell numbers are unique");
ok(plant.numbers.some((n) => n.n === 6), "the plant cell numbers its wall");
ok(plant.shapes.some((s) => s.kind === "wall"), "the plant cell draws a wall");
ok(plant.shapes.some((s) => s.kind === "chloroplast"), "the plant cell draws chloroplasts");
ok(plant.shapes.some((s) => s.kind === "vacuole"), "the plant cell draws a vacuole");
ok(!animal.shapes.some((s) => s.kind === "wall"), "the animal cell has no cellulose wall");
ok(!animal.shapes.some((s) => s.kind === "chloroplast"), "the animal cell has no chloroplasts");
ok(!animal.shapes.some((s) => s.kind === "vacuole"), "the animal cell has no large permanent vacuole");
for (const n of [...plant.numbers, ...animal.numbers]) {
  ok(inside(n.x, plant.width) && inside(n.y, plant.height), "every number badge is inside the cell frame");
}
for (const s of [...plant.shapes, ...animal.shapes]) {
  ok(inside(s.x, plant.width) && inside(s.y, plant.height), "every organelle centre is inside the cell frame");
}

// ── circuit: the ammeter is in the loop, the voltmeter is across the resistor
const C = F.circuitLayout({ kind: "circuit" });
ok(C.voltmeter !== null, "the default circuit shows a voltmeter");
ok(C.wires.some((w) => w.dashed), "the voltmeter leads are drawn as a parallel branch");
const resistorLeads = C.wires.filter((w) => w.dashed).flatMap((w) => w.points);
ok(resistorLeads.some(([x, y]) => x === C.resistor.x1 && y === C.resistor.y), "one voltmeter lead starts at the resistor's left end");
ok(resistorLeads.some(([x, y]) => x === C.resistor.x2 && y === C.resistor.y), "one voltmeter lead starts at the resistor's right end");
ok(C.ammeter.x > C.resistor.x2, "the ammeter sits on the return path, not across the resistor");
for (const wire of C.wires) {
  for (const [x, y] of wire.points) {
    ok(inside(x, C.width) && inside(y, C.height), "every wire point is inside the circuit frame");
  }
}
const noVolt = F.circuitLayout({ kind: "circuit", showVoltmeter: false });
ok(noVolt.voltmeter === null && !noVolt.wires.some((w) => w.dashed), "the voltmeter can be omitted without leaving a dangling branch");

// ── energy profile: the sign of ΔH and the drawing cannot disagree
const exo = F.energyProfileLayout({ kind: "energy-profile", reaction: "H₂ + Cl₂ → 2HCl", activation: 150, delta: -185 });
const endo = F.energyProfileLayout({ kind: "energy-profile", reaction: "N₂ + O₂ → 2NO", activation: 150, delta: 180 });
ok(exo.exothermic, "a negative ΔH is reported as exothermic");
ok(!endo.exothermic, "a positive ΔH is reported as endothermic");
ok(exo.productY > exo.reactantY, "exothermic products are drawn below the reactants");
ok(endo.productY < endo.reactantY, "endothermic products are drawn above the reactants");
ok(exo.peakY < exo.reactantY && exo.peakY < exo.productY, "the transition-state peak is above both levels for an exothermic reaction");
ok(endo.peakY < endo.reactantY && endo.peakY < endo.productY, "the transition-state peak is above both levels for an endothermic reaction");
ok(exo.points.every(([x, y]) => inside(x, exo.width) && inside(y, exo.height)), "every exothermic profile point is inside the frame");
ok(endo.points.every(([x, y]) => inside(x, endo.width) && inside(y, endo.height)), "every endothermic profile point is inside the frame");
ok(exo.deltaLabel.includes("−185") || exo.deltaLabel.includes("-185"), "the exothermic profile prints its signed ΔH");
ok(endo.activationLabel === "Ea", "the profile labels the activation barrier, not just the overall change");

// ── atom: the shells are the configuration, and every electron is inside them
const carbon = F.atomLayout({ kind: "atom", symbol: "C", protons: 6, neutrons: 6, shells: [2, 4] });
const sodium = F.atomLayout({ kind: "atom", symbol: "Na", protons: 11, neutrons: 12, shells: [2, 8, 1] });
ok(carbon.shells.length === 2, "carbon is drawn with two occupied shells");
ok(carbon.shells[0].electrons.length === 2 && carbon.shells[1].electrons.length === 4, "carbon's shells carry 2 and 4 electrons");
ok(carbon.electronsTotal === 6, "carbon's drawn electron total is six");
ok(sodium.shells.length === 3 && sodium.shells.map((s) => s.electrons.length).join(",") === "2,8,1", "sodium's shells are 2, 8, 1");
ok(sodium.shells[2].electrons.length === 1, "sodium's outer electron is drawn as one dot, not a full shell");
for (const layout of [carbon, sodium]) {
  for (const shell of layout.shells) {
    ok(shell.electrons.every((e) => inside(e.x, layout.width) && inside(e.y, layout.height)), "every drawn electron is inside the atom frame");
  }
}

// ── the chemistry scene vocabulary: every variant must produce a drawing, and
// the chart and pH variants must carry the values the caption talks about.
const CHEM_VARIANTS = ["particle-box", "periodic", "ionic", "covalent", "metallic", "mole", "ph", "electrolysis", "flame", "organic"];
for (const variant of CHEM_VARIANTS) {
  const layout = F.chemLayout({ kind: "chem", variant });
  ok(layout.shapes.length >= 5, `chem/${variant} draws at least five shapes`);
}
const rate = F.chemLayout({ kind: "chem", variant: "chart", xMax: 10, yMax: 10, series: [{ points: [[0, 9], [5, 3], [10, 2]] }] });
ok(rate.shapes.filter((s) => s.kind === "polyline").length === 1, "a rate chart draws its series as a polyline");
const equilibrium = F.chemLayout({ kind: "chem", variant: "chart", series: [{ points: [[0, 9], [10, 4]] }, { points: [[0, 1], [10, 5]], dashed: true }] });
ok(equilibrium.shapes.filter((s) => s.kind === "polyline").length === 2, "an equilibrium chart draws both directions");
const ph = F.chemLayout({ kind: "chem", variant: "ph" });
ok(ph.shapes.some((s) => s.kind === "text" && s.text === "7"), "the pH scale marks neutral 7");
const flames = F.chemLayout({ kind: "chem", variant: "flame" });
const flameColours = new Set(flames.shapes.filter((s) => s.kind === "path").map((s) => s.fill));
ok(flameColours.size === 5, `the flame test distinguishes all five metal ions by colour (${flameColours.size} paints)`);
ok(ph.shapes.filter((s) => s.kind === "rect").length === 15, "the pH scale has fifteen whole-number bands");

// ── the registry is the renderer's list, not a parallel list
for (const kind of ["particles", "circuit", "cell", "atom", "chem", "energy-profile"]) {
  ok(F.FIGURE_KINDS.includes(kind), `${kind} is declared in FIGURE_KINDS`);
}

if (failures.length) {
  console.error("Science figure failures:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`✓ ${passed} assertions: particle conservation, cell variant and bounds, circuit connections, atom shells, chemistry schematics, reaction-profile signs.`);
