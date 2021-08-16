const express = require('express')
const dotenv = require('dotenv')
const morgan = require('morgan')
const cors = require('cors')
const { graphqlHTTP } = require('express-graphql')

const connectDB = require('./config/db.js')
const graphQLSchema = require('./graphql/schema.js')
const graphQLResolvers = require('./graphql/resolver.js')
const auth = require('./middleware/auth.js')
const expressPlayground = require('graphql-playground-middleware-express').default

dotenv.config()

connectDB()

const app = express()

const PORT = process.env.PORT
const ENV = process.env.APP_ENV

if (ENV === 'development') {
    app.use(morgan('dev'))
}

app.use(cors())
app.use(auth);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use(
    '/graphql',
    graphqlHTTP({
        schema: graphQLSchema,
        rootValue: graphQLResolvers,
        graphiql: false,
        customFormatErrorFn(err) {
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
app.get('/playground', expressPlayground({ endpoint: '/graphql' }))

app.listen(PORT, console.log(`Server running in ${ENV} mode on port ${PORT}`))
    