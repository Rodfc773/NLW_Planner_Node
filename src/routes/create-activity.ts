import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import {z} from 'zod'
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { clientError } from "../errors/client-error";

export async function createActivity(app: FastifyInstance){

    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
        schema:{
            body: z.object({
                title: z.string().min(4),
                occurs_at: z.coerce.date()
            }),
            params: z.object({tripId: z.string().uuid()})
        }
    }, 
    async (request, reply) =>{

        const { tripId } = request.params;
        const {title, occurs_at } = request.body;

        const trip = await prisma.trip.findUnique({
            where: {id: tripId}
        })

        if (!trip) throw new clientError('Trip not found')

        if(dayjs(occurs_at).isBefore(trip.starts_at)) throw new clientError('Invalid activity date')
        if(dayjs(occurs_at).isAfter(trip.ends_at)) throw new clientError('Invalid activity date')

        const activity = await prisma.activity.create({
            data: {
                title,
                occurs_at,
                trip_id: tripId
            }
        })

        return {activityId: trip.id}

    });   

}