// Geofence Model
import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  // Geofence boundary coordinates (polygon)
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of arrays of numbers [longitude, latitude]
      required: true
    }
  },
  // Center point for circular geofences
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    }
  },
  radius: {
    type: Number, // Radius in meters for circular geofences
    required: false
  },
  type: {
    type: String,
    enum: ['campus', 'transport', 'restricted', 'custom'],
    default: 'campus'
  },
  locationType: {
    type: String,
    enum: ['gate', 'classroom', 'library', 'office', 'playground', 'transport'],
    default: 'campus'
  },
  // Time restrictions
  timeRestrictions: {
    startTime: {
      type: String, // "HH:mm" format
      required: false
    },
    endTime: {
      type: String, // "HH:mm" format
      required: false
    },
    daysOfWeek: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  // User types allowed in this geofence
  allowedUserTypes: [{
    type: String,
    enum: ['student', 'teacher', 'staff', 'parent', 'admin']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
geofenceSchema.index({ institution: 1, isActive: 1 });
geofenceSchema.index({ type: 1, isActive: 1 });
geofenceSchema.index({ 'boundary.coordinates': '2dsphere' });
geofenceSchema.index({ 'center.coordinates': '2dsphere' });

// Static methods
geofenceSchema.statics.findByLocation = function(coordinates, institutionId) {
  return this.find({
    institution: institutionId,
    isActive: true,
    isDeleted: false,
    $or: [
      {
        'boundary.coordinates': {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            }
          }
        }
      },
      {
        center: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: this.radius || 1000
          }
        }
      }
    ]
  });
};

geofenceSchema.statics.getCampusGeofences = function(institutionId) {
  return this.find({
    institution: institutionId,
    type: 'campus',
    isActive: true,
    isDeleted: false
  });
};

geofenceSchema.statics.getTransportGeofences = function(institutionId) {
  return this.find({
    institution: institutionId,
    type: 'transport',
    isActive: true,
    isDeleted: false
  });
};

// Instance methods
geofenceSchema.methods.isWithinBoundary = function(coordinates) {
  if (this.boundary && this.boundary.coordinates) {
    // Check if point is within polygon
    return mongoose.Types.ObjectId.isValid(coordinates[0]) && 
           mongoose.Types.ObjectId.isValid(coordinates[1]);
  }
  
  if (this.center && this.radius) {
    // Check if point is within circular boundary
    const center = this.center.coordinates;
    const [lon1, lat1] = center;
    const [lon2, lat2] = coordinates;
    
    // Simple distance calculation (approximate)
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance <= this.radius;
  }
  
  return false;
};

geofenceSchema.methods.isTimeRestricted = function() {
  if (!this.timeRestrictions) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  const dayOfWeek = now.toLocaleLowerCase('en-US', { weekday: 'long' });
  
  if (this.timeRestrictions.startTime && this.timeRestrictions.endTime) {
    const isWithinTime = currentTime >= this.timeRestrictions.startTime && 
                        currentTime <= this.timeRestrictions.endTime;
    
    if (this.timeRestrictions.daysOfWeek && this.timeRestrictions.daysOfWeek.length > 0) {
      const isWithinDay = this.timeRestrictions.daysOfWeek.includes(dayOfWeek);
      return !isWithinDay || !isWithinTime;
    }
    
    return !isWithinTime;
  }
  
  return false;
};

geofenceSchema.methods.canAccess = function(userType) {
  if (!this.allowedUserTypes || this.allowedUserTypes.length === 0) {
    return true; // No restrictions
  }
  
  return this.allowedUserTypes.includes(userType);
};

export default mongoose.model('Geofence', geofenceSchema);