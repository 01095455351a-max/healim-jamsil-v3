const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const PAGES=['/','/diseases/adhd/','/diseases/depression/','/diseases/tic/','/first-visit/','/directions/',
             '/column/','/notice/','/reviews/','/board/','/doctors/ryu-seokgyun/','/doctors/seok-seonhui/','/privacy/','/terms/'];
const CSS = process.argv[2] || '';
(async()=>{
  const b=await chromium.launch();
  let total=0; const samples=[];
  for (const w of [1440, 390]) {
    const ctx=await b.newContext({viewport:{width:w,height:900}});
    await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, r=>r.abort());
    const p=await ctx.newPage();
    let sub=0;
    for (const u of PAGES) {
      await p.goto('http://127.0.0.1:8899'+u,{waitUntil:'load'});
      if (CSS) await p.addStyleTag({content:CSS});
      const found=await p.evaluate(()=>{
        const HAN=/[가-힣]/;
        const out=[];
        const walk=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n; const r=document.createRange();
        while(n=walk.nextNode()){
          const t=n.data; if(t.trim().length<8) continue;
          const st=getComputedStyle(n.parentElement);
          if(st.display==='none'||st.visibility==='hidden') continue;
          let prevTop=null;
          for(let i=0;i<t.length;i++){
            r.setStart(n,i); r.setEnd(n,i+1);
            const c=r.getBoundingClientRect(); if(!c.width) continue;
            const top=Math.round(c.top);
            if(prevTop!==null && top>prevTop+2){
              // 줄이 바뀐 자리 — 앞뒤가 모두 한글이고 사이에 공백이 없으면 단어 중간 끊김
              let j=i-1; while(j>=0 && !t[j].trim()) j--;
              if(j>=0 && HAN.test(t[j]) && HAN.test(t[i]) && j===i-1)
                out.push(t.slice(Math.max(0,i-12),i)+'/'+t.slice(i,i+8));
            }
            prevTop=top;
          }
        }
        return out;
      });
      sub+=found.length;
      found.slice(0,2).forEach(f=>samples.push(`${w}px ${u} … ${f}`));
    }
    console.log(`${w}px — 단어 중간 끊김 ${sub}곳`);
    total+=sub; await ctx.close();
  }
  console.log(`합계 ${total}곳`);
  console.log('예시:'); samples.slice(0,10).forEach(s=>console.log('  '+s));
  await b.close();
})();
