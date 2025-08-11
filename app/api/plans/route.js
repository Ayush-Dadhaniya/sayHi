
import clientPromise from "@/lib/mongodb"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "1 Team",
      "Basic language learning",
      "Text chat",
      "5 team members max"
    ],
    maxTeams: 1,
    maxMembers: 5,
    hasVideoCall: false,
    hasTranslation: false
  },
  {
    id: "pro",
    name: "Professional",
    price: 9.99,
    features: [
      "5 Teams",
      "Advanced language learning",
      "Text & Voice chat",
      "Video calls",
      "Real-time translation",
      "50 team members max"
    ],
    maxTeams: 5,
    maxMembers: 50,
    hasVideoCall: true,
    hasTranslation: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 29.99,
    features: [
      "Unlimited Teams",
      "All learning features",
      "Text, Voice & Video",
      "Real-time translation",
      "Priority support",
      "Custom integrations",
      "Unlimited members"
    ],
    maxTeams: -1, // unlimited
    maxMembers: -1, // unlimited
    hasVideoCall: true,
    hasTranslation: true
  }
]

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    
    if (action === "getPlans") {
      return Response.json({ plans: PLANS })
    }
    
    if (action === "getUserPlan") {
      const userId = searchParams.get("userId")
      
      const client = await clientPromise
      const db = client.db("sayHi")
      const user = await db.collection("users").findOne({ id: userId })
      
      const userPlan = PLANS.find(p => p.id === (user?.plan || "free"))
      return Response.json({ plan: userPlan })
    }
    
    return Response.json({ plans: PLANS })
  } catch (error) {
    console.error("Plans API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { action, userId, planId } = await req.json()
    
    if (action === "upgradePlan") {
      const client = await clientPromise
      const db = client.db("sayHi")
      
      await db.collection("users").updateOne(
        { id: userId },
        { 
          $set: { 
            plan: planId,
            planUpdatedAt: new Date().toISOString()
          }
        }
      )
      
      return Response.json({ success: true })
    }
    
    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Plans API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
