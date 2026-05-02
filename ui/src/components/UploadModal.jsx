import { useState } from 'react';
import { getMyPatients, createPatient, uploadAndAnalyze } from '../services/api';
import { useEffect } from 'react';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#0F172A', textSec: '#64748B', textHead: '#1E293B', textMuted: '#94A3B8',
  success: '#059669', successLight: '#ECFDF5',
  danger: '#DC2626',
};

const inputStyle = {
  width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
  padding: '8px 11px', fontSize: 13, color: C.text,
  background: C.bg, outline: 'none',
};

const labelStyle = {
  fontSize: 12, fontWeight: 500, color: C.textSec,
  marginBottom: 4, display: 'block',
};

function ModalShell({ children, onClose, title }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,0.40)', backdropFilter: 'blur(4px)',
      }}
    >
      <div className="fade-up" style={{
        background: '#fff', borderRadius: 16, width: 520,
        maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.14)',
        border: `1px solid ${C.border}`,
      }}>
        {title && (
          <div style={{
            padding: '18px 22px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, background: '#fff', zIndex: 10,
            borderRadius: '16px 16px 0 0',
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.textHead }}>{title}</span>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 7,
                border: `1px solid ${C.border}`, background: '#F8FAFC',
                color: C.textSec, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}
            >✕</button>
          </div>
        )}
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function StepLabel({ n, label }) {
  return (
    <div style={{
      fontSize: 13, fontWeight: 600, color: C.textHead,
      marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        background: C.accent, color: '#fff',
        fontSize: 11, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{n}</span>
      {label}
    </div>
  );
}

export default function UploadModal({ onClose, onSuccess }) {
  const [patients, setPatients]         = useState([]);
  const [query, setQuery]               = useState('');
  const [dropOpen, setDropOpen]         = useState(false);
  const [selectedPatient, setSelected]  = useState(null);
  const [newPatient, setNewPatient]     = useState(false);
  const [np, setNp]                     = useState({ full_name: '', patient_code: '', birth_year: '', gender: '', diabetes_hx: false, hypertension_hx: false });
  const [file, setFile]                 = useState(null);
  const [analysisMode, setMode]         = useState('odir_full');
  const [step, setStep]                 = useState('form'); // form | uploading | done
  const [error, setError]               = useState('');

  useEffect(() => {
    getMyPatients().then(setPatients).catch(console.error);
  }, []);

  const filtered = patients.filter(p => {
    const q = query.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.patient_code?.toLowerCase().includes(q);
  });

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'image/jpeg' || f.type === 'image/png')) setFile(f);
  };

  const handleSubmit = async () => {
    if ((!selectedPatient && !newPatient) || !file) return;
    setError('');
    setStep('uploading');

    try {
      let patientId = selectedPatient?.id;

      // Yeni hasta oluştur
      if (newPatient) {
        const created = await createPatient({
          ...np,
          birth_year: np.birth_year ? parseInt(np.birth_year) : null,
        });
        patientId = created.id;
      }

      await uploadAndAnalyze(patientId, file, analysisMode);
      setStep('done');
    } catch (e) {
      setError(e.response?.data?.detail || 'Bir hata oluştu.');
      setStep('form');
    }
  };

  // Yükleniyor
  if (step === 'uploading') return (
    <ModalShell onClose={onClose}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16, padding: '32px 0',
      }}>
        <div className="spinner"/>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textHead }}>
          Analiz başlatılıyor…
        </div>
        <div style={{ fontSize: 12, color: C.textSec }}>
          {analysisMode === 'odir_full'
            ? 'Swin Transformer modeli çalışıyor'
            : 'EfficientNet-B3 Cascade modeli çalışıyor'}
        </div>
      </div>
    </ModalShell>
  );

  // Tamamlandı
  if (step === 'done') return (
    <ModalShell onClose={onClose}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14, padding: '32px 0', textAlign: 'center',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: C.successLight, border: '2px solid #A7F3D0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.textHead }}>
          Analiz tamamlandı
        </div>
        <div style={{ fontSize: 12, color: C.textSec, maxWidth: 280 }}>
          Görüntü analiz edildi. Geçmiş vakalar listesinde görünecek.
        </div>
        <button
          onClick={() => { onClose(); onSuccess?.(); }}
          style={{
            marginTop: 8, padding: '9px 24px', borderRadius: 8,
            border: 'none', background: C.accent, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Tamam
        </button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell onClose={onClose} title="Yeni Vaka Yükle">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Adım 1: Hasta ── */}
        <section>
          <StepLabel n="1" label="Hasta Seçimi" />

          {!newPatient ? (
            <div style={{ position: 'relative' }}>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setDropOpen(true); setSelected(null); }}
                onFocus={() => setDropOpen(true)}
                placeholder="Ad veya hasta kodu ile ara…"
                style={inputStyle}
              />
              {selectedPatient && (
                <div style={{
                  marginTop: 6, padding: '8px 10px',
                  background: C.accentLight, border: `1px solid ${C.accentMid}`,
                  borderRadius: 7, fontSize: 12, color: C.accent,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span>
                    {selectedPatient.full_name}
                    <span style={{ color: C.textMuted, fontFamily: 'monospace', marginLeft: 6 }}>
                      ({selectedPatient.patient_code})
                    </span>
                  </span>
                  <button
                    onClick={() => { setSelected(null); setQuery(''); }}
                    style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}
                  >✕</button>
                </div>
              )}
              {dropOpen && !selectedPatient && query && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: '#fff', border: `1px solid ${C.border}`,
                  borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  zIndex: 50, marginTop: 2, maxHeight: 180, overflowY: 'auto',
                }}>
                  {filtered.length > 0 ? filtered.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setSelected(p); setQuery(p.full_name); setDropOpen(false); }}
                      className="card-hover"
                      style={{
                        padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                        color: C.text, display: 'flex', justifyContent: 'space-between',
                        borderBottom: `1px solid ${C.bg}`,
                      }}
                    >
                      <span>{p.full_name}</span>
                      <span style={{ color: C.textMuted, fontFamily: 'monospace', fontSize: 11 }}>
                        {p.patient_code}
                      </span>
                    </div>
                  )) : (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: C.textMuted }}>
                      Sonuç bulunamadı
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setNewPatient(true)}
                style={{
                  marginTop: 8, background: 'none', border: 'none',
                  color: C.accent, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                + Yeni hasta ekle
              </button>
            </div>
          ) : (
            <div style={{
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textHead }}>
                  Yeni Hasta Bilgileri
                </span>
                <button
                  onClick={() => setNewPatient(false)}
                  style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer' }}
                >
                  ← Mevcut hasta seç
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Ad Soyad</label>
                  <input value={np.full_name} onChange={e => setNp({ ...np, full_name: e.target.value })} placeholder="Ahmet Yılmaz" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Hasta Kodu</label>
                  <input value={np.patient_code} onChange={e => setNp({ ...np, patient_code: e.target.value })} placeholder="P009" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Doğum Yılı</label>
                  <input value={np.birth_year} onChange={e => setNp({ ...np, birth_year: e.target.value })} placeholder="1970" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Cinsiyet</label>
                  <select value={np.gender} onChange={e => setNp({ ...np, gender: e.target.value })} style={inputStyle}>
                    <option value="">Seçin…</option>
                    <option>Erkek</option>
                    <option>Kadın</option>
                    <option>Belirtilmemiş</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: C.textSec }}>
                  <input type="checkbox" checked={np.diabetes_hx} onChange={e => setNp({ ...np, diabetes_hx: e.target.checked })} style={{ accentColor: C.accent }}/>
                  Diyabet öyküsü
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: C.textSec }}>
                  <input type="checkbox" checked={np.hypertension_hx} onChange={e => setNp({ ...np, hypertension_hx: e.target.checked })} style={{ accentColor: C.accent }}/>
                  Hipertansiyon öyküsü
                </label>
              </div>
            </div>
          )}
        </section>

        {/* ── Adım 2: Görüntü ── */}
        <section>
          <StepLabel n="2" label="Görüntü Yükleme" />
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => document.getElementById('file-input').click()}
            style={{
              border: `2px dashed ${file ? C.accentMid : C.border}`,
              borderRadius: 10, padding: 28,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, cursor: 'pointer',
              background: file ? C.accentLight : C.bg,
              transition: 'all 0.15s',
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {file ? (
              <>
                <div style={{ fontSize: 22 }}>🖼</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{file.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Değiştirmek için tıkla</div>
              </>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="14" stroke="#CBD5E1" strokeWidth="1.5"/>
                  <circle cx="16" cy="16" r="8" stroke="#CBD5E1" strokeWidth="1.5"/>
                  <circle cx="16" cy="16" r="3" fill="#CBD5E1"/>
                </svg>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.textSec }}>
                  Sürükle bırak veya tıkla
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>JPG veya PNG, maks. 10MB</div>
              </>
            )}
          </div>
        </section>

        {/* ── Adım 3: Analiz Türü ── */}
        <section>
          <StepLabel n="3" label="Analiz Türü" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                id: 'odir_full',
                title: 'Genel Oküler Tarama (ODIR)',
                desc: '8 hastalık sınıfı taranır. DR tespit edilirse evreleme önerilir.',
                model: 'Swin Transformer',
              },
              {
                id: 'dr_only',
                title: 'Diyabetik Retinopati Evreleme',
                desc: 'DR varlığı doğrulanır ve evre belirlenir.',
                model: 'EfficientNet-B3 Cascade',
              },
            ].map(opt => (
              <label
                key={opt.id}
                onClick={() => setMode(opt.id)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 11,
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${analysisMode === opt.id ? C.accent : C.border}`,
                  background: analysisMode === opt.id ? C.accentLight : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  checked={analysisMode === opt.id}
                  onChange={() => setMode(opt.id)}
                  style={{ accentColor: C.accent, marginTop: 2, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.textHead }}>{opt.title}</div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{opt.desc}</div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, fontFamily: 'monospace' }}>
                    Model: {opt.model}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Hata */}
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: '#FEF2F2', color: C.danger, border: '1px solid #FECACA',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={(!selectedPatient && !newPatient) || !file}
          style={{
            width: '100%', padding: 11, borderRadius: 9, border: 'none',
            background: (!selectedPatient && !newPatient) || !file ? '#E2E8F0' : C.accent,
            color: (!selectedPatient && !newPatient) || !file ? C.textMuted : '#fff',
            fontSize: 13, fontWeight: 600,
            cursor: (!selectedPatient && !newPatient) || !file ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            boxShadow: (!selectedPatient && !newPatient) || !file ? 'none' : '0 2px 8px rgba(37,99,235,0.25)',
          }}
        >
          Analizi Başlat
        </button>
      </div>
    </ModalShell>
  );
}