import clientPromise from "@/lib/mongodb"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  const client = await clientPromise
  const db = client.db("sayHi")

  if (action === "getLanguageExchangeMatches") {
    const matches = await db.collection("languageExchangeMatches")
      .find({ $or: [{ user1: userId }, { user2: userId }] })
      .toArray()

    const matchesWithUsers = await Promise.all(
      matches.map(async (match) => {
        const partnerId = match.user1 === userId ? match.user2 : match.user1
        const partner = await db.collection("users").findOne({ id: partnerId })
        return { ...match, partner }
      })
    )

    return Response.json({ matches: matchesWithUsers })
  }

  if (action === "findExchangePartners") {
    const userNative = searchParams.get("native")
    const userLearning = searchParams.get("learning")

    // Find users who are learning user's native language and speak user's learning language
    const users = await db.collection("users").find({
      id: { $ne: userId },
      language: userLearning, // They speak what user wants to learn
      // Add logic to check what they're learning matches user's native
    }).limit(20).toArray()

    return Response.json({ partners: users })
  }

  if (action === "getStudySessions") {
    const sessions = await db.collection("studySessions")
      .find({
        scheduledAt: { $gte: new Date().toISOString() },
        status: "active"
      })
      .sort({ scheduledAt: 1 })
      .toArray()

    const sessionsWithHosts = await Promise.all(
      sessions.map(async (session) => {
        const host = await db.collection("users").findOne({ id: session.hostId })
        return { ...session, host }
      })
    )

    return Response.json({ sessions: sessionsWithHosts })
  }

  if (action === "getCulturalEvents") {
    const events = await db.collection("culturalEvents")
      .find({ scheduledAt: { $gte: new Date().toISOString() } })
      .sort({ scheduledAt: 1 })
      .toArray()

    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
        const creator = await db.collection("users").findOne({ id: event.createdBy })
        return { ...event, creator }
      })
    )

    return Response.json({ events: eventsWithCreators })
  }

  if (action === "getMentorships") {
    const mentorships = await db.collection("mentorships")
      .find({ $or: [{ mentorId: userId }, { menteeId: userId }] })
      .toArray()

    const mentorshipsWithUsers = await Promise.all(
      mentorships.map(async (mentorship) => {
        const mentorId = mentorship.mentorId
        const menteeId = mentorship.menteeId
        const mentor = await db.collection("users").findOne({ id: mentorId })
        const mentee = await db.collection("users").findOne({ id: menteeId })
        return { ...mentorship, mentor, mentee }
      })
    )

    return Response.json({ mentorships: mentorshipsWithUsers })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()
    const client = await clientPromise
    const db = client.db("sayHi")
    const languageExchangeCollection = db.collection("languageExchangeMatches")
    const studySessionsCollection = db.collection("studySessions")
    const mentorshipCollection = db.collection("mentorships")

    if (action === "createLanguageExchange") {
      const { userId, partnerId, userNative, userLearning, partnerNative, partnerLearning } = data

      const match = {
        id: Date.now().toString(),
        user1: userId,
        user2: partnerId,
        user1Native: userNative,
        user1Learning: userLearning,
        user2Native: partnerNative,
        user2Learning: partnerLearning,
        status: "pending",
        createdAt: new Date().toISOString()
      }

      await db.collection("languageExchangeMatches").insertOne(match)
      return Response.json({ match })
    }

    if (action === "findLanguageExchangePartner") {
      const { userId, nativeLanguage, learningLanguage } = data

      const usersCollection = db.collection("users")

      // Find users who are learning user's native language and are native speakers of user's target language
      const potentialPartners = await usersCollection.find({
        id: { $ne: userId },
        nativeLanguage: learningLanguage,
        learningLanguages: { $in: [nativeLanguage] }
      }).limit(10).toArray()

      // Create exchange requests
      const exchangeRequests = potentialPartners.map(partner => ({
        id: Date.now().toString() + Math.random(),
        fromUserId: userId,
        toUserId: partner.id,
        type: "language_exchange",
        status: "pending",
        languages: {
          teaching: nativeLanguage,
          learning: learningLanguage
        },
        createdAt: new Date().toISOString()
      }))

      if (exchangeRequests.length > 0) {
        await languageExchangeCollection.insertMany(exchangeRequests)
      }

      return Response.json({ partners: potentialPartners, requestsSent: exchangeRequests.length })
    }

    if (action === "createStudySession") {
      const { hostId, title, description, language, scheduledAt, duration, maxParticipants } = data

      const session = {
        id: Date.now().toString(),
        hostId,
        title,
        description,
        language,
        scheduledAt,
        duration,
        maxParticipants,
        participants: [hostId],
        status: "active",
        createdAt: new Date().toISOString()
      }

      await db.collection("studySessions").insertOne(session)
      return Response.json({ session })
    }

    if (action === "joinStudySession") {
      const { sessionId, userId } = data

      const session = await studySessionsCollection.findOne({ id: sessionId })
      if (!session) {
        return Response.json({ error: "Session not found" }, { status: 404 })
      }

      // Add user to participants
      const updatedParticipants = [...(session.participants || []), userId]

      await studySessionsCollection.updateOne(
        { id: sessionId },
        { 
          $set: { 
            participants: updatedParticipants,
            updatedAt: new Date().toISOString()
          }
        }
      )

      // Create chat room for session
      const chatCollection = db.collection("sessionChats")
      await chatCollection.updateOne(
        { sessionId },
        {
          $set: {
            sessionId,
            participants: updatedParticipants,
            createdAt: session.createdAt,
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      )

      return Response.json({ 
        success: true, 
        sessionId,
        chatEnabled: true,
        videoEnabled: true,
        participantCount: updatedParticipants.length
      })
    }

    if (action === "sendSessionMessage") {
      const { sessionId, userId, message } = data

      const chatCollection = db.collection("sessionChats")
      const messagesCollection = db.collection("sessionMessages")

      const newMessage = {
        id: Date.now().toString(),
        sessionId,
        userId,
        message,
        timestamp: new Date().toISOString()
      }

      await messagesCollection.insertOne(newMessage)

      return Response.json({ message: newMessage })
    }

    if (action === "getSessionMessages") {
      const messagesCollection = db.collection("sessionMessages")

      const messages = await messagesCollection.find({ sessionId: data.sessionId })
        .sort({ timestamp: 1 })
        .toArray()

      return Response.json({ messages })
    }

    if (action === "leaveStudySession") {
      const { sessionId, userId } = data

      const session = await db.collection("studySessions").findOne({ id: sessionId })
      if (!session) {
        return Response.json({ error: "Session not found" }, { status: 404 })
      }

      const updatedParticipants = session.participants.filter(p => p !== userId)
      await db.collection("studySessions").updateOne(
        { id: sessionId },
        { $set: { participants: updatedParticipants } }
      )

      return Response.json({ success: true })
    }

    if (action === "createCulturalEvent") {
      const { title, description, language, scheduledAt, createdBy } = data

      const event = {
        id: Date.now().toString(),
        title,
        description,
        language,
        scheduledAt,
        rsvps: [],
        createdBy,
        createdAt: new Date().toISOString()
      }

      await db.collection("culturalEvents").insertOne(event)
      return Response.json({ event })
    }

    if (action === "rsvpEvent") {
      const { eventId, userId } = data

      await db.collection("culturalEvents").updateOne(
        { id: eventId },
        { $addToSet: { rsvps: userId } }
      )

      return Response.json({ success: true })
    }

    if (action === "becomeMentor") {
      const { userId, languages, skillLevel, experience, availability, bio } = data

      const mentorsCollection = db.collection("mentors")
      const usersCollection = db.collection("users")

      const mentor = {
        id: Date.now().toString(),
        userId,
        languages: Array.isArray(languages) ? languages : [languages].filter(Boolean),
        experience: skillLevel || experience || "beginner",
        availability: availability || "weekends",
        bio: bio || "",
        rating: 5.0,
        studentsCount: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      }

      await mentorsCollection.replaceOne({ userId }, mentor, { upsert: true })

      // Update user profile to include mentor status
      await usersCollection.updateOne(
        { id: userId },
        { $set: { isMentor: true } }
      )

      return Response.json({ mentor })
    }

    if (action === "findMentor") {
      const { userId, language, skillLevel } = data

      const mentorsCollection = db.collection("mentors")
      const usersCollection = db.collection("users")

      const query = {
        userId: { $ne: userId },
        isActive: true,
        languages: { $in: [language] }
      }

      if (skillLevel) {
        query.experience = skillLevel
      }

      const mentors = await mentorsCollection.find(query).limit(10).toArray()

      // Get user details for each mentor
      const mentorsWithDetails = await Promise.all(
        mentors.map(async (mentor) => {
          const user = await usersCollection.findOne({ id: mentor.userId })
          return {
            ...mentor,
            name: user?.name || 'Unknown',
            avatar: user?.avatar || '',
            username: user?.username || ''
          }
        })
      )

      return Response.json({ mentors: mentorsWithDetails })
    }

    if (action === "requestMentorship") {
      const { studentId, mentorId, language, message } = data

      const mentorshipRequest = {
        id: Date.now().toString(),
        studentId,
        mentorId,
        language,
        message: message || "",
        status: "pending",
        createdAt: new Date().toISOString()
      }

      await mentorshipCollection.insertOne(mentorshipRequest)

      return Response.json({ request: mentorshipRequest })
    }

    if (action === "createMentorship") {
      const { mentorId, menteeId, language } = data

      const mentorship = {
        id: Date.now().toString(),
        mentorId,
        menteeId,
        language,
        status: "active",
        createdAt: new Date().toISOString()
      }

      await db.collection("mentorships").insertOne(mentorship)
      return Response.json({ mentorship })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Social API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}