import clientPromise from "@/lib/mongodb"
import { generateToken } from "@/lib/jwt"

export const config = {
  api: {
    bodyParser: true,
  },
}

// Mock API for user management
const users = [
  {
    id: "1",
    name: "John Doe",
    username: "johndoe",
    language: "English",
    region: "United States",
    bio: "Love traveling and meeting new people!",
    avatar: "/placeholder-user.jpg",
    isOnline: true,
  },
  {
    id: "2",
    name: "Maria Garcia",
    username: "mariagarcia",
    language: "Spanish",
    region: "Spain",
    bio: "Hola! I'm a teacher from Madrid.",
    avatar: "/placeholder-user.jpg",
    isOnline: false,
  },
  {
    id: "3",
    name: "Raj Patel",
    username: "rajpatel",
    language: "Gujarati",
    region: "India",
    bio: "Software developer from Gujarat",
    avatar: "/placeholder-user.jpg",
    isOnline: true,
  },
  {
    id: "4",
    name: "Sophie Martin",
    username: "sophiemartin",
    language: "French",
    region: "France",
    bio: "Artist and language enthusiast",
    avatar: "/placeholder-user.jpg",
    isOnline: true,
  },
]

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  const client = await clientPromise
  const db = client.db("sayHi") // Use your DB name
  const usersCollection = db.collection("users")
  const friendRequestsCollection = db.collection("friendRequests")
  const friendshipsCollection = db.collection("friendships")
  const lessonsCollection = db.collection("lessons") // Assuming a lessons collection exists

  if (action === "discover") {
    const currentUserId = searchParams.get("currentUserId")

    // Get all users except current user and admin users
    const allUsers = await usersCollection.find({
      id: { $ne: currentUserId },
      isAdmin: { $ne: true }
    }).toArray()

    // Get existing friendships for current user
    const userFriendships = await friendshipsCollection.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }]
    }).toArray()
    const friendIds = userFriendships.map((f) => (f.user1 === currentUserId ? f.user2 : f.user1))

    // Get friend requests sent TO current user (users who have sent requests to current user)
    const receivedRequests = await friendRequestsCollection.find({
      toUserId: currentUserId,
      status: "pending"
    }).toArray()
    const receivedRequestIds = receivedRequests.map(req => req.fromUserId)

    // Get friend requests sent BY current user
    const sentRequests = await friendRequestsCollection.find({
      fromUserId: currentUserId,
      status: "pending"
    }).toArray()
    const sentRequestIds = sentRequests.map(req => req.toUserId)

    // Filter out users who are already friends, have sent requests to current user, or have received requests from current user
    const filteredUsers = allUsers.filter(user =>
      !friendIds.includes(user.id) &&
      !receivedRequestIds.includes(user.id) &&
      !sentRequestIds.includes(user.id)
    )

    return Response.json({ users: filteredUsers })
  }

  if (action === "friends") {
    // Return user's friends from MongoDB
    const userFriendships = await friendshipsCollection.find({
      $or: [{ user1: userId }, { user2: userId }]
    }).toArray()
    const friendIds = userFriendships.map((f) => (f.user1 === userId ? f.user2 : f.user1))
    const friends = await usersCollection.find({ id: { $in: friendIds } }).toArray()
    return Response.json({ friends })
  }

  if (action === "requests") {
    // Return pending friend requests for user from MongoDB
    const pendingRequests = await friendRequestsCollection.find({
      toUserId: userId,
      status: "pending"
    }).toArray()

    const requestsWithUsers = await Promise.all(
      pendingRequests.map(async (req) => ({
        ...req,
        fromUser: await usersCollection.findOne({ id: req.fromUserId }),
      }))
    )
    return Response.json({ requests: requestsWithUsers })
  }

  if (action === "sentRequests") {
    // Return sent friend requests by user from MongoDB
    const fromUserId = searchParams.get("fromUserId")
    const sentRequests = await friendRequestsCollection.find({
      fromUserId: fromUserId,
      status: "pending"
    }).toArray()

    return Response.json({ requests: sentRequests })
  }

  if (action === "findFriend") {
    const searchTerm = searchParams.get("searchTerm")
    if (!searchTerm) {
      return Response.json({ error: "Search term is required" }, { status: 400 })
    }

    // More specific search - exact matches or starts with search term
    const users = await usersCollection.find({
      $or: [
        { username: { $regex: `^${searchTerm}`, $options: "i" } }, // Username starts with search
        { name: { $regex: `^${searchTerm}`, $options: "i" } }, // Name starts with search
        { username: { $regex: searchTerm, $options: "i" } }, // Username contains search
        { name: { $regex: searchTerm, $options: "i" } } // Name contains search
      ],
      id: { $ne: userId }, // Exclude the current user
      isAdmin: { $ne: true } // Exclude admin users
    }).limit(20).toArray() // Limit results for better performance

    return Response.json({ users })
  }

  // Admin actions for lessons and plans
  if (action === "getLessons") {
    const lessons = await lessonsCollection.find({}).toArray()
    return Response.json({ lessons })
  }

  // Admin actions for enterprises (assuming an 'enterprises' collection)
  if (action === "getEnterprises") {
    const enterprisesCollection = db.collection("enterprises")
    const enterprises = await enterprisesCollection.find({}).toArray()
    return Response.json({ enterprises })
  }

  // Default: return all users (filtered for non-admins when not in admin context)
  if (action === undefined || action === null) {
    const allUsers = await usersCollection.find({ isAdmin: { $ne: true } }).toArray()
    return Response.json({ users: allUsers })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()

    if (action === "updateProfile") {
      const { userId, updates } = data

      const client = await clientPromise
      const db = client.db("sayHi")
      const usersCollection = db.collection("users")

      // Update user profile with Cloudinary URL
      await usersCollection.updateOne(
        { id: userId },
        { $set: updates }
      )

      const updatedUser = await usersCollection.findOne({ id: userId })
      return Response.json({ user: updatedUser })
    }

    if (action === "createUser") {
      const { interestedInDating, ...userData } = data
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        avatar: "/placeholder-user.jpg",
        isOnline: Math.random() > 0.3, // 70% chance of being online
        isAdmin: false, // Default to not an admin
        lastSeen: new Date().toISOString()
      }
      try {
        const client = await clientPromise
        const db = client.db("sayHi")
        const result = await db.collection("users").insertOne(newUser)

        // Create dating profile if user is interested
        if (interestedInDating) {
          const datingProfile = {
            userId: newUser.id,
            age: userData.age || 25,
            occupation: userData.occupation || "Not specified",
            bio: userData.bio || "Looking to meet new people and learn languages!",
            interests: ["Travel", "Languages", "Meeting new people"],
            lookingFor: "Friendship and language exchange",
            photos: [newUser.avatar],
            wantsDating: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          await db.collection("datingProfiles").insertOne(datingProfile)
        }

        // Generate JWT token for new user
        const userWithId = { ...newUser, _id: result.insertedId }
        const token = generateToken(userWithId)

        return Response.json({
          user: userWithId,
          token: token
        })
      } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    }

    if (action === "sendFriendRequest") {
      const { fromUserId, toUserId } = data
      try {
        const client = await clientPromise
        const db = client.db("sayHi")
        const friendRequestsCollection = db.collection("friendRequests")
        const usersCollection = db.collection("users")

        // Check if request already exists
        const existingRequest = await friendRequestsCollection.findOne({
          fromUserId: fromUserId,
          toUserId: toUserId
        })

        if (!existingRequest) {
          const newRequest = {
            id: Date.now().toString(),
            fromUserId,
            toUserId,
            status: "pending",
            createdAt: new Date().toISOString(),
          }
          await friendRequestsCollection.insertOne(newRequest)

          // Create notification for recipient
          const fromUser = await usersCollection.findOne({ id: fromUserId })
          const notification = {
            type: "friend_request",
            recipientId: toUserId,
            senderId: fromUserId,
            message: `${fromUser.name} sent you a friend request`,
            relatedId: newRequest.id,
            read: false,
            createdAt: new Date()
          }
          await db.collection("notifications").insertOne(notification)

          return Response.json({ request: newRequest })
        }

        return Response.json({ error: "Request already exists" }, { status: 400 })
      } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    }

    if (action === "respondToRequest") {
      const { requestId, response } = data
      try {
        const client = await clientPromise
        const db = client.db("sayHi")
        const friendRequestsCollection = db.collection("friendRequests")
        const friendshipsCollection = db.collection("friendships")
        const usersCollection = db.collection("users")

        const request = await friendRequestsCollection.findOne({ id: requestId })

        if (request) {
          // Update request status
          await friendRequestsCollection.updateOne(
            { id: requestId },
            { $set: { status: response } }
          )

          if (response === "accepted") {
            // Create friendship
            await friendshipsCollection.insertOne({
              id: Date.now().toString(),
              user1: request.fromUserId,
              user2: request.toUserId,
              createdAt: new Date().toISOString(),
            })

            // Create notification for the sender (who sent the original request)
            const toUser = await usersCollection.findOne({ id: request.toUserId })
            const notification = {
              type: "friend_request",
              recipientId: request.fromUserId,
              senderId: request.toUserId,
              message: `${toUser.name} accepted your friend request`,
              relatedId: requestId,
              read: false,
              createdAt: new Date()
            }
            await db.collection("notifications").insertOne(notification)
          }

          return Response.json({ request: { ...request, status: response } })
        }

        return Response.json({ error: "Request not found" }, { status: 404 })
      } catch (error) {
        return Response.json({ error: error.message }, { status: 500 })
      }
    }

    // Admin action to update lessons
    if (action === "updateLesson") {
      const { lessonId, updates } = data
      const client = await clientPromise
      const db = client.db("sayHi")
      const lessonsCollection = db.collection("lessons")

      await lessonsCollection.updateOne(
        { id: lessonId },
        { $set: updates }
      )
      const updatedLesson = await lessonsCollection.findOne({ id: lessonId })
      return Response.json({ lesson: updatedLesson })
    }

    // Admin action to create lessons
    if (action === "createLesson") {
      const { lessonData } = data
      const client = await clientPromise
      const db = client.db("sayHi")
      const lessonsCollection = db.collection("lessons")

      const newLesson = {
        id: Date.now().toString(),
        ...lessonData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const result = await lessonsCollection.insertOne(newLesson)
      return Response.json({ lesson: { ...newLesson, _id: result.insertedId } })
    }

    // Admin action to update enterprises (assuming an 'enterprises' collection)
    if (action === "updateEnterprise") {
      const { enterpriseId, updates } = data
      const client = await clientPromise
      const db = client.db("sayHi")
      const enterprisesCollection = db.collection("enterprises")

      await enterprisesCollection.updateOne(
        { id: enterpriseId },
        { $set: updates }
      )
      const updatedEnterprise = await enterprisesCollection.findOne({ id: enterpriseId })
      return Response.json({ enterprise: updatedEnterprise })
    }

    // Admin action to create enterprises (assuming an 'enterprises' collection)
    if (action === "createEnterprise") {
      const { enterpriseData } = data
      const client = await clientPromise
      const db = client.db("sayHi")
      const enterprisesCollection = db.collection("enterprises")

      const newEnterprise = {
        id: Date.now().toString(),
        ...enterpriseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const result = await enterprisesCollection.insertOne(newEnterprise)
      return Response.json({ enterprise: { ...newEnterprise, _id: result.insertedId } })
    }

    // Admin action to update plans (assuming a 'plans' collection)
    if (action === "updatePlan") {
      const { planId, updates } = data
      const client = await clientPromise
      const db = client.db("sayHi")
      const plansCollection = db.collection("plans")

      await plansCollection.updateOne(
        { id: planId },
        { $set: updates }
      )
      const updatedPlan = await plansCollection.findOne({ id: planId })
      return Response.json({ plan: updatedPlan })
    }

    // Admin action to create plans (assuming a 'plans' collection)
    if (action === "createPlan") {
      const { planData } = data
      const client = await clientPromise
      const db = client.db("sayHi")
      const plansCollection = db.collection("plans")

      const newPlan = {
        id: Date.now().toString(),
        ...planData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const result = await plansCollection.insertOne(newPlan)
      return Response.json({ plan: { ...newPlan, _id: result.insertedId } })
    }


    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}