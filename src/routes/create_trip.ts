import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import {z} from 'zod'
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { dayjs } from '../lib/dayjs'
import { clientError } from "../errors/client-error";
import { env } from "../env";

export async function createTrip(app: FastifyInstance){

    app.withTypeProvider<ZodTypeProvider>().post('/trips', {
        schema:{
            body:z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email())
            })
        }
    }, 
    async (resquest) =>{

        const {destination, starts_at, ends_at, owner_name, owner_email, emails_to_invite} = resquest.body
        
        
        if(dayjs(starts_at).isBefore(new Date())){
            throw new clientError('Invalid trip start date');
        }

        if(dayjs(ends_at).isBefore(starts_at)){

            throw new clientError('Invalid trip end date');
        }

        
        const trip = await prisma.trip.create({
            data:{
                destination,
                starts_at,
                ends_at,
                participants: {
                    createMany: {
                        data:[
                        {
                            name: owner_name,
                            email: owner_email,
                            is_Owner: true,
                            is_Confimerd: true
                        },
                        ...emails_to_invite.map(email => {
                            return { email }
                        })
                        
                        ]
                    }
                }
            }
        })

        const fomatedStartDate = dayjs(starts_at).format('MMMM/D/YYYY')
        const fomatedEndDate = dayjs(ends_at).format('MMMM/D/YYYY')

        const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

        const mail = await getMailClient();

        const message = await mail.sendMail({
            from: {
                name: 'Equpe plann.er',
                address: 'suport@plann.er',
            },
            to: {
                name: owner_name,
                address: owner_email
            },
            subject: `Confirme sua viagem para ${destination} em ${fomatedStartDate}`,
            html: `<div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong>, Brasil nas datas <strong>${fomatedStartDate}</strong> até <strong>${fomatedEndDate}</strong>. </p>
                <p></p>

                <p>Para confirmar sua viagem, clique no link abaixo: </p>

                <a href="${confirmationLink}">Confirmar viagem</a>

                <p>caso você não saiba do que se trata esse e-mail, apenas o ignore</p>

                </div>`.trim()
        })

        console.log(nodemailer.getTestMessageUrl(message))
        return {tripId: trip.id}
    });   

}