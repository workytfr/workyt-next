import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Partner from '@/models/Partner';
import PromoCode from '@/models/PromoCode';

// GET - Récupérer un partenaire spécifique
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    try {
        await dbConnect();
        
        const partner = await Partner.findById(params.id);
        if (!partner) {
            return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
        }
        
        return NextResponse.json(partner);
    } catch (error) {
        console.error('Erreur lors de la récupération du partenaire:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT - Mettre à jour un partenaire
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
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
        
        // Vérifier que le partenaire existe
        const existingPartner = await Partner.findById(params.id);
        if (!existingPartner) {
            return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
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

        // Mettre à jour le partenaire
        const updatedPartner = await Partner.findByIdAndUpdate(
            params.id,
            { ...body },
            { new: true, runValidators: true }
        );
        
        return NextResponse.json(updatedPartner);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du partenaire:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE - Supprimer un partenaire
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
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
        
        // Vérifier que le partenaire existe
        const partner = await Partner.findById(params.id);
        if (!partner) {
            return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
        }
        
        // Supprimer les codes promo non attribués de ce partenaire
        const deletedCodes = await PromoCode.deleteMany({ partnerId: params.id, assignedTo: null });

        // Supprimer le partenaire
        await Partner.findByIdAndDelete(params.id);

        return NextResponse.json({
            message: 'Partenaire supprimé avec succès',
            deletedCodes: deletedCodes.deletedCount
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du partenaire:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
