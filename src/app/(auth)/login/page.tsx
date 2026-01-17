'use client';

import Link from 'next/link';
import Image from 'next/image';
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
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { createClient } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      const next = searchParams.get('next');
      router.push(next || '/');
      router.refresh();
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    const next = searchParams.get('next');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url(/background/c2.png)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background/70 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background/50" />

      {/* Form Wrapper */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-2">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent lg:bg-card lg:shadow-lg lg:border">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center lg:hidden mb-2">
              <Icons.logo className="h-16 w-16 text-primary" />
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* FIXED: Email Field with proper floating label */}
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder=" "
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer pt-6 pb-2"
                />
                <Label
                  htmlFor="email"
                  className={`absolute left-3 transition-all pointer-events-none ${
                    email
                      ? 'top-1 scale-75 text-sm text-primary'
                      : 'top-1/2 -translate-y-1/2 scale-100 text-muted-foreground'
                  }`}
                >
                  Email
                </Label>
              </div>

              {/* FIXED: Password Field with proper floating label */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer pr-10 pt-6 pb-2"
                />
                <Label
                  htmlFor="password"
                  className={`absolute left-3 transition-all pointer-events-none ${
                    password
                      ? 'top-1 scale-75 text-sm text-primary'
                      : 'top-1/2 -translate-y-1/2 scale-100 text-muted-foreground'
                  }`}
                >
                  Password
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">Toggle password visibility</span>
                </Button>
              </div>

              {/* "Forgot password?" link */}
              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Sign In
              </Button>
            </form>

            <div className="flex items-center my-6">
              <span className="flex-1 border-t" />
              <span className="mx-4 text-xs uppercase text-gray-500">
                Or continue with
              </span>
              <span className="flex-1 border-t" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
              >
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin('facebook')}
              >
                <Icons.facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
            </div>

            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-blue-700 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Wrapper */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center mt-6 lg:mt-0">
        <Image
          src="/background/c1.png"
          alt="Krishna and gopas"
          width={1000}
          height={600}
          className="object-contain rounded-lg w-full max-w-lg"
          priority
        />
      </div>
    </div>
  );
}