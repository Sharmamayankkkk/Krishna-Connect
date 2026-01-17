'use client';

import { useState } from 'react';
import { Image, Type, Link as LinkIcon, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type MoodboardItem = Database['public']['Tables']['moodboard_items']['Row'];

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (newItem: MoodboardItem) => void;
  moodboardId: number;
}

export default function AddItemDialog({ isOpen, onClose, onItemAdded, moodboardId }: AddItemDialogProps) {
  const supabase = createClient();
  const [itemType, setItemType] = useState<'image' | 'text' | 'link'>('image');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !moodboardId) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('moodboard_items')
      .insert({
        moodboard_id: moodboardId,
        item_type: itemType,
        content: content,
        url: itemType === 'link' ? url : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding item:', error);
    } else if (data) {
      onItemAdded(data);
      handleClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setContent('');
    setUrl('');
    setItemType('image');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Add to Mood Board</h2>
          <button onClick={handleClose}><X className="h-5 w-5"/></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-2 mb-6">
                {/* Type Selector Tabs */}
            </div>

            {/* Input fields based on type */}
            <div>
              {itemType === 'image' && (
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-muted-foreground mb-1">Image URL</label>
                  <input id="imageUrl" value={content} onChange={(e) => setContent(e.target.value)} className="input w-full" placeholder="https://example.com/image.jpg" required/>
                </div>
              )}
               {itemType === 'text' && (
                <div>
                  <label htmlFor="text" className="block text-sm font-medium text-muted-foreground mb-1">Your Text</label>
                  <textarea id="text" value={content} onChange={(e) => setContent(e.target.value)} className="textarea w-full" placeholder='"Chant and be happy!"' rows={4} required></textarea>
                </div>
              )}
              {itemType === 'link' && (
                 <div>
                   <label htmlFor="linkTitle" className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                  <input id="linkTitle" value={content} onChange={(e) => setContent(e.target.value)} className="input w-full mb-3" placeholder="My Favorite Lecture" required/>
                   <label htmlFor="linkUrl" className="block text-sm font-medium text-muted-foreground mb-1">URL</label>
                  <input id="linkUrl" value={url} onChange={(e) => setUrl(e.target.value)} className="input w-full" placeholder="https://example.com" type="url" required/>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end p-4 bg-muted/50 rounded-b-lg">
             <button type="button" onClick={handleClose} className="btn btn-ghost mr-2">Cancel</button>
             <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
