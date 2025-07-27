"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Globe, MapPin, MessageCircle } from "lucide-react"

export default function DiscoverUsers({ currentUser, onSendRequest, onStartChat }) {
  const [users, setUsers] = useState([])
  const [sentRequests, setSentRequests] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchUsers()
    fetchSentRequests()
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await fetch(`/api/users?action=discover&currentUserId=${currentUser.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        setError("Failed to load users")
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setError("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSentRequests = async () => {
    try {
      const response = await fetch(`/api/users?action=sentRequests&fromUserId=${currentUser.id}`)
      const data = await response.json()
      
      if (response.ok && data.requests) {
        const sentRequestIds = data.requests.map(req => req.toUserId)
        setSentRequests(new Set(sentRequestIds))
      }
    } catch (error) {
      console.error("Failed to fetch sent requests:", error)
    }
  }

  const handleSendRequest = async (toUserId) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendFriendRequest",
          fromUserId: currentUser.id,
          toUserId,
        }),
      })

      if (response.ok) {
        setSentRequests((prev) => new Set([...prev, toUserId]))
        onSendRequest?.(toUserId)
      }
    } catch (error) {
      console.error("Failed to send friend request:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Discover People</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Discover People</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={fetchUsers} size="sm" variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Discover People</h2>
        <Badge variant="secondary" className="text-sm">
          {users.length} people online
        </Badge>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found to discover</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-xs text-gray-500">{user.isOnline ? "Online" : "Offline"}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {user.language}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {user.region}
                </Badge>
              </div>

              {user.bio && <p className="text-sm text-gray-600 mb-3">{user.bio}</p>}

              <div className="flex gap-2">
                {sentRequests.has(user.id) ? (
                  <Button disabled size="sm" className="flex-1 bg-gray-100 text-gray-600">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Request Sent
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSendRequest(user.id)} 
                    size="sm" 
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Friend
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onStartChat?.(user)}
                  className="hover:bg-blue-50"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
