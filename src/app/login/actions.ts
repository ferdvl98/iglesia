"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function autenticar(
  _prevError: string | null,
  formData: FormData,
): Promise<string | null> {
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Correo o contraseña incorrectos.";
    }
    throw error;
  }
}
