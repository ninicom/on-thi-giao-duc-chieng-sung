import type {StudyState,LessonProgress} from './types';
export function vietnamDate(value:Date|string=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))}
export function today(){return vietnamDate()}
export function dayAfter(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function studyDay(start:string){return Math.min(15,Math.max(1,Math.floor((Date.parse(today()+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000)+1))}
export const emptyLesson=():LessonProgress=>({done:false,recall:null,recallCued:false,reviews:0,streak:0,due:null,lastReviewed:null,note:''});
export function initialState():StudyState{return {schemaVersion:1,startDate:today(),dailyTarget:8,lessons:{},questions:{},reading:{},readingPages:{},sessions:[],attempts:[],activeAttempt:null,days:{}}}
