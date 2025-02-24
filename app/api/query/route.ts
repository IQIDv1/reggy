/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { AppError, handleApiError } from "@/lib/error-handler";
import type { ApiResponse, MessageRole } from "@/lib/types";
import { APP_NAME, completionsModel, embeddingsModel } from "@/lib/constants";
import { extractFilters } from "@/lib/utils";
import { queryVectorStore } from "@/lib/vectorStore";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { query, session_id } = await req.json();
    if (!query || !session_id) throw new AppError("Message is required", 400);

    const supabase = await createClient();

    // // Extract user ID for logging, analytics, or rate limiting
    // const { data: user, error: userError } = await supabase.auth.getUser();
    // if (!user || userError) throw new AppError("Invalid user", 401);

    const filters = extractFilters(query);
    const relevantDocs = await queryVectorStore(query, filters);
    const documentContext = relevantDocs
      .map((doc) => doc.pageContent)
      .join("\n\n");

    // throw new AppError("Breakpoint", 400);

    // TODO: Avoid searching for docs if the query is not related to the search

    const { data: messagesHistory, error: messagesError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .returns<{ role: MessageRole; content: string }[]>()
      .limit(20);

    if (messagesError) throw messagesError;

    const messages: { role: MessageRole; content: string }[] = [
      {
        role: "system",
        content: `You are ${APP_NAME}, an AI assistant specializing in financial aid regulations. 
        Provide clear, concise, and **factual answers** in exactly **3-5 sentences**. 
        Do not exceed this limit. Base your response only on the most relevant documents found and the extracted filters. 
        If the answer is unknown, state that clearly instead of making something up.`,
      },
      ...messagesHistory.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: `User's Question: ${query}\n\nExtracted Filters: ${JSON.stringify(
          filters,
          null,
          2
        )}`,
      },
    ];

    if (documentContext) {
      messages.push({
        role: "assistant",
        content: `Here are the most relevant documents of information based on your filters:\n\n${documentContext}`,
      });
    } else {
      // TODO: Verify this
      messages.push({
        role: "assistant",
        content:
          "I could not find relevant documents of information based on your filters",
      });
    }

    const completion = await openai.chat.completions.create({
      model: completionsModel,
      messages,
      temperature: 0.5,
      max_completion_tokens: 150,
    });

    const reggyResponse = completion.choices[0].message.content;

    if (!reggyResponse) throw new AppError("Something went wrong", 500);

    await supabase.from("chat_messages").insert([
      { session_id, role: "user", content: query.trim() },
      { session_id, role: "assistant", content: reggyResponse },
    ]);

    // TODO: If this is the first message in the chat, rename the session to something relevant

    return NextResponse.json({ success: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiError(error);
  }
}
