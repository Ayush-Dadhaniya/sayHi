"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Globe, Smile, Paperclip, Image } from "lucide-react"

export default function ChatInterface({ currentUser, chatPartner, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef(null)

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
          const originalText = msg.message || msg.text || "No message content"
          
          // For messages from others, convert to current user's language
          let convertedText = originalText
          if (!isFromMe) {
            try {
              const converted = await convertToLanguage(originalText, currentUser.language)
              if (converted && !converted.includes("PLEASE SELECT") && !converted.includes("ERROR")) {
                convertedText = converted
              }
            } catch (error) {
              console.error("Failed to convert message:", error)
              convertedText = originalText
            }
          }

          const mappedMsg = {
            ...msg,
            isFromMe,
            sender: isFromMe ? currentUser : chatPartner,
            // Fix timestamp handling
            timestamp: msg.createdAt ? new Date(msg.createdAt.$date?.$numberLong || msg.createdAt) : new Date(),
            // Handle converted message
            convertedText: convertedText,
            // Ensure text field exists
            text: originalText
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

    // Create optimistic message
    const optimisticMessage = {
      id: Date.now().toString(),
      text: messageText, // Show original text to sender
      convertedText: convertedText, // Store converted text for partner
      timestamp: new Date(),
      isFromMe: true,
      isConverted,
      sender: currentUser,
    }

    setMessages((prev) => [...prev, optimisticMessage])

    // Send real message
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
          message: messageText,
          convertedMessage: convertedText,
          toLanguage: chatPartner.language
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticMessage.id))
    } finally {
    setIsTranslating(false)
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
        
        // Add optimistic message
        const optimisticMessage = {
          id: Date.now().toString(),
          text: "📷 Shared an image",
          mediaUrl: dataUrl,
          mediaType: "image",
      timestamp: new Date(),
          isFromMe: true,
          sender: currentUser,
        }
        
        setMessages((prev) => [...prev, optimisticMessage])
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
        
        // Add optimistic message
        const optimisticMessage = {
          id: Date.now().toString(),
          text: `📎 Shared a document: ${file.name}`,
          mediaUrl: dataUrl,
          mediaType: "document",
          timestamp: new Date(),
          isFromMe: true,
          sender: currentUser,
        }
        
        setMessages((prev) => [...prev, optimisticMessage])
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
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-2 bg-white shadow-sm border-b flex-shrink-0">
        <Avatar className="h-7 w-7 border-2 border-white shadow-md">
          <AvatarImage src={chatPartner.avatar || "/placeholder.svg"} alt={chatPartner.name} />
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xs">
            {chatPartner.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{chatPartner.name}</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <p className="text-xs text-gray-500 truncate">@{chatPartner.username}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs flex-shrink-0">
          <Globe className="h-3 w-3 mr-1" />
          {chatPartner.language}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Start a conversation!</h3>
            <p className="text-gray-600 text-xs max-w-xs mx-auto">
              Send a message to {chatPartner.name} and start connecting. 
              Messages will be automatically translated between {currentUser.language} and {chatPartner.language}.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isFromMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end gap-1 max-w-[80%] ${message.isFromMe ? "flex-row-reverse" : ""}`}>
                {!message.isFromMe && (
                  <Avatar className="h-4 w-4 mb-1 flex-shrink-0">
                    <AvatarImage src={message.sender.avatar || "/placeholder.svg"} alt={message.sender.name} />
                    <AvatarFallback className="text-xs">{message.sender.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`px-2 py-1 rounded-2xl shadow-sm ${
                    message.isFromMe
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-white text-gray-900 rounded-bl-md border"
                  }`}
                >
                  {message.mediaUrl ? (
                    <div className="space-y-1">
                      {message.mediaType?.startsWith('image/') ? (
                        <img 
                          src={message.mediaUrl} 
                          alt="Shared image" 
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.mediaUrl, '_blank')}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
                             onClick={() => {
                               // Extract filename from message text
                               const filename = message.text?.match(/📎 Shared a document: (.+)/)?.[1] || 'document'
                               handleDocumentDownload(message.mediaUrl, filename)
                             }}>
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-700">
                            {message.text?.match(/📎 Shared a document: (.+)/)?.[1] || "Shared document"}
                          </span>
                        </div>
                      )}
                      <p className="text-xs leading-relaxed break-words">
                        {message.isFromMe ? (message.text || message.message) : (message.convertedText || message.text || message.message)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed break-words">
                      {message.isFromMe ? (message.text || message.message) : (message.convertedText || message.text || message.message)}
                    </p>
                  )}
                  {message.isTranslated && !message.isFromMe && (
                    <p className="text-xs opacity-75 mt-1 italic">
                      Translated from {message.fromLanguage}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${message.isFromMe ? "text-blue-100" : "text-gray-400"}`}>
                    {(() => {
                      try {
                        const date = new Date(message.timestamp)
                        if (isNaN(date.getTime())) {
                          return "Just now"
                        }
                        return date.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      } catch (error) {
                        return "Just now"
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        {isTranslating && (
          <div className="flex justify-start">
            <div className="flex items-end gap-1">
              <Avatar className="h-4 w-4 mb-1">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback className="text-xs">{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 px-2 py-1 rounded-2xl rounded-bl-md">
              <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 bg-white border-t shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
                      <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
              placeholder={`Type a message in ${currentUser.language}...`}
              disabled={isTranslating || uploadingImage || uploadingDocument}
              className="pr-20 py-1 rounded-full border-2 focus:border-gray-300 focus:ring-0 text-xs h-8"
            />
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex gap-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file)
                  }
                  // Reset the input so the same file can be selected again
                  e.target.value = ''
                }}
                className="hidden"
                id="image-upload-input"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100"
                disabled={uploadingImage || uploadingDocument}
                title="Upload image"
                onClick={() => document.getElementById('image-upload-input').click()}
              >
                <Image className="h-3 w-3 text-gray-400" />
              </Button>
              
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={uploadingImage || uploadingDocument}
                  title="Add emoji"
                >
                  <Smile className="h-3 w-3 text-gray-400" />
                </Button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-8 right-0 bg-white border rounded-lg shadow-lg p-1 z-10 max-h-32 overflow-y-auto emoji-picker w-48">
                    <div className="grid grid-cols-6 gap-0.5">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className="w-7 h-7 text-xs hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleDocumentUpload(file)
                  }
                  // Reset the input so the same file can be selected again
                  e.target.value = ''
                }}
                className="hidden"
                id="document-upload-input"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-100"
                disabled={uploadingImage || uploadingDocument}
                title="Upload document"
                onClick={() => document.getElementById('document-upload-input').click()}
              >
                <Paperclip className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={isTranslating || uploadingImage || uploadingDocument || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 rounded-full p-1 h-8 w-8 shadow-md flex-shrink-0"
          >
            {isTranslating || uploadingImage || uploadingDocument ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          Messages are automatically translated between {currentUser.language} and {chatPartner.language}
        </div>
      </div>
    </div>
  )
}
