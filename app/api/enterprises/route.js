
import clientPromise from "@/lib/mongodb"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    const userId = searchParams.get("userId")
    
    const client = await clientPromise
    const db = client.db("sayHi")
    
    if (action === "getUserEnterprises") {
      const memberships = await db.collection("memberships").find({ userId }).toArray()
      const enterpriseIds = memberships.map(m => m.enterpriseId)
      
      const enterprises = await db.collection("enterprises").find({
        id: { $in: enterpriseIds }
      }).toArray()
      
      return Response.json({ enterprises })
    }
    
    if (action === "getEnterpriseMembers") {
      const enterpriseId = searchParams.get("enterpriseId")
      const memberships = await db.collection("memberships").find({ enterpriseId }).toArray()
      const userIds = memberships.map(m => m.userId)
      
      const users = await db.collection("users").find({
        id: { $in: userIds }
      }).toArray()
      
      const membersWithRoles = users.map(user => ({
        ...user,
        role: memberships.find(m => m.userId === user.id)?.role
      }))
      
      return Response.json({ members: membersWithRoles })
    }
    
    if (action === "getEnterpriseTeams") {
      const enterpriseId = searchParams.get("enterpriseId")
      const teams = await db.collection("teams").find({ enterpriseId }).toArray()
      return Response.json({ teams })
    }
    
    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Enterprises API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { action, userId, ...data } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    
    if (action === "createEnterprise") {
      const { name, description } = data
      
      const enterprise = {
        id: Date.now().toString(),
        name,
        description,
        createdByUserId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await db.collection("enterprises").insertOne(enterprise)
      
      // Create membership for creator as owner
      const membership = {
        id: Date.now().toString() + "_membership",
        userId,
        enterpriseId: enterprise.id,
        role: "OWNER",
        createdAt: new Date().toISOString()
      }
      
      await db.collection("memberships").insertOne(membership)
      
      return Response.json({ enterprise })
    }
    
    if (action === "addMember") {
      const { enterpriseId, targetUserId, role } = data
      
      // Check if user has permission (owner/admin)
      const userMembership = await db.collection("memberships").findOne({
        userId, enterpriseId
      })
      
      if (!userMembership || !['OWNER', 'ADMIN'].includes(userMembership.role)) {
        return Response.json({ error: "Unauthorized" }, { status: 403 })
      }
      
      const membership = {
        id: Date.now().toString(),
        userId: targetUserId,
        enterpriseId,
        role: role || "MEMBER",
        createdAt: new Date().toISOString()
      }
      
      await db.collection("memberships").insertOne(membership)
      return Response.json({ membership })
    }
    
    if (action === "createTeam") {
      const { enterpriseId, name, description } = data
      
      // Check if user has permission
      const userMembership = await db.collection("memberships").findOne({
        userId, enterpriseId
      })
      
      if (!userMembership) {
        return Response.json({ error: "Unauthorized" }, { status: 403 })
      }
      
      const team = {
        id: Date.now().toString(),
        enterpriseId,
        name,
        description,
        createdByUserId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await db.collection("teams").insertOne(team)
      
      // Add creator as team lead
      const teamMembership = {
        id: Date.now().toString() + "_team",
        userId,
        teamId: team.id,
        role: "TEAM_LEAD",
        createdAt: new Date().toISOString()
      }
      
      await db.collection("teamMemberships").insertOne(teamMembership)
      
      return Response.json({ team })
    }
    
    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Enterprises API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
