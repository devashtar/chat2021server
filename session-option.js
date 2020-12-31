const timeLimitLifeSession = 24 * 60 * 60 * 1000;   // 24 hour by default

const optionsSession = {
    secret: 'mega secret word',
    saveUninitialized: true,
    resave: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: timeLimitLifeSession
    }
    
}

module.exports = optionsSession;