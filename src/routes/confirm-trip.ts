import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { clientError } from "../errors/client-error";
import { env } from "../env";

export async function confirmTrip(app: FastifyInstance){

    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
        schema:{
            params: z.object({
                tripId: z.string().uuid(),
            })
        }
    }, 
    async (request, reply) =>{

        const { tripId } = request.params

        const trip = await prisma.trip.findUnique({
            where: {id: tripId},
            include: {
                participants: {
                    where: {is_Owner: false}
                }
            }
        });

        if(!trip) throw new clientError('Trip not found')
        if(trip.is_Confimerd)  return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)

        await prisma.trip.update({
            where: {id: tripId},
            data: {is_Confimerd: true},
        })

        const fomatedStartDate = dayjs(trip.starts_at).format('MMMM/D/YYYY')
        const fomatedEndDate = dayjs(trip.ends_at).format('MMMM/D/YYYY')


        const mail = await getMailClient();

        await Promise.all([
            trip.participants.map(async (participant) => {

                const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`
                const message = await mail.sendMail({
                    from: {
                        name: 'Equpe plann.er',
                        address: 'suport@plann.er',
                    },
                    to:participant.email,
        
                    subject: `Confirme sua viagem para ${trip.destination} em ${fomatedStartDate}`,
                    html: `<div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                        <p>Você foi convidado(a) para participar de  uma viagem para <strong>${trip.destination}</strong>, Brasil nas datas <strong>${fomatedStartDate}</strong> até <strong>${fomatedEndDate}</strong>. </p>
                        <p></p>
        
                        <p>Para confirmar sua presença na viagem, clique no link abaixo: </p>
        
                        <a href="${confirmationLink}">Confirmar viagem</a>
        
                        <p>caso você não saiba do que se trata esse e-mail, apenas o ignore</p>
        
                        </div>`.trim()
                })
                console.log(nodemailer.getTestMessageUrl(message))

            })
        ])


        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)

    });   

}