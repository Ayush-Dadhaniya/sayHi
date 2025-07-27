import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

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

    const { searchParams } = new URL(req.url)
    const chatPartnerId = searchParams.get("chatPartnerId")
    const currentUserId = decoded.id

    const client = await clientPromise
    const db = client.db("sayHi")
    
    // Get messages between current user and chat partner
    const messages = await db.collection("messages")
      .find({
        $or: [
          { fromUserId: currentUserId, toUserId: chatPartnerId },
          { fromUserId: chatPartnerId, toUserId: currentUserId }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray()

    return Response.json({ messages })
  } catch (error) {
    console.error("Get messages error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req) {
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

    const { toUserId, message, translatedMessage, fromLanguage, toLanguage, mediaUrl, mediaType } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    const usersCollection = db.collection("users")
    
    // Get sender and recipient info
    const sender = await usersCollection.findOne({ id: decoded.id })
    const recipient = await usersCollection.findOne({ id: toUserId })
    
    if (!sender || !recipient) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }
    
    // Create the message
    const newMessage = {
      id: Date.now().toString(),
      fromUserId: decoded.id,
      toUserId: toUserId,
      message: message,
      translatedMessage: translatedMessage || message,
      mediaUrl: mediaUrl, // Add media URL if provided
      mediaType: mediaType, // Add media type if provided
      fromLanguage: fromLanguage,
      toLanguage: toLanguage,
      createdAt: new Date(),
      read: false
    }
    
    await db.collection("messages").insertOne(newMessage)
    
    // Create notification for recipient
    const notification = {
      type: "message",
      recipientId: toUserId,
      senderId: decoded.id,
      message: mediaUrl ? `${sender.name} sent you an image` : `${sender.name} sent you a message`,
      relatedId: newMessage.id,
      read: false,
      createdAt: new Date()
    }
    
    await db.collection("notifications").insertOne(notification)
    
    return Response.json({ message: newMessage })
  } catch (error) {
    console.error("Send message error:", error)
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

    const { messageId } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    
    // Mark message as read
    await db.collection("messages").updateOne(
      { id: messageId, toUserId: decoded.id },
      { $set: { read: true } }
    )
    
    return Response.json({ success: true })
  } catch (error) {
    console.error("Mark message read error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
} 