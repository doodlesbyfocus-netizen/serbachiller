import { useState, useEffect, useRef } from "react";
import Head from "next/head";

const SUBJECTS = [
  { id:"verbal",    name:"Razonamiento Verbal",    sub:"Comprensión lectora · Vocabulario", accent:"#7C3AED", bg:"#F5F3FF" },
  { id:"abstracto", name:"Razonamiento Abstracto", sub:"Patrones · Secuencias lógicas",     accent:"#1D4ED8", bg:"#EFF6FF" },
  { id:"numerico",  name:"Razonamiento Numérico",  sub:"Matemáticas · Operaciones",         accent:"#B45309", bg:"#FFFBEB" },
  { id:"idioma",    name:"Dominio del Idioma",      sub:"Ortografía · Gramática española",  accent:"#047857", bg:"#ECFDF5" },
  { id:"ciencias",  name:"Ciencias Naturales",     sub:"Biología · Física · Química",       accent:"#B91C1C", bg:"#FFF1F2" },
];
const DIFFS        = [
  { id:"basico",     label:"Básico",     note:"Fundamentos" },
  { id:"intermedio", label:"Intermedio", note:"Estándar" },
  { id:"avanzado",   label:"Avanzado",   note:"Alta dificultad" },
];
const COUNTS       = [5, 10, 20, 30];
const COUNT_LABELS = { 5:"~4 min", 10:"~8 min", 20:"~15 min", 30:"~22 min" };
const LETTERS      = ["A","B","C","D"];
const TOTAL_TIME   = 45;

const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M2.5 7.5h10M8 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const BackIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M10.5 3.5L5.5 8.5l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CrossIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function App() {
  const [screen,     setScreen]     = useState("home");
  const [subject,    setSubject]    = useState(null);
  const [difficulty, setDifficulty] = useState("intermedio");
  const [count,      setCount]      = useState(10);
  const [questions,  setQuestions]  = useState([]);
  const [qIdx,       setQIdx]       = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(TOTAL_TIME);
  const [timerOn,    setTimerOn]    = useState(false);
  const [answers,    setAnswers]    = useState([]);
  const [errMsg,     setErrMsg]     = useState(null);
  const [cardKey,    setCardKey]    = useState(0);
  const timerRef = useRef(null);

  const sub = SUBJECTS.find(s => s.id === subject);
  const q   = questions[qIdx];

  useEffect(() => {
    if (timerOn && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerOn && timeLeft === 0) {
      doAnswer(null);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerOn, timeLeft]);

  const startQuiz = async () => {
    setScreen("loading");
    setErrMsg(null);
    try {
      // Calls our own backend — no CORS issues
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: sub.name, difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      if (!data.questions?.length) throw new Error("No se recibieron preguntas");
      setQuestions(data.questions);
      setQIdx(0); setScore(0); setAnswers([]); setSelected(null);
      setTimeLeft(TOTAL_TIME); setTimerOn(true); setCardKey(k => k + 1);
      setScreen("quiz");
    } catch (e) {
      setErrMsg(e.message);
      setScreen("error");
    }
  };

  const doAnswer = (idx) => {
    clearTimeout(timerRef.current);
    setTimerOn(false);
    setSelected(idx);
    const ok = idx === q.correct;
    if (ok) setScore(s => s + 1);
    setAnswers(a => [...a, { selected: idx, correct: q.correct, isCorrect: ok }]);
    setScreen("feedback");
  };

  const next = () => {
    if (qIdx + 1 >= questions.length) { setScreen("results"); return; }
    setQIdx(i => i + 1); setSelected(null);
    setTimeLeft(TOTAL_TIME); setTimerOn(true);
    setCardKey(k => k + 1); setScreen("quiz");
  };

  const goHome = () => {
    clearTimeout(timerRef.current);
    setScreen("home"); setSubject(null);
    setQuestions([]); setScore(0); setAnswers([]);
  };

  const timerPct   = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft > 20 ? "#16A34A" : timeLeft > 10 ? "#D97706" : "#DC2626";
  const pct        = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const R = 52, Circ = 2 * Math.PI * R;
  const grade = pct >= 80 ? { label:"Excelente rendimiento", color:"#16A34A" }
              : pct >= 60 ? { label:"Buen resultado",         color:"#D97706" }
              :              { label:"Sigue practicando",     color:"#DC2626" };

  const s = {
    page: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px 16px", background:"#F2F0EB" },
    card: { background:"#fff", border:"1.5px solid #E5E0D5", borderRadius:14, padding:"20px 22px" },
  };

  if (screen === "loading") return (
    <Page>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <Spinner />
        <p style={{ color:"#9E9890", fontSize:14 }}>Preparando preguntas…</p>
      </div>
    </Page>
  );

  if (screen === "error") return (
    <Page>
      <div style={{ width:"100%", maxWidth:440 }}>
        <div style={{ background:"#FFF1F0", border:"1.5px solid #FECACA", borderRadius:14, padding:"24px" }}>
          <p style={{ fontFamily:"Georgia,serif", fontSize:20, marginBottom:8 }}>Error al cargar</p>
          <p style={{ fontSize:13, color:"#7A7570", lineHeight:1.6, marginBottom:20 }}>{errMsg}</p>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={startQuiz} style={{ flex:2 }}>Intentar de nuevo</Btn>
            <BtnS onClick={goHome} style={{ flex:1 }}>Inicio</BtnS>
          </div>
        </div>
      </div>
    </Page>
  );

  if (screen === "home") return (
    <Page scroll>
      <Head><title>Ser Bachiller · Práctica</title></Head>
      <div style={{ width:"100%", maxWidth:660 }}>

        <div style={{ marginBottom:30 }}>
          <p style={{ fontSize:11, fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#9E9890", marginBottom:7 }}>SENECYT · Ecuador</p>
          <h1 style={{ fontFamily:"Georgia,serif", fontSize:"clamp(26px,5vw,38px)", lineHeight:1.1, color:"#1A1714" }}>
            Prepárate para el<br /><em>Ser Bachiller</em>
          </h1>
          <p style={{ color:"#7A7570", fontSize:14, marginTop:8 }}>Practica con preguntas variadas · nunca repites el mismo ejercicio</p>
        </div>

        <div style={{ marginBottom:22 }}>
          <Label>Área de práctica</Label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:9 }}>
            {SUBJECTS.map(s => (
              <button key={s.id} onClick={() => setSubject(s.id)}
                style={{ background: subject===s.id ? s.bg : "#fff", border:`1.5px solid ${subject===s.id?s.accent:"#E5E0D5"}`, borderRadius:13, padding:"16px 18px", cursor:"pointer", textAlign:"left", transition:"all .17s", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:s.accent, transform: subject===s.id?"scaleY(1)":"scaleY(0)", transition:"transform .2s", transformOrigin:"bottom" }} />
                <div style={{ fontSize:13, fontWeight:600, color:subject===s.id?s.accent:"#1A1714", marginBottom:2 }}>{s.name}</div>
                <div style={{ fontSize:11, color:"#9E9890" }}>{s.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <Label>Dificultad</Label>
          <div style={{ display:"flex", gap:8 }}>
            {DIFFS.map(d => (
              <ToggleBtn key={d.id} selected={difficulty===d.id} onClick={() => setDifficulty(d.id)}>
                <span>{d.label}</span>
                <span style={{ fontSize:11, opacity:.6 }}>{d.note}</span>
              </ToggleBtn>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:26 }}>
          <Label>Preguntas</Label>
          <div style={{ display:"flex", gap:8 }}>
            {COUNTS.map(n => (
              <ToggleBtn key={n} selected={count===n} onClick={() => setCount(n)}>
                <span style={{ fontSize:16, fontWeight:700 }}>{n}</span>
                <span style={{ fontSize:11, opacity:.6 }}>{COUNT_LABELS[n]}</span>
              </ToggleBtn>
            ))}
          </div>
        </div>

        <Btn onClick={startQuiz} disabled={!subject} style={{ width:"100%", fontSize:16, padding:"15px" }}>
          {subject ? `Comenzar · ${sub?.name}` : "Selecciona un área para continuar"}
          {subject && <ArrowRight />}
        </Btn>
      </div>
    </Page>
  );

  if (screen === "quiz" || screen === "feedback") {
    const isFB = screen === "feedback";
    return (
      <Page scroll>
        <div style={{ width:"100%", maxWidth:620 }}>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
            <BtnS onClick={goHome} style={{ padding:"7px 9px", borderRadius:8, display:"flex", alignItems:"center" }}><BackIcon /></BtnS>
            <div style={{ flex:1, display:"flex", gap:4 }}>
              {questions.map((_,i) => (
                <div key={i} style={{ height:5, borderRadius:99, flex:i===qIdx?2:1, transition:"all .3s",
                  background:i<qIdx?"#1A1714":i===qIdx?sub?.accent:"#E5E0D5" }} />
              ))}
            </div>
            <span style={{ fontSize:13, color:"#9E9890", fontWeight:500, whiteSpace:"nowrap" }}>{qIdx+1} / {questions.length}</span>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <span style={{ background:sub?.bg, border:"1px solid transparent", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:sub?.accent }}>{sub?.name}</span>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:100, height:4, background:"#E5E0D5", borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${timerPct}%`, background:timerColor, borderRadius:99, transition:"width 1s linear, background .5s" }} />
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:timerColor, minWidth:22, textAlign:"right" }}>{timeLeft}</span>
            </div>
          </div>

          <div key={cardKey} style={{ background:"#fff", border:`1.5px solid #E5E0D5`, borderLeft:`3px solid ${sub?.accent}`, borderRadius:13, padding:"20px 22px", marginBottom:12 }}>
            <p style={{ fontSize:15, fontWeight:500, lineHeight:1.7, color:"#1A1714" }}>{q.question}</p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:isFB?12:0 }}>
            {q.options.map((opt,i) => {
              let bg="#fff", border="#E5E0D5", color="#1A1714", opacity=1;
              if (isFB) {
                if (i===q.correct)              { bg="#F0FDF4"; border="#16A34A"; }
                else if (i===selected)          { bg="#FFF1F0"; border="#DC2626"; }
                else                            { opacity=0.38; }
              }
              return (
                <button key={i} onClick={() => !isFB && doAnswer(i)}
                  style={{ background:bg, border:`1.5px solid ${border}`, borderRadius:10, padding:"13px 15px", cursor:isFB?"default":"pointer", display:"flex", alignItems:"center", gap:11, width:"100%", textAlign:"left", opacity, transition:"all .14s", fontFamily:"inherit" }}>
                  <span style={{ width:27, height:27, border:`1.5px solid ${isFB&&i===q.correct?"#16A34A":isFB&&i===selected?"#DC2626":"#E5E0D5"}`, background:isFB&&i===q.correct?"#16A34A":isFB&&i===selected?"#DC2626":"transparent", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:isFB&&(i===q.correct||i===selected)?"#fff":"#9E9890", flexShrink:0 }}>{LETTERS[i]}</span>
                  <span style={{ fontSize:14, color, lineHeight:1.5 }}>{opt.replace(/^[A-D]\)\s*/,"")}</span>
                  {isFB && i===q.correct             && <span style={{ marginLeft:"auto", color:"#16A34A" }}><CheckIcon /></span>}
                  {isFB && i===selected&&i!==q.correct && <span style={{ marginLeft:"auto", color:"#DC2626" }}><CrossIcon /></span>}
                </button>
              );
            })}
          </div>

          {isFB && (
            <>
              <div style={{ borderRadius:10, padding:"15px 17px", border:"1.5px solid", marginBottom:12,
                background:selected===null?"#FFFBEB":selected===q.correct?"#F0FDF4":"#FFF1F0",
                borderColor:selected===null?"#FDE68A":selected===q.correct?"#BBF7D0":"#FECACA" }}>
                <p style={{ fontSize:11, fontWeight:600, letterSpacing:".07em", textTransform:"uppercase", marginBottom:5,
                  color:selected===q.correct?"#16A34A":selected===null?"#D97706":"#DC2626" }}>
                  {selected===null?"Tiempo agotado":selected===q.correct?"Respuesta correcta":"Respuesta incorrecta"}
                </p>
                <p style={{ fontSize:14, color:"#3D3933", lineHeight:1.65 }}>{q.explanation}</p>
              </div>
              <Btn onClick={next} style={{ width:"100%" }}>
                {qIdx+1>=questions.length?"Ver resultados":"Siguiente pregunta"} <ArrowRight />
              </Btn>
            </>
          )}
        </div>
      </Page>
    );
  }

  if (screen === "results") return (
    <Page scroll>
      <div style={{ width:"100%", maxWidth:560 }}>
        <div style={{ background:"#fff", border:"1.5px solid #E5E0D5", borderRadius:16, padding:"22px", marginBottom:18, display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <svg width="116" height="116" viewBox="0 0 124 124">
              <circle fill="none" stroke="#E5E0D5" strokeWidth="9" cx="62" cy="62" r={R}/>
              <circle fill="none" stroke={grade.color} strokeWidth="9" strokeLinecap="round" cx="62" cy="62" r={R}
                style={{ transform:"rotate(-90deg)", transformOrigin:"62px 62px", transition:"stroke-dashoffset 1.1s ease .3s" }}
                strokeDasharray={Circ} strokeDashoffset={Circ*(1-pct/100)}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"Georgia,serif", fontSize:30, lineHeight:1 }}>{pct}</span>
              <span style={{ fontSize:11, color:"#9E9890" }}>/ 100</span>
            </div>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"#9E9890", marginBottom:3 }}>{sub?.name}</p>
            <p style={{ fontFamily:"Georgia,serif", fontSize:20, marginBottom:3 }}>{grade.label}</p>
            <p style={{ fontSize:14, color:"#7A7570" }}>{score} de {questions.length} correctas</p>
            <div style={{ marginTop:8, height:3, width:150, background:"#E5E0D5", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:grade.color, borderRadius:99, transition:"width 1.1s ease .4s" }}/>
            </div>
          </div>
        </div>

        <div style={{ marginBottom:18 }}>
          <Label>Revisión</Label>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:300, overflowY:"auto" }}>
            {answers.map((a,i) => (
              <div key={i} style={{ background:a.isCorrect?"#F0FDF4":"#FFF1F0", border:`1.5px solid ${a.isCorrect?"#BBF7D0":"#FECACA"}`, borderRadius:10, padding:"11px 13px", display:"flex", alignItems:"flex-start", gap:9 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:a.isCorrect?"#16A34A":"#DC2626", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  {a.isCorrect ? <CheckIcon/> : <CrossIcon/>}
                </div>
                <p style={{ fontSize:13, color:"#3D3933", lineHeight:1.5 }}>{questions[i]?.question}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={startQuiz} style={{ flex:2, padding:"14px" }}>Repetir área <ArrowRight /></Btn>
          <BtnS onClick={goHome} style={{ flex:1, padding:"14px" }}>Cambiar área</BtnS>
        </div>
      </div>
    </Page>
  );

  return null;
}

// ── Small helper components ────────────────────────────────────────────────────

function Page({ children, scroll }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px 16px", background:"#F2F0EB", overflowY: scroll?"auto":"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes spin{to{transform:rotate(360deg)}}
        button{font-family:'DM Sans',sans-serif}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#D5D0C8;border-radius:99px}
      `}</style>
      {children}
    </div>
  );
}

function Spinner() {
  return <div style={{ width:40, height:40, border:"2.5px solid #E5E0D5", borderTopColor:"#1A1714", borderRadius:"50%", animation:"spin .8s linear infinite" }} />;
}

function Label({ children }) {
  return <p style={{ fontSize:11, fontWeight:600, letterSpacing:".09em", textTransform:"uppercase", color:"#9E9890", marginBottom:10 }}>{children}</p>;
}

function Btn({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:disabled?"#C5BFB3":"#1A1714", color:"#fff", border:"none", borderRadius:10, padding:"14px 24px", fontSize:15, fontWeight:600, cursor:disabled?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .17s", ...style }}>
      {children}
    </button>
  );
}

function BtnS({ children, onClick, style }) {
  return (
    <button onClick={onClick}
      style={{ background:"transparent", color:"#7A7570", border:"1.5px solid #E5E0D5", borderRadius:10, padding:"13px 20px", fontSize:14, fontWeight:500, cursor:"pointer", transition:"all .17s", ...style }}>
      {children}
    </button>
  );
}

function ToggleBtn({ children, selected, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background:selected?"#1A1714":"#fff", color:selected?"#fff":"#7A7570", border:`1.5px solid ${selected?"#1A1714":"#E5E0D5"}`, borderRadius:8, padding:"9px 4px", fontSize:14, fontWeight:500, cursor:"pointer", flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all .15s", fontFamily:"inherit" }}>
      {children}
    </button>
  );
}
