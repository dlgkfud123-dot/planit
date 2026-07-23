"use client";

import {useCallback,useMemo,useRef} from "react";
import {useAuth} from "../auth/AuthProvider";
import {getSupabaseBrowserClient} from "../../lib/supabase/client";
import {LocalTripRepository} from "../../utils/localTripRepository";
import {SupabaseTripRepository} from "../../utils/supabaseTripRepository";
import {readSavedTrips,writeSavedTrips,type TripSnapshot} from "../../utils/tripStorage";
import type {TripRepository} from "../../utils/tripRepository";
import {importTrips} from "../../utils/tripPersistence";

export function useTripPersistence(){
  const{user,ready,configured}=useAuth(),generatedIdRef=useRef<string|null>(null);
  const local=useMemo(()=>new LocalTripRepository(),[]);
  const remote=useMemo(()=>{const client=getSupabaseBrowserClient();return user&&client?new SupabaseTripRepository(client):null},[user]);
  const repository:TripRepository=remote??local;
  const ensureId=useCallback((current:string|null)=>current??generatedIdRef.current??(generatedIdRef.current=crypto.randomUUID()),[]);
  const save=useCallback((snapshot:TripSnapshot)=>repository.save(snapshot),[repository]);
  const list=useCallback(()=>repository.list(),[repository]);
  const find=useCallback((id:string)=>repository.find(id),[repository]);
  const remove=useCallback((id:string)=>repository.remove(id),[repository]);
  const importLocal=useCallback(async()=>remote?importTrips(remote,readSavedTrips()):{imported:0,failed:readSavedTrips().length,importedIds:[] as string[],failedIds:readSavedTrips().map(trip=>trip.id)},[remote]);
  const clearImportedLocal=useCallback((importedIds:Set<string>)=>writeSavedTrips(readSavedTrips().filter(trip=>!importedIds.has(trip.id))),[]);
  return{user,authReady:ready,configured,isRemote:Boolean(remote),repository,ensureId,save,list,find,remove,importLocal,clearImportedLocal};
}
