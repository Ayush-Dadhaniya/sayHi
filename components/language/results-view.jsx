import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, RotateCcw, Star, Zap, Flame } from "lucide-react"
import { motion } from "framer-motion"

export default function ResultsView({
    score,
    lessons,
    progress,
    onContinue,
    onPracticeAgain,
}) {
    const percentage = Math.round((score / lessons.length) * 100);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4 flex items-center justify-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg"
            >
                <Card className="text-center p-8 rounded-2xl shadow-2xl">
                    <CardContent>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                        >
                            <Trophy className="h-24 w-24 mx-auto text-yellow-400" />
                        </motion.div>
                        
                        <h1 className="text-4xl font-bold text-gray-800 mt-4">Lesson Complete!</h1>
                        <p className="text-xl text-gray-600 mt-2">You scored {percentage}%</p>
                        
                        <div className="my-8">
                            <p className="text-2xl font-semibold text-purple-600">You earned <span className="font-bold">{score * 10}</span> XP!</p>
                        </div>

                        {/* Progress stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                            <StatCard icon={Zap} label="Total XP" value={progress?.xp || 0} color="text-blue-500" />
                            <StatCard icon={Star} label="Level" value={progress?.level || 1} color="text-green-500" />
                            <StatCard icon={Flame} label="Streak" value={progress?.streak || 0} color="text-orange-500" />
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={onContinue}
                                className="w-full py-3 text-lg font-bold bg-purple-600 hover:bg-purple-700 rounded-lg"
                            >
                                Continue Your Journey
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onPracticeAgain}
                                className="w-full py-3 text-lg font-semibold rounded-lg"
                            >
                                <RotateCcw className="h-5 w-5 mr-2" />
                                Practice This Lesson
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}

const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="p-4 bg-gray-100 rounded-xl">
        <Icon className={`h-8 w-8 mx-auto ${color}`} />
        <div className={`text-3xl font-bold mt-2 ${color}`}>{value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
)
