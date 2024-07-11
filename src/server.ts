import fastify from "fastify";

import cors from '@fastify/cors'
import { prisma } from "./lib/prisma";
import { createTrip } from "./routes/create_trip";
import { confirmTrip} from "./routes/confirm-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmParticipant } from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activity";
import { getActivity } from "./routes/get-activities";
import { createLink } from "./routes/create-links";
import { getLinks } from "./routes/get-links";
import { getParticipants } from "./routes/get-participants";
import { createInvite } from "./routes/create-invite";
import { updateTrip } from "./routes/update-trip";
import { getTripsDetails } from "./routes/get-trips-details";
import { getParticipant } from "./routes/get-paticipant";
import { erroHandler } from "./errorHandle";
import { env } from "./env";

const app = fastify()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(cors, {
    origin: '*'
})

app.setErrorHandler(erroHandler)

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipant)
app.register(createActivity)
app.register(getActivity)
app.register(createLink)
app.register(getLinks)
app.register(getParticipants)
app.register(createInvite)
app.register(updateTrip)
app.register(getTripsDetails)
app.register(getParticipant)

app.listen({port: env.PORT}).then(() => {
    console.log("Server running in: ")
    console.log(`${env.API_BASE_URL}`)
})