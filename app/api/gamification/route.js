
import clientPromise from "@/lib/mongodb";

// --- Constants ---
const BADGE_TYPES = {
  LESSON_COMPLETE: 'lesson_complete',
  FRIEND_MAKER: 'friend_maker',
  HELPER: 'helper',
  STREAK_MASTER: 'streak_master',
  CONVERSATION_STARTER: 'conversation_starter',
  LANGUAGE_EXPLORER: 'language_explorer'
};

const BADGE_REQUIREMENTS = {
  [BADGE_TYPES.LESSON_COMPLETE]: { threshold: 10, points: 50 },
  [BADGE_TYPES.FRIEND_MAKER]: { threshold: 5, points: 30 },
  [BADGE_TYPES.HELPER]: { threshold: 3, points: 40 },
  [BADGE_TYPES.STREAK_MASTER]: { threshold: 7, points: 100 },
  [BADGE_TYPES.CONVERSATION_STARTER]: { threshold: 20, points: 60 },
  [BADGE_TYPES.LANGUAGE_EXPLORER]: { threshold: 3, points: 80 }
};

// --- Database Helper ---
async function getDB() {
    const client = await clientPromise;
    const db = client.db("sayHi");
    return {
        userStreaks: db.collection("userStreaks"),
        userBadges: db.collection("userBadges"),
        leaderboards: db.collection("leaderboards"),
        users: db.collection("users"),
        learningTests: db.collection("learningTests"),
    };
}

// --- GET Action Handlers ---
const getActions = {
    async getStreak({ userStreaks }, { userId }) {
        const streak = await userStreaks.findOne({ userId });
        return Response.json({ streak: streak || { currentStreak: 0, longestStreak: 0 } });
    },
    async getBadges({ userBadges }, { userId }) {
        const badges = await userBadges.find({ userId }).sort({ earnedAt: -1 }).toArray();
        return Response.json({ badges });
    },
    async getLeaderboard({ leaderboards, users }, { type = "weekly" }) {
        const sortKey = type === "weekly" ? "weeklyPoints" : "monthlyPoints";
        const leaderboard = await leaderboards.find({}).sort({ [sortKey]: -1 }).limit(50).toArray();
        
        const leaderboardWithUsers = await Promise.all(
            leaderboard.map(async (entry) => {
                const user = await users.findOne({ id: entry.userId }, { projection: { name: 1, username: 1 } });
                return { ...entry, user };
            })
        );
        return Response.json({ leaderboard: leaderboardWithUsers });
    },
    async getUserPoints({ leaderboards }, { userId }) {
        const userPoints = await leaderboards.findOne({ userId });
        return Response.json({ points: userPoints || { points: 0, weeklyPoints: 0, monthlyPoints: 0 } });
    }
};

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const params = Object.fromEntries(searchParams.entries());

    if (action && getActions[action]) {
        try {
            const db = await getDB();
            return await getActions[action](db, params);
        } catch (error) {
            console.error(`Gamification GET Error ('${action}'):`, error);
            return Response.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }
    return Response.json({ error: "Invalid action" }, { status: 400 });
}

// --- POST Action Handlers ---
const postActions = {
    async updateStreak(db, { userId }) {
        const today = new Date().toDateString();
        const streak = await db.userStreaks.findOne({ userId }) || {
            userId, currentStreak: 0, longestStreak: 0, lastActivityDate: null
        };

        const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate).getTime() : 0;
        const dayDiff = (new Date(today).getTime() - lastActivity) / (1000 * 60 * 60 * 24);

        if (dayDiff > 1) streak.currentStreak = 1;
        else if (dayDiff === 1) streak.currentStreak += 1;
        
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        streak.lastActivityDate = today;

        await db.userStreaks.replaceOne({ userId }, streak, { upsert: true });
        await checkAndAwardBadge(db, userId, BADGE_TYPES.STREAK_MASTER, streak.currentStreak);
        return Response.json({ streak });
    },
    async awardPoints(db, { userId, points, activity }) {
        const userPoints = await awardPoints(db, userId, points);
        if (activity === 'lesson_complete') {
            const completedLessons = await db.learningTests.countDocuments({ userId });
            await checkAndAwardBadge(db, userId, BADGE_TYPES.LESSON_COMPLETE, completedLessons);
        }
        return Response.json({ points: userPoints });
    },
    async awardBadge(db, { userId, badgeType, metadata = {} }) {
        const awarded = await checkAndAwardBadge(db, userId, badgeType, null, metadata);
        if (awarded) {
            return Response.json({ badge: awarded });
        }
        return Response.json({ message: "Badge already awarded or condition not met" });
    }
};

export async function POST(req) {
    try {
        const { action, ...data } = await req.json();
        if (action && postActions[action]) {
            const db = await getDB();
            return await postActions[action](db, data);
        }
        return Response.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Gamification POST Error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

// --- Reusable Logic Functions ---
async function checkAndAwardBadge(db, userId, badgeType, currentValue, metadata = {}) {
    const requirement = BADGE_REQUIREMENTS[badgeType];
    // If currentValue is null, it's a manual award, so we bypass threshold check
    if (currentValue !== null && (!requirement || currentValue < requirement.threshold)) {
        return null;
    }
    
    const existingBadge = await db.userBadges.findOne({ userId, badgeType });
    if (existingBadge) {
        return null;
    }

    const badge = {
        id: Date.now().toString(), userId, badgeType,
        earnedAt: new Date().toISOString(),
        metadata: { value: currentValue, ...metadata }
    };
    await db.userBadges.insertOne(badge);
    await awardPoints(db, userId, requirement?.points || 10);
    return badge;
}

async function awardPoints(db, userId, points) {
    const result = await db.leaderboards.findOneAndUpdate(
        { userId },
        { 
            $inc: { points, weeklyPoints: points, monthlyPoints: points },
            $set: { lastUpdated: new Date().toISOString() }
        },
        { upsert: true, returnDocument: 'after' }
    );
    return result.value;
}
