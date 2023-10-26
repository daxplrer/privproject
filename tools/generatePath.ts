import * as path from 'https://deno.land/std@0.204.0/path/mod.ts'
export default function (meta:ImportMeta) {
    const realpath = path.fromFileUrl(meta.url)
    return { dirname: path.dirname(realpath), filename: path.basename(realpath), filepath: realpath }
}