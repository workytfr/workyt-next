import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IProfileCustomization extends Document {
  _id: ObjectId;
  user: ObjectId;
  usernameColor: {
    type: 'solid' | 'gradient' | 'rainbow' | 'custom';
    value: string; // Code couleur ou nom du thème
    isActive: boolean;
  };
  profileImage: {
    filename: string; // Nom du fichier dans public/profile/
    isActive: boolean;
  };
  profileBorder: {
    filename: string; // Nom du fichier dans public/profile/contour/
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProfileCustomizationSchema = new Schema<IProfileCustomization>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  usernameColor: {
    type: {
      type: String,
      enum: ['solid', 'gradient', 'rainbow', 'custom'],
      default: 'solid'
    },
    value: { 
      type: String, 
      default: '#3B82F6' // Bleu par défaut
    },
    isActive: { 
      type: Boolean, 
      default: false 
    }
  },
  profileImage: {
    filename: { 
      type: String, 
      default: '' 
    },
    isActive: { 
      type: Boolean, 
      default: false 
    }
  },
  profileBorder: {
    filename: { 
      type: String, 
      default: '' 
    },
    isActive: { 
      type: Boolean, 
      default: false 
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour updatedAt
ProfileCustomizationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ProfileCustomization = mongoose.models.ProfileCustomization || mongoose.model<IProfileCustomization>('ProfileCustomization', ProfileCustomizationSchema);

export default ProfileCustomization;
