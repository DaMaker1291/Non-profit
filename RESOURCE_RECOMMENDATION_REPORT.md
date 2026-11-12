# OpenMind multilingual readiness

Generated 2026-11-12 by `npm run verify:multilingual`.

This report distinguishes interface translation from translated and reviewed teaching. It does not count an unverified link as a usable resource.


## Order

Internal text lesson → offline package (only for the authored pilot allowlist) → exact external video (only if its audio language equals the teaching language and the data preference is not text-only).

```json
{
  "englishHigher": {
    "conceptId": "percentages",
    "requestedLanguage": "en",
    "examLanguage": "en",
    "dataPreference": "high",
    "resources": [
      {
        "id": "internal:percentages",
        "kind": "internal-lesson",
        "title": "Percentages",
        "url": "/learn/maths/percentages",
        "language": "en",
        "external": false,
        "offlineAvailable": false,
        "contentType": "text-lesson",
        "provider": "OpenMind",
        "duration": null,
        "captions": null,
        "transcript": "unknown",
        "fileSizeBytes": null,
        "registrationRequired": "no",
        "regionRestricted": "no",
        "pedagogicalReview": "none",
        "linkStatus": "checked-in-this-build",
        "limitations": [
          "The lesson has not been reviewed by a subject teacher.",
          "The teaching text is in the requested language.",
          "This route needs the app to be reachable; it is not the offline pack."
        ]
      },
      {
        "id": "video:percentages",
        "kind": "external-video",
        "title": "Percent of a whole number",
        "url": "https://www.khanacademy.org/math/pre-algebra/xb4832e56:percentages/xb4832e56:equivalent-representations-of-percent-problems/v/taking-a-percentage-example",
        "language": "en",
        "external": true,
        "offlineAvailable": false,
        "contentType": "video",
        "provider": "Khan Academy",
        "duration": "2:07",
        "captions": "unknown",
        "transcript": "unknown",
        "fileSizeBytes": null,
        "registrationRequired": "unknown",
        "regionRestricted": "unknown",
        "pedagogicalReview": "none",
        "linkStatus": "not-rechecked-in-this-build",
        "limitations": [
          "The link resolved when it was authored; it has not been rechecked in this build.",
          "Transcript availability has not been verified.",
          "The file size and mobile-data cost are unknown, so none are estimated.",
          "The video is external, link-only and is not available for offline use."
        ]
      }
    ],
    "externalReason": "exact-language-match"
  },
  "englishTextOnly": {
    "conceptId": "percentages",
    "requestedLanguage": "en",
    "examLanguage": "en",
    "dataPreference": "text",
    "resources": [
      {
        "id": "internal:percentages",
        "kind": "internal-lesson",
        "title": "Percentages",
        "url": "/learn/maths/percentages",
        "language": "en",
        "external": false,
        "offlineAvailable": false,
        "contentType": "text-lesson",
        "provider": "OpenMind",
        "duration": null,
        "captions": null,
        "transcript": "unknown",
        "fileSizeBytes": null,
        "registrationRequired": "no",
        "regionRestricted": "no",
        "pedagogicalReview": "none",
        "linkStatus": "checked-in-this-build",
        "limitations": [
          "The lesson has not been reviewed by a subject teacher.",
          "The teaching text is in the requested language.",
          "This route needs the app to be reachable; it is not the offline pack."
        ]
      }
    ],
    "externalReason": "text-only-preference"
  },
  "bengaliBalanced": {
    "conceptId": "percentages",
    "requestedLanguage": "bn",
    "examLanguage": "bn",
    "dataPreference": "balanced",
    "resources": [
      {
        "id": "internal:percentages",
        "kind": "internal-lesson",
        "title": "Percentages",
        "url": "/learn/maths/percentages",
        "language": "en",
        "external": false,
        "offlineAvailable": false,
        "contentType": "text-lesson",
        "provider": "OpenMind",
        "duration": null,
        "captions": null,
        "transcript": "unknown",
        "fileSizeBytes": null,
        "registrationRequired": "no",
        "regionRestricted": "no",
        "pedagogicalReview": "none",
        "linkStatus": "checked-in-this-build",
        "limitations": [
          "The lesson has not been reviewed by a subject teacher.",
          "No complete translation exists, so this lesson is in EN.",
          "This route needs the app to be reachable; it is not the offline pack."
        ]
      }
    ],
    "externalReason": "no-language-match"
  },
  "frenchFractions": {
    "conceptId": "fractions",
    "requestedLanguage": "fr",
    "examLanguage": "fr",
    "dataPreference": "balanced",
    "resources": [
      {
        "id": "internal:fractions",
        "kind": "internal-lesson",
        "title": "Fractions",
        "url": "/learn/maths/fractions",
        "language": "fr",
        "external": false,
        "offlineAvailable": false,
        "contentType": "text-lesson",
        "provider": "OpenMind",
        "duration": null,
        "captions": null,
        "transcript": "unknown",
        "fileSizeBytes": null,
        "registrationRequired": "no",
        "regionRestricted": "no",
        "pedagogicalReview": "none",
        "linkStatus": "checked-in-this-build",
        "limitations": [
          "The lesson has not been reviewed by a subject teacher.",
          "The teaching text is in the requested language.",
          "This route needs the app to be reachable; it is not the offline pack."
        ]
      },
      {
        "id": "offline:fractions",
        "kind": "offline-pack",
        "title": "Fractions — offline lesson",
        "url": "/offline/study?concept=fractions",
        "language": "fr",
        "external": false,
        "offlineAvailable": true,
        "contentType": "lesson-package",
        "provider": "OpenMind",
        "duration": null,
        "captions": null,
        "transcript": "unknown",
        "fileSizeBytes": null,
        "registrationRequired": "no",
        "regionRestricted": "no",
        "pedagogicalReview": "none",
        "linkStatus": "checked-in-this-build",
        "limitations": [
          "The pack's teaching text is in the requested language; practice questions are currently English-authorised.",
          "The exact device storage size is not measured here."
        ]
      }
    ],
    "externalReason": "no-exact-resource"
  }
}
```

## What changed

The old `studyResourcesFor` returned Khan Academy, BBC Bitesize, YouTube and subject-provider search URLs for every concept. It could not say what the result's language, level or duration was. That function is gone. `lib/lesson-resources.ts` re-exports the exact-concept recommender, and `components/lesson-study-tools.tsx` keeps only the three in-lesson doors.

## Why a resource is absent

- `text-only-preference`: the learner chose text only.
- `no-language-match`: an exact video exists but not in the teaching language.
- `no-exact-resource`: no exact video exists for this concept.

The internal lesson is always present and is complete without the video.
