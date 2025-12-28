import { supabase } from './supabase';

export interface FamilyRelationship {
  id: string;
  issuer_id: string;
  earner_id: string;
  relationship_type: 'parent' | 'guardian' | 'grandparent' | 'aunt_uncle' | 'teacher' | 'coach' | 'mentor' | 'other';
  permission_level: 'full' | 'approve_only' | 'review_only' | 'view_only';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IssuerApproval {
  id: string;
  commitment_id: string;
  issuer_id: string;
  approval_status: 'approved' | 'rejected' | 'revision_requested';
  rejection_reason?: string;
  approved_at: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  commitment_id: string;
  payer_id: string;
  amount_cents: number;
  payment_method?: 'cash' | 'venmo' | 'paypal' | 'zelle' | 'check' | 'other';
  paid_at: string;
  notes?: string;
  created_at: string;
}

export interface IssuerStats {
  pending_approvals: number;
  awaiting_review: number;
  total_approved: number;
  total_reviewed: number;
  earners_count: number;
}

export class IssuerService {
  // ===== FAMILY RELATIONSHIPS =====
  
  static async addFamilyRelationship(
    issuerId: string,
    earnerId: string,
    relationshipType: FamilyRelationship['relationship_type'],
    permissionLevel: FamilyRelationship['permission_level'] = 'full',
    notes?: string
  ): Promise<FamilyRelationship> {
    const { data, error } = await supabase
      .from('family_relationships')
      .insert({
        issuer_id: issuerId,
        earner_id: earnerId,
        relationship_type: relationshipType,
        permission_level: permissionLevel,
        notes
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getFamilyRelationships(issuerId: string): Promise<FamilyRelationship[]> {
    const { data, error } = await supabase
      .from('family_relationships')
      .select('*')
      .eq('issuer_id', issuerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getEarnersForIssuer(issuerId: string) {
    const { data, error } = await supabase
      .from('family_relationships')
      .select(`
        *,
        earner:user_profiles!earner_id (id, name, handle, rep_score, merets_balance)
      `)
      .eq('issuer_id', issuerId);
    
    if (error) throw error;
    return data || [];
  }

  static async updateRelationshipPermissions(
    relationshipId: string,
    permissionLevel: FamilyRelationship['permission_level']
  ): Promise<void> {
    const { error } = await supabase
      .from('family_relationships')
      .update({ permission_level })
      .eq('id', relationshipId);
    
    if (error) throw error;
  }

  static async removeRelationship(relationshipId: string): Promise<void> {
    const { error } = await supabase
      .from('family_relationships')
      .delete()
      .eq('id', relationshipId);
    
    if (error) throw error;
  }

  // ===== COMMITMENT APPROVALS =====

  static async approvePreWork(
    commitmentId: string,
    issuerId: string,
    notes?: string
  ): Promise<void> {
    // Stage A: pending_approval -> accepted
    const { error: commitmentError } = await supabase
      .from('commitments')
      .update({ status: 'accepted' })
      .eq('id', commitmentId);
    
    if (commitmentError) throw commitmentError;

    // Record issuer approval
    const { error: approvalError } = await supabase
      .from('issuer_approvals')
      .insert({
        commitment_id: commitmentId,
        issuer_id: issuerId,
        approval_status: 'approved',
        notes
      });
    
    if (approvalError) throw approvalError;
  }

  static async rejectPreWork(
    commitmentId: string,
    issuerId: string,
    rejectionReason?: string,
    notes?: string
  ): Promise<void> {
    // Stage A: pending_approval -> rejected
    const { error: commitmentError } = await supabase
      .from('commitments')
      .update({ status: 'rejected' })
      .eq('id', commitmentId);
    
    if (commitmentError) throw commitmentError;

    // Record issuer rejection
    const { error: approvalError } = await supabase
      .from('issuer_approvals')
      .insert({
        commitment_id: commitmentId,
        issuer_id: issuerId,
        approval_status: 'rejected',
        rejection_reason: rejectionReason,
        notes
      });
    
    if (approvalError) throw approvalError;
  }

  static async requestRevision(
    commitmentId: string,
    issuerId: string,
    revisionRequest: string
  ): Promise<void> {
    const { error } = await supabase
      .from('issuer_approvals')
      .insert({
        commitment_id: commitmentId,
        issuer_id: issuerId,
        approval_status: 'revision_requested',
        rejection_reason: revisionRequest
      });
    
    if (error) throw error;
  }

  // ===== COMMITMENT QUERIES =====

  static async getPendingApprovalsForIssuer(issuerId: string) {
    const { data, error } = await supabase
      .from('commitments')
      .select(`
        *,
        user:user_profiles!user_id (id, name, handle)
      `)
.eq('status', 'pending_approval')
      .or(`issuer_id.eq.${issuerId},issuer_id.is.null`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getReadyForReview(issuerId: string) {
    const { data, error } = await supabase
      .from('commitments')
      .select(`
        *,
        user:user_profiles!user_id (id, name, handle)
      `)
.eq('status', 'ready_for_review')
      .or(`issuer_id.eq.${issuerId},issuer_id.is.null`)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    
    // Filter out ones that already have reviews
    const withoutReviews = [];
    for (const commitment of data || []) {
      const { data: reviews } = await supabase
        .from('commitment_reviews')
        .select('id')
        .eq('commitment_id', commitment.id)
        .limit(1);
      
      if (!reviews || reviews.length === 0) {
        withoutReviews.push(commitment);
      }
    }
    
    return withoutReviews;
  }

  static async getCommitmentsForEarner(earnerId: string, issuerId: string) {
    const { data, error } = await supabase
      .rpc('get_earner_commitments_by_issuer', {
        p_earner_id: earnerId,
        p_issuer_id: issuerId
      });
    
    if (error) throw error;
    return data || [];
  }

  // ===== PAYMENT TRACKING =====

  static async recordPayment(
    commitmentId: string,
    payerId: string,
    amountCents: number,
    paymentMethod?: PaymentRecord['payment_method'],
    notes?: string
  ): Promise<PaymentRecord> {
    const { data, error } = await supabase
      .from('payment_records')
      .insert({
        commitment_id: commitmentId,
        payer_id: payerId,
        amount_cents: amountCents,
        payment_method: paymentMethod,
        notes
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getPaymentHistory(commitmentId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payment_records')
      .select(`
        *,
        payer:user_profiles!payer_id (id, name, handle)
      `)
      .eq('commitment_id', commitmentId)
      .order('paid_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getPaymentsByPayer(payerId: string): Promise<PaymentRecord[]> {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('payer_id', payerId)
      .order('paid_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // ===== STATISTICS =====

  static async getIssuerStats(issuerId: string): Promise<IssuerStats> {
    const { data, error } = await supabase
      .rpc('get_issuer_stats', { p_issuer_id: issuerId });
    
    if (error) throw error;
    return data as IssuerStats;
  }

  // ===== QUALITY REVIEWS (delegates to existing commitment_reviews) =====

  static async submitQualityReview(
    commitmentId: string,
    reviewerId: string,
    qualityStars: number,
    reviewNote?: string,
    requestRedo?: boolean
  ): Promise<void> {
    // Insert review - triggers the database function that creates meret/rep/earning events
    if (qualityStars <= 2 && (!reviewNote || reviewNote.trim().length === 0)) {
      throw new Error('A comment is required for ratings of 1★ or 2★.');
    }

    const { error } = await supabase
      .from('commitment_reviews')
      .insert({
        commitment_id: commitmentId,
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString(),
        quality_stars: qualityStars,
        review_note: reviewNote
      });
    
    if (error) throw error;

    // Stage B transition:
    const nextStatus = qualityStars <= 2 && requestRedo ? 'redo_requested' : 'completed';
    await supabase
      .from('commitments')
      .update({ status: nextStatus })
      .eq('id', commitmentId);
  }
}

export default IssuerService;
