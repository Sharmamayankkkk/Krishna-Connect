"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, UserPlus, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Group {
    id: string;
    name: string;
    description: string;
    avatar_url: string;
    created_at: string;
    created_by: string;
    creator_name: string;
    creator_username: string;
    creator_avatar: string;
    member_count: number;
    is_member: boolean;
    is_admin?: boolean;
}

export default function GroupsPage() {
    const { toast } = useToast();
    const [publicGroups, setPublicGroups] = useState<Group[]>([]);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    // Fetch all groups
    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            // Fetch public groups
            const { data: publicData, error: publicError } = await supabase.rpc('get_public_groups', {
                p_limit: 50,
                p_offset: 0
            });

            if (publicError) throw publicError;
            setPublicGroups((publicData || []).map((g: any) => ({ ...g, id: g.id.toString() })));

            // Fetch user's groups
            const { data: myData, error: myError } = await supabase.rpc('get_user_groups', {
                p_limit: 50,
                p_offset: 0
            });

            if (myError) throw myError;
            setMyGroups((myData || []).map((g: any) => ({ ...g, id: g.id.toString() })));

            // Fetch suggested groups
            const { data: suggestedData, error: suggestedError } = await supabase.rpc('get_suggested_groups', {
                p_limit: 10
            });

            if (suggestedError) throw suggestedError;
            setSuggestedGroups((suggestedData || []).map((g: any) => ({ ...g, id: g.id.toString(), is_member: false })));

        } catch (error: any) {
            console.error('Error fetching groups:', error);
            toast({
                title: "Error loading groups",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        const supabase = createClient();

        try {
            const { data, error } = await supabase.rpc('join_group', {
                p_group_id: parseInt(groupId)
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: "✓ Joined group!",
                    description: "You are now a member of this group"
                });
                // Refresh groups
                fetchGroups();
            } else {
                toast({
                    title: "Cannot join group",
                    description: data?.message || "Unknown error",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            console.error('Error joining group:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to join group",
                variant: "destructive"
            });
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        const supabase = createClient();

        try {
            const { data, error } = await supabase.rpc('leave_group', {
                p_group_id: parseInt(groupId)
            });

            if (error) throw error;

            if (data?.success) {
                toast({
                    title: "Left group",
                    description: "You are no longer a member"
                });
                // Refresh groups
                fetchGroups();
            } else {
                toast({
                    title: "Cannot leave group",
                    description: data?.message || "Unknown error",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            console.error('Error leaving group:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to leave group",
                variant: "destructive"
            });
        }
    };

    // Filter groups by search query
    const filterGroups = (groups: Group[]) => {
        if (!searchQuery) return groups;
        return groups.filter(g =>
            g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const GroupCard = ({ group, showJoinButton = true }: { group: Group; showJoinButton?: boolean }) => (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={group.avatar_url} alt={group.name} />
                    <AvatarFallback>{group.name?.charAt(0) || 'G'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-1">{group.name || 'Unnamed Group'}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {group.member_count || 0} {group.member_count === 1 ? 'member' : 'members'}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description || 'No description'}
                </p>
                {showJoinButton && (
                    group.is_member ? (
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleLeaveGroup(group.id)}
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Joined
                        </Button>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={() => handleJoinGroup(group.id)}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Join Group
                        </Button>
                    )
                )}
            </CardContent>
        </Card>
    );

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{message}</h3>
            <p className="text-muted-foreground text-sm">Try creating a new group or joining an existing one</p>
        </div>
    );

    return (
        <div className="flex-1 w-full bg-background">
            <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-1">Groups</h1>
                        <p className="text-muted-foreground">Discover and join groups in the community</p>
                    </div>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Group
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search groups by name or description..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="all">
                            All Groups
                            {publicGroups.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{publicGroups.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="my-groups">
                            My Groups
                            {myGroups.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{myGroups.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="suggested">
                            Suggested
                            {suggestedGroups.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{suggestedGroups.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* All Groups Tab */}
                    <TabsContent value="all" className="space-y-4">
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-3/4"></div>
                                            <div className="h-3 bg-muted rounded w-1/2"></div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-3 bg-muted rounded w-full mb-2"></div>
                                            <div className="h-3 bg-muted rounded w-2/3"></div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : filterGroups(publicGroups).length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filterGroups(publicGroups).map(group => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState message={searchQuery ? "No groups found" : "No public groups available"} />
                        )}
                    </TabsContent>

                    {/* My Groups Tab */}
                    <TabsContent value="my-groups" className="space-y-4">
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-3/4"></div>
                                            <div className="h-3 bg-muted rounded w-1/2"></div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : filterGroups(myGroups).length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filterGroups(myGroups).map(group => (
                                    <GroupCard
                                        key={group.id}
                                        group={{ ...group, is_member: true }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="You haven't joined any groups yet" />
                        )}
                    </TabsContent>

                    {/* Suggested Tab */}
                    <TabsContent value="suggested" className="space-y-4">
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {[...Array(3)].map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader className="space-y-2">
                                            <div className="h-4 bg-muted rounded w-3/4"></div>
                                            <div className="h-3 bg-muted rounded w-1/2"></div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : suggestedGroups.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {suggestedGroups.map(group => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState message="No suggestions available" />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
