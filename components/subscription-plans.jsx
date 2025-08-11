
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Check, 
  Star,
  Zap,
  Crown,
  Users,
  Video,
  MessageCircle,
  Globe,
  Shield
} from "lucide-react"

export default function SubscriptionPlans({ currentUser, onBack }) {
  const [plans, setPlans] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPlans()
    fetchCurrentPlan()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans?action=getPlans")
      const data = await response.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error("Failed to fetch plans:", error)
    }
  }

  const fetchCurrentPlan = async () => {
    try {
      const response = await fetch(`/api/plans?action=getUserPlan&userId=${currentUser.id}`)
      const data = await response.json()
      setCurrentPlan(data.plan)
    } catch (error) {
      console.error("Failed to fetch current plan:", error)
    }
  }

  const handleUpgrade = async (planId) => {
    try {
      setLoading(true)
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upgradePlan",
          userId: currentUser.id,
          planId
        })
      })
      
      if (response.ok) {
        fetchCurrentPlan()
        alert("Plan upgraded successfully!")
      }
    } catch (error) {
      console.error("Failed to upgrade plan:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "free": return <Star className="h-6 w-6" />
      case "pro": return <Zap className="h-6 w-6" />
      case "enterprise": return <Crown className="h-6 w-6" />
      default: return <Star className="h-6 w-6" />
    }
  }

  const getPlanColor = (planId) => {
    switch (planId) {
      case "free": return "from-gray-500 to-gray-600"
      case "pro": return "from-blue-500 to-blue-600"
      case "enterprise": return "from-purple-500 to-purple-600"
      default: return "from-gray-500 to-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Choose Your Plan</h1>
              <p className="text-gray-600">Unlock more features and capabilities</p>
            </div>
          </div>
          {currentPlan && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Current: {currentPlan.name} Plan
            </Badge>
          )}
        </div>

        {/* Current Plan Info */}
        {currentPlan && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${getPlanColor(currentPlan.id)} text-white`}>
                    {getPlanIcon(currentPlan.id)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentPlan.name} Plan</h3>
                    <p className="text-gray-600">
                      ${currentPlan.price}/month • {currentPlan.maxTeams === -1 ? "Unlimited" : currentPlan.maxTeams} teams
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.id === "pro" ? "ring-2 ring-blue-500 scale-105" : ""} ${currentPlan?.id === plan.id ? "bg-green-50 border-green-200" : ""}`}
            >
              {plan.id === "pro" && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-4 p-4 rounded-full bg-gradient-to-r ${getPlanColor(plan.id)} text-white w-fit`}>
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-lg text-gray-600 font-normal">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t">
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {plan.maxMembers === -1 ? "Unlimited" : plan.maxMembers} members per team
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Text chat included</span>
                    </div>
                    {plan.hasVideoCall && (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>Video calls</span>
                      </div>
                    )}
                    {plan.hasTranslation && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Real-time translation</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  className={`w-full mt-6 ${plan.id === "pro" ? "bg-blue-600 hover:bg-blue-700" : plan.id === "enterprise" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  variant={currentPlan?.id === plan.id ? "outline" : "default"}
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading || currentPlan?.id === plan.id}
                >
                  {currentPlan?.id === plan.id ? "Current Plan" : loading ? "Processing..." : `Upgrade to ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Feature</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="text-center p-2">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="space-y-2">
                  <tr className="border-b">
                    <td className="p-2 font-medium">Teams</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center p-2">
                        {plan.maxTeams === -1 ? "Unlimited" : plan.maxTeams}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Members per team</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center p-2">
                        {plan.maxMembers === -1 ? "Unlimited" : plan.maxMembers}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Video calls</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center p-2">
                        {plan.hasVideoCall ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : "❌"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Real-time translation</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center p-2">
                        {plan.hasTranslation ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : "❌"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
