// ---------- 資料 ----------
const DATA = {
  bro: { tools: ["大板","小板","手掌","皮帶","棍子","軟拍","桌球拍","戒尺"], counts: ["60","50","40","30","20"] },
  sis: { acts: ["按壓","親吻","舔舐","撫摸","輕拍"], parts: ["臉部","胸部","背部","臀部","肉棒","肉穴"] },
};

// ---------- UI refs ----------
const boardEl = document.getElementById('board');
const logEl = document.getElementById('log');
const taskBox = document.getElementById('taskBox');
const diceValEl = document.getElementById('diceVal');
const turnNameEl = document.getElementById('turnName');
const rollA = document.getElementById('rollA');
const rollB = document.getElementById('rollB');
const doneBtn = document.getElementById('doneBtn');
const failBtn = document.getElementById('failBtn');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const pauseBtn = document.getElementById('pauseBtn');
const broToolsEl = document.getElementById('broTools');
const broCountsEl = document.getElementById('broCounts');
const sisActsEl = document.getElementById('sisActs');
const sisPartsEl = document.getElementById('sisParts');
const chestModal = document.getElementById('chestModal');
const chestContent = document.getElementById('chestContent');
const closeChest = document.getElementById('closeChest');

// ---------- State ----------
let drawMode='self', started=false;
const players = [ {name:'哥哥', pos:0, key:'sis'}, {name:'弟弟', pos:0, key:'bro'} ];
let turn=0, mustComplete=false, lastRoll=0;

// ---------- 函數 ----------
function makeCheckList(values, group, defaults=[]){
  return values.map(v=>`<label><input type="checkbox" data-group="${group}" value="${v}" ${defaults.includes(v)?'checked':''}/> ${v}</label>`).join('');
}
function renderPools(){
  broToolsEl.innerHTML = makeCheckList(DATA.bro.tools,'broTools',DATA.bro.tools.slice(0,5));
  broCountsEl.innerHTML = makeCheckList(DATA.bro.counts,'broCounts',DATA.bro.counts);
  sisActsEl.innerHTML = makeCheckList(DATA.sis.acts,'sisActs',DATA.sis.acts);
  sisPartsEl.innerHTML = makeCheckList(DATA.sis.parts,'sisParts',DATA.sis.parts);
}
function getChecked(group){ return Array.from(document.querySelectorAll(`input[data-group="${group}"]:checked`)).map(i=>i.value); }
function $(sel){return document.querySelector(sel);}
function log(msg){ const time=new Date().toLocaleTimeString('zh-TW',{hour12:false}); logEl.innerHTML=`[${time}] ${msg}<br>`+logEl.innerHTML; }
function buildBoard(){ boardEl.innerHTML=''; for(let i=1;i<=25;i++){ const cell=document.createElement('div'); cell.className='cell'; cell.innerHTML=`<span class="idx">${i}</span>`; const token=document.createElement('div'); token.className='token'; if(i===1){ token.innerHTML=`<span class="dot pA" title="哥哥"></span><span class="dot pB" title="弟弟"></span>`;} cell.appendChild(token); boardEl.appendChild(cell);} }
function updateTokens(){ document.querySelectorAll('.cell .token').forEach(t=>t.innerHTML=''); players.forEach((p,idx)=>{ const cellIdx=Math.min(24,p.pos)+1; const tokenEl=boardEl.children[cellIdx-1].querySelector('.token'); const span=document.createElement('span'); span.className='dot '+(idx===0?'pA':'pB'); span.title=p.name; tokenEl.appendChild(span); });}
function setTurn(t){ turn=t; turnNameEl.textContent=players[turn].name; rollA.disabled=turn!==0||mustComplete||!started; rollB.disabled=turn!==1||mustComplete||!started; doneBtn.disabled=!mustComplete; failBtn.disabled=!mustComplete;}
failBtn.addEventListener('click', failTask);
function randPick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function currentPools(){ return { broTools:getChecked('broTools'), broCounts:getChecked('broCounts'), sisActs:getChecked('sisActs'), sisParts:getChecked('sisParts') }; }
function ensurePoolsOK(){ const P=currentPools(); const ok=P.broTools.length&&P.broCounts.length&&P.sisActs.length&&P.sisParts.length; if(!ok) alert('請至少在每個區塊勾選 1 項！'); return ok; }
function makeTaskText(rollerIdx, drawVal){ const P=currentPools(); const me=players[rollerIdx]; const other=players[1-rollerIdx]; let text=''; if(me.key==='bro'){ const tool=randPick(P.broTools); const count=randPick(P.broCounts); text=`${other.name} 用「${tool}」對 ${me.name} 進行 ${count} 次教訓。`; }else{ const act=randPick(P.sisActs); const part=randPick(P.sisParts); let times=1; if(["擊掌","握手"].includes(act)) times=Math.ceil(Math.random()*5); text=`${me.name} 對 ${other.name} 的「${part}」進行「${act}」${times} 次。`; } return text; }
function rollDice(by){ if(!started){alert('請先開始遊戲');return;} if(!ensurePoolsOK()) return; if(by!==turn){alert('還沒輪到你喔');return;} const val=Math.floor(Math.random()*6)+1; lastRoll=val; diceValEl.textContent=val; const task=makeTaskText(by,val); taskBox.textContent='任務：'+task; log(`${players[by].name} 擲出 ${val} 點。`); mustComplete=true; setTurn(turn);}
function completeTask(){ if(!mustComplete) return; players[turn].pos=Math.min(24,players[turn].pos+lastRoll); updateTokens(); log(`${players[turn].name} 完成任務，前進 ${lastRoll} 格（到達第 ${players[turn].pos+1} 格）。`); mustComplete=false; diceValEl.textContent='—'; taskBox.textContent='等待擲骰…'; if(players[turn].pos>=24){ openChest(turn);} else{ setTurn(1-turn); } }
function failTask(){ if(!mustComplete) return; log(`${players[turn].name} 任務失敗，未前進。`); mustComplete=false; diceValEl.textContent='—'; taskBox.textContent='等待擲骰…'; setTurn(1-turn);}
function openChest(winnerIdx){ const winner=players[winnerIdx], loser=players[1-winnerIdx], P=currentPools(); chestContent.innerHTML=''; let rewards=[]; if(loser.key==='bro'){ for(let i=0;i<3;i++){ const tool=randPick(P.broTools); const part=randPick(P.sisParts); rewards.push(`${winner.name} 用「${tool}」打 ${loser.name} ${part}`); } }else{ for(let i=0;i<3;i++){ const act=randPick(P.sisActs); const part=randPick(P.sisParts); rewards.push(`${winner.name} 讓 ${loser.name} 對「${part}」進行「${act}」`); } } rewards.forEach(r=>{ const d=document.createElement('div'); d.textContent=r; d.className='tag'; chestContent.appendChild(d); }); chestModal.style.display='flex'; log(`${winner.name} 獲勝！寶箱開啟。`);}
closeChest.addEventListener('click',()=>{chestModal.style.display='none';});
function resetGame(){ started=false; players.forEach(p=>p.pos=0); updateTokens(); diceValEl.textContent='—'; taskBox.textContent='等待擲骰…'; log('遊戲已重置'); setTurn(0);}
startBtn.addEventListener('click',()=>{ if(!ensurePoolsOK()) return; started=true; buildBoard(); updateTokens(); setTurn(0); log('遊戲開始！'); });
rollA.addEventListener('click',()=>rollDice(0));
rollB.addEventListener('click',()=>rollDice(1));
doneBtn.addEventListener('click',completeTask);
resetBtn.addEventListener('click',resetGame);
pauseBtn.addEventListener('click',()=>{started=!started; log(started?'遊戲繼續':'遊戲暫停'); setTurn(turn);});
renderPools();
