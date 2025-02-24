// import dotenv from "dotenv";
// dotenv.config();

//MAKE SURE TO ADD THIS SCRIPT IN PACKAGE.JSON
//     "fine-tune": "ts-node scripts/fine_tune_model.ts"

// // import { OpenAI } from "langchain/llms/openai";
// import OpenAI from "openai";
// import { createClient } from "@supabase/supabase-js";
// import fs from "fs";
// import path from "path";
// import { FINE_TUNE_MODEL_ID_FILE } from "@/lib/constants";

// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const env = process.env.NODE_ENV || "development";
// const supabaseUrl =
//   env === "production"
//     ? process.env.PROD_SUPABASE_URL
//     : process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseKey =
//   env === "production"
//     ? process.env.PROD_SUPABASE_SERVICE_ROLE_KEY
//     : process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!supabaseUrl || !supabaseKey) {
//   throw new Error("Missing required environment variables");
// }

// const supabase = createClient(supabaseUrl, supabaseKey);

// async function shouldFineTune() {
//   const { count } = await supabase
//     .from("chat_messages")
//     .select("*", { count: "exact", head: true });

//   const lastFineTuneDate = getLastFineTuneDate();
//   const oneMonthAgo = new Date();
//   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

//   return count === 1000 || (lastFineTuneDate && lastFineTuneDate < oneMonthAgo);
// }

// function getLastFineTuneDate() {
//   const filePath = path.join(__dirname, "..", "last_fine_tune_date.txt");
//   if (fs.existsSync(filePath)) {
//     const dateString = fs.readFileSync(filePath, "utf-8");
//     return new Date(dateString);
//   }
//   return null;
// }

// function updateLastFineTuneDate() {
//   const filePath = path.join(__dirname, "..", "last_fine_tune_date.txt");
//   fs.writeFileSync(filePath, new Date().toISOString());
// }

// async function prepareTrainingData() {
//   const { data, error } = await supabase
//     .from("chat_messages")
//     .select("content, role, chat_sessions(title)")
//     .order("created_at", { ascending: true });

//   if (error) {
//     throw new Error(`Error fetching training data: ${error.message}`);
//   }

//   const trainingData = data.reduce((acc: any[], message: any) => {
//     if (message.role === "user") {
//       acc.push({
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are Reggy, an AI assistant specializing in financial aid regulations.",
//           },
//           { role: "user", content: message.content },
//         ],
//       });
//     } else if (message.role === "assistant" && acc.length > 0) {
//       acc[acc.length - 1].messages.push({
//         role: "assistant",
//         content: message.content,
//       });
//     }
//     return acc;
//   }, []);

//   return trainingData;
// }

// async function fineTuneModel(trainingData: any) {
//   const tempFilePath = path.join(__dirname, "training_data.jsonl");

//   // Write training data to a temporary file
//   fs.writeFileSync(tempFilePath, trainingData.map(JSON.stringify).join("\n"));

//   try {
//     // Upload the file
//     const file = await openai.files.create({
//       file: fs.createReadStream(tempFilePath),
//       purpose: "fine-tune",
//     });

//     // Create a fine-tuning job
//     const fineTune = await openai.fineTuning.jobs.create({
//       training_file: file.id,
//       model: "gpt-3.5-turbo",
//     });

//     console.log(`Fine-tuning job created: ${fineTune.id}`);

//     // Poll for job status
//     let job;
//     do {
//       await new Promise((resolve) => setTimeout(resolve, 5000));
//       job = await openai.fineTuning.jobs.retrieve(fineTune.id);
//       console.log(`Status: ${job.status}`);
//     } while (job.status !== "succeeded" && job.status !== "failed");

//     if (job.status === "succeeded") {
//       console.log(`Fine-tuned model created: ${job.fine_tuned_model}`);
//       return job.fine_tuned_model;
//     } else {
//       throw new Error("Fine-tuning failed");
//     }
//   } finally {
//     // Clean up the temporary file
//     fs.unlinkSync(tempFilePath);
//   }
// }

// async function main() {
//   try {
//     if (await shouldFineTune()) {
//       const trainingData = await prepareTrainingData();
//       const fineTunedModelId = await fineTuneModel(trainingData);

//       // Save the fine-tuned model ID to a file
//       const modelIdPath = path.join(__dirname, "..", FINE_TUNE_MODEL_ID_FILE);
//       fs.writeFileSync(modelIdPath, fineTunedModelId);
//       console.log(`Fine-tuned model ID saved to ${modelIdPath}`);

//       updateLastFineTuneDate();

//       console.log("Fine-tuning complete!");
//     } else {
//       console.log("Fine-tuning not needed at this time.");
//     }
//   } catch (error) {
//     console.error("Error during fine-tuning:", error);
//   }
// }

// main();
