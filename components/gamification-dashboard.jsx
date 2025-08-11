
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, 
  Flame, 
  Star, 
  Target, 
  Award,
  TrendingUp,
  Calendar,
  Users
} from "lucide-react"

const BADGE_INFO = {
  lesson_complete: { name: "Lesson Master", icon: Star, color: "bg-yellow-500", description: "Complete 10 lessons" },
  friend_maker: { name: "Social Butterfly", icon: Users, color: "bg-blue-500", description: "Make 5 friends" },
  helper: { name: "Helper", icon: Award, color: "bg-green-500", description: "Help 3 people" },
  streak_master: { name: "Streak Master", icon: Flame, color: "bg-red-500", description: "7 day streak" },
  conversation_starter: { name: "Chatterbox", icon: Trophy, color: "bg-purple-500", description: "Start 20 conversations" },
  language_explorer: { name: "Explorer", icon: Target, color: "bg-indigo-500", description: "Learn 3 languages" }
}

export default function GamificationDashboard({ currentUser, onBack }) {
  const [streak, setStreak] = useState(null)
  const [badges, setBadges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userPoints, setUserPoints] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGamificationData()
  }, [currentUser.id])

  const fetchGamificationData = async () => {
    try {
      const [streakRes, badgesRes, leaderboardRes, pointsRes] = await Promise.all([
        fetch(`/api/gamification?action=getStreak&userId=${currentUser.id}`),
        fetch(`/api/gamification?action=getBadges&userId=${currentUser.id}`),
        fetch(`/api/gamification?action=getLeaderboard&type=weekly`),
        fetch(`/api/gamification?action=getUserPoints&userId=${currentUser.id}`)
      ])

      const [streakData, badgesData, leaderboardData, pointsData] = await Promise.all([
        streakRes.json(),
        badgesRes.json(),
        leaderboardRes.json(),
        pointsRes.json()
      ])

      setStreak(streakData.streak)
      setBadges(badgesData.badges || [])
      setLeaderboard(leaderboardData.leaderboard || [])
      setUserPoints(pointsData.points)
    } catch (error) {
      console.error("Failed to fetch gamification data:", error)
    } finally {
      setLoading(false)
    }
  }

  const userRank = leaderboard.findIndex(entry => entry.userId === currentUser.id) + 1

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <h2 className="text-3xl font-bold mb-2">Your Learning Journey</h2>
          <p className="text-gray-600">Track your progress and achievements</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
      </div></div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-orange-400 to-red-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Current Streak</p>
                <p className="text-2xl font-bold">{streak?.currentStreak || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Total Points</p>
                <p className="text-2xl font-bold">{userPoints?.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Badges Earned</p>
                <p className="text-2xl font-bold">{badges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-400 to-pink-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Weekly Rank</p>
                <p className="text-2xl font-bold">#{userRank || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Streak Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Streak Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Current Streak</span>
                <span className="font-bold">{streak?.currentStreak || 0} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Longest Streak</span>
                <span className="font-bold">{streak?.longestStreak || 0} days</span>
              </div>
              <Progress value={((streak?.currentStreak || 0) / 30) * 100} className="h-3" />
              <p className="text-sm text-gray-600">Keep learning daily to maintain your streak!</p>
            </CardContent>
          </Card>

          {/* Recent Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No badges earned yet. Keep learning to unlock achievements!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {badges.slice(0, 4).map((badge) => {
                    const badgeInfo = BADGE_INFO[badge.badgeType] || { name: badge.badgeType, icon: Award, color: "bg-gray-500" }
                    const IconComponent = badgeInfo.icon
                    
                    return (
                      <div key={badge.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${badgeInfo.color} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{badgeInfo.name}</p>
                          <p className="text-sm text-gray-600">{new Date(badge.earnedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Badges ({badges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(BADGE_INFO).map(([badgeType, badgeInfo]) => {
                  const earned = badges.find(b => b.badgeType === badgeType)
                  const IconComponent = badgeInfo.icon
                  
                  return (
                    <div key={badgeType} className={`p-4 border rounded-lg ${earned ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${earned ? badgeInfo.color : 'bg-gray-400'} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
                            {badgeInfo.name}
                          </h3>
                          {earned && (
                            <Badge variant="outline" className="text-xs">
                              Earned {new Date(earned.earnedAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${earned ? 'text-gray-700' : 'text-gray-500'}`}>
                        {badgeInfo.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div key={entry.userId} className={`flex items-center justify-between p-3 rounded-lg ${entry.userId === currentUser.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{entry.user?.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-600">@{entry.user?.username}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.weeklyPoints || 0}</p>
                      <p className="text-sm text-gray-600">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
