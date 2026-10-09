import {lessonMap,questionMap,questions,sources} from './data';
import {today,dayAfter,emptyLesson} from './state';
import {readingUnitsFor} from './reading';
import type {StudyState,Attempt,LessonProgress} from './types';
function ensure(ok:unknown,message='Dữ liệu không hợp lệ.'):asserts ok{if(!ok)throw new Error(message)}
function finite(n:unknown,min:number,max:number){return typeof n==='number'&&Number.isInteger(n)&&n>=min&&n<=max}
function validDate(d:unknown){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d}
function shuffled<T>(arr:T[]){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function pickBalanced(pool:typeof questions,count:number){const groups=new Map<string,typeof questions>();for(const q of shuffled(pool)){const list=groups.get(q.topicId)??[];list.push(q);groups.set(q.topicId,list)}const lists=shuffled([...groups.values()]),result:typeof questions=[];while(result.length<count&&lists.some(list=>list.length)){for(const list of lists){if(result.length>=count)break;const next=list.pop();if(next)result.push(next)}}return shuffled(result)}
export function apply(state:StudyState,action:string,p:Record<string,any>){
 const date=today(),now=new Date().toISOString();
 if(action==='settings'){ensure(validDate(p.startDate)&&finite(p.dailyTarget,2,12));state.startDate=p.startDate;state.dailyTarget=p.dailyTarget}
 else if(action==='lesson'){ensure(typeof p.id==='string'&&lessonMap.has(p.id));const l=state.lessons[p.id]??emptyLesson();if(typeof p.done==='boolean')l.done=p.done;if(typeof p.note==='string'){ensure(p.note.length<=5000);l.note=p.note}if(p.recall!==undefined){ensure(finite(p.recall,0,2));const newDay=l.lastReviewed!==date;l.recall=p.recall;l.recallCued=p.cued===true;l.reviews+=1;l.streak=p.recall===2?(newDay?(l.streak??0)+1:Math.max(1,l.streak??0)):0;l.lastReviewed=date;const gap=p.recall===2?[1,3,7][Math.min(l.streak-1,2)]:1;l.due=dayAfter(date,gap)}state.lessons[p.id]=l}
 else if(action==='reading'){const s=sources.find(s=>s.id===p.id);ensure(s&&typeof p.done==='boolean');state.reading[p.id]=p.done;for(const u of readingUnitsFor(s))state.readingPages[u.id]=p.done}
 else if(action==='readingUnit'){const s=sources.find(s=>s.id===p.sourceId);ensure(s&&typeof p.done==='boolean');const units=readingUnitsFor(s);ensure(units.some(u=>u.id===p.id));for(const u of units)state.readingPages[u.id]??=state.reading[s.id]??false;state.readingPages[p.id]=p.done;state.reading[s.id]=units.every(u=>state.readingPages[u.id])}
 else if(action==='bookmark'){ensure(questionMap.has(p.id)&&typeof p.value==='boolean');const q=state.questions[p.id]??{attempts:0,correct:0,wrong:0,lastCorrect:false,bookmark:false};q.bookmark=p.value;state.questions[p.id]=q}
 else if(action==='session'){ensure(finite(p.seconds,30,3600));ensure(!p.lessonId||lessonMap.has(p.lessonId));state.sessions.push({id:crypto.randomUUID(),day:date,seconds:p.seconds,lessonId:p.lessonId??null,at:now});ensure(state.sessions.length<=5000,'Số phiên đã đầy. Hãy xuất bản sao tiến độ.')}
 else if(action==='day'){ensure(finite(p.day,1,15)&&typeof p.done==='boolean');state.days[String(p.day)]=p.done}
 else if(action==='quizStart'){
  ensure(!state.activeAttempt,'Hãy hoàn thành hoặc dừng bài đang làm trước.');ensure(['lesson','practice','unseen','wrong','bookmarks','mock'].includes(p.mode));ensure(['general','education','all'].includes(p.group));ensure(finite(p.count,1,120));
  let pool=questions.filter(q=>p.group==='all'||q.group===p.group);
  if(p.topicId){ensure(typeof p.topicId==='string'&&questions.some(q=>q.topicId===p.topicId));pool=pool.filter(q=>q.topicId===p.topicId)}
  if(p.questionIds){ensure(Array.isArray(p.questionIds)&&p.questionIds.length>0&&p.questionIds.length<=questions.length&&p.questionIds.every((id:unknown)=>typeof id==='string'&&questionMap.has(id)));const ids=new Set(p.questionIds);pool=pool.filter(q=>ids.has(q.id))}
  if(p.mode==='lesson'){ensure(lessonMap.has(p.lessonId));pool=pool.filter(q=>q.lessonId===p.lessonId)}
  if(p.mode==='unseen')pool=pool.filter(q=>!state.questions[q.id]?.attempts);
  if(p.mode==='wrong')pool=pool.filter(q=>state.questions[q.id]?.wrong>0&&!state.questions[q.id]?.lastCorrect);
  if(p.mode==='bookmarks')pool=pool.filter(q=>state.questions[q.id]?.bookmark);
  ensure(pool.length>0,'Chưa có câu hỏi phù hợp.');const selected=p.mode==='mock'?pickBalanced(pool,Math.min(p.count,pool.length)):shuffled(pool).slice(0,Math.min(p.count,pool.length));const ids=selected.map(q=>q.id);
  const timed=p.mode==='mock';if(timed)ensure(finite(p.minutes,1,180));state.activeAttempt={id:crypto.randomUUID(),mode:p.mode,group:p.group,lessonId:p.lessonId,questionIds:ids,answers:{},startedAt:now,deadlineAt:timed?new Date(Date.parse(now)+p.minutes*60000).toISOString():null,submittedAt:null,score:null};
 }
 else if(action==='quizAnswer'){const a=state.activeAttempt;ensure(a&&a.id===p.id&&a.questionIds.includes(p.questionId));ensure(finite(p.choice,0,3));ensure(!a.deadlineAt||Date.now()<=Date.parse(a.deadlineAt),'Bài đã hết giờ. Hãy nộp bài.');a.answers[p.questionId]=p.choice}
 else if(action==='quizSubmit'){
  if(!state.activeAttempt&&state.attempts.some(a=>a.id===p.id))return state;
  const a=state.activeAttempt;ensure(a&&a.id===p.id);a.submittedAt=now;a.score=0;
  for(const id of a.questionIds){const q=questionMap.get(id);if(!q)continue;const ok=a.answers[id]===q.answer; if(ok)a.score+=1;const prior=state.questions[id]??{attempts:0,correct:0,wrong:0,lastCorrect:false,bookmark:false};prior.attempts+=1;prior.correct+=ok?1:0;prior.wrong+=ok?0:1;prior.lastCorrect=ok;state.questions[id]=prior}
  state.attempts.push(a);state.attempts=state.attempts.slice(-500);state.activeAttempt=null;
 }
 else if(action==='quizCancel'){ensure(state.activeAttempt?.id===p.id);state.activeAttempt=null}
 else if(action==='import'){
  const s=p.state;ensure(s&&s.schemaVersion===1&&validDate(s.startDate)&&finite(s.dailyTarget,2,12));ensure(s.lessons&&s.questions&&s.reading&&Array.isArray(s.sessions)&&Array.isArray(s.attempts));
  const fresh:StudyState={schemaVersion:1,startDate:s.startDate,dailyTarget:s.dailyTarget,lessons:{},questions:{},reading:{},readingPages:{},sessions:[],attempts:[],activeAttempt:null,days:{}};
  for(const [id,value]of Object.entries(s.lessons)){if(!lessonMap.has(id))continue;const l=value as LessonProgress;ensure(typeof l.done==='boolean'&&typeof l.note==='string'&&l.note.length<=5000&&(l.recall===null||finite(l.recall,0,2))&&finite(l.reviews,0,10000));ensure(l.due===null||validDate(l.due));ensure(l.lastReviewed===null||validDate(l.lastReviewed));fresh.lessons[id]={done:l.done,note:l.note,recall:l.recall,recallCued:l.recallCued===true,reviews:l.reviews,streak:finite(l.streak,0,10000)?l.streak:0,due:l.due,lastReviewed:l.lastReviewed}}
  for(const [id,value]of Object.entries(s.questions)){if(!questionMap.has(id))continue;const q=value as any;ensure(finite(q.attempts,0,100000)&&finite(q.correct,0,q.attempts)&&finite(q.wrong,0,q.attempts)&&typeof q.lastCorrect==='boolean'&&typeof q.bookmark==='boolean');fresh.questions[id]={attempts:q.attempts,correct:q.correct,wrong:q.wrong,lastCorrect:q.lastCorrect,bookmark:q.bookmark}}
  for(const [id,v]of Object.entries(s.reading))if(sources.some(doc=>doc.id===id)&&typeof v==='boolean')fresh.reading[id]=v;
  for(const source of sources)for(const unit of readingUnitsFor(source)){const value=s.readingPages?.[unit.id];if(typeof value==='boolean')fresh.readingPages[unit.id]=value}
  ensure(s.sessions.length<=5000&&s.attempts.length<=500);
  fresh.sessions=s.sessions.map((v:any)=>{ensure(validDate(v.day)&&finite(v.seconds,30,3600)&&typeof v.id==='string'&&typeof v.at==='string');return {id:v.id,day:v.day,seconds:v.seconds,lessonId:lessonMap.has(v.lessonId)?v.lessonId:null,at:v.at}});
  fresh.attempts=s.attempts.map((v:Attempt)=>{ensure(typeof v.id==='string'&&Array.isArray(v.questionIds)&&v.questionIds.length<=120&&v.questionIds.every(id=>questionMap.has(id))&&v.answers&&typeof v.startedAt==='string'&&typeof v.submittedAt==='string');const answers:Record<string,number>={};for(const id of v.questionIds)if(finite(v.answers[id],0,3))answers[id]=v.answers[id];return {...v,answers,score:v.questionIds.filter(id=>answers[id]===questionMap.get(id)?.answer).length}});
  for(let d=1;d<=15;d++)if(typeof s.days?.[d]==='boolean')fresh.days[d]=s.days[d];Object.assign(state,fresh);
 }
 else throw new Error('Thao tác không hợp lệ.');
 ensure(JSON.stringify(state).length<1500000,'Bản tiến độ quá lớn.');return state;
}
