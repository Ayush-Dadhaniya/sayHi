
import clientPromise from "@/lib/mongodb"

const BADGE_TYPES = {
  LESSON_COMPLETE: 'lesson_complete',
  FRIEND_MAKER: 'friend_maker',
  HELPER: 'helper',
  STREAK_MASTER: 'streak_master',
  CONVERSATION_STARTER: 'conversation_starter',
  LANGUAGE_EXPLORER: 'language_explorer'
}

const BADGE_REQUIREMENTS = {
  [BADGE_TYPES.LESSON_COMPLETE]: { threshold: 10, points: 50 },
  [BADGE_TYPES.FRIEND_MAKER]: { threshold: 5, points: 30 },
  [BADGE_TYPES.HELPER]: { threshold: 3, points: 40 },
  [BADGE_TYPES.STREAK_MASTER]: { threshold: 7, points: 100 },
  [BADGE_TYPES.CONVERSATION_STARTER]: { threshold: 20, points: 60 },
  [BADGE_TYPES.LANGUAGE_EXPLORER]: { threshold: 3, points: 80 }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")

  const client = await clientPromise
  const db = client.db("sayHi")

  if (action === "getStreak") {
    const streak = await db.collection("userStreaks").findOne({ userId })
    return Response.json({ streak: streak || { currentStreak: 0, longestStreak: 0 } })
  }

  if (action === "getBadges") {
    const badges = await db.collection("userBadges").find({ userId }).sort({ earnedAt: -1 }).toArray()
    return Response.json({ badges })
  }

  if (action === "getLeaderboard") {
    const type = searchParams.get("type") || "weekly"
    const leaderboard = await db.collection("leaderboards")
      .find({})
      .sort({ [type === "weekly" ? "weeklyPoints" : "monthlyPoints"]: -1 })
      .limit(50)
      .toArray()

    // Get user details for each entry
    const usersCollection = db.collection("users")
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await usersCollection.findOne({ id: entry.userId })
        return { ...entry, user }
      })
    )

    return Response.json({ leaderboard: leaderboardWithUsers })
  }

  if (action === "getUserPoints") {
    const userPoints = await db.collection("leaderboards").findOne({ userId })
    return Response.json({ points: userPoints || { points: 0, weeklyPoints: 0, monthlyPoints: 0 } })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}

export async function POST(req) {
  try {
    const { action, ...data } = await req.json()
    const client = await clientPromise
    const db = client.db("sayHi")

    if (action === "updateStreak") {
      const { userId } = data
      const today = new Date().toDateString()
      
      let streak = await db.collection("userStreaks").findOne({ userId })
      
      if (!streak) {
        streak = { userId, currentStreak: 1, longestStreak: 1, lastActivityDate: today, weeklyStreak: 1, monthlyStreak: 1 }
      } else {
        const lastActivity = new Date(streak.lastActivityDate).getTime()
        const todayTime = new Date(today).getTime()
        const dayDiff = (todayTime - lastActivity) / (1000 * 60 * 60 * 24)
        
        if (dayDiff === 1) {
          // Consecutive day
          streak.currentStreak += 1
          streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak)
        } else if (dayDiff > 1) {
          // Streak broken
          streak.currentStreak = 1
        }
        // If same day, no change
        
        streak.lastActivityDate = today
      }

      await db.collection("userStreaks").replaceOne({ userId }, streak, { upsert: true })
      
      // Check for streak badges
      await checkAndAwardBadge(db, userId, BADGE_TYPES.STREAK_MASTER, streak.currentStreak)
      
      return Response.json({ streak })
    }

    if (action === "awardPoints") {
      const { userId, points, activity } = data
      
      let userPoints = await db.collection("leaderboards").findOne({ userId })
      
      if (!userPoints) {
        userPoints = { userId, points, weeklyPoints: points, monthlyPoints: points, rank: 0, lastUpdated: new Date().toISOString() }
      } else {
        userPoints.points += points
        userPoints.weeklyPoints += points
        userPoints.monthlyPoints += points
        userPoints.lastUpdated = new Date().toISOString()
      }

      await db.collection("leaderboards").replaceOne({ userId }, userPoints, { upsert: true })
      
      // Check for activity-based badges
      if (activity === 'lesson_complete') {
        const completedLessons = await db.collection("learningTests").countDocuments({ userId })
        await checkAndAwardBadge(db, userId, BADGE_TYPES.LESSON_COMPLETE, completedLessons)
      }
      
      return Response.json({ points: userPoints })
    }

    if (action === "awardBadge") {
      const { userId, badgeType, metadata = {} } = data
      
      // Check if user already has this badge
      const existingBadge = await db.collection("userBadges").findOne({ userId, badgeType })
      if (existingBadge) {
        return Response.json({ message: "Badge already awarded" })
      }

      const badge = {
        id: Date.now().toString(),
        userId,
        badgeType,
        earnedAt: new Date().toISOString(),
        metadata
      }

      await db.collection("userBadges").insertOne(badge)
      
      // Award points for badge
      const points = BADGE_REQUIREMENTS[badgeType]?.points || 10
      await awardPoints(db, userId, points)
      
      return Response.json({ badge })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Gamification API error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkAndAwardBadge(db, userId, badgeType, currentValue) {
  const requirement = BADGE_REQUIREMENTS[badgeType]
  if (requirement && currentValue >= requirement.threshold) {
    const existingBadge = await db.collection("userBadges").findOne({ userId, badgeType })
    if (!existingBadge) {
      const badge = {
        id: Date.now().toString(),
        userId,
        badgeType,
        earnedAt: new Date().toISOString(),
        metadata: { value: currentValue }
      }
      await db.collection("userBadges").insertOne(badge)
      await awardPoints(db, userId, requirement.points)
    }
  }
}

async function awardPoints(db, userId, points) {
  let userPoints = await db.collection("leaderboards").findOne({ userId })
  
  if (!userPoints) {
    userPoints = { userId, points, weeklyPoints: points, monthlyPoints: points, rank: 0, lastUpdated: new Date().toISOString() }
  } else {
    userPoints.points += points
    userPoints.weeklyPoints += points
    userPoints.monthlyPoints += points
    userPoints.lastUpdated = new Date().toISOString()
  }

  await db.collection("leaderboards").replaceOne({ userId }, userPoints, { upsert: true })
}
