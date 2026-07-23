import {createClient,type SupabaseClient} from "@supabase/supabase-js";

let browserClient:SupabaseClient|null|undefined;

export function isSupabaseConfigured(){return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)}

export function getSupabaseBrowserClient():SupabaseClient|null{
  if(browserClient!==undefined)return browserClient;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  browserClient=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}):null;
  return browserClient;
}
