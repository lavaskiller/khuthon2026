export type UserRole = 'consumer' | 'creator' | 'admin';

export interface User {
  id: string;
  email: string;
  nickname?: string;
  role: UserRole;
  onboardingCompleted?: boolean; // consumer only
}

export type ContentType = 'movie' | 'drama' | 'shortform' | 'book' | 'performance';
export type ContentStatus = 'pending' | 'approved' | 'rejected';
export type ReactionType = 'pass' | 'interest';
export type AgeRating = 'all' | '12' | '15' | '19';
export type Genre =
  | 'action' | 'drama' | 'comedy' | 'romance' | 'thriller'
  | 'horror' | 'sf' | 'fantasy' | 'mystery' | 'documentary'
  | 'animation' | 'family' | 'music';

export interface Content {
  id: string;
  creatorId: string;
  teaserUrl: string;
  teaserDuration: number; // seconds
  contentType: ContentType;
  status: ContentStatus;
  rejectionReason?: string;
  uploadedAt: string;
  approvedAt?: string;
  exposureCount: number;
  interestCount: number;
  // private info — only visible after veil reveal
  title?: string;
  synopsis?: string;
  genres?: Genre[];
  directors?: string[];
  releaseDate?: string;
  ageRating?: AgeRating;
  externalLink?: string;
}

export interface Reaction {
  id: string;
  contentId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

export type NotificationType = 'info_reveal' | 'external_notice' | 'review_result';

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  relatedContentId: string;
  relatedUserId?: string; // anonymized consumer identifier
  extraData?: Record<string, unknown>; // rejection reason, etc.
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface ExternalNotice {
  id: string;
  contentId: string;
  targetUserId: string;
  url: string;
  message: string;
  linkLabel?: string;
  sentAt: string;
}

export interface ConsumerProfile {
  birthDate: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'prefer_not_to_say';
  region?: string;
  preferredGenres: Genre[];
  preferredContentTypes?: ContentType[];
}

export interface AnonymizedConsumer {
  anonymousId: string;
  userId: number; // backend user_id — used for notice sending, not displayed
  ageGroup: string;
  gender: string;
  region?: string;
  interestAt: string;
  noticeSent: boolean;
  noticeSentAt?: string;
}
