'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Copy, Check, Search, Globe, Link2 } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import type { PostType, Chat, Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SharePostDialogProps {
    post: PostType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Official Brand Colors and Icons
const BrandIcon = ({ platform, className }: { platform: string; className?: string }) => {
    switch (platform) {
        case 'whatsapp':
            return (
                <div className={cn("bg-[#25D366] text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current stroke-none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                </div>
            );
        case 'twitter':
            return (
                <div className={cn("bg-black text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current stroke-none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </div>
            );
        case 'facebook':
            return (
                <div className={cn("bg-[#1877F2] text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current stroke-none"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.648 0-2.928 1.67-2.928 3.403v1.518h3.949l-1.006 3.67h-2.943v7.982c-.022.038-.046.076-.065.113H11.59c-.642 0-1.357-.423-2.489-1.069z" /></svg>
                </div>
            );
        case 'linkedin':
            return (
                <div className={cn("bg-[#0077b5] text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current stroke-none"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </div>
            );
        case 'reddit':
            return (
                <div className={cn("bg-[#FF4500] text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg role="img" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" className="fill-current w-full h-full"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                </div>
            );
        case 'telegram':
            return (
                <div className={cn("bg-[#0088cc] text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="fill-current stroke-none"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
                </div>
            );
        case 'email':
            return (
                <div className={cn("bg-gray-600 text-white p-2.5 rounded-full flex items-center justify-center", className)}>
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="stroke-current fill-none"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>
            );
        default:
            return (
                <div className={cn("bg-primary text-primary-foreground p-2.5 rounded-full", className)}>
                    <Link2 className="h-5 w-5" />
                </div>
            )
    }
}

export function SharePostDialog({ post, open, onOpenChange }: SharePostDialogProps) {
    const { chats, forwardMessage, loggedInUser } = useAppContext();
    const [selectedChats, setSelectedChats] = React.useState<number[]>([]);
    const [isSending, setIsSending] = React.useState(false);
    const [hasCopied, setHasCopied] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const { toast } = useToast();

    React.useEffect(() => {
        if (!open) {
            setSelectedChats([]);
            setIsSending(false);
            setHasCopied(false);
            setSearchQuery('');
        }
    }, [open]);

    const handleSendToDM = async () => {
        if (!post || selectedChats.length === 0) return;
        setIsSending(true);

        try {
            const messagePayload: Partial<Message> = {
                content: `Shared a post by @${post.author.username}`,
                user_id: loggedInUser?.id || '',
                chat_id: 0,
                created_at: new Date().toISOString(),
                is_edited: false,
                attachment_url: `/profile/${post.author.username}/post/${post.id}`,
                attachment_metadata: {
                    name: 'Shared Post',
                    type: 'post_share',
                    size: 0,
                    title: post.content ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '') : 'Media Post',
                    description: `@${post.author.username}`,
                    image: post.media && post.media.length > 0 ? post.media[0].url : post.author.avatar,
                    url: `/profile/${post.author.username}/post/${post.id}`,
                    icon: 'post',
                    // New rich preview fields
                    postAuthor: post.author.name || post.author.username,
                    postAuthorAvatar: post.author.avatar,
                    postContent: post.content || ''
                }
            };

            await forwardMessage(messagePayload as Message, selectedChats);
            onOpenChange(false);
            toast({ title: 'Post shared successfully!' });
        } catch (error) {
            console.error('Error sharing post:', error);
            toast({ variant: 'destructive', title: 'Failed to share post' });
        } finally {
            setIsSending(false);
        }
    };

    const getChatPartner = (chat: Chat) => {
        if (!loggedInUser || chat.type !== 'dm') return null;
        const partner = chat.participants?.find(p => p.user_id !== loggedInUser.id);
        return partner?.profiles ?? null;
    }

    const getChatDisplayInfo = (chat: Chat) => {
        if (chat.type === 'dm') {
            const partner = getChatPartner(chat);
            return {
                name: partner?.name || "DM Chat",
                avatar: partner?.avatar_url || "https://placehold.co/100x100.png"
            };
        }
        return {
            name: chat.name || "Group Chat",
            avatar: chat.avatar_url || "https://placehold.co/100x100.png"
        };
    }

    const handleCopyLink = () => {
        const url = `${window.location.origin}/profile/${post.author.username}/post/${post.id}`;
        navigator.clipboard.writeText(url);
        setHasCopied(true);
        toast({ title: "Link copied to clipboard" });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const shareToSocial = (platform: string) => {
        const url = encodeURIComponent(`${window.location.origin}/profile/${post.author.username}/post/${post.id}`);
        const text = encodeURIComponent(`Check out this post by ${post.author.name}: ${post.content?.substring(0, 100)}...`);

        let shareUrl = '';
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Check out this post&body=${text}%20${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
            case 'reddit':
                shareUrl = `https://reddit.com/submit?url=${url}&title=${text}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
        }

        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        onOpenChange(false);
    };

    const shareableChats = chats.filter(c => {
        if (c.type === 'channel') {
            const currentUserParticipant = c.participants.find(p => p.user_id === loggedInUser?.id);
            return currentUserParticipant?.is_admin;
        }
        return true;
    }).filter(c => {
        if (!searchQuery) return true;
        const { name } = getChatDisplayInfo(c);
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const socialOptions = [
        { id: 'whatsapp', name: 'WhatsApp' },
        { id: 'twitter', name: 'X / Twitter' },
        { id: 'facebook', name: 'Facebook' },
        { id: 'linkedin', name: 'LinkedIn' },
        { id: 'reddit', name: 'Reddit' },
        { id: 'telegram', name: 'Telegram' },
        { id: 'email', name: 'Email' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-background">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Share Post</DialogTitle>
                    <DialogDescription>Share this post with friends or via other apps.</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="dm" className="w-full">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="dm">Send to DM</TabsTrigger>
                            <TabsTrigger value="external">Share via...</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="dm" className="mt-0">
                        <div className="px-6 pt-4 pb-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search people..."
                                    className="pl-9 bg-muted/50 border-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="h-[40vh] px-6">
                            <div className="space-y-1 py-1">
                                {shareableChats.length > 0 ? (
                                    shareableChats.map(c => {
                                        const { name, avatar } = getChatDisplayInfo(c);
                                        const isSelected = selectedChats.includes(c.id);
                                        return (
                                            <div
                                                key={c.id}
                                                className={cn(
                                                    "flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors border border-transparent",
                                                    isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-muted/50"
                                                )}
                                                onClick={() => {
                                                    setSelectedChats(prev =>
                                                        isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                                                    );
                                                }}
                                            >
                                                <div className="relative">
                                                    <Avatar className="h-10 w-10 border-2 border-background">
                                                        <AvatarImage src={avatar} alt={name} />
                                                        <AvatarFallback>{name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    {isSelected && (
                                                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm border-2 border-background">
                                                            <Check className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("font-medium truncate", isSelected && "text-primary")}>{name}</p>
                                                    <p className="text-xs text-muted-foreground truncate opacity-70">
                                                        {c.type === 'dm' ? 'Direct Message' : `${c.participants.length} members`}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <div className="bg-muted/50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search className="h-8 w-8 opacity-50" />
                                        </div>
                                        <p>No chats found matching "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t bg-muted/20">
                            <Button onClick={handleSendToDM} disabled={selectedChats.length === 0 || isSending} className="w-full">
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send to {selectedChats.length || ''} selected
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="external" className="mt-0">
                        <div className="p-6 space-y-8 min-h-[40vh]">
                            <div className="grid grid-cols-4 gap-y-6 gap-x-4">
                                {socialOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => shareToSocial(option.id)}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <BrandIcon
                                            platform={option.id}
                                            className="h-14 w-14 p-3.5 transition-transform group-hover:scale-110 shadow-sm"
                                        />
                                        <span className="text-xs text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                                            {option.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3 pt-4 border-t">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Page Link</Label>
                                <div className="flex items-center gap-2 p-1.5 bg-muted/50 border rounded-full pl-4 pr-1.5">
                                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <input
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${post.author.username}/post/${post.id}`}
                                        className="flex-1 bg-transparent border-none text-sm text-muted-foreground focus:outline-none truncate h-9"
                                    />
                                    <Button
                                        size="sm"
                                        className="rounded-full px-4 h-8"
                                        onClick={handleCopyLink}
                                    >
                                        {hasCopied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 mr-1.5" /> Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
