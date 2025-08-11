
import clientPromise from "@/lib/mongodb"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  const client = await clientPromise
  const db = client.db("sayHi")
  const usersCollection = db.collection("users")
  const datingProfilesCollection = db.collection("datingProfiles")
  const datingLikesCollection = db.collection("datingLikes")
  const datingMatchesCollection = db.collection("datingMatches")

  if (action === "getProfile") {
    const profile = await datingProfilesCollection.findOne({ userId })
    return Response.json({ profile })
  }

  if (action === "getPotentialMatches") {
    // Get users who have dating profiles and haven't been liked by current user
    const currentUserLikes = await datingLikesCollection.find({ fromUserId: userId }).toArray()
    const likedUserIds = currentUserLikes.map(like => like.toUserId)
    
    // Get current user's matches to exclude them
    const userMatches = await datingMatchesCollection.find({
      $or: [{ user1: userId }, { user2: userId }]
    }).toArray()
    const matchedUserIds = userMatches.map(match => 
      match.user1 === userId ? match.user2 : match.user1
    )

    // Find dating profiles excluding already liked and matched users
    const excludedIds = [...likedUserIds, ...matchedUserIds, userId]
    const potentialMatches = await datingProfilesCollection.find({
      userId: { $nin: excludedIds }
    }).toArray()

    // Get user details for each profile
    const matchesWithUserData = await Promise.all(
      potentialMatches.map(async (profile) => {
        const user = await usersCollection.findOne({ id: profile.userId })
        return { ...profile, user }
      })
    )

    return Response.json({ matches: matchesWithUserData })
  }

  if (action === "getMatches") {
    const userMatches = await datingMatchesCollection.find({
      $or: [{ user1: userId }, { user2: userId }]
    }).toArray()

    const matchesWithUserData = await Promise.all(
      userMatches.map(async (match) => {
        const partnerId = match.user1 === userId ? match.user2 : match.user1
        const partner = await usersCollection.findOne({ id: partnerId })
        const partnerProfile = await datingProfilesCollection.findOne({ userId: partnerId })
        return { 
          matchId: match.id,
          partner,
          partnerProfile,
          createdAt: match.createdAt
        }
      })
    )

    return Response.json({ matches: matchesWithUserData })
  }

  if (action === "getLikes") {
    // Get likes received by current user
    const receivedLikes = await datingLikesCollection.find({ toUserId: userId }).toArray()
    
    const likesWithUserData = await Promise.all(
      receivedLikes.map(async (like) => {
        const user = await usersCollection.findOne({ id: like.fromUserId })
        const profile = await datingProfilesCollection.findOne({ userId: like.fromUserId })
        return { ...like, user, profile }
      })
    )

    return Response.json({ likes: likesWithUserData })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()

    const client = await clientPromise
    const db = client.db("sayHi")
    const usersCollection = db.collection("users")
    const datingProfilesCollection = db.collection("datingProfiles")
    const datingLikesCollection = db.collection("datingLikes")
    const datingMatchesCollection = db.collection("datingMatches")

    if (action === "createProfile") {
      const { userId, profileData } = data
      
      const profile = {
        userId,
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await datingProfilesCollection.replaceOne(
        { userId },
        profile,
        { upsert: true }
      )

      return Response.json({ profile })
    }

    if (action === "sendLike") {
      const { fromUserId, toUserId } = data

      // Check if like already exists
      const existingLike = await datingLikesCollection.findOne({
        fromUserId,
        toUserId
      })

      if (existingLike) {
        return Response.json({ error: "Already liked" }, { status: 400 })
      }

      // Create the like
      const like = {
        id: Date.now().toString(),
        fromUserId,
        toUserId,
        createdAt: new Date().toISOString()
      }

      await datingLikesCollection.insertOne(like)

      // Check if it's a mutual like (match)
      const mutualLike = await datingLikesCollection.findOne({
        fromUserId: toUserId,
        toUserId: fromUserId
      })

      if (mutualLike) {
        // Create a match
        const match = {
          id: Date.now().toString(),
          user1: fromUserId,
          user2: toUserId,
          createdAt: new Date().toISOString()
        }

        await datingMatchesCollection.insertOne(match)

        // Create notifications for both users
        const fromUser = await usersCollection.findOne({ id: fromUserId })
        const toUser = await usersCollection.findOne({ id: toUserId })

        await db.collection("notifications").insertMany([
          {
            type: "dating_match",
            recipientId: toUserId,
            senderId: fromUserId,
            message: `You matched with ${fromUser.name}!`,
            relatedId: match.id,
            read: false,
            createdAt: new Date()
          },
          {
            type: "dating_match",
            recipientId: fromUserId,
            senderId: toUserId,
            message: `You matched with ${toUser.name}!`,
            relatedId: match.id,
            read: false,
            createdAt: new Date()
          }
        ])

        return Response.json({ like, match })
      }

      return Response.json({ like })
    }

    if (action === "respondToLike") {
      const { likeId, response, currentUserId } = data

      const like = await datingLikesCollection.findOne({ id: likeId })
      if (!like) {
        return Response.json({ error: "Like not found" }, { status: 404 })
      }

      if (response === "accept") {
        // Create a match
        const match = {
          id: Date.now().toString(),
          user1: like.fromUserId,
          user2: currentUserId,
          createdAt: new Date().toISOString()
        }

        await datingMatchesCollection.insertOne(match)

        // Create like from current user to complete the mutual like
        const reciprocalLike = {
          id: Date.now().toString(),
          fromUserId: currentUserId,
          toUserId: like.fromUserId,
          createdAt: new Date().toISOString()
        }

        await datingLikesCollection.insertOne(reciprocalLike)

        // Create notification for the other user
        const currentUser = await usersCollection.findOne({ id: currentUserId })
        await db.collection("notifications").insertOne({
          type: "dating_match",
          recipientId: like.fromUserId,
          senderId: currentUserId,
          message: `You matched with ${currentUser.name}!`,
          relatedId: match.id,
          read: false,
          createdAt: new Date()
        })

        return Response.json({ match })
      } else {
        // For now, just remove the like (pass)
        await datingLikesCollection.deleteOne({ id: likeId })
        return Response.json({ success: true })
      }
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Dating API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
