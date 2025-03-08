/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { AppError, handleApiError } from "@/lib/error-handler";
import type { ApiResponse, MessageRole } from "@/lib/types";
import { APP_NAME, completionsModel } from "@/lib/constants";
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

    // TODO: Avoid searching for docs if the query is not related to the search
    const { data: messagesHistory, error: messagesError } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true })
      .returns<{ role: MessageRole; content: string }[]>()
      .limit(20);

    if (messagesError) throw messagesError;

    const systemMessage =
      `You are ${APP_NAME}, an AI assistant specializing in financial aid regulations.` +
      " Your primary role is to answer questions related to financial aid." +
      " You may engage in basic human conversation (e.g., 'hi', 'how are you', 'what is your name')." +
      " If a user asks for your name, respond with your name." +
      " If a user shares their name, **remember it throughout the conversation** and use it naturally in responses." +
      " If the user later asks for their name, recall it correctly." +
      ' If a question is completely unrelated to financial aid **and is not part of basic conversation**, respond: "I\'m here to help with financial aid questions. Let me know if you need assistance with that!"' +
      " Your responses must be **clear, concise, and strictly factual**." +
      " Aim for a response length of **exactly 3 sentences**, but you may use **up to 5** if necessary." +
      " Never exceed 5 sentences. If a shorter response is sufficient, keep it brief." +
      " Ensure that your responses **naturally conclude** rather than stopping mid-sentence." +
      " Base your responses **only** on the most relevant documents and extracted filters." +
      " If you do not know the answer, state that clearly rather than making something up.";

    const messages: { role: MessageRole; content: string }[] = [
      {
        role: "system",
        content: systemMessage,
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
      max_completion_tokens: 180,
      stop: [".\n"],
    });

    let reggyResponse = completion.choices[0].message.content;

    if (!reggyResponse) throw new AppError("Something went wrong", 500);

    const sentences = reggyResponse.match(/[^.!?]+[.!?]/g) || [];
    if (sentences.length > 5) {
      reggyResponse = sentences.slice(0, 5).join(" ");
    }

    const { error: userMessageError } = await supabase
      .from("chat_messages")
      .insert({
        session_id,
        role: "user",
        content: query.trim(),
      });

    if (userMessageError) {
      throw new AppError("Message failed to send", 500);
    }

    const { error: reggyMessageError } = await supabase
      .from("chat_messages")
      .insert({
        session_id,
        role: "assistant",
        content: reggyResponse,
      });

    if (reggyMessageError) {
      throw new AppError("Reggy failed to respond", 500);
    }

    // TODO: If this is the first message in the chat, rename the session to something relevant

    return NextResponse.json({ success: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return handleApiError(error);
  }
}
