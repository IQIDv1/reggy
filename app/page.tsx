import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PAGE_ROUTES } from "@/lib/constants";
import { SidebarProvider } from "@/components/ui/sidebar";
import Chat from "@/components/chat";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect(PAGE_ROUTES.LOGIN);
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  // TODO: Better error handling here
  if (profileError || !profileData) {
    redirect(PAGE_ROUTES.LOGIN);
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Chat user={profileData} />
    </SidebarProvider>
  );
}
