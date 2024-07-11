import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { clientError } from "../errors/client-error";

export async function getParticipant(app: FastifyInstance){

    app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId', {
        schema:{
            params: z.object({participantId: z.string().uuid()})
        }
    }, 
    async (request, reply) =>{

        const { participantId } = request.params;

        const participant = await prisma.participant.findUnique({
            where: {id: participantId},
            select:{
                id: true,
                name: true,
                email: true,
                is_Confimerd:true
            }
        });

        if (!participant) throw new clientError('participant not found');


        return {participant};

    });   

}