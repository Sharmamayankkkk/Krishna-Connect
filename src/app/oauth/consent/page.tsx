'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle, Shield } from "lucide-react";

import { useTranslation } from 'react-i18next';

function ConsentContent() {
    const { t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();

    const clientId = searchParams.get('client_id');
    const scope = searchParams.get('scope') || 'profile email';
    const redirectUri = searchParams.get('redirect_uri');
    const appName = searchParams.get('app_name') || 'External Application';

    const handleAuthorize = () => {
        // Mock authorization logic
        // In a real flow, this would post to an API
        if (redirectUri) {
            // Add code=mock_code and state=mock_state for simulation
            const separator = redirectUri.includes('?') ? '&' : '?';
            const callbackUrl = `${redirectUri}${separator}code=mock_auth_code_123&state=${searchParams.get('state') || ''}`;
            window.location.href = callbackUrl;
        } else {
            alert("Authorization Successful! (No redirect_uri provided)");
        }
    };

    const handleCancel = () => {
        if (redirectUri) {
            const separator = redirectUri.includes('?') ? '&' : '?';
            window.location.href = `${redirectUri}${separator}error=access_denied`;
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-muted">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{t('common.authorizationRequest')}</CardTitle>
                    <CardDescription>
                        <span className="font-semibold text-foreground">{appName}</span> wants to access your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10">
                                {/* Placeholder for requesting app icon */}
                                <AvatarFallback>{appName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{appName}</p>
                                <p className="text-xs text-muted-foreground">{clientId ? `Client ID: ${clientId}` : 'Unknown Client'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">This app will be able to:</p>
                        <div className="space-y-2">
                            {scope.split(' ').map((s) => (
                                <div key={s} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>Access your {s.replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Make sure you trust this application correctly. You can revoke access at any time in your settings.</p>
                    </div>

                </CardContent>
                <CardFooter className="flex-col gap-3">
                    <Button className="w-full" size="lg" onClick={handleAuthorize}>{t('common.authorizeAccess')}</Button>
                    <Button variant="ghost" className="w-full" onClick={handleCancel}>{t('common.cancel')}</Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function ConsentPage() {
  const { t } = useTranslation();

    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>}>
            <ConsentContent />
        </Suspense>
    );
}
