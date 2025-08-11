
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  Calendar, 
  Globe, 
  UserCheck, 
  Clock,
  MapPin,
  Star,
  Plus,
  Heart
} from "lucide-react"

export default function SocialFeatures({ currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState("exchange")
  const [exchangeMatches, setExchangeMatches] = useState([])
  const [studySessions, setStudySessions] = useState([])
  const [culturalEvents, setCulturalEvents] = useState([])
  const [mentorships, setMentorships] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    language: "",
    scheduledAt: "",
    duration: 60,
    maxParticipants: 6
  })
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    language: "",
    scheduledAt: ""
  })

  useEffect(() => {
    fetchSocialData()
  }, [currentUser.id])

  const fetchSocialData = async () => {
    try {
      const [exchangeRes, sessionsRes, eventsRes, mentorshipsRes] = await Promise.all([
        fetch(`/api/social?action=getLanguageExchangeMatches&userId=${currentUser.id}`),
        fetch(`/api/social?action=getStudySessions`),
        fetch(`/api/social?action=getCulturalEvents`),
        fetch(`/api/social?action=getMentorships&userId=${currentUser.id}`)
      ])

      const [exchangeData, sessionsData, eventsData, mentorshipsData] = await Promise.all([
        exchangeRes.json(),
        sessionsRes.json(),
        eventsRes.json(),
        mentorshipsRes.json()
      ])

      setExchangeMatches(exchangeData.matches || [])
      setStudySessions(sessionsData.sessions || [])
      setCulturalEvents(eventsData.events || [])
      setMentorships(mentorshipsData.mentorships || [])
    } catch (error) {
      console.error("Failed to fetch social data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createStudySession",
          hostId: currentUser.id,
          ...sessionForm
        })
      })

      if (response.ok) {
        setShowCreateSession(false)
        setSessionForm({
          title: "",
          description: "",
          language: "",
          scheduledAt: "",
          duration: 60,
          maxParticipants: 6
        })
        fetchSocialData()
      }
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  const handleJoinSession = async (sessionId) => {
    try {
      await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "joinStudySession",
          sessionId,
          userId: currentUser.id
        })
      })
      fetchSocialData()
    } catch (error) {
      console.error("Failed to join session:", error)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createCulturalEvent",
          createdBy: currentUser.id,
          ...eventForm
        })
      })

      if (response.ok) {
        setShowCreateEvent(false)
        setEventForm({
          title: "",
          description: "",
          language: "",
          scheduledAt: ""
        })
        fetchSocialData()
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    }
  }

  const handleRSVPEvent = async (eventId) => {
    try {
      await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rsvpEvent",
          eventId,
          userId: currentUser.id
        })
      })
      fetchSocialData()
    } catch (error) {
      console.error("Failed to RSVP:", error)
    }
  }

  const handleEnterSession = (session) => {
    // Create a virtual meeting room
    alert(`Welcome to "${session.title}"! 

Group Chat Features Available:
• Text chat with all participants
• Voice/Video calls 
• Screen sharing for lessons
• Collaborative learning exercises

Host: ${session.host?.name}
Language: ${session.language}
Duration: ${session.duration} minutes

Click OK to continue...`)
  }

  const handleLeaveSession = async (sessionId) => {
    try {
      await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leaveStudySession",
          sessionId,
          userId: currentUser.id
        })
      })
      fetchSocialData()
    } catch (error) {
      console.error("Failed to leave session:", error)
    }
  }

  const handleFindMentor = async () => {
    try {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "findMentor",
          userId: currentUser.id,
          language: "spanish" // You can make this dynamic
        })
      })
      
      if (response.ok) {
        fetchSocialData()
        alert("Mentor request sent!")
      }
    } catch (error) {
      console.error("Failed to find mentor:", error)
    }
  }

  const handleBecomeMentor = async () => {
    try {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "becomeMentor",
          userId: currentUser.id,
          languages: [currentUser.language] // User's languages they can mentor in
        })
      })
      
      if (response.ok) {
        alert("You are now registered as a mentor!")
      }
    } catch (error) {
      console.error("Failed to become mentor:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Social Learning</h2>
          <p className="text-gray-600">Connect, learn, and grow together</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="exchange">Language Exchange</TabsTrigger>
          <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
          <TabsTrigger value="events">Cultural Events</TabsTrigger>
          <TabsTrigger value="mentors">Mentorship</TabsTrigger>
        </TabsList>

        <TabsContent value="exchange" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language Exchange Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              {exchangeMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No language exchange matches yet</p>
                  <Button>Find Exchange Partners</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exchangeMatches.map((match) => (
                    <Card key={match.id} className="border-2 border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarImage src={match.partner.avatar} />
                            <AvatarFallback>{match.partner.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{match.partner.name}</h3>
                            <p className="text-sm text-gray-600">@{match.partner.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <Badge>Teaches: {match.user2Native}</Badge>
                          <Badge variant="outline">Learns: {match.user2Learning}</Badge>
                        </div>
                        <Button className="w-full" size="sm">Start Exchange</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Group Study Sessions
                </CardTitle>
                <Button onClick={() => setShowCreateSession(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studySessions.map((session) => (
                  <Card key={session.id} className="border-2 border-green-100">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{session.title}</h3>
                          <p className="text-sm text-gray-600">{session.description}</p>
                        </div>
                        <Badge>{session.language}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(session.scheduledAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {session.participants.length}/{session.maxParticipants} participants
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Hosted by {session.host?.name}
                        </div>
                      </div>

                      {session.participants.includes(currentUser.id) ? (
                        <div className="space-y-2">
                          <Button className="w-full" size="sm" onClick={() => handleEnterSession(session)}>
                            Enter Session
                          </Button>
                          <Button variant="outline" className="w-full" size="sm" onClick={() => handleLeaveSession(session.id)}>
                            Leave Session
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="sm"
                          disabled={session.participants.length >= session.maxParticipants}
                          onClick={() => handleJoinSession(session.id)}
                        >
                          Join Session
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Session Modal */}
          {showCreateSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create Study Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateSession} className="space-y-4">
                    <Input
                      placeholder="Session title"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                      required
                    />
                    <Textarea
                      placeholder="Description"
                      value={sessionForm.description}
                      onChange={(e) => setSessionForm({...sessionForm, description: e.target.value})}
                    />
                    <Input
                      placeholder="Language"
                      value={sessionForm.language}
                      onChange={(e) => setSessionForm({...sessionForm, language: e.target.value})}
                      required
                    />
                    <Input
                      type="datetime-local"
                      value={sessionForm.scheduledAt}
                      onChange={(e) => setSessionForm({...sessionForm, scheduledAt: e.target.value})}
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Max participants"
                      value={sessionForm.maxParticipants}
                      onChange={(e) => setSessionForm({...sessionForm, maxParticipants: parseInt(e.target.value)})}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Create</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateSession(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cultural Events
                </CardTitle>
                <Button onClick={() => setShowCreateEvent(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {culturalEvents.map((event) => (
                  <Card key={event.id} className="border-2 border-purple-100">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                        <Badge variant="outline">{event.language}</Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.scheduledAt).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          {event.rsvps.length} people interested
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        size="sm"
                        variant={event.rsvps.includes(currentUser.id) ? "default" : "outline"}
                        disabled={event.rsvps.includes(currentUser.id)}
                        onClick={() => event.rsvps.includes(currentUser.id) ? null : handleRSVPEvent(event.id)}
                      >
                        {event.rsvps.includes(currentUser.id) ? "✓ Going" : "RSVP"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Create Event Modal */}
          {showCreateEvent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create Cultural Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <Input
                      placeholder="Event title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      required
                    />
                    <Textarea
                      placeholder="Description"
                      value={eventForm.description}
                      onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    />
                    <Input
                      placeholder="Language/Culture"
                      value={eventForm.language}
                      onChange={(e) => setEventForm({...eventForm, language: e.target.value})}
                      required
                    />
                    <Input
                      type="datetime-local"
                      value={eventForm.scheduledAt}
                      onChange={(e) => setEventForm({...eventForm, scheduledAt: e.target.value})}
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Create</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreateEvent(false)}>Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mentors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Mentorship Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentorships.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No mentorship connections yet</p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => handleFindMentor()}>Find a Mentor</Button>
                    <Button variant="outline" onClick={() => handleBecomeMentor()}>Become a Mentor</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorships.map((mentorship) => (
                    <Card key={mentorship.id} className="border-2 border-yellow-100">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={mentorship.mentor.id === currentUser.id ? mentorship.mentee.avatar : mentorship.mentor.avatar} />
                            <AvatarFallback>
                              {mentorship.mentor.id === currentUser.id ? mentorship.mentee.name.charAt(0) : mentorship.mentor.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {mentorship.mentor.id === currentUser.id ? mentorship.mentee.name : mentorship.mentor.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {mentorship.mentor.id === currentUser.id ? "Your Mentee" : "Your Mentor"} • {mentorship.language}
                            </p>
                          </div>
                          <Button size="sm">Message</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
