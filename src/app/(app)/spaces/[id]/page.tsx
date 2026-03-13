'use client';

import { Mic, User, Volume2, PlusCircle, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { use } from 'react'; // 1. Import 'use' hook

interface AudioSpacePageProps {
  // 2. Update params to be a Promise
  params: Promise<{
    id: string;
  }>;
}

export default function AudioSpacePage({ params }: AudioSpacePageProps) {
  const { t } = useTranslation();

  // 3. Unwrap the params using the use() hook
  // (Even if you aren't using 'id' yet, this fixes the type error)
  const { id } = use(params);

  // Mock data for the audio space
  const spaceDetails = {
    title: 'Discussion on Srimad Bhagavatam Canto 1',
    speakers: ['Krishna Das', 'Radha Priya', 'Gopal'],
    listeners: 45,
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 h-full">
      <div className="bg-card rounded-xl shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <p className="text-xs text-green-500 font-semibold">LIVE</p>
          <h1 className="text-2xl font-bold mt-1">{spaceDetails.title}</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <User className="h-4 w-4 mr-1" />
            <span>{spaceDetails.listeners} Listeners</span>
          </div>
        </div>

        {/* Speakers Section */}
        <div className="p-8 flex-1">
          <h2 className="text-lg font-semibold mb-4">{t('live.speakers')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
            {spaceDetails.speakers.map(speaker => (
              <div key={speaker} className="text-center">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Mic className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-2 font-semibold text-sm">{speaker}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Listeners Section Placeholder */}
        <div className="p-8 border-t">
           <h2 className="text-lg font-semibold mb-4">{t('live.listeners')}</h2>
           <p className="text-sm text-muted-foreground">...and {spaceDetails.listeners} others listening</p>
        </div>

        {/* Footer Actions */}
        <div className="bg-muted/50 p-4 border-t flex justify-between items-center">
            <button className="font-semibold text-red-500">{t('live.leaveQuietly')}</button>
            <div className="flex items-center gap-4">
                <button><Volume2 className="h-6 w-6 text-muted-foreground" /></button>
                <button><PlusCircle className="h-6 w-6 text-muted-foreground" /></button>
                <button className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-full px-4 py-2">
                    <Hand className="h-5 w-5"/>
                    <span>{t('live.raiseHand')}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}