"use client";

import * as React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Hash, User } from "lucide-react";

interface SmartTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onMentionSelect?: (username: string) => void;
    onHashtagSelect?: (tag: string) => void;
    autosize?: boolean;
    minRows?: number;
    maxRows?: number;
}

type Suggestion = {
    id: string;
    text: string;
    subtext?: string;
    image?: string | null;
    type: 'mention' | 'hashtag';
};

export const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
    ({ value, onChange, className, onMentionSelect, onHashtagSelect, ...props }, ref) => {
        const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
        const [popupPosition, setPopupPosition] = React.useState<{ top: number; left: number } | null>(null);
        const [activeIndex, setActiveIndex] = React.useState(0);
        const [triggerType, setTriggerType] = React.useState<'mention' | 'hashtag' | null>(null);
        const [cursorPosition, setCursorPosition] = React.useState(0);
        const textareaRef = React.useRef<HTMLTextAreaElement>(null);

        // Forward the ref to parent so formatting toolbar can access the textarea
        React.useImperativeHandle(ref, () => textareaRef.current!, []);
        const popupRef = React.useRef<HTMLDivElement>(null);

        // Calculate cursor coordinates for popup positioning
        // Note: This is a simplified estimation. For production robust getCaretCoordinates is recommended.
        const updatePopupPosition = () => {
            if (!textareaRef.current) return;
            // Simple fallback: position near the bottom of textarea if tailored positioning is complex
            // Ideally we use a library like 'textarea-caret' to get exact pixel coordinates
            // For now, we'll position it absolute relative to the container
        };

        const handleInput = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(e);
            const newExValue = e.target.value;
            const selectionEnd = e.target.selectionEnd;
            setCursorPosition(selectionEnd);

            // Analyze text before cursor
            const textBeforeCursor = newExValue.slice(0, selectionEnd);
            const words = textBeforeCursor.split(/\s/);
            const lastWord = words[words.length - 1];

            if (lastWord.startsWith('@') && lastWord.length > 1) {
                setTriggerType('mention');
                const query = lastWord.slice(1); // remove @
                await fetchSuggestions('mention', query);
            } else if (lastWord.startsWith('#') && lastWord.length > 1) {
                setTriggerType('hashtag');
                const query = lastWord.slice(1); // remove #
                await fetchSuggestions('hashtag', query);
            } else {
                setSuggestions([]);
                setTriggerType(null);
            }
        };

        const fetchSuggestions = async (type: 'mention' | 'hashtag', query: string) => {
            const supabase = createClient();
            if (type === 'mention') {
                const { data } = await supabase.rpc('search_mentions', { search_term: query });
                if (data) {
                    setSuggestions(data.map((u: any) => ({
                        id: u.id,
                        text: u.username,
                        subtext: u.name,
                        image: u.avatar_url,
                        type: 'mention'
                    })));
                }
            } else {
                const { data } = await supabase.rpc('search_hashtags', { search_term: query });
                if (data) {
                    setSuggestions(data.map((h: any) => ({
                        id: String(h.id),
                        text: h.tag,
                        subtext: `${h.usage_count} posts`,
                        type: 'hashtag'
                    })));
                }
            }
            setActiveIndex(0);
        };

        const insertSuggestion = (suggestion: Suggestion) => {
            if (!textareaRef.current) return;

            const textBeforeCursor = value.slice(0, cursorPosition);
            const textAfterCursor = value.slice(cursorPosition);

            const words = textBeforeCursor.split(/\s/);
            const lastWord = words.pop(); // remove the partial trigger word
            const prefix = words.join(' ');

            const triggerChar = triggerType === 'mention' ? '@' : '#';
            const newText = (prefix ? prefix + ' ' : '') + triggerChar + suggestion.text + ' ' + textAfterCursor;

            // Create a synthetic event to update parent state
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            nativeInputValueSetter?.call(textareaRef.current, newText);

            const event = new Event('input', { bubbles: true });
            textareaRef.current.dispatchEvent(event);

            // Reset state
            setSuggestions([]);
            setTriggerType(null);

            // Refocus and place cursor
            // textareaRef.current.focus();
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (suggestions.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIndex(prev => (prev + 1) % suggestions.length);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    insertSuggestion(suggestions[activeIndex]);
                } else if (e.key === 'Escape') {
                    setSuggestions([]);
                }
            }
        };

        return (
            <div className="relative w-full">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    className={className}
                    autosize={props.autosize}
                    minRows={props.minRows}
                    maxRows={props.maxRows}
                    {...props}
                />

                {/* Popover Suggestions */}
                {suggestions.length > 0 && (
                    <div className="absolute z-50 w-64 bg-background border rounded-md shadow-lg overflow-hidden bottom-full mb-2 left-0 animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-1 max-h-48 overflow-y-auto">
                            {suggestions.map((item, index) => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => insertSuggestion(item)}
                                    className={cn(
                                        "w-full flex items-center gap-2 p-2 rounded-sm text-sm text-left transition-colors",
                                        index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                    )}
                                >
                                    {item.type === 'mention' ? (
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={item.image || undefined} />
                                            <AvatarFallback>{item.text[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Hash className="h-3 w-3 text-primary" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.text}</div>
                                        {item.subtext && <div className="text-xs text-muted-foreground truncate">{item.subtext}</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

SmartTextarea.displayName = "SmartTextarea";
