'use client';

import { Plus, Image, Type, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import AddItemDialog from './components/add-item-dialog';

// Define types based on our new database schema
type Moodboard = Database['public']['Tables']['moodboards']['Row'];
type MoodboardItem = Database['public']['Tables']['moodboard_items']['Row'];

export default function MoodboardPage() {
  const supabase = createClient();
  const [moodboard, setMoodboard] = useState<Moodboard | null>(null);
  const [items, setItems] = useState<MoodboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const fetchMoodboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      
      // Fetch the user's first moodboard
      let { data: board, error: boardError } = await supabase
        .from('moodboards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no moodboard exists, create one
      if (!board) {
        const { data: newBoard, error: newBoardError } = await supabase
          .from('moodboards')
          .insert({ user_id: user.id, title: 'My First Mood Board' })
          .select()
          .single();
        if (newBoardError) console.error('Error creating moodboard:', newBoardError);
        board = newBoard;
      }

      setMoodboard(board);

      // Fetch items for the moodboard
      if (board) {
        const { data: boardItems, error: itemsError } = await supabase
          .from('moodboard_items')
          .select('*')
          .eq('moodboard_id', board.id)
          .order('created_at', { ascending: false });
        if (itemsError) console.error('Error fetching items:', itemsError);
        else setItems(boardItems || []);
      }

      setLoading(false);
    };

    fetchMoodboard();
  }, [supabase]);

  const handleItemAdded = (newItem: MoodboardItem) => {
    setItems(currentItems => [newItem, ...currentItems]);
  };

  return (
    <>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-3xl font-bold">{moodboard?.title || 'My Mood Board'}</h1>
              <p className="text-muted-foreground">{moodboard?.description || 'A visual collection of your inspiration and thoughts.'}</p>
          </div>
          <button onClick={() => setIsAddDialogOpen(true)} className="btn btn-primary">
            Add Item <Plus className="ml-2 h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.id} className="group relative border rounded-lg aspect-square flex items-center justify-center p-4 bg-muted/30 overflow-hidden">
                {item.item_type === 'image' && <img src={item.content} alt="Mood board item" className="object-cover h-full w-full"/>}
                {item.item_type === 'text' && <p className="text-center font-medium">{item.content}</p>}
                {item.item_type === 'link' && <a href={item.url || '#'} target="_blank" rel="noopener noreferrer" className="text-center font-semibold text-primary underline">{item.content}</a>}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-background/80 rounded-full text-muted-foreground hover:text-primary"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}

            <button onClick={() => setIsAddDialogOpen(true)} className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center p-4 text-muted-foreground hover:bg-muted/50 cursor-pointer">
                <Plus className="h-10 w-10 mb-2" />
                <p>Add new item</p>
            </button>
          </div>
        )}
      </div>
      {moodboard && (
        <AddItemDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          onItemAdded={handleItemAdded}
          moodboardId={moodboard.id}
        />
      )}
    </>
  );
}
