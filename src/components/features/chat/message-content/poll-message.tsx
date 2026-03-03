'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient, getAvatarUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Users, Undo2, Circle, CheckCircle2, Square, CheckSquare, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DateChip } from './parse-markdown';

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
    const [showVoters, setShowVoters] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPollAndVotes = async () => {
            const { data: pData } = await supabase.from('polls').select('*').eq('id', pollId).single();
            const { data: vData } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId);
            if (pData) setPoll(pData);
            if (vData) setVotes(vData);
            setIsLoading(false);
        };
        fetchPollAndVotes();

        const channel = supabase.channel(`poll_votes_${pollId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes', filter: `poll_id=eq.${pollId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setVotes(prev => [...prev, payload.new]);
                } else if (payload.eventType === 'DELETE') {
                    setVotes(prev => prev.filter(v => v.id !== payload.old.id));
                } else if (payload.eventType === 'UPDATE') {
                    setVotes(prev => prev.map(v => v.id === payload.new.id ? payload.new : v));
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [pollId, supabase]);

    const handleVote = useCallback(async (optionId: string) => {
        const { error } = await supabase.rpc('cast_poll_vote', {
            p_poll_id: pollId,
            p_user_id: loggedInUserId,
            p_option_id: optionId
        });
        if (error) {
            toast({ title: 'Error voting', description: error.message, variant: 'destructive' });
        }
    }, [pollId, loggedInUserId, supabase, toast]);

    const handleRetractVote = useCallback(async (optionId?: string) => {
        const { error } = await supabase.rpc('retract_poll_vote', {
            p_poll_id: pollId,
            p_user_id: loggedInUserId,
            p_option_id: optionId ?? null
        });
        if (error) {
            toast({ title: 'Error retracting vote', description: error.message, variant: 'destructive' });
        }
    }, [pollId, loggedInUserId, supabase, toast]);

    const toggleVote = (optionId: string) => {
        const myVote = votes.find(v => v.user_id === loggedInUserId && v.option_id === optionId);
        if (myVote) {
            handleRetractVote(optionId);
        } else {
            handleVote(optionId);
        }
    };

    if (isLoading) {
        return (
            <div className="w-[280px] sm:w-[320px] rounded-xl overflow-hidden my-1 border border-border bg-card">
                <div className="p-3 space-y-3">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="space-y-2 pt-2">
                        <div className="h-10 bg-muted animate-pulse rounded-lg" />
                        <div className="h-10 bg-muted animate-pulse rounded-lg" />
                        <div className="h-10 bg-muted animate-pulse rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!poll) {
        return (
            <div className="w-[280px] sm:w-[320px] p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 shrink-0" />
                Poll not found
            </div>
        );
    }

    const totalVotes = votes.length;
    const options: PollOption[] = poll.options || [];
    const hasUserVoted = votes.some(v => v.user_id === loggedInUserId);
    const uniqueVoterCount = new Set(votes.map(v => v.user_id)).size;
    const isMultiple = poll.allows_multiple;

    // Pre-compute vote counts per option to avoid O(n²) in render
    const votesByOption = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const v of votes) {
            const arr = map.get(v.option_id) || [];
            arr.push(v);
            map.set(v.option_id, arr);
        }
        return map;
    }, [votes]);
    const maxVoteCount = useMemo(() => Math.max(0, ...options.map(o => (votesByOption.get(o.id) || []).length)), [options, votesByOption]);

    return (
        <div className="w-[280px] sm:w-[320px] rounded-xl overflow-hidden my-1 border-2 border-primary/25 bg-card shadow-md">
            {/* ── Header ── */}
            <div className="px-4 pt-3.5 pb-3 bg-gradient-to-br from-primary/12 via-primary/8 to-transparent">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
                            <BarChart3 className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Poll</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {poll.is_anonymous && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1 font-medium">
                                <EyeOff className="w-2.5 h-2.5" />
                                Anonymous
                            </Badge>
                        )}
                        {isMultiple && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-1 font-medium">
                                <CheckSquare className="w-2.5 h-2.5" />
                                Multi
                            </Badge>
                        )}
                    </div>
                </div>
                <h4 className="font-semibold text-[15px] leading-snug text-foreground">{poll.question}</h4>
            </div>

            {/* ── Options ── */}
            <div className="px-3 py-2.5 space-y-1.5">
                {options.map((option) => {
                    const optionVotes = votesByOption.get(option.id) || [];
                    const voteCount = optionVotes.length;
                    const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
                    const isMyVote = votes.some(v => v.user_id === loggedInUserId && v.option_id === option.id);
                    const isLeading = hasUserVoted && voteCount > 0 && voteCount === maxVoteCount;

                    return (
                        <div key={option.id}>
                            <button
                                className={`w-full text-left relative overflow-hidden rounded-lg transition-all duration-200 flex items-center gap-2.5 p-2.5 group/opt ${
                                    isMyVote
                                        ? 'bg-primary/12 ring-2 ring-primary/40 ring-inset'
                                        : 'bg-muted/40 hover:bg-muted/70 ring-1 ring-border/60 ring-inset hover:ring-primary/30'
                                }`}
                                onClick={() => toggleVote(option.id)}
                            >
                                {/* Progress fill behind content */}
                                {hasUserVoted && (
                                    <div
                                        className={`absolute inset-0 transition-all duration-700 ease-out origin-left ${
                                            isMyVote ? 'bg-primary/10' : 'bg-muted-foreground/5'
                                        }`}
                                        style={{ transform: `scaleX(${percentage / 100})` }}
                                    />
                                )}

                                {/* Indicator icon */}
                                <div className="relative z-10 shrink-0">
                                    {isMyVote ? (
                                        isMultiple
                                            ? <CheckSquare className="w-[18px] h-[18px] text-primary" />
                                            : <CheckCircle2 className="w-[18px] h-[18px] text-primary" />
                                    ) : (
                                        isMultiple
                                            ? <Square className="w-[18px] h-[18px] text-muted-foreground/50 group-hover/opt:text-primary/60 transition-colors" />
                                            : <Circle className="w-[18px] h-[18px] text-muted-foreground/50 group-hover/opt:text-primary/60 transition-colors" />
                                    )}
                                </div>

                                {/* Option text */}
                                <span className={`relative z-10 flex-1 text-[13px] leading-tight ${
                                    isMyVote ? 'font-semibold text-primary' : 'font-medium text-foreground'
                                }`}>
                                    {option.text}
                                </span>

                                {/* Vote count + percentage */}
                                {hasUserVoted && (
                                    <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                                        {isLeading && voteCount > 0 && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        )}
                                        <span className={`text-xs font-bold tabular-nums ${
                                            isMyVote ? 'text-primary' : 'text-muted-foreground'
                                        }`}>
                                            {percentage}%
                                        </span>
                                    </div>
                                )}
                            </button>

                            {/* Voter avatars for this option */}
                            {!poll.is_anonymous && hasUserVoted && showVoters && voteCount > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1 ml-8 mb-1">
                                    {optionVotes.slice(0, 6).map(v => {
                                        const profile = chatParticipants.find(p => p.user_id === v.user_id)?.profiles;
                                        if (!profile) return null;
                                        return (
                                            <TooltipProvider key={v.id}>
                                                <Tooltip delayDuration={200}>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="w-5 h-5 border border-border/50 shadow-sm cursor-help">
                                                            <AvatarImage src={getAvatarUrl(profile.avatar_url)} />
                                                            <AvatarFallback className="text-[8px] font-bold bg-primary/10 text-primary">{profile.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-xs flex items-center gap-2 py-1.5">
                                                        <span className="font-medium">{profile.name}</span>
                                                        <span className="text-muted-foreground">voted</span>
                                                        <DateChip iso={v.voted_at} />
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                    {voteCount > 6 && (
                                        <div className="h-5 px-1.5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold border border-border/50">
                                            +{voteCount - 6}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Footer ── */}
            <div className="px-3 py-2 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3 h-3" />
                        {uniqueVoterCount} {uniqueVoterCount === 1 ? 'voter' : 'voters'}
                    </span>
                    {totalVotes !== uniqueVoterCount && (
                        <span className="text-muted-foreground/60">· {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {/* Toggle voters visibility */}
                    {!poll.is_anonymous && hasUserVoted && (
                        <TooltipProvider>
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <button
                                        className={`p-1 rounded-md transition-colors ${
                                            showVoters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                        onClick={() => setShowVoters(prev => !prev)}
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    {showVoters ? 'Hide voters' : 'Show who voted'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Retract vote */}
                    {hasUserVoted && (
                        <TooltipProvider>
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <button
                                        className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                        onClick={() => handleRetractVote()}
                                    >
                                        <Undo2 className="w-3.5 h-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                    Retract your vote
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
        </div>
    );
};
