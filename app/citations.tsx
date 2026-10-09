import {sourceMap} from './data';
import overrides from './citation-overrides.json';
import type {Lesson,Question,Reading} from './types';

type CitationOverride={subject?:Reading;note?:string;showBeforeAnswer?:boolean};
const questionOverrides=overrides.questions as Record<string,CitationOverride>;
const pointOverrides=overrides.points as Record<string,Reading[][]>;
const articleText=(article?:string|string[])=>Array.isArray(article)?article.join('; '):article;

export function SourceLink({id,article}:{id:string;article?:string|string[]}){
 const source=sourceMap.get(id);
 return <a className="source-link" href={source?.download_url} target="_blank" rel="noopener noreferrer"><span className="source-name">{source?.title??id}</span><span className="source-reference">{id}{article?' · '+articleText(article):''}</span></a>;
}

export function questionSearchText(question:Question){
 const subject=questionOverrides[question.id]?.subject;
 return [question.stem,question.sourceId,sourceMap.get(question.sourceId)?.title,question.article,...question.choices,subject?.sourceId,subject&&sourceMap.get(subject.sourceId)?.title,subject&&articleText(subject.articles)].filter(Boolean).join(' ');
}

export function questionCitationLabel(question:Question){return `${sourceMap.get(question.sourceId)?.title??question.sourceId} · ${question.sourceId} · ${question.article}`;}

export function QuestionContext({question,explained=false}:{question:Question;explained?:boolean}){
 const override=questionOverrides[question.id];
 const subject=override?.subject;
 const showSubject=subject&&(explained||override.showBeforeAnswer===true);
 return <div className="citation-context" data-citation-phase={explained?'explanation':'question'}><p className="citation-label">Căn cứ đối chiếu</p><SourceLink id={question.sourceId} article={question.article}/>{showSubject&&<div className="citation-subject"><p className="citation-label">{subject.sourceId===question.sourceId?'Điều khoản được đề cập':'Quy định gốc được viện dẫn'}</p><SourceLink id={subject.sourceId} article={subject.articles}/></div>}{explained&&override?.note&&<p className="citation-note">{override.note}</p>}</div>;
}

export function RuleExplanation({question,showAnswer=true}:{question:Question;showAnswer?:boolean}){
 return <div className="rule-explanation" data-rule-explanation><h3>Hiểu quy định trong câu này</h3>{showAnswer&&<p className="correct-answer"><b>{String.fromCharCode(65+question.answer)}. {question.choices[question.answer]}</b></p>}<p>{question.explanation}</p><QuestionContext question={question} explained/></div>;
}

export function LessonContext({lesson}:{lesson:Lesson}){
 return <div className="citation-context lesson-sources"><p className="citation-label">Văn bản và phần đọc của bài</p>{lesson.reading.map((reading,index)=><SourceLink key={index} id={reading.sourceId} article={reading.articles}/>)}</div>;
}

export function PointSources({lesson,index}:{lesson:Lesson;index:number}){
 const references=pointOverrides[lesson.id]?.[index]??(new Set(lesson.reading.map(r=>r.sourceId)).size===1?lesson.reading:[]);
 if(!references.length)return null;
 return <div className="point-sources"><span>Nguồn đọc liên quan:</span>{references.map((reading,i)=><SourceLink key={i} id={reading.sourceId} article={reading.articles}/>)}</div>;
}

export function LessonRules({lesson}:{lesson:Lesson}){
 return <section className="lesson-rules"><h3>Hiểu các điều khoản qua câu hỏi</h3><p className="muted">Mở từng câu để xem ý chính và căn cứ tương ứng. Phần giải thích tóm tắt quy định liên quan đến tình huống; mở tài liệu gốc để đọc toàn bộ điều khoản.</p>{lesson.questions.map(question=><details key={question.id}><summary>{question.stem}</summary><RuleExplanation question={question}/></details>)}</section>;
}
