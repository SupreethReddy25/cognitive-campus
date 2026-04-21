import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Brain, Zap, Trophy } from 'lucide-react';

import DisplayCards from '../components/ui/display-cards';
import { CircularRevealHeading } from '../components/ui/circular-reveal-heading';
import { HandWrittenTitle } from '../components/ui/hand-written-title';

// ─── Typewriter ───────────────────────────────────────────────────────────────
const Typewriter = ({ texts, speed=80, deleteSpeed=40, delay=1800 }) => {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const cur = texts[idx];
    const t = setTimeout(() => {
      if (!deleting) {
        if (charIdx < cur.length) { setDisplay(cur.slice(0,charIdx+1)); setCharIdx(c=>c+1); }
        else setTimeout(()=>setDeleting(true), delay);
      } else {
        if (display.length > 0) setDisplay(d=>d.slice(0,-1));
        else { setDeleting(false); setCharIdx(0); setIdx(i=>(i+1)%texts.length); }
      }
    }, deleting ? deleteSpeed : speed);
    return ()=>clearTimeout(t);
  }, [charIdx, deleting, display, idx]);
  return <span>{display}<span style={{ animation:'pulse 1s infinite', opacity:0.7 }}>|</span></span>;
};

// ─── Scroll Fade Hook ─────────────────────────────────────────────────────────
const useScrollFade = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setVisible(true); }, { threshold:0.15 });
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  }, []);
  return [ref, visible];
};

// ─── Tubes Cursor (dark mode) ─────────────────────────────────────────────────
const TubesCursor = () => {
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js')
        .then(mod => {
          if (!canvasRef.current) return;
          appRef.current = mod.default(canvasRef.current, {
            tubes: { colors:['#22d3ee','#8b5cf6','#2dd4bf'], lights:{ intensity:60, colors:['#21d4fd','#b721ff','#f4d03f','#11cdef'] } }
          });
        }).catch(()=>{});
    }, 300);
    return () => { clearTimeout(timer); appRef.current?.dispose?.(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:1, pointerEvents:'none' }} />;
};

// ─── Light Mode Canvas Ripple ──────────────────────────────────────────────────
const LightBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return;
    const ctx = canvas.getContext('2d'); let raf; const t0=Date.now();
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize(); window.addEventListener('resize',resize);
    const render=()=>{
      const t=(Date.now()-t0)*0.001, W=canvas.width, H=canvas.height;
      ctx.clearRect(0,0,W,H);
      [[W*.15,H*.25,W*.38,210,70,.18,.14],[W*.75,H*.2,W*.32,230,60,.12,.22],[W*.5,H*.65,W*.4,200,55,.2,.1],[W*.85,H*.7,W*.28,220,50,.15,.18]].forEach(([x,y,r,h,s,xt,yt])=>{
        const cx=x+Math.sin(t*xt)*W*.08, cy=y+Math.cos(t*yt)*H*.06, rr=r*(.88+.12*Math.sin(t*.4+h));
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rr);
        g.addColorStop(0,`hsla(${h},${s}%,88%,.55)`); g.addColorStop(.5,`hsla(${h},${s}%,92%,.25)`); g.addColorStop(1,`hsla(${h},${s}%,98%,0)`);
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2); ctx.fill();
      });
      raf=requestAnimationFrame(render);
    };
    render();
    return()=>{ window.removeEventListener('resize',resize); cancelAnimationFrame(raf); };
  },[]);
  return(<>
    <div style={{ position:'fixed',inset:0,zIndex:0,pointerEvents:'none', background:'linear-gradient(145deg,#ffffff 0%,#f5f5f7 40%,#f0f2f8 70%,#f5f5f7 100%)' }}/>
    <canvas ref={canvasRef} style={{ position:'fixed',inset:0,width:'100vw',height:'100vh',zIndex:1,pointerEvents:'none' }}/>
  </>);
};

// ─── Wave Background (dark) ───────────────────────────────────────────────────
const WaveBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const SCALE=7, off=document.createElement('canvas'), offCtx=off.getContext('2d');
    let raf, fc=0; const t0=Date.now();
    const SZ=512, SIN=new Float32Array(SZ), COS=new Float32Array(SZ);
    for(let i=0;i<SZ;i++){SIN[i]=Math.sin((i/SZ)*Math.PI*2);COS[i]=Math.cos((i/SZ)*Math.PI*2);}
    const TPI=Math.PI*2;
    const fsin=x=>{let n=x%TPI;if(n<0)n+=TPI;return SIN[(n/TPI*SZ)|0];};
    const fcos=x=>{let n=x%TPI;if(n<0)n+=TPI;return COS[(n/TPI*SZ)|0];};
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight; off.width=Math.ceil(canvas.width/SCALE); off.height=Math.ceil(canvas.height/SCALE); };
    resize(); window.addEventListener('resize',resize);
    const ctx2=canvas.getContext('2d'); ctx2.imageSmoothingEnabled=true;
    const render=()=>{
      raf=requestAnimationFrame(render); fc++; if(fc%2!==0)return;
      const t=(Date.now()-t0)*.0008, w=off.width, h=off.height; if(!w||!h)return;
      const img=offCtx.createImageData(w,h), d=img.data;
      for(let y=0;y<h;y++) for(let x=0;x<w;x++){
        const ux=(2*x-w)/h, uy=(2*y-h)/h; let a=0,di=0;
        for(let i=0;i<3;i++){a+=fcos(i-di+t*.4-a*ux);di+=fsin(i*uy+a);}
        const wave=(fsin(a)+fcos(di))*.5, intensity=.25+.35*wave;
        const base=.08+.12*fcos(ux+uy+t*.25), blue=.18*fsin(a*1.5+t*.18), purple=.12*fcos(di*2+t*.09);
        const r=Math.max(0,Math.min(1,base+purple*.8))*intensity;
        const g=Math.max(0,Math.min(1,base+blue*.6))*intensity;
        const b=Math.max(0,Math.min(1,base+blue*1.2+purple*.4))*intensity;
        const idx=(y*w+x)*4; d[idx]=r*255;d[idx+1]=g*255;d[idx+2]=b*255;d[idx+3]=255;
      }
      offCtx.putImageData(img,0,0); ctx2.drawImage(off,0,0,canvas.width,canvas.height);
    };
    render();
    return()=>{ window.removeEventListener('resize',resize); cancelAnimationFrame(raf); };
  },[]);
  return <canvas ref={canvasRef} style={{ position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:0,opacity:.18,pointerEvents:'none', WebkitMaskImage:'radial-gradient(ellipse 80% 70% at 75% 40%,black 20%,transparent 75%)', maskImage:'radial-gradient(ellipse 80% 70% at 75% 40%,black 20%,transparent 75%)' }}/>;
};

// ─── CountUp ──────────────────────────────────────────────────────────────────
const CountUp = ({ end, duration=1600 }) => {
  const [count,setCount]=useState(0); const ref=useRef(null);
  useEffect(()=>{
    let raf;
    const obs=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){let t0=null;const tick=ts=>{if(!t0)t0=ts;const p=Math.min((ts-t0)/duration,1);setCount(Math.floor(p*(2-p)*end));if(p<1)raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);obs.disconnect();}
    },{threshold:.3});
    if(ref.current)obs.observe(ref.current);
    return()=>{ obs.disconnect(); if(raf)cancelAnimationFrame(raf); };
  },[end,duration]);
  return <span ref={ref}>{count}</span>;
};

// ─── Gemini SVG Paths ─────────────────────────────────────────────────────────
const PATHS=[
  {d:"M0 663C145.5 663 191 666.265 269 647C326.5 630 339.5 621 397.5 566C439 531.5 455 529.5 490 523C509.664 519.348 521 503.736 538 504.236C553.591 504.236 562.429 514.739 584.66 522.749C592.042 525.408 600.2 526.237 607.356 523.019C624.755 515.195 641.446 496.324 657 496.735C673.408 496.735 693.545 519.572 712.903 526.769C718.727 528.934 725.184 528.395 730.902 525.965C751.726 517.115 764.085 497.106 782 496.735C794.831 496.47 804.103 508.859 822.469 518.515C835.13 525.171 850.214 526.815 862.827 520.069C875.952 513.049 889.748 502.706 903.5 503.736C922.677 505.171 935.293 510.562 945.817 515.673C954.234 519.76 963.095 522.792 972.199 524.954C996.012 530.611 1007.42 534.118 1034 549C1077.5 573.359 1082.5 594.5 1140 629C1206 670 1328.5 662.5 1440 662.5",c:"#FFB7C5"},
  {d:"M0 587.5C147 587.5 277 587.5 310 573.5C348 563 392.5 543.5 408 535C434 523.5 426 526.235 479 515.235C494 512.729 523 510.435 534.5 512.735C554.5 516.735 555.5 523.235 576 523.735C592 523.735 616 496.735 633 497.235C648.671 497.235 661.31 515.052 684.774 524.942C692.004 527.989 700.2 528.738 707.349 525.505C724.886 517.575 741.932 498.33 757.5 498.742C773.864 498.742 791.711 520.623 810.403 527.654C816.218 529.841 822.661 529.246 828.451 526.991C849.246 518.893 861.599 502.112 879.5 501.742C886.47 501.597 896.865 506.047 907.429 510.911C930.879 521.707 957.139 519.639 982.951 520.063C1020.91 520.686 1037.5 530.797 1056.5 537C1102.24 556.627 1116.5 570.704 1180.5 579.235C1257.5 589.5 1279 587 1440 588",c:"#FFDDB7"},
  {d:"M0 514C147.5 514.333 294.5 513.735 380.5 513.735C405.976 514.94 422.849 515.228 436.37 515.123C477.503 514.803 518.631 506.605 559.508 511.197C564.04 511.706 569.162 512.524 575 513.735C588 516.433 616 521.702 627.5 519.402C647.5 515.402 659 499.235 680.5 499.235C700.5 499.235 725 529.235 742 528.735C757.654 528.735 768.77 510.583 791.793 500.59C798.991 497.465 807.16 496.777 814.423 499.745C832.335 507.064 850.418 524.648 866 524.235C882.791 524.235 902.316 509.786 921.814 505.392C926.856 504.255 932.097 504.674 937.176 505.631C966.993 511.248 970.679 514.346 989.5 514.735C1006.3 515.083 1036.5 513.235 1055.5 513.235C1114.5 513.235 1090.5 513.235 1124 513.235C1177.5 513.235 1178.99 514.402 1241 514.402C1317.5 514.402 1274.5 512.568 1440 513.235",c:"#B1C5FF"},
  {d:"M0 438.5C150.5 438.5 261 438.318 323.5 456.5C351 464.5 387.517 484.001 423.5 494.5C447.371 501.465 472 503.735 487 507.735C503.786 512.212 504.5 516.808 523 518.735C547 521.235 564.814 501.235 584.5 501.235C604.5 501.235 626 529.069 643 528.569C658.676 528.569 672.076 511.63 695.751 501.972C703.017 499.008 711.231 498.208 718.298 501.617C735.448 509.889 751.454 529.98 767 529.569C783.364 529.569 801.211 507.687 819.903 500.657C825.718 498.469 832.141 499.104 837.992 501.194C859.178 508.764 873.089 523.365 891 523.735C907.8 524.083 923 504.235 963 506.735C1034.5 506.735 1047.5 492.68 1071 481.5C1122.5 457 1142.23 452.871 1185 446.5C1255.5 436 1294 439 1439.5 439",c:"#4FABFF"},
  {d:"M0.5 364C145.288 362.349 195 361.5 265.5 378C322 391.223 399.182 457.5 411 467.5C424.176 478.649 456.916 491.677 496.259 502.699C498.746 503.396 501.16 504.304 503.511 505.374C517.104 511.558 541.149 520.911 551.5 521.236C571.5 521.236 590 498.736 611.5 498.736C631.5 498.736 652.5 529.236 669.5 528.736C685.171 528.736 697.81 510.924 721.274 501.036C728.505 497.988 736.716 497.231 743.812 500.579C761.362 508.857 778.421 529.148 794 528.736C810.375 528.736 829.35 508.68 848.364 502.179C854.243 500.169 860.624 500.802 866.535 502.718C886.961 509.338 898.141 519.866 916 520.236C932.8 520.583 934.5 510.236 967.5 501.736C1011.5 491 1007.5 493.5 1029.5 480C1069.5 453.5 1072 440.442 1128.5 403.5C1180.5 369.5 1275 360.374 1439 364",c:"#076EFF"},
];
const PATH_LEN=1700;

const GeminiSvgSection=({isDark})=>{
  const ref=useRef(null);const[prog,setProg]=useState(0);
  useEffect(()=>{
    const fn=()=>{ if(!ref.current)return; const r=ref.current.getBoundingClientRect(); setProg(Math.min(Math.max((window.innerHeight-r.top)/(window.innerHeight*.75),0),1)); };
    window.addEventListener('scroll',fn,{passive:true});fn();
    return()=>window.removeEventListener('scroll',fn);
  },[]);
  return(
    <div ref={ref} style={{position:'relative',width:'100%',overflow:'hidden',height:320}}>
      <svg width="1440" height="890" viewBox="0 0 1440 890" style={{position:'absolute',top:-310,left:0,width:'100%'}} preserveAspectRatio="none">
        <defs><filter id="gblur"><feGaussianBlur in="SourceGraphic" stdDeviation="5"/></filter></defs>
        {PATHS.map((p,i)=>{
          const offset=Math.max(0,PATH_LEN*(1-Math.max(0,prog-i*.06)*1.3));
          return <g key={i}>
            <path d={p.d} stroke={p.c} strokeWidth="3" fill="none" opacity={isDark?.35:.45} filter="url(#gblur)" strokeDasharray={PATH_LEN} strokeDashoffset={offset}/>
            <path d={p.d} stroke={p.c} strokeWidth="1.5" fill="none" strokeDasharray={PATH_LEN} strokeDashoffset={offset}/>
          </g>;
        })}
      </svg>
    </div>
  );
};

// ─── Trust Stats / Marquee etc omitted for brevity, keeping same layout ───

// ─── Display Cards (stats) ─────────────────────────────────────────────────────
const StatsDisplayCards=({isDark,T})=>{
  const cards=[
    {num:<><CountUp end={36}/>+</>,title:'Problems',desc:'Across 12 DSA topics',color:'#22d3ee',icon:'📐',off:{x:0,y:0},skew:-6,gray:true},
    {num:<><CountUp end={12}/></>,title:'DSA Skills',desc:'BKT-tracked mastery',color:'#a78bfa',icon:'🧠',off:{x:100,y:18},skew:-3,gray:true},
    {num:'BKT',title:'Knowledge Engine',desc:'Real-time adaptive AI',color:'#2dd4bf',icon:'⚡',off:{x:200,y:36},skew:0,gray:false},
  ];
  return(
    <div style={{position:'relative',height:175,width:'100%',maxWidth:600}}>
      {cards.map((c,i)=>(
        <div key={i} style={{
          position:'absolute',left:c.off.x,top:c.off.y,
          width:280,zIndex:i+1,
          transform:`skewY(${c.skew}deg)`,
          background:isDark?'rgba(255,255,255,.055)':'rgba(255,255,255,.70)',
          backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
          border:`1.5px solid ${isDark?'rgba(255,255,255,.10)':'rgba(0,0,0,.09)'}`,
          borderRadius:14,padding:'16px 20px',
          boxShadow:isDark?'0 8px 32px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.07)':'0 8px 32px rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.9)',
          filter:c.gray&&isDark?'grayscale(0.5)':'none',
          transition:'filter .4s ease, transform .3s ease',
          cursor:'default',
        }}
          onMouseOver={e=>{e.currentTarget.style.filter='none';e.currentTarget.style.transform=`skewY(${c.skew}deg) translateY(-6px)`;}}
          onMouseOut={e=>{e.currentTarget.style.filter=c.gray&&isDark?'grayscale(0.5)':'none';e.currentTarget.style.transform=`skewY(${c.skew}deg)`;}}
        >
          {/* Right fade */}
          {i<2&&<div style={{position:'absolute',right:0,top:'-8%',width:'45%',height:'116%',
            background:isDark?'linear-gradient(to left,rgba(8,8,16,1) 0%,transparent 100%)':'linear-gradient(to left,rgba(245,245,247,1) 0%,transparent 100%)',
            borderRadius:'0 14px 14px 0',pointerEvents:'none',zIndex:2}}/>}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,position:'relative',zIndex:3}}>
            <span style={{fontSize:16,width:28,height:28,borderRadius:8,background:`${c.color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>{c.icon}</span>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:'.14em',color:c.color,textTransform:'uppercase'}}>{c.title}</span>
          </div>
          <div style={{fontSize:'2.0rem',fontWeight:800,letterSpacing:'-.03em',color:isDark?'white':'#1d1d1f',lineHeight:1,marginBottom:5,position:'relative',zIndex:3}}>{c.num}</div>
          <div style={{fontSize:11,color:isDark?'rgba(255,255,255,.35)':'rgba(0,0,0,.40)',letterSpacing:'.04em',position:'relative',zIndex:3}}>{c.desc}</div>
          <div style={{position:'absolute',bottom:0,left:14,right:14,height:2,borderRadius:999,background:`linear-gradient(90deg,${c.color},transparent)`,opacity:.5}}/>
        </div>
      ))}
    </div>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const T = isDark ? {
    bg:'#080810',text:'#F5F5F7',muted:'rgba(255,255,255,.50)',faint:'rgba(255,255,255,.28)',
    accent:'#22d3ee',accent2:'#2dd4bf',glass:'rgba(255,255,255,.05)',glassHi:'rgba(255,255,255,.08)',
    border:'rgba(255,255,255,.10)',borderHi:'rgba(255,255,255,.15)',divider:'rgba(255,255,255,.10)',
    marq:'rgba(255,255,255,.22)',shadow:'rgba(0,0,0,.70)',footerTxt:'rgba(255,255,255,.25)',
    btnBg:'white',btnTxt:'#1D1D1F',
  }:{
    bg:'#f5f5f7',text:'#1d1d1f',muted:'rgba(29,29,31,.55)',faint:'rgba(29,29,31,.35)',
    accent:'#0077ed',accent2:'#0a84ff',glass:'rgba(255,255,255,.50)',glassHi:'rgba(255,255,255,.72)',
    border:'rgba(0,0,0,.09)',borderHi:'rgba(0,0,0,.12)',divider:'rgba(0,0,0,.08)',
    marq:'rgba(29,29,31,.28)',shadow:'rgba(0,80,180,.10)',footerTxt:'rgba(29,29,31,.40)',
    btnBg:'#0077ed',btnTxt:'white',
  };
  const gs=(e={})=>({background:T.glass,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${T.border}`,...e});
  const gsh=(e={})=>({background:T.glassHi,backdropFilter:'blur(36px)',WebkitBackdropFilter:'blur(36px)',border:`1px solid ${T.borderHi}`,...e});

  // Scroll-fade refs
  const [subRef,subVis]=useScrollFade();
  const [btnRef,btnVis]=useScrollFade();
  const [statsRef,statsVis]=useScrollFade();

  return(
    <div style={{minHeight:'100vh',background:T.bg,color:T.text,overflowX:'hidden',position:'relative',fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Inter',sans-serif"}}>
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes fadeSlideUp{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
        .anim{opacity:0;animation:fadeSlideUp .85s cubic-bezier(.16,1,.3,1) forwards}
        .d1{animation-delay:.05s}.d2{animation-delay:.18s}.d3{animation-delay:.30s}.d4{animation-delay:.42s}.d5{animation-delay:.54s}.d6{animation-delay:.66s}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .marquee{animation:marquee 30s linear infinite;display:flex;width:max-content;will-change:transform}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.float{animation:floatY 6s ease-in-out infinite}
        @keyframes pdot{0%,100%{opacity:.5}50%{opacity:1}}.pdot{animation:pdot 2.2s ease-in-out infinite}
        @keyframes pf{from{width:0}to{width:var(--pw)}}.pbar{width:0;animation:pf 1.5s cubic-bezier(.34,1,.64,1) forwards .7s}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes drawPath{0%{stroke-dashoffset:500}100%{stroke-dashoffset:0}}
        @keyframes pulse{0%,100%{opacity:.7}50%{opacity:.2}}
        @keyframes waveBounce{0%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-10px) scale(1.08)}70%{transform:translateY(2px) scale(.97)}}
        .wave-text{display:inline-flex;flex-wrap:nowrap}
        .wave-text .wc{display:inline-block}
        .wave-text:hover .wc{animation:waveBounce .55s cubic-bezier(.34,1.56,.64,1) forwards}
        .wave-text:hover .wc:nth-child(1){animation-delay:.00s}.wave-text:hover .wc:nth-child(2){animation-delay:.04s}
        .wave-text:hover .wc:nth-child(3){animation-delay:.08s}.wave-text:hover .wc:nth-child(4){animation-delay:.12s}
        .wave-text:hover .wc:nth-child(5){animation-delay:.16s}.wave-text:hover .wc:nth-child(6){animation-delay:.20s}
        .wave-text:hover .wc:nth-child(7){animation-delay:.24s}.wave-text:hover .wc:nth-child(8){animation-delay:.28s}
        .wave-text:hover .wc:nth-child(9){animation-delay:.32s}.wave-text:hover .wc:nth-child(10){animation-delay:.36s}
        .wave-text:hover .wc:nth-child(11){animation-delay:.40s}.wave-text:hover .wc:nth-child(12){animation-delay:.44s}
        .scrollFade{opacity:0;transform:translateY(20px);transition:opacity .8s ease,transform .8s ease}
        .scrollFade.visible{opacity:1;transform:translateY(0)}
        html{scroll-behavior:smooth}body{background:${T.bg};margin:0}
        .lift{transition:transform .3s cubic-bezier(.34,1.56,.64,1)}.lift:hover{transform:translateY(-8px)}
        .bsc{transition:transform .18s cubic-bezier(.34,1.56,.64,1)}.bsc:hover{transform:scale(1.04)}
        .arr{display:inline-block;transition:transform .18s}.bsc:hover .arr{transform:translateX(4px)}
        *{transition:background-color .4s ease,border-color .35s ease,box-shadow .35s ease,opacity .3s ease}
      `}}/>

      {isDark?<WaveBackground/>:<LightBackground/>}
      {isDark&&<TubesCursor/>}

      {/* NAVBAR */}
      <nav className="anim d1" style={{...gs(),position:'fixed',top:0,left:0,width:'100%',zIndex:100,borderBottom:`1px solid ${T.border}`,boxSizing:'border-box'}}>
        <div style={{maxWidth:1400,margin:'0 auto',padding:'0 48px',height:60,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:17,letterSpacing:'-.02em'}}>
            <span style={{color:T.muted,fontWeight:300}}>Cognitive</span>
            <span style={{color:T.text,fontWeight:700,marginLeft:4}}>Campus</span>
          </div>
          <div style={{display:'flex',gap:32,fontSize:14,fontWeight:500,color:T.muted}}>
            {[['#features','Features'],['/problems','Problems'],['/leaderboard','Leaderboard']].map(([h,l],i)=>
              h.startsWith('#')
                ?<a key={i} href={h} style={{color:'inherit',textDecoration:'none'}} onMouseOver={e=>e.target.style.color=T.text} onMouseOut={e=>e.target.style.color=T.muted}>{l}</a>
                :<button key={i} onClick={()=>navigate(h)} style={{background:'none',border:'none',cursor:'pointer',color:T.muted,fontSize:14,fontWeight:500,padding:0}} onMouseOver={e=>e.target.style.color=T.text} onMouseOut={e=>e.target.style.color=T.muted}>{l}</button>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>setIsDark(!isDark)} className="bsc" style={{...gs(),width:38,height:38,borderRadius:'50%',cursor:'pointer',color:T.muted,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {isDark?<Sun size={16}/>:<Moon size={16}/>}
            </button>
            <button onClick={()=>navigate('/login')} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,fontWeight:500,color:T.muted,padding:'0 12px'}} onMouseOver={e=>e.target.style.color=T.text} onMouseOut={e=>e.target.style.color=T.muted}>Log in</button>
            <button onClick={()=>navigate('/register')} className="bsc" style={{background:T.btnBg,color:T.btnTxt,fontSize:14,fontWeight:600,padding:'8px 20px',borderRadius:999,border:'none',cursor:'pointer'}}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* HERO — split layout */}
      <div style={{maxWidth:1400,margin:'0 auto',minHeight:'100vh',padding:'80px 48px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:40,position:'relative',zIndex:10,boxSizing:'border-box'}}>

        {/* Left: badge + subtext + typewriter + buttons + cards */}
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:0}}>
          <div className="anim d2" style={{...gs(),padding:'6px 16px',borderRadius:999,fontSize:12,fontWeight:600,color:T.accent,marginBottom:28,display:'flex',alignItems:'center',gap:8}}>
            <span className="pdot" style={{width:6,height:6,borderRadius:'50%',background:T.accent,display:'inline-block',flexShrink:0}}/>
            ✦ Powered by Bayesian Knowledge Tracing
          </div>

          {/* Scroll-fade subtext */}
          <div ref={subRef} className={`scrollFade${subVis?' visible':''}`} style={{marginBottom:16}}>
            <p style={{fontSize:'clamp(.95rem,1.5vw,1.1rem)',color:T.muted,lineHeight:1.75,maxWidth:420,margin:0}}>
              Adaptive problem recommendations. Real-time mastery tracking.
            </p>
            <p style={{fontSize:'clamp(.95rem,1.5vw,1.1rem)',color:T.accent,lineHeight:1.75,maxWidth:420,margin:'8px 0 0',fontWeight:500}}>
              <Typewriter texts={['A platform that learns how you learn.','BKT-powered skill mastery.','Your path to placement success.']} speed={60} deleteSpeed={35} delay={2000}/>
            </p>
          </div>

          {/* Buttons */}
          <div ref={btnRef} className={`scrollFade${btnVis?' visible':''}`} style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:48}}>
            <button onClick={()=>navigate('/register')} className="bsc" style={{background:T.btnBg,color:T.btnTxt,fontWeight:600,fontSize:15,padding:'14px 30px',borderRadius:999,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              Start for free <span className="arr">→</span>
            </button>
            <button className="bsc" style={{...gs(),color:T.text,fontWeight:500,fontSize:15,padding:'14px 30px',borderRadius:999,cursor:'pointer'}}>
              See how it works
            </button>
          </div>

          {/* Stats display cards */}
          <div ref={statsRef} className={`scrollFade${statsVis?' visible':''}`}>
            <StatsDisplayCards isDark={isDark} T={T}/>
          </div>
        </div>

        {/* Right: Circular reveal component */}
        <div className="anim d4 float" style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center', zIndex: 20}}>
          <CircularRevealHeading
            size="lg"
            items={[
               { text: "ALGORITHMS", image: "https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkceCYjHtyWSduj04chzxgP3pt1Dvo8KfCsHnwk" },
               { text: "DATA STRUCTURES", image: "https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcZY3vRlCe5wpMsRmKntGfIu4E6OSxhgzL3kU1" },
               { text: "PROBLEM SOLVING", image: "https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcz9VsoNLlt5AKuj9HqWQm3NeDUywcLSxB6Yo1" },
               { text: "PLACEMENTS", image: "https://kxptt4m9j4.ufs.sh/f/9YHhEDeslzkcypc1wWQBS4VNPtfqkpIhO7M6XUva5TzWomdZ" }
            ]}
            centerText={
               <div className="flex flex-col items-center select-none cursor-default">
                  <span className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">COGNITIVE</span>
                  <span className="text-[clamp(1.6rem,3.5vw,2.2rem)] font-bold tracking-tight text-cyan-400 drop-shadow-[0_2px_12px_rgba(34,211,238,0.5)] leading-none italic mt-[-4px]">CAMPUS</span>
               </div>
            }
          />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div id="features" style={{maxWidth:1200,margin:'0 auto',padding:'140px 24px 16px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',zIndex:10}}>
        <span style={{...gs(),padding:'4px 12px',borderRadius:999,fontSize:11,fontWeight:700,letterSpacing:'.15em',color:T.faint,textTransform:'uppercase',marginBottom:20,display:'inline-block'}}>How it works</span>
        <HandWrittenTitle title="From Problem to Mastery" subtitle="Every step powered by adaptive intelligence." />
      </div>
      <GeminiSvgSection isDark={isDark}/>

      {/* FEATURE CARDS */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px 112px', display:'flex', justifyContent:'center', position:'relative',zIndex:10}}>
        <DisplayCards cards={[
          {
            icon: <Brain className="w-5 h-5 text-pink-300" />,
            title: "BKT Engine",
            description: "Bayesian Knowledge Tracing adapts in real-time.",
            date: "CORE SYSTEM",
            iconClassName: "text-pink-400 font-bold",
            titleClassName: "text-pink-400 font-bold",
            className: "[grid-area:stack] hover:-translate-y-16 hover:translate-x-[-12rem] hover:-rotate-6 hover:scale-105 before:absolute before:w-[100%] before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-[#080810]/60 grayscale-[80%] hover:grayscale-0 before:opacity-100 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0 shadow-2xl z-10"
          },
          {
            icon: <Zap className="w-5 h-5 text-orange-300" />,
            title: "Instant Execution",
            description: "Piston API executes Code in <1sec.",
            date: "INFRASTRUCTURE",
            iconClassName: "text-orange-400 font-bold",
            titleClassName: "text-orange-400 font-bold",
            className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-12 hover:-rotate-3 hover:scale-105 before:absolute before:w-[100%] before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-[#080810]/60 grayscale-[80%] hover:grayscale-0 before:opacity-100 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0 shadow-2xl z-20"
          },
          {
            icon: <Trophy className="w-5 h-5 text-blue-300" />,
            title: "Live Leaderboard",
            description: "Real-time global ranking updates.",
            date: "COMMUNITY",
            iconClassName: "text-blue-400 font-bold",
            titleClassName: "text-blue-400 font-bold",
            className: "[grid-area:stack] translate-x-32 translate-y-20 hover:-translate-y-8 hover:translate-x-[12rem] hover:rotate-6 hover:scale-105 shadow-2xl z-30 transition-all duration-700"
          }
        ]} />
      </div>

      {/* TRUST STATS */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'96px 24px',borderTop:`1px solid ${T.divider}`,position:'relative',zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:80}}>
          <div style={{flex:1}}>
            <span style={{...gs(),padding:'4px 12px',borderRadius:999,fontSize:11,fontWeight:700,letterSpacing:'.15em',color:T.faint,textTransform:'uppercase',display:'inline-block',marginBottom:24}}>Platform Stats</span>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:700,letterSpacing:'-.035em',lineHeight:1.1,margin:'0 0 20px',color:T.text}}>
              Built for placement.<br/><span style={{color:T.faint}}>Designed for mastery.</span>
            </h2>
            <p style={{fontSize:'clamp(.95rem,1.4vw,1.1rem)',color:T.muted,lineHeight:1.75,margin:0}}>Every feature is optimised to get you interview-ready faster — without burning out.</p>
          </div>
          <div style={{flex:1}}>
            <div style={{...gsh(),borderRadius:24,padding:40,position:'relative',overflow:'hidden',boxShadow:`0 24px 60px ${T.shadow}`}}>
              <div style={{position:'absolute',top:-60,right:-60,width:220,height:220,background:`radial-gradient(circle,${isDark?'rgba(0,212,255,.07)':'rgba(0,120,220,.05)'} 0%,transparent 70%)`,borderRadius:'50%'}}/>
              <div style={{display:'flex',gap:8,marginBottom:32,flexWrap:'wrap'}}>
                {[{l:'ACTIVE',c:'#34d399',dot:true},{l:'ADAPTIVE',c:T.accent},{l:'REAL-TIME',c:T.faint}].map((p,i)=>(
                  <div key={i} style={{...gs(),padding:'6px 12px',borderRadius:999,display:'flex',alignItems:'center',gap:6}}>
                    {p.dot&&<span style={{width:8,height:8,borderRadius:'50%',background:p.c,display:'inline-block'}}/>}
                    <span style={{fontSize:10,fontWeight:700,letterSpacing:'.12em',color:p.c}}>{p.l}</span>
                  </div>
                ))}
              </div>
              {[{l:'36+ Problems',pct:'100%',bg:isDark?'white':T.accent},{l:'12 DSA Skills',pct:'85%',bg:`linear-gradient(90deg,${T.accent},${T.accent2})`},{l:'BKT Accuracy',pct:'94%',bg:T.accent}].map((b,i)=>(
                <div key={i} style={{marginBottom:i<2?28:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:14,fontWeight:500,marginBottom:10,color:T.text}}>
                    <span>{b.l}</span><span style={{color:T.faint}}>{b.pct}</span>
                  </div>
                  <div style={{height:3,width:'100%',borderRadius:999,background:isDark?'rgba(255,255,255,.07)':'rgba(0,0,0,.08)',overflow:'hidden'}}>
                    <div className="pbar" style={{height:'100%',borderRadius:999,background:b.bg,'--pw':b.pct}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Marquee */}
        <div style={{overflow:'hidden',width:'100vw',position:'relative',left:'50%',transform:'translateX(-50%)',marginTop:112,padding:'16px 0',borderTop:`1px solid ${T.divider}`,borderBottom:`1px solid ${T.divider}`,maskImage:'linear-gradient(to right,transparent,black 12%,black 88%,transparent)',WebkitMaskImage:'linear-gradient(to right,transparent,black 12%,black 88%,transparent)'}}>
          <div className="marquee" style={{gap:48,color:T.marq,fontFamily:'monospace',fontSize:12,letterSpacing:'.16em',textTransform:'uppercase',userSelect:'none'}}>
            {[...Array(2)].flatMap((_,r)=>['Arrays','Linked Lists','Binary Trees','Graph BFS','Dynamic Programming','Stacks','Queues','Heaps','Sorting','Recursion','Tries','Two Pointers'].map((t,i)=><span key={`${r}-${i}`} style={{whiteSpace:'nowrap'}}>· {t}</span>))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{padding:'160px 24px',display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',position:'relative',zIndex:10}}>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:900,height:900,pointerEvents:'none',background:`radial-gradient(ellipse,${isDark?'rgba(0,212,255,.04)':'rgba(0,100,220,.04)'} 0%,transparent 65%)`}}/>
        <span style={{...gs(),padding:'4px 12px',borderRadius:999,fontSize:11,fontWeight:700,letterSpacing:'.15em',color:T.faint,textTransform:'uppercase',marginBottom:32,display:'inline-block'}}>Get Started</span>
        <h2 style={{fontSize:'clamp(2.4rem,8vw,5.5rem)',fontWeight:800,letterSpacing:'-.04em',lineHeight:1.0,margin:'0 0 16px',color:T.text}}>Ready to master DSA?</h2>
        <p style={{fontSize:'clamp(1rem,1.8vw,1.25rem)',color:T.muted,margin:'0 0 12px'}}>
          <Typewriter texts={['Join students already solving smarter.','Land your dream placement.','Start your BKT journey today.']} speed={70} deleteSpeed={35} delay={2200}/>
        </p>
        <p style={{fontSize:'clamp(.9rem,1.4vw,1rem)',color:T.faint,margin:'0 0 48px'}}>No credit card required. Free forever.</p>
        <button onClick={()=>navigate('/register')} className="bsc" style={{background:T.btnBg,color:T.btnTxt,fontWeight:600,fontSize:16,padding:'16px 48px',borderRadius:999,border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:`0 0 50px ${isDark?'rgba(0,212,255,.15)':'rgba(0,100,220,.18)'}`}}>
          Get Started for Free <span className="arr">→</span>
        </button>
      </div>

      {/* FOOTER */}
      <footer style={{maxWidth:1400,margin:'0 auto',padding:'32px 48px',borderTop:`1px solid ${T.divider}`,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:13,color:T.footerTxt,position:'relative',zIndex:10,boxSizing:'border-box'}}>
        <p style={{margin:0}}>© 2025 Cognitive Campus · 22AIE457 · Amrita School of Computing</p>
        <div style={{display:'flex',gap:24,fontWeight:500}}>
          <a href="https://github.com/SupreethReddy25/cognitive-campus" target="_blank" rel="noreferrer" style={{color:'inherit',textDecoration:'none'}}>GitHub</a>
          <button onClick={()=>navigate('/problems')} style={{background:'none',border:'none',cursor:'pointer',color:T.footerTxt,fontSize:13,fontWeight:500,padding:0}}>Problems</button>
          <button onClick={()=>navigate('/leaderboard')} style={{background:'none',border:'none',cursor:'pointer',color:T.footerTxt,fontSize:13,fontWeight:500,padding:0}}>Leaderboard</button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;