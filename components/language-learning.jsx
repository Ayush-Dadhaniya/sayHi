"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  BookOpen, 
  Star, 
  Trophy, 
  CheckCircle, 
  Circle, 
  Play, 
  Volume2,
  RotateCcw,
  Flag,
  Heart,
  Flame,
  Globe,
  Target,
  Zap
} from "lucide-react"

const LANGUAGES = [
  { id: 1, name: "spanish", displayName: "Spanish", flag: "🇪🇸", difficulty: "Beginner", color: "from-red-500 to-yellow-500" },
  { id: 2, name: "french", displayName: "French", flag: "🇫🇷", difficulty: "Beginner", color: "from-blue-500 to-white" },
  { id: 3, name: "german", displayName: "German", flag: "🇩🇪", difficulty: "Intermediate", color: "from-black to-red-500" },
  { id: 4, name: "japanese", displayName: "Japanese", flag: "🇯🇵", difficulty: "Advanced", color: "from-red-600 to-white" },
  { id: 5, name: "chinese", displayName: "Chinese", flag: "🇨🇳", difficulty: "Advanced", color: "from-red-600 to-yellow-400" },
  { id: 6, name: "italian", displayName: "Italian", flag: "🇮🇹", difficulty: "Beginner", color: "from-green-500 to-white" }
]

const COURSE_TYPES = [
  { id: "basics", name: "Basics", icon: Circle, totalLessons: 3 },
  { id: "food", name: "Food", icon: Circle, totalLessons: 2 },
  { id: "family", name: "Family", icon: Circle, totalLessons: 6 },
  { id: "colors", name: "Colors", icon: Circle, totalLessons: 3 },
  { id: "numbers", name: "Numbers", icon: Circle, totalLessons: 4 },
]

export default function LanguageLearning({ currentUser, onBack }) {
  const [activeView, setActiveView] = useState("languages") // languages, course, lesson, practice, results
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState(null)
  const [userScores, setUserScores] = useState(null)
  const [loading, setLoading] = useState(false)
  const [availableLanguages, setAvailableLanguages] = useState([])

  useEffect(() => {
    fetchAvailableLanguages()
  }, [])

  useEffect(() => {
    if (selectedLanguage) {
      fetchProgress()
    }
  }, [selectedLanguage])

  const fetchAvailableLanguages = async () => {
    try {
      const response = await fetch('/api/language-learning?action=getAvailableLanguages')
      const data = await response.json()
      const languagesWithLessons = LANGUAGES.filter(lang => 
        data.languages && data.languages.includes(lang.name)
      )
      setAvailableLanguages(languagesWithLessons)
    } catch (error) {
      console.error("Failed to fetch available languages:", error)
      setAvailableLanguages(LANGUAGES) // Fallback to all languages
    }
  }

  const fetchProgress = async () => {
    try {
      const [progressResponse, scoresResponse] = await Promise.all([
        fetch(`/api/language-learning?action=getProgress&userId=${currentUser.id}&language=${selectedLanguage.name}`),
        fetch(`/api/language-learning?action=getUserScores&userId=${currentUser.id}&language=${selectedLanguage.name}`)
      ])

      const progressData = await progressResponse.json()
      const scoresData = await scoresResponse.json()

      setProgress(progressData.progress)
      setUserScores(scoresData.scores)
    } catch (error) {
      console.error("Failed to fetch progress:", error)
    }
  }

  const fetchLessons = async (course) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/language-learning?action=getLessons&language=${selectedLanguage.name}&course=${course.id}`)
      const data = await response.json()
      setLessons(data.lessons || [])
    } catch (error) {
      console.error("Failed to fetch lessons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLanguage = (language) => {
    setSelectedLanguage(language)
    setActiveView("course")
  }

  const handleStartLesson = async (course) => {
    setSelectedCourse(course)
    await fetchLessons(course)
    setActiveView("lesson")
    setCurrentQuestion(0)
    setScore(0)
    setAnswers([])
    setShowResult(false)
    setUserAnswer("")
  }

  const handleAnswer = async (answerIndex, writtenAnswer = null) => {
    const question = lessons[currentQuestion]
    let isCorrect = false

    if (!question) return; // Safety check

    if (question.type === "writing") {
      // For writing questions, check against correct answer
      isCorrect = writtenAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()
    } else {
      // For multiple choice questions
      isCorrect = answerIndex === question.correct
    }

    const newAnswers = [...answers, { 
      questionId: question.id, 
      answer: writtenAnswer || answerIndex, 
      correct: isCorrect,
      type: question.type
    }]

    setAnswers(newAnswers)
    setShowResult(true)

    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    setTimeout(() => {
      if (currentQuestion < lessons.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setShowResult(false)
        setUserAnswer("")
      } else {
        // Lesson complete - save progress
        completeLesson()
      }
    }, 2000)
  }

  const useHeart = async () => {
    try {
      await fetch("/api/language-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "useHeart",
          userId: currentUser.id,
          language: selectedLanguage.name
        })
      })
      // Refresh progress to update heart count
      await fetchProgress()
    } catch (error) {
      console.error("Failed to use heart:", error)
    }
  }

  const completeLesson = async () => {
    try {
      // Save test results
      await fetch("/api/language-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveTest",
          userId: currentUser.id,
          language: selectedLanguage.name,
          course: selectedCourse.id,
          answers,
          score,
          totalQuestions: lessons.length
        })
      })

      // Update progress
      await fetch("/api/language-learning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateProgress",
          userId: currentUser.id,
          language: selectedLanguage.name,
          course: selectedCourse.id,
          score,
          totalQuestions: lessons.length,
          completedLesson: true
        })
      })

      await fetchProgress()
      setActiveView("results")
    } catch (error) {
      console.error("Failed to save lesson progress:", error)
    }
  }

  const calculateOverallProgress = () => {
    if (!progress?.courses) return 0

    let totalCompleted = 0
    let totalLessons = 0

    COURSE_TYPES.forEach(courseType => {
      const courseProgress = progress.courses[courseType.id] || { completed: 0, total: courseType.totalLessons }
      totalCompleted += courseProgress.completed
      totalLessons += courseProgress.total
    })

    return totalLessons > 0 ? (totalCompleted / totalLessons) * 100 : 0
  }

  const playAudio = (text) => {
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window && text) {
      // Stop any current speech
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // Set language based on selected language
      switch(selectedLanguage?.name) {
        case "spanish":
          utterance.lang = "es-ES"
          break
        case "french":
          utterance.lang = "fr-FR"
          break
        case "german":
          utterance.lang = "de-DE"
          break
        case "italian":
          utterance.lang = "it-IT"
          break
        case "chinese":
          utterance.lang = "zh-CN"
          break
        case "japanese":
          utterance.lang = "ja-JP"
          break
        default:
          utterance.lang = "en-US"
      }

      utterance.rate = 0.8 // Slower rate for learning
      utterance.pitch = 1
      utterance.volume = 1

      speechSynthesis.speak(utterance)
    }
  }

  // Language Selection View
  if (activeView === "languages") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Choose a Language</h1>
              <p className="text-gray-600">Start your learning journey</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableLanguages.map((language) => (
              <Card 
                key={language.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSelectLanguage(language)}
              >
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{language.flag}</div>
                    <h3 className="text-xl font-semibold mb-1">{language.displayName}</h3>
                    <Badge variant="outline" className="mb-4">{language.difficulty}</Badge>
                    <div className={`w-full h-2 bg-gradient-to-r ${language.color} rounded-full opacity-20`}></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Course Overview
  if (activeView === "course") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setActiveView("languages")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{selectedLanguage?.displayName} Course</h1>
                <p className="text-gray-600">Level {progress?.level || 1} • {progress?.xp || 0} XP</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Level {progress?.level || 1}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">{progress?.xp || 0} XP</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="text-2xl">{selectedLanguage?.flag}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Course Progress</h3>
                    <span className="text-sm text-gray-500">
                      {progress ? Math.round(calculateOverallProgress()) : 0}% Complete
                    </span>
                  </div>
                  <Progress value={progress ? calculateOverallProgress() : 0} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Stats */}
          {userScores && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Your Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{userScores.testsCompleted || 0}</div>
                    <div className="text-sm text-gray-600">Tests Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{userScores.averageScore || 0}%</div>
                    <div className="text-sm text-gray-600">Average Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{userScores.bestScore || 0}%</div>
                    <div className="text-sm text-gray-600">Best Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{userScores.totalScore || 0}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lessons */}
          <div className="space-y-4">
            {COURSE_TYPES.map((course, index) => {
              const courseProgress = progress?.courses?.[course.id] || { completed: 0, total: course.totalLessons }
              const IconComponent = courseProgress.completed === courseProgress.total ? CheckCircle : Circle
              const isUnlocked = index === 0 || (progress?.courses && Object.keys(progress.courses).length > index - 1)

              return (
                <Card 
                  key={course.id} 
                  className={`cursor-pointer transition-all ${
                    isUnlocked 
                      ? "hover:shadow-md" 
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => isUnlocked && !loading && handleStartLesson(course)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <IconComponent 
                        className={`h-8 w-8 ${
                          courseProgress.completed === courseProgress.total 
                            ? "text-green-500" 
                            : courseProgress.completed > 0 
                              ? "text-blue-500" 
                              : "text-gray-400"
                        }`} 
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{course.name}</h3>
                        <p className="text-sm text-gray-600">
                          {courseProgress.completed}/{courseProgress.total} lessons completed
                        </p>
                        <Progress 
                          value={(courseProgress.completed / courseProgress.total) * 100} 
                          className="h-2 mt-2" 
                        />
                      </div>
                      {courseProgress.completed === courseProgress.total && (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      )}
                      {loading && (
                        <div className="text-sm text-gray-500">Loading...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Results View
  if (activeView === "results") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center p-8">
            <CardContent>
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Lesson Complete!</h2>
              <p className="text-gray-600 mb-2">You got {score} out of {lessons.length} correct</p>
              <p className="text-gray-600 mb-4">You earned {score * 10} XP</p>

              {/* Progress stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{progress?.xp || 0}</div>
                  <div className="text-sm text-gray-600">Total XP</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{progress?.level || 1}</div>
                  <div className="text-sm text-gray-600">Level</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{progress?.streak || 0}</div>
                  <div className="text-sm text-gray-600">Day Streak</div>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={() => setActiveView("course")} 
                  className="w-full"
                >
                  Continue Learning
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleStartLesson(selectedCourse)} 
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Lesson/Practice View
  if (activeView === "lesson") {
    if (lessons.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading lesson...</p>
          </div>
        </div>
      )
    }

    const question = lessons[currentQuestion]

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setActiveView("course")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Exit
            </Button>
            <div className="flex items-center gap-4">
              <Progress value={((currentQuestion + 1) / lessons.length) * 100} className="w-32" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{currentQuestion + 1} of {lessons.length}</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
                {question.audio && (
                  <Button 
                    variant="outline" 
                    onClick={() => playAudio(question.audio)}
                    className="mb-4"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Play Audio
                  </Button>
                )}
              </div>

              {question.type === "writing" ? (
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={showResult}
                    className="w-full p-4 text-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && userAnswer.trim() && !showResult) {
                        handleAnswer(null, userAnswer)
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleAnswer(null, userAnswer)}
                    disabled={showResult || !userAnswer.trim()}
                    className="w-full"
                  >
                    Submit Answer
                  </Button>
                  {showResult && (
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">Correct answer: <strong>{question.correctAnswer}</strong></p>
                    </div>
                  )}
                </div>
              ) : question && question.options ? (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`w-full text-left justify-start p-4 h-auto ${
                          showResult
                            ? index === question.correct
                              ? "bg-green-100 border-green-500"
                              : "bg-red-100 border-red-500"
                            : ""
                        }`}
                        onClick={() => !showResult && handleAnswer(index)}
                        disabled={showResult}
                      >
                        {option}
                      </Button>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No question available for this lesson.</p>
                </div>
              )}

              {showResult && (
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold">
                    {answers[answers.length - 1]?.correct ? "Correct! +10 XP" : "Keep practicing!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  }