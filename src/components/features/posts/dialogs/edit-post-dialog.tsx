'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TextareaAutosize from 'react-textarea-autosize';
import { ImageEditor } from '@/components/image-editor';
import {
    Image as ImageIcon,
    Video,
    Loader2,
    X,
    AlertCircle,
    Trash2,
    Bold,
    Italic,
    Heading2,
    List,
    ListOrdered,
    Minus
} from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PostType, MediaType } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface EditPostDialogProps {
    post: PostType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPostUpdated: (post: PostType) => void;
}

const MAX_CHARACTERS = 500;
const MAX_MEDIA = 4;

export function EditPostDialog({ post, open, onOpenChange, onPostUpdated }: EditPostDialogProps) {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();

    // Content state
    const [content, setContent] = React.useState(post.content || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const [mediaPreviews, setMediaPreviews] = React.useState<MediaType[]>(post.media || []);

    // Image editor state
    const [isImageEditorOpen, setIsImageEditorOpen] = React.useState(false);
    const [editingImage, setEditingImage] = React.useState<{ index: number; url: string } | null>(null);

    // Validation state
    const [errors, setErrors] = React.useState<string[]>([]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const videoInputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Reset state when post changes or dialog opens
    React.useEffect(() => {
        if (open) {
            setContent(post.content || '');
            setMediaPreviews(post.media || []);
            setErrors([]);
        }
    }, [open, post]);

    const characterCount = content.length;
    // Verified users have no character limit
    const isVerified = loggedInUser?.is_verified ?? false;
    const isOverLimit = !isVerified && characterCount > MAX_CHARACTERS;
    const canSave = (content.trim().length > 0 || mediaPreviews.length > 0) && !isOverLimit && !isSaving;

    // --- Media Handlers ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (mediaPreviews.length + files.length > MAX_MEDIA) {
            setErrors([`You can only add up to ${MAX_MEDIA} media items`]);
            return;
        }

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (result) {
                    setMediaPreviews(prev => [...prev, {
                        type: 'image',
                        url: result,
                        file: file
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });

        // Reset input
        e.target.value = '';
        setErrors([]);
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (mediaPreviews.length >= MAX_MEDIA) {
            setErrors([`You can only add up to ${MAX_MEDIA} media items`]);
            return;
        }

        // Check video size (e.g., 50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            setErrors(['Video must be smaller than 50MB']);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
                setMediaPreviews(prev => [...prev, {
                    type: 'video',
                    url: result,
                    file: file
                }]);
            }
        };
        reader.readAsDataURL(file);

        e.target.value = '';
        setErrors([]);
    };

    const removeMedia = (index: number) => {
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageEdited = (index: number, newImageUrl: string) => {
        setMediaPreviews(prev => {
            const newMedia = [...prev];
            // If it was a file upload, we convert base64 back to blob if needed, 
            // but for simplicity we just update URL. 
            // Note: If we edit an existing URL (from DB), it stays as URL.
            // If we edit a new upload (base64), it stays base64.
            // The upload logic needs to handle base64 strings if file is missing.
            newMedia[index] = {
                ...newMedia[index],
                url: newImageUrl,
                // If we edited it, it's basically a new file unless we complexly track it.
                // For now, let's treat it as a new base64 image to be uploaded.
                file: undefined
            };
            return newMedia;
        });
    };

    // --- Formatting Handlers ---

    const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const textToInsert = selectedText || placeholder;
        const newContent = content.substring(0, start) + prefix + textToInsert + suffix + content.substring(end);

        setContent(newContent);

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

    const formatBold = () => insertFormatting('**', '**', 'bold text');
    const formatItalic = () => insertFormatting('*', '*', 'italic text');
    const formatHeading = () => insertFormatting('## ', '', 'Heading');
    const formatBulletList = () => insertFormatting('- ', '', 'item');
    const formatNumberedList = () => insertFormatting('1. ', '', 'item');
    const formatHorizontalLine = () => insertFormatting('\n---\n', '', '');

    // --- Save Handler ---

    const handleSave = async () => {
        if (!loggedInUser || !canSave) return;
        setIsSaving(true);
        setErrors([]);

        try {
            const supabase = createClient();

            // 1. Upload new media
            const updatedMedia: MediaType[] = [];

            for (const media of mediaPreviews) {
                // If it has a file (newly added), upload it
                if (media.file) {
                    const fileExt = media.file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `post-media/${loggedInUser.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('media')
                        .upload(filePath, media.file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('media')
                        .getPublicUrl(filePath);

                    updatedMedia.push({
                        type: media.type,
                        url: publicUrl
                    });
                }
                // If it's a base64 string (edited image) but NO file object
                else if (media.url.startsWith('data:image')) {
                    // Convert base64 to blob/file and upload
                    const res = await fetch(media.url);
                    const blob = await res.blob();
                    const fileName = `${Math.random()}.png`;
                    const filePath = `post-media/${loggedInUser.id}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('media')
                        .upload(filePath, blob);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('media')
                        .getPublicUrl(filePath);

                    updatedMedia.push({
                        type: media.type,
                        url: publicUrl
                    });
                }
                // Existing media (remote URL)
                else {
                    updatedMedia.push(media);
                }
            }

            // 2. Update post in DB
            const { data, error } = await supabase
                .from('posts')
                .update({
                    content: content,
                    media_urls: updatedMedia,
                    updated_at: new Date().toISOString()
                })
                .eq('id', post.id)
                .select(`
                    *,
                    author:user_id (id, name, username, avatar_url, verified),
                    likes:post_likes(count),
                    comments:comments(count),
                    reposts:post_reposts(count),
                    post_comments:comments (
                        id,
                        user_id,
                        content,
                        created_at,
                        profiles:user_id (id, name, username, avatar_url, verified)
                    ),
                    quote_of:quote_of_id (
                        *,
                        author:user_id (id, name, username, avatar_url, verified)
                    ),
                    user_likes:post_likes!post_id(user_id)
                `)
                .single();

            if (error) throw error;

            // 3. Transform and notify
            // We need to transform the data structure to match PostType if needed
            // But checking PostType definition, it seems close. 
            // We just need to ensure the parent callback handles it.
            // For now, let's assume onPostUpdated will handle the merge.

            // Construct PostType from returned data - simplified for now
            // Detailed transformation matches 'fetchPosts' logic in explore/page.tsx
            // We can perhaps let the feed re-fetch or optimistically update.
            // For now, let's just pass the updated fields to the parent or trigger a refresh.
            // But onPostUpdated expects a full PostType. 

            // Ideally we reuse the transformer from page.tsx. 
            // Since we can't easily import that function (it's inside the component or specific file),
            // we'll do a basic mapping here or assume the parent will re-fetch.
            // Let's rely on the parent to re-fetch if we pass the raw data? 
            // No, onPostUpdated expects PostType. 
            // Let's modify onPostUpdated signature to just accept void and trigger parent refresh, 
            // OR do our best to map it.

            // Actually, let's just map what we can.
            const updatedPost: PostType = {
                ...post,
                content: content,
                media: updatedMedia,
                // preserve other stats
            };

            onPostUpdated(updatedPost);
            onOpenChange(false);

            toast({
                title: "Post updated",
                description: "Your changes have been saved."
            });

        } catch (error: any) {
            console.error('Error updating post:', error);
            setErrors([error.message || 'Failed to update post']);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Post</DialogTitle>
                </DialogHeader>

                <div className="flex gap-3">
                    <Avatar className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
                        <AvatarImage src={loggedInUser?.avatar_url} alt={loggedInUser?.name} />
                        <AvatarFallback>{loggedInUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                        {/* Validation Errors */}
                        {errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errors[0]}</AlertDescription>
                            </Alert>
                        )}

                        {/* Formatting Toolbar */}
                        <div className="flex items-center gap-1 pb-2 border-b mb-2">
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={formatBold} title="Bold">
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={formatItalic} title="Italic">
                                <Italic className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-5 bg-border mx-1" />
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={formatHeading} title="Heading">
                                <Heading2 className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={formatBulletList} title="Bullet List">
                                <List className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={formatNumberedList} title="Numbered List">
                                <ListOrdered className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={formatHorizontalLine} title="Horizontal Line">
                                <Minus className="h-4 w-4" />
                            </Button>
                        </div>

                        <TextareaAutosize
                            ref={textareaRef}
                            className={cn(
                                "w-full resize-none border-none bg-transparent text-base sm:text-lg placeholder:text-muted-foreground focus:outline-none",
                                isOverLimit && !isVerified && "text-red-500"
                            )}
                            minRows={3}
                            maxRows={15}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        {/* Media Previews */}
                        {mediaPreviews.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {mediaPreviews.map((media, index) => (
                                    <div key={index} className="relative group rounded-md overflow-hidden bg-muted/30 border aspect-video">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeMedia(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>

                                        {media.type === 'image' && (
                                            <>
                                                <Image
                                                    src={media.url}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="absolute bottom-1 right-1 h-6 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        setEditingImage({ index, url: media.url });
                                                        setIsImageEditorOpen(true);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            </>
                                        )}
                                        {media.type === 'video' && (
                                            <video src={media.url} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tools / Footer */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={mediaPreviews.length >= MAX_MEDIA}
                                >
                                    <ImageIcon className="h-4 w-4 mr-2" />
                                    Image
                                </Button>

                                <input
                                    type="file"
                                    ref={videoInputRef}
                                    className="hidden"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => videoInputRef.current?.click()}
                                    disabled={mediaPreviews.length >= MAX_MEDIA}
                                >
                                    <Video className="h-4 w-4 mr-2" />
                                    Video
                                </Button>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "text-xs",
                                    isOverLimit ? "text-red-500 font-medium" : "text-muted-foreground"
                                )}>
                                    {characterCount}
                                    {!isVerified && ` / ${MAX_CHARACTERS}`}
                                </span>

                                <Button
                                    onClick={handleSave}
                                    disabled={!canSave || isSaving}
                                    className="rounded-full px-6"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : 'Save'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>

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
        </Dialog>
    );
}
