import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { generateToken } from "@/lib/jwt"

export async function POST(req) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return Response.json({ error: "Username and password are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("sayHi")
    const user = await db.collection("users").findOne({ username })

    if (!user) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // For now, we'll store passwords as plain text (not recommended for production)
    // In production, you should hash passwords when creating users and compare hashed passwords here
    if (user.password !== password) {
      return Response.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    // Generate JWT token
    const token = generateToken(userWithoutPassword)

    return Response.json({ 
      user: userWithoutPassword,
      token: token
    })
  } catch (error) {
    console.error("Login error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
} 