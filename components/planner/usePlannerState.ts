"use client";

import {useCallback,useMemo,useReducer,type SetStateAction} from "react";
import type {GeneratedDay} from "../../utils/itineraryGenerator";
import {paceForTempo,tempoForPace,type Pace} from "../../utils/plannerPace";

export type {Pace} from "../../utils/plannerPace";
export type PlannerFormState={destination:string;origin:string;start:string;end:string;people:number;budget:number;interest:string;food:string;stay:string;wish:string;pace:Pace};
type Field=keyof PlannerFormState;
type Action={type:"set";field:Field;value:PlannerFormState[Field]}|{type:"hydrate";value:Partial<PlannerFormState>};

const initialState:PlannerFormState={destination:"서울",origin:"서울 (ICN)",start:"2026-08-14",end:"2026-08-18",people:2,budget:120,interest:"자연 · 도시",food:"현지 맛집 중심",stay:"편안한 호텔",wish:"",pace:2};

function reducer(state:PlannerFormState,action:Action):PlannerFormState{
  if(action.type==="hydrate")return{...state,...action.value};
  return{...state,[action.field]:action.value};
}

export function usePlannerState(){
  const[state,dispatch]=useReducer(reducer,initialState);
  const set=useCallback(<K extends Field>(field:K,value:PlannerFormState[K])=>dispatch({type:"set",field,value}),[]);
  const hydrate=useCallback((value:Partial<PlannerFormState>)=>dispatch({type:"hydrate",value}),[]);
  const setters=useMemo(()=>({
    setDestination:(value:string)=>set("destination",value),setOrigin:(value:string)=>set("origin",value),
    setStart:(value:string)=>set("start",value),setEnd:(value:string)=>set("end",value),
    setPeople:(value:number)=>set("people",value),setBudget:(value:number)=>set("budget",value),
    setInterest:(value:string)=>set("interest",value),setFood:(value:string)=>set("food",value),
    setStay:(value:string)=>set("stay",value),setWish:(value:string)=>set("wish",value),
    setPace:(value:Pace)=>set("pace",value),setTempo:(value:string)=>set("pace",paceForTempo(value))
  }),[set]);
  return{...state,tempo:tempoForPace(state.pace),hydrate,...setters};
}

type PlannerStatus="empty"|"loading"|"unsupported"|"complete";
type MobileTab="conditions"|"schedule"|"map";
type SaveStatus="idle"|"saving"|"saved";
type PlannerUiState={status:PlannerStatus;loadingStep:number;plan:GeneratedDay[];generationError:string;activeDay:number;activeStop:number;mobileTab:MobileTab;addOpen:boolean;placeQuery:string;editNotice:string;historyDepth:number;editingStop:string|null;openStopMenu:string|null;savedTripId:string|null;saveStatus:SaveStatus;shareUrl:string;source:"new"|"saved"|"draft"|"shared"};
type UiField=keyof PlannerUiState;
type UiAction<K extends UiField=UiField>={field:K;value:SetStateAction<PlannerUiState[K]>};
const initialUiState:PlannerUiState={status:"empty",loadingStep:0,plan:[],generationError:"",activeDay:0,activeStop:0,mobileTab:"conditions",addOpen:false,placeQuery:"",editNotice:"",historyDepth:0,editingStop:null,openStopMenu:null,savedTripId:null,saveStatus:"idle",shareUrl:"",source:"new"};

function uiReducer(state:PlannerUiState,action:UiAction):PlannerUiState{
  const previous=state[action.field],next=typeof action.value==="function"?(action.value as (value:typeof previous)=>typeof previous)(previous):action.value;
  return{...state,[action.field]:next};
}

export function usePlannerUiState(){
  const[state,dispatch]=useReducer(uiReducer,initialUiState);
  const setter=useCallback(<K extends UiField>(field:K)=>(value:SetStateAction<PlannerUiState[K]>)=>dispatch({field,value} as UiAction),[]);
  const setters=useMemo(()=>({
    setStatus:setter("status"),setLoadingStep:setter("loadingStep"),setPlan:setter("plan"),setGenerationError:setter("generationError"),
    setActiveDay:setter("activeDay"),setActiveStop:setter("activeStop"),setMobileTab:setter("mobileTab"),setAddOpen:setter("addOpen"),
    setPlaceQuery:setter("placeQuery"),setEditNotice:setter("editNotice"),setHistoryDepth:setter("historyDepth"),setEditingStop:setter("editingStop"),
    setOpenStopMenu:setter("openStopMenu"),setSavedTripId:setter("savedTripId"),setSaveStatus:setter("saveStatus"),setShareUrl:setter("shareUrl"),setSource:setter("source")
  }),[setter]);
  return{...state,...setters};
}
