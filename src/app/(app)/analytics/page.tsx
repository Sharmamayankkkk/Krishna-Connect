'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Heart,
    MessageCircle,
    Eye,
    Share2,
    BarChart3,
    Calendar,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Target,
    Zap,
    Bookmark,
    MapPin,
    Globe,
    Activity,
    ChevronRight
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ComposedChart
} from 'recharts';
import { useAppContext } from '@/providers/app-provider';
import { PostType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { SidebarTrigger } from '@/components/ui/sidebar';

// Enhanced mock analytics data (no real posts for now)
const generateMockData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: Math.floor(Math.random() * 1000) + 500,
            likes: Math.floor(Math.random() * 200) + 50,
            comments: Math.floor(Math.random() * 50) + 10,
            followers: Math.floor(Math.random() * 50) + 10,
            engagement: Math.floor(Math.random() * 15) + 5,
            bookmarks: Math.floor(Math.random() * 30) + 10,
            shares: Math.floor(Math.random() * 40) + 15
        };
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
            date: date.getDate(),
            views: Math.floor(Math.random() * 1500) + 300,
            engagement: Math.floor(Math.random() * 20) + 5
        };
    });

    // Empty topPosts - will be fetched from DB
    const topPosts: (PostType & { views: number; engagementRate: string })[] = [];

    const audienceByGender = [
        { name: 'Male', value: 45, color: '#3b82f6' },
        { name: 'Female', value: 52, color: '#ec4899' },
        { name: 'Other', value: 3, color: '#8b5cf6' }
    ];

    const audienceByAge = [
        { age: '13-17', users: 120 },
        { age: '18-24', users: 450 },
        { age: '25-34', users: 680 },
        { age: '35-44', users: 340 },
        { age: '45+', users: 180 }
    ];

    const bestPostingTimes = [
        { time: '6-9 AM', engagement: 65, posts: 12 },
        { time: '9-12 PM', engagement: 45, posts: 18 },
        { time: '12-3 PM', engagement: 55, posts: 15 },
        { time: '3-6 PM', engagement: 85, posts: 22 },
        { time: '6-9 PM', engagement: 95, posts: 28 },
        { time: '9-12 AM', engagement: 70, posts: 14 }
    ];

    const topLocations = [
        { location: 'USA', percentage: 40, users: 1200 },
        { location: 'India', percentage: 25, users: 750 },
        { location: 'UK', percentage: 10, users: 300 },
        { location: 'Canada', percentage: 8, users: 240 },
        { location: 'Australia', percentage: 7, users: 210 },
        { location: 'Others', percentage: 10, users: 300 }
    ];

    const contentPerformance = [
        { type: 'Images', posts: 45, avgEngagement: 8.5, totalReach: 15000 },
        { type: 'Videos', posts: 12, avgEngagement: 12.3, totalReach: 8500 },
        { type: 'Text', posts: 28, avgEngagement: 4.2, totalReach: 5200 },
        { type: 'Polls', posts: 8, avgEngagement: 15.8, totalReach: 6800 },
        { type: 'GIFs', posts: 5, avgEngagement: 9.7, totalReach: 3200 }
    ];

    const trafficSources = [
        { source: 'For You Page', value: 60, users: 1800 },
        { source: 'Follower Feed', value: 25, users: 750 },
        { source: 'Hashtag Search', value: 10, users: 300 },
        { source: 'Profile', value: 5, users: 150 }
    ];

    const growthMetrics = [
        { metric: 'Engagement', score: 85 },
        { metric: 'Reach', score: 72 },
        { metric: 'Consistency', score: 90 },
        { metric: 'Content Quality', score: 88 },
        { metric: 'Audience Growth', score: 65 }
    ];

    return {
        last7Days,
        last30Days,
        topPosts,
        audienceByGender,
        audienceByAge,
        bestPostingTimes,
        topLocations,
        contentPerformance,
        trafficSources,
        growthMetrics
    };
};

// Stat Card Component
function StatCard({
    title,
    value,
    change,
    icon: Icon,
    trend,
    subtitle
}: {
    title: string;
    value: string | number;
    change: string;
    icon: any;
    trend: 'up' | 'down' | 'neutral';
    subtitle?: string;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    trend === 'up' && "bg-green-500/10",
                    trend === 'down' && "bg-red-500/10",
                    trend === 'neutral' && "bg-blue-500/10"
                )}>
                    <Icon className={cn(
                        "h-4 w-4",
                        trend === 'up' && "text-green-500",
                        trend === 'down' && "text-red-500",
                        trend === 'neutral' && "text-blue-500"
                    )} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    {trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : trend === 'down' ? (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                    ) : null}
                    <span className={cn(
                        trend === 'up' && "text-green-500",
                        trend === 'down' && "text-red-500"
                    )}>
                        {change}
                    </span>
                    <span>vs last period</span>
                </div>
            </CardContent>
        </Card>
    );
}

// Skeleton Loader
function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i}>
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-3 w-40" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-80" />
                <Skeleton className="h-80" />
            </div>
        </div>
    );
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const { loggedInUser } = useAppContext();
    const [isLoading, setIsLoading] = React.useState(true);
    const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '90d'>('7d');
    const [data, setData] = React.useState(generateMockData());

    React.useEffect(() => {
        // Simulate loading
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    }, []);

    // Calculate summary stats
    const totalViews = data.last7Days.reduce((acc, day) => acc + day.views, 0);
    const totalLikes = data.last7Days.reduce((acc, day) => acc + day.likes, 0);
    const totalComments = data.last7Days.reduce((acc, day) => acc + day.comments, 0);
    const totalFollowers = data.last7Days.reduce((acc, day) => acc + day.followers, 0);
    const totalBookmarks = data.last7Days.reduce((acc, day) => acc + day.bookmarks, 0);
    const totalShares = data.last7Days.reduce((acc, day) => acc + day.shares, 0);
    const avgEngagement = (data.last7Days.reduce((acc, day) => acc + day.engagement, 0) / 7).toFixed(1);

    if (!loggedInUser) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Please log in to view analytics</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-10">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">Track your performance and growth</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setData(generateMockData())} className="flex-1 sm:flex-none">
                        <RefreshCw className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
                {isLoading ? (
                    <AnalyticsSkeleton />
                ) : (
                    <>
                        {/* Time Range Selector */}
                        <div className="flex items-center justify-between">
                            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-full sm:w-auto">
                                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                                    <TabsTrigger value="7d" className="text-xs sm:text-sm">Last 7 days</TabsTrigger>
                                    <TabsTrigger value="30d" className="text-xs sm:text-sm">Last 30 days</TabsTrigger>
                                    <TabsTrigger value="90d" className="text-xs sm:text-sm">Last 90 days</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Views"
                                value={totalViews.toLocaleString()}
                                change="+12.5%"
                                icon={Eye}
                                trend="up"
                                subtitle="Impressions"
                            />
                            <StatCard
                                title="Engagement"
                                value={`${avgEngagement}%`}
                                change="+2.3%"
                                icon={Zap}
                                trend="up"
                                subtitle="Avg rate"
                            />
                            <StatCard
                                title="New Followers"
                                value={totalFollowers.toLocaleString()}
                                change="+8.1%"
                                icon={Users}
                                trend="up"
                                subtitle="This week"
                            />
                            <StatCard
                                title="Interactions"
                                value={(totalLikes + totalComments).toLocaleString()}
                                change="-1.2%"
                                icon={Heart}
                                trend="down"
                                subtitle="Total"
                            />
                        </div>

                        {/* Secondary Metrics */}
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Bookmarks</p>
                                            <p className="text-xl font-bold mt-1">{totalBookmarks}</p>
                                        </div>
                                        <Bookmark className="h-5 w-5 text-amber-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Shares</p>
                                            <p className="text-xl font-bold mt-1">{totalShares}</p>
                                        </div>
                                        <Share2 className="h-5 w-5 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Comments</p>
                                            <p className="text-xl font-bold mt-1">{totalComments}</p>
                                        </div>
                                        <MessageCircle className="h-5 w-5 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Likes</p>
                                            <p className="text-xl font-bold mt-1">{totalLikes}</p>
                                        </div>
                                        <Heart className="h-5 w-5 text-red-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            {/* Views Over Time */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg">Views Over Time</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Your content reach in the last 7 days</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                                        <AreaChart data={data.last7Days}>
                                            <defs>
                                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" className="text-[10px] sm:text-xs" />
                                            <YAxis className="text-[10px] sm:text-xs" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area
                                                type="monotone"
                                                dataKey="views"
                                                stroke="#3b82f6"
                                                fillOpacity={1}
                                                fill="url(#colorViews)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Engagement Breakdown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg">Engagement Breakdown</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Likes, comments, and interactions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                                        <ComposedChart data={data.last7Days}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="date" className="text-[10px] sm:text-xs" />
                                            <YAxis className="text-[10px] sm:text-xs" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                                            <Bar dataKey="likes" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} />
                                            <Line type="monotone" dataKey="bookmarks" stroke="#f59e0b" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Audience Demographics - Gender */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg">Audience by Gender</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Who's viewing your content</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                                        <PieChart>
                                            <Pie
                                                data={data.audienceByGender}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}%`}
                                                outerRadius={window.innerWidth < 640 ? 60 : 80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.audienceByGender.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Growth Metrics Radar */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Activity className="h-5 w-5" />
                                    Performance Score
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Overall account health metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300} className="sm:h-[350px]">
                                    <RadarChart data={data.growthMetrics}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="metric" className="text-[10px] sm:text-xs" />
                                        <PolarRadiusAxis className="text-[10px] sm:text-xs" />
                                        <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Content Performance & Traffic Sources */}
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            {/* Content Performance */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base sm:text-lg">Content Performance</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">How different content types perform</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                                        <BarChart data={data.contentPerformance} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis type="number" className="text-[10px] sm:text-xs" />
                                            <YAxis dataKey="type" type="category" className="text-[10px] sm:text-xs" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="avgEngagement" fill="#10b981" radius={[0, 8, 8, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Traffic Sources */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Globe className="h-5 w-5" />
                                        Traffic Sources
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Where your audience comes from</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {data.trafficSources.map((source, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-xs sm:text-sm">{source.source}</span>
                                                    <span className="font-medium text-xs sm:text-sm">{source.value}%</span>
                                                </div>
                                                <div className="relative">
                                                    <Progress value={source.value} className="h-2" />
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                    {source.users.toLocaleString()} users
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Best Posting Times & Top Locations */}
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            {/* Best Posting Times */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Clock className="h-5 w-5" />
                                        Best Times to Post
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">When your audience is most active</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={data.bestPostingTimes}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="time" className="text-[10px] sm:text-xs" />
                                            <YAxis className="text-[10px] sm:text-xs" />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="engagement" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Top Locations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <MapPin className="h-5 w-5" />
                                        Top Locations
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm">Geographic distribution of your audience</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {data.topLocations.map((location, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-medium">{location.location}</p>
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                                                            {location.users.toLocaleString()} users
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                    {location.percentage}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Audience by Age */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">Audience by Age</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Age distribution of your followers</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                                    <BarChart data={data.audienceByAge}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="age" className="text-[10px] sm:text-xs" />
                                        <YAxis className="text-[10px] sm:text-xs" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="users" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Top Performing Posts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Target className="h-5 w-5" />
                                    Top Performing Posts
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Your best content this week</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    {data.topPosts.map((post, index) => (
                                        <div key={post.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-medium line-clamp-2">{post.content}</p>
                                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        <span className="hidden xs:inline">{post.views.toLocaleString()}</span>
                                                        <span className="xs:hidden">{(post.views / 1000).toFixed(1)}k</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {post.stats.likes}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="h-3 w-3" />
                                                        {post.stats.comments}
                                                    </span>
                                                    <Badge variant="secondary" className="ml-auto text-[10px] sm:text-xs">
                                                        {post.engagementRate}%
                                                    </Badge>
                                                </div>
                                                {post.analytics && (
                                                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                                                        <span>Reach: {post.analytics.reach.toLocaleString()}</span>
                                                        <span>•</span>
                                                        <span>Impressions: {post.analytics.impressions.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Insights & Recommendations */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    Insights & Recommendations
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Personalized tips to grow your account</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                    <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium">Your engagement is up 12.5%!</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                            Posts between 6 PM - 9 PM get the most engagement. Try posting during this time.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <Target className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium">Your audience loves visual content</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                            Posts with images get 45% more engagement than text-only posts.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <Users className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium">Growing audience in 25-34 age group</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                            Consider creating content that resonates with this demographic.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium">Post consistently for better results</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                            Accounts that post 3-5 times per week see 2x more engagement on average.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                                    <Heart className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-medium">Engagement rate is strong</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                                            Your {avgEngagement}% engagement rate is above the platform average of 5.2%.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats Summary */}
                        <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                            <CardHeader>
                                <CardTitle className="text-base sm:text-lg">7-Day Summary</CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Your weekly performance at a glance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="text-center p-3 rounded-lg bg-background/50">
                                        <Eye className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                                        <p className="text-lg sm:text-xl font-bold">{totalViews.toLocaleString()}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Views</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-background/50">
                                        <Heart className="h-5 w-5 mx-auto mb-2 text-red-500" />
                                        <p className="text-lg sm:text-xl font-bold">{totalLikes.toLocaleString()}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Likes</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-background/50">
                                        <MessageCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                                        <p className="text-lg sm:text-xl font-bold">{totalComments}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Comments</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-background/50">
                                        <Share2 className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                                        <p className="text-lg sm:text-xl font-bold">{totalShares}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Shares</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-background/50">
                                        <Bookmark className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                                        <p className="text-lg sm:text-xl font-bold">{totalBookmarks}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Bookmarks</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-background/50">
                                        <Users className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                                        <p className="text-lg sm:text-xl font-bold">{totalFollowers}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground">Followers</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Export Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Download className="h-5 w-5" />
                                    Export Reports
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">Download detailed analytics reports</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <Button variant="outline" className="justify-start h-auto p-4">
                                        <div className="text-left">
                                            <p className="text-xs sm:text-sm font-medium">Full Analytics Report</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">PDF • Last 30 days</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto" />
                                    </Button>
                                    <Button variant="outline" className="justify-start h-auto p-4">
                                        <div className="text-left">
                                            <p className="text-xs sm:text-sm font-medium">Engagement Data</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">CSV • Custom range</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto" />
                                    </Button>
                                    <Button variant="outline" className="justify-start h-auto p-4">
                                        <div className="text-left">
                                            <p className="text-xs sm:text-sm font-medium">Audience Demographics</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Excel • All time</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-auto" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}