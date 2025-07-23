import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import VolunteerCertificate from '@/models/VolunteerCertificate';

export async function GET() {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    const certificates = await VolunteerCertificate.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(certificates);
  } catch (error) {
    console.error('Erreur lors de la récupération des certificats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des certificats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const {
      volunteerName,
      position,
      missions,
      duration,
      contributions,
      startDate,
      endDate,
      issuedBy
    } = body;

    // Validation des données
    if (!volunteerName || !position || !missions || !duration || !contributions || !startDate || !issuedBy) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Génération du numéro de certificat
    const count = await VolunteerCertificate.countDocuments();
    const year = new Date().getFullYear();
    const paddedCount = String(count + 1).padStart(6, '0');
    const certificateNumber = `CERT-${paddedCount}-${year}`;

    const certificate = new VolunteerCertificate({
      volunteerName,
      position,
      missions: Array.isArray(missions) ? missions : [missions],
      duration,
      contributions: Array.isArray(contributions) ? contributions : [contributions],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      issuedBy,
      certificateNumber
    });

    await certificate.save();

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du certificat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du certificat' },
      { status: 500 }
    );
  }
} 