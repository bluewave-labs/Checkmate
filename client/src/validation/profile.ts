import { z } from "zod";

export const profileSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: "First Name must be at least one char" })
      .optional(),
    lastName: z
      .string()
      .min(1, { message: "Last Name must be at least one char" })
      .optional(),
    password: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z
        .string()
        .min(6, { message: "Password must be at least 6 characters" })
        .optional()
    ),
    confirmPassword: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z
        .string()
        .min(6, { message: "Confirm Password must be at least 6 characters" })
        .optional()
    ),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;

      if (!data.password || !data.confirmPassword) return false;

      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords must match",
      path: ["confirmPassword"],
    }
  );

