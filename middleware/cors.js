const cors = ((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'    
    )
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization, If-None-Match, Accept-language'
    )
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next()
})

export default cors