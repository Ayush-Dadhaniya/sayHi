
import clientPromise from "@/lib/mongodb"

const AI_PERSONALITIES = {
  friendly: "You are a friendly language learning assistant. Be encouraging and patient.",
  professional: "You are a professional language tutor. Be formal and structured.",
  conversational: "You are a casual conversation partner. Be natural and relaxed."
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  const client = await clientPromise
  const db = client.db("sayHi")

  if (action === "getConversations") {
    const conversations = await db.collection("aiConversations")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return Response.json({ conversations })
  }

  if (action === "getCertifications") {
    const certifications = await db.collection("certifications")
      .find({ userId })
      .toArray()

    return Response.json({ certifications })
  }

  if (action === "getTutoringSessions") {
    const sessions = await db.collection("tutoringSessions")
      .find({ $or: [{ studentId: userId }, { tutorId: userId }] })
      .sort({ scheduledAt: 1 })
      .toArray()

    const sessionsWithUsers = await Promise.all(
      sessions.map(async (session) => {
        const student = await db.collection("users").findOne({ id: session.studentId })
        const tutor = await db.collection("users").findOne({ id: session.tutorId })
        return { ...session, student, tutor }
      })
    )

    return Response.json({ sessions: sessionsWithUsers })
  }

  if (action === "getVoiceAssessments") {
    const assessments = await db.collection("voiceAssessments")
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return Response.json({ assessments })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()
    const client = await clientPromise
    const db = client.db("sayHi")

    if (action === "chatWithAI") {
      const { userId, language, message, personality = "friendly" } = data
      
      // Check user's subscription status
      const user = await db.collection("users").findOne({ id: userId })
      if (!user?.subscription || user.subscription.type === "free") {
        return Response.json({ error: "Premium subscription required" }, { status: 403 })
      }

      // Simulate AI response (replace with actual AI service call)
      const aiResponse = await generateAIResponse(message, language, personality)
      
      let conversation = await db.collection("aiConversations").findOne({ 
        userId, 
        language,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
      })

      if (!conversation) {
        conversation = {
          id: Date.now().toString(),
          userId,
          language,
          messages: [],
          createdAt: new Date().toISOString()
        }
      }

      conversation.messages.push(
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() }
      )

      await db.collection("aiConversations").replaceOne(
        { id: conversation.id },
        conversation,
        { upsert: true }
      )

      return Response.json({ response: aiResponse, conversation })
    }

    if (action === "generateCertification") {
      const { userId, courseId, language } = data
      
      // Check if user completed the course
      const progress = await db.collection("learningProgress").findOne({ userId, language })
      if (!progress || Object.keys(progress.courses).length < 3) {
        return Response.json({ error: "Course not completed" }, { status: 400 })
      }

      const certificationId = `CERT-${userId}-${courseId}-${Date.now()}`
      const qrCode = `https://sayhi-verify.com/cert/${certificationId}`
      
      const certification = {
        id: Date.now().toString(),
        userId,
        courseId,
        language,
        certificationId,
        qrCode,
        issuedAt: new Date().toISOString(),
        verificationUrl: qrCode
      }

      await db.collection("certifications").insertOne(certification)
      return Response.json({ certification })
    }

    if (action === "scheduleSession") {
      const { studentId, tutorId, language, scheduledAt, duration, price } = data
      
      const session = {
        id: Date.now().toString(),
        studentId,
        tutorId,
        language,
        scheduledAt,
        duration,
        price,
        status: "scheduled",
        createdAt: new Date().toISOString()
      }

      await db.collection("tutoringSessions").insertOne(session)
      return Response.json({ session })
    }

    if (action === "assessPronunciation") {
      const { userId, language, text, audioUrl } = data
      
      // Simulate voice assessment (replace with actual AI service)
      const score = Math.floor(Math.random() * 40) + 60 // 60-100
      const feedback = generatePronunciationFeedback(score)
      
      const assessment = {
        id: Date.now().toString(),
        userId,
        language,
        text,
        audioUrl,
        score,
        feedback,
        createdAt: new Date().toISOString()
      }

      await db.collection("voiceAssessments").insertOne(assessment)
      return Response.json({ assessment })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Premium API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateAIResponse(message, language, personality) {
  // This would integrate with actual AI service like OpenAI
  const prompt = `${AI_PERSONALITIES[personality]} Respond in ${language} to: ${message}`
  
  // Placeholder response
  const responses = {
    spanish: "¡Hola! Me alegra que estés practicando español. ¿Cómo puedo ayudarte hoy?",
    french: "Bonjour ! Je suis ravi de vous aider à pratiquer le français. Comment allez-vous ?",
    german: "Hallo! Es freut mich, dass Sie Deutsch üben. Wie kann ich Ihnen heute helfen?"
  }
  
  return responses[language.toLowerCase()] || "Hello! I'm here to help you practice. How are you today?"
}

function generatePronunciationFeedback(score) {
  if (score >= 90) return "Excellent pronunciation! You sound very natural."
  if (score >= 80) return "Good pronunciation! Minor improvements needed."
  if (score >= 70) return "Fair pronunciation. Focus on clarity and intonation."
  return "Keep practicing! Pay attention to vowel sounds and rhythm."
}
