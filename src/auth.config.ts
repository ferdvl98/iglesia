import type { NextAuthConfig } from "next-auth";

/**
 * Config ligera sin providers (Credentials usa Prisma/bcrypt, no compatibles
 * con el Edge Runtime del middleware). Se combina con los providers en auth.ts,
 * que solo se importa desde código que corre en runtime Node.js.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.esSuperAdmin = user.esSuperAdmin;
        token.esAdministrador = user.esAdministrador;
        token.rolId = user.rolId;
        token.rolNombre = user.rolNombre;
        token.permisos = user.permisos;
        token.iglesiaId = user.iglesiaId;
        token.iglesiaNombre = user.iglesiaNombre;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.esSuperAdmin = Boolean(token.esSuperAdmin);
        session.user.esAdministrador = Boolean(token.esAdministrador);
        session.user.rolId = (token.rolId as string | null) ?? null;
        session.user.rolNombre = (token.rolNombre as string | null) ?? null;
        session.user.permisos = (token.permisos as typeof session.user.permisos) ?? [];
        session.user.iglesiaId = (token.iglesiaId as string | null) ?? null;
        session.user.iglesiaNombre = (token.iglesiaNombre as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
