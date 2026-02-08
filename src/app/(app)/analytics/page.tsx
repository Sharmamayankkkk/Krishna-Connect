'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Loader2, TrendingUp, Eye, MessageCircle, Users,
    Download, RefreshCcw, ArrowUpRight, ArrowDownRight, Heart
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '@/providers/app-provider';
import Link from 'next/link';

// Types matching RPC returns
type AnalyticsSummary = {
    total_views: number;
    views_change: number;
    total_likes: number;
    likes_change: number;
    total_comments: number;
    comments_change: number;
    total_interactions: number;
    interactions_change: number;
    new_followers: number;
    followers_change: number;
};

type DailyStat = {
    date: string; // formatted in RPC or client
    fullDate?: string;
    views: number;
    likes: number;
    comments: number;
};

type DemographicData = {
    gender: string;
    percentage: number;
};

type PostingTimeData = {
    time_slot: string; // '6 AM - 9 AM' etc
    view_count: number;
};

type TopPost = {
    id: number;
    content: string;
    created_at: string;
    views: number;
    likes: number;
    comments: number;
    engagement_rate: number;
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

export default function AnalyticsPage() {
    const { loggedInUser: user, isReady } = useAppContext();
    const [period, setPeriod] = useState(30);
    const [isLoading, setIsLoading] = useState(true);

    // Data States
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
    const [demographics, setDemographics] = useState<DemographicData[]>([]);
    const [postingTimes, setPostingTimes] = useState<PostingTimeData[]>([]);
    const [topPosts, setTopPosts] = useState<TopPost[]>([]);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        const supabase = createClient();

        try {
            // 1. Summary
            const { data: summaryData } = await supabase.rpc('get_analytics_summary', {
                p_user_id: user.id,
                p_days: period
            });
            if (summaryData && summaryData.length > 0) setSummary(summaryData[0]);

            // 2. Daily Stats (Views/Engagement)
            const { data: dailyData } = await supabase.rpc('get_user_analytics', {
                p_user_id: user.id,
                p_days: period
            });
            if (dailyData) {
                const formatted = dailyData.map((item: any) => ({
                    ...item,
                    date: format(new Date(item.date), 'MMM dd'),
                    fullDate: item.date
                }));
                setDailyStats(formatted);
            }

            // 3. Demographics (Gender) - only fetch once typically, but handled here
            const { data: demographicData } = await supabase.rpc('get_audience_demographics', {
                p_user_id: user.id
            });
            if (demographicData) setDemographics(demographicData);

            // 4. Best Posting Times
            const { data: timeData } = await supabase.rpc('get_best_posting_times', {
                p_user_id: user.id
            });
            if (timeData) setPostingTimes(timeData);

            // 5. Top Performing Posts
            const { data: postsData } = await supabase.rpc('get_top_performing_posts', {
                p_user_id: user.id,
                p_limit: 5
            });
            if (postsData) setTopPosts(postsData);

        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isReady && user) {
            fetchData();
        }
    }, [isReady, user, period]);

    if (!isReady || (!user && isReady)) {
        return (
            <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                {!user && isReady && <p>Please log in to view analytics.</p>}
            </div>
        );
    }

    const renderChange = (value: number) => {
        const isPositive = value >= 0;
        return (
            <span className={`text-xs font-medium flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(value).toFixed(1)}% vs last period
            </span>
        );
    };

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">Track your performance and growth</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                        <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="30" onValueChange={(val) => setPeriod(parseInt(val))} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="7">Last 7 days</TabsTrigger>
                    <TabsTrigger value="30">Last 30 days</TabsTrigger>
                    <TabsTrigger value="90">Last 90 days</TabsTrigger>
                </TabsList>

                <TabsContent value={period.toString()} className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.total_views.toLocaleString() || 0}</div>
                                {summary && renderChange(summary.views_change)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary && summary.total_views > 0
                                        ? ((summary.total_likes + summary.total_comments) / summary.total_views * 100).toFixed(1)
                                        : 0}%
                                </div>
                                {summary && renderChange(summary.interactions_change)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.total_interactions.toLocaleString() || 0}</div>
                                {summary && renderChange(summary.interactions_change)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">New Followers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{summary?.new_followers.toLocaleString() || 0}</div>
                                {summary && renderChange(summary.followers_change)}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid gap-4 md:grid-cols-7">
                        {/* Views Over Time */}
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Views Over Time</CardTitle>
                                <CardDescription>Your content reach in the last {period} days</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyStats}>
                                            <defs>
                                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                            />
                                            <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audience Demographics */}
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Audience by Gender</CardTitle>
                                <CardDescription>Who's viewing your content</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full flex items-center justify-center">
                                    {demographics.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={demographics}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="percentage"
                                                    nameKey="gender"
                                                    label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                                >
                                                    {demographics.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            Not enough data yet.
                                            <br />
                                            <span className="text-xs">Views need to be associated with profiles that have set their gender.</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Secondary Charts Row */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Best Times to Post */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Best Times to Post</CardTitle>
                                <CardDescription>When your audience is most active</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={postingTimes}>
                                            <XAxis dataKey="time_slot" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                                            />
                                            <Bar dataKey="view_count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Engagement Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Engagement Breakdown</CardTitle>
                                <CardDescription>Likes vs Comments over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dailyStats}>
                                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="likes" name="Likes" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                                            <Bar dataKey="comments" name="Comments" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Performing Posts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Posts</CardTitle>
                            <CardDescription>Your best content this period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topPosts.length > 0 ? topPosts.map((post, index) => (
                                    <Link href={`/profile/${user?.username}/post/${post.id}`} key={post.id} className="block">
                                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium line-clamp-2 max-w-[500px]">{post.content || 'Media Post'}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views}</span>
                                                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes}</span>
                                                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {post.comments}</span>
                                                        <span>{format(new Date(post.created_at), 'MMM dd')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 ml-2">
                                                <div className="text-lg font-bold text-primary">{post.engagement_rate.toFixed(1)}%</div>
                                                <div className="text-xs text-muted-foreground">engagement</div>
                                            </div>
                                        </div>
                                    </Link>
                                )) : (
                                    <p className="text-center text-muted-foreground py-8">No posts found in this period</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insights & Recommendations */}
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Insights & Recommendations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {summary?.views_change && summary.views_change > 0 ? (
                                <div className="flex gap-3 items-start">
                                    <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                                    <p className="text-sm">
                                        <strong>Your reach is growing!</strong> You have {summary.views_change.toFixed(1)}% more views than the previous period. Keep posting consistently.
                                    </p>
                                </div>
                            ) : null}
                            {postingTimes.length > 0 && (
                                <div className="flex gap-3 items-start">
                                    <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                                    <p className="text-sm">
                                        <strong>Best Time to Post:</strong> Your audience is most active during {postingTimes[0].time_slot}. Try scheduling your next post then!
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-3 items-start">
                                <div className="mt-0.5 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                                <p className="text-sm">
                                    <strong>Content Tip:</strong> Posts with images generate 45% more engagement on average. Consider adding media to your text posts.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}