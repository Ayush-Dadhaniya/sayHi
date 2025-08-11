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
  Users,
  Video
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
  const [receivedLikes, setReceivedLikes] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [ageRange, setAgeRange] = useState([18, 35])
  const [maxDistance, setMaxDistance] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkExistingProfile()
  }, [])

  useEffect(() => {
    if (!showTerms) {
      fetchPotentialMatches()
      fetchMatches()
      fetchLikes()
    }
  }, [showTerms])

  const checkExistingProfile = async () => {
    try {
      const response = await fetch(`/api/dating?action=getProfile&userId=${currentUser.id}`)
      const data = await response.json()

      if (data.profile) {
        setDatingProfile(data.profile)
        setShowTerms(false)
        setWantsDating(true)
        setTermsAccepted(true)
      }
    } catch (error) {
      console.error("Failed to check existing profile:", error)
    }
  }

  const fetchPotentialMatches = async () => {
    try {
      const response = await fetch(`/api/dating?action=getPotentialMatches&userId=${currentUser.id}`)
      const data = await response.json()
      setPotentialMatches(data.matches || [])
      setCurrentMatchIndex(0)
    } catch (error) {
      console.error("Failed to fetch potential matches:", error)
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await fetch(`/api/dating?action=getMatches&userId=${currentUser.id}`)
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error("Failed to fetch matches:", error)
    }
  }

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/dating?action=getLikes&userId=${currentUser.id}`)
      const data = await response.json()
      setReceivedLikes(data.likes || [])
    } catch (error) {
      console.error("Failed to fetch likes:", error)
    }
  }

  const createDatingProfile = async () => {
    try {
      setLoading(true)
      const profileData = {
        age: 25, // You could make this configurable
        occupation: currentUser.occupation || "Not specified",
        bio: currentUser.bio || "Looking to meet new people and learn languages!",
        interests: ["Travel", "Languages", "Meeting new people"],
        lookingFor: "Friendship and language exchange",
        photos: [currentUser.avatar || "/placeholder.svg"],
        wantsDating: true
      }

      const response = await fetch("/api/dating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createProfile",
          userId: currentUser.id,
          profileData
        })
      })

      const data = await response.json()
      setDatingProfile(data.profile)
      setShowTerms(false)
    } catch (error) {
      console.error("Failed to create dating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (match) => {
    try {
      const response = await fetch("/api/dating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendLike",
          fromUserId: currentUser.id,
          toUserId: match.userId
        })
      })

      const data = await response.json()

      if (data.match) {
        // It's a match!
        alert(`It's a match with ${match.user.name}! 🎉`)
        fetchMatches() // Refresh matches
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
      // Refresh potential matches or show no more profiles message
      fetchPotentialMatches()
    }
  }

  const handleRespondToLike = async (like, response) => {
    try {
      await fetch("/api/dating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respondToLike",
          likeId: like.id,
          response,
          currentUserId: currentUser.id
        })
      })

      if (response === "accept") {
        alert(`It's a match with ${like.user.name}! 🎉`)
        fetchMatches()
      }

      fetchLikes() // Refresh likes
    } catch (error) {
      console.error("Failed to respond to like:", error)
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
              <svg className="h-16 w-16 mx-auto text-pink-500 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Are you looking for dating?</h3>
              <p className="text-sm text-gray-600">
                This mode helps you find meaningful romantic connections through language learning
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
                    <li>• Focus on language learning and cultural exchange</li>
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
                        createDatingProfile()
                      } else if (!wantsDating) {
                        alert("Please use the 'Find Friends' feature instead!")
                        onBack()
                      }
                    }}
                    disabled={(wantsDating && !termsAccepted) || loading}
                    className="flex-1"
                  >
                    {loading ? "Creating Profile..." : "Continue"}
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 p-4">
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
              <p className="text-gray-600">Find meaningful connections through language learning</p>
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
                      src={currentMatch.user?.avatar || "/placeholder.svg"}
                      alt={currentMatch.user?.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold">{currentMatch.user?.name}, {currentMatch.age}</h3>
                      <p className="text-sm opacity-90">{currentMatch.occupation}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{currentMatch.user?.region}</span>
                      <Globe className="h-4 w-4 ml-2" />
                      <span>{currentMatch.user?.language}</span>
                    </div>

                    <p className="text-gray-700">{currentMatch.bio}</p>

                    <div className="flex flex-wrap gap-2">
                      {currentMatch.interests?.map((interest) => (
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
                        onClick={() => handleLike(currentMatch)}
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
                  <Button onClick={fetchPotentialMatches} className="mt-4">
                    Refresh
                  </Button>
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
                <Card key={match.matchId} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.partner?.avatar || "/placeholder.svg"} alt={match.partner?.name} />
                        <AvatarFallback>{match.partner?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{match.partner?.name}</h3>
                        <p className="text-sm text-gray-600">{match.partnerProfile?.bio}</p>
                        <p className="text-xs text-gray-400">
                          Matched {new Date(match.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStartChat?.(match.partner)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Start video call */}}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
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
                        <AvatarImage src={like.user?.avatar || "/placeholder.svg"} alt={like.user?.name} />
                        <AvatarFallback>{like.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{like.user?.name}, {like.profile?.age}</h3>
                        <p className="text-sm text-gray-600">{like.profile?.occupation}</p>
                        <p className="text-xs text-gray-400">{like.user?.region}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRespondToLike(like, "reject")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600"
                          onClick={() => handleRespondToLike(like, "accept")}
                        >
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