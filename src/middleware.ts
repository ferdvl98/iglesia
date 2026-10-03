import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/configuracion-inicial"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && !isPublic) {
    if (nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si la cuenta se desactivó o cambió, requireSesion() manda a /login con este
  // parámetro aunque la cookie siga siendo válida: rebotar al dashboard aquí
  // produciría un bucle infinito entre el middleware y la página.
  const sesionInvalidada = nextUrl.searchParams.get("motivo") === "sesion";

  if (isLoggedIn && isPublic && !sesionInvalidada) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Lo que queda fuera son rutas públicas por necesidad: el endpoint de
  // NextAuth, los estáticos de Next y los archivos que el navegador pide sin
  // cookies (el ícono se pide incluso antes de iniciar sesión, así que si el
  // middleware lo intercepta la pestaña se queda sin favicon).
  matcher: [
    "/((?!api/auth|_next/static|_next/data|favicon.ico|icon.svg|apple-icon|robots.txt|sitemap.xml).*)",
  ],
};
