// Helper function to calculate merets required for a specific level
// This mirrors the SQL function merets_required_for_level()
export function meretsRequiredForLevel(targetLevel: number): number {
  if (targetLevel <= 0) return 0;
  
  let total = 0;
  
  // Levels 1-10: 1 meret each
  if (targetLevel <= 10) {
    return targetLevel;
  }
  total = 10;
  
  // Levels 11-20: 3 merets each
  if (targetLevel <= 20) {
    return total + (targetLevel - 10) * 3;
  }
  total = 40;
  
  // Levels 21-30: 4 merets each
  if (targetLevel <= 30) {
    return total + (targetLevel - 20) * 4;
  }
  total = 80;
  
  // Levels 31-50: 1.0932× per level
  if (targetLevel <= 50) {
    let currentMpl = 4.0;
    for (let i = 31; i <= targetLevel; i++) {
      currentMpl *= 1.0932;
      total += currentMpl;
    }
    return Math.round(total * 100) / 100;
  }
  
  // Calculate base at level 50
  let currentMpl = 4.0;
  for (let i = 31; i <= 50; i++) {
    currentMpl *= 1.0932;
    total += currentMpl;
  }
  const base50 = total;
  
  // Levels 51-70: Double every 10 levels
  if (targetLevel <= 70) {
    for (let i = 51; i <= targetLevel; i++) {
      total = base50 * Math.pow(2, (i - 50) / 10);
    }
    return Math.round(total * 100) / 100;
  }
  
  // Calculate base at level 70
  const base70 = base50 * Math.pow(2, 2.0);
  total = base70;
  
  // Levels 71-90: reach 5000
  if (targetLevel <= 90) {
    for (let i = 71; i <= targetLevel; i++) {
      total = base70 * Math.pow(5000 / base70, (i - 70) / 20);
    }
    return Math.round(total * 100) / 100;
  }
  
  // Calculate base at level 90
  const base90 = 5000;
  
  // Levels 91-99: reach 10000
  for (let i = 91; i <= targetLevel; i++) {
    total = base90 * Math.pow(10000 / base90, (i - 90) / 9);
  }
  
  return Math.round(total * 100) / 100;
}

// Calculate progress to next level
export function calculateMeretsProgress(currentMeters: number, currentLevel: number) {
  const currentLevelMeters = meretsRequiredForLevel(currentLevel);
  const nextLevelMeters = meretsRequiredForLevel(currentLevel + 1);
  const meretsForThisLevel = nextLevelMeters - currentLevelMeters;
  const meretsEarnedInLevel = currentMeters - currentLevelMeters;
  const progress = meretsEarnedInLevel / meretsForThisLevel;
  
  return {
    currentLevelMeters,
    nextLevelMeters,
    meretsForThisLevel,
    meretsEarnedInLevel,
    meretsRemaining: meretsForThisLevel - meretsEarnedInLevel,
    progress: Math.max(0, Math.min(1, progress))
  };
}
