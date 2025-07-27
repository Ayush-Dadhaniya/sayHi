import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const decoded = verifyToken(token)

    if (!decoded) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user from database
    const client = await clientPromise
    const db = client.db("sayHi")
    const user = await db.collection("users").findOne({ id: decoded.id })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return Response.json({ user: userWithoutPassword })
  } catch (error) {
    console.error("Auth error:", error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 