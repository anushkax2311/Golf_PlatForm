const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,
  image: String
});

const charitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Charity name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  logo: String,
  coverImage: String,
  images: [String],
  website: String,
  email: String,
  phone: String,
  address: String,
  category: {
    type: String,
    enum: ['health', 'education', 'environment', 'community', 'sports', 'animals', 'arts', 'other'],
    default: 'other'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  events: [eventSchema],
  totalReceived: {
    type: Number,
    default: 0
  },
  subscriberCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate slug
charitySchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('Charity', charitySchema);
