import { supabase, TaskTemplate, PayRate, UserProfile, Commitment, ChatMessage } from './supabase'

// Re-export types for convenience
export type { TaskTemplate, PayRate, UserProfile, Commitment, ChatMessage }

// Service class for database operations
export class SupabaseService {
  
  // ===== USER PROFILES =====
  static async getUserProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('role', { ascending: false }) // parents first, then kids
    
    if (error) throw error
    return data || []
  }

  static async getUserByName(name: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('name', name)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    return data
  }

  static async updateUserXP(userId: string, xpToAdd: number, earningsToAdd: number = 0): Promise<void> {
    // First get current values
    const { data: currentUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('total_xp, total_earnings_cents')
      .eq('id', userId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Update with new calculated values
    const { error } = await supabase
      .from('user_profiles')
      .update({
        total_xp: currentUser.total_xp + xpToAdd,
        total_earnings_cents: currentUser.total_earnings_cents + earningsToAdd
      })
      .eq('id', userId)
    
    if (error) throw error
  }

  // ===== TASK TEMPLATES =====
  static async getTaskTemplates(isMicroTask?: boolean): Promise<TaskTemplate[]> {
    let query = supabase
      .from('task_templates')
      .select('*')
      .order('skill_category')
      .order('difficulty_level')
    
    if (isMicroTask !== undefined) {
      query = query.eq('is_micro_task', isMicroTask)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  static async getTaskTemplatesBySkill(skillCategory: string): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('skill_category', skillCategory)
      .order('difficulty_level')
    
    if (error) throw error
    return data || []
  }

  static async getMicroTasks(): Promise<TaskTemplate[]> {
    return this.getTaskTemplates(true)
  }

  static async getStandardTasks(): Promise<TaskTemplate[]> {
    return this.getTaskTemplates(false)
  }

  // ===== PAY RATES =====
  static async getPayRates(): Promise<PayRate[]> {
    const { data, error } = await supabase
      .from('pay_rates')
      .select('*')
      .order('skill_category')
      .order('difficulty_level')
    
    if (error) throw error
    return data || []
  }

  static async getPayRateForSkill(skillCategory: string, difficultyLevel: number): Promise<PayRate | null> {
    const { data, error } = await supabase
      .from('pay_rates')
      .select('*')
      .eq('skill_category', skillCategory)
      .eq('difficulty_level', difficultyLevel)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }
    return data
  }

  // Calculate pay for a task based on effort and skill
  static async calculateTaskPay(skillCategory: string, effortMinutes: number, difficultyLevel: number = 1): Promise<number> {
    const payRate = await this.getPayRateForSkill(skillCategory, difficultyLevel)
    if (!payRate) {
      // Fallback rates if no rate found in database
      const fallbackRates = {
        'Cleaning': 100, 'Dishes': 110, 'Laundry': 90,
        'Cooking': 120, 'Yard': 130, 'Tools': 140
      }
      const rate = fallbackRates[skillCategory as keyof typeof fallbackRates] || 100
      return effortMinutes <= 5 ? 300 : Math.round(effortMinutes * rate) // $3 for micro-tasks
    }

    // Use micro-task flat rate for tasks 5 minutes or less
    if (effortMinutes <= 5) {
      return payRate.micro_task_flat_rate_cents
    }
    
    // Use per-minute rate for longer tasks
    return Math.round(effortMinutes * payRate.base_rate_per_minute_cents)
  }

  // ===== COMMITMENTS =====
  static async createCommitment(commitment: Omit<Commitment, 'id' | 'created_at'>): Promise<Commitment> {
    const { data, error } = await supabase
      .from('commitments')
      .insert(commitment)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  static async getUserCommitments(userId: string, status?: string): Promise<Commitment[]> {
    let query = supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  // Get all active commitments across all users (for checking task availability)
  static async getAllActiveCommitments(): Promise<Commitment[]> {
    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .in('status', ['pending_approval', 'accepted', 'in_progress'])
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Get task availability info (frequency and next available time)
  static async getTaskAvailabilityInfo(taskTemplateId: string): Promise<{
    averagePostingFrequencyDays: number | null,
    nextAvailableAt: string | null,
    totalCompletions: number
  }> {
    // Get the task template to check if there's a scheduled next_available_at
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .select('next_available_at')
      .eq('id', taskTemplateId)
      .single()
    
    if (templateError) throw templateError

    // Get completed commitments for this task to calculate frequency
    const { data: completedCommitments, error: commitmentsError } = await supabase
      .from('commitments')
      .select('completed_at')
      .eq('task_template_id', taskTemplateId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true })
    
    if (commitmentsError) throw commitmentsError

    let averageFrequencyDays: number | null = null
    const totalCompletions = completedCommitments?.length || 0

    // Calculate average frequency if we have at least 2 completions
    if (completedCommitments && completedCommitments.length >= 2) {
      const intervals: number[] = []
      for (let i = 1; i < completedCommitments.length; i++) {
        const prev = new Date(completedCommitments[i - 1].completed_at!).getTime()
        const curr = new Date(completedCommitments[i].completed_at!).getTime()
        const daysDiff = (curr - prev) / (1000 * 60 * 60 * 24)
        intervals.push(daysDiff)
      }
      
      // Calculate average of intervals
      const sum = intervals.reduce((a, b) => a + b, 0)
      averageFrequencyDays = Math.round(sum / intervals.length * 10) / 10 // Round to 1 decimal
    }

    return {
      averagePostingFrequencyDays: averageFrequencyDays,
      nextAvailableAt: template?.next_available_at || null,
      totalCompletions
    }
  }

  // Update task availability scheduling
  static async setTaskAvailability(taskId: string, nextAvailableAt: string | null): Promise<void> {
    const { error } = await supabase
      .from('task_templates')
      .update({ next_available_at: nextAvailableAt })
      .eq('id', taskId)
    
    if (error) throw error
  }

  // Get available tasks (excluding those not yet available)
  static async getAvailableTaskTemplates(isMicroTask?: boolean): Promise<TaskTemplate[]> {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('task_templates')
      .select('*')
      .or(`next_available_at.is.null,next_available_at.lte.${now}`) // Available if no restriction or time has passed
      .order('skill_category')
      .order('difficulty_level')
    
    if (isMicroTask !== undefined) {
      query = query.eq('is_micro_task', isMicroTask)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  static async updateCommitmentStatus(
    commitmentId: string, 
    status: 'accepted' | 'completed' | 'rejected', 
    qualityRating?: 'miss' | 'pass' | 'perfect'
  ): Promise<void> {
    const updateData: any = { status }
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
      if (qualityRating) {
        updateData.quality_rating = qualityRating
      }
    }
    
    const { error } = await supabase
      .from('commitments')
      .update(updateData)
      .eq('id', commitmentId)
    
    if (error) throw error
  }

  // ===== CHAT MESSAGES =====
  static async getChatMessages(limit: number = 50): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:user_profiles(name, role),
        commitment:commitments(*)
      `)
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }

  static async sendChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select('*')
      .single()
    
    if (error) throw error
    return data
  }

  // ===== UTILITY FUNCTIONS =====
  
  // Get skill categories available
  static async getSkillCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('pay_rates')
      .select('skill_category')
      .order('skill_category')
    
    if (error) throw error
    
    const uniqueSkills = [...new Set(data?.map(item => item.skill_category) || [])]
    return uniqueSkills
  }

  // Search task templates by title or description
  static async searchTaskTemplates(searchTerm: string): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('is_micro_task', { ascending: false }) // Micro-tasks first
      .order('title')
    
    if (error) throw error
    return data || []
  }

  // Get recommended tasks for a skill level
  static async getRecommendedTasks(skillCategory: string, maxDifficulty: number = 2): Promise<TaskTemplate[]> {
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .eq('skill_category', skillCategory)
      .lte('difficulty_level', maxDifficulty)
      .order('difficulty_level')
      .order('effort_minutes')
    
    if (error) throw error
    return data || []
  }

  // ===== MARKETPLACE FUNCTIONS =====
  
  // Get marketplace tasks with filtering and sorting
  static async getMarketplaceTasks(params: {
    user_id?: string,
    min_pay_cents?: number,
    max_pay_cents?: number,
    min_effort_minutes?: number,
    max_effort_minutes?: number,
    skill_category?: string,
    is_micro_task?: boolean,
    sort_by?: string,
    sort_order?: string,
    limit?: number,
    offset?: number
  } = {}): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_marketplace_tasks', {
      p_user_id: params.user_id || null,
      p_min_pay_cents: params.min_pay_cents || 0,
      p_max_pay_cents: params.max_pay_cents || null,
      p_min_effort_minutes: params.min_effort_minutes || 0,
      p_max_effort_minutes: params.max_effort_minutes || null,
      p_skill_category: params.skill_category || null,
      p_is_micro_task: params.is_micro_task || null,
      p_sort_by: params.sort_by || 'urgency_score',
      p_sort_order: params.sort_order || 'DESC',
      p_limit: params.limit || 50,
      p_offset: params.offset || 0
    })
    
    if (error) throw error
    return data || []
  }
  
  // Claim a marketplace task
  static async claimMarketplaceTask(userId: string, taskTemplateId: string, kidNotes?: string): Promise<string> {
    const { data, error } = await supabase.rpc('claim_marketplace_task', {
      p_user_id: userId,
      p_task_template_id: taskTemplateId,
      p_kid_notes: kidNotes || null
    })
    
    if (error) throw error
    return data // Returns commitment ID
  }
  
  // Get user's task assignments
  static async getUserTaskAssignments(userId: string, status?: string): Promise<any[]> {
    let query = supabase
      .from('task_assignments')
      .select(`
        *,
        task_template:task_templates(*),
        commitment:commitments(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  // ===== SUBMISSION FLOW =====
  
  // Submit a commitment for approval
  static async submitCommitment(
    commitmentId: string,
    proofPhotos: string[],
    submissionNotes: string
  ) {
    try {
      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('commitment_submissions')
        .insert({
          commitment_id: commitmentId,
          proof_photos: proofPhotos,
          submission_notes: submissionNotes,
          status: 'pending_approval',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Update commitment status to 'submitted'
      const { error: commitmentError } = await supabase
        .from('commitments')
        .update({ status: 'submitted' })
        .eq('id', commitmentId);

      if (commitmentError) throw commitmentError;

      return { success: true, submission };
    } catch (error) {
      console.error('Error submitting commitment:', error);
      return { success: false, error };
    }
  }

  // Get pending submissions for parent approval
  static async getPendingSubmissions() {
    try {
      const { data, error } = await supabase
        .from('commitment_submissions')
        .select(`
          *,
          commitment:commitments(
            *,
            task:task_templates!commitments_task_template_id_fkey(*),
            user:user_profiles!commitments_user_id_fkey(*)
          )
        `)
        .eq('submission_status', 'pending_approval')
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }
  }

  // Upload photo to Supabase storage
  static async uploadPhoto(uri: string, userId: string): Promise<string | null> {
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[UPLOAD] Auth session:', session ? 'authenticated' : 'NOT authenticated');
      console.log('[UPLOAD] User ID from session:', session?.user?.id);
      console.log('[UPLOAD] User ID from param:', userId);
      
      // Generate unique filename
      const filename = `${userId}/${Date.now()}.jpg`;
      
      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('commitment-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('commitment-photos')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  }

  // Approve a submission
  static async approveSubmission(
    submissionId: string,
    rating: number,
    reviewerId: string,
    reviewNotes?: string,
    tipCents?: number
  ) {
    try {
      const { data, error } = await supabase.rpc('approve_submission', {
        p_submission_id: submissionId,
        p_rating: rating,
        p_reviewer_id: reviewerId,
        p_review_notes: reviewNotes || null,
        p_tip_cents: tipCents || 0
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error approving submission:', error);
      return { success: false, error };
    }
  }

  // Reject a submission
  static async rejectSubmission(
    submissionId: string,
    reviewerId: string,
    rejectionReason: string
  ) {
    try {
      const { data, error } = await supabase.rpc('reject_submission', {
        p_submission_id: submissionId,
        p_reviewer_id: reviewerId,
        p_rejection_reason: rejectionReason
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error rejecting submission:', error);
      return { success: false, error };
    }
  }
}
