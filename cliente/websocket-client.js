import WebSocket from "ws";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const serverAddress = 'ws://localhost:8080';
    let username;
    let ws;

    try {
        username = await rl.question('Bienvenido al chat. Por favor, ingresa tu nombre de usuario: ');

        ws = new WebSocket(serverAddress);

        ws.on('open', () => {
            console.log(chalk.green('Conectado al servidor. ¡Empieza a chatear!'));
            ws.send(JSON.stringify({ tipo: 'nombreUsuario', nombreUsuario: username }));
            rl.prompt();
        });

        rl.on('line', (message) => {
            //console.log(`[Cliente]: Usuario escribió: "${message}"`);
            //console.log(`[Cliente]: WebSocket readyState: ${ws.readyState}`);
            if (ws.readyState === WebSocket.OPEN && message) {
                const mensajeAEnviar = JSON.stringify({ tipo: 'mensaje', contenido: `${username}: ${message}` });
                //console.log(`[Cliente]: Enviando mensaje: ${mensajeAEnviar}`);
                ws.send(mensajeAEnviar);
            } else {
                console.log('[Cliente]: No se envió el mensaje (conexión cerrada o mensaje vacío).');
            }
        });

       ws.on('message', message => {
            try {
                const datos = JSON.parse(message.toString());

                if (datos.tipo === 'mensaje') {
                    const [sender] = datos.contenido.split(': ');
                    if (sender !== username) { // Verificar si el remitente NO es el usuario actual
                        console.log(`${datos.contenido}`);
                    }
                } else if (datos.tipo === 'servidor') {
                    console.log(chalk.blue(`[Servidor]: ${datos.contenido}`));
                }
            } catch (error) {
                console.error('Error al procesar el mensaje del servidor:', error);
            }
        });

        ws.on('close', () => {
            console.log(chalk.red('Conexión cerrada.'));
            rl.close();
        });

        ws.on('error', (error) => {
            console.error(chalk.red(`Error de conexión: ${error}`));
            rl.close();
        });

    } catch (error) {
        console.error(chalk.red(`Ocurrió un error: ${error}`));
        rl.close();
        if (ws?.readyState === WebSocket.OPEN) {
            ws.close();
        }
    } finally {
    }
}

main().catch(console.error);