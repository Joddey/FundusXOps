import { useState, useEffect } from 'react';
import { submitFeedback, getFeedback } from '../services/api';

const C = {
  accent: '#2563EB', accentLight: '#EFF6FF', accentMid: '#DBEAFE',
  border: '#E2E8F0', bg: '#F8FAFC', card: '#FFFFFF',
  text: '#0F172A', textSec: '#64748B', textHead: '#1E293B', textMuted: '#94A3B8',
  success: '#059669', successLight: '#ECFDF5',
  danger: '#DC2626', dangerLight: '#FEF2F2',
};

const ODIR_LABELS = {
  N: 'Normal', D: 'Diyabetik Retinopati', G: 'Glokom',
  C: 'Katarakt', A: 'Yaşa Bağlı Makula Dejenerasyonu',
  H: 'Hipertansif Retinopati', M: 'Miyopi', O: 'Diğer Hastalık',
};

const DR_GRADES = ['Hafif NPDR', 'Orta NPDR', 'Ağır NPDR', 'PDR'];
const DR_COLORS = ['#059669', '#D97706', '#EA580C', '#DC2626'];

export default function HITLFeedback({ predictionId, hasDR, drOnly = false }) {
  const [odirMode, setOdirMode]       = useState(null);
  const [drMode, setDrMode]           = useState(null);
  const [odirSel, setOdirSel]         = useState([]);
  const [otherNote, setOtherNote]     = useState('');
  const [drGrade, setDrGrade]         = useState(null);
  const [generalNote, setGeneralNote] = useState('');
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [existing, setExisting]       = useState(null);

  useEffect(() => {
    if (!predictionId) return;
    setOdirMode(null); setDrMode(null);
    setOdirSel([]); setOtherNote('');
    setDrGrade(null); setGeneralNote('');
    setSubmitted(false);

    getFeedback(predictionId)
      .then(fb => {
        setExisting(fb);
        if (!drOnly) setOdirMode(fb.odir_is_correct ? 'correct' : 'incorrect');
        if (hasDR)   setDrMode(fb.dr_is_correct ? 'correct' : 'incorrect');
        if (fb.odir_corrected_labels) {
          setOdirSel(Object.entries(fb.odir_corrected_labels)
            .filter(([, v]) => v).map(([k]) => k));
        }
        if (fb.odir_other_note) setOtherNote(fb.odir_other_note);
        if (fb.dr_corrected_grade !== null) setDrGrade(fb.dr_corrected_grade);
      })
      .catch(() => setExisting(null));
  }, [predictionId]);

  const toggleOdir = k =>
    setOdirSel(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);

  const handleSubmit = async () => {
    if (!predictionId) return;
    setLoading(true);
    try {
      const correctedLabels = (!drOnly && odirMode === 'incorrect')
        ? Object.fromEntries(Object.keys(ODIR_LABELS).map(k => [k, odirSel.includes(k)]))
        : null;

      await submitFeedback({
        prediction_id:         predictionId,
        odir_is_correct:       drOnly ? null : odirMode === 'correct',
        odir_feedback_type:    drOnly ? null : (odirMode === 'correct' ? 'correct' : 'wrong_class'),
        odir_corrected_labels: correctedLabels,
        odir_other_note:       otherNote || null,
        dr_is_correct:         hasDR ? drMode === 'correct' : null,
        dr_feedback_type:      hasDR ? (drMode === 'correct' ? 'correct' : 'wrong_grade') : null,
        dr_corrected_grade:    hasDR && drMode === 'incorrect' ? drGrade : null,
        general_note:          generalNote || null,
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // drOnly modda sadece DR feedback gerekli
  const canSubmit = (drOnly ? true : odirMode !== null) && (!hasDR || drMode !== null);

  const btnStyle = (mode, active) => ({
    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
    border: `1px solid ${active ? (mode === 'correct' ? '#A7F3D0' : '#FECACA') : C.border}`,
    background: active ? (mode === 'correct' ? C.successLight : C.dangerLight) : C.bg,
    color: active ? (mode === 'correct' ? C.success : C.danger) : C.textSec,
  });

  if (submitted) return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 28, textAlign: 'center',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: C.successLight, border: '2px solid #A7F3D0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px', fontSize: 20,
      }}>✓</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.success }}>
        Geri bildirim kaydedildi
      </div>
      <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>
        Model iyileştirme kuyruğuna eklendi.
      </div>
    </div>
  );

  // Kaç kolon gösterilecek
  const showODIR = !drOnly;
  const showDR   = hasDR;
  const cols     = (showODIR && showDR) ? '1fr 1fr' : '1fr';

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.textHead }}>
          Klinik Değerlendirme ve Geri Bildirim
        </div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
          {existing ? 'Önceki geri bildiriminiz yüklendi — güncelleyebilirsiniz.' : 'HITL model geri bildirimi'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>

        {/* ── ODIR (drOnly değilse) ── */}
        {showODIR && (
          <div style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textHead }}>
              ODIR tanısı doğru mu?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setOdirMode('correct')}
                style={btnStyle('correct', odirMode === 'correct')}>
                ✓ Doğru
              </button>
              <button onClick={() => setOdirMode('incorrect')}
                style={btnStyle('incorrect', odirMode === 'incorrect')}>
                ✗ Yanlış — Düzelt
              </button>
            </div>

            {odirMode === 'incorrect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>
                  Gerçek etiketleri seçin:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Object.entries(ODIR_LABELS).map(([k, label]) => (
                    <label key={k} style={{
                      display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                      padding: '5px 8px', borderRadius: 6,
                      background: odirSel.includes(k) ? C.accentLight : C.bg,
                      border: `1px solid ${odirSel.includes(k) ? C.accentMid : C.border}`,
                      transition: 'all 0.12s',
                    }}>
                      <input
                        type="checkbox"
                        checked={odirSel.includes(k)}
                        onChange={() => toggleOdir(k)}
                        style={{ accentColor: C.accent }}
                      />
                      <span style={{ fontSize: 12, color: odirSel.includes(k) ? C.accent : C.textSec }}>
                        <strong>{k}</strong> — {label}
                      </span>
                    </label>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: C.textSec, whiteSpace: 'nowrap' }}>Diğer:</span>
                    <input
                      value={otherNote}
                      onChange={e => setOtherNote(e.target.value)}
                      placeholder="Serbest not…"
                      style={{
                        flex: 1, border: `1px solid ${C.border}`, borderRadius: 6,
                        padding: '5px 8px', fontSize: 12, color: C.text,
                        background: C.bg, outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DR ── */}
        {showDR && (
          <div style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textHead }}>
              DR evrelemesi doğru mu?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDrMode('correct')}
                style={btnStyle('correct', drMode === 'correct')}>
                ✓ Doğru
              </button>
              <button onClick={() => setDrMode('incorrect')}
                style={btnStyle('incorrect', drMode === 'incorrect')}>
                ✗ Yanlış — Evre Seç
              </button>
            </div>

            {drMode === 'incorrect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 500, marginBottom: 4 }}>
                  Doğru evreyi seçin:
                </div>
                {DR_GRADES.map((g, i) => (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                    padding: '5px 8px', borderRadius: 6, transition: 'all 0.12s',
                    background: drGrade === i ? DR_COLORS[i] + '15' : C.bg,
                    border: `1px solid ${drGrade === i ? DR_COLORS[i] + '55' : C.border}`,
                  }}>
                    <input
                      type="radio"
                      name="dr-grade"
                      checked={drGrade === i}
                      onChange={() => setDrGrade(i)}
                      style={{ accentColor: DR_COLORS[i] }}
                    />
                    <span style={{ fontSize: 12, color: drGrade === i ? DR_COLORS[i] : C.textSec }}>
                      Evre {i + 1} — {g}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Genel not */}
      <div>
        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 5 }}>
          Ek not (opsiyonel):
        </div>
        <textarea
          value={generalNote}
          onChange={e => setGeneralNote(e.target.value)}
          placeholder="Klinik gözlemlerinizi buraya yazabilirsiniz…"
          rows={2}
          style={{
            width: '100%', border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '8px 10px', fontSize: 12, color: C.text,
            background: C.bg, outline: 'none', resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        style={{
          width: '100%', padding: 11, borderRadius: 8, border: 'none',
          background: canSubmit && !loading ? C.accent : '#E2E8F0',
          color: canSubmit && !loading ? '#fff' : C.textMuted,
          fontSize: 13, fontWeight: 600,
          cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
          boxShadow: canSubmit && !loading ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
        }}
      >
        {loading ? 'Kaydediliyor…' : existing ? 'Geri Bildirimi Güncelle' : 'Geri Bildirimi Kaydet'}
      </button>
    </div>
  );
}