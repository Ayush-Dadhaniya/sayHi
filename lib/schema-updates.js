
// Database Schema Updates for New Features

export const COLLECTIONS_SCHEMA = {
  // Gamification
  userStreaks: {
    userId: String,
    currentStreak: Number,
    longestStreak: Number,
    lastActivityDate: String,
    weeklyStreak: Number,
    monthlyStreak: Number
  },
  
  userBadges: {
    id: String,
    userId: String,
    badgeType: String, // 'lesson_complete', 'friend_maker', 'helper', 'streak_master'
    earnedAt: String,
    metadata: Object
  },
  
  leaderboards: {
    userId: String,
    points: Number,
    weeklyPoints: Number,
    monthlyPoints: Number,
    rank: Number,
    lastUpdated: String
  },
  
  // Social Features
  languageExchangeMatches: {
    id: String,
    user1: String,
    user2: String,
    user1Native: String,
    user1Learning: String,
    user2Native: String,
    user2Learning: String,
    status: String, // 'pending', 'matched', 'cancelled'
    createdAt: String
  },
  
  studySessions: {
    id: String,
    hostId: String,
    title: String,
    description: String,
    language: String,
    scheduledAt: String,
    duration: Number,
    maxParticipants: Number,
    participants: Array,
    status: String
  },
  
  culturalEvents: {
    id: String,
    title: String,
    description: String,
    language: String,
    scheduledAt: String,
    rsvps: Array,
    createdBy: String
  },
  
  mentorships: {
    id: String,
    mentorId: String,
    menteeId: String,
    language: String,
    status: String,
    createdAt: String
  },
  
  // Premium Features
  aiConversations: {
    id: String,
    userId: String,
    language: String,
    messages: Array,
    createdAt: String
  },
  
  certifications: {
    id: String,
    userId: String,
    courseId: String,
    language: String,
    certificationId: String,
    qrCode: String,
    issuedAt: String,
    verificationUrl: String
  },
  
  tutoringSessions: {
    id: String,
    studentId: String,
    tutorId: String,
    language: String,
    scheduledAt: String,
    duration: Number,
    price: Number,
    status: String
  },
  
  // Enterprise Features
  enterpriseProgress: {
    enterpriseId: String,
    userId: String,
    courseProgress: Object,
    timeSpent: Number,
    lastActivity: String
  },
  
  customCourses: {
    id: String,
    enterpriseId: String,
    title: String,
    description: String,
    lessons: Array,
    createdBy: String
  },
  
  voiceAssessments: {
    id: String,
    userId: String,
    language: String,
    text: String,
    audioUrl: String,
    score: Number,
    feedback: String,
    createdAt: String
  }
}
