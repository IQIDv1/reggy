import { AppError, handleApiError } from "@/lib/error-handler";
import { loginSchema } from "@/lib/schema";
import { createClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse>> {
  try {
    const formObject = await request.json();
    const supabase = await createClient();
    const validation = loginSchema.safeParse(formObject);
    if (!validation.success) throw new AppError("Invalid request", 400);

    const { email, password } = validation.data;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new AppError(error.message, 400);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
