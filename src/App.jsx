import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const FINNHUB_KEY = "d8fddt9r01qn4439e52gd8fddt9r01qn4439e530";
const STORAGE_KEY = "ws-broker-v3";
const ALERTS_KEY = "ws-alerts-v3";

const WATCHLIST = [
  { ticker:"NVDA", fhTicker:"NVDA", name:"Nvidia", type:"US Stock", currency:"USD", verdict:"STRONG BUY", targetLow:100, targetHigh:220, sector:"Semiconductors / AI", price6mAgo:"$110–130", what:"Nvidia designs GPUs that power every major AI model — ChatGPT, Gemini, Claude all run on Nvidia hardware. They don't manufacture chips themselves; TSMC does that for them.", moat:"The CUDA software ecosystem is Nvidia's true moat. Developers have spent 15+ years writing AI code in CUDA. Switching to a competitor means rewriting millions of lines of code — nearly impossible at scale.", vsCompetitors:"AMD makes competitive GPUs but lacks CUDA's ecosystem. Intel is years behind. Google and Amazon build custom chips but only for internal use. No competitor has both the hardware AND the software lock-in Nvidia has.", obstacles:"Custom AI chips from Google, Amazon, and Microsoft could reduce Nvidia dependence. US export restrictions to China cut off a major revenue stream. High valuation means any earnings miss = sharp drop.", keyStats:{"P/E":"~45x","Revenue FY26E":"$130B+","Revenue Growth":"+63% YoY","Market Cap":"~$3.3T"} },
  { ticker:"MU", fhTicker:"MU", name:"Micron Technology", type:"US Stock", currency:"USD", verdict:"STRONG BUY", targetLow:130, targetHigh:220, sector:"Memory / AI", price6mAgo:"$85–110", what:"Micron makes DRAM and NAND flash memory chips — the RAM inside your phone, laptop, and AI servers. Their HBM chips are critical components inside Nvidia's AI GPUs.", moat:"Only 3 companies in the world can make advanced memory at scale: Micron (US), Samsung and SK Hynix (Korea). That oligopoly is the moat. Micron has sold out its entire 2026 HBM capacity.", vsCompetitors:"Samsung and SK Hynix are larger, but Micron is the only US-based advanced memory maker — giving it geopolitical importance and government backing.", obstacles:"Memory is a cyclical commodity — prices crash during supply gluts. Samsung could flood the market. China exposure is a geopolitical risk.", keyStats:{"P/E":"~12x forward","Revenue FY26E":"~$38B","Revenue Growth":"+111% YoY","Market Cap":"~$220B"} },
  { ticker:"AVGO", fhTicker:"AVGO", name:"Broadcom", type:"US Stock", currency:"USD", verdict:"STRONG BUY", targetLow:380, targetHigh:500, sector:"AI Chips / Infrastructure", price6mAgo:"$185–220", what:"Broadcom designs custom AI chips (ASICs) for hyperscalers like Google and Meta, plus networking chips that connect AI servers. They also own VMware, the enterprise software giant.", moat:"Custom ASIC relationships with Google and Meta are multi-year, multi-billion dollar contracts. Once a hyperscaler builds AI infrastructure around Broadcom's chips, they can't easily switch.", vsCompetitors:"Marvell also makes custom AI chips but is much smaller. The combination of chips + networking + software is unique. CFRA target: $428.", obstacles:"Heavy customer concentration — Google and Meta together are a huge chunk of revenue. VMware integration costs ongoing. High valuation leaves little room for error.", keyStats:{"P/E":"~35x","Revenue FY26E":"~$67B","Revenue Growth":"+64% YoY","Market Cap":"~$1.9T"} },
  { ticker:"AMZN", fhTicker:"AMZN", name:"Amazon", type:"US Stock", currency:"USD", verdict:"BUY", targetLow:180, targetHigh:280, sector:"Cloud / E-commerce / AI", price6mAgo:"$185–210", what:"Amazon has three engines: AWS (cloud computing #1 globally), a massive e-commerce marketplace, and a fast-growing advertising business. AWS alone generates most of the profits.", moat:"AWS has ~31% cloud market share with thousands of enterprise customers deeply integrated. Switching cloud providers is a multi-year, expensive process. Prime membership creates a loyalty flywheel.", vsCompetitors:"Microsoft Azure and Google Cloud are serious rivals. But AWS has the deepest service catalogue and longest enterprise relationships. Amazon's logistics network is nearly impossible to replicate.", obstacles:"Antitrust scrutiny globally is a real risk. AWS growth could slow as enterprises diversify cloud. Labour costs and union pressure are rising.", keyStats:{"P/E":"~38x","Revenue FY26E":"~$680B","Revenue Growth":"+12% YoY","Market Cap":"~$2.2T"} },
  { ticker:"META", fhTicker:"META", name:"Meta Platforms", type:"US Stock", currency:"USD", verdict:"BUY", targetLow:550, targetHigh:800, sector:"Social Media / AI / AR", price6mAgo:"$550–620", what:"Meta owns Facebook, Instagram, WhatsApp, and Threads — used by 3.2 billion people daily. Revenue is almost entirely digital advertising. They're also building AI (Llama) and AR glasses.", moat:"Network effects — 3+ billion daily users is an insurmountable lead. Advertisers have no choice but to be on Meta's platforms. WhatsApp monetisation is just starting.", vsCompetitors:"TikTok is the biggest threat with younger users. Google dominates search ads but Meta dominates social ads. No competitor has Meta's breadth across multiple social platforms.", obstacles:"TikTok continues stealing younger demographics. EU data law regulatory risk. Reality Labs is burning billions annually. Advertiser boycotts over content moderation.", keyStats:{"P/E":"~28x","Revenue FY26E":"~$175B","Revenue Growth":"+17% YoY","Market Cap":"~$1.6T"} },
  { ticker:"GOOGL", fhTicker:"GOOGL", name:"Alphabet / Google", type:"US Stock", currency:"USD", verdict:"BUY", targetLow:155, targetHigh:230, sector:"Search / Cloud / AI / Waymo", price6mAgo:"$165–185", what:"Alphabet owns Google Search (90%+ global market share), YouTube, Google Cloud (#3 globally), Android, and Waymo (robotaxi). Search advertising is the main cash engine.", moat:"Google Search is so dominant it became a verb. 90% of global searches. YouTube is the world's largest video platform. Waymo has a massive autonomous driving lead — years ahead of competitors.", vsCompetitors:"Microsoft Bing with AI is a genuine threat to search for the first time in 20 years. But Google's AI capabilities (Gemini) are world-class and being embedded across all products.", obstacles:"AI-powered search (ChatGPT, Perplexity) threatens Google's core business model. DOJ antitrust case could force structural changes. Cloud still trails AWS and Azure significantly.", keyStats:{"P/E":"~22x","Revenue FY26E":"~$380B","Revenue Growth":"+13% YoY","Market Cap":"~$2.1T"} },
  { ticker:"PLTR", fhTicker:"PLTR", name:"Palantir Technologies", type:"US Stock", currency:"USD", verdict:"WATCH", targetLow:80, targetHigh:200, sector:"AI / Defence / Government", price6mAgo:"$75–95", what:"Palantir builds AI-powered data analytics platforms for governments and large enterprises. Their products — Gotham (government), Foundry (enterprise), and AIP (AI platform) — handle massive datasets.", moat:"Deep government relationships (CIA, US Army, NHS) built over 20 years are nearly impossible to displace. No competitor has both classified government clearance AND enterprise AI capability.", vsCompetitors:"No direct competitor has Palantir's government clearance depth. IBM and Booz Allen compete in government analytics but Palantir's AI is ahead.", obstacles:"Extremely high valuation — priced for perfection. Controversial leadership creates ESG headwinds. Government contracts can be slow and unpredictable.", keyStats:{"P/E":"~200x+","Revenue FY26E":"~$3.5B","Revenue Growth":"+35% YoY","Market Cap":"~$400B"} },
  { ticker:"NVO", fhTicker:"NVO", name:"Novo Nordisk", type:"US Stock", currency:"USD", verdict:"BUY DIP", targetLow:55, targetHigh:100, sector:"Pharma / GLP-1 / Obesity", price6mAgo:"$95–115", what:"Novo Nordisk makes Ozempic and Wegovy — the world's leading GLP-1 drugs for diabetes and obesity. They've been making insulin for 100 years and are the dominant global diabetes care company.", moat:"20+ years of GLP-1 manufacturing experience. Building factories to produce semaglutide at scale takes years and billions. Brand recognition for Ozempic is massive globally.", vsCompetitors:"Eli Lilly's Mounjaro/Zepbound is gaining market share aggressively. But Novo's manufacturing scale is still the biggest advantage globally.", obstacles:"Eli Lilly is winning the GLP-1 race short-term. US drug price negotiations could compress margins. The stock fell 36% in 12 months — sentiment very negative, creating opportunity.", keyStats:{"P/E":"~18x","Revenue FY26E":"~$45B","Revenue Growth":"+15% YoY","Market Cap":"~$300B"} },
  { ticker:"MELI", fhTicker:"MELI", name:"MercadoLibre", type:"US Stock", currency:"USD", verdict:"BUY", targetLow:1800, targetHigh:2800, sector:"E-commerce / Fintech / LatAm", price6mAgo:"$1900–2100", what:"MercadoLibre is Latin America's Amazon + PayPal combined. They run the largest e-commerce marketplace and the fastest-growing fintech platform (Mercado Pago) across Brazil, Mexico, Argentina.", moat:"Network effects across both marketplace and payments create a flywheel. 650 million people in LatAm are becoming middle class and online. First-mover advantage in a massive underserved market.", vsCompetitors:"Amazon is expanding in LatAm but struggles with logistics. None have MercadoLibre's integrated ecosystem. Local banks are the real fintech competition but they're slow to innovate.", obstacles:"Currency risk — revenues in Brazilian Real and Mexican Peso but reported in USD. Political instability in Argentina. Amazon's LatAm push is accelerating.", keyStats:{"P/E":"~55x","Revenue FY26E":"~$24B","Revenue Growth":"+28% YoY","Market Cap":"~$95B"} },
  { ticker:"VKTX", fhTicker:"VKTX", name:"Viking Therapeutics", type:"US Stock", currency:"USD", verdict:"SPECULATIVE", targetLow:40, targetHigh:150, sector:"Biotech / GLP-1 Oral", price6mAgo:"$25–45", what:"Viking is developing an oral GLP-1 weight loss drug — a pill instead of an injection. If successful, this would disrupt the obesity drug market dominated by Novo Nordisk and Eli Lilly's injectable drugs.", moat:"If their oral GLP-1 works in Phase 3, first-mover advantage in oral obesity treatment could be massive. Oral delivery is the holy grail — most patients prefer pills over weekly injections.", vsCompetitors:"Novo Nordisk and Eli Lilly are both developing oral versions too. Pfizer tried and failed. Viking's Phase 2 data was impressive — efficacy comparable to injectables.", obstacles:"Phase 3 trials could fail — biotech is brutal. Even if successful, manufacturing scale-up takes years. Binary bet — great data = rockets; bad data = crashes 50-70%.", keyStats:{"P/E":"Not profitable","Revenue":"Pre-revenue","Stage":"Phase 3 trials","Market Cap":"~$6B"} },
  { ticker:"OCBC", fhTicker:"SGX:O39", name:"OCBC Bank", type:"SG Stock", currency:"SGD", verdict:"STRONG BUY", targetLow:14, targetHigh:19, sector:"Banking / Wealth Management", price6mAgo:"S$14–16", what:"OCBC is Singapore's second largest bank with operations across Southeast Asia, China, and Hong Kong. They're a major wealth management player through Bank of Singapore.", moat:"Decades of trust, regulatory moat (MAS-licensed), and deep corporate relationships across ASEAN. Wealth management is high-margin and sticky. Net profit S$7.42B FY2025.", vsCompetitors:"DBS is larger and more digitally aggressive. UOB focuses on ASEAN retail. OCBC's differentiation is wealth management strength and Greater China exposure via Wing Hang Bank.", obstacles:"Net interest margins will compress as interest rates fall. China property market exposure is a risk. Slower loan growth as economy cools.", keyStats:{"P/E":"~10x","Revenue FY25":"S$14.6B","Revenue Growth":"+1% YoY","Dividend Yield":"~5%"} },
  { ticker:"DBS", fhTicker:"SGX:D05", name:"DBS Group", type:"SG Stock", currency:"SGD", verdict:"BUY", targetLow:38, targetHigh:52, sector:"Banking / Digital / ASEAN", price6mAgo:"S$40–44", what:"DBS is Southeast Asia's largest bank and consistently ranked among the world's best digital banks. Operations span Singapore, Hong Kong, China, India, Indonesia, and Taiwan.", moat:"DBS has transformed from a traditional bank into a technology company that happens to have a banking licence. Dominant market position in Singapore across mortgages, SME lending, and wealth.", vsCompetitors:"OCBC and UOB are strong but less digitally advanced. Regional banks like CIMB and Maybank can't match DBS's digital infrastructure. The digital moat is widening, not narrowing.", obstacles:"Rate cuts will pressure net interest margins. Greater China exposure is a risk. High ROE means less room for improvement.", keyStats:{"P/E":"~11x","Revenue FY25E":"~S$22B","Revenue Growth":"+8% YoY","Dividend Yield":"~4.5%"} },
  { ticker:"iFAST", fhTicker:"SGX:AIY", name:"iFAST Corporation", type:"SG Stock", currency:"SGD", verdict:"STRONG BUY", targetLow:7, targetHigh:12, sector:"Fintech / Wealth Platform", price6mAgo:"S$6.50–8.00", what:"iFAST runs a digital wealth management platform across Singapore, Hong Kong, Malaysia, China, and the UK. They won the UK ePension administration contract — a huge 10-year revenue stream.", moat:"B2B platform network effects — financial advisors and banks using iFAST bring their clients. The UK ePension contract processes billions in pension assets. Hard to replicate.", vsCompetitors:"Endowus and StashAway target retail investors. But iFAST is a B2B infrastructure play — they power other financial companies. That's a fundamentally stickier business.", obstacles:"UK ePension contract execution risk — delays or cost overruns could disappoint. Competition in digital wealth is intensifying. Revenue still lumpy as UK contract ramps up.", keyStats:{"P/E":"~55x","Revenue FY26E":"~S$350M","Revenue Growth":"+25% YoY","Market Cap":"~S$3B"} },
  { ticker:"CDG", fhTicker:"SGX:C52", name:"ComfortDelGro", type:"SG Stock", currency:"SGD", verdict:"BUY", targetLow:1.30, targetHigh:2.00, sector:"Transport / Mobility", price6mAgo:"S$1.35–1.55", what:"ComfortDelGro is one of the world's largest land transport companies — taxis, buses, and trains across Singapore, Australia, UK, and China. They operate over 38,000 vehicles globally.", moat:"Government-regulated transport contracts in Singapore provide stable, predictable revenue. Regulated public transport is a space Grab can't enter. Intrinsic value estimated 61% above current price.", vsCompetitors:"Grab dominates ride-hailing but doesn't operate buses or trains. In Australia, Transdev and Kinetic compete but CDG has strong existing contracts.", obstacles:"Grab and Gojek continue eating into taxi market share. EV transition requires significant capital. Chinese operations expose them to yuan risk.", keyStats:{"P/E":"~15x","Revenue FY25E":"~S$4.5B","Revenue Growth":"+5% YoY","Dividend Yield":"~4%"} },
  { ticker:"KDCREIT", fhTicker:"SGX:AJBU", name:"Keppel DC REIT", type:"SG REIT", currency:"SGD", verdict:"BUY", targetLow:1.80, targetHigh:2.60, sector:"Data Centres / Digital Infrastructure", price6mAgo:"S$1.70–2.00", what:"Keppel DC REIT owns and operates data centres across Singapore, Europe, and Asia. Every AI model, cloud service, and financial transaction runs through data centres.", moat:"Data centres require massive upfront capital and specialist know-how — high barriers to entry. Long-term leases (10-15 years) with hyperscalers like Microsoft and Google provide stable cash flows.", vsCompetitors:"Digital Core REIT and Mapletree Industrial Trust also own data centres. But Keppel DC has Singapore's data sovereignty advantage — many companies must keep Singapore data here.", obstacles:"Rising interest rates increase borrowing costs for REITs. Power constraints in Singapore limit expansion. Hyperscaler tenants have leverage in lease negotiations.", keyStats:{"P/E":"~25x","Revenue FY25E":"~S$310M","Revenue Growth":"+8% YoY","Dividend Yield":"~4.5%"} },
  { ticker:"NETLINK", fhTicker:"SGX:CJLU", name:"NetLink NBN Trust", type:"SG Stock", currency:"SGD", verdict:"INCOME BUY", targetLow:0.85, targetHigh:1.13, sector:"Telecom Infrastructure / Fibre", price6mAgo:"S$0.87–0.93", what:"NetLink NBN Trust owns Singapore's entire nationwide fibre broadband network. Every ISP in Singapore — Singtel, StarHub, M1 — must pay NetLink to use their network.", moat:"Regulated monopoly. By law, NetLink is the sole owner of Singapore's last-mile fibre infrastructure. No competitor can build a parallel network. Revenue is completely predictable.", vsCompetitors:"There are no real competitors — it's a regulated monopoly. ISPs like Singtel, StarHub, and M1 are actually customers, not competitors. It's Singapore's internet backbone.", obstacles:"As a regulated utility, growth is capped. Dividend payout ratio is high. Rising interest rates make bond-like stocks less attractive. Very limited capital appreciation potential.", keyStats:{"P/E":"~45x","Revenue FY26":"~S$420M","Revenue Growth":"+2% YoY","Dividend Yield":"~5.3%"} },
  { ticker:"VWRA", fhTicker:"LSE:VWRA", name:"Vanguard FTSE All-World", type:"ETF", currency:"USD", verdict:"STRONG BUY", targetLow:170, targetHigh:230, sector:"Global ETF — 3,900+ stocks, 50 countries", price6mAgo:"$155–170", what:"VWRA is a single ETF giving you ownership of 3,900+ companies across 50 countries — Apple, Microsoft, Samsung, Nestlé. It tracks the FTSE All-World Index covering 95%+ of the global investable market.", moat:"This isn't a single company — it IS the world market. You own a slice of every major economy. No single company failure, country crisis, or sector collapse can destroy this.", vsCompetitors:"IWDA (developed markets only), CSPX (US only). VWRA includes emerging markets which IWDA excludes. For a Singapore-based investor, VWRA is the most complete single-fund solution.", obstacles:"Heavy US weighting (~65%) means US market performance dominates. Emerging market volatility drags returns occasionally. Currency risk in SGD terms.", keyStats:{"Expense Ratio":"0.22%","Holdings":"3,900+ stocks","Countries":"50+","12M Return":"+30%"} },
  { ticker:"CSPX", fhTicker:"LSE:CSPX", name:"iShares Core S&P 500", type:"ETF", currency:"USD", verdict:"BUY", targetLow:750, targetHigh:1000, sector:"US S&P 500 ETF — Top 500 US Companies", price6mAgo:"$740–790", what:"CSPX tracks the S&P 500 — the 500 largest US companies. Apple, Microsoft, Nvidia, Amazon, Meta, Google, Berkshire — you own all of them. The S&P 500 has returned ~10% annually for decades.", moat:"The US economy and its dominant corporations are the moat. American companies lead in tech, finance, healthcare, and consumer goods globally. The S&P 500 has recovered from every single crash in history.", vsCompetitors:"VUAA is nearly identical but cheaper per unit. For LSE-listed and Ireland-domiciled (tax-efficient for non-US investors), CSPX and VUAA are the top choices.", obstacles:"100% US exposure — no diversification outside America. High tech concentration (~30% in 5-6 stocks). USD currency risk for SGD investors.", keyStats:{"Expense Ratio":"0.07%","Holdings":"500 US stocks","YTD Return":"~+12%","12M Return":"~+18%"} },
];

const VERDICT_COLORS = { "STRONG BUY":"#00e676","BUY":"#69f0ae","BUY DIP":"#b2ff59","WATCH":"#ffab00","SPECULATIVE":"#ff6d00","INCOME BUY":"#40c4ff","HOLD":"#90a4ae","SELL":"#ff1744" };
const TYPE_COLORS = { "ETF":"#00e676","US Stock":"#29b6f6","SG Stock":"#ff6d00","SG REIT":"#ffab00" };
const PERIODS = [{ label:"1W",days:7,res:"D" },{ label:"1M",days:30,res:"D" },{ label:"3M",days:90,res:"W" },{ label:"6M",days:180,res:"W" },{ label:"1Y",days:365,res:"M" }];

function fmt(n,d=2){ if(n===null||n===undefined||isNaN(n))return "—"; return Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}); }

async function fetchQuote(symbol){
  try{
    const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    const d=await r.json();
    if(d&&d.c&&d.c>0)return{price:d.c,change:d.d,changePct:d.dp,high:d.h,low:d.l,open:d.o,prevClose:d.pc};
    return null;
  }catch{return null;}
}

async function fetchCandles(symbol,days,resolution){
  try{
    const to=Math.floor(Date.now()/1000);
    const from=to-days*86400;
    const r=await fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
    const d=await r.json();
    if(!d||d.s!=="ok"||!d.c)return null;
    return d.t.map((t,i)=>({date:new Date(t*1000).toLocaleDateString("en-SG",{month:"short",day:"numeric"}),price:d.c[i],open:d.o[i],high:d.h[i],low:d.l[i]}));
  }catch{return null;}
}

async function fetchNews(symbol){
  try{
    const today=new Date().toISOString().split("T")[0];
    const from=new Date(Date.now()-7*86400000).toISOString().split("T")[0];
    const r=await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${today}&token=${FINNHUB_KEY}`);
    const d=await r.json();
    return Array.isArray(d)?d.slice(0,5):[];
  }catch{return[];}
}

const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:"#0d1117",border:"1px solid #30363d",borderRadius:8,padding:"8px 12px",fontSize:12}}><div style={{color:"#8b949e",marginBottom:2}}>{label}</div><div style={{fontFamily:"monospace",fontWeight:700,color:"#e6edf3"}}>${fmt(payload[0].value)}</div></div>);
};

export default function App(){
  const [tab,setTab]=useState("market");
  const [quotes,setQuotes]=useState({});
  const [loading,setLoading]=useState(true);
  const [lastUpdate,setLastUpdate]=useState(null);
  const [portfolio,setPortfolio]=useState([]);
  const [alerts,setAlerts]=useState([]);
  const [triggeredAlerts,setTriggeredAlerts]=useState([]);
  const [selectedStock,setSelectedStock]=useState(null);
  const [stockNews,setStockNews]=useState([]);
  const [newsLoading,setNewsLoading]=useState(false);
  const [chartData,setChartData]=useState(null);
  const [chartLoading,setChartLoading]=useState(false);
  const [chartPeriod,setChartPeriod]=useState("1M");
  const [detailTab,setDetailTab]=useState("chart");
  const [filterType,setFilterType]=useState("All");
  const [chatMessages,setChatMessages]=useState([{role:"assistant",text:"👋 I'm your personal Wall Street broker. I have live prices, real charts, and deep research on every stock. Ask me anything — what to buy, when to sell, how to build wealth. Let's go. 💹"}]);
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const [showAddHolding,setShowAddHolding]=useState(false);
  const [showAddAlert,setShowAddAlert]=useState(false);
  const [holdingForm,setHoldingForm]=useState({ticker:"",shares:"",buyPrice:"",currency:"USD"});
  const [alertForm,setAlertForm]=useState({ticker:"",targetPrice:"",direction:"above"});
  const chatEndRef=useRef(null);

  useEffect(()=>{(async()=>{try{const p=await window.storage.get(STORAGE_KEY);if(p?.value)setPortfolio(JSON.parse(p.value));const a=await window.storage.get(ALERTS_KEY);if(a?.value)setAlerts(JSON.parse(a.value));}catch(_){}})();},[]);

  const savePortfolio=async(d)=>{try{await window.storage.set(STORAGE_KEY,JSON.stringify(d));}catch(_){}setPortfolio(d);};
  const saveAlerts=async(d)=>{try{await window.storage.set(ALERTS_KEY,JSON.stringify(d));}catch(_){}setAlerts(d);};

  const fetchAllQuotes=useCallback(async()=>{
    setLoading(true);
    const results={};
    const batch=async(items)=>{await Promise.all(items.map(async s=>{const q=await fetchQuote(s.fhTicker);if(q)results[s.ticker]=q;}));};
    const half=Math.ceil(WATCHLIST.length/2);
    await batch(WATCHLIST.slice(0,half));
    await new Promise(r=>setTimeout(r,600));
    await batch(WATCHLIST.slice(half));
    setQuotes(results);setLastUpdate(new Date());setLoading(false);
    const triggered=[];
    alerts.forEach(a=>{const q=results[a.ticker];if(!q)return;if(a.direction==="above"&&q.price>=a.targetPrice)triggered.push({...a,currentPrice:q.price});if(a.direction==="below"&&q.price<=a.targetPrice)triggered.push({...a,currentPrice:q.price});});
    if(triggered.length>0)setTriggeredAlerts(triggered);
  },[alerts]);

  useEffect(()=>{fetchAllQuotes();},[]);
  useEffect(()=>{const i=setInterval(fetchAllQuotes,60000);return()=>clearInterval(i);},[alerts]);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMessages]);

  useEffect(()=>{
    if(!selectedStock)return;
    const p=PERIODS.find(x=>x.label===chartPeriod);
    if(!p)return;
    (async()=>{
      setChartLoading(true);setChartData(null);
      const data=await fetchCandles(selectedStock.fhTicker,p.days,p.res);
      setChartData(data);setChartLoading(false);
    })();
  },[selectedStock,chartPeriod]);

  const openStock=async(stock)=>{
    setSelectedStock(stock);setDetailTab("chart");setChartPeriod("1M");setTab("detail");
    setNewsLoading(true);const news=await fetchNews(stock.fhTicker);setStockNews(news);setNewsLoading(false);
  };

  const mood=(()=>{
    const vals=Object.values(quotes).filter(q=>q?.changePct!==undefined);
    if(!vals.length)return{mood:"—",color:"#8b949e",up:0,down:0,avg:"0"};
    const up=vals.filter(q=>q.changePct>0).length,down=vals.filter(q=>q.changePct<0).length;
    const avg=vals.reduce((s,q)=>s+q.changePct,0)/vals.length;
    let m="NEUTRAL 😐",c="#ffab00";
    if(avg>0.8){m="BULLISH 🐂";c="#00e676";}else if(avg>0.2){m="SLIGHTLY BULLISH 📈";c="#b2ff59";}else if(avg<-0.8){m="BEARISH 🐻";c="#ff1744";}else if(avg<-0.2){m="SLIGHTLY BEARISH 📉";c="#ff6d00";}
    return{mood:m,color:c,up,down,avg:avg.toFixed(2)};
  })();

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    const userMsg=chatInput.trim();setChatInput("");setChatMessages(prev=>[...prev,{role:"user",text:userMsg}]);setChatLoading(true);
    const mCtx=WATCHLIST.map(s=>{const q=quotes[s.ticker];return q?`${s.ticker}(${s.name}):${s.currency==="SGD"?"S$":"$"}${fmt(q.price)} ${q.changePct>=0?"▲":"▼"}${fmt(Math.abs(q.changePct))}%|${s.verdict}|Target:${s.targetHigh}`:`${s.ticker}:unavailable`;}).join("\n");
    const pCtx=portfolio.length>0?portfolio.map(h=>{const q=quotes[h.ticker];const cur=q?q.price:h.buyPrice;const pnl=((cur-h.buyPrice)/h.buyPrice*100).toFixed(1);return`${h.ticker}:${h.shares}shares@${h.currency}${h.buyPrice},now${h.currency}${fmt(cur)}(${pnl>=0?"+":""}${pnl}%)`;}).join("\n"):"No holdings yet.";
    const rCtx=WATCHLIST.map(s=>`${s.ticker}:${s.what?.slice(0,100)}|Moat:${s.moat?.slice(0,80)}|Risk:${s.obstacles?.slice(0,80)}`).join("\n");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are an elite Wall Street broker — sharp, direct, highly knowledgeable. You advise a first-time investor in Singapore.\n\nLIVE MARKET DATA:\n${mCtx}\n\nCOMPANY RESEARCH:\n${rCtx}\n\nUSER PORTFOLIO:\n${pCtx}\n\nMARKET MOOD: ${mood.mood} (avg ${mood.avg}%, ${mood.up} up, ${mood.down} down)\n\nBe direct. Give real actionable advice. Reference live prices. Keep it punchy — 3-4 paragraphs max. End with one clear action. Educational only, not licensed financial advice.`,messages:[{role:"user",content:userMsg}]})});
      const data=await res.json();
      setChatMessages(prev=>[...prev,{role:"assistant",text:data.content?.[0]?.text||"Connection issue. Try again."}]);
    }catch{setChatMessages(prev=>[...prev,{role:"assistant",text:"Connection issue. Try again in a moment."}]);}
    setChatLoading(false);
  };

  const portWithPrices=portfolio.map(h=>{const q=quotes[h.ticker];const cur=q?q.price:h.buyPrice;const cost=h.shares*h.buyPrice;const val=h.shares*cur;return{...h,currentPrice:cur,cost,value:val,pnl:val-cost,pnlPct:((val-cost)/cost)*100};});
  const totalCost=portWithPrices.reduce((s,h)=>s+h.cost,0);
  const totalValue=portWithPrices.reduce((s,h)=>s+h.value,0);
  const totalPnL=totalValue-totalCost;
  const totalPnLPct=totalCost>0?(totalPnL/totalCost)*100:0;
  const filteredWL=filterType==="All"?WATCHLIST:WATCHLIST.filter(s=>s.type===filterType);
  const mainTabs=[{id:"market",label:"📈 Market"},{id:"broker",label:"🤖 Broker"},{id:"portfolio",label:"💼 Portfolio"},{id:"alerts",label:`🔔${alerts.length>0?` (${alerts.length})`:""}`}];

  // ─── DETAIL ───
  if(tab==="detail"&&selectedStock){
    const q=quotes[selectedStock.ticker];
    const held=portfolio.find(h=>h.ticker===selectedStock.ticker);
    const isUp=chartData&&chartData.length>1?chartData[chartData.length-1].price>=chartData[0].price:q?.changePct>=0;
    const cc=isUp?"#00e676":"#ff1744";
    const S=(props)=><div style={props.style}>{props.children}</div>;
    return(
      <div style={{background:"#010409",minHeight:"100vh",color:"#e6edf3",fontFamily:"'Georgia',serif",paddingBottom:60}}>
        <div style={{background:"#0d1117",borderBottom:"1px solid #21262d",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setTab("market")} style={{background:"none",border:"none",color:"#8b949e",fontSize:22,cursor:"pointer",padding:"0 4px"}}>←</button>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:16,fontFamily:"monospace"}}>{selectedStock.ticker}</div>
            <div style={{color:"#8b949e",fontSize:11}}>{selectedStock.name} · {selectedStock.sector}</div>
          </div>
          <span style={{background:(VERDICT_COLORS[selectedStock.verdict]||"#aaa")+"22",color:VERDICT_COLORS[selectedStock.verdict]||"#aaa",border:`1px solid ${VERDICT_COLORS[selectedStock.verdict]||"#aaa"}44`,borderRadius:4,padding:"3px 8px",fontSize:10,fontWeight:700}}>{selectedStock.verdict}</span>
        </div>

        {/* Price banner */}
        <div style={{background:"#0d1117",borderBottom:"1px solid #21262d",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {q?(
            <>
              <div>
                <div style={{fontFamily:"monospace",fontSize:30,fontWeight:900,letterSpacing:-1}}>{selectedStock.currency==="SGD"?"S$":"$"}{fmt(q.price)}</div>
                <div style={{fontSize:13,color:q.changePct>=0?"#00e676":"#ff1744",fontWeight:700,marginTop:2}}>{q.changePct>=0?"▲":"▼"} {fmt(Math.abs(q.change))} ({fmt(Math.abs(q.changePct))}%) today</div>
              </div>
              <div style={{textAlign:"right",fontSize:12}}>
                <div style={{color:"#8b949e"}}>H <span style={{color:"#e6edf3",fontFamily:"monospace"}}>{fmt(q.high)}</span></div>
                <div style={{color:"#8b949e"}}>L <span style={{color:"#e6edf3",fontFamily:"monospace"}}>{fmt(q.low)}</span></div>
                <div style={{color:"#8b949e"}}>Prev <span style={{color:"#e6edf3",fontFamily:"monospace"}}>{fmt(q.prevClose)}</span></div>
              </div>
            </>
          ):<div style={{color:"#8b949e"}}>⏳ Loading price...</div>}
        </div>

        {/* Sub-tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #21262d",background:"#0d1117"}}>
          {["chart","overview","research","news"].map(t=>(
            <button key={t} onClick={()=>setDetailTab(t)} style={{flex:1,background:"none",border:"none",color:detailTab===t?"#e6edf3":"#8b949e",borderBottom:detailTab===t?"2px solid #00e676":"2px solid transparent",padding:"10px 2px",cursor:"pointer",fontSize:11,fontWeight:detailTab===t?700:400,fontFamily:"inherit"}}>
              {t==="chart"?"📊 Chart":t==="overview"?"📋 Stats":t==="research"?"🔬 Research":"📰 News"}
            </button>
          ))}
        </div>

        <div style={{maxWidth:580,margin:"0 auto",padding:"16px 14px"}}>

          {/* CHART TAB */}
          {detailTab==="chart"&&(
            <>
              {/* Period buttons */}
              <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"center"}}>
                {PERIODS.map(p=>(
                  <button key={p.label} onClick={()=>setChartPeriod(p.label)} style={{background:chartPeriod===p.label?cc+"33":"#161b22",border:`1px solid ${chartPeriod===p.label?cc:"#30363d"}`,borderRadius:8,color:chartPeriod===p.label?cc:"#8b949e",padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:chartPeriod===p.label?700:400,fontFamily:"inherit"}}>{p.label}</button>
                ))}
              </div>

              {/* Chart box */}
              <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:14,padding:"16px 8px 8px",marginBottom:14}}>
                {chartLoading?(
                  <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:"#8b949e",fontSize:13}}>⏳ Loading chart data...</div>
                ):!chartData||chartData.length===0?(
                  <div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#8b949e",gap:8}}>
                    <div style={{fontSize:32}}>📊</div>
                    <div style={{fontSize:13}}>Chart data not available for this period</div>
                    <div style={{fontSize:11}}>Try 1M or 3M — LSE stocks may have limited data</div>
                  </div>
                ):(
                  <>
                    {chartData.length>1&&(()=>{
                      const start=chartData[0].price,end=chartData[chartData.length-1].price;
                      const chg=end-start,chgP=(chg/start)*100;
                      return(
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 8px 12px"}}>
                          <div>
                            <div style={{fontSize:10,color:"#8b949e",letterSpacing:1}}>{chartPeriod} PERFORMANCE</div>
                            <div style={{fontSize:22,fontFamily:"monospace",fontWeight:900,color:cc}}>{chgP>=0?"▲ +":"▼ "}{fmt(Math.abs(chgP))}%</div>
                            <div style={{fontSize:12,color:cc}}>{chg>=0?"+":""}{selectedStock.currency==="SGD"?"S$":"$"}{fmt(Math.abs(chg))}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:11,color:"#8b949e"}}>Start: {selectedStock.currency==="SGD"?"S$":"$"}{fmt(start)}</div>
                            <div style={{fontSize:11,color:"#8b949e"}}>Now: {selectedStock.currency==="SGD"?"S$":"$"}{fmt(end)}</div>
                            <div style={{fontSize:10,color:"#8b949e",marginTop:4}}>{chartData.length} data points</div>
                          </div>
                        </div>
                      );
                    })()}
                    <ResponsiveContainer width="100%" height={190}>
                      <LineChart data={chartData} margin={{top:5,right:8,left:0,bottom:5}}>
                        <defs>
                          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={cc} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={cc} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{fill:"#8b949e",fontSize:9}} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                        <YAxis domain={["auto","auto"]} tick={{fill:"#8b949e",fontSize:9}} tickLine={false} axisLine={false} tickFormatter={v=>`${selectedStock.currency==="SGD"?"S$":"$"}${fmt(v,0)}`} width={58}/>
                        <Tooltip content={<ChartTip/>}/>
                        {held&&<ReferenceLine y={held.buyPrice} stroke="#ffab00" strokeDasharray="5 4" label={{value:"Buy price",fill:"#ffab00",fontSize:9,position:"insideTopRight"}}/>}
                        <Line type="monotone" dataKey="price" stroke={cc} strokeWidth={2.5} dot={false} activeDot={{r:5,fill:cc,strokeWidth:0}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>

              {/* 6m vs now */}
              {selectedStock.price6mAgo&&q&&(
                <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontSize:11,color:"#8b949e",letterSpacing:1,marginBottom:10}}>📅 6 MONTHS AGO VS TODAY</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{textAlign:"center",flex:1}}>
                      <div style={{fontSize:10,color:"#8b949e",marginBottom:4}}>6 months ago</div>
                      <div style={{fontFamily:"monospace",fontWeight:700,fontSize:16,color:"#8b949e"}}>{selectedStock.price6mAgo}</div>
                    </div>
                    <div style={{fontSize:24,color:"#8b949e",flex:0}}>→</div>
                    <div style={{textAlign:"center",flex:1}}>
                      <div style={{fontSize:10,color:"#8b949e",marginBottom:4}}>Today</div>
                      <div style={{fontFamily:"monospace",fontWeight:700,fontSize:16,color:"#e6edf3"}}>{selectedStock.currency==="SGD"?"S$":"$"}{fmt(q.price)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Held position */}
              {held&&q&&(
                <div style={{background:"#0d1117",border:"1px solid #ffab0033",borderRadius:12,padding:"12px 16px"}}>
                  <div style={{fontSize:11,color:"#ffab00",letterSpacing:1,marginBottom:8}}>💼 YOUR POSITION (yellow dashed line on chart)</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div>
                      <div style={{fontFamily:"monospace",fontWeight:700}}>{held.shares} shares</div>
                      <div style={{color:"#8b949e",fontSize:12}}>Bought @ {held.currency}{fmt(held.buyPrice)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color:(q.price-held.buyPrice)>=0?"#00e676":"#ff1744",fontWeight:700,fontFamily:"monospace"}}>{(q.price-held.buyPrice)>=0?"+":""}{held.currency}{fmt((q.price-held.buyPrice)*held.shares)}</div>
                      <div style={{color:"#8b949e",fontSize:12}}>{(((q.price-held.buyPrice)/held.buyPrice)*100).toFixed(2)}% return</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* OVERVIEW TAB */}
          {detailTab==="overview"&&(
            <>
              <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                <div style={{fontSize:11,color:"#8b949e",letterSpacing:1,marginBottom:10}}>🎯 BROKER TARGET RANGE</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div><div style={{color:"#ff6d00",fontFamily:"monospace",fontWeight:700}}>{selectedStock.currency==="SGD"?"S$":"$"}{fmt(selectedStock.targetLow)}</div><div style={{color:"#8b949e",fontSize:10}}>Support</div></div>
                  <div style={{flex:1,position:"relative",height:6,background:"#21262d",borderRadius:4}}>
                    <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,#ff6d00,#00e676)",borderRadius:4,opacity:0.3}}/>
                    {q&&<div style={{position:"absolute",top:"50%",left:`${Math.min(96,Math.max(4,((q.price-selectedStock.targetLow)/(selectedStock.targetHigh-selectedStock.targetLow))*100))}%`,width:14,height:14,background:"#00e676",borderRadius:"50%",transform:"translate(-50%,-50%)",border:"2px solid #010409",boxShadow:"0 0 6px #00e676"}}/>}
                  </div>
                  <div style={{textAlign:"right"}}><div style={{color:"#00e676",fontFamily:"monospace",fontWeight:700}}>{selectedStock.currency==="SGD"?"S$":"$"}{fmt(selectedStock.targetHigh)}</div><div style={{color:"#8b949e",fontSize:10}}>Target</div></div>
                </div>
              </div>
              {selectedStock.keyStats&&(
                <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:11,color:"#8b949e",letterSpacing:1,marginBottom:10}}>📋 KEY STATS</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {Object.entries(selectedStock.keyStats).map(([k,v])=>(
                      <div key={k} style={{background:"#161b22",borderRadius:8,padding:"10px 12px"}}>
                        <div style={{color:"#8b949e",fontSize:10,marginBottom:3}}>{k}</div>
                        <div style={{fontFamily:"monospace",fontWeight:700,fontSize:13}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* RESEARCH TAB */}
          {detailTab==="research"&&(
            <>
              {[{label:"🏢 What does this company do?",content:selectedStock.what},{label:"🏰 What is the moat?",content:selectedStock.moat},{label:"⚔️ How is it different from competitors?",content:selectedStock.vsCompetitors},{label:"⚠️ What obstacles lie ahead?",content:selectedStock.obstacles}].map(({label,content})=>(
                <div key={label} style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"16px",marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#8b949e",marginBottom:10}}>{label}</div>
                  <div style={{fontSize:13,color:"#c9d1d9",lineHeight:1.75}}>{content}</div>
                </div>
              ))}
              <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:10,padding:"10px 14px"}}>
                <div style={{fontSize:11,color:"#8b949e"}}>⚠️ Research profiles are periodically updated. Always do your own due diligence before investing.</div>
              </div>
            </>
          )}

          {/* NEWS TAB */}
          {detailTab==="news"&&(
            newsLoading?<div style={{textAlign:"center",padding:30,color:"#8b949e"}}>Loading news...</div>:
            stockNews.length===0?<div style={{textAlign:"center",padding:30,color:"#8b949e"}}>No recent news found.</div>:
            stockNews.map((n,i)=>(
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{display:"block",textDecoration:"none",background:"#0d1117",border:"1px solid #21262d",borderRadius:10,padding:"14px",marginBottom:10}}>
                <div style={{color:"#e6edf3",fontSize:13,fontWeight:600,lineHeight:1.5,marginBottom:6}}>{n.headline}</div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{color:"#29b6f6",fontSize:11}}>{n.source}</span>
                  <span style={{color:"#8b949e",fontSize:11}}>{new Date(n.datetime*1000).toLocaleDateString("en-SG",{day:"numeric",month:"short"})}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN ───
  return(
    <div style={{background:"#010409",minHeight:"100vh",color:"#e6edf3",fontFamily:"'Georgia',serif",paddingBottom:80}}>
      {triggeredAlerts.length>0&&(
        <div style={{background:"#ffab0022",borderBottom:"1px solid #ffab0055",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13,color:"#ffab00"}}>🔔 <strong>{triggeredAlerts[0].ticker}</strong> {triggeredAlerts[0].direction==="above"?"▲ above":"▼ below"} target ${fmt(triggeredAlerts[0].targetPrice)} — now ${fmt(triggeredAlerts[0].currentPrice)}</div>
          <button onClick={()=>setTriggeredAlerts([])} style={{background:"none",border:"none",color:"#ffab00",cursor:"pointer",fontSize:18}}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{background:"linear-gradient(180deg,#0d1117,#010409)",borderBottom:"1px solid #21262d",padding:"16px 16px 12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,color:"#8b949e",letterSpacing:3,textTransform:"uppercase"}}>Wall Street</div>
            <div style={{fontSize:20,fontWeight:900}}>My Broker 💹</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:mood.color,fontWeight:700}}>{mood.mood}</div>
            <div style={{fontSize:10,color:"#8b949e"}}>{mood.up}↑ {mood.down}↓ avg {mood.avg}%</div>
            <div style={{display:"flex",gap:6,marginTop:3,justifyContent:"flex-end",alignItems:"center"}}>
              <span style={{fontSize:10,color:loading?"#ffab00":"#00e676"}}>{loading?"⏳ Updating":"🟢 Live"}</span>
              <button onClick={fetchAllQuotes} style={{background:"none",border:"1px solid #30363d",borderRadius:6,color:"#8b949e",fontSize:10,padding:"2px 6px",cursor:"pointer"}}>↻</button>
            </div>
          </div>
        </div>
        {!loading&&(
          <div style={{display:"flex",gap:8,overflowX:"auto",marginTop:12,paddingBottom:4}}>
            {["NVDA","MU","AVGO","AMZN","GOOGL","OCBC","DBS","iFAST"].map(t=>{
              const q=quotes[t];const s=WATCHLIST.find(x=>x.ticker===t);if(!q||!s)return null;
              return(
                <div key={t} onClick={()=>openStock(s)} style={{background:q.changePct>=0?"#00e67611":"#ff174411",border:`1px solid ${q.changePct>=0?"#00e67633":"#ff174433"}`,borderRadius:8,padding:"6px 10px",flexShrink:0,cursor:"pointer",textAlign:"center",minWidth:72}}>
                  <div style={{fontFamily:"monospace",fontSize:10,fontWeight:700}}>{t}</div>
                  <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700}}>{s.currency==="SGD"?"S$":"$"}{fmt(q.price)}</div>
                  <div style={{fontSize:10,color:q.changePct>=0?"#00e676":"#ff1744"}}>{q.changePct>=0?"▲":"▼"}{fmt(Math.abs(q.changePct))}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #21262d",background:"#0d1117"}}>
        {mainTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:"none",border:"none",color:tab===t.id?"#e6edf3":"#8b949e",borderBottom:tab===t.id?"2px solid #00e676":"2px solid transparent",padding:"11px 2px",cursor:"pointer",fontSize:11,fontWeight:tab===t.id?700:400,fontFamily:"inherit"}}>{t.label}</button>
        ))}
      </div>

      {/* MARKET */}
      {tab==="market"&&(
        <div style={{padding:"12px 14px 0",maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
            {["All","ETF","US Stock","SG Stock","SG REIT"].map(t=>(
              <button key={t} onClick={()=>setFilterType(t)} style={{background:filterType===t?(TYPE_COLORS[t]||"#e6edf3")+"22":"none",border:`1px solid ${filterType===t?(TYPE_COLORS[t]||"#e6edf3"):"#21262d"}`,borderRadius:20,color:filterType===t?(TYPE_COLORS[t]||"#e6edf3"):"#8b949e",padding:"5px 12px",cursor:"pointer",fontSize:11,whiteSpace:"nowrap",fontFamily:"inherit",fontWeight:filterType===t?700:400}}>{t}</button>
            ))}
          </div>
          {filteredWL.map(stock=>{
            const q=quotes[stock.ticker];const held=portfolio.find(h=>h.ticker===stock.ticker);
            return(
              <div key={stock.ticker} onClick={()=>openStock(stock)} style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"13px 14px",marginBottom:9,cursor:"pointer",borderLeft:`3px solid ${VERDICT_COLORS[stock.verdict]||"#30363d"}`}} onMouseEnter={e=>e.currentTarget.style.background="#161b22"} onMouseLeave={e=>e.currentTarget.style.background="#0d1117"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"monospace",fontWeight:800,fontSize:14}}>{stock.ticker}</span>
                      <span style={{fontSize:10,color:VERDICT_COLORS[stock.verdict],background:VERDICT_COLORS[stock.verdict]+"22",padding:"2px 7px",borderRadius:10,fontWeight:700}}>{stock.verdict}</span>
                      {held&&<span style={{fontSize:10,color:"#ffab00",background:"#ffab0022",padding:"2px 6px",borderRadius:10}}>HELD</span>}
                    </div>
                    <div style={{color:"#8b949e",fontSize:12}}>{stock.name}</div>
                    <div style={{fontSize:10,color:TYPE_COLORS[stock.type]||"#aaa",marginTop:2}}>{stock.sector}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    {q?(<>
                      <div style={{fontFamily:"monospace",fontWeight:700,fontSize:14}}>{stock.currency==="SGD"?"S$":"$"}{fmt(q.price)}</div>
                      <div style={{fontSize:12,color:q.changePct>=0?"#00e676":"#ff1744",fontWeight:600}}>{q.changePct>=0?"▲":"▼"}{fmt(Math.abs(q.changePct))}%</div>
                      <div style={{fontSize:10,color:"#8b949e"}}>Target {stock.currency==="SGD"?"S$":"$"}{stock.targetHigh}</div>
                    </>):<div style={{color:"#8b949e",fontSize:11}}>{loading?"Loading...":"—"}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BROKER */}
      {tab==="broker"&&(
        <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 165px)"}}>
          <div style={{flex:1,overflowY:"auto",padding:"14px 14px 0"}}>
            <div style={{display:"flex",gap:7,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
              {["Should I buy NVDA?","Best SG dividend stock?","Review my portfolio","What's the market doing?","Cheapest AI stock now?"].map(q=>(
                <button key={q} onClick={()=>setChatInput(q)} style={{background:"#161b22",border:"1px solid #30363d",borderRadius:20,color:"#8b949e",padding:"6px 12px",cursor:"pointer",fontSize:11,whiteSpace:"nowrap",fontFamily:"inherit"}}>{q}</button>
              ))}
            </div>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:14,gap:8}}>
                {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#00e676,#29b6f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>💹</div>}
                <div style={{maxWidth:"80%",background:m.role==="user"?"#1f6feb":"#161b22",border:m.role==="assistant"?"1px solid #21262d":"none",borderRadius:m.role==="user"?"18px 18px 4px 18px":"4px 18px 18px 18px",padding:"11px 14px",fontSize:13,lineHeight:1.65,color:"#e6edf3",whiteSpace:"pre-wrap"}}>{m.text}</div>
              </div>
            ))}
            {chatLoading&&(
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#00e676,#29b6f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>💹</div>
                <div style={{background:"#161b22",border:"1px solid #21262d",borderRadius:"4px 18px 18px 18px",padding:"11px 16px",color:"#8b949e",fontSize:13}}>Analysing markets<span style={{animation:"blink 1s step-end infinite"}}>...</span></div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"10px 14px",borderTop:"1px solid #21262d",background:"#0d1117",display:"flex",gap:8}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Ask your broker anything..." style={{flex:1,background:"#161b22",border:"1px solid #30363d",borderRadius:24,color:"#e6edf3",padding:"11px 16px",fontSize:13,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={sendChat} disabled={chatLoading} style={{background:chatLoading?"#30363d":"linear-gradient(135deg,#00e676,#00bcd4)",border:"none",borderRadius:"50%",width:44,height:44,color:"#010409",fontSize:18,cursor:chatLoading?"not-allowed":"pointer",flexShrink:0}}>↑</button>
          </div>
        </div>
      )}

      {/* PORTFOLIO */}
      {tab==="portfolio"&&(
        <div style={{padding:"14px 14px 0",maxWidth:600,margin:"0 auto"}}>
          {portfolio.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{label:"INVESTED",value:"$"+fmt(totalCost)},{label:"VALUE NOW",value:"$"+fmt(totalValue)},{label:"TOTAL P&L",value:(totalPnL>=0?"+$":"-$")+fmt(Math.abs(totalPnL)),color:totalPnL>=0?"#00e676":"#ff1744",sub:(totalPnLPct>=0?"+":"")+fmt(totalPnLPct)+"%"}].map(({label,value,color,sub})=>(
                <div key={label} style={{background:"#161b22",borderRadius:10,padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#8b949e",letterSpacing:1,marginBottom:4}}>{label}</div>
                  <div style={{fontFamily:"monospace",fontWeight:800,fontSize:12,color:color||"#e6edf3"}}>{value}</div>
                  {sub&&<div style={{fontSize:10,color}}>{sub}</div>}
                </div>
              ))}
            </div>
          )}
          {portWithPrices.length===0?(
            <div style={{textAlign:"center",padding:"44px 20px"}}>
              <div style={{fontSize:44,marginBottom:12}}>💼</div>
              <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>Portfolio empty</div>
              <div style={{color:"#8b949e",fontSize:13}}>Add your first holding below.</div>
            </div>
          ):portWithPrices.map(h=>(
            <div key={h.id} style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"13px 14px",marginBottom:9,borderLeft:`3px solid ${h.pnl>=0?"#00e676":"#ff1744"}`}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontFamily:"monospace",fontWeight:800}}>{h.ticker}</div>
                  <div style={{color:"#8b949e",fontSize:12}}>{h.shares} shares @ {h.currency}{fmt(h.buyPrice)}</div>
                  <div style={{color:"#8b949e",fontSize:11,marginTop:2}}>Live: {h.currency}{fmt(h.currentPrice)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"monospace",fontWeight:700}}>{h.currency}{fmt(h.value)}</div>
                  <div style={{fontSize:12,color:h.pnl>=0?"#00e676":"#ff1744",fontWeight:600}}>{h.pnl>=0?"▲ +":"▼ "}{h.currency}{fmt(Math.abs(h.pnl))}</div>
                  <div style={{fontSize:11,color:h.pnl>=0?"#00e676":"#ff1744"}}>{h.pnlPct>=0?"+":""}{h.pnlPct.toFixed(2)}%</div>
                </div>
              </div>
              <button onClick={()=>savePortfolio(portfolio.filter(x=>x.id!==h.id))} style={{background:"none",border:"none",color:"#ff174466",fontSize:11,cursor:"pointer",marginTop:6,fontFamily:"inherit"}}>🗑 Remove</button>
            </div>
          ))}
          {showAddHolding?(
            <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:14,padding:"16px",marginTop:8}}>
              <div style={{fontWeight:700,marginBottom:12}}>Add Holding</div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:"#8b949e",display:"block",marginBottom:4}}>Quick pick</label>
                <select onChange={e=>{const s=WATCHLIST.find(x=>x.ticker===e.target.value);if(s)setHoldingForm(f=>({...f,ticker:s.ticker,currency:s.currency}));}} style={{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",padding:"10px",fontSize:13,fontFamily:"inherit"}}>
                  <option value="">-- Select from watchlist --</option>
                  {WATCHLIST.map(s=><option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>)}
                </select>
              </div>
              {[["Ticker *","ticker","e.g. NVDA"],["Shares *","shares","e.g. 10"],["Buy Price *","buyPrice","e.g. 120.50"]].map(([l,k,p])=>(
                <div key={k} style={{marginBottom:10}}>
                  <label style={{fontSize:12,color:"#8b949e",display:"block",marginBottom:4}}>{l}</label>
                  <input value={holdingForm[k]} onChange={e=>setHoldingForm(f=>({...f,[k]:e.target.value}))} placeholder={p} inputMode="decimal" style={{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",padding:"10px 12px",fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div style={{display:"flex",gap:8}}>
                <select value={holdingForm.currency} onChange={e=>setHoldingForm(f=>({...f,currency:e.target.value}))} style={{flex:1,background:"#161b22",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",padding:"10px",fontSize:13,fontFamily:"inherit"}}>
                  {["USD","SGD","GBP","EUR"].map(c=><option key={c}>{c}</option>)}
                </select>
                <button onClick={()=>{if(!holdingForm.ticker||!holdingForm.shares||!holdingForm.buyPrice)return;savePortfolio([...portfolio,{...holdingForm,id:Date.now().toString(),shares:parseFloat(holdingForm.shares),buyPrice:parseFloat(holdingForm.buyPrice)}]);setHoldingForm({ticker:"",shares:"",buyPrice:"",currency:"USD"});setShowAddHolding(false);}} style={{flex:2,background:"linear-gradient(135deg,#00e676,#00bcd4)",border:"none",borderRadius:8,color:"#010409",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>＋ Add</button>
              </div>
              <button onClick={()=>setShowAddHolding(false)} style={{width:"100%",marginTop:8,background:"none",border:"none",color:"#8b949e",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Cancel</button>
            </div>
          ):(
            <button onClick={()=>setShowAddHolding(true)} style={{width:"100%",background:"linear-gradient(135deg,#00e676,#00bcd4)",border:"none",borderRadius:12,color:"#010409",padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>＋ Add Holding</button>
          )}
        </div>
      )}

      {/* ALERTS */}
      {tab==="alerts"&&(
        <div style={{padding:"14px 14px 0",maxWidth:600,margin:"0 auto"}}>
          <div style={{color:"#8b949e",fontSize:12,marginBottom:14,lineHeight:1.6}}>Set a price target. When the stock hits it on the next 60s refresh, you'll get a banner alert. 🔔</div>
          {alerts.length===0?(
            <div style={{textAlign:"center",padding:"36px 20px"}}>
              <div style={{fontSize:40,marginBottom:10}}>🔔</div>
              <div style={{fontWeight:700,marginBottom:6}}>No alerts set</div>
              <div style={{color:"#8b949e",fontSize:13}}>Add your first price alert below.</div>
            </div>
          ):alerts.map((a,i)=>(
            <div key={i} style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:"13px 14px",marginBottom:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:"monospace",fontWeight:700}}>{a.ticker}</div>
                <div style={{color:"#8b949e",fontSize:12}}>Alert when <strong style={{color:a.direction==="above"?"#00e676":"#ff1744"}}>{a.direction}</strong> ${fmt(a.targetPrice)}</div>
                {quotes[a.ticker]&&<div style={{fontSize:11,color:"#8b949e",marginTop:2}}>Now: ${fmt(quotes[a.ticker].price)}</div>}
              </div>
              <button onClick={()=>saveAlerts(alerts.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#ff174466",cursor:"pointer",fontSize:20}}>✕</button>
            </div>
          ))}
          {showAddAlert?(
            <div style={{background:"#0d1117",border:"1px solid #21262d",borderRadius:14,padding:"16px",marginTop:8}}>
              <div style={{fontWeight:700,marginBottom:12}}>New Price Alert</div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,color:"#8b949e",display:"block",marginBottom:4}}>Stock</label>
                <select value={alertForm.ticker} onChange={e=>setAlertForm(f=>({...f,ticker:e.target.value}))} style={{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",padding:"10px",fontSize:13,fontFamily:"inherit"}}>
                  <option value="">-- Select --</option>
                  {WATCHLIST.map(s=><option key={s.ticker} value={s.ticker}>{s.ticker} — {s.name}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:12,color:"#8b949e",display:"block",marginBottom:4}}>Direction</label>
                  <select value={alertForm.direction} onChange={e=>setAlertForm(f=>({...f,direction:e.target.value}))} style={{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",padding:"10px",fontSize:13,fontFamily:"inherit"}}>
                    <option value="above">▲ Above</option>
                    <option value="below">▼ Below</option>
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:12,color:"#8b949e",display:"block",marginBottom:4}}>Target Price</label>
                  <input value={alertForm.targetPrice} onChange={e=>setAlertForm(f=>({...f,targetPrice:e.target.value}))} placeholder="e.g. 150" inputMode="decimal" style={{width:"100%",background:"#161b22",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",padding:"10px 12px",fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{if(!alertForm.ticker||!alertForm.targetPrice)return;saveAlerts([...alerts,{...alertForm,targetPrice:parseFloat(alertForm.targetPrice)}]);setAlertForm({ticker:"",targetPrice:"",direction:"above"});setShowAddAlert(false);}} style={{flex:1,background:"linear-gradient(135deg,#ffab00,#ff6d00)",border:"none",borderRadius:8,color:"#010409",fontWeight:800,fontSize:14,cursor:"pointer",padding:"11px",fontFamily:"inherit"}}>🔔 Set Alert</button>
                <button onClick={()=>setShowAddAlert(false)} style={{flex:1,background:"none",border:"1px solid #30363d",borderRadius:8,color:"#8b949e",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancel</button>
              </div>
            </div>
          ):(
            <button onClick={()=>setShowAddAlert(true)} style={{width:"100%",background:"linear-gradient(135deg,#ffab00,#ff6d00)",border:"none",borderRadius:12,color:"#010409",padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer",marginTop:8,fontFamily:"inherit"}}>🔔 Add Price Alert</button>
          )}
        </div>
      )}

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  );
}
