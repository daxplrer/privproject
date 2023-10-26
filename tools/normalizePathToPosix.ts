import * as path from 'https://deno.land/std@0.204.0/path/mod.ts'
export default function (p:string) {
    const getsep = path.sep||path.SEP
    if (Deno.build.os==='windows') return (p.split(getsep).join('/'))||(p.replaceAll(getsep, '/'))
    else return p;
}