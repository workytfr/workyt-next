import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Partner from '@/models/Partner';

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
        
        return NextResponse.json(partners);
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
        
        // Validation des données requises
        const requiredFields = ['name', 'description', 'logo', 'image', 'category', 'city', 'address'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json({ error: `Le champ ${field} est requis` }, { status: 400 });
            }
        }
        
        // Validation des offres
        if (!body.offers?.free || !body.offers?.premium) {
            return NextResponse.json({ error: 'Les offres gratuites et premium sont requises' }, { status: 400 });
        }
        
        // Validation des codes promo
        if (!body.offers.free.promoCode || !body.offers.premium.promoCode) {
            return NextResponse.json({ error: 'Les codes promo sont requis pour les deux types d\'offres' }, { status: 400 });
        }
        
        // Vérifier l'unicité des codes promo
        const existingFreeCode = await Partner.findOne({ 'offers.free.promoCode': body.offers.free.promoCode });
        if (existingFreeCode) {
            return NextResponse.json({ error: 'Le code promo gratuit existe déjà' }, { status: 400 });
        }
        
        const existingPremiumCode = await Partner.findOne({ 'offers.premium.promoCode': body.offers.premium.promoCode });
        if (existingPremiumCode) {
            return NextResponse.json({ error: 'Le code promo premium existe déjà' }, { status: 400 });
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
