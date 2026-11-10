import type { AuthoredLesson } from "../../lesson-contract";

// A WAVE IS A WAY OF MOVING ENERGY WITHOUT MOVING THE STUFF.
//
// `waves-basics` is the last critical stage-1 physics gap. The genome's summary
// is a list of properties; the lesson has to make the central idea visible
// before the vocabulary: the rope's particles oscillate around a resting
// position while the disturbance travels along it. Once that separation is
// clear, amplitude, wavelength, frequency and speed are four measurements of
// one moving pattern rather than four definitions to memorise.
export const PHYSICS_WAVES: AuthoredLesson = {
  contract: "openmind.lesson/1.0",
  conceptId: "waves-basics",
  version: "1.0.0",
  subject: "physics",
  curriculum: {
    reference:
      "GCSE Physics, waves: transverse and longitudinal waves, amplitude, wavelength, frequency and wave speed",
    level: "Key Stage 3 to GCSE",
    note:
      "Scope cited against the published subject content. All explanations, examples and questions are original; no specification text or examination question is reproduced.",
  },
  declaredStatus: "draft",

  objectives: [
    {
      statement:
        "Distinguish a transverse wave from a longitudinal wave by the direction of the oscillation relative to the direction the wave travels.",
      evidence:
        "The learner says that in a transverse wave the oscillation is perpendicular to the travel direction, as on a rope or for light, while in a longitudinal wave the oscillation is parallel to it, as for sound, and identifies the compressions and rarefactions in the longitudinal case.",
    },
    {
      statement:
        "Read amplitude, wavelength and frequency from a wave description, and calculate wave speed using frequency times wavelength.",
      evidence:
        "For a wave with frequency 4.0 Hz and wavelength 0.75 m, the learner calculates 3.0 m/s, and for a wave that completes 12 oscillations in 6 s, the learner states a frequency of 2 Hz and a period of 0.5 s.",
    },
    {
      statement:
        "Explain why the speed of a wave is set by the medium while the frequency is set by the source, and why changing frequency changes wavelength rather than speed in the same medium.",
      evidence:
        "The learner says a sound wave's speed in air is fixed by the air, so a higher-frequency note must have a shorter wavelength, and uses the relationship to show that doubling the frequency halves the wavelength when the speed is unchanged.",
    },
  ],

  priorKnowledge: {
    conceptIds: [],
    check: [
      {
        id: "d1",
        question:
          "A child shakes one end of a rope up and down once. Describe what travels along the rope and what happens to the rope itself.",
        answer:
          "A pulse of disturbance travels along the rope, carrying energy, while each part of the rope moves up and down about its resting position rather than travelling along with the pulse.",
        targets: ["waves-basics"],
      },
      {
        id: "d2",
        question:
          "A car travels 120 m in 4 s. What is its speed, and what does the number mean?",
        answer:
          "The speed is 30 m/s, which means the car covers 30 m every second if its speed is steady.",
        targets: ["waves-basics"],
      },
    ],
  },

  introduction: {
    hook:
      "A stadium crowd does a wave: each person stands up and sits down, but nobody walks around the stadium. The wave travels around the stands while the people stay roughly where they were. A rope shaken at one end does the same thing: the disturbance moves along the rope, but the rope's particles oscillate around their resting positions.",
    why:
      "That separation is the idea the rest of the topic depends on. A wave transfers energy from one place to another without a net transfer of matter. Once a learner can see the oscillation and the travel as two different things, amplitude, wavelength and frequency stop being a list of definitions: they are measurements of the same moving pattern, and the wave equation connects them.",
  },

  explanation: [
    {
      heading: "The oscillation and the travel are two different motions",
      paragraphs: [
        "In a wave, particles oscillate around a resting position while the disturbance moves through the material. The particles do not travel along with the wave; they pass the disturbance on to their neighbours. A rope's particles move up and down, while the wave moves sideways along the rope. A sound wave's particles oscillate back and forth, while the compression moves through the air.",
        "This is why a wave can carry energy through a medium without carrying the medium away. The energy arrives at the far end, but the same particles are still there. A floating leaf on a water wave bobs up and down rather than being carried all the way to the shore, which is the everyday version of the same distinction.",
      ],
    },
    {
      heading: "Transverse and longitudinal describe the direction of oscillation",
      paragraphs: [
        "A transverse wave oscillates perpendicular to the direction of travel. Light is transverse, and so is a wave on a rope: the rope moves up and down while the wave moves along it. A longitudinal wave oscillates parallel to the direction of travel. Sound is longitudinal: the air particles move back and forth along the same line as the wave, creating regions of compression and rarefaction.",
        "The labels describe the geometry, not the medium. Water surface waves are mostly transverse, sound in air is longitudinal, and an earthquake produces both kinds at once. A learner who labels a wave by what it travels through, rather than by the direction of its oscillation, will misclassify the same wave when it changes medium.",
      ],
    },
    {
      heading: "Amplitude, wavelength and frequency measure different features",
      paragraphs: [
        "Amplitude is the maximum displacement from the resting position. It is a distance, measured in metres, and it carries the energy: a larger amplitude means more energy is transferred, which is why a louder sound or a brighter light has a larger amplitude. Wavelength is the distance between two consecutive corresponding points on the wave, such as two crests, measured in metres. Frequency is the number of complete oscillations each second, measured in hertz.",
        "Frequency and period are reciprocals: a wave with a frequency of 4 Hz has a period of one quarter of a second. The source sets the frequency. A loudspeaker driven at 170 Hz produces 170 compressions each second in the air, whatever the air is doing. The medium sets the speed. Those two facts together decide the wavelength, because the wave must fit one complete oscillation into the distance it travels during one period.",
      ],
    },
    {
      heading: "The wave equation is a consistency check, not a fourth definition",
      paragraphs: [
        "Wave speed is frequency times wavelength. The units confirm the relationship: hertz is oscillations per second, wavelength is metres per oscillation, and the product is metres per second. The equation does not say that increasing frequency always increases speed. In the same medium, the speed is a property of the medium, so a higher frequency produces a shorter wavelength.",
        "The model assumes the medium is uniform and the wave is travelling through it at a steady speed. Near a boundary, or in a medium whose properties change, the speed can change and the wave can refract. Those are extensions of the same relationship, not exceptions to it, and a good answer says which assumption is being made.",
      ],
    },
  ],

  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "Wave speed is the distance one complete oscillation travels each second. Frequency counts the oscillations and wavelength measures the distance of one, so their product is the speed.",
      notation: "wave speed = frequency × wavelength",
      caption:
        "A wave with frequency 4.0 Hz and wavelength 0.75 m travels 4.0 × 0.75 = 3.0 m/s. The unit is metres per second because hertz is per second and wavelength is metres.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The period is the time for one complete oscillation. It is the reciprocal of frequency, so a higher frequency means a shorter period.",
      notation: "period = 1 / frequency",
      caption:
        "A frequency of 2 Hz means two oscillations each second, so one oscillation takes 0.5 s. A frequency of 10 Hz has a period of 0.1 s.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Each wave quantity has its own unit, and the units are how you check that the wave equation has been used correctly. A bare number cannot tell you whether it is a frequency, a wavelength or a speed.",
      notation:
        "frequency: Hz · period: s · wavelength: m · amplitude: m · wave speed: m/s",
      caption:
        "Hertz means per second. Multiplying hertz by metres gives metres per second. If the unit is not a speed, the frequency and wavelength have not been multiplied in the right order.",
    },
    {
      id: "r4",
      kind: "physics.model",
      body:
        "The same wave can be described by its pattern in space or its pattern in time. Wavelength is the spatial repeat; period is the temporal repeat; speed connects the two.",
      notation:
        "transverse: oscillation perpendicular to travel\nlongitudinal: oscillation parallel to travel\none wavelength per period → speed = wavelength / period",
      caption:
        "A wave that repeats every 1.5 m and completes one oscillation every 0.5 s travels 1.5 m in 0.5 s, which is 3.0 m/s. The two descriptions are two views of the same motion.",
    },
  ],

  workedExamples: [
    {
      id: "w1",
      prompt:
        "A rope wave has a wavelength of 1.5 m. Twelve complete waves pass a fixed point in 6.0 s. Calculate the frequency, the period and the wave speed.",
      steps: [
        {
          move:
            "Frequency = number of oscillations / time = 12 / 6.0 s = 2.0 Hz.",
          why:
            "Frequency counts complete oscillations each second, so twelve oscillations in six seconds is two each second.",
        },
        {
          move:
            "Period = 1 / frequency = 1 / 2.0 Hz = 0.5 s.",
          why:
            "The period is the time for one complete oscillation, and it is the reciprocal of the frequency.",
        },
        {
          move:
            "Wave speed = frequency × wavelength = 2.0 Hz × 1.5 m = 3.0 m/s.",
          why:
            "Each second the wave completes two oscillations, and each oscillation occupies 1.5 m, so the disturbance advances 3.0 m each second.",
        },
      ],
      answer:
        "The frequency is 2.0 Hz, the period is 0.5 s and the wave speed is 3.0 m/s.",
    },
    {
      id: "w2",
      prompt:
        "A sound wave in air has a frequency of 170 Hz and a wavelength of 2.0 m. Calculate its speed and the time it takes to travel 680 m.",
      steps: [
        {
          move:
            "Wave speed = frequency × wavelength = 170 Hz × 2.0 m = 340 m/s.",
          why:
            "Multiplying the number of oscillations each second by the length of one oscillation gives the distance travelled each second.",
        },
        {
          move:
            "Time = distance / speed = 680 m / 340 m/s = 2.0 s.",
          why:
            "The sound travels 340 m each second, so 680 m takes two seconds at that steady speed.",
        },
      ],
      answer:
        "The sound speed is 340 m/s and the travel time is 2.0 s.",
    },
  ],

  misconceptions: [
    {
      id: "m1",
      belief: "A louder sound must have a higher frequency than a quieter sound.",
      whyItFails:
        "Loudness and pitch are separate measurements. Amplitude controls how much energy the wave carries and therefore how loud it sounds, while frequency controls how many oscillations occur each second and therefore the pitch. A loud low note and a quiet high note can have either property without the other, so loudness cannot be used to infer frequency.",
      correction:
        "Read loudness from amplitude and pitch from frequency. They are independent features of the same wave, and changing one does not require changing the other.",
      contrast: {
        wrong: "the sound is louder, so its frequency must have increased",
        right: "the amplitude increased, so the sound is louder while the pitch stays the same",
      },
    },
    {
      id: "m2",
      belief: "A wave carries the material of the medium along with it.",
      whyItFails:
        "The particles of the medium oscillate around their resting positions and pass the disturbance to their neighbours; they do not travel with the wave. A floating leaf bobs as a water wave passes but is not carried all the way across the pond. What moves forward is the disturbance and the energy it carries, not the matter.",
      correction:
        "Separate the oscillation from the travel. The particles oscillate locally while the wave pattern and its energy move through the medium.",
      contrast: {
        wrong: "the wave carries the water across the pond",
        right: "the wave carries energy across the pond while the water oscillates in place",
      },
    },
    {
      id: "m3",
      belief: "Increasing a wave's frequency always increases its speed.",
      whyItFails:
        "In a given uniform medium, the wave speed is set by the medium, not by the source. The source sets the frequency. If the frequency rises while the speed stays the same, the wavelength must shorten, because the wave still has to fit one oscillation into the distance it travels during one period.",
      correction:
        "Use the wave equation as a relationship among three quantities. In the same medium, changing frequency changes wavelength; it does not change the speed.",
      contrast: {
        wrong: "the frequency doubled, so the wave must travel twice as fast",
        right: "the frequency doubled and the speed stayed the same, so the wavelength halved",
      },
    },
  ],

  guidedPractice: [
    {
      id: "g1",
      prompt:
        "A wave completes 20 oscillations in 5.0 s and has a wavelength of 0.50 m. Calculate its frequency, period and speed.",
      hint:
        "Divide the number of oscillations by the time for frequency. The period is the reciprocal of frequency, and speed is frequency times wavelength.",
      answer:
        "Frequency = 20 / 5.0 s = 4.0 Hz. Period = 1 / 4.0 Hz = 0.25 s. Speed = 4.0 Hz × 0.50 m = 2.0 m/s.",
      feedback: {
        correct:
          "You kept the three quantities separate: frequency from the count, period as its reciprocal, and speed from frequency times wavelength.",
        incorrect:
          "A common slip is to divide wavelength by frequency. The wave equation multiplies them, because hertz is per second and wavelength is metres per oscillation.",
      },
    },
    {
      id: "g2",
      prompt:
        "Light travels at 3.0 × 10⁸ m/s in a vacuum and has a frequency of 6.0 × 10¹⁴ Hz. Calculate its wavelength.",
      hint:
        "Rearrange the wave equation to make wavelength the subject, then divide the speed by the frequency.",
      answer:
        "Wavelength = speed / frequency = 3.0 × 10⁸ m/s / 6.0 × 10¹⁴ Hz = 5.0 × 10⁻⁷ m, or 500 nm.",
      feedback: {
        correct:
          "You rearranged the equation before substituting, and the powers of ten give a wavelength of 5.0 × 10⁻⁷ m, which is 500 nanometres.",
        incorrect:
          "If you multiplied the speed by the frequency, the units would not cancel to metres. The equation must be rearranged to wavelength = speed / frequency first.",
      },
    },
    {
      id: "g3",
      prompt:
        "A sound wave passes from air into water, where it travels faster. State what happens to its frequency and its wavelength, and explain why.",
      hint:
        "The source sets the frequency at the boundary; the medium sets the speed. Use the wave equation to see what must adjust.",
      answer:
        "The frequency stays the same because it is set by the source. The speed increases in water, so the wavelength must increase, because speed = frequency × wavelength and the frequency is unchanged.",
      feedback: {
        correct:
          "You kept the source's frequency fixed and let the medium change the speed, so the wavelength adjusted to keep the equation true.",
        incorrect:
          "The frequency does not change at a boundary; the wave is still driven by the same source. It is the speed and wavelength that change when the medium changes.",
      },
    },
  ],

  assessment: [
    {
      id: "a1",
      kind: "constructed-response",
      prompt:
        "A loudspeaker produces a sound wave in air. Describe the motion of the air particles, explain why the sound can travel to a listener but the air does not travel with it, and state what happens to the pitch and loudness if the amplitude is increased while the frequency is unchanged.",
      modelAnswer:
        "The loudspeaker makes the air particles oscillate back and forth along the direction the sound travels, producing compressions and rarefactions. The particles pass the disturbance to their neighbours but do not travel all the way to the listener; the wave transfers energy while the air stays in place. Increasing the amplitude makes the oscillations larger, so the sound is louder, while the unchanged frequency keeps the pitch the same.",
      marking: [
        "Describes the air particles oscillating along the direction of travel and names compressions and rarefactions.",
        "Distinguishes the travelling disturbance and energy from the local oscillation of the air.",
        "States that a larger amplitude makes the sound louder while an unchanged frequency keeps the pitch the same.",
      ],
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A wave has a frequency of 4.0 Hz and a wavelength of 0.75 m. Calculate its speed, stating the unit.",
      modelAnswer: "3.0 m/s",
      marking: [
        "Uses wave speed = frequency × wavelength rather than dividing the two quantities.",
        "Substitutes 4.0 Hz and 0.75 m and gives 3.0 m/s with the unit.",
      ],
      check: {
        accepted: ["3.0 m/s", "3 m/s", "3.0m/s", "3m/s"],
      },
    },
    {
      id: "a3",
      kind: "short-answer",
      prompt:
        "Explain why a sound wave cannot travel through a vacuum, while a light wave can.",
      modelAnswer:
        "Sound is a mechanical wave: it needs particles to oscillate and pass the disturbance on, and a vacuum has no particles. Light is an electromagnetic wave and does not need a medium, so it can travel through a vacuum.",
      marking: [
        "Identifies sound as a mechanical wave that needs a medium.",
        "Identifies light as an electromagnetic wave that does not need a medium.",
      ],
    },
  ],

  transfer: [
    {
      id: "t1",
      prompt:
        "An earthquake produces both longitudinal P waves and transverse S waves. A seismometer records the P wave arriving before the S wave. Explain how the wave equation and the different speeds in rock help a scientist use the time gap to estimate the distance to the earthquake.",
      whyItTransfers:
        "The lesson used a rope and a sound wave in air. Here the same wave quantities are applied to two wave types travelling through the same rock at different speeds, and the learner must use the time difference rather than a single travel time.",
      answer:
        "Both waves leave the earthquake together, but the P wave travels faster through rock, so it arrives first. The time gap between the arrivals grows with distance because the faster wave gains more time on the slower one over a longer journey. If the speeds are known, the gap gives the travel time, and distance = speed × time; the scientist can also compare the two arrival times to estimate the distance without knowing the exact start time. The wave equation is used for each wave's speed, while the gap between them carries the distance information.",
      marking: [
        "Identifies the P wave as faster and explains why it arrives first.",
        "Uses the time gap as evidence of distance rather than treating the gap as a speed.",
        "Applies distance = speed × time, or compares the two arrival times, with the different wave speeds in the same medium.",
      ],
    },
  ],

  retrieval: [
    {
      id: "x1",
      prompt:
        "State what frequency measures and what unit it is measured in.",
      answer:
        "Frequency is the number of complete oscillations each second, measured in hertz.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt:
        "A wave has a frequency of 50 Hz and a wavelength of 4.0 m. Calculate its speed.",
      answer:
        "Wave speed = 50 Hz × 4.0 m = 200 m/s.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt:
        "Explain why a sound wave cannot travel through space, while light from the Sun can reach Earth.",
      answer:
        "Sound needs a medium because it is a mechanical oscillation of particles, and space is effectively a vacuum. Light is an electromagnetic wave and does not need a medium, so it can cross the vacuum.",
      when: "month-later",
    },
  ],

  summary: [
    "A wave transfers energy through a medium while the particles oscillate around their resting positions rather than travelling with the wave.",
    "Transverse waves oscillate perpendicular to the direction of travel; longitudinal waves oscillate parallel to it.",
    "Amplitude measures the maximum displacement and carries the wave's energy; wavelength is the distance between corresponding points; frequency is the number of oscillations each second.",
    "Wave speed = frequency × wavelength. In the same medium the speed is set by the medium, so a higher frequency means a shorter wavelength.",
  ],

  accessibility: [
    {
      need: "screen-reader",
      alternative:
        "Every wave is described in words as a sequence of oscillations, with the direction of oscillation and the direction of travel stated separately; no meaning depends on seeing a diagram.",
    },
    {
      need: "colour-vision",
      alternative:
        "Transverse and longitudinal waves are named and described by their geometry, not by colour; the compression and rarefaction regions are labelled in text.",
    },
    {
      need: "dyslexia",
      alternative:
        "Each calculation follows the same pattern: write the relationship, rearrange if needed, substitute with units, then state the answer with its unit.",
    },
    {
      need: "motor",
      alternative:
        "All assessment answers are typed; no wave diagram has to be drawn, dragged or resized to complete the lesson.",
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
        "All explanations, examples, practice items and assessments in this lesson are original to OpenMind.",
    },
    {
      sourceId: "gcse-physics-subject-content",
      basis: "curriculum-citation",
      licence: "official-reference",
      attribution:
        "Scope cited against the published GCSE physics subject content for waves.",
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
