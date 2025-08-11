
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
  { id: 1, name: "Spanish", flag: "🇪🇸", difficulty: "Beginner", color: "from-red-500 to-yellow-500" },
  { id: 2, name: "French", flag: "🇫🇷", difficulty: "Beginner", color: "from-blue-500 to-white" },
  { id: 3, name: "German", flag: "🇩🇪", difficulty: "Intermediate", color: "from-black to-red-500" },
  { id: 4, name: "Japanese", flag: "🇯🇵", difficulty: "Advanced", color: "from-red-600 to-white" },
  { id: 5, name: "Chinese", flag: "🇨🇳", difficulty: "Advanced", color: "from-red-600 to-yellow-400" },
  { id: 6, name: "Italian", flag: "🇮🇹", difficulty: "Beginner", color: "from-green-500 to-red-500" },
]

const LESSON_TYPES = [
  { id: 1, name: "Basics", icon: Circle, lessons: 5, completed: 3 },
  { id: 2, name: "Food", icon: Circle, lessons: 4, completed: 2 },
  { id: 3, name: "Family", icon: Circle, lessons: 6, completed: 0 },
  { id: 4, name: "Colors", icon: Circle, lessons: 3, completed: 0 },
  { id: 5, name: "Numbers", icon: Circle, lessons: 4, completed: 0 },
]

const SAMPLE_QUESTIONS = [
  {
    type: "translate",
    question: "Translate: 'Hello, how are you?'",
    options: ["Hola, ¿cómo estás?", "Adiós, gracias", "Por favor, ayuda", "No entiendo"],
    correct: 0,
    audio: true
  },
  {
    type: "multiple_choice",
    question: "What does 'Gracias' mean?",
    options: ["Hello", "Goodbye", "Thank you", "Please"],
    correct: 2,
    audio: true
  },
  {
    type: "fill_blank",
    question: "Complete: 'Me _____ Juan' (My name is Juan)",
    options: ["llamo", "como", "soy", "tengo"],
    correct: 0,
    audio: false
  }
]

export default function LanguageLearning({ currentUser, onBack }) {
  const [activeView, setActiveView] = useState("languages") // languages, course, lesson, practice
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(7)
  const [hearts, setHearts] = useState(5)
  const [xp, setXp] = useState(1250)
  const [level, setLevel] = useState(5)

  const handleSelectLanguage = (language) => {
    setSelectedLanguage(language)
    setActiveView("course")
  }

  const handleStartLesson = (course) => {
    setSelectedCourse(course)
    setActiveView("lesson")
    setCurrentQuestion(0)
    setScore(0)
    setShowResult(false)
    setUserAnswer("")
  }

  const handleAnswer = (answerIndex) => {
    const question = SAMPLE_QUESTIONS[currentQuestion]
    setShowResult(true)
    
    if (answerIndex === question.correct) {
      setScore(prev => prev + 10)
      setXp(prev => prev + 10)
    } else {
      setHearts(prev => Math.max(0, prev - 1))
    }

    setTimeout(() => {
      if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setShowResult(false)
        setUserAnswer("")
      } else {
        // Lesson complete
        setActiveView("practice")
      }
    }, 2000)
  }

  const playAudio = (text) => {
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = selectedLanguage?.name === "Spanish" ? "es-ES" : "en-US"
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
            {LANGUAGES.map((language) => (
              <Card 
                key={language.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleSelectLanguage(language)}
              >
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{language.flag}</div>
                    <h3 className="text-xl font-semibold mb-1">{language.name}</h3>
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
                <h1 className="text-2xl font-bold">{selectedLanguage?.name} Course</h1>
                <p className="text-gray-600">Level {level} • {xp} XP</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">{streak}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-semibold">{hearts}</span>
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
                    <span className="text-sm text-gray-500">45% Complete</span>
                  </div>
                  <Progress value={45} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lessons */}
          <div className="space-y-4">
            {LESSON_TYPES.map((course, index) => {
              const IconComponent = course.completed === course.lessons ? CheckCircle : Circle
              const isUnlocked = index === 0 || LESSON_TYPES[index - 1].completed > 0
              
              return (
                <Card 
                  key={course.id} 
                  className={`cursor-pointer transition-all ${
                    isUnlocked 
                      ? "hover:shadow-md" 
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => isUnlocked && handleStartLesson(course)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <IconComponent 
                        className={`h-8 w-8 ${
                          course.completed === course.lessons 
                            ? "text-green-500" 
                            : course.completed > 0 
                              ? "text-blue-500" 
                              : "text-gray-400"
                        }`} 
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{course.name}</h3>
                        <p className="text-sm text-gray-600">
                          {course.completed}/{course.lessons} lessons completed
                        </p>
                        <Progress 
                          value={(course.completed / course.lessons) * 100} 
                          className="h-2 mt-2" 
                        />
                      </div>
                      {course.completed === course.lessons && (
                        <Trophy className="h-6 w-6 text-yellow-500" />
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

  // Lesson/Practice View
  if (activeView === "lesson" || activeView === "practice") {
    const question = SAMPLE_QUESTIONS[currentQuestion]
    
    if (activeView === "practice") {
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center p-8">
              <CardContent>
                <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Lesson Complete!</h2>
                <p className="text-gray-600 mb-4">You earned {score} XP</p>
                <div className="space-y-2 mb-6">
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
              <Progress value={((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100} className="w-32" />
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>{hearts}</span>
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
                    onClick={() => playAudio(question.options[question.correct])}
                    className="mb-4"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Play Audio
                  </Button>
                )}
              </div>

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
                ))}
              </div>

              {showResult && (
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold">
                    {userAnswer === question.correct ? "Correct! +10 XP" : "Keep practicing!"}
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
