import "dotenv/config";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { decode } from "html-entities";
import { BRIDGE_TAGS, STATES } from "./constants";
import OpenAI from "openai";

export const generateBridgeEntry = async (tag: string) => {
  const openAIKey = process.env.OPENAI_API_KEY!;
  const openai = new OpenAI({ apiKey: openAIKey });
  const prompt = `
You are a financial aid policy expert. For the tag "${tag}", generate:

1. 1-3 short but useful follow-up questions that a staff member might ask a student to clarify their situation.
2. 1 recommended staff action (what the aid office should do next).

Be concise and accurate. Respond in this JSON format:

{
  "follow_ups": ["...", "..."],
  "recommended_action": "..."
}
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: "You are a compliance-focused financial aid rules expert.",
      },
      { role: "user", content: prompt },
    ],
  });

  try {
    const parsed = JSON.parse(response.choices[0].message?.content || "{}");
    return parsed;
  } catch (err) {
    console.error(`❌ Failed to parse response for tag: ${tag}`);
    return null;
  }
};

export function getCurrentAcademicYear(): string {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  return currentMonth > 7
    ? `${currentYear}-${currentYear + 1}`
    : `${currentYear - 1}-${currentYear}`;
}

export function extractAcademicYear(
  string: string,
  excludeDefault?: boolean
): string | null {
  // Normalize string (replace special characters)
  const normalizedString = string.replace(/[^a-zA-Z0-9-_ ]/g, "");

  // Match full year range (e.g., 2025-2026)
  const matchRange = normalizedString.match(/\b(20\d{2})[-_](20\d{2})\b/);
  if (matchRange) return `${matchRange[1]}-${matchRange[2]}`;

  // Match abbreviated year (e.g., 23-24 → 2023-2024)
  const matchShortYear = normalizedString.match(/\b(\d{2})[-_](\d{2})\b/);
  if (matchShortYear) {
    const startYear = `20${matchShortYear[1]}`;
    const endYear = `20${matchShortYear[2]}`;
    return `${startYear}-${endYear}`;
  }

  // Match single year (e.g., 2025 → 2025-2026)
  const matchSingleYear = normalizedString.match(/\b(20\d{2})\b/);
  if (matchSingleYear) {
    const startYear = matchSingleYear[1];
    const endYear = (parseInt(startYear) + 1).toString();
    return `${startYear}-${endYear}`;
  }

  if (excludeDefault) return null;
  // Default to current academic year if no match found
  return getCurrentAcademicYear();
}

// interface Filter {
//   type?: string[];
//   state?: string;
//   institution?: string;
//   academic_year?: string;
// }

// interface Metadata {
//   type: "federal" | "state" | "institution";
//   state?: string;
//   institution?: string;
//   academic_year: string;
//   filename: string;
// }

export const extractFilters = async (query: string) => {
  const openAIKey = process.env.OPENAI_API_KEY!;
  const openai = new OpenAI({ apiKey: openAIKey });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: Record<string, any> = {};

  const formattedQuery = query.trim().toLowerCase();

  // Define possible values
  type type = "federal" | "state" | "institution";
  const types: type[] = ["federal", "state", "institution"];
  const states: string[] = [...STATES];
  // const institutions: string[] = ["uc berkeley", "harvard", "stanford"]; // Expand as needed

  // Extract types
  const matchedTypes: type[] = types.filter((t) => formattedQuery.includes(t));
  if (
    !matchedTypes.includes("institution") &&
    (formattedQuery.includes("college") ||
      formattedQuery.includes("university"))
  ) {
    matchedTypes.push("institution");
  }

  if (matchedTypes.length) {
    filters["type"] = matchedTypes;

    if (matchedTypes.includes("federal")) {
      try {
        const prompt = `Classify the following financial aid question into 1-3 tags from this list: ${BRIDGE_TAGS.join(
          ", "
        )}\n\nQuestion: ${query}\n\nRespond with a JSON array of tag strings.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4",
          temperature: 0.3,
          messages: [{ role: "user", content: prompt, name: undefined }],
        });

        const tags = JSON.parse(response.choices[0].message?.content || "[]");
        const primary_tag = tags[0] || "";
        if (primary_tag) filters["tags"] = [primary_tag];
      } catch (error) {}
    }
  }

  // Extract state
  const matchedState = states.find((state) => formattedQuery.includes(state));
  if (matchedState) filters["state"] = matchedState;

  // TODO: Restrict institution
  // Extract institution
  // const matchedInstitution = institutions.find((inst) =>
  //   formattedQuery.includes(inst)
  // );
  // if (matchedInstitution) filters["institution"] = matchedInstitution;

  const academicYear = extractAcademicYear(query, true);
  if (academicYear) filters["academic_year"] = academicYear;

  return filters; // JSON object for Supabase
};

// Clean and normalize the text before processing
export function cleanAndNormalizeText(text: string): string {
  // Step 1: Decode HTML entities into plain text
  const decodedText = decode(text);

  // Step 2: Remove non-printable characters (ASCII control characters and other unwanted characters)
  const cleanText = decodedText.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();

  // Step 3: Normalize characters (e.g., replace smart quotes, dashes, apostrophes)
  let normalizedText = cleanText
    .replace(/[“”]/g, '"') // Replace smart quotes with regular quotes
    .replace(/[‘’]/g, "'") // Replace smart apostrophes with regular apostrophes
    .replace(/–/g, "-") // Replace en-dash with regular dash
    .replace(/[\r\n]+/g, " ") // Replace newlines with a space to avoid line breaks in chunks
    .replace(/\s+/g, " "); // Normalize multiple spaces into a single space

  // Step 4: Handle excessive periods and extra dots (e.g., "2.2..B" -> "2.2.B")
  normalizedText = normalizedText.replace(/\.{2,}/g, "."); // Collapse multiple periods into a single period

  // Step 5: Fix misplaced text like "Dear Colleague LettersDear Partner Letters"
  normalizedText = normalizedText.replace(
    /(Dear\s*Colleague\s*Letters)(Dear\s*Partner\s*Letters)/gi,
    "$1 $2"
  );

  // Step 6: Allow URLs and domain names to stay intact
  normalizedText = normalizedText.replace(
    /(?:https?|ftp):\/\/[^\s]+/g, // Keep full URLs
    (match) => match.replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove invisible characters
  );

  // Step 7: Remove unwanted characters (like symbols and special characters) that might distort text
  normalizedText = normalizedText.replace(
    /[^a-zA-Z0-9\s,.;?!()\-"'/:&@]/g, // Allow some useful symbols for readability
    ""
  );

  return normalizedText.trim();
}

export function formatYear(year: string): string {
  if (year.includes("-")) return year; // Already a range
  const parsedYear = Number.parseInt(year);
  return isNaN(parsedYear)
    ? getCurrentAcademicYear()
    : `${parsedYear}-${parsedYear + 1}`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
