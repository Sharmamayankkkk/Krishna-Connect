'use client';

import { Shield, Lock, Eye, AtSign } from 'lucide-react';

export default function PrivacySettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Privacy & Visibility</h2>
        <p className="text-muted-foreground">
          Manage how your profile and content are seen by others.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Visibility */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Account Visibility
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Make your account private. If you do, only people you approve can see your posts and stories.
          </p>
          <div className="flex items-center space-x-2">
            {/* <Switch id="private-account" /> */}
            <label htmlFor="private-account" className="font-medium">Private Account</label>
          </div>
        </div>

        {/* Tagging Permissions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center">
            <AtSign className="h-5 w-5 mr-2" />
            Tagging Permissions
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose who can tag or mention you in their posts.
          </p>
          <div className="space-y-2">
            {/* <RadioGroup defaultValue="everyone">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="everyone" id="tag-everyone" />
                <Label htmlFor="tag-everyone">Everyone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="following" id="tag-following" />
                <Label htmlFor="tag-following">People you follow</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="tag-none" />
                <Label htmlFor="tag-none">No one</Label>
              </div>
            </RadioGroup> */}
          </div>
        </div>

        {/* Direct Message Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Direct Messages
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Control who can send you direct message requests.
          </p>
           <div className="space-y-2">
            {/* <RadioGroup defaultValue="everyone">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="everyone" id="dm-everyone" />
                <Label htmlFor="dm-everyone">Everyone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="following" id="dm-following" />
                <Label htmlFor="dm-following">People you follow</orLabel>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="dm-none" />
                <Label htmlFor="dm-none">No one</Label>
              </div>
            </RadioGroup> */}
          </div>
        </div>
      </div>
    </div>
  );
}
