"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Globe, MapPin } from "lucide-react"

const LANGUAGES = [
  "English",
  "Gujarati",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Portuguese",
  "Russian",
  "Italian",
  "Korean",
  "Dutch",
  "Swedish",
  "Turkish",
]

const REGIONS = [
  "United States",
  "India",
  "Spain",
  "France",
  "Germany",
  "China",
  "Japan",
  "Brazil",
  "Russia",
  "Italy",
  "South Korea",
  "Netherlands",
  "Sweden",
  "Turkey",
  "United Kingdom",
  "Canada",
  "Australia",
  "Mexico",
]

export default function ProfileSetup({ onProfileComplete, onShowLogin }) {
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    password: "",
    language: "",
    region: "",
    bio: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createUser",
          ...profile,
        }),
      })

      const data = await response.json()
      if (data.user) {
        onProfileComplete(data.user, data.token)
      }
    } catch (error) {
      console.error("Failed to create profile:", error)
    }
  }

  const isFormValid = profile.name && profile.username && profile.password && profile.language && profile.region

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Half - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-400 to-green-600 items-center justify-center">
        <div className="text-center text-white">
          <img 
            src="/login_image.png" 
            alt="Create Profile" 
            className="max-w-md mx-auto mb-8 rounded-lg shadow-2xl"
          />
          <h2 className="text-3xl font-bold mb-4">Join SayHi</h2>
          <p className="text-xl opacity-90">Create your profile and start connecting</p>
        </div>
      </div>

      {/* Right Half - Profile Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full mt-5 mb-5 max-w-md h-full flex flex-col justify-center shadow-xl">
          <CardHeader className="text-center pt-3">
            <div className="flex justify-center mb-2">
              <div className="bg-green-500 p-3 rounded-full">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Your Profile</CardTitle>
            <p className="text-gray-600 text-sm">Set up your profile to start connecting with people worldwide</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-3 flex flex-col justify-center">
              {/* Name and Username in one row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Full Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Username</label>
                  <Input
                    value={profile.username}
                    onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={profile.password}
                  onChange={(e) => setProfile((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password"
                  required
                />
              </div>

              {/* Language and Region in one row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Language
                  </label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Region
                  </label>
                  <Select
                    value={profile.region}
                    onValueChange={(value) => setProfile((prev) => ({ ...prev, region: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio field */}
              <div>
                <label className="block text-xs font-medium mb-1">Bio (Optional)</label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 mt-2" disabled={!isFormValid}>
                Create Profile
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onShowLogin}
                  className="text-green-600 hover:text-green-700 text-xs"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
