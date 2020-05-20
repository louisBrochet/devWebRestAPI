////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// DevWebRestAPI ////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////// Louis Brochet //////////////
//////// Connexion à la base de données ////////////////////////////////////////////////////////////////////////////////
const mysql = require("mysql");
const dbConfig = require("./db/db.config"); // Fichier de configuration utilisateur base de données
const connection = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});
connection.connect(error => {
    if (error) throw error;
    console.log("Connexion à la base de données réussie");
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Création du serveur + HTTPS ///////////////////////////////////////////////////////////////////////////////////
const express = require("express");
const https = require('https');
const fs = require('fs'); // Manipulation de fichiers et de répertoires
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/www.wt1-2.ephec-ti.be/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/www.wt1-2.ephec-ti.be/cert.pem', 'utf8'),
    ca: fs.readFileSync('/etc/letsencrypt/live/www.wt1-2.ephec-ti.be/chain.pem', 'utf8')
};
const app = express();
const httpsServer = https.createServer(options, app);
httpsServer.listen(3000);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Routage statique //////////////////////////////////////////////////////////////////////////////////////////////
app.use(express.static('medias')); // Tout ce qui se trouve dans le répertoire médias est routable
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// CORS //////////////////////////////////////////////////////////////////////////////////////////////////////////
// (Autoriser uniquement l'accès au server Web)
const cors = require('cors');
const corsOptions = {
    origin: 'https://biodiversite-lln.web.app',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Outils requêtes ///////////////////////////////////////////////////////////////////////////////////////////////
const bodyParser = require("body-parser");
// parse requests of content-type: application/json
app.use(bodyParser.json());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Fonction connexion ////////////////////////////////////////////////////////////////////////////////////////////
const keyVerfication = (req, res, next) => {
    const key = 'ytdNQFB@Duca*o-aMoh7zMWU3Q.FbVuX';
    const reqKey = req.query.key;
    if (!req.query.key){
        res.status(401).send('Accès refusé, clé non trouvée.');
    }
    else {
        if (reqKey == key){
            delete req.query.key;
            console.log(req.query);
            next();
        }
        else {
            res.status(401).send('Accès refusé, clé incorrecte.');
        }
    }
};
app.use(keyVerfication);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Routes ////////////////////////////////////////////////////////////////////////////////////////////////////////
// la route /api/:table est dynamique et fonctionne pour toutes les tables de la base de données
app.route('/api/:table') // :table est une variable pour rendre le routage dynamique
    .get((req, res) => reqDb.find(req, res))
    .post((req, res) => reqDb.create(req, res))
    .put((req, res) => reqDb.update(req, res))
    .delete((req, res) => reqDb.delete(req, res));
// Sur deux tables
app.route('/api/points/:table2').get((req, res) => getPointsLvl2(req, res)); // Récupérer des points en fonction d'une autre table
app.route('/api/medias/points').get((req, res) => getMediasLvl2(req, res)); // Récupérer le path des médias en fonction d'un point
app.route('/api/utilisateurs/login').post((req, res) => login(req, res));
app.route('/api/utilisateurs/register').post((req, res) => register(req, res));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Requêtes dynamique CRUD ///////////////////////////////////////////////////////////////////////////////////////
const reqDb = {
    create: function (req, res) {
        let reqSql = "insert into " + req.params.table + " (";
        Object.keys(req.body).forEach((e, i, a) => {
            reqSql += e;
            if (i < a.length - 1) {
                reqSql += ", ";
            }
        });
        reqSql += ") values (";
        Object.values(req.body).forEach((e, i, a) => {
            if (isNaN(e)) {
                reqSql += "'" + e + "'";
            }
            else {
                reqSql += e;
            }
            if (i < a.length - 1) {
                reqSql += ", ";
            }
        });
        reqSql += ");";
        connection.query(reqSql, function (err, results) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    },
    find: function (req, res) {
        let reqSql = "select * from " + req.params.table;
        if (Object.keys(req.query).length > 0) {
            reqSql += " where ";
            Object.keys(req.query).forEach((e, i, a) => {
                if (isNaN(req.query[e])) {
                    reqSql += e + " = '" + req.query[e] + "'";
                }
                else {
                    reqSql += e + " = " + req.query[e];
                }
                if (i < a.length - 1) {
                    reqSql += " and ";
                }
            });
        }
        reqSql += ";";
        connection.query(reqSql, function (err, results) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    },
    update: function (req, res) {
        if (Object.keys(req.query).length > 0) {
            let reqSql = 'update ' + req.params.table + ' set ';
            Object.keys(req.body).forEach((e, i, a) => {
                if (isNaN(req.body[e])) {
                    reqSql += e + ' = "' + req.body[e] + '"';
                }
                else {
                    reqSql += e + ' = ' + req.body[e];
                }
                if (i < a.length - 1) {
                    reqSql += ', ';
                }
            });
            reqSql += ' where ' + Object.keys(req.query)[0] + ' = ' + Object.values(req.query)[0] + ';';
            connection.query(reqSql, function (err, results) {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    res.status(200).json(results);
                }
            });
        }
        else {
            res.status(400).send("Vous devez renseigner l'id de l'objet dans les paramètres de votre requête");
        }
    },
    delete: function (req, res) {
        if (Object.keys(req.query).length > 0) {
            let reqSql = "delete from " + req.params.table + " where ";
            Object.keys(req.query).forEach((e, i, a) => {
                if (isNaN(req.query[e])) {
                    reqSql += e + " = '" + req.query[e] + "'";
                }
                else {
                    reqSql += e + " = " + req.query[e];
                }
                if (i < a.length - 1) {
                    reqSql += " and ";
                }
            });
            reqSql += ";";
            connection.query(reqSql, function (err, results) {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    res.status(200).json(results);
                }
            });
        }
        else {
            res.status(400).send("Vous devez renseigner des paramètres dans votre requête");
        }
    }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////// Requêtes spéciales ////////////////////////////////////////////////////////////////////////////////////////////
const getMediasLvl2 = (req, res) => {
    if (Object.keys(req.query).length > 0) {
        let reqSql = "select idMedia, localisationMedia from Medias, Points where Medias.idPoint = Points.idPoint and ";
        Object.keys(req.query).forEach((e, i, a) => {
            if (isNaN(req.query[e])) {
                reqSql += "Points." + e + " = '" + req.query[e] + "'";
            }
            else {
                reqSql += "Points." + e + " = " + req.query[e];
            }
            if (i < a.length - 1) {
                reqSql += " and ";
            }
        });
        reqSql += ";";
        console.log(reqSql);
        connection.query(reqSql, function (err, results) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    }
    else {
        res.status(400).send("Vous devez renseigner des paramètres dans votre requête");
    }
};
const getPointsLvl2 = (req, res) => {
    if (Object.keys(req.query).length > 0) {
        let reqSql = "select * from Points, " + req.params.table2
            + "Points where Points.idPoint = " + req.params.table2
            + "Points.idPoint and " + Object.keys(req.query)[0]
            + " = " + req.query[Object.keys(req.query)[0]];
        reqSql += ";";
        console.log(reqSql);
        connection.query(reqSql, function (err, results) {
            if (err) {
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    }
    else {
        res.status(400).send("Vous devez renseigner des paramètres dans votre requête");
    }
};
const login = (req, res) => {
    let reqSql = 'SELECT * FROM Utilisateurs WHERE username = "' + req.body.username + '";';
    connection.query(reqSql, function (err, results) {
        if (results[0].password === req.body.password) {
            let user = {
                id: results[0].id,
                username: results[0].username,
                password: results[0].password
            };
            res.status(200).json(user);
        } else if (results[0].password !== req.body.password) {
            res.status(400).json({message : 'Mot de passe incorrect.'});
        } else {
            res.status(400).json({message : 'Votre nom d\'utilisateur n\'éxiste pas,\n veuillez vous inscrire.'});
        }
    });
};

const register = (req, res) => {
    let reqSql = 'INSERT INTO Utilisateurs(username, password) VALUES("' + req.body.username + '", "' + req.body.password + '")';
    connection.query(reqSql, function (err, results) {
        if (err) {
            res.status(400).json({message: 'Ce nom d\'utilisateur éxiste déjà,\n veuillez en choisir un autre.'});
        }
        else {
            res.status(200).json({});
        }
    });
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
