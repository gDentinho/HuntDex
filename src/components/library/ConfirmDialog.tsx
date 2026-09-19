"use client";
import {AlertDialog} from "radix-ui";
import {Button} from "@/components/ui/button";
export function ConfirmDialog({open,onOpenChange,title,description,onConfirm,busy=false}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description:string;onConfirm:()=>void;busy?:boolean}) {
 return <AlertDialog.Root open={open} onOpenChange={onOpenChange}><AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay"/><AlertDialog.Content className="dialog-content"><AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title><AlertDialog.Description className="text-sm text-muted-foreground leading-6 mt-3">{description}</AlertDialog.Description><div className="flex justify-end gap-3 mt-6"><AlertDialog.Cancel asChild><Button variant="outline" disabled={busy}>Cancelar</Button></AlertDialog.Cancel><Button variant="destructive" onClick={onConfirm} disabled={busy}>{busy?"Processando…":"Confirmar"}</Button></div></AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>;
}
