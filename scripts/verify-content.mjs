import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

process.chdir(resolve(import.meta.dirname,'..'));
const course=JSON.parse(readFileSync('app/course.json','utf8'));
const sources=JSON.parse(readFileSync('app/sources.json','utf8'));
const sourceIds=new Set(sources.map(source=>source.id));
const lessons=course.topics.flatMap(topic=>topic.lessons),questions=lessons.flatMap(lesson=>lesson.questions);
assert.equal(new Set(lessons.map(l=>l.id)).size,lessons.length);
assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
assert.equal(new Set(questions.map(q=>q.stem.trim().toLocaleLowerCase('vi'))).size,questions.length);
const referenced=new Set();
for(const topic of course.topics){
 for(const id of topic.sourceIds){assert(sourceIds.has(id));referenced.add(id)}
 for(const lesson of topic.lessons){
  for(const key of ['title','example','recallPrompt','recallAnswer'])assert(lesson[key]?.trim(),lesson.id+' '+key);
  assert(lesson.points.length>=3&&lesson.reading.length>0);
  for(const reading of lesson.reading){assert(sourceIds.has(reading.sourceId));referenced.add(reading.sourceId)}
  for(const question of lesson.questions){
   assert.equal(question.choices.length,4,question.id);
   assert.equal(new Set(question.choices).size,4,question.id);
   assert(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<4,question.id);
   assert(question.explanation&&question.article&&sourceIds.has(question.sourceId),question.id);
   assert.equal(question.lessonId,lesson.id);assert.equal(question.topicId,topic.id);assert.equal(question.group,topic.group);
   referenced.add(question.sourceId);
  }
 }
}
for(const source of sources){
 const file=readFileSync('public/downloads/originals/'+source.file);
 assert.equal(createHash('sha256').update(file).digest('hex'),source.sha256,source.id);
 if(!source.file.startsWith('00_'))assert(referenced.has(source.id));
}
const result={topics:course.topics.length,lessons:lessons.length,questions:questions.length,originalDocuments:sources.length,byGroup:Object.fromEntries(['general','education'].map(group=>[group,questions.filter(q=>q.group===group).length]))};
mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/content-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
