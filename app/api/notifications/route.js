import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { ObjectId } from "mongodb"

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("sayHi")
    
    // Clean up notifications older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await db.collection("notifications").deleteMany({
      createdAt: { $lt: twentyFourHoursAgo }
    })
    
    // Get notifications for the current user
    const notifications = await db.collection("notifications")
      .find({ 
        recipientId: decoded.id,
        read: false 
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return Response.json({ notifications })
  } catch (error) {
    console.error("Get notifications error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { type, recipientId, senderId, message, relatedId } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    
    const notification = {
      type, // 'friend_request', 'message', 'profile_view', etc.
      recipientId,
      senderId,
      message,
      relatedId, // ID of related item (friend request ID, message ID, etc.)
      read: false,
      createdAt: new Date()
    }
    
    await db.collection("notifications").insertOne(notification)
    
    return Response.json({ success: true })
  } catch (error) {
    console.error("Create notification error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { notificationId } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    
    // Convert string ID to ObjectId for MongoDB query
    let objectId
    try {
      objectId = new ObjectId(notificationId)
    } catch (error) {
      return Response.json({ error: 'Invalid notification ID' }, { status: 400 })
    }
    
    // Mark notification as read
    const result = await db.collection("notifications").updateOne(
      { _id: objectId, recipientId: decoded.id },
      { $set: { read: true } }
    )
    
    if (result.matchedCount === 0) {
      return Response.json({ error: 'Notification not found' }, { status: 404 })
    }
    
    return Response.json({ success: true })
  } catch (error) {
    console.error("Mark notification read error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
} 