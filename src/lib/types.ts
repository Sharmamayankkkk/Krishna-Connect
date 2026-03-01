export type User = {
  user_metadata?: any;
  id: string; // uuid
  avatar_url: string;
  name: string;
  username: string;
  email?: string; // from auth.users
  gender?: 'male' | 'female';
  bio?: string;
  role?: 'user' | 'admin' | 'gurudev';
  is_admin: boolean;
  is_private?: boolean;
  is_verified?: 'none' | 'verified' | 'kcs';
  has_set_privacy?: boolean;
  settings?: UserSettings; // JSONB column
  phone?: string;
  challenge_points?: number;
};

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email: boolean;
    push: boolean;
  };
  privacy?: {
    show_online_status: boolean;
    allow_dms_from_strangers: boolean;
  };
  chat_preferences?: {
    outgoingBubbleColor: string;
    incomingBubbleColor: string;
    usernameColor: string;
    chatWallpaper: string | null;
    wallpaperBrightness: number;
  };
}

export type Media = {
  type: string;
  url: string;
};

export type Post = {
  id: number | string;
  author_id: string;
  created_at: string;
  image_url?: string | null;
  content?: string | null;
  stats: {
    likes?: number;
    comments?: number;
    reposts?: number;
    quotes?: number;
    views?: number;
  };
  // Added fields based on usage
  author: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
    verified?: 'none' | 'verified' | 'kcs';
  };
  media_urls?: Media[];
  likes: string[]; // array of user IDs
  reposts: string[]; // array of user IDs
  quote_of?: Post;
  poll?: any;
};

export type Reaction = {
  [emoji: string]: string[]; // emoji: array of user IDs that reacted with it
};

// This represents the JSONB metadata for an attachment
export type AttachmentMetadata = {
  name: string;
  type: string; // MIME type for files, or a custom type like 'event_share'
  size: number;
  // Optional fields for custom embeds
  eventId?: number;
  eventDate?: string;
  eventThumbnail?: string | null;
  // Link Previews
  title?: string;
  description?: string;
  image?: string;
  icon?: string;
  url?: string;
  // Shared Posts
  postAuthor?: string;
  postAuthorAvatar?: string;
  postContent?: string;
  // Voice Notes
  duration?: number;
  waveform?: number[];
};

// Matches public.messages table, with sender profile joined
export type Message = {
  id: number | string; // Allow string for temporary optimistic IDs
  created_at: string; // timestamp with time zone
  chat_id: number; // bigint
  user_id: string; // uuid
  content: string | null;
  profiles: User;
  attachment_url: string | null;
  attachment_metadata: AttachmentMetadata | null;
  is_edited: boolean;
  reactions: Reaction | null;
  read_by: string[] | null;
  deleted_for?: string[];
  is_starred?: boolean;
  is_pinned?: boolean;
  reply_to_message_id?: number | null;
  replied_to_message?: Message | null; // Joined reply data
};

// Represents a row in the public.participants table, with the user profile joined
export type Participant = {
  user_id: string;
  chat_id: number;
  is_admin: boolean;
  profiles: User;
}

// Matches public.chats table, with participants joined
export type Chat = {
  id: number; // bigint
  created_at: string; // timestamp with time zone
  type: 'dm' | 'group' | 'channel';
  name?: string;
  avatar_url?: string;
  created_by?: string; // uuid
  description?: string;
  participants: Participant[];
  messages: Message[];

  // Group-specific fields from DB
  is_public: boolean;
  history_visible: boolean;
  invite_code: string | null;

  // UI-only fields
  unreadCount?: number;
  last_message_content?: string | null;
  last_message_timestamp?: string | null;
};

// Matches the dm_requests table
export type DmRequest = {
  id: number;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reason?: string;
  // Joined from profiles table
  from: User;
  to: User;
};

// Matches the reports table
export type Report = {
  id: number;
  created_at: string;
  reported_by: string;
  reported_user_id: string;
  message_id?: number;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  // Joined data for admin panel
  reporter?: User;
  reported_user?: User;
  message?: Partial<Message>;
}

export type ThemeSettings = {
  outgoingBubbleColor: string;
  incomingBubbleColor: string;
  usernameColor: string;
  chatWallpaper: string | null;
  wallpaperBrightness: number;
};

// ============================================================================
// CALL TYPES
// ============================================================================

export type CallType = 'voice' | 'video';

export type CallStatus = 'ringing' | 'busy' | 'answered' | 'ended' | 'missed' | 'declined' | 'failed';

export type CallSignalType = 'offer' | 'answer' | 'ice-candidate' | 'renegotiate' | 'hangup' | 'busy' | 'decline';

export type CallRecord = {
  id: string;
  caller_id: string;
  callee_id?: string; // made optional for group calls
  chat_id?: number; // for group calls
  is_group: boolean;
  call_type: CallType;
  status: CallStatus;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
  // Joined profile data (from get_call_history RPC)
  caller_name?: string;
  caller_username?: string;
  caller_avatar?: string;
  callee_name?: string;
  callee_username?: string;
  callee_avatar?: string;
};

export type CallSignal = {
  id: number;
  call_id: string;
  sender_id: string;
  receiver_id: string;
  signal_type: CallSignalType;
  payload: Record<string, unknown>;
  created_at: string;
};

export type ActiveCall = {
  callRecord: CallRecord;
  isOutgoing: boolean;
  remoteUser: User;
  callType: CallType;
};

export type RSVPStatus = 'going' | 'interested' | 'not_going';

export type EventRSVP = {
  event_id: number;
  user_id: string;
  status: RSVPStatus;
  profiles?: User; // Joined user profile for RSVP list
};

export type Event = {
  id: number;
  created_at: string;
  creator_id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  date_time: string;
  meet_link?: string;
  rsvps: EventRSVP[];
  profiles?: User; // Joined creator profile
  status: 'active' | 'cancelled';
  is_deleted: boolean;
};

export interface AppContextType {
  loggedInUser: User | null
  allUsers: User[]
  chats: Chat[]
  dmRequests: DmRequest[]
  blockedUsers: string[]
  sendDmRequest: (toUserId: string, reason: string) => Promise<void>
  addChat: (newChat: Chat) => void
  updateUser: (updates: Partial<User>) => Promise<void>
  leaveGroup: (chatId: number) => Promise<void>
  deleteGroup: (chatId: number) => Promise<void>
  blockUser: (userId: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
  reportUser: (reportedUserId: string, reason: string, messageId?: number) => Promise<void>
  forwardMessage: (message: Message, chatIds: number[]) => Promise<void>
  themeSettings: ThemeSettings
  setThemeSettings: (newSettings: Partial<ThemeSettings>) => void
  isReady: boolean
  resetUnreadCount: (chatId: number) => void
  refreshProfile: () => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
}

// --- Types moved from src/app/(app)/data.ts ---

export type UserType = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  verified?: 'none' | 'verified' | 'kcs';
  followersCount?: number;
  followingCount?: number;
};

export type CommentType = {
  [x: string]: any;
  id: string;
  user: UserType;
  text: string;
  isPinned: boolean;
  likes: number;
  isHidden: boolean;
  replies: CommentType[];
  createdAt: string;
  editedAt?: string;
  likedBy: string[];
  is_liked?: boolean;
  parent_comment_id?: string | null;
};

export type ReplyType = CommentType;

export type MediaType = {
  type: 'image' | 'video' | 'gif';
  url: string;
  alt?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  file?: File;
};

export type PollOptionType = {
  id: string;
  text: string;
  votes: number;
  votedBy: string[];
};

export type PollType = {
  id: string;
  question: string;
  options: PollOptionType[];
  totalVotes: number;
  endsAt: string;
  allowMultipleChoices: boolean;
  isQuiz?: boolean;
  correctAnswerId?: string;
};

export type CollaborationRequest = {
  userId: string;
  status: 'pending' | 'accepted' | 'declined';
};

export type PostAnalyticsType = {
  impressions: number;
  reach: number;
  engagementRate: number;
  profileVisits: number;
  followerGrowth: number;
  demographics: {
    topLocations: { location: string; percentage: number }[];
    ageRange: { range: string; percentage: number }[];
    gender: { male: number; female: number; other: number };
  };
  trafficSources: { source: string; percentage: number }[];
  engagementByType: {
    likes: number;
    comments: number;
    reposts: number;
    bookmarks: number;
  },
  viewsOverTime: { date: string; views: number }[];
};

export type PostType = {
  id: string;
  author: UserType;
  createdAt: string;
  content: string;
  media: MediaType[];
  poll?: PollType;
  stats: {
    comments: number;
    reshares: number;
    reposts: number;
    likes: number;
    views: number;
    bookmarks: number;
  };
  comments: CommentType[];
  originalPost: Omit<PostType, 'originalPost' | 'comments' | 'stats' | 'poll'> | null;
  editedAt?: string;
  likedBy: string[];
  savedBy: string[];
  repostedBy: string[];
  isPinned?: boolean;
  isRepost?: boolean;
  repostOf?: string;
  isPromoted?: boolean;
  collaborators?: UserType[];
  pendingCollaborators?: CollaborationRequest[];
  analytics?: PostAnalyticsType;
};

export type NotificationType = {
  id: string;
  type: 'like' | 'comment' | 'repost' | 'quote' | 'follow' | 'mention' | 'poll_vote' | 'collaboration_request' | 'livestream_invite' | 'challenge_invite' | 'challenge_submission' | 'challenge_approved' | 'challenge_rejected' | 'challenge_won';
  fromUser: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  postId?: string;
  commentId?: string;
  text?: string;
  createdAt: string;
  read: boolean;
  postContent?: string;
  postMediaType?: 'image' | 'video' | 'poll';
  postAuthorUsername?: string;
  status?: 'pending' | 'accepted' | 'declined';
  related_id?: string; // For livestream invites and other related entities
};

export type UserRelationship = {
  userId: string;
  following: string[];
  followers: string[];
  blockedUsers: string[];
  mutedUsers: string[];
};

export type BookmarkCollection = {
  id: string;
  name: string;
  postIds: string[];
  createdAt: string;
  isPrivate: boolean;
};

export type TrendingTopic = {
  id: string;
  hashtag: string;
  postsCount: number;
  category?: string;
};

export type DraftPost = {
  id: string;
  content: string;
  media: MediaType[];
  poll?: PollType;
  createdAt: string;
  updatedAt: string;
};
// Utility Functions

export const generateId = (prefix: 'post' | 'comment' | 'reply' | 'poll' | 'notif' | 'draft'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createEmptyPoll = (question: string, options: string[], endsInHours: number = 24, isQuiz: boolean = false, correctAnswerIndex: number = -1): PollType => {
  const pollOptions = options.map((text, index) => ({
    id: `opt_${Date.now()}_${index}`,
    text,
    votes: 0,
    votedBy: []
  }));
  return {
    id: generateId('poll'),
    question,
    options: pollOptions,
    totalVotes: 0,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * endsInHours).toISOString(),
    allowMultipleChoices: false,
    isQuiz,
    correctAnswerId: isQuiz && correctAnswerIndex >= 0 && correctAnswerIndex < pollOptions.length ? pollOptions[correctAnswerIndex].id : undefined,
  };
};

export const createDraft = (content: string, media: MediaType[] = []): DraftPost => {
  return {
    id: generateId('draft'),
    content,
    media,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
