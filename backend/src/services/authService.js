const User = require('../models/User');
const generateToken = require('../utils/generateToken');

class AuthService {
  static async register(userData) {
    const { name, email, password, phone } = userData;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const error = new Error('Email already in use.');
      error.statusCode = 409;
      throw error;
    }

    let user;
    try {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        phone,
        role: 'student',
      });
    } catch (error) {
      if (error.code === 11000) {
        const duplicateError = new Error('Email already in use.');
        duplicateError.statusCode = 409;
        throw duplicateError;
      }
      throw error;
    }

    const token = generateToken(user);

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  static async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('This account is inactive.');
      error.statusCode = 401;
      throw error;
    }

    return {
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  }
}

module.exports = AuthService;
