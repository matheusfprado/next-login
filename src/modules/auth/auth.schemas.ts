import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256).optional().or(z.literal("")),
  password: z.string().min(8).max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(100),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "A nova senha deve ser diferente.",
    path: ["newPassword"],
  });
