'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Stats for both forms
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email specific
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone specific
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const validateCommonFields = async () => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username.trim())) {
      setError(t('auth.errors.usernameInvalid'));
      return false;
    }

    const { data: existingProfile, error: usernameError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle();

    if (usernameError && usernameError.code !== 'PGRST116') {
      setError(t('auth.errors.usernameCheckFailed'));
      return false;
    }

    if (existingProfile) {
      setError(t('auth.errors.usernameTaken'));
      return false;
    }

    return true;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      setIsLoading(false);
      return;
    }

    const isValid = await validateCommonFields();
    if (!isValid) {
      setIsLoading(false);
      return;
    }

    const avatar_url = gender === 'male' ? '/user_Avatar/male.png' : '/user_Avatar/female.png';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          username: username.trim(),
          gender,
          avatar_url,
        },
      },
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else if (signUpData.user?.identities?.length === 0) {
      setError(t('auth.accountExists'));
    } else {
      toast({
        title: t('auth.checkEmail'),
        description: t('auth.confirmationSent'),
      });
      router.push('/login');
    }
  };

  const handlePhoneSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isOtpSent) {
      // Verify OTP
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // Successful verification logs the user in
      router.push('/');
      router.refresh();
      setTimeLeft(0);

    } else {
      // Send OTP
      const isValid = await validateCommonFields();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      const avatar_url = gender === 'male' ? '/user_Avatar/male.png' : '/user_Avatar/female.png';

      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          data: {
            name: name.trim(),
            username: username.trim(),
            gender,
            avatar_url,
          }
        }
      });

      setIsLoading(false);

      if (error) {
        setError(error.message);
      } else {
        setIsOtpSent(true);
        setTimeLeft(120);
      }
    }
  };


  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    // Use custom URL scheme when running inside the Median native app
    const isNativeApp =
      typeof window !== 'undefined' &&
      /median|gonative/i.test(window.navigator.userAgent);
    const redirectTo = isNativeApp
      ? 'krishnaconnect://auth/callback'
      : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url(/background/c2.png)" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background/70 lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background/50" />

      {/* Form Wrapper */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-4 my-4 lg:my-0">
        <Card className="w-full max-w-md border-0 shadow-none bg-black/20 backdrop-blur-sm lg:bg-card/95 lg:backdrop-blur-none lg:shadow-xl lg:border lg:border-white/10 transition-all duration-300 overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo/krishna_connect.png"
                alt="Krishna Connect Logo"
                width={80}
                height={80}
                className="h-20 w-auto drop-shadow-md"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-muted-foreground">{t('auth.enterDetails')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('auth.signupFailed')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email">{t('auth.email')}</TabsTrigger>
                <TabsTrigger value="phone" disabled title={t('auth.phoneSignupUnavailable')}>{t('auth.phone')}</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-foreground">{t('auth.fullName')}</Label>
                    <Input id="full-name" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-foreground">{t('auth.username')}</Label>
                    <Input id="username" placeholder="johndoe" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
                    <Input id="email" type="email" placeholder="krishna@connect.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pr-10 bg-background/50 border-input focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">{t('auth.gender')}</Label>
                    <RadioGroup value={gender} onValueChange={(value: 'male' | 'female') => setGender(value)} className="flex items-center space-x-4 pt-1" disabled={isLoading}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" className="border-primary text-primary" />
                        <Label htmlFor="male" className="font-normal cursor-pointer text-foreground">{t('auth.prabhujiMale')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" className="border-primary text-primary" />
                        <Label htmlFor="female" className="font-normal cursor-pointer text-foreground">{t('auth.matajieFemale')}</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button type="submit" className="w-full font-semibold shadow-lg hover:shadow-primary/25 transition-all" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('auth.createAccount')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone">
                <form onSubmit={handlePhoneSignup} className="space-y-4">
                  {!isOtpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="full-name-phone" className="text-foreground">{t('auth.fullName')}</Label>
                        <Input id="full-name-phone" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username-phone" className="text-foreground">{t('auth.username')}</Label>
                        <Input id="username-phone" placeholder="johndoe" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">{t('auth.phoneNumber')}</Label>
                        <Input id="phone" type="tel" placeholder="e.g. +919876543210" required value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">{t('auth.gender')}</Label>
                        <RadioGroup value={gender} onValueChange={(value: 'male' | 'female') => setGender(value)} className="flex items-center space-x-4 pt-1" disabled={isLoading}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male-phone" className="border-primary text-primary" />
                            <Label htmlFor="male-phone" className="font-normal cursor-pointer text-foreground">{t('auth.prabhujiMale')}</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female-phone" className="border-primary text-primary" />
                            <Label htmlFor="female-phone" className="font-normal cursor-pointer text-foreground">{t('auth.matajieFemale')}</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="text-foreground">{t('auth.otp')}</Label>
                      <Input id="otp" placeholder={t('auth.enterOtp')} required value={otp} onChange={(e) => setOtp(e.target.value)} disabled={isLoading} className="bg-background/50 border-input focus:border-primary" />
                    </div>
                  )}

                  <Button type="submit" className="w-full font-semibold shadow-lg hover:shadow-primary/25 transition-all" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isOtpSent ? t('auth.verifyCreateAccount') : t('auth.getOtp')}
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
                          {t('auth.changeDetails')}
                        </Button>
                        {timeLeft > 0 ? (
                          <span>{t('auth.resendIn', { time: `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` })}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handlePhoneSignup(e)}
                            className="text-primary hover:underline font-medium"
                            disabled={isLoading}
                          >
                            {t('auth.resendOtp')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">{t('auth.orSignUpWith')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
                className="w-full bg-background/50 hover:bg-accent hover:text-accent-foreground transition-all"
              >
                <Icons.google className="mr-2 h-4 w-4" />
                {t('auth.google')}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link href="/login" className="font-bold text-primary hover:text-primary/80 hover:underline transition-colors">
                {t('auth.login')}
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center text-center text-xs text-muted-foreground pb-6">
            <p>
              {t('auth.termsAgreement')}{' '}
              <Link href="/terms-and-conditions" className="underline hover:text-primary transition-colors">
                {t('auth.terms')}
              </Link>
              ,{' '}
              <Link href="/privacy-policy" className="underline hover:text-primary transition-colors">
                {t('auth.privacyPolicy')}
              </Link>
              , and{' '}
              <Link href="/p/acceptable-use-policy" className="underline hover:text-primary transition-colors">
                {t('auth.acceptableUsePolicy')}
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Image Wrapper */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center mt-6 lg:mt-0 hidden lg:flex p-6">
        <Image
          src="/background/c1.png"
          alt="Krishna and gopas"
          width={800}
          height={600}
          className="object-contain rounded-lg w-full max-w-lg drop-shadow-2xl"
          priority
        />
      </div>
    </div>
  );
}
