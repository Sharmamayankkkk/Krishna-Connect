'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TextareaAutosize from 'react-textarea-autosize';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { ImageEditor } from '@/components/image-editor';
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
import { CollaborativePostDialog, type Collaborator } from './collaborative-post-dialog';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PollType, MediaType, DraftPost, createEmptyPoll, createDraft } from '../types';
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
            <div className="flex w-full gap-3 sm:gap-4 p-3 sm:p-4 border-b bg-background">
                <CollaborativePostDialog // <-- Add this block
                    open={isCollaboratorDialogOpen}
                    onOpenChange={setIsCollaboratorDialogOpen}
                    initialCollaborators={collaborators}
                    onSelectCollaborators={setCollaborators}
                />
                <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
                    <AvatarImage src={loggedInUser.avatar_url} alt={loggedInUser.name} />
                    <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                    {/* Validation Errors */}
                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {errors[0]}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 pb-2 border-b mb-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={formatBold}
                            title="Bold (Ctrl+B)"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={formatItalic}
                            title="Italic (Ctrl+I)"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={formatHeading}
                            title="Heading"
                        >
                            <Heading2 className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={formatBulletList}
                            title="Bullet List"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={formatNumberedList}
                            title="Numbered List"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={formatHorizontalLine}
                            title="Horizontal Line"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Text Input */}
                    <TextareaAutosize
                        ref={textareaRef}
                        placeholder="What is happening?!"
                        className={cn(
                            "w-full resize-none border-none bg-transparent text-base sm:text-lg placeholder:text-muted-foreground focus:outline-none",
                            isOverLimit && !isVerified && "text-red-500"
                        )}
                        minRows={1}
                        maxRows={15}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isPosting}
                    />

                    {/* block to display collaborators */}
                    {collaborators.length > 0 && (
                        <div className="border rounded-xl p-3 mt-3 space-y-2">
                            <h4 className="text-sm font-medium">Collaborators</h4>
                            <div className="flex items-center gap-2">
                                {[loggedInUser, ...collaborators].map(user => (
                                    <Avatar key={user.id} className="h-8 w-8" title={user.name}>
                                        <AvatarImage src={(user as any).avatar_url || (user as any).avatar} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Poll Creator */}
                    {isPollMode && (
                        <div className="border rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Create a poll</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={togglePollMode}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <Input
                                placeholder="Ask a question..."
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                maxLength={280}
                            />

                            <div className="space-y-2">
                                {pollOptions.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            placeholder={`Choice ${index + 1} `}
                                            value={option}
                                            onChange={(e) => updatePollOption(index, e.target.value)}
                                            maxLength={100}
                                        />
                                        {pollOptions.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePollOption(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {pollOptions.length < MAX_POLL_OPTIONS && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addPollOption}
                                    className="w-full"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add option
                                </Button>
                            )}

                            <div className="flex items-center justify-between text-sm">
                                <Label htmlFor="poll-duration">Poll duration</Label>
                                <select
                                    id="poll-duration"
                                    value={pollDuration}
                                    onChange={(e) => setPollDuration(Number(e.target.value))}
                                    className="border rounded px-2 py-1"
                                >
                                    <option value={1}>1 hour</option>
                                    <option value={6}>6 hours</option>
                                    <option value={12}>12 hours</option>
                                    <option value={24}>1 day</option>
                                    <option value={72}>3 days</option>
                                    <option value={168}>7 days</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="multiple-choices"
                                    checked={allowMultipleChoices}
                                    onChange={(e) => setAllowMultipleChoices(e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="multiple-choices" className="text-sm">
                                    Allow multiple choices
                                </Label>
                            </div>
                        </div>
                    )}

                    {/* Media Previews */}
                    {mediaPreviews.length > 0 && (
                        <div className={cn(
                            "grid gap-2 rounded-xl overflow-hidden border p-2",
                            mediaPreviews.length === 1 && "grid-cols-1",
                            mediaPreviews.length === 2 && "grid-cols-2",
                            mediaPreviews.length >= 3 && "grid-cols-2"
                        )}>
                            {mediaPreviews.map((preview, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "relative aspect-video bg-muted rounded-lg overflow-hidden group",
                                        mediaPreviews.length === 3 && index === 0 && "col-span-2"
                                    )}
                                >
                                    {preview.type === 'image' && (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            onClick={() => {
                                                setEditingImage({ index, url: preview.url });
                                                setIsImageEditorOpen(true);
                                            }}
                                            type="button"
                                            title="Edit image"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {preview.type === 'gif' || preview.type === 'image' ? (
                                        <Image
                                            src={preview.url}
                                            alt={preview.alt || `Preview ${index + 1} `}
                                            fill
                                            className="object-cover"
                                            unoptimized={preview.type === 'gif'}
                                        />
                                    ) : (
                                        <video
                                            src={preview.url}
                                            className="w-full h-full object-cover"
                                            controls
                                        />
                                    )}
                                    {preview.type === 'gif' && (
                                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-semibold">
                                            GIF
                                        </div>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={() => removeMedia(index)}
                                        type="button"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Character Limit Warning - hide for verified users */}
                    {!isVerified && characterCount > MAX_CHARACTERS * 0.75 && (
                        <div className="flex items-center gap-2 text-sm">
                            {isOverLimit && <AlertCircle className="h-4 w-4 text-red-500" />}
                            <span className={getCharacterColor()}>
                                {isOverLimit
                                    ? `${characterCount - MAX_CHARACTERS} characters over limit`
                                    : `${MAX_CHARACTERS - characterCount} characters remaining`
                                }
                            </span>
                        </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-0 sm:gap-1 text-primary flex-wrap">
                            {/* Hidden file inputs */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={mediaPreviews.length >= MAX_MEDIA || isPosting || isPollMode}
                            />
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleVideoUpload}
                                disabled={mediaPreviews.length >= MAX_MEDIA || isPosting || isPollMode}
                            />

                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={mediaPreviews.length >= MAX_MEDIA || isPosting || isPollMode}
                                title="Add image"
                            >
                                <ImageIcon className="h-5 w-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={() => videoInputRef.current?.click()}
                                disabled={mediaPreviews.length >= MAX_MEDIA || isPosting || isPollMode}
                                title="Add video"
                            >
                                <Video className="h-5 w-5" />
                            </Button>

                            <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        disabled={mediaPreviews.length >= MAX_MEDIA || isPosting || isPollMode}
                                        title="Add GIF"
                                    >
                                        <Sparkles className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 p-0" align="start">
                                    <div className="p-3 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search GIFs..."
                                                    value={gifSearchQuery}
                                                    onChange={(e) => setGifSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleGifSearch()}
                                                    className="pl-8"
                                                />
                                            </div>
                                            <Button size="sm" onClick={handleGifSearch}>
                                                <Sparkles className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto">
                                            <Grid
                                                key={gifSearchKey}
                                                width={360}
                                                columns={2}
                                                gutter={6}
                                                fetchGifs={fetchGifs}
                                                onGifClick={(gif, e) => {
                                                    e.preventDefault();
                                                    handleGifSelect(gif);
                                                }}
                                            />
                                        </div>

                                        <p className="text-xs text-muted-foreground text-center">
                                            Powered by GIPHY
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>


                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                onClick={togglePollMode}
                                disabled={isPosting || mediaPreviews.length > 0}
                                title="Create poll"
                                className={cn(isPollMode && "bg-primary text-primary-foreground")}
                            >
                                <BarChart3 className="h-5 w-5" />
                            </Button>

                            {/* Emoji Picker */}
                            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        type="button"
                                        disabled={isPosting}
                                        title="Add emoji"
                                    >
                                        <Smile className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 border-0" align="start">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        width="100%"
                                        height={400}
                                    />
                                </PopoverContent>
                            </Popover>

                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                disabled={isPosting}
                                title="Schedule post"
                                onClick={() => {
                                    setIsScheduleMode(!isScheduleMode);
                                    toast({
                                        title: "Schedule mode",
                                        description: isScheduleMode ? "Schedule mode disabled" : "Schedule mode enabled"
                                    });
                                }}
                                className={cn(isScheduleMode && "bg-primary text-primary-foreground")}
                            >
                                <Calendar className="h-5 w-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                disabled={isPosting}
                                title="Invite collaborators"
                                onClick={() => setIsCollaboratorDialogOpen(true)}
                                className={cn(collaborators.length > 0 && "bg-primary text-primary-foreground")}
                            >
                                <Users className="h-5 w-5" />
                            </Button>



                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                disabled={isPosting}
                                title="View drafts"
                                onClick={() => setShowDraftDialog(true)}
                                className="relative"
                            >
                                <Save className="h-5 w-5" />
                                {drafts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] flex items-center justify-center rounded-full">
                                        {drafts.length}
                                    </span>
                                )}
                            </Button>
                        </div>

                        {/* Character Counter & Post Button - hide counter for verified users */}
                        <div className="flex items-center gap-3">
                            {!isVerified && characterCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <div className="relative w-8 h-8">
                                        <svg className="w-8 h-8 transform -rotate-90">
                                            <circle
                                                cx="16"
                                                cy="16"
                                                r="14"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                                className="text-muted opacity-20"
                                            />
                                            <circle
                                                cx="16"
                                                cy="16"
                                                r="14"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 14} `}
                                                strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(characterPercentage, 100) / 100)} `}
                                                className={cn(
                                                    "transition-all",
                                                    isOverLimit ? "text-red-500" :
                                                        characterCount > MAX_CHARACTERS * 0.9 ? "text-orange-500" :
                                                            characterCount > MAX_CHARACTERS * 0.75 ? "text-yellow-500" :
                                                                "text-primary"
                                                )}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        {characterCount > MAX_CHARACTERS * 0.9 && (
                                            <div className={cn(
                                                "absolute inset-0 flex items-center justify-center text-[10px] font-bold",
                                                isOverLimit ? "text-red-500" : "text-orange-500"
                                            )}>
                                                {isOverLimit ? MAX_CHARACTERS - characterCount : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isScheduleMode && (
                                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Schedule</span>
                                </div>
                            )}

                            <Button
                                onClick={handlePost}
                                disabled={!canPost || isPosting}
                                size="sm"
                                className="min-w-[70px]"
                            >
                                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isPosting ? 'Posting...' : isScheduleMode ? 'Schedule' : 'Post'}
                            </Button>
                        </div>
                    </div>

                    {/* Schedule Date Picker */}
                    {isScheduleMode && (
                        <div className="border rounded-lg p-3 space-y-2">
                            <Label className="text-sm">Schedule post</Label>
                            <Input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Your post will be published at the scheduled time
                            </p>
                        </div>
                    )}

                    {/* Keyboard Shortcut Hint */}
                    {content.length > 0 && !isPosting && (
                        <p className="text-xs text-muted-foreground text-right">
                            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded">Enter</kbd> to {isScheduleMode ? 'schedule' : 'post'}
                        </p>
                    )}

                    {/* Tips */}
                    {content.length === 0 && mediaPreviews.length === 0 && !isPollMode && (
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-semibold">💡 Tips:</p>
                            <ul className="list-disc list-inside space-y-0.5 ml-2">
                                <li>Add media, GIFs, or create a poll to engage your audience</li>
                                <li>Use #hashtags to join conversations</li>
                                <li>Mention users with @ to notify them</li>
                                <li>Your drafts are saved automatically every 3 seconds</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}