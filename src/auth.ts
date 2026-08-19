import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { iglesia: true, rol: true },
        });
        if (!usuario || !usuario.activo) return null;

        const valido = await bcrypt.compare(password, usuario.passwordHash);
        if (!valido) return null;

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          esSuperAdmin: usuario.esSuperAdmin,
          esAdministrador: usuario.rol?.esAdministrador ?? false,
          rolId: usuario.rolId,
          rolNombre: usuario.rol?.nombre ?? null,
          permisos: usuario.rol?.permisos ?? [],
          iglesiaId: usuario.iglesiaId,
          iglesiaNombre: usuario.iglesia?.nombre ?? null,
        };
      },
    }),
  ],
});
