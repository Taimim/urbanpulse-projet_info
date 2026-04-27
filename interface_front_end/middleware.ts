import { NextRequest, NextResponse } from "next/server";

const CHEMINS_PUBLICS = new Set(["/", "/authentification", "/authentification/logout", "/recherche"]);
const PREFIXES_SIMPLE = ["/utilisateur"];
const PREFIXES_COMPLEXE = ["/gestion"];
const PREFIXES_ADMIN = ["/administration"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tableRedirections: Record<string, string> = {
    "/admin": "/administration",
    "/auth": "/authentification",
    "/auth/logout": "/authentification/logout",
    "/management": "/gestion",
    "/user": "/utilisateur",
    "/search": "/recherche",
    "/user/dashboard": "/gestion/objets",
    "/user/profile": "/utilisateur/profil",
    "/user/members": "/utilisateur/membres",
    "/user/items-services": "/utilisateur/objets-services",
    "/user/levels-points": "/utilisateur/niveaux-points",
    "/management/items": "/gestion/objets",
    "/management/reports": "/gestion/rapports",
    "/admin/users": "/administration/utilisateurs",
    "/admin/validation": "/administration/validation",
    "/admin/categories": "/administration/categories",
    "/admin/rules": "/administration/regles",
    "/admin/customization": "/administration/personnalisation",
    "/admin/reports": "/administration/rapports",
  };

  if (tableRedirections[pathname]) {
    return NextResponse.redirect(new URL(tableRedirections[pathname], request.url));
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  const jeton = request.cookies.get("auth_token")?.value;
  const roleUtilisateur = request.cookies.get("user_role")?.value?.toLowerCase();

  if (!jeton && !CHEMINS_PUBLICS.has(pathname)) {
    return NextResponse.redirect(new URL("/authentification", request.url));
  }

  if (!jeton) {
    return NextResponse.next();
  }

  if (pathname === "/authentification") {
    const destination =
      roleUtilisateur === "administrateur"
        ? "/administration/utilisateurs"
        : roleUtilisateur === "complexe"
          ? "/gestion/objets"
          : "/gestion/objets";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (PREFIXES_ADMIN.some((prefixe) => pathname.startsWith(prefixe)) && roleUtilisateur !== "administrateur") {
    return NextResponse.redirect(new URL("/gestion/objets", request.url));
  }

  if (
    PREFIXES_COMPLEXE.some((prefixe) => pathname.startsWith(prefixe)) &&
    pathname !== "/gestion/objets" &&
    roleUtilisateur !== "complexe" &&
    roleUtilisateur !== "administrateur"
  ) {
    return NextResponse.redirect(new URL("/gestion/objets", request.url));
  }

  if (
    PREFIXES_SIMPLE.some((prefixe) => pathname.startsWith(prefixe)) &&
    !["simple", "complexe", "administrateur"].includes(roleUtilisateur ?? "")
  ) {
    return NextResponse.redirect(new URL("/authentification", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
