import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'..');
process.chdir(root);
await mkdir('.sites-runtime',{recursive:true});
await import('./verify-content.mjs');
await build({entryPoints:['scripts/verify-local.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/verify-local.mjs'});
await import(pathToFileURL(resolve('.sites-runtime/verify-local.mjs')).href);
await build({entryPoints:['app/schedule.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/schedule.mjs'});
await import('./check-schedule.mjs');
await build({entryPoints:['scripts/verify-citations.ts'],bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',outfile:'.sites-runtime/verify-citations.mjs'});
await import(pathToFileURL(resolve('.sites-runtime/verify-citations.mjs')).href);
