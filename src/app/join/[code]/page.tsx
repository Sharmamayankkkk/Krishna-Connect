
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/utils';
import { useAppContext } from '@/providers/app-provider';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { useTranslation } from 'react-i18next';

function JoinPageScreen({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
              <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children && <CardContent>{children}</CardContent>}
      </Card>
    </div>
  );
}

export default function JoinGroupPage() {
  const { t } = useTranslation();

  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { loggedInUser, isReady, addChat } = useAppContext();
  const supabase = createClient();
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    if (!isReady || !loggedInUser || hasProcessed) {
      return;
    }

    setHasProcessed(true); // Prevent re-running on context updates

    const joinGroup = async () => {
      if (!code) {
        toast({ variant: 'destructive', title: 'Invalid Invite Link', description: 'The invite code is missing.' });
        router.push('/chat');
        return;
      }

      try {
        // 1. Find the chat with the invite code and its current participants
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('id, name, is_public, participants:participants(user_id)')
          .eq('invite_code', code)
          .single();

        if (chatError || !chatData) {
          throw new Error('This invite link is invalid or has expired.');
        }

        // 2. Check if the group is public. If not, this link is invalid for joining.
        if (!chatData.is_public) {
            throw new Error('This is a private group. You can only be added by a member.');
        }

        // 3. Check if user is already a member
        const isAlreadyMember = chatData.participants.some(p => p.user_id === loggedInUser.id);
        if (isAlreadyMember) {
          toast({ title: "Welcome back!", description: `You are already a member of ${chatData.name}.` });
          router.push(`/chat/${chatData.id}`);
          return;
        }

        // 4. Add the user as a new participant
        const { error: insertError } = await supabase.from('participants').insert({
          chat_id: chatData.id,
          user_id: loggedInUser.id,
          is_admin: false,
        });

        if (insertError) {
          throw new Error('Failed to join the group. Please try again.');
        }

        // 5. Fetch full chat object to add to context and redirect
        const { data: newFullChat, error: newChatError } = await supabase
            .from("chats")
            .select(`*, participants:participants!chat_id(*, profiles!user_id(*))`)
            .eq("id", chatData.id)
            .single();

        if (newChatError || !newFullChat) {
            throw newChatError || new Error("Failed to fetch group details after joining.");
        }
        
        addChat(newFullChat as any);
        toast({ title: 'Successfully Joined!', description: `Welcome to ${chatData.name}!` });
        router.push(`/chat/${chatData.id}`);

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to Join Group', description: error.message });
        router.push('/chat');
      }
    };

    joinGroup();
  }, [code, loggedInUser, isReady, hasProcessed, router, supabase, toast, addChat]);

  if (!isReady) {
    return <JoinPageScreen title={t('common.joiningGroup')} description={t('common.validatingInviteLink')} />;
  }

  if (!loggedInUser) {
    return (
      <JoinPageScreen title={t('common.loginToJoin')} description={t('common.youNeedToSignInTo')}>
        <Link href={`/login?next=${pathname}`} className="w-full">
            <Button className="w-full">{t('common.goToLogin')}</Button>
        </Link>
      </JoinPageScreen>
    );
  }

  return <JoinPageScreen title={t('common.joiningGroup')} description={t('common.pleaseWaitWhileWeAddYou')} />;
}
