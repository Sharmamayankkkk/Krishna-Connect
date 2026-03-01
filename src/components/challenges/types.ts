export type ChallengeStatus = 'draft' | 'scheduled' | 'active' | 'submission_closed' | 'completed' | 'cancelled';
export type ChallengeType = 'proof_based' | 'speed_race' | 'community_voted' | 'scored' | 'milestone';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'pro';
export type ChallengeVisibility = 'public' | 'followers_only' | 'private';
export type SubmissionModType = 'manual' | 'auto_approve';
export type ScoringType = 'binary' | 'weighted';
export type VotingMethod = 'likes' | 'stars' | 'updown';
export type RewardType = 'badge' | 'points' | 'prize' | 'certificate' | 'none';
export type SubmissionContentType = 'image' | 'video' | 'text' | 'file' | 'link';
export type SubVisType = 'public' | 'author_only';

export interface Challenge {
    id: number;
    title: string;
    description: string | null;
    rules: string | null;
    prize_description: string | null;
    cover_image: string | null;

    // Core Status & Type
    status: ChallengeStatus;
    type: ChallengeType;
    difficulty: ChallengeDifficulty;
    visibility: ChallengeVisibility;
    category: string | null;
    tags: string[];

    // Dates
    start_date: string;
    end_date: string | null;
    submission_deadline: string | null;
    extended_until: string | null;
    grace_period_hours: number;
    results_announced_at: string | null;

    // Submissions Settings
    submission_types: SubmissionContentType[];
    allow_multiple_submissions: boolean;
    max_submissions_per_user: number;
    daily_submission_limit: number | null;
    allow_resubmit_after_rejection: boolean;
    submission_cooldown_hours: number;
    allow_edit_before_deadline: boolean;

    // Moderation & Scoring
    moderation_type: SubmissionModType;
    scoring_type: ScoringType;
    submissions_visibility: SubVisType;
    comments_enabled: boolean;

    // Voting settings (if community_voted)
    voting_enabled: boolean;
    voting_method: VotingMethod;
    hide_votes_until_deadline: boolean;
    weighted_voting_by_followers: boolean;

    // Abuse / Access
    max_participants: number | null;
    terms_required: boolean;
    min_account_age_days: number;

    // Reward Details
    reward_type: RewardType;

    // Meta & Analytics
    author_id: string;
    author_name: string | null;
    author_avatar: string | null;
    author_username: string | null;
    author_verified: 'none' | 'verified' | 'kcs';
    is_template: boolean;
    participant_count: number;
    view_count: number;
    cancellation_reason: string | null;

    // Contextual Computed User State
    has_joined: boolean;
    has_submitted: boolean;
    user_submission_status: string | null;
}

export interface Submission {
    id: string;
    challenge_id: number;
    user_id: string;
    user_name: string;
    user_username: string;
    user_avatar: string | null;

    submission_number: number;
    sub_type: SubmissionContentType;
    proof_text: string | null;
    proof_media_url: string | null;
    proof_link_url: string | null;
    is_late: boolean;
    is_draft: boolean;

    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    is_shortlisted: boolean;

    score: number | null;
    vote_count: number;
    reaction_count: number;

    is_flagged: boolean;
    created_at: string;
    reviewed_at: string | null;
}

export interface LeaderboardEntry {
    user_id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    score: number;
    rank: number;
    status: string;
    points: number;
    streak_count: number;
}
