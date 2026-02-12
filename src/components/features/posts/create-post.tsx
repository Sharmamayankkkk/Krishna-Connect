'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ActionTooltip } from "@/components/action-tooltip";
import { Theme } from "emoji-picker-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import TextareaAutosize from 'react-textarea-autosize';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { ImageEditor } from '@/components/image-editor';
import { SmartTextarea } from '@/components/smart-textarea';
import {
    Image as ImageIcon,
    Video,
    Smile,
    Calendar,
    Loader2,
    X,
    AlertCircle,
    BarChart3,
    Plus,
    Trash2,
    Save,
    Clock,
    Sparkles,
    Search,
    Pencil,
    Users,
    Bold,
    Italic,
    Heading2,
    List,
    ListOrdered,
    Minus
} from 'lucide-react';
import { CollaborativePostDialog, type Collaborator } from './dialogs/collaborative-post-dialog';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PollType, MediaType, DraftPost, createEmptyPoll, createDraft } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface CreatePostProps {
    onPostCreated: (content: string, invitedUserIds: string[], media?: MediaType[], poll?: PollType) => void;
}

const MAX_CHARACTERS = 500;
const MAX_MEDIA = 4;
const MAX_POLL_OPTIONS = 4;

const giphyFetch = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY!);

export function CreatePost({ onPostCreated }: CreatePostProps) {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    // Content state
    const [content, setContent] = React.useState('');
    const [isPosting, setIsPosting] = React.useState(false);
    const [mediaPreviews, setMediaPreviews] = React.useState<MediaType[]>([]);

    // Poll state
    const [isPollMode, setIsPollMode] = React.useState(false);
    const [pollQuestion, setPollQuestion] = React.useState('');
    const [pollOptions, setPollOptions] = React.useState<string[]>(['', '']);
    const [pollDuration, setPollDuration] = React.useState(24);
    const [allowMultipleChoices, setAllowMultipleChoices] = React.useState(false);

    // Emoji picker state
    const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

    // GIF picker state
    const [isGifPickerOpen, setIsGifPickerOpen] = React.useState(false);
    const [gifSearchQuery, setGifSearchQuery] = React.useState('');
    const [gifSearchKey, setGifSearchKey] = React.useState(0); // Force re-render for search

    // Draft state
    const [drafts, setDrafts] = React.useState<DraftPost[]>([]);
    const [showDraftDialog, setShowDraftDialog] = React.useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(true);

    // Add these state variables inside the CreatePost component
    const [isImageEditorOpen, setIsImageEditorOpen] = React.useState(false);
    const [editingImage, setEditingImage] = React.useState<{ index: number; url: string } | null>(null);

    // Collaborator state
    const [isCollaboratorDialogOpen, setIsCollaboratorDialogOpen] = React.useState(false);
    const [collaborators, setCollaborators] = React.useState<Collaborator[]>([]);

    // Schedule state
    const [isScheduleMode, setIsScheduleMode] = React.useState(false);
    const [scheduleDate, setScheduleDate] = React.useState('');

    // Validation state
    const [errors, setErrors] = React.useState<string[]>([]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const videoInputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const characterCount = content.length;
    const remainingChars = MAX_CHARACTERS - characterCount;
    const characterPercentage = (characterCount / MAX_CHARACTERS) * 100;
    // Verified users have no character limit - they're premium!
    const isVerified = loggedInUser?.is_verified ?? false;
    const isOverLimit = !isVerified && characterCount > MAX_CHARACTERS;
    const canPost = (content.trim().length > 0 || mediaPreviews.length > 0 || isPollMode) && !isOverLimit;

    // Auto-save draft
    React.useEffect(() => {
        if (autoSaveEnabled && (content.trim() || mediaPreviews.length > 0)) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }

            autoSaveTimerRef.current = setTimeout(() => {
                saveDraft();
            }, 3000);
        }

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [content, mediaPreviews, autoSaveEnabled]);

    // Validation
    const validatePost = (): boolean => {
        const newErrors: string[] = [];

        // Skip character limit check for verified users
        if (isOverLimit && !isVerified) {
            newErrors.push(`Post is ${characterCount - MAX_CHARACTERS} characters over the limit`);
        }

        if (isPollMode) {
            if (!pollQuestion.trim()) {
                newErrors.push('Poll question is required');
            }

            const validOptions = pollOptions.filter(opt => opt.trim());
            if (validOptions.length < 2) {
                newErrors.push('Poll must have at least 2 options');
            }

            if (pollOptions.some(opt => opt.length > 100)) {
                newErrors.push('Poll options must be 100 characters or less');
            }
        }

        if (!content.trim() && mediaPreviews.length === 0 && !isPollMode) {
            newErrors.push('Post cannot be empty');
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    // Character counter color
    const getCharacterColor = () => {
        if (characterCount === 0) return 'text-muted-foreground';
        if (isOverLimit) return 'text-red-500';
        if (characterCount > MAX_CHARACTERS * 0.9) return 'text-orange-500';
        if (characterCount > MAX_CHARACTERS * 0.75) return 'text-yellow-500';
        return 'text-primary';
    };

    // Emoji picker handler
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end);
            setContent(newContent);

            // Set cursor position after emoji
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length;
                textarea.focus();
            }, 0);
        } else {
            setContent(prev => prev + emojiData.emoji);
        }
        setShowEmojiPicker(false);
    };

    // Image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (mediaPreviews.length + files.length > MAX_MEDIA) {
            toast({
                title: "Too many files",
                description: `You can only upload up to ${MAX_MEDIA} images or videos.`,
                variant: "destructive"
            });
            return;
        }

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload only image files.",
                    variant: "destructive"
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setMediaPreviews(prev => [...prev, {
                    type: 'image',
                    url: e.target?.result as string,
                    alt: file.name,
                    file: file // Store original file for upload
                } as MediaType & { file?: File }]);
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Video upload
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (mediaPreviews.length + files.length > MAX_MEDIA) {
            toast({
                title: "Too many files",
                description: `You can only upload up to ${MAX_MEDIA} videos.`,
                variant: "destructive"
            });
            return;
        }

        files.forEach(file => {
            if (!file.type.startsWith('video/')) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload only video files.",
                    variant: "destructive"
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setMediaPreviews(prev => [...prev, {
                    type: 'video',
                    url: e.target?.result as string,
                    alt: file.name,
                    file: file // Store original file for upload
                } as MediaType & { file?: File }]);
            };
            reader.readAsDataURL(file);
        });

        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
    };

    // GIF selection from GIPHY
    const handleGifSelect = (gif: any) => {
        if (mediaPreviews.length >= MAX_MEDIA) {
            toast({
                title: "Too many media items",
                description: `You can only add up to ${MAX_MEDIA} items.`,
                variant: "destructive"
            });
            return;
        }

        const gifData: MediaType = {
            type: 'gif',
            url: gif.images.fixed_height.url,
            alt: gif.title || 'GIF',
            width: parseInt(gif.images.fixed_height.width),
            height: parseInt(gif.images.fixed_height.height)
        };

        setMediaPreviews(prev => [...prev, gifData]);
        setIsGifPickerOpen(false);
        toast({
            title: "GIF added!",
            description: "Your GIF has been added to the post"
        });
    };

    // GIF search handler
    const handleGifSearch = () => {
        setGifSearchKey(prev => prev + 1); // Force Grid to re-fetch
    };

    // Fetch GIFs function for GIPHY Grid
    const fetchGifs = (offset: number) => {
        if (gifSearchQuery.trim()) {
            return giphyFetch.search(gifSearchQuery, { offset, limit: 10 });
        }
        return giphyFetch.trending({ offset, limit: 10 });
    };

    // Remove media
    const removeMedia = (index: number) => {
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageEdited = (index: number, newImageUrl: string) => {
        setMediaPreviews(prev =>
            prev.map((media, i) =>
                i === index ? { ...media, url: newImageUrl } : media
            )
        );
    };


    // Poll management
    const addPollOption = () => {
        if (pollOptions.length < MAX_POLL_OPTIONS) {
            setPollOptions([...pollOptions, '']);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const updatePollOption = (index: number, value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = value;
        setPollOptions(newOptions);
    };

    const togglePollMode = () => {
        if (isPollMode) {
            setIsPollMode(false);
            setPollQuestion('');
            setPollOptions(['', '']);
        } else {
            if (mediaPreviews.length > 0) {
                toast({
                    title: "Cannot add poll",
                    description: "Remove media to add a poll",
                    variant: "destructive"
                });
                return;
            }
            setIsPollMode(true);
        }
    };

    // Draft management
    const saveDraft = () => {
        if (!content.trim() && mediaPreviews.length === 0) return;

        const draft = createDraft(content, mediaPreviews);
        setDrafts(prev => [draft, ...prev]);
    };

    const loadDraft = (draft: DraftPost) => {
        setContent(draft.content);
        setMediaPreviews(draft.media);
        setShowDraftDialog(false);

        toast({
            title: "Draft loaded",
            description: "Continue editing your post"
        });
    };

    const deleteDraft = (draftId: string) => {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        toast({
            title: "Draft deleted",
            description: "Draft has been removed"
        });
    };

    // Post submission
    const handlePost = async () => {
        if (!validatePost()) {
            toast({
                title: "Validation error",
                description: errors[0],
                variant: "destructive"
            });
            return;
        }

        setIsPosting(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Upload media
            const uploadedMedia: MediaType[] = [];
            for (const media of mediaPreviews) {
                let fileToUpload: File | Blob | null = (media as any).file;

                // If no file but has data URL (e.g. from editor), convert to blob
                if (!fileToUpload && media.url.startsWith('data:')) {
                    const res = await fetch(media.url);
                    fileToUpload = await res.blob();
                }

                if (fileToUpload) {
                    const fileExt = media.type === 'video' ? 'mp4' : 'png'; // Simple extension logic
                    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    const filePath = `${user.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('post_media')
                        .upload(filePath, fileToUpload);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('post_media')
                        .getPublicUrl(filePath);

                    uploadedMedia.push({ ...media, url: publicUrl }); // Use public URL, strip file
                } else {
                    uploadedMedia.push(media); // Keep existing URL (e.g. GIF)
                }
            }

            let poll: PollType | undefined;
            if (isPollMode && pollQuestion.trim()) {
                const validOptions = pollOptions.filter(opt => opt.trim());
                poll = createEmptyPoll(pollQuestion, validOptions, pollDuration);
            }

            // Insert into DB
            const { data, error: insertError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    content,
                    media_urls: uploadedMedia,
                    poll
                })
                .select()
                .single();

            if (insertError) throw insertError;

            const newPostId = (data as any).id;

            // Handle Collaborators
            if (collaborators.length > 0) {
                // 1. Insert into post_collaborators
                const { error: collabError } = await supabase
                    .from('post_collaborators')
                    .insert(
                        collaborators.map(c => ({
                            post_id: newPostId,
                            user_id: c.id,
                            status: 'pending'
                        }))
                    );

                if (collabError) console.error('Error adding collaborators:', collabError);

                // 2. Send Notifications
                // Assuming 'notifications' table structure matches what we expect
                // We'll insert a notification for each collaborator
                const notifications = collaborators.map(c => ({
                    user_id: c.id, // To whom
                    type: 'collaboration_request',
                    actor_id: user.id, // From whom
                    entity_id: newPostId,
                    created_at: new Date().toISOString(),
                    is_read: false
                }));

                const { error: notifError } = await supabase
                    .from('notifications')
                    .insert(notifications);

                if (notifError) console.error('Error sending notifications:', notifError);
            }

            if (insertError) throw insertError;

            // Notify parent to refresh
            onPostCreated(content, collaborators.map(c => c.id), uploadedMedia, poll);

            // Reset form
            setContent('');
            setMediaPreviews([]);
            setIsPollMode(false);
            setPollQuestion('');
            setPollOptions(['', '']);
            setErrors([]);

            toast({
                title: isScheduleMode ? "Post scheduled!" : "Post published!",
                description: isScheduleMode
                    ? `Your post will be published on ${scheduleDate}`
                    : "Your post has been shared with your followers."
            });

        } catch (error: any) {
            console.error('Post creation error:', error);
            toast({
                title: "Error creating post",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsPosting(false);
        }
    };

    // Keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canPost) {
            e.preventDefault();
            handlePost();
        }
        // Keyboard shortcuts for formatting
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                formatBold();
            } else if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                formatItalic();
            }
        }
    };

    // Formatting helper - inserts markdown syntax at cursor position
    const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const textToInsert = selectedText || placeholder;
        const newContent = content.substring(0, start) + prefix + textToInsert + suffix + content.substring(end);

        setContent(newContent);

        // Smart cursor placement - select placeholder for easy replacement
        setTimeout(() => {
            textarea.focus();
            if (selectedText) {
                const cursorPos = start + prefix.length + textToInsert.length + suffix.length;
                textarea.setSelectionRange(cursorPos, cursorPos);
            } else if (placeholder) {
                const selectStart = start + prefix.length;
                const selectEnd = selectStart + placeholder.length;
                textarea.setSelectionRange(selectStart, selectEnd);
            }
        }, 0);
    };

    const formatBold = () => insertFormatting('**', '**', 'text');
    const formatItalic = () => insertFormatting('*', '*', 'text');
    const formatHeading = () => insertFormatting('## ', '', 'Heading');
    const formatBulletList = () => insertFormatting('- ', '', 'item');
    const formatNumberedList = () => insertFormatting('1. ', '', 'item');
    const formatHorizontalLine = () => insertFormatting('\n---\n', '', '');

    // --- Guest View (Fake Composer) ---
    const { requireAuth } = useAuthGuard();

    if (!loggedInUser) {
        return (
            <div
                className="flex w-full gap-3 sm:gap-4 p-3 sm:p-4 border-b bg-background cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => requireAuth(() => { }, "Log in to post")}
            >
                <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
                    <AvatarFallback>G</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                    <div className="w-full h-12 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground flex items-center">
                        What is happening?!
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                        <Video className="h-5 w-5" />
                        <BarChart3 className="h-5 w-5" />
                        <Smile className="h-5 w-5" />
                        <div className="ml-auto">
                            <Button size="sm" disabled className="opacity-50">Post</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Image Editor Dialog */}
            {editingImage && (
                <ImageEditor
                    open={isImageEditorOpen}
                    onClose={() => {
                        setIsImageEditorOpen(false);
                        setEditingImage(null);
                    }}
                    image={editingImage.url}
                    onSave={(newImage) => {
                        handleImageEdited(editingImage.index, newImage);
                        setIsImageEditorOpen(false);
                        setEditingImage(null);
                    }}
                />
            )}

            {/* Draft Dialog */}
            <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Your Drafts ({drafts.length})</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {drafts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No drafts saved yet
                            </p>
                        ) : (
                            drafts.map(draft => (
                                <div key={draft.id} className="border rounded-lg p-3 space-y-2">
                                    <p className="text-sm line-clamp-2">{draft.content || 'No content'}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                            {new Date(draft.updatedAt).toLocaleDateString()} at{' '}
                                            {new Date(draft.updatedAt).toLocaleTimeString()}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => loadDraft(draft)}
                                            >
                                                Load
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => deleteDraft(draft.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Create Post UI */}
            <div className="flex w-full gap-3 sm:gap-4 p-4 sm:p-5 border-b border-border/40 bg-background/50 backdrop-blur-sm transition-colors focus-within:bg-background/80 group/create-post">
                <CollaborativePostDialog
                    open={isCollaboratorDialogOpen}
                    onOpenChange={setIsCollaboratorDialogOpen}
                    initialCollaborators={collaborators}
                    onSelectCollaborators={setCollaborators}
                />
                <Link href={`/profile/${encodeURIComponent(loggedInUser?.username || '')}`} className="flex-shrink-0 pt-1">
                    <Avatar className="h-10 w-10 ring-2 ring-background transition-transform duration-300 group-focus-within/create-post:scale-105">
                        <AvatarImage src={loggedInUser.avatar_url} alt={loggedInUser.name} />
                        <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0 py-1">
                    {/* Validation Errors */}
                    {errors.length > 0 && (
                        <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {errors[0]}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!isPollMode && (
                        <div className="relative">
                            <SmartTextarea
                                ref={textareaRef}
                                placeholder="What is happening?!"
                                className={cn(
                                    "w-full resize-none border-none bg-transparent text-lg placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus-visible:ring-0 min-h-[3rem] leading-relaxed tracking-wide",
                                    isOverLimit && !isVerified && "text-destructive"
                                )}
                                minRows={1}
                                maxRows={15}
                                autosize
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isPosting}
                                maxLength={isVerified ? undefined : MAX_CHARACTERS + 10}
                            />

                            {/* Formatting Toolbar - Show on focus or if content exists */}
                            {(content.length > 0 || isPollMode) && (
                                <div className="flex items-center gap-1 mt-1 opacity-0 group-focus-within/create-post:opacity-100 transition-opacity duration-300 pointer-events-none group-focus-within/create-post:pointer-events-auto">
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={formatBold}><Bold className="h-3 w-3" /></Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={formatItalic}><Italic className="h-3 w-3" /></Button>
                                    <div className="w-px h-3 bg-border mx-1" />
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={formatHeading}><Heading2 className="h-3 w-3" /></Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={formatBulletList}><List className="h-3 w-3" /></Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collaborators Display */}
                    {collaborators.length > 0 && (
                        <div className="border rounded-xl p-3 mt-3 space-y-2 bg-muted/20 animate-in fade-in">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Collaborators
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                                {collaborators.map((collaborator) => (
                                    <div key={collaborator.id} className="flex items-center gap-2 bg-background/80 px-2 py-1 rounded-full border shadow-sm">
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={collaborator.avatar} />
                                            <AvatarFallback>{collaborator.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium">{collaborator.name}</span>
                                        <button
                                            onClick={() => setCollaborators(prev => prev.filter(c => c.id !== collaborator.id))}
                                            className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Media Previews */}
                    {mediaPreviews.length > 0 && (
                        <div className={cn(
                            "mt-4 gap-3 grid",
                            mediaPreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        )}>
                            {mediaPreviews.map((media, index) => (
                                <div key={index} className="relative group rounded-xl overflow-hidden border bg-black/5 shadow-sm ring-1 ring-border/10">
                                    <button
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full z-10 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    {media.type === 'image' && (
                                        <>
                                            <div className="relative aspect-video">
                                                <Image
                                                    src={media.url}
                                                    alt={media.alt || 'Upload preview'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            {/* Edit button */}
                                            <button
                                                onClick={() => {
                                                    setEditingImage({ index, url: media.url });
                                                    setIsImageEditorOpen(true);
                                                }}
                                                className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full z-10 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}

                                    {media.type === 'video' && (
                                        <video src={media.url} controls className="w-full h-full object-cover max-h-[300px]" />
                                    )}

                                    {media.type === 'gif' && (
                                        <div className="relative w-full h-full min-h-[200px]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={media.url} alt={media.alt} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1 rounded">GIF</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Poll Creator */}
                    {isPollMode && (
                        <div className="mt-4 border rounded-xl p-4 space-y-4 bg-background/50 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium flex items-center gap-2 text-primary">
                                    <BarChart3 className="h-4 w-4" />
                                    Create Poll
                                </h3>
                                <Button variant="ghost" size="icon" onClick={togglePollMode} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <Input
                                placeholder="Ask a question..."
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                className="text-lg font-medium border-x-0 border-t-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
                            />

                            <div className="space-y-3">
                                {pollOptions.map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            placeholder={`Option ${index + 1}`}
                                            value={option}
                                            onChange={(e) => updatePollOption(index, e.target.value)}
                                            className="flex-1"
                                        />
                                        {pollOptions.length > 2 && (
                                            <Button variant="ghost" size="icon" onClick={() => removePollOption(index)} className="text-muted-foreground hover:text-destructive">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {pollOptions.length < MAX_POLL_OPTIONS && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={addPollOption}
                                        className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Option
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-4 pt-2 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <select
                                        value={pollDuration}
                                        onChange={(e) => setPollDuration(Number(e.target.value))}
                                        className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-foreground"
                                    >
                                        <option value={1}>1 hour</option>
                                        <option value={6}>6 hours</option>
                                        <option value={12}>12 hours</option>
                                        <option value={24}>1 day</option>
                                        <option value={72}>3 days</option>
                                        <option value={168}>7 days</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    {(!isPollMode || mediaPreviews.length === 0) && (
                        <div className="flex items-center justify-between pt-3 mt-2">
                            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isPosting || isPollMode} />
                            <input type="file" ref={videoInputRef} className="hidden" multiple accept="video/*" onChange={handleVideoUpload} disabled={isPosting || isPollMode} />

                            <div className="flex items-center gap-1 -ml-2">
                                {/* Primary Actions */}
                                <ActionTooltip label="Image">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/80 hover:text-primary hover:bg-primary/10 rounded-full transition-colors" onClick={() => fileInputRef.current?.click()} disabled={isPosting || isPollMode || mediaPreviews.length >= MAX_MEDIA}>
                                        <ImageIcon className="h-5 w-5" />
                                    </Button>
                                </ActionTooltip>

                                <div className="relative">
                                    <ActionTooltip label="Emoji">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/80 hover:text-primary hover:bg-primary/10 rounded-full transition-colors" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={isPosting}>
                                            <Smile className="h-5 w-5" />
                                        </Button>
                                    </ActionTooltip>
                                    {showEmojiPicker && (
                                        <div className="absolute top-10 left-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                            <div className="relative z-50 shadow-2xl rounded-xl overflow-hidden border bg-background">
                                                <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} theme={Theme.AUTO} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <ActionTooltip label="GIF">
                                    <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/80 hover:text-primary hover:bg-primary/10 rounded-full transition-colors" disabled={isPosting || isPollMode || mediaPreviews.length >= MAX_MEDIA}>
                                                <Sparkles className="h-5 w-5" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[320px] p-0" align="start">
                                            <div className="p-2">
                                                <div className="relative mb-2">
                                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Search GIFs..." className="pl-8" value={gifSearchQuery} onChange={(e) => setGifSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGifSearch()} />
                                                </div>
                                                <div className="h-[300px] overflow-y-auto">
                                                    <Grid key={gifSearchKey} width={300} columns={2} fetchGifs={fetchGifs} onGifClick={handleGifSelect} noLink />
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </ActionTooltip>

                                {/* More Actions Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-primary/80 hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => videoInputRef.current?.click()} disabled={isPosting || isPollMode || mediaPreviews.length >= MAX_MEDIA}>
                                            <Video className="mr-2 h-4 w-4" /> Video
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={togglePollMode} disabled={isPosting || mediaPreviews.length > 0}>
                                            <BarChart3 className="mr-2 h-4 w-4" /> Poll
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsCollaboratorDialogOpen(true)} disabled={isPosting}>
                                            <Users className="mr-2 h-4 w-4" /> Collaborate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setIsScheduleMode(true)} disabled={isPosting}>
                                            <Clock className="mr-2 h-4 w-4" /> Schedule
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Quick Drafts Access */}
                                <ActionTooltip label="Drafts">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full" onClick={() => setShowDraftDialog(true)}>
                                        <List className="h-5 w-5" />
                                    </Button>
                                </ActionTooltip>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Character Count */}
                                {content.length > 0 && (
                                    <div className="flex items-center gap-2 animate-in fade-in">
                                        <span className={cn("text-xs font-bold transition-colors", getCharacterColor())}>
                                            {remainingChars}
                                        </span>
                                        <svg viewBox="0 0 24 24" className="h-5 w-5 -rotate-90">
                                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/25" />
                                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={62.83} strokeDashoffset={62.83 - (62.83 * Math.min(characterPercentage, 100)) / 100} className={cn("transition-all duration-300", getCharacterColor())} />
                                        </svg>
                                    </div>
                                )}

                                <Button
                                    onClick={handlePost}
                                    disabled={!canPost || isPosting}
                                    className={cn(
                                        "rounded-full px-6 py-0 font-bold transition-all duration-300 shadow-md hover:shadow-lg",
                                        isPosting ? "opacity-80" : "hover:scale-105 active:scale-95",
                                        "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                                    )}
                                    size="sm"
                                >
                                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isScheduleMode && scheduleDate ? 'Schedule' : 'Post')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Dialog (Separate to keep UI clean) */}
            <Dialog open={isScheduleMode} onOpenChange={setIsScheduleMode}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Post</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="schedule-date" className="mb-2 block">Pick a date and time</Label>
                        <Input
                            id="schedule-date"
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsScheduleMode(false)}>Cancel</Button>
                        <Button onClick={() => setIsScheduleMode(false)}>Confirm Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>

    );
}
