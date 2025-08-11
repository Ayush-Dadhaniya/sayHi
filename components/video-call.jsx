
"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Settings,
  Volume2,
  VolumeX,
  ArrowLeft
} from "lucide-react"

export default function VideoCall({ currentUser, chatPartner, onEndCall }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [callStatus, setCallStatus] = useState("connecting") // connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [peerConnection, setPeerConnection] = useState(null)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    initializeWebRTC()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    let interval
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      })

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream)
      })

      // Handle remote stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        setRemoteStream(remoteStream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setCallStatus("connected")
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to remote peer via signaling server
          sendSignalingMessage('ice-candidate', event.candidate)
        }
      }

      setPeerConnection(pc)

      // Simulate connection for demo
      setTimeout(() => {
        if (!remoteStream) {
          setCallStatus("connected")
        }
      }, 3000)

    } catch (error) {
      console.error("Error initializing WebRTC:", error)
      alert("Could not access camera/microphone. Please check permissions.")
    }
  }

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
  }

  const sendSignalingMessage = async (type, data) => {
    // In a real app, this would send to your signaling server
    try {
      await fetch('/api/webrtc-signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          from: currentUser.id,
          to: chatPartner.id
        })
      })
    } catch (error) {
      console.error("Signaling error:", error)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    cleanup()
    setCallStatus("ended")
    onEndCall()
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled
        setIsVideoEnabled(!isVideoEnabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled
        setIsAudioEnabled(!isAudioEnabled)
      }
    }
  }

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerEnabled
      setIsSpeakerEnabled(!isSpeakerEnabled)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-6xl max-h-4xl relative">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEndCall}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center text-white">
            <h3 className="font-semibold">{chatPartner.name}</h3>
            <p className="text-sm opacity-75">
              {callStatus === "connecting" ? "Connecting..." : 
               callStatus === "connected" ? formatDuration(callDuration) : "Call ended"}
            </p>
          </div>
          
          <div className="w-20"></div>
        </div>

        {/* Main Video Area */}
        <div className="relative w-full h-full">
          {/* Remote Video (Full Screen) */}
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            {callStatus === "connected" && remoteStream ? (
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
            ) : (
              <div className="text-center text-white">
                <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-white/20">
                  <AvatarImage src={chatPartner.avatar || "/placeholder.svg"} alt={chatPartner.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-4xl">
                    {chatPartner.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-semibold mb-2">{chatPartner.name}</h3>
                <p className="text-lg opacity-75">
                  {callStatus === "connecting" ? "Connecting..." : "Waiting for video..."}
                </p>
              </div>
            )}
          </div>

          {/* Local Video (Picture in Picture) */}
          <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            {isVideoEnabled && localStream ? (
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleAudio}
              className={`rounded-full w-14 h-14 ${
                isAudioEnabled 
                  ? "bg-white/20 hover:bg-white/30 text-white" 
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={toggleVideo}
              className={`rounded-full w-14 h-14 ${
                isVideoEnabled 
                  ? "bg-white/20 hover:bg-white/30 text-white" 
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 text-white"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={toggleSpeaker}
              className={`rounded-full w-14 h-14 ${
                isSpeakerEnabled 
                  ? "bg-white/20 hover:bg-white/30 text-white" 
                  : "bg-gray-500 hover:bg-gray-600 text-white"
              }`}
            >
              {isSpeakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
