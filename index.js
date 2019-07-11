const express = require('express');
const path = require('path');
const server = express();
const connection = require('./conf');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const cookieParser = require('cookie-parser'); 
const sha1 = require('sha1'); 
const port = process.env.PORT || 8000;
const secret = 'cUb5jR$csB=+7xtr'

server.use(passport.initialize());
server.use(bodyParser.json());
server.use(cookieParser(secret))
passport.use(new LocalStrategy({
    usernameField: 'email'
},
    function(username, password, done) {
        const salt = '0X(PkJ%49nm09 75NUN6I$2]]0m6h95x';
        console.log('LOGGING IN...', {username, password})
        connection.query('SELECT * FROM usuario WHERE email = ? AND hash = ?', [username, sha1(password + salt)], (err, results) => {
            console.log('LOGIN RESULT', results[0]);
            const user = results[0];
            done(err, user)
        });
    }
))

passport.use(new JwtStrategy({
    jwtFromRequest: (req) => req.cookies && req.cookies.jwt,
    secretOrKey: secret
}, 
    function(payload, done) {
        console.log('Payload extraido', payload);
        done(null, payload.user)
    }
))

server.set("port", port); 
server.use('/', express.static(path.join(__dirname, '/build')));

// ?----------------------------- USER ----------------------------------------

// TODO: Documentar mas
server.get('/api', (req, res) => {
    res.write('GET    /api/users                        List of users\n');
    res.write('GET    /api/users/me                     Administrator\n');
    res.write('GET    /api/users/:id                    User details.\n');
    res.write('GET    /api/newsfeed                     NF on profile\n');
    res.write(                                                      '\n');
    res.write('POST   /api/logout                    Log out profile \n');
    res.write('POST   /api/login                      Log in profile.\n');
    res.end();
})


server.get('/api/usuarios', passport.authenticate('jwt', { 
    session: false }), (req, res) => {
        if ( !req.user || !req.user.admin) {
            res.sendStatus(401)
        } else {
            connection.query('SELECT * from usuario', (err, results) => {
                if (err) {  
                    res.sendStatus(500);
                } else {
                    res.json(results);
                }
            });
        }
    }
);


server.get('/api/usuarios/yo', passport.authenticate('jwt', {
    session: false}), (req, res) => { 
        console.log('terminado autentificación jwt', req.user);
        // Sabemos, si es usuario valido, y si es administrador
        res.json(req.user);
    }
);

// TODO: /api/usuarios
// 1. passport.authenticate
// 2. si es admin, puede pedir cualquier usuario
// 3. si es usuario normal solo puede pedirse a si mismo (o sale 401)
// 4. si no es usuario -> 401
server.get('/api/users/:id', passport.authenticate('jwt', {
    session: false}), (req, res) => {
    if (req.user && (req.user.admin || req.user.id === req.params.id) ) {
        connection.query('SELECT * from usuario WHERE id= ?', (err, results) => {
            if (err){
                res.sendStatus(500)
            } else if (results.length === 0) {
                res.sendStatus(404);
            } else {
                res.json(results[0]);
            }
        })
    } else {
        res.sendStatus(401)
    }
})


server.get('/api/dropdown/usuarios', passport.authenticate('jwt', {
    session: false}, (req, res) => {
        if (req.user) {
            connection.query('SELECT nombre from usuario WHERE id= ?', (err, results) => {
                if (err) {
                    res.sendStatus(500)
                } else {
                    res.json(results)
                }
            })
        }
    }))

// TODO: /api/usuarios
// 1. passport.authenticate
// 2. si es admin, puede pedir cualquier usuario
// 3. si es usuario normal solo puede pedirse a si mismo (o sale 401)
// 4. si no es usuario -> 401
server.get('/api/usuarios/:id/puntos_saldo', passport.authenticate('jwt', {
    session: false}), (req, res) => {
        if (req.user && (req.user.admin || req.user.id === req.params.id) ) {
            connection.query('SELECT * from puntos_saldo WHERE id= ?', (err, results) => {
            if (err) {
                res.sendStatus(500);
            } else if (results.length === 0) {
                res.sendStatus(404);
            } else {
            res.json(results[0]);
            }
        })
    } else {
        res.sendStatus(401)
    }
})

// TODO: /api/usuarios
// 1. passport.authenticate
// 2. si es admin, puede crear usuario
// 3. si es usuario normal -> 401
// 4. si no es usuario -> 401
server.post('/api/usuarios', passport.authenticate('jwt', {
    session: false}), (req, res) => {
    const user = req.body;
    user.hash = sha1(user.password + salt);
    delete user.password;
    if (req.user && (req.user.admin || req.user.id)) {
        connection.query('INSERT INTO usuario SET ?', (err, results) => {
            if (err) {
                res.sendStatus(500);
            } else if (results.length === 0) {
                res.sendStatus(404);
            } else {
            res.json(results[0]);
            }
        })
    } else {
        res.sendStatus(401)
    }
})

// TODO: /api/usuarios
// 1. passport.authenticate
// 2. si es admin, puede cambiar cualquier usuario
// 3. si es usuario normal solo puede cambiarse a si mismo (o sale 401)
// 4. si no es usuario -> 401
server.patch('/api/usuarios/:id', passport.authenticate('jwt', {
    session: false}), (req, res) => {
        if (req.user && (req.user.admin || req.user.id === req.params.id) ) {
                connection.query('UPDATE usuario SET ? WHERE id = ?', (err, results) => {
                    if (err) {
                        res.sendStatus(500);
                    } else if (results.length === 0) {
                        res.sendStatus(404);
                    } else {
                    res.json(results[0]);
                    }
                })
            } else {
                res.sendStatus(401)
            }
        })


server.delete('/api/usuarios/:id', passport.authenticate('jwt', {
    session: false}), (req, res) => {
        if (!req.user || !req.user.admin) {
            res.sendStatus(401)
        } else {
            connection.query('DELETE FROM usuario WHERE id = ?', (err, results) => {
                if (err) {
                    res.sendStatus(500);
                }
                res.json(results);
            });     
        }
    }
);


// ?----------------------------- NEWS FEED ----------------------------------------


server.get('/api/newsfeed', (req, res) => {
    connection.query('SELECT * FROM newsfeed_plus ORDER BY date DESC LIMIT 20', (err, results) => {
            if (err) {
                res.sendStatus(500);
            } else {
                res.json(results);
            }
        });
    }
);



// ?---------------------------------- LOG IN/ LOG OUT -----------------------------------------


server.post('/api/login', (req, res, next) => {
    console.log('login starting');
        passport.authenticate('local', function(err, user){
            console.log('login finish')
            if (err || !user) {
                res.status(401);
                res.json({ message:'There is a problem logging in'})
            } else {
                jwt.sign({user}, secret,(err, token) => {
                    console.log('jwt generate', err, token)
                    if(err) return res.status(500).json(err)
                    res.cookie('jwt', token, {
                        httpOnly: true 
                    })
                    res.status(200).send(user)
                })
            }
        })(req, res, next);
    }
);


server.post('/api/logout', (req, res, nex) => {
    res.clearCookie('jwt').send()
});


// ?------------------------------------ VOTES ----------------------------------------

// TODO: passport.authenticate (solo usuarios pueden votar)
server.post('/api/votos', oassport.authenticate('jwt', {
    session: false}), (req, res) => {
        if (!req.user || !req.user.admin) {
            res.sendStatus(401)
        } else {
            connection.query('INSERT INTO voto SET ?', (err, results) => {
            if (err) {
                res.sendStatus(500)
            } else {
                res.json(results);
            }
        });
    }
});


// ?------------------------------- PREMIOS ---------------------------------------------

server.get('/api/premios', (req, res) => {
    connection.query('SELECT * from premios', (err, results) => {
        if (err) {
            console.log(err)
            res.status(500).send(err.message);
        } else {
            res.json(results);
        }
    });
});

// TODO: passport.authenticate (solo usuarios pueden escoger premios)
server.post('/api/premios/add', passport.authenticate('jwt', {
    session: false}), (req, res) => {
        if ( !req.user || !req.user.admin) {
            res.sendStatus(401)
        } else {
            connection.query('INSERT into premios SET ?', (err, results) => {
        if (err) {
            res.sendStatus(500);
        }
            res.json(results);
        });
    }
});

// TODO: passport.authenticate (solo administrador puede crear premios)
server.post('/api/premios', passport.authenticate('jwt', {
    session: false}), (req, res) => {
        if (req.user || req.user.admin) {
            connection.query('INSERT into premio SET ?', total, (err, results) => {
                if (err) {
                    res.sendStatus(500);
                } else {
                    res.sendStatus(results);
                }
            }); 
        }
    }
);

// TODO: revisar logica (solo administrador puede cambiar premios)
server.patch('api/premios/:id', passport.authenticate('jwt', {
    session: false}), (req, res) => {
        if (req.user || req.user.admin) {
            connection.query('UPDATE premio SET ? WHERE id = ?', (err, results)=> {
                if (err) {
                    res.sendStatus(401);
                } else {
                    res.sendStatus(results);
                }
            });
        }
    }
);


server.on("error", (e) => console.log(e))

server.listen(port, () => { 
        console.log('This is on port ' + port);
    }
)

// TODO: tests con mocha y supertest
