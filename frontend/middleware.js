import { NextResponse } from "next/server";

const STAFF_LOGIN = "https://brgydesk.com/login";

function hostOnly(hostHeader) {
  return String(hostHeader || "")
    .toLowerCase()
    .split(":")[0];
}

function isAllowedLoginHost(host) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "brgydesk.com"
  );
}

export function middleware(request) {
  const host = hostOnly(request.headers.get("host"));
  const { pathname, search } = request.nextUrl;

  if (host === "www.brgydesk.com" && pathname.startsWith("/login")) {
    return NextResponse.redirect(
      new URL(`${STAFF_LOGIN}${search || ""}`),
      301,
    );
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (!isAllowedLoginHost(host)) {
      return NextResponse.redirect(new URL(`${STAFF_LOGIN}${search || ""}`), 302);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/login/:path*"],
};
