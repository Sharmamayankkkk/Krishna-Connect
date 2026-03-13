
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import type React from "react"
import { useState, useEffect } from "react"
import { useTranslation } from 'react-i18next';
import { createClient } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { t } = useTranslation();
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false);
  const supabase = createClient()
  
  useEffect(() => {
    // This effect runs once to check if we are in a recovery session.
    // If not, it redirects the user away.
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
         router.replace("/login?error=Invalid or expired password reset link.");
      } else {
         setSessionChecked(true);
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage(t('auth.passwordUpdated'))
        // Sign out to clear the recovery session
        await supabase.auth.signOut()
        setTimeout(() => {
          router.replace("/login?message=Password updated successfully. Please log in.")
        }, 3000)
      }
    } catch (error: any) {
      setError(t('auth.unexpectedError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!sessionChecked) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <Icons.logo className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{t('auth.updatePasswordTitle')}</CardTitle>
        <CardDescription>{t('auth.updatePasswordDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert
                variant="default"
                className="border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>{t('common.success')}</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || !!message}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label="Toggle password visibility"
                >
                    {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('auth.confirmNewPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !!message}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !!message}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.updatePassword')}
            </Button>
          </form>
      </CardContent>
    </Card>
  )
}
