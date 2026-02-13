/**
 * Extract a thumbnail frame from a video URL.
 * Returns a data URL of the captured frame.
 * Uses a random time position to get a representative frame.
 */
export function extractVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.muted = true
    video.preload = "metadata"

    const cleanup = () => {
      video.removeAttribute("src")
      video.load()
    }

    video.onloadedmetadata = () => {
      // Seek to a random frame between 10% and 50% of the duration
      const duration = video.duration
      if (!duration || duration <= 0) {
        cleanup()
        reject(new Error("Video has no duration"))
        return
      }
      const seekTime = duration * (0.1 + Math.random() * 0.4)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
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

    video.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      reject(new Error("Failed to load video"))
    }

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error("Video thumbnail extraction timed out"))
    }, 10000)

    video.src = videoUrl
  })
}
