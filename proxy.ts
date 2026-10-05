import { type NextRequest, NextResponse } from "next/server";

class BoundedRateLimitMap {
  private map = new Map<string, { count: number; resetAt: number }>();
  private maxEntries = 10000;

  get(ip: string): { count: number; resetAt: number } | undefined {
    const entry = this.map.get(ip);
    if (entry && Date.now() > entry.resetAt) {
      this.map.delete(ip);
      return undefined;
    }
    return entry;
  }

  set(ip: string, count: number, resetAt: number) {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(ip, { count, resetAt });
  }

  increment(ip: string): boolean {
    const now = Date.now();
    const entry = this.get(ip);

    if (!entry) {
      this.set(ip, 1, now + RATE_LIMIT_WINDOW);
      return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) return false;
    this.set(ip, entry.count + 1, entry.resetAt);
    return true;
  }
}

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW = 60 * 1000;
const rateLimiter = new BoundedRateLimitMap();

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api/")) {
    const ip = getClientIp(request);
    if (!rateLimiter.increment(ip)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429 }
      );
    }
  }

  const response = NextResponse.next();

  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
