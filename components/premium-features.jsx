"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Bot, 
  Award, 
  Calendar, 
  Mic, 
  Download, 
  BarChart3,
  MessageCircle,
  Star,
  Trophy,
  Play,
  Volume2
} from "lucide-react"

export default function PremiumFeatures({ currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState("ai-chat")
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [message, setMessage] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("spanish")
  const [certifications, setCertifications] = useState([])
  const [tutoringSessions, setTutoringSessions] = useState([])
  const [voiceAssessments, setVoiceAssessments] = useState([])
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    fetchPremiumData()
  }, [currentUser.id])

  const fetchPremiumData = async () => {
    try {
      const [conversationsRes, certificationsRes, sessionsRes, assessmentsRes] = await Promise.all([
        fetch(`/api/premium?action=getConversations&userId=${currentUser.id}`),
        fetch(`/api/premium?action=getCertifications&userId=${currentUser.id}`),
        fetch(`/api/premium?action=getTutoringSessions&userId=${currentUser.id}`),
        fetch(`/api/premium?action=getVoiceAssessments&userId=${currentUser.id}`)
      ])

      const [conversationsData, certificationsData, sessionsData, assessmentsData] = await Promise.all([
        conversationsRes.json(),
        certificationsRes.json(),
        sessionsRes.json(),
        assessmentsRes.json()
      ])

      setConversations(conversationsData.conversations || [])
      setCertifications(certificationsData.certifications || [])
      setTutoringSessions(sessionsData.sessions || [])
      setVoiceAssessments(assessmentsData.assessments || [])
    } catch (error) {
      console.error("Failed to fetch premium data:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chatWithAI",
          userId: currentUser.id,
          language: selectedLanguage,
          message: message.trim(),
          personality: "friendly"
        })
      })

      const data = await response.json()
      if (data.conversation) {
        // Ensure messages array exists and append new message
        const updatedConversation = {
          ...data.conversation,
          messages: [
            ...(currentConversation?.messages || []),
            { role: "user", content: message.trim(), timestamp: new Date().toISOString() },
            { role: "assistant", content: data.reply, timestamp: new Date().toISOString() }
          ]
        };
        setCurrentConversation(updatedConversation);
        setMessage("");
        // Fetching all data again might not be necessary if only chat is updated,
        // but for simplicity and to ensure consistency with other parts, we'll keep it.
        // fetchPremiumData(); 
      } else if (data.reply) {
        // Handle cases where a new conversation might not be returned but a reply is
        const updatedConversation = {
          ...currentConversation,
          messages: [
            ...(currentConversation?.messages || []),
            { role: "user", content: message.trim(), timestamp: new Date().toISOString() },
            { role: "assistant", content: data.reply, timestamp: new Date().toISOString() }
          ]
        };
        setCurrentConversation(updatedConversation);
        setMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      // Display an error message to the user or handle the error state
      // For now, we'll just log it and stop loading.
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCertification = async (courseId, language) => {
    try {
      const response = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateCertification",
          userId: currentUser.id,
          courseId,
          language
        })
      })

      if (response.ok) {
        fetchPremiumData()
      }
    } catch (error) {
      console.error("Failed to generate certification:", error)
    }
  }

  const handleVoiceAssessment = async (text, audioBlob) => {
    setLoading(true)
    try {
      // In a real implementation, you'd upload the audio file
      const response = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assessPronunciation",
          userId: currentUser.id,
          language: selectedLanguage,
          text,
          audioUrl: "placeholder-url" // Would be actual audio URL
        })
      })

      if (response.ok) {
        fetchPremiumData()
      }
    } catch (error) {
      console.error("Failed to assess pronunciation:", error)
    } finally {
      setLoading(false)
    }
  }

  // Check if user has premium access
  const hasPremiumAccess = currentUser.subscription?.type !== "free"

  if (!hasPremiumAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Premium Features</h2>
          <p className="text-gray-600 mb-6">Upgrade to access AI chat, certifications, and more!</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={onBack} variant="outline">Go Back</Button>
            <Button>Upgrade Now</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Premium Features</h2>
          <p className="text-gray-600">Advanced tools for accelerated learning</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai-chat">AI Chat</TabsTrigger>
          <TabsTrigger value="tutoring">Tutoring</TabsTrigger>
          <TabsTrigger value="voice">Voice Practice</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-chat" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Conversation Practice
                </CardTitle>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Interface */}
              <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    currentConversation?.id === conv.id || (!currentConversation && conv.id === conversations[0].id) ? (
                      <div key={conv.id} className="space-y-3">
                        {conv.messages.map((msg, index) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-4 py-2 rounded-lg ${
                              msg.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white border shadow-sm'
                            }`}>
                              <p>{msg.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs opacity-70">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.role === 'assistant' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const utterance = new SpeechSynthesisUtterance(msg.content)
                                      utterance.lang = selectedLanguage === 'spanish' ? 'es-ES' : 
                                                      selectedLanguage === 'french' ? 'fr-FR' : 'de-DE'
                                      speechSynthesis.speak(utterance)
                                    }}
                                  >
                                    <Volume2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null
                  ))
                ) : (
                  <div className="text-center text-gray-500 mt-20">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation with our AI tutor!</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder={`Type in ${selectedLanguage}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={loading}
                />
                <Button onClick={handleSendMessage} disabled={loading || !message.trim()}>
                  {loading ? "..." : "Send"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Removed Certificates Tab Content */}

        <TabsContent value="tutoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                1-on-1 Native Speaker Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tutoringSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tutoring sessions scheduled</p>
                  <Button>Find a Tutor</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tutoringSessions.map((session) => (
                    <Card key={session.id} className="border-2 border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {session.tutor?.name} - {session.language}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(session.scheduledAt).toLocaleString()}
                            </p>
                            <Badge variant="outline">{session.duration} minutes</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${session.price}</p>
                            <Badge className={
                              session.status === 'completed' ? 'bg-green-100 text-green-700' :
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {session.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Recognition & Pronunciation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Practice Section */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Practice pronunciation</p>
                <Input 
                  placeholder="Enter text to practice..."
                  className="mb-4"
                />
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant={isRecording ? "destructive" : "default"}
                    onClick={() => setIsRecording(!isRecording)}
                  >
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </Button>
                  <Button variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Play Example
                  </Button>
                </div>
              </div>

              {/* Recent Assessments */}
              <div>
                <h3 className="font-semibold mb-4">Recent Assessments</h3>
                {voiceAssessments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No assessments yet</p>
                ) : (
                  <div className="space-y-3">
                    {voiceAssessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">"{assessment.text}"</p>
                              <p className="text-sm text-gray-600">
                                {new Date(assessment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={
                              assessment.score >= 90 ? 'bg-green-100 text-green-700' :
                              assessment.score >= 75 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {assessment.score}/100
                            </Badge>
                          </div>
                          <Progress value={assessment.score} className="mb-2" />
                          <p className="text-sm text-gray-600">{assessment.feedback}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Learning Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-2xl">87%</h4>
                    <p className="text-sm text-gray-600">Average Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-2xl">23h</h4>
                    <p className="text-sm text-gray-600">Study Time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-2xl">15</h4>
                    <p className="text-sm text-gray-600">Days Active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h4 className="font-semibold text-2xl">B1</h4>
                    <p className="text-sm text-gray-600">Estimated Level</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Learning Strengths</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Vocabulary</span>
                      <div className="flex items-center gap-2">
                        <Progress value={92} className="w-24" />
                        <span className="text-sm">92%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Grammar</span>
                      <div className="flex items-center gap-2">
                        <Progress value={78} className="w-24" />
                        <span className="text-sm">78%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pronunciation</span>
                      <div className="flex items-center gap-2">
                        <Progress value={85} className="w-24" />
                        <span className="text-sm">85%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-500" />
                    Personalized Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Focus on past tense grammar exercises</li>
                    <li>• Practice conversation with native speakers</li>
                    <li>• Review vocabulary from lesson 3-5</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}