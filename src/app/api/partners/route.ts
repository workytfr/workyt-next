import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Partner from '@/models/Partner';
import PromoCode from '@/models/PromoCode';

// GET - Récupérer tous les partenaires
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        const { searchParams } = new URL(req.url);
        const active = searchParams.get('active');
        const category = searchParams.get('category');
        const city = searchParams.get('city');
        
        let filter: any = {};
        
        if (active === 'true') {
            filter.isActive = true;
        }
        
        if (category) {
            filter.category = category;
        }
        
        if (city) {
            filter.city = city;
        }
        
        const partners = await Partner.find(filter).sort({ createdAt: -1 });

        const partnersWithCounts = await Promise.all(
            partners.map(async (p: any) => {
                const pObj = p.toObject();
                const [freeCodes, premiumCodes] = await Promise.all([
                    PromoCode.countDocuments({ partnerId: p._id, offerType: 'free', assignedTo: null }),
                    PromoCode.countDocuments({ partnerId: p._id, offerType: 'premium', assignedTo: null })
                ]);
                pObj.availableCodesFree = freeCodes;
                pObj.availableCodesPremium = premiumCodes;
                pObj.availableCodes = { free: freeCodes, premium: premiumCodes };
                return pObj;
            })
        );
        return NextResponse.json(partnersWithCounts);
    } catch (error) {
        console.error('Erreur lors de la récupération des partenaires:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST - Créer un nouveau partenaire
export async function POST(req: NextRequest) {
    try {
        // Vérifier l'authentification et les droits admin
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        
        // Vérifier que l'utilisateur est admin
        if (session.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 });
        }
        
        await dbConnect();
        
        const body = await req.json();

        // Nettoyer les chaînes vides pour les champs optionnels numériques
        const optionalNumericFields = ['maxUsesPerDay', 'maxUsesPerUser'];
        for (const field of optionalNumericFields) {
            if (body[field] === '' || body[field] === null) {
                delete body[field];
            }
        }
        // Nettoyer les chaînes vides pour les champs optionnels string
        const optionalStringFields = ['promoCodePrefix', 'website', 'phone', 'email', 'endDate'];
        for (const field of optionalStringFields) {
            if (body[field] === '') {
                delete body[field];
            }
        }

        // Validation des données requises
        const requiredFields = ['name', 'description', 'logo', 'image', 'category', 'city', 'address'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 });
            }
        }
        
        if (!body.offers?.free && !body.offers?.premium) {
            return NextResponse.json({ error: 'Au moins une offre (gratuite ou premium) est requise' }, { status: 400 });
        }

        // Créer le partenaire
        const partner = new Partner({
            ...body,
            createdBy: session.user.id || session.user.email,
            totalUses: 0,
            totalSavings: 0
        });
        
        await partner.save();
        
        return NextResponse.json(partner, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du partenaire:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
