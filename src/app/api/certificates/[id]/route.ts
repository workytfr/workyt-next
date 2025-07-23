import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import VolunteerCertificate from '@/models/VolunteerCertificate';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const certificate = await VolunteerCertificate.findByIdAndDelete(id);
    
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificat non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Certificat supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du certificat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du certificat' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const certificate = await VolunteerCertificate.findByIdAndUpdate(
      id,
      {
        ...body,
        missions: Array.isArray(body.missions) ? body.missions : [body.missions],
        contributions: Array.isArray(body.contributions) ? body.contributions : [body.contributions],
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null
      },
      { new: true }
    );

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificat non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error('Erreur lors de la modification du certificat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du certificat' },
      { status: 500 }
    );
  }
} 