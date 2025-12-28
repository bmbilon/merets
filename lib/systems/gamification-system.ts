import { SkillId } from './skills-system';

// ================================
// LEVEL SYSTEM (Identity + Progression) 
// ================================

export type PlayerLevel = 1 | 2 | 3 | 4 | 5;

export interface PlayerTitle {
  level: PlayerLevel;
  name: string;
  description: string;
  stickerRequirement: number;
  unlocks: string[];
  color: string;
  icon: string;
}

export const PLAYER_TITLES: Record<PlayerLevel, PlayerTitle> = {
  1: {
    level: 1,
    name: "Helper",
    description: "Just getting started!",
    stickerRequirement: 0,
    unlocks: ["Basic skill missions", "Simple badges"],
    color: "#9E9E9E",
    icon: "account-child"
  },
  2: {
    level: 2,
    name: "Contributor", 
    description: "Starting to make a difference!",
    stickerRequirement: 5,
    unlocks: ["Responsibility badges", "Basic power-ups", "Streak tracking"],
    color: "#4CAF50",
    icon: "account-check"
  },
  3: {
    level: 3,
    name: "Builder",
    description: "Creating real value!",
    stickerRequirement: 15,
    unlocks: ["Business badges", "Quest system", "Avatar upgrades"],
    color: "#2196F3",
    icon: "account-hard-hat"
  },
  4: {
    level: 4,
    name: "Operator",
    description: "Running things smoothly!",
    stickerRequirement: 30,
    unlocks: ["Leadership badges", "Advanced power-ups", "Mentor missions"],
    color: "#FF9800",
    icon: "account-supervisor"
  },
  5: {
    level: 5,
    name: "Master",
    description: "True expertise and leadership!",
    stickerRequirement: 60,
    unlocks: ["Master badges", "Premium power-ups", "Quest creation"],
    color: "#9C27B0",
    icon: "account-star"
  }
};

// ================================
// COMPREHENSIVE BADGE SYSTEM
// ================================

export type BadgeCategory = 'SKILL' | 'RESPONSIBILITY' | 'BUSINESS' | 'ACHIEVEMENT' | 'STREAK' | 'SPECIAL';

export interface GameBadge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  skillId?: SkillId;
  icon: string;
  color: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirements: string[];
  flavorText?: string;
  earnedAt?: number; // timestamp when earned
}

// SKILL BADGES (Identity + Competence)
export const SKILL_BADGES: GameBadge[] = [
  // Tool/Building Badges (Your Power Drill Example!)
  {
    id: 'POWER_TOOL_APPRENTICE',
    name: 'Power Tool Apprentice',
    description: 'Safely used power tools under supervision',
    category: 'SKILL',
    skillId: 'TOOLS',
    icon: 'drill',
    color: '#795548',
    rarity: 'COMMON',
    requirements: ['Use drill/saw/driver safely', 'Follow safety protocols'],
    flavorText: 'Real tools for real builders!'
  },
  {
    id: 'FIX_IT_HELPER',
    name: 'Fix-It Helper',
    description: 'Assisted in repairs and builds',
    category: 'SKILL', 
    skillId: 'TOOLS',
    icon: 'wrench',
    color: '#795548',
    rarity: 'COMMON',
    requirements: ['Help with 3 repair projects', 'Follow tool safety'],
    flavorText: 'Every master builder started as a helper!'
  },
  {
    id: 'TOOL_CARETAKER',
    name: 'Tool Caretaker',
    description: 'Cleaned and returned tools properly',
    category: 'SKILL',
    skillId: 'TOOLS', 
    icon: 'toolbox',
    color: '#795548',
    rarity: 'COMMON',
    requirements: ['Clean tools after use', 'Organize tool storage'],
    flavorText: 'A craftsperson respects their tools!'
  },
  {
    id: 'BUILDER',
    name: 'Builder',
    description: 'Helped construct something physical',
    category: 'SKILL',
    skillId: 'TOOLS',
    icon: 'hammer',
    color: '#795548', 
    rarity: 'RARE',
    requirements: ['Complete a build project', 'Use multiple tools safely'],
    flavorText: 'You made something real with your hands!'
  },
  {
    id: 'POWER_TOOL_OPERATOR', 
    name: 'Power Tool Operator',
    description: 'Advanced power tool usage',
    category: 'SKILL',
    skillId: 'TOOLS',
    icon: 'saw-blade',
    color: '#795548',
    rarity: 'EPIC',
    requirements: ['Power Tool Apprentice badge', '10+ power tool uses'],
    flavorText: 'Mastering the tools that build the world!'
  },

  // Kitchen/Food Badges
  {
    id: 'KITCHEN_CAPTAIN',
    name: 'Kitchen Captain',
    description: 'Maintained kitchen perfection for 5 days',
    category: 'RESPONSIBILITY',
    skillId: 'DISHES',
    icon: 'chef-hat',
    color: '#4CAF50',
    rarity: 'RARE',
    requirements: ['5 consecutive days of dish commitments', 'Perfect ratings'],
    flavorText: 'The kitchen runs smoothly under your watch!'
  },
  {
    id: 'SNOW_GUARDIAN',
    name: 'Snow Guardian',
    description: 'Kept walkways safe all winter',
    category: 'RESPONSIBILITY',
    skillId: 'YARD',
    icon: 'snowflake',
    color: '#2196F3',
    rarity: 'RARE',
    requirements: ['3+ snow clearing commitments', 'No missed snow days'],
    flavorText: 'When winter comes, you rise to meet it!'
  },
  {
    id: 'DELIVERY_DEFENDER',
    name: 'Delivery Defender',
    description: 'Protected packages for a full week',
    category: 'RESPONSIBILITY',
    skillId: 'YARD',
    icon: 'package-variant',
    color: '#FF9800',
    rarity: 'COMMON',
    requirements: ['Bring in packages daily for 7 days'],
    flavorText: 'No package left behind on your watch!'
  },
  {
    id: 'HOUSE_STEWARD',
    name: 'House Steward',
    description: 'Completed 10 household commitments',
    category: 'RESPONSIBILITY',
    icon: 'home-heart',
    color: '#E91E63',
    rarity: 'COMMON',
    requirements: ['10+ household commitments completed'],
    flavorText: 'This house is your castle, and you care for it!'
  },
  {
    id: 'ANIMAL_CARETAKER',
    name: 'Animal Caretaker',
    description: 'Cared for pets and their habitat',
    category: 'RESPONSIBILITY',
    icon: 'turtle',  // Perfect for your tortoise!
    color: '#8BC34A',
    rarity: 'RARE',
    requirements: ['Pet care commitments', 'Habitat maintenance'],
    flavorText: 'Every creature deserves love and care!'
  }
];

// BUSINESS/WORK ETHIC BADGES
export const BUSINESS_BADGES: GameBadge[] = [
  {
    id: 'OPERATIONS_ASSISTANT',
    name: 'Operations Assistant',
    description: 'Helped with business operations',
    category: 'BUSINESS',
    icon: 'briefcase',
    color: '#607D8B',
    rarity: 'RARE',
    requirements: ['Assist with business tasks', 'Follow procedures'],
    flavorText: 'Every business needs reliable operators!'
  },
  {
    id: 'PRODUCTION_HELPER',
    name: 'Production Helper',
    description: 'Assisted with making or creating',
    category: 'BUSINESS',
    icon: 'factory',
    color: '#607D8B',
    rarity: 'RARE',
    requirements: ['Help produce something', 'Maintain quality standards'],
    flavorText: 'From raw materials to finished products!'
  },
  {
    id: 'PROBLEM_SOLVER',
    name: 'Problem Solver',
    description: 'Suggested valuable improvements',
    category: 'BUSINESS',
    icon: 'lightbulb',
    color: '#FFC107',
    rarity: 'EPIC',
    requirements: ['Suggest process improvement', 'Improvement gets implemented'],
    flavorText: 'Innovation starts with seeing better ways!'
  },
  {
    id: 'FOCUSED_WORKER',
    name: 'Focused Worker',
    description: 'Completed 90-minute deep work block',
    category: 'BUSINESS', 
    icon: 'timer',
    color: '#3F51B5',
    rarity: 'RARE',
    requirements: ['90+ minute focused work session', 'No breaks or distractions'],
    flavorText: 'Deep work builds deep value!'
  },
  {
    id: 'QUALITY_CONTROL',
    name: 'Quality Control',
    description: 'Consistently checked work carefully',
    category: 'BUSINESS',
    icon: 'check-circle',
    color: '#4CAF50',
    rarity: 'RARE',
    requirements: ['5+ Perfect quality ratings', 'No missed details'],
    flavorText: 'Excellence is in the details!'
  }
];

// ================================
// STREAK SYSTEM 
// ================================

export type StreakType = 'DAILY_HONOR' | 'NO_MISS' | 'FOCUS' | 'SKILL_SPECIFIC';

export interface Streak {
  type: StreakType;
  current: number;
  best: number;
  lastUpdate: string; // YYYY-MM-DD
  isActive: boolean;
  skillId?: SkillId; // For skill-specific streaks
}

export const STREAK_DEFINITIONS: Record<StreakType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  milestones: number[]; // Days that unlock rewards
}> = {
  DAILY_HONOR: {
    name: 'Daily Honor',
    description: 'Complete at least one commitment every day',
    icon: 'fire',
    color: '#F44336',
    milestones: [3, 7, 14, 30, 60, 100]
  },
  NO_MISS: {
    name: 'No-Miss',
    description: 'Days without any missed commitments',
    icon: 'target',
    color: '#4CAF50',
    milestones: [5, 10, 21, 50]
  },
  FOCUS: {
    name: 'Focus',
    description: 'Complete multiple 90+ minute sessions per week',
    icon: 'brain',
    color: '#9C27B0',
    milestones: [2, 4, 8, 12]
  },
  SKILL_SPECIFIC: {
    name: 'Skill Focus',
    description: 'Consecutive days working on the same skill',
    icon: 'trending-up',
    color: '#FF9800',
    milestones: [3, 7, 14, 30]
  }
};

// ================================
// POWER-UPS SYSTEM
// ================================

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  stickerCost?: number; // Cost in stickers
  streakUnlock?: { type: StreakType; milestone: number }; // OR unlocked by streak
  cooldown: number; // Days before can use again
  category: 'PRIVILEGE' | 'BONUS' | 'SKIP';
  flavorText: string;
}

export const POWER_UPS: PowerUp[] = [
  {
    id: 'CHOOSE_MOVIE',
    name: 'Family Movie Pick',
    description: 'Choose the next family movie night film',
    icon: 'movie',
    color: '#E91E63',
    stickerCost: 3,
    cooldown: 7, // Once per week
    category: 'PRIVILEGE',
    flavorText: 'Tonight, your choice rules the screen!'
  },
  {
    id: 'PICK_DINNER',
    name: 'Dinner Choice',
    description: 'Pick what the family has for dinner',
    icon: 'food',
    color: '#FF9800', 
    stickerCost: 4,
    cooldown: 3,
    category: 'PRIVILEGE',
    flavorText: 'The family feast follows your desires!'
  },
  {
    id: 'EXTRA_SCREEN_TIME',
    name: '+30 Min Screen Time',
    description: 'Earn 30 extra minutes of screen time',
    icon: 'monitor',
    color: '#2196F3',
    stickerCost: 2,
    cooldown: 2,
    category: 'BONUS',
    flavorText: 'More time in your digital worlds!'
  },
  {
    id: 'MUSIC_CONTROL',
    name: 'Chore Music DJ',
    description: 'Control music during family chore time',
    icon: 'music',
    color: '#9C27B0',
    streakUnlock: { type: 'DAILY_HONOR', milestone: 7 },
    cooldown: 1,
    category: 'PRIVILEGE',
    flavorText: 'Set the rhythm for productivity!'
  },
  {
    id: 'SKIP_MINOR_CHORE',
    name: 'Chore Skip Pass',
    description: 'Skip one minor household chore (use carefully!)',
    icon: 'skip-forward',
    color: '#795548',
    stickerCost: 5,
    cooldown: 14, // Two weeks cooldown
    category: 'SKIP',
    flavorText: 'Everyone needs a break sometimes!'
  },
  {
    id: 'LATE_BEDTIME',
    name: '+30 Min Bedtime',
    description: 'Stay up 30 minutes later (weekend only)',
    icon: 'sleep',
    color: '#3F51B5',
    streakUnlock: { type: 'NO_MISS', milestone: 10 },
    cooldown: 7,
    category: 'PRIVILEGE',
    flavorText: 'The night is young for a responsible kid!'
  }
];

// ================================
// QUEST SYSTEM
// ================================

export interface Quest {
  id: string;
  name: string;
  description: string;
  story: string; // Narrative motivation
  icon: string;
  color: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
  estimatedTime: string; // "2-3 days", "1 week"
  
  // Requirements
  tasks: QuestTask[];
  
  // Rewards
  stickerBonus: number;
  xpBonus?: number;
  badgeReward?: string; // Badge ID
  powerUpReward?: string; // Power-up ID
  
  // State
  isActive: boolean;
  progress: QuestProgress;
}

export interface QuestTask {
  id: string;
  description: string;
  stickerReward: number;
  skillId?: SkillId;
  isCompleted: boolean;
  commitmentId?: string; // Links to actual commitment
}

export interface QuestProgress {
  tasksCompleted: number;
  totalTasks: number;
  isComplete: boolean;
  completedAt?: number;
}

// Example Quests
export const AVAILABLE_QUESTS: Quest[] = [
  {
    id: 'HOUSE_RESET_QUEST',
    name: 'House Reset Quest',
    description: 'Restore order to the household',
    story: 'Chaos has crept into the home! As a Guardian of Order, you must restore balance to each domain.',
    icon: 'home-variant',
    color: '#4CAF50',
    difficulty: 'EASY',
    estimatedTime: '1-2 days',
    stickerBonus: 2,
    badgeReward: 'HOUSE_STEWARD',
    isActive: false,
    progress: { tasksCompleted: 0, totalTasks: 3, isComplete: false },
    tasks: [
      {
        id: 'clear_sink',
        description: 'Clear and clean the kitchen sink completely',
        stickerReward: 1,
        skillId: 'DISHES',
        isCompleted: false
      },
      {
        id: 'vacuum_entryway',
        description: 'Vacuum the entryway and organize shoes',
        stickerReward: 1, 
        skillId: 'CLEANING',
        isCompleted: false
      },
      {
        id: 'recycling_run',
        description: 'Take out all recycling to the curb',
        stickerReward: 1,
        skillId: 'YARD',
        isCompleted: false
      }
    ]
  },
  {
    id: 'BUILDER_QUEST',
    name: 'Builder Quest',
    description: 'Prove yourself as a true builder',
    story: 'The workshop calls for a new apprentice. Show your dedication to the craft through skill, safety, and service.',
    icon: 'hammer',
    color: '#795548',
    difficulty: 'MEDIUM',
    estimatedTime: '1 week',
    stickerBonus: 3,
    xpBonus: 50,
    badgeReward: 'BUILDER',
    isActive: false,
    progress: { tasksCompleted: 0, totalTasks: 3, isComplete: false },
    tasks: [
      {
        id: 'tool_project',
        description: 'Assist with a building project using power tools',
        stickerReward: 2,
        skillId: 'TOOLS',
        isCompleted: false
      },
      {
        id: 'safety_mastery',
        description: 'Demonstrate tool safety knowledge and procedures',
        stickerReward: 1,
        skillId: 'TOOLS',
        isCompleted: false
      },
      {
        id: 'workspace_stewardship',
        description: 'Clean and organize the workspace after project',
        stickerReward: 1,
        skillId: 'TOOLS',
        isCompleted: false
      }
    ]
  },
  {
    id: 'WINTER_GUARDIAN_QUEST',
    name: 'Winter Guardian Quest', 
    description: 'Master the challenges of winter',
    story: 'Winter has arrived, and the household needs a guardian against ice and snow. Will you rise to protect your family?',
    icon: 'snowflake',
    color: '#2196F3',
    difficulty: 'HARD',
    estimatedTime: '2 weeks',
    stickerBonus: 5,
    badgeReward: 'SNOW_GUARDIAN',
    powerUpReward: 'CHOOSE_MOVIE',
    isActive: false,
    progress: { tasksCompleted: 0, totalTasks: 4, isComplete: false },
    tasks: [
      {
        id: 'clear_walkways',
        description: 'Clear snow from all walkways and entryways',
        stickerReward: 1,
        skillId: 'YARD',
        isCompleted: false
      },
      {
        id: 'protect_packages',
        description: 'Bring in packages immediately when delivered',
        stickerReward: 1,
        skillId: 'YARD',
        isCompleted: false
      },
      {
        id: 'ice_watch',
        description: 'Check for and report any ice hazards',
        stickerReward: 1,
        skillId: 'YARD',
        isCompleted: false
      },
      {
        id: 'winter_gear',
        description: 'Maintain winter gear and tools in ready condition',
        stickerReward: 2,
        skillId: 'YARD',
        isCompleted: false
      }
    ]
  }
];

// ================================
// UTILITY FUNCTIONS
// ================================

export function getPlayerLevel(lifetimeStickers: number): PlayerLevel {
  if (lifetimeStickers >= 60) return 5;
  if (lifetimeStickers >= 30) return 4;
  if (lifetimeStickers >= 15) return 3;
  if (lifetimeStickers >= 5) return 2;
  return 1;
}

export function getNextLevelProgress(lifetimeStickers: number): {
  currentLevel: PlayerLevel;
  nextLevel: PlayerLevel | null;
  progress: number;
  stickersNeeded: number;
} {
  const currentLevel = getPlayerLevel(lifetimeStickers);
  
  if (currentLevel === 5) {
    return {
      currentLevel: 5,
      nextLevel: null,
      progress: 1.0,
      stickersNeeded: 0
    };
  }
  
  const nextLevel = (currentLevel + 1) as PlayerLevel;
  const currentThreshold = PLAYER_TITLES[currentLevel].stickerRequirement;
  const nextThreshold = PLAYER_TITLES[nextLevel].stickerRequirement;
  
  const progress = Math.max(0, (lifetimeStickers - currentThreshold) / (nextThreshold - currentThreshold));
  const stickersNeeded = nextThreshold - lifetimeStickers;
  
  return {
    currentLevel,
    nextLevel,
    progress,
    stickersNeeded
  };
}

export function updateStreak(streak: Streak, completedToday: boolean, dateStr: string): Streak {
  const today = dateStr;
  const yesterday = new Date(new Date(dateStr).getTime() - 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  
  if (streak.lastUpdate === today) {
    // Already updated today, no change needed
    return streak;
  }
  
  if (completedToday) {
    // Extend or start streak
    if (streak.lastUpdate === yesterday && streak.isActive) {
      // Consecutive day - extend streak
      const newCurrent = streak.current + 1;
      return {
        ...streak,
        current: newCurrent,
        best: Math.max(streak.best, newCurrent),
        lastUpdate: today,
        isActive: true
      };
    } else {
      // Start new streak
      return {
        ...streak,
        current: 1,
        best: Math.max(streak.best, 1),
        lastUpdate: today,
        isActive: true
      };
    }
  } else {
    // Didn't complete today - break streak if it was yesterday
    if (streak.lastUpdate === yesterday && streak.isActive) {
      return {
        ...streak,
        current: 0,
        lastUpdate: today,
        isActive: false
      };
    }
    // Otherwise, just update date without changing streak
    return {
      ...streak,
      lastUpdate: today
    };
  }
}

export function checkBadgeEligibility(
  badge: GameBadge,
  playerData: any // Will contain stickers, commitments, skills, etc.
): boolean {
  // This would contain the logic for checking if a player has earned a specific badge
  // Implementation would depend on the specific badge requirements
  // For now, returning false as placeholder
  return false;
}
