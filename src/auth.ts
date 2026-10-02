import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

/** Tras 5 contraseñas erradas la cuenta queda bloqueada 10 minutos. */
const MAX_INTENTOS_LOGIN = 5;
const BLOQUEO_MINUTOS = 10;

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

        // Cuenta bloqueada por intentos fallidos: ni siquiera se compara el
        // hash, para no dar una señal de tiempo distinta.
        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
          return null;
        }

        const valido = await bcrypt.compare(password, usuario.passwordHash);

        if (!valido) {
          const intentos = usuario.intentosFallidos + 1;
          await prisma.usuario.update({
            where: { id: usuario.id },
            data:
              intentos >= MAX_INTENTOS_LOGIN
                ? {
                    intentosFallidos: 0,
                    bloqueadoHasta: new Date(Date.now() + BLOQUEO_MINUTOS * 60_000),
                  }
                : { intentosFallidos: intentos },
          });
          return null;
        }

        if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { intentosFallidos: 0, bloqueadoHasta: null },
          });
        }

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
