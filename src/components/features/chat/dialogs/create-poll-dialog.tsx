import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: number;
  loggedInUser: User;
  onPollCreated: (pollId: number, question: string) => void;
}

export const CreatePollDialog = ({ open, onOpenChange, chatId, loggedInUser, onPollCreated }: CreatePollDialogProps) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([{ id: '1', text: '' }, { id: '2', text: '' }]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowsMultiple, setAllowsMultiple] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleAddOption = () => {
    if (options.length >= 10) return;
    setOptions([...options, { id: Math.random().toString(36).substr(2, 9), text: '' }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(options.map(o => o.id === id ? { ...o, text } : o));
  };

  const handleSubmit = async () => {
    const validOptions = options.filter(o => o.text.trim().length > 0);
    if (!question.trim()) {
      toast({ title: 'Question required', variant: 'destructive' });
      return;
    }
    if (validOptions.length < 2) {
      toast({ title: 'At least 2 options required', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    // 1. Insert into polls table
    const pollData = {
      chat_id: chatId,
      created_by: loggedInUser.id,
      question: question.trim(),
      options: validOptions.map(o => ({ id: o.id, text: o.text.trim() })),
      is_anonymous: isAnonymous,
      allows_multiple: allowsMultiple,
    };

    const { data: poll, error } = await supabase
      .from('polls')
      .insert(pollData)
      .select('id')
      .single();

    if (error) {
      toast({ title: 'Error creating poll', description: error.message, variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    // 2. Clear state, trigger callback which sends the message
    setQuestion('');
    setOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setIsAnonymous(false);
    setAllowsMultiple(false);
    setIsSubmitting(false);
    onOpenChange(false);
    
    onPollCreated(poll.id, pollData.question);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input 
              placeholder="Ask a question..." 
              value={question} 
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
            />
          </div>

          <div className="space-y-2">
            <Label>Poll Options</Label>
            <ScrollArea className="max-h-[30vh] pr-4 space-y-2">
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <Input 
                      placeholder={`Option ${index + 1}`} 
                      value={option.text}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(option.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            {options.length < 10 && (
              <Button type="button" variant="ghost" className="w-full mt-2" onClick={handleAddOption}>
                <Plus className="h-4 w-4 mr-2" /> Add Option
              </Button>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anonymous Voting</Label>
                <p className="text-xs text-muted-foreground">Hide who voted for what</p>
              </div>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Multiple Answers</Label>
                <p className="text-xs text-muted-foreground">Allow selecting multiple options</p>
              </div>
              <Switch checked={allowsMultiple} onCheckedChange={setAllowsMultiple} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !question.trim()}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
