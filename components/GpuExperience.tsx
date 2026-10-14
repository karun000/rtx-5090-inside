'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Part = 'housing' | 'backplate' | 'fans' | 'heatsink' | 'pcb' | 'chip' | 'memory';
type PartMesh = THREE.Group & { userData: { id: Part } };

const chapters = [
  { tag: 'The complete system', title: <>Two slots.<br />One statement.</>, text: 'A dual flow-through cooler moves air straight through the card while the compact board keeps the footprint surprisingly tight.' },
  { tag: 'Flow-through cooling', title: <>Air has<br />a clear path.</>, text: 'Two 115 mm axial fans and a vapor chamber manage the heat without adding bulk.' },
  { tag: 'Three-piece PCB', title: <>Small board.<br />Big brain.</>, text: 'The GPU, GDDR7 memory and power delivery sit at the center of an unusually compact, modular layout.' },
  { tag: 'Blackwell', title: <>Everything<br />starts here.</>, text: 'At the core: 21,760 CUDA cores, fifth-generation Tensor Cores and fourth-generation RT Cores.' },
];

function box(w:number,h:number,d:number,mat:THREE.Material){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); }

function makeGpu(): THREE.Group {
  const root = new THREE.Group(); root.rotation.set(-.28,.48,.08); root.scale.setScalar(1.35);
  const matte = new THREE.MeshStandardMaterial({color:0x252b27, metalness:.8, roughness:.28});
  const black = new THREE.MeshStandardMaterial({color:0x111614, metalness:.65, roughness:.3});
  const green = new THREE.MeshStandardMaterial({color:0x76b900, metalness:.2, roughness:.5, emissive:0x76b900, emissiveIntensity:.18});
  const board = new THREE.MeshStandardMaterial({color:0x16231d, metalness:.45, roughness:.5});
  const part = (id:Part, mesh:THREE.Object3D) => { mesh.userData.id=id; root.add(mesh); return mesh as PartMesh; };
  const shell=box(3.9,1.85,.32,matte); shell.position.z=.48; part('housing',shell);
  const back=box(3.9,1.85,.22,black); back.position.z=-.58; part('backplate',back);
  const pcb=box(2.75,1.2,.16,board); pcb.position.z=-.18; part('pcb',pcb);
  const strip=box(2.45,.08,.08,green); strip.position.set(0,.7,.67); root.add(strip);
  const fans=new THREE.Group(); fans.name='fans'; fans.position.z=.72;
  [-1.28,1.28].forEach((x)=>{ const fan=new THREE.Group(); fan.position.x=x; const hub=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.12,32),black); hub.rotation.x=Math.PI/2; fan.add(hub); for(let i=0;i<7;i++){const blade=box(.08,.68,.04,matte); blade.position.y=.36; blade.rotation.z=i*Math.PI*2/7+.25; fan.add(blade);} fans.add(fan); }); part('fans',fans);
  const heatsink=new THREE.Group(); heatsink.name='heatsink'; heatsink.position.z=.2; for(let i=-7;i<=7;i++){const fin=box(.1,1.45,.28,black); fin.position.x=i*.12; heatsink.add(fin);} part('heatsink',heatsink);
  const chip=box(.72,.6,.15,green); chip.name='chip'; chip.position.set(0,-.05,.08); part('chip',chip);
  for(let i=0;i<12;i++){const mem=box(.18,.16,.09,new THREE.MeshStandardMaterial({color:0x8a958b,metalness:.55,roughness:.3})); mem.name='memory'; mem.position.set(-1.05+(i%6)*.42,i<6?.38:-.38,.08); part('memory',mem);}
  return root;
}

function setupCanvas(canvas: HTMLCanvasElement, hero = false){
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x070908);
  const camera = new THREE.PerspectiveCamera(28,1,.1,100); camera.position.set(3.7,2.6,6.2);
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true}); renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.8)); renderer.outputColorSpace=THREE.SRGBColorSpace;
  scene.add(new THREE.AmbientLight(0x9fb8a5,.85)); const key=new THREE.DirectionalLight(0xe9fff1,2.6); key.position.set(4,5,6); scene.add(key); const rim=new THREE.PointLight(0x76b900,6,14); rim.position.set(-4,1,3); scene.add(rim);
  const gpu=makeGpu(); scene.add(gpu); let frame=0; let time=0;
  const resize=()=>{const {clientWidth:w,clientHeight:h}=canvas; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();}; resize(); window.addEventListener('resize',resize);
  const render=()=>{time+=.004; if(hero){gpu.rotation.y+=.0015; gpu.position.y=Math.sin(time)*.06;} renderer.render(scene,camera); frame=requestAnimationFrame(render);}; render();
  return {scene,camera,renderer,gpu,dispose:()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',resize);renderer.dispose();}};
}

export default function GpuExperience(){
  const heroRef=useRef<HTMLCanvasElement>(null), sceneRef=useRef<HTMLCanvasElement>(null), wrapRef=useRef<HTMLDivElement>(null); const [chapter,setChapter]=useState(0); const [percent,setPercent]=useState(0); const [webglError,setWebglError]=useState(false);
  useEffect(()=>{ if(!heroRef.current||!sceneRef.current||!wrapRef.current) return; let hero,exploded; try{hero=setupCanvas(heroRef.current,true); exploded=setupCanvas(sceneRef.current);}catch{setWebglError(true);return;}
    gsap.registerPlugin(ScrollTrigger); const parts=exploded.gpu.children.filter((child)=>child.userData.id) as PartMesh[]; const defaults=new Map<Part,THREE.Vector3>(); parts.forEach((p)=>defaults.set(p.userData.id,p.position.clone()));
    const tl=gsap.timeline({scrollTrigger:{trigger:wrapRef.current,start:'top top',end:'bottom bottom',scrub:1,onUpdate:(self)=>{const p=self.progress;setPercent(Math.round(p*100));setChapter(Math.min(3,Math.floor(p*4.01)));}}});
    parts.forEach((p)=>{const id=p.userData.id; const lift={housing:0.2,backplate:-.35,fans:1.45,heatsink:1,pcb:-.15,chip:1.85,memory:1.35}[id]; tl.to(p.position,{z:defaults.get(id)!.z+lift,duration:.78,ease:'none'},0.2);}); tl.to(exploded.gpu.rotation,{x:.07,y:.26,duration:1,ease:'none'},0); tl.to(exploded.gpu.position,{y:.17,duration:1,ease:'none'},0);
    return ()=>{tl.kill();ScrollTrigger.getAll().forEach((t)=>t.kill());hero?.dispose();exploded?.dispose();};
  },[]);
  const replay=()=>{window.scrollTo({top:wrapRef.current?.offsetTop||0,behavior:'smooth'});};
  return <main id="top"><header className="topbar"><a className="brand" href="#top">NVIDIA <span>///</span> GEFORCE</a><nav><a href="#inside">Inside</a><a href="#specs">Specs</a><a href="https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/" target="_blank" rel="noreferrer">nvidia.com ↗</a></nav></header><div className="scroll-meter"><i style={{height:`${percent}%`}} /></div>
    <section className="intro"><canvas ref={heroRef} id="hero-canvas" aria-label="Illustrative 3D RTX 5090 Founders Edition model"/><div className="intro-copy"><div className="eyebrow">Blackwell architecture / 2025</div><h1>THE<br/><em>5090</em><br/>INSIDE.</h1><p>A closer look at the most powerful GeForce GPU ever made. Scroll to separate the system from the silicon.</p><a className="explore-button" href="#inside">Explore inside ↘</a></div><div className="hero-note">Illustrative visualization<br/>Founders Edition design language</div><div className="scroll-hint"><b/>SCROLL TO EXPLORE</div></section>
    <section className="story" id="inside" ref={wrapRef}><div className="scene-wrap"><div className="sticky-scene"><canvas ref={sceneRef} id="scene-canvas" aria-label="Exploded view of RTX 5090 internal parts"/>{webglError&&<div className="chapter active"><div className="tag">WebGL unavailable</div><h2>Explore the<br/>silicon.</h2><p>Your browser cannot render the 3D scene. The component story is still available below.</p></div>}{chapters.map((item,i)=><article key={item.tag} className={`chapter ${i===chapter?'active ':''}${i%2?'right':''}`}><div className="tag">{item.tag}</div><h2>{item.title}</h2><p>{item.text}</p></article>)}<button className="replay" onClick={replay}>Replay sequence ↺</button><div className="scene-status">EXPLODED VIEW <strong>{String(percent).padStart(2,'0')}%</strong></div></div></div></section>
    <section className="specs" id="specs"><h2>POWER<br/>WITHOUT<br/><span>COMPROMISE.</span></h2><div className="specs-copy"><p>The RTX 5090 is built for the moments that demand everything: 4K gaming, neural rendering, simulation, and creation at the speed of thought.</p><dl className="spec-grid"><div className="spec"><dt>Memory</dt><dd>32 GB GDDR7</dd></div><div className="spec"><dt>Interface</dt><dd>PCIe 5.0</dd></div><div className="spec"><dt>CUDA cores</dt><dd>21,760</dd></div><div className="spec"><dt>Architecture</dt><dd>Blackwell</dd></div></dl></div></section>
    <section className="outro"><h2>SEE<br/>WHAT'S<br/>NEXT.</h2><div className="outro-foot"><a href="https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/" target="_blank" rel="noreferrer">Explore RTX 5090 at NVIDIA ↗</a><div className="legal">This is an independent, illustrative product experience. NVIDIA, GeForce, RTX and Blackwell are trademarks of NVIDIA Corporation.</div></div></section></main>;
}
