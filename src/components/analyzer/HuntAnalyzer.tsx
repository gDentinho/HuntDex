"use client";
import {useEffect,useMemo,useState} from "react";
import {Check,Save,X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {JsonInput} from "./JsonInput";
import {HuntDashboard} from "./HuntDashboard";
import {parseHunt} from "@/lib/pxg/parser";
import {analyzeHunt} from "@/lib/pxg/analytics";
import {createSavedHunt} from "@/lib/db/huntsRepository";
import type {PxGHuntData} from "@/lib/pxg/types";
import type {SavedHunt} from "@/lib/db/types";
import {exampleHunt} from "@/data/exampleHunt";
export function HuntAnalyzer({active=true,loadedHunt,savedKeys,onSave,onHistory}:{active?:boolean;loadedHunt?:SavedHunt;savedKeys:Set<string>;onSave:(raw:PxGHuntData)=>Promise<{status:'saved'|'duplicate';hunt:SavedHunt}>;onHistory:()=>void}) {
 const [text,setText]=useState(()=>loadedHunt?JSON.stringify(loadedHunt.rawJson,null,2):'');
 const [validatedText,setValidatedText]=useState(text);
 const [analysis,setAnalysis]=useState(loadedHunt?.analysis??null);
 const [raw,setRaw]=useState<PxGHuntData|null>(loadedHunt?.rawJson??null);
 const [editing,setEditing]=useState(!loadedHunt),[demo,setDemo]=useState(false),[analysisDemo,setAnalysisDemo]=useState(false);
 const [saving,setSaving]=useState(false),[savedNow,setSavedNow]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const timeout=setTimeout(()=>setValidatedText(text),180);return()=>clearTimeout(timeout);},[text]);
 const validation=useMemo(()=>validatedText.trim()?parseHunt(validatedText):null,[validatedText]);
 const duplicateKey=useMemo(()=>raw?createSavedHunt(raw).duplicateKey:'',[raw]);
 const alreadySaved=savedKeys.has(duplicateKey);
 const navigate=()=>window.scrollTo({top:0,behavior:'instant'});
 function analyze(){if(!validation?.ok||validatedText!==text)return;setAnalysis(analyzeHunt(validation.data));setRaw(validation.data);setAnalysisDemo(demo);setEditing(false);setError('');setNotice('');navigate();}
 async function save(){if(!raw)return;setSaving(true);setError('');try{const result=await onSave(raw);setSavedNow(result.status==='saved'?duplicateKey:'');setNotice(result.status==='saved'?'Hunt salva no histórico.':'Esta hunt já está salva no seu histórico.');}catch{setError('Não foi possível salvar esta hunt. Verifique o armazenamento do navegador e tente novamente.');}finally{setSaving(false);}}
 if(!active)return null;
 return <>{editing||!analysis?<JsonInput text={text} validation={validation} isValidating={text!==validatedText} demo={demo} hasAnalysis={!!analysis} onText={value=>{setText(value);setDemo(false);}} onExample={()=>{setText(JSON.stringify(exampleHunt,null,2));setDemo(true);}} onAnalyze={analyze} onCancel={()=>{setEditing(false);navigate();}}/>:<HuntDashboard analysis={analysis} demo={analysisDemo} onEdit={()=>{setEditing(true);navigate();}} onNew={()=>{setText('');setValidatedText('');setAnalysis(null);setRaw(null);setEditing(true);setDemo(false);setNotice('');setError('');navigate();}} saveAction={<Button variant="outline" size="sm" disabled={saving||alreadySaved} onClick={()=>void save()}>{alreadySaved?<Check/>:<Save/>}{saving?'Salvando…':alreadySaved?savedNow===duplicateKey?'Hunt salva':'Já salva':'Salvar Hunt'}</Button>}/>} {error&&<p role="alert" className="form-error">{error}</p>}{notice&&<div className="toast-message" role="status"><Check size={17}/><span>{notice}</span><Button size="sm" variant="ghost" onClick={onHistory}>Ver histórico</Button><Button size="icon-sm" variant="ghost" aria-label="Fechar aviso" onClick={()=>setNotice('')}><X/></Button></div>}</>;
}
