import type {SupabaseClient} from "@supabase/supabase-js";
import {restoreTripSnapshot,type TripSnapshot} from "./tripStorage.ts";
import {hasPersistableDates,TripRepositoryError,type TripRepository} from "./tripRepository.ts";

type TripRow={snapshot:unknown};

export class SupabaseTripRepository implements TripRepository{
  private readonly client:SupabaseClient;
  constructor(client:SupabaseClient){this.client=client}
  async list(){const{data,error}=await this.client.from("trips").select("snapshot").order("updated_at",{ascending:false});if(error)throw new TripRepositoryError("계정 일정을 불러오지 못했습니다.",error.code);return(data as TripRow[]??[]).map(row=>restoreTripSnapshot(row.snapshot)).filter((trip):trip is TripSnapshot=>trip!==null)}
  async find(id:string){const{data,error}=await this.client.from("trips").select("snapshot").eq("id",id).maybeSingle();if(error)throw new TripRepositoryError("계정 일정을 불러오지 못했습니다.",error.code);return data?restoreTripSnapshot((data as TripRow).snapshot):null}
  async save(snapshot:TripSnapshot){if(!hasPersistableDates(snapshot))throw new TripRepositoryError("시작일과 종료일을 입력한 뒤 계정에 저장해주세요.","INVALID_DATES");const row={id:snapshot.id,title:snapshot.title,destination:snapshot.destination,start_date:snapshot.start,end_date:snapshot.end,schema_version:snapshot.schemaVersion,snapshot,updated_at:new Date().toISOString()};const{error}=await this.client.from("trips").upsert(row,{onConflict:"id"});if(error)throw new TripRepositoryError("계정에 일정을 저장하지 못했습니다.",error.code);return snapshot}
  async remove(id:string){const{error}=await this.client.from("trips").delete().eq("id",id);if(error)throw new TripRepositoryError("계정 일정을 삭제하지 못했습니다.",error.code)}
}
