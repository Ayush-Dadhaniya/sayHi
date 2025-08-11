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

    const client = await clientPromise
    const db = client.db("sayHi")

    if (action === "getPlans") {
      const plansCollection = db.collection("plans")

      // Try to get plans from database first
      let dbPlans = await plansCollection.find({}).toArray()

      // If no plans in database, initialize with default plans
      if (dbPlans.length === 0) {
        await plansCollection.insertMany(PLANS)
        dbPlans = PLANS
      }

      return Response.json({ plans: dbPlans })
    }

    if (action === "getUserPlan") {
      const userId = searchParams.get("userId")

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
    const { action, ...data } = await req.json()

    const client = await clientPromise
    const db = client.db("sayHi")
    const userPlansCollection = db.collection("userPlans")
    const teamsCollection = db.collection("teams")
    const plansCollection = db.collection("plans")

    if (action === "subscribeToPlan") {
      const { userId, planId } = data

      // Get the plan details from database first, fallback to PLANS array
      let plan = await plansCollection.findOne({ id: planId })
      if (!plan) {
        plan = PLANS.find(p => p.id === planId)
      }

      if (!plan) {
        return Response.json({ error: "Plan not found" }, { status: 404 })
      }

      // Create or update user plan
      const userPlan = {
        userId,
        planId,
        planName: plan.name,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        isActive: true,
        teamsCreated: 0,
        maxTeams: plan.maxTeams || 1,
        features: plan.features || []
      }

      await userPlansCollection.replaceOne(
        { userId },
        userPlan,
        { upsert: true }
      )

      return Response.json({ userPlan })
    }

    if (action === "updatePlan") {
      const { planId, updates } = data

      const updatedPlan = {
        ...updates,
        id: planId,
        updatedAt: new Date().toISOString()
      }

      await plansCollection.replaceOne(
        { id: planId },
        updatedPlan,
        { upsert: true }
      )

      return Response.json({ plan: updatedPlan })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Plans API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}