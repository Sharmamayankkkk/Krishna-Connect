'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
    Minus,
    CheckCircle2,
    HelpCircle
} from 'lucide-react';
import { CollaborativePostDialog, type Collaborator } from './dialogs/collaborative-post-dialog';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { cn, getAvatarUrl, getMaxFileSize, getMaxFileSizeMB } from '@/lib/utils';
import Image from 'next/image';
import { PollType, MediaType, DraftPost, createEmptyPoll, createDraft } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

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
    const [isQuizMode, setIsQuizMode] = React.useState(false);
    const [correctAnswerIndex, setCorrectAnswerIndex] = React.useState(-1);

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
    const leelaInputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    const characterCount = content.length;
    const remainingChars = MAX_CHARACTERS - characterCount;
    const characterPercentage = (characterCount / MAX_CHARACTERS) * 100;
    // Verified users have no character limit - they're premium!
    const isVerified = loggedInUser?.is_verified === 'verified' || loggedInUser?.is_verified === 'kcs';
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

            if (isQuizMode && correctAnswerIndex < 0) {
                newErrors.push('Quiz must have a correct answer selected');
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

    // Custom emoji handler (inserts :emojiName: syntax)
    const handleCustomEmojiClick = (emojiUrl: string) => {
        const name = emojiUrl.split('/').pop()?.split('.')[0] || 'emoji';
        const emojiSyntax = `:${name}:`;
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + emojiSyntax + content.substring(end);
            setContent(newContent);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emojiSyntax.length;
                textarea.focus();
            }, 0);
        } else {
            setContent(prev => prev + emojiSyntax);
        }
        setShowEmojiPicker(false);
    };

    // Fetch custom emojis and stickers
    const [customEmojiList, setCustomEmojiList] = React.useState<string[]>([]);
    const [stickerList, setStickerList] = React.useState<string[]>([]);
    React.useEffect(() => {
        fetch('/api/assets')
            .then(res => res.json())
            .then(data => {
                setCustomEmojiList(data.emojis || []);
                setStickerList(data.stickers || []);
            })
            .catch(() => { });
    }, []);

    // Unified media upload — accepts images and videos in the same post
    const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (mediaPreviews.length + files.length > MAX_MEDIA) {
            toast({
                title: "Too many files",
                description: `You can only upload up to ${MAX_MEDIA} media items.`,
                variant: "destructive"
            });
            e.target.value = '';
            return;
        }

        const MAX_FILE_SIZE = getMaxFileSize(loggedInUser?.is_verified);
        const maxSizeMB = getMaxFileSizeMB(loggedInUser?.is_verified);

        files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not a supported image or video file.`,
                    variant: "destructive"
                });
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                toast({
                    title: "File too large",
                    description: `${file.name} exceeds the ${maxSizeMB}MB limit.`,
                    variant: "destructive"
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                setMediaPreviews(prev => [...prev, {
                    type: isImage ? 'image' : 'video',
                    url: ev.target?.result as string,
                    alt: file.name,
                    file: file
                } as MediaType & { file?: File }]);
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    // Leela (short video) upload
    const [isUploadingLeela, setIsUploadingLeela] = React.useState(false);
    const [selectedLeelaFile, setSelectedLeelaFile] = React.useState<File | null>(null);
    const [leelaCaption, setLeelaCaption] = React.useState('');
    const [isLeelaDialogOpen, setIsLeelaDialogOpen] = React.useState(false);

    const handleLeelaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !loggedInUser) return;

        if (!file.type.startsWith('video/')) {
            toast({ title: 'Only video files are allowed', variant: 'destructive' });
            return;
        }

        if (file.size > getMaxFileSize(loggedInUser?.is_verified)) {
            toast({ title: `Video must be under ${getMaxFileSizeMB(loggedInUser?.is_verified)}MB`, variant: 'destructive' });
            return;
        }

        setSelectedLeelaFile(file);
        setLeelaCaption('');
        setIsLeelaDialogOpen(true);
    };

    const handleLeelaUploadConfirm = async () => {
        if (!selectedLeelaFile || !loggedInUser) return;

        setIsLeelaDialogOpen(false);
        setIsUploadingLeela(true);
        try {
            const leelaSupabase = createClient();
            const ext = selectedLeelaFile.name.includes('.') ? selectedLeelaFile.name.substring(selectedLeelaFile.name.lastIndexOf('.') + 1) : 'mp4';
            const filePath = `leela/${loggedInUser.id}/${Date.now()}.${ext}`;
            const { error: uploadError } = await leelaSupabase.storage.from('leela').upload(filePath, selectedLeelaFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = leelaSupabase.storage.from('leela').getPublicUrl(filePath);

            const { error: insertError } = await leelaSupabase.from('leela_videos').insert({
                user_id: loggedInUser.id,
                video_url: urlData.publicUrl,
                caption: leelaCaption.trim() || null,
            });

            if (insertError) throw insertError;

            toast({ title: 'Leela uploaded successfully!' });
        } catch (err: any) {
            toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
        } finally {
            setIsUploadingLeela(false);
            setSelectedLeelaFile(null);
            if (leelaInputRef.current) leelaInputRef.current.value = '';
        }
    };
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
            if (correctAnswerIndex === index) setCorrectAnswerIndex(-1);
            else if (correctAnswerIndex > index) setCorrectAnswerIndex(correctAnswerIndex - 1);
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
            setIsQuizMode(false);
            setCorrectAnswerIndex(-1);
        } else {
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
                poll = createEmptyPoll(pollQuestion, validOptions, pollDuration, isQuizMode, correctAnswerIndex);
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
            setIsQuizMode(false);
            setCorrectAnswerIndex(-1);
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
                className="w-full rounded-2xl bg-card shadow-lg border border-border/80 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => requireAuth(() => { }, "Log in to post")}
            >
                <div className="p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4 items-center">
                        <Avatar className="h-11 w-11 sm:h-12 sm:w-12 flex-shrink-0 ring-2 ring-primary/10">
                            <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-muted-foreground/60 text-lg">{t('post.whatIsHappening')}</div>
                    </div>
                    <div className="border-t border-border mt-4 mb-3" />
                    <div className="flex justify-end">
                        <Button size="sm" disabled className="rounded-full px-6 opacity-50 bg-primary text-primary-foreground border-0">{t('post.postButton')}</Button>
                    </div>
                </div>
                <div className="border-t border-border bg-muted/70 px-4 py-3">
                    <div className="grid grid-cols-4 gap-y-1">
                        {[
                            { icon: <ImageIcon className="h-4 w-4" />, label: t('create.photoVideo') },
                            { icon: <BarChart3 className="h-4 w-4" />, label: t('create.poll') },
                            { icon: <Users className="h-4 w-4" />, label: t('create.collaborate') },
                            { icon: <Clock className="h-4 w-4" />, label: t('create.schedule') },
                            { icon: <Smile className="h-4 w-4" />, label: t('create.emoji') },
                            { icon: <Sparkles className="h-4 w-4" />, label: 'GIF' },
                            { icon: <List className="h-4 w-4" />, label: t('post.draft') },
                        ].map(({ icon, label }, i) => (
                            <div key={i} className="flex flex-col items-center gap-1 py-2 rounded-xl opacity-50 w-full">
                                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">{icon}</div>
                                <span className="text-[10px] text-muted-foreground/60 text-center leading-tight w-full px-1 truncate">{label}</span>
                            </div>
                        ))}
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
                        <DialogTitle>{t('drafts.yourDrafts', { count: drafts.length })}</DialogTitle>
                        <DialogDescription className="sr-only">List of your saved post drafts</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {drafts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                {t('create.noDrafts')}
                            </p>
                        ) : (
                            drafts.map(draft => (
                                <div key={draft.id} className="border rounded-lg p-3 space-y-2">
                                    <p className="text-sm line-clamp-2">{draft.content || t('create.noContent')}</p>
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
                                                {t('create.load')}
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
            <div className="w-full rounded-2xl bg-card shadow-lg border border-border/80 overflow-hidden group/create-post transition-shadow duration-300 hover:shadow-xl focus-within:shadow-xl">
                <CollaborativePostDialog
                    open={isCollaboratorDialogOpen}
                    onOpenChange={setIsCollaboratorDialogOpen}
                    initialCollaborators={collaborators}
                    onSelectCollaborators={setCollaborators}
                />

                {/* Top card section */}
                <div className="p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4">
                        <Link href={`/profile/${encodeURIComponent(loggedInUser?.username || '')}`} className="flex-shrink-0">
                            <Avatar className="h-11 w-11 sm:h-12 sm:w-12 ring-2 ring-primary/10 transition-transform duration-300 group-focus-within/create-post:scale-105">
                                <AvatarImage src={getAvatarUrl(loggedInUser.avatar_url)} alt={loggedInUser.name} />
                                <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Link>

                        <div className="flex-1 min-w-0 pt-1 overflow-hidden">
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
                                        placeholder={t('post.whatIsHappening')}
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
                                <div className="mt-4 border rounded-xl p-4 space-y-4 bg-background/50 animate-in fade-in slide-in-from-top-2 overflow-hidden min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium flex items-center gap-2 text-primary">
                                            {isQuizMode ? <HelpCircle className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                                            {isQuizMode ? 'Create Quiz' : 'Create Poll'}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setIsQuizMode(!isQuizMode); setCorrectAnswerIndex(-1); }}
                                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${isQuizMode ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'border-border text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {isQuizMode ? <><CheckCircle2 className="h-3 w-3 inline mr-0.5" /> Quiz Mode</> : 'Quiz Mode'}
                                            </button>
                                            <Button variant="ghost" size="icon" onClick={togglePollMode} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Input
                                        placeholder={isQuizMode ? "Ask a quiz question..." : "Ask a question..."}
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value)}
                                        className="font-medium border-x-0 border-t-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent w-full min-w-0"
                                    />

                                    {isQuizMode && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                                            Click the circle next to an option to mark it as the correct answer
                                        </p>
                                    )}

                                    <div className="space-y-3">
                                        {pollOptions.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                {isQuizMode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCorrectAnswerIndex(index)}
                                                        className={`flex-shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${correctAnswerIndex === index
                                                            ? 'border-green-500 bg-green-500 text-white'
                                                            : 'border-muted-foreground/30 hover:border-green-500/50'
                                                            }`}
                                                        title={correctAnswerIndex === index ? 'Correct answer' : 'Mark as correct answer'}
                                                    >
                                                        {correctAnswerIndex === index && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                    </button>
                                                )}
                                                <Input
                                                    placeholder={`Option ${index + 1}`}
                                                    value={option}
                                                    onChange={(e) => updatePollOption(index, e.target.value)}
                                                    className={`flex-1 ${isQuizMode && correctAnswerIndex === index ? 'border-green-500/30 bg-green-500/5' : ''}`}
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

                            {/* Hidden file inputs */}
                            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleMediaUpload} disabled={isPosting} />
                            <input type="file" ref={leelaInputRef} className="hidden" accept="video/*" onChange={handleLeelaSelect} disabled={isPosting || isUploadingLeela} />

                            {/* Divider */}
                            <div className="border-t border-border mt-4 -mx-4 sm:-mx-5" />

                            {/* Post button row */}
                            <div className="flex items-center justify-end pt-3">
                                {content.length > 0 && (
                                    <div className="flex items-center gap-2 mr-3 animate-in fade-in">
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
                                        "rounded-full px-7 py-2 font-bold text-base transition-all duration-300 shadow-md hover:shadow-lg border-0",
                                        isPosting ? "opacity-80" : "hover:scale-105 active:scale-95",
                                        "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground"
                                    )}
                                    size="default"
                                >
                                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isScheduleMode && scheduleDate ? t('post.schedule') : t('post.postButton'))}
                                </Button>
                            </div>
                        </div>{/* close flex-1 */}
                    </div>{/* close flex gap (avatar + content) */}
                </div>{/* close p-4 sm:p-5 (top card section) */}

                {/* ── Bottom Icon Toolbar ── */}
                <div className="border-t border-border bg-muted/60 px-2 py-2">
                    <div className="grid grid-cols-4 gap-y-1">

                        {/* Photo / Video */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPosting || mediaPreviews.length >= MAX_MEDIA}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 w-full"
                        >
                            <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">{t('create.photoVideo')}</span>
                        </button>

                        {/* Poll */}
                        <button
                            onClick={togglePollMode}
                            disabled={isPosting}
                            className={cn(
                                "flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 w-full",
                                isPollMode && "bg-primary/10"
                            )}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-xl border shadow-sm flex items-center justify-center transition-colors",
                                isPollMode ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
                            )}>
                                <BarChart3 className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">{t('create.poll')}</span>
                        </button>

                        {/* Collaborate */}
                        <button
                            onClick={() => setIsCollaboratorDialogOpen(true)}
                            disabled={isPosting}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 w-full"
                        >
                            <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">{t('create.collaborate')}</span>
                        </button>

                        {/* Schedule */}
                        <button
                            onClick={() => setIsScheduleMode(true)}
                            disabled={isPosting}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 w-full"
                        >
                            <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground">
                                <Clock className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">{t('create.schedule')}</span>
                        </button>

                        {/* Leela */}
                        <button
                            onClick={() => leelaInputRef.current?.click()}
                            disabled={isPosting || isUploadingLeela}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-sky-500/10 transition-colors disabled:opacity-40 w-full"
                        >
                            <div className="w-9 h-9 rounded-xl bg-card border border-sky-200 shadow-sm flex items-center justify-center ring-1 ring-sky-100">
                                <Image src="/icons/leela.png" alt="Leela" width={20} height={20} className="object-contain" />
                            </div>
                            <span className="text-[10px] font-semibold text-sky-500 text-center leading-tight w-full px-1 truncate">
                                {isUploadingLeela ? t('create.uploading') : t('create.leela')}
                            </span>
                        </button>

                        {/* Emoji */}
                        <div className="relative w-full">
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                disabled={isPosting}
                                className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 w-full"
                            >
                                <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground">
                                    <Smile className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">{t('create.emoji')}</span>
                            </button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-16 left-0 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                                    <div className="relative z-50 shadow-2xl rounded-xl overflow-hidden border bg-background">
                                        <Tabs defaultValue="emojis" className="w-[320px]">
                                            <TabsList className="w-full rounded-none bg-muted/50 h-9">
                                                {customEmojiList.length > 0 && isVerified && (
                                                    <TabsTrigger value="official" className="flex-1 text-xs gap-1">{t('create.official')} <Sparkles className="h-3 w-3" /></TabsTrigger>
                                                )}
                                                <TabsTrigger value="emojis" className="flex-1 text-xs">{t('create.emoji')}</TabsTrigger>
                                                {stickerList.length > 0 && (
                                                    <TabsTrigger value="stickers" className="flex-1 text-xs">{t('create.stickers')}</TabsTrigger>
                                                )}
                                            </TabsList>
                                            {customEmojiList.length > 0 && isVerified && (
                                                <TabsContent value="official" className="mt-0">
                                                    <div className="grid grid-cols-6 gap-2 p-3 max-h-[300px] overflow-y-auto">
                                                        {customEmojiList.map((url, i) => (
                                                            <button key={i} onClick={() => handleCustomEmojiClick(url)} className="h-12 w-12 rounded-lg hover:bg-muted/80 flex items-center justify-center transition-colors p-1">
                                                                <Image src={url} alt="emoji" width={36} height={36} className="object-contain" unoptimized />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            )}
                                            <TabsContent value="emojis" className="mt-0">
                                                <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={350} theme={Theme.AUTO} />
                                            </TabsContent>
                                            {stickerList.length > 0 && (
                                                <TabsContent value="stickers" className="mt-0">
                                                    <div className="grid grid-cols-4 gap-2 p-3 max-h-[300px] overflow-y-auto">
                                                        {stickerList.map((url, i) => (
                                                            <button key={i} onClick={() => handleCustomEmojiClick(url)} className="rounded-lg hover:bg-muted/80 flex items-center justify-center transition-colors p-1">
                                                                <Image src={url} alt="sticker" width={64} height={64} className="object-contain" unoptimized />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </TabsContent>
                                            )}
                                            {!isVerified && customEmojiList.length > 0 && (
                                                <div className="px-3 py-2 bg-muted/30 border-t text-center">
                                                    <p className="text-xs text-muted-foreground">
                                                        <Sparkles className="h-3 w-3 inline mr-1" />
                                                        {t('create.getVerifiedEmojis')}
                                                    </p>
                                                </div>
                                            )}
                                        </Tabs>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GIF */}
                        <Popover open={isGifPickerOpen} onOpenChange={setIsGifPickerOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    disabled={isPosting || mediaPreviews.length >= MAX_MEDIA}
                                    className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-40 w-full"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground">
                                        <span className="text-[10px] font-bold tracking-tight">GIF</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">GIF</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0" align="start" side="top">
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

                        {/* Drafts */}
                        <button
                            onClick={() => setShowDraftDialog(true)}
                            className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-muted transition-colors w-full"
                        >
                            <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground">
                                <List className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-center leading-tight w-full px-1 truncate">{t('post.draft')}</span>
                        </button>

                    </div>
                </div>

            </div>{/* close main card */}

            {/* Schedule Dialog (Separate to keep UI clean) */}
            <Dialog open={isScheduleMode} onOpenChange={setIsScheduleMode}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t('post.schedulePost')}</DialogTitle>
                        <DialogDescription className="sr-only">Select a date and time to schedule your post</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="schedule-date" className="mb-2 block">{t('create.pickDateTime')}</Label>
                        <Input
                            id="schedule-date"
                            type="datetime-local"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsScheduleMode(false)}>{t('common.cancel')}</Button>
                        <Button onClick={() => setIsScheduleMode(false)}>{t('create.confirmSchedule')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Leela Upload Dialog */}
            <Dialog open={isLeelaDialogOpen} onOpenChange={(open) => {
                setIsLeelaDialogOpen(open);
                if (!open) {
                    setSelectedLeelaFile(null);
                    if (leelaInputRef.current) leelaInputRef.current.value = '';
                }
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Image src="/icons/leela.png" alt="Leela" width={20} height={20} />
                            Upload Leela
                        </DialogTitle>
                        <DialogDescription className="sr-only">Upload a Leela video</DialogDescription>
                    </DialogHeader>

                    {selectedLeelaFile && (
                        <div className="py-2 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Selected: <span className="font-semibold text-foreground truncate block">{selectedLeelaFile.name}</span>
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="leela-caption">Caption <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                <textarea
                                    id="leela-caption"
                                    value={leelaCaption}
                                    onChange={(e) => setLeelaCaption(e.target.value)}
                                    placeholder="Write a caption for your Leela..."
                                    className="w-full min-h-[100px] p-3 rounded-md border bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                                    maxLength={200}
                                />
                                <div className="text-right text-xs text-muted-foreground">
                                    {leelaCaption.length}/200
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            setIsLeelaDialogOpen(false);
                            setSelectedLeelaFile(null);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleLeelaUploadConfirm} disabled={isUploadingLeela}>
                            {isUploadingLeela ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Post Leela'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}