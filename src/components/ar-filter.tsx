'use client';

import { Sparkles, Camera } from 'lucide-react';
import { useState } from 'react';

// Mock data for AR filters
const mockFilters = [
  { id: 'filter1', name: 'Tilak', preview: '🕉️' },
  { id: 'filter2', name: 'Flower Crown', preview: '🌸' },
  { id: 'filter3', name: 'Gita Verse', preview: '📜' },
  { id: 'filter4', name: 'Peacock Feather', preview: '🦚' },
];

export default function ARFilterComponent() {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md mx-auto aspect-square bg-gray-200 rounded-lg relative overflow-hidden">
      {/* Camera View Placeholder */}
      <div className="h-full w-full flex items-center justify-center">
        <Camera className="h-24 w-24 text-gray-400" />
        {selectedFilter && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl">
            {mockFilters.find(f => f.id === selectedFilter)?.preview}
          </div>
        )}
      </div>

      {/* Filter Selector */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
        <div className="flex items-center justify-center space-x-4 overflow-x-auto">
          {mockFilters.map(filter => (
            <button 
              key={filter.id} 
              onClick={() => setSelectedFilter(filter.id)} 
              className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl transition-all ${selectedFilter === filter.id ? 'border-4 border-primary' : 'border-2 border-white'}`}>
              {filter.preview}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
