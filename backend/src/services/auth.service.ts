import bcrypt from "bcryptjs";  //Para encriptar e comparar as passwords
import {prisma} from  "../config/database"; 
import { gerarAccessToken, gerarRefreshToken, verificarRefreshToken } from "../config/jwt";
import type {LoginInput, RegistoInput} from "../validators/auth.validator"; //Os tipos de dados de entrada usados


// Devolver a pos um login ou refresh token bem sucedido
export  interface RespostaAuth{
    accessToken: string; 
    refreshToken: string;
    usuario:{
        id: number;
        nome: string;
        email: string;
        perfil: string;
    };
}

//** Login Verifica credenciais e gera tokens */
export async function login(dados: LoginInput): Promise<RespostaAuth>{
    const usuario = await prisma.usuario.findUnique({
        where: {email: dados.email}, //procura pelo email 
    });

    if(!usuario){
        throw new Error("Credenciais inválidas");
    }

    if (!usuario.ativo){
        throw new Error("Conta desativada. Entre em contacto com o administrador.");
    }

    const passwordCorrecta = await bcrypt.compare(dados.senha, usuario.senhaHash); //Compara a password com hash
    if (!passwordCorrecta){
        throw new Error("Credenciais inválidas");
    }

    const payload = {
        usuarioId: usuario.id,
        perfil: usuario.perfil,
    };

    const accessToken = gerarAccessToken(payload); 
    const refreshToken =gerarRefreshToken(payload);

    await prisma.refreshToken.create({
        data:{
            token: refreshToken,
            usuarioId: usuario.id,
            expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        }
    });

    return {
        accessToken,
        refreshToken,
        usuario:{
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil,
        },
    };
}

//Registro //Cria nova conta de cliente//
export async function registo(dados: RegistoInput): Promise<RespostaAuth>{
    const emailJaExiste = await prisma.usuario.findUnique({
        where: {email: dados.email}, //Verifica o email esta sendo usado
    });

    if(emailJaExiste){
        throw new Error("Email já está registrado.");
    }

    const senhaHash = await bcrypt.hash(dados.senha,12);

    const novoUsuario = await prisma.usuario.create({
        data:{
            nome: dados.nome,
            email: dados.email,
            senhaHash,
            perfil: "CLIENTE",
            ativo: true,
            bi: dados.bi,
            telefone: dados.telefone,
            endereco: dados.endereco,
            rendimentoMensal: dados.rendimentoMensal,
            tipoEmprego: dados.tipoEmprego,
            emprego: dados.emprego,
        },
    });

    const payload ={
        usuarioId: novoUsuario.id,
        perfil: novoUsuario.perfil,
    };

    const accessToken = gerarAccessToken(payload);
    const refreshToken = gerarRefreshToken(payload);

    await prisma.refreshToken.create({
        data:{
            token: refreshToken,
            usuarioId: novoUsuario.id,
            expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 *1000),
        },
    });

    return {
        accessToken,
        refreshToken,
        usuario: {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            perfil: novoUsuario.perfil,
        },
    };
}

//Refresg// Renova o access token sem fazer login de novo

export async function refresh (refreshToken: string): Promise<{accessToken: string}>{
    const payload = verificarRefreshToken(refreshToken);

    const tokenNaBD =await prisma.refreshToken.findUnique({
        where: {token: refreshToken}, // Confirma se o token ainda existe na BD
    });

    if (!tokenNaBD){
        throw new Error("Refresh token inválido ou já utilizado.")
    }

    if(tokenNaBD.expiraEm < new Date()){
        await prisma.refreshToken.delete({where: {token: refreshToken}});
        throw new Error("Refresh token expirado. Faça login novamente");
    }

    const novoAccessToken = gerarAccessToken({
        usuarioId: payload.usuarioId,
        perfil:payload.perfil,
    });

    return {accessToken: novoAccessToken};
}

// LOGOUT// Remove o refresh token da DB, invalidando-0

export async function logout(refreshToken:string): Promise<void>{
    await prisma.refreshToken.deleteMany({
        where: {token: refreshToken}, 
    });
}