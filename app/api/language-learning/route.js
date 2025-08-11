import clientPromise from "@/lib/mongodb"

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
  const lessonsCollection = db.collection("lessons")
  const userScoresCollection = db.collection("userScores")

  if (action === "getProgress") {
    const progress = await progressCollection.findOne({ userId, language })
    const userScore = await userScoresCollection.findOne({ userId, language })

    const progressData = progress || { 
      userId, 
      language, 
      courses: {}, 
      xp: 0, 
      level: 1, 
      streak: 0, 
      hearts: 5 
    }

    if (userScore) {
      progressData.totalScore = userScore.totalScore
      progressData.averageScore = userScore.averageScore
      progressData.testsCompleted = userScore.testsCompleted
    }

    return Response.json({ progress: progressData })
  }

  if (action === "getLessons") {
    // Get lessons from database
    const lessons = await lessonsCollection.find({ 
      language, 
      course 
    }).toArray()

    // Filter lessons that have valid questions
    const validLessons = lessons.filter(lesson => 
      lesson.questions && 
      Array.isArray(lesson.questions) && 
      lesson.questions.length > 0
    )

    // If no valid lessons found, create default ones
    if (validLessons.length === 0) {
      const defaultLessons = [
        {
          id: Date.now().toString(),
          language,
          course,
          title: "Basic Greetings",
          questions: [
            {
              id: 1,
              question: "How do you say 'Hello' in Spanish?",
              options: ["Hola", "Adiós", "Gracias", "Por favor"],
              answer: "Hola",
              audio: "/audio/spanish/hola.mp3"
            },
            {
              id: 2,
              question: "What does 'Gracias' mean?",
              options: ["Hello", "Goodbye", "Thank you", "Please"],
              answer: "Thank you",
              audio: "/audio/spanish/gracias.mp3"
            }
          ],
          createdAt: new Date().toISOString()
        }
      ]

      await lessonsCollection.insertMany(defaultLessons)
      return Response.json({ lessons: defaultLessons })
    }

    return Response.json({ lessons: validLessons })
  }

  if (action === "getTestHistory") {
    const tests = await testsCollection.find({ userId, language, course }).sort({ createdAt: -1 }).limit(10).toArray()
    return Response.json({ tests })
  }

  if (action === "getUserScores") {
    const scores = await userScoresCollection.findOne({ userId, language })
    return Response.json({ scores: scores || { totalScore: 0, averageScore: 0, testsCompleted: 0 } })
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
    const lessonsCollection = db.collection("lessons")
    const userScoresCollection = db.collection("userScores")

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
        progress.courses[course] = { completed: 0, total: 5 }
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

      // Update streak
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

      // Update user scores
      await updateUserScores(userScoresCollection, userId, language, score, totalQuestions)

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

      // Update user scores
      await updateUserScores(userScoresCollection, userId, language, score, totalQuestions)

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

    if (action === "createLesson") {
      const { language, course, lessonData } = data

      const lesson = {
        ...lessonData,
        id: Date.now().toString(),
        language,
        course,
        createdAt: new Date().toISOString()
      }

      await lessonsCollection.insertOne(lesson)
      return Response.json({ lesson })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Language Learning API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function updateUserScores(userScoresCollection, userId, language, score, totalQuestions) {
  let userScore = await userScoresCollection.findOne({ userId, language })

  if (!userScore) {
    userScore = {
      userId,
      language,
      totalScore: 0,
      averageScore: 0,
      testsCompleted: 0,
      bestScore: 0,
      worstScore: 100
    }
  }

  const percentage = Math.round((score / totalQuestions) * 100)
  userScore.totalScore += score
  userScore.testsCompleted += 1
  userScore.averageScore = Math.round((userScore.totalScore / userScore.testsCompleted) * 100) / 100
  userScore.bestScore = Math.max(userScore.bestScore, percentage)
  userScore.worstScore = Math.min(userScore.worstScore, percentage)
  userScore.lastUpdated = new Date().toISOString()

  await userScoresCollection.replaceOne(
    { userId, language },
    userScore,
    { upsert: true }
  )
}

function createDefaultLessons(language, course) {
  const lessonTemplates = {
    spanish: {
      basics: [
        {
          type: "translate",
          question: "Translate: 'Hello, how are you?'",
          options: ["Hola, ¿cómo estás?", "Adiós, gracias", "Por favor, ayuda", "No entiendo"],
          correct: 0,
          audio: "Hola, ¿cómo estás?",
          difficulty: "beginner"
        },
        {
          type: "multiple_choice",
          question: "What does 'Gracias' mean?",
          options: ["Hello", "Goodbye", "Thank you", "Please"],
          correct: 2,
          audio: "Gracias",
          difficulty: "beginner"
        },
        {
          type: "fill_blank",
          question: "Complete: 'Me _____ Juan' (My name is Juan)",
          options: ["llamo", "como", "soy", "tengo"],
          correct: 0,
          audio: "Me llamo Juan",
          difficulty: "beginner"
        },
        {
          type: "listening",
          question: "What did you hear?",
          options: ["Buenos días", "Buenas noches", "Buenas tardes", "Hasta luego"],
          correct: 0,
          audio: "Buenos días",
          difficulty: "beginner"
        },
        {
          type: "writing",
          question: "Write 'Good morning' in Spanish",
          correctAnswer: "Buenos días",
          audio: "Buenos días",
          difficulty: "beginner"
        }
      ],
      food: [
        {
          type: "translate",
          question: "Translate: 'I want water'",
          options: ["Quiero agua", "Quiero comida", "Quiero café", "Quiero leche"],
          correct: 0,
          audio: "Quiero agua",
          difficulty: "beginner"
        },
        {
          type: "multiple_choice",
          question: "What does 'Manzana' mean?",
          options: ["Orange", "Apple", "Banana", "Grape"],
          correct: 1,
          audio: "Manzana",
          difficulty: "beginner"
        }
      ]
    },
    french: {
      basics: [
        {
          type: "translate",
          question: "Translate: 'Good morning'",
          options: ["Bonjour", "Bonsoir", "Salut", "Au revoir"],
          correct: 0,
          audio: "Bonjour",
          difficulty: "beginner"
        },
        {
          type: "multiple_choice",
          question: "What does 'Merci' mean?",
          options: ["Hello", "Goodbye", "Thank you", "Please"],
          correct: 2,
          audio: "Merci",
          difficulty: "beginner"
        }
      ]
    },
    german: {
      basics: [
        {
          type: "translate",
          question: "Translate: 'Good day'",
          options: ["Guten Tag", "Gute Nacht", "Hallo", "Auf Wiedersehen"],
          correct: 0,
          audio: "Guten Tag",
          difficulty: "beginner"
        }
      ]
    }
  }

  const lessons = lessonTemplates[language]?.[course] || []
  return lessons.map((lesson, index) => ({
    ...lesson,
    id: `${language}_${course}_${index + 1}`,
    language,
    course,
    order: index + 1,
    createdAt: new Date().toISOString()
  }))
}