"use client"

import { useState, useEffect } from "react"

import ProfileSetup from "@/components/profile-setup"
import Login from "@/components/login"
import Dashboard from "@/components/dashboard"
import ChatInterface from "@/components/chat-interface"

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeView, setActiveView] = useState("discover")
  const [chatPartner, setChatPartner] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleProfileComplete = (user, token) => {
    setCurrentUser(user)
    localStorage.setItem('token', token)
  }

  const handleLogin = (user, token) => {
    setCurrentUser(user)
    localStorage.setItem('token', token)
  }

  const handleShowSignup = () => {
    setShowLogin(false)
  }

  const handleShowLogin = () => {
    setShowLogin(true)
  }

  const handleStartChat = (partner) => {
    setChatPartner(partner)
  }

  const handleBackFromChat = () => {
    setChatPartner(null)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('token')
  }

  // Check for existing authentication on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setCurrentUser(data.user)
          } else {
            localStorage.removeItem('token')
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
        }
      }
      
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    if (showLogin) {
      return <Login onLogin={handleLogin} onShowSignup={handleShowSignup} />
    }
    return <ProfileSetup onProfileComplete={handleProfileComplete} onShowLogin={handleShowLogin} />
  }

  if (chatPartner) {
    return <ChatInterface currentUser={currentUser} chatPartner={chatPartner} onBack={handleBackFromChat} />
  }

  return <Dashboard currentUser={currentUser} onStartChat={handleStartChat} onLogout={handleLogout} />
}
