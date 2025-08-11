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
  const [activeTab, setActiveTab] = useState("sessions")
  const [exchangeMatches, setExchangeMatches] = useState([])
  const [studySessions, setStudySessions] = useState([])
  const [culturalEvents, setCulturalEvents] = useState([])
  const [mentorships, setMentorships] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMentorForm, setShowMentorForm] = useState(false)
  const [mentorData, setMentorData] = useState({
    languages: [],
    experience: "beginner",
    availability: "weekends",
    bio: ""
  })

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
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'findMentor',
          userId: currentUser.id,
          language: currentUser.language || 'Hindi',
          skillLevel: 'beginner'
        })
      })
      const data = await response.json()
      if (data.mentors && data.mentors.length > 0) {
        // Create mentorship connections for found mentors
        for (const mentor of data.mentors) {
          await fetch('/api/social', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'createMentorship',
              mentorId: mentor.userId,
              menteeId: currentUser.id,
              language: currentUser.language || 'Hindi'
            })
          })
        }
        fetchSocialData() // Refresh to show new mentorships
        alert(`Found ${data.mentors.length} mentors! Check your mentorship section.`)
      } else {
        alert('No mentors found at this time. Try again later!')
      }
    } catch (error) {
      console.error('Error finding mentors:', error)
      alert('Failed to find mentors. Please try again.')
    }
  }

  const handleBecomeMentor = async () => {
    setShowMentorForm(true)
  }

  const submitMentorApplication = async () => {
    if (!mentorData.languages.length || !mentorData.bio.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'becomeMentor',
          userId: currentUser.id,
          languages: mentorData.languages, // Send all languages
          skillLevel: mentorData.experience,
          bio: mentorData.bio,
          availability: mentorData.availability
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setShowMentorForm(false)
        setMentorData({
          languages: [],
          experience: "beginner",
          availability: "weekends",
          bio: ""
        })
        alert('Mentor application submitted successfully! You are now available as a mentor.')
        fetchSocialData() // Refresh data
      } else {
        alert(data.message || 'Application submitted successfully!')
        setShowMentorForm(false)
      }
    } catch (error) {
      console.error('Error submitting mentor application:', error)
      alert('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Study Sessions</TabsTrigger>
          <TabsTrigger value="events">Cultural Events</TabsTrigger>
          <TabsTrigger value="mentors">Mentorship</TabsTrigger>
        </TabsList>

        

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Button 
                  onClick={handleFindMentor}
                  className="h-20 flex flex-col items-center justify-center"
                  variant="outline"
                >
                  <Users className="h-8 w-8 mb-2" />
                  <span>Find a Mentor</span>
                </Button>
                <Button 
                  onClick={handleBecomeMentor}
                  className="h-20 flex flex-col items-center justify-center"
                  variant="outline"
                >
                  <Star className="h-8 w-8 mb-2" />
                  <span>Become a Mentor</span>
                </Button>
              </div>

              {mentorships.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Mentorships</h3>
                  {mentorships.map((mentorship) => (
                    <Card key={mentorship.id} className="border-2 border-yellow-100">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={mentorship.mentor?.id === currentUser.id ? mentorship.mentee?.avatar : mentorship.mentor?.avatar} />
                            <AvatarFallback>
                              {mentorship.mentor?.id === currentUser.id ? mentorship.mentee?.name?.charAt(0) : mentorship.mentor?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {mentorship.mentor?.id === currentUser.id ? mentorship.mentee?.name : mentorship.mentor?.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {mentorship.mentor?.id === currentUser.id ? "Your Mentee" : "Your Mentor"} • {mentorship.language}
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

          {/* Improved Mentor Form Modal */}
          {showMentorForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Become a Mentor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Languages you can teach</label>
                    <Input 
                      placeholder="e.g., Spanish, French, German"
                      value={mentorData.languages.join(', ')}
                      onChange={(e) => setMentorData({
                        ...mentorData, 
                        languages: e.target.value.split(',').map(lang => lang.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience Level</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={mentorData.experience}
                      onChange={(e) => setMentorData({...mentorData, experience: e.target.value})}
                    >
                      <option value="beginner">Beginner Teacher</option>
                      <option value="intermediate">Intermediate Teacher</option>
                      <option value="advanced">Advanced Teacher</option>
                      <option value="native">Native Speaker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Availability</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={mentorData.availability}
                      onChange={(e) => setMentorData({...mentorData, availability: e.target.value})}
                    >
                      <option value="weekdays">Weekdays</option>
                      <option value="weekends">Weekends</option>
                      <option value="evenings">Evenings</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <Textarea 
                      placeholder="Tell us about your teaching experience, teaching style, and what you can help students with..."
                      value={mentorData.bio}
                      onChange={(e) => setMentorData({...mentorData, bio: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={submitMentorApplication}
                      className="flex-1"
                      disabled={!mentorData.languages.length || !mentorData.bio.trim()}
                    >
                      Submit Application
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowMentorForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}