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

  if (action === "discover") {
    const currentUserId = searchParams.get("currentUserId")
    
    // Get all users except current user
    const allUsers = await usersCollection.find({ id: { $ne: currentUserId } }).toArray()
    
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

  // Default: return all users
  const allUsers = await usersCollection.find({}).toArray()
  return Response.json({ users: allUsers })
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
        isOnline: true,
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

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
