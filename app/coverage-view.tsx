'use client';
import {useState} from 'react';
import {questions,sources,lessons} from './data';
import {ChoiceSelect,type Mutate} from './study-client';
import {Progress} from '@/components/ui/progress';
import type {StudyState} from './types';
import coverage from './coverage.json';
type CoverageSource={sourceId:string;articleGroups:{title:string;articles:string[];questionIds:string[];readingLessonIds:string[];status:string}[]};
const coverageSources=coverage.sources as CoverageSource[];

export default function CoverageView({state,start,busy}:{state:StudyState;start:(p:Record<string,unknown>)=>Promise<void>;busy:boolean}){
 const [group,setGroup]=useState('all');
 const legal=sources.filter(s=>s.file.startsWith('01_')||s.file.startsWith('02_')).filter(s=>group==='all'||(group==='general'?s.file.startsWith('01_'):s.file.startsWith('02_')));
 return <><div className="heading"><p className="overline">PHẠM VI CÂU HỎI THEO TÀI LIỆU</p><h1>Biết mình đã luyện đến đâu</h1><p>Mỗi nguồn có danh sách điều và mục được viện dẫn trong câu hỏi. Số câu và tỷ lệ đã luyện giúp theo dõi việc làm bài; chúng không thể hiện tỷ lệ bao phủ toàn văn.</p></div>
 <ChoiceSelect value={group} onChange={setGroup} label="Nhóm phạm vi tài liệu" options={[{value:'all',label:'Toàn bộ văn bản ôn tập'},{value:'general',label:'Kiến thức chung'},{value:'education',label:'Giáo dục và đào tạo'}]}/>
 <div className="coverage-grid">{legal.map(s=>{const qs=questions.filter(q=>q.sourceId===s.id),used=qs.filter(q=>state.questions[q.id]?.attempts),wrong=qs.filter(q=>state.questions[q.id]?.wrong&&!state.questions[q.id]?.lastCorrect),refs=[...new Set(qs.map(q=>q.article))],readings=lessons.filter(l=>l.reading.some(r=>r.sourceId===s.id)),groups=coverageSources.find(c=>c.sourceId===s.id)?.articleGroups??[];return <section className="card coverage-card" key={s.id}><p className="overline">{s.id}</p><h2>{s.title}</h2><div className="coverage-count"><strong>{qs.length} câu</strong><span>Đã luyện {used.length}{wrong.length?' · Cần ôn '+wrong.length:''}</span></div><Progress value={qs.length?used.length/qs.length*100:0} aria-label={'Tỷ lệ câu đã luyện của '+s.id}/>{refs.length>0?<details><summary>Điều/mục có trong câu hỏi ({refs.length} nhóm viện dẫn)</summary><ul>{refs.map(ref=><li key={ref}>{ref}</li>)}</ul></details>:<p className="muted">Chưa có câu viện dẫn riêng. Có {readings.length} bài hướng dẫn đối chiếu nguồn này.</p>}{groups.length>0&&<details className="coverage-sections"><summary>Nhóm quy định trong nguồn</summary><ul>{groups.map((g,i)=><li key={i}><strong>{g.title}</strong><span>{g.questionIds.length?'Có câu viện dẫn trong nhóm ('+g.questionIds.length+' câu)':g.readingLessonIds.length?'Có bài hướng dẫn đọc, chưa có câu viện dẫn riêng':g.status==='manual_subsection_check_required'||g.status==='clause_level_check_required'?'Cần đối chiếu từng nội dung sửa đổi':'Chưa có câu viện dẫn riêng'}</span></li>)}</ul></details>}<div className="button-row">{qs.length>0&&<button className="primary-button" disabled={busy} onClick={()=>void start({mode:'practice',group:'all',questionIds:qs.map(q=>q.id),count:Math.min(10,qs.length)})}>Luyện phần này</button>}<a className="text-button" href={s.download_url} target="_blank" rel="noopener noreferrer">Đọc toàn văn</a></div></section>})}</div>
 <p className="muted">Có câu trong một nhóm điều chưa đồng nghĩa đã kiểm tra mọi khoản hoặc ngoại lệ. Các thông báo và phụ lục tuyển dụng dùng để đối chiếu danh mục, quy chế và vị trí dự tuyển; xem trong mục Tài liệu & kế hoạch.</p><a className="text-button" href="./downloads/pham-vi-cau-hoi.json" download>Tải bảng phạm vi và căn cứ câu hỏi</a>
 </>
}
