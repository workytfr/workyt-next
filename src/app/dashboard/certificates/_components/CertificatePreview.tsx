"use client";

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Award, Calendar, User, Briefcase, Target, Heart } from 'lucide-react';

interface CertificatePreviewProps {
  certificate: {
    volunteerName: string;
    position: string;
    missions: string[];
    duration: string;
    contributions: string[];
    startDate: string;
    endDate?: string;
    certificateNumber: string;
    issuedBy: string;
  };
}

export default function CertificatePreview({ certificate }: CertificatePreviewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Card className="max-w-2xl mx-auto bg-white border-2 border-gray-300">
      <CardContent className="p-8">
        {/* En-tête simple */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">WORKYT</h1>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Certificat de Bénévolat</h2>
          <p className="text-gray-600 mb-4">Reconnaissance des services rendus</p>
          <Badge variant="outline" className="text-sm">
            N° {certificate.certificateNumber}
          </Badge>
        </div>

        {/* Nom du bénévole */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 pb-2">
            {certificate.volunteerName}
          </h3>
        </div>

        {/* Informations détaillées */}
        <div className="space-y-4">
          {/* Poste */}
          <div className="flex items-start">
            <Briefcase className="w-5 h-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Poste occupé</h4>
              <p className="text-gray-600">{certificate.position}</p>
            </div>
          </div>

          {/* Missions */}
          <div className="flex items-start">
            <Target className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Missions réalisées</h4>
              <ul className="text-gray-600 space-y-1">
                {certificate.missions.map((mission, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    {mission}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Durée */}
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-purple-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Durée d&apos;engagement</h4>
              <p className="text-gray-600">{certificate.duration}</p>
            </div>
          </div>

          {/* Contributions */}
          <div className="flex items-start">
            <Heart className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Contributions apportées</h4>
              <ul className="text-gray-600 space-y-1">
                {certificate.contributions.map((contribution, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-600 mr-2">•</span>
                    {contribution}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Période */}
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-orange-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800">Période d&apos;engagement</h4>
              <p className="text-gray-600">
                Du {formatDate(certificate.startDate)}
                {certificate.endDate ? ` au ${formatDate(certificate.endDate)}` : ' (en cours)'}
              </p>
            </div>
          </div>
        </div>

        {/* Pied de page simple */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-end">
            {/* Signature */}
            <div className="text-center">
              <div className="border-t-2 border-gray-400 w-32 mx-auto mb-2"></div>
              <p className="text-sm font-semibold text-gray-800">Bureau de Workyt</p>
              <p className="text-xs text-gray-500">Signature et cachet</p>
            </div>
            
            {/* Date */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Émis le {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
          
          {/* Informations de l'association */}
          <div className="text-center mt-4">
            <p className="text-sm font-semibold text-gray-800">WORKYT</p>
            <p className="text-xs text-gray-600">25 Rue Jaboulay</p>
            <p className="text-xs text-gray-600">69007 Lyon, France</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 