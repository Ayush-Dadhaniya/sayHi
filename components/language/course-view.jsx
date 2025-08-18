import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle, Star, Award, Zap, BookOpen } from "lucide-react"

const COURSE_TYPES = [
    { id: "basics", name: "Basics", icon: BookOpen, totalLessons: 3, color: "bg-blue-500" },
    { id: "food", name: "Food", icon: BookOpen, totalLessons: 2, color: "bg-red-500" },
    { id: "family", name: "Family", icon: BookOpen, totalLessons: 6, color: "bg-green-500" },
    { id: "colors", name: "Colors", icon: BookOpen, totalLessons: 3, color: "bg-yellow-500" },
    { id: "numbers", name: "Numbers", icon: BookOpen, totalLessons: 4, color: "bg-purple-500" },
]

export default function CourseView({ 
    selectedLanguage, 
    progress, 
    userScores, 
    onBack, 
    onStartLesson,
    loading
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6 p-4 bg-white rounded-2xl shadow-md">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="text-4xl">{selectedLanguage?.flag}</span>
                            {selectedLanguage?.displayName} Course
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-semibold">
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-5 w-5" />
                            <span>{progress?.level || 1}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-500">
                            <Zap className="h-5 w-5" />
                            <span>{progress?.xp || 0} XP</span>
                        </div>
                    </div>
                </header>

                {/* Path-based Lesson Progression */}
                <div className="relative py-12">
                    {/* The Path */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gray-200" />

                    {COURSE_TYPES.map((course, index) => {
                        const courseProgress = progress?.courses?.[course.id] || { completed: 0, total: course.totalLessons }
                        const isCompleted = courseProgress.completed === course.totalLessons
                        const isUnlocked = index === 0 || (progress?.courses && progress.courses[COURSE_TYPES[index - 1].id]?.completed > 0)
                        
                        const alignment = index % 2 === 0 ? "left" : "right"

                        return (
                            <div 
                                key={course.id}
                                className={`relative mb-12 flex items-center ${alignment === 'left' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div className={`w-5/12 ${alignment === 'left' ? 'text-right pr-8' : 'text-left pl-8'}`}>
                                    <h3 className="text-xl font-bold text-gray-700">{course.name}</h3>
                                    <p className="text-sm text-gray-500">{courseProgress.completed}/{course.totalLessons} Lessons</p>
                                </div>

                                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                                    <button
                                        onClick={() => isUnlocked && !loading && onStartLesson(course)}
                                        disabled={!isUnlocked || loading}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform duration-200
                                            ${isUnlocked ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}
                                            ${isCompleted ? 'bg-green-500' : isUnlocked ? course.color : 'bg-gray-400'}
                                        `}
                                    >
                                        {isCompleted ? <CheckCircle className="w-10 h-10" /> : <course.icon className="w-10 h-10" />}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* User Stats */}
                {userScores && (
                    <Card className="mt-8 rounded-2xl shadow-lg">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-4 text-center text-gray-700">Your Performance</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <StatBox label="Tests Done" value={userScores.testsCompleted || 0} />
                                <StatBox label="Avg Score" value={`${userScores.averageScore || 0}%`} />
                                <StatBox label="Best Score" value={`${userScores.bestScore || 0}%`} />
                                <StatBox label="Total Points" value={userScores.totalScore || 0} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

const StatBox = ({ label, value }) => (
    <div className="p-4 bg-gray-100 rounded-lg">
        <div className="text-3xl font-bold text-blue-600">{value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
)
