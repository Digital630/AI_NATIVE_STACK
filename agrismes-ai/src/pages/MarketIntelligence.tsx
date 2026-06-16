import { useState, useEffect } from "react";
import { track } from "../lib/track";
import { TrendingUp, TrendingDown, Minus, Lock, ChevronDown } from "lucide-react";

const SB_URL = "https://pttcugqwslvdstmrbyhu.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dGN1Z3F3c2x2ZHN0bXJieWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTg2NTgsImV4cCI6MjA5MjY3NDY1OH0.aMk9ZIzC9wQ1fWEK2itSlQ3qoQaOQJUTm7TDSwvbpaY";

const KERNELS = [
  { grade: "W180", price: 8200, chg: 200, note: "Premium whole, tight supply" },
  { grade: "W240", price: 7100, chg: 150, note: "Most traded grade" },
  { grade: "W320", price: 6200, chg: 80, note: "Benchmark grade" },
  { grade: "W450", price: 5400, chg: -50, note: "Lower grade" },
  { grade: "SWP Borma", price: 4800, chg: -80, note: "Semi-peeled snack grade" },
  { grade: "LWP", price: 4200, chg: -60, note: "Large white pieces" },
  { grade: "Pieces", price: 3600, chg: -40, note: "Snack sector demand" },
];

const RCN_AFRICA = [
  { origin: "Tanzania", price: 2980, chg: 120, src: "TCB Auction", note: "TANECU Tandahimba 2025/26" },
  { origin: "Ivory Coast", price: 690, chg: -45, src: "CCA Official", note: "Farmgate 400 CFA/kg" },
  { origin: "Benin", price: 820, chg: 30, src: "ACA", note: "High KOR 48-52 lbs" },
  { origin: "Guinea-Bissau", price: 750, chg: -20, src: "ACA", note: "West Africa benchmark" },
  { origin: "Ghana", price: 1040, chg: -180, src: "TCDA", note: "Floor price 12 GHS/kg" },
  { origin: "Mozambique", price: 810, chg: 0, src: "ACA", note: "East Africa alternative" },
];

const RCN_ASIA = [
  { origin: "India", price: 900, chg: 40, src: "VINACAS", note: "Domestic ~0.78M MT" },
  { origin: "Vietnam", price: 1444, chg: 85, src: "VINACAS", note: "Import up 132% YoY" },
  { origin: "Brazil", price: 1650, chg: 60, src: "Industry", note: "Premium Ceara state" },
  { origin: "Cambodia", price: 700, chg: -30, src: "Industry", note: "Emerging origin" },
];

const FREIGHT = [
  { route: "Mtwara to Rotterdam", price: 95, chg: 5, note: "Q2 2026" },
  { route: "Dar es Salaam to Rotterdam", price: 102, chg: 8, note: "Q2 2026" },
  { route: "Abidjan to Rotterdam", price: 65, chg: -3, note: "West Africa benchmark" },
  { route: "Nhava Sheva to Rotterdam", price: 55, chg: 2, note: "India route" },
  { route: "Ho Chi Minh to Rotterdam", price: 62, chg: 4, note: "Vietnam route" },
  { route: "Mtwara to Dubai", price: 78, chg: 3, note: "Middle East" },
  { route: "Abidjan to Ho Chi Minh", price: 45, chg: -2, note: "West Africa to Vietnam" },
];

const TABS = ["KERNELS", "RCN", "FREIGHT"];

function ChangeTag({ value }: { value: number }) {
  if (value === 0) return <span style={{fontSize:11,color:"#6b7280",display:"flex",alignItems:"center",gap:4}}><Minus size={10}/>Stable</span>;
  const positive = value > 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return <span style={{fontSize:11,fontWeight:600,color:positive?"#10b981":"#f87171",display:"flex",alignItems:"center",gap:4}}><Icon size={10}/>{positive?"+":""}{value}/MT</span>;
}

function PriceItem({ label, sublabel, note, change, price, last }: { label:string; sublabel?:string; note?:string; change:number; price:number; last?:boolean }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:last?"none":"1px solid rgba(255,255,255,0.04)"}}>
      <div style={{flex:1,paddingRight:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" as const}}>
          <span style={{fontSize:13,fontWeight:600,color:"#f1f5f9"}}>{label}</span>
          {sublabel && <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10b981",fontWeight:700}}>{sublabel}</span>}
        </div>
        {note && <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{note}</div>}
        <ChangeTag value={change}/>
      </div>
      <div style={{textAlign:"right" as const}}>
        <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>${price.toLocaleString()}</div>
        <div style={{fontSize:10,color:"#475569",textTransform:"uppercase" as const,letterSpacing:0.8}}>USD/MT</div>
      </div>

    </div>
  );
}

function Section({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.5,color:"#475569",marginBottom:8}}>{title}</div>
      <div style={{borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)",overflow:"hidden"}}>{children}</div>
    </div>
  );
}

function InfoCard({ color, title, text }: { color:"green"|"amber"|"red"; title:string; text:string }) {
  const styles = {
    green:{border:"rgba(16,185,129,0.2)",bg:"rgba(16,185,129,0.05)",accent:"#10b981"},
    amber:{border:"rgba(251,191,36,0.2)",bg:"rgba(251,191,36,0.05)",accent:"#fbbf24"},
    red:{border:"rgba(239,68,68,0.2)",bg:"rgba(239,68,68,0.05)",accent:"#ef4444"},
  }[color];
  return (
    <div style={{borderRadius:10,border:"1px solid "+styles.border,background:styles.bg,padding:"14px 16px",marginTop:12}}>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:1.2,color:styles.accent,marginBottom:8}}>{title}</div>
      <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,margin:0}}>{text}</p>
    </div>
  );
}

function AlertItem({ alertData }: { alertData: any }) {
  const [open, setOpen] = useState(false);
  const levelStyles: any = {
    critical:{border:"rgba(239,68,68,0.3)",bg:"rgba(239,68,68,0.08)",dot:"#ef4444",text:"#fca5a5",label:"#ef4444"},
    warning:{border:"rgba(251,191,36,0.3)",bg:"rgba(251,191,36,0.08)",dot:"#fbbf24",text:"#fde68a",label:"#fbbf24"},
    info:{border:"rgba(59,130,246,0.3)",bg:"rgba(59,130,246,0.08)",dot:"#3b82f6",text:"#bfdbfe",label:"#3b82f6"},
  };
  const levelStyle = levelStyles[alertData.level] || levelStyles.info;
  return (
    <div onClick={()=>setOpen(!open)} style={{borderRadius:10,border:"1px solid "+levelStyle.border,background:levelStyle.bg,padding:"12px 14px",cursor:"pointer",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:levelStyle.dot,display:"inline-block"}}/>
          <span style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:0.8,color:levelStyle.label}}>{alertData.title}</span>
        </div>
        <ChevronDown size={14} style={{color:levelStyle.label,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}/>
      </div>
      {open && (
        <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+levelStyle.border}}>
          <p style={{fontSize:12,color:levelStyle.text,lineHeight:1.65,margin:0}}>{alertData.body}</p>
        </div>
      )}
    </div>
  );
}

function ProGateBlock({ label, sub, onUpgrade }: { label:string; sub:string; onUpgrade?:()=>void }) {
  return (
    <div style={{borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",padding:20,textAlign:"center" as const,background:"rgba(255,255,255,0.02)",marginTop:12}}>
      <Lock size={18} style={{color:"#475569",margin:"0 auto 10px",display:"block"}}/>
      <p style={{fontSize:13,fontWeight:600,color:"#cbd5e1",marginBottom:6}}>{label}</p>
      <p style={{fontSize:11,color:"#64748b",marginBottom:14}}>{sub}</p>
      <button onClick={onUpgrade} style={{fontSize:12,fontWeight:600,color:"#10b981",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Upgrade to Pro</button>
    </div>
  );
}

export default function MarketIntelligence({ session, onUpgradeRequest }: { session: any; onUpgradeRequest?: () => void }) {
  const [activeTab, setActiveTab] = useState("KERNELS");
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [liveRoutes, setLiveRoutes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const isLoggedIn = !!session;

  useEffect(() => {
    track("market_prices_view", { user_id: session && session.user ? session.user.id : undefined, email: session && session.user ? session.user.email : undefined, page: "/market" });
    fetch(SB_URL + "/functions/v1/fetch-freight-intelligence?type=all", { headers: { apikey: ANON } })
      .then(function(resp) { return resp.json(); })
      .then(function(data) {
        if (data.success) {
          setLiveAlerts(data.alerts || []);
          setLiveRoutes(data.routes || []);
        }
        setLoaded(true);
      })
      .catch(function() { setLoaded(true); });
  }, []);

  const freightRoutes = liveRoutes.length > 0
    ? liveRoutes.map(function(item: any) { return { route: item.route, price: item.price_usd_mt, chg: item.change_usd_mt, note: item.season_note }; })
    : FREIGHT;

  return (
    <div style={{minHeight:"100vh",background:"#070d14",color:"#f1f5f9"}}>
      <style>{`
        .mktab{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;cursor:pointer;padding:8px 18px;font-size:12px;font-weight:600;color:#64748b;transition:all 0.15s;margin-right:8px}
        .mktab:hover{color:#94a3b8;background:rgba(255,255,255,0.07)}
        .mktab-active{color:#10b981;background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3)}
      `}</style>

      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(7,13,20,0.96)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:760,margin:"0 auto",padding:"20px 24px 0"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:18}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase" as const,color:"#475569"}}>AgriSMES</span>
                <span style={{width:3,height:3,borderRadius:"50%",background:"#334155",display:"inline-block"}}/>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase" as const,color:"#10b981"}}>Market Intelligence</span>
              </div>
              <button onClick={function(){window.location.href="/";}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"#94a3b8",fontSize:12,fontWeight:600,padding:"5px 12px",cursor:"pointer",marginBottom:10,display:"inline-block"}}>← Back to Analyser</button>
              <h1 style={{fontSize:22,fontWeight:800,color:"#f1f5f9",margin:0,letterSpacing:-0.5}}>Global Cashew Prices</h1>
              <p style={{fontSize:11,color:"#475569",margin:"4px 0 0"}}>RCN · Kernels · Freight · June 2026</p>
            </div>
            <div style={{textAlign:"right" as const,flexShrink:0}}>
              <div style={{fontSize:9,color:"#334155",textTransform:"uppercase" as const,letterSpacing:1}}>Sources</div>
              <div style={{fontSize:11,fontWeight:600,color:"#94a3b8"}}>TCB · ACA · VINACAS</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:-1}}>
            {TABS.map(function(tabName) {
              return (
                <button
                  key={tabName}
                  onClick={function() { setActiveTab(tabName); var evt = tabName === "KERNELS" ? "kernel_tab_view" : tabName === "RCN" ? "rcn_tab_view" : "freight_tab_view"; track(evt, { user_id: session && session.user ? session.user.id : undefined, email: session && session.user ? session.user.email : undefined, page: "/market" }); }}
                  className={"mktab" + (activeTab === tabName ? " mktab-active" : "")}
                >
                  {tabName === "KERNELS" ? "Kernels" : tabName === "RCN" ? "RCN by Origin" : "Freight"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{maxWidth:760,margin:"0 auto",padding:"24px 24px 80px"}}>

        {activeTab === "KERNELS" && (
          <div>
            <p style={{fontSize:11,color:"#475569",marginBottom:20}}>Rotterdam FOB equivalent · June 2026</p>
            <Section title="White Whole Kernels">
              {KERNELS.filter(function(k){return k.grade.startsWith("W");}).map(function(k,idx,arr){
                return <PriceItem key={k.grade} label={k.grade} note={k.note} change={k.chg} price={k.price} last={idx===arr.length-1}/>;
              })}
            </Section>
            <Section title="Semi-Peeled and Pieces">
              {KERNELS.filter(function(k){return !k.grade.startsWith("W");}).map(function(k,idx,arr){
               return <PriceItem key={k.grade} label={k.grade} note={k.note} change={k.chg} price={k.price} last={idx===arr.length-1}/>;
              })}
            </Section>
            <InfoCard color="green" title="Grade Spread Intelligence" text="W180-W320 spread is $2,000/MT. Processors achieving consistent W180 outturn earn 32% premium over W320 benchmark. SWP Borma growing at 5% CAGR driven by snack industry demand."/>
          </div>
        )}

        {activeTab === "RCN" && (
          <div>
            <p style={{fontSize:11,color:"#475569",marginBottom:20}}>Farmgate / FOB by origin · Season 2025/26</p>
            <Section title="Africa — 65% of Global Supply">
              {RCN_AFRICA.map(function(r,idx,arr){
                return <PriceItem key={r.origin} label={r.origin} sublabel={r.src} note={r.note} change={r.chg} price={r.price} last={idx===arr.length-1}/>;
              })}
            </Section>
            <Section title="Asia and Latin America">
              {RCN_ASIA.map(function(r,idx,arr){
                return <PriceItem key={r.origin} label={r.origin} sublabel={r.src} note={r.note} change={r.chg} price={r.price} last={idx===arr.length-1}/>;
              })}
            </Section>
            <InfoCard color="amber" title="Origin Intelligence June 2026" text="Ivory Coast 2026 farmgate down 6% YoY. Vietnam imported 2.95M MT RCN YTD up 132% YoY. Tanzania 2026 crop stable, partial offset to West African tightness."/>
            {!isLoggedIn && <ProGateBlock label="12-Month Price History by Origin" sub="Track RCN price movements across all origins. Pro plan only." onUpgrade={function(){ track("pro_gate_hit", { user_id: session && session.user ? session.user.id : undefined, email: session && session.user ? session.user.email : undefined, page: "/market" }); if(onUpgradeRequest) onUpgradeRequest(); }}/>}
          </div>
        )}

        {activeTab === "FREIGHT" && (
          <div>
            <p style={{fontSize:11,color:"#475569",marginBottom:20}}>Container rates per MT · 20ft · Q2 2026</p>
            {loaded && liveAlerts.length > 0 && (
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpang:1.5,color:"#475569",marginBottom:10}}>Live Intelligence Alerts</div>
                {liveAlerts.map(function(alertItem:any, idx:number){ return <AlertItem key={idx} alertData={alertItem}/>; })}
              </div>
            )}
            <Section title="Global Cashew Trade Routes">
              {freightRoutes.map(function(f:any,idx:number,arr:any[]){
                return <PriceItem key={f.route} label={f.route} note={f.note} change={f.chg} price={f.price} last={idx===arr.length-1}/>;
              })}
            </Section>
            <InfoCard color="red" title="Seasonal Freight Risk" text="Q1 rates typically 15-20% higher than Q3. Q4 container shortage adds 15-25% surcharge. Tanzania exporters booking Q1 should model freight at $110-125/MT to Rotterdam."/>
            {!isLoggedIn && <ProGateBlock label="Freight Route Price Alerts" sub="Get notified when freight rates cross your threshold. Pro plan only." onUpgrade={function(){ track("pro_gate_hit", { user_id: session && session.user ? session.user.id : undefined, email: session && session.user ? session.user.email : undefined, page: "/market" }); if(onUpgradeRequest) onUpgradeRequest(); }}/>}
          </div>
        )}

        <div style={{marginTop:40,paddingTop:20,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
          <p style={{fontSize:10,color:"#334155",lineHeight:1.7}}>Prices are indicative. Sources: TCB, ACA, VINACAS, CCA. Not financial advice. Verify before committing capital.</p>
        </div>
      </div>

      {session && (
        <div style={{position:"fixed",bottom:20,left:20,zIndex:100}}>
          {accountOpen && (
            <div style={{position:"absolute",bottom:52,left:0,background:"#0f172a",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"10px 6px",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",minWidth:210}}>
              <div style={{padding:"6px 12px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:4}}>
                <div style={{fontSize:9,color:"#475569",textTransform:"uppercase" as const,letterSpacing:0.8,marginBottom:2}}>Signed in as</div>
                <div style={{fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{session.user?.email}</div>
              </div>
              <a href="/" style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,color:"#94a3b8",textDecoration:"none",fontSize:13,fontWeight:500}}>🔍 New Analysis</a>
              <a href="/history" style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,color:"#10b981",textDecoration:"none",fontSize:13,fontWeight:500}}>📋 History</a>
              <a href="/market" style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,color:"#fbbf24",textDecoration:"none",fontSize:13,fontWeight:500}}>📈 Market Prices</a>
              <button onClick={async function(){const m=await import("../lib/supabase");await m.supabase.auth.signOut();window.location.href="/";}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 12px",borderRadius:8,border:"none",background:"none",color:"#f87171",fontSize:13,fontWeight:500,cursor:"pointer"}}>🚪 Sign Out</button>
            </div>
          )}
          <button onClick={()=>setAccountOpen(!accountOpen)} aria-label="Account menu" style={{
            width:40,height:40,borderRadius:"50%",background:"#1e293b",border:"2px solid rgba(255,255,255,0.12)",
            color:"#94a3b8",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",
            justifyContent:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          }}>
            {(session.user?.email || "?").charAt(0).toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
