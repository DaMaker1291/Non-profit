// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNING MAP — the diagram every lesson can honestly carry.
//
// A subject diagram says how a cell is built or how a reaction profile moves;
// this map says where the idea SITS. That is a different claim, and it is one
// the genome can make for every concept without inventing science: prerequisites
// on the left, this lesson in the middle, the next ideas on the right. A learner
// who is lost in a lesson can see what it assumes and what it unlocks.
//
// The geometry is pure and deliberately small: at most two prerequisites and two
// next concepts are drawn, because a map with twenty arrows teaches nothing. The
// cap is reported (`beforeMore` / `afterMore`) so the page can say what it left
// out rather than silently truncating the pathway.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS, CONCEPTS_BY_ID } from "./genome";

export interface LessonMapNode {
  readonly id: string;
  readonly role: "before" | "this" | "after" | "nearby";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LessonMapEdge {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface LessonMapLayout {
  readonly conceptId: string;
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly LessonMapNode[];
  readonly edges: readonly LessonMapEdge[];
  readonly beforeMore: number;
  readonly afterMore: number;
}

export const MAP_WIDTH = 640;
export const MAP_HEIGHT = 230;
export const MAP_NODE_WIDTH = 176;
export const MAP_NODE_HEIGHT = 54;

function yFor(index: number, count: number): number {
  if (count <= 1) return (MAP_HEIGHT - MAP_NODE_HEIGHT) / 2;
  return 58 + index * 98;
}

/** At most two each side, in the genome's own order. */
export function lessonMapFor(conceptId: string): LessonMapLayout | null {
  const concept = CONCEPTS_BY_ID[conceptId];
  if (!concept) return null;
  const before = concept.prereqs.slice(0, 2);
  const after = CONCEPTS.filter((c) => c.prereqs.includes(conceptId)).map((c) => c.id).slice(0, 2);
  // A few foundation concepts have no prerequisite and no dependant recorded in
  // the genome. A centre box alone would be a picture of nothing, so those maps
  // show two other starting points in the same subject — explicitly as nearby
  // context, NOT as an arrow that would claim a prerequisite relation.
  const nearby = before.length === 0 && after.length === 0
    ? CONCEPTS.filter((c) => c.subject === concept.subject && c.id !== conceptId).map((c) => c.id).slice(0, 2)
    : [];
  const thisNode: LessonMapNode = {
    id: conceptId,
    role: "this",
    x: (MAP_WIDTH - MAP_NODE_WIDTH) / 2,
    y: (MAP_HEIGHT - MAP_NODE_HEIGHT) / 2,
    width: MAP_NODE_WIDTH,
    height: MAP_NODE_HEIGHT,
  };
  const beforeNodes = before.map((id, i) => ({
    id,
    role: "before" as const,
    x: 8,
    y: yFor(i, before.length),
    width: MAP_NODE_WIDTH,
    height: MAP_NODE_HEIGHT,
  }));
  const afterNodes = after.map((id, i) => ({
    id,
    role: "after" as const,
    x: MAP_WIDTH - MAP_NODE_WIDTH - 8,
    y: yFor(i, after.length),
    width: MAP_NODE_WIDTH,
    height: MAP_NODE_HEIGHT,
  }));
  const nearbyNodes = nearby.map((id, i) => ({
    id,
    role: "nearby" as const,
    x: MAP_WIDTH - MAP_NODE_WIDTH - 8,
    y: yFor(i, nearby.length),
    width: MAP_NODE_WIDTH,
    height: MAP_NODE_HEIGHT,
  }));
  const edges: LessonMapEdge[] = [];
  for (const node of beforeNodes) {
    edges.push({
      from: node.id,
      to: conceptId,
      x1: node.x + node.width,
      y1: node.y + node.height / 2,
      x2: thisNode.x - 8,
      y2: thisNode.y + thisNode.height / 2,
    });
  }
  for (const node of afterNodes) {
    edges.push({
      from: conceptId,
      to: node.id,
      x1: thisNode.x + thisNode.width,
      y1: thisNode.y + thisNode.height / 2,
      x2: node.x - 8,
      y2: node.y + node.height / 2,
    });
  }
  return {
    conceptId,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    nodes: [...beforeNodes, thisNode, ...afterNodes, ...nearbyNodes],
    edges,
    beforeMore: Math.max(0, concept.prereqs.length - before.length),
    afterMore: Math.max(0, CONCEPTS.filter((c) => c.prereqs.includes(conceptId)).length - after.length),
  };
}

/** Split a concept title into at most two short SVG lines. A title is a label,
 *  not a paragraph; the caption below the map carries the full names. */
export function wrapLessonMapLabel(label: string, max = 24): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= max || !current) lines[lines.length - 1] = candidate;
    else if (lines.length < 2) lines.push(word);
    else lines[1] = `${lines[1]} ${word}`.slice(0, max - 1) + "…";
  }
  return lines;
}