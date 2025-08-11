"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Globe, MapPin, MessageCircle, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Placeholder for Admin functionality, replace with actual implementation
const AdminPanel = ({ currentUser }) => {
  const [plans, setPlans] = useState([{ id: 1, name: 'Basic', price: 10 }, { id: 2, name: 'Pro', price: 20 }]);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [lessonDetails, setLessonDetails] = useState([]);
  const [enterpriseDetails, setEnterpriseDetails] = useState([]);

  // Mock fetching data for admin
  useEffect(() => {
    // Fetch plans
    const fetchPlans = async () => {
      // In a real app, fetch from an API: const res = await fetch('/api/plans'); setPlans(await res.json());
      setPlans([{ id: 1, name: 'Basic', price: 10 }, { id: 2, name: 'Pro', price: 20 }]);
    };
    fetchPlans();

    // Fetch lesson details
    const fetchLessons = async () => {
      // In a real app, fetch from an API: const res = await fetch('/api/lessons'); setLessonDetails(await res.json());
      setLessonDetails([
        { id: 'l1', title: 'Introduction to React', questions: [{ id: 'q1', text: 'What is React?', options: ['A', 'B', 'C'] }] },
        { id: 'l2', title: 'State Management', questions: [{ id: 'q2', text: 'What is state?', options: ['A', 'B', 'C'] }] },
      ]);
    };
    fetchLessons();

    // Fetch enterprise details
    const fetchEnterprises = async () => {
      // In a real app, fetch from an API: const res = await fetch('/api/enterprises'); setEnterpriseDetails(await res.json());
      setEnterpriseDetails([
        { id: 'e1', name: 'TechCorp', industry: 'Technology', contact: 'contact@techcorp.com', lessonsEnrolled: ['l1'] },
        { id: 'e2', name: 'EduSolutions', industry: 'Education', contact: 'contact@edusolutions.com', lessonsEnrolled: ['l1', 'l2'] },
      ]);
    };
    fetchEnterprises();
  }, []);

  const handleAddPlan = () => {
    if (newPlanName && newPlanPrice) {
      const newPlan = { id: Date.now(), name: newPlanName, price: parseFloat(newPlanPrice) };
      setPlans([...plans, newPlan]);
      setNewPlanName('');
      setNewPlanPrice('');
      // In a real app, send this to the API: await fetch('/api/plans', { method: 'POST', ... });
    }
  };

  const handleEditPlan = (id, newName, newPrice) => {
    setPlans(plans.map(plan => plan.id === id ? { ...plan, name: newName, price: parseFloat(newPrice) } : plan));
    // In a real app, send this to the API: await fetch('/api/plans/${id}', { method: 'PUT', ... });
  };

  const handleDeletePlan = (id) => {
    setPlans(plans.filter(plan => plan.id !== id));
    // In a real app, send this to the API: await fetch('/api/plans/${id}', { method: 'DELETE' });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Manage Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {plans.map(plan => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">${plan.price}/month</p>
                <div className="flex gap-2 mt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Edit</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Plan: {plan.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-1">
                          <Label htmlFor={`plan-name-${plan.id}`}>Plan Name</Label>
                          <Input id={`plan-name-${plan.id}`} defaultValue={plan.name} onChange={(e) => setNewPlanName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`plan-price-${plan.id}`}>Price ($)</Label>
                          <Input id={`plan-price-${plan.id}`} type="number" defaultValue={plan.price} onChange={(e) => setNewPlanPrice(e.target.value)} />
                        </div>
                        <Button onClick={() => handleEditPlan(plan.id, newPlanName || plan.name, newPlanPrice || plan.price)}>Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="New Plan Name"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Price ($)"
            type="number"
            value={newPlanPrice}
            onChange={(e) => setNewPlanPrice(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddPlan}>Add Plan</Button>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Lesson Details</h3>
        {lessonDetails.length === 0 ? (
          <p className="text-gray-500">No lesson details available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lessonDetails.map(lesson => (
              <Card key={lesson.id}>
                <CardHeader>
                  <CardTitle>{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {lesson.questions && lesson.questions.length > 0 ? (
                    lesson.questions.map((question, index) => (
                      <div key={index} className="mb-3 pb-3 border-b last:border-b-0">
                        <p className="font-medium mb-1">Q: {question.text}</p>
                        <div className="flex flex-wrap gap-2">
                          {question.options && question.options.map((option, optIndex) => (
                            <Badge key={optIndex} variant="outline">{option}</Badge>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No questions for this lesson.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">Enterprise Details</h3>
        {enterpriseDetails.length === 0 ? (
          <p className="text-gray-500">No enterprise details available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {enterpriseDetails.map(enterprise => (
              <Card key={enterprise.id}>
                <CardHeader>
                  <CardTitle>{enterprise.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{enterprise.industry}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">Contact: {enterprise.contact}</p>
                  <p className="text-sm text-gray-600">Lessons Enrolled: {enterprise.lessonsEnrolled.join(', ')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main component for discovering users, finding friends, and the original discover functionality
export default function DiscoverUsers({ currentUser, onSendRequest, onStartChat, mode = "discover" }) {
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchSentRequests();
  }, [currentUser, mode]); // Re-fetch when mode changes

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      // Modify API call based on mode if necessary. For now, assuming discover endpoint works for both.
      const response = await fetch(`/api/users?action=discover&currentUserId=${currentUser.id}`);
      const data = await response.json();

      if (response.ok) {
        // Filter out admin users from discovery if not admin
        const usersToShow = data.users?.filter(user => user.role !== 'admin' || currentUser.role === 'admin') || [];
        setUsers(usersToShow);
        setFilteredUsers(usersToShow); // Initialize filtered users
      } else {
        setError("Failed to load users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const response = await fetch(`/api/users?action=sentRequests&fromUserId=${currentUser.id}`);
      const data = await response.json();

      if (response.ok && data.requests) {
        const sentRequestIds = data.requests.map(req => req.toUserId);
        setSentRequests(new Set(sentRequestIds));
      }
    } catch (error) {
      console.error("Failed to fetch sent requests:", error);
    }
  };

  const handleSendRequest = async (toUserId) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendFriendRequest",
          fromUserId: currentUser.id,
          toUserId,
        }),
      });

      if (response.ok) {
        setSentRequests((prev) => new Set([...prev, toUserId]));
        onSendRequest?.(toUserId);
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    if (value === "") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user =>
        user.name.toLowerCase().includes(value) ||
        user.username.toLowerCase().includes(value)
      ));
    }
  };

  // Handle the language learning error: check if question.options exists before mapping
  const renderQuestionOptions = (options) => {
    if (!options || !Array.isArray(options)) {
      return <p className="text-sm text-gray-500">No options available.</p>;
    }
    return options.map((option, index) => (
      <Button key={index} variant="outline" size="sm" className="px-3 py-1 text-xs">
        {option}
      </Button>
    ));
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{mode === "friends" ? "Find Friends" : "Discover People"}</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{mode === "friends" ? "Find Friends" : "Discover People"}</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-2">{error}</p>
          <Button onClick={fetchUsers} size="sm" variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Admin specific rendering
  if (currentUser.role === 'admin') {
    return <AdminPanel currentUser={currentUser} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "friends" ? "Find Friends" : "Discover People"}
          </h1>
          <p className="text-gray-600">
            {mode === "friends" ? "Connect with friends for language exchange" : "Connect with language learners worldwide"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-48"
          />
          <Badge variant="secondary" className="text-sm">
            {filteredUsers.length} people online
          </Badge>
          {/* Logout button with fixed SVG */}
          <Button variant="outline" size="icon" onClick={() => console.log("Logout")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm ? "No users found matching your search." : "No users found to discover."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                    <span className="text-xs text-gray-500">{user.isOnline ? "Online" : "Offline"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  {user.language && (
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      {user.language}
                    </Badge>
                  )}
                  {user.region && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {user.region}
                    </Badge>
                  )}
                </div>

                {user.bio && <p className="text-sm text-gray-600 mb-3">{user.bio}</p>}

                <div className="flex gap-2">
                  {sentRequests.has(user.id) ? (
                    <Button disabled size="sm" className="flex-1 bg-gray-100 text-gray-600">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSendRequest(user.id)}
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Friend
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartChat?.(user)}
                    className="hover:bg-blue-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}