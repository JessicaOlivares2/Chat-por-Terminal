import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

console.log("[Servidor]: WebSocket server iniciado en el puerto 8080");

const clientes = new Map(); // Mapa para almacenar clientes (WebSocket connection => { id, nombreUsuario })

wss.on("connection", (ws) => {
  const clientId = Math.random().toString(36).substring(2, 15);
  clientes.set(ws, { id: clientId, nombreUsuario: null });
  console.log(`[Servidor]: Cliente conectado - ID: ${clientId}`);

  // Enviar mensaje de bienvenida al nuevo cliente
  ws.send(
    JSON.stringify({ tipo: "servidor", contenido: "¡Bienvenido al chat!" })
  );

  ws.on("message", (message) => {
    try {
      const datos = JSON.parse(message.toString());
      console.log("[Servidor]: Mensaje recibido (raw):", message.toString());
      console.log("[Servidor]: Mensaje parseado:", datos);

      if (datos.tipo === "nombreUsuario") {
        const clienteInfo = clientes.get(ws);
        clienteInfo.nombreUsuario = datos.nombreUsuario;
        console.log(
          `[Servidor]: Cliente ${clientId} estableció nombre de usuario: ${datos.nombreUsuario}`
        );
        broadcast(
          `[Servidor]: El usuario "${datos.nombreUsuario}" se ha unido al chat.`,
          ws
        );
      } else if (datos.tipo === "mensaje") {
        const clienteInfo = clientes.get(ws);
        if (clienteInfo && clienteInfo.nombreUsuario) {
          broadcast(`${clienteInfo.nombreUsuario}: ${datos.contenido}`, ws);
        }
      }
    } catch (error) {
      console.error(
        "[Servidor]: Error al procesar el mensaje del cliente:",
        error
      );
    }
  });

  ws.on("close", () => {
    const clienteInfo = clientes.get(ws);
    if (clienteInfo && clienteInfo.nombreUsuario) {
      console.log(
        `[Servidor]: Cliente desconectado - Nombre: ${clienteInfo.nombreUsuario}, ID: ${clientId}`
      );
      broadcast(
        `[Servidor]: El usuario "${clienteInfo.nombreUsuario}" ha salido del chat.`,
        ws
      );
    }
    clientes.delete(ws);
  });

  ws.on("error", (error) => {
    console.error(
      `[Servidor]: Error en el WebSocket del cliente ${clientId}: ${error}`
    );
    clientes.delete(ws);
  });
});

function broadcast(mensaje, senderSocket) {
  const senderInfo = clientes.get(senderSocket);
  const senderId = senderInfo ? senderInfo.id : null;

  clientes.forEach((clienteInfo, clienteSocket) => {
    if (clienteInfo.id !== senderId && clienteSocket.readyState === 1) {
      clienteSocket.send(
        JSON.stringify({ tipo: "mensaje", contenido: mensaje })
      );
    }
  });
}

// (Opcional) Función para enviar un mensaje del servidor a todos los clientes
function sendServerMessage(mensaje) {
  clientes.forEach((_, cliente) => {
    if (cliente.readyState === 1) {
      cliente.send(JSON.stringify({ tipo: "servidor", contenido: mensaje }));
    }
  });
}
// (Opcional) Ejemplo de un mensaje de cierre en 10 minutos (para probar)
setTimeout(() => {
  sendServerMessage("[Servidor]: El chat se cerrará en 10 minutos.");
}, 600000);
// (Opcional) Ejemplo de mensaje del servidor cada 60 segundos
setInterval(() => {
  sendServerMessage(
    "[Servidor]: Recordatorio - ¡Este es un chat por terminal!"
  );
}, 100000);
