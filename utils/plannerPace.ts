export type Pace=1|2|3;

const tempoByPace:Record<Pace,string>={1:"여유롭게",2:"균형 있게",3:"알차게"};

export const tempoForPace=(pace:Pace)=>tempoByPace[pace];
export const paceForTempo=(tempo:string):Pace=>tempo==="여유롭게"?1:tempo==="알차게"?3:2;
