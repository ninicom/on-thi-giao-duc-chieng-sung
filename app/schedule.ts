import {topics,questions} from './data';
import type {Lesson} from './types';
function interleave(groups:Lesson[][]){const out:Lesson[]=[];for(let i=0;i<Math.max(0,...groups.map(g=>g.length));i++)for(const g of groups)if(g[i])out.push(g[i]);return out}
// Short days absorb unfinished reading from earlier themes; mock days keep a smaller load.
export const dailyLessons:Record<number,Lesson[]>={};
const carry:Lesson[]=[];
for(let day=1;day<=15;day++){
 const available=interleave(topics.filter(t=>t.day===day).map(t=>t.lessons.filter(l=>!l.supplemental)));
 const limit=day<=12?6:day===13?4:day===14?2:Math.max(6,carry.length);
 const assigned=available.slice(0,limit);const leftovers=available.slice(limit);
 while(assigned.length<limit&&carry.length)assigned.push(carry.shift()!);
 carry.push(...leftovers);dailyLessons[day]=assigned;
}
export const scheduledDay=(id:string)=>Number(Object.entries(dailyLessons).find(([,items])=>items.some(l=>l.id===id))?.[0]??15);
export const dailyQuestionIds:Record<number,string[]>={};
const questionCarry:string[]=[];
for(let day=1;day<=15;day++){
 const available=topics.filter(t=>t.day===day).flatMap(t=>questions.filter(q=>q.topicId===t.id).map(q=>q.id));
 const limit=day<=12?70:day===13||day===14?20:questionCarry.length;
 const assigned=available.slice(0,limit);
 while(assigned.length<limit&&questionCarry.length)assigned.push(questionCarry.shift()!);
 questionCarry.push(...available.slice(limit));dailyQuestionIds[day]=assigned;
}
