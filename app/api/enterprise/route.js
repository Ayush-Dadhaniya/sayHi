
import clientPromise from "@/lib/mongodb"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const enterpriseId = searchParams.get("enterpriseId")
  const userId = searchParams.get("userId")

  const client = await clientPromise
  const db = client.db("sayHi")

  if (action === "getEmployeeProgress") {
    const progress = await db.collection("enterpriseProgress")
      .find({ enterpriseId })
      .toArray()

    const progressWithUsers = await Promise.all(
      progress.map(async (p) => {
        const user = await db.collection("users").findOne({ id: p.userId })
        return { ...p, user }
      })
    )

    return Response.json({ progress: progressWithUsers })
  }

  if (action === "getCustomCourses") {
    const courses = await db.collection("customCourses")
      .find({ enterpriseId })
      .toArray()

    return Response.json({ courses })
  }

  if (action === "exportProgress") {
    const format = searchParams.get("format") || "csv"
    const progress = await db.collection("enterpriseProgress")
      .find({ enterpriseId })
      .toArray()

    const progressWithUsers = await Promise.all(
      progress.map(async (p) => {
        const user = await db.collection("users").findOne({ id: p.userId })
        return { ...p, user }
      })
    )

    if (format === "csv") {
      const csv = convertToCSV(progressWithUsers)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=progress-report.csv'
        }
      })
    }

    return Response.json({ progress: progressWithUsers })
  }

  if (action === "getAnalytics") {
    const analytics = await generateEnterpriseAnalytics(db, enterpriseId)
    return Response.json({ analytics })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()
    const client = await clientPromise
    const db = client.db("sayHi")

    if (action === "createCustomCourse") {
      const { enterpriseId, title, description, lessons, createdBy } = data
      
      const course = {
        id: Date.now().toString(),
        enterpriseId,
        title,
        description,
        lessons,
        createdBy,
        createdAt: new Date().toISOString()
      }

      await db.collection("customCourses").insertOne(course)
      return Response.json({ course })
    }

    if (action === "bulkImportUsers") {
      const { enterpriseId, users } = data
      
      const processedUsers = users.map(userData => ({
        id: Date.now().toString() + Math.random(),
        ...userData,
        enterpriseId,
        createdAt: new Date().toISOString(),
        subscription: { type: "enterprise", enterpriseId }
      }))

      await db.collection("users").insertMany(processedUsers)
      
      // Initialize progress tracking for each user
      const progressEntries = processedUsers.map(user => ({
        enterpriseId,
        userId: user.id,
        courseProgress: {},
        timeSpent: 0,
        lastActivity: new Date().toISOString()
      }))

      await db.collection("enterpriseProgress").insertMany(progressEntries)
      
      return Response.json({ imported: processedUsers.length })
    }

    if (action === "updateProgress") {
      const { enterpriseId, userId, courseProgress, timeSpent } = data
      
      await db.collection("enterpriseProgress").updateOne(
        { enterpriseId, userId },
        { 
          $set: { 
            courseProgress,
            timeSpent,
            lastActivity: new Date().toISOString()
          }
        },
        { upsert: true }
      )

      return Response.json({ success: true })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Enterprise API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateEnterpriseAnalytics(db, enterpriseId) {
  const progress = await db.collection("enterpriseProgress").find({ enterpriseId }).toArray()
  
  const analytics = {
    totalEmployees: progress.length,
    activeUsers: progress.filter(p => {
      const lastActivity = new Date(p.lastActivity)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return lastActivity > weekAgo
    }).length,
    averageTimeSpent: progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / progress.length,
    completionRates: calculateCompletionRates(progress),
    popularCourses: getPopularCourses(progress)
  }

  return analytics
}

function calculateCompletionRates(progress) {
  // Calculate completion rates for different courses
  const completionData = {}
  
  progress.forEach(p => {
    Object.keys(p.courseProgress || {}).forEach(course => {
      if (!completionData[course]) {
        completionData[course] = { completed: 0, total: 0 }
      }
      completionData[course].total++
      if (p.courseProgress[course].completed > 0) {
        completionData[course].completed++
      }
    })
  })

  return Object.keys(completionData).map(course => ({
    course,
    rate: (completionData[course].completed / completionData[course].total) * 100
  }))
}

function getPopularCourses(progress) {
  const courseActivity = {}
  
  progress.forEach(p => {
    Object.keys(p.courseProgress || {}).forEach(course => {
      courseActivity[course] = (courseActivity[course] || 0) + (p.courseProgress[course].completed || 0)
    })
  })

  return Object.entries(courseActivity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([course, activity]) => ({ course, activity }))
}

function convertToCSV(data) {
  if (!data.length) return ""
  
  const headers = ["User ID", "Name", "Email", "Last Activity", "Time Spent", "Courses Completed"]
  const rows = data.map(item => [
    item.userId,
    item.user?.name || "",
    item.user?.email || "",
    item.lastActivity,
    item.timeSpent || 0,
    Object.keys(item.courseProgress || {}).length
  ])

  return [headers, ...rows].map(row => row.join(",")).join("\n")
}
