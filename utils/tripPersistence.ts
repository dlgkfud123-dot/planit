import type {TripSnapshot} from "./tripStorage.ts";
import type {TripRepository} from "./tripRepository.ts";

export async function saveWithFallback(save:()=>Promise<TripSnapshot>,snapshot:TripSnapshot,fallback:(snapshot:TripSnapshot)=>void){try{await save();return{saved:true as const,error:null}}catch(error){fallback(snapshot);return{saved:false as const,error:error instanceof Error?error:new Error("일정 저장에 실패했습니다.")}}}

export async function importTrips(repository:TripRepository,trips:TripSnapshot[]){const importedIds:string[]=[],failedIds:string[]=[];for(const trip of trips){try{await repository.save(trip);importedIds.push(trip.id)}catch{failedIds.push(trip.id)}}return{imported:importedIds.length,failed:failedIds.length,importedIds,failedIds}}
