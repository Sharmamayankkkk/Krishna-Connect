'use client';

import { Challenge } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, Flame, ShieldCheck, ChevronRight, Bookmark, BadgeCheck, Lock, Award } from 'lucide-react';
import { VerificationBadge } from '@/components/shared/verification-badge';
import { Button } from '@/components/ui/button';
import { getAvatarUrl } from '@/lib/utils';

import { useTranslation } from 'react-i18next';

interface ChallengeCardProps {
    challenge: Challenge;
    userId: string | null;
    onClick?: () => void;
    // Optional callbacks that can be wired up by the parent
    onToggleJoin?: (id: number, joined: boolean) => void;
    onSubmitProof?: () => void;
    onManage?: () => void;
    onToggleBookmark?: (e: React.MouseEvent) => void;
}

export function ChallengeCard({ challenge, userId, onClick, onToggleBookmark }: ChallengeCardProps) {
  const { t } = useTranslation();

    const isOwner = userId === challenge.author_id;

    return (
        <Card
            className="flex flex-col h-full overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-lg group relative cursor-pointer"
            onClick={onClick}
        >
            {/* Banner Image */}
            <div className="relative h-36 bg-muted w-full overflow-hidden">
                {challenge.cover_image ? (
                    <img
                        src={challenge.cover_image}
                        alt={challenge.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <Trophy className="h-10 w-10 text-primary/20" />
                    </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute top-2 right-2 flex gap-1">
                    {challenge.visibility === 'private' && (
                        <Badge variant="secondary" className="backdrop-blur-md bg-background/80 border-white/20 px-1.5 rounded-md">
                            <Lock className="h-3.5 w-3.5" />
                        </Badge>
                    )}
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80 border-white/20 px-2 rounded-md font-medium">
                        <Users className="h-3 w-3 mr-1" /> {challenge.participant_count}
                    </Badge>
                </div>

                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {challenge.is_featured && (
                        <Badge variant="default" className="text-[10px] px-2 rounded-sm bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-none tracking-wider font-bold">
                            <Flame className="h-3 w-3 mr-1" />{t('explore.featured')}</Badge>
                    )}
                    {challenge.status === 'submission_closed' && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 rounded-sm bg-red-500/90 hover:bg-red-500/90 shadow-sm border-none uppercase tracking-wider font-bold">{t('challenges.closed')}</Badge>
                    )}
                    {challenge.difficulty && (
                        <Badge variant="outline" className="backdrop-blur-md bg-background/60 border-white/30 text-[10px] uppercase font-bold text-foreground">
                            {challenge.difficulty}
                        </Badge>
                    )}
                </div>

                {/* Bookmark Button (Stop propagation to prevent card click) */}
                {onToggleBookmark && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background/50 hover:bg-background/90 text-foreground transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(e);
                        }}
                    >
                        <Bookmark className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">{challenge.title}</CardTitle>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {challenge.category && (
                        <Badge variant="secondary" className="bg-secondary/50 hover:bg-secondary/70 text-[10px] h-5 px-1.5 font-normal text-muted-foreground border-transparent">
                            {challenge.category}
                        </Badge>
                    )}

                    {/* Challenge Type specific badge */}
                    {challenge.type === 'speed_race' && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">{t('challenges.speedRace')}</Badge>
                    )}
                    {challenge.type === 'community_voted' && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30">{t('challenges.voting')}</Badge>
                    )}
                    {challenge.prize_description && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
                            <Award className="h-3 w-3 mr-0.5" />{t('challenges.prize')}</Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between gap-3">
                <CardDescription className="line-clamp-2 text-xs mt-1">
                    {challenge.description || "No description provided."}
                </CardDescription>

                {challenge.network_reason && (
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded w-fit">
                        <Users className="h-3 w-3" />
                        {challenge.network_reason}
                    </div>
                )}

                {/* Footer section inside content for alignment */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-full max-w-[65%]">
                        {challenge.author_avatar ? (
                            <img src={getAvatarUrl(challenge.author_avatar || undefined) || getAvatarUrl('male.png')} alt="" className="h-5 w-5 rounded-full object-cover shrink-0" />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold shrink-0">
                                {challenge.author_name?.[0] || 'C'}
                            </div>
                        )}
                        <div className="flex items-center gap-1 truncate w-full">
                            <span className="truncate">{challenge.author_name || 'Community'}</span>
                            <VerificationBadge verified={challenge.author_verified} size={14} className="shrink-0" />
                        </div>
                    </div>

                    {/* Streak indicator if user is participating and has a streak */}
                    {challenge.has_joined && (
                        <div className="flex justify-end">
                            <div className="flex items-center gap-1 text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-900/50">
                                <Flame className="h-3 w-3 fill-orange-500" />
                                <span>{t('getVerified.active')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
