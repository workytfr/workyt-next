"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Calendar from '@/components/Calendar';
import { Gift, Sparkles } from 'lucide-react';
import Image from 'next/image';
import NoSSR from '@/components/NoSSR';

export default function CalendarPageClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  return (
    <NoSSR>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {/* Info banner */}
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Gift className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Quotidien</p>
                  <p className="text-xs text-gray-500">Reclamez le jour meme, sinon c&apos;est perdu</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Image src="/badge/diamond.png" alt="" width={16} height={16} className="object-contain mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Diamants</p>
                  <p className="text-xs text-gray-500">Rares, surtout les jours speciaux</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Jours speciaux</p>
                  <p className="text-xs text-gray-500">Recompenses ameliorees les jours de fete</p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <Calendar />
          </div>
        </div>
      </div>
    </NoSSR>
  );
}
