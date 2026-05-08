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

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://192.168.2.19:8000';
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

// ─── Enum converters (frontend lowercase ↔ backend UPPERCASE) ────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const roleFromBackend = (r: string): UserRole =>
  r === 'USER' ? 'consumer' : (r.toLowerCase() as UserRole);

const genderToBackend = (g: string): string =>
  g === 'prefer_not_to_say' ? 'OTHER' : g.toUpperCase();

const genderFromBackend = (g: string): string =>
  g === 'OTHER' ? 'prefer_not_to_say' : g.toLowerCase();

const genresToBackend = (genres: Genre[]): string[] => genres.map(g => g.toUpperCase());

const genresFromBackend = (genres: unknown[]): Genre[] =>
  genres.map(g => (g as string).toLowerCase() as Genre);

const contentTypeToBackend = (ct: ContentType): string => ct.toUpperCase();

const contentTypeFromBackend = (ct: string): ContentType => ct.toLowerCase() as ContentType;

// ─── Response mappers (backend snake_case → frontend camelCase) ───────────────

function mapUser(u: Raw): User {
  return {
    id: String(u.id),
    email: u.email as string,
    nickname: u.name as string,
    role: roleFromBackend(u.role as string),
    onboardingCompleted: false,
  };
}

function mapContent(c: Raw): Content {
  return {
    id: String(c.id),
    creatorId: String(c.user_id ?? ''),
    teaserUrl: (c.teaser_url as string) ?? '',
    teaserDuration: (c.teaser_length as number) ?? 0,
    contentType: contentTypeFromBackend((c.content_type as string) ?? 'movie'),
    status: c.review_status ?? 'pending',
    rejectionReason: c.rejection_reason ?? undefined,
    uploadedAt: (c.created_at as string) ?? '',
    approvedAt: c.approved_at ?? undefined,
    exposureCount: (c.exposure_count as number) ?? 0,
    interestCount: (c.interest_count as number) ?? 0,
    title: c.title ?? undefined,
    synopsis: c.synopsis ?? undefined,
    genres: Array.isArray(c.genres) && c.genres.length > 0 ? genresFromBackend(c.genres) : undefined,
    directors: c.director_staff ? [(c.director_staff as string)] : undefined,
    releaseDate: c.release_date ?? undefined,
    ageRating: c.age_rating ?? undefined,
    externalLink: c.external_link ?? undefined,
  };
}

function mapFeedItem(item: Raw): Content {
  return {
    id: String(item.id),
    creatorId: '',
    teaserUrl: (item.teaser_url as string) ?? '',
    teaserDuration: (item.teaser_length as number) ?? 0,
    contentType: contentTypeFromBackend((item.content_type as string) ?? 'movie'),
    status: 'approved',
    uploadedAt: '',
    exposureCount: 0,
    interestCount: 0,
  };
}

function mapReveal(reveal: Raw, contentId: string): Content {
  return {
    id: contentId,
    creatorId: '',
    teaserUrl: '',
    teaserDuration: 0,
    contentType: contentTypeFromBackend((reveal.content_type as string) ?? 'movie'),
    status: 'approved',
    uploadedAt: '',
    exposureCount: 0,
    interestCount: 0,
    title: reveal.title ?? undefined,
    synopsis: reveal.synopsis ?? undefined,
    genres: Array.isArray(reveal.genres) && reveal.genres.length > 0 ? genresFromBackend(reveal.genres) : undefined,
    directors: reveal.director_staff ? [(reveal.director_staff as string)] : undefined,
    releaseDate: reveal.release_date ?? undefined,
    ageRating: reveal.age_rating ?? undefined,
    externalLink: reveal.external_link ?? undefined,
  };
}

function mapInterestItem(item: Raw): Content {
  return {
    id: String(item.content_id),
    creatorId: '',
    teaserUrl: '',
    teaserDuration: 0,
    contentType: contentTypeFromBackend((item.content_type as string) ?? 'movie'),
    status: 'approved',
    uploadedAt: (item.interested_at as string) ?? '',
    exposureCount: 0,
    interestCount: 0,
    title: item.title ?? undefined,
    genres: Array.isArray(item.genres) && item.genres.length > 0 ? genresFromBackend(item.genres) : undefined,
  };
}

function mapConsumer(c: Raw): AnonymizedConsumer {
  return {
    anonymousId: c.anon_id as string,
    userId: c.user_id as number,
    ageGroup: c.age_group as string,
    gender: genderFromBackend((c.gender as string) ?? ''),
    region: c.region ?? undefined,
    interestAt: (c.interested_at as string) ?? '',
    noticeSent: (c.notice_sent as boolean) ?? false,
    noticeSentAt: c.notice_sent_at ?? undefined,
  };
}

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
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>('/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getMe: (token: string) =>
      request<Raw>('/users/me', token).then(mapUser),
  },

  consumer: {
    // 온보딩 완료 후 PATCH /users/me로 프로필 업데이트
    saveProfile: (token: string, profile: ConsumerProfile) =>
      request<Raw>('/users/me', token, {
        method: 'PATCH',
        body: JSON.stringify({
          birth_date: profile.birthDate,
          gender: genderToBackend(profile.gender),
          region: profile.region,
          genres: genresToBackend(profile.preferredGenres),
          content_types: (profile.preferredContentTypes ?? []).map(contentTypeToBackend),
        }),
      }).then(u => ({ ...mapUser(u), onboardingCompleted: true })),

    // GET /explore/feed?content_types=MOVIE&...
    getFeed: (token: string, contentTypes: ContentType[]) =>
      request<{ items: Raw[]; has_more: boolean }>(
        `/explore/feed${contentTypes.length ? `?${contentTypes.map(t => `content_types=${contentTypeToBackend(t)}`).join('&')}` : ''}`,
        token,
      ).then(res => res.items.map(mapFeedItem)),

    // GET /explore/interests → InterestListItem[]
    getInterests: (token: string) =>
      request<Raw[]>('/explore/interests', token).then(items => items.map(mapInterestItem)),

    // POST /explore/{id}/interest → ContentRevealRead
    addInterest: (token: string, contentId: string) =>
      request<Raw>(`/explore/${contentId}/interest`, token, { method: 'POST' })
        .then(reveal => ({ content: mapReveal(reveal, contentId) })),

    // DELETE /explore/{id}/interest
    removeInterest: (token: string, contentId: string) =>
      request<void>(`/explore/${contentId}/interest`, token, { method: 'DELETE' }),

    // POST /explore/{id}/pass
    recordPass: (token: string, contentId: string) =>
      request<Raw>(`/explore/${contentId}/pass`, token, { method: 'POST' }).then(() => undefined),

    // GET /explore/{id}/reveal → ContentRevealRead
    getContent: (token: string, contentId: string) =>
      request<Raw>(`/explore/${contentId}/reveal`, token).then(r => mapReveal(r, contentId)),

    // GET /notifications
    getNotifications: (token: string) =>
      request<{ items: Raw[]; total: number }>('/notifications', token)
        .then(res => res.items.map(mapNotification)),

    // PATCH /notifications/{id}/read
    markNotificationRead: (token: string, notificationId: string) =>
      request<void>(`/notifications/${notificationId}/read`, token, { method: 'PATCH' }),

    // POST /notifications/mark-all-read
    markAllNotificationsRead: (token: string) =>
      request<void>('/notifications/mark-all-read', token, { method: 'POST' }),
  },

  creator: {
    // POST /contents/upload (multipart)
    uploadTeaser: (token: string, formData: FormData) =>
      fetch(`${BASE_URL}${API_PREFIX}/contents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json() as Promise<Raw>;
      }).then(r => ({ contentId: String(r.id) })),

    // PATCH /contents/{id}
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
      request<Raw>(`/contents/${contentId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          title: info.title,
          synopsis: info.synopsis,
          genres: genresToBackend(info.genres),
          director_staff: info.directors?.join(', ') ?? null,
          release_date: info.releaseDate ?? null,
          age_rating: info.ageRating,
          external_link: info.externalLink ?? null,
        }),
      }).then(mapContent),

    // GET /contents
    getContents: (token: string) =>
      request<Raw[]>('/contents', token).then(list => list.map(mapContent)),

    // GET /dashboard → DashboardResponse { summary, notifications, contents }
    getDashboard: (token: string) =>
      request<Raw>('/dashboard', token).then(res => ({
        contents: Array.isArray(res.contents) ? (res.contents as Raw[]).map(mapContent) : [],
        unreadCount: (res.notifications as Raw)?.unread_count ?? 0,
      })),

    // GET /invite/{id}/interested → InterestedConsumerItem[]
    getConsumers: (token: string, contentId: string) =>
      request<Raw[]>(`/invite/${contentId}/interested`, token).then(list => list.map(mapConsumer)),

    // POST /invite/{id}/send
    sendNotice: (
      token: string,
      contentId: string,
      payload: { targetUserIds: string[]; url: string; message: string; linkLabel?: string },
    ) =>
      request<{ sent_count: number; notice_id: number }>(`/invite/${contentId}/send`, token, {
        method: 'POST',
        body: JSON.stringify({
          url: payload.url,
          message: payload.message,
          label: payload.linkLabel,
          user_ids: payload.targetUserIds.map(Number),
        }),
      }).then(r => ({ sentCount: r.sent_count })),

    // GET /notifications
    getNotifications: (token: string) =>
      request<{ items: Raw[]; total: number }>('/notifications', token)
        .then(res => res.items.map(mapNotification)),

    // PATCH /notifications/{id}/read
    markNotificationRead: (token: string, notificationId: string) =>
      request<void>(`/notifications/${notificationId}/read`, token, { method: 'PATCH' }),
  },

  admin: {
    // GET /review/pending → PaginatedPendingContents
    getPendingContents: (token: string) =>
      request<{ items: Raw[]; total: number }>('/review/pending', token)
        .then(res => res.items.map(mapContent)),

    // GET /review/{id}
    getContent: (token: string, contentId: string) =>
      request<Raw>(`/review/${contentId}`, token).then(mapContent),

    // POST /review/{id}/approve
    approve: (token: string, contentId: string) =>
      request<Raw>(`/review/${contentId}/approve`, token, { method: 'POST' }).then(() => undefined),

    // POST /review/{id}/reject
    reject: (token: string, contentId: string, reason: string) =>
      request<Raw>(`/review/${contentId}/reject`, token, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: reason }),
      }).then(() => undefined),
  },
};
