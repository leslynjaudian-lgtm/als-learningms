import { verifyToken } from '../config/jwt.js';
import prisma from '../config/prisma.js';

/**
 * Middleware: Verify JWT Bearer token and attach user to request
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format.' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Session expired or invalid token. Please sign in again.' });
    }

    // Verify user still exists and is ACTIVE
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
          },
        },
        learnerProfile: {
          include: {
            learningCenter: true,
            assignedTeacher: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Account not found or inactive.' });
    }

    // Attach user details to request
    req.user = {
      id: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      adminProfile: user.adminProfile,
      teacherProfile: user.teacherProfile,
      learnerProfile: user.learnerProfile,
      profileId:
        user.role === 'ADMIN'
          ? user.adminProfile?.id
          : user.role === 'TEACHER'
          ? user.teacherProfile?.id
          : user.learnerProfile?.id,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Enforce role-based access control
 * @param {string|string[]} roles - Single role or array of allowed roles
 */
export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This action is restricted to [${allowed.join(', ')}] role.`,
      });
    }
    next();
  };
}

/**
 * Middleware: Optional authentication (doesn't fail if no token)
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        adminProfile: true,
        teacherProfile: {
          include: {
            learningCenter: true,
          },
        },
        learnerProfile: {
          include: {
            learningCenter: true,
            assignedTeacher: true,
          },
        },
      },
    });
    if (user && user.status === 'ACTIVE') {
      req.user = {
        id: user.id,
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        adminProfile: user.adminProfile,
        teacherProfile: user.teacherProfile,
        learnerProfile: user.learnerProfile,
        profileId:
          user.role === 'ADMIN'
            ? user.adminProfile?.id
            : user.role === 'TEACHER'
            ? user.teacherProfile?.id
            : user.learnerProfile?.id,
      };
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}
