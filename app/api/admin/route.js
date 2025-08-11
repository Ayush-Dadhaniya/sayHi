
import clientPromise from "@/lib/mongodb"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    const adminUserId = searchParams.get("adminUserId")
    
    const client = await clientPromise
    const db = client.db("sayHi")
    const usersCollection = db.collection("users")
    
    // Check if user is admin
    const adminUser = await usersCollection.findOne({ id: adminUserId })
    if (!adminUser?.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    if (action === "getStats") {
      const totalUsers = await usersCollection.countDocuments({})
      const totalOrganizations = await db.collection("enterprises").countDocuments({})
      const totalTeams = await db.collection("teams").countDocuments({})
      const totalLessons = await db.collection("lessons").countDocuments({})
      
      return Response.json({
        stats: {
          totalUsers,
          totalOrganizations,
          totalTeams,
          totalLessons
        }
      })
    }
    
    if (action === "getOrganizations") {
      const organizations = await db.collection("enterprises").find({}).toArray()
      return Response.json({ organizations })
    }
    
    if (action === "getUsers") {
      const users = await usersCollection.find({}).toArray()
      return Response.json({ users })
    }
    
    if (action === "getLessons") {
      const lessons = await db.collection("lessons").find({}).toArray()
      return Response.json({ lessons })
    }
    
    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Admin API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { action, adminUserId, ...data } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    const usersCollection = db.collection("users")
    
    // Check if user is admin
    const adminUser = await usersCollection.findOne({ id: adminUserId })
    if (!adminUser?.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    if (action === "createEnterprise") {
      const { name, description, ownerUserId, plan } = data
      
      const enterprise = {
        id: Date.now().toString(),
        name,
        description,
        createdByUserId: adminUserId,
        ownerUserId,
        plan: plan || "free",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await db.collection("enterprises").insertOne(enterprise)
      
      // Create membership for owner
      const membership = {
        id: Date.now().toString() + "_membership",
        userId: ownerUserId,
        enterpriseId: enterprise.id,
        role: "OWNER",
        createdAt: new Date().toISOString()
      }
      
      await db.collection("memberships").insertOne(membership)
      
      return Response.json({ enterprise })
    }
    
    if (action === "createLesson") {
      const { language, course, title, questions } = data
      
      const lesson = {
        id: Date.now().toString(),
        language,
        course,
        title,
        questions,
        createdByUserId: adminUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await db.collection("lessons").insertOne(lesson)
      return Response.json({ lesson })
    }
    
    if (action === "updateUserPlan") {
      const { userId, plan } = data
      
      await usersCollection.updateOne(
        { id: userId },
        { $set: { plan, updatedAt: new Date().toISOString() } }
      )
      
      return Response.json({ success: true })
    }
    
    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Admin API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
