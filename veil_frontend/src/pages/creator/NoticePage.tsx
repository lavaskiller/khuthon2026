import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import styles from './CreatorPages.module.css';

const MAX_MESSAGE = 300;
const MAX_LABEL = 30;

export default function NoticePage() {
  const { contentId } = useParams<{ contentId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !contentId) return;
    api.creator.getConsumers(token, contentId)
      .then(list => setTargetIds(list.map(c => String(c.userId))))
      .catch(() => {});
  }, [token, contentId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !contentId) return;
    setIsLoading(true);
    setError('');
    try {
      await api.creator.sendNotice(token, contentId, {
        targetUserIds: targetIds,
        url,
        message,
        linkLabel: linkLabel || undefined,
      });
      setDone(true);
    } catch {
      setError('발송 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.');
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.noticeSuccess}>
          <div className={styles.noticeSuccessIcon}>✓</div>
          <h1 className={styles.pageTitle}>발송 완료</h1>
          <p className={styles.pageDesc}>{targetIds.length}명의 소비자에게 외부 안내를 성공적으로 발송했습니다.</p>
          <div className={styles.noticeSuccessActions}>
            <button className={styles.actionBtn} onClick={() => navigate(-1)}>이전으로</button>
            <button className={styles.uploadBtn} onClick={() => navigate('/creator/dashboard')}>대시보드로 이동</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeaderRow}>
        <div>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← 돌아가기</button>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>외부 안내 일괄 발송</h1>
          <p className={styles.pageDesc} style={{ marginTop: 4 }}>
            관심을 표시한 소비자 <strong>{targetIds.length}명</strong>에게 동일한 링크와 메시지를 발송합니다.
          </p>
        </div>
      </div>

      <div className={styles.noticeLayout}>
        {/* 폼 */}
        <form className={styles.noticeForm} onSubmit={handleSubmit}>
          {error && <p className={styles.errorMsg}>{error}</p>}

          <div className={styles.noticeFormSection}>
            <p className={styles.noticeSectionLabel}>링크 설정</p>
            <div className={styles.noticeField}>
              <label className={styles.noticeFieldLabel}>외부 링크 *</label>
              <input
                className={styles.input}
                type="url"
                placeholder="https://example.com/ticket"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
              />
            </div>
            <div className={styles.noticeField}>
              <div className={styles.inputLabelRow}>
                <label className={styles.noticeFieldLabel}>링크 라벨 (선택)</label>
                <span className={styles.charCount}>{linkLabel.length}/{MAX_LABEL}</span>
              </div>
              <input
                className={styles.input}
                maxLength={MAX_LABEL}
                placeholder="예매하기"
                value={linkLabel}
                onChange={e => setLinkLabel(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.noticeFormSection}>
            <div className={styles.inputLabelRow}>
              <p className={styles.noticeSectionLabel}>안내 메시지 *</p>
              <span className={`${styles.charCount} ${message.length >= MAX_MESSAGE ? styles.charCountFull : ''}`}>
                {message.length}/{MAX_MESSAGE}
              </span>
            </div>
            <textarea
              className={`${styles.textarea} ${styles.noticeTextarea}`}
              maxLength={MAX_MESSAGE}
              placeholder="소비자에게 전달할 안내 내용을 입력하세요."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          <button className={styles.noticeSubmitBtn} type="submit" disabled={isLoading || !url || !message}>
            {isLoading ? '발송 중...' : `${targetIds.length}명에게 일괄 발송`}
          </button>
        </form>

        {/* 우측 패널 */}
        <aside className={styles.noticeAside}>
          {/* 수신자 */}
          <div className={styles.noticeAsideCard}>
            <p className={styles.noticePanelLabel}>수신자</p>
            <div className={styles.noticeRecipientBox}>
              <span className={styles.noticeRecipientCount}>{targetIds.length}</span>
              <span className={styles.noticeRecipientText}>명</span>
            </div>
            <p className={styles.noticeGuide}>
              · 3일 내 최대 2회까지 발송 가능<br />
              · 발송 후 취소 불가
            </p>
          </div>

          {/* 미리보기 */}
          <div className={styles.noticeAsideCard}>
            <p className={styles.noticePanelLabel}>메시지 미리보기</p>
            <div className={styles.noticePreviewBubble}>
              <div className={styles.noticePreviewMsg}>
                {message || <span className={styles.noticePlaceholder}>메시지를 입력하면 여기에 표시됩니다.</span>}
              </div>
              {url && (
                <div className={styles.noticePreviewLink}>
                  <span className={styles.noticePreviewLinkLabel}>{linkLabel || '링크 바로가기'} →</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
