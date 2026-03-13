
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Languages } from 'lucide-react';
import type { Message } from '@/lib/types';
import { translateMessage } from '@/ai/flows/translate-message-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useTranslation } from 'react-i18next';

interface TranslateDialogProps {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const commonLanguages = [
  'English', 'Spanish', 'French', 'German', 'Hindi', 'Bengali', 'Russian', 'Portuguese', 'Indonesian', 'Japanese', 'Chinese (Simplified)', 'Arabic'
];

export function TranslateDialog({ message, open, onOpenChange }: TranslateDialogProps) {
  const { t } = useTranslation();

  const { toast } = useToast();
  const [targetLanguage, setTargetLanguage] = React.useState('English');
  const [translatedText, setTranslatedText] = React.useState<string | null>(null);
  const [isTranslating, setIsTranslating] = React.useState(false);

  React.useEffect(() => {
    // Reset state when the dialog is closed or the message changes
    if (!open) {
      setTimeout(() => {
        setTranslatedText(null);
        setIsTranslating(false);
        setTargetLanguage('English');
      }, 200);
    }
  }, [open]);

  const handleTranslate = async () => {
    if (!message?.content) return;
    setIsTranslating(true);
    setTranslatedText(null);

    try {
      const result = await translateMessage({
        textToTranslate: message.content,
        targetLanguage,
      });
      setTranslatedText(result.translatedText);
    } catch (error: any) {
      console.error("Translation failed:", error);
      toast({
        variant: 'destructive',
        title: 'Translation Failed',
        description: error.message || 'Could not translate the message at this time.',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages />{t('dialogs.translateMessage')}</DialogTitle>
          <DialogDescription>{t('dialogs.selectALanguageToTranslateThe')}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label>{t('dialogs.originalMessage')}</Label>
                <p className="text-sm p-3 rounded-md bg-muted border text-muted-foreground max-h-28 overflow-y-auto">
                    {message?.content || 'No text content to translate.'}
                </p>
            </div>

            <div className="space-y-2">
                 <Label htmlFor="language-select">{t('dialogs.translateTo')}</Label>
                 <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                     <SelectTrigger id="language-select">
                         <SelectValue placeholder={t('dialogs.selectALanguage')} />
                     </SelectTrigger>
                     <SelectContent>
                       <ScrollArea className="h-48">
                          {commonLanguages.map(lang => (
                              <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                          ))}
                        </ScrollArea>
                     </SelectContent>
                 </Select>
            </div>
            
            {translatedText && !isTranslating && (
                 <div className="space-y-2">
                    <Label>{t('dialogs.translatedText')}</Label>
                    <p className="text-sm p-3 rounded-md bg-primary/10 border border-primary/20 text-primary max-h-28 overflow-y-auto">
                        {translatedText}
                    </p>
                </div>
            )}
            
            {isTranslating && (
                <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
          <Button onClick={handleTranslate} disabled={isTranslating || !message?.content}>
            {isTranslating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Languages className="mr-2 h-4 w-4" />}
            {t('dialogs.translate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
