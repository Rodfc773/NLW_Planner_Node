import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { clientError } from "../errors/client-error";

export async function getParticipants(app: FastifyInstance){

    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/participants', {
        schema:{
            params: z.object({tripId: z.string().uuid()})
        }
    }, 
    async (request, reply) =>{

        const { tripId } = request.params;

        const trip = await prisma.trip.findUnique({
            where: {id: tripId},
            include: {
                participants:{
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        is_Confimerd: true
                    }
                }}
        });

        if (!trip) throw new clientError('Trip not found');


        return {participants: trip.participants};

    });   

}