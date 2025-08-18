"use client"

import { useState, useEffect } from "react"
import LanguageSelectionView from "./language/language-selection-view"
import CourseView from "./language/course-view"
import LessonView from "./language/lesson-view"
import ResultsView from "./language/results-view"

const LANGUAGES = [
    { id: 1, name: "spanish", displayName: "Spanish", flag: "🇪🇸", difficulty: "Beginner", color: "from-red-500 to-yellow-500" },
    { id: 2, name: "french", displayName: "French", flag: "🇫🇷", difficulty: "Beginner", color: "from-blue-500 to-white" },
    { id: 3, name: "german", displayName: "German", flag: "🇩🇪", difficulty: "Intermediate", color: "from-black to-red-500" },
    { id: 4, name: "japanese", displayName: "Japanese", flag: "🇯🇵", difficulty: "Advanced", color: "from-red-600 to-white" },
    { id: 5, name: "chinese", displayName: "Chinese", flag: "🇨🇳", difficulty: "Advanced", color: "from-red-600 to-yellow-400" },
    { id: 6, name: "italian", displayName: "Italian", flag: "🇮🇹", difficulty: "Beginner", color: "from-green-500 to-white" }
]

export default function LanguageLearning({ currentUser, onBack }) {
  const [activeView, setActiveView] = useState("languages") // languages, course, lesson, results
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
      isCorrect = writtenAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()
    } else {
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
        completeLesson()
      }
    }, 2000)
  }

  const completeLesson = async () => {
    try {
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

  const playAudio = (text) => {
    if ('speechSynthesis' in window && text) {
      speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      switch(selectedLanguage?.name) {
        case "spanish": utterance.lang = "es-ES"; break
        case "french": utterance.lang = "fr-FR"; break
        case "german": utterance.lang = "de-DE"; break
        case "italian": utterance.lang = "it-IT"; break
        case "chinese": utterance.lang = "zh-CN"; break
        case "japanese": utterance.lang = "ja-JP"; break
        default: utterance.lang = "en-US"
      }
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  if (activeView === "languages") {
    return <LanguageSelectionView 
        onBack={onBack}
        availableLanguages={availableLanguages}
        onSelectLanguage={handleSelectLanguage}
    />
  }

  if (activeView === "course") {
    return <CourseView
        selectedLanguage={selectedLanguage}
        progress={progress}
        userScores={userScores}
        onBack={() => setActiveView("languages")}
        onStartLesson={handleStartLesson}
        loading={loading}
    />
  }

  if (activeView === "lesson") {
    return <LessonView
        lessons={lessons}
        currentQuestion={currentQuestion}
        onBack={() => setActiveView("course")}
        userAnswer={userAnswer}
        setUserAnswer={setUserAnswer}
        showResult={showResult}
        handleAnswer={handleAnswer}
        answers={answers}
        playAudio={playAudio}
    />
  }

  if (activeView === "results") {
    return <ResultsView
        score={score}
        lessons={lessons}
        progress={progress}
        onContinue={() => setActiveView("course")}
        onPracticeAgain={() => handleStartLesson(selectedCourse)}
    />
  }

  return null
}