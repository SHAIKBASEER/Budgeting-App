
// budget-settings.jsx — Settings, Notifications, Theme, Export, Share

const THEMES = [
  {id:'dark',   name:'Midnight', bg:'#0d0d12', card:'#1a1a24', card2:'#22222e', text:'#f0f0f8', muted:'#7878a0', muted2:'#4a4a6a', accent:'#f5a623', heroA:'#1e1a2e', heroB:'#1a1a28', isDark:true},
  {id:'navy',   name:'Deep Navy',bg:'#050f1e', card:'#0d1e35', card2:'#102540', text:'#e8f0ff', muted:'#6080aa', muted2:'#3a5070', accent:'#4e9af1', heroA:'#0d1e35', heroB:'#0a1828', isDark:true},
  {id:'forest', name:'Forest',   bg:'#07100a', card:'#102018', card2:'#162a1e', text:'#e0f0e8', muted:'#60906a', muted2:'#3a6044', accent:'#30d158', heroA:'#102018', heroB:'#0c1c14', isDark:true},
  {id:'cosmos', name:'Cosmos',   bg:'#0e0814', card:'#1a1028', card2:'#221535', text:'#f0e8ff', muted:'#9070b0', muted2:'#604880', accent:'#af52de', heroA:'#1a1028', heroB:'#150c22', isDark:true},
  {id:'ember',  name:'Ember',    bg:'#120a05', card:'#221408', card2:'#2e1c0e', text:'#fff0e8', muted:'#a08060', muted2:'#704030', accent:'#ff6b35', heroA:'#221408', heroB:'#1c1005', isDark:true},
  {id:'light',  name:'Minimal',  bg:'#f2f2f7', card:'#ffffff', card2:'#f0f0f5', text:'#1c1c1e', muted:'#8e8ea0', muted2:'#c0c0d0', accent:'#f5a623', heroA:'#ffffff', heroB:'#f5f5fa', isDark:false},
];

const REMINDER_TIMES = ['6:00 AM','9:00 AM','12:00 PM','3:00 PM','6:00 PM','9:00 PM'];

function SettingsScreen({profile, onProfileChange, onThemeChange, currentTheme, transactions, onResetData}) {
  const [section, setSection] = React.useState('profile'); // profile|notifications|theme|export
  const [notifEnabled, setNE] = React.useState(()=>JSON.parse(localStorage.getItem('notif_en')||'{"push":true,"email":true,"sms":false}'));
  const [activeReminders, setAR] = React.useState(()=>JSON.parse(localStorage.getItem('notif_times')||JSON.stringify(REMINDER_TIMES)));
  const [testSent, setTS] = React.useState('');
  const [shareMsg, setShareMsg] = React.useState('');
  const [notifMsg, setNotifMsg] = React.useState('');
  const [lastTest, setLastTest] = React.useState('');

  const saveNE = (v) => { setNE(v); localStorage.setItem('notif_en',JSON.stringify(v)); };
  const toggleTime = (t) => {
    const next = activeReminders.includes(t)?activeReminders.filter(r=>r!==t):[...activeReminders,t];
    setAR(next); localStorage.setItem('notif_times',JSON.stringify(next));
  };

  const Toggle = ({on, onToggle, color='var(--accent)'}) => (
    <div onClick={onToggle} style={{width:44,height:26,borderRadius:13,background:on?color:'var(--muted2)',position:'relative',cursor:'pointer',transition:'background .2s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:on?20:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,.3)'}}/>
    </div>
  );

  const showToast = (msg) => {
    setNotifMsg(msg);
    setTimeout(()=>setNotifMsg(''),2800);
  };

  const sendTestNotification = async (channel) => {
    const stamp = new Date().toLocaleTimeString();
    if(channel==='push'){
      if(!('Notification' in window)){
        alert('Push notifications are not supported in this browser. Simulated test sent.');
        showToast('Simulated push test sent.');
        setLastTest(`Push test simulated at ${stamp}`);
        return;
      }
      let permission = Notification.permission;
      if(permission==='default'){
        permission = await Notification.requestPermission();
      }
      if(permission!=='granted'){
        alert('Push permission is blocked. Simulated push test sent instead.');
        showToast('Push permission blocked — simulated test sent.');
        setLastTest(`Push test simulated at ${stamp}`);
        return;
      }
      new Notification('Budget App Reminder', {
        body: 'This is a test reminder from your Budget app.',
        tag: 'budget-test-reminder',
      });
      showToast('Push test sent.');
      setLastTest(`Push test sent at ${stamp}`);
      return;
    }

    if(channel==='email'){
      if(!profile.email){
        alert('Add an email in Profile first.');
        return;
      }
      const subject = encodeURIComponent('Budget App Test Reminder');
      const body = encodeURIComponent('This is a test reminder from your Budget app.');
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      showToast('Opened your mail app for test email.');
      setLastTest(`Email draft opened at ${stamp}`);
      return;
    }

    if(channel==='sms'){
      if(!profile.phone){
        alert('Add a phone number in Profile first.');
        return;
      }
      const body = encodeURIComponent('Budget App test reminder');
      window.location.href = `sms:${profile.phone}?body=${body}`;
      showToast('Opened messaging app for test SMS.');
      setLastTest(`SMS draft opened at ${stamp}`);
    }
  };

  // ── PDF Export ──────────────────────────────────────────
  const exportPDF = () => {
    const now = new Date();
    const monthTxns = transactions.filter(t=>{
      const d=new Date(t.date);
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    });
    const income  = monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense = monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const balance = transactions.reduce((s,t)=>t.type==='income'?s+t.amount:s-t.amount,0);
    const sorted  = [...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));

    const rows = sorted.slice(0,50).map(t=>`
      <tr>
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td>${t.note||t.category}</td>
        <td style="color:${t.type==='income'?'#30d158':'#ff453a'};font-weight:600">${t.type==='income'?'+':'-'}${fmt(t.amount)}</td>
        <td style="text-transform:capitalize">${t.category}</td>
      </tr>`).join('');

    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Budget Report — ${profile.name||'My Budget'}</title>
    <style>body{font-family:-apple-system,Helvetica,sans-serif;padding:40px;color:#1c1c1e;background:#fff}
    h1{font-size:28px;margin-bottom:4px}h2{font-size:16px;color:#888;font-weight:400;margin-bottom:32px}
    .summary{display:flex;gap:24px;margin-bottom:32px}.box{background:#f5f5fa;border-radius:12px;padding:16px 20px;min-width:120px}
    .box .label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}
    .box .val{font-size:22px;font-weight:700}
    table{width:100%;border-collapse:collapse}th{background:#f5f5fa;text-align:left;padding:10px 12px;font-size:13px;color:#888}
    td{padding:10px 12px;border-bottom:1px solid #eee;font-size:14px}
    .footer{margin-top:32px;font-size:12px;color:#aaa;text-align:center}</style></head>
    <body>
    <h1>Budget Report</h1>
    <h2>${profile.name||''}${profile.name?' · ':''}${now.toLocaleString('default',{month:'long',year:'numeric'})}</h2>
    <div class="summary">
      <div class="box"><div class="label">Balance</div><div class="val" style="color:${balance>=0?'#1c1c1e':'#ff453a'}">${balance<0?'-':''}${fmt(balance)}</div></div>
      <div class="box"><div class="label">Income</div><div class="val" style="color:#30d158">${fmt(income)}</div></div>
      <div class="box"><div class="label">Expenses</div><div class="val" style="color:#ff453a">${fmt(expense)}</div></div>
    </div>
    <table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Category</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer">Generated ${new Date().toLocaleString()} · Budget App</div>
    <script>window.onload=()=>window.print();</script>
    </body></html>`;

    const win=window.open('','_blank');
    win.document.write(html);
    win.document.close();
  };

  // ── Share ───────────────────────────────────────────────
  const shareReport = async () => {
    const now=new Date();
    const monthTxns=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();});
    const income=monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const expense=monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const text=`📊 ${profile.name||'My'} Budget — ${now.toLocaleString('default',{month:'long',year:'numeric'})}\n💚 Income: ${fmt(income)}\n❤️ Expenses: ${fmt(expense)}\n💰 Net: ${income-expense>=0?'+':''}${fmt(income-expense)}`;
    if(navigator.share){
      try{ await navigator.share({title:'Budget Report',text}); return; }catch(e){}
    }
    await navigator.clipboard.writeText(text);
    setShareMsg('Copied to clipboard!');
    setTimeout(()=>setShareMsg(''),2500);
  };

  const navPills = [
    {id:'profile',      icon:'👤', label:'Profile'},
    {id:'notifications',icon:'🔔', label:'Alerts'},
    {id:'theme',        icon:'🎨', label:'Theme'},
    {id:'export',       icon:'📤', label:'Export'},
  ];

  return (
    <div style={{color:'var(--text)',fontFamily:'-apple-system,system-ui',padding:'0 16px 100px'}}>
      <div style={{paddingTop:72,marginBottom:16}}>
        <div style={{fontSize:26,fontWeight:700,letterSpacing:-0.5}}>Settings</div>
      </div>

      {/* Section nav */}
      <div style={{display:'flex',gap:8,marginBottom:16,overflowX:'auto',paddingBottom:4}}>
        {navPills.map(p=>(
          <button key={p.id} onClick={()=>setSection(p.id)} style={{
            padding:'8px 14px',borderRadius:99,border:`1px solid ${section===p.id?'var(--accent)':'var(--border)'}`,
            background:section===p.id?'var(--accent-10)':'transparent',
            color:section===p.id?'var(--accent)':'var(--muted)',
            cursor:'pointer',fontFamily:'-apple-system',fontSize:13,fontWeight:600,
            whiteSpace:'nowrap',flexShrink:0,transition:'all .15s',
          }}>{p.icon} {p.label}</button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {section==='profile'&&(
        <div>
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:'var(--accent-10)',border:'2px solid var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 10px'}}>
              {profile.name?profile.name.charAt(0).toUpperCase():'👤'}
            </div>
            <div style={{fontSize:18,fontWeight:700}}>{profile.name||'Add your name'}</div>
          </div>

          {[
            {key:'name',   label:'Full Name',    icon:'👤', placeholder:'Your name',           type:'text'},
            {key:'email',  label:'Email',         icon:'📧', placeholder:'shaikabd@cua.edu',    type:'email'},
            {key:'phone',  label:'Phone Number',  icon:'📱', placeholder:'+1 (202) 555-0100',   type:'tel'},
          ].map(f=>(
            <div key={f.key} style={{background:'var(--card)',borderRadius:14,padding:'12px 16px',border:'1px solid var(--border)',marginBottom:10}}>
              <div style={{fontSize:11,color:'var(--muted)',marginBottom:6,textTransform:'uppercase',letterSpacing:.5}}>{f.icon} {f.label}</div>
              <input
                value={profile[f.key]||''} type={f.type}
                onChange={e=>onProfileChange({...profile,[f.key]:e.target.value})}
                placeholder={f.placeholder}
                style={{background:'none',border:'none',color:'var(--text)',fontSize:16,fontFamily:'-apple-system',width:'100%',outline:'none'}}
              />
            </div>
          ))}

          <div style={{background:'var(--card)',borderRadius:14,padding:'14px 16px',border:'1px solid var(--border)',marginTop:4}}>
            <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>💰 Budget Goal (monthly)</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18,color:'var(--accent)',fontWeight:700}}>$</span>
              <input value={profile.goal||''} type="number" onChange={e=>onProfileChange({...profile,goal:e.target.value})} placeholder="e.g. 2000"
                style={{background:'none',border:'none',color:'var(--text)',fontSize:20,fontFamily:'-apple-system',flex:1,outline:'none',fontWeight:700}}/>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {section==='notifications'&&(
        <div>
          <div style={{background:'var(--card)',borderRadius:20,padding:'4px 0',border:'1px solid var(--border)',marginBottom:12}}>
            <div style={{padding:'12px 16px 4px',fontSize:12,color:'var(--muted)',textTransform:'uppercase',letterSpacing:.5}}>Channels</div>
            {[
              {key:'push',  icon:'📱', label:'Push Notifications', sub:`Banner + badge on iPhone`},
              {key:'email', icon:'📧', label:'Email Reminders',    sub:profile.email||'Set email in Profile'},
              {key:'sms',   icon:'💬', label:'SMS Reminders',      sub:profile.phone||'Set phone in Profile'},
            ].map((ch,i)=>(
              <div key={ch.key} style={{display:'flex',alignItems:'center',padding:'13px 16px',borderBottom:i<2?'1px solid var(--border)':'none'}}>
                <div style={{width:36,height:36,borderRadius:10,background:'var(--card2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginRight:12,flexShrink:0}}>{ch.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>{ch.label}</div>
                  <div style={{fontSize:12,color:'var(--muted)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:180}}>{ch.sub}</div>
                </div>
                <Toggle on={notifEnabled[ch.key]} onToggle={()=>saveNE({...notifEnabled,[ch.key]:!notifEnabled[ch.key]})}/>
              </div>
            ))}
          </div>

          <div style={{background:'var(--card)',borderRadius:20,padding:'14px 16px',border:'1px solid var(--border)',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Reminder Schedule</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:10}}>Every 3 hours · 6 AM – 9 PM daily</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {REMINDER_TIMES.map(t=>{
                const on=activeReminders.includes(t);
                return (
                  <button key={t} onClick={()=>toggleTime(t)} style={{padding:'10px 14px',borderRadius:12,border:`1px solid ${on?'var(--accent)':'var(--border)'}`,background:on?'var(--accent-10)':'transparent',color:on?'var(--accent)':'var(--muted)',cursor:'pointer',fontFamily:'-apple-system',fontSize:14,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all .15s'}}>
                    <span>{t}</span>{on&&<span style={{fontSize:12}}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test buttons */}
          <div style={{background:'var(--card)',borderRadius:20,padding:'14px 16px',border:'1px solid var(--border)'}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Send Test Reminder</div>
            <div style={{display:'flex',gap:8}}>
              {[{key:'push',label:'Push',icon:'📱'},{key:'email',label:'Email',icon:'📧'},{key:'sms',label:'SMS',icon:'💬'}].map(ch=>(
                <button key={ch.key} onClick={async ()=>{ await sendTestNotification(ch.key); setTS(ch.key); setTimeout(()=>setTS(''),2500); }} style={{flex:1,padding:'10px 4px',borderRadius:12,border:'1px solid var(--border)',background:testSent===ch.key?'var(--accent-10)':'var(--card2)',color:testSent===ch.key?'var(--accent)':'var(--muted)',cursor:'pointer',fontFamily:'-apple-system',fontSize:12,fontWeight:600,transition:'all .2s'}}>
                  {testSent===ch.key?'✓ Sent':`${ch.icon} ${ch.label}`}
                </button>
              ))}
            </div>
            {testSent&&<div style={{marginTop:8,fontSize:12,color:'var(--accent)',textAlign:'center'}}>Test reminder triggered.</div>}
            {notifMsg&&<div style={{marginTop:6,fontSize:12,color:'var(--muted)',textAlign:'center'}}>{notifMsg}</div>}
            {lastTest&&<div style={{marginTop:6,fontSize:11,color:'var(--muted2)',textAlign:'center'}}>Last test: {lastTest}</div>}
          </div>

          <div style={{background:'var(--card)',borderRadius:20,padding:'14px 16px',border:'1px solid var(--border)',marginTop:12}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Upcoming transaction alerts</div>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>
              Any future transaction created in Add screen can include Push / Email / SMS flags.
              Use those per-transaction toggles to control reminder channels.
            </div>
          </div>
        </div>
      )}

      {/* ── THEME ── */}
      {section==='theme'&&(
        <div>
          <div style={{fontSize:13,color:'var(--muted)',marginBottom:12}}>Choose your app look</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {THEMES.map(th=>{
              const active=currentTheme.id===th.id;
              return (
                <button key={th.id} onClick={()=>onThemeChange(th)} style={{
                  borderRadius:18,overflow:'hidden',border:`2px solid ${active?'var(--accent)':'transparent'}`,
                  cursor:'pointer',padding:0,position:'relative',
                  boxShadow:active?'0 0 0 3px var(--accent-20)':'none',
                  transition:'all .2s',background:'none',
                }}>
                  {/* Preview swatch */}
                  <div style={{background:th.bg,padding:'14px 14px 10px'}}>
                    <div style={{background:th.card,borderRadius:10,padding:'10px 12px',marginBottom:6}}>
                      <div style={{fontSize:10,color:th.muted,marginBottom:3}}>Balance</div>
                      <div style={{fontSize:16,fontWeight:800,color:th.text}}>$4,330</div>
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      <div style={{flex:1,background:th.card2,borderRadius:7,padding:'5px 6px'}}>
                        <div style={{fontSize:9,color:th.accent,fontWeight:700}}>+$3,200</div>
                      </div>
                      <div style={{flex:1,background:th.card2,borderRadius:7,padding:'5px 6px'}}>
                        <div style={{fontSize:9,color:'#ff453a',fontWeight:700}}>-$870</div>
                      </div>
                    </div>
                  </div>
                  <div style={{background:th.card,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:600,color:th.text}}>{th.name}</span>
                    {active&&<span style={{fontSize:12,color:th.accent}}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── EXPORT ── */}
      {section==='export'&&(
        <div>
          {[
            {
              icon:'📄', title:'Export as PDF',
              desc:'Full transaction report with charts, printable from your browser',
              action: exportPDF, btnLabel:'Generate PDF', btnColor:'var(--accent)',
            },
            {
              icon:'📤', title:'Share Summary',
              desc:'Share a quick text summary of this month with friends or family',
              action: shareReport, btnLabel: shareMsg||'Share Now', btnColor:'#4e9af1',
            },
          ].map((item,i)=>(
            <div key={i} style={{background:'var(--card)',borderRadius:20,padding:'18px',border:'1px solid var(--border)',marginBottom:12}}>
              <div style={{fontSize:30,marginBottom:8}}>{item.icon}</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{item.title}</div>
              <div style={{fontSize:13,color:'var(--muted)',marginBottom:14,lineHeight:1.5}}>{item.desc}</div>
              <button onClick={item.action} style={{
                width:'100%',padding:'12px',borderRadius:14,border:'none',cursor:'pointer',
                background:item.btnColor,color:'#fff',
                fontSize:15,fontWeight:700,fontFamily:'-apple-system',
              }}>{item.btnLabel}</button>
            </div>
          ))}

          {/* Stats card */}
          <div style={{background:'var(--card)',borderRadius:20,padding:'18px',border:'1px solid var(--border)'}}>
            <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>📊 Quick Stats</div>
            {[
              {label:'Total Transactions', val:transactions.length},
              {label:'Total Income', val:fmt(transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0))},
              {label:'Total Expenses', val:fmt(transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0))},
              {label:'Net Balance', val:fmt(transactions.reduce((s,t)=>t.type==='income'?s+t.amount:s-t.amount,0))},
            ].map(s=>(
              <div key={s.label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:13,color:'var(--muted)'}}>{s.label}</span>
                <span style={{fontSize:13,fontWeight:700}}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Always visible reset area so it's easy to find */}
      <div style={{marginTop:14,background:'var(--card)',borderRadius:16,padding:'14px 16px',border:'1px solid rgba(255,69,58,.25)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'#ff6b6b',marginBottom:6}}>Danger Zone</div>
        <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.45,marginBottom:10}}>Reset button clears transactions, profile, theme, and reminder preferences.</div>
        <button
          onClick={()=>{
            if(window.confirm('Reset all app data? This cannot be undone.')) onResetData?.();
          }}
          style={{width:'100%',padding:'11px',borderRadius:12,border:'1px solid rgba(255,69,58,.45)',background:'rgba(255,69,58,.12)',color:'#ff453a',fontSize:13,fontWeight:700,cursor:'pointer'}}
        >
          Reset App Data
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {SettingsScreen, THEMES});
