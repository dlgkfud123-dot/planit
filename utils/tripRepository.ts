import type {TripSnapshot} from "./tripStorage";

export interface TripRepository{
  list():Promise<TripSnapshot[]>;
  find(id:string):Promise<TripSnapshot|null>;
  save(snapshot:TripSnapshot):Promise<TripSnapshot>;
  remove(id:string):Promise<void>;
}

export class TripRepositoryError extends Error{readonly causeCode?:string;constructor(message:string,causeCode?:string){super(message);this.name="TripRepositoryError";this.causeCode=causeCode}}

export function hasPersistableDates(snapshot:TripSnapshot){return /^\d{4}-\d{2}-\d{2}$/.test(snapshot.start)&&/^\d{4}-\d{2}-\d{2}$/.test(snapshot.end)&&!Number.isNaN(Date.parse(`${snapshot.start}T00:00:00Z`))&&!Number.isNaN(Date.parse(`${snapshot.end}T00:00:00Z`))}
