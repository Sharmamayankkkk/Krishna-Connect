'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flame, Check, Plus } from 'lucide-react';

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
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Community Challenges</h1>
            <p className="text-lg text-muted-foreground mt-2">Join our community in fun and inspiring challenges!</p>
        </div>

        {loading ? (
            <div className="text-center">Loading challenges...</div>
        ) : (
            <>
                {/* Active Challenges */}
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center"><Flame className="mr-2 text-primary"/> Active Challenges</h2>
                    <div className="space-y-4">
                        {activeChallenges.map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} onToggleJoin={toggleJoinChallenge} />
                        ))}
                    </div>
                </div>

                {/* Completed Challenges */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-4"><Check className="mr-2"/> Completed Challenges</h2>
                    <div className="space-y-4">
                         {completedChallenges.map(challenge => (
                            <ChallengeCard key={challenge.id} challenge={challenge} onToggleJoin={toggleJoinChallenge} />
                        ))}
                    </div>
                </div>
            </>
        )}
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