
// ─── Design tokens (CSS vars — set by App on theme change) ───
const T = {
  gold:    'var(--accent)',
  green:   'var(--green)',
  red:     'var(--red)',
  blue:    '#4e9af1',
  bg:      'var(--bg)',
  card:    'var(--card)',
  card2:   'var(--card2)',
  border:  'var(--border)',
  text:    'var(--text)',
  muted:   'var(--muted)',
  muted2:  'var(--muted2)',
  a10:     'var(--accent-10)',
  a20:     'var(--accent-20)',
  g20:     'rgba(48,209,88,0.18)',
  r20:     'rgba(255,68,58,0.18)',
};

const EXPENSE_CATS = [
  {id:'food',          label:'Food',        icon:'🍔', color:'#ff6b35'},
  {id:'transport',     label:'Transport',   icon:'🚗', color:'#4e9af1'},
  {id:'bills',         label:'Bills',       icon:'⚡', color:'#f5a623'},
  {id:'shopping',      label:'Shopping',    icon:'🛍️', color:'#af52de'},
  {id:'health',        label:'Health',      icon:'❤️', color:'#ff2d55'},
  {id:'entertainment', label:'Fun',         icon:'🎮', color:'#30d158'},
  {id:'education',     label:'Education',   icon:'📚', color:'#5ac8fa'},
  {id:'other',         label:'Other',       icon:'📦', color:'#888'},
];
const INCOME_CATS = [
  {id:'salary',     label:'Salary',     icon:'💼', color:'#30d158'},
  {id:'freelance',  label:'Freelance',  icon:'💻', color:'#4e9af1'},
  {id:'investment', label:'Investment', icon:'📈', color:'#f5a623'},
  {id:'gift',       label:'Gift',       icon:'🎁', color:'#af52de'},
  {id:'other',      label:'Other',      icon:'💰', color:'#888'},
];

// ─── Voice parser ─────────────────────────────────────────
function parseVoice(raw) {
  const text = raw.toLowerCase();
  const amountMatch = raw.match(/\$?(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
  const type = /earn|receiv|got paid|income|salary|deposit|made/.test(text) ? 'income' : 'expense';
  const catMap = [
    {id:'food',          words:['grocer','food','lunch','dinner','breakfast','restaurant','eat','coffee','pizza','burger','snack','café','cafe','meal']},
    {id:'transport',     words:['uber','lyft','taxi','bus','metro','subway','gas','fuel','parking','toll','train','flight','ride']},
    {id:'bills',         words:['bill','electric','water','internet','wifi','phone bill','utility','rent','netflix','subscri']},
    {id:'shopping',      words:['shop','cloth','amazon','online','store','mall','purchase']},
    {id:'health',        words:['doctor','pharmacy','medicine','gym','health','medical','dentist','hospital','drug']},
    {id:'entertainment', words:['movie','concert','game','spotify','fun','show','ticket','club']},
    {id:'education',     words:['course','book','school','tuition','class','learn','study','udemy']},
    {id:'salary',        words:['salary','paycheck','wage']},
    {id:'freelance',     words:['freelance','project','client','invoice']},
    {id:'investment',    words:['dividend','stock','crypto','interest','invest']},
  ];
  let category = 'other';
  for(const c of catMap) { if(c.words.some(w=>text.includes(w))) { category=c.id; break; } }
  const note = raw.replace(/\$?\d+(?:\.\d{1,2})?\s*(?:dollars?|bucks?|usd)?/gi,'')
    .replace(/\b(spent|paid|bought|received|earned|got|on|for|at|the|a|an|i|my)\b/gi,'')
    .replace(/\s+/g,' ').trim().split(' ').slice(0,3).join(' ');
  return { amount, type, category, note };
}

// ─── Helpers ─────────────────────────────────────────────
const fmt = n => '$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtS = n => Math.abs(n)>=1000 ? '$'+(Math.abs(n)/1000).toFixed(1)+'k' : fmt(n);
const monthName = d => new Date(d).toLocaleString('default',{month:'long',year:'numeric'});
const dayStr = d => new Date(d).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const today = () => new Date().toISOString().split('T')[0];

// ─── Shared components ────────────────────────────────────
function Card({children, style={}}) {
  return <div style={{background:T.card,borderRadius:20,padding:'16px',border:`1px solid ${T.border}`, ...style}}>{children}</div>;
}
function Pill({children, active, color, onPress}) {
  const c = color||T.gold;
  return <button onClick={onPress} style={{padding:'6px 14px',borderRadius:99,border:'none',cursor:'pointer',background:active?c:T.card2,color:active?'#000':T.muted,fontSize:13,fontWeight:600,fontFamily:'-apple-system',transition:'all .18s'}}>{children}</button>;
}

// Donut
function Donut({data,size=110}) {
  const total=data.reduce((s,d)=>s+d.value,0);
  if(!total) return <div style={{width:size,height:size,borderRadius:'50%',background:T.card2,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:T.muted,fontSize:10}}>No data</span></div>;
  const r=44,cx=60,cy=60,sw=14,circ=2*Math.PI*r;
  let off=0;
  const slices=data.map((d,i)=>{
    const pct=d.value/total, dash=circ*pct-2, gap=circ-dash;
    const s=<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={sw} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-off+circ/4} strokeLinecap="butt"/>;
    off+=circ*pct; return s;
  });
  return <svg width={size} height={size} viewBox="0 0 120 120"><circle cx={cx} cy={cy} r={r} fill="none" stroke={T.card2} strokeWidth={sw}/>{slices}</svg>;
}

// Bar chart
function BarChart({weeks,width=330,height=110}) {
  const maxVal=Math.max(...weeks.flatMap(w=>[w.income,w.expense]),1);
  const bw=24,gap=14,left=6;
  return (
    <svg width={width} height={height} style={{overflow:'visible'}}>
      {weeks.map((w,i)=>{
        const x=left+i*(bw*2+gap+10);
        const ih=(w.income/maxVal)*(height-26),eh=(w.expense/maxVal)*(height-26);
        return <g key={i}>
          <rect x={x} y={height-26-ih} width={bw} height={ih||2} rx={5} fill="#30d158" opacity={.85}/>
          <rect x={x+bw+4} y={height-26-eh} width={bw} height={eh||2} rx={5} fill="#ff453a" opacity={.85}/>
          <text x={x+bw} y={height-6} textAnchor="middle" fill={T.muted} fontSize={10} fontFamily="-apple-system">{w.label}</text>
        </g>;
      })}
    </svg>
  );
}

// Line chart
function LineChart({points,width=330,height=75}) {
  if(points.length<2) return null;
  const vals=points.map(p=>p.y), mn=Math.min(...vals), mx=Math.max(...vals), range=mx-mn||1, pad=8;
  const pts=points.map((p,i)=>({x:pad+i*(width-pad*2)/(points.length-1),y:pad+(1-(p.y-mn)/range)*(height-pad*2)}));
  const d=pts.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
  const area=`${d} L${pts[pts.length-1].x},${height} L${pts[0].x},${height} Z`;
  return (
    <svg width={width} height={height}>
      <defs><linearGradient id="glg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={.3}/><stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/></linearGradient></defs>
      <path d={area} fill="url(#glg)"/>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent)"/>)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════
function HomeScreen({transactions, onNav, userName}) {
  const now=new Date();
  const monthTxns=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
  const income=monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense=monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance=transactions.reduce((s,t)=>t.type==='income'?s+t.amount:s-t.amount,0);
  const recent=[...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const upcoming=[...transactions]
    .filter(t=>new Date(t.date)>new Date())
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
    .slice(0,4);
  const hr=now.getHours();
  const greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
  const name=userName||'Friend';

  return (
    <div style={{padding:'0 16px var(--screen-pb,100px)',color:T.text,fontFamily:'-apple-system,system-ui'}}>
      <div style={{paddingTop:'var(--screen-pt,72px)',paddingBottom:8}}>
        <div style={{fontSize:14,color:T.muted,marginBottom:2}}>{greet}, {name} 👋</div>
        <div style={{fontSize:28,fontWeight:700,letterSpacing:-0.5}}>Your Finances</div>
      </div>

      {/* Balance Hero */}
      <Card style={{marginTop:12,background:'linear-gradient(135deg,var(--hero-a),var(--hero-b))',border:'none',padding:'22px 20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'var(--accent-10)'}}/>
        <div style={{fontSize:13,color:T.muted,marginBottom:6}}>Total Balance</div>
        <div style={{fontSize:38,fontWeight:800,letterSpacing:-1,color:balance>=0?T.text:'var(--red)'}}>{balance<0?'-':''}{fmt(balance)}</div>
        <div style={{fontSize:12,color:T.muted,marginTop:4}}>{monthName(now)}</div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
        <Card style={{padding:'14px 16px'}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Income</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--green)'}}>{fmtS(income)}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>This month</div>
        </Card>
        <Card style={{padding:'14px 16px'}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>Expenses</div>
          <div style={{fontSize:20,fontWeight:700,color:'var(--red)'}}>{fmtS(expense)}</div>
          <div style={{fontSize:11,color:T.muted,marginTop:2}}>This month</div>
        </Card>
      </div>

      {/* Quick buttons */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:10,marginTop:10}}>
        <button onClick={()=>onNav(1)} style={{padding:'14px',borderRadius:16,background:'var(--accent)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'-apple-system',fontSize:16,fontWeight:700,color:'#000'}}>
          <span style={{fontSize:20}}>+</span> Add Transaction
        </button>
        <button onClick={()=>onNav(1,'voice')} style={{padding:'14px',borderRadius:16,background:T.card,border:`1px solid var(--accent)`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,fontFamily:'-apple-system',fontSize:14,fontWeight:600,color:'var(--accent)'}}>
          🎤 Voice
        </button>
      </div>

      {/* Recent */}
      {upcoming.length>0&&(
        <div style={{marginTop:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:16,fontWeight:700}}>Upcoming</div>
            <span style={{fontSize:12,color:T.muted}}>Scheduled</span>
          </div>
          <Card style={{padding:'6px 0'}}>
            {upcoming.map((t,i)=>{
              const cats=t.type==='income'?INCOME_CATS:EXPENSE_CATS;
              const cat=cats.find(c=>c.id===t.category)||cats[cats.length-1];
              return (
                <div key={t.id} style={{display:'flex',alignItems:'center',padding:'11px 16px',borderBottom:i<upcoming.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{width:34,height:34,borderRadius:10,background:cat.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,marginRight:10}}>{cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.note||cat.label}</div>
                    <div style={{fontSize:11,color:T.muted}}>{dayStr(t.date)}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:t.type==='income'?'var(--green)':'var(--red)'}}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {recent.length>0?(
        <div style={{marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:16,fontWeight:700}}>Recent</div>
            <button onClick={()=>onNav(3)} style={{background:'none',border:'none',color:'var(--accent)',fontSize:13,cursor:'pointer',fontFamily:'-apple-system'}}>See all</button>
          </div>
          <Card style={{padding:'4px 0'}}>
            {recent.map((t,i)=>{
              const cats=t.type==='income'?INCOME_CATS:EXPENSE_CATS;
              const cat=cats.find(c=>c.id===t.category)||cats[cats.length-1];
              return (
                <div key={t.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:i<recent.length-1?`1px solid ${T.border}`:'none'}}>
                  <div style={{width:38,height:38,borderRadius:12,background:cat.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginRight:12,flexShrink:0}}>{cat.icon}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.note||cat.label}</div>
                    <div style={{fontSize:11,color:T.muted,marginTop:1}}>{dayStr(t.date)}</div>
                  </div>
                  <div style={{fontSize:15,fontWeight:700,color:t.type==='income'?'var(--green)':'var(--red)',marginLeft:8}}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
                </div>
              );
            })}
          </Card>
        </div>
      ):(
        <div style={{textAlign:'center',marginTop:48,color:T.muted}}>
          <div style={{fontSize:40,marginBottom:8}}>💰</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:4}}>No transactions yet</div>
          <div style={{fontSize:13}}>Tap Add Transaction to get started</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ADD SCREEN  (with voice)
// ═══════════════════════════════════════════════════════════
function AddScreen({onSave, startVoice=false}) {
  const [type, setType]   = React.useState('expense');
  const [amount, setAmt]  = React.useState('');
  const [cat, setCat]     = React.useState('');
  const [note, setNote]   = React.useState('');
  const [date, setDate]   = React.useState(today());
  const [notifyChannels, setNotifyChannels] = React.useState({push:true,email:false,sms:false});
  const [saved, setSaved] = React.useState(false);
  const [voiceState, setVS] = React.useState(startVoice?'idle':'off'); // off|idle|listening|result
  const [transcript, setTx] = React.useState('');
  const recRef = React.useRef(null);

  React.useEffect(() => { if(startVoice) setVS('idle'); }, [startVoice]);

  // Voice
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ alert('Voice not supported on this browser. Try Safari or Chrome.'); return; }
    const rec = new SR();
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
    rec.onstart = () => setVS('listening');
    rec.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      setTx(txt);
      const parsed = parseVoice(txt);
      if(parsed.amount) setAmt(String(parsed.amount));
      if(parsed.category) setCat(parsed.category);
      if(parsed.note) setNote(parsed.note);
      setType(parsed.type);
      setVS('result');
    };
    rec.onerror = () => setVS('idle');
    rec.onend = () => { if(voiceState==='listening') setVS('idle'); };
    recRef.current = rec;
    rec.start();
  };

  const stopListening = () => { recRef.current?.stop(); setVS('idle'); };

  const handleSave = () => {
    const n=parseFloat(amount);
    if(!n||n<=0||!cat) return;
    onSave({id:Date.now(),type,amount:n,category:cat||'other',note:note.trim(),date,notifyChannels});
    setAmt(''); setCat(''); setNote(''); setDate(today()); setTx(''); setVS(startVoice?'idle':'off');
    setNotifyChannels({push:true,email:false,sms:false});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const numPad = (v) => {
    if(v==='del'){setAmt(a=>a.slice(0,-1));return;}
    if(v==='.'&&amount.includes('.')) return;
    if(amount.length>=10) return;
    setAmt(a=>a+v==='.'?'0.':a+v);
  };

  const cats = type==='income'?INCOME_CATS:EXPENSE_CATS;
  const numKeys=[['7','8','9'],['4','5','6'],['1','2','3'],['.',  '0','del']];

  return (
    <div style={{color:T.text,fontFamily:'-apple-system,system-ui',height:'100%',display:'flex',flexDirection:'column',overflowY:'auto'}}>
      <div style={{padding:'72px 20px 0'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontSize:26,fontWeight:700,letterSpacing:-0.5}}>Add Transaction</div>
          {/* Voice toggle */}
          <button onClick={()=>voiceState==='off'?setVS('idle'):setVS('off')} style={{
            padding:'7px 14px',borderRadius:99,border:`1px solid ${voiceState!=='off'?'var(--accent)':T.border}`,
            background:voiceState!=='off'?T.a10:'transparent',color:voiceState!=='off'?'var(--accent)':T.muted,
            cursor:'pointer',fontFamily:'-apple-system',fontSize:13,fontWeight:600,
          }}>🎤 Voice</button>
        </div>

        {/* Voice UI */}
        {voiceState!=='off'&&(
          <div style={{background:T.card,borderRadius:16,padding:'14px',marginBottom:14,border:`1px solid ${T.border}`}}>
            {voiceState==='idle'&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:13,color:T.muted,marginBottom:10}}>Say something like:<br/><span style={{color:T.text,fontWeight:600}}>"Grocery $50 spent"</span> or <span style={{color:T.text,fontWeight:600}}>"Salary $3000 received"</span></div>
                <button onClick={startListening} style={{padding:'10px 24px',borderRadius:12,background:'var(--accent)',border:'none',cursor:'pointer',fontFamily:'-apple-system',fontSize:14,fontWeight:700,color:'#000'}}>🎤 Tap to Speak</button>
              </div>
            )}
            {voiceState==='listening'&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:6,animation:'pulse 1s infinite'}}>🎤</div>
                <div style={{fontSize:14,color:'var(--accent)',fontWeight:600}}>Listening…</div>
                <button onClick={stopListening} style={{marginTop:8,padding:'6px 16px',borderRadius:10,background:'var(--red)',border:'none',cursor:'pointer',fontFamily:'-apple-system',fontSize:12,fontWeight:600,color:'#fff'}}>Stop</button>
              </div>
            )}
            {voiceState==='result'&&(
              <div>
                <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Heard:</div>
                <div style={{fontSize:13,color:T.text,fontStyle:'italic',marginBottom:8}}>"{transcript}"</div>
                <div style={{fontSize:12,color:'var(--green)'}}>✓ Entry auto-filled — review below</div>
              </div>
            )}
          </div>
        )}

        {/* Type toggle */}
        <div style={{display:'flex',background:T.card2,borderRadius:14,padding:4,gap:4}}>
          {['expense','income'].map(tp=>(
            <button key={tp} onClick={()=>{setType(tp);setCat('');}} style={{flex:1,padding:'10px',borderRadius:10,border:'none',cursor:'pointer',background:type===tp?(tp==='income'?'#30d158':'#ff453a'):'transparent',color:type===tp?'#fff':T.muted,fontSize:15,fontWeight:700,fontFamily:'-apple-system',transition:'all .18s',textTransform:'capitalize'}}>{tp}</button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div style={{textAlign:'center',padding:'14px 20px 6px'}}>
        <div style={{fontSize:amount.length>8?34:46,fontWeight:800,letterSpacing:-1,color:amount?(type==='income'?'var(--green)':'var(--red)'):'var(--muted2)',minHeight:56,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {amount?`$${parseFloat(amount||0).toLocaleString('en-US',{minimumFractionDigits:amount.includes('.')?Math.min(amount.split('.')[1]?.length||0,2):0})}`:'$0.00'}
        </div>
      </div>

      {/* Numpad */}
      <div style={{padding:'0 20px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        {numKeys.flat().map(k=>(
          <button key={k} onClick={()=>numPad(k)} style={{height:50,borderRadius:14,border:`1px solid ${T.border}`,background:k==='del'?T.card2:T.card,color:T.text,fontSize:k==='del'?18:22,fontWeight:600,cursor:'pointer',fontFamily:'-apple-system',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform .1s'}}>
            {k==='del'?'⌫':k}
          </button>
        ))}
      </div>

      {/* Category */}
      <div style={{padding:'10px 20px 0'}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:.5}}>Category</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
          {cats.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{padding:'8px 4px',borderRadius:12,border:`1px solid ${cat===c.id?c.color:T.border}`,background:cat===c.id?c.color+'22':T.card,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,transition:'all .15s'}}>
              <span style={{fontSize:18}}>{c.icon}</span>
              <span style={{fontSize:10,color:cat===c.id?c.color:T.muted,fontFamily:'-apple-system',fontWeight:600}}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note + Date */}
      <div style={{padding:'10px 20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div style={{background:T.card,borderRadius:12,padding:'10px 12px',border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Note</div>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional" style={{background:'none',border:'none',color:T.text,fontSize:14,fontFamily:'-apple-system',width:'100%',outline:'none'}}/>
        </div>
        <div style={{background:T.card,borderRadius:12,padding:'10px 12px',border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:4}}>Date</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{background:'none',border:'none',color:T.text,fontSize:13,fontFamily:'-apple-system',width:'100%',outline:'none',colorScheme:'dark'}}/>
        </div>
      </div>

      <div style={{padding:'0 20px 8px'}}>
        <div style={{background:T.card,borderRadius:12,padding:'10px 12px',border:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,color:T.muted,marginBottom:7}}>Notify me (for upcoming transactions)</div>
          <div style={{display:'flex',gap:8}}>
            {['push','email','sms'].map(ch=>(
              <button
                key={ch}
                onClick={()=>setNotifyChannels(prev=>({...prev,[ch]:!prev[ch]}))}
                style={{
                  padding:'6px 10px',borderRadius:10,border:`1px solid ${notifyChannels[ch]?'var(--accent)':T.border}`,
                  background:notifyChannels[ch]?'var(--accent-10)':T.card2,color:notifyChannels[ch]?'var(--accent)':T.muted,
                  fontSize:12,fontWeight:600,cursor:'pointer'
                }}
              >
                {notifyChannels[ch]?'✓ ':''}{ch.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:'4px 20px 100px'}}>
        <button onClick={handleSave} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',cursor:'pointer',background:saved?'#30d158':(!amount||!cat?T.card2:'var(--accent)'),color:saved?'#fff':(!amount||!cat?T.muted:'#000'),fontSize:16,fontWeight:700,fontFamily:'-apple-system',transition:'all .2s'}}>
          {saved?'✓ Saved!':'Save Transaction'}
        </button>
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PORTFOLIO SCREEN
// ═══════════════════════════════════════════════════════════
function PortfolioScreen({transactions}) {
  const now=new Date();
  const [vm,setVm]=React.useState(now.getMonth());
  const [vy,setVy]=React.useState(now.getFullYear());
  const nav=(d)=>{let m=vm+d,y=vy;if(m<0){m=11;y--;}if(m>11){m=0;y++;}setVm(m);setVy(y);};
  const mTxns=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===vm&&d.getFullYear()===vy;});
  const income=mTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense=mTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const weeks=['W1','W2','W3','W4'].map((label,wi)=>{
    const w=mTxns.filter(t=>Math.floor((new Date(t.date).getDate()-1)/7)===wi);
    return {label,income:w.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),expense:w.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)};
  });
  const catBreak=EXPENSE_CATS.map(c=>({label:c.label,color:c.color,value:mTxns.filter(t=>t.type==='expense'&&t.category===c.id).reduce((s,t)=>s+t.amount,0)})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);
  const dim=new Date(vy,vm+1,0).getDate(), fd=new Date(vy,vm,1).getDay();
  const dayData=Array.from({length:dim},(_,i)=>{
    const day=i+1,dt=mTxns.filter(t=>new Date(t.date).getDate()===day);
    const inc=dt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp=dt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    return {day,inc,exp,net:inc-exp,has:dt.length>0};
  });
  const sorted=[...mTxns].sort((a,b)=>new Date(a.date)-new Date(b.date));
  let run=0;
  const runPts=sorted.map(t=>{run+=t.type==='income'?t.amount:-t.amount;return {y:run};});
  if(runPts.length>0) runPts.unshift({y:0});
  const ml=new Date(vy,vm,1).toLocaleString('default',{month:'long',year:'numeric'});

  return (
    <div style={{color:T.text,fontFamily:'-apple-system,system-ui',padding:'0 16px var(--screen-pb,100px)'}}>
      <div style={{paddingTop:'var(--screen-pt,72px)',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:26,fontWeight:700,letterSpacing:-0.5}}>Portfolio</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>nav(-1)} style={{background:T.card,border:`1px solid ${T.border}`,color:T.text,width:30,height:30,borderRadius:9,cursor:'pointer',fontSize:14}}>‹</button>
          <div style={{fontSize:12,color:T.muted,minWidth:88,textAlign:'center'}}>{ml}</div>
          <button onClick={()=>nav(1)} style={{background:T.card,border:`1px solid ${T.border}`,color:T.text,width:30,height:30,borderRadius:9,cursor:'pointer',fontSize:14}}>›</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
        {[{label:'Income',val:income,color:'var(--green)'},{label:'Expense',val:expense,color:'var(--red)'},{label:'Net',val:income-expense,color:(income-expense)>=0?'var(--green)':'var(--red)'}].map(s=>(
          <Card key={s.label} style={{padding:'10px 12px',textAlign:'center'}}>
            <div style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:14,fontWeight:700,color:s.color}}>{fmtS(s.val)}</div>
          </Card>
        ))}
      </div>
      <Card style={{marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10,display:'flex',gap:14,alignItems:'center'}}>
          Weekly Overview <span style={{color:'var(--green)',fontSize:11}}>● Income</span><span style={{color:'var(--red)',fontSize:11}}>● Expense</span>
        </div>
        <BarChart weeks={weeks} width={330} height={108}/>
      </Card>
      {catBreak.length>0&&(
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Expense Breakdown</div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <Donut data={catBreak} size={100}/>
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
              {catBreak.slice(0,5).map(c=>(
                <div key={c.label} style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:8,height:8,borderRadius:2,background:c.color,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:12,color:T.muted}}>{c.label}</div>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--red)'}}>{fmtS(c.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      {runPts.length>1&&(
        <Card style={{marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Running Balance</div>
          <LineChart points={runPts} width={330} height={70}/>
        </Card>
      )}
      <Card>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Day-by-Day</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,textAlign:'center'}}>
          {['S','M','T','W','T','F','S'].map((d,i)=><div key={i} style={{fontSize:10,color:T.muted,padding:'2px 0'}}>{d}</div>)}
          {Array.from({length:fd}).map((_,i)=><div key={'e'+i}/>)}
          {dayData.map(d=>(
            <div key={d.day} style={{aspectRatio:'1',borderRadius:7,fontSize:10,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',background:!d.has?'transparent':d.net>=0?T.g20:T.r20,color:!d.has?T.muted2:d.net>=0?'var(--green)':'var(--red)',border:d.day===now.getDate()&&vm===now.getMonth()&&vy===now.getFullYear()?`1px solid var(--accent)`:'1px solid transparent'}}>
              {d.day}
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:12,marginTop:8,justifyContent:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:T.muted}}><div style={{width:8,height:8,borderRadius:2,background:'rgba(48,209,88,0.3)'}}/>Income</div>
          <div style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:T.muted}}><div style={{width:8,height:8,borderRadius:2,background:'rgba(255,68,58,0.3)'}}/>Expense</div>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HISTORY SCREEN
// ═══════════════════════════════════════════════════════════
function HistoryScreen({transactions, onDelete, onEdit}) {
  const [filter,setFilter]=React.useState('all');
  const [swipedId,setSwipedId]=React.useState(null);
  const [editing,setEditing]=React.useState(null);
  const [dragStartX,setDragStartX]=React.useState(null);
  const filtered=transactions.filter(t=>filter==='all'||t.type===filter);
  const sorted=[...filtered].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const groups=[];
  sorted.forEach(t=>{const last=groups[groups.length-1];if(last&&last.date===t.date)last.items.push(t);else groups.push({date:t.date,items:[t]});});

  const startEdit=(t)=>setEditing({...t});
  const saveEdit=()=>{
    if(!editing?.amount || editing.amount<=0) return;
    onEdit(editing.id,{...editing,amount:parseFloat(editing.amount)});
    setEditing(null);
  };
  const swipeStart=(e,id)=>{
    const x=e.touches?.[0]?.clientX ?? e.clientX;
    setDragStartX(x);
    setSwipedId(id);
  };
  const swipeEnd=(e,id)=>{
    const x=e.changedTouches?.[0]?.clientX ?? e.clientX;
    if(dragStartX===null) return;
    const delta=x-dragStartX;
    setSwipedId(delta<-30?id:null);
    setDragStartX(null);
  };

  return (
    <div style={{color:T.text,fontFamily:'-apple-system,system-ui',padding:'0 16px var(--screen-pb,100px)'}}>
      <div style={{paddingTop:'var(--screen-pt,72px)',marginBottom:14}}>
        <div style={{fontSize:26,fontWeight:700,letterSpacing:-0.5,marginBottom:12}}>History</div>
        <div style={{display:'flex',gap:8}}>
          {['all','income','expense'].map(f=>(
            <Pill key={f} active={filter===f} onPress={()=>setFilter(f)} color={f==='income'?'#30d158':f==='expense'?'#ff453a':undefined}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </Pill>
          ))}
        </div>
      </div>
      {groups.length===0&&<div style={{textAlign:'center',marginTop:60,color:T.muted}}><div style={{fontSize:36,marginBottom:8}}>📋</div><div>No transactions found</div></div>}
      {groups.map(g=>(
        <div key={g.date} style={{marginBottom:16}}>
          <div style={{fontSize:12,color:T.muted,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>{dayStr(g.date)}</div>
          <Card style={{padding:'4px 0',overflow:'hidden'}}>
            {g.items.map((t,i)=>{
              const cats=t.type==='income'?INCOME_CATS:EXPENSE_CATS;
              const cat=cats.find(c=>c.id===t.category)||cats[cats.length-1];
              return (
                <div key={t.id} style={{position:'relative',borderBottom:i<g.items.length-1?`1px solid ${T.border}`:'none',background:T.card}}>
                  <div style={{position:'absolute',right:0,top:0,bottom:0,display:'flex',alignItems:'center',gap:8,padding:'0 10px'}}>
                    <button onClick={()=>startEdit(t)} style={{border:'none',borderRadius:10,padding:'8px 10px',background:'var(--accent-10)',color:'var(--accent)',fontSize:11,fontWeight:700,cursor:'pointer'}}>Edit</button>
                    <button onClick={()=>onDelete(t.id)} style={{border:'none',borderRadius:10,padding:'8px 10px',background:'rgba(255,69,58,.16)',color:'var(--red)',fontSize:11,fontWeight:700,cursor:'pointer'}}>Delete</button>
                  </div>
                  <div
                    onTouchStart={(e)=>swipeStart(e,t.id)}
                    onTouchEnd={(e)=>swipeEnd(e,t.id)}
                    style={{display:'flex',alignItems:'center',padding:'12px 14px',transform:swipedId===t.id?'translateX(-116px)':'translateX(0)',transition:'transform .2s',position:'relative',zIndex:1,background:T.card}}
                  >
                    <div style={{width:36,height:36,borderRadius:11,background:cat.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,marginRight:10,flexShrink:0}}>{cat.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.note||cat.label}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:1}}>{cat.label} · {dayStr(t.date)}</div>
                    </div>
                    <div style={{fontSize:15,fontWeight:700,color:t.type==='income'?'var(--green)':'var(--red)'}}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</div>
                    <button onClick={()=>startEdit(t)} style={{marginLeft:8,border:'none',background:'transparent',color:'var(--accent)',fontSize:12,fontWeight:700,cursor:'pointer'}}>Edit</button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      ))}

      {editing&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'flex-end',zIndex:1200}}>
          <div style={{width:'100%',background:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:'16px 16px calc(env(safe-area-inset-bottom) + 18px)',borderTop:`1px solid ${T.border}`}}>
            <div style={{width:42,height:4,borderRadius:99,background:T.muted2,margin:'0 auto 12px'}}/>
            <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>Edit transaction</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <input value={editing.note||''} onChange={e=>setEditing(p=>({...p,note:e.target.value}))} placeholder="Note" style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:'10px',color:T.text}}/>
              <input type="number" value={editing.amount} onChange={e=>setEditing(p=>({...p,amount:e.target.value}))} placeholder="Amount" style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:'10px',color:T.text}}/>
              <input type="date" value={editing.date} onChange={e=>setEditing(p=>({...p,date:e.target.value}))} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:'10px',color:T.text,colorScheme:'dark'}}/>
              <select value={editing.category} onChange={e=>setEditing(p=>({...p,category:e.target.value}))} style={{background:T.card2,border:`1px solid ${T.border}`,borderRadius:10,padding:'10px',color:T.text}}>
                {(editing.type==='income'?INCOME_CATS:EXPENSE_CATS).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div style={{marginTop:10}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:6}}>Type</div>
              <div style={{display:'flex',gap:8}}>
                {['expense','income'].map(tp=>(
                  <button key={tp} onClick={()=>setEditing(p=>({...p,type:tp,category:''}))} style={{flex:1,padding:'9px',borderRadius:10,border:`1px solid ${editing.type===tp?(tp==='income'?'#30d158':'#ff453a'):T.border}`,background:editing.type===tp?(tp==='income'?'rgba(48,209,88,.16)':'rgba(255,69,58,.16)'):T.card2,color:editing.type===tp?(tp==='income'?'#30d158':'#ff6b6b'):T.muted,cursor:'pointer',textTransform:'capitalize',fontWeight:600}}>{tp}</button>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
              <button onClick={()=>setEditing(null)} style={{padding:'11px',borderRadius:12,border:`1px solid ${T.border}`,background:T.card2,color:T.text,cursor:'pointer'}}>Cancel</button>
              <button onClick={saveEdit} style={{padding:'11px',borderRadius:12,border:'none',background:'var(--accent)',color:'#000',fontWeight:700,cursor:'pointer'}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {HomeScreen, AddScreen, PortfolioScreen, HistoryScreen, parseVoice, EXPENSE_CATS, INCOME_CATS, fmt, fmtS, dayStr, monthName, T});
