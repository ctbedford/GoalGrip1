import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Download, 
  Upload, 
  RefreshCw, 
  PaintBucket, 
  Monitor, 
  Moon, 
  Sun, 
  Smartphone, 
  Save,
  LogOut,
  Trash2,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showPassword, setShowPassword] = useState(false);
  
  // Mock user data
  const user = {
    name: "Alex Johnson",
    username: "alexj",
    email: "alex.johnson@example.com",
    avatar: "",
    level: 12,
    points: 1250,
    joinDate: "February 2023"
  };
  
  // Theme options
  const themeOptions = [
    { name: "System Default", value: "system", icon: <Monitor className="h-4 w-4" /> },
    { name: "Dark Mode", value: "dark", icon: <Moon className="h-4 w-4" /> },
    { name: "Light Mode", value: "light", icon: <Sun className="h-4 w-4" /> }
  ];
  
  // Color schemes
  const colorSchemes = [
    { name: "Cyberpunk Blue", value: "blue", color: "#3b82f6" },
    { name: "Neon Green", value: "green", color: "#10b981" },
    { name: "Electric Purple", value: "purple", color: "#8b5cf6" },
    { name: "Sunset Orange", value: "orange", color: "#f97316" },
    { name: "Ruby Red", value: "red", color: "#ef4444" }
  ];
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    goalReminders: true,
    achievementAlerts: true,
    dailyDigest: false,
    weeklyReport: true
  });
  
  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  return (
    <div>
      {/* Enhanced Page Header */}
      <div className="mb-8 rounded-lg overflow-hidden relative">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 border border-gray-800">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-gray-100 bg-clip-text text-transparent mb-2">
              Settings
            </h2>
            <p className="text-gray-300 mb-6">Customize your experience and manage your account</p>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-10">
            <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-blue-500 blur-3xl"></div>
            <div className="absolute bottom-8 right-16 w-32 h-32 rounded-full bg-blue-400 blur-3xl"></div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      </div>
      
      {/* Settings Tabs & Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="card border border-gray-800 md:col-span-1 h-fit">
          <CardContent className="p-4">
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center justify-start px-3 py-2 rounded text-left ${
                  activeTab === "profile" 
                    ? "bg-gray-800 text-gray-100" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <User className="h-4 w-4 mr-2 text-blue-400" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`w-full flex items-center justify-start px-3 py-2 rounded text-left ${
                  activeTab === "appearance" 
                    ? "bg-gray-800 text-gray-100" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <PaintBucket className="h-4 w-4 mr-2 text-purple-400" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`w-full flex items-center justify-start px-3 py-2 rounded text-left ${
                  activeTab === "notifications" 
                    ? "bg-gray-800 text-gray-100" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <Bell className="h-4 w-4 mr-2 text-amber-400" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center justify-start px-3 py-2 rounded text-left ${
                  activeTab === "security" 
                    ? "bg-gray-800 text-gray-100" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <Shield className="h-4 w-4 mr-2 text-green-400" />
                Security
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={`w-full flex items-center justify-start px-3 py-2 rounded text-left ${
                  activeTab === "data" 
                    ? "bg-gray-800 text-gray-100" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <Download className="h-4 w-4 mr-2 text-red-400" />
                Data Management
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Profile Settings */}
          <div className={activeTab === "profile" ? "block" : "hidden"}>
            <Card className="card border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100">Profile Information</CardTitle>
                <CardDescription>Update your personal information and how it appears on your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex flex-col items-center space-y-3">
                    <Avatar className="w-24 h-24 border-2 border-blue-700">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-2xl bg-blue-900 text-blue-100">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="border-blue-700 text-blue-100">
                      Change Avatar
                    </Button>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Joined {user.joinDate}</div>
                      <div className="flex gap-2 mt-1 justify-center">
                        <Badge className="bg-blue-900 text-blue-100">Level {user.level}</Badge>
                        <Badge className="bg-amber-900 text-amber-100">{user.points} XP</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-grow space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-400">Full Name</Label>
                        <Input 
                          id="name" 
                          value={user.name} 
                          className="bg-gray-900 border-gray-800 text-gray-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-400">Username</Label>
                        <Input 
                          id="username" 
                          value={user.username} 
                          className="bg-gray-900 border-gray-800 text-gray-100"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-400">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={user.email} 
                        className="bg-gray-900 border-gray-800 text-gray-100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-400">Bio</Label>
                      <Textarea 
                        id="bio" 
                        placeholder="Tell us about yourself in a few sentences..." 
                        className="bg-gray-900 border-gray-800 text-gray-100 min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-800 px-6 py-4">
                <Button className="btn-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Appearance Settings */}
          <div className={activeTab === "appearance" ? "block" : "hidden"}>
            <Card className="card border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100">Appearance Settings</CardTitle>
                <CardDescription>Customize how GOAL:SYNC looks on your device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Theme Mode</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {themeOptions.map(theme => (
                        <div 
                          key={theme.value}
                          className="relative flex items-center border border-gray-800 p-4 rounded-md cursor-pointer hover:bg-gray-800 hover:bg-opacity-30 transition-colors"
                        >
                          <div className="mr-3 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
                            {theme.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-200">{theme.name}</div>
                          </div>
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center">
                              {theme.value === "dark" && (
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-2">
                    <Label className="text-gray-400">Accent Color</Label>
                    <div className="flex flex-wrap gap-4">
                      {colorSchemes.map(scheme => (
                        <button
                          key={scheme.value}
                          className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${scheme.value === 'blue' ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: scheme.color }}
                          title={scheme.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-4">
                    <Label className="text-gray-400">Interface Preferences</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Reduced Motion</div>
                        <div className="text-xs text-gray-500">Minimize animations and transitions</div>
                      </div>
                      <Switch id="reduced-motion" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Compact Mode</div>
                        <div className="text-xs text-gray-500">Show more content with less spacing</div>
                      </div>
                      <Switch id="compact-mode" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">High Contrast</div>
                        <div className="text-xs text-gray-500">Increase contrast for better visibility</div>
                      </div>
                      <Switch id="high-contrast" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-800 px-6 py-4">
                <Button className="btn-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Notification Settings */}
          <div className={activeTab === "notifications" ? "block" : "hidden"}>
            <Card className="card border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100">Notification Preferences</CardTitle>
                <CardDescription>Control when and how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-gray-200">Email Notifications</div>
                      <div className="text-xs text-gray-500">Receive important notifications via email</div>
                    </div>
                    <Switch 
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => toggleNotification('emailNotifications')}
                    />
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-4">
                    <Label className="text-gray-400">Goal Notifications</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Goal Reminders</div>
                        <div className="text-xs text-gray-500">Remind you about upcoming goal deadlines</div>
                      </div>
                      <Switch 
                        checked={notificationSettings.goalReminders}
                        onCheckedChange={() => toggleNotification('goalReminders')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Achievement Alerts</div>
                        <div className="text-xs text-gray-500">Notify when you unlock new achievements</div>
                      </div>
                      <Switch 
                        checked={notificationSettings.achievementAlerts}
                        onCheckedChange={() => toggleNotification('achievementAlerts')}
                      />
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-4">
                    <Label className="text-gray-400">Summary Reports</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Daily Digest</div>
                        <div className="text-xs text-gray-500">Receive a summary of your daily progress</div>
                      </div>
                      <Switch 
                        checked={notificationSettings.dailyDigest}
                        onCheckedChange={() => toggleNotification('dailyDigest')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Weekly Report</div>
                        <div className="text-xs text-gray-500">Get a weekly overview of your goal progress</div>
                      </div>
                      <Switch 
                        checked={notificationSettings.weeklyReport}
                        onCheckedChange={() => toggleNotification('weeklyReport')}
                      />
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-2">
                    <Label className="text-gray-400">Notification Schedule</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-time" className="text-sm text-gray-500">Reminder Time</Label>
                        <Select defaultValue="18:00">
                          <SelectTrigger className="bg-gray-900 border-gray-800 text-gray-200">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-800">
                            <SelectItem value="08:00">8:00 AM</SelectItem>
                            <SelectItem value="12:00">12:00 PM</SelectItem>
                            <SelectItem value="18:00">6:00 PM</SelectItem>
                            <SelectItem value="21:00">9:00 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="reminder-days" className="text-sm text-gray-500">Reminder Days</Label>
                        <Select defaultValue="weekdays">
                          <SelectTrigger className="bg-gray-900 border-gray-800 text-gray-200">
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-800">
                            <SelectItem value="everyday">Every Day</SelectItem>
                            <SelectItem value="weekdays">Weekdays Only</SelectItem>
                            <SelectItem value="weekends">Weekends Only</SelectItem>
                            <SelectItem value="custom">Custom Schedule</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-800 px-6 py-4">
                <Button className="btn-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Security Settings */}
          <div className={activeTab === "security" ? "block" : "hidden"}>
            <Card className="card border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100">Security Settings</CardTitle>
                <CardDescription>Manage your account security and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-gray-400">Change Password</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm text-gray-500">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="current-password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your current password" 
                        className="bg-gray-900 border-gray-800 text-gray-100 pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm text-gray-500">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="new-password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password" 
                        className="bg-gray-900 border-gray-800 text-gray-100 pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm text-gray-500">Confirm New Password</Label>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your new password" 
                        className="bg-gray-900 border-gray-800 text-gray-100 pr-10"
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button className="btn-primary w-full sm:w-auto">
                    <Key className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-4">
                    <Label className="text-gray-400">Account Security</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Two-Factor Authentication</div>
                        <div className="text-xs text-gray-500">Add an extra layer of security to your account</div>
                      </div>
                      <Button variant="outline" className="border-gray-800 text-gray-200">Enable</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Activity Log</div>
                        <div className="text-xs text-gray-500">View recent activity and login attempts</div>
                      </div>
                      <Button variant="outline" className="border-gray-800 text-gray-200">View Log</Button>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <div className="space-y-4">
                    <Label className="text-gray-400 text-sm">Privacy Options</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Make Profile Public</div>
                        <div className="text-xs text-gray-500">Allow others to view your achievements</div>
                      </div>
                      <Switch id="public-profile" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-gray-200">Share Activity</div>
                        <div className="text-xs text-gray-500">Share goal activities with connections</div>
                      </div>
                      <Switch id="share-activity" defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card border border-red-900 border-opacity-30 mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-red-100">Danger Zone</CardTitle>
                <CardDescription className="text-gray-400">Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-900 border-opacity-30 rounded-md bg-red-900 bg-opacity-10">
                  <div>
                    <h4 className="text-sm font-medium text-red-300">Log Out of All Devices</h4>
                    <p className="text-xs text-gray-400 mt-1">This will sign you out from all devices except this one</p>
                  </div>
                  <Button variant="outline" className="border-red-800 text-red-200 hover:bg-red-900 hover:bg-opacity-30">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out All
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-900 border-opacity-30 rounded-md bg-red-900 bg-opacity-10">
                  <div>
                    <h4 className="text-sm font-medium text-red-300">Delete Account</h4>
                    <p className="text-xs text-gray-400 mt-1">This action is irreversible. All your data will be permanently deleted.</p>
                  </div>
                  <Button variant="outline" className="border-red-800 text-red-200 hover:bg-red-900 hover:bg-opacity-30">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Data Management Settings */}
          <div className={activeTab === "data" ? "block" : "hidden"}>
            <Card className="card border border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100">Data Management</CardTitle>
                <CardDescription>Manage your data and export/import options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-gray-400">Export Data</Label>
                  
                  <div className="space-y-4 p-4 border border-blue-900 border-opacity-30 rounded-md bg-blue-900 bg-opacity-10">
                    <div>
                      <h4 className="text-sm font-medium text-blue-200">Download Your Data</h4>
                      <p className="text-xs text-gray-400 mt-1">Export all your goals, progress logs, and achievements</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className="border-blue-800 text-blue-200 hover:bg-blue-900 hover:bg-opacity-30">
                        <Download className="h-4 w-4 mr-2" />
                        Export as JSON
                      </Button>
                      <Button variant="outline" className="border-blue-800 text-blue-200 hover:bg-blue-900 hover:bg-opacity-30">
                        <Download className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button variant="outline" className="border-blue-800 text-blue-200 hover:bg-blue-900 hover:bg-opacity-30">
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <Label className="text-gray-400">Import Data</Label>
                  
                  <div className="space-y-4 p-4 border border-green-900 border-opacity-30 rounded-md bg-green-900 bg-opacity-10">
                    <div>
                      <h4 className="text-sm font-medium text-green-200">Import Data</h4>
                      <p className="text-xs text-gray-400 mt-1">Upload previously exported data or import from other services</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className="border-green-800 text-green-200 hover:bg-green-900 hover:bg-opacity-30">
                        <Upload className="h-4 w-4 mr-2" />
                        Import from File
                      </Button>
                      <Button variant="outline" className="border-green-800 text-green-200 hover:bg-green-900 hover:bg-opacity-30">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync External Service
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-800" />
                  
                  <Label className="text-gray-400">Data Retention</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data-retention" className="text-sm text-gray-500">Automatically delete inactive goals after</Label>
                    <Select defaultValue="never">
                      <SelectTrigger className="bg-gray-900 border-gray-800 text-gray-200">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="6months">6 Months</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="2years">2 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-gray-200">Auto Backup</div>
                      <div className="text-xs text-gray-500">Automatically backup your data weekly</div>
                    </div>
                    <Switch id="auto-backup" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-800 px-6 py-4">
                <Button className="btn-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Save Data Preferences
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;