'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import type { PollType as Poll } from '../../data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (poll: Poll) => void;
}

export function CreatePollDialog({ open, onOpenChange, onCreatePoll }: CreatePollDialogProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationDays, setDurationDays] = useState("1");

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (!question.trim()) return;
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) return;

    const days = parseInt(durationDays);
    const pollData: Poll = {
      id: `poll_${Date.now()}`,
      question,
      options: filledOptions.map((text, i) => ({
        id: `opt_${i + 1}`,
        text,
        votes: 0,
        votedBy: [],
      })),
      totalVotes: 0,
      endsAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      allowMultipleChoices: false,
    };
    onCreatePoll(pollData);
    handleClose();
  };

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setDurationDays("1");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6 gap-4">
        <DialogHeader>
          <DialogTitle>Create a new Poll</DialogTitle>
          <DialogDescription>
            Ask a question and let the community vote.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="poll-question">Question</Label>
            <Input
              id="poll-question"
              placeholder="Ask a question..."
              className="h-10"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={100}
            />
            <div className="text-xs text-right text-muted-foreground">
              {question.length}/100
            </div>
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 relative">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={50}
                  className="pr-10"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <Button variant="outline" size="sm" onClick={addOption} className="w-full border-dashed">
                <Plus className="mr-2 h-4 w-4" />
                Add Option
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Poll Duration</Label>
            <Select value={durationDays} onValueChange={setDurationDays}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleCreate} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}>Create Poll</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}