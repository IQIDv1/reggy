/* eslint-disable @typescript-eslint/no-explicit-any */

import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { SupabaseVectorStore } from "langchain/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { embeddingsModel } from "./constants";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openAIKey = process.env.OPENAI_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function queryVectorStore(
  query: string,
  filters: Record<string, any> = {}
) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: openAIKey,
    model: embeddingsModel,
  });

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "documents",
    queryName: "match_documents",
  });

  const results = await vectorStore.similaritySearch(query, 5, filters);
  return results;
}
