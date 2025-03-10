import { 
  users, type User, type InsertUser,
  goals, type Goal, type InsertGoal,
  progressLogs, type ProgressLog, type InsertProgressLog,
  categories, type Category, type InsertCategory,
  actionItems, type ActionItem, type InsertActionItem,
  badges, type Badge, type InsertBadge,
  type GoalWithCategory,
  type DashboardStats
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User>;
  
  // Goal operations
  getGoals(userId: number): Promise<GoalWithCategory[]>;
  getGoal(id: number): Promise<GoalWithCategory | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Progress operations
  getProgressLogs(goalId: number): Promise<ProgressLog[]>;
  createProgressLog(log: InsertProgressLog): Promise<ProgressLog>;
  
  // Action Items
  getActionItems(userId: number, date?: Date): Promise<(ActionItem & { goalDescription: string })[]>;
  createActionItem(item: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: number, completed: boolean): Promise<ActionItem>;
  
  // Badges
  getBadgesByUser(userId: number): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // Dashboard
  getDashboardStats(userId: number): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private goals: Map<number, Goal>;
  private categories: Map<number, Category>;
  private progressLogs: Map<number, ProgressLog>;
  private actionItems: Map<number, ActionItem>;
  private badges: Map<number, Badge>;
  
  private userId: number;
  private goalId: number;
  private categoryId: number;
  private progressLogId: number;
  private actionItemId: number;
  private badgeId: number;

  constructor() {
    this.users = new Map();
    this.goals = new Map();
    this.categories = new Map();
    this.progressLogs = new Map();
    this.actionItems = new Map();
    this.badges = new Map();
    
    this.userId = 1;
    this.goalId = 1;
    this.categoryId = 1;
    this.progressLogId = 1;
    this.actionItemId = 1;
    this.badgeId = 1;
    
    // Initialize with some default categories
    this.createCategory({ name: 'Fitness', color: '#4f46e5' });
    this.createCategory({ name: 'Learning', color: '#f59e0b' });
    this.createCategory({ name: 'Health', color: '#10b981' });
    this.createCategory({ name: 'Finance', color: '#06b6d4' });
    this.createCategory({ name: 'Career', color: '#8b5cf6' });
    this.createCategory({ name: 'Personal', color: '#ec4899' });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, points: 0, level: 1 };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserPoints(userId: number, points: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const newPoints = user.points + points;
    // Simple level calculation (every 100 points = 1 level)
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    const updatedUser = { ...user, points: newPoints, level: newLevel };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Goal operations
  async getGoals(userId: number): Promise<GoalWithCategory[]> {
    const userGoals = Array.from(this.goals.values()).filter(
      (goal) => goal.userId === userId
    );
    
    return Promise.all(userGoals.map(async (goal) => {
      let category = undefined;
      if (goal.categoryId) {
        category = await this.getCategory(goal.categoryId);
      }
      return { ...goal, category };
    }));
  }

  async getGoal(id: number): Promise<GoalWithCategory | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    let category = undefined;
    if (goal.categoryId) {
      category = await this.getCategory(goal.categoryId);
    }
    return { ...goal, category };
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const newGoal: Goal = { 
      ...goal, 
      id, 
      currentValue: 0, 
      completed: false, 
      createdAt: new Date(),
      categoryId: goal.categoryId ?? null,
      reminderFrequency: goal.reminderFrequency || 'none'
    };
    this.goals.set(id, newGoal);
    
    // Generate action items based on the goal
    const daysUntilDeadline = Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDeadline > 0) {
      const dailyTarget = goal.targetValue / daysUntilDeadline;
      this.createActionItem({
        goalId: id,
        description: `Do ${dailyTarget.toFixed(1)} ${goal.unit} today`
      });
    }
    
    return newGoal;
  }

  async updateGoal(id: number, updates: Partial<Goal>): Promise<Goal> {
    const goal = this.goals.get(id);
    if (!goal) throw new Error('Goal not found');
    
    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Progress operations
  async getProgressLogs(goalId: number): Promise<ProgressLog[]> {
    return Array.from(this.progressLogs.values())
      .filter(log => log.goalId === goalId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createProgressLog(log: InsertProgressLog): Promise<ProgressLog> {
    const id = this.progressLogId++;
    const newLog: ProgressLog = { 
      ...log, 
      id, 
      date: new Date(),
      notes: log.notes ?? null 
    };
    this.progressLogs.set(id, newLog);
    
    // Update the goal's current value
    const goal = await this.getGoal(log.goalId);
    if (goal) {
      const newCurrentValue = goal.currentValue + log.value;
      const completed = newCurrentValue >= goal.targetValue;
      
      await this.updateGoal(log.goalId, { 
        currentValue: newCurrentValue,
        completed
      });
      
      // Award points for logging progress
      if (goal.userId) {
        await this.updateUserPoints(goal.userId, 10);
        
        // Check if goal is completed, award more points
        if (completed && !goal.completed) {
          await this.updateUserPoints(goal.userId, 50);
          
          // Create a badge for completing a goal
          await this.createBadge({
            userId: goal.userId,
            name: "Goal Achieved",
            description: `Completed "${goal.description}"`
          });
        }
      }
    }
    
    return newLog;
  }

  // Action Items
  async getActionItems(userId: number, date?: Date): Promise<(ActionItem & { goalDescription: string })[]> {
    const userGoals = await this.getGoals(userId);
    const goalIds = userGoals.map(goal => goal.id);
    
    let items = Array.from(this.actionItems.values())
      .filter(item => goalIds.includes(item.goalId));
    
    // Filter by date if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      items = items.filter(item => 
        item.date >= startOfDay && item.date <= endOfDay
      );
    }
    
    // Add goal descriptions
    return items.map(item => {
      const goal = userGoals.find(g => g.id === item.goalId);
      return {
        ...item,
        goalDescription: goal ? goal.description : "Unknown Goal"
      };
    });
  }

  async createActionItem(item: InsertActionItem): Promise<ActionItem> {
    const id = this.actionItemId++;
    const newItem: ActionItem = { 
      ...item, 
      id, 
      completed: false, 
      date: new Date() 
    };
    this.actionItems.set(id, newItem);
    return newItem;
  }

  async updateActionItem(id: number, completed: boolean): Promise<ActionItem> {
    const item = this.actionItems.get(id);
    if (!item) throw new Error('Action item not found');
    
    const updatedItem = { ...item, completed };
    this.actionItems.set(id, updatedItem);
    
    // If completed, award points to the user
    if (completed && !item.completed) {
      const goal = await this.getGoal(item.goalId);
      if (goal && goal.userId) {
        await this.updateUserPoints(goal.userId, 5);
      }
    }
    
    return updatedItem;
  }

  // Badges
  async getBadgesByUser(userId: number): Promise<Badge[]> {
    return Array.from(this.badges.values())
      .filter(badge => badge.userId === userId)
      .sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.badgeId++;
    const newBadge: Badge = { ...badge, id, achievedAt: new Date() };
    this.badges.set(id, newBadge);
    return newBadge;
  }

  // Dashboard
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const goals = await this.getGoals(userId);
    const user = await this.getUser(userId);
    
    return {
      activeGoals: goals.filter(g => !g.completed).length,
      completedGoals: goals.filter(g => g.completed).length,
      pointsEarned: user?.points || 0
    };
  }
}

export const storage = new MemStorage();
