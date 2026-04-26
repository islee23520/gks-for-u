import type { GpaScale, Track } from "../eligibility/types";

const VALID_TRACKS: Track[] = [
  "embassy-general",
  "embassy-overseas-korean",
  "embassy-irts",
  "university-uic",
  "university-rgks",
  "associate",
];

const VALID_GPA_SCALES: GpaScale[] = ["4.0", "4.3", "4.5", "5.0", "100"];
const VALID_GENDERS = ["M", "F", "X"] as const;
const VALID_TOPIK = [0, 1, 2, 3, 4, 5, 6] as const;
const VALID_ENGLISH_TESTS = ["toefl_ibt", "ielts", "none"] as const;

export type InterviewQuestion = {
  field: string;
  label: string;
  question: string;
  normalize: (raw: string) => unknown;
  validate: (v: unknown) => boolean;
};

function strip(raw: string): string {
  return raw.trim();
}

function nonEmpty(v: unknown): boolean {
  return typeof v === "string" && v.length > 0;
}

const PROFILE_QUESTIONS: InterviewQuestion[] = [
  {
    field: "familyName",
    label: "Family Name",
    question: "What is your family name (last name / surname)?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "givenName",
    label: "Given Name",
    question: "What is your given name (first name)?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "dateOfBirth",
    label: "Date of Birth",
    question: "What is your date of birth? (YYYY-MM-DD)",
    normalize: (raw) => {
      const m = raw.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
      if (!m) return raw.trim();
      return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    },
    validate: (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v),
  },
  {
    field: "gender",
    label: "Gender",
    question: 'What is your gender? (M / F / X)',
    normalize: (raw) => raw.trim().toUpperCase(),
    validate: (v) => typeof v === "string" && VALID_GENDERS.includes(v as any),
  },
  {
    field: "citizenshipCountryCode",
    label: "Citizenship",
    question: "What is your citizenship country? (2-letter code, e.g. US, KR, VN)",
    normalize: (raw) => raw.trim().toUpperCase().slice(0, 2),
    validate: (v) => typeof v === "string" && /^[A-Z]{2}$/.test(v),
  },
  {
    field: "email",
    label: "Email",
    question: "What is your email address?",
    normalize: strip,
    validate: (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
  {
    field: "phone",
    label: "Phone",
    question: "What is your phone number? (include country code, e.g. +1-555-123-4567)",
    normalize: strip,
    validate: nonEmpty,
  },
];

const EDUCATION_QUESTIONS: InterviewQuestion[] = [
  {
    field: "highSchoolName",
    label: "High School Name",
    question: "What is the name of your high school?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "highSchoolCity",
    label: "High School City",
    question: "What city is your high school located in?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "highSchoolStart",
    label: "Start Date",
    question: "When did you start high school? (YYYY-MM)",
    normalize: (raw) => {
      const m = raw.trim().match(/^(\d{4})[/-](\d{1,2})$/);
      if (!m) return raw.trim();
      return `${m[1]}-${m[2].padStart(2, "0")}`;
    },
    validate: (v) => typeof v === "string" && /^\d{4}-\d{2}$/.test(v),
  },
  {
    field: "highSchoolEnd",
    label: "End Date",
    question: "When did you (or will you) finish high school? (YYYY-MM)",
    normalize: (raw) => {
      const m = raw.trim().match(/^(\d{4})[/-](\d{1,2})$/);
      if (!m) return raw.trim();
      return `${m[1]}-${m[2].padStart(2, "0")}`;
    },
    validate: (v) => typeof v === "string" && /^\d{4}-\d{2}$/.test(v),
  },
  {
    field: "gpaValue",
    label: "GPA",
    question: "What is your GPA? (number only, e.g. 3.8)",
    normalize: (raw) => {
      const n = parseFloat(raw.trim());
      return isNaN(n) ? raw.trim() : n;
    },
    validate: (v) => typeof v === "number" && v >= 0,
  },
  {
    field: "gpaScale",
    label: "GPA Scale",
    question: 'What is your GPA scale? (4.0 / 4.3 / 4.5 / 5.0 / 100)',
    normalize: (raw) => raw.trim(),
    validate: (v) => typeof v === "string" && VALID_GPA_SCALES.includes(v as GpaScale),
  },
];

const LANGUAGES_QUESTIONS: InterviewQuestion[] = [
  {
    field: "topikLevel",
    label: "TOPIK Level",
    question: "What is your TOPIK level? (0–6, use 0 if you haven't taken it)",
    normalize: (raw) => {
      const n = parseInt(raw.trim(), 10);
      return isNaN(n) ? raw.trim() : Math.min(6, Math.max(0, n));
    },
    validate: (v) => typeof v === "number" && VALID_TOPIK.includes(v as any),
  },
  {
    field: "topikDate",
    label: "TOPIK Date",
    question: "When did you take the TOPIK? (YYYY-MM, or skip with 'N/A')",
    normalize: (raw) => {
      const v = raw.trim();
      if (v.toUpperCase() === "N/A" || v === "-") return undefined;
      const m = v.match(/^(\d{4})[/-](\d{1,2})$/);
      if (!m) return v;
      return `${m[1]}-${m[2].padStart(2, "0")}`;
    },
    validate: () => true,
  },
  {
    field: "englishTest",
    label: "English Test",
    question: "Which English proficiency test have you taken? (toefl_ibt / ielts / none)",
    normalize: (raw) => {
      const v = raw.trim().toLowerCase();
      if (v === "none" || v === "n/a" || v === "-") return "none";
      if (v.includes("toefl")) return "toefl_ibt";
      if (v.includes("ielts")) return "ielts";
      return v;
    },
    validate: (v) => typeof v === "string" && VALID_ENGLISH_TESTS.includes(v as any),
  },
  {
    field: "englishScore",
    label: "English Score",
    question: "What is your English test score? (number, or 0 if none)",
    normalize: (raw) => {
      const n = parseFloat(raw.trim());
      return isNaN(n) ? 0 : n;
    },
    validate: (v) => typeof v === "number" && v >= 0,
  },
];

const UNIVERSITIES_QUESTIONS: InterviewQuestion[] = [
  {
    field: "choice0UniversityId",
    label: "1st Choice University",
    question: "What is the ID or name of your 1st choice university?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice0Department",
    label: "1st Choice Department",
    question: "What department for your 1st choice?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice0FieldOfStudy",
    label: "1st Choice Field",
    question: "What is your field of study for the 1st choice?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice1UniversityId",
    label: "2nd Choice University",
    question: "What is the ID or name of your 2nd choice university?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice1Department",
    label: "2nd Choice Department",
    question: "What department for your 2nd choice?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice1FieldOfStudy",
    label: "2nd Choice Field",
    question: "What is your field of study for the 2nd choice?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice2UniversityId",
    label: "3rd Choice University",
    question: "What is the ID or name of your 3rd choice university?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice2Department",
    label: "3rd Choice Department",
    question: "What department for your 3rd choice?",
    normalize: strip,
    validate: nonEmpty,
  },
  {
    field: "choice2FieldOfStudy",
    label: "3rd Choice Field",
    question: "What is your field of study for the 3rd choice?",
    normalize: strip,
    validate: nonEmpty,
  },
];

export const SECTION_QUESTIONS: Record<string, InterviewQuestion[]> = {
  track: [
    {
      field: "track",
      label: "Application Track",
      question:
        "Which application track are you applying to?\nOptions: embassy-general, embassy-overseas-korean, embassy-irts, university-uic, university-rgks, associate",
      normalize: (raw) => raw.trim().toLowerCase(),
      validate: (v) => typeof v === "string" && VALID_TRACKS.includes(v as Track),
    },
  ],
  profile: PROFILE_QUESTIONS,
  education: EDUCATION_QUESTIONS,
  languages: LANGUAGES_QUESTIONS,
  universities: UNIVERSITIES_QUESTIONS,
};

export const INTERVIEWABLE_SECTIONS = new Set(Object.keys(SECTION_QUESTIONS));

export function getInterviewQuestions(section: string): InterviewQuestion[] {
  return SECTION_QUESTIONS[section] ?? [];
}

export function findNextQuestion(
  section: string,
  draft: Record<string, any>,
): InterviewQuestion | undefined {
  const questions = getInterviewQuestions(section);
  if (section === "universities") {
    return questions.find((q) => {
      const idx = parseInt(q.field.replace(/^choice/, ""), 10);
      const rest = q.field.replace(/^choice\d/, "");
      const fieldMap: Record<string, keyof import("../wizard/types").UniversityChoice> = {
        UniversityId: "universityId",
        Department: "department",
        FieldOfStudy: "fieldOfStudy",
      };
      const key = fieldMap[rest];
      if (!key) return false;
      const choice = draft?.universities?.choices?.[idx];
      return !choice || !choice[key];
    });
  }

  if (section === "track") {
    if (!draft.track) return questions[0];
    return undefined;
  }

  const sectionData = draft[section] ?? {};
  return questions.find((q) => !sectionData[q.field]);
}

export function normalizeAnswer(
  _section: string,
  question: InterviewQuestion,
  rawAnswer: string,
): { value: unknown; valid: boolean } {
  const value = question.normalize(rawAnswer);
  return { value, valid: question.validate(value) };
}

export function buildUpdatesFromAnswer(
  section: string,
  question: InterviewQuestion,
  rawAnswer: string,
): { updates: Record<string, any>; valid: boolean; normalized: unknown } {
  const { value, valid } = normalizeAnswer(section, question, rawAnswer);
  if (!valid) return { updates: {}, valid: false, normalized: value };

  if (section === "universities") {
    const idx = parseInt(question.field.replace(/^choice/, ""), 10);
    const rest = question.field.replace(/^choice\d/, "");
    const fieldMap: Record<string, string> = {
      UniversityId: "universityId",
      Department: "department",
      FieldOfStudy: "fieldOfStudy",
    };
    const key = fieldMap[rest] ?? rest;
    return { updates: { __universityChoice: true, index: idx, key, value }, valid: true, normalized: value };
  }

  if (section === "track") {
    return { updates: { track: value }, valid: true, normalized: value };
  }

  return { updates: { [question.field]: value }, valid: true, normalized: value };
}

export function applyUpdates(
  section: string,
  patchSectionFn: (section: any, patch: any) => void,
  updateDraftFn: (updater: (d: any) => any) => void,
  updates: Record<string, any>,
) {
  if (!updates || Object.keys(updates).length === 0) return;

  if (updates.__universityChoice) {
    const { index, key, value } = updates;
    updateDraftFn((d: any) => {
      const choices = [...(d.universities?.choices ?? [{}, {}, {}])];
      while (choices.length <= index) choices.push({});
      choices[index] = { ...choices[index], [key]: value };
      return { ...d, universities: { ...d.universities, choices } };
    });
    return;
  }

  if (section === "track") {
    updateDraftFn((d: any) => ({ ...d, track: updates.track }));
    return;
  }

  patchSectionFn(section, updates);
}
