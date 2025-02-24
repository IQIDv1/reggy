// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function POST(req: NextRequest) {
//   try {
//     const { userId } = await req.json();
//     if (!userId) {
//       return NextResponse.json({ error: "Missing userId" }, { status: 400 });
//     }

//     // Delete the user from auth (this is the Admin API call)
//     const { error: authError } = await supabaseAdmin.auth.api.deleteUser(userId);
//     if (authError) {
//       console.error("Error deleting user from auth:", authError);
//       return NextResponse.json({ error: "Failed to delete user from auth" }, { status: 500 });
//     }

//     // Delete the user’s profile record (RLS ensures only own profile is deleted)
//     const { error: profileError } = await supabaseAdmin
//       .from("profiles")
//       .delete()
//       .eq("id", userId);
//     if (profileError) {
//       console.error("Error deleting user profile:", profileError);
//       return NextResponse.json({ error: "Failed to delete user profile" }, { status: 500 });
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Account deletion error:", error);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }
