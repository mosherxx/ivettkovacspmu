import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
const base=process.env.PAGES_BASE_PATH || '/';
export default defineConfig({root:resolve('brochure'),base,publicDir:resolve('public'),plugins:[react()],resolve:{alias:{'@':resolve('.')}},define:{'process.env.NEXT_PUBLIC_STATIC_SITE':JSON.stringify('true'),'process.env.NEXT_PUBLIC_BASE_PATH':JSON.stringify(base.replace(/\/$/,''))},build:{outDir:resolve('out/pages'),emptyOutDir:true}});
