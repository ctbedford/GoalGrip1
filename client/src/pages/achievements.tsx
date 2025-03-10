import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Award, 
  Trophy, 
  Star, 
  Medal, 
  ThumbsUp, 
  Target, 
  Flame, 
  Zap, 
  Share2,
  Clock,
  CalendarClock,
  BookOpen,
  Calendar,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { Badge as BadgeType } from "@shared/schema";

// Badge component with animation
const AchievementBadge: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  date?: string;
  isLocked?: boolean;
  progress?: number;
}> = ({ 
  title, 
  description, 
  icon, 
  bgColor, 
  borderColor, 
  iconColor, 
  date, 
  isLocked = false,
  progress = 100 
}) => {
  return (
    <Card className={`achievement-card relative overflow-hidden transition-all duration-300 border ${borderColor} hover:shadow-lg hover:translate-y-[-5px] ${isLocked ? 'opacity-70' : ''}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${bgColor}`}></div>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full ${bgColor} bg-opacity-20 flex items-center justify-center mb-4 border ${borderColor} relative`}>
            <div className={`w-16 h-16 rounded-full ${bgColor} bg-opacity-30 flex items-center justify-center`}>
              <div className={iconColor}>{icon}</div>
            </div>
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-900 bg-opacity-60">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          <h3 className="text-lg font-bold text-gray-100 mb-2">{title}</h3>
          <p className="text-sm text-gray-400 mb-4">{description}</p>
          
          {isLocked && progress < 100 && (
            <div className="w-full mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-gray-800" indicatorClassName={bgColor} />
            </div>
          )}
          
          {!isLocked && (
            <>
              <Badge className={`${bgColor} ${borderColor} text-gray-100`}>
                {date || "Unlocked"}
              </Badge>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-4 text-xs text-gray-400 hover:text-gray-300"
              >
                <Share2 className="h-3 w-3 mr-1" /> Share
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Mock of a Lock icon if not available
const Lock = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
};

const Achievements: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Fetch badges
  const { data: badges, isLoading } = useQuery<BadgeType[]>({
    queryKey: ['/api/badges'],
  });
  
  // Hardcoded achievements for display
  const achievementCategories = [
    {
      id: "streaks",
      name: "Streaks & Consistency",
      achievements: [
        {
          id: 1,
          title: "First Steps",
          description: "Log progress for 3 days in a row",
          icon: <Flame className="w-8 h-8" />,
          bgColor: "bg-amber-600",
          borderColor: "border-amber-800",
          iconColor: "text-amber-300",
          date: "Mar 3, 2023",
          isLocked: false,
          progress: 100
        },
        {
          id: 2,
          title: "Consistency Master",
          description: "Log progress for 7 days in a row",
          icon: <Flame className="w-8 h-8" />,
          bgColor: "bg-amber-600",
          borderColor: "border-amber-800",
          iconColor: "text-amber-300",
          date: "Mar 7, 2023",
          isLocked: false,
          progress: 100
        },
        {
          id: 3,
          title: "Dedicated Tracker",
          description: "Log progress for 30 days in a row",
          icon: <Flame className="w-8 h-8" />,
          bgColor: "bg-amber-600",
          borderColor: "border-amber-800",
          iconColor: "text-amber-300",
          isLocked: true,
          progress: 67
        }
      ]
    },
    {
      id: "milestones",
      name: "Goal Milestones",
      achievements: [
        {
          id: 4,
          title: "Goal Setter",
          description: "Create your first goal",
          icon: <Target className="w-8 h-8" />,
          bgColor: "bg-blue-600",
          borderColor: "border-blue-800",
          iconColor: "text-blue-300",
          date: "Feb 28, 2023",
          isLocked: false,
          progress: 100
        },
        {
          id: 5,
          title: "Progress Tracker",
          description: "Log progress 10 times",
          icon: <Target className="w-8 h-8" />,
          bgColor: "bg-blue-600",
          borderColor: "border-blue-800",
          iconColor: "text-blue-300",
          date: "Mar 5, 2023",
          isLocked: false,
          progress: 100
        },
        {
          id: 6,
          title: "Goal Completer",
          description: "Complete 5 goals",
          icon: <Target className="w-8 h-8" />,
          bgColor: "bg-blue-600",
          borderColor: "border-blue-800",
          iconColor: "text-blue-300",
          isLocked: true,
          progress: 40
        }
      ]
    },
    {
      id: "categories",
      name: "Category Specific",
      achievements: [
        {
          id: 7,
          title: "Fitness Enthusiast",
          description: "Complete 3 fitness goals",
          icon: <Dumbbell className="w-8 h-8" />,
          bgColor: "bg-green-600",
          borderColor: "border-green-800",
          iconColor: "text-green-300",
          isLocked: true,
          progress: 33
        },
        {
          id: 8,
          title: "Scholar",
          description: "Complete 3 education goals",
          icon: <GraduationCap className="w-8 h-8" />,
          bgColor: "bg-purple-600",
          borderColor: "border-purple-800",
          iconColor: "text-purple-300",
          isLocked: true,
          progress: 66
        },
        {
          id: 9,
          title: "Career Climber",
          description: "Complete 3 career goals",
          icon: <Briefcase className="w-8 h-8" />,
          bgColor: "bg-red-600",
          borderColor: "border-red-800",
          iconColor: "text-red-300",
          date: "Mar 1, 2023",
          isLocked: false,
          progress: 100
        }
      ]
    },
    {
      id: "special",
      name: "Special Achievements",
      achievements: [
        {
          id: 10,
          title: "Overachiever",
          description: "Complete a goal before the deadline",
          icon: <Zap className="w-8 h-8" />,
          bgColor: "bg-cyan-600",
          borderColor: "border-cyan-800",
          iconColor: "text-cyan-300",
          date: "Mar 8, 2023",
          isLocked: false,
          progress: 100
        },
        {
          id: 11,
          title: "Perfect Planner",
          description: "Create goals in all categories",
          icon: <CalendarClock className="w-8 h-8" />,
          bgColor: "bg-pink-600",
          borderColor: "border-pink-800", 
          iconColor: "text-pink-300",
          isLocked: true,
          progress: 80
        },
        {
          id: 12,
          title: "Goal Master",
          description: "Complete 50 goals total",
          icon: <Trophy className="w-8 h-8" />,
          bgColor: "bg-yellow-600",
          borderColor: "border-yellow-800",
          iconColor: "text-yellow-300",
          isLocked: true,
          progress: 4
        }
      ]
    }
  ];
  
  // Filter achievements based on active tab
  const filteredCategories = activeTab === "all" 
    ? achievementCategories 
    : achievementCategories.filter(cat => cat.id === activeTab);
  
  // Calculate stats
  const totalAchievements = achievementCategories.reduce((acc, cat) => acc + cat.achievements.length, 0);
  const unlockedAchievements = achievementCategories.reduce((acc, cat) => 
    acc + cat.achievements.filter(a => !a.isLocked).length, 0);
  const unlockedPercentage = (unlockedAchievements / totalAchievements) * 100;
  
  return (
    <div>
      {/* Enhanced Page Header */}
      <div className="mb-8 rounded-lg overflow-hidden relative">
        <div className="bg-gradient-to-r from-gray-900 via-yellow-900 to-gray-900 p-6 border border-gray-800">
          <div className="relative z-10 max-w-3xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-100 to-amber-200 bg-clip-text text-transparent mb-2">
              Achievements & Badges
            </h2>
            <p className="text-gray-300 mb-6">Track your progress and unlock rewards for your efforts</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-yellow-900 bg-opacity-30 flex items-center justify-center border border-yellow-800 mr-4">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Unlocked</div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-white mr-2">{unlockedAchievements}</span>
                    <span className="text-sm text-gray-400">of {totalAchievements} achievements</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(unlockedPercentage)}%</span>
                </div>
                <Progress value={unlockedPercentage} className="h-2 bg-gray-800" indicatorClassName="bg-yellow-600" />
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
            <div className="absolute top-6 right-8 w-24 h-24 rounded-full bg-yellow-500 blur-3xl"></div>
            <div className="absolute bottom-8 right-16 w-32 h-32 rounded-full bg-amber-400 blur-3xl"></div>
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
      </div>
      
      {/* Showcase Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-1 h-6 bg-yellow-600 rounded-full mr-3 shadow-glow-amber"></div>
          <h3 className="text-lg font-semibold text-gray-100">SHOWCASE</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="card border border-yellow-900 border-opacity-30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-600 to-amber-900 opacity-10 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-yellow-900 bg-opacity-30 flex items-center justify-center border border-yellow-800">
                    <Trophy className="w-12 h-12 text-yellow-300" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center border-2 border-gray-900">
                    <Star className="w-5 h-5 text-yellow-100" fill="currentColor" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-yellow-100 mb-2">Goal Master</h3>
                <p className="text-sm text-gray-400 mb-4">Highest achievement unlocked by completing 50 goals</p>
                
                <Badge className="bg-yellow-900 border-yellow-800 text-yellow-100 mb-2">
                  Top 5% of users
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-yellow-800 text-yellow-100 hover:bg-yellow-900 hover:bg-opacity-30"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share Achievement
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card border border-green-900 border-opacity-30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-green-600 to-emerald-900 opacity-10 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-green-900 bg-opacity-30 flex items-center justify-center border border-green-800">
                    <Flame className="w-12 h-12 text-green-300" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center border-2 border-gray-900">
                    <Medal className="w-5 h-5 text-green-100" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-green-100 mb-2">100-Day Streak</h3>
                <p className="text-sm text-gray-400 mb-4">Logged progress for 100 consecutive days</p>
                
                <Badge className="bg-green-900 border-green-800 text-green-100 mb-2">
                  Top 10% of users
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-green-800 text-green-100 hover:bg-green-900 hover:bg-opacity-30"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share Achievement
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card border border-blue-900 border-opacity-30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-600 to-indigo-900 opacity-10 pointer-events-none"></div>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-blue-900 bg-opacity-30 flex items-center justify-center border border-blue-800">
                    <Target className="w-12 h-12 text-blue-300" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-900">
                    <ThumbsUp className="w-5 h-5 text-blue-100" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-blue-100 mb-2">Fast Achiever</h3>
                <p className="text-sm text-gray-400 mb-4">Completed 5 goals ahead of schedule</p>
                
                <Badge className="bg-blue-900 border-blue-800 text-blue-100 mb-2">
                  Recently earned
                </Badge>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-blue-800 text-blue-100 hover:bg-blue-900 hover:bg-opacity-30"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share Achievement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Achievements Tabs */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="border border-gray-800 bg-gray-900 p-1">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="streaks" 
              className="data-[state=active]:bg-amber-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
            >
              Streaks
            </TabsTrigger>
            <TabsTrigger 
              value="milestones" 
              className="data-[state=active]:bg-blue-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
            >
              Milestones
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="data-[state=active]:bg-green-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="special" 
              className="data-[state=active]:bg-cyan-900 data-[state=active]:text-gray-100 data-[state=active]:shadow-none"
            >
              Special
            </TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" className="border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="pt-2 space-y-8">
          {filteredCategories.map(category => (
            <div key={category.id}>
              <div className="flex items-center mb-4">
                <h3 className="text-md font-semibold text-gray-300">{category.name}</h3>
                <div className="ml-3 h-px flex-grow bg-gray-800"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                {category.achievements.map(achievement => (
                  <AchievementBadge
                    key={achievement.id}
                    title={achievement.title}
                    description={achievement.description}
                    icon={achievement.icon}
                    bgColor={achievement.bgColor}
                    borderColor={achievement.borderColor}
                    iconColor={achievement.iconColor}
                    date={achievement.date}
                    isLocked={achievement.isLocked}
                    progress={achievement.progress}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
        
        {achievementCategories.map(category => (
          <TabsContent key={category.id} value={category.id} className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.achievements.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  bgColor={achievement.bgColor}
                  borderColor={achievement.borderColor}
                  iconColor={achievement.iconColor}
                  date={achievement.date}
                  isLocked={achievement.isLocked}
                  progress={achievement.progress}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Upcoming Achievements */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="w-1 h-6 bg-gray-600 rounded-full mr-3"></div>
          <h3 className="text-lg font-semibold text-gray-100">NEXT ACHIEVEMENTS</h3>
        </div>
        
        <div className="space-y-4">
          {achievementCategories
            .flatMap(cat => cat.achievements)
            .filter(ach => ach.isLocked && ach.progress > 0)
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3)
            .map(achievement => (
              <Card key={achievement.id} className="card border border-gray-800 bg-black bg-opacity-60">
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full ${achievement.bgColor} bg-opacity-20 flex items-center justify-center mr-4 border ${achievement.borderColor}`}>
                      <div className={achievement.iconColor}>{achievement.icon}</div>
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-md font-medium text-gray-100">{achievement.title}</h4>
                        <span className="text-sm text-gray-400">{achievement.progress}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                      <Progress value={achievement.progress} className="h-2 bg-gray-800" indicatorClassName={achievement.bgColor} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Achievements;