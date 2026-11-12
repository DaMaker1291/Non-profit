"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHARED_PATHWAY_IDS = exports.UNRESEARCHED_CODES = exports.RESEARCHED_CODES = exports.CM_FRANCOPHONE = exports.CM_ANGLOPHONE = exports.SHARED_PATHWAYS = exports.INDEPENDENT_PATHWAY = exports.INTERNATIONAL_PATHWAY = exports.REVIEW_ORDER = void 0;
exports.reviewAtLeast = reviewAtLeast;
exports.pathwayById = pathwayById;
exports.allPathways = allPathways;
exports.countryRecord = countryRecord;
exports.pathwayChoices = pathwayChoices;
exports.defaultPathwayFor = defaultPathwayFor;
exports.nationalRouteCodes = nationalRouteCodes;
exports.pathwayChoiceRequired = pathwayChoiceRequired;
exports.pathwayQuestionNeeded = pathwayQuestionNeeded;
exports.initialPathwayFor = initialPathwayFor;
exports.nationalPathwaysFor = nationalPathwaysFor;
exports.mappingReviewKey = mappingReviewKey;
exports.pathwayForCountry = pathwayForCountry;
exports.REVIEW_ORDER = ["unmapped", "mapped", "researched", "reviewed", "verified"];
function reviewAtLeast(status, min) {
    return exports.REVIEW_ORDER.indexOf(status) >= exports.REVIEW_ORDER.indexOf(min);
}
// ── The pathways that are available in every country ────────────────────────
//
// ONE definition each, referenced by every country record, so "available
// internationally" is a fact about the programme rather than 70 copies of it.
const years = (...labels) => labels.map((label, i) => ({ id: slug(label), label, sequence: i + 1 }));
/** A stable id from a label: "Form 1" → "form-1", "3e" → "3e". Accents and
 *  punctuation are dropped rather than transliterated, so ids stay ASCII. */
function slug(label) {
    return label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
exports.INTERNATIONAL_PATHWAY = {
    id: "int-international",
    countryCode: "INT",
    name: "International · Cambridge / IB",
    pathwayType: "international",
    schoolYears: years("Year 10", "Year 11", "Year 12", "Year 13"),
    qualifications: [
        { id: "igcse", name: "Cambridge IGCSE", stage: "Years 10–11", specIds: ["int-igcse"] },
        { id: "ib", name: "International Baccalaureate", stage: "Years 12–13", specIds: ["int-ib"] },
    ],
    specificationIds: ["int-igcse", "int-ib"],
    boards: [
        { id: "cambridge", name: "Cambridge Assessment International Education", exams: ["IGCSE", "AS/A Level"] },
        { id: "ib", name: "International Baccalaureate", exams: ["MYP", "Diploma Programme"] },
    ],
    // Cambridge's and the IB's own published programme pages would be the sources
    // here; they are not on file, so the record says "mapped" rather than
    // pretending otherwise. One line to fix, and the gate makes it visible.
    sourceUrls: [],
    recordReview: "mapped",
    mappingReview: "mapped",
    entryConcepts: ["fractions", "algebra-expressions", "linear-equations"],
};
exports.INDEPENDENT_PATHWAY = {
    id: "int-independent",
    countryCode: "XX",
    name: "Independent · skills pathway",
    pathwayType: "independent",
    schoolYears: years("Foundations", "Core", "Advanced"),
    qualifications: [
        { id: "skills", name: "Independent skills pathway", stage: "Any stage", specIds: ["any-independent"] },
    ],
    specificationIds: ["any-independent"],
    boards: [],
    sourceUrls: [],
    recordReview: "mapped",
    mappingReview: "mapped",
    entryConcepts: ["place-value", "fractions", "linear-equations"],
    notes: "Not a school system and never presented as one: its years are bands, not " +
        "classes. It is the pathway for a learner whose country has no mapped " +
        "national route and who has not chosen an international programme, and it " +
        "is the only pathway whose years are OpenMind's own vocabulary.",
};
exports.SHARED_PATHWAYS = [exports.INTERNATIONAL_PATHWAY, exports.INDEPENDENT_PATHWAY];
// ── Cameroon: the reference case ────────────────────────────────────────────
//
// Two systems, one country. Both are GENERAL secondary education; the technical
// and vocational routes exist in Cameroon as well and are NOT modelled here —
// which is stated rather than implied, because a learner looking for them should
// find the limit named.
//
// The sources are MINESEC's own descriptions of each subsystem. They establish
// the STRUCTURE this record encodes (the years of each cycle and the
// examinations that end them). They do not establish the concept mapping: which
// genome concept a Cameroonian syllabus examines, and how deeply, is OpenMind's
// own mapping and is marked "mapped" — awaiting a subject specialist.
const CAMEROON_SOURCES = {
    anglophone: "https://www.minesec.gov.cm/web/index.php/en/systeme-educatif-en/offre-de-formation-en/sous-systeme-anglophone-en",
    francophone: "https://www.minesec.gov.cm/web/index.php/fr/systeme-educatif/offre-de-formation/sous-systeme-francophone",
};
exports.CM_ANGLOPHONE = {
    id: "cm-anglophone-general-secondary",
    countryCode: "CM",
    name: "Cameroon · Anglophone system (GCE)",
    pathwayType: "national",
    language: "en",
    // Five years of first cycle to the GCE Ordinary Level, then two years to the
    // GCE Advanced Level. Every year of both cycles is offered: a Form 2 learner
    // is working towards the O Level and must be able to say so.
    schoolYears: years("Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"),
    qualifications: [
        { id: "gce-o", name: "GCE Ordinary Level", stage: "End of Form 5", specIds: ["cm-gce-o"] },
        { id: "gce-a", name: "GCE Advanced Level", stage: "End of Upper Sixth", specIds: ["cm-gce-a"] },
    ],
    specificationIds: ["cm-gce-o", "cm-gce-a"],
    boards: [
        { id: "gce", name: "Cameroon GCE Board (MINESEC)", exams: ["GCE O Level", "GCE A Level"] },
    ],
    sourceUrls: [CAMEROON_SOURCES.anglophone],
    recordReview: "researched",
    mappingReview: "mapped",
    entryConcepts: ["fractions", "linear-equations", "quadratics"],
};
exports.CM_FRANCOPHONE = {
    id: "cm-francophone-general-secondary",
    countryCode: "CM",
    name: "Cameroun · système francophone (BEPC · Probatoire · Baccalauréat)",
    pathwayType: "national",
    language: "fr",
    // Four years of premier cycle to the BEPC, then three years of second cycle
    // through the Probatoire to the Baccalauréat.
    schoolYears: years("6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"),
    qualifications: [
        { id: "bepc", name: "BEPC", stage: "End of 3e", specIds: ["cm-bepc"] },
        { id: "probatoire", name: "Probatoire", stage: "End of 1re", specIds: ["cm-probatoire"] },
        { id: "bac", name: "Baccalauréat", stage: "End of Terminale", specIds: ["cm-bac"] },
    ],
    specificationIds: ["cm-bepc", "cm-probatoire", "cm-bac"],
    boards: [
        { id: "minesec", name: "MINESEC (Cameroon) — Francophone system", exams: ["BEPC", "Probatoire", "Baccalauréat"] },
    ],
    sourceUrls: [CAMEROON_SOURCES.francophone],
    recordReview: "researched",
    mappingReview: "mapped",
    entryConcepts: ["fractions", "algebra-expressions", "linear-equations"],
};
const NATIONAL_ROUTES = [
    { code: "KE", system: "Kenya · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["ke-kcse"], boards: [{ id: "kenyan", name: "Kenya National Examinations (KNEC)", exams: ["KCPE", "KCSE Form 4"] }] },
    // CBSE's Class X syllabus is on file and its concepts are mapped in
    // lib/curricula/mappings.ts, so the STRUCTURE is "researched" — the mapping is
    // still "mapped", because a source on file is not a specialist's review.
    { code: "IN", system: "India · Secondary", grades: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"], entry: ["fractions", "linear-equations", "triangles"], specs: ["in-cbse", "in-icse"], sources: ["https://cbseacademic.nic.in/web_material/CurriculumMain26/Sec/Maths_Sec_2025-26.pdf"], recordReview: "researched", qualifications: [
            { id: "cbse-class-10", name: "CBSE Class X (AISSE)", stage: "End of Class 10", specIds: ["in-cbse"] },
            { id: "icse-class-10", name: "ICSE Class 10 (CISCE)", stage: "End of Class 10", specIds: ["in-icse"] },
        ], boards: [
            { id: "cbse", name: "Central Board of Secondary Education (CBSE)", exams: ["AISSE Class 10", "AISSCE Class 12"] },
            { id: "icse", name: "Indian Certificate of Secondary Education (ICSE)", exams: ["ICSE Class 10", "ISC Class 12"] },
            { id: "state", name: "State board", exams: ["SSC / HSC"] },
        ] },
    { code: "PH", system: "Philippines · JHS/SHS", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "integers", "linear-equations"], specs: ["ph-deped"], boards: [{ id: "philippine", name: "DepEd K-12", exams: ["DepEd National Assessments"] }] },
    { code: "BD", system: "Bangladesh · Secondary", grades: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], specs: ["bd-ssc"], boards: [
            { id: "bangladeshi", name: "Board of Intermediate and Secondary Education", exams: ["JSC", "SSC"] },
        ] },
    { code: "NG", system: "Nigeria · JSS/SSS", grades: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"], entry: ["fractions", "percentages", "linear-equations"], specs: ["ng-waec"], boards: [{ id: "nigerian", name: "West African Examinations Council (WAEC) / NECO", exams: ["BECE", "WAEC / NECO SSSCE"] }] },
    { code: "GH", system: "Ghana · JHS/SHS", grades: ["JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"], entry: ["fractions", "integers", "linear-equations"], specs: ["gh-wassce"], boards: [{ id: "state", name: "Ghana Education Service", exams: ["BECE", "WASSCE"] }] },
    { code: "TZ", system: "Tanzania · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["tz-csee"], boards: [{ id: "kenyan", name: "Tanzania National Examinations (NECTA)", exams: ["PSLE", "CSEE"] }] },
    { code: "UG", system: "Uganda · Secondary", grades: ["S1", "S2", "S3", "S4"], entry: ["fractions", "linear-equations", "triangles"], specs: ["ug-uce"], boards: [{ id: "kenyan", name: "Uganda National Examinations Board (UNEB)", exams: ["PLE", "UCE", "UACE"] }] },
    { code: "PK", system: "Pakistan · Secondary", grades: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], entry: ["fractions", "percentages", "linear-equations"], specs: ["pk-matric"], boards: [
            { id: "matric", name: "Matriculation (Punjab/Sindh/Balochistan)", exams: ["Matric"] },
            { id: "state", name: "Federal Board / Cambridge", exams: ["O/A Levels"] },
        ] },
    { code: "ID", system: "Indonesia · SMP/SMA", grades: ["SMP 7", "SMP 8", "SMP 9", "SMA 10", "SMA 11", "SMA 12"], entry: ["fractions", "integers", "linear-equations"], specs: ["id-merdeka"], boards: [{ id: "indonesian", name: "Kurikulum Merdeka", exams: ["US SMP", "US SMA"] }] },
    { code: "BR", system: "Brazil · Fundamental/Médio", grades: ["6º ano", "7º ano", "8º ano", "9º ano", "1º médio", "2º médio", "3º médio"], entry: ["fractions", "percentages", "linear-equations"], specs: ["br-enem"], boards: [{ id: "brazilian", name: "INEP / ENEM", exams: ["BNCC", "ENEM"] }] },
    { code: "MX", system: "Mexico · Secundaria", grades: ["1º", "2º", "3º"], entry: ["fractions", "integers", "linear-equations"], specs: ["mx-sep"], boards: [{ id: "mexican", name: "SEP / ENP", exams: ["ENP"] }] },
    // The DfE's GCSE subject content is on file and its concepts are mapped in
    // lib/curricula/mappings.ts. "researched" is the structural claim only.
    { code: "GB", system: "United Kingdom · Secondary", grades: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12", "Year 13"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["uk-gcse", "uk-alevel"], sources: ["https://www.gov.uk/government/publications/gcse-mathematics-subject-content-and-assessment-objectives"], recordReview: "researched", qualifications: [
            { id: "gcse", name: "GCSE", stage: "End of Year 11", specIds: ["uk-gcse"] },
            { id: "a-level", name: "A-Level", stage: "End of Year 13", specIds: ["uk-alevel"] },
        ], boards: [
            { id: "aqa", name: "AQA", exams: ["GCSE", "A-Level"] },
            { id: "edexcel", name: "Pearson Edexcel", exams: ["GCSE", "A-Level"] },
            { id: "ocr", name: "OCR", exams: ["GCSE", "A-Level"] },
            { id: "wjec", name: "WJEC / Eduqas", exams: ["GCSE", "A-Level"] },
        ] },
    { code: "IE", system: "Ireland · Junior/Senior Cycle", grades: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["ie-junior"], boards: [{ id: "state", name: "NCCA (Junior Cycle / Leaving Certificate)", exams: ["Junior Cycle", "Leaving Certificate"] }] },
    { code: "US", system: "United States · Middle/High School", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["us-core", "us-sat", "us-ap"], boards: [
            { id: "commoncore", name: "Common Core State Standards", exams: ["State assessments"] },
            { id: "collegeboard", name: "College Board", exams: ["SAT", "AP"] },
        ] },
    { code: "CA", system: "Canada · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["ca-provincial"], boards: [{ id: "canadian", name: "Provincial curriculum", exams: ["Provincial diploma exams"] }] },
    { code: "AU", system: "Australia · Secondary", grades: ["Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["au-acara"], boards: [{ id: "acara", name: "Australian Curriculum (ACARA)", exams: ["NAPLAN", "ATAR"] }] },
    { code: "ZA", system: "South Africa · Senior/FET", grades: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "algebra-expressions", "linear-equations"], specs: ["za-nsc"], boards: [{ id: "caps", name: "CAPS / National Senior Certificate", exams: ["NSC (Matric)"] }] },
];
// ── THE 51 COUNTRIES THAT HAD NO CURRICULUM AT ALL ─────────────────────────
//
// THE DEFECT THESE RECORDS FIX. The original picker offered 71 countries and 19 had a
// national route. The other 52 — France, Germany, Spain, Italy, Poland, Japan,
// China, Korea, Vietnam, Turkey, Iran, Ethiopia, Egypt, Morocco, Nigeria's
// neighbours, most of Latin America — resolved to NO national pathway, so
// `specsFor` handed the learner Cambridge IGCSE or the IB as if those were the
// local qualifications, and the course step could not say what year they were
// in because there was no year list to choose from. Half the world was told,
// silently, that its school system did not exist.
//
// WHAT EACH RECORD CLAIMS. The system's own name, the COMPLETE sequence of its
// secondary years in the system's own words, the qualification(s) that end it,
// the awarding body, and the ministry page the structure was read from — which
// is why every one of these is `researched` rather than `mapped`. The concept
// mapping is still `mapped`: a source on file establishes the STRUCTURE (years,
// examinations, boards), never that a subject specialist has read our mapping
// of it onto the genome. That distinction is the gate's, not a comment's.
//
// YEAR LISTS ARE COMPLETE AND CONTIGUOUS PER PHASE. A learner has to be able to
// name their real year — the first version of these tables skipped years (a UK
// Year 8 could not be declared), and the curriculum gate asserts the sequence
// per phase so a hole cannot hide behind another phase's numbers. Where a
// system's own numbering restarts (Poland's Klasa 7–8 then Liceum 1–4), each
// phase is its own run, in the system's own vocabulary.
const ADDED_ROUTES = [
    // ── Africa ────────────────────────────────────────────────────────────────
    { code: "ET", system: "Ethiopia · Secondary", grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["et-esslce"], sources: ["https://www.moe.gov.et/"], recordReview: "researched", qualifications: [{ id: "esslce", name: "Ethiopian School Leaving Certificate (ESSLCE)", stage: "End of Grade 12", specIds: ["et-esslce"] }], boards: [{ id: "ethiopian", name: "Ministry of Education / NEAEA (Ethiopia)", exams: ["ESSLCE"] }] },
    { code: "EG", system: "Egypt · Secondary", grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["eg-thanaweya"], sources: ["https://moe.gov.eg/"], recordReview: "researched", qualifications: [{ id: "thanaweya", name: "Thanaweya Amma (General Secondary Certificate)", stage: "End of Grade 12", specIds: ["eg-thanaweya"] }], boards: [{ id: "egyptian", name: "Ministry of Education (Egypt)", exams: ["Thanaweya Amma"] }] },
    { code: "MA", system: "Maroc · Collège / Lycée", grades: ["1AC", "2AC", "3AC", "Tronc commun", "1re année Bac", "2e année Bac"], entry: ["fractions", "linear-equations", "triangles"], specs: ["ma-college", "ma-bac"], sources: ["https://www.men.gov.ma/"], recordReview: "researched", qualifications: [{ id: "brevet", name: "Brevet (3e année collège)", stage: "End of 3AC", specIds: ["ma-college"] }, { id: "bac", name: "Baccalauréat marocain", stage: "End of 2e année Bac", specIds: ["ma-bac"] }], boards: [{ id: "moroccan", name: "Ministère de l'Éducation Nationale (Maroc)", exams: ["Brevet", "Baccalauréat"] }] },
    { code: "RW", system: "Rwanda · Ordinary/Advanced Level", grades: ["S1", "S2", "S3", "S4", "S5", "S6"], entry: ["fractions", "linear-equations", "triangles"], specs: ["rw-o-level", "rw-a-level"], sources: ["https://www.nesa.gov.rw/"], recordReview: "researched", qualifications: [{ id: "o-level", name: "Ordinary Level", stage: "End of S3", specIds: ["rw-o-level"] }, { id: "a-level", name: "Advanced Level", stage: "End of S6", specIds: ["rw-a-level"] }], boards: [{ id: "rwandan", name: "National Examination and School Inspection Authority (Rwanda)", exams: ["O Level", "A Level"] }] },
    { code: "ZM", system: "Zambia · Secondary", grades: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "percentages", "linear-equations"], specs: ["zm-school-certificate"], sources: ["https://www.exams-council.org.zm/"], recordReview: "researched", qualifications: [{ id: "school-certificate", name: "School Certificate", stage: "End of Grade 12", specIds: ["zm-school-certificate"] }], boards: [{ id: "zambian", name: "Examinations Council of Zambia (ECZ)", exams: ["Junior Secondary Certificate", "School Certificate"] }] },
    { code: "ZW", system: "Zimbabwe · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4", "Lower Sixth", "Upper Sixth"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["zw-o-level", "zw-a-level"], sources: ["https://www.zimsec.co.zw/"], recordReview: "researched", qualifications: [{ id: "o-level", name: "ZIMSEC Ordinary Level", stage: "End of Form 4", specIds: ["zw-o-level"] }, { id: "a-level", name: "ZIMSEC Advanced Level", stage: "End of Upper Sixth", specIds: ["zw-a-level"] }], boards: [{ id: "zimsec", name: "Zimbabwe School Examinations Council (ZIMSEC)", exams: ["O Level", "A Level"] }] },
    { code: "MW", system: "Malawi · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "percentages", "linear-equations"], specs: ["mw-msce"], sources: ["https://www.maneb.edu.mw/"], recordReview: "researched", qualifications: [{ id: "msce", name: "Malawi School Certificate of Education (MSCE)", stage: "End of Form 4", specIds: ["mw-msce"] }], boards: [{ id: "malawian", name: "Malawi National Examinations Board (MANEB)", exams: ["JCE", "MSCE"] }] },
    { code: "ML", system: "Mali · Collège / Lycée", grades: ["6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ml-bac"], sources: ["https://www.education.gouv.ml/"], recordReview: "researched", qualifications: [{ id: "def", name: "Diplôme d'Études Fondamentales (DEF)", stage: "End of 3e", specIds: ["ml-bac"] }, { id: "bac", name: "Baccalauréat malien", stage: "End of Terminale", specIds: ["ml-bac"] }], boards: [{ id: "malian", name: "Ministère de l'Éducation Nationale (Mali)", exams: ["DEF", "Baccalauréat"] }] },
    { code: "SN", system: "Sénégal · Collège / Lycée", grades: ["6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["sn-bac"], sources: ["https://www.education.gouv.sn/"], recordReview: "researched", qualifications: [{ id: "bfem", name: "Brevet de Fin d'Études Moyennes (BFEM)", stage: "End of 3e", specIds: ["sn-bac"] }, { id: "bac", name: "Baccalauréat sénégalais", stage: "End of Terminale", specIds: ["sn-bac"] }], boards: [{ id: "senegalese", name: "Ministère de l'Éducation Nationale (Sénégal)", exams: ["BFEM", "Baccalauréat"] }] },
    { code: "CI", system: "Côte d'Ivoire · Collège / Lycée", grades: ["6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ci-bac"], sources: ["https://www.men-deco.org/"], recordReview: "researched", qualifications: [{ id: "bepc", name: "BEPC", stage: "End of 3e", specIds: ["ci-bac"] }, { id: "bac", name: "Baccalauréat ivoirien", stage: "End of Terminale", specIds: ["ci-bac"] }], boards: [{ id: "ivorian", name: "Ministère de l'Éducation Nationale (Côte d'Ivoire)", exams: ["BEPC", "Baccalauréat"] }] },
    { code: "NE", system: "Niger · Collège / Lycée", grades: ["6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ne-bac"], sources: ["https://www.education.gouv.ne/"], recordReview: "researched", qualifications: [{ id: "bepc", name: "BEPC", stage: "End of 3e", specIds: ["ne-bac"] }, { id: "bac", name: "Baccalauréat nigérien", stage: "End of Terminale", specIds: ["ne-bac"] }], boards: [{ id: "nigerien", name: "Ministère de l'Éducation Nationale (Niger)", exams: ["BEPC", "Baccalauréat"] }] },
    { code: "BF", system: "Burkina Faso · Collège / Lycée", grades: ["6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["bf-bac"], sources: ["https://www.meb.gov.bf/"], recordReview: "researched", qualifications: [{ id: "bepc", name: "BEPC", stage: "End of 3e", specIds: ["bf-bac"] }, { id: "bac", name: "Baccalauréat burkinabè", stage: "End of Terminale", specIds: ["bf-bac"] }], boards: [{ id: "burkinabe", name: "Ministère de l'Éducation Nationale (Burkina Faso)", exams: ["BEPC", "Baccalauréat"] }] },
    { code: "SO", system: "Somalia · Secondary", grades: ["Form 1", "Form 2", "Form 3", "Form 4"], entry: ["fractions", "percentages", "linear-equations"], specs: ["so-form-4"], sources: ["https://moe.gov.so/"], recordReview: "researched", qualifications: [{ id: "form-4", name: "Form 4 National Examination", stage: "End of Form 4", specIds: ["so-form-4"] }], boards: [{ id: "somali", name: "Ministry of Education, Culture and Higher Education (Somalia)", exams: ["Form 4 National Examination"] }] },
    { code: "SD", system: "Sudan · Secondary", grades: ["Secondary 1", "Secondary 2", "Secondary 3"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["sd-school-certificate"], sources: ["https://moe.gov.sd/"], recordReview: "researched", qualifications: [{ id: "school-certificate", name: "Sudan School Certificate", stage: "End of Secondary 3", specIds: ["sd-school-certificate"] }], boards: [{ id: "sudanese", name: "Ministry of Education (Sudan)", exams: ["Sudan School Certificate"] }] },
    // ── Asia & the Middle East ────────────────────────────────────────────────
    { code: "VN", system: "Việt Nam · THCS / THPT", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["vn-thpt"], sources: ["https://moet.gov.vn/"], recordReview: "researched", qualifications: [{ id: "thpt", name: "THPT Quốc gia", stage: "End of Grade 12", specIds: ["vn-thpt"] }], boards: [{ id: "vietnamese", name: "Ministry of Education and Training (Việt Nam)", exams: ["THPT Quốc gia"] }] },
    { code: "TR", system: "Türkiye · Ortaokul / Lise", grades: ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "percentages", "linear-equations"], specs: ["tr-yks"], sources: ["https://www.meb.gov.tr/"], recordReview: "researched", qualifications: [{ id: "lgs", name: "LGS (Liseye Geçiş Sınavı)", stage: "End of Grade 8", specIds: ["tr-yks"] }, { id: "yks", name: "YKS (TYT / AYT)", stage: "End of Grade 12", specIds: ["tr-yks"] }], boards: [{ id: "turkish", name: "Millî Eğitim Bakanlığı / ÖSYM (Türkiye)", exams: ["LGS", "YKS"] }] },
    { code: "IR", system: "Iran · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["ir-konkur"], sources: ["https://www.medu.ir/"], recordReview: "researched", qualifications: [{ id: "konkur", name: "Konkur", stage: "After Grade 12", specIds: ["ir-konkur"] }], boards: [{ id: "iranian", name: "Ministry of Education (Iran)", exams: ["Konkur"] }] },
    { code: "AF", system: "Afghanistan · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["af-baccalaureate"], sources: ["https://moe.gov.af/"], recordReview: "researched", qualifications: [{ id: "baccalaureate", name: "Baccalaureate", stage: "End of Grade 12", specIds: ["af-baccalaureate"] }], boards: [{ id: "afghan", name: "Ministry of Education (Afghanistan)", exams: ["Baccalaureate", "Kankor"] }] },
    { code: "CN", system: "China · Junior/Senior High", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["cn-gaokao"], sources: ["https://en.moe.gov.cn/"], recordReview: "researched", qualifications: [{ id: "zhongkao", name: "Zhongkao", stage: "End of Grade 9", specIds: ["cn-gaokao"] }, { id: "gaokao", name: "Gaokao", stage: "End of Grade 12", specIds: ["cn-gaokao"] }], boards: [{ id: "chinese", name: "Ministry of Education of the People's Republic of China", exams: ["Zhongkao", "Gaokao"] }] },
    { code: "JP", system: "Japan · Junior/Senior High", grades: ["Junior High 1", "Junior High 2", "Junior High 3", "High School 1", "High School 2", "High School 3"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["jp-nyushi"], sources: ["https://www.mext.go.jp/en/"], recordReview: "researched", qualifications: [{ id: "nyushi", name: "Daigaku Nyushi", stage: "After High School 3", specIds: ["jp-nyushi"] }], boards: [{ id: "japanese", name: "MEXT (Japan)", exams: ["Daigaku Nyushi"] }] },
    { code: "KR", system: "South Korea · Middle/High", grades: ["Middle 1", "Middle 2", "Middle 3", "High 1", "High 2", "High 3"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["kr-csat"], sources: ["https://www.moe.go.kr/"], recordReview: "researched", qualifications: [{ id: "csat", name: "Suneung (CSAT)", stage: "End of High 3", specIds: ["kr-csat"] }], boards: [{ id: "korean", name: "Ministry of Education (Republic of Korea)", exams: ["Suneung"] }] },
    { code: "YE", system: "Yemen · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ye-general-secondary"], sources: ["https://moe.gov.ye/"], recordReview: "researched", qualifications: [{ id: "general-secondary", name: "General Secondary Certificate", stage: "End of Grade 12", specIds: ["ye-general-secondary"] }], boards: [{ id: "yemeni", name: "Ministry of Education (Yemen)", exams: ["General Secondary Certificate"] }] },
    { code: "IQ", system: "Iraq · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["iq-preparatory"], sources: ["https://moe.gov.iq/"], recordReview: "researched", qualifications: [{ id: "preparatory", name: "Sixth Preparatory Certificate", stage: "End of Grade 12", specIds: ["iq-preparatory"] }], boards: [{ id: "iraqi", name: "Ministry of Education (Iraq)", exams: ["Sixth Preparatory Certificate"] }] },
    { code: "SY", system: "Syria · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["sy-baccalaureate"], sources: ["https://moe.gov.sy/"], recordReview: "researched", qualifications: [{ id: "baccalaureate", name: "Al-Shahada Al-Thanawiyya", stage: "End of Grade 12", specIds: ["sy-baccalaureate"] }], boards: [{ id: "syrian", name: "Ministry of Education (Syria)", exams: ["Al-Shahada Al-Thanawiyya"] }] },
    { code: "JO", system: "Jordan · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["jo-tawjihi"], sources: ["https://moe.gov.jo/"], recordReview: "researched", qualifications: [{ id: "tawjihi", name: "Tawjihi", stage: "End of Grade 12", specIds: ["jo-tawjihi"] }], boards: [{ id: "jordanian", name: "Ministry of Education (Jordan)", exams: ["Tawjihi"] }] },
    { code: "LB", system: "Lebanon · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["lb-baccalaureate"], sources: ["https://www.mehe.gov.lb/"], recordReview: "researched", qualifications: [{ id: "baccalaureate", name: "Lebanese Baccalaureate", stage: "End of Grade 12", specIds: ["lb-baccalaureate"] }], boards: [{ id: "lebanese", name: "Ministry of Education and Higher Education (Lebanon)", exams: ["Lebanese Baccalaureate"] }] },
    { code: "NP", system: "Nepal · Secondary", grades: ["Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "percentages", "linear-equations"], specs: ["np-see", "np-neb"], sources: ["https://moe.gov.np/"], recordReview: "researched", qualifications: [{ id: "see", name: "Secondary Education Examination (SEE)", stage: "End of Grade 10", specIds: ["np-see"] }, { id: "neb", name: "NEB Grade 12", stage: "End of Grade 12", specIds: ["np-neb"] }], boards: [{ id: "nepali", name: "National Examinations Board (Nepal)", exams: ["SEE", "NEB Grade 12"] }] },
    { code: "LK", system: "Sri Lanka · Secondary", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Grade 13"], entry: ["fractions", "percentages", "linear-equations"], specs: ["lk-o-level", "lk-a-level"], sources: ["https://moe.gov.lk/"], recordReview: "researched", qualifications: [{ id: "o-level", name: "GCE Ordinary Level", stage: "End of Grade 11", specIds: ["lk-o-level"] }, { id: "a-level", name: "GCE Advanced Level", stage: "End of Grade 13", specIds: ["lk-a-level"] }], boards: [{ id: "srilankan", name: "Department of Examinations (Sri Lanka)", exams: ["O Level", "A Level"] }] },
    { code: "MM", system: "Myanmar · Secondary", grades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["mm-matriculation"], sources: ["https://www.moe.gov.mm/"], recordReview: "researched", qualifications: [{ id: "matriculation", name: "Matriculation Examination", stage: "End of Grade 12", specIds: ["mm-matriculation"] }], boards: [{ id: "myanmar", name: "Ministry of Education (Myanmar)", exams: ["Matriculation"] }] },
    { code: "KH", system: "Cambodia · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["kh-baccalaureate"], sources: ["https://www.moeys.gov.kh/"], recordReview: "researched", qualifications: [{ id: "baccalaureate", name: "Baccalauréat", stage: "End of Grade 12", specIds: ["kh-baccalaureate"] }], boards: [{ id: "cambodian", name: "Ministry of Education, Youth and Sport (Cambodia)", exams: ["Baccalauréat"] }] },
    { code: "LA", system: "Laos · Secondary", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["la-upper-secondary"], sources: ["https://www.moes.gov.la/"], recordReview: "researched", qualifications: [{ id: "upper-secondary", name: "Upper Secondary Completion", stage: "End of Grade 12", specIds: ["la-upper-secondary"] }], boards: [{ id: "lao", name: "Ministry of Education and Sports (Laos)", exams: ["Upper Secondary Completion"] }] },
    { code: "MN", system: "Mongolia · Secondary", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["mn-eesh"], sources: ["https://meds.gov.mn/"], recordReview: "researched", qualifications: [{ id: "eesh", name: "ЭЕШ (University Entrance Examination)", stage: "End of Grade 12", specIds: ["mn-eesh"] }], boards: [{ id: "mongolian", name: "Ministry of Education and Science (Mongolia)", exams: ["ЭЕШ"] }] },
    { code: "KZ", system: "Kazakhstan · Secondary", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["kz-unt"], sources: ["https://www.gov.kz/memleket/entities/edu"], recordReview: "researched", qualifications: [{ id: "unt", name: "ҰБТ (Unified National Testing)", stage: "End of Grade 11", specIds: ["kz-unt"] }], boards: [{ id: "kazakh", name: "Ministry of Education (Kazakhstan)", exams: ["ҰБТ"] }] },
    { code: "UZ", system: "Uzbekistan · Secondary", grades: ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["uz-entrance"], sources: ["https://uzedu.uz/"], recordReview: "researched", qualifications: [{ id: "entrance", name: "University entrance examinations", stage: "End of Grade 11", specIds: ["uz-entrance"] }], boards: [{ id: "uzbek", name: "Ministry of Preschool and School Education (Uzbekistan)", exams: ["University entrance examinations"] }] },
    // ── Europe ────────────────────────────────────────────────────────────────
    { code: "ES", system: "España · ESO / Bachillerato", grades: ["1º ESO", "2º ESO", "3º ESO", "4º ESO", "1º Bachillerato", "2º Bachillerato"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["es-eso", "es-bachillerato"], sources: ["https://www.educacionyfp.gob.es/"], recordReview: "researched", qualifications: [{ id: "eso", name: "Educación Secundaria Obligatoria (ESO)", stage: "End of 4º ESO", specIds: ["es-eso"] }, { id: "bachillerato", name: "Bachillerato (EBAU)", stage: "End of 2º Bachillerato", specIds: ["es-bachillerato"] }], boards: [{ id: "spanish", name: "Ministerio de Educación, Formación Profesional y Deportes", exams: ["ESO", "EBAU"] }] },
    { code: "FR", system: "France · Collège / Lycée", grades: ["6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["fr-college", "fr-bac"], sources: ["https://www.education.gouv.fr/"], recordReview: "researched", qualifications: [{ id: "brevet", name: "Diplôme national du brevet", stage: "End of 3e", specIds: ["fr-college"] }, { id: "bac", name: "Baccalauréat", stage: "End of Terminale", specIds: ["fr-bac"] }], boards: [{ id: "french", name: "Ministère de l'Éducation nationale (France)", exams: ["Brevet", "Baccalauréat"] }] },
    { code: "DE", system: "Deutschland · Sekundarstufe", grades: ["Klasse 5", "Klasse 6", "Klasse 7", "Klasse 8", "Klasse 9", "Klasse 10", "Klasse 11", "Klasse 12"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["de-msa", "de-abi"], sources: ["https://www.kmk.org/"], recordReview: "researched", qualifications: [{ id: "msa", name: "Mittlerer Schulabschluss", stage: "End of Klasse 10", specIds: ["de-msa"] }, { id: "abitur", name: "Abitur", stage: "End of Klasse 12", specIds: ["de-abi"] }], boards: [{ id: "german", name: "Kultusministerkonferenz (KMK)", exams: ["Mittlerer Schulabschluss", "Abitur"] }] },
    { code: "IT", system: "Italia · Media / Superiore", grades: ["1ª media", "2ª media", "3ª media", "1ª superiore", "2ª superiore", "3ª superiore", "4ª superiore", "5ª superiore"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["it-media", "it-maturita"], sources: ["https://www.mim.gov.it/"], recordReview: "researched", qualifications: [{ id: "media", name: "Licenza media", stage: "End of 3ª media", specIds: ["it-media"] }, { id: "maturita", name: "Esame di Stato (Maturità)", stage: "End of 5ª superiore", specIds: ["it-maturita"] }], boards: [{ id: "italian", name: "Ministero dell'Istruzione e del Merito (Italia)", exams: ["Licenza media", "Esame di Stato"] }] },
    { code: "PL", system: "Polska · Szkoła podstawowa / Liceum", grades: ["Klasa 7", "Klasa 8", "Liceum 1", "Liceum 2", "Liceum 3", "Liceum 4"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["pl-osmoklasisty", "pl-matura"], sources: ["https://www.gov.pl/web/edukacja"], recordReview: "researched", qualifications: [{ id: "osmoklasisty", name: "Egzamin ósmoklasisty", stage: "End of Klasa 8", specIds: ["pl-osmoklasisty"] }, { id: "matura", name: "Matura", stage: "End of Liceum 4", specIds: ["pl-matura"] }], boards: [{ id: "polish", name: "Centralna Komisja Egzaminacyjna (Polska)", exams: ["Egzamin ósmoklasisty", "Matura"] }] },
    { code: "UA", system: "Україна · Гімназія / Ліцей", grades: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"], entry: ["fractions", "linear-equations", "quadratics"], specs: ["ua-nmt"], sources: ["https://mon.gov.ua/"], recordReview: "researched", qualifications: [{ id: "nmt", name: "НМТ (National Multi-subject Test)", stage: "End of Grade 12", specIds: ["ua-nmt"] }], boards: [{ id: "ukrainian", name: "Міністерство освіти і науки України", exams: ["НМТ"] }] },
    // ── The Americas ──────────────────────────────────────────────────────────
    { code: "CO", system: "Colombia · Secundaria / Media", grades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["co-saber-11"], sources: ["https://www.mineducacion.gov.co/"], recordReview: "researched", qualifications: [{ id: "saber-11", name: "Saber 11", stage: "End of Grade 11", specIds: ["co-saber-11"] }], boards: [{ id: "colombian", name: "Ministerio de Educación Nacional (Colombia) / ICFES", exams: ["Saber 11"] }] },
    { code: "AR", system: "Argentina · Secundaria", grades: ["1º año", "2º año", "3º año", "4º año", "5º año", "6º año"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ar-secundaria"], sources: ["https://www.argentina.gob.ar/educacion"], recordReview: "researched", qualifications: [{ id: "bachiller", name: "Título de Bachiller", stage: "End of 6º año", specIds: ["ar-secundaria"] }], boards: [{ id: "argentine", name: "Ministerio de Educación (Argentina)", exams: ["Título de Bachiller"] }] },
    { code: "PE", system: "Perú · Secundaria", grades: ["1º secundaria", "2º secundaria", "3º secundaria", "4º secundaria", "5º secundaria"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["pe-secundaria"], sources: ["https://www.gob.pe/minedu"], recordReview: "researched", qualifications: [{ id: "secundaria", name: "Certificado de Educación Secundaria", stage: "End of 5º secundaria", specIds: ["pe-secundaria"] }], boards: [{ id: "peruvian", name: "Ministerio de Educación (Perú)", exams: ["Certificado de Educación Secundaria"] }] },
    { code: "HT", system: "Haïti · Collège / Lycée", grades: ["7e AF", "6e AF", "5e AF", "4e AF", "3e AF", "Seconde", "Rhéto", "Philo"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ht-bac"], sources: ["https://www.menfp.gouv.ht/"], recordReview: "researched", qualifications: [{ id: "bac", name: "Baccalauréat (Haïti)", stage: "End of Philo", specIds: ["ht-bac"] }], boards: [{ id: "haitian", name: "Ministère de l'Éducation Nationale (Haïti)", exams: ["Baccalauréat"] }] },
    { code: "BO", system: "Bolivia · Secundaria", grades: ["1º de secundaria", "2º de secundaria", "3º de secundaria", "4º de secundaria", "5º de secundaria", "6º de secundaria"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["bo-bachillerato"], sources: ["https://www.minedu.gob.bo/"], recordReview: "researched", qualifications: [{ id: "bachillerato", name: "Bachillerato", stage: "End of 6º de secundaria", specIds: ["bo-bachillerato"] }], boards: [{ id: "bolivian", name: "Ministerio de Educación (Bolivia)", exams: ["Bachillerato"] }] },
    { code: "EC", system: "Ecuador · EGB / Bachillerato", grades: ["8º EGB", "9º EGB", "10º EGB", "1º bachillerato", "2º bachillerato", "3º bachillerato"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ec-bachillerato"], sources: ["https://educacion.gob.ec/"], recordReview: "researched", qualifications: [{ id: "bachillerato", name: "Bachillerato", stage: "End of 3º bachillerato", specIds: ["ec-bachillerato"] }], boards: [{ id: "ecuadorian", name: "Ministerio de Educación (Ecuador)", exams: ["Bachillerato"] }] },
    // The exit assessment is "Evaluación Graduandos", run by MINEDUC's DIGEDUCA in two
    // areas (Lectura, Matemática) — so the qualification is named for the TEST, not
    // for the phase, and the source is the ministry's own domain plus DIGEDUCA's page
    // on that assessment. The URL this route used to carry, minedu.gob.gt, was a
    // MISSING LETTER in Guatemala's own domain (the ministry is mineduc.gob.gt) — a
    // dead link, not a foreign ministry's. Checked before correcting this comment,
    // because the first version of it claimed the wrong thing and a comment that
    // accuses a citation of being somebody else's is one an author might delete the
    // citation over.
    { code: "GT", system: "Guatemala · Básico / Diversificado", grades: ["1º básico", "2º básico", "3º básico", "4º diversificado", "5º diversificado"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["gt-diversificado"], sources: ["https://www.mineduc.gob.gt/", "https://digeduca.wordpress.com/sobre-la-evaluacion-graduandos/"], recordReview: "researched", qualifications: [{ id: "diversificado", name: "Evaluación Graduandos — Matemática", stage: "End of 5º diversificado", specIds: ["gt-diversificado"] }], boards: [{ id: "guatemalan", name: "Ministerio de Educación (MINEDUC), DIGEDUCA", exams: ["Evaluación Graduandos"] }] },
    { code: "HN", system: "Honduras · Secundaria", grades: ["7º grado", "8º grado", "9º grado", "10º grado", "11º grado"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["hn-bachillerato"], sources: ["https://se.gob.hn/"], recordReview: "researched", qualifications: [{ id: "bachillerato", name: "Bachillerato", stage: "End of 11º grado", specIds: ["hn-bachillerato"] }], boards: [{ id: "honduran", name: "Secretaría de Educación (Honduras)", exams: ["Bachillerato"] }] },
    { code: "NI", system: "Nicaragua · Secundaria", grades: ["7º grado", "8º grado", "9º grado", "10º grado", "11º grado"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["ni-bachillerato"], sources: ["https://www.mined.gob.ni/"], recordReview: "researched", qualifications: [{ id: "bachillerato", name: "Bachillerato", stage: "End of 11º grado", specIds: ["ni-bachillerato"] }], boards: [{ id: "nicaraguan", name: "Ministerio de Educación (Nicaragua)", exams: ["Bachillerato"] }] },
    { code: "SV", system: "El Salvador · Secundaria", grades: ["7º grado", "8º grado", "9º grado", "10º grado", "11º grado"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["sv-bachillerato"], sources: ["https://www.mined.gob.sv/"], recordReview: "researched", qualifications: [{ id: "bachillerato", name: "Bachillerato", stage: "End of 11º grado", specIds: ["sv-bachillerato"] }], boards: [{ id: "salvadoran", name: "Ministerio de Educación (El Salvador)", exams: ["Bachillerato"] }] },
    { code: "DO", system: "República Dominicana · Secundaria", grades: ["1º de secundaria", "2º de secundaria", "3º de secundaria", "4º de secundaria", "5º de secundaria", "6º de secundaria"], entry: ["fractions", "linear-equations", "algebra-expressions"], specs: ["do-bachillerato"], sources: ["https://www.ministeriodeeducacion.gob.do/"], recordReview: "researched", qualifications: [{ id: "bachillerato", name: "Bachillerato", stage: "End of 6º de secundaria", specIds: ["do-bachillerato"] }], boards: [{ id: "dominican", name: "Ministerio de Educación (República Dominicana)", exams: ["Bachillerato"] }] },
];
function pathwayFromRoute(route) {
    return {
        id: `${route.code.toLowerCase()}-national`,
        countryCode: route.code,
        name: route.system,
        pathwayType: "national",
        schoolYears: years(...route.grades),
        // EMPTY ON PURPOSE for an inherited route. The learner-facing name of a
        // qualification is owned by the specification itself (lib/specifications.ts),
        // and copying it here would be a second owner of one string. A pathway that
        // has actually been researched names its own examinations and the point in
        // the system they end; the gate demands that of a "researched" record and not
        // of an inherited one, which is how the report tells the two apart.
        qualifications: route.qualifications ?? [],
        specificationIds: route.specs,
        boards: route.boards,
        sourceUrls: route.sources ?? [],
        recordReview: route.recordReview ?? "mapped",
        mappingReview: "mapped",
        entryConcepts: route.entry,
        notes: "Record inherited from the route table this registry replaces: the years and " +
            "awarding bodies were already in production. Structural citations are " +
            "recorded only where `sourceUrls` names them. The qualification NAMES live on " +
            "the specifications themselves (lib/specifications.ts), which is what a " +
            "learner is shown.",
    };
}
/** Every offered code with no national pathway recorded. Kept explicit so a new
 *  picker entry must be CLASSIFIED: the curriculum gate fails on a code in
 *  neither this queue nor CURRICULA, instead of silently treating "not added
 *  yet" as "we decided to offer the international fallback". */
const CURRICULA = {
    ...Object.fromEntries([...NATIONAL_ROUTES, ...ADDED_ROUTES].map((r) => [
        r.code,
        {
            countryCode: r.code,
            nationalPathways: [pathwayFromRoute(r)],
            internationalPathwayIds: ["int-international", "int-independent"],
            defaultPathwayId: `${r.code.toLowerCase()}-national`,
        },
    ])),
    // Cameroon: TWO national systems and NO default. This is the one record for
    // which "which pathway?" is a question the learner must answer before the
    // years and the qualifications mean anything.
    CM: {
        countryCode: "CM",
        nationalPathways: [exports.CM_ANGLOPHONE, exports.CM_FRANCOPHONE],
        internationalPathwayIds: ["int-international", "int-independent"],
        defaultPathwayId: null,
        notes: "Two general secondary systems run side by side, and neither is a fallback " +
            "for the other: the Anglophone system ends in GCE O/A Level, the " +
            "Francophone system in the BEPC, Probatoire and Baccalauréat. Technical and " +
            "vocational routes are not modelled here.",
    },
    // International: the programme is the route. `defaultPathwayId` is the
    // international pathway so this code keeps meaning what it always did.
    INT: {
        countryCode: "INT",
        nationalPathways: [],
        internationalPathwayIds: ["int-international", "int-independent"],
        defaultPathwayId: "int-international",
    },
    // "Prefer not to say": no national pathway, no default — the same state an
    // unlisted country is in, and for the same reason (the learner has not told us
    // where they study, so nothing may be assumed about it).
    XX: {
        countryCode: "XX",
        nationalPathways: [],
        internationalPathwayIds: ["int-international", "int-independent"],
        defaultPathwayId: null,
    },
};
/** Every country code the registry can answer for, plus the "no national
 *  route" list. Read by the audit report, never by a page. */
exports.RESEARCHED_CODES = Object.keys(CURRICULA);
const UNRESEARCHED_COUNTRIES = [
    "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ",
    "AG", "AM", "AW", "AT", "AZ", "BS", "BH", "BB",
    "BY", "BE", "BZ", "BJ", "BM", "BT", "BQ", "BA",
    "BW", "BV", "IO", "BN", "BG", "BI", "CV", "KY",
    "CF", "TD", "CL", "CX", "CC", "KM", "CG", "CD",
    "CK", "CR", "HR", "CU", "CW", "CY", "CZ", "DK",
    "DJ", "DM", "GQ", "ER", "EE", "SZ", "FK", "FO",
    "FJ", "FI", "GF", "PF", "TF", "GA", "GM", "GE",
    "GI", "GR", "GL", "GD", "GP", "GU", "GG", "GN",
    "GW", "GY", "HM", "VA", "HK", "HU", "IS", "IM",
    "IL", "JM", "JE", "KI", "KP", "XK", "KW", "KG",
    "LV", "LS", "LR", "LY", "LI", "LT", "LU", "MO",
    "MG", "MY", "MV", "MT", "MH", "MQ", "MR", "MU",
    "YT", "FM", "MD", "MC", "ME", "MS", "MZ", "NA",
    "NR", "NL", "NC", "NZ", "NU", "NF", "MK", "MP",
    "NO", "OM", "PW", "PS", "PA", "PG", "PY", "PN",
    "PT", "PR", "QA", "RE", "RO", "RU", "BL", "SH",
    "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST",
    "SA", "RS", "SC", "SL", "SG", "SX", "SK", "SI",
    "SB", "GS", "SS", "SR", "SJ", "SE", "CH", "TW",
    "TJ", "TH", "TL", "TG", "TK", "TO", "TT", "TN",
    "TM", "TC", "TV", "AE", "UM", "UY", "VU", "VE",
    "VG", "VI", "WF", "EH",
];
exports.UNRESEARCHED_CODES = [...UNRESEARCHED_COUNTRIES];
exports.SHARED_PATHWAY_IDS = exports.SHARED_PATHWAYS.map((p) => p.id);
const ALL_PATHWAYS = [
    ...Object.values(CURRICULA).flatMap((c) => c.nationalPathways),
    ...exports.SHARED_PATHWAYS,
];
function pathwayById(id) {
    if (!id)
        return null;
    return ALL_PATHWAYS.find((p) => p.id === id) ?? null;
}
function allPathways() {
    return ALL_PATHWAYS;
}
/** The country record, or null when the country is not in the registry at all.
 *  A null here is NOT "no pathway available" — it is "no record", and the
 *  difference is exactly what the report prints. */
function countryRecord(code) {
    if (!code)
        return null;
    return CURRICULA[code] ?? null;
}
/** Every pathway a learner in this country may choose, in the order a picker
 *  should offer them: the country's own systems first, then the international
 *  programmes, then the independent pathway. A country with no record still gets
 *  the last three — never an empty list, because `specsFor` must never leave a
 *  learner with no course. */
function pathwayChoices(code) {
    const rec = countryRecord(code);
    const ints = (rec?.internationalPathwayIds ?? ["int-international", "int-independent"])
        .map((id) => pathwayById(id))
        .filter((p) => Boolean(p));
    if (!rec)
        return ints.length ? ints : [exports.INDEPENDENT_PATHWAY];
    const shared = ints.filter((p) => p.countryCode !== rec.countryCode);
    return [...rec.nationalPathways, ...shared.filter((p) => p.pathwayType === "international"),
        ...shared.filter((p) => p.pathwayType === "independent")];
}
/** The pathway a learner is placed on WITHOUT choosing one. Null means the
 *  choice is real and must be made: two national systems, or a country with no
 *  national route and no default to pretend to. */
function defaultPathwayFor(code) {
    const rec = countryRecord(code);
    if (!rec)
        return pathwayById("int-independent");
    if (rec.defaultPathwayId)
        return pathwayById(rec.defaultPathwayId);
    if (rec.nationalPathways.length === 1)
        return rec.nationalPathways[0];
    return null;
}
/** Countries whose own education system is recorded. The one owner of the
 *  number the learner-facing coverage sentence prints. */
function nationalRouteCodes() {
    return Object.values(CURRICULA)
        .filter((c) => c.nationalPathways.length > 0)
        .map((c) => c.countryCode);
}
/** Does this choice genuinely need to be asked for? True when the country has
 *  two or more national systems (Cameroon), and false when one system settles it
 *  or when the international/independent pathways are the honest default. */
function pathwayChoiceRequired(code) {
    const rec = countryRecord(code);
    return Boolean(rec && rec.nationalPathways.length > 1);
}
/** Should a learner in this country be ASKED which education system they follow?
 *  True where the answer is not already settled by the country — none recorded,
 *  or more than one for the country to run. A country with exactly one recorded
 *  national system is not asked: a screen offering a UK learner the choice of
 *  "the UK system" is a question with one answer, and the international
 *  programmes stay reachable from /curriculum (the screen whose job is changing
 *  a course) rather than being a step in every enrolment. */
function pathwayQuestionNeeded(code) {
    const rec = countryRecord(code);
    if (!rec)
        return true; // unresearched: the honest offer is the explicit choice
    return rec.nationalPathways.length !== 1;
}
/** The pathway a select should be SHOWING before the learner touches it.
 *
 *  The country's own system when it has exactly one — so the field is filled and
 *  `Next` is not waiting on a question nobody asked. NOTHING when the country
 *  has more than one (that is the question) and nothing when it has none: for an
 *  unresearched country the international and independent courses are ALL
 *  offered, and preselecting the skills pathway there would narrow a learner's
 *  choices to one before they had said anything. */
function initialPathwayFor(code) {
    const rec = countryRecord(code);
    if (!rec || rec.nationalPathways.length !== 1)
        return "";
    return rec.defaultPathwayId ?? "";
}
/** A country's own systems. Empty for an unresearched country, which is how a
 *  surface tells "we have no national route for you" apart from "choose one of
 *  ours" without a second list. */
function nationalPathwaysFor(code) {
    return countryRecord(code)?.nationalPathways ?? [];
}
/** THE SENTENCE A SURFACE SHOWS ABOUT HOW FAR THIS MAPPING HAS BEEN CHECKED,
 *  as a dictionary key — never as a literal in a component, so the label cannot
 *  drift from the record.
 *
 *  This exists because "there is a route for your country" and "a specialist has
 *  read our mapping of it" are different claims, and the difference is invisible
 *  to a learner unless a surface says it. Before this, every one of the 20
 *  pathways rendered as an ordinary course while 20 of them had no source on
 *  file and none had a reviewed mapping — the same defect as answering a French
 *  learner with Cambridge IGCSE, one layer quieter. */
function mappingReviewKey(pathway) {
    if (!pathway)
        return "";
    if (reviewAtLeast(pathway.mappingReview, "reviewed")) {
        return pathway.mappingReview === "verified" ? "course.mapVerified" : "course.mapReviewed";
    }
    return "course.mapPending";
}
/** The pathway a profile holds, if it is a real pathway AND one this country
 *  offers. A pathway from another country is not "chosen" — it is stale, and
 *  treating it as chosen is how a GCSE ends up scoping a Cameroonian course. */
function pathwayForCountry(code, pathwayId) {
    const pw = pathwayById(pathwayId);
    if (!pw)
        return null;
    if (pw.pathwayType !== "national")
        return pw;
    return pw.countryCode === code ? pw : null;
}
