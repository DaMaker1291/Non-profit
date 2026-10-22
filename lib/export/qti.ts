// ─────────────────────────────────────────────────────────────────────────────
// QTI 2.2 EXPORT — the question bank as something another LMS can ingest.
//
// IMS Question & Test Interoperability (QTI) 2.2 is the format Moodle, Canvas,
// Blackboard, Sakai and most ministry platforms import. Exporting it is the
// difference between "adopt our platform" (a procurement fight) and "drop our
// items into the platform you already bought" (a Tuesday's work for their
// content team).
//
// THREE DECISIONS THAT ARE NOT OBVIOUS, each for a reason:
//
//   1. THE EXPLANATION IS NOT EXPORTED. `Question.explanation` states why the key
//      is right — often naming it outright — so an item carrying it hands the
//      learner the answer through the LMS's own review or feedback view. The
//      explanation belongs to the teaching surface, not to the item.
//
//   2. `shuffle="true"` ON EVERY `choiceInteraction`. This bank has a measured
//      option-position bias (see docs/ASSESSMENT_VALIDITY.md); importing items
//      with their authored order frozen would export the bias along with them and
//      make it permanent in a system we no longer control. An importer that
//      shuffles makes position carry no signal.
//
//   3. NUMERIC ITEMS EXPORT AS CHOICE ITEMS. A numeric item already carries an
//      MCQ projection (`choices` + `answer`, kept aligned with the true value for
//      grading), so exporting it as a choice item loses nothing an importer could
//      use and avoids inventing a text-entry interaction with a tolerance the
//      receiving system would have to implement. The alternative — a free-text
//      interaction — would either be marked wrong for `0.75` vs `0.750` or push
//      the tolerance decision onto software that has no way to know it.
//
// WHAT A RECEIVER GETS: a package (ZIP) containing `imsmanifest.xml` and one
// `items/<id>.xml` per item, each a valid `assessmentItem`. The manifest declares
// `imsqti_item_xmlv2p2` resources so an importer can find the items without
// guessing the layout.
// ─────────────────────────────────────────────────────────────────────────────
import type { Concept, Question } from "../types";
import { zipStore, type ZipEntry } from "./zip";

/** XML text escaping. A prompt containing `x < 3` or `a & b` must not produce a
 *  malformed item — and this bank's prompts contain both, constantly. */
export function xmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** The app's maths markup is `$...$`; an LMS would print the dollars literally.
 *  Delimiters are dropped and their contents kept — the maths itself is plain
 *  text in this bank (no LaTeX), so this loses no notation. */
function plainText(text: string): string {
  return text.replace(/\$([^$]*)\$/g, "$1");
}

/** A QTI identifier must be usable as an XML name-ish token. Item ids are
 *  generated as `om-...`, but a stored or authored item can carry anything. */
function identifier(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_.-]/g, "-").replace(/^-+/, "");
  return cleaned.length ? cleaned : "item";
}

/** Stable option identifiers, independent of position: the FIRST choice is `A`
 *  in the authored order, and the `correctResponse` names the one index that is
 *  right. Shuffling happens at delivery, so these labels are not positions. */
function choiceId(index: number): string {
  return `C${index + 1}`;
}

/**
 * One QTI 2.2 `assessmentItem`.
 *
 * `conceptTitle` is carried as the item's `title` prefix so an importer's item
 * list is readable ("Quadratic equations — om-q-17") rather than a wall of ids.
 */
export function qtiItemXml(item: Question, conceptTitle: string): string {
  const choices = Array.isArray(item.choices) ? item.choices : [];
  const hasChoices = choices.length >= 2;
  // Clamp rather than throw: a stored item whose answer index drifted is a data
  // problem the export should survive and an importer should see as an item with
  // no correct response, not as an export that failed for the whole concept.
  const answerIndex = hasChoices
    ? Math.max(0, Math.min(Math.floor(item.answer), choices.length - 1))
    : -1;
  const itemId = identifier(`om-${item.conceptId}-${item.id}`);

  const prompt = xmlEscape(plainText(item.prompt));

  const body = hasChoices
    ? [
        `      <itemBody>`,
        `        <p>${prompt}</p>`,
        `        <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1" shuffle="true">`,
        ...choices.map(
          (choice, i) => `          <simpleChoice identifier="${choiceId(i)}">${xmlEscape(plainText(choice))}</simpleChoice>`,
        ),
        `        </choiceInteraction>`,
        `      </itemBody>`,
      ]
    : [
        `      <itemBody>`,
        `        <p>${prompt}</p>`,
        `        <extendedTextInteraction responseIdentifier="RESPONSE" expectedLines="1"/>`,
        `      </itemBody>`,
      ];

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p2" identifier="${itemId}" title="${xmlEscape(`${conceptTitle} — ${item.id}`)}" adaptive="false" timeDependent="false">`,
    hasChoices
      ? [
          `      <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">`,
          `        <correctResponse>`,
          `          <value>${choiceId(answerIndex)}</value>`,
          `        </correctResponse>`,
          `      </responseDeclaration>`,
        ].join("\n")
      : [
          `      <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>`,
        ].join("\n"),
    `      <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>`,
    ...body,
    `</assessmentItem>`,
    ``,
  ].join("\n");
}

/**
 * The IMS Content Package manifest. An importer reads this to discover the items;
 * without it the ZIP is a folder of XML with no declared type.
 *
 * `schemaversion` 1.1.4 is the Content Packaging version QTI 2.2 packages use; the
 * resource `type` is what tells a QTI-aware importer that each file is an item.
 */
function manifestXml(concept: Concept, itemFiles: string[]): string {
  const resources = itemFiles
    .map((href, i) => {
      const rid = identifier(`om-res-${concept.id}-${i + 1}`);
      return [
        `    <resource identifier="${rid}" type="imsqti_item_xmlv2p2" href="${xmlEscape(href)}">`,
        `      <file href="${xmlEscape(href)}"/>`,
        `    </resource>`,
      ].join("\n");
    })
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<manifest identifier="${identifier(`om-qti-${concept.id}`)}" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2" xmlns:lom="http://ltsc.ieee.org/xsd/LOM">`,
    `  <metadata>`,
    `    <schema>IMS Content</schema>`,
    `    <schemaversion>1.1.4</schemaversion>`,
    `  </metadata>`,
    `  <organizations/>`,
    `  <resources>`,
    resources,
    `  </resources>`,
    `</manifest>`,
    ``,
  ].join("\n");
}

/**
 * A complete QTI 2.2 package for one concept, as ZIP bytes.
 *
 * `items` is the caller's selection (the route draws them deterministically), so
 * this function is pure and a test can assert the bytes of a fixed input without
 * running a generator.
 */
export function qtiPackage(input: { concept: Concept; items: readonly Question[] }): Uint8Array {
  const { concept, items } = input;
  const entries: ZipEntry[] = [];
  const hrefs: string[] = [];

  items.forEach((item, i) => {
    // The archive path is positional and the ITEM id is inside the XML: two draws
    // of one concept can legitimately share an id (the same item served twice),
    // and a duplicate archive entry would make the ZIP ambiguous to an importer.
    const href = `items/${String(i + 1).padStart(2, "0")}-${identifier(item.id)}.xml`;
    hrefs.push(href);
    entries.push({ path: href, data: qtiItemXml(item, concept.title) });
  });

  return zipStore([{ path: "imsmanifest.xml", data: manifestXml(concept, hrefs) }, ...entries]);
}
