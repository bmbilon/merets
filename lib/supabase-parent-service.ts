import { supabase } from './supabase'

// Parent Admin Service - Enhanced task management for parents
export interface TaskPriority {
  id: string
  task_template_id: string
  priority_level: number  // 0-100, higher = more urgent
  priority_type: 'urgent' | 'high' | 'normal' | 'low'
  custom_pay_cents?: number
  custom_effort_minutes?: number
  deadline?: string
  created_by: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface FamilyTaskSettings {
  id: string
  task_template_id: string
  is_enabled: boolean
  frequency_priority: number  // 0-100, higher = show more often
  seasonal_boost: boolean
  assigned_to?: string  // User ID if task is assigned to specific kid
  created_at: string
}

export interface ParentTaskCategory {
  id: string
  name: string
  description?: string
  color_hex: string
  icon: string
  sort_order: number
  created_by: string
  created_at: string
}

export interface TaskCompletionGoal {
  id: string
  task_template_id: string
  target_completions_per_week: number
  current_week_completions: number
  bonus_pay_cents?: number
  streak_bonus_cents?: number
  week_start_date: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PrioritizedTask {
  task_id: string
  title: string
  description?: string
  skill_category: string
  effort_minutes: number
  base_pay_cents: number
  difficulty_level: number
  is_micro_task: boolean
  priority_level: number
  priority_type: string
  custom_pay_cents?: number
  custom_effort_minutes?: number
  deadline?: string
  is_urgent: boolean
  effective_pay_cents: number
  effective_effort_minutes: number
  next_available_at?: string
}

export class ParentAdminService {
  
  // ===== TASK PRIORITIZATION =====
  
  static async getTaskPriorities(parentId?: string): Promise<TaskPriority[]> {
    let query = supabase
      .from('task_priorities')
      .select('*')
      .eq('is_active', true)
      .order('priority_level', { ascending: false })
    
    if (parentId) {
      query = query.eq('created_by', parentId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async setTaskPriority(
    taskTemplateId: string,
    parentId: string,
    priority: Partial<TaskPriority>
  ): Promise<TaskPriority> {
    const priorityData = {
      task_template_id: taskTemplateId,
      created_by: parentId,
      priority_level: priority.priority_level || 50,
      priority_type: priority.priority_type || 'normal',
      custom_pay_cents: priority.custom_pay_cents,
      custom_effort_minutes: priority.custom_effort_minutes,
      deadline: priority.deadline,
      notes: priority.notes,
      is_active: true
    }

    // Use upsert to handle update or insert
    const { data, error } = await supabase
      .from('task_priorities')
      .upsert(priorityData, { 
        onConflict: 'task_template_id',
        ignoreDuplicates: false 
      })
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async removeTaskPriority(taskTemplateId: string): Promise<void> {
    const { error } = await supabase
      .from('task_priorities')
      .update({ is_active: false })
      .eq('task_template_id', taskTemplateId)
    
    if (error) throw error
  }

  static async bulkUpdateTaskPriorities(
    priorities: Array<{taskTemplateId: string; priority_level: number}>
  ): Promise<void> {
    const updates = priorities.map(p => ({
      task_template_id: p.taskTemplateId,
      priority_level: p.priority_level,
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('task_priorities')
      .upsert(updates, { onConflict: 'task_template_id' })
    
    if (error) throw error
  }

  // ===== FAMILY TASK SETTINGS =====
  
  static async getFamilyTaskSettings(): Promise<FamilyTaskSettings[]> {
    const { data, error } = await supabase
      .from('family_task_settings')
      .select('*')
      .order('frequency_priority', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async updateFamilyTaskSettings(
    taskTemplateId: string,
    settings: Partial<FamilyTaskSettings>
  ): Promise<FamilyTaskSettings> {
    const settingsData = {
      task_template_id: taskTemplateId,
      is_enabled: settings.is_enabled ?? true,
      frequency_priority: settings.frequency_priority ?? 50,
      seasonal_boost: settings.seasonal_boost ?? false,
      assigned_to: settings.assigned_to
    }

    const { data, error } = await supabase
      .from('family_task_settings')
      .upsert(settingsData, { onConflict: 'task_template_id' })
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async toggleTaskEnabled(
    taskTemplateId: string,
    isEnabled: boolean
  ): Promise<void> {
    await this.updateFamilyTaskSettings(taskTemplateId, { is_enabled: isEnabled })
  }

  // ===== PRIORITIZED TASK RETRIEVAL =====
  
  static async getPrioritizedTasks(
    skillCategory?: string,
    isMicroTask?: boolean,
    limit: number = 20
  ): Promise<PrioritizedTask[]> {
    const { data, error } = await supabase.rpc('get_prioritized_tasks_for_display', {
      p_skill_category: skillCategory || null,
      p_is_micro_task: isMicroTask ?? null,
      p_limit: limit
    })
    
    if (error) throw error
    return data || []
  }

  static async getUrgentTasks(): Promise<PrioritizedTask[]> {
    const { data, error } = await supabase.rpc('get_prioritized_tasks_for_display', {
      p_skill_category: null,
      p_is_micro_task: null,
      p_limit: 50
    })
    
    if (error) throw error
    return (data || []).filter(task => task.is_urgent)
  }

  static async getTasksForKid(kidId: string): Promise<PrioritizedTask[]> {
    // Get tasks assigned to specific kid or unassigned tasks
    const { data: assignedTasks, error } = await supabase
      .from('family_task_settings')
      .select('task_template_id')
      .eq('assigned_to', kidId)
      .eq('is_enabled', true)
    
    if (error) throw error
    
    const assignedTaskIds = assignedTasks?.map(t => t.task_template_id) || []
    
    // Get prioritized tasks, filtering for assigned ones
    const allTasks = await this.getPrioritizedTasks()
    
    // Return assigned tasks first, then unassigned tasks
    const assigned = allTasks.filter(t => assignedTaskIds.includes(t.task_id))
    const unassigned = allTasks.filter(t => !assignedTaskIds.includes(t.task_id))
    
    return [...assigned, ...unassigned]
  }

  // ===== PARENT TASK CATEGORIES =====
  
  static async getParentTaskCategories(parentId?: string): Promise<ParentTaskCategory[]> {
    let query = supabase
      .from('parent_task_categories')
      .select('*')
      .order('sort_order')
    
    if (parentId) {
      query = query.eq('created_by', parentId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async createParentTaskCategory(
    parentId: string,
    category: Omit<ParentTaskCategory, 'id' | 'created_by' | 'created_at'>
  ): Promise<ParentTaskCategory> {
    const { data, error } = await supabase
      .from('parent_task_categories')
      .insert({
        ...category,
        created_by: parentId
      })
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  // ===== TASK AVAILABILITY SCHEDULING =====
  
  static async setTaskAvailability(
    taskTemplateId: string, 
    nextAvailableAt: string | null,
    parentId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .update({ next_available_at: nextAvailableAt })
      .eq('id', taskTemplateId)
    
    if (error) throw error
    
    // Log the scheduling action
    console.log(`Parent ${parentId} set task ${taskTemplateId} availability to: ${nextAvailableAt}`)
  }
  
  static async scheduleTaskAfterCompletion(
    taskTemplateId: string,
    hoursDelay: number,
    parentId: string
  ): Promise<void> {
    const nextAvailable = new Date()
    nextAvailable.setHours(nextAvailable.getHours() + hoursDelay)
    
    await this.setTaskAvailability(taskTemplateId, nextAvailable.toISOString(), parentId)
  }
  
  static async clearTaskAvailabilityRestriction(
    taskTemplateId: string,
    parentId: string
  ): Promise<void> {
    await this.setTaskAvailability(taskTemplateId, null, parentId)
  }
  
  static async getTasksWithAvailabilityRestrictions(): Promise<Array<{id: string, title: string, next_available_at: string}>> {
    const { data, error } = await supabase
      .from('task_templates')
      .select('id, title, next_available_at')
      .not('next_available_at', 'is', null)
      .order('next_available_at')
    
    if (error) throw error
    return data || []
  }
  
  // ===== TASK COMPLETION GOALS =====
  
  static async getTaskCompletionGoals(parentId?: string): Promise<TaskCompletionGoal[]> {
    let query = supabase
      .from('task_completion_goals')
      .select('*')
      .eq('is_active', true)
      .order('target_completions_per_week', { ascending: false })
    
    if (parentId) {
      query = query.eq('created_by', parentId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async setTaskCompletionGoal(
    taskTemplateId: string,
    parentId: string,
    goal: Partial<TaskCompletionGoal>
  ): Promise<TaskCompletionGoal> {
    const goalData = {
      task_template_id: taskTemplateId,
      created_by: parentId,
      target_completions_per_week: goal.target_completions_per_week || 1,
      bonus_pay_cents: goal.bonus_pay_cents,
      streak_bonus_cents: goal.streak_bonus_cents,
      is_active: true
    }

    const { data, error } = await supabase
      .from('task_completion_goals')
      .upsert(goalData, { onConflict: 'task_template_id,created_by' })
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  // ===== ANALYTICS & REPORTING =====
  
  static async getTaskPriorityAnalytics(): Promise<{
    totalPrioritizedTasks: number
    urgentTasks: number
    highPriorityTasks: number
    tasksWithDeadlines: number
    averagePriorityLevel: number
  }> {
    const { data, error } = await supabase
      .from('task_priorities')
      .select('priority_level, priority_type, deadline')
      .eq('is_active', true)
    
    if (error) throw error
    
    const priorities = data || []
    const urgentTasks = priorities.filter(p => p.priority_type === 'urgent').length
    const highPriorityTasks = priorities.filter(p => p.priority_type === 'high').length
    const tasksWithDeadlines = priorities.filter(p => p.deadline).length
    const averagePriorityLevel = priorities.length > 0 
      ? priorities.reduce((sum, p) => sum + p.priority_level, 0) / priorities.length
      : 50
    
    return {
      totalPrioritizedTasks: priorities.length,
      urgentTasks,
      highPriorityTasks,
      tasksWithDeadlines,
      averagePriorityLevel: Math.round(averagePriorityLevel)
    }
  }

  static async getTaskCompletionStats(days: number = 7): Promise<{
    completedTasks: number
    urgentTasksCompleted: number
    averageCompletionTime: number
    topPerformingTasks: Array<{task_id: string; title: string; completions: number}>
  }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('commitments')
      .select(`
        *,
        task_template:task_templates(id, title),
        priority:task_priorities(priority_type)
      `)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
    
    if (error) throw error
    
    const completions = data || []
    const urgentCompleted = completions.filter(c => 
      c.priority?.priority_type === 'urgent'
    ).length
    
    const completionTimes = completions
      .filter(c => c.completed_at && c.created_at)
      .map(c => {
        const completed = new Date(c.completed_at!).getTime()
        const created = new Date(c.created_at).getTime()
        return (completed - created) / (1000 * 60 * 60) // hours
      })
    
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0
    
    // Count task completions
    const taskCompletionCounts = new Map<string, {title: string; count: number}>()
    completions.forEach(c => {
      if (c.task_template_id && c.task_template?.title) {
        const existing = taskCompletionCounts.get(c.task_template_id) || {
          title: c.task_template.title,
          count: 0
        }
        taskCompletionCounts.set(c.task_template_id, {
          ...existing,
          count: existing.count + 1
        })
      }
    })
    
    const topPerformingTasks = Array.from(taskCompletionCounts.entries())
      .map(([task_id, data]) => ({
        task_id,
        title: data.title,
        completions: data.count
      }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 10)
    
    return {
      completedTasks: completions.length,
      urgentTasksCompleted: urgentCompleted,
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      topPerformingTasks
    }
  }
}