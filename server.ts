// @deno-types="npm:@types/express@4.17.15"
import express from "npm:express@4.18.2";
import * as fs from 'https://deno.land/std@0.204.0/fs/mod.ts'
import * as path from 'https://deno.land/std@0.204.0/path/mod.ts'
import generatePath from "./tools/generatePath.ts";
import namespaceit from "./tools/namespaceit.ts";
const {dirname, filename, filepath} = generatePath(import.meta)

const app = express();
async function run(){
await namespaceit('web', app, import.meta, {verbose:true, dontConvertTheseFiles:["**/*.css", "**/*.map"]})
app.listen(8000);
} 
run()