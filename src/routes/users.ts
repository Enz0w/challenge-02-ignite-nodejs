import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const users = await knex('users').select('*')
    return { users }
  })

  app.get('/:id', async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users')
      .where({
        id,
      })
      .first()

    return { user }
  })

  app.post('/', async (request, response) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    let { sessionId } = request.cookies

    const { name, email } = createUserBodySchema.parse(request.body)

    const emailExists = await knex('users').where({ email }).first()

    if (emailExists) {
      return response.status(403).send({
        error: 'Email already in use',
      })
    }

    if (!sessionId) {
      sessionId = randomUUID()

      response.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return response.status(201).send()
  })
}
