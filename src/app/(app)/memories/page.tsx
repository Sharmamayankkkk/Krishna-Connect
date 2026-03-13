'use client';

import { Calendar, Pin } from 'lucide-react';

import { useTranslation } from 'react-i18next';

// Mock data for memories - in a real app, this would be fetched based on the current date
const mockMemories = {
  '1 Year Ago': [
    {
      id: 'p1',
      content: 'First time attending the Mangal Aarti in Mayapur. What a divine experience! #Mayapur #Blessed',
      likes: 108,
      comments: 12,
    },
  ],
  '3 Years Ago': [
    {
      id: 'p2',
      content: 'Reflecting on the beauty of the Yamuna River today. So peaceful and purifying.',
      likes: 85,
      comments: 7,
    },
    {
      id: 'p3',
      content: 'Made some new devotee friends at the local temple feast! So grateful for the community.',
      likes: 64,
      comments: 5,
    },
  ],
};

export default function MemoriesPage() {
  const { t } = useTranslation();

  const hasMemories = Object.keys(mockMemories).length > 0;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">{t('feed.memoryLane')}</h1>
        <p className="text-xl text-muted-foreground mt-2">
          A look back at your posts from <span className="text-primary font-semibold">{today}</span>.
        </p>
      </div>

      {hasMemories ? (
        <div className="space-y-12">
          {Object.entries(mockMemories).map(([timeframe, posts]) => (
            <div key={timeframe}>
              <h2 className="text-2xl font-bold flex items-center mb-4">
                <Calendar className="h-6 w-6 mr-2" />
                {timeframe}
              </h2>
              <div className="space-y-6">
                {posts.map(post => (
                  <div key={post.id} className="border rounded-lg p-6 bg-card relative">
                    <Pin className="h-5 w-5 text-muted-foreground/50 absolute top-3 right-3" />
                    <p className="text-lg">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-4">
                        <span>{post.likes} Likes</span>
                        <span>{post.comments} Comments</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <p className="text-xl text-muted-foreground">{t('feed.noMemoriesFromThisDay')}</p>
            <p className="mt-2">{t('feed.comeBackTomorrowToSeeIf')}</p>
        </div>
      )}
    </div>
  );
}
