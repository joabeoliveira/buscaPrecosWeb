import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'helper' | 'auditor' | 'user';
}

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

/**
 * Sign a JWT token with user data.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
