// ─────────────────────────────────────────────────────────────────────────────
// THE TEACHING, IN THE LEARNER'S LANGUAGE OF INSTRUCTION.
//
// WHY THIS FILE EXISTS. lib/content-i18n.ts states the asymmetry this product
// lived with and now prints to the learner: all fifteen dictionaries carry the
// 135 concept titles and blurbs, and NONE of them carries a sentence of the
// teaching — a plan's paragraphs, a worked explanation, a question prompt, a
// repair and a hint are authored English. For a learner taught in French, Urdu
// or Bengali, that is the difference between an app they can use and an app
// that teaches them in a language they are still learning in. The lesson page
// already warns them (`lq.teachNote`); warning is honest and is not instruction.
//
// WHAT THIS MODULE IS. The mechanism: a plan may be translated as a whole, and
// `planFor(id, lang)` resolves the translated one when it exists. It is
// deliberately ALL-OR-NOTHING. A plan whose objective is French and whose idea
// paragraphs are English is worse than an English plan, because the learner is
// told the lesson is in their language and then dropped back into English
// mid-paragraph. So a translation is accepted only when it supplies every part
// the English plan carries — same number of idea paragraphs, same number of
// traps, and the figure's caption too when the plan has a figure — and the
// merge REFUSES anything less, falling back to English rather than half-way.
// `npm run verify` asserts that refusal on a planted partial translation, so
// the rule is enforced by a test rather than by this comment.
//
// WHAT IT IS NOT. It is not coverage. One plan is translated, into one
// language, and that is the number the coverage report prints
// (`teachingLanguages`). Fifteen languages x fifteen pilot concepts is a
// content-authoring job with a bilingual maths teacher in it, not a code
// change; pretending otherwise is exactly the claim this project refuses to
// make about lessons and review states. THE POINT OF THIS COMMIT IS THAT THE
// JOB IS NOW POSSIBLE AND CHECKABLE — a translator adds an entry here, the
// gate refuses a partial one, and the page stops telling that learner the
// lesson is in English the moment it is not.
//
// WHY NOT MACHINE-TRANSLATE THE BANK. Because a maths explanation is where
// meaning lives: "the bottom number is a SIZE, not a quantity" survives
// translation only if the translator understands which mistake it is aimed at.
// The translation of `fractions` below was written against the English plan
// deliberately, and the review state of a translated plan is the ENGLISH
// plan's — `planFor` never upgrades `review`, so a translation cannot make an
// unreviewed lesson look reviewed.
// ─────────────────────────────────────────────────────────────────────────────
import type { LessonPlan, LessonTrap } from "./lesson-plans";

/** One plan, in one language, complete. Every field the English plan carries
 *  that is READ BY A LEARNER is here; `conceptId` and `review` are not, because
 *  they are properties of the PLAN rather than of its wording. */
export interface PlanTranslation {
  readonly objective: string;
  readonly intuition: string;
  /** One paragraph per idea, in the same order as the English plan's. */
  readonly idea: readonly string[];
  readonly traps: readonly LessonTrap[];
  readonly usedFor: string;
  /** The figure's caption. Required whenever the plan being translated has a
   *  figure: the caption is the teaching (the SVG is `aria-hidden`), so an
   *  English caption under a French lesson is a half-translated lesson. */
  readonly caption?: string;
}

/**
 * THE TRANSLATED PLANS, by language then concept.
 *
 * `fr` · `fractions` is the first entry, chosen because it is the first concept
 * of the reviewed pilot pathway and because francophone Africa is one of the
 * largest populations this product is for and one where the national
 * examinations are sat in French. It is a WORKED EXAMPLE of the pipeline, not
 * a claim that French is covered.
 */
export const PLAN_TRANSLATIONS: Readonly<Record<string, Readonly<Record<string, PlanTranslation>>>> = {
  fr: {
    fractions: {
      objective:
        "Lire une fraction comme un nombre, en comparer deux, et expliquer pourquoi 1/8 est plus petite que 1/4 alors que 8 est plus grand.",
      intuition:
        "Deux tablettes de chocolat identiques. L'une est cassée en quatre morceaux, l'autre en huit, et on vous donne un morceau de chacune. C'est la tablette en huit morceaux qui vous a donné le PLUS PETIT morceau, alors même que 8 est le plus grand nombre — parce que le nombre du bas ne dit pas la quantité reçue : il dit en combien de morceaux on a coupé la tablette. Toute question sur les fractions commence par demander lequel de ces deux rôles joue chaque nombre.",
      idea: [
        "Une fraction compte des morceaux ÉGAUX d'un tout. Dans 3/4, le nombre du bas, 4, dit que le tout a été coupé en quatre morceaux égaux ; le nombre du haut, 3, dit combien de ces morceaux vous avez. Dites-le à voix haute ainsi — « trois morceaux, chacun un quart » — et l'écriture cesse d'être deux nombres empilés l'un sur l'autre.",
        "Le nombre du bas est une TAILLE, pas une quantité. Plus on coupe une tablette en morceaux, plus chaque morceau est petit : un dénominateur plus grand donne une part plus petite, donc 1/8 < 1/4. C'est l'erreur la plus fréquente de tout le chapitre, et ce n'est pas de la négligence : c'est lire le dénominateur comme une quantité, alors que c'est précisément le rôle du nombre du haut.",
        "Des fractions égales disent la même quantité avec des morceaux différents. 1/2 = 2/4 = 3/6, parce que multiplier le haut et le bas par le même nombre double le nombre de morceaux ET divise leur taille par deux : la quantité de chocolat ne change pas. C'est pourquoi vous pouvez agrandir ou réduire une fraction à condition de faire la même chose en haut et en bas : vous renommez les morceaux, vous ne changez pas la quantité.",
        "Pour comparer des fractions dont les dénominateurs diffèrent, on ramène les morceaux à la même taille — un dénominateur commun. 2/3 et 3/4 deviennent 8/12 et 9/12, et les numérateurs se comparent alors directement. L'autre méthode fiable ne demande aucun calcul : comparez chaque fraction à 1/2. Une fraction dont le haut est inférieur à la moitié du bas (3/8) est en dessous de 1/2, une fraction dont le haut dépasse la moitié du bas (5/8) est au-dessus ; donc 3/8 < 5/8, sans avoir rien calculé.",
        "Une fraction est UN nombre, pas une division inachevée. 3/4 occupe une place précise sur la droite graduée, entre 0 et 1, plus près de 1 que de 0 — et une fois qu'on la voit là, l'additionner, la comparer et l'agrandir deviennent des opérations sur un nombre, et non des règles sur deux entiers écrits l'un au-dessus de l'autre.",
        "Les décimaux et les pourcentages sont la même idée dans une autre écriture : 3/4 = 0,75 = 75 %. La quantité ne change pas quand l'écriture change, et un élève qui sait où se trouve 3/4 sur la droite sait déjà l'essentiel de ce que les deux notions suivantes enseignent.",
      ],
      traps: [
        {
          move: "« 1/8 est plus grande que 1/4 parce que 8 est plus grand que 4. »",
          why: "Le nombre du bas compte les morceaux : un bas plus grand signifie des morceaux plus petits. Coupez la même tablette en huit et chaque morceau fait la moitié du quart que vous aviez. Comparez les parts, pas les nombres.",
        },
        {
          move: "« 2/3 est plus grande que 3/4 parce que 2 et 3 sont plus grands que 3 et 4. »",
          why: "Comparer les numérateurs ne marche que si les dénominateurs sont identiques. Ici les morceaux n'ont pas la même taille : 2 morceaux d'une taille et 3 morceaux d'une autre ne peuvent pas se compter l'un contre l'autre avant d'avoir égalisé les tailles — 8/12 contre 9/12.",
        },
        {
          move: "« 3/4 + 1/4 = 4/8. »",
          why: "Additionner les dénominateurs change la taille de chaque morceau dans la réponse : l'addition ne porte donc plus sur les mêmes touts. Des quarts et des quarts ont la même taille, donc les numérateurs s'ajoutent simplement : 3/4 + 1/4 = 1. (Les dénominateurs différents viennent à la notion suivante, et il faut d'abord un dénominateur commun.)",
        },
      ],
      usedFor:
        "Les pourcentages et les décimaux sont des fractions écrites autrement, le ratio en compare deux, et la probabilité en est une : la chance d'obtenir un six est 1/6, une fraction avant d'être un pourcentage.",
      caption:
        "Trois quarts d'un tout : le cercle est le 1, et la partie colorée représente trois de ses quatre parts égales. Un quart est une part, donc trois parts font 3/4 — et quatre parts rempliraient exactement le cercle.",
    },
  },
};

/** Does THIS translation object cover every part the English plan carries?
 *  Returns the reasons it does NOT, so the gate can print them; an empty list is
 *  a complete translation.
 *
 *  Separate from the lookup below ON PURPOSE: the refusal is the rule that keeps
 *  a half-French lesson out of a classroom, and a rule nobody can call with a
 *  planted bad input is a rule nobody has tested. `npm run verify` hands this
 *  function three deliberately broken translations and requires each to be
 *  refused by name. */
export function gapsFor(tr: PlanTranslation | undefined, base: LessonPlan): string[] {
  if (!tr) return ["no translation"];
  const gaps: string[] = [];
  const nonEmpty = (s: string | undefined) => typeof s === "string" && s.trim().length > 0;
  if (!nonEmpty(tr.objective)) gaps.push("objective");
  if (!nonEmpty(tr.intuition)) gaps.push("intuition");
  if (!nonEmpty(tr.usedFor)) gaps.push("usedFor");
  if (tr.idea.length !== base.idea.length) gaps.push(`idea ${tr.idea.length}/${base.idea.length}`);
  else if (tr.idea.some((p) => !nonEmpty(p))) gaps.push("blank idea paragraph");
  if (tr.traps.length !== base.traps.length) gaps.push(`traps ${tr.traps.length}/${base.traps.length}`);
  else if (tr.traps.some((t) => !nonEmpty(t.move) || !nonEmpty(t.why))) gaps.push("blank trap");
  if (base.figure && !nonEmpty(tr.caption)) gaps.push("caption");
  // A translation that is byte-identical to the English in more than one part
  // is not a translation; one identical part can be legitimate ("DNA", a
  // formula), so the bar is more than one.
  const same = [
    tr.objective === base.objective,
    tr.intuition === base.intuition,
    tr.usedFor === base.usedFor,
    tr.idea.every((p, i) => p === base.idea[i]),
  ].filter(Boolean).length;
  if (same > 1) gaps.push("not actually translated");
  return gaps;
}

/** The gaps for a concept in a language, or `["no translation"]`. */
export function translationGaps(conceptId: string, lang: string, base: LessonPlan): string[] {
  return gapsFor(PLAN_TRANSLATIONS[lang]?.[conceptId], base);
}

/** The translated plan, or null when it is missing OR incomplete. Never a
 *  partial merge: see the header. */
export function translatedPlanFor(conceptId: string, lang: string, base: LessonPlan): LessonPlan | null {
  if (lang === "en") return null;
  const tr = PLAN_TRANSLATIONS[lang]?.[conceptId];
  if (!tr) return null;
  if (translationGaps(conceptId, lang, base).length > 0) return null;
  return {
    ...base,
    objective: tr.objective,
    intuition: tr.intuition,
    idea: tr.idea,
    traps: tr.traps,
    usedFor: tr.usedFor,
    // The review state is the ENGLISH plan's: a translation is a new artefact,
    // and the gate that would review it is a bilingual teacher, not this file.
    review: base.review,
    figure: base.figure ? { spec: base.figure.spec, caption: tr.caption as string } : undefined,
  };
}

/** Which languages teach this concept as a COMPLETE translation. The coverage
 *  number the page and the suite read, computed rather than remembered: a
 *  translation that is missing a paragraph is not coverage, so it is not listed.
 *  `lib/lesson-plans.ts#teachingLanguages` is the one-argument form the surfaces
 *  call; this one takes the English plan so the two modules do not import each
 *  other at runtime. */
export function completeLanguages(conceptId: string, base: LessonPlan | null): string[] {
  if (!base) return [];
  return Object.keys(PLAN_TRANSLATIONS)
    .filter((lang) => translationGaps(conceptId, lang, base).length === 0)
    .sort();
}
