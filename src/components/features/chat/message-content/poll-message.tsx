'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Check, BarChart3, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DateChip } from './parse-markdown'; // REUSE our new date chip!

interface PollOption {
    id: string;
    text: string;
}

interface PollMessageProps {
    pollId: number;
    loggedInUserId: string;
    chatParticipants: any[];
}

export const PollMessage = ({ pollId, loggedInUserId, chatParticipants }: PollMessageProps) => {
    const [poll, setPoll] = useState<any>(null);
    const [votes, setVotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const { toast } = useToast();

    // Fetch poll and votes
    useEffect(() => {
        const fetchPollAndVotes = async () => {
            const { data: pData } = await supabase.from('polls').select('*').eq('id', pollId).single();
            const { data: vData } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId);
            if (pData) setPoll(pData);
            if (vData) setVotes(vData);
            setIsLoading(false);
        };
        fetchPollAndVotes();

        // Subscribe to votes for this poll
        const channel = supabase.channel(`poll_votes_${pollId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes', filter: `poll_id=eq.${pollId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setVotes(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'DELETE') {
                    setVotes(prev => prev.filter(v => v.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [pollId, supabase]);

    const handleVote = async (optionId: string) => {
        // Toggle if allows_multiple is true, else replace
        const { error } = await supabase.rpc('cast_poll_vote', {
            p_poll_id: pollId,
            p_user_id: loggedInUserId,
            p_option_id: optionId
        });
        if (error) {
            toast({ title: 'Error voting', description: error.message, variant: 'destructive' });
        }
    };

    const handleRemoveVote = async (optionId: string) => {
        const myVote = votes.find(v => v.user_id === loggedInUserId && v.option_id === optionId);
        if (myVote) {
             await supabase.from('poll_votes').delete().eq('id', myVote.id);
        }
    };

    const toggleVote = (optionId: string) => {
        const myVote = votes.find(v => v.user_id === loggedInUserId && v.option_id === optionId);
        if (myVote && poll?.allows_multiple) {
            handleRemoveVote(optionId);
        } else {
            handleVote(optionId);
        }
    };

    if (isLoading) return <div className="p-4 w-64 animate-pulse bg-muted rounded-md h-32"></div>;
    if (!poll) return <div className="p-4 w-64 bg-destructive/10 text-destructive rounded-md text-sm">Poll not found</div>;

    const totalVotes = votes.length;
    const options: PollOption[] = poll.options || [];

    return (
        <div className="w-[280px] sm:w-[320px] bg-card border rounded-lg overflow-hidden shadow-sm my-1">
            <div className="p-3 border-b bg-muted/40">
                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Poll {poll.is_anonymous ? '(Anonymous)' : ''}
                </div>
                <h4 className="font-semibold text-sm sm:text-base leading-snug">{poll.question}</h4>
            </div>
            
            <div className="p-3 space-y-2.5">
                {options.map((option) => {
                    const optionVotes = votes.filter(v => v.option_id === option.id);
                    const voteCount = optionVotes.length;
                    const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                    const isMyVote = votes.some(v => v.user_id === loggedInUserId && v.option_id === option.id);
                    
                    return (
                        <div key={option.id} className="relative group/option">
                            <button
                                className="w-full text-left relative z-10 p-2 text-sm hover:bg-muted/50 rounded-md transition-colors border border-transparent hover:border-border flex justify-between items-center"
                                onClick={() => toggleVote(option.id)}
                            >
                                <span className={`flex-1 font-medium ${isMyVote ? 'text-primary' : ''}`}>
                                    {option.text}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                    {isMyVote && <Check className="w-4 h-4 text-primary" />}
                                    {voteCount > 0 && <span className="text-xs font-mono font-bold">{percentage}%</span>}
                                </div>
                            </button>
                            
                            {/* Visual Progress Bar */}
                            <div className="absolute inset-0 bg-primary/10 rounded-md pointer-events-none transition-all duration-500 origin-left" style={{ transform: `scaleX(${percentage / 100})` }} />

                            {/* Who Voted Tooltip (if not anonymous) */}
                            {!poll.is_anonymous && voteCount > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1 pl-2">
                                    {optionVotes.slice(0, 5).map(v => {
                                        const profile = chatParticipants.find(p => p.user_id === v.user_id)?.profiles;
                                        if (!profile) return null;
                                        return (
                                            <TooltipProvider key={v.id}>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="w-5 h-5 border shadow-sm cursor-help">
                                                            <AvatarImage src={profile.avatar_url} />
                                                            <AvatarFallback className="text-[9px]">{profile.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-xs flex items-center gap-2">
                                                        <span>{profile.name} voted at</span>
                                                        <DateChip iso={v.voted_at} />
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                    {voteCount > 5 && (
                                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border shadow-sm">
                                            +{voteCount - 5}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="p-2 border-t bg-muted/20 text-xs text-center text-muted-foreground flex justify-between items-center px-4">
                <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                {poll.allows_multiple && <span className="opacity-70 flex items-center gap-1"><Check className="w-3 h-3"/> Multiple choice</span>}
            </div>
        </div>
    );
};
