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
import { Search, X, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserType } from '@/lib/types';
import { useAppContext } from '@/providers/app-provider';
import { VerificationBadge } from "@/components/shared/verification-badge";

import { useTranslation } from 'react-i18next';

// Reusing UserType but ensuring Collaborator matches what we need
export type Collaborator = UserType;

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
  const { t } = useTranslation();

  const { toast } = useToast();
  const { loggedInUser } = useAppContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedUsers, setSelectedUsers] = React.useState<Collaborator[]>(initialCollaborators);
  const [searchResults, setSearchResults] = React.useState<Collaborator[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Reset state when dialog is opened
  React.useEffect(() => {
    if (open) {
      setSelectedUsers(initialCollaborators);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, initialCollaborators]);

  // Handle Search
  React.useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !loggedInUser) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .neq('id', loggedInUser.id) // Exclude self
          .limit(10);

        if (error) throw error;

        // Map profile data to UserType if needed (DB columns should match UserType mostly)
        // Adjust based on your actual simple UserType structure
        // Assuming DB struct: id, name, username, avatar_url
        const mappedUsers: Collaborator[] = (data || []).map(p => ({
          id: p.id,
          name: p.name || 'Unknown',
          username: p.username || 'unknown',
          avatar: p.avatar_url || '',
          verified: p.verified
        }));

        setSearchResults(mappedUsers);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, loggedInUser]);


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

  // Merge selected users into search results if they are not already there, 
  // so we can see who is selected even if not in current search
  // Actually, UI usually shows selected list separately or highlights in list.
  // We'll proceed with current UI: Search List + Selected List.

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('post.inviteCollaborators')}</DialogTitle>
          <DialogDescription>
            Select up to {MAX_COLLABORATORS} other users to be co-authors of this post.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('post.searchForPeople')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <ScrollArea className="h-60 border rounded-md">
          <div className="p-2 space-y-1">
            {searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => toggleUserSelection(user)}
                  >
                    {isSelected ? <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm flex items-center gap-1">
                        {user.name}
                        <VerificationBadge verified={user.verified} size={12} className="w-3 h-3" />
                      </p>
                      <p className="text-muted-foreground text-xs">@{user.username}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                {searchQuery ? (
                  <p>No users found matching "{searchQuery}"</p>
                ) : (
                  <p>{t('post.searchForUsersToInvite')}</p>
                )}
              </div>
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
                  <button onClick={() => toggleUserSelection(user)} className="mr-1 hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className='pt-4'>
          <Button onClick={handleDone} className='w-full'>{t('common.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
