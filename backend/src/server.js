import Fastify from "fastify";
import cors from "@fastify/cors";
import 'dotenv/config';

const srv = Fastify({
  logger: true,
});

await srv.register(cors, {
  origin: [
    'http://localhost:3000',
  ],
});

// Define uma rota inicial para verificar se a API está funcionando.

srv.get('/', async (req, rep) => {
    return rep.code(200).send({
        status: 'Online!',
        mensagem: 'Positivo e operante!',
    });
});

// Define a porta e inicia o servidor.

const PORT = process.env.PORT || 3000;
try {
    await srv.listen({
        port: PORT,
        host: '0.0.0.0',
    });
} catch (error) {
    app.log.error(error);
    process.exit(1);
}