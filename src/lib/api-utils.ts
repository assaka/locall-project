// lib/api-utils.ts
import { NextRequest } from 'next/server';

export interface AuthResult {
  isValid: boolean;
  userId?: string;
  error?: string;
}

export function authenticateAPI(request: NextRequest): AuthResult {
  // For demo purposes, we'll use a simple authentication
  // In production, you should implement proper JWT verification
  
  const authHeader = request.headers.get('authorization');
  const userId = request.headers.get('x-user-id');
  
  // Check for API key or demo mode
  if (authHeader === `Bearer ${process.env.API_SECRET}` || process.env.NODE_ENV === 'development') {
    return {
      isValid: true,
      userId: userId || 'demo-user-id'
    };
  }

  // Check for user ID in header (simplified auth)
  if (userId) {
    return {
      isValid: true,
      userId
    };
  }

  return {
    isValid: false,
    error: 'Authentication required'
  };
}

export function successResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify({
    success: true,
    ...data
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
