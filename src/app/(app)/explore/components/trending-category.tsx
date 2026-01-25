import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TrendingCategory({
    icon: Icon,
    title,
    count,
    trend
}: {
    icon: any;
    title: string;
    count: string;
    trend?: string;
}) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">{title}</p>
                        <p className="text-sm text-muted-foreground">{count}</p>
                    </div>
                    {trend && (
                        <Badge variant="secondary" className="ml-auto">
                            {trend}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
