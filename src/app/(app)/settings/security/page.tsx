'use client';

import { KeyRound, Smartphone, LogOut } from 'lucide-react';

// Mock data for active sessions
const mockSessions = [
  {
    id: '1',
    device: 'Chrome on Windows',
    location: 'Vrindavan, UP, India',
    last_active: 'Active now',
    isCurrent: true,
  },
  {
    id: '2',
    device: 'iPhone App',
    location: 'Mayapur, WB, India',
    last_active: '2 hours ago',
    isCurrent: false,
  },
];

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Account Security</h2>
        <p className="text-muted-foreground">
          Manage your password, two-factor authentication, and active sessions to keep your account secure.
        </p>
      </div>

      <div className="space-y-6">
        {/* Change Password */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center">
            <KeyRound className="h-5 w-5 mr-2" />
            Password
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            It's a good idea to use a strong password that you're not using elsewhere.
          </p>
          {/* <Button variant="outline">Change Password</Button> */}
        </div>

        {/* Two-Factor Authentication */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Two-Factor Authentication (2FA)
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add an extra layer of security to your account by requiring a second verification step upon login.
          </p>
          {/* <Button variant="outline">Set Up 2FA</Button> */}
        </div>

        {/* Active Sessions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center">
            <LogOut className="h-5 w-5 mr-2" />
            Active Sessions
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            This is a list of devices that have logged into your account. Revoke any sessions you don't recognize.
          </p>
          <div className="space-y-4">
            {mockSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{session.device} {session.isCurrent && <span className="text-xs text-green-500 font-semibold ml-2">CURRENT</span>}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.location} &middot; {session.last_active}
                  </p>
                </div>
                {!session.isCurrent && (
                  <button className="text-sm text-red-500 hover:underline">Log out</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
