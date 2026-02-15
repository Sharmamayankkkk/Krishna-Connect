"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Free STUN servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  bundlePolicy: "max-bundle",
  iceCandidatePoolSize: 1,
}

export type WebRTCState = {
  localStream: MediaStream | null
  remoteStream: MediaStream | null // Deprecated: Use remoteStreams for reliability
  remoteStreams: Map<string, MediaStream> // Keyed by userId
  isAudioMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  connectionState: RTCPeerConnectionState | "new"
}

export function useWebRTC() {
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())

  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    remoteStreams: new Map(),
    isAudioMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    connectionState: "new",
  })

  // Cleanup function (closes all connections)
  const cleanup = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close())
    peerConnectionsRef.current.clear()

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }
    remoteStreamsRef.current.clear()
    pendingCandidatesRef.current.clear()

    setState({
      localStream: null,
      remoteStream: null,
      remoteStreams: new Map(),
      isAudioMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      connectionState: "new",
    })
  }, [])

  // Initialize local media stream
  const initializeMedia = useCallback(async (video: boolean) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser does not support media devices.")
      }
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video
          ? {
            facingMode: "user",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
          }
          : false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      setState((prev) => ({ ...prev, localStream: stream }))
      return stream
    } catch (error) {
      console.error("Failed to get media devices:", error)
      throw error
    }
  }, [])

  // Create peer connection for a specific user
  const createPeerConnection = useCallback(
    (userId: string, onIceCandidate: (candidate: RTCIceCandidate) => void) => {
      // Close existing connection if any
      if (peerConnectionsRef.current.has(userId)) {
        peerConnectionsRef.current.get(userId)?.close()
        peerConnectionsRef.current.delete(userId)
      }

      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionsRef.current.set(userId, pc)
      pendingCandidatesRef.current.set(userId, [])

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate)
        }
      }

      // Handle remote stream tracks
      pc.ontrack = (event) => {
        const stream = remoteStreamsRef.current.get(userId) || new MediaStream()
        event.streams[0]?.getTracks().forEach((track) => {
          stream.addTrack(track)
        })
        remoteStreamsRef.current.set(userId, stream)

        // Update state
        setState((prev) => {
          const newMap = new Map(remoteStreamsRef.current)
          return {
            ...prev,
            remoteStreams: newMap,
            remoteStream: newMap.values().next().value || null // Backward compatibility
          }
        })
      }

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${userId}: ${pc.connectionState}`)
        // Update global state if needed, primarily for debugging single P2P
        if (peerConnectionsRef.current.size === 1) {
          setState((prev) => ({
            ...prev,
            connectionState: pc.connectionState
          }))
        }
      }

      // Add local tracks to the connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      return pc
    },
    []
  )

  const removePeer = useCallback((userId: string) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (pc) {
      pc.close()
      peerConnectionsRef.current.delete(userId)
    }
    remoteStreamsRef.current.delete(userId)
    pendingCandidatesRef.current.delete(userId)

    setState((prev) => {
      const newMap = new Map(remoteStreamsRef.current)
      return {
        ...prev,
        remoteStreams: newMap,
        remoteStream: newMap.values().next().value || null
      }
    })
  }, [])

  // Create SDP offer for a specific user
  const createOffer = useCallback(async (userId: string) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (!pc) throw new Error(`No peer connection found for ${userId}`)

    if (pc.signalingState !== "stable") {
      console.warn(`Skipping offer creation for ${userId} — signaling not stable:`, pc.signalingState)
      return null
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    return offer
  }, [])

  // Create SDP answer for a specific user
  const createAnswer = useCallback(async (userId: string) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (!pc) throw new Error(`No peer connection found for ${userId}`)

    if (pc.signalingState !== "have-remote-offer") {
      console.warn(`Skipping answer creation for ${userId} — signaling state:`, pc.signalingState);
      return null;
    }

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return answer
  }, [])

  // Set remote description for a specific user
  const setRemoteDescription = useCallback(async (userId: string, description: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (!pc) throw new Error(`No peer connection found for ${userId}`)

    if (
      description.type === "answer" &&
      pc.signalingState === "stable"
    ) {
      console.warn(`Skipping remote answer for ${userId} — already stable`)
      return
    }

    await pc.setRemoteDescription(description)

    // Flush ICE Queue for this user
    const pending = pendingCandidatesRef.current.get(userId) || []
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate)
      } catch (err) {
        console.error(`Error adding queued ICE candidate for ${userId}:`, err)
      }
    }
    pendingCandidatesRef.current.set(userId, [])
  }, [])

  // Add ICE candidate for a specific user
  const addIceCandidate = useCallback(async (userId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(userId)
    if (!pc) return

    // Queue if remote description not set
    if (!pc.remoteDescription) {
      const pending = pendingCandidatesRef.current.get(userId) || []
      pending.push(candidate)
      pendingCandidatesRef.current.set(userId, pending)
      return
    }

    try {
      await pc.addIceCandidate(candidate)
    } catch (error) {
      console.error(`Error adding ICE candidate for ${userId}:`, error)
    }
  }, [])

  // Toggle audio mute
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setState((prev) => ({ ...prev, isAudioMuted: !audioTrack.enabled }))
      }
    }
  }, [])

  // Toggle video on/off
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setState((prev) => ({ ...prev, isVideoOff: !videoTrack.enabled }))
      }
    }
  }, [])

  // Toggle screen sharing (replaces video track for ALL peers)
  const toggleScreenShare = useCallback(async () => {
    // Logic needs to iterate over all peer connections and replace senders
    const connections = Array.from(peerConnectionsRef.current.values())

    if (state.isScreenSharing && screenStreamRef.current) {
      // Stop screen share
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null

      const videoTrack = localStreamRef.current?.getVideoTracks()[0]
      if (videoTrack) {
        for (const pc of connections) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video")
          if (sender) await sender.replaceTrack(videoTrack)
        }
      }
      setState((prev) => ({ ...prev, isScreenSharing: false }))
    } else {
      // Start screen share
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error("Screen sharing not supported.")
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
        screenStreamRef.current = screenStream

        const screenTrack = screenStream.getVideoTracks()[0]

        for (const pc of connections) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video")
          if (sender) await sender.replaceTrack(screenTrack)
        }

        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0]
          if (camTrack) {
            for (const pc of Array.from(peerConnectionsRef.current.values())) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video")
              if (sender) sender.replaceTrack(camTrack)
            }
          }
          screenStreamRef.current = null
          setState((prev) => ({ ...prev, isScreenSharing: false }))
        }

        setState((prev) => ({ ...prev, isScreenSharing: true }))
      } catch (error) {
        console.error("Screen share failed:", error)
      }
    }
  }, [state.isScreenSharing])

  // No automatic renegotiation handler needed as per previous fix

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    initializeMedia,
    createPeerConnection,
    removePeer,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    cleanup,
  }
}
