import { NextResponse } from "next/server";
import type { ApiResponse } from "./types";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleApiError(error: any): NextResponse<ApiResponse> {
  // console.error("API Error:", {
  //   message: error?.message || error,
  //   stack: error?.stack || "No stack trace",
  // });
  console.error("API Error:", error);
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: "An unknown error occurred" },
    { status: 500 }
  );
}
