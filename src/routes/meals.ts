/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-user-id-exists'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export async function dietRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: checkSessionIdExists,
    },
    async (request, response) => {
      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      if (!user) {
        return response.status(404).send({
          error: 'User not found.',
        })
      }

      const meals = await knex('meals').where('user_id', user.id).select()

      if (!meals) {
        return response.status(404).send({
          error: "Can't found list of meals.",
        })
      }

      return { meals }
    },
  )

  app.post(
    '/',
    { preHandler: checkSessionIdExists },
    async (request, response) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        date: z
          .string()
          .min(10)
          .includes('-', { message: 'Date format must be YYYY-MM-DD.' }),
        time: z
          .string()
          .min(5)
          .includes(':', { message: 'Time format must be HH:mm.' }),
        is_on_diet: z.boolean(),
      })
      const { name, description, date, time, is_on_diet } =
        createMealBodySchema.parse(request.body)

      const { sessionId } = request.cookies

      const user = await knex('users').where('session_id', sessionId).first()

      if (!user) {
        return response.status(404).send({
          error: 'User not found.',
        })
      }

      await knex('meals').insert({
        id: randomUUID(),
        user_id: user?.id,
        name,
        description,
        date,
        time,
        is_on_diet,
      })

      return response.status(201).send()
    },
  )
}
