import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  verifyRefreshToken,
  verifyAccessToken,
} from '../utils/jwt.js';
import { createUser, findUserByEmail, findUserById } from '../models/user.js';
import {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokensByUserId,
} from '../models/refreshToken.js';
import { signupSchema, loginSchema, refreshTokenSchema } from '../utils/validation.js';
import { publishUserRegistered, publishUserLoggedIn } from '../utils/events.js';
import type { AuthResponse } from '../types/index.js';

export async function handleSignup(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await findUserByEmail(validated.email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(validated.password);
    const user = await createUser(
      validated.email,
      hashedPassword,
      validated.role,
      validated.displayName,
    );

    // Generate tokens
    const jwtPayload = {
      userId: user._id!,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // Store refresh token
    const expiresAt = getRefreshTokenExpiry();
    await createRefreshToken(user._id!, refreshToken, expiresAt);

    // Publish event
    await publishUserRegistered({
      userId: user._id!,
      email: user.email,
      role: user.role,
      timestamp: new Date(),
    });

    const response: AuthResponse = {
      user: {
        id: user._id!,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Validation error', details: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleLogin(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    // Find user
    const user = await findUserByEmail(validated.email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(validated.password, user.password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate tokens
    const jwtPayload = {
      userId: user._id!,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // Store refresh token
    const expiresAt = getRefreshTokenExpiry();
    await createRefreshToken(user._id!, refreshToken, expiresAt);

    // Publish event
    await publishUserLoggedIn({
      userId: user._id!,
      email: user.email,
      timestamp: new Date(),
    });

    const response: AuthResponse = {
      user: {
        id: user._id!,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Validation error', details: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleRefresh(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = refreshTokenSchema.parse(body);

    // Verify refresh token
    const payload = verifyRefreshToken(validated.refreshToken);

    // Check if refresh token exists in database
    const storedToken = await findRefreshToken(validated.refreshToken);
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return new Response(JSON.stringify({ error: 'Invalid or expired refresh token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user to ensure they still exist
    const user = await findUserById(payload.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate new tokens
    const jwtPayload = {
      userId: user._id!,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(jwtPayload);
    const newRefreshToken = generateRefreshToken(jwtPayload);

    // Delete old refresh token and store new one
    await deleteRefreshToken(validated.refreshToken);
    const expiresAt = getRefreshTokenExpiry();
    await createRefreshToken(user._id!, newRefreshToken, expiresAt);

    const response: AuthResponse = {
      user: {
        id: user._id!,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return new Response(JSON.stringify({ error: 'Validation error', details: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (error.message.includes('Invalid or expired')) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleLogout(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const validated = refreshTokenSchema.parse(body);

    // Delete refresh token
    await deleteRefreshToken(validated.refreshToken);

    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return new Response(JSON.stringify({ error: 'Validation error', details: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleMe(request: Request): Promise<Response> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    // Get user
    const user = await findUserById(payload.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: user._id!,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid or expired')) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
