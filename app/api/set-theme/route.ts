import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ApiResponse } from "@/lib/types";
import { AppError, handleApiError } from "@/lib/error-handler";

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const { theme } = await request.json();

    if (theme !== "light" && theme !== "dark")
      throw new AppError("Invalid theme", 400);

    cookies().set("theme", theme, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
