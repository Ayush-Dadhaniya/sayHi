"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Globe, MapPin } from "lucide-react"

export default function FriendsList({ currentUser, onStartChat }) {
  const [friends, setFriends] = useState([])

  useEffect(() => {
    fetchFriends()
  }, [currentUser])

  const fetchFriends = async () => {
    try {
      const response = await fetch(`/api/users?action=friends&userId=${currentUser.id}`)
      const data = await response.json()
      setFriends(data.friends || [])
    } catch (error) {
      console.error("Failed to fetch friends:", error)
    }
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No friends yet. Start by sending friend requests!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Your Friends</h2>
      <div className="space-y-3">
        {friends.map((friend) => (
          <Card key={friend.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{friend.name}</h3>
                      <div className={`w-2 h-2 rounded-full ${friend.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>
                    <p className="text-sm text-gray-600">@{friend.username}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        {friend.language}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {friend.region}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={() => onStartChat(friend)} className="bg-green-500 hover:bg-green-600">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
