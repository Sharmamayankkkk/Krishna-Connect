'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Camera, Loader2, X, Lock, Globe } from 'lucide-react';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';
import Image from 'next/image';
import { PhoneCollectionDialog } from "@/components/auth/phone-collection-dialog";

interface EditProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profile: Profile;
}

export function EditProfileDialog({ open, onOpenChange, profile }: EditProfileDialogProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState(profile.name || profile.full_name || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [location, setLocation] = useState(profile.location || '');
    const [website, setWebsite] = useState(profile.website || '');
    const [isPrivate, setIsPrivate] = useState(profile.is_private || false);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const getImageUrl = (url?: string) => {
        if (!url) return undefined;
        if (url.startsWith('http')) return url;
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/attachments/${url}`;
    };

    const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const uploadFile = async (file: File, folder: string): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error } = await supabase.storage
            .from('attachments')
            .upload(filePath, file, { upsert: true });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        return filePath;
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            let avatarUrl = profile.avatar_url;
            let bannerUrl = profile.banner_url;

            // Upload avatar if changed
            if (avatarFile) {
                const uploadedPath = await uploadFile(avatarFile, 'avatars');
                if (uploadedPath) {
                    avatarUrl = uploadedPath;
                }
            }

            // Upload banner if changed
            if (bannerFile) {
                const uploadedPath = await uploadFile(bannerFile, 'banners');
                if (uploadedPath) {
                    bannerUrl = uploadedPath;
                }
            }

            // Update profile using RPC
            const { error } = await supabase.rpc('update_profile', {
                p_name: name || null,
                p_bio: bio || null,
                p_location: location || null,
                p_website: website || null,
                p_avatar_url: avatarUrl || null,
                p_banner_url: bannerUrl || null,
                p_is_private: isPrivate
            });

            if (error) {
                // Fallback to direct update if RPC doesn't exist or signature mismatch
                console.warn('RPC update failed, falling back to direct update:', error);
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        name,
                        bio,
                        location,
                        website,
                        avatar_url: avatarUrl,
                        banner_url: bannerUrl,
                        is_private: isPrivate
                    })
                    .eq('id', profile.id);

                if (updateError) {
                    throw updateError;
                }
            }

            toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
            onOpenChange(false);
            router.refresh();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update profile.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden" hideClose={true}>
                <DialogHeader className="p-4 pb-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="rounded-full"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                            <DialogTitle>Edit profile</DialogTitle>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="rounded-full"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </DialogHeader>

                <div className="relative">
                    {/* Banner */}
                    <div
                        className="h-32 bg-slate-800 relative cursor-pointer group"
                        onClick={() => bannerInputRef.current?.click()}
                    >
                        <Image
                            src={bannerPreview || (profile.banner_url ? getImageUrl(profile.banner_url) : '/background/banner.png') || '/background/banner.png'}
                            alt="Banner"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-8 w-8 text-white" />
                        </div>
                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBannerChange}
                            className="hidden"
                        />
                    </div>

                    {/* Avatar */}
                    <div
                        className="absolute -bottom-12 left-4 cursor-pointer group"
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        <Avatar className="h-24 w-24 border-4 border-background">
                            <AvatarImage
                                src={avatarPreview || getImageUrl(profile.avatar_url)}
                                alt="Avatar"
                                className="object-cover"
                            />
                            <AvatarFallback className="text-2xl">
                                {profile.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Form */}
                <div className="p-4 pt-16 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your display name"
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself"
                            rows={3}
                            maxLength={160}
                        />
                        <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Where are you based?"
                            maxLength={30}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex gap-2">
                            <Input
                                id="phone"
                                value={profile.phone || ''}
                                placeholder="Not set"
                                disabled
                                className="bg-muted"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPhoneDialogOpen(true)}
                            >
                                {profile.phone ? 'Change' : 'Add'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label className="text-base">Private Account</Label>
                                {isPrivate ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Globe className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Only your followers will be able to see your photos and videos.
                            </p>
                        </div>
                        <Switch
                            checked={isPrivate}
                            onCheckedChange={setIsPrivate}
                        />
                    </div>
                </div>
            </DialogContent>

            <PhoneCollectionDialog
                open={isPhoneDialogOpen}
                onOpenChange={setIsPhoneDialogOpen}
            />
        </Dialog>
    );
}
