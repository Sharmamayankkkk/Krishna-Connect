'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flame, Check, Trophy, Plus } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
    id: number;
    title: string;
    description: string | null;
    is_active: boolean | null;
    participant_count: number;
    has_joined: boolean;
}

export default function ChallengesPage() {
  const supabase = createClient();
  const { loggedInUser } = useAppContext();
  const { toast } = useToast();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Create challenge dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRules, setNewRules] = useState('');
  const [newPrize, setNewPrize] = useState('');

  const isVerified = loggedInUser?.is_verified === 'verified' || loggedInUser?.is_verified === 'kcs';

  useEffect(() => {
    const fetchUserAndChallenges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchChallenges(user.id);
      }
    };

    const fetchChallenges = async (currentUserId: string) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: currentUserId });

        if (error) {
            console.error('Error fetching challenges:', error);
        } else {
            setActiveChallenges(data.filter((c: Challenge) => c.is_active));
            setCompletedChallenges(data.filter((c: Challenge) => !c.is_active));
        }
        setLoading(false);
    };

    fetchUserAndChallenges();
  }, [supabase]);

  const toggleJoinChallenge = async (challengeId: number, hasJoined: boolean) => {
    if (!userId) return;

    if (hasJoined) {
      // Leave the challenge
      await supabase.from('challenge_participants').delete().match({ challenge_id: challengeId, user_id: userId });
    } else {
      // Join the challenge
      await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: userId });
    }

    // Refresh the challenges list
    fetchChallenges(userId);
  };

  const fetchChallenges = async (currentUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_challenges', { p_user_id: currentUserId });

    if (error) {
        console.error('Error fetching challenges:', error);
    } else {
        setActiveChallenges(data.filter((c: Challenge) => c.is_active));
        setCompletedChallenges(data.filter((c: Challenge) => !c.is_active));
    }
    setLoading(false);
  }

  const handleCreateChallenge = async () => {
    if (!newTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    const { error } = await supabase.rpc('create_challenge', {
      p_title: newTitle.trim(),
      p_description: newDescription.trim() || null,
      p_rules: newRules.trim() || null,
      p_prize_description: newPrize.trim() || null,
    });

    if (error) {
      toast({ title: 'Failed to create challenge', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Challenge created!' });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewRules('');
      setNewPrize('');
      if (userId) fetchChallenges(userId);
    }
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center gap-4 p-4">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-2 flex-1">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold">Challenges</h1>
                </div>
                {isVerified && (
                    <Button size="sm" className="gap-1.5" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Create
                    </Button>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 max-w-4xl mx-auto w-full">

        {loading ? (
            <div className="text-center py-12">Loading challenges...</div>
        ) : (
            <>
                {/* Active Challenges */}
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center"><Flame className="mr-2 text-primary"/> Active Challenges</h2>
                    <div className="space-y-4">
                        {activeChallenges.map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} onToggleJoin={toggleJoinChallenge} />
                        ))}
                        {activeChallenges.length === 0 && (
                            <p className="text-muted-foreground text-sm py-4">No active challenges right now.</p>
                        )}
                    </div>
                </div>

                {/* Completed Challenges */}
                {completedChallenges.length > 0 && (
                    <div className="mt-12">
                        <h2 className="text-lg font-bold mb-4 flex items-center"><Check className="mr-2 text-green-500"/> Completed Challenges</h2>
                        <div className="space-y-4">
                             {completedChallenges.map(challenge => (
                                <ChallengeCard key={challenge.id} challenge={challenge} onToggleJoin={toggleJoinChallenge} />
                            ))}
                        </div>
                    </div>
                )}
            </>
        )}
        </div>

        {/* Create Challenge Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Challenge</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="challenge-title">Title *</Label>
                        <Input
                            id="challenge-title"
                            placeholder="Challenge title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="challenge-description">Description</Label>
                        <Textarea
                            id="challenge-description"
                            placeholder="Describe the challenge..."
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="challenge-rules">Rules</Label>
                        <Textarea
                            id="challenge-rules"
                            placeholder="Challenge rules..."
                            value={newRules}
                            onChange={(e) => setNewRules(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="challenge-prize">Prize Description</Label>
                        <Input
                            id="challenge-prize"
                            placeholder="What's the prize?"
                            value={newPrize}
                            onChange={(e) => setNewPrize(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateChallenge} disabled={isCreating || !newTitle.trim()}>
                        {isCreating ? 'Creating...' : 'Create Challenge'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

const ChallengeCard = ({ challenge, onToggleJoin }: { challenge: Challenge, onToggleJoin: (challengeId: number, hasJoined: boolean) => void }) => {
    return (
        <div className="bg-card border rounded-lg p-5 flex justify-between items-center transition-all hover:shadow-md">
            <div>
                <h3 className="text-xl font-semibold">{challenge.title}</h3>
                <p className="text-muted-foreground mt-1">{challenge.description}</p>
                <p className="text-sm text-muted-foreground mt-2">{challenge.participant_count} participants</p>
            </div>
            <button 
                onClick={() => onToggleJoin(challenge.id, challenge.has_joined)}
                className={`btn ${challenge.has_joined ? 'btn-secondary' : 'btn-primary'}`}>
                {challenge.has_joined ? 'Leave' : 'Join'}
            </button>
        </div>
    )
}