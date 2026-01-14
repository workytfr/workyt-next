"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar as CalendarIcon, Gift, Info } from 'lucide-react';
import Image from 'next/image';
import NoSSR from '@/components/NoSSR';

export default function CalendarPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  return (
    <NoSSR>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto py-6 px-4">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <CalendarIcon className="h-10 w-10" />
              Calendrier Mensuel
            </h1>
            <p className="text-muted-foreground">
              Réclamez votre récompense quotidienne le jour même ! Connectez-vous chaque jour pour ne rien manquer.
            </p>
          </div>

          {/* Informations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Comment ça fonctionne ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Gift className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-semibold">Récompense quotidienne</p>
                    <p className="text-sm text-muted-foreground">
                      Chaque jour, vous pouvez réclamer une récompense uniquement le jour même. Cliquez sur &quot;Réclamer&quot; pour obtenir vos points ou diamants. Si vous manquez un jour, la récompense est perdue.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Image 
                      src="/badge/points.png" 
                      alt="Points" 
                      width={20} 
                      height={20} 
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">Points</p>
                    <p className="text-sm text-muted-foreground">
                      Gagnez entre 5 et 20 points par jour pendant les fêtes. Les jours normaux, vous gagnez jusqu&apos;à 3 points.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Image 
                      src="/badge/diamond.png" 
                      alt="Diamants" 
                      width={20} 
                      height={20} 
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">Diamants</p>
                    <p className="text-sm text-muted-foreground">
                      Les diamants sont rares ! Vous avez 1 chance sur 18 de gagner un diamant pendant les fêtes. Les jours spéciaux comme Noël offrent jusqu&apos;à 2 diamants.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 mt-0.5 text-green-500" />
                  <div>
                    <p className="font-semibold">Jours spéciaux</p>
                    <p className="text-sm text-muted-foreground">
                      Les jours marqués d&apos;une étoile ⭐ sont des jours spéciaux avec des récompenses améliorées. Ne les manquez pas !
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendrier */}
          <Calendar />
        </div>
      </div>
    </NoSSR>
  );
}

