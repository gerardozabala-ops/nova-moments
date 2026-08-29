const modal=document.getElementById('modal');
const open=document.getElementById('experienceBtn');
const close=document.getElementById('closeModal');
const list=document.getElementById('listBtn');
if(open) open.addEventListener('click',()=>modal.classList.add('show'));
if(close) close.addEventListener('click',()=>modal.classList.remove('show'));
if(modal) modal.addEventListener('click',e=>{if(e.target===modal) modal.classList.remove('show')});
if(list) list.addEventListener('click',()=>alert('Tu lista estará disponible cuando activemos tu cuenta.'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal) modal.classList.remove('show')});
