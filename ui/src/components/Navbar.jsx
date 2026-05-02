import { useState, useEffect, useRef } from 'react';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', text: '#0F172A', textMuted: '#94A3B8', textHead: '#1E293B',
  danger: '#DC2626', warning: '#D97706', success: '#059669',
};

export default function Navbar({ patient, onUpload, onAdmin, isAdmin, retrainNeeded, lastAnalyzed }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([
    { id: 1, text: 'Sistem çevrimiçi', time: 'Şimdi', dot: C.success, read: true },
  ]);
  const ref = useRef(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Retrain bildirimi ekle
  useEffect(() => {
    setNotifs(prev => {
      const filtered = prev.filter(n => !n.id.toString().startsWith('rt'));
      const extras = [];
      if (retrainNeeded?.odir) extras.push({ id: 'rt-odir', text: 'ODIR modeli retrain eşiğine ulaştı', time: 'Az önce', dot: C.warning, read: false });
      if (retrainNeeded?.dr)   extras.push({ id: 'rt-dr',   text: 'DR modeli retrain eşiğine ulaştı',   time: 'Az önce', dot: C.warning, read: false });
      return [...extras, ...filtered];
    });
  }, [retrainNeeded?.odir, retrainNeeded?.dr]);

  // Analiz tamamlandı bildirimi
  useEffect(() => {
    if (!lastAnalyzed) return;
    setNotifs(prev => [{
      id: `an-${Date.now()}`,
      text: `Analiz tamamlandı: ${lastAnalyzed}`,
      time: 'Az önce',
      dot: C.success,
      read: false,
    }, ...prev.slice(0, 9)]);
  }, [lastAnalyzed]);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header style={{
      height: 60, background: '#fff', borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
      flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 100, position: 'relative',
    }}>

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>Hasta Analizi</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{
          fontSize: 14, fontWeight: 700, color: C.textHead,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {patient?.patient?.full_name || '—'}
        </span>
        {patient?.patient?.patient_code && (
          <span style={{
            fontSize: 12, color: C.textMuted, background: '#F8FAFC',
            border: `1px solid ${C.border}`, padding: '3px 9px',
            borderRadius: 6, fontFamily: 'monospace', flexShrink: 0, fontWeight: 600,
          }}>
            {patient.patient.patient_code}
          </span>
        )}
      </nav>

      {/* Sağ butonlar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Admin butonu */}
        {isAdmin && (
          <button onClick={onAdmin} title="Admin Paneli" style={{
            height: 38, padding: '0 14px', borderRadius: 9,
            border: `1px solid ${C.border}`, background: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 13, fontWeight: 600, color: C.textMuted,
            transition: 'all 0.15s',
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="2" stroke="#64748B" strokeWidth="1.3"/>
              <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.1 1.1M11 11l1.1 1.1M2.9 12.1L4 11M11 4l1.1-1.1"
                stroke="#64748B" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Admin
          </button>
        )}

        {/* Upload butonu */}
        <button onClick={onUpload} style={{
          height: 38, display: 'flex', alignItems: 'center', gap: 7,
          padding: '0 18px', borderRadius: 9, border: 'none',
          background: `linear-gradient(135deg, ${C.accent}, #0EA5E9)`,
          color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(37,99,235,0.35)', flexShrink: 0,
          transition: 'all 0.15s',
        }}>
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v8M3.5 4l3-3 3 3M1 10v1.5a.5.5 0 00.5.5h10a.5.5 0 00.5-.5V10"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Yeni Vaka Yükle
        </button>

        {/* Bildirim */}
        <div ref={ref} style={{ position: 'relative' }}>
          <button onClick={() => { setNotifOpen(o => !o); if (!notifOpen) markAllRead(); }} style={{
            width: 38, height: 38, borderRadius: 9, border: `1px solid ${C.border}`,
            background: notifOpen ? C.accentLight : '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'all 0.15s',
          }}>
            <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5a4.5 4.5 0 00-4.5 4.5v2.5L2 10h12l-1.5-1.5V6A4.5 4.5 0 008 1.5zM6.5 12a1.5 1.5 0 003 0"
                stroke={notifOpen ? C.accent : '#64748B'} strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                minWidth: 16, height: 16, borderRadius: 8,
                background: C.danger, border: '2px solid #fff',
                fontSize: 9, fontWeight: 800, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
              }}>
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="fade-up" style={{
              position: 'absolute', top: 46, right: 0, width: 320,
              background: '#fff', border: `1px solid ${C.border}`,
              borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {/* Başlık */}
              <div style={{
                padding: '14px 16px', borderBottom: `1px solid #F1F5F9`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#FAFBFF',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.textHead }}>Bildirimler</span>
                {unread > 0 && (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 10,
                    background: C.accentLight, color: C.accent, fontWeight: 700,
                  }}>
                    {unread} yeni
                  </span>
                )}
              </div>

              {/* Liste */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: C.textMuted }}>
                    Bildirim yok
                  </div>
                ) : notifs.map((n, i) => (
                  <div key={n.id} style={{
                    padding: '12px 16px',
                    borderBottom: i < notifs.length - 1 ? `1px solid #F8FAFC` : 'none',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: n.read ? '#fff' : '#FAFBFF',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: n.dot, marginTop: 5, flexShrink: 0,
                      boxShadow: `0 0 0 3px ${n.dot}22`,
                    }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
