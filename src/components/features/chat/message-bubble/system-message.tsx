'use client';

import { Pin } from 'lucide-react';
import { SYSTEM_MESSAGE_PREFIX, PIN_MESSAGE_MARKER } from '../chat-constants';

export const SystemMessage = ({ content }: { content: string }) => {
    const parsedContent = content.replace(SYSTEM_MESSAGE_PREFIX, '').replace(']]', '');
    const isPinMessage = parsedContent.startsWith(PIN_MESSAGE_MARKER);
    const displayText = parsedContent.replace(`${PIN_MESSAGE_MARKER} `, '');
    return (
        <div className="text-center text-xs text-muted-foreground my-3">
            <span className="bg-muted px-2.5 py-1.5 rounded-full">
                {isPinMessage && <Pin className="inline-block h-3 w-3 mr-1.5" />}
                {displayText}
            </span>
        </div>
    );
};
