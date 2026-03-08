'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FollowRequest = {
    id: string; // the notification or relationship ID
    fromUser: {
        id: string;
        name: string;
        username: string;
        avatar: string;
    };
    createdAt: string;
};

export default function FollowRequestsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [requests, setRequests] = React.useState<FollowRequest[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true);
            const ObjectSupabase = await import('@/lib/supabase/client');
            const supabase = ObjectSupabase.createClient();
            
            // Re-using the get_user_notifications RPC specifically to fetch pending follow requests
            // In a full implementation, you might query a `followers` table where status='pending' 
            // Here we leverage the notifications we already track
            const { data, error } = await supabase.rpc('get_user_notifications', {
                p_limit: 100,
                p_offset: 0
            });

            if (!error && data) {
                const pendingFollows = data
                    .filter((n: any) => n.type === 'follow_request')
                    .map((n: any) => ({
                        id: n.id.toString(),
                        fromUser: {
                            id: n.actor_id,
                            name: n.actor_name || n.actor_username || 'Unknown',
                            username: n.actor_username || 'unknown',
                            avatar: n.actor_avatar_url || '/placeholder-user.jpg',
                        },
                        createdAt: n.created_at
                    }));
                setRequests(pendingFollows);
            }
            setIsLoading(false);
        };

        fetchRequests();
    }, []);

    const handleAccept = async (id: string) => {
        // Optimistic update
        setRequests(prev => prev.filter(req => req.id !== id));
        toast({ title: "Request accepted" });
        
        // TODO: Call real RPC to accept request
        // const { error } = await supabase.rpc('accept_follow_request', { ... })
    };

    const handleDecline = async (id: string) => {
        // Optimistic update
        setRequests(prev => prev.filter(req => req.id !== id));
        toast({ title: "Request deleted" });
        
        // TODO: Call real RPC to decline request
        // const { error } = await supabase.rpc('decline_follow_request', { ... })
    };

    return (
        <div className="flex bg-background min-h-screen w-full flex-col">
            {/* Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/40 bg-background px-4 py-3 sm:px-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="p-1 -ml-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Follow requests</h1>
                </div>
            </div>

            <div className="w-full max-w-2xl mx-auto flex-1 pt-2">
                {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                            <span className="text-2xl text-muted-foreground/50">0</span>
                        </div>
                        <h3 className="font-semibold text-foreground">No follow requests</h3>
                        <p className="text-sm mt-1">You don't have any pending follow requests.</p>
                    </div>
                ) : (
                    <div className="w-full">
                        {requests.map(req => (
                            <div key={req.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                                <div className="flex items-center gap-3 min-w-0 pr-2 cursor-pointer">
                                    <Avatar className="h-12 w-12 ring-1 ring-border/10 shrink-0">
                                        <AvatarImage src={req.fromUser.avatar} />
                                        <AvatarFallback>{req.fromUser.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-[14px] truncate text-foreground">{req.fromUser.username}</span>
                                        <span className="text-[14px] text-muted-foreground truncate">{req.fromUser.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button 
                                        className="h-8 rounded-lg bg-[#0064e0] px-4 py-0 text-sm font-semibold hover:bg-[#0052b8] text-white"
                                        onClick={() => handleAccept(req.id)}
                                    >
                                        Confirm
                                    </Button>
                                    <Button 
                                        variant="secondary" 
                                        className="h-8 rounded-lg bg-muted px-4 py-0 text-sm font-semibold hover:bg-muted/80 text-foreground"
                                        onClick={() => handleDecline(req.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
