import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Privy exposes the client access token after login; it is not a `privy-token`
// cookie. Route protection and account provisioning therefore live in AuthGate,
// while every API route still verifies the Bearer token on the server.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
