const OWNER_KEY="tm_owners_v1",TASK_KEY="tm_tasks_v1";
const defaultOwners=["Thomas","CyberArk Team","IAM Team","Vendor"];
let owners=[];
let tasks=[];
let activeTaskId=null;

function loadData(){
  try{owners=JSON.parse(localStorage.getItem(OWNER_KEY)||"null")||[...defaultOwners]}catch(e){owners=[...defaultOwners]}
  try{tasks=JSON.parse(localStorage.getItem(TASK_KEY)||"[]")||[]}catch(e){tasks=[]}
  if(!Array.isArray(owners)||!owners.length) owners=[...defaultOwners];
  if(!Array.isArray(tasks)) tasks=[];
}
function save(){
  try{
    localStorage.setItem(TASK_KEY,JSON.stringify(tasks));
    localStorage.setItem(OWNER_KEY,JSON.stringify(owners));
    const check=localStorage.getItem(TASK_KEY);
    if(check===null) throw new Error("Storage unavailable");
    return true;
  }catch(e){
    alert("Unable to save this task on this browser/device. Please make sure website storage is allowed and try again.");
    return false;
  }
}
function makeId(){return "task-"+Date.now()+"-"+Math.random().toString(36).slice(2,10)}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmtDate(d){if(!d)return "No date";return new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
function fmtDateTime(d,t){return d?fmtDate(d)+(t?" "+t:""):"Not set"}
function isOverdue(t){return t.status!=="Completed"&&t.dueDate&&new Date(t.dueDate+"T"+(t.dueTime||"23:59"))<new Date()}
function followDateTime(t){return t.followDate?new Date(t.followDate+"T"+(t.followTime||"09:00")):null}
function isFollowDue(t){const d=followDateTime(t);return !!(d&&t.reminderEnabled&&t.status!=="Completed"&&d<=new Date())}
function renderOwners(){const f=document.getElementById("filterOwner"),cur=f.value;f.innerHTML='<option value="All">All Owners</option>'+owners.map(o=>`<option>${esc(o)}</option>`).join("");f.value=owners.includes(cur)?cur:"All";document.getElementById("owner").innerHTML=owners.map(o=>`<option>${esc(o)}</option>`).join("")}
function renderStats(){let c={New:0,Pending:0,"In Progress":0,Completed:0};tasks.forEach(t=>{if(c[t.status]!==undefined)c[t.status]++});document.getElementById("stats").innerHTML=[["New",c.New],["Pending",c.Pending],["In Progress",c["In Progress"]],["Completed",c.Completed]].map(x=>`<div class="stat"><div class="n">${x[1]}</div><div class="l">${x[0]}</div></div>`).join("")}
function renderReminder(){const box=document.getElementById("reminderBanner");if(!box)return;const due=tasks.filter(isFollowDue);const soon=tasks.filter(t=>t.reminderEnabled&&t.followDate&&t.status!=="Completed"&&followDateTime(t)>new Date()&&followDateTime(t)<=new Date(Date.now()+86400000));const items=[...due,...soon.filter(t=>!due.includes(t))];box.innerHTML=items.length?`<div class="reminder"><strong>⏰ Follow-up Reminder</strong><br>${items.slice(0,3).map(t=>`${isFollowDue(t)?"🔴":"🔵"} <b>${esc(t.name)}</b> — ${isFollowDue(t)?"Due":"Follow-up"} ${fmtDateTime(t.followDate,t.followTime)}${t.nextAction?" · "+esc(t.nextAction):""}`).join("<br>")}</div>`:""}
function render(){
  renderOwners();renderStats();renderReminder();
  const q=(document.getElementById("search").value||"").toLowerCase(),fs=document.getElementById("filterStatus").value,fo=document.getElementById("filterOwner").value;
  const list=tasks.filter(t=>(fs==="All"||t.status===fs)&&(fo==="All"||t.owner===fo)&&((t.name+" "+t.description+" "+t.category+" "+t.owner+" "+(t.currentUpdate||"")+" "+(t.waitingFor||"")+" "+(t.nextAction||"")).toLowerCase().includes(q))).sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999"));
  document.getElementById("taskCount").textContent=list.length+" task(s)";
  document.getElementById("taskList").innerHTML=list.length?list.map(t=>{const overdue=isOverdue(t),fdue=isFollowDue(t);return `<div class="task ${t.status==="Completed"?"done":""}"><div class="task-top"><div class="task-name">${esc(t.name)}</div><span class="badge ${t.priority==="Critical"?"critical":t.priority==="High"?"high":""}">${esc(t.status)}</span></div><div class="task-meta">👤 ${esc(t.owner)} · 📅 ${fmtDateTime(t.dueDate,t.dueTime)} · ${esc(t.priority)}${overdue?" · 🔴 OVERDUE":""}<br>${esc(t.category||"No category")}</div>${t.currentUpdate?`<div class="current-update"><b>Latest Update</b>${esc(t.currentUpdate)}${t.waitingFor&&t.waitingFor!=="—"?`<div class="waiting">⏳ Waiting for: ${esc(t.waitingFor)}${t.waitingPerson?" — "+esc(t.waitingPerson):""}</div>`:""}${t.nextAction?`<div class="next">➡️ Next: ${esc(t.nextAction)}</div>`:""}${t.followDate?`<div class="follow ${fdue?"overdue-follow":""}">⏰ Follow-up: ${fmtDateTime(t.followDate,t.followTime)}${fdue?" — DUE":""}</div>`:""}</div>`:""}<div class="task-actions"><button onclick="openTask('${esc(t.id)}')">Edit</button><button onclick="openUpdate('${esc(t.id)}')">＋ Update</button><button onclick="openDetails('${esc(t.id)}')">Details</button>${t.status!=="Completed"?`<button onclick="completeTask('${esc(t.id)}')">✓ Complete</button>`:""}<button class="delete-btn" onclick="deleteTask('${esc(t.id)}')">Delete</button></div></div>`}).join(""):'<div class="empty">No tasks found.<br>Tap “+ New Task” to create one.</div>';
}
function openTask(id){document.getElementById("modalTitle").textContent=id?"Edit Task":"New Task";if(id){const t=tasks.find(x=>x.id===id);if(!t)return;document.getElementById("taskId").value=id;["name","description","owner","priority","startDate","startTime","dueDate","dueTime","category","status"].forEach(k=>document.getElementById(k).value=t[k]||"")}else{document.getElementById("taskId").value="";["name","description","startDate","startTime","dueDate","dueTime","category"].forEach(k=>document.getElementById(k).value="");document.getElementById("owner").value=owners[0]||"Thomas";document.getElementById("priority").value="Medium";document.getElementById("status").value="New"}document.getElementById("modal").classList.add("show")}
function closeModal(){document.getElementById("modal").classList.remove("show")}
function saveTask(){
  const id=document.getElementById("taskId").value,now=new Date().toISOString();
  const data={id:id||makeId(),name:document.getElementById("name").value.trim(),description:document.getElementById("description").value.trim(),owner:document.getElementById("owner").value,priority:document.getElementById("priority").value,startDate:document.getElementById("startDate").value,startTime:document.getElementById("startTime").value,dueDate:document.getElementById("dueDate").value,dueTime:document.getElementById("dueTime").value,category:document.getElementById("category").value.trim(),status:document.getElementById("status").value};
  if(!data.name){alert("Please enter a task name.");return}
  if(id){const old=tasks.find(t=>t.id===id);if(!old){alert("Task not found.");return}data.createdAt=old.createdAt;data.history=old.history||[];data.currentUpdate=old.currentUpdate;data.waitingFor=old.waitingFor;data.waitingPerson=old.waitingPerson;data.nextAction=old.nextAction;data.followDate=old.followDate;data.followTime=old.followTime;data.reminderEnabled=!!old.reminderEnabled;if(old.status!==data.status)data.history.push({time:now,action:`Status changed: ${old.status} → ${data.status}`});Object.assign(old,data)}else{data.createdAt=now;data.history=[{time:now,action:"Task created",by:""}];data.reminderEnabled=false;tasks.push(data)}
  if(save()){closeModal();render()}
}
function openUpdate(id){activeTaskId=id;const t=tasks.find(x=>x.id===id);if(!t)return;document.getElementById("updateText").value="";document.getElementById("updateStatus").value=t.status;document.getElementById("waitingFor").value=t.waitingFor||"—";document.getElementById("waitingPerson").value=t.waitingPerson||"";document.getElementById("nextAction").value=t.nextAction||"";document.getElementById("followDate").value=t.followDate||"";document.getElementById("followTime").value=t.followTime||"";document.getElementById("updateBy").value="";document.getElementById("reminderEnabled").checked=!!t.reminderEnabled;document.getElementById("updateModal").classList.add("show")}
function closeUpdate(){document.getElementById("updateModal").classList.remove("show")}
function saveUpdate(){const t=tasks.find(x=>x.id===activeTaskId),text=document.getElementById("updateText").value.trim();if(!t)return;if(!text){alert("Please enter the update.");return}const now=new Date().toISOString(),newStatus=document.getElementById("updateStatus").value;const entry={time:now,action:text,by:document.getElementById("updateBy").value.trim(),status:newStatus,waitingFor:document.getElementById("waitingFor").value,waitingPerson:document.getElementById("waitingPerson").value.trim(),nextAction:document.getElementById("nextAction").value.trim(),followDate:document.getElementById("followDate").value,followTime:document.getElementById("followTime").value};t.history=t.history||[];t.history.push(entry);t.currentUpdate=text;t.waitingFor=entry.waitingFor;t.waitingPerson=entry.waitingPerson;t.nextAction=entry.nextAction;t.followDate=entry.followDate;t.followTime=entry.followTime;t.reminderEnabled=document.getElementById("reminderEnabled").checked;t.status=newStatus;if(newStatus==="Completed")t.completedAt=now;if(save()){closeUpdate();render()}}
function deleteTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;if(!confirm(`Delete this task?\n\n${t.name}\n\nThis will remove the task and its update history from this device.`))return;const old=tasks;tasks=tasks.filter(x=>x.id!==id);if(!save()){tasks=old;return}render()}
function completeTask(id){const t=tasks.find(x=>x.id===id);if(!t)return;t.history=t.history||[];t.history.push({time:new Date().toISOString(),action:`Status changed: ${t.status} → Completed`,by:""});t.status="Completed";t.completedAt=new Date().toISOString();if(save())render()}
function openDetails(id){activeTaskId=id;const t=tasks.find(x=>x.id===id),h=t.history||[];document.getElementById("detailContent").innerHTML=`<div class="current-update"><b>Current Status</b>${esc(t.status)}<br><b>Latest Update</b>${esc(t.currentUpdate||"No update yet.")}${t.waitingFor&&t.waitingFor!=="—"?`<div class="waiting">⏳ Waiting for: ${esc(t.waitingFor)}${t.waitingPerson?" — "+esc(t.waitingPerson):""}</div>`:""}${t.nextAction?`<div class="next">➡️ Next Action: ${esc(t.nextAction)}</div>`:""}${t.followDate?`<div class="follow ${isFollowDue(t)?"overdue-follow":""}">📅 Follow-up: ${fmtDateTime(t.followDate,t.followTime)}${isFollowDue(t)?" — DUE":""}</div>`:""}</div><h3>Update History</h3>${h.length?h.slice().reverse().map(x=>`<div class="history-item"><div class="history-time">${new Date(x.time).toLocaleString()}${x.by?" · "+esc(x.by):""}</div><div class="history-action">${esc(x.action)}</div>${x.waitingFor&&x.waitingFor!=="—"?`<div class="history-extra">Waiting for: ${esc(x.waitingFor)}${x.waitingPerson?" — "+esc(x.waitingPerson):""}<br>Next: ${esc(x.nextAction||"—")}${x.followDate?"<br>Follow-up: "+fmtDate(x.followDate):""}</div>`:""}</div>`).join(""):"<p class='helper'>No update history yet.</p>"}<div class="actions"><button class="secondary" onclick="closeDetail()">Close</button><button class="primary" onclick="closeDetail();openUpdate('${esc(t.id)}')">＋ Add Update</button></div>`;document.getElementById("detailModal").classList.add("show")}
function closeDetail(){document.getElementById("detailModal").classList.remove("show")}
function showDashboard(){render()}
function showFollowups(){const list=tasks.filter(t=>t.followDate&&t.status!=="Completed").sort((a,b)=>(followDateTime(a)||0)-(followDateTime(b)||0));alert(list.length?list.map(t=>`${isFollowDue(t)?"🔴 DUE":"⏰"} ${t.name}\n${fmtDateTime(t.followDate,t.followTime)}\n${t.nextAction||"No next action"}`).join("\n\n"):"No active follow-ups.")}
function showHistory(){const all=[];tasks.forEach(t=>(t.history||[]).forEach(h=>all.push({...h,task:t.name})));all.sort((a,b)=>b.time.localeCompare(a.time));alert(all.length?all.slice(0,30).map(h=>`${new Date(h.time).toLocaleString()} — ${h.task}\n${h.action}`).join("\n\n"):"No history yet.")}
loadData();render();
