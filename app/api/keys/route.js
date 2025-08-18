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
    const userId = searchParams.get("userId")

    const client = await clientPromise
    const db = client.db("sayHi")
    const user = await db.collection("users").findOne({ id: userId })

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    return Response.json({ publicKey: user.publicKey })
  } catch (error) {
    console.error("Get public key error:", error)
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

    const { publicKey } = await req.json()
    
    const client = await clientPromise
    const db = client.db("sayHi")
    
    await db.collection("users").updateOne(
      { id: decoded.id },
      { $set: { publicKey: publicKey } }
    )
    
    return Response.json({ success: true })
  } catch (error) {
    console.error("Store public key error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
