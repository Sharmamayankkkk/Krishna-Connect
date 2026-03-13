
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage(t('auth.resetLinkSent'));
    }
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
            <Icons.logo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.forgotPasswordTitle')}</CardTitle>
        <CardDescription>{t('auth.forgotPasswordDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetRequest} className="space-y-4">
          {error && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('common.error')}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
           {message && (
              <Alert variant="default" className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>{t('auth.checkYourEmail')}</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
              </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="krishna@connect.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || !!message}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !!message}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('auth.sendResetLink')}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          {t('auth.rememberedPassword')}{' '}
          <Link href="/login" className="underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
