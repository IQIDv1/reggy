export const APP_NAME = "Reggy";
export const APP_DESCRIPTION =
  "AI-powered assistant for navigating financial aid regulations";
export const APP_LOGO = "/assets/images/IQID-logo.png";
export const APP_LOGO_CIRCLE = "/assets/images/IQID-logo-circle.png";

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

export const BRIDGE_TAGS = [
  "aid_for_incarcerated_students",
  "americorps_eligibility",
  "application_status",
  "citizenship_or_daca_status",
  "cost_of_attendance_adjustment",
  "dependency_override",
  "dependent_student_criteria",
  "divorced_or_separated_parents",
  "enrollment_intensity_effects",
  "fa_updates_2024_2025",
  "fafsa_application_link",
  "fafsa_document_checklist",
  "foreign_income_edge_cases",
  "foster_youth_eligibility",
  "fraud_referral_policy",
  "homeless_unaccompanied_youth",
  "income_adjustment",
  "independent_student_criteria",
  "irs_data_retrieval_errors",
  "loan_limits_and_caps",
  "marital_status_change",
  "multiple_fafsa_years",
  "non_tax_filer_proof",
  "number_in_college",
  "parent_unavailable",
  "pell_calculation_logic",
  "pell_grant_rules",
  "pell_income_thresholds",
  "professional_judgment_scope",
  "program_rules",
  "sai_vs_efc_difference",
  "school_cost_inquiries",
  "school_specific_promises",
  "seog_grant_rules",
  "special_circumstances",
  "state_grant_programs",
  "verification_documents",
  "verification_exclusion",
  "verification_tracking_groups",
  "work_study_explainer",
  "zero_sai_vs_partial_sai",
] as const;
