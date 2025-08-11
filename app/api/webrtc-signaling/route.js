
import { NextResponse } from 'next/server'

// Store active connections (in production, use Redis or a proper storage)
let connections = new Map()

export async function POST(req) {
  try {
    const { type, data, from, to } = await req.json()

    // Store the signaling message for the target user
    const targetConnections = connections.get(to) || []
    targetConnections.push({
      type,
      data,
      from,
      timestamp: Date.now()
    })
    connections.set(to, targetConnections)

    // In a real app, you would use WebSockets or Server-Sent Events
    // to immediately notify the target user
    
    return NextResponse.json({ 
      success: true, 
      message: 'Signaling message sent' 
    })

  } catch (error) {
    console.error("WebRTC signaling error:", error)
    return NextResponse.json({ 
      error: "Signaling failed" 
    }, { status: 500 })
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get pending messages for the user
    const userMessages = connections.get(userId) || []
    
    // Clear the messages after retrieving them
    connections.set(userId, [])

    return NextResponse.json({ 
      messages: userMessages 
    })

  } catch (error) {
    console.error("WebRTC signaling get error:", error)
    return NextResponse.json({ 
      error: "Failed to get messages" 
    }, { status: 500 })
  }
}
