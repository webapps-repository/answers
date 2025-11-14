// /api/utils/verify-recaptcha.js
export async function verifyRecaptcha(token){
  try{
    const secret=process.env.RECAPTCHA_SECRET;
    if(!secret) return {ok:false, error:"Missing RECAPTCHA_SECRET"};

    const r=await fetch("https://www.google.com/recaptcha/api/siteverify",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:`secret=${secret}&response=${token}`
    });

    const data=await r.json();
    return { ok:data.success===true, raw:data };
  }
  catch(e){
    return {ok:false, error:String(e)};
  }
}
