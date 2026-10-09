import { useEffect, useRef, useState } from 'react'
import { SRGBColorSpace, VideoTexture } from 'three'

export default function useCameraMirror() {
  const [texture, setTexture] = useState<VideoTexture | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const resource = useRef<{ video: HTMLVideoElement; texture: VideoTexture; stream: MediaStream } | null>(null)
  const request = useRef(0)

  const dispose = () => {
    const current = resource.current
    if (!current) return
    current.stream.getTracks().forEach((track) => track.stop())
    current.video.pause()
    current.video.srcObject = null
    current.texture.dispose()
    resource.current = null
  }

  useEffect(() => () => {
    request.current += 1
    const current = resource.current
    if (current) {
      current.stream.getTracks().forEach((track) => track.stop())
      current.video.pause()
      current.video.srcObject = null
      current.texture.dispose()
      resource.current = null
    }
  }, [])

  async function enable() {
    if (pending || resource.current) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera mirror needs HTTPS or localhost.')
      return
    }
    const id = ++request.current
    setPending(true)
    setError('')
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      if (id !== request.current) { stream.getTracks().forEach((track) => track.stop()); return }
      const video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      video.srcObject = stream
      await video.play()
      if (id !== request.current) { stream.getTracks().forEach((track) => track.stop()); video.srcObject = null; return }
      const mirror = new VideoTexture(video)
      mirror.colorSpace = SRGBColorSpace
      mirror.repeat.x = -1
      mirror.offset.x = 1
      resource.current = { video, texture: mirror, stream }
      setTexture(mirror)
    } catch (cause) {
      stream?.getTracks().forEach((track) => track.stop())
      if (id !== request.current) return
      const name = cause instanceof DOMException ? cause.name : ''
      setError(name === 'NotAllowedError' ? 'Camera access was declined. Chrome reflections are still active.' :
        name === 'NotFoundError' ? 'No camera was found on this device.' : 'Could not start the camera. Try again.')
    } finally {
      if (id === request.current) setPending(false)
    }
  }

  function disable() {
    request.current += 1
    dispose()
    setTexture(null)
    setPending(false)
    setError('')
  }

  return { texture, pending, error, enable, disable }
}
