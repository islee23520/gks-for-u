import { z } from "zod";
import countries from "../../../data/countries.json";
import universities from "../../../data/universities.json";
import fieldsOfStudy from "../../../data/fields-of-study.json";
import type { ApplicationDraft } from "@/lib/wizard/types";
import type { Track, GpaScale } from "@/lib/eligibility/types";

const TRACK_VALUES = [
  "embassy-general",
  "embassy-overseas-korean",
  "embassy-irts",
  "university-uic",
  "university-rgks",
  "associate",
] as const satisfies readonly Track[];

const GPA_SCALES = ["4.0", "4.3", "4.5", "5.0", "100"] as const satisfies readonly GpaScale[];
const ENGLISH_TESTS = ["toefl_ibt", "ielts", "none"] as const;
const TOPIK_LEVELS = [0, 1, 2, 3, 4, 5, 6] as const;

const ALL_UNIVERSITIES = [
  ...universities.typeA.map((u) => ({ id: u.id, name: u.name })),
  ...universities.typeB.map((u) => ({ id: u.id, name: u.name })),
];

const FIELD_PATHS = {
  track: ["track"],
  profile: [
    "profile.familyName",
    "profile.givenName",
    "profile.middleName",
    "profile.dateOfBirth",
    "profile.gender",
    "profile.citizenshipCountryCode",
    "profile.addressCountry",
    "profile.phone",
    "profile.addressLine1",
    "profile.addressLine2",
    "profile.email",
  ],
  education: [
    "education.highSchoolName",
    "education.highSchoolCity",
    "education.highSchoolStart",
    "education.highSchoolEnd",
    "education.expectedGraduationDate",
    "education.gpaScale",
    "education.gpaValue",
    "education.classRankPercentile",
  ],
  languages: [
    "languages.topikLevel",
    "languages.topikDate",
    "languages.englishTest",
    "languages.englishScore",
  ],
} as const;

export type ControlSection =
  | "track"
  | "profile"
  | "education"
  | "languages"
  | "universities";

export type ControlScope = {
  section: ControlSection;
  editableFields: string[];
  maxUniversityChoices?: 1 | 3;
};

export type PageAction = {
  type: "set-field";
  field: string;
  value: string | number | null;
};

export type ChatControlResponse = {
  text: string;
  actions: PageAction[];
  suggestedReplies: [string, string, string];
  scope: Pick<ControlScope, "section">;
};

const rawActionSchema = z.object({
  type: z.literal("set-field"),
  field: z.string().min(1),
  value: z.union([z.string(), z.number(), z.null()]),
});

const rawResponseSchema = z.object({
  text: z.string().min(1),
  actions: z.array(rawActionSchema).default([]),
  suggestedReplies: z.array(z.string().min(1)).length(3),
});

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDate(value: string): string | undefined {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return undefined;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function normalizeCountry(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const upper = trimmed.toUpperCase();
  const byCode = countries.countries.find((country) => country.code === upper);
  if (byCode) return byCode.code;
  const lower = trimmed.toLowerCase();
  const byName = countries.countries.find((country) => country.name.toLowerCase() === lower);
  return byName?.code;
}

function normalizeGender(value: string): string | undefined {
  const lower = value.trim().toLowerCase();
  if (["m", "male"].includes(lower)) return "M";
  if (["f", "female"].includes(lower)) return "F";
  if (["x", "other", "prefer not to say"].includes(lower)) return "X";
  return undefined;
}

function normalizeEnglishTest(value: string): string | undefined {
  const lower = value.trim().toLowerCase();
  if (["none", "n/a", "na"].includes(lower)) return "none";
  if (lower.includes("toefl")) return "toefl_ibt";
  if (lower.includes("ielts")) return "ielts";
  return ENGLISH_TESTS.find((item) => item === lower);
}

function normalizeUniversityId(value: string): string | undefined {
  const lower = value.trim().toLowerCase();
  if (!lower) return undefined;
  const byId = ALL_UNIVERSITIES.find((university) => university.id.toLowerCase() === lower);
  if (byId) return byId.id;
  const byName = ALL_UNIVERSITIES.find((university) => university.name.toLowerCase() === lower);
  return byName?.id;
}

function normalizeFieldOfStudy(value: string): string | undefined {
  const lower = value.trim().toLowerCase();
  if (!lower) return undefined;
  const byId = fieldsOfStudy.divisions.find((field) => field.id.toLowerCase() === lower);
  if (byId) return byId.id;
  const byLabel = fieldsOfStudy.divisions.find((field) => field.label.toLowerCase() === lower);
  return byLabel?.id;
}

function normalizeNumber(value: string | number): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeFieldValue(field: string, value: PageAction["value"]): string | number | undefined {
  if (value === null) return undefined;

  if (field === "track") {
    if (typeof value !== "string") return undefined;
    const lower = value.trim().toLowerCase();
    return TRACK_VALUES.find((item) => item === lower);
  }

  if (field === "profile.gender") {
    return typeof value === "string" ? normalizeGender(value) : undefined;
  }

  if (field === "profile.citizenshipCountryCode") {
    return typeof value === "string" ? normalizeCountry(value) : undefined;
  }

  if (
    field === "profile.dateOfBirth" ||
    field === "education.highSchoolStart" ||
    field === "education.highSchoolEnd" ||
    field === "education.expectedGraduationDate" ||
    field === "languages.topikDate"
  ) {
    return typeof value === "string" ? normalizeDate(value) : undefined;
  }

  if (field === "education.gpaScale") {
    if (typeof value !== "string") return undefined;
    return GPA_SCALES.find((item) => item === value.trim());
  }

  if (field === "education.gpaValue" || field === "education.classRankPercentile" || field === "languages.englishScore") {
    return normalizeNumber(value);
  }

  if (field === "languages.topikLevel") {
    const parsed = normalizeNumber(value);
    if (parsed === undefined) return undefined;
    return TOPIK_LEVELS.find((level) => level === parsed);
  }

  if (field === "languages.englishTest") {
    return typeof value === "string" ? normalizeEnglishTest(value) : undefined;
  }

  if (field.endsWith(".universityId")) {
    return typeof value === "string" ? normalizeUniversityId(value) : undefined;
  }

  if (field.endsWith(".fieldOfStudy")) {
    return typeof value === "string" ? normalizeFieldOfStudy(value) : undefined;
  }

  if (typeof value === "string") {
    const normalized = normalizeText(value);
    return normalized.length > 0 ? normalized : undefined;
  }

  return undefined;
}

export function buildControlScope(section: string, draft: ApplicationDraft): ControlScope | null {
  if (section === "track") {
    return { section, editableFields: [...FIELD_PATHS.track] };
  }

  if (section === "profile") {
    return { section, editableFields: [...FIELD_PATHS.profile] };
  }

  if (section === "education") {
    return { section, editableFields: [...FIELD_PATHS.education] };
  }

  if (section === "languages") {
    return { section, editableFields: [...FIELD_PATHS.languages] };
  }

  if (section === "universities") {
    const maxUniversityChoices: 1 | 3 = draft.track?.startsWith("embassy") ? 3 : 1;
    const editableFields = Array.from({ length: maxUniversityChoices }, (_, index) => [
      `universities.choices.${index}.universityId`,
      `universities.choices.${index}.fieldOfStudy`,
      `universities.choices.${index}.department`,
    ]).flat();

    return { section, editableFields, maxUniversityChoices };
  }

  return null;
}

export function parseModelControlResponse(raw: string): Omit<ChatControlResponse, "scope"> | null {
  try {
    const parsed = rawResponseSchema.parse(JSON.parse(raw));
    return {
      text: parsed.text,
      actions: parsed.actions,
      suggestedReplies: [parsed.suggestedReplies[0], parsed.suggestedReplies[1], parsed.suggestedReplies[2]],
    };
  } catch {
    return null;
  }
}

export function validateAndNormalizeActions(actions: PageAction[], scope: ControlScope | null): PageAction[] {
  if (!scope) return [];

  return actions.flatMap((action) => {
    const parsed = rawActionSchema.safeParse(action);
    if (!parsed.success) return [];
    if (!scope.editableFields.includes(parsed.data.field)) return [];

    const normalizedValue = normalizeFieldValue(parsed.data.field, parsed.data.value);
    if (normalizedValue === undefined) return [];

    return [{ ...parsed.data, value: normalizedValue } satisfies PageAction];
  });
}

export function applyPageActions(
  actions: PageAction[],
  scope: ControlScope | null,
  patchSection: <K extends keyof ApplicationDraft>(section: K, patch: Partial<ApplicationDraft[K]>) => void,
  updateDraft: (updater: (draft: ApplicationDraft) => ApplicationDraft) => void,
) {
  if (!scope || actions.length === 0) return;

  if (scope.section === "track") {
    const trackAction = actions.find((action) => action.field === "track");
    if (!trackAction || typeof trackAction.value !== "string") return;
    updateDraft((draft) => ({ ...draft, track: trackAction.value as Track }));
    return;
  }

  if (scope.section === "universities") {
    updateDraft((draft) => {
      const choices = [...draft.universities.choices];
      for (const action of actions) {
        const match = action.field.match(/^universities\.choices\.(\d)\.(universityId|fieldOfStudy|department)$/);
        if (!match) continue;
        const index = Number.parseInt(match[1], 10);
        const key = match[2];
        if (scope.maxUniversityChoices && index >= scope.maxUniversityChoices) continue;
        while (choices.length <= index) choices.push({});
        const currentChoice = choices[index] ?? {};
        choices[index] = { ...currentChoice, [key]: action.value as string };
      }
      return { ...draft, universities: { ...draft.universities, choices } };
    });
    return;
  }

  const patch: Record<string, string | number | undefined> = {};
  for (const action of actions) {
    const [, key] = action.field.split(".");
    if (!key) continue;
    patch[key] = action.value === null ? undefined : (action.value as string | number | undefined);
  }

  if (scope.section === "profile") {
    patchSection("profile", patch);
    return;
  }

  if (scope.section === "education") {
    patchSection("education", patch);
    return;
  }

  if (scope.section === "languages") {
    patchSection("languages", patch);
  }
}
