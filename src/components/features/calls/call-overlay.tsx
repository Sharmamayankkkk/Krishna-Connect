"use client"

import { IncomingCallDialog } from "./incoming-call-dialog"
import { ActiveCallScreen } from "./active-call-screen"
import { useCallContext } from "@/providers/call-provider"

/**
 * Global call overlay - renders incoming call dialog and active call screen.
 * Should be placed at the root of the app layout.
 */
export function CallOverlay() {
  const { activeCall, incomingCall } = useCallContext()

  return (
    <>
      {incomingCall && <IncomingCallDialog />}
      {activeCall && <ActiveCallScreen />}
    </>
  )
}
