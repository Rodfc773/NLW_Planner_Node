import type { FastifyInstance } from "fastify"
import { clientError } from "./errors/client-error"
import { ZodError } from "zod"

type FastifyErroHandler = FastifyInstance['errorHandler']

export const erroHandler: FastifyErroHandler = (error, request, reply) =>{

    if(error instanceof ZodError) return reply.status(400).send({message: 'Invalid input',errors: error.flatten().fieldErrors})
    if(error instanceof clientError) return reply.status(400).send({message: error.message})
        
    return reply.status(500).send({message: 'Internal server error'})

}