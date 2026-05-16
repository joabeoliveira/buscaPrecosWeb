import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export type UserRole = 'super_admin' | 'admin' | 'helper' | 'auditor' | 'user' | 'client_admin' | 'client_buyer';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  client_id?: string | null;
}

const INTERNAL_ROLES: UserRole[] = ['super_admin', 'admin', 'helper', 'auditor', 'user'];
const CLIENT_ROLES: UserRole[] = ['client_admin', 'client_buyer'];

/**
 * Verify JWT token from Authorization header.
 * Returns the decoded payload or null if invalid.
 */
export function verifyAuth(request: NextRequest): JwtPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function isInternalUser(user: JwtPayload): boolean {
  return INTERNAL_ROLES.includes(user.role);
}

export function isClientUser(user: JwtPayload): boolean {
  return CLIENT_ROLES.includes(user.role);
}

export function hasRole(user: JwtPayload, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function canAccessClient(user: JwtPayload, clientId: string | null | undefined): boolean {
  if (isInternalUser(user)) return true;
  if (!isClientUser(user) || !user.client_id || !clientId) return false;
  return user.client_id === clientId;
}

export function requireAuth(request: NextRequest): JwtPayload | NextResponse {
  const user = verifyAuth(request);
  if (!user) return unauthorizedResponse();
  return user;
}

export function requireInternalAuthOrN8nToken(request: NextRequest): JwtPayload | true | NextResponse {
  const configuredToken = process.env.N8N_API_TOKEN;
  const providedToken = request.headers.get('x-n8n-token') || new URL(request.url).searchParams.get('token');

  if (configuredToken && providedToken === configuredToken) return true;

  const user = requireAuth(request);
  if (user instanceof NextResponse) return user;
  if (!isInternalUser(user)) return forbiddenResponse();
  return user;
}

export function unauthorizedResponse(message = 'Autenticação obrigatória') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Acesso negado') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Sign a JWT token with user data.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
