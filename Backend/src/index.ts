import fastify from 'fastify';
import cors from '@fastify/cors';
import { saveCode } from './scripts/compilation.js';

const server = fastify();
server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
});

server.post('/generateCircuit', async (request, reply) => {
    const { code } = request.body as { code: string };
    const timestamp: string = new Date().toISOString().replace(/[:.]/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS-MSZ
    const fileName: string = `${timestamp}.circom`;

    try {

        // save Frontend code to a folder under /compilations, the folder is named with timestamp
        // compile circom code in the folder. The process will interrupt if the code cannot compile, 
        await saveCode(timestamp, fileName, code).then((result) => {
            let replyData = {
                "compilationId": timestamp,
                "circuitData": result,
            }
            console.log(`project ${timestamp} compile successed`);
            reply.send(JSON.stringify(replyData));
        })
    } catch (error) {
        const err = error as Error;        
        reply.status(400).send({ error: 'Failed to parse Circom code', details: err.message });
        console.log(`project ${timestamp} compile failed.\n`);
        console.log(`The error message is: ${error}`)
    }
});

server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});