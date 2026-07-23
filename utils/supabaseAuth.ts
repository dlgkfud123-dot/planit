type AuthError={message:string}|null;
export type EmailAuthClient={auth:{signUp:(input:{email:string;password:string})=>Promise<{error:AuthError}>;signInWithPassword:(input:{email:string;password:string})=>Promise<{error:AuthError}>;signOut:()=>Promise<{error:AuthError}>}};

export async function signUpWithEmail(client:EmailAuthClient,email:string,password:string){const{error}=await client.auth.signUp({email,password});return{error:error?.message??null}}
export async function signInWithEmail(client:EmailAuthClient,email:string,password:string){const{error}=await client.auth.signInWithPassword({email,password});return{error:error?.message??null}}
export async function signOutUser(client:EmailAuthClient){const{error}=await client.auth.signOut();return{error:error?.message??null}}
