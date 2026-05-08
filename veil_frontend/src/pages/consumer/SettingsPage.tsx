import { useState } from 'react';
import { useAuth } from '@/context/auth';
import { useNavigate } from 'react-router-dom';
import styles from './ConsumerPages.module.css';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(user?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleSaveNickname() {
    if (!nicknameInput.trim() || !user) return;
    setSaving(true);
    // mock: just update in memory; real: call api.consumer.updateProfile
    await new Promise(r => setTimeout(r, 300));
    setUser({ ...user, nickname: nicknameInput.trim() });
    setSaving(false);
    setEditingNickname(false);
  }

  return (
    <div className={styles.settingsPage}>
      <h2 className={styles.settingsPageTitle}>설정</h2>

      <div className={styles.settingsSection}>
        <p className={styles.settingsSectionLabel}>계정</p>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel}>이메일</span>
            <span className={styles.settingsValue}>{user?.email}</span>
          </div>
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel}>닉네임</span>
            {editingNickname ? (
              <div className={styles.nicknameEditRow}>
                <input
                  className={styles.nicknameInput}
                  value={nicknameInput}
                  onChange={e => setNicknameInput(e.target.value)}
                  maxLength={20}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveNickname(); if (e.key === 'Escape') setEditingNickname(false); }}
                />
                <button className={styles.nicknameSaveBtn} onClick={handleSaveNickname} disabled={saving}>
                  {saving ? '…' : '저장'}
                </button>
                <button className={styles.nicknameCancelBtn} onClick={() => { setEditingNickname(false); setNicknameInput(user?.nickname ?? ''); }}>
                  취소
                </button>
              </div>
            ) : (
              <div className={styles.nicknameEditRow}>
                <span className={styles.settingsValue}>{user?.nickname ?? '—'}</span>
                <button className={styles.nicknameEditBtn} onClick={() => setEditingNickname(true)}>수정</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <p className={styles.settingsSectionLabel}>취향</p>
        <div className={`${styles.settingsCard} ${styles.clickable}`} onClick={() => navigate('/consumer/onboarding')}>
          <div className={styles.settingsRow}>
            <span className={styles.settingsLabel}>선호 장르 · 콘텐츠 종류 · 지역</span>
            <span className={styles.settingsValue}>수정 →</span>
          </div>
        </div>
      </div>

      <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
    </div>
  );
}
