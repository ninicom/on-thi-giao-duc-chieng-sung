import assert from 'node:assert/strict';
import {createElement,Fragment,type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {LessonContext,PointSources,QuestionContext,RuleExplanation,questionCitationLabel,questionSearchText} from '../app/citations';
import {lessons,lessonMap,questions,questionMap,sourceMap} from '../app/data';
import overrides from '../app/citation-overrides.json';
import type {Reading} from '../app/types';

type CitationOverride={subject?:Reading;note?:string;showBeforeAnswer?:boolean};
const questionOverrides=overrides.questions as Record<string,CitationOverride>;
const pointOverrides=overrides.points as Record<string,Reading[][]>;
const results:string[]=[];
const escaped=(text:string)=>renderToStaticMarkup(createElement(Fragment,null,text));
const render=(node:ReactNode)=>renderToStaticMarkup(node);
const articleText=(article:string|string[])=>Array.isArray(article)?article.join('; '):article;

function checkReference(markup:string,reading:Reading,context:string){
 const source=sourceMap.get(reading.sourceId);
 assert(source,`${context}: unknown source ${reading.sourceId}`);
 assert(source.title.trim(),`${context}: source has no full title`);
 assert(articleText(reading.articles).trim(),`${context}: missing article reference`);
 const link=render(createElement('a',{className:'source-link',href:source.download_url,target:'_blank',rel:'noopener noreferrer'},
  createElement('span',{className:'source-name'},source.title),
  createElement('span',{className:'source-reference'},`${reading.sourceId} · ${articleText(reading.articles)}`)));
 assert(markup.includes(link),`${context}: title, source ID, article, and download URL must appear in the same citation`);
}

for(const question of questions){
 const before=render(createElement(QuestionContext,{question}));
 checkReference(before,{sourceId:question.sourceId,articles:question.article},question.id+' before answer');
 assert(before.includes('data-citation-phase="question"'),question.id+': missing question phase');
 assert(!before.includes(escaped(question.explanation)),question.id+': explanation exposed before answer');
 assert(!/correct-answer|rule-explanation|data-rule-explanation|citation-note/.test(before),question.id+': answer or explanation markup exposed before answer');
 const override=questionOverrides[question.id];
 if(override?.note)assert(!before.includes(escaped(override.note)),question.id+': override note exposed before answer');
 if(override?.subject){
  assert(sourceMap.has(override.subject.sourceId),question.id+': unknown amendment or charter subject');
  if(override.showBeforeAnswer)checkReference(before,override.subject,question.id+' visible subject');
  else assert(!before.includes('class="citation-subject"'),question.id+': postanswer subject exposed before answer');
 }
 const after=render(createElement(RuleExplanation,{question}));
 assert(after.includes('data-rule-explanation'),question.id+': missing explanation markup');
 assert(after.includes('data-citation-phase="explanation"'),question.id+': missing explanation citation phase');
 assert(after.includes(escaped(question.explanation)),question.id+': missing explanation after answer');
 assert(after.includes(`<p class="correct-answer"><b>${escaped(`${String.fromCharCode(65+question.answer)}. ${question.choices[question.answer]}`)}</b></p>`),question.id+': missing correct answer after answer');
 checkReference(after,{sourceId:question.sourceId,articles:question.article},question.id+' after answer');
 if(override?.subject)checkReference(after,override.subject,question.id+' amendment or charter subject');
 if(override?.note)assert(after.includes(escaped(override.note)),question.id+': missing explanation note');
 const withoutAnswer=render(createElement(RuleExplanation,{question,showAnswer:false}));
 assert(!withoutAnswer.includes('class="correct-answer"'),question.id+': showAnswer=false exposes the correct-answer paragraph');
 assert(withoutAnswer.includes(escaped(question.explanation)),question.id+': explanation missing when answer paragraph hidden');
 const label=questionCitationLabel(question),searchText=questionSearchText(question);
 for(const text of [sourceMap.get(question.sourceId)!.title,question.sourceId,question.article]){
  assert(label.includes(text),question.id+': incomplete citation label');
  assert(searchText.includes(text),question.id+': source not searchable by full title, ID, and article');
 }
 if(override?.subject)for(const text of [sourceMap.get(override.subject.sourceId)!.title,override.subject.sourceId,articleText(override.subject.articles)]){
  assert(searchText.includes(text),question.id+': amendment subject not searchable');
 }
}
results.push(`${questions.length} question citations resolve with full titles, IDs, articles and links; answer details remain hidden before answering`);

for(const [questionId,override] of Object.entries(questionOverrides)){
 assert(questionMap.has(questionId),`Unknown question override ${questionId}`);
 if(override.subject)assert(sourceMap.has(override.subject.sourceId),`${questionId}: unknown override source`);
}

for(const [id,targetSource,targetArticle] of [
 ['e07-4-q2','10/2025/TT-BGDĐT','Điều 18'],
 ['e07-4-q3','13/2025/TT-BGDĐT','Điều 5'],
]){
 const question=questionMap.get(id);
 assert(question,`${id}: amendment-target regression question missing`);
 const override=questionOverrides[id];
 assert(override?.subject,`${id}: amendment subject must be available after answering`);
 assert.equal(override.subject.sourceId,targetSource,`${id}: incorrect amendment target`);
 assert(articleText(override.subject.articles).includes(targetArticle),`${id}: target article missing`);
 assert.notEqual(override.showBeforeAnswer,true,`${id}: amendment target reveals the answer before answering`);
 const before=render(createElement(QuestionContext,{question}));
 const after=render(createElement(RuleExplanation,{question}));
 assert(!before.includes('class="citation-subject"'),`${id}: amendment target exposed before answering`);
 checkReference(after,override.subject,id+' target after answer');
}
results.push('Amendment-target questions e07-4-q2/q3 reveal the target document only after answering');

for(const lesson of lessons){
 const lessonMarkup=render(createElement(LessonContext,{lesson}));
 for(const reference of lesson.reading)checkReference(lessonMarkup,reference,lesson.id+' lesson sources');
 for(let index=0;index<lesson.points.length;index++){
  const pointMarkup=render(createElement(PointSources,{lesson,index}));
  const references=pointOverrides[lesson.id]?.[index]??(new Set(lesson.reading.map(r=>r.sourceId)).size===1?lesson.reading:[]);
  for(const reference of references)checkReference(pointMarkup,reference,`${lesson.id} point ${index+1}`);
  if(!references.length)assert.equal(pointMarkup,'',`${lesson.id} point ${index+1}: displayed an unsupported source`);
 }
}
let pointCount=0;
for(const [lessonId,points] of Object.entries(pointOverrides)){
 const lesson=lessonMap.get(lessonId);
 assert(lesson,`Unknown point override lesson ${lessonId}`);
 assert(points.length<=lesson.points.length,`${lessonId}: point override index exceeds the lesson point count`);
 points.forEach((references,index)=>{
  assert(index>=0&&index<lesson.points.length,`${lessonId}: invalid helper point index ${index}`);
  references.forEach(reference=>{
   assert(sourceMap.has(reference.sourceId),`${lessonId} point ${index+1}: unknown helper source ${reference.sourceId}`);
   assert(articleText(reference.articles).trim(),`${lessonId} point ${index+1}: empty helper article`);
   pointCount++;
  });
 });
}
results.push(`${lessons.length} lesson source lists and ${pointCount} helper point references resolve; every helper point index is valid`);
console.log(JSON.stringify({passed:results.length,results}));
