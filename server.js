import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'

import connectDB from './config/db.js'
import { graphqlHTTP } from 'express-graphql'
import graphQLSchema from './graphql/schema.js'
import graphQLResolvers from './graphql/resolver.js'

dotenv.config()

connectDB()

const app = express()

const PORT = process.env.PORT
const ENV = process.env.APP_ENV

if (ENV === 'development') {
    app.use(morgan('dev'))
}

app.use(
    '/graphql',
    graphqlHTTP({
        schema: graphQLSchema,
        rootValue: graphQLResolvers,
        graphiql: true,
        formatError(err) {
            if (!err.originalError) {
                return error
            }

            const data = err.originalError.data
            const message = err.message || 'An error occurred.'
            const code = err.originalError.code || 500
            return { message, status: code, data }
        }
    }),
)

app.listen(PORT, console.log(`Server running in ${ENV} mode on port ${PORT}`))