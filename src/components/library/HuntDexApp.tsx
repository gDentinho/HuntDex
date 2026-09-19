"use client";
import {useMemo,useState,useSyncExternalStore} from "react";
import {Cloud,CloudUpload,Crosshair,ShieldCheck,LayoutDashboard,ScanText,History,GitCompareArrows,Sparkles,HardDrive,Menu,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {TooltipProvider} from "@/components/ui/tooltip";
import {AuthMenu} from "@/components/auth/AuthMenu";
import {HuntAnalyzer} from "../analyzer/HuntAnalyzer";
import {OverviewPage} from "./OverviewPage";
import {HistoryPage} from "./HistoryPage";
import {ComparisonPage} from "./ComparisonPage";
import {RareTrackerPage} from "./RareTrackerPage";
import {BackupPage} from "./BackupPage";
import {useHuntLibrary} from "./useHuntLibrary";
import type {SavedHunt} from "@/lib/db/types";
const areas=[{id:'dashboard',label:'Dashboard',icon:LayoutDashboard},{id:'analisar',label:'Analisar Hunt',icon:ScanText},{id:'historico',label:'Histórico',icon:History},{id:'comparar',label:'Comparar',icon:GitCompareArrows},{id:'rares',label:'Rare Tracker',icon:Sparkles},{id:'backup',label:'Backup',icon:HardDrive}];
function subscribe(onChange:()=>void){window.addEventListener('hashchange',onChange);return()=>window.removeEventListener('hashchange',onChange);}
function getArea(){const id=window.location.hash.slice(1);return areas.some(a=>a.id===id)?id:'dashboard';}
export function HuntDexApp(){
 const library=useHuntLibrary(),area=useSyncExternalStore(subscribe,getArea,()=> 'dashboard');
 const [menu,setMenu]=useState(false),[loaded,setLoaded]=useState<SavedHunt|undefined>(),[analyzerKey,setAnalyzerKey]=useState(0),[selectedIds,setSelectedIds]=useState<string[]>([]),[syncDismissed,setSyncDismissed]=useState(false),[syncMessage,setSyncMessage]=useState('');
 const savedKeys=useMemo(()=>new Set(library.hunts.map(h=>h.duplicateKey)),[library.hunts]);
 const selected=selectedIds.filter(id=>library.hunts.some(h=>h.id===id));
 function navigate(id:string){window.location.hash=id;setMenu(false);window.scrollTo({top:0,behavior:'instant'});}
 function open(h:SavedHunt){setLoaded(h);setAnalyzerKey(v=>v+1);navigate('analisar');}
 async function syncLocal(){try{const result=await library.syncLocalToAccount();setSyncMessage(`${result.imported} hunt(s) adicionada(s) à sua conta${result.duplicates?` e ${result.duplicates} duplicata(s) ignorada(s)`:''}.`);setSyncDismissed(true);}catch{/* useHuntLibrary já expõe mensagem amigável */}}
 const privacyLabel=library.cloudMode?'Sincronizado na nuvem':'Local e privado';
 return <TooltipProvider><header className="app-header v2-header"><a href="#dashboard" className="brand" onClick={()=>setMenu(false)}><div className="brand-mark"><Crosshair size={23} strokeWidth={1.6}/></div><div><div className="brand-title">HuntDex <span className="muted font-normal">Analytics</span></div><p className="brand-subtitle">Sua jornada no PxG</p></div></a><div className="header-actions"><span className="privacy-pill">{library.cloudMode?<Cloud/>:<ShieldCheck/>}{privacyLabel}</span><AuthMenu auth={library.auth}/><Button className="mobile-menu" variant="ghost" size="icon" aria-label={menu?'Fechar menu':'Abrir menu'} aria-expanded={menu} aria-controls="primary-navigation" onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</Button></div></header>
 <nav id="primary-navigation" className="primary-nav" data-open={menu} aria-label="Navegação principal">{areas.map(({id,label,icon:Icon})=><a key={id} href={`#${id}`} aria-current={area===id?'page':undefined} onClick={()=>{setMenu(false);window.scrollTo({top:0,behavior:'instant'});}}><Icon size={16}/>{label}{id==='historico'&&library.hunts.length>0&&<span className="nav-count">{library.hunts.length}</span>}</a>)}</nav>
 <main className="app-main v2-main">{library.error&&<div role="alert" className="storage-warning">{library.error}<Button size="sm" variant="outline" onClick={()=>void library.refresh()}>Tentar novamente</Button></div>}
 {library.cloudMode&&library.localPendingCount>0&&!syncDismissed&&<div className="cloud-sync-banner"><CloudUpload/><div><strong>Encontramos {library.localPendingCount} hunt(s) salva(s) neste dispositivo.</strong><p>Você pode adicioná-las à sua conta para acessar o histórico em outros computadores. As hunts locais não serão apagadas.</p></div><div className="cloud-sync-actions"><Button size="sm" disabled={library.syncingLocal} onClick={()=>void syncLocal()}>{library.syncingLocal?'Sincronizando…':'Enviar para minha conta'}</Button><Button size="sm" variant="ghost" disabled={library.syncingLocal} onClick={()=>setSyncDismissed(true)}>Agora não</Button></div></div>}
 {syncMessage&&<p className="notice-success" role="status">{syncMessage}</p>}
 <HuntAnalyzer key={analyzerKey} active={area==='analisar'} loadedHunt={loaded} savedKeys={savedKeys} onSave={library.save} onHistory={()=>navigate('historico')}/>
 {area!=='analisar'&&(library.loading?<div className="library-empty" role="status">{library.cloudMode?'Sincronizando sua conta…':'Carregando histórico local…'}</div>:<>{area==='dashboard'&&<OverviewPage hunts={library.hunts} settings={library.settings} onSettings={library.updateSettings} onAnalyze={()=>navigate('analisar')}/>} {area==='historico'&&<HistoryPage hunts={library.hunts} onOpen={open} onCompare={h=>{setSelectedIds(ids=>ids.includes(h.id)?ids:[...ids.slice(0,4),h.id]);navigate('comparar');}} onDelete={library.remove}/>} {area==='comparar'&&<ComparisonPage hunts={library.hunts} selectedIds={selected} onSelection={setSelectedIds}/>} {area==='rares'&&<RareTrackerPage hunts={library.hunts} onOpen={open}/>} {area==='backup'&&<BackupPage hunts={library.hunts} settings={library.settings} onRestore={library.restoreBackup} cloudMode={library.cloudMode}/>}</>)}
 </main><footer className="app-footer"><span>HuntDex <span className="mx-2">/</span> Feito para entender sua hunt.</span><span>{library.cloudMode?'Suas hunts estão sincronizadas com sua conta; a análise do JSON continua sendo feita no navegador.':'Seus dados são processados e armazenados localmente no navegador.'}</span></footer></TooltipProvider>;
}
