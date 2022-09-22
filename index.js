const express=require("express"),path=require("path"),uuid=require("uuid"),axios=require("axios"),multer=require("multer"),puppeteer=require("puppeteer"),zipper=require("zip-local"),fs=require("fs"),rimraf=require("rimraf"),app=express(),port=process.env.PORT||3e3;app.use("/static",express.static("logo")),app.use("/data",express.static("data")),app.use("/errors",express.static("errors")),app.use(express.json());let binary=!1,json=!1,filesize=!1,files,file,pathd,urlpath,urls="urls",result="result",errors="errors",regex=/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,maxSize=1048576,log;app.use((e,s,r)=>{e.id=uuid.v4(),log=uuid.v1().slice(0,9),r()});const storage=multer.diskStorage({destination(e,s,r){r(null,urls)},filename(e,s,r){r(null,"urls_"+e.id+".txt"),files=s}}),upload=multer({storage});fs.existsSync(urls)||fs.mkdirSync(urls),fs.existsSync(result)||fs.mkdirSync(result),app.get("/",(e,s)=>{s.sendFile(__dirname+"/index.html")}),app.post("/",upload.single("myFile"),async(e,s)=>{let r=log+e.id,t=0,i=[],l=[],a=[];if(fs.mkdirSync(`${result}/result_${e.id}`),fs.mkdirSync(`${result}/result_${e.id}/${errors}`),fs.mkdirSync(`${result}/result_${e.id}/data`),!files||"text/plain"!=files.mimetype){s.send({error:"Please upload a txt file"}),s.end(),fs.rmSync(`${result}/result_${e.id}`,{recursive:!0,force:!0}),fs.rmSync(`${urls}/urls_${e.id}.txt`,{recursive:!0,force:!0});return}let u=fs.readFileSync(__dirname+`/${urls}/urls_${e.id}.txt`,"utf8");!0===/\ufffd/.test(u)&&(binary=!binary);try{JSON.parse(u),json=!json;return}catch(o){}files.size>maxSize&&(filesize=!filesize),filesize?(s.send({error:"file Too Large"}),s.end(),fs.rmSync(`${result}/result_${e.id}`,{recursive:!0,force:!0}),fs.rmSync(`${urls}/urls_${e.id}.txt`,{recursive:!0,force:!0})):binary||json?(s.send({error:"Please upload a txt file!"}),s.end(),fs.rmSync(`${result}/result_${e.id}`,{recursive:!0,force:!0}),fs.rmSync(`${urls}/urls_${e.id}.txt`,{recursive:!0,force:!0})):(()=>{try{(data=u.split("\n").filter(e=>""!=e)).forEach((e,s)=>{s<100&&(regex.test(e)||(e="https://"+e),regex.test(e)&&i.push(e))}),i.length?(()=>{i=[...new Set(i)];let u=async()=>{await axios({url:i[t],timeout:2e4}).then(s=>{let r=JSON.stringify(s.headers),u=s.request.host;fs.appendFileSync(`${result}/result_${e.id}/data/data.txt`,u+"\n"),l.push(i[t]),a.push(u),fs.writeFileSync(`${result}/result_${e.id}/data/${u}.json`,r),t++,o()}).catch(s=>{let r;r=s.response?s.response.status+" "+s.response.statusText:`${s.code} Hostname`,fs.appendFileSync(`${result}/result_${e.id}/${errors}/errors.txt`,`GET: ${i[t]} => ${r}`),t++,o()})},o=()=>{t!=i.length?u(i[t]):l.length?(s.send({success:r,l:l,hosts:a}),s.end()):(s.send({error:"Please upload a valid URL's"}),s.end(),fs.rmSync(`${result}/result_${e.id}`,{recursive:!0,force:!0}),fs.rmSync(`${urls}/urls_${e.id}.txt`,{recursive:!0,force:!0}))};o()})():(s.send({error:"Please upload a valid URL's"}),fs.rmSync(`${result}/result_${e.id}`,{recursive:!0,force:!0}),fs.rmSync(`${urls}/urls_${e.id}.txt`,{recursive:!0,force:!0}),s.end())}catch(o){}})()});class Screen{constructor(e,s){this.req=e,this.res=s,this.I=0,this.url=this.req.l,this.host=this.req.hosts,this.id=this.req.success.slice(9)}screen=async()=>{try{let e=await puppeteer.launch({args:["--no-sandbox","--disabled-setupid-sandbox"]}),s=await e.newPage();await s.goto(this.url[this.I],{timeout:2e4}),await s.screenshot({path:`${result}/result_${this.id}/data/${this.host[this.I]}.png`}),await e.close(),this.I++,this.callme()}catch(r){"TimeoutError: Navigation timeout of 20000 ms exceeded"==r&&(fs.appendFileSync(`${result}/result_${this.id}/${errors}/errors.txt`,`GET: ${this.url[this.I]} => Navigation timeout
`),fs.copyFileSync("logo/default.jpg",`${result}/result_${this.id}/data/${this.host[this.I]}.png`),this.I++,this.callme())}};callme=e=>{this.I!=this.url.length?this.screen():(file=Date.now().toString().slice(0,-8),pathd=`${result}/result_${this.id}`,urlpath=`${urls}/urls_${this.id}.txt`,fs.copyFileSync("html/index.html",`${result}/result_${this.id}/result.html`),fs.copyFileSync("html/read.txt",`${result}/result_${this.id}/important!!.txt`),fs.copyFileSync("logo/logox48.svg",`${result}/result_${this.id}/data/logox48.svg`),zipper.sync.zip(pathd).compress().save(file+".zip"),this.res.download(file+".zip",e=>{e&&console.log("Error : ",e),fs.rmSync(pathd,{recursive:!0,force:!0}),fs.rmSync(urlpath,{recursive:!0,force:!0}),fs.rmSync(file+".zip",{recursive:!0,force:!0})}))}}app.post("/wait",(e,s)=>{new Screen(e.body,s).screen()}),setInterval(()=>{fs.readdir(result,(e,s)=>{s.forEach((e,s)=>{fs.stat(path.join(result,e),(s,r)=>{let t,i;if(s&&console.error(s),(i=new Date().getTime())>(t=new Date(r.ctime).getTime()+18e5))return rimraf(path.join(result,e),e=>{e&&console.error(e)})})})}),fs.readdir(urls,(e,s)=>{s.forEach((e,s)=>{fs.stat(path.join(urls,e),(s,r)=>{let t,i;if(s&&console.error(s),(i=new Date().getTime())>(t=new Date(r.ctime).getTime()+18e5))return rimraf(path.join(urls,e),e=>{e&&console.error(e)})})})})},18e5),app.listen(port,()=>console.log(`App on port ${port}!`));
