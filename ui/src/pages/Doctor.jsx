import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import XAIViewer from '../components/XAIViewer';
import HITLFeedback from '../components/HITLFeedback';
import UploadModal from '../components/UploadModal';
import {
  getPending, getAnalyzed, analyzeRequest,
  getResult, getXaiPaths, getRetrainStatus, deleteRequest,
} from '../services/api';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', bg: '#F1F5F9', card: '#FFFFFF',
  text: '#0F172A', textSec: '#64748B', textHead: '#1E293B', textMuted: '#94A3B8',
  success: '#059669', successLight: '#ECFDF5',
  warning: '#D97706', warningLight: '#FFFBEB',
  danger: '#DC2626', dangerLight: '#FEF2F2',
};

const DR_GRADE_LABELS = ['Hafif NPDR', 'Orta NPDR', 'Ağır NPDR', 'PDR'];
const DR_GRADE_COLORS = ['#059669', '#D97706', '#EA580C', '#DC2626'];
const ODIR_LABELS = {
  N: 'Normal', D: 'Diyabetik Retinopati', G: 'Glokom',
  C: 'Katarakt', A: 'Yaşa Bağlı Makula Dejenerasyonu',
  H: 'Hipertansif Retinopati', M: 'Miyopi', O: 'Diğer Hastalık',
};

// ── Patient Info Bar ──────────────────────────────────────────
function PatientInfoBar({ req }) {
  const p = req.patient;
  const age = p?.birth_year ? new Date().getFullYear() - p.birth_year : null;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: '18px 24px', display: 'flex', alignItems: 'center',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap', gap: 0,
    }}>
      <div style={{ paddingRight: 24, marginRight: 24, borderRight: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontWeight: 600 }}>Hasta</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.textHead }}>{p?.full_name}</div>
      </div>
      {[
        { label: 'Kod',           value: p?.patient_code,                         mono: true },
        { label: 'Yaş',           value: age ? `${age}` : '—' },
        { label: 'Cinsiyet',      value: p?.gender || '—' },
        { label: 'Diyabet',       value: p?.diabetes_hx ? 'Var' : 'Yok',         color: p?.diabetes_hx ? C.warning : C.success },
        { label: 'Hipertansiyon', value: p?.hypertension_hx ? 'Var' : 'Yok',     color: p?.hypertension_hx ? C.warning : C.success },
        { label: 'Kaynak',        value: req.source_label || req.source },
        { label: 'Tarih',         value: new Date(req.requested_at).toLocaleDateString('tr-TR') },
      ].map((f, i, arr) => (
        <div key={f.label} style={{
          paddingRight: i < arr.length - 1 ? 24 : 0,
          marginRight:  i < arr.length - 1 ? 24 : 0,
          borderRight:  i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontWeight: 600 }}>{f.label}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: f.color || C.textHead, fontFamily: f.mono ? 'monospace' : 'inherit' }}>
            {f.value}
          </div>
        </div>
      ))}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: req.status === 'analyzed' ? C.success : C.warning }}/>
        <span style={{ fontSize: 13, fontWeight: 600, color: req.status === 'analyzed' ? C.success : C.warning }}>
          {req.status === 'analyzed' ? 'Analiz Hazır' : 'Bekliyor'}
        </span>
      </div>
    </div>
  );
}

// ── ODIR Results Panel ────────────────────────────────────────
function ODIRPanel({ probs, predictions }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, [probs]);

  if (!probs) return null;

  const detected = Object.entries(predictions || {})
    .filter(([, v]) => v).map(([k]) => k);

  const barColor = v => v >= 60 ? C.danger : v >= 30 ? C.warning : C.success;
  const barBg    = v => v >= 60 ? C.dangerLight : v >= 30 ? C.warningLight : C.successLight;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textHead }}>ODIR Oküler Hastalık Tespiti</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, fontWeight: 500 }}>Swin Transformer · 8 Sınıf</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.textMuted, fontWeight: 500 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.success }}/>
          Optimal Eşik
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(ODIR_LABELS).map(([key, label]) => {
          const val   = Math.round((probs[key] || 0) * 100);
          const color = barColor(val);
          const bg    = barBg(val);
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>
                  <span style={{ fontWeight: 800, color: C.text, fontFamily: 'monospace' }}>{key}</span>
                  {' — '}{label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color, background: bg, padding: '2px 9px', borderRadius: 10 }}>
                  {val}%
                </span>
              </div>
              <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, background: color,
                  width: animated ? `${val}%` : '0%',
                  transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                }}/>
              </div>
            </div>
          );
        })}
      </div>

      {detected.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Tespit Edilen
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {detected.map(k => {
              const val   = Math.round((probs[k] || 0) * 100);
              const color = barColor(val);
              const bg    = barBg(val);
              return (
                <span key={k} style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 20,
                  background: bg, color, border: `1px solid ${color}33`,
                }}>
                  {k} — {ODIR_LABELS[k]}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DR Results Panel ──────────────────────────────────────────
function DRPanel({ result }) {
  const { dr_binary_flag, dr_grade, dr_grade_probs, dr_grade_label, dr_binary_prob } = result;
  const color = dr_binary_flag && dr_grade !== null ? DR_GRADE_COLORS[dr_grade] : C.success;

  const r = 46, circ = 2 * Math.PI * r;
  const prob = dr_grade !== null && dr_grade_probs
    ? parseFloat(dr_grade_probs[String(dr_grade)] || 0)
    : (1 - (dr_binary_prob || 0));

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: 24, display: 'flex', flexDirection: 'column', gap: 16, height: '100%',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.textHead }}>DR Evreleme (EfficientNet-B3)</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3, fontWeight: 500 }}>Cascade sınıflandırma</div>
        </div>
      </div>

      <div style={{
        padding: 14, borderRadius: 12,
        background: dr_binary_flag ? C.dangerLight : C.successLight,
        border: `1px solid ${dr_binary_flag ? '#FECACA' : '#A7F3D0'}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }}/>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color }}>
            {dr_binary_flag ? 'DR Tespit Edildi' : 'DR Tespit Edilmedi'}
          </div>
          {dr_binary_flag && (
            <div style={{ fontSize: 13, color: C.textSec, marginTop: 3, fontWeight: 500 }}>
              {dr_grade_label}
            </div>
          )}
        </div>
      </div>

      {dr_binary_flag && dr_grade !== null && dr_grade_probs && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="110" height="110" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
            <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth="10"/>
            <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${prob * circ} ${circ}`}
              strokeDashoffset={circ * 0.25} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.9s ease' }}/>
            <text x="60" y="56" textAnchor="middle" fontSize="17" fontWeight="800"
              fill={C.textHead} fontFamily="Inter,sans-serif">
              {Math.round(prob * 100)}%
            </text>
            <text x="60" y="71" textAnchor="middle" fontSize="9"
              fill={C.textMuted} fontFamily="Inter,sans-serif">olasılık</text>
          </svg>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {DR_GRADE_LABELS.map((g, i) => {
              const p = Math.round(parseFloat(dr_grade_probs[String(i)] || 0) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{
                    fontSize: 12, minWidth: 88, fontWeight: i === dr_grade ? 800 : 500,
                    color: i === dr_grade ? DR_GRADE_COLORS[i] : C.textMuted,
                  }}>{g}</span>
                  <div style={{ flex: 1, height: 7, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: DR_GRADE_COLORS[i],
                      width: `${p}%`, borderRadius: 4,
                      opacity: i === dr_grade ? 1 : 0.4,
                      transition: 'width 0.8s ease',
                    }}/>
                  </div>
                  <span style={{
                    fontSize: 11, minWidth: 30, textAlign: 'right',
                    fontWeight: i === dr_grade ? 700 : 500,
                    color: i === dr_grade ? DR_GRADE_COLORS[i] : C.textMuted,
                  }}>{p}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dr_binary_flag && (
        <div>
          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, fontWeight: 600 }}>Evre Şiddet Skalası</div>
          <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden' }}>
            {DR_GRADE_COLORS.map((col, i) => (
              <div key={i} style={{
                flex: 1, background: col,
                opacity: dr_grade === i ? 1 : 0.25,
                transition: 'opacity 0.4s',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {DR_GRADE_LABELS.map((g, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: i === dr_grade ? 700 : 500,
                color: i === dr_grade ? DR_GRADE_COLORS[i] : C.textMuted,
              }}>{g}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DR Banner ─────────────────────────────────────────────────
function DRBanner({ confidence, onGrade, onSkip }) {
  return (
    <div style={{
      background: C.accentLight, border: `1px solid ${C.accentMid}`,
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.accent, flexShrink: 0 }}/>
        <span style={{ fontSize: 14, color: C.textHead, fontWeight: 500 }}>
          <strong>Diyabetik Retinopati tespit edildi</strong>
          {' '}(%{Math.round(confidence * 100)} güven).
          {' '}DR evrelemesi yapmak ister misiniz?
        </span>
      </div>
      <div style={{ display: 'flex', gap: 9, flexShrink: 0 }}>
        <button onClick={onSkip} style={{
          padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
          background: C.card, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          Şimdilik Geç
        </button>
        <button onClick={onGrade} style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: C.accent, color: '#fff', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
        }}>
          Evreleme Yap
        </button>
      </div>
    </div>
  );
}

// ── Analyze Button ────────────────────────────────────────────
function AnalyzeButton({ onClick, loading }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '56px 0',
    }}>
      {loading ? (
        <>
          <div className="spinner"/>
          <div style={{ fontSize: 15, color: C.textSec, fontWeight: 600 }}>
            Model çalışıyor…
          </div>
          <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
            GradCAM++ ve ScoreCAM üretiliyor
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, color: C.textSec, textAlign: 'center', fontWeight: 500 }}>
            Bu vaka henüz analiz edilmemiş.
          </div>
          <button onClick={onClick} style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: C.accent, color: '#fff', fontSize: 15,
            fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
          }}>
            Analiz Et
          </button>
        </>
      )}
    </div>
  );
}

// ── Delete Button ─────────────────────────────────────────────
function DeleteButton({ onClick }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>Emin misiniz?</span>
      <button onClick={onClick} style={{
        padding: '5px 12px', borderRadius: 7, border: `1px solid ${C.danger}`,
        background: C.dangerLight, color: C.danger, fontSize: 13, cursor: 'pointer', fontWeight: 600,
      }}>Evet, Sil</button>
      <button onClick={() => setConfirm(false)} style={{
        padding: '5px 12px', borderRadius: 7, border: `1px solid ${C.border}`,
        background: '#fff', color: C.textSec, fontSize: 13, cursor: 'pointer', fontWeight: 500,
      }}>İptal</button>
    </div>
  ) : (
    <button onClick={() => setConfirm(true)} style={{
      padding: '6px 14px', borderRadius: 7, border: `1px solid ${C.border}`,
      background: '#fff', color: C.textSec, fontSize: 12, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
    }}>
      <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
        <path d="M1 2.5h9M4 2.5V1.5h3v1M2 2.5l.5 7h6l.5-7" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
      Vakayı Sil
    </button>
  );
}

// ── Ana Sayfa ─────────────────────────────────────────────────
export default function Doctor({ user, onLogout, onAdmin, isAdmin }) {
  const [pending,      setPending]  = useState([]);
  const [analyzed,     setAnalyzed] = useState([]);
  const [selected,     setSelected] = useState(null);
  const [result,       setResult]   = useState(null);
  const [xai,          setXai]      = useState(null);
  const [analyzing,    setAnalyzing]= useState(false);
  const [drState,      setDrState]  = useState({});
  const [drResult,     setDrResult] = useState({});
  const [showUpload,   setUpload]   = useState(false);
  const [retrainNeeded,setRetrain]  = useState({ odir: false, dr: false });
  const [activeClass,  setActive]   = useState(null);

  const loadLists = useCallback(async () => {
    const [p, a] = await Promise.all([getPending(), getAnalyzed()]);
    setPending(p);
    setAnalyzed(a);
  }, []);

  const loadRetrain = useCallback(async () => {
    try {
      const s = await getRetrainStatus();
      setRetrain({ odir: s.odir_retrain_needed, dr: s.dr_retrain_needed });
    } catch {}
  }, []);

  useEffect(() => {
    loadLists();
    loadRetrain();
  }, [loadLists, loadRetrain]);

  const handleSelect = async (req) => {
    setSelected(req);
    setResult(null);
    setXai(null);
    setDrState(s => ({ ...s }));
    setActive(null);

    if (req.status === 'analyzed') {
      try {
        const [res, xaiData] = await Promise.all([
          getResult(req.id),
          getXaiPaths(req.id),
        ]);
        setResult(res);
        setXai(xaiData);
        if (res.odir_predictions) {
          const first = Object.entries(res.odir_predictions).find(([, v]) => v)?.[0];
          setActive(first || null);
        }
      } catch {}
    }
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res     = await analyzeRequest(selected.id);
      setResult(res);
      const xaiData = await getXaiPaths(selected.id);
      setXai(xaiData);
      if (res.odir_predictions) {
        const first = Object.entries(res.odir_predictions).find(([, v]) => v)?.[0];
        setActive(first || null);
      }
      setSelected({ ...selected, status: 'analyzed' });
      loadLists();
      loadRetrain();
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGrade = async () => {
    if (!selected || !result) return;
    setDrState(s => ({ ...s, [selected.id]: 'loading' }));
    setTimeout(() => {
      setDrState(s => ({ ...s, [selected.id]: 'done' }));
    }, 1200);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteRequest(selected.id);
      setSelected(null);
      setResult(null);
      setXai(null);
      loadLists();
    } catch (e) {
      console.error(e);
    }
  };

  const dProb          = result?.odir_probs?.D || 0;
  const dDetected      = result?.odir_predictions?.D || false;
  const isManualDR     = selected?.source === 'manual_upload' && result && !dDetected;
  const currentDrState = selected
    ? (drState[selected.id] || (result?.dr_binary_flag ? 'done' : (dDetected ? 'banner' : (isManualDR ? 'done' : 'none'))))
    : 'none';
  const hasDR = currentDrState === 'done';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar
        patient={selected}
        onUpload={() => setUpload(true)}
        onAdmin={onAdmin}
        isAdmin={isAdmin}
        retrainNeeded={retrainNeeded}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar
          pending={pending}
          analyzed={analyzed}
          selectedId={selected?.id}
          onSelect={handleSelect}
          user={user}
          onLogout={onLogout}
        />

        <main style={{
          flex: 1, overflowY: 'auto', padding: 22,
          display: 'flex', flexDirection: 'column', gap: 16,
          background: C.bg,
        }}>

          {!selected ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', flexDirection: 'column', gap: 14,
            }}>
              <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="#E2E8F0" strokeWidth="2"/>
                <circle cx="24" cy="24" r="10" stroke="#CBD5E1" strokeWidth="2"/>
                <circle cx="24" cy="24" r="3" fill="#CBD5E1"/>
              </svg>
              <div style={{ fontSize: 16, color: C.textMuted, fontWeight: 600 }}>
                Sol panelden bir hasta seçin
              </div>
            </div>
          ) : (
            <>
              {/* Hasta bilgi barı */}
              <div className="fade-up">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span/>
                  <DeleteButton onClick={handleDelete}/>
                </div>
                <PatientInfoBar req={selected}/>
              </div>

              {/* Analiz yoksa */}
              {!result && (
                <div className="fade-up" style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: 24,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <AnalyzeButton onClick={handleAnalyze} loading={analyzing}/>
                </div>
              )}

              {/* Analiz varsa */}
              {result && (
                <>
                  {/* XAI Görüntüler */}
                  <div className="fade-up">
                    {result.odir_predictions && (
                      <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
                        {Object.entries(result.odir_predictions)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <button key={k} onClick={() => setActive(k)} style={{
                              padding: '5px 13px', borderRadius: 20, fontSize: 12,
                              fontWeight: 700, cursor: 'pointer', border: '1px solid',
                              borderColor: activeClass === k ? C.accent : C.border,
                              background:  activeClass === k ? C.accentLight : '#fff',
                              color:       activeClass === k ? C.accent : C.textSec,
                            }}>
                              {k} — {ODIR_LABELS[k]}
                            </button>
                          ))}
                        {result.dr_binary_flag && (
                          <button onClick={() => setActive('dr')} style={{
                            padding: '5px 13px', borderRadius: 20, fontSize: 12,
                            fontWeight: 700, cursor: 'pointer', border: '1px solid',
                            borderColor: activeClass === 'dr' ? C.danger : C.border,
                            background:  activeClass === 'dr' ? C.dangerLight : '#fff',
                            color:       activeClass === 'dr' ? C.danger : C.textSec,
                          }}>
                            DR — Evreleme
                          </button>
                        )}
                      </div>
                    )}
                    <XAIViewer xaiPaths={xai} activeClass={activeClass}/>
                  </div>

                  {/* ODIR + DR paneller */}
                  <div className="fade-up" style={{
                    display: 'grid',
                    gridTemplateColumns: currentDrState === 'done' ? '1fr 1fr' : '1fr',
                    gap: 16, alignItems: 'start',
                  }}>
                    <ODIRPanel probs={result.odir_probs} predictions={result.odir_predictions}/>
                    {currentDrState === 'loading' && (
                      <div style={{
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 14, padding: 36,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 16, minHeight: 260,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      }}>
                        <div className="spinner"/>
                        <div style={{ fontSize: 14, color: C.textSec, fontWeight: 600 }}>
                          EfficientNet-B3 çalışıyor…
                        </div>
                      </div>
                    )}
                    {currentDrState === 'done' && result && (
                      <DRPanel result={result}/>
                    )}
                  </div>

                  {/* DR Banner */}
                  {currentDrState === 'banner' && (
                    <div className="fade-up">
                      <DRBanner
                        confidence={dProb}
                        onGrade={handleGrade}
                        onSkip={() => setDrState(s => ({ ...s, [selected.id]: 'skipped' }))}
                      />
                    </div>
                  )}

                  {/* HITL */}
                  <div className="fade-up">
                    <HITLFeedback
                      predictionId={result.id}
                      hasDR={hasDR}
                      drOnly={result.odir_probs
                        ? Object.values(result.odir_probs).every(v => v === 0)
                        : false}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setUpload(false)}
          onSuccess={() => { loadLists(); setUpload(false); }}
        />
      )}
    </div>
  );
}
