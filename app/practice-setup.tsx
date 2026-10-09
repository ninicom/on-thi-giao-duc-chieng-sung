'use client';
import {useState} from 'react';
import {Bookmark,Search,Play,Timer,RotateCcw} from 'lucide-react';
import {questions,topics} from './data';
import {ChoiceSelect,type Mutate} from './study-client';
import {QuestionContext,RuleExplanation,questionSearchText} from './citations';
import type {StudyState} from './types';

const groups=[{value:'all',label:'Trộn hai phần'},{value:'general',label:'Kiến thức chung ('+questions.filter(q=>q.group==='general').length+' câu)'},{value:'education',label:'Giáo dục và đào tạo ('+questions.filter(q=>q.group==='education').length+' câu)'}];
const normalize=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
const isWrong=(s:StudyState,id:string)=>!!s.questions[id]?.wrong&&!s.questions[id]?.lastCorrect;

export function PracticeSetup({state,start,busy}:{state:StudyState;start:(p:Record<string,unknown>)=>Promise<void>;busy:boolean}){
 const [mode,setMode]=useState('practice'),[group,setGroup]=useState('all'),[topic,setTopic]=useState('all'),[count,setCount]=useState('5'),[minutes,setMinutes]=useState('60');
 const pool=questions.filter(q=>(group==='all'||q.group===group)&&(topic==='all'||q.topicId===topic)).filter(q=>mode==='wrong'?isWrong(state,q.id):mode==='unseen'?!state.questions[q.id]?.attempts:mode==='bookmarks'?state.questions[q.id]?.bookmark:true);
 const wrong=questions.filter(q=>isWrong(state,q.id)).length,unseen=questions.filter(q=>!state.questions[q.id]?.attempts).length;
 const changeGroup=(v:string)=>{setGroup(v);setTopic('all');if(mode==='mock')setMinutes(v==='education'?'90':'60')};
 const timedValid=Number.isInteger(Number(minutes))&&Number(minutes)>=1&&Number(minutes)<=180;
 return <>
 <div className="exam-presets">
  <button className="exam-preset warmup" disabled={busy} onClick={()=>void start({mode:'practice',group:'all',count:5})}><Play/><span><strong>Khởi động 5 câu</strong><small>Kiểm tra và xem giải thích ngay</small></span><b>5 câu</b></button>
  <button className="exam-preset" disabled={busy} onClick={()=>void start({mode:'mock',group:'general',count:60,minutes:60})}><Timer/><span><strong>Vòng 1 · Kiến thức chung</strong><small>Trộn đều các chủ đề, làm liên tục</small></span><b>60 câu · 60 phút</b></button>
  <button className="exam-preset" disabled={busy} onClick={()=>void start({mode:'mock',group:'education',count:60,minutes:90})}><Timer/><span><strong>Chuyên ngành giáo dục</strong><small>Trộn 10 chủ đề · 60 câu / 90 phút</small></span><b>60 câu · 90 phút</b></button>
 </div>
 <div className="practice-shortcuts"><button className="subtle-button" disabled={busy||!wrong} onClick={()=>void start({mode:'wrong',group:'all',count:Math.min(20,wrong)})}><RotateCcw size={17}/>Luyện lại câu sai ({wrong})</button><button className="subtle-button" disabled={busy||!unseen} onClick={()=>void start({mode:'unseen',group:'all',count:10})}>10 câu chưa luyện ({unseen} còn lại)</button></div>
 <section className="card custom-practice"><h2>Tạo bài theo phần cần ôn</h2>
 <div className="setup-grid">
  <div><label className="field-label">Chế độ</label><ChoiceSelect value={mode} onChange={v=>{setMode(v);if(v==='mock'){setCount('60');setGroup('general');setTopic('all');setMinutes('60')}}} label="Chế độ luyện" options={[{value:'practice',label:'Luyện và xem giải thích'},{value:'unseen',label:'Câu chưa luyện'},{value:'wrong',label:'Câu đang sai'},{value:'bookmarks',label:'Câu đánh dấu'},{value:'mock',label:'Đề thi thử tính giờ'}]}/></div>
  <div><label className="field-label">Phần kiến thức</label><ChoiceSelect value={group} onChange={changeGroup} label="Nhóm bài luyện" options={groups}/></div>
  <div><label className="field-label">Chủ đề</label><ChoiceSelect value={topic} onChange={setTopic} label="Chủ đề bài luyện" options={[{value:'all',label:'Tất cả chủ đề'},...topics.filter(t=>group==='all'||t.group===group).map(t=>({value:t.id,label:t.title}))]}/></div>
  <div><label className="field-label">Số câu</label><ChoiceSelect value={count} onChange={setCount} label="Số câu luyện" options={['5','10','20','30','60','90','120'].map(v=>({value:v,label:v+' câu'}))}/></div>
  {mode==='mock'&&<label className="field-label">Thời gian (phút)<input type="number" min={1} max={180} step={1} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>}
 </div>
 <p className="muted">Có {pool.length} câu phù hợp · bài này sẽ có {Math.min(Number(count),pool.length)} câu, không lặp trong cùng bài.</p>
 <button className="primary-button" disabled={busy||!pool.length||(mode==='mock'&&!timedValid)} onClick={()=>void start({mode,group,topicId:topic==='all'?undefined:topic,count:Number(count),minutes:Number(minutes)})}>Bắt đầu {mode==='mock'?'đề tính giờ':'luyện tập'}</button>
 {mode==='mock'&&<p className="muted">Vòng 1: 60 câu / 60 phút. Vòng 2 theo thông báo: 60–120 câu / 90–180 phút; cấu hình cụ thể sẽ được Hội đồng công bố. Đề luyện phân bố câu theo các chủ đề; cách phân bố này phục vụ ôn tập. Đồng hồ chạy liên tục, kể cả khi rời trang.</p>}
 </section></>
}

export function QuestionBank({state,start,busy,mutate,openLesson}:{state:StudyState;start:(p:Record<string,unknown>)=>Promise<void>;busy:boolean;mutate:Mutate;openLesson:(id:string)=>void}){
 const [search,setSearch]=useState(''),[group,setGroup]=useState('all'),[topic,setTopic]=useState('all'),[status,setStatus]=useState('all'),[page,setPage]=useState(0);
 const list=questions.filter(q=>(group==='all'||q.group===group)&&(topic==='all'||q.topicId===topic)&&normalize(questionSearchText(q)).includes(normalize(search))).filter(q=>status==='wrong'?isWrong(state,q.id):status==='unseen'?!state.questions[q.id]?.attempts:status==='bookmarks'?state.questions[q.id]?.bookmark:true);
 const actualPage=Math.min(page,Math.max(0,Math.ceil(list.length/20)-1)),shown=list.slice(actualPage*20,actualPage*20+20);
 return <><div className="heading"><p className="overline">{questions.length} CÂU · {topics.length} CHỦ ĐỀ</p><h1>Ngân hàng câu hỏi</h1><p>Tìm theo chủ đề, tên văn bản, số hiệu hoặc điều khoản. Luyện câu trước, mở giải thích khi cần đối chiếu.</p></div>
 <div className="filter-row"><label className="search-field"><Search size={18}/><span className="sr-only">Tìm câu hỏi</span><input aria-label="Tìm câu hỏi" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Tìm nội dung, tên văn bản, điều khoản…"/></label><ChoiceSelect value={group} onChange={v=>{setGroup(v);setTopic('all');setPage(0)}} label="Nhóm câu hỏi" options={groups}/></div>
 <div className="filter-row"><ChoiceSelect value={topic} onChange={v=>{setTopic(v);setPage(0)}} label="Chủ đề câu hỏi" options={[{value:'all',label:'Tất cả chủ đề'},...topics.filter(t=>group==='all'||t.group===group).map(t=>({value:t.id,label:t.title}))]}/><ChoiceSelect value={status} onChange={v=>{setStatus(v);setPage(0)}} label="Trạng thái câu hỏi" options={[{value:'all',label:'Tất cả câu'},{value:'unseen',label:'Chưa luyện'},{value:'wrong',label:'Đang sai'},{value:'bookmarks',label:'Đã đánh dấu'}]}/><span className="muted">{list.length} câu phù hợp</span></div>
 {list.length>0&&<div className="button-row bank-start"><button className="primary-button" disabled={busy} onClick={()=>void start({mode:'practice',group:'all',questionIds:list.map(q=>q.id),count:Math.min(10,list.length)})}>Luyện {Math.min(10,list.length)} câu trong danh sách</button></div>}
 <div className="bank-list">{shown.map((q,i)=><article className="card bank-question" key={q.id}><p className="overline">{q.sourceId} · {state.questions[q.id]?.attempts?(state.questions[q.id].lastCorrect?'LẦN GẦN NHẤT ĐÚNG':'CẦN ÔN LẠI'):'CHƯA LUYỆN'}</p><QuestionContext question={q}/><h2>{actualPage*20+i+1}. {q.stem}</h2><ol className="bank-choices" type="A">{q.choices.map((c,i)=><li key={i}>{c}</li>)}</ol><div className="button-row"><button className="primary-button" disabled={busy} onClick={()=>void start({mode:'practice',group:'all',questionIds:[q.id],count:1})}>Luyện câu này</button><button className="text-button" onClick={()=>void mutate('bookmark',{id:q.id,value:!state.questions[q.id]?.bookmark})}><Bookmark size={16}/>{state.questions[q.id]?.bookmark?'Bỏ đánh dấu':'Đánh dấu câu'}</button><button className="text-button" onClick={()=>openLesson(q.lessonId)}>Đọc bài liên quan</button></div><details className="bank-explanation"><summary>Xem đáp án và giải thích</summary><RuleExplanation question={q}/></details></article>)}</div>
 {!list.length&&<div className="empty-state">Chưa có câu phù hợp. Thử đổi bộ lọc hoặc từ khóa.</div>}
 {list.length>20&&<div className="pagination"><button className="subtle-button" disabled={!actualPage} onClick={()=>{setPage(actualPage-1);window.scrollTo({top:0,behavior:'smooth'})}}>Trang trước</button><span>Trang {actualPage+1}/{Math.ceil(list.length/20)}</span><button className="subtle-button" disabled={(actualPage+1)*20>=list.length} onClick={()=>{setPage(actualPage+1);window.scrollTo({top:0,behavior:'smooth'})}}>Trang tiếp</button></div>}
 </>
}
