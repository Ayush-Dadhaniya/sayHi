"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  UserPlus, 
  MessageCircle, 
  Globe, 
  MapPin, 
  Bell, 
  Settings, 
  Search,
  TrendingUp,
  Heart,
  Star,
  Calendar,
  BookOpen,
  Languages,
  Video,
  Phone,
  Gift,
  Trophy,
  Sparkles,
  X,
  ArrowLeft,
  Paperclip
} from "lucide-react"

import DiscoverUsers from "@/components/discover-users"
import FriendRequests from "@/components/friend-requests"
import FriendsList from "@/components/friends-list"
import VideoCall from "@/components/video-call"
import GiftExchange from "@/components/gift-exchange"
import DatingMode from "@/components/dating-mode"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import React from "react"
import ChatInterface from "@/components/chat-interface"

const LANGUAGES = [
  "English",
  "Gujarati",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Portuguese",
  "Russian",
  "Italian",
  "Korean",
  "Dutch",
  "Swedish",
  "Turkish",
]

const REGIONS = [
  "United States",
  "India",
  "Spain",
  "France",
  "Germany",
  "China",
  "Japan",
  "Brazil",
  "Russia",
  "Italy",
  "South Korea",
  "Netherlands",
  "Sweden",
  "Turkey",
  "United Kingdom",
  "Canada",
  "Australia",
  "Mexico",
]

export default function Dashboard({ currentUser, onStartChat, onLogout }) {
  const [activeView, setActiveView] = useState("discover")
  const [showProfile, setShowProfile] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editProfile, setEditProfile] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [friendsCount, setFriendsCount] = useState(0)
  const [activeChat, setActiveChat] = useState(null)
  const [activeVideoCall, setActiveVideoCall] = useState(null)
  const [showGiftExchange, setShowGiftExchange] = useState(false)
  const [showDatingMode, setShowDatingMode] = useState(false)
  const fileInputRef = React.useRef(null)

  // Handle starting a chat
  const handleStartChat = (chatPartner) => {
    setActiveChat(chatPartner)
  }

  // Handle going back from chat
  const handleBackFromChat = () => {
    setActiveChat(null)
  }

  // Handle video call
  const handleStartVideoCall = (chatPartner) => {
    setActiveVideoCall(chatPartner)
  }

  const handleEndVideoCall = () => {
    setActiveVideoCall(null)
  }

  // Handle gift exchange
  const handleShowGiftExchange = () => {
    setShowGiftExchange(true)
  }

  const handleBackFromGiftExchange = () => {
    setShowGiftExchange(false)
  }

  // Handle dating mode
  const handleShowDatingMode = () => {
    setShowDatingMode(true)
  }

  const handleBackFromDatingMode = () => {
    setShowDatingMode(false)
  }

  // Fetch friends count
  useEffect(() => {
    async function fetchFriendsCount() {
      try {
        const response = await fetch(`/api/users?action=friends&userId=${currentUser.id}`)
        const data = await response.json()
        if (data.friends) {
          setFriendsCount(data.friends.length)
        }
      } catch (error) {
        console.error("Failed to fetch friends count:", error)
      }
    }
    
    if (currentUser?.id) {
      fetchFriendsCount()
    }
  }, [currentUser?.id])

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      setLoadingNotifications(true)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.notifications) setNotifications(data.notifications)
      } catch (e) {
        // Optionally handle error
      } finally {
        setLoadingNotifications(false)
      }
    }
    if (showNotifications) fetchNotifications()
  }, [showNotifications])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const res = await fetch("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
          })
          const data = await res.json()
          if (data.notifications) setNotifications(data.notifications)
        } catch (e) {
          // Silently handle error
        }
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Cleanup old notifications every hour
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          // This will trigger the cleanup in the API
          await fetch("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
          })
        } catch (e) {
          // Silently handle error
        }
      }
    }, 3600000) // 1 hour

    return () => clearInterval(cleanupInterval)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkRead = async (notificationId) => {
    try {
      console.log("Marking notification as read:", notificationId)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      })
      
      console.log("Response status:", response.status)
      
      if (response.ok) {
        console.log("Successfully marked as read")
        // Update local state to mark as read
        setNotifications((prev) => prev.map(n => n._id === notificationId ? { ...n, read: true } : n))
        
        // Refresh notifications to get updated list (this will also clean up old ones)
        const refreshResponse = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const refreshData = await refreshResponse.json()
        if (refreshData.notifications) {
          setNotifications(refreshData.notifications)
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to mark as read:", errorData)
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  // Render video call if active
  if (activeVideoCall) {
    return <VideoCall currentUser={currentUser} chatPartner={activeVideoCall} onEndCall={handleEndVideoCall} />
  }

  // Render gift exchange if active
  if (showGiftExchange) {
    return <GiftExchange currentUser={currentUser} onBack={handleBackFromGiftExchange} />
  }

  // Render dating mode if active
  if (showDatingMode) {
    return <DatingMode currentUser={currentUser} onBack={handleBackFromDatingMode} onStartChat={handleStartChat} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between min-h-[72px]">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="SayHi Logo" 
              className="h-16 rounded-lg object-contain"
              style={{ minHeight: 56, minWidth: 56 }}
            />
            {/* You can add the brand name here if you want, or leave just the logo */}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <Button variant="ghost" size="sm" className="relative" onClick={() => setShowNotifications(v => !v)}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs font-medium text-red-600 bg-white rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b font-semibold">Notifications</div>
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b last:border-b-0 cursor-pointer ${!n.read ? "bg-blue-50" : ""}`}
                        onClick={() => handleMarkRead(n._id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{n.type === "friend_request" ? "Friend Request" : n.type === "message" ? "Message" : "Notification"}</span>
                          <span className="text-xs text-gray-400 ml-auto">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* User Profile */}
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowProfile(true)}
                className="p-0 h-auto"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-gray-500">@{currentUser.username}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-gray-500 hover:text-red-600"
                title="Logout"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* User Stats Card */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Friends</span>
                  <Badge variant="secondary">{friendsCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Languages</span>
                  <Badge variant="outline">{currentUser.language}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Region</span>
                  <Badge variant="outline">{currentUser.region}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setActiveView("discover")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleShowGiftExchange}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Gift Exchange
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={handleShowDatingMode}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Dating Mode
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Languages className="h-4 w-4 mr-2" />
                  Language Exchange
                </Button>
              </CardContent>
            </Card>

            {/* New Features */}
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  New Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => activeChat && handleStartVideoCall(activeChat)}
                  disabled={!activeChat}
                >
                  <Video className="h-4 w-4 mr-2" />
                  <span>Video Calls</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleShowGiftExchange}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  <span>Gift Exchange</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleShowDatingMode}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Dating Mode</span>
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Trophy className="h-4 w-4" />
                  <span>Achievements (Coming Soon)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Welcome back, {currentUser.name}! 👋</CardTitle>
                    <p className="text-gray-600 mt-1">Discover new friends and start conversations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                  {!activeChat && (
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-none">
                      <TabsTrigger 
                        value="discover" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Discover
                      </TabsTrigger>
                      <TabsTrigger 
                        value="requests" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Requests
                      </TabsTrigger>
                      <TabsTrigger 
                        value="friends" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Friends
                      </TabsTrigger>
                    </TabsList>
                  )}

                  <div className="p-6">
                    {activeChat ? (
                      <div className="h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleBackFromChat}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Friends
                          </Button>
                          <h3 className="text-lg font-semibold">Chat with {activeChat.name}</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleStartVideoCall(activeChat)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Video Call
                          </Button>
                        </div>
                        <div className="flex-1 border rounded-lg overflow-hidden">
                          <ChatInterface 
                            currentUser={currentUser} 
                            chatPartner={activeChat} 
                            onBack={handleBackFromChat}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <TabsContent value="discover" className="mt-0">
                          <DiscoverUsers currentUser={currentUser} onStartChat={handleStartChat} />
                        </TabsContent>
                        
                        <TabsContent value="requests" className="mt-0">
                          <FriendRequests currentUser={currentUser} />
                        </TabsContent>
                        
                        <TabsContent value="friends" className="mt-0">
                          <FriendsList 
                            currentUser={currentUser} 
                            onStartChat={handleStartChat} 
                            onStartVideo={handleStartVideoCall}
                          />
                        </TabsContent>
                      </>
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Your Profile</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setShowProfile(false); setEditMode(false); setAvatarFile(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Profile Picture */}
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={editProfile?.avatar || currentUser.avatar || "/placeholder.svg"} alt={editProfile?.name || currentUser.name} />
                    <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
                      {(editProfile?.name || currentUser.name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Change Avatar button only outside edit mode */}
                  {!editMode && (
                    <div className="mt-2">
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0]
                          if (file) {
                            try {
                              // Check if we have the required environment variable
                              const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
                              if (!cloudName || cloudName === 'your_cloud_name_here') {
                                alert('Cloudinary not configured. Please set up your Cloudinary credentials in .env.local file.')
                                return
                              }

                              // Create FormData for Cloudinary upload
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('upload_preset', 'sayhi-avatars')
                              formData.append('cloud_name', cloudName)
                              
                              console.log('Uploading to Cloudinary...', { cloudName, fileSize: file.size })
                              
                              const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                                method: 'POST',
                                body: formData
                              })
                              
                              if (!response.ok) {
                                const errorData = await response.text()
                                console.error('Cloudinary upload failed:', response.status, errorData)
                                throw new Error(`Upload failed: ${response.status}`)
                              }
                              
                              const result = await response.json()
                              console.log('Upload result:', result)
                              
                              if (result.secure_url) {
                                // Update profile with new avatar
                                const updateResponse = await fetch('/api/users', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'updateProfile',
                                    userId: currentUser.id,
                                    updates: { avatar: result.secure_url }
                                  })
                                })
                                
                                if (updateResponse.ok) {
                                  // Update the current user state instead of reloading
                                  const updatedUser = { ...currentUser, avatar: result.secure_url }
                                  // You might need to pass this up to the parent component
                                  // For now, we'll reload but you can implement a callback
                                  window.location.reload()
                                } else {
                                  alert('Failed to update profile. Please try again.')
                                }
                              } else {
                                alert('Failed to upload image. Please try again.')
                              }
                            } catch (error) {
                              console.error('Upload error:', error)
                              alert(`Upload failed: ${error.message}. Please check your Cloudinary configuration.`)
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => document.getElementById('avatar-upload').click()}
                        className="w-full mt-2"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Change Avatar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      {editMode ? (
                        <input
                          className="text-sm text-gray-900 bg-gray-50 p-2 rounded w-full border"
                          value={editProfile.name}
                          onChange={e => setEditProfile({ ...editProfile, name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentUser.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      {editMode ? (
                        <input
                          className="text-sm text-gray-900 bg-gray-50 p-2 rounded w-full border"
                          value={editProfile.username}
                          onChange={e => setEditProfile({ ...editProfile, username: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">@{currentUser.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Language
                      </label>
                      {editMode ? (
                        <Select
                          value={editProfile.language}
                          onValueChange={value => setEditProfile({ ...editProfile, language: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Language" />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentUser.language}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Region
                      </label>
                      {editMode ? (
                        <Select
                          value={editProfile.region}
                          onValueChange={value => setEditProfile({ ...editProfile, region: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Region" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentUser.region}</p>
                      )}
                    </div>
                  </div>

                  {(editMode || currentUser.bio) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      {editMode ? (
                        <textarea
                          className="text-sm text-gray-900 bg-gray-50 p-2 rounded w-full border"
                          value={editProfile.bio}
                          onChange={e => setEditProfile({ ...editProfile, bio: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{currentUser.bio}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">{currentUser.id}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {editMode ? (
                    <>
                      <Button variant="outline" className="flex-1" onClick={async () => {
                        setSaving(true)
                        try {
                          const response = await fetch('/api/users', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              action: 'updateProfile',
                              userId: editProfile.id,
                              updates: {
                                name: editProfile.name,
                                username: editProfile.username,
                                language: editProfile.language,
                                region: editProfile.region,
                                bio: editProfile.bio || "",
                                avatar: editProfile.avatar
                              }
                            })
                          })
                          
                          const data = await response.json()
                          setSaving(false)
                          
                          if (data.user) {
                            setEditMode(false)
                            setAvatarFile(null)
                            setShowProfile(false)
                            window.location.reload() // or update state
                          }
                        } catch (error) {
                          console.error('Failed to update profile:', error)
                          setSaving(false)
                        }
                      }} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => { setEditMode(false); setAvatarFile(null); }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => { setEditMode(true); setEditProfile(currentUser); }}>
                        Edit Profile
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 