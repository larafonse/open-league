const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'USA'
    }
  },
  capacity: {
    type: Number,
    min: 0
  },
  surface: {
    type: String,
    enum: ['Grass', 'Artificial Turf', 'Indoor', 'Other'],
    default: 'Grass'
  },
  amenities: [{
    type: String
  }],
  contact: {
    name: String,
    phone: String,
    email: String
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for full address
venueSchema.virtual('fullAddress').get(function() {
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.state) parts.push(this.address.state);
  if (this.address.zipCode) parts.push(this.address.zipCode);
  if (this.address.country) parts.push(this.address.country);
  return parts.join(', ');
});

venueSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Venue', venueSchema);

