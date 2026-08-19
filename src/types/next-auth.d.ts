import type { DefaultSession } from "next-auth";
import type { Permiso } from "@prisma/client";

declare module "next-auth" {
  interface User {
    esSuperAdmin?: boolean;
    esAdministrador?: boolean;
    rolId?: string | null;
    rolNombre?: string | null;
    permisos?: Permiso[];
    iglesiaId?: string | null;
    iglesiaNombre?: string | null;
  }

  interface Session {
    user: {
      id: string;
      esSuperAdmin: boolean;
      esAdministrador: boolean;
      rolId: string | null;
      rolNombre: string | null;
      permisos: Permiso[];
      iglesiaId: string | null;
      iglesiaNombre: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    esSuperAdmin?: boolean;
    esAdministrador?: boolean;
    rolId?: string | null;
    rolNombre?: string | null;
    permisos?: Permiso[];
    iglesiaId?: string | null;
    iglesiaNombre?: string | null;
  }
}
