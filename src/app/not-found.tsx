'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Frown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="mx-auto w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Frown className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-bold">{t('notFound.title')}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {t('notFound.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">{t('notFound.returnHome')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
