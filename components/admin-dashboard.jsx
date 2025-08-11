"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  ArrowLeft, 
  Users, 
  Building, 
  BookOpen, 
  Plus,
  Settings,
  BarChart3,
  Shield,
  Crown,
  Zap,
  Eye,
  Edit,
  Save
} from "lucide-react"

export default function AdminDashboard({ currentUser, onBack }) {
  const [activeTab, setActiveTab] = useState("stats")
  const [stats, setStats] = useState({})
  const [organizations, setOrganizations] = useState([])
  const [users, setUsers] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewingEnterprise, setViewingEnterprise] = useState(null)
  const [viewingLesson, setViewingLesson] = useState(null)
  const [editingPlan, setEditingPlan] = useState(null)
  const [plans, setPlans] = useState([])

  // Create Enterprise Form
  const [newEnterprise, setNewEnterprise] = useState({
    name: "",
    description: "",
    ownerUserId: "",
    plan: "free"
  })

  // Create Lesson Form
  const [newLesson, setNewLesson] = useState({
    language: "spanish",
    course: "basics",
    title: "",
    questions: [{ question: "", answer: "", options: ["", "", "", ""] }]
  })

  useEffect(() => {
    fetchStats()
    fetchOrganizations()
    fetchUsers()
    fetchLessons()
    fetchPlans()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin?action=getStats&adminUserId=${currentUser.id}`)
      const data = await response.json()
      setStats(data.stats || {})
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`/api/admin?action=getOrganizations&adminUserId=${currentUser.id}`)
      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/admin?action=getUsers&adminUserId=${currentUser.id}`)
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchLessons = async () => {
    try {
      const response = await fetch(`/api/admin?action=getLessons&adminUserId=${currentUser.id}`)
      const data = await response.json()
      setLessons(data.lessons || [])
    } catch (error) {
      console.error("Failed to fetch lessons:", error)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch(`/api/plans?action=getPlans`)
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    }
  }

  const handleCreateEnterprise = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createEnterprise",
          adminUserId: currentUser.id,
          ...newEnterprise
        })
      })

      if (response.ok) {
        fetchOrganizations()
        setNewEnterprise({ name: "", description: "", ownerUserId: "", plan: "free" })
        alert("Enterprise created successfully!")
      }
    } catch (error) {
      console.error("Failed to create enterprise:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLesson = async () => {
    try {
      setLoading(true)

      // Check if lesson with same title, language, and course already exists
      const existingLesson = lessons.find(lesson => 
        lesson.title === newLesson.title && 
        lesson.language === newLesson.language && 
        lesson.course === newLesson.course
      )

      if (existingLesson) {
        // Add questions to existing lesson
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addQuestionsToLesson",
            adminUserId: currentUser.id,
            lessonId: existingLesson.id,
            questions: newLesson.questions
          })
        })

        if (response.ok) {
          fetchLessons()
          setNewLesson({
            language: "spanish",
            course: "basics", 
            title: "",
            questions: [{ question: "", answer: "", options: ["", "", "", ""] }]
          })
          alert("Questions added to existing lesson successfully!")
        }
      } else {
        // Create new lesson
        const response = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createLesson",
            adminUserId: currentUser.id,
            ...newLesson
          })
        })

        if (response.ok) {
          fetchLessons()
          setNewLesson({
            language: "spanish",
            course: "basics", 
            title: "",
            questions: [{ question: "", answer: "", options: ["", "", "", ""] }]
          })
          alert("Lesson created successfully!")
        }
      }
    } catch (error) {
      console.error("Failed to create lesson:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlan = async (planName, updates) => {
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePlan",
          planName,
          updates
        })
      })

      if (response.ok) {
        // Update local state
        setPlans(plans.map(p => 
          p.name === planName ? { ...p, ...updates } : p
        ))
        setEditingPlan(null)
        alert("Plan updated successfully!")
      } else {
        alert("Failed to update plan")
      }
    } catch (error) {
      console.error("Failed to update plan:", error)
      alert("Failed to update plan")
    }
  }

  const handleDeleteEnterprise = async (enterpriseId) => {
    if (!confirm("Are you sure you want to delete this enterprise?")) return

    try {
      setLoading(true)
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteEnterprise",
          adminUserId: currentUser.id,
          enterpriseId
        })
      })

      if (response.ok) {
        fetchOrganizations()
        alert("Enterprise deleted successfully!")
      }
    } catch (error) {
      console.error("Failed to delete enterprise:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      setLoading(true)
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteUser",
          adminUserId: currentUser.id,
          userId
        })
      })

      if (response.ok) {
        fetchUsers()
        alert("User deleted successfully!")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      setLoading(true)
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteLesson",
          adminUserId: currentUser.id,
          lessonId
        })
      })

      if (response.ok) {
        fetchLessons()
        alert("Lesson deleted successfully!")
      }
    } catch (error) {
      console.error("Failed to delete lesson:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlan = async (planName) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      try {
        const response = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deletePlan",
            planName
          })
        })

        if (response.ok) {
          setPlans(plans.filter(p => p.name !== planName))
          alert("Plan deleted successfully!")
        } else {
          alert("Failed to delete plan")
        }
      } catch (error) {
        console.error("Failed to delete plan:", error)
        alert("Failed to delete plan")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-600">System management and oversight</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Crown className="h-4 w-4 mr-1" />
            Admin Access
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Organizations</p>
                  <p className="text-2xl font-bold">{stats.totalOrganizations || 0}</p>
                </div>
                <Building className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Teams</p>
                  <p className="text-2xl font-bold">{stats.totalTeams || 0}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Lessons</p>
                  <p className="text-2xl font-bold">{stats.totalLessons || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === "enterprises" ? "default" : "outline"}
            onClick={() => setActiveTab("enterprises")}
          >
            <Building className="h-4 w-4 mr-2" />
            Organizations
          </Button>
          <Button
            variant={activeTab === "lessons" ? "default" : "outline"}
            onClick={() => setActiveTab("lessons")}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Study Materials
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button
            variant={activeTab === "plans" ? "default" : "outline"}
            onClick={() => setActiveTab("plans")}
          >
            <Crown className="h-4 w-4 mr-2" />
            Plans
          </Button>
        </div>

        {/* Content */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">System is running smoothly. All services operational.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "enterprises" && (
          <div className="space-y-6">
            {/* Create Enterprise */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Enterprise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Enterprise name"
                    value={newEnterprise.name}
                    onChange={(e) => setNewEnterprise({...newEnterprise, name: e.target.value})}
                  />
                  <Select value={newEnterprise.plan} onValueChange={(value) => setNewEnterprise({...newEnterprise, plan: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Plan</SelectItem>
                      <SelectItem value="pro">Professional Plan</SelectItem>
                      <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Description"
                  value={newEnterprise.description}
                  onChange={(e) => setNewEnterprise({...newEnterprise, description: e.target.value})}
                />
                <Select value={newEnterprise.ownerUserId} onValueChange={(value) => setNewEnterprise({...newEnterprise, ownerUserId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateEnterprise} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Enterprise
                </Button>
              </CardContent>
            </Card>

            {/* Organizations List */}
            <Card>
              <CardHeader>
                <CardTitle>All Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {organizations.map(org => (
                    <div key={org.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">{org.name}</h3>
                          <p className="text-sm text-gray-600">{org.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{org.plan || 'free'}</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setViewingEnterprise(org)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteEnterprise(org.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "lessons" && (
          <div className="space-y-6">
            {/* Create Lesson */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Lesson</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={newLesson.language} onValueChange={(value) => setNewLesson({...newLesson, language: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newLesson.course} onValueChange={(value) => setNewLesson({...newLesson, course: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basics">Basics</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="colors">Colors</SelectItem>
                      <SelectItem value="numbers">Numbers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Lesson title"
                    value={newLesson.title}
                    onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                  />
                </div>

                {newLesson.questions.map((q, index) => (
                  <Card key={index} className="p-4">
                    <Input
                      placeholder="Question"
                      value={q.question}
                      onChange={(e) => {
                        const questions = [...newLesson.questions]
                        questions[index].question = e.target.value
                        setNewLesson({...newLesson, questions})
                      }}
                      className="mb-2"
                    />
                    <Input
                      placeholder="Correct answer"
                      value={q.answer}
                      onChange={(e) => {
                        const questions = [...newLesson.questions]
                        questions[index].answer = e.target.value
                        setNewLesson({...newLesson, questions})
                      }}
                      className="mb-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((option, optIndex) => (
                        <Input
                          key={optIndex}
                          placeholder={`Option ${optIndex + 1}`}
                          value={option}
                          onChange={(e) => {
                            const questions = [...newLesson.questions]
                            questions[index].options[optIndex] = e.target.value
                            setNewLesson({...newLesson, questions})
                          }}
                        />
                      ))}
                    </div>
                  </Card>
                ))}

                <Button onClick={handleCreateLesson} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lesson
                </Button>
              </CardContent>
            </Card>

            {/* Lessons List */}
            <Card>
              <CardHeader>
                <CardTitle>All Lessons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map(lesson => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <p className="text-sm text-gray-600">{lesson.language} - {lesson.course}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{lesson.questions?.length || 0} questions</Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setViewingLesson(lesson)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-600">@{user.username} • {user.language}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{user.plan || "free"}</Badge>
                      {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "plans" && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map(plan => (
                  <div key={plan.name} className="p-4 border rounded-lg">
                    {editingPlan === plan.name ? (
                      <div className="space-y-3">
                        <Input
                          value={plan.price || 0}
                          onChange={(e) => {
                            const updatedPlans = plans.map(p => 
                              p.name === plan.name ? {...p, price: parseFloat(e.target.value) || 0} : p
                            )
                            setPlans(updatedPlans)
                          }}
                          type="number"
                          step="0.01"
                          placeholder="Price"
                        />
                        <Input
                          value={Array.isArray(plan.features) ? plan.features.join(', ') : ''}
                          onChange={(e) => {
                            const updatedPlans = plans.map(p => 
                              p.name === plan.name ? {...p, features: e.target.value.split(', ').filter(f => f.trim())} : p
                            )
                            setPlans(updatedPlans)
                          }}
                          placeholder="Features (comma separated)"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => {
                            const currentPlan = plans.find(p => p.name === plan.name)
                            handleUpdatePlan(plan.name, {
                              price: currentPlan.price,
                              features: currentPlan.features
                            })
                          }}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" onClick={() => setEditingPlan(null)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleDeletePlan(plan.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold capitalize">{plan.name} Plan</h3>
                          <p className="text-gray-600">${plan.price}/month</p>
                          <p className="text-sm text-gray-500">{plan.features?.join(', ')}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingPlan(plan.name)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enterprise Details Modal */}
        {viewingEnterprise && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle>Enterprise Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Name</h3>
                    <p>{viewingEnterprise.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p>{viewingEnterprise.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Plan</h3>
                    <Badge variant="secondary" className="capitalize">{viewingEnterprise.plan || 'free'}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">Created</h3>
                    <p>{new Date(viewingEnterprise.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button onClick={() => setViewingEnterprise(null)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lesson Details Modal */}
        {viewingLesson && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-96 overflow-y-auto">
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Title</h3>
                    <p>{viewingLesson.title}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Language & Course</h3>
                    <p>{viewingLesson.language} - {viewingLesson.course}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Questions</h3>
                    <div className="space-y-2">
                      {viewingLesson.questions?.map((q, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded">
                          <p className="font-medium">{q.question}</p>
                          {q.options && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Options:</p>
                              <ul className="list-disc list-inside text-sm">
                                {q.options.map((option, i) => (
                                  <li key={i} className={q.correct === i ? "text-green-600 font-medium" : ""}>
                                    {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {q.correctAnswer && (
                            <p className="text-sm text-green-600 mt-1">Answer: {q.correctAnswer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => setViewingLesson(null)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}