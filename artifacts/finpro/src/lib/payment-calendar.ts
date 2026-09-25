export type PaymentPolicy = 'previous_business_day' | 'next_business_day';

const iso = (d: Date) => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
const addDays = (d: Date, days: number) => { const x=new Date(d); x.setDate(x.getDate()+days); return x; };

function easterSunday(year: number) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day,12);
}
export function passoFundoHolidays(year: number) {
  const easter=easterSunday(year);
  const movable=[addDays(easter,-2),addDays(easter,60)];
  const fixed=[[1,1],[4,21],[5,1],[9,7],[9,20],[10,12],[11,2],[11,15],[11,20],[12,8],[12,25]].map(([m,d])=>new Date(year,m-1,d,12));
  return new Set([...fixed,...movable].map(iso));
}
const isHoliday=(d:Date)=>passoFundoHolidays(d.getFullYear()).has(iso(d));
const isBusinessDay=(d:Date)=>d.getDay()!==0&&d.getDay()!==6&&!isHoliday(d);

function moveToBusinessDay(date: Date, direction: -1|1) {
  let d=new Date(date);
  do { d=addDays(d,direction); } while(!isBusinessDay(d));
  return d;
}
export function nthBusinessDay(year:number, monthIndex:number, ordinal:number) {
  let count=0;
  for(let day=1;day<=31;day++){
    const d=new Date(year,monthIndex,day,12);
    if(d.getMonth()!==monthIndex) break;
    if(isBusinessDay(d) && ++count===ordinal) return d;
  }
  throw new Error('Não foi possível calcular o dia útil.');
}
export function resolvePaymentDate(input:{year:number;monthIndex:number;scheduleType:'fixed_day'|'business_day';dayOfMonth?:number|null;businessDayOrdinal?:number|null;saturdayPolicy:PaymentPolicy;sundayPolicy:PaymentPolicy;holidayPolicy:PaymentPolicy}) {
  let d=input.scheduleType==='business_day'
    ? nthBusinessDay(input.year,input.monthIndex,input.businessDayOrdinal??5)
    : new Date(input.year,input.monthIndex,Math.min(input.dayOfMonth??1,new Date(input.year,input.monthIndex+1,0).getDate()),12);
  if(isHoliday(d)) d=moveToBusinessDay(d,input.holidayPolicy==='previous_business_day'?-1:1);
  else if(d.getDay()===6) d=moveToBusinessDay(d,input.saturdayPolicy==='previous_business_day'?-1:1);
  else if(d.getDay()===0) d=moveToBusinessDay(d,input.sundayPolicy==='previous_business_day'?-1:1);
  return d;
}
export const formatPaymentDate=(d:Date)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
