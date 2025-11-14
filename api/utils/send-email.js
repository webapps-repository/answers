// /api/utils/send-email.js
import { Resend } from "resend";

export async function sendEmailHTML({to,subject,html,attachments=[]}){
  if(!process.env.RESEND_API_KEY){
    console.error("Missing RESEND_API_KEY");
    return {success:false,error:"Missing key"};
  }

  const resend=new Resend(process.env.RESEND_API_KEY);

  try{
    const resp=await resend.emails.send({
      from:"Melodies Web <sales@hazcam.io>",
      to,
      subject,
      html,
      attachments:attachments.map(a=>({
        filename:a.filename,
        content:a.buffer
      }))
    });

    if(resp?.data?.id){
      return {success:true,id:resp.data.id};
    }
    return {success:false,error:"Unexpected Resend response"};
  }
  catch(e){
    console.error("Email error:",e);
    return {success:false,error:String(e)};
  }
}
