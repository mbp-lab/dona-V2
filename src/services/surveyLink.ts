/**
 * Adds the donor ID and language to a survey link. The link may already carry a query string
 * (e.g. LimeSurvey's `index.php?r=survey/index&sid=123456`), so the parameters are merged into it
 * instead of appended with a second `?`. A `UID` or `lang` already in the link is replaced, and the
 * `UID` is left out when there is no donor ID.
 */
export const buildSurveyLink = (surveyLink: string, donorId: string | undefined, locale: string): string => {
  const url = new URL(surveyLink);
  if (donorId) url.searchParams.set("UID", donorId);
  url.searchParams.set("lang", locale);
  return url.toString();
};
