// Skill System Types and Logic
export type SkillId = "LAUNDRY" | "DISHES" | "CLEANING" | "COOKING" | "YARD" | "TOOLS";

export type SkillLevel = 1 | 2 | 3 | 4;

export type SkillProgress = {
  level: SkillLevel;
  xp: number;                 // optional, but nice for bars
  completions: number;        // total completions in this skill
  perfects: number;           // quality "S-rank" completions
  lastLeveledAt?: number;
};

export type Badge = {
  id: string;                 // "LAUNDRY_PRECISION_FOLDER"
  name: string;
  description: string;
  earnedAt: number;
  skillId?: SkillId;
};

export type Quality = "MISS" | "PASS" | "PERFECT";
export type Difficulty = "BASIC" | "STANDARD" | "ADVANCED" | "MASTER";

// Skill Level Titles and Certification Info
export const SKILL_CERTIFICATIONS: Record<SkillId, Record<SkillLevel, {
  title: string;
  hourlyRate: number;
  requirements: string[];
  perfectsRequired: number;
}>> = {
  LAUNDRY: {
    1: {
      title: "Laundry Helper",
      hourlyRate: 12,
      requirements: ["Sort lights from darks", "Check pockets before wash", "Match sock pairs"],
      perfectsRequired: 3
    },
    2: {
      title: "Wash Specialist", 
      hourlyRate: 18,
      requirements: ["Complete full wash/dry cycle", "Clean lint trap properly", "Fold basic items neatly"],
      perfectsRequired: 5
    },
    3: {
      title: "Precision Folder",
      hourlyRate: 25,
      requirements: ["Fold shirts to standard", "Fold towels uniformly", "No parent rework needed (3x)"],
      perfectsRequired: 7
    },
    4: {
      title: "Laundry Master",
      hourlyRate: 35,
      requirements: ["Handle delicates expertly", "Optimize full workflow", "Train others in technique"],
      perfectsRequired: 10
    }
  },
  DISHES: {
    1: {
      title: "Dish Helper",
      hourlyRate: 10,
      requirements: ["Load dishwasher properly", "Hand wash pots/pans", "Dry and put away dishes"],
      perfectsRequired: 3
    },
    2: {
      title: "Kitchen Cleaner",
      hourlyRate: 15,
      requirements: ["Maintain clean counters", "Organize dish storage", "Deep clean sink weekly"],
      perfectsRequired: 5
    },
    3: {
      title: "Station Master",
      hourlyRate: 22,
      requirements: ["Maintain dish station all day", "Clean appliances inside/out", "Zero parent cleanup needed"],
      perfectsRequired: 7
    },
    4: {
      title: "Kitchen Guardian",
      hourlyRate: 30,
      requirements: ["Design efficient workflows", "Maintain commercial standards", "Train family members"],
      perfectsRequired: 10
    }
  },
  CLEANING: {
    1: {
      title: "Tidy Helper",
      hourlyRate: 11,
      requirements: ["Vacuum rooms thoroughly", "Dust all surfaces", "Empty all trash cans"],
      perfectsRequired: 3
    },
    2: {
      title: "Room Organizer",
      hourlyRate: 16,
      requirements: ["Clean bathroom completely", "Organize bedroom systems", "Vacuum whole floors"],
      perfectsRequired: 5
    },
    3: {
      title: "Deep Cleaner",
      hourlyRate: 24,
      requirements: ["Detail clean multiple rooms", "Organize storage areas", "Maintain weekly standards"],
      perfectsRequired: 7
    },
    4: {
      title: "Space Designer",
      hourlyRate: 32,
      requirements: ["Design organization systems", "Maintain hotel-level standards", "Lead family cleaning projects"],
      perfectsRequired: 10
    }
  },
  COOKING: {
    1: {
      title: "Prep Assistant",
      hourlyRate: 13,
      requirements: ["Prep ingredients safely", "Follow simple recipes", "Clean as you go"],
      perfectsRequired: 3
    },
    2: {
      title: "Kitchen Helper",
      hourlyRate: 19,
      requirements: ["Cook simple meals independently", "Use kitchen tools safely", "Plan meal timing"],
      perfectsRequired: 5
    },
    3: {
      title: "Home Chef",
      hourlyRate: 26,
      requirements: ["Cook complex recipes", "Manage multiple dishes", "Create shopping lists"],
      perfectsRequired: 7
    },
    4: {
      title: "Culinary Master",
      hourlyRate: 36,
      requirements: ["Design original recipes", "Teach cooking techniques", "Manage full meal service"],
      perfectsRequired: 10
    }
  },
  YARD: {
    1: {
      title: "Yard Helper",
      hourlyRate: 14,
      requirements: ["Rake leaves thoroughly", "Water plants properly", "Basic weeding skills"],
      perfectsRequired: 3
    },
    2: {
      title: "Garden Tender",
      hourlyRate: 20,
      requirements: ["Mow lawn sections", "Plant seeds/seedlings", "Seasonal cleanup tasks"],
      perfectsRequired: 5
    },
    3: {
      title: "Landscape Specialist",
      hourlyRate: 28,
      requirements: ["Design landscape features", "Maintain tools properly", "Plan garden layouts"],
      perfectsRequired: 7
    },
    4: {
      title: "Yard Master",
      hourlyRate: 38,
      requirements: ["Manage full yard systems", "Teach gardening skills", "Lead seasonal projects"],
      perfectsRequired: 10
    }
  },
  TOOLS: {
    1: {
      title: "Tool Helper",
      hourlyRate: 15,
      requirements: ["Organize tool storage", "Use basic hand tools", "Follow safety protocols"],
      perfectsRequired: 3
    },
    2: {
      title: "Fix-It Assistant",
      hourlyRate: 22,
      requirements: ["Complete simple repairs", "Measure and cut materials", "Use power tools safely"],
      perfectsRequired: 5
    },
    3: {
      title: "Project Builder",
      hourlyRate: 30,
      requirements: ["Manage complex projects", "Coordinate multiple tools", "Problem solve independently"],
      perfectsRequired: 7
    },
    4: {
      title: "Workshop Master",
      hourlyRate: 40,
      requirements: ["Design build projects", "Teach tool safety", "Manage family workshop"],
      perfectsRequired: 10
    }
  }
};

// Skill Metadata
export const SKILLS: Record<SkillId, { 
  name: string; 
  icon: string; 
  color: string;
  description: string;
}> = {
  LAUNDRY: {
    name: "Laundry Master",
    icon: "washing-machine",
    color: "#2196F3",
    description: "Sort, wash, dry, fold, and organize with precision"
  },
  DISHES: {
    name: "Kitchen Keeper",
    icon: "silverware",
    color: "#4CAF50", 
    description: "Clean dishes, organize kitchen, maintain cleanliness"
  },
  CLEANING: {
    name: "Space Cleaner",
    icon: "broom",
    color: "#FF9800",
    description: "Tidy rooms, vacuum, dust, and organize spaces"
  },
  COOKING: {
    name: "Chef Assistant", 
    icon: "chef-hat",
    color: "#F44336",
    description: "Prep ingredients, follow recipes, kitchen safety"
  },
  YARD: {
    name: "Yard Guardian",
    icon: "leaf",
    color: "#8BC34A",
    description: "Maintain outdoor spaces, gardening, seasonal tasks"
  },
  TOOLS: {
    name: "Tool Operator",
    icon: "hammer",
    color: "#795548",
    description: "Use tools safely, basic repairs, build things"
  }
};

// Level Requirements (XP needed to reach each level)
export const LEVEL_REQUIREMENTS: Record<SkillLevel, number> = {
  1: 0,     // Starting level
  2: 100,   // 5 basic completions
  3: 300,   // 15 total completions 
  4: 600,   // 30 total completions
};

// XP Rewards
export const XP_REWARDS = {
  BASIC: 20,
  STANDARD: 25, 
  ADVANCED: 35,
  MASTER: 50
};

export const QUALITY_MULTIPLIERS: Record<Quality, number> = {
  MISS: 0,      // No XP for missed tasks
  PASS: 1.0,    // Normal XP
  PERFECT: 1.5  // 50% bonus XP
};

// Pay Rate Multipliers by Skill Level
export const SKILL_PAY_MULTIPLIERS: Record<SkillLevel, number> = {
  1: 1.0,   // Base rate
  2: 1.25,  // 25% increase  
  3: 1.5,   // 50% increase
  4: 2.0    // 100% increase (double pay!)
};

// Utility Functions
export function calculateXP(difficulty: Difficulty, quality: Quality): number {
  const baseXP = XP_REWARDS[difficulty];
  const multiplier = QUALITY_MULTIPLIERS[quality];
  return Math.floor(baseXP * multiplier);
}

export function getSkillLevel(xp: number): SkillLevel {
  if (xp >= LEVEL_REQUIREMENTS[4]) return 4;
  if (xp >= LEVEL_REQUIREMENTS[3]) return 3;
  if (xp >= LEVEL_REQUIREMENTS[2]) return 2;
  return 1;
}

export function getXPToNextLevel(currentXP: number): { needed: number; total: number; percentage: number } {
  const currentLevel = getSkillLevel(currentXP);
  if (currentLevel === 4) {
    return { needed: 0, total: 1, percentage: 1 }; // Max level
  }
  
  const nextLevel = (currentLevel + 1) as SkillLevel;
  const nextLevelXP = LEVEL_REQUIREMENTS[nextLevel];
  const currentLevelXP = LEVEL_REQUIREMENTS[currentLevel];
  
  const needed = nextLevelXP - currentXP;
  const total = nextLevelXP - currentLevelXP;
  const percentage = Math.max(0, (currentXP - currentLevelXP) / total);
  
  return { needed, total, percentage };
}

// Initialize default skill progress for a new kid
export function initializeSkills(): Record<SkillId, SkillProgress> {
  const skills: Record<SkillId, SkillProgress> = {} as any;
  
  Object.keys(SKILLS).forEach(skillId => {
    skills[skillId as SkillId] = {
      level: 1,
      xp: 0,
      completions: 0,
      perfects: 0
    };
  });
  
  return skills;
}

// Mission/Task Templates by Skill and Level
export const SKILL_MISSIONS: Record<SkillId, Record<SkillLevel, string[]>> = {
  LAUNDRY: {
    1: ["Sort a load (lights/darks/towels)", "Pocket check before wash", "Match socks"],
    2: ["Run full wash/dry cycle", "Transfer + clean lint trap", "Fold basic items"],
    3: ["Fold + store full load to pro standard", "Organize dresser drawers", "Handle delicates properly"],
    4: ["Complete load in ≤45 min active time", "Teach folding technique", "Optimize laundry workflow"]
  },
  DISHES: {
    1: ["Load dishwasher properly", "Hand wash pots and pans", "Dry and put away dishes"],
    2: ["Clean kitchen counters", "Organize dish storage", "Deep clean sink"],
    3: ["Maintain dish station all day", "Clean appliances inside/out", "Organize cabinets"],
    4: ["Design efficient dish workflow", "Train others on system", "Maintain commercial-level standards"]
  },
  CLEANING: {
    1: ["Vacuum one room thoroughly", "Dust surfaces", "Empty trash cans"],
    2: ["Clean bathroom completely", "Organize bedroom", "Vacuum whole floor"],
    3: ["Deep clean multiple rooms", "Organize storage areas", "Detail cleaning"],
    4: ["Design room organization system", "Maintain hotel-level standards", "Teach cleaning techniques"]
  },
  COOKING: {
    1: ["Prep simple ingredients", "Follow basic recipe", "Clean as you go"],
    2: ["Cook simple meals independently", "Use kitchen tools safely", "Plan meal timing"],
    3: ["Cook complex recipes", "Manage multiple dishes", "Create shopping lists"],
    4: ["Design original recipes", "Teach cooking skills", "Manage full meal service"]
  },
  YARD: {
    1: ["Rake leaves", "Water plants", "Basic weeding"],
    2: ["Mow lawn sections", "Plant seeds/seedlings", "Seasonal cleanup"],
    3: ["Landscape design", "Tool maintenance", "Garden planning"],
    4: ["Manage full yard systems", "Teach gardening", "Seasonal project leadership"]
  },
  TOOLS: {
    1: ["Organize tool storage", "Basic hand tool use", "Safety equipment check"],
    2: ["Simple repairs", "Measure and cut materials", "Power tool basics"],
    3: ["Complex projects", "Multiple tool coordination", "Problem solving"],
    4: ["Design build projects", "Teach tool safety", "Manage workshop"]
  }
};

// Predefined Badges
export const AVAILABLE_BADGES: Badge[] = [
  // Laundry Badges
  { id: "LAUNDRY_FIRST_FOLD", name: "First Fold", description: "Completed your first laundry task", earnedAt: 0, skillId: "LAUNDRY" },
  { id: "LAUNDRY_PRECISION_FOLDER", name: "Precision Folder", description: "Achieved perfect folding rating 5 times", earnedAt: 0, skillId: "LAUNDRY" },
  { id: "LAUNDRY_SPEED_DEMON", name: "Speed Demon", description: "Completed full cycle in under 45 minutes", earnedAt: 0, skillId: "LAUNDRY" },
  { id: "LAUNDRY_MASTER", name: "Laundry Master", description: "Reached Level 4 in Laundry skills", earnedAt: 0, skillId: "LAUNDRY" },
  
  // Dishes Badges
  { id: "DISHES_SQUEAKY_CLEAN", name: "Squeaky Clean", description: "Maintained perfect dish standards for a week", earnedAt: 0, skillId: "DISHES" },
  { id: "DISHES_EFFICIENCY_EXPERT", name: "Efficiency Expert", description: "Optimized dishwashing workflow", earnedAt: 0, skillId: "DISHES" },
  
  // General Achievement Badges
  { id: "MULTI_SKILL_NOVICE", name: "Multi-Skill Novice", description: "Reached Level 2 in 3 different skills", earnedAt: 0 },
  { id: "PERFECTIONIST", name: "Perfectionist", description: "Achieved Perfect rating 25 times across all skills", earnedAt: 0 },
  { id: "SKILL_MASTER", name: "Skill Master", description: "Reached Level 4 in any skill", earnedAt: 0 }
];
