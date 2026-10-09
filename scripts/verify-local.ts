import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {apply} from '../app/engine';
import {initialState,vietnamDate} from '../app/state';
import {questions,questionMap} from '../app/data';

const results:string[]=[];
const pass=(name:string)=>results.push(name);
const state=initialState();
apply(state,'quizStart',{mode:'mock',group:'general',count:60,minutes:60});
assert.equal(state.activeAttempt!.questionIds.length,60);
assert.equal(new Set(state.activeAttempt!.questionIds).size,60);
assert(state.activeAttempt!.questionIds.every(id=>questionMap.get(id)?.group==='general'));
const topicCounts=Object.values(state.activeAttempt!.questionIds.reduce((counts:Record<string,number>,id)=>{const topic=questionMap.get(id)!.topicId;counts[topic]=(counts[topic]??0)+1;return counts},{}));
assert.equal(topicCounts.length,11);assert(Math.max(...topicCounts)-Math.min(...topicCounts)<=1);
assert.equal(Date.parse(state.activeAttempt!.deadlineAt!)-Date.parse(state.activeAttempt!.startedAt),3600000);
pass('60 unique general questions balanced across all 11 topics and a continuous 60-minute deadline');
apply(state,'quizCancel',{id:state.activeAttempt!.id});
apply(state,'quizStart',{mode:'mock',group:'education',count:120,minutes:180});
assert.equal(state.activeAttempt!.questionIds.length,120);
assert(state.activeAttempt!.questionIds.every(id=>questionMap.get(id)?.group==='education'));
pass('120-question education practice exam');
apply(state,'quizCancel',{id:state.activeAttempt!.id});

const chosen=questions.filter(q=>q.topicId==='e07').slice(0,3);
apply(state,'quizStart',{mode:'practice',group:'all',topicId:'e07',questionIds:chosen.map(q=>q.id),count:10});
assert.deepEqual(new Set(state.activeAttempt!.questionIds),new Set(chosen.map(q=>q.id)));
for(const id of state.activeAttempt!.questionIds){const q=questionMap.get(id)!;apply(state,'quizAnswer',{id:state.activeAttempt!.id,questionId:id,choice:(q.answer+1)%4})}
const firstId=state.activeAttempt!.id;
apply(state,'quizSubmit',{id:firstId});
assert.equal(state.attempts.at(-1)!.score,0);
assert(chosen.every(q=>state.questions[q.id].wrong===1));
apply(state,'quizSubmit',{id:firstId});
assert.equal(state.attempts.length,1);
pass('Exact topic filter, wrong-answer grading, and duplicate submission protection');
apply(state,'quizStart',{mode:'wrong',group:'all',count:20});
assert.deepEqual(new Set(state.activeAttempt!.questionIds),new Set(chosen.map(q=>q.id)));
for(const id of state.activeAttempt!.questionIds)apply(state,'quizAnswer',{id:state.activeAttempt!.id,questionId:id,choice:questionMap.get(id)!.answer});
apply(state,'quizSubmit',{id:state.activeAttempt!.id});
assert.equal(state.attempts.at(-1)!.score,3);
assert.throws(()=>apply(state,'quizStart',{mode:'wrong',group:'all',count:5}),/Chưa có câu hỏi/);
pass('Wrong answers leave the retry queue after a correct retry');

apply(state,'quizStart',{mode:'mock',group:'all',count:5,minutes:1});
const expired=state.activeAttempt!;
expired.deadlineAt=new Date(Date.now()-1000).toISOString();
assert.throws(()=>apply(state,'quizAnswer',{id:expired.id,questionId:expired.questionIds[0],choice:0}),/hết giờ/);
apply(state,'quizSubmit',{id:expired.id});
assert.equal(state.attempts.at(-1)!.score,0);
assert.equal(state.activeAttempt,null);
pass('Expired answers rejected; unanswered questions graded as incorrect');

const all=initialState();
while(Object.keys(all.questions).length<questions.length){
 apply(all,'quizStart',{mode:'unseen',group:'all',count:120});
 const attempt=all.activeAttempt!;
 for(const id of attempt.questionIds)apply(all,'quizAnswer',{id:attempt.id,questionId:id,choice:questionMap.get(id)!.answer});
 apply(all,'quizSubmit',{id:attempt.id});
 assert.equal(all.attempts.at(-1)!.score,attempt.questionIds.length);
}
assert.equal(Object.keys(all.questions).length,questions.length);
assert(questions.length>=800);
assert(Object.values(all.questions).every(q=>q.attempts===1&&q.correct===1));
assert.throws(()=>apply(all,'quizStart',{mode:'unseen',group:'all',count:5}),/Chưa có câu hỏi/);
pass('All '+questions.length+' questions reachable and correctly scored; unseen mode covers every question exactly once');
assert.equal(vietnamDate('2026-10-05T17:30:00Z'),'2026-10-06');
pass('Practice history grouped by the Vietnam calendar day');
writeFileSync('.sites-runtime/local-verification.json',JSON.stringify({passed:results.length,results},null,2));
console.log(JSON.stringify({passed:results.length,results}));
