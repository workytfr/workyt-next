"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Slider } from '@/components/ui/slider';
import { Gem, Sparkles, Palette, Image as ImageIcon, Crown, Coins } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProfileAvatar from '@/components/ui/profile';

interface GemData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface CustomizationData {
  usernameColor: {
    type: 'solid' | 'gradient' | 'rainbow' | 'neon' | 'holographic' | 'galaxy' | 'fire' | 'ice' | 'lightning' | 'cosmic' | 'diamond' | 'legendary' | 'custom';
    value: string;
    isActive: boolean;
  };
  profileImage: {
    filename: string;
    isActive: boolean;
  };
  profileBorder: {
    filename: string;
    isActive: boolean;
  };
}

// Type alias pour la compatibilité
type ProfileCustomization = CustomizationData;

interface UserData {
  id: string;
  username: string;
  points: number;
}

const GemManager: React.FC = () => {
  const { data: session } = useSession();
  const [gemData, setGemData] = useState<GemData | null>(null);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState(100);
  const [customColor, setCustomColor] = useState('#FF6B6B');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    if (session?.user) {
      loadGemData();
    }
  }, [session]);

  const loadGemData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gems/balance');
      const data = await response.json();
      
      if (data.success) {
        setGemData(data.data.gems);
        setCustomization(data.data.customization);
        setUserData(data.data.user);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const convertPointsToGems = async () => {
    if (pointsToConvert < 100) {
      setError('Minimum 100 points requis');
      return;
    }

    try {
      setConverting(true);
      setError(null);
      
      const response = await fetch('/api/gems/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pointsToConvert })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Conversion réussie ! ${pointsToConvert} points convertis en ${data.data.gemsEarned} gemmes`);
        setPointsToConvert(100);
        loadGemData(); // Recharger les données
      } else {
        setError(data.message || 'Erreur lors de la conversion');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      setError('Erreur lors de la conversion');
    } finally {
      setConverting(false);
    }
  };

  const purchaseCustomization = async (itemType: string, itemValue: string) => {
    try {
      setPurchasing(true);
      setError(null);
      
      // Gestion spéciale pour les couleurs personnalisées
      let purchaseData = { itemType, itemValue };
      if (itemType === 'usernameColor' && itemValue === 'custom') {
        purchaseData = { itemType, itemValue: customColor };
      }
      
      const response = await fetch('/api/gems/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Achat réussi ! ${itemValue} est maintenant actif`);
        loadGemData(); // Recharger les données
      } else {
        setError(data.message || 'Erreur lors de l\'achat');
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      setError('Erreur lors de l\'achat');
    } finally {
      setPurchasing(false);
    }
  };

  const loadTransactionHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('/api/gems/history?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadTransactionHistory();
    }
    setShowHistory(!showHistory);
  };

  const formatTransactionType = (type: string) => {
    const types = {
      'conversion': 'Conversion points → gemmes',
      'purchase': 'Achat personnalisation',
      'refund': 'Remboursement',
      'bonus': 'Bonus',
      'partner_offer': 'Offre partenaire',
      'reward': 'Récompense',
      'admin_grant': 'Attribution admin',
      'admin_deduct': 'Déduction admin'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatTransactionStatus = (status: string) => {
    const statuses = {
      'pending': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      'completed': { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      'failed': { label: 'Échoué', color: 'bg-red-100 text-red-800' },
      'cancelled': { label: 'Annulé', color: 'bg-gray-100 text-gray-600' }
    };
    return statuses[status as keyof typeof statuses] || { label: status, color: 'bg-gray-100 text-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Veuillez vous connecter pour accéder au gestionnaire de gemmes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* En-tête avec solde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-6 w-6 text-blue-600" />
            Gestionnaire de Gemmes
          </CardTitle>
          <CardDescription>
            Gérez vos gemmes et personnalisez votre profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{gemData?.balance || 0}</div>
              <div className="text-sm text-gray-600">Gemmes disponibles</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{gemData?.totalEarned || 0}</div>
              <div className="text-sm text-gray-600">Total gagnées</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{gemData?.totalSpent || 0}</div>
              <div className="text-sm text-gray-600">Total dépensées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion de points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Convertir des points en gemmes
          </CardTitle>
          <CardDescription>
            Ratio: 100 points = 1 gemme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Slider pour la conversion */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="points-slider">Points à convertir</Label>
                <div className="text-lg font-semibold text-blue-600">
                  {pointsToConvert} points
                </div>
              </div>
              
              <Slider
                id="points-slider"
                value={[pointsToConvert]}
                onValueChange={(value: number[]) => setPointsToConvert(value[0])}
                min={100}
                max={Math.min(userData?.points || 100, 10000)}
                step={100}
                className="w-full"
              />
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>100 points</span>
                <span>{Math.min(userData?.points || 100, 10000)} points</span>
              </div>
            </div>

            {/* Résumé de la conversion */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Points à convertir</div>
                  <div className="text-2xl font-bold text-blue-600">{pointsToConvert}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Gemmes obtenues</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(pointsToConvert / 100)}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <Button 
                  onClick={convertPointsToGems}
                  disabled={converting || (userData?.points || 0) < pointsToConvert}
                  className="w-full md:w-auto px-8"
                  size="lg"
                >
                  {converting ? 'Conversion...' : 'Convertir maintenant'}
                </Button>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="text-center text-sm text-gray-600">
              Points disponibles: <span className="font-semibold">{userData?.points || 0}</span>
              {pointsToConvert > (userData?.points || 0) && (
                <div className="mt-2 text-red-600 font-medium">
                  ⚠️ Points insuffisants pour cette conversion
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnalisations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personnalisations disponibles
          </CardTitle>
          <CardDescription>
            Achetez des personnalisations avec vos gemmes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Couleurs de nom d'utilisateur */}
          <div className="space-y-3">
            <h3 className="font-semibold">Couleur du nom d&apos;utilisateur</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {[
                // Couleurs basiques
                { type: 'solid', label: 'Simple', price: 3, color: '#3B82F6', rarity: 'common' },
                { type: 'gradient', label: 'Dégradé', price: 8, color: 'linear-gradient(45deg, #3B82F6, #8B5CF6)', rarity: 'common' },
                
                // Couleurs rares
                { type: 'rainbow', label: 'Arc-en-ciel', price: 25, color: 'rainbow', rarity: 'rare', animated: true },
                { type: 'neon', label: 'Néon', price: 35, color: '#00FF00', rarity: 'rare', animated: true },
                { type: 'holographic', label: 'Holographique', price: 50, color: '#FF00FF', rarity: 'epic', animated: true },
                { type: 'galaxy', label: 'Galaxie', price: 75, color: '#4C1D95', rarity: 'epic', animated: true },
                { type: 'fire', label: 'Feu', price: 100, color: '#DC2626', rarity: 'legendary', animated: true },
                { type: 'ice', label: 'Glace', price: 100, color: '#0EA5E9', rarity: 'legendary', animated: true },
                { type: 'lightning', label: 'Éclair', price: 125, color: '#F59E0B', rarity: 'mythic', animated: true },
                { type: 'cosmic', label: 'Cosmique', price: 150, color: '#7C3AED', rarity: 'mythic', animated: true },
                { type: 'diamond', label: 'Diamant', price: 200, color: '#10B981', rarity: 'divine', animated: true },
                { type: 'legendary', label: 'Légendaire', price: 500, color: '#F97316', rarity: 'divine', animated: true },
                
                // Couleur personnalisée
                { type: 'custom', label: 'Personnalisée', price: 15, color: customColor, rarity: 'common' }
              ].map((option) => (
                <div key={option.type} className={`border rounded-lg p-3 text-center relative ${
                  option.rarity === 'common' ? 'border-gray-200' :
                  option.rarity === 'rare' ? 'border-blue-300' :
                  option.rarity === 'epic' ? 'border-purple-400' :
                  option.rarity === 'legendary' ? 'border-orange-400' :
                  option.rarity === 'mythic' ? 'border-yellow-400' :
                  'border-red-500'
                }`}>
                  {/* Badge de rareté */}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full ${
                    option.rarity === 'common' ? 'bg-gray-100 text-gray-600' :
                    option.rarity === 'rare' ? 'bg-blue-100 text-blue-600' :
                    option.rarity === 'epic' ? 'bg-purple-100 text-purple-600' :
                    option.rarity === 'legendary' ? 'bg-orange-100 text-orange-600' :
                    option.rarity === 'mythic' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {option.rarity === 'common' ? '★' :
                     option.rarity === 'rare' ? '★★' :
                     option.rarity === 'epic' ? '★★★' :
                     option.rarity === 'legendary' ? '★★★★' :
                     option.rarity === 'mythic' ? '★★★★★' :
                     '★★★★★★'}
                  </div>
                  
                  {/* Aperçu de la couleur */}
                  <div 
                    className={`w-12 h-12 mx-auto mb-2 rounded-full ${
                      option.animated ? 'animate-pulse' : ''
                    }`}
                    style={{
                      background: option.type === 'rainbow' 
                        ? 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4, #FFEAA7, #DDA0DD)'
                        : option.type === 'neon'
                        ? 'linear-gradient(45deg, #00FF00, #00FFFF, #FF00FF)'
                        : option.type === 'holographic'
                        ? 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00, #FF00FF)'
                        : option.type === 'galaxy'
                        ? 'linear-gradient(45deg, #4C1D95, #7C3AED, #A855F7, #C084FC)'
                        : option.type === 'fire'
                        ? 'linear-gradient(45deg, #DC2626, #EF4444, #F87171, #FCA5A5)'
                        : option.type === 'ice'
                        ? 'linear-gradient(45deg, #0EA5E9, #38BDF8, #7DD3FC, #BAE6FD)'
                        : option.type === 'lightning'
                        ? 'linear-gradient(45deg, #F59E0B, #FBBF24, #FCD34D, #FDE68A)'
                        : option.type === 'cosmic'
                        ? 'linear-gradient(45deg, #7C3AED, #A855F7, #C084FC, #DDD6FE)'
                        : option.type === 'diamond'
                        ? 'linear-gradient(45deg, #10B981, #34D399, #6EE7B7, #A7F3D0)'
                        : option.type === 'legendary'
                        ? 'linear-gradient(45deg, #F97316, #FB923C, #FDBA74, #FED7AA)'
                        : option.color
                    }}
                  />
                  
                  <div className="text-sm font-medium mb-1">{option.label}</div>
                  <div className="text-xs text-gray-600 mb-2">{option.price} gemmes</div>
                  
                  {/* Indicateur d'animation */}
                  {option.animated && (
                    <div className="text-xs text-purple-600 mb-2 font-semibold">✨ Animé</div>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={() => purchaseCustomization('usernameColor', option.type)}
                    disabled={purchasing || (gemData?.balance || 0) < option.price}
                    className={`w-full ${
                      option.rarity === 'common' ? 'bg-gray-600 hover:bg-gray-700' :
                      option.rarity === 'rare' ? 'bg-blue-600 hover:bg-blue-700' :
                      option.rarity === 'epic' ? 'bg-purple-600 hover:bg-purple-700' :
                      option.rarity === 'legendary' ? 'bg-orange-600 hover:bg-orange-700' :
                      option.rarity === 'mythic' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {customization?.usernameColor.type === option.type && customization.usernameColor.isActive 
                      ? 'Actif' 
                      : 'Acheter'
                    }
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Sélecteur de couleur personnalisée */}
            <div className="flex items-center gap-3 mt-4 p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="customColor" className="font-medium">Couleur personnalisée :</Label>
              <Input
                id="customColor"
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-20 h-10"
              />
              <span className="text-sm text-gray-600">15 gemmes</span>
            </div>
          </div>

          {/* Images de profil */}
          <div className="space-y-3">
            <h3 className="font-semibold">Images de profil</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* FoxyMecha - 2 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyMecha.webp" 
                    alt="FoxyMecha" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyMecha</div>
                <div className="text-xs text-gray-600 mb-2">Personnage robotique</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyMecha.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 2}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyMecha.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (2 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxyTerreur - 10 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyTerreur.webp" 
                    alt="FoxyTerreur" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyTerreur</div>
                <div className="text-xs text-gray-600 mb-2">Personnage terrifiant</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyTerreur.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 10}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyTerreur.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (10 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxyHallo - 10 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyHallo.webp" 
                    alt="FoxyHallo" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyHallo</div>
                <div className="text-xs text-gray-600 mb-2">Personnage Halloween</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyHallo.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 10}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyHallo.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (10 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxyFrenchies - 50 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyFrenchies.webp" 
                    alt="FoxyFrenchies" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyFrenchies</div>
                <div className="text-xs text-gray-600 mb-2">Personnage français</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyFrenchies.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 50}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyFrenchies.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (50 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxyPink - 10 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyPink.webp" 
                    alt="FoxyPink" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyPink</div>
                <div className="text-xs text-gray-600 mb-2">Personnage rose</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyPink.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 10}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyPink.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (10 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxyWaMe - 2 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyWaMe.webp" 
                    alt="FoxyWaMe" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyWaMe</div>
                <div className="text-xs text-gray-600 mb-2">Personnage WaMe</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyWaMe.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 2}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyWaMe.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (2 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxyWaterMelon - 2 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxyWaterMelon.webp" 
                    alt="FoxyWaterMelon" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxyWaterMelon</div>
                <div className="text-xs text-gray-600 mb-2">Personnage pastèque</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxyWaterMelon.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 2}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxyWaterMelon.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (2 gemmes)'
                  }
                </Button>
              </div>

              {/* FoxySably - 30 gemmes */}
              <div className="border rounded-lg p-3 text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <Image
                    src="/profile/FoxySably.webp" 
                    alt="FoxySably" 
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium mb-1">FoxySably</div>
                <div className="text-xs text-gray-600 mb-2">Personnage Sably</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileImage', 'FoxySably.webp')}
                  disabled={purchasing || (gemData?.balance || 0) < 30}
                  className="w-full"
                >
                  {customization?.profileImage.filename === 'FoxySably.webp' && customization.profileImage.isActive 
                    ? 'Actif' 
                    : 'Acheter (30 gemmes)'
                  }
                </Button>
              </div>
            </div>
          </div>

          {/* Contour de profil */}
          <div className="space-y-3">
            <h3 className="font-semibold">Contour de profil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Contour doré */}
              <div className="border rounded-lg p-3 text-center">
                <Crown className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <div className="text-sm text-gray-600 mb-2">Contour doré</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileBorder', 'gold')}
                  disabled={purchasing || (gemData?.balance || 0) < 3}
                  className="w-full"
                >
                  {customization?.profileBorder.filename === 'gold.svg' && customization.profileBorder.isActive 
                    ? 'Actif' 
                    : 'Acheter (3 gemmes)'
                  }
                </Button>
              </div>
              
              {/* Contour argenté */}
              <div className="border rounded-lg p-3 text-center">
                <Crown className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-600 mb-2">Contour argenté</div>
                <Button
                  size="sm"
                  onClick={() => purchaseCustomization('profileBorder', 'silver')}
                  disabled={purchasing || (gemData?.balance || 0) < 2}
                  className="w-full"
                >
                  {customization?.profileBorder.filename === 'silver.svg' && customization.profileBorder.isActive 
                    ? 'Actif' 
                    : 'Acheter (2 gemmes)'
                  }
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aperçu du profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Aperçu de votre profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
            <ProfileAvatar
              username={userData?.username || ''}
              points={userData?.points || 0}
              size="large"
              userId={userData?.id}
              customization={customization || undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages d'erreur et de succès */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Historique des transactions
          </CardTitle>
          <CardDescription>
            Suivez toutes vos transactions de gemmes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={toggleHistory}
            variant="outline"
            className="w-full mb-4"
          >
            {showHistory ? 'Masquer l&apos;historique' : 'Afficher l&apos;historique'}
          </Button>

          {showHistory && (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Chargement de l&apos;historique...</p>
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => {
                  const status = formatTransactionStatus(transaction.status);
                  return (
                    <div key={transaction.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatTransactionType(transaction.type)}
                          </span>
                        </div>
                        <div className={`text-sm font-medium ${
                          transaction.gems > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.gems > 0 ? '+' : ''}{transaction.gems} gemmes
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-800 mb-2">{transaction.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</span>
                        
                        {transaction.partnerName && (
                          <span className="text-blue-600">Partenaire: {transaction.partnerName}</span>
                        )}
                        
                        {transaction.promoCode && (
                          <span className="text-purple-600">Code: {transaction.promoCode}</span>
                        )}
                      </div>

                      {transaction.justification && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                          <strong>Justification:</strong> {transaction.justification}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune transaction trouvée
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Styles CSS pour l'animation rainbow */}
      <style jsx>{`
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GemManager;
