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
const supabase = createClient(supabaseUrl, supabaseKey);
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openAIKey,
  model: embeddingsModel,
});

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

    await SupabaseVectorStore.fromDocuments(
      docs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          ...metadata,
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
