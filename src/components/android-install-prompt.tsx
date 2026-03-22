"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, HelpCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AndroidInstallPrompt() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    // Check if the user is on an Android device
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isAndroid = /android/i.test(userAgent);
    
    // Check if the prompt has already been dismissed
    const hasDismissed = localStorage.getItem('android-install-prompt-dismissed') === 'true';

    if (isAndroid && !hasDismissed) {
      // Add a small delay so it doesn't pop up instantly on load
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('android-install-prompt-dismissed', 'true');
    setIsOpen(false);
  };

  const handleDownload = () => {
    // Optionally track download event here
    // e.g. analytics.track('apk_download_clicked');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {!showHelp ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="h-5 w-5 text-primary" />
                Download Krishna Connect App
              </DialogTitle>
              <DialogDescription>
                Get a better, faster, and more immersive experience with our dedicated Android application!
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex justify-center p-4">
                 <img src="/logo/krishna_connect.png" alt="Krishna Connect" className="w-24 h-24 rounded-2xl shadow-md" />
              </div>
              <a 
                href="/Krishna%20Connect.apk" 
                download="Krishna Connect.apk" 
                onClick={handleDownload}
                className="w-full"
              >
                <Button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg">
                  <Download className="h-5 w-5" />
                  Download APK
                </Button>
              </a>
              
              <button 
                onClick={() => setShowHelp(true)}
                className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mt-2 underline underline-offset-4"
              >
                <HelpCircle className="h-4 w-4" />
                Having trouble installing?
              </button>
            </div>

            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="ghost" onClick={handleClose} className="w-full mt-2 sm:mt-0">
                Maybe later
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <HelpCircle className="h-5 w-5 text-amber-500" />
                Installation Guide
              </DialogTitle>
              <DialogDescription>
                If you see an "Install blocked" or "Unknown sources" error, follow these easy steps:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm text-muted-foreground bg-muted/30 p-4 rounded-md">
              <ol className="list-decimal list-inside space-y-2 font-medium">
                <li>Go to your device <strong>Settings</strong></li>
                <li>Tap <strong>Security</strong> or <strong>Privacy</strong></li>
                <li>Find <strong>Install unknown apps</strong> or <strong>Unknown sources</strong></li>
                <li>Select your browser (e.g., Chrome)</li>
                <li>Enable <strong>Allow from this source</strong></li>
                <li>Retry installing the APK</li>
              </ol>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowHelp(false)} className="w-full sm:w-auto">
                Back
              </Button>
              <a 
                href="/KrishnaConnect.apk" 
                download="Krishna Connect.apk" 
                onClick={handleDownload}
                className="w-full"
              >
                <Button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90">
                  <Download className="h-4 w-4" />
                  Retry Download
                </Button>
              </a>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
