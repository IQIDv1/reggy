import "dotenv/config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openAIKey = process.env.OPENAI_API_KEY;

console.log("SUPABASE URL: ", supabaseUrl);
console.log("SUPABASE KEY: ", supabaseKey);
console.log("OPENAI KEY: ", openAIKey);

if (!supabaseUrl || !supabaseKey || !openAIKey) {
  throw new Error("Missing required environment variables");
}

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { cleanAndNormalizeText, extractAcademicYear } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { embeddingsModel } from "@/lib/constants";
import OpenAI from "openai";
// import { Database } from "@/lib/database.types";
import path from "path";
import fs from "fs";

// import { S3 } from "aws-sdk";
// const s3 = new S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const supabase = createClient<Database>(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openAIKey });
const supabase = createClient(supabaseUrl, supabaseKey);
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openAIKey,
  model: embeddingsModel,
});

const classifyTagsPrompt = `
You are a financial aid policy classification expert. Your job is to label a paragraph of FAFSA or FSA policy with:

1. **General labels** — These are broad user intent categories. Use only from this list:
   - eligibility
   - documentation
   - deadlines
   - corrections
   - application_status
   - cost_questions
   - program_rules
   - workflow_or_responsibility
   - escalation_or_exceptions
   - advanced_case
   - follow_up_required

2. **FA-specific tags** — These are specific financial aid policy topics used to route and retrieve the right supporting content. Use as many of the following as apply (and add your own if useful):

[
  "aid_for_incarcerated_students",
  "citizenship_or_daca_status",
  "cost_of_attendance_adjustment",
  "cross_state_funding",
  "dependency_override",
  "divorced_or_separated_parents",
  "enrollment_intensity_effects",
  "fa_updates_2024_2025",
  "fafsa_application_link",
  "fafsa_document_checklist",
  "financial_aid_after_prison",
  "foreign_income_edge_cases",
  "foster_youth_eligibility",
  "fraud_referral_policy",
  "funding_for_out_of_state_students",
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
  "pell_income_thresholds",
  "professional_judgment_scope",
  "requesting_more_aid",
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
  "zero_sai_vs_partial_sai"
]

- FA tags must be specific enough to help match user queries to relevant policy chunks.
- If a tag doesn't exist but should, invent it using \`snake_case\`.

Respond only in this format:
{
  "general_labels": [...],
  "financial_aid_tags": [...]
}
`;

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
async function processDocument(filePath: string, metadata: any) {
  try {
    console.log(`Processing file: ${filePath}`);
    // const fileBuffer = fs.readFileSync(filePath);
    const loader = new PDFLoader(filePath);
    const rawDocs = await loader.load();

    if (!rawDocs.length) {
      console.warn(`Warning: No content extracted from ${filePath}`);
      return;
    }

    const cleanedDocs = rawDocs.map((doc) => ({
      ...doc,
      pageContent: cleanAndNormalizeText(doc.pageContent),
    }));
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.splitDocuments(cleanedDocs);

    // Upload to S3, in the future maybe use uuid
    // let s3Key = `financial-aid-docs/${metadata.academic_year}/${metadata.type}`;
    // if (metadata.state) s3Key += `/${metadata.state}/${metadata.filename}`;
    // else if (metadata.institution)
    //   s3Key += `/${metadata.institution}/${metadata.filename}`;
    // else s3Key += `/${metadata.filename}`;

    // TODO: SET UP AWS S3
    // await s3
    //   .upload({
    //     Bucket: process.env.AWS_S3_BUCKET_NAME!,
    //     Key: s3Key,
    //     Body: fileBuffer,
    //     ContentType: "application/pdf",
    //   })
    //   .promise();

    // metadata.s3_key = s3Key;

    console.log(`Generating embeddings for ${docs.length} chunks...`);

    if (metadata.type === "federal") {
      for (const doc of docs) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              { role: "system", content: classifyTagsPrompt },
              { role: "user", content: doc.pageContent },
            ],
            temperature: 0,
          });

          const parsed = JSON.parse(
            response.choices[0].message?.content || "{}"
          );

          doc.metadata = {
            ...doc.metadata,
            general_labels: parsed.general_labels || [],
            tags: parsed.financial_aid_tags || [],
          };

          console.log("Tags generated");
          console.log("General labels", doc.metadata.general_labels);
          console.log("Tags", doc.metadata.tags);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          console.error("Error tagging chunk", err.message || err);
        }
      }
    }

    await SupabaseVectorStore.fromDocuments(
      docs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          ...metadata,
          general_labels: doc.metadata.general_labels || [],
          tags: doc.metadata.tags || [],
        },
      })),
      embeddings,
      {
        client: supabase,
        tableName: "documents",
        queryName: "match_documents",
      }
    );

    console.log(`Stored ${docs.length} chunks from ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processDirectory(dirPath: string, metadata: any = {}) {
  const files = fs.readdirSync(dirPath);
  const dirName = path.basename(dirPath);
  console.log(`Processing directory: ${dirPath}`);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    const fileMetadata = { ...metadata };

    // Assign metadata based on directory type
    if (dirPath.includes("Federal")) {
      fileMetadata.type = "federal";
    } else if (dirPath.includes("States")) {
      fileMetadata.type = "state";
      fileMetadata.state = dirName.toLowerCase();
    } else if (dirPath.includes("Institutions")) {
      fileMetadata.type = "institution";
      fileMetadata.institution = dirName.toLowerCase();
    }

    if (stats.isDirectory()) {
      await processDirectory(filePath, fileMetadata);
    } else if (path.extname(file).toLowerCase() === ".pdf") {
      fileMetadata.filename = file;
      fileMetadata.academic_year = extractAcademicYear(file);
      await processDocument(filePath, fileMetadata);
    }
  }

  // const files = fs.readdirSync(dirPath);

  // console.log(`FILES FOR dirPath: ${dirPath}, `, files);

  // const tasks = files.map(async (file) => {
  //   const filePath = path.join(dirPath, file);
  //   const stats = fs.statSync(filePath);
  //   const fileMetadata = { ...metadata };

  //   if (dirPath.includes("Federal")) {
  //     fileMetadata.type = "federal";
  //   } else if (dirPath.includes("States")) {
  //     fileMetadata.type = "state";
  //     fileMetadata.state = file.toLowerCase();
  //   } else if (dirPath.includes("Institutions")) {
  //     fileMetadata.type = "institution";
  //     fileMetadata.institution = file.toLowerCase();
  //   }

  //   if (stats.isDirectory()) {
  //     return processDirectory(filePath, fileMetadata);
  //   } else if (path.extname(file).toLowerCase() === ".pdf") {
  //     fileMetadata.filename = file;
  //     fileMetadata.academic_year = extractAcademicYear(file);
  //     return processDocument(filePath, fileMetadata);
  //   }
  // });

  // for (const task of tasks) {
  //   await task; // Process files one at a time to avoid hitting API rate limits
  // }
  // if (tasks.length > 0) {
  //   await Promise.all(tasks);
  // }
}

async function main() {
  try {
    console.log("Starting document processing...");

    await processDirectory(path.join(__dirname, "..", "documents/Federal"), {
      type: "federal",
    });
    await processDirectory(path.join(__dirname, "..", "documents/States"), {
      type: "state",
    });
    await processDirectory(
      path.join(__dirname, "..", "documents/Institutions"),
      {
        type: "institution",
      }
    );

    console.log("Document processing complete!");
  } catch (error) {
    console.error("Fatal error in document processing:", error);
  }
}

main().catch(console.error);
