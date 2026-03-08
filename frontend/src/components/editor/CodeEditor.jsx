// frontend/src/components/editor/CodeEditor.jsx
// Monaco Editor + JDoodle API (200 free executions/day)

import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { runCode, JDOODLE_LANGUAGES, checkCredits } from '../../services/Jdoodleservice';
const LANGUAGES = [
  { id: 'java', label: 'Java', icon: 'Java',
    starter: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to EduTrack");\n    }\n}` },
  { id: 'python', label: 'Python', icon: 'Py',
    starter: `def main():\n    print("Welcome to EduTrack")\n\nif __name__ == "__main__":\n    main()` },
  { id: 'javascript', label: 'JavaScript', icon: 'JS',
    starter: `function main() {\n    console.log("Welcome to EduTrack");\n}\n\nmain();` },
  { id: 'cpp', label: 'C++', icon: 'C++',
    starter: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Welcome to EduTrack" << endl;\n    return 0;\n}` },
  { id: 'c', label: 'C', icon: 'C',
    starter: `#include <stdio.h>\n\nint main() {\n    printf("Welcome to EduTrack\\n");\n    return 0;\n}` },
  { id: 'php', label: 'PHP', icon: 'PHP',
    starter: `<?php\necho "Welcome to EduTrack\\n";` },
  { id: 'ruby', label: 'Ruby', icon: 'RB',
    starter: `puts "Welcome to EduTrack"` },
  { id: 'go', label: 'Go', icon: 'Go',
    starter: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Welcome to EduTrack")\n}` },
  { id: 'rust', label: 'Rust', icon: 'Rs',
    starter: `fn main() {\n    println!("Welcome to EduTrack");\n}` },
  { id: 'kotlin', label: 'Kotlin', icon: 'Kt',
    starter: `fun main() {\n    println("Welcome to EduTrack")\n}` },
  { id: 'swift', label: 'Swift', icon: 'Sw',
    starter: `print("Welcome to EduTrack")` },
  { id: 'sql', label: 'SQL', icon: 'SQL',
    starter: `SELECT 'Welcome to EduTrack' AS message;` },
  { id: 'html', label: 'HTML', icon: 'HTML',
    starter: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>EduTrack</title>\n</head>\n<body>\n    <h1>Welcome to EduTrack</h1>\n</body>\n</html>` },
];

const THEMES = [{ id:'vs-dark',label:'Dark'},{ id:'vs',label:'Light'},{ id:'hc-black',label:'High Contrast'}];
const FONTSIZES = [12,13,14,15,16,18,20];

const LANGUAGE_IDS = new Set(LANGUAGES.map((lang) => lang.id));
const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  php: 'php',
  ruby: 'ruby',
  go: 'go',
  rust: 'rust',
  kotlin: 'kotlin',
  swift: 'swift',
  sql: 'sql',
  html: 'html',
};

const normalizeLanguageId = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return LANGUAGE_IDS.has(normalized) ? normalized : 'java';
};

const getLanguageStarter = (value) => (
  LANGUAGES.find((lang) => lang.id === value)?.starter ?? LANGUAGES[0].starter
);

// â”€â”€â”€ Output Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OutputPanel({ result, running, runStatus, onClear }) {
  return (
    <div className="out-panel">
      <div className="out-header">
        <div className="out-header-left">
          <span className="out-title">OUTPUT</span>
          {result && (
            <span className="out-badge" style={{ color: result.success ? 'var(--green)' : 'var(--red)' }}>
              {result.success ? 'Success' : 'Error'}
            </span>
          )}
          {result?.cpuTime && <span className="out-meta">Time {result.cpuTime}s</span>}
          {result?.memory && <span className="out-meta">Mem {Math.round(result.memory/1024)}KB</span>}
        </div>
        {result && <button className="out-clear" onClick={onClear}>Clear</button>}
      </div>

      <div className="out-body">
        {running ? (
          <div className="out-running">
            <span className="out-spinner" />
            <span className="out-running-txt">{runStatus || 'Running...'}</span>
          </div>
        ) : !result ? (
          <div className="out-empty">
            <span className="out-empty-icon">{'>'}</span>
            <span>Press <strong>Run Code</strong> to execute</span>
          </div>
        ) : (
          <div className="out-content">
            {result.success ? (
              result.output ? (
                <div className="out-block">
                  <pre className="out-pre out-pre-ok">{result.output}</pre>
                </div>
              ) : (
                <div className="out-empty">
                  <span style={{color:'var(--green)'}}>OK</span>
                  <span>Program ran with no output.</span>
                </div>
              )
            ) : (
              <div className="out-block">
                <div className="out-block-label out-label-err">ERROR</div>
                <pre className="out-pre out-pre-err">{result.error || result.output}</pre>
              </div>
            )}
            {result.statusCode !== null && result.statusCode !== undefined && (
              <div className="out-exit">
                Status code: <span style={{ color: result.statusCode === 200 ? 'var(--green)' : 'var(--red)' }}>
                  {result.statusCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ HTML Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HtmlPreview({ code, onClose }) {
  return (
    <div className="out-panel">
      <div className="out-header">
        <div className="out-header-left"><span className="out-title">HTML PREVIEW</span></div>
        <button className="out-clear" onClick={onClose}>Close</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <iframe srcDoc={code} style={{ width:'100%',height:'100%',border:'none',background:'#fff' }}
          sandbox="allow-scripts" title="HTML Preview" />
      </div>
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CodeEditor({
  onSubmit, onSaveDraft,
  projectTitle='Assignment', maxMarks=100, dueDate,
  readOnly=false, existingCode=null, existingLang='java',
  shellHeight='100vh',
  showRunButton=true,
  showSubmitButton=!readOnly,
  showDraftButton=!readOnly,
  showCommentsField=!readOnly,
  showStdinField=true,
}) {
  const initialLanguage = normalizeLanguageId(existingLang);
  const [language,     setLanguage]     = useState(initialLanguage);
  const [code,         setCode]         = useState(
    typeof existingCode === 'string' && existingCode.trim()
      ? existingCode
      : getLanguageStarter(initialLanguage)
  );
  const [theme,        setTheme]        = useState('vs-dark');
  const [fontSize,     setFontSize]     = useState(14);
  const [comments,     setComments]     = useState('');
  const [saved,        setSaved]        = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [wordWrap,     setWordWrap]     = useState(false);
  const [minimap,      setMinimap]      = useState(false);
  const [running,      setRunning]      = useState(false);
  const [runStatus,    setRunStatus]    = useState('');
  const [result,       setResult]       = useState(null);
  const [stdin,        setStdin]        = useState('');
  const [showStdin,    setShowStdin]    = useState(false);
  const [showOutput,   setShowOutput]   = useState(false);
  const [showHtml,     setShowHtml]     = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [credits,      setCredits]      = useState(null);

  const editorRef = useRef(null);
  const saveTimer = useRef(null);

  // Auto-save
  useEffect(() => {
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { onSaveDraft?.(code,language); setSaved(true); }, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [code, language, onSaveDraft]);

  // Check credits on mount
  useEffect(() => {
    checkCredits().then(data => setCredits(data.used)).catch(() => {});
  }, []);

  const handleLangChange = (id) => {
    const prev = LANGUAGES.find(l => l.id === language);
    const next = LANGUAGES.find(l => l.id === id);
    if (!code.trim() || code === prev?.starter) setCode(next.starter);
    setLanguage(id);
    setResult(null); setShowOutput(false); setShowHtml(false);
  };

  const handleRun = useCallback(async () => {
    if (!code.trim() || running) return;
    if (language === 'html') { setShowHtml(true); setShowOutput(false); return; }
    
    setRunning(true); setResult(null); setShowOutput(true); setShowHtml(false);
    try {
      const out = await runCode(code, language, stdin, setRunStatus);
      setResult(out);
      // Refresh credits after run
      checkCredits().then(data => setCredits(data.used)).catch(() => {});
    } catch (err) {
      setResult({ success:false, output:'', error:err.message||'Execution failed.', statusCode:1 });
    } finally { setRunning(false); setRunStatus(''); }
  }, [code, language, stdin, running]);

  // Ctrl+Enter to run
  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey||e.metaKey) && e.key==='Enter') handleRun(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleRun]);

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    try { await onSubmit?.(code,language,comments); setSubmitted(true); }
    catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const daysLeft = dueDate ? Math.ceil((new Date(dueDate)-new Date())/86400000) : null;
  const canRun = JDOODLE_LANGUAGES[language]?.runnable;
  const showBottom =
    showRunButton || showSubmitButton || showDraftButton || showCommentsField || showStdinField;

  if (submitted) return (
    <>
      <style>{css}</style>
      <div className="ed-shell" style={{ height: shellHeight }}>
        <div className="ed-success">
          <div className="ed-success-ring">OK</div>
          <h2 className="ed-success-title">Submitted!</h2>
          <p className="ed-success-sub">Code submitted for <strong>{projectTitle}</strong></p>
          <button className="ed-success-btn" onClick={()=>setSubmitted(false)}>Edit Submission</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="ed-shell" style={{ height: shellHeight }}>

        {/* Top Bar */}
        <div className="ed-topbar">
          <div className="ed-topbar-left">
            <span style={{fontSize:15}}>Code</span>
            <span className="ed-proj-title">{projectTitle}</span>
            {daysLeft!==null && (
              <span className={`ed-due ${daysLeft<0?'overdue':daysLeft<=2?'urgent':''}`}>
                {daysLeft<0?`Overdue ${Math.abs(daysLeft)}d`:daysLeft===0?'Due today':`${daysLeft}d left`}
              </span>
            )}
            <span className="jdoodle-badge">JDoodle API</span>
            {credits!==null && (
              <span className="credits-badge">{credits}/200 used today</span>
            )}
          </div>
          <span className="ed-marks">/{maxMarks} marks</span>
        </div>

        {/* Lang Bar */}
        <div className="ed-langbar">
          <div className="ed-lang-tabs">
            {LANGUAGES.map(l => (
              <button key={l.id}
                className={`ed-lang-tab ${language===l.id?'ed-lang-tab--on':''}`}
                onClick={()=>handleLangChange(l.id)} disabled={readOnly}>
                {l.label}
              </button>
            ))}
          </div>
          <div className="ed-toolbar">
            <select className="ed-select" value={theme} onChange={e=>setTheme(e.target.value)}>
              {THEMES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select className="ed-select" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))}>
              {FONTSIZES.map(s=><option key={s} value={s}>{s}px</option>)}
            </select>
            <button className={`ed-tool ${wordWrap?'ed-tool--on':''}`} onClick={()=>setWordWrap(w=>!w)} title="Wrap">W</button>
            <button className={`ed-tool ${minimap?'ed-tool--on':''}`} onClick={()=>setMinimap(m=>!m)} title="Map">M</button>
            <button className="ed-tool" onClick={()=>editorRef.current?.getAction('editor.action.formatDocument')?.run()} title="Format">F</button>
            <button className="ed-tool" onClick={()=>navigator.clipboard.writeText(code)} title="Copy">C</button>
            {!readOnly && (
              <button className="ed-tool ed-tool--danger"
                onClick={()=>window.confirm('Reset?')&&setCode(LANGUAGES.find(l=>l.id===language)?.starter||'')}
                title="Reset">R</button>
            )}
          </div>
        </div>

        {/* Editor + Output */}
        <div className={`ed-body ${showOutput||showHtml?'ed-body--split':''}`}>
          <div className="ed-editor-pane">
            <Editor height="100%" language={MONACO_LANGUAGE_MAP[language] || 'plaintext'} value={code} theme={theme}
              onChange={val=>setCode(val||'')} onMount={e=>{editorRef.current=e;e.focus();}}
              options={{
                fontSize, fontFamily:"'JetBrains Mono','Fira Code',monospace", fontLigatures:true,
                minimap:{enabled:minimap}, wordWrap:wordWrap?'on':'off', readOnly,
                automaticLayout:true, scrollBeyondLastLine:false, lineNumbers:'on',
                folding:true, bracketPairColorization:{enabled:true}, tabSize:4,
                smoothScrolling:true, cursorBlinking:'smooth', cursorSmoothCaretAnimation:'on',
                padding:{top:16,bottom:16},
              }}
            />
          </div>
          {showOutput && !showHtml && (
            <OutputPanel result={result} running={running} runStatus={runStatus}
              onClear={()=>{setResult(null);setShowOutput(false);}} />
          )}
          {showHtml && <HtmlPreview code={code} onClose={()=>setShowHtml(false)} />}
        </div>

        {/* Status Bar */}
        <div className="ed-statusbar">
          <div className="ed-status-left">
            <span className="ed-status-lang">{language.toUpperCase()}</span>
            <span className="ed-status-sep">|</span>
            <span className="ed-status-item">{code.split('\n').length} lines</span>
            <span className="ed-status-sep">|</span>
            <span className="ed-status-item">{code.length} chars</span>
            {canRun && <>
              <span className="ed-status-sep">|</span>
              <span className="ed-status-runnable">Runnable</span>
            </>}
          </div>
          <div className="ed-status-right">
            <span className="ed-status-item">{fontSize}px</span>
            <span className="ed-status-sep">|</span>
            <span className={`ed-status-item ${saved?'ed-status-saved':'ed-status-unsaved'}`}>
              {saved?'Saved':'Unsaved'}
            </span>
          </div>
        </div>

        {/* Bottom */}
        {showBottom && (
          <div className="ed-bottom">
            <div className="ed-bottom-toggles">
              {showStdinField && (
                <button className="ed-toggle" onClick={()=>setShowStdin(s=>!s)}>
                  {showStdin?'Hide':'Show'} stdin {stdin&&<span className="ed-dot"/>}
                </button>
              )}
              {showCommentsField && (
                <button className="ed-toggle" onClick={()=>setShowComments(s=>!s)}>
                  {showComments?'Hide':'Show'} notes {comments&&<span className="ed-dot"/>}
                </button>
              )}
              {showRunButton && <span className="ed-shortcut">Ctrl+Enter to run</span>}
            </div>

            {showStdinField && showStdin && (
              <textarea className="ed-textarea" value={stdin} onChange={e=>setStdin(e.target.value)}
                placeholder="Program input (stdin) - one value per line..." rows={3}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12}} />
            )}
            {showCommentsField && showComments && (
              <textarea className="ed-textarea" value={comments} onChange={e=>setComments(e.target.value)}
                placeholder="Explain your approach or leave notes..." rows={3} />
            )}

            <div className="ed-actions">
              {showDraftButton && (
                <button className="ed-btn-draft" onClick={()=>{onSaveDraft?.(code,language);setSaved(true);}}>
                  Save Draft
                </button>
              )}

              {showRunButton && (
                <button className={`ed-btn-run ${running?'ed-btn-run--busy':''}`}
                  onClick={handleRun} disabled={running}
                  title={language==='html'?'Preview':canRun?'Run (Ctrl+Enter)':'Cannot run'}>
                  {running
                    ?<><span className="ed-spinner"/>{runStatus||'Running...'}</>
                    :language==='html'?'Preview':'Run Code'
                  }
                </button>
              )}

              {showSubmitButton && (
                <button className="ed-btn-submit" onClick={handleSubmit} disabled={submitting||!code.trim()}>
                  {submitting?<><span className="ed-spinner"/>Submitting...</>:'Submit'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css=`
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Geist:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bar:#1e1e2e;--bar2:#252535;--bar3:#181825;--border:rgba(255,255,255,0.08);--txt:#cdd6f4;--dim:#6c7086;--accent:#89b4fa;--green:#a6e3a1;--red:#f38ba8;--yellow:#f9e2af}
  body{font-family:'Geist',sans-serif}
  .ed-shell{display:flex;flex-direction:column;height:100%;background:#13131f;overflow:hidden}
  .ed-topbar{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;background:var(--bar);border-bottom:1px solid var(--border);flex-shrink:0;gap:12px;flex-wrap:wrap}
  .ed-topbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .ed-proj-title{font-size:13px;font-weight:500;color:var(--txt)}
  .ed-due{padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:rgba(166,227,161,.12);color:var(--green)}
  .ed-due.urgent{background:rgba(249,226,175,.12);color:var(--yellow)}
  .ed-due.overdue{background:rgba(243,139,168,.12);color:var(--red)}
  .jdoodle-badge{padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:rgba(137,180,250,.1);color:var(--accent);letter-spacing:.04em}
  .credits-badge{padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:rgba(166,227,161,.1);color:var(--green);font-family:'JetBrains Mono',monospace}
  .ed-marks{padding:2px 10px;border-radius:4px;background:var(--bar2);color:var(--dim);font-size:11px;font-family:'JetBrains Mono',monospace;flex-shrink:0}
  .ed-langbar{display:flex;justify-content:space-between;align-items:center;background:var(--bar);border-bottom:1px solid var(--border);padding:0 12px;flex-shrink:0;gap:8px}
  .ed-lang-tabs{display:flex;overflow-x:auto;flex-shrink:0}
  .ed-lang-tab{display:flex;align-items:center;gap:5px;padding:9px 11px;background:none;border:none;border-bottom:2px solid transparent;color:var(--dim);cursor:pointer;font-family:'Geist',sans-serif;font-size:12px;font-weight:500;white-space:nowrap;transition:all .15s}
  .ed-lang-tab:hover{color:var(--txt)}
  .ed-lang-tab--on{color:var(--accent);border-bottom-color:var(--accent)}
  .ed-lang-tab:disabled{opacity:.35;cursor:default}
  .ed-toolbar{display:flex;align-items:center;gap:5px;padding:5px 0;flex-shrink:0}
  .ed-select{padding:4px 20px 4px 8px;border-radius:6px;height:28px;background:var(--bar2);border:1px solid var(--border);color:var(--dim);font-family:'Geist',sans-serif;font-size:11px;cursor:pointer;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236c7086' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center}
  .ed-select:focus{outline:none;border-color:var(--accent);color:var(--txt)}
  .ed-tool{width:28px;height:28px;border-radius:6px;background:var(--bar2);border:1px solid var(--border);color:var(--dim);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s}
  .ed-tool:hover{color:var(--txt);border-color:var(--accent)}
  .ed-tool--on{color:var(--accent);border-color:var(--accent);background:rgba(137,180,250,.1)}
  .ed-tool--danger:hover{color:var(--red);border-color:var(--red)}
  .ed-body{flex:1;display:flex;min-height:0;overflow:hidden}
  .ed-body--split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .ed-body--split .ed-editor-pane{min-width:0}
  .ed-editor-pane{flex:1;overflow:hidden}
  .out-panel{width:100%;min-width:0;max-width:none;display:flex;flex-direction:column;background:var(--bar3);border-left:1px solid var(--border);flex-shrink:0}
  .out-header{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-bottom:1px solid var(--border);background:var(--bar);flex-shrink:0}
  .out-header-left{display:flex;align-items:center;gap:10px}
  .out-title{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;color:var(--dim);letter-spacing:.1em}
  .out-badge{font-size:11px;font-weight:600}
  .out-meta{font-size:10px;color:var(--dim);font-family:'JetBrains Mono',monospace}
  .out-clear{background:none;border:none;cursor:pointer;color:var(--dim);font-size:11px;font-family:'Geist',sans-serif;transition:color .15s}
  .out-clear:hover{color:var(--red)}
  .out-body{flex:1;overflow-y:auto;padding:12px}
  .out-running{display:flex;align-items:center;gap:10px;padding:20px 0;color:var(--accent)}
  .out-spinner{width:14px;height:14px;border-radius:50%;border:2px solid rgba(137,180,250,.2);border-top-color:var(--accent);animation:spin .7s linear infinite;flex-shrink:0}
  .out-running-txt{font-family:'JetBrains Mono',monospace;font-size:12px}
  .out-empty{display:flex;align-items:center;gap:8px;padding:20px 0;color:var(--dim);font-size:12px;font-family:'JetBrains Mono',monospace}
  .out-empty-icon{font-size:16px;color:var(--accent);opacity:.5}
  .out-content{display:flex;flex-direction:column;gap:12px}
  .out-block{display:flex;flex-direction:column;gap:6px}
  .out-block-label{font-size:9px;font-weight:700;letter-spacing:.12em;font-family:'JetBrains Mono',monospace}
  .out-label-ok{color:var(--green)}
  .out-label-err{color:var(--red)}
  .out-pre{font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;background:rgba(255,255,255,.03);border-radius:6px;padding:10px 12px;color:var(--txt);border:1px solid var(--border)}
  .out-pre-ok{color:var(--green);border-color:rgba(166,227,161,.2);background:rgba(166,227,161,.05)}
  .out-pre-err{color:var(--red);border-color:rgba(243,139,168,.2);background:rgba(243,139,168,.05)}
  .out-exit{font-size:10px;color:var(--dim);font-family:'JetBrains Mono',monospace;padding-top:4px}
  .ed-statusbar{display:flex;justify-content:space-between;align-items:center;padding:4px 14px;background:var(--bar3);border-top:1px solid var(--border);flex-shrink:0}
  .ed-status-left,.ed-status-right{display:flex;align-items:center;gap:8px}
  .ed-status-item{font-size:11px;color:var(--dim);font-family:'JetBrains Mono',monospace}
  .ed-status-sep{color:var(--border);font-size:10px}
  .ed-status-lang{color:var(--accent);font-weight:500;font-family:'JetBrains Mono',monospace;font-size:11px}
  .ed-status-runnable{color:var(--green);font-size:11px;font-family:'JetBrains Mono',monospace}
  .ed-status-saved{color:var(--green)}
  .ed-status-unsaved{color:var(--yellow)}
  .ed-bottom{background:var(--bar);border-top:1px solid var(--border);padding:10px 14px;display:flex;flex-direction:column;gap:8px;flex-shrink:0}
  .ed-bottom-toggles{display:flex;align-items:center;gap:16px}
  .ed-toggle{background:none;border:none;cursor:pointer;color:var(--dim);font-size:11px;font-family:'Geist',sans-serif;display:flex;align-items:center;gap:5px;transition:color .15s}
  .ed-toggle:hover{color:var(--txt)}
  .ed-dot{width:5px;height:5px;border-radius:50%;background:var(--accent)}
  .ed-shortcut{margin-left:auto;font-size:10px;color:var(--dim);font-family:'JetBrains Mono',monospace}
  .ed-textarea{width:100%;background:var(--bar2);border:1px solid var(--border);border-radius:6px;color:var(--txt);font-family:'Geist',sans-serif;font-size:13px;padding:8px 12px;resize:none;line-height:1.5;transition:border-color .15s}
  .ed-textarea:focus{outline:none;border-color:var(--accent)}
  .ed-textarea::placeholder{color:var(--dim)}
  .ed-actions{display:flex;justify-content:flex-end;gap:8px;align-items:center}
  .ed-btn-draft{padding:8px 14px;border-radius:7px;background:none;border:1px solid var(--border);color:var(--dim);cursor:pointer;font-family:'Geist',sans-serif;font-size:12px;transition:all .15s}
  .ed-btn-draft:hover{border-color:var(--dim);color:var(--txt)}
  .ed-btn-run{padding:8px 18px;border-radius:7px;border:1px solid rgba(166,227,161,.3);cursor:pointer;background:rgba(166,227,161,.12);color:var(--green);font-family:'Geist',sans-serif;font-size:12px;font-weight:600;display:flex;align-items:center;gap:7px;transition:all .15s;letter-spacing:.02em}
  .ed-btn-run:hover:not(:disabled){background:rgba(166,227,161,.22);border-color:var(--green)}
  .ed-btn-run--busy{background:rgba(137,180,250,.1);color:var(--accent);border-color:rgba(137,180,250,.3)}
  .ed-btn-run:disabled{opacity:.35;cursor:not-allowed}
  .ed-btn-submit{padding:8px 18px;border-radius:7px;border:none;cursor:pointer;background:var(--accent);color:#1a1a2a;font-family:'Geist',sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px;transition:opacity .15s}
  .ed-btn-submit:hover:not(:disabled){opacity:.85}
  .ed-btn-submit:disabled{opacity:.4;cursor:not-allowed}
  .ed-spinner{width:12px;height:12px;border-radius:50%;border:2px solid rgba(26,26,42,.3);border-top-color:currentColor;animation:spin .7s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .ed-success{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
  .ed-success-ring{width:70px;height:70px;border-radius:50%;background:rgba(166,227,161,.1);border:2px solid var(--green);display:flex;align-items:center;justify-content:center;font-size:30px;color:var(--green)}
  .ed-success-title{font-size:26px;font-weight:600;color:var(--txt)}
  .ed-success-sub{font-size:13px;color:var(--dim)}
  .ed-success-btn{padding:8px 20px;border-radius:7px;border:1px solid var(--border);background:none;color:var(--dim);cursor:pointer;font-family:'Geist',sans-serif;font-size:12px;margin-top:8px;transition:all .15s}
  .ed-success-btn:hover{border-color:var(--accent);color:var(--accent)}
  @media (max-width: 980px){
    .ed-langbar{flex-wrap:wrap;padding:8px 10px}
    .ed-lang-tabs{width:100%}
    .ed-toolbar{flex-wrap:wrap;justify-content:flex-end}
    .ed-body--split{grid-template-columns:1fr}
    .out-panel{width:100%;max-width:none;min-width:0;height:42%;border-left:none;border-top:1px solid var(--border)}
  }
  @media (max-width: 720px){
    .ed-topbar{padding:8px 10px}
    .ed-topbar-left{gap:6px}
    .ed-statusbar{flex-direction:column;align-items:flex-start;gap:4px;padding:6px 10px}
    .ed-bottom{padding:10px}
    .ed-bottom-toggles{flex-wrap:wrap;gap:10px}
    .ed-shortcut{margin-left:0}
    .ed-actions{flex-wrap:wrap;justify-content:stretch}
    .ed-btn-draft,.ed-btn-run,.ed-btn-submit{width:100%;justify-content:center}
  }
`;
