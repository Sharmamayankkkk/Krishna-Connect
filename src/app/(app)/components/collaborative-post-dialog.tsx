'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Search, X, CheckCircle2, Circle } from 'lucide-react';

// Mock data - in a real app, this would come from an API
const mockUsers = [
    { id: '1', name: 'Advaita Das', username: 'advaitadas', avatar: '/user_Avatar/male.png' },
    { id: '2', name: 'Bhakti Devi', username: 'bhaktidevi', avatar: '/user_Avatar/female.png' },
    { id: '3', name: 'Chaitanya Charan', username: 'ccharan', avatar: '/user_Avatar/male.png' },
    { id: '4', name: 'Krishna Priya', username: 'kpriya', avatar: '/user_Avatar/female.png' },
    { id: '5', name: 'Jagannath Swami', username: 'jswami', avatar: '/user_Avatar/male.png' },
    { id: '6', name: 'Radha Rani', username: 'radharani', avatar: '/user_Avatar/female.png' },
    { id: '7', name: 'Gopal Krishna', username: 'gopalk', avatar: '/user_Avatar/male.png' },
];

export type Collaborator = typeof mockUsers[0];

interface CollaborativePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCollaborators: (selected: Collaborator[]) => void;
  initialCollaborators: Collaborator[];
}

const MAX_COLLABORATORS = 3;

export function CollaborativePostDialog({
  open,
  onOpenChange,
  onSelectCollaborators,
  initialCollaborators,
}: CollaborativePostDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedUsers, setSelectedUsers] = React.useState<Collaborator[]>(initialCollaborators);

  // Reset state when dialog is opened
  React.useEffect(() => {
    if (open) {
        setSelectedUsers(initialCollaborators);
        setSearchQuery('');
    }
  }, [open, initialCollaborators]);

  const filteredUsers = mockUsers.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleUserSelection = (user: Collaborator) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        if (prev.length >= MAX_COLLABORATORS) {
            toast({
                title: 'Maximum collaborators reached',
                description: `You can only select up to ${MAX_COLLABORATORS} collaborators.`,
                variant: 'destructive'
            });
            return prev;
        }
        return [...prev, user];
      }
    });
  };

  const handleDone = () => {
    onSelectCollaborators(selectedUsers);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Collaborators</DialogTitle>
          <DialogDescription>
            Select up to {MAX_COLLABORATORS} other users to be co-authors of this post.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search for people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
            />
        </div>

        <ScrollArea className="h-60 border rounded-md">
            <div className="p-2 space-y-1">
                {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                    const isSelected = selectedUsers.some((u) => u.id === user.id);
                    return (
                        <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => toggleUserSelection(user)}
                        >
                            {isSelected ? <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0"/> : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{user.name}</p>
                                <p className="text-muted-foreground text-xs">@{user.username}</p>
                            </div>
                        </div>
                    );
                }) : (
                    <p className='text-center text-sm text-muted-foreground p-4'>No users found.</p>
                )}
            </div>
        </ScrollArea>
        
        {selectedUsers.length > 0 && (
             <div className="space-y-3 pt-3">
                <h4 className="text-sm font-medium text-muted-foreground">Selected Collaborators ({selectedUsers.length}/{MAX_COLLABORATORS})</h4>
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-2 bg-muted p-1.5 rounded-full text-sm">
                             <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                            <button onClick={() => toggleUserSelection(user)} className="mr-1">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <DialogFooter className='pt-4'>
          <Button onClick={handleDone} className='w-full'>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
