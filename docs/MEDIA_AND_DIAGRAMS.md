# Media, diagrams and the learner who cannot open the video

**This is an engineering and content policy, not legal advice.** It records what
the cited platform terms say and the conservative choice this repository makes.
It does not establish that OpenMind is a non-profit, a school, or a
non-commercial user. Those are facts about the operating entity and its
jurisdiction, and they have not been confirmed here. Before charging, running
ads, or claiming an educational exemption, have counsel review the entity and
the specific use.

## The decision: link out, do not embed, download or rehost

Every lesson video is an **ordinary outbound link**. The page does not create an
iframe, does not load a third-party player, does not fetch a thumbnail, and does
not download or rehost the media. The card shows the source, the audio language,
the caption status, the running time when the source states one, and a short
summary written in the lesson's own words.

This is deliberately more conservative than the platforms' own embedding
permissions. Three reasons:

1. **A player that fails is worse than a link that fails.** An embedded player
   that is region-blocked, age-gated, cookie-gated or slow leaves a blank box
   exactly where the page promised teaching. A link leaves the lesson, the
   summary and the diagram intact.
2. **No third-party request happens until the learner chooses it.** An embed can
   contact the video host before consent, and `youtube-nocookie` is not by
   itself a complete consent mechanism. Not embedding avoids that decision
   entirely.
3. **The licence position is simpler.** Linking to a source is not copying its
   content into this repository. Reproducing a video, its thumbnail, or a
   modified excerpt needs a permission this project does not have.

The gate `npm run media-check` enforces the shape: HTTPS links only, no
`/embed/` URLs, no media-file URLs, a language tag, a caption status, a fallback
summary, a text route in the same lesson, `target="_blank"` with
`rel="noreferrer noopener"`, and a visible `concept` / `subject` scope. It also
requires every one of the 135 lesson plans to resolve a card, not only the five
with an authored concept video.

## Source-by-source position

The position below is the one this project relies on **today**. "Link only" means
we link to the original page and write our own summary; we do not copy the
video, its poster, its transcript or its exercise.

| Source | What its published terms allow | What this project does | Why |
| --- | --- | --- | --- |
| **YouTube** | Watching on YouTube and using the embeddable player are permitted by the service; downloading, redistributing, or using content outside the service is not, except as the service expressly authorises or with written permission. Embeds are also subject to the YouTube API Services Terms (including the child-directed audience declaration). | **Link only**, and only to a public watch page. No download, no rehost, no thumbnail copy, no background player. | The embed route adds API terms, consent and region/age failure modes that a link avoids. |
| **Khan Academy** | Khan's own help page says its videos and exercises are available under CC BY-NC-SA 4.0 unless noted, and that linking/embedding is allowed with attribution for non-commercial use without fees or framing. | **Link only.** The card names Khan Academy and the summary is original text. | The non-commercial condition depends on the operating entity, which is unconfirmed. Linking does not require us to assert it. |
| **PhET** | PhET simulations are CC BY-NC 4.0; the site provides an Embed button and asks for attribution. Commercial use (including paid services, advertising, or fundraising) needs a separate licence. | **Link only.** No simulation files copied. | Same unconfirmed non-commercial status; a link is the narrowest use. |
| **OpenStax** | Most books are CC BY-NC-SA; some items differ. | **Link only** until the exact book/item licence is recorded. | The licence is per item, not per logo. |
| **CK-12** | CK-12 materials have their own terms and licences that vary by collection. | **Link only** until the item-level terms are checked. | A blanket claim would be false. |
| **BBC Bitesize** | BBC terms restrict embedding and reuse; educational use can depend on a broadcast/educational licence. | **Link only.** | The page is useful; its media is not ours to copy. |
| **TED-Ed** | TED-Ed videos are generally on YouTube and follow YouTube's player terms; downloading/editing/redistributing is not permitted. | **Link only.** | Same YouTube route, same refusal to download. |
| **BioInteractive / HHMI** | Resources have mixed, item-specific terms. | **Link only**, or no link. | No item-level permission recorded. |

"Link only" is not a claim that every link is lawful in every jurisdiction. It is
the narrowest use that still helps a learner: the source remains the host, the
source's own terms and privacy notice apply when the learner opens it, and this
project copies nothing.

## Countries and blocked networks

YouTube is not a global utility. Availability changes and can differ by network,
not just by country:

- **Mainland China** has blocked YouTube since 2009. Hong Kong and Macau are
  separate cases and should not be inferred from the mainland.
- **Iran** blocks YouTube.
- **Russia** has reported a full nationwide block since February 2026, after a
  period of throttling. Reports describe it as a DNS-level block that can fail
  without a VPN; this project does not provide or recommend circumvention.
- **Per-video restrictions** can apply even where YouTube itself opens: uploaders
  can restrict countries, and age-restricted videos may refuse to play in an
  embedded context or require sign-in. A public watch URL can therefore work for
  one learner and fail for another.

Sources: YouTube's region-restriction help page; GreatFire's mainland-China
measurement (YouTube listed as blocked); vpnAlert's daily tests for China, Iran
and Russia; Human Rights Watch on Russia's VPN crackdown; contemporary reporting
on the February 2026 Russian block.

**Product consequence:** the video is optional enrichment. The card states
"Needs internet; the lesson below teaches the same idea without it." A blocked
link is a failed enhancement, not a failed lesson. The page never waits for the
video, never autoplays, and never makes an answer depend on watching it.

## Language, captions and translation

- All 135 linked video cards are **English audio** (`language: "en"`). That is a
  fact about the audio, not a claim that any video has been localised.
- Caption status is currently **`unknown`** for all 135. We have not verified a
  human caption track. YouTube's automatic captions and auto-translation are
  machine-generated and unreliable for technical vocabulary; they are not a
  substitute for a reviewed translation.
- The card therefore prints "captions not verified" rather than "captioned".
  When a track is checked, the field becomes `human`, `auto` or `none` and the
  card says which.
- Five cards are concept-specific. The other 130 are **subject overviews**, and
  the card says `Subject overview · not specific to this idea` before the
  learner taps. A broad tour of biology is useful enrichment; it is not the
  lesson on mitosis, and the page does not pretend it is.
- The **interface and lesson scaffolding** resolve in all **15** dictionary
  languages: section headings, map captions, list conjunctions, video-scope
  labels and the video-open note. A learner reading Arabic does not get an
  Arabic concept title above an English "The core idea".
- The **teaching body itself is still authored English**. The catalogue reports
  **1 complete translated plan-language pair** (`fractions` in French), shown
  with that status. `scripts/lesson-world-check.mjs` proves the 135 × 15
  scaffolding matrix and reports the body-coverage number separately, so a
  translated button is never mistaken for a translated lesson.
- The diagram labels are numbers or chemical symbols; the caption carries the
  words, so translating a plan does not require redrawing the SVG.

## Low bandwidth and offline

- No video request, iframe, poster image or preconnect is made by the lesson.
  The learner pays for the video only if they tap the link.
- Diagrams are **inline SVG generated from the lesson data**, not downloaded
  images. They add no image request and remain sharp at any width.
- The card always includes a prose summary, so a learner who cannot open the
  video still gets the video's teaching point in text.
- The static twin (`docs/openmind.html`) embeds the same SVG renderers, the same
  learning map and the same video cards. It works from `file://`; a video link
  naturally needs a network, and the summary remains readable without one.
- The lesson does not claim a transcript it does not have. A transcript is a
  media-specific accessibility feature; for a linked video, the source's own
  caption controls apply. This is a limitation of the link-only route, not a
  feature to paper over.

## The science diagrams

A diagram is used where it makes a relationship visible that prose would only
assert. It is not decoration, and a lesson with no honest diagram gets none.

The layouts live in `lib/figures.ts`; the React renderer is
`components/question-figure.tsx`; the static twin draws the same layouts in
`docs/app.js`. The numbers a diagram claims are checked as arithmetic, not just
as pixels:

- **`particles`** draws molecules with atom counts, bonds and a reaction arrow.
  `particlesLayout` computes `balanced`, `leftAtoms` and `rightAtoms`; the
  stoichiometry lesson uses 2H₂ + O₂ → 2H₂O, and the check requires four H and
  two O on both sides. An unbalanced equation is reported as unbalanced rather
  than drawn as if it balanced.
- **`cell`** draws a plant or animal cell with numbered organelles. Plant cells
  get a wall, chloroplasts and a large vacuole; animal cells do not. The caption
  maps every number to its name, so the SVG itself needs no English label.
- **`circuit`** draws a cell, a resistor, an ammeter in the loop and a voltmeter
  across the resistor. It is implemented and laid out, but the electricity
  lesson currently keeps its existing V–I graph; the circuit is not silently
  substituted for a graph that teaches a different relationship.
- The figure itself is `aria-hidden`; the authored caption is the accessible
  description and the thing a screen reader hears.

`npm run verify:science` checks 83 claims across these three layouts, including
conservation, plant/animal differences, bounds, meter placement and the
voltmeter branch.

## The learning map every lesson carries

Every lesson renders a **learning map** generated from the genome: prerequisites
on the left, this concept in the centre, and the concepts it unlocks on the
right. It answers the question a learner asks when they are lost — "what does
this assume, and what is it for?" — without claiming to draw the science. The
map is a separate `lib/lesson-map.ts` module and a separate `LessonMap`
component; it is not a question figure and cannot reveal an answer.

The map is deliberately small: at most two prerequisites and two next concepts
are drawn. When a concept has more, the layout reports the remainder rather than
pretending the pathway ends. The five maths foundations with no recorded
prerequisite or dependant (addition, subtraction, multiplication, division,
sequences) show two **other ideas in the same subject nearby**, marked dashed
rather than connected by a false arrow. The captions say which kind of
relationship is being shown.

## Every country, without inventing a syllabus

The picker offers **251** country/territory choices. **70** have a researched
national pathway; the rest resolve to an explicitly offered international or
independent course rather than being handed another country's curriculum. The
world gate (`npm run verify:world`) checks all **251** choices resolve to at
least one offered course, across **91** specifications and **631** offered course
slots, and that no course is an empty shell. It does not claim that all 181
remaining national syllabi are mapped: they are not, and the fallback says so.

Every concept's lesson remains reachable outside a national course through the
full learning map. What a national course changes is which ideas are examined,
not whether the lesson exists.

This is the diagram that is true for all 135 lessons. The 17 **subject-specific**
diagrams (a balance, an area model, a cell, an energy profile, a parabola) are a
different claim and remain authored per concept; "every lesson has a learning
map" does not mean every lesson has a diagram of its science.

## What is still missing

This is the part that must not be hidden behind a green check.

- The catalogue has 135 plans, split between authored/pilot and supplemental
  plans. All render the teaching sequence, but only **2** plans carry a fully
  authored `sections` field (the two chemistry lessons); the rest are grouped
  from their authored idea paragraphs. Grouping is not the same as authoring a
  sequence, and the catalogue keeps that distinction.
- All 135 lessons have a **video card**, but only **5** have a verified video
  about the exact concept. The other **130** are labelled subject overviews.
  The videos are enrichment, not a curriculum.
- **17** concepts carry an authored subject-specific diagram. The other 118
  carry the learning map and prose, not a drawing of their science. "Every
  lesson has a subject diagram" is **not** true yet, and adding decorative
  drawings to outlines would not make it true.
- Caption availability is unverified; the field says so.
- The legal position for a non-commercial educational use has not been reviewed
  by counsel, and the operating entity's status is unconfirmed. That is why the
  link-only route is the one implemented.

The next content work is therefore explicit: find and verify concept-specific
videos where they exist, give each remaining science lesson a diagram only where
it carries a relationship, and check each video's caption track before changing
`unknown` to a stronger claim.

## Sources

- YouTube Terms of Service: <https://www.youtube.com/static?gl=GB&template=terms>
- YouTube embedding help: <https://support.google.com/youtube/answer/171780?hl=en>
- YouTube API Services Terms: <https://developers.google.com/youtube/terms/api-services-terms-of-service>
- YouTube region restrictions: <https://support.google.com/youtube/answer/92571?hl=en-GB>
- YouTube age-restricted content: <https://support.google.com/youtube/answer/10070779?hl=en>
- YouTube Player for Education (paid/EdTech route we do not use): <https://support.google.com/youtube/answer/18481571>
- Khan Academy linking/embedding help: <https://support.khanacademy.org/hc/en-us/articles/202262954-Can-I-use-Khan-Academy-s-videos-name-materials-links-in-my-project>
- PhET licensing: <https://phet.colorado.edu/en/licensing>
- ICO guidance on storage and access technologies: <https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/>
- W3C transcripts: <https://www.w3.org/WAI/media/av/transcripts>
- World Bank on low-bandwidth learning: <https://blogs.worldbank.org/en/jobs/how-provide-online-learning-and-skills-training-youth-low-bandwidth-areas>
- RSC on particle models: <https://edu.rsc.org/cpd/using-models/2000013.article>
- GreatFire, mainland China site availability: <https://en.greatfire.org/top-sites-china>
- vpnAlert censorship monitor (China, Iran, Russia): <https://vpnalert.com/tools/censorship-monitor/youtube>
- Human Rights Watch on Russia's VPN crackdown (September 2026): <https://www.hrw.org/news/2026/09/24/russia-crackdown-on-bypassing-online-censorship>
- Reporting on the February 2026 Russian block: <https://ru.themoscowtimes.com/2026/02/10/roskomnadzor-pereshel-kpolnoi-blokirovke-youtube-posle-polutora-let-zamedleniya-a186865>
