import { describe, expect, it } from "vitest";
import { applyPageActions, buildControlScope, parseModelControlResponse, validateAndNormalizeActions, type PageAction } from "./page-control";
import type { ApplicationDraft } from "@/lib/wizard/types";

function makeDraft(): ApplicationDraft {
  return {
    id: "draft-1",
    cycle: 2026,
    updatedAt: new Date().toISOString(),
    track: undefined,
    profile: {},
    education: {},
    languages: { topikLevel: 0 },
    universities: { choices: [{}, {}, {}] },
    essays: {
      personalStatement: "",
      studyPlan: { languagePlan: "", goalOfStudy: "", futurePlan: "" },
      recommendation: "",
    },
    flags: {},
  };
}

describe("page-control", () => {
  it("builds profile scope", () => {
    const scope = buildControlScope("profile", makeDraft());
    expect(scope?.editableFields).toContain("profile.familyName");
    expect(scope?.editableFields).toContain("profile.email");
  });

  it("limits universities to one choice for university track", () => {
    const draft = { ...makeDraft(), track: "university-rgks" as const };
    const scope = buildControlScope("universities", draft);
    expect(scope?.maxUniversityChoices).toBe(1);
    expect(scope?.editableFields).toContain("universities.choices.0.universityId");
    expect(scope?.editableFields).not.toContain("universities.choices.1.universityId");
  });

  it("parses structured model response", () => {
    const parsed = parseModelControlResponse(JSON.stringify({
      text: "Done",
      actions: [{ type: "set-field", field: "profile.familyName", value: "Kim" }],
      suggestedReplies: ["Kim", "Lee", "Park"],
    }));

    expect(parsed?.text).toBe("Done");
    expect(parsed?.actions).toHaveLength(1);
    expect(parsed?.suggestedReplies).toEqual(["Kim", "Lee", "Park"]);
  });

  it("normalizes country and rejects cross-page fields", () => {
    const scope = buildControlScope("profile", makeDraft());
    const actions: PageAction[] = [
      { type: "set-field", field: "profile.citizenshipCountryCode", value: "Vietnam" },
      { type: "set-field", field: "languages.topikLevel", value: 4 },
    ];

    const validated = validateAndNormalizeActions(actions, scope);
    expect(validated).toEqual([
      { type: "set-field", field: "profile.citizenshipCountryCode", value: "VN" },
    ]);
  });

  it("applies profile actions through patchSection path", () => {
    const scope = buildControlScope("profile", makeDraft());
    const validated = validateAndNormalizeActions([
      { type: "set-field", field: "profile.familyName", value: "Kim" },
      { type: "set-field", field: "profile.email", value: "kim@example.com" },
    ], scope);

    let patchCall: { section: string; patch: Record<string, unknown> } | null = null;
    applyPageActions(validated, scope, (section, patch) => {
      patchCall = { section, patch: patch as Record<string, unknown> };
    }, (updater) => updater(makeDraft()));

    expect(patchCall).toEqual({
      section: "profile",
      patch: { familyName: "Kim", email: "kim@example.com" },
    });
  });
});
