const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['subscriber', 'admin'],
    default: 'subscriber'
  },
  avatar: {
    type: String,
    default: null
  },
  // Subscription
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'inactive'
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly', null],
      default: null
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false }
  },
  // Charity
  selectedCharity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    default: null
  },
  charityContributionPercent: {
    type: Number,
    default: 10,
    min: 10,
    max: 100
  },
  // Profile
  handicap: {
    type: Number,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  return this.subscription.status === 'active' && 
    this.subscription.currentPeriodEnd > new Date();
};

module.exports = mongoose.model('User', userSchema);
