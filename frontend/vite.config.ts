import {defineConfig} from "vite";
export default defineConfig({
    root:"src",

    //configuração do servidor de desenvolvimento (npm run dev)
    server:{
        port: 5500,
        open: true,
    },


    // configuração do build de produção (npm run build)
    build:{
        outDir:"../dist",
        emptyOutDir: true,
    },
});