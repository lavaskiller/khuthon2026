import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { api } from '@/services/api';
import type { ContentType } from '@/types';
import styles from './CreatorPages.module.css';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'movie', label: '영화' },
  { value: 'drama', label: '드라마' },
  { value: 'book', label: '책' },
  { value: 'performance', label: '공연' },
];

export default function UploadPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const teaserInputRef = useRef<HTMLInputElement>(null);
  const mvpInputRef = useRef<HTMLInputElement>(null);

  const [teaserFile, setTeaserFile] = useState<File | null>(null);
  const [mvpFile, setMvpFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<ContentType>('movie');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function handleTeaserFile(f: File) {
    if (!['video/mp4', 'video/quicktime'].includes(f.type)) {
      setError('mp4, mov 형식만 지원됩니다');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError('티저는 최대 100MB까지 업로드 가능합니다');
      return;
    }
    setError('');
    setTeaserFile(f);
  }

  function handleMvpFile(f: File) {
    setError('');
    setMvpFile(f);
  }

  async function handleUpload() {
    if (!teaserFile || !mvpFile || !token) return;
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      // 백엔드 필드명: teaser_file, mvp_file, content_type
      fd.append('teaser_file', teaserFile);
      fd.append('mvp_file', mvpFile);
      fd.append('content_type', contentType.toUpperCase());
      const interval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 200);
      const res = await api.creator.uploadTeaser(token, fd);
      clearInterval(interval);
      setProgress(100);
      navigate(`/creator/upload/info?contentId=${res.contentId}`);
    } catch {
      setError('업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.uploadPageWrap}>
      <button className={styles.backBtn} onClick={() => navigate('/creator/contents')}>← 업로드 컨텐츠</button>
      <h1 className={styles.pageTitle}>티저 업로드</h1>
      <p className={styles.pageDesc}>
        VEIL은 작품을 사전 정보 없이 보여주는 플랫폼입니다. 티저 영상에 로고, 워터마크, 창작자 이름 등 정체를 드러내는 시각 요소가 포함되면 심사에서 반려될 수 있습니다.
      </p>

      <div className={styles.uploadForm}>
        {error && <p className={styles.errorMsg}>{error}</p>}

        <div>
          <p className={styles.inputLabel}>티저 영상 *</p>
          <div
            className={styles.uploadZone}
            onClick={() => teaserInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleTeaserFile(f); }}
          >
            {teaserFile ? (
              <span>{teaserFile.name} ({(teaserFile.size / 1024 / 1024).toFixed(1)}MB)</span>
            ) : (
              <span>클릭하거나 드래그하여 티저 업로드<br /><small>mp4, mov · 최대 100MB</small></span>
            )}
          </div>
          <input ref={teaserInputRef} type="file" accept="video/mp4,video/quicktime" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleTeaserFile(f); }} />
        </div>

        <div>
          <p className={styles.inputLabel}>본편 파일 * <small style={{ fontWeight: 400 }}>(심사용, 소비자에게 미공개)</small></p>
          <div
            className={styles.uploadZone}
            onClick={() => mvpInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleMvpFile(f); }}
          >
            {mvpFile ? (
              <span>{mvpFile.name} ({(mvpFile.size / 1024 / 1024).toFixed(1)}MB)</span>
            ) : (
              <span>클릭하거나 드래그하여 본편 업로드<br /><small>mp4, mov 등</small></span>
            )}
          </div>
          <input ref={mvpInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleMvpFile(f); }} />
        </div>

        <div>
          <p className={styles.inputLabel}>콘텐츠 종류</p>
          <div className={styles.chipGroup}>
            {CONTENT_TYPES.map(({ value, label }) => (
              <button key={value} className={`${styles.chip} ${contentType === value ? styles.selected : ''}`} onClick={() => setContentType(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {uploading && (
          <div className={styles.uploadProgress}>
            <span className={styles.pageDesc}>{progress}%</span>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        <button className={styles.submitBtn} disabled={!teaserFile || !mvpFile || uploading} onClick={handleUpload}>
          {uploading ? '업로드 중...' : '다음 단계 (정보 입력)'}
        </button>
      </div>
    </div>
  );
}
