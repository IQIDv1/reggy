import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),
  password: z.string(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  institution: z
    .string()
    .trim()
    .min(2, "Institution must be at least 2 characters long"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .trim()
    .min(6, "Password must be at least 6 characters long"),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

export const fineTuneSchema = z.object({
  modelId: z.string().optional(),
  trainingData: z.array(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })
      ),
    })
  ),
});
