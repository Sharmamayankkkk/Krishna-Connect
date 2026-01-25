import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash } from 'lucide-react';

export function HashtagCard({
    hashtag,
    posts,
    category
}: {
    hashtag: string;
    posts: number;
    category?: string;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">{hashtag}</p>
                            <p className="text-sm text-muted-foreground">
                                {posts.toLocaleString()} posts
                            </p>
                        </div>
                    </div>
                    {category && (
                        <Badge variant="secondary">{category}</Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
