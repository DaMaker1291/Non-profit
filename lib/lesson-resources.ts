// Provider SEARCH routes used to live here. A search page is not a
// recommendation: it asks the learner to find the relevant material themselves,
// and it cannot say what language, level or duration the result will have.
//
// The exact-concept recommender is lib/exact-resources.ts. This module remains
// as a compatibility re-export so an older import cannot resurrect the search
// list; nothing in the app serves a provider search URL any more.
export {
  exactVideoResources,
  recommendResources,
  isDirectResourceUrl,
} from "./exact-resources";
export type {
  Recommendation,
  RecommendedResource,
  ResourceContext,
  ResourceKind,
} from "./exact-resources";
