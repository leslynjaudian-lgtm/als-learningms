import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'als-lms-jwt-secret-key-naawan-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a payload into a JWT
 * @param {object} payload - { userId, username, role, profileId, ... }
 * @returns {string} token
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT string
 * @param {string} token
 * @returns {object} decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
