"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Free STUN servers for NAT traversal
// Multiple servers for cross-browser compatibility (Safari, Firefox, Edge)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  // bundlePolicy improves connectivity in Firefox/Safari
  bundlePolicy: "max-bundle",
  iceCandidatePoolSize: 1,
}

export type WebRTCState = {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isAudioMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  connectionState: RTCPeerConnectionState | "new"
}

export function useWebRTC() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream>(new MediaStream())

  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isAudioMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    connectionState: "new",
  })

  // Cleanup function
  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }
    remoteStreamRef.current = new MediaStream()
    setState({
      localStream: null,
      remoteStream: null,
      isAudioMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      connectionState: "new",
    })
  }, [])

  // Initialize local media stream
  const initializeMedia = useCallback(async (video: boolean) => {
    try {
      // Check for getUserMedia support (Safari may use webkit prefix)
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Your browser does not support media devices. Please use a modern browser.")
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

  // Create peer connection
  const createPeerConnection = useCallback(
    (onIceCandidate: (candidate: RTCIceCandidate) => void, onNegotiationNeeded?: () => void) => {
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnectionRef.current = pc

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate)
        }
      }

      // Handle remote stream tracks
      pc.ontrack = (event) => {
        event.streams[0]?.getTracks().forEach((track) => {
          remoteStreamRef.current.addTrack(track)
        })
        setState((prev) => ({ ...prev, remoteStream: remoteStreamRef.current }))
      }

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        setState((prev) => ({
          ...prev,
          connectionState: pc.connectionState,
        }))
      }

      // Handle renegotiation (e.g., when screen share starts)
      if (onNegotiationNeeded) {
        pc.onnegotiationneeded = onNegotiationNeeded
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

  // Create SDP offer
  const createOffer = useCallback(async () => {
    const pc = peerConnectionRef.current
    if (!pc) throw new Error("No peer connection")
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    return offer
  }, [])

  // Create SDP answer
  const createAnswer = useCallback(async () => {
    const pc = peerConnectionRef.current
    if (!pc) throw new Error("No peer connection")
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return answer
  }, [])

  // Set remote description (offer or answer)
  // Note: Pass plain object instead of new RTCSessionDescription() for Safari/Firefox compat
  const setRemoteDescription = useCallback(async (description: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current
    if (!pc) throw new Error("No peer connection")
    await pc.setRemoteDescription(description)
  }, [])

  // Add ICE candidate from remote peer
  // Note: Pass plain object instead of new RTCIceCandidate() for Safari/Firefox compat
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current
    if (!pc) return
    try {
      await pc.addIceCandidate(candidate)
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
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

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current
    if (!pc) return

    if (state.isScreenSharing && screenStreamRef.current) {
      // Stop screen share and revert to camera
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null

      const videoTrack = localStreamRef.current?.getVideoTracks()[0]
      if (videoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video")
        if (sender) {
          await sender.replaceTrack(videoTrack)
        }
      }
      setState((prev) => ({ ...prev, isScreenSharing: false }))
    } else {
      // Start screen share
      try {
        // Check for getDisplayMedia support — not available on older Safari/Firefox mobile
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error("Screen sharing is not supported in this browser.")
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
        screenStreamRef.current = screenStream

        const screenTrack = screenStream.getVideoTracks()[0]
        const sender = pc.getSenders().find((s) => s.track?.kind === "video")
        if (sender) {
          await sender.replaceTrack(screenTrack)
        }

        // Listen for when user stops screen share via browser UI
        screenTrack.onended = () => {
          const camTrack = localStreamRef.current?.getVideoTracks()[0]
          if (camTrack && sender) {
            sender.replaceTrack(camTrack)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    state,
    initializeMedia,
    createPeerConnection,
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
