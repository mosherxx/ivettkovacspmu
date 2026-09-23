import type {NextConfig} from 'next';
import {resolve} from 'node:path';
const docker=process.env.DOCKER_BUILD==='true';
const nextConfig:NextConfig={
 experimental:{serverActions:{bodySizeLimit:'12mb'}},
 ...(docker?{output:'standalone',distDir:'.docker-build'}:{}),
 webpack(config,{webpack}){
  if(docker)config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^cloudflare:workers$/,resolve('runtime/node-env.ts')));
  return config;
 }
};
export default nextConfig;
