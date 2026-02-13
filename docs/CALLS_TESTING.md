# Calls Feature — Testing Guide

This guide explains how to test the voice and video calling functionality in Krishna Connect.

## Prerequisites

### 1. Run SQL Migrations

Execute the following SQL files **in order** in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

| Order | File | Purpose |
|-------|------|---------|
| 1 | `supabase/Calls/01_calls_schema.sql` | Creates `calls` and `call_signals` tables, enums, and indexes |
| 2 | `supabase/Calls/02_calls_rls.sql` | Sets up Row Level Security policies |
| 3 | `supabase/Calls/03_calls_functions.sql` | Creates helper functions and triggers |
| 4 | `supabase/Calls/04_call_notifications.sql` | Sets up notification triggers for incoming calls |
| 5 | `supabase/Calls/05_fix_rpc_functions.sql` | **Important**: Fixes function signatures and reloads PostgREST schema cache |

> **⚠️ File 05 is critical!** After running all SQL files, always run `05_fix_rpc_functions.sql` last. This drops and recreates functions cleanly and sends a `NOTIFY pgrst, 'reload schema'` to refresh the PostgREST schema cache. Without it, you'll get `PGRST202` errors.

### 2. Verify Functions Exist

After running all SQL files, verify the functions were created by running this in the SQL Editor:

```sql
-- Check that all call functions exist
SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('check_user_busy', 'get_call_history', 'cleanup_stale_calls', 'update_call_duration');
```

You should see all 4 functions listed. If `check_user_busy` is missing, re-run `05_fix_rpc_functions.sql`.

### 3. Verify Schema Cache

If you still get `PGRST202` errors after running the SQL, manually reload the PostgREST schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

Or restart your Supabase project from the Dashboard (Settings → General → Restart Project).

### 4. Browser Requirements

- **Chrome, Firefox, Edge, or Safari** (latest versions)
- **HTTPS required** — WebRTC and `getUserMedia` only work over HTTPS (or localhost)
- **Camera & microphone permissions** — The browser will prompt for these on first call

## Testing Calls

### Setup: Two Browser Windows

You need **two different browser sessions** (two different users logged in):

1. **Window A**: Log in as User A (e.g., in Chrome)
2. **Window B**: Log in as User B (e.g., in Chrome Incognito, or Firefox)

### Test 1: Voice Call

1. **User A**: Open a chat with User B
2. **User A**: Click the **phone icon** (🔊) in the chat header
3. **User A**: Should see "Calling..." UI with ringing status
4. **User B**: Should see an **incoming call dialog** with Accept/Decline buttons
5. **User B**: Click **Accept**
6. **Both**: Should hear each other's audio
7. **Either**: Click the **red end call button** to hang up

### Test 2: Video Call

1. **User A**: Open a chat with User B
2. **User A**: Click the **video icon** (📹) in the chat header
3. **User A**: Grant camera permission when prompted
4. **User B**: Accept the incoming call
5. **Both**: Should see each other's video and hear audio
6. **Test video toggle**: Click the camera icon to turn video on/off
7. **Test audio mute**: Click the microphone icon to mute/unmute
8. **End call**: Click the red end call button

### Test 3: Screen Sharing

1. Start a video call (steps above)
2. **Either user**: Click the **screen share icon** in call controls
3. Select a screen/window/tab to share
4. **Other user**: Should see the shared screen
5. Click screen share icon again to stop sharing

### Test 4: Call Decline

1. **User A**: Call User B
2. **User B**: Click **Decline** on the incoming call dialog
3. **User A**: Should see "Call Declined" toast notification

### Test 5: Missed Call

1. **User A**: Call User B
2. **User B**: Do nothing (don't answer)
3. After ~45 seconds, the call should automatically be marked as "missed"
4. **User A**: Should see "No Answer" toast notification

### Test 6: Busy Signal

1. **User A** and **User C**: Start an active call
2. **User B**: Try to call User A
3. **User A**: Should automatically send a "busy" signal
4. **User B**: Should see "User Busy" toast notification

### Test 7: Call History

1. After making some calls, navigate to the **Calls** page (sidebar → Calls)
2. Should see a list of all calls with:
   - Caller/callee name and avatar
   - Call type (voice/video) badge
   - Status icon (outgoing, incoming, missed, declined)
   - Duration (for completed calls)
   - Timestamp
3. Click the phone/video icon next to any call to call that person back

## Troubleshooting

### PGRST202: Function not found

```
Could not find the function public.check_user_busy(p_user_id) in the schema cache
```

**Fix**: Run `supabase/Calls/05_fix_rpc_functions.sql` in the SQL Editor. This drops and recreates all RPC functions and reloads the PostgREST schema cache.

### No audio/video

- Check browser permissions (click the lock icon in the address bar)
- Ensure you're on HTTPS (or localhost)
- Try refreshing the page
- Check if another app is using your camera/microphone

### Call not connecting (ICE failure)

- Both users must have internet access
- If behind a strict firewall/VPN, WebRTC may be blocked
- The app uses Google STUN servers for NAT traversal — if these are blocked, calls won't connect
- For production, consider adding TURN servers for reliability

### Incoming call not showing

- Ensure Supabase Realtime is enabled for the `calls` and `call_signals` tables
- Check the browser console for Realtime subscription errors
- Verify RLS policies allow the callee to see the incoming call row

### Push notifications not working

- Ensure the service worker is registered (check DevTools → Application → Service Workers)
- Grant notification permissions when prompted
- Check that VAPID keys are configured in `.env.local`:
  ```
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
  VAPID_PRIVATE_KEY=your_private_key
  ```

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                      │
│  CallProvider (call-provider.tsx)                     │
│    ├── State: activeCall, incomingCall, callStatus   │
│    ├── startCall() → insert calls row + send offer   │
│    ├── acceptCall() → update status + send answer    │
│    ├── endCall() → update status + send hangup       │
│    └── Realtime listeners for incoming calls/signals │
│                                                      │
│  useWebRTC (use-webrtc.ts)                           │
│    ├── Peer connection lifecycle                     │
│    ├── Media management (audio/video/screen)         │
│    └── ICE candidate exchange                        │
│                                                      │
│  UI Components:                                      │
│    ├── IncomingCallDialog                            │
│    ├── ActiveCallScreen                              │
│    ├── CallControls                                  │
│    └── CallOverlay                                   │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               Supabase (Backend)                     │
│                                                      │
│  Tables:                                             │
│    ├── calls (call records & status)                 │
│    └── call_signals (WebRTC SDP/ICE exchange)        │
│                                                      │
│  Realtime:                                           │
│    ├── calls table → incoming call detection         │
│    └── call_signals table → signaling channel        │
│                                                      │
│  RPC Functions:                                      │
│    ├── check_user_busy(p_user_id TEXT)               │
│    ├── get_call_history(p_user_id TEXT, ...)         │
│    └── cleanup_stale_calls()                         │
└─────────────────────────────────────────────────────┘
```

## Database Schema

See `supabase/Calls/01_calls_schema.sql` for the full schema. Key tables:

- **`calls`**: Stores call records with caller/callee IDs, type (voice/video), status, timestamps
- **`call_signals`**: WebRTC signaling channel — SDP offers/answers and ICE candidates are exchanged through this table via Supabase Realtime
