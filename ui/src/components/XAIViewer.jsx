import { useState } from 'react';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', text: '#0F172A', textSec: '#64748B',
  textHead: '#1E293B', textMuted: '#94A3B8',
  warning: '#D97706', warningLight: '#FFFBEB',
};

const BASE_URL = 'http://localhost:8000';

// ── Tam Ekran Modal ───────────────────────────────────────────
function ZoomModal({ src, label, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      {/* Başlık */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{label}</span>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'rgba(255,255,255,0.12)', border: 'none',
            color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Görüntü */}
      <img
        src={`${BASE_URL}${src}`}
        alt={label}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '88vw', maxHeight: '82vh',
          borderRadius: 14, objectFit: 'contain',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      />

      <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        Kapatmak için tıklayın veya ESC'ye basın
      </div>
    </div>
  );
}

// ── Görüntü Kutusu ────────────────────────────────────────────
function ImageBox({ label, sublabel, badge, badgeColor, src, fallback }) {
  const [zoomed, setZoomed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {zoomed && src && (
        <ZoomModal src={src} label={label} onClose={() => setZoomed(false)} />
      )}
      <div style={{
        background: '#fff', border: `1px solid ${C.border}`,
        borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textHead }}>{label}</span>
          {badge && (
            <span style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 700,
              background: badgeColor === 'blue' ? C.accentLight : C.warningLight,
              color: badgeColor === 'blue' ? C.accent : C.warning,
              border: `1px solid ${badgeColor === 'blue' ? C.accentMid : '#FDE68A'}`,
            }}>
              {badge}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{sublabel}</span>

        {/* Görüntü alanı */}
        <div
          onClick={() => src && setZoomed(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${C.border}`, background: '#0a0f1e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            cursor: src ? 'zoom-in' : 'default',
            transition: 'transform 0.15s, box-shadow 0.15s',
            transform: hovered && src ? 'scale(1.01)' : 'scale(1)',
            boxShadow: hovered && src ? '0 8px 24px rgba(0,0,0,0.18)' : 'none',
          }}
        >
          {src ? (
            <>
              <img
                src={`${BASE_URL}${src}`}
                alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
              {/* Zoom overlay */}
              {hovered && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.32)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="2"/>
                    <path d="M15 15l4 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M11 8v6M8 11h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Tam Ekran</span>
                </div>
              )}
            </>
          ) : (
            <FundusPlaceholder type={fallback} />
          )}
        </div>

        {/* Zoom butonu */}
        {src && (
          <button
            onClick={() => setZoomed(true)}
            style={{
              padding: '7px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: '#F8FAFC',
              color: C.textSec, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"
                stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Tam Ekranda Görüntüle
          </button>
        )}
      </div>
    </>
  );
}

// ── Placeholder SVG ───────────────────────────────────────────
function FundusPlaceholder({ type = 'orig' }) {
  const heatColors = {
    orig:     null,
    gradcam:  ['#dc2626','#ea580c','#f97316','#fbbf24'],
    scorecam: ['#dc2626','#db2777','#0ea5e9','#3b82f6'],
  };
  const colors = heatColors[type];

  return (
    <svg viewBox="0 0 420 420" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id={`rg-${type}`} cx="52%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7a3212"/>
          <stop offset="30%" stopColor="#5a2008"/>
          <stop offset="60%" stopColor="#2e0f04"/>
          <stop offset="100%" stopColor="#040101"/>
        </radialGradient>
        <clipPath id={`cp-${type}`}><circle cx="210" cy="210" r="196"/></clipPath>
        {colors && <filter id={`hb-${type}`}><feGaussianBlur stdDeviation="16"/></filter>}
      </defs>
      <rect width="420" height="420" fill="#06090f"/>
      <circle cx="210" cy="210" r="196" fill={`url(#rg-${type})`}/>
      <g clipPath={`url(#cp-${type})`} opacity="0.7">
        <path d="M258,200 C245,180 228,165 205,155 C180,144 155,136 122,127" stroke="#c04820" strokeWidth="2.8" fill="none"/>
        <path d="M258,200 C272,178 290,162 312,152" stroke="#c04820" strokeWidth="2.8" fill="none"/>
        <path d="M258,220 C248,240 230,258 208,270 C182,284 155,292 120,305" stroke="#c04820" strokeWidth="2.8" fill="none"/>
      </g>
      {colors && (
        <g clipPath={`url(#cp-${type})`} filter={`url(#hb-${type})`}>
          <circle cx="182" cy="200" r="42" fill={colors[0]} opacity="0.78"/>
          <circle cx="175" cy="192" r="32" fill={colors[1]} opacity="0.68"/>
          <circle cx="215" cy="228" r="34" fill={colors[2]} opacity="0.55"/>
          <circle cx="290" cy="175" r="28" fill={colors[3]} opacity="0.32"/>
        </g>
      )}
      <circle cx="258" cy="210" r="28" fill="#f0bf40" opacity="0.9" clipPath={`url(#cp-${type})`}/>
      <circle cx="258" cy="210" r="18" fill="#ffe070" clipPath={`url(#cp-${type})`}/>
      <circle cx="158" cy="210" r="7" fill="#000" opacity="0.4" clipPath={`url(#cp-${type})`}/>
    </svg>
  );
}

// ── Ana Export ────────────────────────────────────────────────
export default function XAIViewer({ xaiPaths, activeClass }) {
  const orig      = xaiPaths?.original || null;
  const gradcams  = xaiPaths?.gradcam  || [];
  const scorecams = xaiPaths?.scorecam || [];

  const gradcamSrc  = gradcams.find(p => p.includes(activeClass))  || gradcams[0]  || null;
  const scorecamSrc = scorecams.find(p => p.includes(activeClass)) || scorecams[0] || null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
      <ImageBox
        label="Orijinal Görüntü"
        sublabel="Ham fundus fotoğrafı"
        src={orig}
        fallback="orig"
      />
      <ImageBox
        label="GradCAM++ Analizi"
        sublabel="Gradient tabanlı aktivasyon"
        badge="Gradient Tabanlı"
        badgeColor="orange"
        src={gradcamSrc}
        fallback="gradcam"
      />
      <ImageBox
        label="ScoreCAM Analizi"
        sublabel="Gradient-free aktivasyon"
        badge="Önerilen"
        badgeColor="blue"
        src={scorecamSrc}
        fallback="scorecam"
      />
    </div>
  );
}
