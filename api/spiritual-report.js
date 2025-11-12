<style>
.spiritual-form{max-width:760px;margin:2rem auto;padding:1.6rem;background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.06);font-family:sans-serif;}
.spiritual-form h2{text-align:center;color:#4B0082;margin-bottom:1rem}
.field-row{display:flex;gap:.8rem;flex-wrap:wrap}
.field-col{flex:1 1 220px;min-width:180px}
input,textarea,select{width:100%;padding:.6rem;border:1px solid #ddd;border-radius:8px;font-size:1rem}
.btn{background:#6c63ff;color:#fff;padding:.9rem 1.1rem;border:none;border-radius:10px;cursor:pointer;font-weight:600}
.progress-bar{height:8px;background:#eee;border-radius:8px;overflow:hidden;margin-top:.8rem}
.progress{height:100%;width:0;background:linear-gradient(90deg,#6c63ff,#8c7cff);transition:width .3s linear}
#spinner{display:none;color:#6c63ff;margin-top:.5rem;text-align:center}
.summary-box{background:#f7f7fb;padding:.9rem;border-radius:8px;margin-top:1rem}
.toast{display:none;position:fixed;right:20px;bottom:20px;background:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.12)}
</style>

<div class="spiritual-form">
  <h2>Your Question</h2>
  <form id="spiritual-form" enctype="multipart/form-data">
    <label><b>Your Question</b> — up to 25 words</label>
    <textarea id="question" name="question" maxlength="200"></textarea>

    <div id="personal-fields" style="display:none;margin-top:10px">
      <div class="field-row">
        <div class="field-col"><label>Email</label><input type="email" id="email" name="email" required></div>
        <div class="field-col"><label>Full Name</label><input id="name" name="name"></div>
      </div>
      <div class="field-row"><div class="field-col"><label>Date of Birth (DD-MM-YYYY)</label><input id="birthdate" name="birthdate"></div>
        <div class="field-col"><label>Time of Birth (HH:MM)</label><input id="birthtime" name="birthtime"></div></div>
      <div class="field-row"><div class="field-col"><label>City</label><input id="birthcity" name="birthcity"></div>
        <div class="field-col"><label>State</label><input id="birthstate" name="birthstate"></div>
        <div class="field-col"><label>Country</label><input id="birthcountry" name="birthcountry"></div></div>
      <div><label>Upload Right Palm Image (optional)</label><input type="file" id="palmImage" name="palmImage" accept="image/*"></div>
    </div>

    <div id="g-recaptcha" class="g-recaptcha" style="margin-top:10px"></div>
    <button class="btn" id="submit-btn" type="submit">Submit</button>
    <div class="progress-bar"><div id="progress" class="progress"></div></div>
    <div id="spinner">Generating report... ⏳</div>
  </form>

  <div id="summary" style="display:none">
    <h3 style="color:#4B0082;margin-top:1rem">✨ Short Answer</h3>
    <div class="summary-box" id="answer-box"></div>
    <button class="btn" id="get-detail" style="background:#4caf50;margin-top:.5rem">Get Free Report (no payment needed)</button>
  </div>
</div>

<div class="toast" id="toast">Your detailed answer has been emailed.</div>

<script src="https://www.google.com/recaptcha/api.js?onload=initRecaptcha&render=explicit" async defer></script>
<script>
function initRecaptcha(){
  const el=document.getElementById("g-recaptcha");
  if(el&&!el.hasChildNodes()){
    grecaptcha.render(el,{sitekey:"YOUR_RECAPTCHA_SITE_KEY",theme:"light"});
  }
}
document.addEventListener("DOMContentLoaded",initRecaptcha);

(function(){
const f=document.getElementById("spiritual-form"),
btn=document.getElementById("submit-btn"),
prog=document.getElementById("progress"),
spin=document.getElementById("spinner"),
sum=document.getElementById("summary"),
ans=document.getElementById("answer-box"),
getDet=document.getElementById("get-detail"),
toast=document.getElementById("toast");

async function anim(pct){prog.style.width=pct+"%";}
function spinShow(b){spin.style.display=b?"block":"none";}

f.addEventListener("submit",async e=>{
e.preventDefault();btn.disabled=true;await anim(30);spinShow(true);
const fd=new FormData(f);try{fd.append("g-recaptcha-response",grecaptcha.getResponse());}catch{}
const r=await fetch("/api/spiritual-report",{method:"POST",body:fd});
const j=await r.json();await anim(95);
ans.innerText=j.answer||"No answer.";sum.style.display="block";
if(j.type==="personal")document.getElementById("personal-fields").style.display="block";
await anim(100);spinShow(false);btn.disabled=false;
});

getDet.addEventListener("click",()=>{toast.style.display="block";setTimeout(()=>toast.style.display="none",4000);});
})();
</script>
