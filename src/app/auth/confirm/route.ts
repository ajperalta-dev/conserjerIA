import {NextResponse,type NextRequest} from "next/server";
import {serverClient} from "@/integrations/supabase/server";
export async function GET(request:NextRequest){
 const token_hash=request.nextUrl.searchParams.get("token_hash"),type=request.nextUrl.searchParams.get("type");
 if(token_hash && (type==="invite"||type==="recovery"||type==="email"||type==="magiclink")){
 const client=await serverClient();const {error}=await client.auth.verifyOtp({token_hash,type});
 if(!error)return NextResponse.redirect(new URL("/cuenta",request.url));
 }
 return NextResponse.redirect(new URL("/acceso?error=verificacion",request.url));
}
