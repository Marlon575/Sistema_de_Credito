import nodemailer from "nodemailer"; // Bibliotica de envio de emails

//Gmail, via SMTP//Configuração da ligação

const transportador = nodemailer.createTransport({
    host: process.env["EMAIL_HOST"],
    port: Number(process.env["EMAIL_PORT"]),
    secure: false,
    auth: {
        user: process.env["EMAIL_USER"],
        pass: process.env["EMAIL_PASS"],
    }
});

async function enviarEmail(destinatario: string, assunto:string, corpoHtml: string): Promise<void> {
try{
    await transportador.sendMail({
        from: process.env["EMAIL_FROM"],
        to: destinatario,
        subject: assunto,
        html: corpoHtml,
    });
}catch(erro) {
    console.error("Erro ao enviar email:", erro);
}
}

export async function enviarEmailBoasVindas(destinatario: string, nome: string): Promise<void> {
    const assunto = "Bem-vindo(a) ao CréditoMZ!";
    const corpo =`
    <h2>Olá, ${nome}!</h2>
    <p>A sua conta no CréditoMZ foi criada com sucesso.</p>
    <p>já pode pedir o seu crédito na nossa plataforma.</p>
`;
    await enviarEmail(destinatario,assunto,corpo);
}

//Pedido de crédito foi aprovado
export async function enviarEmailAprovacao(
    destinatario: string,
    nome: string,
    valorParcela: number,
    prazo: number
): Promise<void>{
    const assunto = "O seu pedido de crédito foi aprovado!";
    const corpo = `
        <h2>Parabéns, ${nome}!</h2>
        <p>O seu pedido de crédito foi <strong>aprovado</strong>.</p>
        <p>Prestação mensal: <strong>${valorParcela.toFixed(2)} MT</strong></p>
        <p>Prazo: <strong>${prazo} meses</strong></p>

    `;
    await enviarEmail(destinatario, assunto,corpo);
}

// Envia email a informar que o pedido de crédito foi rejeitado.
export async function enviarEmailRejeicao(
    destinatario: string,
    nome: string,
    motivo: string
): Promise<void>{
    const assunto = "Actualização sobre o seu pedido de crédito";
    const corpo = `
    <h2>Olá, ${nome}</h2>
    <p>Lamentamos informar que o seu pedido de crédito não foi aprovado.</p>
    <p><strong>Motivo:</strong> ${motivo}</p>
    `;

    await enviarEmail(destinatario, assunto, corpo);
}