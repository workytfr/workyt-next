"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Download, Eye, Edit, Trash2, Award } from 'lucide-react';
import CertificateForm from './_components/CertificateForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Certificate {
  _id: string;
  volunteerName: string;
  position: string;
  missions: string[];
  duration: string;
  contributions: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  certificateNumber: string;
  issuedDate: string;
  issuedBy: string;
  createdAt: string;
}

export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [deletingCertificate, setDeletingCertificate] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'authentification et les permissions
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchCertificates();
  }, [status, session, router]);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates');
      if (response.ok) {
        const data = await response.json();
        setCertificates(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des certificats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCertificate = async (certificateData: any) => {
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateData),
      });

      if (response.ok) {
        setShowForm(false);
        fetchCertificates();
      }
    } catch (error) {
      console.error('Erreur lors de la création du certificat:', error);
    }
  };

  const handleUpdateCertificate = async (certificateData: any) => {
    try {
      const response = await fetch(`/api/certificates/${editingCertificate?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateData),
      });

      if (response.ok) {
        setEditingCertificate(null);
        fetchCertificates();
      }
    } catch (error) {
      console.error('Erreur lors de la modification du certificat:', error);
    }
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeletingCertificate(null);
        fetchCertificates();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du certificat:', error);
    }
  };

  const handleGeneratePDF = async (certificateId: string) => {
    try {
      const response = await fetch('/api/certificates/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ certificateId }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificat-${certificateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des certificats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certificats de Bénévolat</h1>
          <p className="text-gray-600 mt-2">
            Gérez et générez les certificats de reconnaissance pour vos bénévoles
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Certificat
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <Card key={certificate._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{certificate.volunteerName}</CardTitle>
                  <p className="text-sm text-gray-600">{certificate.position}</p>
                </div>
                <Badge variant={certificate.isActive ? "default" : "secondary"}>
                  {certificate.isActive ? "Actif" : "Terminé"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Numéro de certificat</p>
                  <p className="text-xs text-gray-500">{certificate.certificateNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Durée</p>
                  <p className="text-xs text-gray-500">{certificate.duration}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Missions</p>
                  <p className="text-xs text-gray-500">
                    {certificate.missions.slice(0, 2).join(', ')}
                    {certificate.missions.length > 2 && '...'}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGeneratePDF(certificate._id)}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCertificate(certificate)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeletingCertificate(certificate._id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {certificates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Aucun certificat créé</h3>
              <p className="mb-4">Commencez par créer votre premier certificat de bénévolat</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un certificat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Nouveau Certificat de Bénévolat</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            <CertificateForm
              onSubmit={handleCreateCertificate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {editingCertificate && (
        <Dialog open={!!editingCertificate} onOpenChange={() => setEditingCertificate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Modifier le Certificat</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
                          <CertificateForm
              certificate={editingCertificate}
              onSubmit={handleUpdateCertificate}
              onCancel={() => setEditingCertificate(null)}
            />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmation de suppression */}
      {deletingCertificate && (
        <Dialog open={!!deletingCertificate} onOpenChange={() => setDeletingCertificate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Êtes-vous sûr de vouloir supprimer ce certificat ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingCertificate(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCertificate(deletingCertificate)}
              >
                Supprimer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 