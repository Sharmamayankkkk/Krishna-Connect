
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { Image as ImageIcon, Video, Smile, Calendar, Loader2 } from 'lucide-react';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';

interface CreatePostProps {
    onPostCreated: (content: string) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
    const { loggedInUser } = useAppContext();
    const { toast } = useToast();
    const [content, setContent] = React.useState('');
    const [isPosting, setIsPosting] = React.useState(false);

    const handlePost = () => {
        if (!content.trim()) return;
        setIsPosting(true);
        
        // Simulate network delay
        setTimeout(() => {
            onPostCreated(content);
            setContent('');
            setIsPosting(false);
            toast({ title: "Your post has been sent!" });
        }, 500);
    };

    if (!loggedInUser) {
        return null; // Or a skeleton/loader
    }

    return (
        <div className="flex w-full gap-4">
            <Avatar className="h-11 w-11">
                <AvatarImage src={loggedInUser.avatar_url} alt={loggedInUser.name} />
                <AvatarFallback>{loggedInUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
                <TextareaAutosize
                    placeholder="What is happening?!"
                    className="w-full resize-none border-none bg-transparent text-xl placeholder:text-muted-foreground focus:outline-none"
                    minRows={1}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-primary">
                        <Button variant="ghost" size="icon"><ImageIcon className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon"><Video className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon"><Smile className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
                    </div>
                    <Button onClick={handlePost} disabled={!content.trim() || isPosting}>
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Post
                    </Button>
                </div>
            </div>
        </div>
    );
}
