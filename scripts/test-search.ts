import "dotenv/config";
import { queryVectorStore } from "@/lib/vectorStore";
import { extractFilters } from "@/lib/utils";

async function main() {
  const query =
    "Who is responsible for the overaward created when a student completes the Clock-Hour program early and graduates?";
  const filters = extractFilters(query);
  console.log("Extracted filters", filters);
  const relevantDocs = await queryVectorStore(query, filters);
  const documentContext = relevantDocs
    .map((doc) => doc.pageContent)
    .join("\n\n");

  console.log("Document context", documentContext);
}

main().catch((err) => console.log(err));
