import { describe, expect, it } from "@jest/globals";

import { buildSurveyLink } from "@services/surveyLink";

describe("buildSurveyLink", () => {
  it("appends the parameters to a link without a query string", () => {
    expect(buildSurveyLink("https://survey.example.org/index.php/123456", "abc123", "en")).toBe(
      "https://survey.example.org/index.php/123456?UID=abc123&lang=en"
    );
  });

  it("merges the parameters into an existing query string", () => {
    const link = new URL(
      buildSurveyLink("https://survey.example.org/index.php?r=survey/index&sid=123456", "abc123", "en")
    );
    expect(link.searchParams.get("sid")).toBe("123456");
    expect(link.searchParams.get("r")).toBe("survey/index");
    expect(link.searchParams.get("UID")).toBe("abc123");
    expect(link.searchParams.get("lang")).toBe("en");
  });

  it("replaces a language already in the link with the current locale", () => {
    const link = new URL(buildSurveyLink("https://survey.example.org/index.php?sid=123456&lang=de", "abc123", "en"));
    expect(link.searchParams.getAll("lang")).toEqual(["en"]);
  });

  it("leaves out the UID when there is no donor ID", () => {
    expect(buildSurveyLink("https://survey.example.org/index.php?sid=123456", undefined, "en")).toBe(
      "https://survey.example.org/index.php?sid=123456&lang=en"
    );
  });
});
