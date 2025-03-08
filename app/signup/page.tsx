"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_ROUTES, APP_LOGO, APP_NAME, PAGE_ROUTES } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { signupSchema } from "@/lib/schema";
import { useToast } from "@/components/ui/use-toast";

export default function Signup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const formObject = Object.fromEntries(formData.entries());
    const validation = signupSchema.safeParse(formObject);

    if (!validation.success) {
      const errors = validation.error.format();
      const errorMessage =
        errors.email?._errors[0] ||
        errors.name?._errors[0] ||
        errors.institution?._errors[0] ||
        errors.password?._errors[0] ||
        "Something went wrong";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const response = await fetch(API_ROUTES.SIGNUP, {
      method: "POST",
      body: JSON.stringify(validation.data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      router.push(PAGE_ROUTES.HOME);
      router.refresh();
    } else {
      const data = await response.json();
      toast({
        title: data.error,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="mb-8">
        <Image
          src={APP_LOGO}
          alt="IQ/ID Logo"
          width={180}
          height={60}
          priority
        />
      </div>
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign up for {APP_NAME}</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" name="institution" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href={PAGE_ROUTES.LOGIN}
              className="font-medium text-primary hover:text-primary/80"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
