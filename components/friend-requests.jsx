"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Globe, MapPin, UserPlus } from "lucide-react"

export default function FriendRequests({ currentUser, onRequestHandled }) {
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetchRequests()
  }, [currentUser])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/users?action=requests&userId=${currentUser.id}`)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    }
  }

  const handleRequest = async (requestId, response) => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respondToRequest",
          requestId,
          response,
        }),
      })

      if (res.ok) {
        setRequests((prev) => prev.filter((req) => req.id !== requestId))
        onRequestHandled?.(requestId, response)
      }
    } catch (error) {
      console.error("Failed to handle request:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Friend Requests</h2>
        {requests.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {requests.length} pending
          </Badge>
        )}
      </div>
      
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">No pending friend requests</p>
          <p className="text-sm text-gray-400">When someone sends you a friend request, it will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.fromUser.avatar || "/placeholder.svg"} alt={request.fromUser.name} />
                    <AvatarFallback>{request.fromUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{request.fromUser.name}</h3>
                    <p className="text-sm text-gray-600">@{request.fromUser.username}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        {request.fromUser.language}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {request.fromUser.region}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.id, "accepted")}
                    className="bg-green-500 hover:bg-green-600"
                    title="Accept request"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleRequest(request.id, "rejected")}
                    className="hover:bg-red-50 hover:border-red-200"
                    title="Reject request"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
