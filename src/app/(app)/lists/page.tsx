'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

// Mock data for lists - in a real app, this would come from an API
const mockLists = [
  {
    id: '1',
    name: 'Spiritual Guides',
    description: 'Wisdom from senior devotees',
    memberCount: 5,
  },
  {
    id: '2',
    name: 'Kirtan Leaders',
    description: 'Melodious voices leading us in chanting',
    memberCount: 12,
  },
  {
    id: '3',
    name: 'My Study Circle',
    description: 'Discussions on Bhagavad Gita',
    memberCount: 8,
  },
];

export default function ListsPage() {
  const { t } = useTranslation();
  const [lists, setLists] = useState(mockLists);

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('lists.title')}</h1>
        {/* <Button>Create new list</Button> */}
      </div>

      <p className="text-muted-foreground mb-8">
        {t('lists.description')}
      </p>

      <div className="space-y-4">
        {lists.map((list) => (
          <div key={list.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div>
              <h2 className="font-semibold text-lg">{list.name}</h2>
              <p className="text-sm text-muted-foreground">{list.description}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Users className="h-4 w-4 mr-1" />
                <span>{list.memberCount} {t('lists.members')}</span>
              </div>
            </div>
            <div>
              {/* Future actions like Edit, Delete, View Timeline */}
              {/* <Button variant="outline" size="sm">View</Button> */}
            </div>
          </div>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">{t('lists.noLists')}</p>
            {/* <Button className="mt-4">Create your first list</Button> */}
        </div>
      )}
    </div>
  );
}
