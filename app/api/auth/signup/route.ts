import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApiResponse } from "@/lib/types";
import { AppError, handleApiError } from "@/lib/error-handler";
import { signupSchema } from "@/lib/schema";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const formObject = await request.json();
    const supabase = await createClient();
    const validation = signupSchema.safeParse(formObject);
    if (!validation.success) throw new AppError("Invalid request", 400);

    const { email, password, name, institution } = validation.data;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: { name, institution },
        },
      }
    );

    if (signUpError) throw new AppError(signUpError.message, 400);
    if (!signUpData.user)
      throw new AppError("Failed to create an account", 500);

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: signUpData.user.id,
        name,
        institution,
        email,
      },
    ]);

    if (profileError) {
      console.error("Supabase Profile Insert Error:", profileError);
      throw new AppError("Failed to save user profile", 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
