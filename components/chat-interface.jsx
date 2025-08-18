"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { io } from "socket.io-client"
import { ArrowLeft, Send, Globe, Smile, Paperclip, Image, Video } from "lucide-react"
import {
  generateAndStoreKeyPair,
  getPublicKey,
  encryptMessage,
  decryptMessage,
  importPublicKey,
  generateAndExportSymmKey,
  importSymmKey,
  encryptSymmKey,
  decryptSymmKey,
} from "@/lib/crypto"

export default function ChatInterface({ currentUser, chatPartner, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [sharedKey, setSharedKey] = useState(null)
  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    socketRef.current = io()

    socketRef.current.emit("add-user", currentUser.id)

    socketRef.current.on("new-message", async (message) => {
      if (sharedKey) {
        const decryptedMessage = await decryptMessage(
          message.message,
          sharedKey,
          message.iv
        )
        setMessages((prevMessages) => [
          ...prevMessages,
          { ...message, message: decryptedMessage },
        ])
      }
    })

    socketRef.current.on("exchange-key", async ({ from, key }) => {
      if (from === chatPartner.id) {
        const decryptedKey = await decryptSymmKey(key)
        setSharedKey(decryptedKey)
      }
    })

    const initiateKeyExchange = async () => {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `/api/keys?userId=${chatPartner.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const { publicKey } = await response.json()
      if (publicKey) {
        const partnerPubKey = await importPublicKey(publicKey)
        const { key, jwk } = await generateAndExportSymmKey()
        setSharedKey(key)
        const encryptedKey = await encryptSymmKey(key, partnerPubKey)
        socketRef.current.emit("exchange-key", {
          to: chatPartner.id,
          from: currentUser.id,
          key: encryptedKey,
        })
      }
    }

    if (currentUser.id < chatPartner.id) {
      initiateKeyExchange()
    }

    return () => {
      socketRef.current.disconnect()
    }
  }, [currentUser.id, chatPartner.id, sharedKey])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker')) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Load existing messages
  useEffect(() => {
    fetchMessages()
  }, [chatPartner])

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/messages?chatPartnerId=${chatPartner.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.messages) {
        const processedMessages = await Promise.all(data.messages.map(async (msg) => {
          const isFromMe = msg.fromUserId === currentUser.id
          let decryptedText = ""
          if (sharedKey && msg.message) {
            decryptedText = await decryptMessage(msg.message, sharedKey, msg.iv)
          } else {
            decryptedText = msg.message || msg.text || "No message content"
          }

          const mappedMsg = {
            ...msg,
            isFromMe,
            sender: isFromMe ? currentUser : chatPartner,
            timestamp: msg.createdAt ? new Date(msg.createdAt.$date?.$numberLong || msg.createdAt) : new Date(),
            text: decryptedText
          }
          return mappedMsg
        }))
        
        setMessages(processedMessages)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const convertToLanguage = async (text, targetLang) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          targetLanguage: targetLang,
          action: "convert",
        }),
      })
      const data = await response.json()
      return data.convertedText || text
    } catch (error) {
      console.error("Language conversion failed:", error)
      return text
    }
  }

  const detectLanguage = async (text) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          action: "detect",
        }),
      })
      const data = await response.json()
      return data.detectedLanguage || currentUser.language
    } catch (error) {
      console.error("Language detection failed:", error)
      return currentUser.language
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    setIsTranslating(true)
    const messageText = input.trim()
    setInput("")

    // Convert text to receiver's language
    let convertedText = messageText
    let isConverted = false

    // Convert to receiver's language
    try {
      const converted = await convertToLanguage(messageText, chatPartner.language)
      if (converted && !converted.includes("PLEASE SELECT") && !converted.includes("ERROR")) {
        convertedText = converted
        isConverted = true
      } else {
        convertedText = messageText
        isConverted = false
      }
    } catch (error) {
      console.error("Language conversion failed:", error)
      convertedText = messageText
      isConverted = false
    }

    if (sharedKey) {
      const { ciphertext, iv } = await encryptMessage(messageText, sharedKey)
      const messagePayload = {
        fromUserId: currentUser.id,
        toUserId: chatPartner.id,
        message: ciphertext,
        iv: iv,
        timestamp: new Date(),
      }
      socketRef.current.emit("send-message", messagePayload)
    }

    // Also send to API to store in DB
    if (sharedKey) {
      const { ciphertext, iv } = await encryptMessage(messageText, sharedKey);
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            toUserId: chatPartner.id,
            message: ciphertext,
            iv: iv,
            toLanguage: chatPartner.language
          })
        })
        
        if (!response.ok) {
          throw new Error("Failed to send message")
        }
      } catch (error) {
        console.error("Failed to send message:", error)
      } finally {
        setIsTranslating(false)
      }
    }
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    
    setUploadingImage(true)
    
    try {
      // Convert file to data URL for local storage
      const reader = new FileReader()
      reader.onload = async (event) => {
        const dataUrl = event.target.result
        
        const token = localStorage.getItem("token")
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            toUserId: chatPartner.id,
            message: "📷 Shared an image",
            mediaUrl: dataUrl,
            mediaType: "image",
            fromLanguage: currentUser.language,
            toLanguage: chatPartner.language
          })
        })
        
        if (!response.ok) {
          throw new Error("Failed to send image")
        }
        
        const messagePayload = {
          fromUserId: currentUser.id,
          toUserId: chatPartner.id,
          message: "📷 Shared an image",
          mediaUrl: dataUrl,
          mediaType: "image",
          timestamp: new Date(),
        }
        socketRef.current.emit("send-message", messagePayload)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error("Failed to send image:", error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDocumentUpload = async (file) => {
    if (!file) return
    
    setUploadingDocument(true)
    
    try {
      // Convert file to data URL for local storage
      const reader = new FileReader()
      reader.onload = async (event) => {
        const dataUrl = event.target.result
        
        const token = localStorage.getItem("token")
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            toUserId: chatPartner.id,
            message: `📎 Shared a document: ${file.name}`,
            mediaUrl: dataUrl,
            mediaType: "document",
            fromLanguage: currentUser.language,
            toLanguage: chatPartner.language
          })
        })
        
        if (!response.ok) {
          throw new Error("Failed to send document")
        }
        
        const messagePayload = {
          fromUserId: currentUser.id,
          toUserId: chatPartner.id,
          message: `📎 Shared a document: ${file.name}`,
          mediaUrl: dataUrl,
          mediaType: "document",
          timestamp: new Date(),
        }
        socketRef.current.emit("send-message", messagePayload)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error("Failed to send document:", error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleDocumentDownload = (dataUrl, filename) => {
    try {
      // Convert data URL to blob
      const response = fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          // Create blob URL
          const blobUrl = window.URL.createObjectURL(blob)
          
          // Create download link
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = filename
          
          // Trigger download
          document.body.appendChild(link)
          link.click()
          
          // Cleanup
          document.body.removeChild(link)
          window.URL.revokeObjectURL(blobUrl)
        })
        .catch(error => {
          console.error('Download failed:', error)
          alert('Failed to download document. Please try again.')
        })
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download document. Please try again.')
    }
  }

  const addEmoji = (emoji) => {
    setInput(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const commonEmojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣"
  ]

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStartVideoCall = () => {
    console.log("Starting video call with", chatPartner.name)
    // Placeholder for starting video call
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <main
      data-testid="chat-interface"
      className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50"
    >
      <header className="flex items-center gap-4 p-3 bg-white shadow-md border-b">
        <Button onClick={onBack} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
            <AvatarImage src={chatPartner.avatar || "/placeholder.svg"} alt={chatPartner.name} />
            <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold">
              {chatPartner.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-800 text-base truncate">{chatPartner.name}</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-xs text-gray-500 truncate">Online</p>
            </div>
          </div>
        </div>
        <div className="flex-grow" />
        <Badge
          variant="outline"
          className="bg-indigo-100 text-indigo-700 border-indigo-200 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2"
        >
          <Globe className="h-4 w-4" />
          <span>{chatPartner.language}</span>
        </Badge>
        <Button onClick={handleStartVideoCall} variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-gray-100">
          <Video className="h-5 w-5 text-gray-600" />
        </Button>
      </header>

      <section className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Start Your Global Conversation!</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Send your first message to {chatPartner.name}. All messages will be automatically translated
              between {currentUser.language} and {chatPartner.language}.
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ duration: 0.3 }}
                className={`flex items-end gap-2 max-w-[85%] ${
                  message.isFromMe ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {!message.isFromMe && (
                  <Avatar className="h-6 w-6 mb-1 flex-shrink-0">
                    <AvatarImage src={message.sender.avatar || "/placeholder.svg"} alt={message.sender.name} />
                    <AvatarFallback className="text-xs">{message.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`px-4 py-2 rounded-3xl shadow-md transition-all duration-300 ${
                    message.isFromMe
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-lg"
                      : "bg-white text-gray-800 rounded-bl-lg border border-gray-200"
                  }`}
                >
                  {message.mediaUrl ? (
                    <div className="space-y-2">
                      {message.mediaType?.startsWith("image/") ? (
                        <img
                          src={message.mediaUrl}
                          alt="Shared content"
                          className="max-w-xs rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(message.mediaUrl, "_blank")}
                        />
                      ) : (
                        <div
                          className="flex items-center gap-3 p-3 bg-gray-100 rounded-2xl border cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            const filename = message.text?.match(/📎 Shared a document: (.+)/)?.[1] || "document"
                            handleDocumentDownload(message.mediaUrl, filename)
                          }}
                        >
                          <Paperclip className="h-5 w-5 text-gray-600" />
                          <span className="text-sm text-gray-800 font-medium">
                            {message.text?.match(/📎 Shared a document: (.+)/)?.[1] || "Shared document"}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed break-words">
                        {message.isFromMe
                          ? message.text || message.message
                          : message.convertedText || message.text || message.message}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed break-words">
                      {message.isFromMe
                        ? message.text || message.message
                        : message.convertedText || message.text || message.message}
                    </p>
                  )}
                  {message.isTranslated && !message.isFromMe && (
                    <p className="text-xs opacity-80 mt-2 italic">Translated from {message.fromLanguage}</p>
                  )}
                  <p
                    className={`text-xs mt-1.5 opacity-70 ${
                      message.isFromMe ? "text-indigo-100" : "text-gray-500"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {isTranslating && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <Avatar className="h-6 w-6 mb-1">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback className="text-xs">{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-gray-200 px-4 py-2 rounded-3xl rounded-bl-lg">
                <div className="flex space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      <footer className="p-3 bg-white border-t">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message in ${currentUser.language}...`}
              disabled={isTranslating || uploadingImage || uploadingDocument}
              className="pl-4 pr-28 py-2 rounded-full border-2 border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition-all text-sm h-12"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                  e.target.value = ""
                }}
                className="hidden"
                id="image-upload-input"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-100"
                disabled={uploadingImage || uploadingDocument}
                title="Upload image"
                onClick={() => document.getElementById("image-upload-input").click()}
              >
                <Image className="h-5 w-5 text-gray-500" />
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-gray-100"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={uploadingImage || uploadingDocument}
                  title="Add emoji"
                >
                  <Smile className="h-5 w-5 text-gray-500" />
                </Button>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-12 right-0 bg-white border rounded-2xl shadow-lg p-2 z-10 max-h-48 overflow-y-auto emoji-picker w-64"
                    >
                      <div className="grid grid-cols-8 gap-1">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => addEmoji(emoji)}
                            className="w-8 h-8 text-lg hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleDocumentUpload(file)
                  e.target.value = ""
                }}
                className="hidden"
                id="document-upload-input"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-100"
                disabled={uploadingImage || uploadingDocument}
                title="Upload document"
                onClick={() => document.getElementById("document-upload-input").click()}
              >
                <Paperclip className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={isTranslating || uploadingImage || uploadingDocument || !input.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 rounded-full h-12 w-12 shadow-lg flex-shrink-0 transition-all transform hover:scale-105"
          >
            {isTranslating || uploadingImage || uploadingDocument ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          ✨ Your messages are automatically translated between {currentUser.language} and {chatPartner.language}.
        </p>
      </footer>
    </main>
  )
}
