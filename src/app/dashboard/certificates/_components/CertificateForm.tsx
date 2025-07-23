"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { X, Plus } from 'lucide-react';

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

interface CertificateFormProps {
  certificate?: Certificate;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function CertificateForm({ certificate, onSubmit, onCancel }: CertificateFormProps) {
  const [formData, setFormData] = useState({
    volunteerName: certificate?.volunteerName || '',
    position: certificate?.position || '',
    missions: certificate?.missions || [''],
    duration: certificate?.duration || '',
    contributions: certificate?.contributions || [''],
    startDate: certificate?.startDate ? certificate.startDate.split('T')[0] : '',
    endDate: certificate?.endDate ? certificate.endDate.split('T')[0] : '',
    isActive: certificate?.isActive ?? true,
    issuedBy: certificate?.issuedBy || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.volunteerName.trim()) {
      newErrors.volunteerName = 'Le nom du bénévole est requis';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Le poste est requis';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'La durée est requise';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }

    if (!formData.issuedBy.trim()) {
      newErrors.issuedBy = 'Le nom de l&apos;émetteur est requis';
    }

    if (formData.missions.length === 0 || formData.missions.every(m => !m.trim())) {
      newErrors.missions = 'Au moins une mission est requise';
    }

    if (formData.contributions.length === 0 || formData.contributions.every(c => !c.trim())) {
      newErrors.contributions = 'Au moins une contribution est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        ...formData,
        missions: formData.missions.filter(m => m.trim()),
        contributions: formData.contributions.filter(c => c.trim()),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
      };
      
      onSubmit(submitData);
    }
  };

  const addMission = () => {
    setFormData(prev => ({
      ...prev,
      missions: [...prev.missions, '']
    }));
  };

  const removeMission = (index: number) => {
    setFormData(prev => ({
      ...prev,
      missions: prev.missions.filter((_, i) => i !== index)
    }));
  };

  const updateMission = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      missions: prev.missions.map((mission, i) => i === index ? value : mission)
    }));
  };

  const addContribution = () => {
    setFormData(prev => ({
      ...prev,
      contributions: [...prev.contributions, '']
    }));
  };

  const removeContribution = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contributions: prev.contributions.filter((_, i) => i !== index)
    }));
  };

  const updateContribution = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      contributions: prev.contributions.map((contribution, i) => i === index ? value : contribution)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="volunteerName">Nom du bénévole *</Label>
          <Input
            id="volunteerName"
            value={formData.volunteerName}
            onChange={(e) => setFormData(prev => ({ ...prev, volunteerName: e.target.value }))}
            placeholder="Nom et prénom du bénévole"
            className={errors.volunteerName ? 'border-red-500' : ''}
          />
          {errors.volunteerName && (
            <p className="text-red-500 text-sm mt-1">{errors.volunteerName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="position">Poste occupé *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
            placeholder="Ex: Rédacteur de contenu"
            className={errors.position ? 'border-red-500' : ''}
          />
          {errors.position && (
            <p className="text-red-500 text-sm mt-1">{errors.position}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Missions réalisées *</Label>
        <div className="space-y-2">
          {formData.missions.map((mission, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={mission}
                onChange={(e) => updateMission(index, e.target.value)}
                placeholder={`Mission ${index + 1}`}
                className="flex-1"
              />
              {formData.missions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMission(index)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addMission}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une mission
          </Button>
        </div>
        {errors.missions && (
          <p className="text-red-500 text-sm mt-1">{errors.missions}</p>
        )}
      </div>

      <div>
        <Label htmlFor="duration">Durée d&apos;engagement *</Label>
        <Input
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
          placeholder="Ex: 6 mois, 1 an, etc."
          className={errors.duration ? 'border-red-500' : ''}
        />
        {errors.duration && (
          <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Contributions apportées *</Label>
        <div className="space-y-2">
          {formData.contributions.map((contribution, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={contribution}
                onChange={(e) => updateContribution(index, e.target.value)}
                placeholder={`Contribution ${index + 1}`}
                className="flex-1"
              />
              {formData.contributions.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeContribution(index)}
                  className="px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addContribution}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter une contribution
          </Button>
        </div>
        {errors.contributions && (
          <p className="text-red-500 text-sm mt-1">{errors.contributions}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Date de début *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            className={errors.startDate ? 'border-red-500' : ''}
          />
          {errors.startDate && (
            <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="endDate">Date de fin (optionnel)</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="issuedBy">Émis par *</Label>
        <Input
          id="issuedBy"
          value={formData.issuedBy}
          onChange={(e) => setFormData(prev => ({ ...prev, issuedBy: e.target.value }))}
          placeholder="Nom de la personne qui émet le certificat"
          className={errors.issuedBy ? 'border-red-500' : ''}
        />
        {errors.issuedBy && (
          <p className="text-red-500 text-sm mt-1">{errors.issuedBy}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">Certificat actif</Label>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {certificate ? 'Modifier' : 'Créer'} le certificat
        </Button>
      </div>
    </form>
  );
} 