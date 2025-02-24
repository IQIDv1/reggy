import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError, handleApiError } from "@/lib/error-handler";
import { Feedback, type ApiResponse } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.enum(["positive", "negative"]),
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new AppError("Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = feedbackSchema.parse(body);

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        message_id: validatedData.messageId,
        user_id: session.user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
      })
      .select("*")
      .returns<Feedback[]>()
      .single();

    if (error) {
      throw new AppError("Failed to submit feedback", 500);
    }

    return NextResponse.json({
      success: true,
      data: { feedback: data },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
