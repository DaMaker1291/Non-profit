// ─────────────────────────────────────────────────────────────────────────────
// THE SUBJECT THEORY MAP — every concept in one subject, in prerequisite order.
//
// A lesson map answers "where is this idea?"; this map answers "what is the
// whole subject made of?". It is generated from the genome's own `prereqs`, so
// it cannot claim a relationship the content graph does not hold. Concepts are
// placed in columns by their longest prerequisite chain: a concept is always to
// the right of every same-subject concept it needs.
//
// The geometry is deliberately simple and testable: fixed-size boxes, one
// column per depth, and left-to-right lines. It is a map of prerequisites, not
// a claim of causation, and the visible caption says so. No third-party layout
// engine is used, which keeps the drawing identical in the React app and the
// offline bundle.
// ─────────────────────────────────────────────────────────────────────────────
import { bySubject, getConcept } from "./genome";
import type { SubjectId } from "./types";

export interface TheoryMapNode {
  readonly id: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TheoryMapEdge {
  readonly from: string;
  readonly to: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface TheoryMapLayout {
  readonly subject: SubjectId;
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly TheoryMapNode[];
  readonly edges: readonly TheoryMapEdge[];
  readonly maxDepth: number;
}

export const THEORY_NODE_WIDTH = 176;
export const THEORY_NODE_HEIGHT = 46;
export const THEORY_COLUMN_GAP = 38;
export const THEORY_ROW_GAP = 12;
export const THEORY_PAD = 12;

/** The full subject map, or null for a subject with no concepts. */
export function theoryMapFor(subject: SubjectId): TheoryMapLayout | null {
  const concepts = bySubject(subject);
  if (!concepts.length) return null;

  const ids = new Set(concepts.map((c) => c.id));
  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  /** Longest path from a root, so a child is never left of a prerequisite. */
  function depthOf(id: string): number {
    const cached = depths.get(id);
    if (cached !== undefined) return cached;
    // The genome is a DAG, but a future edit could introduce a cycle. Answer 0
    // rather than recurse forever; the gate reports the cycle separately.
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const concept = getConcept(id);
    const parents = (concept?.prereqs ?? []).filter((p) => ids.has(p));
    const depth = parents.length ? Math.max(...parents.map(depthOf)) + 1 : 0;
    visiting.delete(id);
    depths.set(id, depth);
    return depth;
  }

  for (const concept of concepts) depthOf(concept.id);

  const maxDepth = Math.max(...depths.values());
  const columns: TheoryMapNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  const columnWidth = THEORY_NODE_WIDTH + THEORY_COLUMN_GAP;
  const rowHeight = THEORY_NODE_HEIGHT + THEORY_ROW_GAP;
  const maxRows = Math.max(
    ...Array.from({ length: maxDepth + 1 }, (_, depth) =>
      concepts.filter((c) => (depths.get(c.id) ?? 0) === depth).length,
    ),
  );
  const width = THEORY_PAD * 2 + (maxDepth + 1) * THEORY_NODE_WIDTH + maxDepth * THEORY_COLUMN_GAP;
  const height = THEORY_PAD * 2 + maxRows * THEORY_NODE_HEIGHT + Math.max(0, maxRows - 1) * THEORY_ROW_GAP;

  for (const concept of concepts) {
    const depth = depths.get(concept.id) ?? 0;
    columns[depth].push({
      id: concept.id,
      depth,
      x: THEORY_PAD + depth * columnWidth,
      y: 0,
      width: THEORY_NODE_WIDTH,
      height: THEORY_NODE_HEIGHT,
    });
  }

  // Centre each column vertically. The tallest column sets the frame, so a
  // short branch does not cling to the top of a tall map.
  for (const column of columns) {
    const contentHeight = column.length * THEORY_NODE_HEIGHT + Math.max(0, column.length - 1) * THEORY_ROW_GAP;
    const startY = THEORY_PAD + (height - THEORY_PAD * 2 - contentHeight) / 2;
    column.forEach((node, i) => {
      column[i] = { ...node, y: startY + i * rowHeight };
    });
  }

  const byId = new Map(columns.flat().map((node) => [node.id, node] as const));
  const edges: TheoryMapEdge[] = [];
  for (const concept of concepts) {
    const child = byId.get(concept.id);
    if (!child) continue;
    for (const parentId of concept.prereqs) {
      const parent = byId.get(parentId);
      if (!parent) continue;
      edges.push({
        from: parentId,
        to: concept.id,
        x1: parent.x + parent.width,
        y1: parent.y + parent.height / 2,
        x2: child.x - 7,
        y2: child.y + child.height / 2,
      });
    }
  }

  return {
    subject,
    width,
    height,
    nodes: columns.flat(),
    edges,
    maxDepth,
  };
}
