import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../lib/prisma";
import {z} from 'zod'
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { dayjs } from '../lib/dayjs'
import { request } from "http";
import { clientError } from "../errors/client-error";

export async function updateTrip(app: FastifyInstance){

    app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
        schema:{
            body:z.object({
                destination: z.string().min(4),
                starts_at: z.coerce.date(),
                ends_at: z.coerce.date(),
            }),
            params: z.object({
                tripId: z.string().uuid()
            })
        }
    }, 
    async (request) =>{

        const {destination, starts_at, ends_at} = request.body
        const {tripId} = request.params


        const trip = await prisma.trip.findUnique({
            where: {id: tripId}
        })
        
        if (!trip) throw new clientError('Trip not found')

        if(dayjs(starts_at).isBefore(new Date())){
            throw new clientError('Invalid trip start date');
        }

        if(dayjs(ends_at).isBefore(starts_at)){

            throw new clientError('Invalid trip end date');
        }

        await prisma.trip.update({
            where: {id: tripId},
            data: {
                destination,
                starts_at,
                ends_at
            }
        })
        return {tripId: trip.id}
    });   

}