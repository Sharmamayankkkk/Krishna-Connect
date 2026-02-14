/**
 * Extract a thumbnail frame from a video URL.
 * Returns a data URL of the captured frame.
 * Uses a random time position to get a representative frame.
 * Compatible with Chrome, Firefox, Safari, and Edge.
 */
export function extractVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.muted = true
    video.preload = "auto" // Safari needs 'auto' instead of 'metadata' for seeking
    video.playsInline = true // Required for iOS Safari
    // @ts-ignore — webkit-playsinline is for older iOS Safari
    video.setAttribute("webkit-playsinline", "true")

    let resolved = false
    const cleanup = () => {
      video.removeAttribute("src")
      video.load()
    }

    const captureFrame = () => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 320
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          cleanup()
          reject(new Error("Could not get canvas context"))
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
        cleanup()
        resolve(dataUrl)
      } catch (err) {
        cleanup()
        reject(err)
      }
    }

    // Use both 'seeked' and 'canplay' events for cross-browser support
    // Safari sometimes fires 'canplay' but not 'seeked' reliably
    video.onseeked = captureFrame

    video.onloadedmetadata = () => {
      // Seek to a random frame between 10% and 50% of the duration
      const duration = video.duration
      if (!duration || !isFinite(duration) || duration <= 0) {
        // Some browsers (Firefox) may report Infinity for streaming videos
        // Try capturing at 0.1s as fallback
        video.currentTime = 0.1
        return
      }
      const seekTime = duration * (0.1 + Math.random() * 0.4)
      video.currentTime = seekTime
    }

    // Fallback: if 'seeked' doesn't fire but we have video data
    video.oncanplaythrough = () => {
      if (!resolved && video.videoWidth > 0) {
        // Give seeked event a chance first
        setTimeout(() => {
          if (!resolved) captureFrame()
        }, 500)
      }
    }

    video.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      if (!resolved) {
        resolved = true
        reject(new Error("Failed to load video"))
      }
    }

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      if (!resolved) {
        // Last resort: try to capture whatever frame we have
        if (video.videoWidth > 0 && video.readyState >= 2) {
          captureFrame()
        } else {
          resolved = true
          cleanup()
          reject(new Error("Video thumbnail extraction timed out"))
        }
      }
    }, 10000)

    video.src = videoUrl
  })
}
