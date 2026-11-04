import { sources, insights, timeline, people, relationships, types } from './data.js';

const CHAT_API_URL = 'https://urmawi-ai.mehdivalipour-co.workers.dev/api/chat';
const APARAT_EMBED = 'https://www.aparat.com/video/video/embed/videohash/fnyrybe/vt/frame';
const APARAT_PAGE = 'https://aparat.com/v/fnyrybe';
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = new Map(sources.map(source => [source.id, source]));
let lang = 'fa';
let currentView = null;
let lastFocus = null;
let chatHistory = [];
let researchHistory = [];
let chatMode = 'persona';
let chatBusy = false;
let chatAbort = null;

const copy = {
  fa: {
    navArchive:'آرشیو منابع', navResearch:'پژوهش‌ها', navLife:'زندگی و ارتباطات',navFilm:'فیلم خنیاگر',navChat:'گفت‌وگو',navContact:'تماس',
    overline:'پایگاه مستقل میراث و پژوهش',heroName:'صفی‌الدین عبدالمؤمن ارموی',heroStatement:'روایتی پژوهشی از زندگی، اندیشه و میراث صفی‌الدین ارموی',
    heroDescription:'منابع تاریخی و نسخه‌شناختی، پژوهش‌های انتقادی و پیوندهای فکری یک چهرهٔ برجستهٔ تاریخ موسیقی؛ در آرشیوی که با هر سند تازه کامل‌تر می‌شود.',
    ctaExplore:'کاوش در منابع',ctaLife:'زندگی و ارتباطات',ctaFilm:'تماشای تیزر خنیاگر',countLabel:'منابع فهرست‌شده',researchLabel:'پرونده‌های پژوهشی',underbarNote:'دانشنامه‌ای در حال گسترش؛ هر ادعا نیازمند شاهد است.',
    footerCredit:'URMAWI — بنیان‌گذاری و مدیریت پروژه: مهدی ولی‌پور',close:'بستن',
    archiveTitle:'آرشیو منابع', researchTitle:'پرونده‌های پژوهشی',lifeTitle:'زندگی و ارتباطات',filmTitle:'خنیاگر',chatTitle:'گفت‌وگو با صفی‌الدین',contactTitle:'ارتباط با URMAWI',
    archiveIntro:'فهرستِ در حال گسترشِ پژوهش‌های مرتبط با صفی‌الدین ارموی. اطلاعات کتاب‌شناختی در دسترس است؛ انتشار متن کامل آثار تابع حقوق نشر و بازبینی علمی خواهد بود.',
    researchIntro:'پرسش‌ها و اختلاف‌نظرهای تاریخ‌پژوهی، نسخه‌شناسی و نظریهٔ موسیقی در پرونده‌های مستقل؛ با ذکر شواهد و حدود قطعیت.',
    lifeIntro:'محور زمان و شبکهٔ اشخاص بر اساس گزارش‌های پژوهشی اولیه. پیوندها به معنی اثبات دیدار مستقیم نیستند؛ برای هر رابطه نوع و منبع را ببینید.',
    search:'جست‌وجو در عنوان، نویسنده و موضوع…',allCategories:'همهٔ موضوع‌ها',openCase:'مشاهدهٔ پرونده',openRecord:'مشاهدهٔ منبع',backArchive:'← بازگشت به آرشیو',backResearch:'← بازگشت به پژوهش‌ها',
    topic:'موضوع',author:'نویسنده / مترجم',published:'مشخصات انتشار',language:'زبان',approach:'رویکرد',abstract:'معرفی و خلاصه',verification:'یادداشت اعتبارسنجی',publicationLink:'مشاهدهٔ پیوند اثر / پژوهش مرتبط',requestAccess:'درخواست اطلاعات یا دسترسی',
    question:'پرسش پژوهش',analysis:'بررسی مقدماتی',qualification:'محدودیت و احتیاط',citations:'منابع مربوط',timelineTab:'خط زمان',networkTab:'شبکهٔ ارتباطات',certainty:'وضعیت شاهد',
    filmIntro:'خنیاگر، بازآفرینی سینمایی از جهان صفی‌الدین ارموی. فیلم یک اثر هنری است و از اسناد پژوهشی تفکیک می‌شود.',openAparat:'پخش در آپارات',filmCredit:'فیلمی از مهدی ولی‌پور',
    chatIntro:'این گفت‌وگو بازآفرینی هوش مصنوعی شخصیت تاریخی است. ارتباط فعلی هنوز سامانهٔ استناددهی قطعی به متن کامل مقالات نیست.',
    chatModePersona:'گفت‌وگو با شخصیت',chatModeResearch:'پرسش از آرشیو',researchHello:'پرسش پژوهشی خود را بنویسید. من پرونده‌ها و منابع مرتبطِ بازبینی‌شده را نشان می‌دهم؛ این بخش هنوز پاسخ‌گوی هوش مصنوعی مبتنی بر متن کامل PDFها نیست.',
    researchNoMatch:'برای این پرسش در پرونده‌های فعلی پاسخ مستند کافی پیدا نشد. موضوع را دقیق‌تر کنید یا از راه ارتباط با پروژه درخواست پژوهشی بفرستید.',
    researchAnswerIntro:'بر پایهٔ پرونده‌های پژوهشی موجود، این موارد مرتبط‌اند:',researchAnswerOutro:'این جمع‌بندی از یادداشت‌های پژوهشی تنظیم شده است و جای مراجعه به اصل مقاله و شماره صفحه را نمی‌گیرد.',
    chatHello:'درود. من بازآفرینی تاریخی صفی‌الدین ارموی هستم. دربارهٔ زندگی، موسیقی و روزگارم بپرسید؛ برای پژوهش، منابع مرتبط را هم بررسی کنید.',
    chatPlaceholder:'سؤالتان را بپرسید…',send:'ارسال',thinking:'در حال پاسخ…',chatError:'ارتباط با سرویس گفت‌وگو برقرار نشد. لطفاً دوباره تلاش کنید.',
    relatedSources:'منابع پیشنهادی برای بررسی',relatedHint:'این فهرست از روی موضوع سؤال انتخاب می‌شود؛ به‌معنی تأیید یا استناد خودکار پاسخ هوش مصنوعی نیست.',
    contactIntro:'برای پیشنهاد همکاری، ارسال اطلاعات کتاب‌شناختی، گزارش خطا یا درخواست پژوهشی از این بخش استفاده کنید.',
    name:'نام',email:'ایمیل',requestType:'نوع درخواست',message:'متن پیام',requestResearch:'درخواست پژوهشی',requestSource:'معرفی منبع',requestCooperation:'پیشنهاد همکاری',requestCorrection:'گزارش اصلاح',submitMail:'آماده‌سازی ایمیل',mailNotice:'با انتخاب دکمه، برنامهٔ ایمیل دستگاه باز می‌شود. درخواست مستقیماً در سایت ذخیره یا ارسال نمی‌شود.',
    graphNoDirect:'خط‌چین: رابطهٔ مستقیم نامستند یا محل اختلاف',graphReported:'خط پیوسته: پیوند گزارش‌شده / متنی',noResults:'منبعی با این جست‌وجو پیدا نشد.',firstResearch:'نخستین پرونده‌ها برای بررسی علمی منتشر شده‌اند؛ پژوهش‌ها به‌تدریج تکمیل می‌شوند.'
  },
  en: {
    navArchive:'Sources',navResearch:'Research',navLife:'Life & Connections',navFilm:'The Film',navChat:'Talk to Safi',navContact:'Contact',
    overline:'An independent research & heritage initiative',heroName:'Ṣafī al-Dīn ʿAbd al-Muʾmin al-Urmawī',heroStatement:'Exploring the life, thought and legacy of Safi al-Din al-Urmawi',
    heroDescription:'Historical texts, manuscript studies, critical scholarship and intellectual connections — an evolving archive where every claim needs evidence.',
    ctaExplore:'Explore sources',ctaLife:'Life & connections',ctaFilm:'Watch the Khonyagar teaser',countLabel:'Catalogued sources',researchLabel:'Research dossiers',underbarNote:'An evolving scholarly resource. Evidence before certainty.',
    footerCredit:'URMAWI — Founded & Directed by Mehdi Valipour',close:'Close',
    archiveTitle:'Research archive',researchTitle:'Research dossiers',lifeTitle:'Life & connections',filmTitle:'KHONYAGAR',chatTitle:'Talk to Safi al-Din',contactTitle:'Contact URMAWI',
    archiveIntro:'An evolving bibliography of studies on Safi al-Din al-Urmawi. Publication of full texts depends on permissions and textual verification.',
    researchIntro:'Research questions, competing interpretations and manuscript analysis, with sources and clearly stated limitations.',
    lifeIntro:'A provisional timeline and relationship network. An intellectual connection does not establish a meeting. Select a person to see the type of evidence.',
    search:'Search titles, authors and topics…',allCategories:'All subjects',openCase:'Read dossier',openRecord:'View source',backArchive:'← Back to archive',backResearch:'← Back to research',
    topic:'Subject',author:'Author / translator',published:'Publication',language:'Language',approach:'Method',abstract:'Overview',verification:'Verification note',publicationLink:'View publication / related research',requestAccess:'Ask about this source',
    question:'Research question',analysis:'Preliminary analysis',qualification:'Qualification',citations:'Related sources',timelineTab:'Timeline',networkTab:'Connections',certainty:'Evidence status',
    filmIntro:'Khonyagar is a cinematic interpretation of Safi al-Din al-Urmawi’s world. Creative reconstruction is distinct from historical evidence.',openAparat:'Watch on Aparat',filmCredit:'A film by Mehdi Valipour',
    chatIntro:'This is an AI historical interpretation. The existing service is not yet a verified full-text, page-citing research assistant.',
    chatModePersona:'Historical persona',chatModeResearch:'Ask the archive',researchHello:'Ask a research question. I will point you to curated dossiers and their sources. This is not yet full-PDF AI retrieval.',
    researchNoMatch:'No sufficiently relevant dossier was found. Please narrow the topic or submit a research enquiry.',
    researchAnswerIntro:'The following existing research dossiers are relevant:',researchAnswerOutro:'This is a summary of curated notes, not a substitute for the source articles and verified page references.',
    chatHello:'Greetings. I am an AI historical interpretation of Safi al-Din al-Urmawi. Ask about my life, music and times; consult the related sources for research.',
    chatPlaceholder:'Ask a question…',send:'Send',thinking:'Thinking…',chatError:'The conversation service could not be reached. Please try again.',
    relatedSources:'Suggested reading',relatedHint:'Suggestions are selected from your question; they are not automatic proof or citations for the AI answer.',
    contactIntro:'For research enquiries, bibliographic suggestions, corrections or collaboration proposals, please contact us.',
    name:'Name',email:'Email',requestType:'Enquiry type',message:'Message',requestResearch:'Research enquiry',requestSource:'Suggest a source',requestCooperation:'Collaboration',requestCorrection:'Correction',submitMail:'Open email app',mailNotice:'This opens your email app. The website itself does not send or store your submission.',
    graphNoDirect:'Dashed: disputed or unverified direct relation',graphReported:'Solid: reported / textual relation',noResults:'No matching sources.',firstResearch:'These are preliminary scholarly dossiers and will be refined as evidence is verified.'
  }
};

const t = key => copy[lang][key] || copy.fa[key] || key;
const persianDigits = value => lang==='fa' ? String(value).replace(/[0-9]/g,n=>'۰۱۲۳۴۵۶۷۸۹'[Number(n)]) : String(value);
const normal = value => String(value ?? '').toLocaleLowerCase().normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\u064b-\u065f\u200c]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const citeButtons = ids => `<div class="citation-list">${ids.map(id=>{const s=byId.get(id);return s?`<button class="citation-item" type="button" data-source="${esc(s.id)}"><strong>${esc(s.title)}</strong><small>${esc(s.author)} · ${esc(s.publication)}</small></button>`:''}).join('')}</div>`;

function setLanguage(next){
  lang=next; document.documentElement.lang=lang; document.documentElement.dir=lang==='fa'?'rtl':'ltr';
  $('#langToggle').textContent=lang==='fa'?'EN':'فا';
  $$('[data-i18n]').forEach(el=>{const value=copy[lang][el.dataset.i18n];if(value)el.textContent=value});
  $('#sourcesCount').textContent=persianDigits(String(sources.length).padStart(2,'0'));
  $('#researchCount').textContent=persianDigits(String(insights.length).padStart(2,'0'));
  if(currentView)renderView(currentView);
}

function openView(view, id){
  lastFocus=document.activeElement;
  currentView={view,id};
  $('#overlay').hidden=false;
  $('#siteShell').setAttribute('aria-hidden','true');
  renderView(currentView);
  $('#closePanel').focus();
  $('#mobileNav').hidden=true;
  $('#mobileMenuButton').setAttribute('aria-expanded','false');
}
function closeView(){
  if(chatAbort)chatAbort.abort();chatAbort=null;chatBusy=false;
  $('#overlay').hidden=true;$('#panelBody').replaceChildren();$('#siteShell').removeAttribute('aria-hidden');
  currentView=null;
  if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();
}
function setPanel(title,eyebrow,html,counter='URMAWI'){
  $('#panelTitle').textContent=title;
  $('#panelEyebrow').textContent=eyebrow;
  $('#panelBody').innerHTML=html;
  $('#panelCounter').textContent=counter;
  $('#panelBody').scrollTop=0;
}
function intro(kicker,title,description){return `<div class="panel-intro"><div class="section-kicker">${esc(kicker)}</div><h3 class="section-title">${esc(title)}</h3><div class="section-rule"></div><p>${esc(description)}</p></div>`}

function renderArchive(){
  const options=Object.entries(types).map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('');
  setPanel(t('archiveTitle'),'ARCHIVE / BIBLIOGRAPHY',`${intro('LIBRARY / 001',t('archiveTitle'),t('archiveIntro'))}
    <div class="archive-toolbar"><label class="search-box"><span class="search-symbol" aria-hidden="true">⌕</span><input id="sourceSearch" type="search" aria-label="${esc(t('search'))}" placeholder="${esc(t('search'))}"></label><select id="sourceCategory" aria-label="${esc(t('allCategories'))}"><option value="all">${esc(t('allCategories'))}</option>${options}</select></div>
    <div class="source-grid" id="sourceGrid"></div><p class="small-note">${esc(t('archiveIntro'))}</p>`,`${persianDigits(sources.length)} SOURCES`);
  const search=$('#sourceSearch'),category=$('#sourceCategory');
  const update=()=>{
    const q=normal(search.value);
    const filtered=sources.filter(s=>(category.value==='all'||s.type===category.value)&&normal([s.title,s.author,s.subject,s.abstract,...s.tags].join(' ')).includes(q));
    $('#sourceGrid').innerHTML=filtered.length?filtered.map((s,i)=>`<button type="button" class="source-card" data-source="${esc(s.id)}"><div class="card-topline"><span class="tag">${esc(types[s.type])}</span><span class="card-no">${String(i+1).padStart(2,'0')} / ${String(sources.length).padStart(2,'0')}</span></div><h4 class="card-title">${esc(s.title)}</h4><p class="card-meta">${esc(s.author)} · ${esc(s.year)}</p><p class="card-desc">${esc(s.subject)}</p><div class="card-foot"><span>${esc(t('openRecord'))}</span><span aria-hidden="true">↗</span></div></button>`).join(''):`<div class="empty-state">${esc(t('noResults'))}</div>`;
  };
  search.addEventListener('input',update);category.addEventListener('change',update);update();
}
function renderSource(id){
  const s=byId.get(id);if(!s){renderArchive();return;}
  setPanel(s.title,'ARCHIVE / SOURCE RECORD',`<button class="back-button" data-view="archive">${esc(t('backArchive'))}</button>
    <div class="detail-hero"><div class="section-kicker">SOURCE / ${esc(s.id.toUpperCase())}</div><h3 class="section-title">${esc(s.title)}</h3><p class="detail-lead">${esc(s.subject)}</p></div>
    <div class="detail-meta-grid"><div class="meta-cell"><span class="meta-label">${esc(t('author'))}</span><span class="meta-value">${esc(s.author)}</span></div><div class="meta-cell"><span class="meta-label">${esc(t('published'))}</span><span class="meta-value">${esc(s.publication)}</span></div><div class="meta-cell"><span class="meta-label">${esc(t('topic'))}</span><span class="meta-value">${esc(s.tags.join(' · '))}</span></div><div class="meta-cell"><span class="meta-label">${esc(t('approach'))}</span><span class="meta-value">${esc(s.method)}</span></div></div>
    <section class="detail-section"><h3>${esc(t('abstract'))}</h3><p>${esc(s.abstract)}</p></section>
    <div class="notice"><strong>${esc(t('verification'))}</strong> — ${esc(s.review)}</div>
    ${s.url?`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(t('publicationLink'))} ↗</a>`:''}
    <p><a class="source-link" href="mailto:contact@urmawi.com?subject=${encodeURIComponent('URMAWI / '+s.title)}">${esc(t('requestAccess'))} ↗</a></p>`,s.year);
}
function renderResearch(){
  setPanel(t('researchTitle'),'RESEARCH / CRITICAL STUDIES',`${intro('RESEARCH / 002',t('researchTitle'),t('researchIntro'))}<div class="insight-grid">${insights.map((x,i)=>`<button class="insight-card" type="button" data-insight="${esc(x.id)}"><div class="card-topline"><span class="tag">${esc(x.category)}</span><span class="card-no">${String(i+1).padStart(2,'0')}</span></div><h4 class="card-title">${esc(x.title)}</h4><p class="card-desc">${esc(x.lead)}</p><div class="card-foot"><span>${esc(x.status)}</span><span aria-hidden="true">↗</span></div></button>`).join('')}</div><p class="small-note">${esc(t('firstResearch'))}</p>`,`${persianDigits(insights.length)} DOSSIERS`);
}
function renderInsight(id){
  const x=insights.find(item=>item.id===id);if(!x){renderResearch();return;}
  setPanel(x.title,'RESEARCH / DOSSIER',`<button class="back-button" data-view="research">${esc(t('backResearch'))}</button>
    <div class="detail-hero"><span class="tag">${esc(x.category)} · ${esc(x.status)}</span><h3 class="section-title" style="margin-top:15px">${esc(x.title)}</h3><p class="detail-lead">${esc(x.lead)}</p></div>
    <section class="detail-section"><h3>${esc(t('question'))}</h3><p>${esc(x.question)}</p></section>
    <section class="detail-section"><h3>${esc(t('analysis'))}</h3><p>${esc(x.analysis)}</p></section>
    <div class="notice"><strong>${esc(t('qualification'))}:</strong> ${esc(x.note)}</div>
    <section class="detail-section"><h3>${esc(t('citations'))}</h3>${citeButtons(x.sourceIds)}</section>`,x.status);
}

function timelineMarkup(activeIndex){
  const e=timeline[activeIndex];
  return `<div class="timeline-track" id="timelineTrack">${timeline.map((item,i)=>`<button type="button" class="timeline-event ${i===activeIndex?'active':''}" data-event="${i}" aria-pressed="${i===activeIndex}"><div class="timeline-date">${esc(item.date)}</div><strong>${esc(item.label)}</strong><small>${esc(item.certainty)}</small></button>`).join('')}</div>
    <section class="event-detail" id="eventDetail"><div class="section-kicker">CHRONOLOGY / ${persianDigits(activeIndex+1).toString().padStart(2,'0')}</div><h3>${esc(e.label)}</h3><p>${esc(e.detail)}</p><div class="event-citations">${e.sourceIds.map(id=>esc(byId.get(id)?.author||'')).join(' · ')}</div><div class="citation-list">${citeButtons(e.sourceIds)}</div></section>`;
}
function personDetailMarkup(id){
  const p=people.find(x=>x.id===id)||people[0];
  const links=relationships.filter(r=>r.a===p.id||r.b===p.id);
  return `<h3>${esc(p.name)}</h3><p>${esc(p.role)}</p><div class="section-kicker">CONNECTED EVIDENCE</div>${links.length?links.map(r=>{
    const other=people.find(x=>x.id===(r.a===p.id?r.b:r.a));
    return `<div class="relationship-item"><strong>${esc(other?.name||'')}</strong> — ${esc(r.type)}<span class="relationship-status">${esc(r.evidence)}</span><div>${r.sourceIds.map(sid=>`<button type="button" class="source-link" data-source="${esc(sid)}">${esc(byId.get(sid)?.author||sid)} ↗</button>`).join(' ')}</div></div>`;
  }).join(''):'<p>—</p>'}`;
}
function graphMarkup(selected='safi'){
  const personById=new Map(people.map(p=>[p.id,p]));
  const edges=relationships.map(r=>{const a=personById.get(r.a),b=personById.get(r.b);return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${r.status==='disputed'?'#ba9b81':'#b5a994'}" stroke-width="${r.status==='disputed'?1.6:1.8}" ${r.status==='disputed'?'stroke-dasharray="7 6"':''} opacity=".8"/>`}).join('');
  const nodes=people.map(p=>`<g class="graph-node ${selected===p.id?'selected':''}" data-person="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)}"><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.main?'#46423b':'#fff'}" stroke="${p.main?'#87745a':'#b8a68a'}" stroke-width="1.5"/><text class="graph-label ${p.main?'main':''}" x="${p.x}" y="${p.y+4}">${esc(p.name)}</text></g>`).join('');
  return `<div class="graph-shell"><div><div class="graph-scroll"><svg class="graph-canvas" viewBox="0 0 790 455" xmlns="http://www.w3.org/2000/svg" aria-label="شبکهٔ ارتباطات پژوهشی">${edges}${nodes}</svg></div><div class="graph-legend"><span class="swatch"></span>${esc(t('graphReported'))} <span class="swatch dashed"></span>${esc(t('graphNoDirect'))}</div></div><aside class="person-detail" id="personDetail">${personDetailMarkup(selected)}</aside></div>`;
}
function renderLife(mode='timeline'){
  setPanel(t('lifeTitle'),'CHRONOLOGY / NETWORK',`${intro('HISTORY / 003',t('lifeTitle'),t('lifeIntro'))}<div class="view-switch"><button data-life-mode="timeline" class="${mode==='timeline'?'active':''}">${esc(t('timelineTab'))}</button><button data-life-mode="network" class="${mode==='network'?'active':''}">${esc(t('networkTab'))}</button></div><div id="lifeContent">${mode==='network'?graphMarkup():timelineMarkup(0)}</div>`,mode==='network'?'PERSONS / RELATIONS':'613 — 693 AH');
  wireLife(mode);
}
function wireLife(mode){
  $$('[data-life-mode]').forEach(button=>button.addEventListener('click',()=>renderLife(button.dataset.lifeMode)));
  if(mode==='timeline'){
    $$('[data-event]').forEach(button=>button.addEventListener('click',()=>{
      const index=Number(button.dataset.event);const scroll=$('#timelineTrack')?.scrollLeft;
      $('#lifeContent').innerHTML=timelineMarkup(index);
      if($('#timelineTrack'))$('#timelineTrack').scrollLeft=scroll||0;
      wireLifeEvents();
    }));
  }else wireGraph();
}
function wireLifeEvents(){
  $$('[data-event]').forEach(button=>button.addEventListener('click',()=>{
    const index=Number(button.dataset.event),scroll=$('#timelineTrack')?.scrollLeft;
    $('#lifeContent').innerHTML=timelineMarkup(index);
    if($('#timelineTrack'))$('#timelineTrack').scrollLeft=scroll||0;
    wireLifeEvents();
  }));
}
function wireGraph(){
  $$('[data-person]').forEach(node=>{
    const activate=()=>{ $$('.graph-node').forEach(el=>el.classList.toggle('selected',el===node));$('#personDetail').innerHTML=personDetailMarkup(node.dataset.person); };
    node.addEventListener('click',activate);
    node.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}});
  });
}

function renderFilm(){
  setPanel(t('filmTitle'),'FILM / KHONYAGAR',`${intro('CINEMA / 004',t('filmTitle'),t('filmIntro'))}<div class="film-frame"><iframe src="${APARAT_EMBED}" title="KHONYAGAR film teaser" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div><div class="film-caption"><h3>KHONYAGAR</h3><p>${esc(t('filmCredit'))}</p><a href="${APARAT_PAGE}" target="_blank" rel="noopener noreferrer">${esc(t('openAparat'))} ↗</a></div>`,'1258 / BAGHDAD');
}

function sourceSuggestions(question){
  const terms=normal(question).split(' ').filter(term=>term.length>2);
  const scored=sources.map(source=>{
    const head=normal(source.title+' '+source.tags.join(' '));const body=normal(source.abstract+' '+source.subject);
    const score=terms.reduce((n,term)=>n+(head.includes(term)?3:0)+(body.includes(term)?1:0),0);
    return {source,score};
  });
  return scored.sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.source);
}
function activeHistory(){return chatMode==='persona'?chatHistory:researchHistory}
function chatThreadMarkup(){return activeHistory().map(m=>`<div class="chat-bubble ${m.role==='user'?'user':'assistant'}">${esc(m.content)}</div>`).join('')}
function updateChatSuggestions(text){
  const box=$('#chatSuggested');if(!box)return;
  box.innerHTML=sourceSuggestions(text).map(s=>`<button type="button" class="chat-source" data-source="${esc(s.id)}"><strong>${esc(s.title)}</strong><small>${esc(s.author)}</small></button>`).join('');
}
function renderChat(){
  if(!chatHistory.length)chatHistory=[{role:'assistant',content:t('chatHello')}];
  if(!researchHistory.length)researchHistory=[{role:'assistant',content:t('researchHello')}];
  setPanel(t('chatTitle'),'AI / HISTORICAL INTERPRETATION',`${intro('DIALOGUE / 005',t('chatTitle'),t('chatIntro'))}<div class="view-switch"><button type="button" data-chat-mode="persona" class="${chatMode==='persona'?'active':''}">${esc(t('chatModePersona'))}</button><button type="button" data-chat-mode="research" class="${chatMode==='research'?'active':''}">${esc(t('chatModeResearch'))}</button></div><div class="chat-layout"><div class="chat-main"><div class="chat-thread" id="chatThread" aria-live="polite">${chatThreadMarkup()}</div><form class="chat-entry" id="chatForm"><input id="chatInput" autocomplete="off" maxlength="1200" required placeholder="${esc(t('chatPlaceholder'))}" aria-label="${esc(t('chatPlaceholder'))}"><button id="chatSend" type="submit">${esc(t('send'))}</button></form></div><aside class="chat-evidence"><h3>${esc(t('relatedSources'))}</h3><p>${esc(t('relatedHint'))}</p><div id="chatSuggested"></div><div class="notice">${esc(chatMode==='research'?t('researchHello'):t('chatIntro'))}</div></aside></div>`,'URMAWI AI');
  $('#chatForm').addEventListener('submit',submitChat);
  $$('[data-chat-mode]').forEach(button=>button.addEventListener('click',()=>{if(chatBusy)return;chatMode=button.dataset.chatMode;renderChat()}));
  updateChatSuggestions(activeHistory().filter(x=>x.role==='user').at(-1)?.content||'صفی‌الدین ارموی');
  $('#chatThread').scrollTop=$('#chatThread').scrollHeight;
}
function researchAnswer(question){
  const terms=normal(question).split(' ').filter(word=>word.length>2);
  const ranked=insights.map(x=>{
    const strong=normal(x.title+' '+x.question+' '+x.category);
    const weak=normal(x.lead+' '+x.analysis);
    return {item:x,score:terms.reduce((n,term)=>n+(strong.includes(term)?3:0)+(weak.includes(term)?1:0),0)};
  }).sort((a,b)=>b.score-a.score).filter(x=>x.score>0).slice(0,2);
  if(!ranked.length)return t('researchNoMatch');
  return t('researchAnswerIntro')+'\n\n'+ranked.map((x,i)=>`${persianDigits(i+1)}. ${x.item.title}\n${x.item.lead}\n${x.item.analysis}\n${t('qualification')}: ${x.item.note}\n${t('citations')}: ${x.item.sourceIds.map(id=>byId.get(id)?.author).join('، ')}`).join('\n\n')+'\n\n'+t('researchAnswerOutro');
}
async function submitChat(event){
  event.preventDefault();if(chatBusy)return;
  const input=$('#chatInput'),send=$('#chatSend'),thread=$('#chatThread');
  const question=input.value.trim();if(!question)return;
  activeHistory().push({role:'user',content:question});input.value='';
  thread.innerHTML=chatThreadMarkup();thread.scrollTop=thread.scrollHeight;
  updateChatSuggestions(question);
  if(chatMode==='research'){
    researchHistory.push({role:'assistant',content:researchAnswer(question)});
    thread.innerHTML=chatThreadMarkup();thread.scrollTop=thread.scrollHeight;
    return;
  }
  chatBusy=true;send.disabled=true;
  const thinking=document.createElement('div');thinking.className='chat-bubble assistant';thinking.textContent=t('thinking');thread.append(thinking);thread.scrollTop=thread.scrollHeight;
  chatAbort=new AbortController();const timeout=setTimeout(()=>chatAbort?.abort(),26000);
  try{
    const response=await fetch(CHAT_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:chatHistory.slice(-12),language:lang}),signal:chatAbort.signal});
    if(!response.ok)throw new Error('bad response');
    const data=await response.json();const answer=String(data.answer||'').trim();if(!answer)throw new Error('empty answer');
    chatHistory.push({role:'assistant',content:answer});
  }catch(error){
    if(error.name==='AbortError'&&currentView?.view!=='chat')return;
    chatHistory.push({role:'assistant',content:t('chatError')});
  }finally{
    clearTimeout(timeout);chatAbort=null;chatBusy=false;
    if(currentView?.view==='chat'&&$('#chatThread')){
      $('#chatThread').innerHTML=chatThreadMarkup();$('#chatThread').scrollTop=$('#chatThread').scrollHeight;
      $('#chatSend').disabled=false;
    }
  }
}

function renderContact(){
  setPanel(t('contactTitle'),'CONTACT / INQUIRY',`${intro('CONTACT / 006',t('contactTitle'),t('contactIntro'))}<div class="contact-grid"><div><p class="section-kicker">OFFICIAL CONTACT</p><a class="contact-address" href="mailto:contact@urmawi.com">contact@urmawi.com</a><p class="contact-copy">${esc(t('contactIntro'))}</p></div><form id="contactForm" class="contact-form"><div class="form-row"><label for="contactName">${esc(t('name'))}</label><input id="contactName" required maxlength="100"></div><div class="form-row"><label for="contactEmail">${esc(t('email'))}</label><input id="contactEmail" type="email" required maxlength="200" dir="ltr"></div><div class="form-row full"><label for="contactType">${esc(t('requestType'))}</label><select id="contactType"><option value="research">${esc(t('requestResearch'))}</option><option value="source">${esc(t('requestSource'))}</option><option value="cooperation">${esc(t('requestCooperation'))}</option><option value="correction">${esc(t('requestCorrection'))}</option></select></div><div class="form-row full"><label for="contactMessage">${esc(t('message'))}</label><textarea id="contactMessage" required minlength="10" maxlength="4000"></textarea></div><button type="submit" class="form-submit">${esc(t('submitMail'))} ↗</button><p class="form-disclaimer">${esc(t('mailNotice'))}</p></form></div>`,'contact@urmawi.com');
  $('#contactForm').addEventListener('submit',event=>{
    event.preventDefault();
    const name=$('#contactName').value.trim(),email=$('#contactEmail').value.trim(),category=$('#contactType').selectedOptions[0].textContent,message=$('#contactMessage').value.trim();
    if(!name||!email||message.length<10)return;
    const subject=encodeURIComponent(`URMAWI / ${category} / ${name}`);
    const body=encodeURIComponent(`نام / Name: ${name}\nایمیل / Email: ${email}\nنوع درخواست / Type: ${category}\n\n${message}`);
    window.location.href=`mailto:contact@urmawi.com?subject=${subject}&body=${body}`;
  });
}

function renderView(state){
  const {view,id}=state;
  if(view==='archive')renderArchive();else if(view==='source')renderSource(id);else if(view==='research')renderResearch();else if(view==='insight')renderInsight(id);else if(view==='life')renderLife();else if(view==='film')renderFilm();else if(view==='chat')renderChat();else if(view==='contact')renderContact();
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-view],[data-source],[data-insight]');if(!button)return;
  if(button.dataset.view)openView(button.dataset.view);
  else if(button.dataset.source)openView('source',button.dataset.source);
  else if(button.dataset.insight)openView('insight',button.dataset.insight);
});
$('#closePanel').addEventListener('click',closeView);
$('#overlayBackdrop').addEventListener('click',closeView);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!$('#overlay').hidden)closeView();
  if(event.key==='Tab'&&!$('#overlay').hidden){
    const focusables=$$('button,a[href],input,select,textarea,[tabindex="0"]',$('#overlay')).filter(el=>!el.disabled&&el.offsetParent!==null);
    if(!focusables.length)return;
    const first=focusables[0],last=focusables.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
});
$('#mobileMenuButton').addEventListener('click',()=>{
  const isOpening=$('#mobileNav').hidden;$('#mobileNav').hidden=!isOpening;$('#mobileMenuButton').setAttribute('aria-expanded',String(isOpening));
});
$('#langToggle').addEventListener('click',()=>setLanguage(lang==='fa'?'en':'fa'));
setLanguage('fa');
