
'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from "@/providers/app-provider"
import type { User } from '@/lib/types'
import { createClient, getAvatarUrl } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

import { useTranslation } from 'react-i18next';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters."),
  description: z.string().optional(),
  members: z.array(z.string()).min(1, "You must select at least one member."),
})

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { t } = useTranslation();

  const router = useRouter();
  const { toast } = useToast();
  const { loggedInUser } = useAppContext();
  const [memberSearch, setMemberSearch] = React.useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      members: [],
    },
  })

  // Search-as-you-type instead of loading all profiles
  useEffect(() => {
    if (!open) {
      form.reset();
      setAllUsers([]);
      setMemberSearch('');
      return;
    }
    if (!memberSearch.trim()) { setAllUsers([]); return; }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, role')
        .or(`name.ilike.%${memberSearch}%,username.ilike.%${memberSearch}%`)
        .neq('id', loggedInUser?.id || '')
        .limit(30);
      setAllUsers((data as User[]) || []);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSearch, open, loggedInUser?.id]);

  const onSubmit = async (values: z.infer<typeof createGroupSchema>) => {
    if (!loggedInUser) return;
    setIsCreating(true);

    try {
      // 1. Create the chat.
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: values.name,
          description: values.description,
          avatar_url: `https://placehold.co/100x100.png`,
          type: 'group',
          created_by: loggedInUser.id,
        })
        .select()
        .single();

      if (chatError) throw chatError;
      const newChatId = chatData.id;

      // 2. Add participants, including creator.
      const allMemberIds = [...new Set([...values.members, loggedInUser.id])];
      const participantData = allMemberIds.map(userId => {
        const user = allUsers.find(u => u.id === userId);
        // Creator and Gurudev are admins by default
        const isAdmin = userId === loggedInUser.id || user?.role === 'gurudev';
        return {
          chat_id: newChatId,
          user_id: userId,
          is_admin: isAdmin,
        };
      });

      const { error: participantsError } = await supabase.from('participants').insert(participantData);
      if (participantsError) throw participantsError;

      toast({ title: "Group Created!", description: `The group "${values.name}" has been successfully created.` });
      onOpenChange(false);
      router.push(`/chat/${newChatId}`);
      router.refresh();

    } catch (error: any) {
      console.error("Supabase error details:", error);
      toast({
        variant: 'destructive',
        title: 'Error creating group',
        description: `Database error: ${error.message}. Please ensure RLS policies are correct or disabled for testing.`
      });
    } finally {
      setIsCreating(false);
    }
  }

  const otherUsers = allUsers; // already excludes self via .neq() in query

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('chat.createANewGroup')}</DialogTitle>
          <DialogDescription>{t('chat.fillOutTheDetailsBelowTo')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://placehold.co/100x100.png`} alt={t('chat.groupAvatar')} data-ai-hint="logo symbol" />
                <AvatarFallback>{form.watch('name')?.charAt(0).toUpperCase() || 'G'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('chat.groupName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('events.egBhagavadGitaStudy')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t('chat.whatIsThisGroupAbout')} className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="members"
              render={() => (
                <FormItem>
                  <FormLabel>{t('chat.addMembers')}</FormLabel>
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder={t('chat.searchByNameOrUsername')}
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <ScrollArea className="h-40 w-full rounded-md border p-4">
                    {isLoading ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-2/3" /></div>
                        <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-1/2" /></div>
                        <div className="flex items-center space-x-3"><Skeleton className="h-4 w-4 rounded-full" /><Skeleton className="h-4 w-3/4" /></div>
                      </div>
                    ) : otherUsers.length > 0 ? (
                      otherUsers.map((user) => (
                        <FormField
                          key={user.id}
                          control={form.control}
                          name="members"
                          render={({ field }) => (
                            <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0 mb-3">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, user.id])
                                      : field.onChange(field.value?.filter((value) => value !== user.id))
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center gap-2 cursor-pointer">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
                                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {user.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-center text-muted-foreground py-4">{t('chat.noOtherUsersFoundToAdd')}</p>
                    )}
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">{t('common.cancel')}</Button>
              </DialogClose>
              <Button type="submit" disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Group'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
