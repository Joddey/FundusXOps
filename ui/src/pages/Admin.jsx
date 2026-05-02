import { useState, useEffect } from 'react';
import {
  getUsers, createUser, toggleUserActive,
  getHitlStats, getRetrainLogs, approveRetrain, rejectRetrain,
  getRetrainStatus, compareModels, deployModel, compareOnImage,
} from '../services/api';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#0F172A', textSec: '#64748B', textHead: '#1E293B', textMuted: '#94A3B8',
  success: '#059669', successLight: '#ECFDF5',
  warning: '#D97706', warningLight: '#FFFBEB',
  danger: '#DC2626', dangerLight: '#FEF2F2',
  purple: '#7C3AED', purpleLight: '#F5F3FF',
};

const ODIR_LABELS = {
  N: 'Normal', D: 'Diyabetik Retinopati', G: 'Glokom',
  C: 'Katarakt', A: 'YMD', H: 'Hipertansif Ret.', M: 'Miyopi', O: 'Diğer',
};

const thStyle = {
  textAlign: 'left', padding: '8px 10px', fontSize: 11,
  color: C.textMuted, fontWeight: 600, letterSpacing: '0.05em',
  textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`,
};
const tdStyle = {
  padding: '10px', fontSize: 13, color: C.text,
  borderBottom: `1px solid #F1F5F9`,
};


// ── Kullanıcı Yönetimi ────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]     = useState([]);
  const [showForm, setForm]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [nu, setNu] = useState({
    email: '', password: '', full_name: '', role: 'doctor', specialty: '',
  });

  useEffect(() => { getUsers().then(setUsers).catch(console.error); }, []);

  const handleToggle = async (id) => {
    try {
      await toggleUserActive(id);
      setUsers(u => u.map(x => x.id === id ? { ...x, is_active: !x.is_active } : x));
    } catch {}
  };

  const handleCreate = async () => {
    setError(''); setLoading(true);
    try {
      const created = await createUser(nu);
      setUsers(u => [...u, created]);
      setForm(false);
      setNu({ email: '', password: '', full_name: '', role: 'doctor', specialty: '' });
    } catch (e) {
      setError(e.response?.data?.detail || 'Hata oluştu.');
    } finally { setLoading(false); }
  };

  const inp = {
    width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
    padding: '7px 10px', fontSize: 12, color: C.text, background: C.bg, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: C.textSec }}>
          {users.filter(u => u.is_active).length} aktif, {users.filter(u => !u.is_active).length} pasif
        </span>
        <button onClick={() => setForm(f => !f)} style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', border: `1px solid ${C.accent}`,
          background: C.accentLight, color: C.accent,
        }}>
          {showForm ? '✕ İptal' : '+ Kullanıcı Ekle'}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textHead }}>Yeni Kullanıcı</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, display: 'block', marginBottom: 3 }}>Ad Soyad</label>
              <input value={nu.full_name} onChange={e => setNu({ ...nu, full_name: e.target.value })} placeholder="Dr. Ad Soyad" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, display: 'block', marginBottom: 3 }}>E-posta</label>
              <input value={nu.email} onChange={e => setNu({ ...nu, email: e.target.value })} placeholder="dr@fundusxops.com" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, display: 'block', marginBottom: 3 }}>Şifre</label>
              <input type="password" value={nu.password} onChange={e => setNu({ ...nu, password: e.target.value })} placeholder="••••••••" style={inp}/>
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.textSec, display: 'block', marginBottom: 3 }}>Rol</label>
              <select value={nu.role} onChange={e => setNu({ ...nu, role: e.target.value })} style={inp}>
                <option value="doctor">Doktor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: C.textSec, display: 'block', marginBottom: 3 }}>Uzmanlık</label>
              <input value={nu.specialty} onChange={e => setNu({ ...nu, specialty: e.target.value })} placeholder="Göz Hastalıkları Uzmanı" style={inp}/>
            </div>
          </div>
          {error && (
            <div style={{ fontSize: 12, color: C.danger, background: C.dangerLight, padding: '6px 10px', borderRadius: 7 }}>
              {error}
            </div>
          )}
          <button onClick={handleCreate} disabled={!nu.email || !nu.password || !nu.full_name || loading}
            style={{ padding: '8px', borderRadius: 8, border: 'none', background: C.accent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? 'Oluşturuluyor…' : 'Kullanıcı Oluştur'}
          </button>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['Ad Soyad','E-posta','Rol','Uzmanlık','Durum','İşlem'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{ ...tdStyle, fontWeight: 500 }}>{u.full_name}</td>
              <td style={{ ...tdStyle, fontSize: 12, color: C.textSec }}>{u.email}</td>
              <td style={tdStyle}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: C.accentLight, color: C.accent, border: `1px solid ${C.accentMid}` }}>
                  {u.role === 'admin' ? 'Admin' : 'Doktor'}
                </span>
              </td>
              <td style={{ ...tdStyle, fontSize: 12, color: C.textSec }}>{u.specialty || '—'}</td>
              <td style={tdStyle}>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 20,
                  background: u.is_active ? C.successLight : C.dangerLight,
                  color: u.is_active ? C.success : C.danger,
                  border: `1px solid ${u.is_active ? '#A7F3D0' : '#FECACA'}`,
                }}>
                  {u.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </td>
              <td style={tdStyle}>
                <button onClick={() => handleToggle(u.id)} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${u.is_active ? '#FECACA' : '#A7F3D0'}`,
                  background: 'transparent', color: u.is_active ? C.danger : C.success,
                }}>
                  {u.is_active ? 'Pasife Al' : 'Etkinleştir'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ── HITL İstatistikleri ───────────────────────────────────────
function HITLTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => { getHitlStats().then(setStats).catch(console.error); }, []);
  if (!stats) return <div className="spinner" style={{ margin: '40px auto' }}/>;
  const corrMax = Math.max(1, ...Object.values(stats.odir_corrections));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Toplam Geri Bildirim', value: stats.total_feedbacks,  color: C.accent  },
          { label: 'ODIR Düzeltme',        value: stats.odir_total_wrong, color: C.warning },
          { label: 'DR Düzeltme',          value: stats.dr_total_wrong,   color: C.danger  },
        ].map(s => (
          <div key={s.label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textHead, marginBottom: 14 }}>
          ODIR Sınıf Bazında Düzeltme Sayısı
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {Object.entries(ODIR_LABELS).map(([k, label]) => {
            const v = stats.odir_corrections[k] || 0;
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: C.text, minWidth: 160, fontFamily: 'monospace' }}>
                  <strong>{k}</strong> — {label}
                </span>
                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: `hsl(${215 - v * 8},70%,50%)`, width: `${(v / corrMax) * 100}%`, transition: 'width 0.6s' }}/>
                </div>
                <span style={{ fontSize: 11, color: C.textSec, minWidth: 20, textAlign: 'right' }}>{v}</span>
              </div>
            );
          })}
        </div>
      </div>

      {stats.dr_corrections && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.textHead, marginBottom: 14 }}>
            DR Evre Bazında Düzeltme Sayısı
          </div>
          {['Hafif NPDR','Orta NPDR','Ağır NPDR','PDR'].map((g, i) => {
            const v = stats.dr_corrections[String(i)] || 0;
            const colors = ['#059669','#D97706','#EA580C','#DC2626'];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.text, minWidth: 100 }}>{g}</span>
                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: colors[i], width: `${(v / Math.max(1, stats.dr_total_wrong)) * 100}%`, transition: 'width 0.6s' }}/>
                </div>
                <span style={{ fontSize: 11, color: C.textSec, minWidth: 20, textAlign: 'right' }}>{v}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── Yeniden Eğitim ────────────────────────────────────────────
function RetrainTab() {
  const [logs, setLogs]           = useState([]);
  const [status, setStatus]       = useState(null);
  const [loading, setLoading]     = useState({});
  const [comparing, setComparing] = useState({});
  const [compareData, setCompareData] = useState({});
  const [liveFile, setLiveFile]   = useState({});
  const [liveResult, setLiveResult] = useState({});
  const [liveLoading, setLiveLoading] = useState({});

  const load = () => {
    Promise.all([getRetrainLogs(), getRetrainStatus()])
      .then(([l, s]) => { setLogs(l); setStatus(s); })
      .catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setLoading(l => ({ ...l, [id]: 'approve' }));
    try {
      await approveRetrain(id);
      setLogs(l => l.map(x => x.id === id ? { ...x, status: 'running' } : x));
      // 5 saniyede bir polling
      const interval = setInterval(async () => {
        const updated = await getRetrainLogs();
        const log = updated.find(x => x.id === id);
        if (log?.status === 'completed' || log?.status === 'failed') {
          setLogs(updated);
          load(); // status'u da güncelle
          clearInterval(interval);
        }
      }, 5000);
    } catch (e) {
      alert('Hata: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(l => ({ ...l, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setLoading(l => ({ ...l, [id]: 'reject' }));
    try {
      await rejectRetrain(id);
      load();
    } catch (e) {
      alert('Hata: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(l => ({ ...l, [id]: null }));
    }
  };

  const handleCompare = async (id) => {
    setComparing(c => ({ ...c, [id]: true }));
    try {
      const data = await compareModels(id);
      setCompareData(d => ({ ...d, [id]: data }));
    } catch (e) {
      alert('Karşılaştırma hatası: ' + (e.response?.data?.detail || e.message));
    } finally {
      setComparing(c => ({ ...c, [id]: false }));
    }
  };

  const handleDeploy = async (id) => {
    if (!window.confirm('Yeni modeli production\'a almak istediğinizden emin misiniz?')) return;
    setLoading(l => ({ ...l, [id]: 'deploy' }));
    try {
      await deployModel(id);
      load();
      alert('Model başarıyla deploy edildi!');
    } catch (e) {
      alert('Deploy hatası: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(l => ({ ...l, [id]: null }));
    }
  };

  const handleLiveCompare = async (id) => {
    if (!liveFile[id]) return;
    setLiveLoading(x => ({ ...x, [id]: true }));
    try {
      const data = await compareOnImage(id, liveFile[id]);
      setLiveResult(x => ({ ...x, [id]: data }));
    } catch (e) {
      alert('Hata: ' + (e.response?.data?.detail || e.message));
    } finally {
      setLiveLoading(x => ({ ...x, [id]: false }));
    }
  };

  const statusBadge = (s) => {
    const map = {
      pending:   { label: 'Onay Bekliyor', color: C.warning,  bg: C.warningLight },
      running:   { label: 'Eğitiliyor',    color: C.accent,   bg: C.accentLight  },
      completed: { label: 'Tamamlandı',    color: C.success,  bg: C.successLight },
      rejected:  { label: 'Reddedildi',    color: C.danger,   bg: C.dangerLight  },
      failed:    { label: 'Başarısız',     color: C.danger,   bg: C.dangerLight  },
      deployed:  { label: 'Deploy Edildi', color: C.purple,   bg: C.purpleLight  },
    };
    const m = map[s] || map.pending;
    return (
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: m.bg, color: m.color, border: `1px solid ${m.color}33` }}>
        {m.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Eşik durumu */}
      {status && (
        <>
          <div style={{ background: C.warningLight, border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: C.textSec }}>
            ⚠ Yeniden eğitim onayı gereklidir. Admin onaylamadan model eğitimi başlamaz.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { model: 'ODIR (Swin Transformer)',      count: status.odir_feedback_count, target: status.odir_threshold, needed: status.odir_retrain_needed },
              { model: 'DR Cascade (EfficientNet-B3)', count: status.dr_feedback_count,   target: status.dr_threshold,   needed: status.dr_retrain_needed   },
            ].map(r => {
              const pct = Math.min(100, (r.count / r.target) * 100);
              return (
                <div key={r.model} style={{ background: C.bg, border: `1px solid ${r.needed ? '#FDE68A' : C.border}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.textHead }}>{r.model}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: r.needed ? C.warningLight : C.accentLight, color: r.needed ? C.warning : C.accent, border: `1px solid ${r.needed ? '#FDE68A' : C.accentMid}` }}>
                      {r.needed ? '⚠ Eşik Aşıldı' : 'İzleniyor'}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: C.textSec }}>{r.count} / {r.target} düzeltme</span>
                      <span style={{ fontSize: 11, color: C.textMuted }}>{r.needed ? 'Eşik aşıldı' : `${r.target - r.count} kaldı`}</span>
                    </div>
                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: r.needed ? C.warning : C.accent, width: `${pct}%`, transition: 'width 0.7s' }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: C.textHead, marginTop: 4 }}>Retrain Geçmişi</div>

      {logs.length === 0 ? (
        <div style={{ fontSize: 12, color: C.textMuted, padding: '16px 0' }}>Henüz retrain logu yok.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textHead, textTransform: 'uppercase' }}>{log.model_type}</span>
                  <span style={{ fontSize: 11, color: C.textSec }}>{log.feedback_count} düzeltme</span>
                  {statusBadge(log.status)}
                </div>
                <span style={{ fontSize: 11, color: C.textMuted }}>{new Date(log.triggered_at).toLocaleString('tr-TR')}</span>
              </div>

              {log.mlflow_run_id && (
                <div style={{ fontSize: 11, color: C.accent, fontFamily: 'monospace' }}>MLflow: {log.mlflow_run_id}</div>
              )}

              {/* Pending */}
              {log.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleReject(log.id)} disabled={!!loading[log.id]}
                    style={{ flex: 1, padding: '7px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid #FECACA`, background: C.dangerLight, color: C.danger }}>
                    {loading[log.id] === 'reject' ? '…' : '✕ Reddet'}
                  </button>
                  <button onClick={() => handleApprove(log.id)} disabled={!!loading[log.id]}
                    style={{ flex: 2, padding: '7px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: C.warning, color: '#fff' }}>
                    {loading[log.id] === 'approve' ? '…' : '✓ Yeniden Eğitimi Onayla'}
                  </button>
                </div>
              )}

              {/* Running */}
              {log.status === 'running' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}/>
                  <span style={{ fontSize: 12, color: C.accent }}>Eğitim devam ediyor… (otomatik güncellenir)</span>
                </div>
              )}

              {/* Completed */}
              {log.status === 'completed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Test seti karşılaştırması */}
                  {!compareData[log.id] ? (
                    <button onClick={() => handleCompare(log.id)} disabled={comparing[log.id]}
                      style={{ padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${C.accentMid}`, background: C.accentLight, color: C.accent }}>
                      {comparing[log.id] ? '⏳ Karşılaştırılıyor…' : '📊 Test Seti ile Karşılaştır'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {/* Champion */}
                        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>🏆 Mevcut Model (Champion)</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: C.textHead }}>
                            {(compareData[log.id].current_model.metrics.accuracy * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: 11, color: C.textSec }}>Doğruluk</div>
                          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>Loss: {compareData[log.id].current_model.metrics.loss.toFixed(4)}</div>
                        </div>
                        {/* Challenger */}
                        <div style={{
                          background: '#fff',
                          border: `1px solid ${compareData[log.id].improvement.accuracy > 0 ? C.success : C.danger}`,
                          borderRadius: 8, padding: 12,
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>🚀 Yeni Model (Challenger)</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: compareData[log.id].improvement.accuracy > 0 ? C.success : C.danger }}>
                            {(compareData[log.id].new_model.metrics.accuracy * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: 11, color: C.textSec }}>Doğruluk</div>
                          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>Loss: {compareData[log.id].new_model.metrics.loss.toFixed(4)}</div>
                          <div style={{ fontSize: 11, marginTop: 6, fontWeight: 600, color: compareData[log.id].improvement.accuracy > 0 ? C.success : C.danger }}>
                            {compareData[log.id].improvement.accuracy > 0 ? '↑' : '↓'} {(Math.abs(compareData[log.id].improvement.accuracy) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Öneri */}
                      <div style={{
                        padding: '10px 14px', borderRadius: 8, fontSize: 12,
                        background: compareData[log.id].improvement.accuracy > 0 ? C.successLight : C.dangerLight,
                        color: compareData[log.id].improvement.accuracy > 0 ? C.success : C.danger,
                        border: `1px solid ${compareData[log.id].improvement.accuracy > 0 ? '#A7F3D0' : '#FECACA'}`,
                      }}>
                        {compareData[log.id].recommendation}
                      </div>

                      {/* Deploy */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setCompareData(d => ({ ...d, [log.id]: null }))}
                          style={{ flex: 1, padding: '8px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: `1px solid ${C.border}`, background: '#fff', color: C.textSec }}>
                          ← Geri
                        </button>
                        <button onClick={() => handleDeploy(log.id)} disabled={!!loading[log.id]}
                          style={{ flex: 2, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: C.purple, color: '#fff' }}>
                          {loading[log.id] === 'deploy' ? '…' : '🚀 Yeni Modeli Deploy Et'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Canlı görüntü karşılaştırması */}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textHead, marginBottom: 6 }}>
                      🖼 Canlı Görüntü Karşılaştırması
                    </div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
                      Fundus görüntüsü yükle — eski ve yeni model tahminlerini yan yana gör
                    </div>

                    <div onClick={() => document.getElementById(`lf-${log.id}`).click()}
                      style={{
                        border: `2px dashed ${liveFile[log.id] ? C.accentMid : C.border}`,
                        borderRadius: 8, padding: '12px', textAlign: 'center', cursor: 'pointer',
                        background: liveFile[log.id] ? C.accentLight : C.bg, transition: 'all 0.15s',
                      }}>
                      <input id={`lf-${log.id}`} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files[0]; if (f) setLiveFile(x => ({ ...x, [log.id]: f })); }}/>
                      {liveFile[log.id]
                        ? <span style={{ fontSize: 12, color: C.accent }}>📷 {liveFile[log.id].name}</span>
                        : <span style={{ fontSize: 12, color: C.textMuted }}>JPG veya PNG yükle</span>
                      }
                    </div>

                    {liveFile[log.id] && (
                      <button onClick={() => handleLiveCompare(log.id)} disabled={liveLoading[log.id]}
                        style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: C.accent, color: '#fff' }}>
                        {liveLoading[log.id] ? '⏳ Analiz ediliyor…' : '🔍 İki Modeli Karşılaştır'}
                      </button>
                    )}

                    {/* Canlı sonuç */}
                    {liveResult[log.id] && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {['current_model','new_model'].map(key => {
                            const m = liveResult[log.id][key];
                            const isNew = key === 'new_model';
                            return (
                              <div key={key} style={{ background: '#fff', border: `1px solid ${isNew ? C.accent : C.border}`, borderRadius: 8, padding: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: isNew ? C.accent : C.textMuted, marginBottom: 8 }}>
                                  {isNew ? '🚀 Yeni Model' : '🏆 Mevcut Model'}
                                </div>
                                {liveResult[log.id].model_type === 'odir' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {Object.entries(m.result.probs).map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: v.detected ? C.danger : C.textMuted, minWidth: 16 }}>{k}</span>
                                        <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                                          <div style={{ height: '100%', borderRadius: 2, background: v.detected ? C.danger : C.accent, width: `${v.prob * 100}%` }}/>
                                        </div>
                                        <span style={{ fontSize: 10, color: C.textSec, minWidth: 28, textAlign: 'right' }}>{(v.prob * 100).toFixed(0)}%</span>
                                      </div>
                                    ))}
                                    <div style={{ fontSize: 11, color: isNew ? C.accent : C.danger, fontWeight: 600, marginTop: 4 }}>
                                      Tespit: {m.result.detected.join(', ') || '—'}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: C.textHead }}>Evre {m.result.grade + 1}</div>
                                    <div style={{ fontSize: 12, color: C.textSec }}>{m.result.grade_label}</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <button onClick={() => { setLiveResult(x => ({ ...x, [log.id]: null })); setLiveFile(x => ({ ...x, [log.id]: null })); }}
                          style={{ padding: '6px', borderRadius: 7, fontSize: 11, cursor: 'pointer', border: `1px solid ${C.border}`, background: '#fff', color: C.textSec }}>
                          Temizle
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Deployed */}
              {log.status === 'deployed' && (
                <div style={{ padding: '8px 12px', borderRadius: 7, fontSize: 12, background: C.purpleLight, color: C.purple, border: `1px solid ${C.purple}33` }}>
                  ✓ Bu model production'da aktif olarak çalışıyor.
                </div>
              )}

              {/* Failed */}
              {log.status === 'failed' && (
                <div style={{ padding: '8px 12px', borderRadius: 7, fontSize: 12, background: C.dangerLight, color: C.danger, border: `1px solid #FECACA` }}>
                  ✕ Fine-tuning başarısız oldu. Uvicorn terminalini kontrol edin.
                </div>
              )}

              {/* Rejected */}
              {log.status === 'rejected' && (
                <div style={{ padding: '8px 12px', borderRadius: 7, fontSize: 12, background: C.bg, color: C.textMuted, border: `1px solid ${C.border}` }}>
                  Retrain reddedildi. Feedback sayacı sıfırlandı.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── MLflow Geçmişi ────────────────────────────────────────────
function MLflowTab() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    getRetrainLogs()
      .then(l => setLogs(l.filter(x => x.mlflow_run_id)))
      .catch(console.error);
  }, []);

  return (
    <div>
      {logs.length === 0 ? (
        <div style={{ fontSize: 12, color: C.textMuted, padding: '24px 0', textAlign: 'center' }}>
          Henüz MLflow kaydı yok. Retrain tamamlandıktan sonra burada görünecek.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['Run ID','Model','Tarih','Durum'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: C.accent }}>{log.mlflow_run_id}</td>
                <td style={{ ...tdStyle, fontWeight: 500, textTransform: 'uppercase', fontSize: 12 }}>{log.model_type}</td>
                <td style={{ ...tdStyle, fontSize: 11, color: C.textSec }}>{new Date(log.triggered_at).toLocaleString('tr-TR')}</td>
                <td style={tdStyle}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: C.successLight, color: C.success, border: '1px solid #A7F3D0' }}>
                    Tamamlandı
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


// ── Ana Admin Sayfası ─────────────────────────────────────────
export default function Admin({ onBack, onLogout }) {
  const [tab, setTab] = useState('users');

  const tabs = [
    { id: 'users',   label: 'Kullanıcı Yönetimi' },
    { id: 'hitl',    label: 'HITL İstatistikleri' },
    { id: 'retrain', label: 'Yeniden Eğitim' },
    { id: 'mlflow',  label: 'MLflow Geçmişi' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: C.bg }}>
      <header style={{
        height: 54, background: '#fff', borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {onBack && (
          <>
            <button onClick={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: 'none', color: C.textSec, fontSize: 13, cursor: 'pointer',
              padding: '4px 8px', borderRadius: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ← Doktor Paneli
            </button>
            <div style={{ width: 1, height: 20, background: C.border }}/>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent }}/>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.textHead }}>Yönetici Paneli</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: `1px solid ${C.border}`, borderRadius: 7, color: C.textSec,
            fontSize: 12, cursor: 'pointer', padding: '5px 10px',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M5 2H2v9h3M8.5 9l2.5-2.5L8.5 4M11 6.5H5" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Çıkış
          </button>
        </div>
      </header>

      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', padding: '0 20px', flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '12px 16px', border: 'none', background: 'transparent',
            borderBottom: `2px solid ${tab === t.id ? C.accent : 'transparent'}`,
            color: tab === t.id ? C.accent : C.textSec,
            fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {tab === 'users'   && <UsersTab/>}
          {tab === 'hitl'    && <HITLTab/>}
          {tab === 'retrain' && <RetrainTab/>}
          {tab === 'mlflow'  && <MLflowTab/>}
        </div>
      </main>
    </div>
  );
}