
import clientPromise from "@/lib/mongodb"

const LESSON_DATA = {
  spanish: {
    basics: [
      {
        id: 1,
        type: "translate",
        question: "Translate: 'Hello, how are you?'",
        options: ["Hola, ¿cómo estás?", "Adiós, gracias", "Por favor, ayuda", "No entiendo"],
        correct: 0,
        audio: "Hola, ¿cómo estás?"
      },
      {
        id: 2,
        type: "multiple_choice",
        question: "What does 'Gracias' mean?",
        options: ["Hello", "Goodbye", "Thank you", "Please"],
        correct: 2
      },
      {
        id: 3,
        type: "fill_blank",
        question: "Complete: 'Me _____ Juan' (My name is Juan)",
        options: ["llamo", "como", "soy", "tengo"],
        correct: 0
      }
    ],
    food: [
      {
        id: 4,
        type: "translate",
        question: "Translate: 'I want water'",
        options: ["Quiero agua", "Quiero comida", "Quiero café", "Quiero leche"],
        correct: 0,
        audio: "Quiero agua"
      },
      {
        id: 5,
        type: "multiple_choice",
        question: "What does 'Manzana' mean?",
        options: ["Orange", "Apple", "Banana", "Grape"],
        correct: 1
      }
    ]
  },
  french: {
    basics: [
      {
        id: 6,
        type: "translate",
        question: "Translate: 'Good morning'",
        options: ["Bonjour", "Bonsoir", "Salut", "Au revoir"],
        correct: 0,
        audio: "Bonjour"
      }
    ]
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")
  const language = searchParams.get("language")
  const course = searchParams.get("course")

  const client = await clientPromise
  const db = client.db("sayHi")
  const progressCollection = db.collection("learningProgress")
  const testsCollection = db.collection("learningTests")

  if (action === "getProgress") {
    const progress = await progressCollection.findOne({ userId, language })
    return Response.json({ progress: progress || { userId, language, courses: {}, xp: 0, level: 1, streak: 0, hearts: 5 } })
  }

  if (action === "getLessons") {
    const lessons = LESSON_DATA[language]?.[course] || []
    return Response.json({ lessons })
  }

  if (action === "getTestHistory") {
    const tests = await testsCollection.find({ userId, language, course }).sort({ createdAt: -1 }).limit(10).toArray()
    return Response.json({ tests })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()

    const client = await clientPromise
    const db = client.db("sayHi")
    const progressCollection = db.collection("learningProgress")
    const testsCollection = db.collection("learningTests")

    if (action === "updateProgress") {
      const { userId, language, course, score, totalQuestions, completedLesson } = data

      // Get current progress
      let progress = await progressCollection.findOne({ userId, language })
      
      if (!progress) {
        progress = {
          userId,
          language,
          courses: {},
          xp: 0,
          level: 1,
          streak: 0,
          hearts: 5,
          lastActivity: new Date().toISOString()
        }
      }

      // Update course progress
      if (!progress.courses[course]) {
        progress.courses[course] = { completed: 0, total: 5 } // Default total lessons
      }

      if (completedLesson) {
        progress.courses[course].completed = Math.min(
          progress.courses[course].completed + 1,
          progress.courses[course].total
        )
      }

      // Update XP and level
      const xpGained = score * 10
      progress.xp += xpGained
      progress.level = Math.floor(progress.xp / 100) + 1

      // Update streak (simple daily streak)
      const today = new Date().toDateString()
      const lastActivity = new Date(progress.lastActivity).toDateString()
      
      if (today === lastActivity) {
        // Same day, no change to streak
      } else if (new Date(today).getTime() - new Date(lastActivity).getTime() === 24 * 60 * 60 * 1000) {
        // Next day, increment streak
        progress.streak += 1
      } else {
        // Streak broken, reset
        progress.streak = 1
      }

      progress.lastActivity = new Date().toISOString()

      await progressCollection.replaceOne(
        { userId, language },
        progress,
        { upsert: true }
      )

      return Response.json({ progress })
    }

    if (action === "saveTest") {
      const { userId, language, course, answers, score, totalQuestions } = data

      const test = {
        id: Date.now().toString(),
        userId,
        language,
        course,
        answers,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        createdAt: new Date().toISOString()
      }

      await testsCollection.insertOne(test)
      return Response.json({ test })
    }

    if (action === "useHeart") {
      const { userId, language } = data

      const progress = await progressCollection.findOne({ userId, language })
      if (progress && progress.hearts > 0) {
        progress.hearts -= 1
        await progressCollection.updateOne(
          { userId, language },
          { $set: { hearts: progress.hearts } }
        )
        return Response.json({ hearts: progress.hearts })
      }

      return Response.json({ error: "No hearts remaining" }, { status: 400 })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Language Learning API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
