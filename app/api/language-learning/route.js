import clientPromise from "@/lib/mongodb";

// Helper to get DB and collections
async function getDB() {
    const client = await clientPromise;
    const db = client.db("sayHi");
    return {
        progressCollection: db.collection("learningProgress"),
        testsCollection: db.collection("learningTests"),
        lessonsCollection: db.collection("lessons"),
        userScoresCollection: db.collection("userScores"),
    };
}

// Action handlers for GET requests
const getActions = {
    async getProgress({ progressCollection, userScoresCollection }, { userId, language }) {
        const progress = await progressCollection.findOne({ userId, language });
        const userScore = await userScoresCollection.findOne({ userId, language });
        const progressData = progress || {
            userId, language, courses: {}, xp: 0, level: 1, streak: 0, hearts: 5,
        };
        if (userScore) {
            progressData.totalScore = userScore.totalScore;
            progressData.averageScore = userScore.averageScore;
            progressData.testsCompleted = userScore.testsCompleted;
        }
        return Response.json({ progress: progressData });
    },
    async getLessons({ lessonsCollection }, { language, course }) {
        const lessons = await lessonsCollection.find({ language, course }).toArray();
        const processedLessons = lessons.flatMap(lesson => 
            (lesson.questions || []).map((question, index) => ({
                id: question.id || `${lesson.id}_q${index}`,
                question: question.question,
                type: question.options ? "multiple_choice" : "writing",
                options: question.options || [],
                correct: question.options ? question.options.findIndex(opt => opt === question.answer) : undefined,
                correctAnswer: question.answer,
                audio: question.audio || question.question,
                difficulty: "beginner",
            }))
        );
        return Response.json({ lessons: processedLessons });
    },
    async getTestHistory({ testsCollection }, { userId, language, course }) {
        const tests = await testsCollection.find({ userId, language, course }).sort({ createdAt: -1 }).limit(10).toArray();
        return Response.json({ tests });
    },
    async getUserScores({ userScoresCollection }, { userId, language }) {
        const scores = await userScoresCollection.findOne({ userId, language });
        return Response.json({ scores: scores || { totalScore: 0, averageScore: 0, testsCompleted: 0 } });
    },
    async getAvailableLanguages({ lessonsCollection }) {
        const languages = await lessonsCollection.distinct("language", { "questions.0": { $exists: true } });
        return Response.json({ languages });
    },
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
            console.error(`Error in GET action '${action}':`, error);
            return Response.json({ error: "Internal Server Error" }, { status: 500 });
        }
    }
    return Response.json({ error: "Invalid action" }, { status: 400 });
}

// Action handlers for POST requests
const postActions = {
    async updateProgress({ progressCollection, userScoresCollection }, data) {
        const { userId, language, course, score, totalQuestions, completedLesson } = data;
        let progress = await progressCollection.findOne({ userId, language }) || {
            userId, language, courses: {}, xp: 0, level: 1, streak: 0, hearts: 5, lastActivity: new Date(0).toISOString()
        };

        if (completedLesson) {
            progress.courses[course] = {
                ...progress.courses[course],
                completed: Math.min((progress.courses[course]?.completed || 0) + 1, 5),
            };
        }
        
        progress.xp += score * 10;
        progress.level = Math.floor(progress.xp / 100) + 1;

        const today = new Date().toDateString();
        const lastActivity = new Date(progress.lastActivity).toDateString();
        if (today !== lastActivity) {
            progress.streak = new Date(today).getTime() - new Date(lastActivity).getTime() === 24 * 60 * 60 * 1000 ? progress.streak + 1 : 1;
            progress.lastActivity = new Date().toISOString();
        }

        await progressCollection.replaceOne({ userId, language }, progress, { upsert: true });
        await updateUserScores(userScoresCollection, userId, language, score, totalQuestions);
        // Removed direct fetch to gamification API for better separation of concerns
        return Response.json({ progress });
    },
    async saveTest({ testsCollection, userScoresCollection }, data) {
        const { userId, language, course, answers, score, totalQuestions } = data;
        const test = {
            id: Date.now().toString(), userId, language, course, answers, score, totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100),
            createdAt: new Date().toISOString(),
        };
        await testsCollection.insertOne(test);
        await updateUserScores(userScoresCollection, userId, language, score, totalQuestions);
        return Response.json({ test });
    },
    async useHeart({ progressCollection }, { userId, language }) {
        const result = await progressCollection.updateOne(
            { userId, language, hearts: { $gt: 0 } },
            { $inc: { hearts: -1 } }
        );
        if (result.modifiedCount > 0) {
            const progress = await progressCollection.findOne({ userId, language });
            return Response.json({ hearts: progress.hearts });
        }
        return Response.json({ error: "No hearts remaining" }, { status: 400 });
    },
    async createLesson({ lessonsCollection }, data) {
        const { language, course, lessonData } = data;
        const lesson = {
            ...lessonData, id: Date.now().toString(), language, course, createdAt: new Date().toISOString(),
        };
        await lessonsCollection.insertOne(lesson);
        return Response.json({ lesson });
    },
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
        console.error("Language Learning API POST error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

async function updateUserScores(userScoresCollection, userId, language, score, totalQuestions) {
    const percentage = Math.round((score / totalQuestions) * 100);
    await userScoresCollection.updateOne(
        { userId, language },
        {
            $inc: {
                totalScore: score,
                testsCompleted: 1,
            },
            $max: { bestScore: percentage },
            $min: { worstScore: percentage },
            $set: { lastUpdated: new Date().toISOString() },
            $setOnInsert: { userId, language, averageScore: 0 },
        },
        { upsert: true }
    );
    // Recalculate average score separately to avoid race conditions
    const userScore = await userScoresCollection.findOne({ userId, language });
    const averageScore = Math.round((userScore.totalScore / userScore.testsCompleted) * 100) / 100;
    await userScoresCollection.updateOne({ userId, language }, { $set: { averageScore } });
}