'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PostType } from '@/app/(app)/data';
import { Zap, X } from 'lucide-react';

interface PromotePostDialogProps {
    post: PostType | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (postId: string, budget: number) => void;
}

const budgetOptions = [
    { value: 10, label: "$10", reach: "~5,000" },
    { value: 25, label: "$25", reach: "~15,000" },
    { value: 50, label: "$50", reach: "~40,000" },
];

export function PromotePostDialog({ post, isOpen, onClose, onConfirm }: PromotePostDialogProps) {
    const [selectedBudget, setSelectedBudget] = React.useState(25);

    if (!post) return null;

    const handleConfirm = () => {
        onConfirm(post.id, selectedBudget);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center"><Zap className="h-5 w-5 mr-2 text-primary"/> Promote Your Post</DialogTitle>
                    <DialogDescription>
                        Boost this post to reach a wider, relevant audience beyond your followers.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    {/* Post Preview */}
                    <div>
                        <Label className="text-sm font-medium">Post Preview</Label>
                        <Card className="mt-2 bg-muted/50">
                            <CardContent className="p-4 text-sm">
                                <p className='line-clamp-3'>{post.content}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Budget Selection */}
                    <div>
                        <Label className="text-sm font-medium">Choose Your Budget</Label>
                        <p className='text-xs text-muted-foreground mb-3'>A higher budget will show your post to more people.</p>
                        <RadioGroup 
                            defaultValue="25" 
                            onValueChange={(value) => setSelectedBudget(parseInt(value))}
                            className="grid grid-cols-3 gap-4"
                        >
                            {budgetOptions.map(option => (
                                <Label 
                                    key={option.value}
                                    htmlFor={`budget-${option.value}`}
                                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                                >
                                    <RadioGroupItem value={String(option.value)} id={`budget-${option.value}`} className="sr-only" />
                                    <span className='text-xl font-semibold'>{option.label}</span>
                                    <span className='text-xs text-muted-foreground mt-1'>Est. {option.reach} views</span>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter className='sm:justify-between items-center'>
                    <div className='text-xs text-muted-foreground'>
                        This is a mock transaction for demonstration purposes.
                    </div>
                    <div className='flex gap-2'>
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleConfirm}>
                            <Zap className='h-4 w-4 mr-2'/>
                            Promote for ${selectedBudget}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
