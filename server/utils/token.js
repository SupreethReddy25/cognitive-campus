const jwt = require('jsonwebtoken');

/**
 * Signs the session token. The role is embedded so admin checks need no database round trip.
 *
 * @param {{ _id: *, email: string, role?: string }} user - A user document (or lean object)
 * @returns {string} JWT
 */
const signToken = (user) => jwt.sign(
  { userId: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
);

/** The user fields that are safe to send to the browser after login or register. */
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  xp: user.xp,
  level: user.level,
  streak: user.streak,
  role: user.role
});

module.exports = { signToken, publicUser };
