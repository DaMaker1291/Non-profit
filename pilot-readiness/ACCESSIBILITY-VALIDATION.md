# Accessibility and browser validation — measured, not asserted

**Status: partial.** This file records what was actually driven and measured on the
two models changed in this pass (`search-model`, `circuit-model`) and what was not.
An ARIA attribute in the source is not evidence on its own, and no check below is
recorded because the attribute exists.

## What was measured

| Check | Method | Result |
|---|---|---|
| Keyboard reaches and operates the search card | Focused "Take one look" and sent a real Enter key through the browser | The run advanced (`data-search-taken` 0 → 1) and the highlighted instruction moved from step 2 to step 3. Focus stayed on the button. |
| Keyboard reaches the circuit controls | The five controls are native buttons at least 44 px high; operated by click in this pass | Reached and operated; the earlier pass (2026-11-24) drove every one with Enter. |
| Mobile layout, search card | 390×844 viewport, measured `documentElement` widths and control heights | Page 390 / scrollWidth 390 (no sideways scroll); instruction lists stack to one 298 px column; every button and the select ≥ 44 px. |
| Mobile layout, circuit card | 390×844, same measurement | Page 390 / scrollWidth 390; drawing 306 px wide; every control 44 px. |
| Touch target, circuit disclosure | Measured the `<summary>` box at 390 px | Was 22 px — half the buttons beside it. Given a 44 px box; re-measured 44 px. |
| Text contrast, search card | Computed WCAG ratio of the highlighted instruction and the dashed cursor against their backgrounds | Highlighted text 11.5:1; dashed cursor stroke 6.31:1 (non-text needs 3:1). |
| Text contrast, circuit card | Same computation | Drawing labels 12.44:1; live readout 13.24:1. |
| Reduced motion | Counted elements in the cards with a computed `animation-name` other than `none`; inspected transitions | Zero animated elements in either card, so there is nothing for a reduced-motion preference to suppress. This is a statement about these two components, not about the whole site. |
| The drawing is not the only carrier | Read the DOM text for both models | The circuit prints its current, per-bulb p.d. and brightness as a live sentence; the search card prints both algorithms' states, the executing instruction and the item under the cursor as text. A learner who cannot see the SVG still receives the facts. |
| Layout collision inside the drawing | Compared the bounding boxes of the convention labels with the cell and bulb shapes at 390 px | First pass: the second label began 3 px above the cell's top plate and spanned x 87–304 across plates at x 152–164 — text drawn over the symbol. Moved, re-measured: 7 px clear above the cell and 7 px below the bulbs. |

## What was NOT done

These are gaps, not passes.

- **A real screen reader was not driven.** See the attempt recorded below: VoiceOver
  starts on this machine, but macOS Automation permission is denied, so its spoken
  output cannot be read back and no announcement was captured. NVDA is
  Windows-only and this host is macOS. The `aria-current="step"`, the `aria-live`
  readout and the `role="group"` labels are in the DOM; nobody heard them. This is
  the largest outstanding accessibility gap and it is not closable by reading
  source.
- **Firefox and Safari were not tested.** Only Chromium (the packaged browser) was
  used. Safari's WebDriver works on this host, but the lesson route redirects a
  signed-out session to `/onboarding`, so the gate could not be reached there
  either — see below.
- **Low-bandwidth operation was not simulated.** Neither model makes a network
  request after the page loads, and both are a few kilobytes of JSX with no images
  and no external assets — but that is a property of the source, not a measurement
  on a throttled connection.
- **Zoom and text scaling were not exercised.** The 320 px width check comes from
  `npm run verify:lesson` for the authoring plans, not from this pass.
- **Colour-vision simulation was not run.** The current instruction is marked by
  weight and a left rule as well as colour, which is the design intent; it was not
  verified with a simulator.
- **No assistive-technology testing with a learner.** Learner testing remains 0.

## The screen-reader and second-engine attempt (2026-11-25)

**VoiceOver (macOS 15.6): started; no announcement captured.**

- Launching `/System/Library/CoreServices/VoiceOver.app` from this host first
  dropped into the first-run "Splash" tutorial and exited (recorded in
  `com.apple.VoiceOverTraining`). A later launch stayed up, so the reader itself
  runs here.
- VoiceOver's AppleScript dictionary exposes `last phrase -> content`, which is the
  text it actually spoke. That was the capture channel, and it answers
  `-1743 Not authorised to send Apple events to VoiceOver`: macOS Automation
  permission for this host is denied. `vo cursor` and `caption window` block for
  the same reason.
- **No spoken text was captured and no announcement was heard.** Every ARIA claim
  on the prediction gate, the search card and the circuit card therefore remains
  unverified by a screen reader. The pass needs one manual step: System Settings →
  Privacy & Security → Automation → allow the host that runs this session to
  control VoiceOver. After that, `content of last phrase` returns the announcement
  for each keystroke, which is the check this file is waiting on.
- VoiceOver was stopped again by terminating the process this pass started.

**NVDA / Firefox:** NVDA is Windows-only and this host is macOS; Firefox is not
installed in `/Applications`. Neither was run, and neither is claimed.

**Safari (WebKit): driven, but the lesson route redirected.** `safaridriver`
answered, opened a session and loaded the app in WebKit. Requesting
`/learn/computing/algorithms-search` redirected to
`/onboarding?return=…` because the route requires a learner profile in this build,
so the gate was never rendered. **No Safari result is claimed** — the block is the
signed-out route, not the engine. Reaching it needs a profile created inside the
same WebKit session, which this pass did not do.

## What this pass changed because of a measurement

1. The convention labels in the circuit drawing were moved out of the cell symbol
   (found by comparing bounding boxes, not by looking).
2. The circuit disclosure summary was given a 44 px box (measured 22 px).
3. The search card's two instruction lists were made a single column below 640 px
   after the 390 px measurement, and the highlighted step was given a left rule and
   a weight change so it does not depend on colour alone.
