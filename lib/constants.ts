export const APP_NAME = "Reggy";
export const APP_DESCRIPTION =
  "AI-powered assistant for navigating financial aid regulations";
export const APP_LOGO = "/assets/images/IQID-logo.png";

export const embeddingsModel = "text-embedding-ada-002";
export const completionsModel = "gpt-4-turbo";

export const API_ROUTES = {
  LOGIN: "/api/auth/login",
  SIGNUP: "/api/auth/signup",
  QUERY: "/api/query",
  FEEDBACK: "/api/feedback",
  FINE_TUNE: "/api/admin/fine-tune",
  FINE_TUNE_TEST: "/api/admin/fine-tune/test",
  SET_THEME: "/api/set-theme",
} as const;

export const PAGE_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  HOME: "/",
} as const;

export const CHAT_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

export const FEEDBACK_RATING: { POSITIVE: "positive"; NEGATIVE: "negative" } = {
  POSITIVE: "positive",
  NEGATIVE: "negative",
} as const;

export const MAX_CONTEXT_WINDOW = 5;

export const DOCUMENT_TYPES = {
  FEDERAL: "federal",
  STATE: "state",
  INSTITUTION: "institution",
} as const;

export const THEMES = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

export const FINE_TUNE_MODEL_ID_FILE = "fine_tuned_model_id.txt";

export const STATES = [
  "alabama",
  "alaska",
  "arizona",
  "arkansas",
  "california",
  "colorado",
  "connecticut",
  "delaware",
  "florida",
  "georgia",
  "hawaii",
  "idaho",
  "illinois",
  "indiana",
  "iowa",
  "kansas",
  "kentucky",
  "louisiana",
  "maine",
  "maryland",
  "massachusetts",
  "michigan",
  "minnesota",
  "mississippi",
  "missouri",
  "montana",
  "nebraska",
  "nevada",
  "new hampshire",
  "new jersey",
  "new mexico",
  "new york",
  "north carolina",
  "north dakota",
  "ohio",
  "oklahoma",
  "oregon",
  "pennsylvania",
  "rhode island",
  "south carolina",
  "south dakota",
  "tennessee",
  "texas",
  "utah",
  "vermont",
  "virginia",
  "washington",
  "west virginia",
  "wisconsin",
  "wyoming",
] as const;
