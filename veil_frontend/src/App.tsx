import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/auth';
import { RequireAuth, RequireGuest } from '@/router';

import AuthLayout from '@/layouts/AuthLayout';
import ConsumerLayout from '@/layouts/ConsumerLayout';
import CreatorLayout from '@/layouts/CreatorLayout';
import AdminLayout from '@/layouts/AdminLayout';

import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

import OnboardingPage from '@/pages/consumer/OnboardingPage';
import FilterPage from '@/pages/consumer/FilterPage';
import ConsumerHomePage from '@/pages/consumer/ConsumerHomePage';
import FeedPage from '@/pages/consumer/FeedPage';
import ContentDetailPage from '@/pages/consumer/ContentDetailPage';
import InterestsPage from '@/pages/consumer/InterestsPage';
import ConsumerNotificationsPage from '@/pages/consumer/NotificationsPage';
import SettingsPage from '@/pages/consumer/SettingsPage';

import DashboardPage from '@/pages/creator/DashboardPage';
import UploadPage from '@/pages/creator/UploadPage';
import UploadInfoPage from '@/pages/creator/UploadInfoPage';
import ContentsPage from '@/pages/creator/ContentsPage';
import ConsumersPage from '@/pages/creator/ConsumersPage';
import NoticePage from '@/pages/creator/NoticePage';
import CreatorNotificationsPage from '@/pages/creator/CreatorNotificationsPage';
import CreatorSettingsPage from '@/pages/creator/CreatorSettingsPage';

import ReviewListPage from '@/pages/admin/ReviewListPage';
import ReviewDetailPage from '@/pages/admin/ReviewDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth (guests only) */}
          <Route element={<RequireGuest />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Consumer */}
          <Route element={<RequireAuth role="consumer" />}>
            <Route path="/consumer/onboarding" element={<OnboardingPage />} />
            <Route path="/consumer/filter" element={<FilterPage />} />
            <Route path="/consumer/content/:id" element={<ContentDetailPage />} />
            <Route element={<ConsumerLayout />}>
              <Route path="/consumer/home" element={<ConsumerHomePage />} />
              <Route path="/consumer/feed" element={<FeedPage />} />
              <Route path="/consumer/interests" element={<InterestsPage />} />
              <Route path="/consumer/notifications" element={<ConsumerNotificationsPage />} />
              <Route path="/consumer/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Creator */}
          <Route element={<RequireAuth role="creator" />}>
            <Route element={<CreatorLayout />}>
              <Route path="/creator/dashboard" element={<DashboardPage />} />
              <Route path="/creator/contents" element={<ContentsPage />} />
              <Route path="/creator/notifications" element={<CreatorNotificationsPage />} />
              <Route path="/creator/settings" element={<CreatorSettingsPage />} />
            </Route>
            <Route path="/creator/upload" element={<UploadPage />} />
            <Route path="/creator/upload/info" element={<UploadInfoPage />} />
            <Route path="/creator/consumers/:contentId" element={<ConsumersPage />} />
            <Route path="/creator/notice/:contentId" element={<NoticePage />} />
          </Route>

          {/* Admin */}
          <Route element={<RequireAuth role="admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/review" element={<ReviewListPage />} />
              <Route path="/admin/review/:id" element={<ReviewDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
