import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name or organization name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    emailVerified: { type: Boolean, default: false },
    lastRegistrationEmailAt: { type: Date, select: false },
    registrationOtp: {
      type: new mongoose.Schema({
        id: String, hash: String, expiresAt: Date, attempts: Number,
      }, { _id: false }),
      select: false,
    },
    lastAuthEmailAt: { type: Date, select: false },
    authCode: {
      type: new mongoose.Schema({
        id: String, hash: String, purpose: { type: String, enum: ['verify', 'login'] },
        expiresAt: Date, sentAt: Date, attempts: Number,
      }, { _id: false }),
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['client', 'developer'],
        message: '{VALUE} is not a valid role. Choose "client" or "developer"',
      },
      required: [true, 'User role is required'],
    },
    country: {
      type: String,
      default: 'Nigeria',
      trim: true,
    },
    city: {
      type: String,
      default: 'Lagos',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    // Developer profile details
    skills: {
      type: [String],
      default: [],
    },
    githubOrPortfolio: {
      type: String,
      trim: true,
      default: '',
    },
    // Client profile details
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
