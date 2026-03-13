
'use client'

import * as React from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAppContext } from "@/providers/app-provider"
import type { Chat, User, Participant } from '@/lib/types'
import { UserPlus, UserX, Loader2, Upload, RefreshCcw, Copy, Tag, Globe, Eye, Lock } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { createClient } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid';

import { useTranslation } from 'react-i18next';

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Chat;
}

export function EditGroupDialog({ open, onOpenChange, group }: EditGroupDialogProps) {
  const { t } = useTranslation();

  const { loggedInUser } = useAppContext();
  const { toast } = useToast();
  const supabase = createClient();

  const [memberSearch, setMemberSearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<User[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const [name, setName] = React.useState(group.name || '');
  const [description, setDescription] = React.useState(group.description || '');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState(group.avatar_url || '');
  const [participants, setParticipants] = React.useState<Participant[]>(group.participants);
  const [isLoading, setIsLoading] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [isPublic, setIsPublic] = React.useState(group.is_public);
  const [historyVisible, setHistoryVisible] = React.useState(group.history_visible);
  const [inviteCode, setInviteCode] = React.useState(group.invite_code);
  const [disableSharing, setDisableSharing] = React.useState(!!group.disable_sharing);
  const [membersCanSetTag, setMembersCanSetTag] = React.useState(!!group.settings?.members_can_set_tag);

  React.useEffect(() => {
    if (open) {
      setName(group.name || '');
      setDescription(group.description || '');
      setAvatarPreview(group.avatar_url || '');
      setParticipants(group.participants);
      setIsPublic(group.is_public);
      setHistoryVisible(group.history_visible);
      setInviteCode(group.invite_code);
      setDisableSharing(!!group.disable_sharing);
      setMembersCanSetTag(!!group.settings?.members_can_set_tag);
      setAvatarFile(null);
      setMemberSearch('');
      setSearchResults([]);
    }
  }, [group, open]);

  // Search for users to add — debounced, on-demand Supabase query
  React.useEffect(() => {
    if (!memberSearch.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const existingIds = participants.map(p => p.user_id);
      const { data } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, role, verified')
        .or(`name.ilike.%${memberSearch}%,username.ilike.%${memberSearch}%`)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(20);
      setSearchResults((data as unknown as User[]) || []);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSearch, participants.length]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleToggleAdmin = (userId: string) => {
    setParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, is_admin: !p.is_admin } : p));
  };

  const handleRemoveMember = (userId: string) => {
    setParticipants(prev => prev.filter(p => p.user_id !== userId));
  };

  const handleTagChange = (userId: string, tag: string) => {
    setParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, tag: tag.slice(0, 25) } : p));
  };

  const handleAddMember = (user: User) => {
    if (!participants.some(p => p.user_id === user.id)) {
      setParticipants(prev => [...prev, {
        user_id: user.id,
        chat_id: group.id,
        is_admin: user.role === 'gurudev', // Gurudev is admin by default
        profiles: user
      }]);
    }
  };

  const copyInviteLink = () => {
    if (inviteCode) {
      const link = `${window.location.origin}/join/${inviteCode}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Invite link copied!" });
    }
  }

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // 1. Update chat info (name, description, avatar, settings, invite code)
      let avatar_url = group.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `public/${group.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
        avatar_url = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Add timestamp to bust cache
      }

      const { error: chatUpdateError } = await supabase.from('chats')
        .update({
          name,
          description,
          avatar_url,
          is_public: isPublic,
          history_visible: historyVisible,
          invite_code: inviteCode,
          disable_sharing: disableSharing,
          settings: { ...group.settings, members_can_set_tag: membersCanSetTag }
        })
        .eq('id', group.id);
      if (chatUpdateError) throw chatUpdateError;

      // 2. Sync participants
      const originalParticipantIds = new Set(group.participants.map(p => p.user_id));
      const newParticipantIds = new Set(participants.map(p => p.user_id));

      const toAdd = participants.filter(p => !originalParticipantIds.has(p.user_id));
      const toRemove = group.participants.filter(p => !newParticipantIds.has(p.user_id));
      const toUpdate = participants.filter(p => {
        const original = group.participants.find(op => op.user_id === p.user_id);
        return original && (original.is_admin !== p.is_admin || (original.tag ?? '') !== (p.tag ?? ''));
      });

      if (toAdd.length > 0) {
        const { error } = await supabase.from('participants').insert(toAdd.map(p => ({
          chat_id: p.chat_id, user_id: p.user_id, is_admin: p.is_admin
        })));
        if (error) throw error;
      }

      if (toRemove.length > 0) {
        const { error } = await supabase.from('participants').delete().in('user_id', toRemove.map(p => p.user_id)).eq('chat_id', group.id);
        if (error) throw error;
      }

      if (toUpdate.length > 0) {
        for (const p of toUpdate) {
          const { error } = await supabase.from('participants').update({ is_admin: p.is_admin, tag: p.tag || null }).match({ chat_id: p.chat_id, user_id: p.user_id });
          if (error) throw error;
        }
      }

      toast({ title: "Group Updated", description: `${name} has been updated successfully.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error saving changes", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const currentParticipantIds = new Set(participants.map(p => p.user_id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Group: {group.name}</DialogTitle>
          <DialogDescription>{t('chat.modifyTheGroupsDetailsAndManage')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">{t('chat.general')}</TabsTrigger>
            <TabsTrigger value="members">{t('chat.members')}</TabsTrigger>
            <TabsTrigger value="settings">{t('settings.title')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 py-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview} alt={t('chat.groupAvatar')} />
                  <AvatarFallback>{name?.charAt(0).toUpperCase() || 'G'}</AvatarFallback>
                </Avatar>
                <Button type="button" size="sm" variant="outline" className="absolute -bottom-2 -right-2" onClick={() => avatarInputRef.current?.click()}>
                  <Upload className="h-3 w-3 mr-1" />{t('settings.security.change')}</Button>
                <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">{t('chat.groupName')}</Label>
                  <Input id="group-name" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description">{t('challenges.description')}</Label>
                  <Textarea id="group-description" value={description} onChange={e => setDescription(e.target.value)} className="resize-none" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label>{t('chat.publicGroup')}</Label>
                  <p className="text-xs text-muted-foreground">{t('chat.allowAnyoneWithTheLinkTo')}</p>
                </div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <Label>{t('chat.chatHistory')}</Label>
                  <p className="text-xs text-muted-foreground">{t('chat.allowNewMembersToSeePast')}</p>
                </div>
              </div>
              <Switch checked={historyVisible} onCheckedChange={setHistoryVisible} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-500/10 p-2">
                  <Lock className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <Label>{t('chat.disableSharing')}</Label>
                  <p className="text-xs text-muted-foreground">{t('chat.preventMembersFromForwardingMessagesFrom')}</p>
                </div>
              </div>
              <Switch checked={disableSharing} onCheckedChange={setDisableSharing} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-2">
                  <Tag className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <Label>{t('chat.memberTags')}</Label>
                  <p className="text-xs text-muted-foreground">{t('chat.allowMembersToSetTheirOwn')}</p>
                </div>
              </div>
              <Switch checked={membersCanSetTag} onCheckedChange={setMembersCanSetTag} />
            </div>
            <div className="space-y-2">
              <Label>{t('chat.inviteLink')}</Label>
              {inviteCode ? (
                <div className="flex gap-2">
                  <Input readOnly value={`${window.location.origin}/join/${inviteCode}`} />
                  <Button variant="secondary" size="icon" onClick={copyInviteLink}><Copy className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => setInviteCode(null)}><UserX className="h-4 w-4" /></Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setInviteCode(uuidv4())}>{t('chat.generateInviteLink')}</Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="py-4">
            <TooltipProvider>
              <ScrollArea className="h-80 pr-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Members ({participants.length})</h4>
                    <div className="space-y-3">
                      {participants.map(p => (
                        <div key={p.user_id} className="flex flex-col p-3 rounded-lg border hover:bg-muted/50 space-y-2">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={p.profiles.avatar_url} alt={p.profiles.name} />
                                <AvatarFallback>{p.profiles.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{p.profiles.name}</p>
                                <p className="text-xs text-muted-foreground">@{p.profiles.username}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between">
                              <div className="flex items-center space-x-2">
                                <Switch id={`admin-switch-${p.user_id}`} checked={p.is_admin} onCheckedChange={() => handleToggleAdmin(p.user_id)} disabled={p.user_id === loggedInUser?.id} aria-label={`Toggle admin status for ${p.profiles.name}`} />
                                <Label htmlFor={`admin-switch-${p.user_id}`} className="text-sm font-normal cursor-pointer">{t('chat.admin')}</Label>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveMember(p.user_id)} disabled={p.user_id === loggedInUser?.id}>
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('chat.removeFromGroup')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Input
                              placeholder="Member tag (e.g. Designer)"
                              aria-label={`Tag for ${p.profiles.name}`}
                              value={p.tag || ''}
                              onChange={e => handleTagChange(p.user_id, e.target.value)}
                              maxLength={25}
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">{t('chat.addNewMembers')}</h4>
                    <div className="relative mb-2">
                      <Input
                        placeholder={t('chat.searchUsersToAdd')}
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                      />
                      {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    <div className="space-y-2">
                      {searchResults.length === 0 && memberSearch.trim() && !isSearching && (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('chat.noUsersFound')}</p>
                      )}
                      {searchResults.filter(u => !currentParticipantIds.has(u.id)).map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleAddMember(user)}>
                            <UserPlus className="mr-2 h-4 w-4" />{t('settings.security.add')}</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TooltipProvider>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <DialogClose asChild><Button variant="outline">{t('common.cancel')}</Button></DialogClose>
          <Button onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
