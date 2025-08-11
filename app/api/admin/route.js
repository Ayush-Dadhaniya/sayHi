import clientPromise from "@/lib/mongodb"

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")
    const adminUserId = searchParams.get("adminUserId")

    const client = await clientPromise
    const db = client.db("sayHi")
    const usersCollection = db.collection("users")
    const lessonsCollection = db.collection("lessons")
    const plansCollection = db.collection("plans")

    // Check if user is admin
    const adminUser = await usersCollection.findOne({ id: adminUserId })
    if (!adminUser?.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (action === "getStats") {
      const totalUsers = await usersCollection.countDocuments({})
      const totalOrganizations = await db.collection("enterprises").countDocuments({})
      const totalTeams = await db.collection("teams").countDocuments({})
      const totalLessons = await lessonsCollection.countDocuments({})
      const totalPlans = await plansCollection.countDocuments({})

      return Response.json({
        stats: {
          totalUsers,
          totalOrganizations,
          totalTeams,
          totalLessons,
          totalPlans
        }
      })
    }

    if (action === "getOrganizations") {
      const organizations = await db.collection("enterprises").find({}).toArray()
      return Response.json({ organizations })
    }

    if (action === "getUsers") {
      const users = await usersCollection.find({ isAdmin: { $ne: true } }).toArray() // Exclude admins from normal user discovery
      return Response.json({ users })
    }

    if (action === "getLessons") {
      // Filter lessons to only include those with questions
      const lessons = await lessonsCollection.find({ "questions.0": { $exists: true } }).toArray()
      return Response.json({ lessons })
    }

    if (action === "getPlans") {
      const plans = await plansCollection.find({}).toArray()
      return Response.json({ plans })
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
    const lessonsCollection = db.collection("lessons")
    const enterprisesCollection = db.collection("enterprises")
    const membershipsCollection = db.collection("memberships")
    const plansCollection = db.collection("plans")


    // Check if user is admin
    const adminUser = await usersCollection.findOne({ id: adminUserId })
    if (!adminUser?.isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (action === "createEnterprise") {
      const { name, description, ownerUserId, plan } = data

      // Validate if ownerUserId exists and is not an admin
      const ownerUser = await usersCollection.findOne({ id: ownerUserId })
      if (!ownerUser || ownerUser.isAdmin) {
        return Response.json({ error: "Invalid owner user" }, { status: 400 })
      }

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

      await enterprisesCollection.insertOne(enterprise)

      // Create membership for owner
      const membership = {
        id: Date.now().toString() + "_membership",
        userId: ownerUserId,
        enterpriseId: enterprise.id,
        role: "OWNER",
        createdAt: new Date().toISOString()
      }

      await membershipsCollection.insertOne(membership)

      return Response.json({ enterprise })
    }

    if (action === "createLesson") {
      const { language, course, title, questions } = data

      const lesson = {
        id: Date.now().toString(),
        language,
        course,
        title,
        questions: questions || [], // Ensure questions is an array, even if empty
        createdByUserId: adminUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await lessonsCollection.insertOne(lesson)
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

    if (action === "updatePlan") {
      const { planId, updates } = data

      await plansCollection.updateOne(
        { name: planId },
        { $set: { ...updates, updatedAt: new Date().toISOString() } },
        { upsert: true }
      )

      return Response.json({ success: true })
    }

    if (action === "deleteEnterprise") {
      const { enterpriseId } = data
      await db.collection("enterprises").deleteOne({ id: enterpriseId })
      await db.collection("memberships").deleteMany({ enterpriseId })
      return Response.json({ success: true })
    }

    if (action === "deleteUser") {
      const { userId } = data
      await usersCollection.deleteOne({ id: userId })
      await db.collection("friendRequests").deleteMany({
        $or: [{ fromUserId: userId }, { toUserId: userId }]
      })
      await db.collection("friendships").deleteMany({
        $or: [{ user1: userId }, { user2: userId }]
      })
      return Response.json({ success: true })
    }

    if (action === "deleteLesson") {
      const { lessonId } = data
      await lessonsCollection.deleteOne({ id: lessonId })
      return Response.json({ success: true })
    }

    if (action === "deletePlan") {
      const { planId } = data
      await plansCollection.deleteOne({ name: planId })
      return Response.json({ success: true })
    }

    if (action === "addQuestionsToLesson") {
      const { lessonId, questions } = data
      await lessonsCollection.updateOne(
        { id: lessonId },
        { $push: { questions: { $each: questions } } }
      )
      return Response.json({ success: true })
    }

    // Handle friend requests and finding friends
    if (action === "findFriend") {
      const { searchTerm } = data
      // Search for users who are not admins and whose name or email contains the search term
      const users = await usersCollection.find({
        $and: [
          { isAdmin: { $ne: true } },
          {
            $or: [
              { name: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } }
            ]
          }
        ]
      }).project({ _id: 0, id: 1, name: 1, email: 1 }).toArray()
      return Response.json({ users })
    }

    if (action === "sendFriendRequest") {
      const { fromUserId, toUserId } = data

      // Ensure both users exist and are not admins, and are different
      const fromUser = await usersCollection.findOne({ id: fromUserId, isAdmin: { $ne: true } })
      const toUser = await usersCollection.findOne({ id: toUserId, isAdmin: { $ne: true } })

      if (!fromUser || !toUser || fromUserId === toUserId) {
        return Response.json({ error: "Invalid users for friend request" }, { status: 400 })
      }

      // Check if a request already exists or if they are already friends (simplified for now)
      const existingRequest = await db.collection("friendRequests").findOne({
        $or: [
          { senderId: fromUserId, receiverId: toUserId },
          { senderId: toUserId, receiverId: fromUserId }
        ]
      })

      if (existingRequest) {
        return Response.json({ error: "Friend request already exists or you are already friends" }, { status: 400 })
      }

      const friendRequest = {
        id: Date.now().toString(),
        senderId: fromUserId,
        receiverId: toUserId,
        status: "PENDING",
        createdAt: new Date().toISOString()
      }

      await db.collection("friendRequests").insertOne(friendRequest)
      return Response.json({ friendRequest })
    }


    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Admin API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}