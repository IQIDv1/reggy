"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
// import Link from "next/link";
import { APP_LOGO, APP_NAME, PAGE_ROUTES } from "@/lib/constants";

export function ReggyHeader() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(PAGE_ROUTES.LOGIN);
  };

  return (
    <header className="flex items-center justify-between py-6">
      <div className="flex items-center gap-4">
        <Image
          src={APP_LOGO}
          alt="IQ/ID Logo"
          width={120}
          height={40}
          priority
          className="h-10 w-auto"
        />
        <h1 className="text-xl font-medium text-secondary dark:text-secondary-foreground">
          {APP_NAME}, your regulatory research partner
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* <Link href="/settings">
          <Button variant="ghost">Settings</Button>
        </Link> */}
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
    </header>
  );
}
