import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Volume2, Check, X } from "lucide-react"

export default function LessonView({
    lessons,
    currentQuestion,
    onBack,
    userAnswer,
    setUserAnswer,
    showResult,
    handleAnswer,
    answers,
    playAudio
}) {
    if (lessons.length === 0) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 flex items-center justify-center">
            <div className="text-center text-gray-700">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-6"></div>
              <p className="text-xl font-semibold">Loading your lesson...</p>
            </div>
          </div>
        )
    }

    const question = lessons[currentQuestion]
    const isCorrect = showResult && answers[answers.length - 1]?.correct;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 sm:p-6 flex flex-col">
        {/* Header */}
        <header className="w-full max-w-4xl mx-auto flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-white/50 hover:bg-white/80">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Progress value={((currentQuestion + 1) / lessons.length) * 100} className="h-4 flex-1" />
            <span className="text-lg font-bold text-gray-700">
                {currentQuestion + 1} / {lessons.length}
            </span>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-10">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-6">{question.question}</h2>
                  
                  {question.audio && (
                    <div className="text-center mb-8">
                        <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => playAudio(question.audio)}
                            className="rounded-full py-3 px-6 text-lg"
                        >
                            <Volume2 className="h-6 w-6 mr-3" />
                            Listen
                        </Button>
                    </div>
                  )}

                  {question.type === "writing" ? (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Your answer in English..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showResult}
                        className="w-full p-4 text-xl border-2 focus:border-purple-500 focus:ring-purple-500 rounded-lg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && userAnswer.trim() && !showResult) {
                            handleAnswer(null, userAnswer)
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleAnswer(null, userAnswer)}
                        disabled={showResult || !userAnswer.trim()}
                        className="w-full py-3 text-lg font-bold bg-purple-600 hover:bg-purple-700 rounded-lg"
                      >
                        Check Answer
                      </Button>
                    </div>
                  ) : question && question.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {question.options.map((option, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className={`w-full text-left justify-center p-4 h-auto text-lg font-semibold rounded-lg border-2 transition-all duration-200
                              ${showResult ? 
                                  (index === question.correct ? "bg-green-100 border-green-500 text-green-800" : "bg-red-100 border-red-500 text-red-800")
                                  : "hover:bg-purple-50 hover:border-purple-400"
                              }
                            `}
                            onClick={() => !showResult && handleAnswer(index)}
                            disabled={showResult}
                          >
                            {option}
                          </Button>
                        ))
                      }
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Question not available.</p>
                  )}
                </CardContent>

                {/* Footer with result */}
                {showResult && (
                    <footer className={`p-6 text-center text-white text-xl font-bold
                        ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
                    `}>
                        {isCorrect ? (
                            <div className="flex items-center justify-center gap-3">
                                <Check className="h-8 w-8" />
                                <span>Excellent! You earned +10 XP</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-3">
                                <X className="h-8 w-8" />
                                <span>Correct answer: {question.correctAnswer || question.options[question.correct]}</span>
                            </div>
                        )}
                    </footer>
                )}
            </Card>
        </main>
      </div>
    )
}
