import { defineGapLesson } from "./_gap-lesson";

// PHYSICS GAP BATCH 2 — light, sound and magnetism.

export const PHYSICS_LIGHT_OPTICS = defineGapLesson({
  conceptId: "light-optics",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, waves: reflection, refraction, lenses and total internal reflection",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for light and optics. The ray examples and calculations are original.",
  },
  objectives: [
    {
      statement:
        "Apply the law of reflection and explain refraction in terms of a change of wave speed.",
      evidence:
        "The learner states that the angle of incidence equals the angle of reflection and explains that light bends towards the normal when it slows down.",
    },
    {
      statement:
        "Calculate the critical angle for a water–air boundary using sin C = 1/n.",
      evidence:
        "For water with refractive index 1.33, the learner calculates a critical angle of about 48.8°.",
    },
    {
      statement:
        "Use the lens equation to find an image distance and interpret the result.",
      evidence:
        "For an object 30 cm from a converging lens of focal length 10 cm, the learner finds an image 15 cm beyond the lens.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["waves-basics", "trig-ratios"],
    check: [
      {
        id: "d1",
        question: "What is the relationship between wave speed, frequency and wavelength?",
        answer: "v = fλ; speed equals frequency times wavelength.",
        targets: ["waves-basics"],
      },
      {
        id: "d2",
        question: "What is the sine of 30°?",
        answer: "The sine of 30° is 0.5, because the opposite side is half the hypotenuse in a 30–60–90 triangle.",
        targets: ["trig-ratios"],
      },
    ],
  },
  introduction: {
    hook:
      "A straw in a glass of water looks broken at the surface. A mirror reverses left and right along the line of sight. An optical fibre keeps light inside a bend by reflecting it repeatedly. These are three behaviours of the same wave: reflection at a surface, refraction when the speed changes, and total internal reflection when the angle is large enough.",
    why:
      "Ray diagrams are often drawn as geometry without the physics. The geometry is a consequence of the wave speed changing between media. Reflection keeps the speed and changes the direction; refraction changes both the speed and the direction; total internal reflection happens when light tries to leave a denser medium at too shallow an angle. This lesson connects the rays to the speeds, then uses the lens equation to put a number on an image.",
  },
  explanation: [
    {
      heading: "Reflection keeps the speed and reverses the normal component",
      paragraphs: [
        "At a flat mirror, the angle of incidence equals the angle of reflection, both measured from the normal. The reflected ray stays in the same medium, so its speed and wavelength are unchanged; only its direction changes. A plane mirror forms a virtual image behind the mirror, the same distance behind as the object is in front, and laterally inverted.",
        "The normal is perpendicular to the surface, not the surface itself. Measuring angles from the mirror rather than the normal is a common error and gives a wrong ray diagram. For a curved mirror, the normal changes from point to point, so the law is applied locally at each point of incidence.",
      ],
    },
    {
      heading: "Refraction happens because the wave speed changes",
      paragraphs: [
        "When light enters a denser medium such as glass or water, it slows down. If it enters at an angle, the change in speed bends the ray towards the normal. Leaving the denser medium, it speeds up and bends away from the normal. The frequency stays the same across the boundary; the wavelength changes because v = fλ and the speed changes.",
        "The refractive index n compares the speed in vacuum with the speed in the medium: n = c/v. A larger n means a slower speed and a stronger bend. The model assumes a flat boundary between two uniform media and a single frequency; a curved surface or a mixture of colours would bend different rays by different amounts.",
      ],
    },
    {
      heading: "Total internal reflection and lenses",
      paragraphs: [
        "Light travelling from a denser medium towards a less dense one bends away from the normal. As the angle of incidence increases, the refracted ray approaches the boundary. At the critical angle it runs along the surface; beyond it, total internal reflection occurs and no light escapes. For water into air, sin C = 1/n = 1/1.33, so C is about 48.8°. Optical fibres use this to keep light inside a bend.",
        "A converging lens brings parallel rays to a focal point. The lens equation 1/f = 1/u + 1/v relates the focal length f, object distance u and image distance v. For u = 30 cm and f = 10 cm, 1/v = 1/10 − 1/30 = 1/15, so v = 15 cm. The magnification is v/u = 0.5, so the image is half the size of the object. The thin-lens model assumes a thin lens, rays close to the axis and no aberrations; a real lens blurs colours and distant rays.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "At the critical angle, the refracted ray runs along the boundary. The sine of the critical angle is the reciprocal of the refractive index when the second medium is air or vacuum.",
      notation: "sin C = 1/n",
      caption:
        "For water with n = 1.33, sin C = 0.752, so C ≈ 48.8°. Beyond that angle, total internal reflection replaces refraction.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The thin-lens equation relates focal length, object distance and image distance. The magnification is the ratio of image distance to object distance.",
      notation: "1/f = 1/u + 1/v; magnification = v/u",
      caption:
        "For f = 10 cm and u = 30 cm, 1/v = 1/10 − 1/30 = 1/15, so v = 15 cm and the magnification is 0.5.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Angles are measured in degrees and distances in the same length unit throughout a lens calculation. Refractive index and magnification are dimensionless.",
      notation: "C: ° · f, u, v: cm or m · n: no unit · magnification: no unit",
      caption:
        "The lens equation requires f, u and v in the same unit; the unit cancels. A magnification of 0.5 means the image is half the object's height, not 0.5 cm.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "Calculate the critical angle for light travelling from water, refractive index 1.33, into air.",
      steps: [
        {
          move: "Use sin C = 1/n.",
          why:
            "At the critical angle the refracted ray grazes the boundary, which gives this relationship between the critical angle and the refractive index.",
        },
        {
          move: "Substitute sin C = 1/1.33 = 0.752.",
          why:
            "The refractive index is dimensionless, so the sine is also dimensionless and must be between 0 and 1.",
        },
        {
          move: "Take the inverse sine: C ≈ 48.8°.",
          why:
            "The inverse sine returns the angle whose sine is 0.752. The result is measured from the normal, not from the water surface.",
        },
      ],
      answer: "The critical angle is approximately 48.8°.",
    },
    {
      id: "w2",
      prompt:
        "An object is 30 cm from a converging lens of focal length 10 cm. Find the image distance and the magnification.",
      steps: [
        {
          move: "Rearrange the lens equation to 1/v = 1/f − 1/u.",
          why:
            "The image distance is the unknown. Rearranging before substituting keeps the reciprocal relationship clear and avoids adding distances directly.",
        },
        {
          move: "Substitute 1/v = 1/10 − 1/30 = 3/30 − 1/30 = 2/30.",
          why:
            "The fractions need a common denominator. The result is 1/15, so v = 15 cm.",
        },
        {
          move: "Magnification = v/u = 15 cm / 30 cm = 0.5.",
          why:
            "The image is half the object's height. The ratio is dimensionless because the centimetres cancel.",
        },
      ],
      answer: "The image is 15 cm beyond the lens, with magnification 0.5.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Light bends because it hits the boundary at an angle, regardless of the media.",
      whyItFails:
        "A ray hitting a boundary at an angle only bends if its speed changes. If two media had the same refractive index, the ray would continue straight. The bend is caused by the speed difference, not by the angle alone.",
      correction:
        "Compare the refractive indices. Entering a higher index slows the light and bends it towards the normal; entering a lower index speeds it up and bends it away.",
      contrast: {
        wrong: "Any slanted ray bends at a boundary.",
        right: "A slanted ray bends only when the wave speed changes across the boundary.",
      },
    },
    {
      id: "m2",
      belief: "Total internal reflection can happen when light enters a denser medium.",
      whyItFails:
        "Total internal reflection requires light travelling from a denser medium towards a less dense one. Entering a denser medium, the ray bends towards the normal and cannot exceed the critical angle in the way the effect requires.",
      correction:
        "Check the direction: the light must be inside the higher-index medium heading towards the lower-index one, and the incidence angle must exceed the critical angle.",
      contrast: {
        wrong: "Light entering glass from air can be totally internally reflected at the surface.",
        right: "Light inside glass heading towards air can be totally internally reflected if the angle is large enough.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A ray hits a plane mirror at 30° to the normal. What is the angle of reflection?",
      hint: "The law of reflection measures both angles from the normal.",
      answer: "30° to the normal, on the opposite side.",
      feedback: {
        correct: "You used the normal as the reference and kept the angle equal.",
        incorrect:
          "The angle of reflection equals the angle of incidence, both measured from the normal. It is 30°, not 60°.",
      },
    },
    {
      id: "p2",
      prompt:
        "Light passes from air into glass. Does it bend towards or away from the normal?",
      hint: "Glass is denser than air, so the light slows down.",
      answer: "Towards the normal, because the light slows down.",
      feedback: {
        correct: "You linked the bend to the decrease in speed.",
        incorrect:
          "Entering a denser medium slows the light, so the ray bends towards the normal.",
      },
    },
    {
      id: "p3",
      prompt:
        "An object is 20 cm from a converging lens of focal length 10 cm. Find the image distance.",
      hint: "Use 1/f = 1/u + 1/v and take reciprocals carefully.",
      answer: "1/v = 1/10 − 1/20 = 1/20, so v = 20 cm.",
      feedback: {
        correct: "You rearranged the lens equation and found the reciprocal.",
        incorrect:
          "The equation gives 1/v = 0.1 − 0.05 = 0.05, so v = 20 cm. Do not add 10 and 20 directly.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "Calculate the critical angle for water with refractive index 1.33, giving your answer in degrees.",
      modelAnswer: "48.8°",
      marking: [
        "Uses sin C = 1/n.",
        "Takes the inverse sine of 0.752 to get about 48.8°.",
      ],
      check: { accepted: ["48.8°", "48.8", "49°", "48.8 degrees"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "An object is 30 cm from a converging lens of focal length 10 cm. Find the image distance.",
      modelAnswer: "15 cm",
      marking: [
        "Rearranges the lens equation to 1/v = 1/f − 1/u.",
        "Computes 1/10 − 1/30 = 1/15, so v = 15 cm.",
      ],
      check: { accepted: ["15 cm", "15cm", "15"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why light bends when it enters water, why total internal reflection cannot occur when light enters water from air, and what the critical angle represents.",
      modelAnswer:
        "Light slows down in water, and a change in speed at an angled boundary bends the ray towards the normal. Entering water from air, the ray is going into the denser medium and bends towards the normal, so it cannot undergo total internal reflection, which requires travel from the denser to the less dense medium. The critical angle is the incidence angle at which the refracted ray grazes the boundary; beyond it, total internal reflection occurs.",
      marking: [
        "Links the bend to the change in wave speed.",
        "States that total internal reflection requires travel from denser to less dense.",
        "Defines the critical angle as the angle where the refracted ray runs along the boundary.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "An optical fibre has a core of refractive index 1.50 surrounded by cladding of refractive index 1.45. Explain why light can be trapped in the core, calculate the critical angle at the core–cladding boundary, and explain why a smaller cladding index would make the fibre more confining.",
      whyItTransfers:
        "The lesson calculates a water–air critical angle. The fibre uses two transparent media with a small index difference, so the learner must apply the same relationship to a less familiar pair and interpret the result physically.",
      answer:
        "Light in the core can be totally internally reflected at the core–cladding boundary if it strikes at more than the critical angle. The relevant ratio is n₂/n₁ = 1.45/1.50 = 0.967, so sin C = 0.967 and C ≈ 75.2°. A smaller cladding index makes the ratio smaller, which lowers the critical angle; more rays then exceed it and are reflected, so the fibre confines light more strongly.",
      marking: [
        "Explains that light must travel from the higher-index core towards the lower-index cladding.",
        "Uses sin C = n₂/n₁ and obtains about 75°.",
        "Explains that a lower cladding index lowers the critical angle and improves confinement.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "State the law of reflection.",
      answer:
        "The angle of incidence equals the angle of reflection, both measured from the normal.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the lens equation?",
      answer: "1/f = 1/u + 1/v, with distances in the same unit.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "When does total internal reflection occur?",
      answer:
        "When light travels from a denser to a less dense medium and the angle of incidence exceeds the critical angle.",
      when: "month-later",
    },
  ],
  summary: [
    "Reflection keeps the wave speed and obeys equal angles measured from the normal.",
    "Refraction occurs because the wave speed changes; entering a denser medium bends the ray towards the normal.",
    "Total internal reflection requires a denser-to-less-dense boundary and an angle above the critical angle.",
    "The lens equation and magnification relate object distance, image distance and size.",
  ],
});

export const PHYSICS_SOUND_ACOUSTICS = defineGapLesson({
  conceptId: "sound-acoustics",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, waves: sound, echoes, frequency and resonance",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for sound waves and echoes. The echo and pipe examples are original.",
  },
  objectives: [
    {
      statement:
        "Explain that sound is a longitudinal wave that needs a medium and cannot travel through a vacuum.",
      evidence:
        "The learner explains that particles vibrate parallel to the direction of travel and that no particles means no sound.",
    },
    {
      statement:
        "Use the echo relationship to find a distance from a measured time.",
      evidence:
        "For a 0.6 s echo delay and a speed of 340 m/s, the learner divides by two and finds the wall is 102 m away.",
    },
    {
      statement:
        "Use v = fλ to relate the speed, frequency and wavelength of a sound wave.",
      evidence:
        "For a 170 Hz sound travelling at 340 m/s, the learner finds a wavelength of 2 m.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["waves-basics"],
    check: [
      {
        id: "d1",
        question: "What is the difference between a transverse and a longitudinal wave?",
        answer:
          "In a transverse wave the oscillation is perpendicular to the direction of travel; in a longitudinal wave it is parallel.",
        targets: ["waves-basics"],
      },
      {
        id: "d2",
        question: "What does wave frequency measure?",
        answer: "The number of complete oscillations per second, in hertz.",
        targets: ["waves-basics"],
      },
    ],
  },
  introduction: {
    hook:
      "A bell ringing inside a glass jar fades as the air is pumped out. The bell is still moving, but there is nothing to carry the vibration to your ear. Sound is a pressure wave in a medium, not a substance that travels on its own. In air it moves at about 340 m/s, fast enough that an echo from a wall 100 m away returns in roughly half a second.",
    why:
      "Sound is the wave topic where the medium matters most. Frequency sets pitch, amplitude sets loudness and the medium sets speed. Echoes turn the speed into a distance measurement, provided the round trip is halved. Standing waves in pipes and strings explain musical notes. This lesson connects the particle picture to the measurements so the formulas are not detached facts.",
  },
  explanation: [
    {
      heading: "Sound is a longitudinal pressure wave",
      paragraphs: [
        "A vibrating source pushes and pulls on the surrounding particles. The particles oscillate parallel to the direction the wave travels, creating regions of compression and rarefaction. The particles themselves do not travel from the source to the ear; they pass the disturbance along. That is why a sound can travel across a room without the air arriving at your ear.",
        "A medium is required because the disturbance is carried by particle interactions. In a vacuum there are no particles to compress, so sound cannot travel. Light can, which is why a spacecraft explosion would be silent to an observer in space. The model assumes a continuous medium and small pressure variations; a very low pressure or a very high intensity would need a more careful treatment.",
      ],
    },
    {
      heading: "Frequency is pitch, amplitude is loudness",
      paragraphs: [
        "The frequency of a sound is the number of oscillations per second, measured in hertz. A higher frequency is heard as a higher pitch. Human hearing spans roughly 20 Hz to 20 kHz, although the upper limit falls with age. Infrasound is below the audible range and ultrasound is above it; both are still sound waves, just outside human perception.",
        "Amplitude is the maximum displacement or pressure variation and determines loudness. Loudness is often measured on a decibel scale, which is logarithmic, so a small increase in decibels can mean a large increase in intensity. Doubling the amplitude does not double the decibel reading. The medium and temperature affect the speed; in air at room temperature, sound travels at about 340 m/s.",
      ],
    },
    {
      heading: "Echoes and standing waves",
      paragraphs: [
        "An echo is a reflection of sound. If a pulse returns after a time t, it has travelled to the reflector and back, so the distance is d = vt/2. For a 0.6 s round trip at 340 m/s, the total distance is 204 m and the wall is 102 m away. Forgetting the factor of two is the standard error and doubles the answer.",
        "In a pipe or string, waves reflect at the ends and can form a standing wave. The fundamental frequency has a node at a closed end and an antinode at an open end. For a pipe open at both ends, the fundamental wavelength is twice the pipe length, so f = v/(2L). The model assumes a uniform pipe, a known speed and negligible end corrections; real instruments have complicated shapes and the end correction shifts the note.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "For an echo, the sound travels to the reflector and back. The one-way distance is half the total distance.",
      notation: "d = vt/2",
      caption:
        "At 340 m/s with a 0.6 s round trip, the total distance is 204 m, so the reflector is 102 m away.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The wave equation relates speed, frequency and wavelength for any wave, including sound.",
      notation: "v = fλ",
      caption:
        "A 170 Hz sound at 340 m/s has wavelength 2 m. Doubling the frequency halves the wavelength if the speed is unchanged.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Speed is in metres per second, frequency in hertz, wavelength in metres and time in seconds.",
      notation: "v: m/s · f: Hz · λ: m · t: s · d: m",
      caption:
        "Hertz means per second. Multiplying hertz by metres gives metres per second, which is why the wave equation is unit-consistent.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A clap returns as an echo after 0.6 s. If sound travels at 340 m/s, how far away is the wall?",
      steps: [
        {
          move: "Use distance = speed × time for the round trip: 340 m/s × 0.6 s = 204 m.",
          why:
            "The sound travels to the wall and back in the measured time, so the total path is the speed times the time.",
        },
        {
          move: "Halve the total distance: 204 m / 2 = 102 m.",
          why:
            "The wall is at the turning point of the round trip, so the one-way distance is half the total path.",
        },
        {
          move: "The wall is 102 m away.",
          why:
            "The result is a distance, so it is in metres. The time measured was the round trip, not the one-way trip.",
        },
      ],
      answer: "The wall is 102 m away.",
    },
    {
      id: "w2",
      prompt:
        "A sound wave has frequency 170 Hz and travels at 340 m/s. Calculate its wavelength.",
      steps: [
        {
          move: "Rearrange v = fλ to λ = v/f.",
          why:
            "The wavelength is the unknown. Dividing speed by frequency isolates it.",
        },
        {
          move: "Substitute λ = 340 m/s / 170 Hz.",
          why:
            "Hertz is per second, so metres per second divided by per second leaves metres.",
        },
        {
          move: "λ = 2 m.",
          why:
            "The wavelength is the distance between successive compressions. A lower frequency would give a longer wavelength at the same speed.",
        },
      ],
      answer: "The wavelength is 2 m.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "Sound can travel through a vacuum because it is a wave.",
      whyItFails:
        "Sound is a mechanical wave carried by particle interactions. A vacuum has no particles to compress, so there is no medium to carry the disturbance. Being a wave is not enough; the wave type matters.",
      correction:
        "Ask whether the wave needs a medium. Sound and water waves do; electromagnetic waves such as light do not.",
      contrast: {
        wrong: "Sound is a wave, so it travels through space.",
        right: "Sound needs a medium; in a vacuum there is nothing to carry the vibration.",
      },
    },
    {
      id: "m2",
      belief: "An echo time can be multiplied by the speed directly to give the distance to the wall.",
      whyItFails:
        "The echo time is the round trip, so the sound has travelled twice the distance to the wall. Using the full time gives twice the correct distance.",
      correction:
        "Halve the round-trip distance or halve the time before multiplying. Write d = vt/2 and keep the factor of two visible.",
      contrast: {
        wrong: "340 × 0.6 = 204 m to the wall",
        right: "340 × 0.6 / 2 = 102 m to the wall",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "Why can't sound travel from a bell to your ear through a vacuum?",
      hint: "Think about what the sound wave needs in order to pass energy along.",
      answer:
        "Sound is carried by particle vibrations, and a vacuum has no particles to vibrate.",
      feedback: {
        correct: "You linked the medium requirement to the particle picture.",
        incorrect:
          "A vacuum has no particles, so there is no medium to carry the compressions and rarefactions of a sound wave.",
      },
    },
    {
      id: "p2",
      prompt:
        "An echo returns after 0.4 s. If sound travels at 340 m/s, how far away is the reflector?",
      hint: "The sound makes a round trip, so divide the total distance by two.",
      answer: "340 × 0.4 / 2 = 68 m.",
      feedback: {
        correct: "You halved the round-trip distance.",
        incorrect:
          "The total path is 136 m, so the reflector is 68 m away. Forgetting to halve gives double the distance.",
      },
    },
    {
      id: "p3",
      prompt:
        "A sound has frequency 500 Hz and wavelength 0.68 m. What is its speed?",
      hint: "Rearrange the wave equation so speed is frequency multiplied by wavelength, then substitute the two values.",
      answer: "v = 500 Hz × 0.68 m = 340 m/s.",
      feedback: {
        correct: "You used v = fλ and kept the units.",
        incorrect:
          "The speed is 500 × 0.68 = 340 m/s. Dividing would give a wavelength or a period, not a speed.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "An echo returns after 0.6 s. If sound travels at 340 m/s, how far away is the wall?",
      modelAnswer: "102 m",
      marking: [
        "Calculates the round-trip distance as 204 m.",
        "Halves it to get 102 m.",
      ],
      check: { accepted: ["102 m", "102m", "102"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A 170 Hz sound travels at 340 m/s. What is its wavelength?",
      modelAnswer: "2 m",
      marking: [
        "Rearranges v = fλ to λ = v/f.",
        "Divides 340 by 170 to get 2 m.",
      ],
      check: { accepted: ["2 m", "2m", "2"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain why sound cannot travel through a vacuum, how an echo can be used to measure a distance, and why the measured time must be halved.",
      modelAnswer:
        "Sound is a longitudinal wave carried by particle vibrations, so it needs a medium; a vacuum has no particles. An echo is a reflection, and the time measured is for the sound to travel to the reflector and back. The one-way distance is therefore the speed times half the time, d = vt/2.",
      marking: [
        "Explains that sound requires a medium of particles.",
        "Describes the echo as a reflected sound wave.",
        "Uses the round-trip reasoning to justify halving the time.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A pipe open at both ends is 0.5 m long. The speed of sound in the pipe is 340 m/s. Find the fundamental frequency and explain why the pipe produces a note even though the air is not being blown across a string. State an assumption.",
      whyItTransfers:
        "The lesson uses echo timing and the wave equation. The pipe introduces a standing wave with a boundary condition, so the learner must connect wavelength to pipe length before using v = fλ.",
      answer:
        "For a pipe open at both ends, the fundamental standing wave has an antinode at each open end and one node in the middle, so the pipe length is half a wavelength. Thus λ = 2L = 1.0 m. Then f = v/λ = 340/1.0 = 340 Hz. The air column resonates because reflections at the open ends reinforce certain frequencies. The calculation assumes the speed is 340 m/s throughout, the pipe is uniform, and end corrections are negligible.",
      marking: [
        "Relates the fundamental wavelength to twice the pipe length.",
        "Uses v = fλ to get 340 Hz.",
        "Explains resonance and states an assumption about the pipe or speed.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "Why does sound need a medium?",
      answer:
        "It is carried by particle vibrations, so without particles there is nothing to pass the disturbance along.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What does the frequency of a sound determine?",
      answer: "Its pitch; a higher frequency is heard as a higher note.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "How do you calculate the distance to a reflector from an echo time?",
      answer: "Use d = vt/2, because the sound travels there and back.",
      when: "month-later",
    },
  ],
  summary: [
    "Sound is a longitudinal pressure wave and needs a medium.",
    "Frequency determines pitch, amplitude determines loudness, and the medium determines speed.",
    "An echo is a reflection; the one-way distance is half the round-trip distance.",
    "Standing waves in pipes and strings explain musical notes through resonance.",
  ],
});

export const PHYSICS_MAGNETISM = defineGapLesson({
  conceptId: "magnetism",
  subject: "physics",
  curriculum: {
    reference: "GCSE Physics, electromagnetism: magnetic fields, electromagnets and the motor effect",
    level: "Key Stage 4",
    note:
      "Scope cites the published GCSE physics subject content for magnetism and the motor effect. The wire calculations are original.",
  },
  objectives: [
    {
      statement:
        "Describe magnetic poles and field lines and explain how a compass aligns with a field.",
      evidence:
        "The learner states that field lines leave north and enter south, and that like poles repel while unlike poles attract.",
    },
    {
      statement:
        "Calculate the force on a current-carrying wire in a magnetic field using F = BIL.",
      evidence:
        "For B = 0.5 T, I = 2 A and L = 0.3 m, the learner calculates 0.3 N.",
    },
    {
      statement:
        "Explain how a current creates a magnetic field and how a motor uses the force on a coil.",
      evidence:
        "The learner describes the field around a straight wire and the pair of forces that turns a coil in a motor.",
    },
  ],
  priorKnowledge: {
    conceptIds: ["forces-basics"],
    check: [
      {
        id: "d1",
        question: "What happens when two north poles are brought together?",
        answer: "They repel; like poles repel and unlike poles attract.",
        targets: ["forces-basics"],
      },
      {
        id: "d2",
        question: "What is a force measured in?",
        answer: "Force is measured in newtons, where one newton is the force needed to accelerate one kilogram at one metre per second squared.",
        targets: ["forces-basics"],
      },
    ],
  },
  introduction: {
    hook:
      "A compass needle turns to line up with the Earth's field. A wire carrying a current deflects the needle, showing that the current has made its own field. Put the wire between two magnets and the field pushes it sideways. That push is the motor effect, and it is the same interaction that lets a loudspeaker move and a relay switch.",
    why:
      "Magnetism is often taught as a list of facts about poles. The unifying idea is that moving charge creates a magnetic field, and a magnetic field exerts a force on moving charge. Field lines are a map of the force a north pole would feel. The motor effect is the cross-over between electricity and motion, and F = BIL quantifies it when the wire is perpendicular to the field.",
  },
  explanation: [
    {
      heading: "Poles and field lines",
      paragraphs: [
        "A magnet has a north pole and a south pole. Like poles repel and unlike poles attract. The force acts at a distance through a magnetic field, which can be represented by field lines. Lines leave a north pole and enter a south pole; the closer the lines, the stronger the field. A compass needle is a small magnet that aligns with the local field.",
        "The Earth's magnetic field is not exactly aligned with the geographic axis, which is why magnetic north and true north differ. A field line is a model, not a physical object; it shows the direction a north pole would be pushed at that point. The model assumes a static field and a small test pole that does not disturb it.",
      ],
    },
    {
      heading: "Current creates a magnetic field",
      paragraphs: [
        "A straight wire carrying a current produces a magnetic field in concentric circles around it. Reversing the current reverses the field direction. Coiling the wire concentrates the field inside the coil, making an electromagnet. An iron core strengthens it because the core becomes magnetised and adds its own field.",
        "The strength of an electromagnet increases with the current, the number of turns and the permeability of the core. It can be switched off, which is why electromagnets are used in relays, cranes and door locks. The model assumes the coil is tightly wound and the core is not saturated; beyond a certain current, adding more turns or current gives diminishing returns.",
      ],
    },
    {
      heading: "The motor effect and F = BIL",
      paragraphs: [
        "A current-carrying wire in a magnetic field experiences a force when the wire is not parallel to the field. The force is perpendicular to both the current and the field. Its magnitude is F = BIL when the wire is perpendicular to the field, where B is the flux density in tesla, I is the current in amperes and L is the length in metres.",
        "For B = 0.5 T, I = 2 A and L = 0.3 m, F = 0.5 × 2 × 0.3 = 0.3 N. If the wire is at an angle, only the perpendicular component of the field contributes, so the full formula overstates the force. A motor uses a coil: the current flows in opposite directions on the two sides, so the forces are opposite and produce a turning effect. A commutator reverses the current every half turn to keep the coil rotating.",
      ],
    },
  ],
  representations: [
    {
      id: "r1",
      kind: "physics.equation",
      body:
        "The force on a straight wire perpendicular to a uniform magnetic field is the product of flux density, current and length.",
      notation: "F = BIL",
      caption:
        "For B = 0.5 T, I = 2 A and L = 0.3 m, the force is 0.3 N. The force is perpendicular to both the wire and the field.",
    },
    {
      id: "r2",
      kind: "physics.equation",
      body:
        "The force can be rearranged to find the current needed for a given force in a known field and length.",
      notation: "I = F/(BL)",
      caption:
        "A force of 0.6 N in a 0.4 T field over 0.5 m needs I = 0.6/(0.4 × 0.5) = 3 A.",
    },
    {
      id: "r3",
      kind: "physics.units",
      body:
        "Flux density is measured in tesla, current in amperes and length in metres. The product gives newtons.",
      notation: "B: T · I: A · L: m · F: N",
      caption:
        "One tesla is one newton per ampere metre. A tesla is a large unit; a strong permanent magnet may have a field of about 1 T.",
    },
  ],
  workedExamples: [
    {
      id: "w1",
      prompt:
        "A 0.3 m wire carrying 2 A sits perpendicular to a uniform magnetic field of flux density 0.5 T. Calculate the force on the wire.",
      steps: [
        {
          move: "Use F = BIL.",
          why:
            "The wire is perpendicular to the field, so the full formula applies without a sine factor.",
        },
        {
          move: "Substitute F = 0.5 T × 2 A × 0.3 m.",
          why:
            "The tesla, ampere and metre units combine to give newtons. The length is the part of the wire inside the field.",
        },
        {
          move: "F = 0.3 N.",
          why:
            "The force is perpendicular to both the current and the field. Its direction is given by Fleming's left-hand rule.",
        },
      ],
      answer: "The force is 0.3 N.",
    },
    {
      id: "w2",
      prompt:
        "A wire of length 0.5 m in a 0.4 T field experiences a force of 0.6 N. Calculate the current.",
      steps: [
        {
          move: "Rearrange F = BIL to I = F/(BL).",
          why:
            "The current is the unknown, so the equation is rearranged before substituting.",
        },
        {
          move: "Substitute I = 0.6 N / (0.4 T × 0.5 m).",
          why:
            "The denominator is the force per ampere for this wire and field. Dividing the total force by it gives the current.",
        },
        {
          move: "I = 0.6 / 0.2 = 3 A.",
          why:
            "The result is in amperes. The wire must be perpendicular to the field for this value to apply.",
        },
      ],
      answer: "The current is 3 A.",
    },
  ],
  misconceptions: [
    {
      id: "m1",
      belief: "A magnetic field exerts a force on any wire, whether or not it carries a current.",
      whyItFails:
        "The motor effect requires moving charge. A wire with no current has no net movement of charge, so the magnetic force on it is zero. A permanent magnet can attract iron, but that is a different effect involving alignment of domains.",
      correction:
        "Check for a current. The F = BIL force acts on a current-carrying wire; a stationary charge or an unpowered wire does not experience this force in the same way.",
      contrast: {
        wrong: "Any wire in a magnetic field is pushed.",
        right: "A current-carrying wire perpendicular to the field is pushed.",
      },
    },
    {
      id: "m2",
      belief: "Magnetic field lines can cross, and the force is strongest where lines are farthest apart.",
      whyItFails:
        "Field lines never cross, because a compass at a crossing point would have two directions at once. The field is strongest where the lines are closest together, not farthest apart. The spacing represents strength.",
      correction:
        "Draw field lines so they do not cross and crowd them where the field is strong. Near a pole, the lines are dense; far away, they spread out.",
      contrast: {
        wrong: "Lines crossing means a stronger field.",
        right: "Crowded lines mean a stronger field; lines never cross.",
      },
    },
  ],
  guidedPractice: [
    {
      id: "p1",
      prompt:
        "A 0.2 m wire carries 3 A perpendicular to a 0.4 T field. Calculate the force.",
      hint: "Multiply flux density, current and length.",
      answer: "F = 0.4 × 3 × 0.2 = 0.24 N.",
      feedback: {
        correct: "You applied F = BIL with the perpendicular length.",
        incorrect:
          "The force is 0.4 × 3 × 0.2 = 0.24 N. Adding the values would not give a force.",
      },
    },
    {
      id: "p2",
      prompt: "What happens to the force if the current is doubled?",
      hint: "Look at the relationship between F and I in F = BIL.",
      answer: "The force doubles, because F is directly proportional to I.",
      feedback: {
        correct: "You used the direct proportionality in the formula.",
        incorrect:
          "F = BIL is linear in I, so doubling the current doubles the force if B and L stay the same.",
      },
    },
    {
      id: "p3",
      prompt:
        "Why does a current-carrying coil rotate in a magnetic field?",
      hint: "The two sides of the coil carry current in opposite directions.",
      answer:
        "The forces on the two sides are opposite, creating a turning effect; a commutator reverses the current to keep it turning.",
      feedback: {
        correct: "You identified the couple and the role of the commutator.",
        incorrect:
          "The opposite sides experience opposite forces, which produces rotation. The commutator reverses the current every half turn so the rotation continues.",
      },
    },
  ],
  assessment: [
    {
      id: "a1",
      kind: "short-answer",
      prompt:
        "A 0.3 m wire carries 2 A perpendicular to a 0.5 T field. Calculate the force.",
      modelAnswer: "0.3 N",
      marking: [
        "Uses F = BIL.",
        "Multiplies 0.5, 2 and 0.3 to get 0.3 N.",
      ],
      check: { accepted: ["0.3 N", "0.3N", "0.3"] },
    },
    {
      id: "a2",
      kind: "short-answer",
      prompt:
        "A 0.5 m wire in a 0.4 T field experiences 0.6 N. Calculate the current.",
      modelAnswer: "3 A",
      marking: [
        "Rearranges F = BIL to I = F/(BL).",
        "Divides 0.6 by 0.2 to get 3 A.",
      ],
      check: { accepted: ["3 A", "3A", "3"] },
    },
    {
      id: "a3",
      kind: "constructed-response",
      prompt:
        "Explain how a current produces a magnetic field, how an electromagnet can be made stronger, and why a motor needs a commutator.",
      modelAnswer:
        "A current is moving charge, and moving charge produces a magnetic field around it; a coil concentrates the field. An electromagnet is strengthened by increasing the current, adding turns or using a magnetic core. In a motor, the forces on opposite sides of the coil are opposite, producing rotation; the commutator reverses the current every half turn so the forces continue to turn the coil in the same direction.",
      marking: [
        "Links current to moving charge and a magnetic field.",
        "Names current, turns or core as ways to strengthen an electromagnet.",
        "Explains the commutator's role in maintaining rotation.",
      ],
    },
  ],
  transfer: [
    {
      id: "t1",
      prompt:
        "A loudspeaker has a coil in a permanent magnetic field. Explain how an alternating current makes the cone vibrate, and calculate the force on a 0.02 m length of coil carrying 1.5 A in a 0.8 T field. State an assumption.",
      whyItTransfers:
        "The lesson applies F = BIL to a straight wire and a motor. The loudspeaker uses the same force on a coil, but the current alternates, so the learner must connect the changing force direction to sound production.",
      answer:
        "The alternating current reverses direction, so the force on the coil reverses, making the cone move back and forth and producing sound waves. F = BIL = 0.8 × 1.5 × 0.02 = 0.024 N. The calculation assumes the coil is perpendicular to the field, the field is uniform over the coil, and the current is at its stated value at that instant.",
      marking: [
        "Explains that the alternating current reverses the force direction.",
        "Calculates 0.024 N using F = BIL.",
        "States an assumption about the field or coil orientation.",
      ],
    },
  ],
  retrieval: [
    {
      id: "x1",
      prompt: "Which poles attract and which repel?",
      answer: "Unlike poles attract; like poles repel.",
      when: "next-day",
    },
    {
      id: "x2",
      prompt: "What is the motor effect?",
      answer:
        "A current-carrying wire in a magnetic field experiences a force perpendicular to both the current and the field.",
      when: "week-later",
    },
    {
      id: "x3",
      prompt: "What does the commutator do in a motor?",
      answer:
        "It reverses the current every half turn so the coil continues to rotate in the same direction.",
      when: "month-later",
    },
  ],
  summary: [
    "Magnetic field lines leave north and enter south, and crowd where the field is strong.",
    "A current creates a magnetic field; a coil and core make an electromagnet.",
    "A current-carrying wire perpendicular to a field experiences F = BIL.",
    "A motor uses opposite forces on the sides of a coil, with a commutator to maintain rotation.",
  ],
});
