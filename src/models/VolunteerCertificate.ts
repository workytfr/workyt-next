import mongoose, { Schema, Document } from 'mongoose';

export interface IVolunteerCertificate extends Document {
  volunteerName: string;
  position: string;
  missions: string[];
  duration: string;
  contributions: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  certificateNumber: string;
  issuedDate: Date;
  issuedBy: string;
  signature?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerCertificateSchema = new Schema<IVolunteerCertificate>({
  volunteerName: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  missions: [{
    type: String,
    required: true
  }],
  duration: {
    type: String,
    required: true,
    trim: true
  },
  contributions: [{
    type: String,
    required: true
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: String,
    required: true,
    trim: true
  },
  signature: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Génération automatique du numéro de certificat
VolunteerCertificateSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.certificateNumber) {
      const count = await mongoose.model('VolunteerCertificate').countDocuments();
      const year = new Date().getFullYear();
      const paddedCount = String(count + 1).padStart(6, '0');
      this.certificateNumber = `CERT-${paddedCount}-${year}`;
    }
    next();
  } catch (error) {
    console.error('Erreur lors de la génération du numéro de certificat:', error);
    // Fallback si la génération échoue
    if (!this.certificateNumber) {
      const year = new Date().getFullYear();
      this.certificateNumber = `CERT-${Date.now()}-${year}`;
    }
    next();
  }
});

// Alternative: génération du numéro de certificat si manquant
VolunteerCertificateSchema.pre('validate', async function(next) {
  if (!this.certificateNumber) {
    try {
      const count = await mongoose.model('VolunteerCertificate').countDocuments();
      const year = new Date().getFullYear();
      const paddedCount = String(count + 1).padStart(6, '0');
      this.certificateNumber = `CERT-${paddedCount}-${year}`;
    } catch (error) {
      console.error('Erreur lors de la génération du numéro de certificat:', error);
      const year = new Date().getFullYear();
      this.certificateNumber = `CERT-${Date.now()}-${year}`;
    }
  }
  next();
});

export default mongoose.models.VolunteerCertificate || mongoose.model<IVolunteerCertificate>('VolunteerCertificate', VolunteerCertificateSchema); 