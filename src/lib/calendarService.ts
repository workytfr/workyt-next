/**
 * Service pour gérer le calendrier avec récompenses quotidiennes
 */

import Calendar from '@/models/Calendar';
import CalendarClaim from '@/models/CalendarClaim';
import User from '@/models/User';
import Gem from '@/models/Gem';
import PointTransaction from '@/models/PointTransaction';
import dbConnect from '@/lib/mongodb';

/**
 * Configuration des fêtes et dates spéciales
 */
export interface HolidayConfig {
  date: Date;
  theme: 'default' | 'christmas' | 'newyear' | 'chinese_newyear' | 'eastern' | 'indian' | 'japanese' | 'canadian' | 'french_civil' | 'french_cultural';
  reward: {
    type: 'points' | 'gems';
    amount: number;
  };
  isSpecial: boolean;
  specialName: string;
  description?: string;
}

/**
 * Obtient toutes les dates spéciales pour une période donnée
 */
export function getHolidayConfigs(startDate: Date, endDate: Date): HolidayConfig[] {
  const holidays: HolidayConfig[] = [];
  
  // Fonction helper pour créer une date à minuit
  const createDate = (year: number, month: number, day: number): Date => {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const currentYear = startDate.getFullYear();
  const nextYear = endDate.getFullYear();

  // Fêtes françaises civiles
  holidays.push(
    { date: createDate(currentYear, 1, 1), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Jour de l\'An' },
    { date: createDate(currentYear, 5, 1), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête du Travail' },
    { date: createDate(currentYear, 5, 8), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Victoire 1945' },
    { date: createDate(currentYear, 7, 14), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête nationale' },
    { date: createDate(currentYear, 8, 15), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Assomption' },
    { date: createDate(currentYear, 11, 1), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Toussaint' },
    { date: createDate(currentYear, 11, 11), theme: 'french_civil', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Armistice 1918' }
  );

  // Noël et Réveillon - toujours configurés pour toutes les années
  // 24 décembre - Réveillon
  holidays.push({
    date: createDate(currentYear, 12, 24),
    theme: 'christmas',
    reward: { type: 'gems', amount: 1 },
    isSpecial: true,
    specialName: 'Réveillon',
    description: '1 diamant'
  });

  // 25 décembre - Noël
  holidays.push({
    date: createDate(currentYear, 12, 25),
    theme: 'christmas',
    reward: { type: 'gems', amount: 2 },
    isSpecial: true,
    specialName: 'Noël',
    description: '2 diamants'
  });

  // Fêtes populaires et culturelles françaises
  holidays.push(
    { date: createDate(currentYear, 2, 2), theme: 'french_cultural', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Chandeleur' },
    { date: createDate(currentYear, 2, 14), theme: 'french_cultural', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Saint-Valentin' },
    { date: createDate(currentYear, 6, 21), theme: 'french_cultural', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête de la Musique' }
  );

  // Jour de l'An et Épiphanie pour l'année suivante si nécessaire
  if (nextYear > currentYear) {
    // 1er janvier de l'année suivante - Jour de l'An
    holidays.push({
      date: createDate(nextYear, 1, 1),
      theme: 'newyear',
      reward: { type: 'gems', amount: 1 },
      isSpecial: true,
      specialName: 'Jour de l\'An',
      description: '1 diamant'
    });

    // 6 janvier de l'année suivante - Épiphanie
    holidays.push({
      date: createDate(nextYear, 1, 6),
      theme: 'french_cultural',
      reward: { type: 'gems', amount: 1 },
      isSpecial: true,
      specialName: 'Épiphanie',
      description: '1 diamant'
    });
  }

  // Nouvel An chinois 2026 (16-23 février) - février = mois 2
  holidays.push(
    { date: createDate(2026, 2, 16), theme: 'chinese_newyear', reward: { type: 'gems', amount: 1 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 17), theme: 'chinese_newyear', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 18), theme: 'chinese_newyear', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 19), theme: 'chinese_newyear', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 20), theme: 'chinese_newyear', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 21), theme: 'chinese_newyear', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 22), theme: 'chinese_newyear', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Nouvel An chinois' },
    { date: createDate(2026, 2, 23), theme: 'chinese_newyear', reward: { type: 'gems', amount: 1 }, isSpecial: true, specialName: 'Nouvel An chinois' }
  );

  // Fête orientale (19 février - 18 mars 2026)
  // Note: Le 19 février est déjà couvert par le Nouvel An chinois, donc on commence le 20
  // Février = mois 2, Mars = mois 3
  for (let day = 20; day <= 28; day++) {
    holidays.push({
      date: createDate(2026, 2, day),
      theme: 'eastern',
      reward: { type: 'points', amount: 15 },
      isSpecial: true,
      specialName: 'Fête orientale'
    });
  }
  // Mars (mois 3)
  for (let day = 1; day <= 17; day++) {
    holidays.push({
      date: createDate(2026, 3, day),
      theme: 'eastern',
      reward: { type: 'points', amount: 15 },
      isSpecial: true,
      specialName: 'Fête orientale'
    });
  }
  holidays.push({
    date: createDate(2026, 3, 18),
    theme: 'eastern',
    reward: { type: 'gems', amount: 1 },
    isSpecial: true,
    specialName: 'Fête orientale'
  });

  // Fêtes indiennes (Diwali 2026)
  holidays.push(
    { date: createDate(2026, 11, 6), theme: 'indian', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Dhanteras' },
    { date: createDate(2026, 11, 7), theme: 'indian', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Naraka Chaturdashi' },
    { date: createDate(2026, 11, 8), theme: 'indian', reward: { type: 'gems', amount: 1 }, isSpecial: true, specialName: 'Diwali' },
    { date: createDate(2026, 11, 9), theme: 'indian', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Govardhan Puja' },
    { date: createDate(2026, 11, 10), theme: 'indian', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Bhai Dooj' }
  );

  // Fêtes japonaises 2026
  holidays.push(
    { date: createDate(2026, 1, 1), theme: 'japanese', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Oshōgatsu' },
    { date: createDate(2026, 1, 2), theme: 'japanese', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Oshōgatsu' },
    { date: createDate(2026, 1, 3), theme: 'japanese', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Oshōgatsu' },
    { date: createDate(2026, 2, 3), theme: 'japanese', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Setsubun' },
    { date: createDate(2026, 7, 7), theme: 'japanese', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Tanabata' },
    { date: createDate(2026, 8, 13), theme: 'japanese', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Obon' },
    { date: createDate(2026, 8, 14), theme: 'japanese', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Obon' },
    { date: createDate(2026, 8, 15), theme: 'japanese', reward: { type: 'points', amount: 15 }, isSpecial: true, specialName: 'Obon' },
    { date: createDate(2026, 8, 16), theme: 'japanese', reward: { type: 'gems', amount: 1 }, isSpecial: true, specialName: 'Obon' }
  );

  // Fêtes canadiennes 2026
  holidays.push(
    { date: createDate(2026, 4, 3), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Vendredi saint' },
    { date: createDate(2026, 5, 18), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête de Victoria' },
    { date: createDate(2026, 6, 24), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête nationale du Québec' },
    { date: createDate(2026, 7, 1), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête du Canada' },
    { date: createDate(2026, 9, 7), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Fête du Travail' },
    { date: createDate(2026, 10, 12), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Action de grâce' },
    { date: createDate(2026, 11, 11), theme: 'canadian', reward: { type: 'points', amount: 10 }, isSpecial: true, specialName: 'Jour du Souvenir' }
  );

  // Filtrer les fêtes dans la période demandée
  return holidays.filter(h => {
    const holidayDate = h.date;
    return holidayDate >= startDate && holidayDate <= endDate;
  });
}

/**
 * Initialise ou met à jour les jours du calendrier pour une période donnée
 */
export async function initializeCalendarPeriod(startDate: Date, endDate: Date): Promise<void> {
  await dbConnect();

  // Fonction helper pour formater une date en local (sans UTC)
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const holidays = getHolidayConfigs(startDate, endDate);
  const holidayDates = new Set(holidays.map(h => formatDateLocal(h.date)));

  // Parcourir chaque jour de la période
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  while (currentDate <= endDate) {
    const dateStr = formatDateLocal(currentDate);
    const holiday = holidays.find(h => formatDateLocal(h.date) === dateStr);

    if (holiday) {
      // Jour spécial avec configuration de fête
      await Calendar.findOneAndUpdate(
        { date: new Date(currentDate) },
        {
          date: new Date(currentDate),
          reward: holiday.reward,
          theme: holiday.theme,
          isSpecial: true,
          specialName: holiday.specialName,
          description: holiday.description,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } else {
      // Jour normal - récompenses équilibrées
      // Utiliser une fonction déterministe basée sur la date pour que ce soit cohérent
      const dateHash = currentDate.getTime();
      
      // Points de base : 5-10 points pour les jours normaux
      const basePoints = 5 + (Math.abs(Math.sin(dateHash * 0.1)) * 5) | 0;
      
      // Les diamants sont rares : seulement 1 chance sur 20 pour les jours normaux
      const gemChance = Math.abs(Math.sin(dateHash * 0.3)) * 100;
      const isGemDay = gemChance < 5; // 5% de chance d'avoir un diamant

      await Calendar.findOneAndUpdate(
        { date: new Date(currentDate) },
        {
          date: new Date(currentDate),
          reward: {
            type: isGemDay ? 'gems' : 'points',
            amount: isGemDay ? 1 : basePoints
          },
          theme: 'default',
          isSpecial: false,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

/**
 * Réclame la récompense du jour pour un utilisateur
 * Retourne null si déjà réclamé ou si le jour n'existe pas
 */
export async function claimDailyReward(userId: string, date: Date): Promise<{
  success: boolean;
  rewardType?: 'points' | 'gems';
  amount?: number;
  message?: string;
}> {
  await dbConnect();

  // Normaliser la date à minuit
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Vérifier que c'est bien aujourd'hui
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (normalizedDate.getTime() !== today.getTime()) {
    return {
      success: false,
      message: 'Vous ne pouvez réclamer que la récompense du jour même'
    };
  }

  // Vérifier si l'utilisateur a déjà réclamé ce jour
  const existingClaim = await CalendarClaim.findOne({
    user: userId,
    date: normalizedDate
  });

  if (existingClaim) {
    return {
      success: false,
      message: 'Récompense déjà réclamée pour ce jour'
    };
  }

  // Récupérer le calendrier pour ce jour
  const calendarDay = await Calendar.findOne({ date: normalizedDate });

  if (!calendarDay) {
    // Si le jour n'existe pas, créer un jour par défaut
    const defaultDay = await Calendar.findOneAndUpdate(
      { date: normalizedDate },
      {
        date: normalizedDate,
        reward: { type: 'points', amount: 5 },
        theme: 'default',
        isSpecial: false,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    if (!defaultDay) {
      return {
        success: false,
        message: 'Erreur lors de la création du jour du calendrier'
      };
    }

    // Appliquer la récompense
    if (defaultDay.reward.type === 'points') {
      await User.findByIdAndUpdate(userId, {
        $inc: { points: defaultDay.reward.amount }
      });

      const transaction = new PointTransaction({
        user: userId,
        action: 'completeQuiz', // Action temporaire pour le calendrier
        type: 'gain',
        points: defaultDay.reward.amount
      });
      await transaction.save();
    } else if (defaultDay.reward.type === 'gems') {
      let gem = await Gem.findOne({ user: userId });
      if (!gem) {
        gem = new Gem({
          user: userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0
        });
      }
      gem.balance += defaultDay.reward.amount;
      gem.totalEarned += defaultDay.reward.amount;
      await gem.save();
    }

    // Enregistrer la réclamation
    const claim = new CalendarClaim({
      user: userId,
      calendar: defaultDay._id,
      date: normalizedDate,
      rewardType: defaultDay.reward.type,
      rewardAmount: defaultDay.reward.amount
    });
    await claim.save();

    return {
      success: true,
      rewardType: defaultDay.reward.type,
      amount: defaultDay.reward.amount
    };
  }

  // Appliquer la récompense
  if (calendarDay.reward.type === 'points') {
    await User.findByIdAndUpdate(userId, {
      $inc: { points: calendarDay.reward.amount }
    });

    const transaction = new PointTransaction({
      user: userId,
      action: 'completeQuiz',
      type: 'gain',
      points: calendarDay.reward.amount
    });
    await transaction.save();
  } else if (calendarDay.reward.type === 'gems') {
    let gem = await Gem.findOne({ user: userId });
    if (!gem) {
      gem = new Gem({
        user: userId,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0
      });
    }
    gem.balance += calendarDay.reward.amount;
    gem.totalEarned += calendarDay.reward.amount;
    await gem.save();
  }

  // Enregistrer la réclamation
  const claim = new CalendarClaim({
    user: userId,
    calendar: calendarDay._id,
    date: normalizedDate,
    rewardType: calendarDay.reward.type,
    rewardAmount: calendarDay.reward.amount
  });
  await claim.save();

  return {
    success: true,
    rewardType: calendarDay.reward.type,
    amount: calendarDay.reward.amount
  };
}

/**
 * Obtient les données du calendrier pour une période donnée
 */
export async function getCalendarData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  days: Array<{
    date: Date;
    reward: { type: 'points' | 'gems'; amount: number };
    theme: string;
    isSpecial: boolean;
    specialName?: string;
    description?: string;
    claimed: boolean;
  }>;
}> {
  await dbConnect();

  // Normaliser les dates
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Récupérer les jours du calendrier
  const calendarDays = await Calendar.find({
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  // Récupérer les réclamations de l'utilisateur
  const claims = await CalendarClaim.find({
    user: userId,
    date: { $gte: start, $lte: end }
  });

  // Fonction helper pour formater une date en local (sans UTC)
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const claimsMap = new Map(
    claims.map(c => [formatDateLocal(c.date), true])
  );

  // Construire la réponse
  const days = calendarDays.map(day => ({
    date: day.date,
    reward: day.reward,
    theme: day.theme,
    isSpecial: day.isSpecial,
    specialName: day.specialName,
    description: day.description,
    claimed: claimsMap.has(formatDateLocal(day.date))
  }));

  return { days };
}

