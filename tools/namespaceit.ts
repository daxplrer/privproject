// @deno-types="npm:@types/express@4.17.15"
import express from "npm:express@4.18.2";
import { isnode } from "npm:@daxplrer/isnode@0.0.6";
import * as mimetypes from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
import * as fs from "https://deno.land/std@0.204.0/fs/mod.ts";
import * as path from "https://deno.land/std@0.204.0/path/mod.ts";
import * as pathposix from "https://deno.land/std@0.204.0/path/posix/mod.ts";
import normalizePathToPosix from "./normalizePathToPosix.ts";
import generatePath from "./generatePath.ts";
import convertTo from "./convertTo.ts";
export function getExt(pathstr:string):string{
const pathrelative = path.relative(path.parse(pathstr).dir, pathstr)
const pathbase = (pathrelative.slice(3))
const filterize = pathbase.startsWith('.')?pathbase.slice(2):pathbase
if (!filterize.includes('.')) return ''
const splitstr = filterize.split('.').slice(1)
const filterize2 = splitstr!==undefined?(splitstr.join('.')):pathbase
return '.'+filterize2+(pathbase.endsWith('.')?'.':'')

}
export function getName(pathstr:string):string{
  const pathrelative = path.relative(path.parse(pathstr).dir, pathstr)
  if (!pathrelative.includes('.')) return pathrelative
  const splitstr = pathrelative.split('.')
  return (pathrelative.startsWith('.')?'.':'')+splitstr[0]
  }
const fileCache: { [key: string]: Uint8Array } = {};
// deno-lint-ignore no-explicit-any
const fileCacheMime: { [key: string]: any } = {};
async function getFile(entrypath: string): Promise<Uint8Array> {
  const textencode = new TextEncoder()
  if (typeof fileCache[entrypath] !== "undefined") return fileCache[entrypath];
  const file = await Deno.readFile(entrypath)
  const filestr = convertTo(file, 'utf-8')
  if (path.globToRegExp("**/*.e.js").test(entrypath)) {
    return textencode.encode(`${await eval(filestr)}`);
  } else {
    fileCache[entrypath] = file;
    return file;
  }
}
export interface namespaceitOption {
  verbose?: boolean;
  ignore?: string[];
  dontConvertTheseFiles?: string[];
}
async function isPathDetectedWithGlob(
  globs: string[] | undefined,
  path_: string,
) {
  if (typeof globs === "undefined") return false;
  for await (const str of globs) {
    const globpath = path.globToRegExp(str);
    if (globpath.test(path_)) return true;
  }
  return false;
}
export async function namespaceit(
  directory: string,
  app: ReturnType<typeof express>,
  fromMeta: ImportMeta,
  opt: namespaceitOption,
): Promise<void> {
  let firstboot = true;
  function verboselog(text: string) {
    if (opt.verbose === true) console.log(text);
  }
  const meta = generatePath(fromMeta);
  const pth = meta.dirname;
  const pathroot = path.join(pth, directory);
  verboselog(
    "NAMESPACEIT version 0.0.3",
  );
  for await (const entry of fs.walk(pathroot, {includeSymlinks:false})) {
    // Remove the file extension and normalize the path
    if (
      await isPathDetectedWithGlob(opt.ignore, normalizePathToPosix(entry.path))
    ) continue;
    const realpth = path.relative(directory, entry.path);
    const normalizeRealpth = normalizePathToPosix(realpth);
    const pathdirname = path.dirname(normalizeRealpth);
    const getfilename = path.parse(path.basename(normalizeRealpth)).name;
    const entryPathParsed = path.parse(entry.path);
    const entryPathBase = entryPathParsed.base;
    let expresspath = pathposix.join(
      pathdirname.charAt(0) === "."
        ? pathdirname.substring(1)
        : "/" + pathdirname,
      "/",
      getfilename === "index" ? "" : getName(entry.path),
    );
    expresspath =
      await isPathDetectedWithGlob(
          opt.dontConvertTheseFiles,
          normalizePathToPosix(entry.path),
        )
        ? (path.parse(expresspath).dir+'/'+path.parse(expresspath).name)+getExt(entry.path):expresspath;

    Object.freeze(expresspath);
    if (entry.isFile) {
      
      verboselog(
        "Changing " + entryPathBase + " into " + expresspath +
          " on Express...",
      );
      app.get(expresspath, async (_req, res) => {
        (()=>{
        if (typeof fileCacheMime[entry.path] === "undefined") {
          fileCacheMime[entry.path] = {};
          const detectedMime = mimetypes.mime.getType(entryPathBase);
          if (typeof detectedMime === "undefined") {
            fileCacheMime[entry.path]["Content-Disposition"] ="attachment; filename='" + entryPathBase + "'"
          } else fileCacheMime[entry.path]["Content-Type"] =detectedMime
        }
      })()
        const filecachemime = fileCacheMime[entry.path];
        res.writeHead(200, filecachemime);
        res.end(await getFile(entry.path));
      });
    } else if (entry.isDirectory) {
      verboselog(
        "Folder found! Walking to " +
          (firstboot
            ? "the initialized folder..."
            : ("folder => " + entry.name)),
      );
      if (firstboot) {
        firstboot = false;
      }
    }
  }
}

export default namespaceit;
