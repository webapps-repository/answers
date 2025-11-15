// /api/utils/send-email.js
import { Resend } from "resend";
const FROM = "Melodies Web <sales@hazcam.io>";

export async function sendEmailHTML({to,subject,html,attachments=[]}){
  const key = process.env.RESEND_API_KEY;
  if(!key){
    console.error("❌ RESEND_API_KEY missing");
    return {success:false,error:"missing key"};
  }

  const resend = new Resend(key);

  try{
    const resp = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      attachments: attachments.length? attachments:undefined
    });
    if(resp?.data?.id) return {success:true,id:resp.data.id};

    return {success:false,error:"unexpected",raw:resp};
  }catch(e){
    console.error("sendEmail error",e);
    return {success:false,error:String(e)};
  }
}
