const PASSWORD="zone7";

let data={artists:[]};


/* ===== DRAG PANEL ===== */
const panel=document.getElementById("panel");

panel.onmousedown=(e)=>{
  let x=e.clientX-panel.offsetLeft;
  let y=e.clientY-panel.offsetTop;

  document.onmousemove=(e)=>{
    panel.style.left=e.clientX-x+"px";
    panel.style.top=e.clientY-y+"px";
  };
  document.onmouseup=()=>document.onmousemove=null;
};


/* ===== LOGIN ===== */

adminBtn.onclick=()=>panel.style.display="block";

function login(){
  if(pass.value===PASSWORD)
    adminArea.style.display="block";
}


/* ===== LOAD DB ===== */

async function load(){
  data=await fetch("/api/data").then(r=>r.json());
  render();
}

/* ===== CTA ===== */
function switchTab(tab) {
  if (tab === "shop") {
    document.querySelector("#shop")?.scrollIntoView({
      behavior: "smooth"
    });
  }
}

/* ===== RENDER ===== */

function render(){

  gallery.innerHTML="";

  data.artists.forEach((item,i)=>{

    const card=document.createElement("div");
    card.className="card";
    card.draggable=true;

    card.innerHTML=`
      <img src="${item.img}">
      <div class="card-content">
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <a href="${item.link}" target="_blank">
          <button>Conhecer</button>
        </a>
        <button onclick="removeItem(${i})">Excluir</button>
      </div>
    `;

    gallery.appendChild(card);

    /* animação */
    gsap.from(card,{opacity:0,y:50,duration:.5});
  });

  dragOrder();
}


/* ===== UPLOAD LOCAL ===== */

async function uploadImage(file){

  const form=new FormData();
  form.append("image",file);

  const res=await fetch("/upload",{method:"POST",body:form});
  const j=await res.json();

  return j.url;
}


/* ===== ADD ===== */

async function addItem(){

  const file=imgFile.files[0];
  const url=await uploadImage(file);

  data.artists.push({
    img:url,
    title:title.value,
    desc:desc.value,
    link:link.value
  });

  save();
}


/* ===== REMOVE ===== */

function removeItem(i){
  data.artists.splice(i,1);
  save();
}


/* ===== SAVE ===== */

async function save(){
  await fetch("/api/data",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(data)
  });
  render();
}


/* ===== DRAG ORDER ===== */

function dragOrder(){

  let dragging;

  document.querySelectorAll(".card").forEach((card,i)=>{

    card.ondragstart=()=>dragging=i;

    card.ondrop=()=>{
      const tmp=data.artists[dragging];
      data.artists.splice(dragging,1);
      data.artists.splice(i,0,tmp);
      save();
    };

    card.ondragover=(e)=>e.preventDefault();
  });
}


load();
