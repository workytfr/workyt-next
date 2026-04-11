"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Palette, Crown, Coins, Award, Star, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ProfileAvatar from '@/components/ui/profile';

interface GemData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

interface CustomizationData {
  usernameColor: {
    type: 'solid' | 'gradient' | 'rainbow' | 'neon' | 'automne' | 'galaxy' | 'fire' | 'ice' | 'lightning' | 'cosmic' | 'diamond' | 'legendary' | 'glitch' | 'stardust' | 'nitro' | 'typewriter' | 'custom';
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

interface OwnedItem {
  cosmeticType: string;
  cosmeticId: string;
  source: string;
  acquiredAt: string;
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
  const [ownedItems, setOwnedItems] = useState<OwnedItem[]>([]);
  const [equipped, setEquipped] = useState<{
    profileImage: string | null;
    profileBorder: string | null;
    usernameColor: { type: string; value: string } | null;
  }>({ profileImage: null, profileBorder: null, usernameColor: null });

  // Badge selection state
  const [earnedBadges, setEarnedBadges] = useState<{ slug: string; name: string; icon: string; rarity: string }[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectingBadge, setSelectingBadge] = useState(false);
  const [badgeFeatureUnlocked, setBadgeFeatureUnlocked] = useState(false);

  const isOwned = (cosmeticType: string, cosmeticId: string) =>
    ownedItems.some((item) => item.cosmeticType === cosmeticType && item.cosmeticId === cosmeticId);

  const isEquipped = (cosmeticType: string, cosmeticId: string) => {
    if (cosmeticType === 'profile_image') return equipped.profileImage === cosmeticId;
    if (cosmeticType === 'profile_border') return equipped.profileBorder === cosmeticId;
    if (cosmeticType === 'username_color') return equipped.usernameColor?.type === cosmeticId;
    return false;
  };

  const loadInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setOwnedItems(data.inventory);
        setEquipped(data.equipped);
      }
    } catch (e) {
      console.error('Erreur inventaire:', e);
    }
  };

  const equipItem = async (cosmeticType: string, cosmeticId: string) => {
    try {
      setPurchasing(true);
      const isCurrentlyEquipped = isEquipped(cosmeticType, cosmeticId);
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cosmeticType,
          cosmeticId,
          action: isCurrentlyEquipped ? 'unequip' : 'equip',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(isCurrentlyEquipped ? 'Cosmétique déséquipé' : 'Cosmétique équipé !');
        await loadInventory();
        await loadGemData();
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Erreur lors de l\'équipement');
    } finally {
      setPurchasing(false);
    }
  };

  // Charger les badges de l'utilisateur
  const loadBadges = async () => {
    if (!session?.user?.id) return;
    try {
      const [badgeRes, statusRes] = await Promise.all([
        fetch(`/api/badges?userId=${session.user.id}`),
        fetch('/api/badges/select'),
      ]);
      const badgeData = await badgeRes.json();
      const statusData = await statusRes.json();

      setEarnedBadges((badgeData.userBadges || []).map((b: any) => ({
        slug: b.slug,
        name: b.name,
        icon: b.icon,
        rarity: b.rarity,
      })));
      setSelectedBadge(badgeData.selectedBadge || null);
      setBadgeFeatureUnlocked(statusData.unlocked || false);
    } catch (e) {
      console.error('Erreur chargement badges:', e);
    }
  };

  const handleSelectBadge = async (badgeSlug: string | null) => {
    if (selectingBadge) return;
    setSelectingBadge(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/badges/select', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeSlug }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedBadge(badgeSlug);
        setBadgeFeatureUnlocked(true);
        setSuccess(badgeSlug ? `Badge "${earnedBadges.find(b => b.slug === badgeSlug)?.name}" affiche sur votre profil` : 'Badge retire du profil');
        if (data.newBalance !== undefined && gemData) {
          setGemData({ ...gemData, balance: data.newBalance });
        }
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Erreur lors du changement de badge');
    } finally {
      setSelectingBadge(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    if (session?.user) {
      loadGemData();
      loadInventory();
      loadBadges();
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
    // Mapper les types pour vérifier l'inventaire
    const typeMap: Record<string, string> = {
      usernameColor: 'username_color',
      profileImage: 'profile_image',
      profileBorder: 'profile_border',
    };
    const cosmeticType = typeMap[itemType];

    // Si déjà possédé, équiper directement au lieu d'acheter
    if (cosmeticType && isOwned(cosmeticType, itemValue)) {
      await equipItem(cosmeticType, itemValue);
      return;
    }

    try {
      setPurchasing(true);
      setError(null);

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
        loadGemData();
        loadInventory();
      } else if (data.alreadyOwned) {
        setError('Vous possédez déjà cet article.');
      } else {
        setError(data.message || data.error || 'Erreur lors de l\'achat');
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

  // Helper pour le texte et style des boutons d'achat/équipement
  const getItemButtonProps = (itemType: string, itemValue: string, price: number) => {
    const typeMap: Record<string, string> = {
      usernameColor: 'username_color',
      profileImage: 'profile_image',
      profileBorder: 'profile_border',
    };
    const cosmeticType = typeMap[itemType];
    const owned = cosmeticType ? isOwned(cosmeticType, itemValue) : false;
    const equippedNow = cosmeticType ? isEquipped(cosmeticType, itemValue) : false;

    if (equippedNow) {
      return { label: 'Équipé ✓', className: 'bg-green-600 hover:bg-green-700', disabled: false, showGemIcon: false, price: 0 };
    }
    if (owned) {
      return { label: 'Équiper', className: 'bg-blue-600 hover:bg-blue-700', disabled: false, showGemIcon: false, price: 0 };
    }
    return {
      label: `Acheter (${price}`,
      className: '',
      disabled: purchasing || (gemData?.balance || 0) < price,
      showGemIcon: true,
      price,
    };
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
    <div className="space-y-8">
      {/* En-tête avec solde */}
      <div className="notion-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Image src="/badge/diamond.png" alt="" width={20} height={20} className="object-contain" />
          <h2 className="notion-heading" style={{ marginBottom: 0 }}>Solde de gemmes</h2>
        </div>
        <p className="notion-text-secondary mb-6">Votre portefeuille de gemmes</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-5 rounded-2xl" style={{ background: 'var(--notion-info-light)' }}>
            <div className="text-3xl font-bold" style={{ color: 'var(--notion-info)' }}>{gemData?.balance || 0}</div>
            <div className="notion-text-small mt-1">Gemmes disponibles</div>
          </div>
          <div className="text-center p-5 rounded-2xl" style={{ background: 'var(--notion-success-light)' }}>
            <div className="text-3xl font-bold" style={{ color: 'var(--notion-success)' }}>{gemData?.totalEarned || 0}</div>
            <div className="notion-text-small mt-1">Total gagnées</div>
          </div>
          <div className="text-center p-5 rounded-2xl" style={{ background: 'var(--notion-accent-light)' }}>
            <div className="text-3xl font-bold" style={{ color: 'var(--notion-accent)' }}>{gemData?.totalSpent || 0}</div>
            <div className="notion-text-small mt-1">Total dépensées</div>
          </div>
        </div>
      </div>

      {/* Conversion de points */}
      <div className="notion-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-5 w-5" style={{ color: 'var(--notion-accent)' }} />
          <h2 className="notion-heading" style={{ marginBottom: 0 }}>Convertir des points</h2>
        </div>
        <p className="notion-text-secondary mb-6">Ratio : 100 points = 1 gemme</p>
        <div>
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
            <div className="rounded-2xl p-5" style={{ background: 'var(--notion-bg-secondary)' }}>
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
        </div>
      </div>

      {/* Personnalisations */}
      <div className="notion-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5" style={{ color: 'var(--notion-accent)' }} />
          <h2 className="notion-heading" style={{ marginBottom: 0 }}>Personnalisations</h2>
        </div>
        <p className="notion-text-secondary mb-6">Achetez des personnalisations avec vos gemmes</p>
        <div className="space-y-6">
          {/* Couleurs de nom d'utilisateur */}
          <div className="space-y-3">
            <h3 className="font-semibold">Couleur du nom d&apos;utilisateur</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {[
                // Couleurs basiques
                { type: 'solid', label: 'Simple', price: 3, color: '#3B82F6', rarity: 'common' },
                { type: 'gradient', label: 'Dégradé', price: 5, color: 'linear-gradient(45deg, #3B82F6, #8B5CF6)', rarity: 'common' },
                
                // Couleurs spéciales  
                { type: 'rainbow', label: 'Arc-en-ciel', price: 10, color: '#FF4500', rarity: 'common', animated: true },
                { type: 'neon', label: 'Néon', price: 15, color: '#00FFFF', rarity: 'common', animated: true },
                { type: 'automne', label: 'Automne', price: 20, color: '#D2691E', rarity: 'rare', animated: true },
                { type: 'galaxy', label: 'Galaxie', price: 25, color: '#4B0082', rarity: 'rare', animated: true },
                { type: 'fire', label: 'Feu', price: 30, color: '#FF4500', rarity: 'epic', animated: true },
                { type: 'ice', label: 'Glace', price: 30, color: '#0369A1', rarity: 'epic', animated: true },
                { type: 'lightning', label: 'Éclair', price: 35, color: '#FFD700', rarity: 'epic', animated: true },
                { type: 'cosmic', label: 'Cosmique', price: 40, color: '#9370DB', rarity: 'epic', animated: true },
                { type: 'diamond', label: 'Diamant', price: 45, color: '#4A90E2', rarity: 'legendary', animated: true },
                { type: 'legendary', label: 'Légendaire', price: 50, color: '#FFD700', rarity: 'legendary', animated: true },
                
                // Styles typographiques
                { type: 'typewriter', label: 'Machine à écrire', price: 25, color: '#22C55E', rarity: 'rare', animated: true },
                { type: 'glitch', label: 'Glitch', price: 35, color: '#FF0080', rarity: 'epic', animated: true },
                { type: 'stardust', label: 'Poussière d\'étoiles', price: 40, color: '#9932CC', rarity: 'epic', animated: true },
                { type: 'nitro', label: 'Nitro', price: 55, color: '#5865F2', rarity: 'legendary', animated: true },
                
                // Couleur personnalisée
                { type: 'custom', label: 'Personnalisée', price: 8, color: customColor, rarity: 'common' }
              ].map((option) => (
                <div key={option.type} className={`border rounded-lg p-3 text-center relative ${
                  option.rarity === 'common' ? 'border-gray-200' :
                  option.rarity === 'rare' ? 'border-blue-300' :
                  option.rarity === 'epic' ? 'border-purple-400' :
                  option.rarity === 'legendary' ? 'border-orange-400' :
                  'border-gray-300'
                }`}>
                  {/* Badge de rareté */}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full ${
                    option.rarity === 'common' ? 'bg-gray-100 text-gray-600' :
                    option.rarity === 'rare' ? 'bg-blue-100 text-blue-600' :
                    option.rarity === 'epic' ? 'bg-purple-100 text-purple-600' :
                    option.rarity === 'legendary' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {option.rarity === 'common' ? '★' :
                     option.rarity === 'rare' ? '★★' :
                     option.rarity === 'epic' ? '★★★' :
                     option.rarity === 'legendary' ? '★★★★' :
                     '★'}
                  </div>
                  
                  {/* Aperçu de la couleur */}
                  <div 
                    className={`w-12 h-12 mx-auto mb-2 rounded-full ${
                      option.animated ? 'animate-pulse' : ''
                    }`}
                    style={{
                      background: option.type === 'rainbow' 
                        ? 'linear-gradient(45deg, #FF4500, #FF8C00, #1E90FF, #32CD32, #FF1493)'
                        : option.type === 'neon'
                        ? 'linear-gradient(45deg, #00FF00, #00FFFF, #FF00FF)'
                        : option.type === 'automne'
                        ? 'linear-gradient(45deg, #FF6B35, #F7931E, #FFD700, #FF4500, #8B4513)'
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
                        ? 'linear-gradient(45deg, #4A90E2, #87CEEB, #1E90FF, #4169E1)'
                        : option.type === 'legendary'
                        ? 'linear-gradient(45deg, #F97316, #FB923C, #FDBA74, #FED7AA)'
                        : option.type === 'glitch'
                        ? 'linear-gradient(45deg, #FF0080, #00FFFF, #FF0080, #00FFFF)'
                        : option.type === 'stardust'
                        ? 'linear-gradient(45deg, #9932CC, #8A2BE2, #DA70D6, #9370DB)'
                        : option.type === 'nitro'
                        ? 'linear-gradient(45deg, #5865F2, #7289DA, #99AAB5, #5865F2)'
                        : option.type === 'typewriter'
                        ? 'linear-gradient(45deg, #22C55E, #10B981, #059669, #22C55E)'
                        : option.color
                    }}
                  />
                  
                  <div className="text-sm font-medium mb-1">{option.label}</div>
                  <div className="text-xs text-gray-600 mb-2 flex items-center justify-center gap-1">{option.price} <Image src="/badge/diamond.png" alt="" width={14} height={14} className="object-contain" /></div>
                  
                  {/* Aperçu animé du nom */}
                  {option.animated && (
                    <div className="bg-white rounded p-1 mb-2 border text-center">
                      <div className="text-xs text-gray-500 mb-1">Aperçu:</div>
                      <span 
                        className="text-sm font-medium"
                        style={{
                          animation: `${option.type} 3s ease-in-out infinite`,
                          ...(option.type === 'rainbow' ? { 
                                color: '#FF4500',
                                fontFamily: 'Arial Black, sans-serif',
                                fontWeight: '900'
                              } :
                              option.type === 'neon' ? { color: '#00FFFF', textShadow: '0 0 8px #00FFFF', fontFamily: 'Impact, sans-serif', fontWeight: 'bold' } :
                              option.type === 'automne' ? { color: '#D2691E', fontFamily: 'Georgia, serif', fontWeight: 'bold' } :
                              option.type === 'galaxy' ? { background: 'linear-gradient(45deg, #4B0082, #8A2BE2, #9370DB)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Verdana, sans-serif', fontWeight: 'bold' } :
                              option.type === 'fire' ? { color: '#FF4500', textShadow: '0 0 6px #FF6347', fontFamily: 'Arial Black, sans-serif', fontWeight: '900' } :
                              option.type === 'ice' ? { color: '#0369A1', fontFamily: 'Trebuchet MS, sans-serif', fontWeight: 'bold' } :
                              option.type === 'lightning' ? { color: '#FFD700', textShadow: '0 0 6px #FFFF00', fontFamily: 'Comic Sans MS, cursive', fontWeight: 'bold' } :
                              option.type === 'cosmic' ? { background: 'linear-gradient(90deg, #9370DB, #8A2BE2, #4B0082)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Courier New, monospace', fontWeight: 'bold' } :
                              option.type === 'diamond' ? { color: '#4A90E2', textShadow: '0 0 6px #87CEEB', fontFamily: 'Times New Roman, serif', fontWeight: 'bold', letterSpacing: '2px' } :
                              option.type === 'legendary' ? { background: 'linear-gradient(45deg, #FFD700, #FFA500, #FF8C00)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Palatino, serif', fontWeight: 'bold' } :
                              option.type === 'glitch' ? { color: '#FF0080', fontFamily: 'Courier New, monospace', fontWeight: 'bold' } :
                              option.type === 'stardust' ? { color: '#9932CC', textShadow: '0 0 6px #DA70D6', fontFamily: 'Georgia, serif', fontWeight: 'bold', fontStyle: 'italic' } :
                              option.type === 'nitro' ? { background: 'linear-gradient(90deg, #5865F2, #7289DA, #99AAB5)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' } :
                              option.type === 'typewriter' ? { color: '#22C55E', fontFamily: 'Courier New, monospace', fontWeight: 'bold' } :
                              { color: option.color })
                        }}
                      >
                        {userData?.username || 'MonNom'}
                      </span>
                    </div>
                  )}
                  
                  {/* Aperçu pour couleurs non-animées */}
                  {!option.animated && (
                    <div className="bg-white rounded p-1 mb-2 border text-center">
                      <div className="text-xs text-gray-500 mb-1">Aperçu:</div>
                      <span 
                        className="text-sm font-medium"
                        style={{
                          ...(option.type === 'solid' ? { color: option.color } :
                              option.type === 'gradient' ? { 
                                background: option.color, 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              } :
                              option.type === 'custom' ? { color: customColor } :
                              { color: option.color })
                        }}
                      >
                        {userData?.username || 'MonNom'}
                      </span>
                    </div>
                  )}

                  {/* Indicateur d'animation */}
                  {option.animated && (
                    <div className="text-xs text-purple-600 mb-2 font-semibold">✨ Animé</div>
                  )}
                  
                  {(() => {
                    const bp = getItemButtonProps('usernameColor', option.type, option.price);
                    return (
                      <Button
                        size="sm"
                        onClick={() => purchaseCustomization('usernameColor', option.type)}
                        disabled={bp.disabled}
                        className={`w-full ${bp.className || (
                          option.rarity === 'common' ? 'bg-gray-600 hover:bg-gray-700' :
                          option.rarity === 'rare' ? 'bg-blue-600 hover:bg-blue-700' :
                          option.rarity === 'epic' ? 'bg-purple-600 hover:bg-purple-700' :
                          option.rarity === 'legendary' ? 'bg-orange-600 hover:bg-orange-700' :
                          'bg-gray-600 hover:bg-gray-700'
                        )}`}
                      >
                        {bp.label}{bp.showGemIcon && <><Image src="/badge/diamond.png" alt="" width={14} height={14} className="inline object-contain mx-0.5" />)</>}
                      </Button>
                    );
                  })()}
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
              <span className="text-sm text-gray-600 flex items-center gap-1">15 <Image src="/badge/diamond.png" alt="" width={14} height={14} className="object-contain" /></span>
            </div>
          </div>

          {/* Images de profil */}
          <div className="space-y-3">
            <h3 className="font-semibold">Images de profil</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { filename: 'FoxyMecha.webp', label: 'FoxyMecha', desc: 'Personnage robotique', price: 2 },
                { filename: 'FoxyTerreur.webp', label: 'FoxyTerreur', desc: 'Personnage terrifiant', price: 10 },
                { filename: 'FoxyHallo.webp', label: 'FoxyHallo', desc: 'Personnage Halloween', price: 10 },
                { filename: 'FoxyFrenchies.webp', label: 'FoxyFrenchies', desc: 'Personnage français', price: 50 },
                { filename: 'FoxyPink.webp', label: 'FoxyPink', desc: 'Personnage rose', price: 10 },
                { filename: 'FoxyWaMe.webp', label: 'FoxyWaMe', desc: 'Personnage WaMe', price: 2 },
                { filename: 'FoxyWaterMelon.webp', label: 'FoxyWaterMelon', desc: 'Personnage pastèque', price: 2 },
                { filename: 'FoxySably.webp', label: 'FoxySably', desc: 'Personnage Sably', price: 30 },
                { filename: 'FoxyLmdpc.webp', label: 'Foxy Lmdpc', desc: 'Lemondedupc.fr', price: 2, partner: true },
                { filename: 'FoxyStagey.webp', label: 'Foxy Stagey', desc: 'Stagey.fr', price: 2, partner: true },
                { filename: 'FoxyYumego.webp', label: 'Foxy YumeGo', desc: 'Japonais avec Netflix (extension Chrome)', price: 2, partner: true, link: 'https://yumego.ai/' },
              ].map((img) => {
                const bp = getItemButtonProps('profileImage', img.filename, img.price);
                return (
                  <div key={img.filename} className={`${img.partner ? 'border-2 border-blue-500' : 'border'} rounded-lg p-3 text-center relative`}>
                    {img.partner && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        Partenaire
                      </div>
                    )}
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <Image
                        src={`/profile/${img.filename}`}
                        alt={img.label}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-sm font-medium mb-1">{img.label}</div>
                    {img.link ? (
                      <a href={img.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mb-2 block">
                        {img.desc}
                      </a>
                    ) : (
                      <div className="text-xs text-gray-600 mb-2">{img.desc}</div>
                    )}
                    {img.partner && <div className="text-xs text-blue-600 font-semibold mb-2">Partenaires</div>}
                    <Button
                      size="sm"
                      onClick={() => purchaseCustomization('profileImage', img.filename)}
                      disabled={bp.disabled}
                      className={`w-full ${bp.className}`}
                    >
                      {bp.label}{bp.showGemIcon && <><Image src="/badge/diamond.png" alt="" width={14} height={14} className="inline object-contain mx-0.5" />)</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contour de profil */}
          <div className="space-y-3">
            <h3 className="font-semibold">Contour de profil</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[
                { id: 'gold', label: 'Contour doré', price: 3, icon: 'crown', iconColor: 'text-yellow-500' },
                { id: 'silver', label: 'Contour argenté', price: 2, icon: 'crown', iconColor: 'text-gray-400' },
                { id: 'eclair_green', label: 'Contour éclair vert', price: 15, file: 'eclair_green.apng', animated: true, rarity: 'epic', borderColor: 'border-green-400', btnColor: 'bg-green-600 hover:bg-green-700' },
                { id: 'fumee', label: 'Contour fumée', price: 10, file: 'fumee.png', animated: true, rarity: 'rare', borderColor: 'border-gray-400', btnColor: 'bg-gray-700 hover:bg-gray-800' },
                { id: 'poison_orange', label: 'Contour poison orange', price: 20, file: 'poison_orange.png', animated: true, rarity: 'legendary', borderColor: 'border-orange-400', btnColor: 'bg-orange-600 hover:bg-orange-700' },
                { id: 'halloween_pumpkins_apng', label: 'Contour Halloween citrouilles', price: 3, file: 'halloween_pumpkins_apng.png', animated: true, rarity: 'common', borderColor: 'border-orange-300', btnColor: 'bg-orange-500 hover:bg-orange-600' },
                { id: 'yumego_manga', label: 'Contour Yumego Manga', price: 5, file: 'yumego_manga.svg', partner: true, btnColor: 'bg-pink-500 hover:bg-pink-600' },
              ].map((border) => {
                const bp = getItemButtonProps('profileBorder', border.id, border.price);
                const rarityBadge = border.rarity === 'common' ? { stars: '★', bg: 'bg-orange-100 text-orange-600' }
                  : border.rarity === 'rare' ? { stars: '★★', bg: 'bg-blue-100 text-blue-600' }
                  : border.rarity === 'epic' ? { stars: '★★★', bg: 'bg-purple-100 text-purple-600' }
                  : border.rarity === 'legendary' ? { stars: '★★★★', bg: 'bg-orange-100 text-orange-600' }
                  : null;
                return (
                  <div key={border.id} className={`border ${border.borderColor || ''} rounded-lg p-3 text-center relative`}>
                    {rarityBadge && (
                      <div className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full ${rarityBadge.bg}`}>
                        {rarityBadge.stars}
                      </div>
                    )}
                    {border.icon === 'crown' ? (
                      <Crown className={`h-8 w-8 mx-auto ${border.iconColor} mb-2`} />
                    ) : border.file ? (
                      <div className="relative">
                        <Image
                          src={`/profile/contour/${border.file}`}
                          alt={border.label}
                          width={border.id === 'yumego_manga' ? 48 : 32}
                          height={border.id === 'yumego_manga' ? 48 : 32}
                          className="mx-auto mb-2"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div className="text-sm text-gray-600 mb-1">{border.label}</div>
                    {border.animated && <div className="text-xs text-purple-600 mb-2 font-semibold">✨ Animé</div>}
                    {border.partner && <div className="text-xs text-pink-500 mb-2 font-semibold">🌸 Partenaire</div>}
                    <Button
                      size="sm"
                      onClick={() => purchaseCustomization('profileBorder', border.id)}
                      disabled={bp.disabled}
                      className={`w-full ${bp.className || border.btnColor || ''}`}
                    >
                      {bp.label}{bp.showGemIcon && <><Image src="/badge/diamond.png" alt="" width={14} height={14} className="inline object-contain mx-0.5" />)</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Badge de profil */}
      <div className="notion-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Award className="h-5 w-5" style={{ color: 'var(--notion-accent)' }} />
          <h2 className="notion-heading" style={{ marginBottom: 0 }}>Badge de profil</h2>
        </div>
        <p className="notion-text-secondary mb-4">
          Affichez un badge a cote de votre pseudo.
          {!badgeFeatureUnlocked && (
            <> Deblocage : 5 <Image src="/badge/diamond.png" alt="" width={14} height={14} className="inline object-contain" /> (une seule fois). </>
          )}
          Limite : 1 changement par jour.
        </p>

        {/* Badge actuel */}
        {selectedBadge && (() => {
          const badge = earnedBadges.find(b => b.slug === selectedBadge);
          return badge ? (
            <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: 'var(--notion-bg-secondary)', border: '1px solid var(--notion-border)' }}>
              <Image src={badge.icon} alt={badge.name} width={32} height={32} className="w-8 h-8 object-contain" />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>{badge.name}</p>
                <p className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>Badge actuel</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSelectBadge(null)}
                disabled={selectingBadge}
                className="text-xs gap-1"
              >
                <X className="w-3 h-3" />
                Retirer
              </Button>
            </div>
          ) : null;
        })()}

        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {earnedBadges.map((badge) => {
              const isActive = selectedBadge === badge.slug;
              return (
                <button
                  key={badge.slug}
                  onClick={() => {
                    if (!isActive) handleSelectBadge(badge.slug);
                  }}
                  disabled={isActive || selectingBadge}
                  className={`relative aspect-square rounded-xl border-2 p-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
                    isActive
                      ? 'border-orange-400 ring-2 ring-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-white hover:shadow-md hover:scale-[1.03] hover:border-orange-300'
                  } disabled:opacity-60`}
                >
                  {isActive && (
                    <div className="absolute top-1 left-1">
                      <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    </div>
                  )}
                  <Image
                    src={badge.icon}
                    alt={badge.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <p className="text-[10px] sm:text-xs font-medium text-center leading-tight line-clamp-2 text-gray-800">
                    {badge.name}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 rounded-xl" style={{ background: 'var(--notion-bg-secondary)' }}>
            <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm" style={{ color: 'var(--notion-text-secondary)' }}>Aucun badge obtenu pour le moment.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--notion-text-secondary)' }}>Completez des objectifs pour debloquer des badges !</p>
          </div>
        )}
      </div>

      {/* Aperçu du profil */}
      <div className="notion-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5" style={{ color: 'var(--notion-accent)' }} />
          <h2 className="notion-heading" style={{ marginBottom: 0 }}>Aperçu de votre profil</h2>
        </div>
        <div className="flex items-center justify-center p-6 rounded-2xl" style={{ background: 'var(--notion-bg-secondary)' }}>
          <ProfileAvatar
            username={userData?.username || ''}
            points={userData?.points || 0}
            size="large"
            userId={userData?.id}
            customization={customization || undefined}
          />
        </div>
      </div>

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
      <div className="notion-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-5 w-5" style={{ color: 'var(--notion-accent)' }} />
          <h2 className="notion-heading" style={{ marginBottom: 0 }}>Historique des transactions</h2>
        </div>
        <p className="notion-text-secondary mb-6">Suivez toutes vos transactions de gemmes</p>
        <Button
          onClick={toggleHistory}
          variant="outline"
          className="w-full mb-4 rounded-xl"
        >
          {showHistory ? 'Masquer l&apos;historique' : 'Afficher l&apos;historique'}
        </Button>

        {showHistory && (
          <div className="space-y-3">
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--notion-accent)' }}></div>
                <p className="notion-text-secondary">Chargement de l&apos;historique...</p>
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((transaction) => {
                const status = formatTransactionStatus(transaction.status);
                return (
                  <div key={transaction.id} className="rounded-xl p-4" style={{ background: 'var(--notion-bg-secondary)', border: '1px solid var(--notion-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="notion-text-secondary text-sm">
                          {formatTransactionType(transaction.type)}
                        </span>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.gems > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.gems > 0 ? '+' : ''}{transaction.gems} gemmes
                      </div>
                    </div>

                    <p className="text-sm mb-2" style={{ color: 'var(--notion-text)' }}>{transaction.description}</p>

                    <div className="flex items-center justify-between notion-text-small">
                      <span>{new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</span>

                      {transaction.partnerName && (
                        <span style={{ color: 'var(--notion-info)' }}>Partenaire: {transaction.partnerName}</span>
                      )}

                      {transaction.promoCode && (
                        <span className="text-purple-600">Code: {transaction.promoCode}</span>
                      )}
                    </div>

                    {transaction.justification && (
                      <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: 'var(--notion-info-light)', color: 'var(--notion-info)' }}>
                        <strong>Justification:</strong> {transaction.justification}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 notion-text-secondary">
                Aucune transaction trouvée
              </div>
            )}
          </div>
        )}
      </div>

      {/* Styles CSS pour toutes les animations améliorées */}
      <style jsx>{`
        /* 🌈 RAINBOW - Arc-en-ciel */
        @keyframes rainbow {
          0%, 100% { 
            color: #FF4500;
            font-family: 'Arial Black', sans-serif;
            font-weight: 900;
          }
          20% { 
            color: #FF8C00;
          }
          40% { 
            color: #1E90FF;
          }
          60% { 
            color: #32CD32;
          }
          80% { 
            color: #FF1493;
          }
        }
        
        /* ⚡ NEON - Néon électrique */
        @keyframes neon {
          0%, 100% { 
            color: #00FFFF;
            text-shadow: 0 0 10px #00FFFF;
            font-family: 'Impact', sans-serif;
            font-weight: bold;
          }
          50% { 
            color: #0080FF;
            text-shadow: 0 0 15px #0080FF;
          }
        }
        
        /* 🍂 AUTOMNE - Couleurs d'automne */
        @keyframes automne {
          0%, 100% { 
            color: #D2691E;
            font-family: 'Georgia', serif;
            font-weight: bold;
          }
          50% { 
            color: #FF8C00;
          }
        }
        
        /* 🌌 GALAXY - Galaxie */
        @keyframes galaxy {
          0%, 100% { 
            background: linear-gradient(45deg, #4B0082, #8A2BE2, #9370DB);
            background-size: 200% 100%;
            background-position: 0% 50%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Verdana', sans-serif;
            font-weight: bold;
          }
          50% { 
            background-position: 100% 50%;
          }
        }
        
        /* 🌌 COSMIC - Cosmique */
        @keyframes cosmic {
          0%, 100% { 
            background: linear-gradient(90deg, #9370DB, #8A2BE2, #4B0082);
            background-size: 200% 100%;
            background-position: 0% 50%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Courier New', monospace;
            font-weight: bold;
          }
          50% { 
            background-position: 100% 50%;
          }
        }
        
        /* 🔥 FIRE - Feu */
        @keyframes fire {
          0%, 100% { 
            color: #FF4500;
            text-shadow: 0 0 8px #FF6347;
            font-family: 'Arial Black', sans-serif;
            font-weight: 900;
          }
          50% { 
            color: #FF6347;
            text-shadow: 0 0 12px #FF4500;
          }
        }
        
        /* ❄️ ICE - Glace */
        @keyframes ice {
          0%, 100% { 
            color: #0369A1;
            font-family: 'Trebuchet MS', sans-serif;
            font-weight: bold;
            letter-spacing: 1px;
          }
          50% { 
            color: #1E3A8A;
          }
        }
        
        /* ⚡ LIGHTNING - Éclair */
        @keyframes lightning {
          0%, 100% { 
            color: #FFD700;
            text-shadow: 0 0 8px #FFFF00;
            font-family: 'Comic Sans MS', cursive;
            font-weight: bold;
          }
          50% { 
            color: #FFFF00;
            text-shadow: 0 0 12px #FFD700;
          }
        }
        
        /* 💎 DIAMOND - Diamant */
        @keyframes diamond {
          0%, 100% { 
            color: #4A90E2;
            text-shadow: 0 0 8px #87CEEB;
            font-family: 'Times New Roman', serif;
            font-weight: bold;
            letter-spacing: 2px;
          }
          50% { 
            color: #1E90FF;
            text-shadow: 0 0 12px #4169E1;
          }
        }
        
        /* 👑 LEGENDARY - Légendaire */
        @keyframes legendary {
          0%, 100% { 
            background: linear-gradient(45deg, #FFD700, #FFA500, #FF8C00);
            background-size: 200% 100%;
            background-position: 0% 50%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Palatino', serif;
            font-weight: bold;
            letter-spacing: 2px;
          }
          50% { 
            background-position: 100% 50%;
          }
        }
        
        /* 🕶️ GLITCH - Glitch cyberpunk */
        @keyframes glitch {
          0%, 100% { 
            color: #FF0080;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            letter-spacing: 1px;
          }
          50% { 
            color: #00FFFF;
          }
        }
        
        /* 💫 STARDUST - Poussière d'étoiles */
        @keyframes stardust {
          0%, 100% { 
            color: #9932CC;
            text-shadow: 0 0 8px #DA70D6;
            font-family: 'Georgia', serif;
            font-weight: bold;
            font-style: italic;
          }
          50% { 
            color: #8A2BE2;
            text-shadow: 0 0 12px #9932CC;
          }
        }
        
        /* 🌈 NITRO - Style Discord */
        @keyframes nitro {
          0%, 100% { 
            background: linear-gradient(90deg, #5865F2, #7289DA, #99AAB5);
            background-size: 200% 100%;
            background-position: 0% 50%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            letter-spacing: 1px;
          }
          50% { 
            background-position: 100% 50%;
          }
        }
        
        /* 🕰️ TYPEWRITER - Machine à écrire */
        @keyframes typewriter {
          0%, 100% { 
            color: #22C55E;
            font-family: 'Courier New', monospace;
            font-weight: bold;
          }
          50% { 
            color: #10B981;
          }
        }
      `}</style>
    </div>
  );
};

export default GemManager;
