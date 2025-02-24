// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";

// export async function GET() {
//   const supabase = createRouteHandlerClient({ cookies });
//   // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
//   const { data, error } = await supabase.auth.getSession();

//   if (error) {
//     console.error("Auth callback error:", error.message);
//     redirect("/login?error=auth_failed");
//   }

//   redirect("/dashboard"); // Redirect authenticated users to dashboard
// }
