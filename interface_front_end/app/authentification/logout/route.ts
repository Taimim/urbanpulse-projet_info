import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("user_role", "", { path: "/", maxAge: 0 });
  return response;
}
