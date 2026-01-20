"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Search } from "lucide-react";

export default function GroupsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Groups</h2>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create New Group
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search groups..." className="pl-8" />
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Groups</TabsTrigger>
                    <TabsTrigger value="my-groups">My Groups</TabsTrigger>
                    <TabsTrigger value="popular">Popular</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Devotee Community</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">128 Members</div>
                                <p className="text-xs text-muted-foreground">General discussions about Krishna consciousness.</p>
                                <Button className="w-full mt-4" variant="outline">Join Group</Button>
                            </CardContent>
                        </Card>

                        <Card className="flex items-center justify-center p-6 border-dashed">
                            <div className="text-center">
                                <p className="text-muted-foreground">More groups coming soon...</p>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="my-groups">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">You haven't joined any groups yet</h3>
                        <p className="text-muted-foreground mt-2 mb-4">Join a group to connect with others.</p>
                        <Button variant="outline">Explore Groups</Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
