import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IPartner extends Document {
    _id: ObjectId;
    name: string;
    description: string;
    logo: string;
    image: string;
    category: 'restauration' | 'sport' | 'culture' | 'tech' | 'bien-etre' | 'loisirs' | 'autre';
    city: string;
    address: string;
    website?: string;
    phone?: string;
    email?: string;
    
    // Offres
    offers: {
        free: {
            type: 'percentage' | 'fixed' | 'welcome';
            value: number; // pourcentage ou montant en euros
            description: string;
            conditions?: string;
            promoCode: string; // Code promo pour achats en ligne
            promoDescription: string; // Description de la promo
            justificationRequired: boolean; // Si une preuve/justificatif est requis
            justificationType: 'image' | 'qr' | 'pdf'; // Type de justificatif généré
            justificationTemplate?: string; // Template pour le justificatif
        };
        premium: {
            type: 'percentage' | 'fixed' | 'welcome';
            value: number;
            gemsCost: number;
            description: string;
            conditions?: string;
            promoCode: string; // Code promo pour achats en ligne
            promoDescription: string; // Description de la promo
            additionalBenefits?: string[]; // Avantages supplémentaires
            justificationType: 'image' | 'qr' | 'pdf'; // Type de justificatif généré
        };
    };
    
    // Gestion des offres
    isActive: boolean;
    startDate: Date;
    endDate?: Date;
    maxUsesPerDay?: number;
    maxUsesPerUser?: number;
    
    // Statistiques
    totalUses: number;
    totalSavings: number;
    
    // Métadonnées
    createdAt: Date;
    updatedAt: Date;
    createdBy: ObjectId;
}

const PartnerSchema = new Schema<IPartner>({
    name: {
        type: String,
        required: [true, 'Le nom du partenaire est requis'],
        trim: true,
        maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
    },
    description: {
        type: String,
        required: [true, 'La description est requise'],
        trim: true,
        maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
    },
    logo: {
        type: String,
        required: [true, 'Le logo est requis']
    },
    image: {
        type: String,
        required: [true, 'L\'image est requise']
    },
    category: {
        type: String,
        enum: ['restauration', 'sport', 'culture', 'tech', 'bien-etre', 'loisirs', 'autre'],
        required: [true, 'La catégorie est requise']
    },
    city: {
        type: String,
        required: [true, 'La ville est requise'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'L\'adresse est requise'],
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    
    // Offres
    offers: {
        free: {
            type: {
                type: String,
                enum: ['percentage', 'fixed', 'welcome'],
                required: true
            },
            value: {
                type: Number,
                required: true,
                min: [0, 'La valeur doit être positive']
            },
            description: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
            },
            conditions: {
                type: String,
                trim: true,
                maxlength: [300, 'Les conditions ne peuvent pas dépasser 300 caractères']
            },
            promoCode: {
                type: String,
                required: true,
                trim: true,
                unique: true,
                maxlength: [50, 'Le code promo ne peut pas dépasser 50 caractères']
            },
            promoDescription: {
                type: String,
                required: true,
                trim: true,
                maxlength: [300, 'La description de la promo ne peut pas dépasser 300 caractères']
            },
            justificationRequired: {
                type: Boolean,
                default: true
            },
            justificationType: {
                type: String,
                enum: ['image', 'qr', 'pdf'],
                default: 'image'
            },
            justificationTemplate: {
                type: String,
                trim: true,
                maxlength: [500, 'Le template ne peut pas dépasser 500 caractères']
            }
        },
        premium: {
            type: {
                type: String,
                enum: ['percentage', 'fixed', 'welcome'],
                required: true
            },
            value: {
                type: Number,
                required: true,
                min: [0, 'La valeur doit être positive']
            },
            gemsCost: {
                type: Number,
                required: true,
                min: [1, 'Le coût en gemmes doit être d\'au moins 1']
            },
            description: {
                type: String,
                required: true,
                trim: true,
                maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
            },
            conditions: {
                type: String,
                trim: true,
                maxlength: [300, 'Les conditions ne peuvent pas dépasser 300 caractères']
            },
            promoCode: {
                type: String,
                required: true,
                trim: true,
                unique: true,
                maxlength: [50, 'Le code promo ne peut pas dépasser 50 caractères']
            },
            promoDescription: {
                type: String,
                required: true,
                trim: true,
                maxlength: [300, 'La description de la promo ne peut pas dépasser 300 caractères']
            },
            additionalBenefits: [{
                type: String,
                trim: true,
                maxlength: [100, 'Chaque avantage ne peut pas dépasser 100 caractères']
            }],
            justificationType: {
                type: String,
                enum: ['image', 'qr', 'pdf'],
                default: 'image'
            }
        }
    },
    
    // Gestion des offres
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        required: [true, 'La date de début est requise']
    },
    endDate: {
        type: Date
    },
    maxUsesPerDay: {
        type: Number,
        min: [1, 'Le nombre maximum d\'utilisations par jour doit être d\'au moins 1']
    },
    maxUsesPerUser: {
        type: Number,
        min: [1, 'Le nombre maximum d\'utilisations par utilisateur doit être d\'au moins 1']
    },
    
    // Statistiques
    totalUses: {
        type: Number,
        default: 0,
        min: [0, 'Le nombre total d\'utilisations ne peut pas être négatif']
    },
    totalSavings: {
        type: Number,
        default: 0,
        min: [0, 'L\'économie totale ne peut pas être négative']
    },
    
    // Métadonnées
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur créateur est requis']
    }
});

// Middleware pour mettre à jour la date de modification
PartnerSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index pour améliorer les performances
PartnerSchema.index({ city: 1, category: 1, isActive: 1 });
PartnerSchema.index({ startDate: 1, endDate: 1 });
// Les index sur promoCode sont déjà créés par unique: true dans le schéma

const Partner = mongoose.models.Partner || mongoose.model<IPartner>('Partner', PartnerSchema);

export default Partner;
