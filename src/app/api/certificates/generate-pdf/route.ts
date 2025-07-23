import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import connectDB from '@/lib/mongodb';
import VolunteerCertificate from '@/models/VolunteerCertificate';
import { generateCertificatePDF } from '@/lib/pdfGenerator';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'Admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    const { certificateId } = await request.json();

    if (!certificateId) {
      return NextResponse.json(
        { error: 'ID du certificat requis' },
        { status: 400 }
      );
    }

    const certificate = await VolunteerCertificate.findById(certificateId);
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificat non trouvé' },
        { status: 404 }
      );
    }

    // Génération du PDF avec notre utilitaire
    const pdfBuffer = await generateCertificatePDF(certificate);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificat-${certificate.volunteerName.replace(/\s+/g, '-')}.pdf"`
      }
    });

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
} 