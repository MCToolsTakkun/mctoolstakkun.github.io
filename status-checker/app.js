const $ = id => document.getElementById(id);
async function fetchStatus(addr){
  const url = CONFIG.API_BASE + encodeURIComponent(addr);
  const res = await fetch(url);
  if(!res.ok) throw new Error('API error');
  return res.json();
}
function render(data, addr){
  const online = data.online ? 'オンライン' : 'オフライン';
  const players = data.players ? `${data.players.online}/${data.players.max}` : '不明';
  const motd = data.motd?.clean?.join('\n') || '説明なし';
  const icon = data.icon || '';
  const ping = data.debug?.ping ?? 'N/A';
  document.getElementById('result').innerHTML = `
    <div class="server-row">
      ${icon?`<img class="icon" src="${icon}" alt="icon">`:''}
      <div>
        <h2>${addr} — <span class="badge">${online}</span></h2>
        <p><strong>Ping:</strong> ${ping} ms  <strong>Players:</strong> ${players}</p>
        <pre>${motd}</pre>
        <p><strong>Version:</strong> ${data.version||'不明'}</p>
      </div>
    </div>`;
}
let timer = null;
async function updateOnce(addr){
  try{
    const d = await fetchStatus(addr);
    render(d, addr);
  }catch(e){
    document.getElementById('result').textContent = '取得失敗: '+e.message;
  }
}
$('checkBtn').addEventListener('click',()=>{
  const addr = $('serverAddr').value.trim() || CONFIG.DEFAULT_SERVER;
  const sec = Math.max(parseInt($('interval').value,10)||60, CONFIG.POLL_MIN_SEC);
  if(timer) clearInterval(timer);
  updateOnce(addr);
  timer = setInterval(()=>updateOnce(addr), sec*1000);
});
window.addEventListener('load',()=>{
  $('serverAddr').value = CONFIG.DEFAULT_SERVER;
  $('checkBtn').click();
});
