'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setIsOtpSent(true);
      setTimeLeft(120);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
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
        <Card className="w-full max-w-md border-0 shadow-none bg-black/20 backdrop-blur-sm lg:bg-card/95 lg:backdrop-blur-none lg:shadow-xl lg:border lg:border-white/10 transition-all duration-300">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo/krishna_connect.png"
                alt="Krishna Connect Logo"
                width={100}
                height={100}
                className="h-24 w-auto drop-shadow-md"
                priority
              />
            </div>
          </CardHeader>

          <CardContent>

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="phone">Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
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
                      className="peer pt-6 pb-2 bg-background/50 border-input focus:border-primary transition-colors"
                    />
                    <Label
                      htmlFor="email"
                      className={`absolute left-3 transition-all pointer-events-none ${email
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
                      className="peer pr-10 pt-6 pb-2 bg-background/50 border-input focus:border-primary transition-colors"
                    />
                    <Label
                      htmlFor="password"
                      className={`absolute left-3 transition-all pointer-events-none ${password
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
                      className="text-sm text-foreground/80 hover:text-primary hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" className="w-full font-semibold shadow-lg hover:shadow-primary/25 transition-all" size="lg">
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {!isOtpSent ? (
                    <div className="relative">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="e.g. +919876543210"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="peer pt-6 pb-2 bg-background/50 border-input focus:border-primary transition-colors"
                      />
                      <Label
                        htmlFor="phone"
                        className={`absolute left-3 transition-all pointer-events-none ${phone
                          ? 'top-1 scale-75 text-sm text-primary'
                          : 'top-1/2 -translate-y-1/2 scale-100 text-muted-foreground'
                          }`}
                      >
                        Phone Number
                      </Label>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="peer pt-6 pb-2 bg-background/50 border-input focus:border-primary transition-colors"
                        maxLength={6}
                      />
                      <Label
                        htmlFor="otp"
                        className={`absolute left-3 transition-all pointer-events-none ${otp
                          ? 'top-1 scale-75 text-sm text-primary'
                          : 'top-1/2 -translate-y-1/2 scale-100 text-muted-foreground'
                          }`}
                      >
                        One-Time Password
                      </Label>
                    </div>
                  )}

                  <Button type="submit" className="w-full font-semibold shadow-lg hover:shadow-primary/25 transition-all" size="lg" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        Processing...
                      </span>
                    ) : isOtpSent ? 'Verify OTP & Login' : 'Get OTP'}
                  </Button>

                  {isOtpSent && (
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground mt-2">
                      <div className="flex justify-between w-full">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-muted-foreground"
                          onClick={() => {
                            setIsOtpSent(false);
                            setTimeLeft(0);
                          }}
                        >
                          Change Phone Number
                        </Button>

                        {timeLeft > 0 ? (
                          <span>Resend in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleSendOtp(e)}
                            className="text-primary hover:underline font-medium"
                            disabled={isLoading}
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>

            <div className="flex items-center my-6">
              <span className="flex-1 border-t border-border" />
              <span className="mx-4 text-xs uppercase text-muted-foreground font-medium">
                Or continue with
              </span>
              <span className="flex-1 border-t border-border" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                className="w-full bg-background/50 hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Icons.google className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
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