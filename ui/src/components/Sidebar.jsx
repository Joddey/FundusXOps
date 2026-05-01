import { useState } from 'react';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', text: '#0F172A', textSec: '#64748B',
  textHead: '#1E293B', textMuted: '#94A3B8',
  danger: '#DC2626', success: '#059669',
};

function PatientCard({ req, selected, onClick }) {
  const urgent = req.priority === 'urgent';
  const patient = req.patient;

  return (
    <div
      onClick={onClick}
      className="card-hover"
      style={{
        padding: '14px 14px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
        border: `1px solid ${selected ? C.accentMid : C.border}`,
        background: selected ? C.accentLight : '#fff',
        borderLeft: `4px solid ${selected ? C.accent : 'transparent'}`,
        transition: 'all 0.15s',
        boxShadow: selected ? '0 2px 8px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.textHead }}>
          {patient?.full_name || '—'}
        </span>
        <span style={{
          fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 700,
          background: urgent ? '#FEF2F2' : '#EFF6FF',
          color: urgent ? C.danger : C.accent,
          border: `1px solid ${urgent ? '#FECACA' : C.accentMid}`,
        }}>
          {urgent ? 'Acil' : 'Normal'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textMuted, fontFamily: 'monospace', fontWeight: 600 }}>
          {patient?.patient_code}
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {new Date(req.requested_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <span style={{
        fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 500,
        background: '#F8FAFC', border: `1px solid ${C.border}`, color: C.textSec,
      }}>
        ODIR Tarama
      </span>
    </div>
  );
}

export default function Sidebar({ pending, analyzed, selectedId, onSelect, user, onLogout }) {
  const [tab, setTab]       = useState('pending');
  const [search, setSearch] = useState('');

  const list     = tab === 'pending' ? pending : analyzed;
  const filtered = list.filter(req => {
    const name = req.patient?.full_name?.toLowerCase() || '';
    const code = req.patient?.patient_code?.toLowerCase() || '';
    const q    = search.toLowerCase();
    return name.includes(q) || code.includes(q);
  });

  const initials = user?.full_name
    ?.split(' ')
    .filter(w => w.startsWith('Dr') === false)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR';

  return (
    <aside style={{
      width: 300, background: '#fff', borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 16px', borderBottom: `1px solid #F1F5F9`,
        display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: 'linear-gradient(135deg,#2563EB,#0EA5E9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
        }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.4"/>
            <circle cx="8" cy="8" r="2.5" fill="white"/>
            <line x1="8" y1="1.5" x2="8" y2="0" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="8" y1="16" x2="8" y2="14.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="0" y1="8" x2="1.5" y2="8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="14.5" y1="8" x2="16" y2="8" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textHead, letterSpacing: '-0.02em' }}>
            Fundus<span style={{ color: C.accent }}>XOps</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>Oftalmoloji AI Tanı</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '12px 14px 0', gap: 6, flexShrink: 0 }}>
        {[
          { id: 'pending',  label: 'Bekleyen', count: pending.length },
          { id: 'analyzed', label: 'Geçmiş',   count: analyzed.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px', borderRadius: 9, border: 'none',
              background: tab === t.id ? C.accentLight : 'transparent',
              color: tab === t.id ? C.accent : C.textSec,
              fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
              background: tab === t.id ? C.accentMid : '#F1F5F9',
              color: tab === t.id ? C.accent : C.textMuted,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 14px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            width="14" height="14" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="#94A3B8" strokeWidth="1.2"/>
            <line x1="8" y1="8" x2="11" y2="11" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hasta ara…"
            style={{
              width: '100%', background: '#F8FAFC', border: `1px solid ${C.border}`,
              borderRadius: 9, padding: '8px 10px 8px 30px',
              color: C.textSec, fontSize: 13, outline: 'none', fontWeight: 500,
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
            {search ? 'Sonuç bulunamadı' : 'Vaka yok'}
          </div>
        ) : (
          filtered.map(req => (
            <PatientCard
              key={req.id}
              req={req}
              selected={selectedId === req.id}
              onClick={() => onSelect(req)}
            />
          ))
        )}
      </div>

      {/* Doctor info */}
      <div style={{
        padding: '14px 14px', borderTop: '1px solid #F1F5F9',
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#2563EB,#0EA5E9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#fff',
          boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: C.textHead,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user?.full_name}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{user?.specialty || user?.role}</div>
        </div>
        <button
          onClick={onLogout}
          title="Çıkış"
          style={{
            width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
            background: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
            <path d="M5 2H2v9h3M8.5 9l2.5-2.5L8.5 4M11 6.5H5"
              stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
