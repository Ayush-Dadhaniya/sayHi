
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Globe, 
  Calendar,
  Coffee,
  Music,
  Book,
  Camera,
  Plane,
  ArrowLeft,
  MessageCircle,
  Filter,
  Users
} from "lucide-react"

const INTERESTS = [
  { id: 1, name: "Travel", icon: Plane },
  { id: 2, name: "Music", icon: Music },
  { id: 3, name: "Photography", icon: Camera },
  { id: 4, name: "Reading", icon: Book },
  { id: 5, name: "Coffee", icon: Coffee },
]

export default function DatingMode({ currentUser, onBack, onStartChat }) {
  const [showTerms, setShowTerms] = useState(true)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [wantsDating, setWantsDating] = useState(null)
  const [activeTab, setActiveTab] = useState("discover") // discover, matches, likes
  const [datingProfile, setDatingProfile] = useState(null)
  const [potentialMatches, setPotentialMatches] = useState([])
  const [matches, setMatches] = useState([])
  const [sentLikes, setSentLikes] = useState([])
  const [receivedLikes, setReceivedLikes] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [ageRange, setAgeRange] = useState([18, 35])
  const [maxDistance, setMaxDistance] = useState(50)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchDatingProfile()
    fetchPotentialMatches()
    fetchMatches()
    fetchLikes()
  }, [])

  const fetchDatingProfile = async () => {
    // Mock profile - in real app, fetch from API
    setDatingProfile({
      ...currentUser,
      age: 25,
      occupation: "Software Developer",
      interests: ["Travel", "Music", "Photography"],
      bio: "Love exploring new cultures and meeting interesting people!",
      lookingFor: "Friendship and maybe something more",
      photos: [currentUser.avatar]
    })
  }

  const fetchPotentialMatches = async () => {
    // Mock data - in real app, fetch from API based on preferences
    setPotentialMatches([
      {
        id: "match1",
        name: "Emma Wilson",
        age: 23,
        occupation: "Artist",
        bio: "Passionate about art and traveling the world 🎨✈️",
        interests: ["Travel", "Photography", "Coffee"],
        photos: ["/placeholder.svg"],
        distance: 5,
        language: "English",
        region: "United States"
      },
      {
        id: "match2",
        name: "Sophie Chen",
        age: 27,
        occupation: "Teacher",
        bio: "Love learning new languages and cultures 📚🌍",
        interests: ["Reading", "Music", "Travel"],
        photos: ["/placeholder.svg"],
        distance: 12,
        language: "Chinese",
        region: "China"
      },
      {
        id: "match3",
        name: "Isabella Rodriguez",
        age: 24,
        occupation: "Photographer",
        bio: "Capturing beautiful moments around the world 📸",
        interests: ["Photography", "Travel", "Coffee"],
        photos: ["/placeholder.svg"],
        distance: 8,
        language: "Spanish",
        region: "Spain"
      }
    ])
  }

  const fetchMatches = async () => {
    // Mock data
    setMatches([
      {
        id: "match1",
        name: "Emma Wilson",
        avatar: "/placeholder.svg",
        lastMessage: "Hi there! How's your day going?",
        timestamp: "2 hours ago",
        unread: true
      }
    ])
  }

  const fetchLikes = async () => {
    // Mock data
    setReceivedLikes([
      {
        id: "like1",
        name: "Alex Johnson",
        avatar: "/placeholder.svg",
        age: 26,
        occupation: "Designer"
      }
    ])
  }

  const handleLike = async (matchId) => {
    try {
      // In real app, send to API
      const likedUser = potentialMatches[currentMatchIndex]
      setSentLikes(prev => [...prev, likedUser])
      
      // Check if it's a mutual like (match)
      // In real app, this would be handled by the backend
      if (Math.random() > 0.5) { // 50% chance of mutual like for demo
        setMatches(prev => [...prev, {
          id: likedUser.id,
          name: likedUser.name,
          avatar: likedUser.photos[0],
          lastMessage: "You matched! Say hello 👋",
          timestamp: "Just now",
          unread: true
        }])
        alert(`It's a match with ${likedUser.name}! 🎉`)
      }
      
      nextMatch()
    } catch (error) {
      console.error("Failed to like user:", error)
    }
  }

  const handlePass = () => {
    nextMatch()
  }

  const nextMatch = () => {
    if (currentMatchIndex < potentialMatches.length - 1) {
      setCurrentMatchIndex(prev => prev + 1)
    } else {
      // No more potential matches
      setCurrentMatchIndex(0)
    }
  }

  const currentMatch = potentialMatches[currentMatchIndex]

  // Terms and Conditions Modal
  if (showTerms) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Dating Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <Heart className="h-16 w-16 mx-auto text-pink-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Are you looking for dating?</h3>
              <p className="text-sm text-gray-600">
                This mode helps you find meaningful romantic connections
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant={wantsDating === true ? "default" : "outline"}
                className="w-full"
                onClick={() => setWantsDating(true)}
              >
                Yes, I'm interested in dating
              </Button>
              <Button
                variant={wantsDating === false ? "default" : "outline"}
                className="w-full"
                onClick={() => setWantsDating(false)}
              >
                No, just looking for friends
              </Button>
            </div>

            {wantsDating !== null && (
              <>
                <div className="bg-gray-50 p-4 rounded-lg text-sm">
                  <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Be respectful and kind to all users</li>
                    <li>• No inappropriate content or behavior</li>
                    <li>• You must be 18+ to use dating features</li>
                    <li>• Report any suspicious activity</li>
                    <li>• Your safety is our priority</li>
                  </ul>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="terms" className="text-sm">
                    I agree to the terms and conditions
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onBack} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (wantsDating && termsAccepted) {
                        setShowTerms(false)
                      } else if (!wantsDating) {
                        alert("Please use the 'Find Friends' feature instead!")
                        onBack()
                      }
                    }}
                    disabled={wantsDating && !termsAccepted}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 p-4"></div>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Dating Mode</h1>
              <p className="text-gray-600">Find meaningful connections</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Age Range</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={ageRange[0]} onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])} className="w-20" />
                    <span>to</span>
                    <Input type="number" value={ageRange[1]} onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])} className="w-20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Distance (km)</label>
                  <Input type="number" value={maxDistance} onChange={(e) => setMaxDistance(parseInt(e.target.value))} className="w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "discover" ? "default" : "outline"}
            onClick={() => setActiveTab("discover")}
          >
            <Users className="h-4 w-4 mr-2" />
            Discover
          </Button>
          <Button
            variant={activeTab === "matches" ? "default" : "outline"}
            onClick={() => setActiveTab("matches")}
          >
            <Heart className="h-4 w-4 mr-2" />
            Matches ({matches.length})
          </Button>
          <Button
            variant={activeTab === "likes" ? "default" : "outline"}
            onClick={() => setActiveTab("likes")}
          >
            <Star className="h-4 w-4 mr-2" />
            Likes ({receivedLikes.length})
          </Button>
        </div>

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <div className="flex justify-center">
            {currentMatch ? (
              <Card className="w-full max-w-md shadow-xl">
                <CardContent className="p-0">
                  {/* Photo */}
                  <div className="relative h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-t-lg">
                    <img
                      src={currentMatch.photos[0] || "/placeholder.svg"}
                      alt={currentMatch.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold">{currentMatch.name}, {currentMatch.age}</h3>
                      <p className="text-sm opacity-90">{currentMatch.occupation}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{currentMatch.distance} km away</span>
                      <Globe className="h-4 w-4 ml-2" />
                      <span>{currentMatch.language}</span>
                    </div>

                    <p className="text-gray-700">{currentMatch.bio}</p>

                    <div className="flex flex-wrap gap-2">
                      {currentMatch.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handlePass}
                        className="rounded-full w-16 h-16 border-2 border-gray-300 hover:border-gray-400"
                      >
                        <X className="h-8 w-8 text-gray-500" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => handleLike(currentMatch.id)}
                        className="rounded-full w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                      >
                        <Heart className="h-8 w-8" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="w-full max-w-md">
                <CardContent className="text-center py-12">
                  <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No more profiles</h3>
                  <p className="text-gray-600">Check back later for new matches!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No matches yet. Keep swiping!</p>
                </CardContent>
              </Card>
            ) : (
              matches.map((match) => (
                <Card key={match.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.avatar || "/placeholder.svg"} alt={match.name} />
                        <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{match.name}</h3>
                        <p className="text-sm text-gray-600">{match.lastMessage}</p>
                        <p className="text-xs text-gray-400">{match.timestamp}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStartChat?.(match)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Likes Tab */}
        {activeTab === "likes" && (
          <div className="space-y-4">
            {receivedLikes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No likes yet</p>
                </CardContent>
              </Card>
            ) : (
              receivedLikes.map((like) => (
                <Card key={like.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={like.avatar || "/placeholder.svg"} alt={like.name} />
                        <AvatarFallback>{like.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{like.name}, {like.age}</h3>
                        <p className="text-sm text-gray-600">{like.occupation}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
