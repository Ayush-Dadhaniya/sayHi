
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Gift, 
  Heart, 
  Star, 
  Sparkles, 
  Send,
  Package,
  Coffee,
  Flower,
  Music,
  Book,
  Camera,
  ArrowLeft,
  Search
} from "lucide-react"

const VIRTUAL_GIFTS = [
  { id: 1, name: "Coffee", icon: Coffee, price: 5, color: "brown" },
  { id: 2, name: "Flower", icon: Flower, price: 10, color: "pink" },
  { id: 3, name: "Heart", icon: Heart, price: 15, color: "red" },
  { id: 4, name: "Star", icon: Star, price: 20, color: "yellow" },
  { id: 5, name: "Music", icon: Music, price: 25, color: "purple" },
  { id: 6, name: "Book", icon: Book, price: 30, color: "blue" },
  { id: 7, name: "Camera", icon: Camera, price: 50, color: "gray" },
  { id: 8, name: "Sparkles", icon: Sparkles, price: 100, color: "gold" },
]

export default function GiftExchange({ currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState("send") // send, received, history
  const [selectedGift, setSelectedGift] = useState(null)
  const [recipient, setRecipient] = useState("")
  const [message, setMessage] = useState("")
  const [friends, setFriends] = useState([])
  const [filteredFriends, setFilteredFriends] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sentGifts, setSentGifts] = useState([])
  const [receivedGifts, setReceivedGifts] = useState([])
  const [userPoints, setUserPoints] = useState(250) // Virtual currency

  useEffect(() => {
    fetchFriends()
    fetchGiftHistory()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setFilteredFriends(
        friends.filter(friend => 
          friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          friend.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredFriends(friends)
    }
  }, [searchQuery, friends])

  const fetchFriends = async () => {
    try {
      const response = await fetch(`/api/users?action=friends&userId=${currentUser.id}`)
      const data = await response.json()
      if (data.friends) {
        setFriends(data.friends)
        setFilteredFriends(data.friends)
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error)
    }
  }

  const fetchGiftHistory = async () => {
    // Mock data - in real app, fetch from API
    setSentGifts([
      {
        id: 1,
        recipient: "Maria Garcia",
        gift: "Heart",
        message: "Thank you for being such a great friend!",
        date: "2024-01-15",
        points: 15
      }
    ])
    
    setReceivedGifts([
      {
        id: 1,
        sender: "Raj Patel",
        gift: "Coffee",
        message: "Hope this brightens your day!",
        date: "2024-01-14",
        points: 5
      }
    ])
  }

  const handleSendGift = async () => {
    if (!selectedGift || !recipient || userPoints < selectedGift.price) return

    try {
      // In real app, send to API
      const newGift = {
        id: Date.now(),
        recipient: recipient,
        gift: selectedGift.name,
        message: message,
        date: new Date().toISOString().split('T')[0],
        points: selectedGift.price
      }

      setSentGifts(prev => [newGift, ...prev])
      setUserPoints(prev => prev - selectedGift.price)
      
      // Reset form
      setSelectedGift(null)
      setRecipient("")
      setMessage("")
      
      alert(`Gift sent to ${recipient}!`)
    } catch (error) {
      console.error("Failed to send gift:", error)
    }
  }

  const getGiftIcon = (giftName) => {
    const gift = VIRTUAL_GIFTS.find(g => g.name === giftName)
    return gift ? gift.icon : Gift
  }

  const getGiftColor = (giftName) => {
    const gift = VIRTUAL_GIFTS.find(g => g.name === giftName)
    return gift ? gift.color : "gray"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gift Exchange</h1>
              <p className="text-gray-600">Send virtual gifts to your friends</p>
            </div>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">{userPoints} Points</span>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "send" ? "default" : "outline"}
            onClick={() => setActiveTab("send")}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Gift
          </Button>
          <Button
            variant={activeTab === "received" ? "default" : "outline"}
            onClick={() => setActiveTab("received")}
          >
            <Package className="h-4 w-4 mr-2" />
            Received ({receivedGifts.length})
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
          >
            <Gift className="h-4 w-4 mr-2" />
            Sent History
          </Button>
        </div>

        {/* Send Gift Tab */}
        {activeTab === "send" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gift Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose a Gift</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {VIRTUAL_GIFTS.map((gift) => {
                    const IconComponent = gift.icon
                    return (
                      <div
                        key={gift.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedGift?.id === gift.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        } ${userPoints < gift.price ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => userPoints >= gift.price && setSelectedGift(gift)}
                      >
                        <IconComponent className={`h-8 w-8 mx-auto mb-2 text-${gift.color}-500`} />
                        <p className="text-center text-sm font-medium">{gift.name}</p>
                        <p className="text-center text-xs text-gray-500">{gift.price} points</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recipient & Message */}
            <Card>
              <CardHeader>
                <CardTitle>Send To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search Friends</label>
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                          recipient === friend.name ? "bg-purple-100" : "hover:bg-gray-100"
                        }`}
                        onClick={() => setRecipient(friend.name)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                          <AvatarFallback className="text-xs">{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{friend.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                  <Textarea
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSendGift}
                  disabled={!selectedGift || !recipient || userPoints < (selectedGift?.price || 0)}
                  className="w-full"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Send Gift ({selectedGift?.price || 0} points)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Received Gifts Tab */}
        {activeTab === "received" && (
          <div className="space-y-4">
            {receivedGifts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No gifts received yet</p>
                </CardContent>
              </Card>
            ) : (
              receivedGifts.map((gift) => {
                const IconComponent = getGiftIcon(gift.gift)
                return (
                  <Card key={gift.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <IconComponent className={`h-8 w-8 text-${getGiftColor(gift.gift)}-500`} />
                        <div className="flex-1">
                          <p className="font-medium">{gift.gift} from {gift.sender}</p>
                          <p className="text-sm text-gray-600">{gift.message}</p>
                          <p className="text-xs text-gray-400">{gift.date}</p>
                        </div>
                        <Badge variant="secondary">{gift.points} points</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* Sent History Tab */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {sentGifts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No gifts sent yet</p>
                </CardContent>
              </Card>
            ) : (
              sentGifts.map((gift) => {
                const IconComponent = getGiftIcon(gift.gift)
                return (
                  <Card key={gift.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <IconComponent className={`h-8 w-8 text-${getGiftColor(gift.gift)}-500`} />
                        <div className="flex-1">
                          <p className="font-medium">{gift.gift} to {gift.recipient}</p>
                          <p className="text-sm text-gray-600">{gift.message}</p>
                          <p className="text-xs text-gray-400">{gift.date}</p>
                        </div>
                        <Badge variant="outline">{gift.points} points</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
