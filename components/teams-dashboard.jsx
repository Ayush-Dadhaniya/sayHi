
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ArrowLeft, 
  Building, 
  Users, 
  Plus,
  Settings,
  Crown,
  Shield,
  UserPlus
} from "lucide-react"

export default function TeamsDashboard({ currentUser, onBack }) {
  const [activeView, setActiveView] = useState("enterprises") // enterprises, members, teams
  const [enterprises, setEnterprises] = useState([])
  const [selectedEnterprise, setSelectedEnterprise] = useState(null)
  const [enterpriseMembers, setEnterpriseMembers] = useState([])
  const [enterpriseTeams, setEnterpriseTeams] = useState([])
  const [loading, setLoading] = useState(false)
  
  const [newEnterprise, setNewEnterprise] = useState({ name: "", description: "" })
  const [newTeam, setNewTeam] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchEnterprises()
  }, [])

  const fetchEnterprises = async () => {
    try {
      const response = await fetch(`/api/enterprises?action=getUserEnterprises&userId=${currentUser.id}`)
      const data = await response.json()
      setEnterprises(data.enterprises || [])
    } catch (error) {
      console.error("Failed to fetch enterprises:", error)
    }
  }

  const fetchEnterpriseMembers = async (enterpriseId) => {
    try {
      const response = await fetch(`/api/enterprises?action=getEnterpriseMembers&enterpriseId=${enterpriseId}`)
      const data = await response.json()
      setEnterpriseMembers(data.members || [])
    } catch (error) {
      console.error("Failed to fetch members:", error)
    }
  }

  const fetchEnterpriseTeams = async (enterpriseId) => {
    try {
      const response = await fetch(`/api/enterprises?action=getEnterpriseTeams&enterpriseId=${enterpriseId}`)
      const data = await response.json()
      setEnterpriseTeams(data.teams || [])
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    }
  }

  const handleCreateEnterprise = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createEnterprise",
          userId: currentUser.id,
          ...newEnterprise
        })
      })
      
      if (response.ok) {
        fetchEnterprises()
        setNewEnterprise({ name: "", description: "" })
        alert("Enterprise created successfully!")
      }
    } catch (error) {
      console.error("Failed to create enterprise:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!selectedEnterprise) return
    
    // Check plan limits
    const userPlan = currentUser.plan || "free"
    const planLimits = {
      free: { maxTeams: 1 },
      pro: { maxTeams: 5 },
      enterprise: { maxTeams: -1 } // unlimited
    }
    
    const currentLimit = planLimits[userPlan]?.maxTeams || 1
    
    if (currentLimit !== -1 && enterpriseTeams.length >= currentLimit) {
      if (confirm(`Your ${userPlan} plan allows only ${currentLimit} team(s). Upgrade to create more teams?`)) {
        // Redirect to plans
        onBack() // Go back to dashboard
        setTimeout(() => {
          // This would trigger the subscription plans view
          window.location.hash = "plans"
        }, 100)
      }
      return
    }
    
    try {
      setLoading(true)
      const response = await fetch("/api/enterprises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTeam",
          userId: currentUser.id,
          enterpriseId: selectedEnterprise.id,
          ...newTeam
        })
      })
      
      if (response.ok) {
        fetchEnterpriseTeams(selectedEnterprise.id)
        setNewTeam({ name: "", description: "" })
        alert("Team created successfully!")
      }
    } catch (error) {
      console.error("Failed to create team:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEnterprise = (enterprise) => {
    setSelectedEnterprise(enterprise)
    fetchEnterpriseMembers(enterprise.id)
    fetchEnterpriseTeams(enterprise.id)
    setActiveView("members")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={selectedEnterprise ? () => {setSelectedEnterprise(null); setActiveView("enterprises")} : onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {selectedEnterprise ? "Back to Enterprises" : "Back"}
            </Button>
            <div className="flex items-center gap-2">
              <Building className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold">
                  {selectedEnterprise ? selectedEnterprise.name : "Teams & Organizations"}
                </h1>
                <p className="text-gray-600">
                  {selectedEnterprise ? "Manage teams and members" : "Collaborate with your teams"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!selectedEnterprise ? (
          // Enterprises View
          <div className="space-y-6">
            {/* Create Enterprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Organization name"
                    value={newEnterprise.name}
                    onChange={(e) => setNewEnterprise({...newEnterprise, name: e.target.value})}
                  />
                  <Input
                    placeholder="Description"
                    value={newEnterprise.description}
                    onChange={(e) => setNewEnterprise({...newEnterprise, description: e.target.value})}
                  />
                </div>
                <Button onClick={handleCreateEnterprise} disabled={loading}>
                  Create Organization
                </Button>
              </CardContent>
            </Card>

            {/* Enterprises Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enterprises.map(enterprise => (
                <Card key={enterprise.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSelectEnterprise(enterprise)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{enterprise.name}</span>
                      <Badge variant="outline">{enterprise.plan || "free"}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{enterprise.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        View Teams
                      </span>
                      <span className="flex items-center gap-1">
                        <Settings className="h-4 w-4" />
                        Manage
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Enterprise Details View
          <div className="space-y-6">
            {/* Navigation */}
            <div className="flex gap-2">
              <Button
                variant={activeView === "members" ? "default" : "outline"}
                onClick={() => setActiveView("members")}
              >
                <Users className="h-4 w-4 mr-2" />
                Members
              </Button>
              <Button
                variant={activeView === "teams" ? "default" : "outline"}
                onClick={() => setActiveView("teams")}
              >
                <Building className="h-4 w-4 mr-2" />
                Teams
              </Button>
            </div>

            {activeView === "members" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {enterpriseMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{member.name}</h3>
                              <p className="text-sm text-gray-600">@{member.username}</p>
                            </div>
                          </div>
                          <Badge variant={member.role === "OWNER" ? "default" : "outline"}>
                            {member.role === "OWNER" && <Crown className="h-3 w-3 mr-1" />}
                            {member.role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "teams" && (
              <div className="space-y-4">
                {/* Create Team */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Team</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Team name"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                      />
                      <Input
                        placeholder="Description"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleCreateTeam} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </CardContent>
                </Card>

                {/* Teams List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enterpriseTeams.map(team => (
                    <Card key={team.id}>
                      <CardHeader>
                        <CardTitle>{team.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{team.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            Created {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add Members
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
