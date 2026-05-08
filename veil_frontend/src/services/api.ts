import type {
  User,
  UserRole,
  Content,
  ContentType,
  Genre,
  AgeRating,
  Notification,
  AnonymizedConsumer,
  ConsumerProfile,
} from '@/types';
import {
  MOCK_CONTENTS,
  MOCK_PENDING,
  MOCK_CONSUMER_NOTIFICATIONS,
  MOCK_CREATOR_NOTIFICATIONS,
  MOCK_CONSUMERS,
} from './mockData';

const IS_MOCK = (token: string | null | undefined) => token === 'mock-token';

// Backend runs on port 8000. Set VITE_API_URL to override (e.g. in production).
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://192.168.2.19:8000';
// Backend API prefix — matches API_V1_PREFIX in backend .env
const API_PREFIX = (import.meta.env.VITE_API_PREFIX as string | undefined) ?? '/api/v1';

async function request<T>(path: string, token?: string | null, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ─── Response mappers (backend snake_case → frontend camelCase) ───────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function mapUser(u: Raw): User {
  return {
    id: String(u.id),
    email: u.email as string,
    nickname: u.name as string,
    role: u.role as UserRole,
    onboardingCompleted: false, // backend doesn't track this — managed in frontend
  };
}

function mapContent(c: Raw): Content {
  return {
    id: String(c.id),
    creatorId: String(c.user_id ?? ''),
    teaserUrl: (c.teaser_url as string) ?? '',
    teaserDuration: (c.teaser_length as number) ?? 0,
    contentType: c.content_type as ContentType,
    status: c.review_status ?? 'pending',
    rejectionReason: c.rejection_reason ?? undefined,
    uploadedAt: (c.created_at as string) ?? '',
    approvedAt: c.approved_at ?? undefined,
    exposureCount: (c.exposure_count as number) ?? 0,
    interestCount: (c.interest_count as number) ?? 0,
    title: c.title ?? undefined,
    synopsis: c.synopsis ?? undefined,
    genres: Array.isArray(c.genres) && c.genres.length > 0 ? c.genres : undefined,
    directors: c.director_staff ? [(c.director_staff as string)] : undefined,
    releaseDate: c.release_date ?? undefined,
    ageRating: c.age_rating ?? undefined,
    externalLink: c.external_link ?? undefined,
  };
}

// FeedItem은 blind 원칙상 최소 필드만 있음 (title 등 없음)
function mapFeedItem(item: Raw): Content {
  return {
    id: String(item.id),
    creatorId: '',
    teaserUrl: (item.teaser_url as string) ?? '',
    teaserDuration: (item.teaser_length as number) ?? 0,
    contentType: item.content_type as ContentType,
    status: 'approved',
    uploadedAt: '',
    exposureCount: 0,
    interestCount: 0,
  };
}

// ContentRevealRead — interest 후 공개되는 정보
function mapReveal(reveal: Raw, contentId: string): Content {
  return {
    id: contentId,
    creatorId: '',
    teaserUrl: '',
    teaserDuration: 0,
    contentType: reveal.content_type as ContentType,
    status: 'approved',
    uploadedAt: '',
    exposureCount: 0,
    interestCount: 0,
    title: reveal.title ?? undefined,
    synopsis: reveal.synopsis ?? undefined,
    genres: Array.isArray(reveal.genres) && reveal.genres.length > 0 ? reveal.genres : undefined,
    directors: reveal.director_staff ? [(reveal.director_staff as string)] : undefined,
    releaseDate: reveal.release_date ?? undefined,
    ageRating: reveal.age_rating ?? undefined,
    externalLink: reveal.external_link ?? undefined,
  };
}

// InterestListItem → Content (title, genres 포함)
function mapInterestItem(item: Raw): Content {
  return {
    id: String(item.content_id),
    creatorId: '',
    teaserUrl: '',
    teaserDuration: 0,
    contentType: item.content_type as ContentType,
    status: 'approved',
    uploadedAt: (item.interested_at as string) ?? '',
    exposureCount: 0,
    interestCount: 0,
    title: item.title ?? undefined,
    genres: Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : undefined,
  };
}

// InterestedConsumerItem → AnonymizedConsumer
function mapConsumer(c: Raw): AnonymizedConsumer {
  return {
    anonymousId: c.anon_id as string,
    userId: c.user_id as number,
    ageGroup: c.age_group as string,
    gender: (c.gender as string) ?? '',
    region: c.region ?? undefined,
    interestAt: (c.interested_at as string) ?? '',
    noticeSent: (c.notice_sent as boolean) ?? false,
    noticeSentAt: c.notice_sent_at ?? undefined,
  };
}

// NotificationItem → Notification
function mapNotification(n: Raw): Notification {
  return {
    id: String(n.id),
    recipientUserId: n.related_user_id != null ? String(n.related_user_id) : '',
    type: n.notification_type as Notification['type'],
    relatedContentId: n.related_content_id != null ? String(n.related_content_id) : '',
    extraData: (n.extra_data as Record<string, unknown>) ?? undefined,
    isRead: (n.is_read as boolean) ?? false,
    createdAt: (n.created_at as string) ?? '',
    readAt: (n.read_at as string) ?? undefined,
  };
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    // 반환: { access_token, token_type } — user 없음, 별도로 getMe 호출 필요
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>('/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    // 회원가입 후 { user, token } 반환 (mock은 즉시 반환)
    // TODO 실제 연동: POST /auth/register → POST /auth/login → GET /users/me
    register: (email: string, _password: string, role: UserRole, nickname: string): Promise<{ user: User; token: string }> => {
      const user: User = { id: `user-${Date.now()}`, email, nickname, role, onboardingCompleted: false };
      return Promise.resolve({ user, token: 'mock-token' });
    },

    getMe: (token: string) =>
      request<Raw>('/users/me', token).then(mapUser),
  },

  consumer: {
    // 온보딩 완료 후 PATCH /users/me로 프로필 업데이트
    saveProfile: (token: string, profile: ConsumerProfile) =>
      IS_MOCK(token)
        ? Promise.resolve({ id: 'mock-consumer', email: 'consumer@test.com', role: 'consumer' as UserRole, onboardingCompleted: true } as User)
        : request<Raw>('/users/me', token, {
            method: 'PATCH',
            body: JSON.stringify({
              birth_date: profile.birthDate,
              gender: profile.gender,
              region: profile.region,
              genres: profile.preferredGenres,
              content_types: profile.preferredContentTypes,
            }),
          }).then(u => ({ ...mapUser(u), onboardingCompleted: true })),

    // 백엔드: GET /explore/feed?content_types=movie&content_types=drama&...
    // 반환: FeedPage { items, has_more, page, page_size } → Content[]로 변환
    getFeed: (token: string, contentTypes: ContentType[]) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CONTENTS.filter(c => c.status === 'approved'))
        : request<{ items: Raw[]; has_more: boolean }>(
            `/explore/feed${contentTypes.length ? `?${contentTypes.map(t => `content_types=${t}`).join('&')}` : ''}`,
            token,
          ).then(res => res.items.map(mapFeedItem)),

    // 백엔드: GET /explore/interests → InterestListItem[]
    getInterests: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CONTENTS.slice(0, 2))
        : request<Raw[]>('/explore/interests', token).then(items => items.map(mapInterestItem)),

    // 백엔드: POST /explore/{id}/interest → ContentRevealRead
    addInterest: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve({ content: MOCK_CONTENTS.find(c => c.id === contentId)! })
        : request<Raw>(`/explore/${contentId}/interest`, token, { method: 'POST' })
            .then(reveal => ({ content: mapReveal(reveal, contentId) })),

    // 백엔드: DELETE /explore/{id}/interest
    removeInterest: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<void>(`/explore/${contentId}/interest`, token, { method: 'DELETE' }),

    // 백엔드: POST /explore/{id}/pass
    recordPass: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<Raw>(`/explore/${contentId}/pass`, token, { method: 'POST' }).then(() => undefined),

    // 백엔드: GET /explore/{id}/reveal → ContentRevealRead
    getContent: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CONTENTS.find(c => c.id === contentId) ?? MOCK_CONTENTS[0])
        : request<Raw>(`/explore/${contentId}/reveal`, token).then(r => mapReveal(r, contentId)),

    // 백엔드: GET /notifications → NotificationListResponse { items, total, page, page_size }
    getNotifications: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CONSUMER_NOTIFICATIONS)
        : request<{ items: Raw[]; total: number }>('/notifications', token)
            .then(res => res.items.map(mapNotification)),

    // 백엔드: PATCH /notifications/{id}/read → 204
    markNotificationRead: (token: string, notificationId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<void>(`/notifications/${notificationId}/read`, token, { method: 'PATCH' }),

    // 백엔드: POST /notifications/mark-all-read → 204
    markAllNotificationsRead: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<void>('/notifications/mark-all-read', token, { method: 'POST' }),
  },

  creator: {
    // 백엔드: POST /contents/upload (multipart: teaser_file, mvp_file, content_type)
    uploadTeaser: (token: string, formData: FormData) =>
      IS_MOCK(token)
        ? Promise.resolve({ contentId: 'mock-new-content' })
        : fetch(`${BASE_URL}${API_PREFIX}/contents/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }).then(r => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json() as Promise<Raw>;
          }).then(r => ({ contentId: String(r.id) })),

    // 백엔드: PATCH /contents/{id}
    saveContentInfo: (
      token: string,
      contentId: string,
      info: {
        title: string;
        synopsis: string;
        genres: Genre[];
        directors?: string[];
        releaseDate?: string;
        ageRating: AgeRating;
        externalLink?: string;
      },
    ) =>
      IS_MOCK(token)
        ? Promise.resolve({ ...MOCK_CONTENTS[0], id: contentId, ...info } as Content)
        : request<Raw>(`/contents/${contentId}`, token, {
            method: 'PATCH',
            body: JSON.stringify({
              title: info.title,
              synopsis: info.synopsis,
              genres: info.genres,
              director_staff: info.directors?.join(', ') ?? null,
              release_date: info.releaseDate ?? null,
              age_rating: info.ageRating,
              external_link: info.externalLink ?? null,
            }),
          }).then(mapContent),

    // 백엔드: GET /contents
    getContents: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CONTENTS.filter(c => c.creatorId === 'mock-creator'))
        : request<Raw[]>('/contents', token).then(list => list.map(mapContent)),

    // 백엔드: GET /dashboard → DashboardResponse { summary, notifications, contents }
    getDashboard: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve({ contents: MOCK_CONTENTS.filter(c => c.creatorId === 'mock-creator'), unreadCount: 2 })
        : request<Raw>('/dashboard', token).then(res => ({
            contents: Array.isArray(res.contents) ? (res.contents as Raw[]).map(mapContent) : [],
            unreadCount: (res.notifications as Raw)?.unread_count ?? 0,
          })),

    // 백엔드: GET /invite/{id}/interested → InterestedConsumerItem[]
    getConsumers: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CONSUMERS)
        : request<Raw[]>(`/invite/${contentId}/interested`, token).then(list => list.map(mapConsumer)),

    // 백엔드: POST /invite/{id}/send
    // payload.targetUserIds: string[] (URL에서 온 user_id 값들) → user_ids: int[]
    sendNotice: (
      token: string,
      contentId: string,
      payload: { targetUserIds: string[]; url: string; message: string; linkLabel?: string },
    ) =>
      IS_MOCK(token)
        ? Promise.resolve({ sentCount: payload.targetUserIds.length })
        : request<{ sent_count: number; notice_id: number }>(`/invite/${contentId}/send`, token, {
            method: 'POST',
            body: JSON.stringify({
              url: payload.url,
              message: payload.message,
              label: payload.linkLabel,
              user_ids: payload.targetUserIds.map(Number),
            }),
          }).then(r => ({ sentCount: r.sent_count })),

    // 백엔드: GET /notifications → NotificationListResponse
    getNotifications: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_CREATOR_NOTIFICATIONS)
        : request<{ items: Raw[]; total: number }>('/notifications', token)
            .then(res => res.items.map(mapNotification)),

    // 백엔드: PATCH /notifications/{id}/read → 204
    markNotificationRead: (token: string, notificationId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<void>(`/notifications/${notificationId}/read`, token, { method: 'PATCH' }),
  },

  admin: {
    // 백엔드: GET /review/pending → PaginatedPendingContents { items, total, page, page_size }
    getPendingContents: (token: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_PENDING)
        : request<{ items: Raw[]; total: number }>('/review/pending', token)
            .then(res => res.items.map(mapContent)),

    // 백엔드: GET /review/{id} → ContentAdminDetail
    getContent: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(MOCK_PENDING.find(c => c.id === contentId) ?? MOCK_PENDING[0])
        : request<Raw>(`/review/${contentId}`, token).then(mapContent),

    // 백엔드: POST /review/{id}/approve
    approve: (token: string, contentId: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<Raw>(`/review/${contentId}/approve`, token, { method: 'POST' }).then(() => undefined),

    // 백엔드: POST /review/{id}/reject — { rejection_reason }
    reject: (token: string, contentId: string, reason: string) =>
      IS_MOCK(token)
        ? Promise.resolve(undefined as void)
        : request<Raw>(`/review/${contentId}/reject`, token, {
            method: 'POST',
            body: JSON.stringify({ rejection_reason: reason }),
          }).then(() => undefined),
  },
};
