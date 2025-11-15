// /api/utils/verify-recaptcha.js
export async function verifyRecaptcha(token){
  const secret = process.env.RECAPTCHA_SECRET;

  if(!secret){
    console.error("❌ Missing RECAPTCHA_SECRET");
    return { ok:false, error:"Missing secret" };
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify",{
      method:"POST",
      headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body:`secret=${secret}&response=${token}`
    });

    const json = await res.json();
    if(json.success) return { ok:true, score:json.score||0.5 };

    return { ok:false, error:"not verified", details:json };
  } catch(e){
    return { ok:false, error:String(e) };
  }
}
