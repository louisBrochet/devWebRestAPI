const mysql = require("mysql");
const dbConfig = require("./db/db.config");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.static('medias'));
// parse requests of content-type: application/json
app.use(bodyParser.json());

// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Create a connection to the database
const connection = mysql.createConnection({
    host: dbConfig.HOST,
    user: dbConfig.USER,
    password: dbConfig.PASSWORD,
    database: dbConfig.DB
});

// open the MySQL connection
connection.connect(error => {
    if (error) throw error;
    console.log("Successfully connected to the database.");
});

///////Routes/////////

app.route('/api/:table')
    .get((req, res) => reqDb.find(req, res))
    .post((req, res) => reqDb.create(req, res))
    .put((req, res) => reqDb.update(req, res))
    .delete((req, res) => reqDb.delete(req, res));

app.route('/api/points/:table2').get((req, res) => getPointsLvl2(req, res));

app.route('/api/medias/points').get((req, res) => getMediasLvl2(req, res));

//////Requêtes db /////////////

const reqDb = {
    create: function (req, res){
        let reqSql = "insert into " + req.params.table + " (";
        Object.keys(req.body).forEach((e, i, a) =>{
            reqSql += e;
            if(i < a.length - 1){
                reqSql += ", ";
            }
        });
        reqSql += ") values (";
        Object.values(req.body).forEach((e, i, a) =>{
            if (isNaN(e)){
                reqSql += "'" + e + "'";
            }
            else{
                reqSql += e;
            }
            if(i < a.length - 1){
                reqSql += ", ";
            }
        });
        reqSql += ");";
        connection.query(reqSql, function(err, results){
            if (err){
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    },
    find: function (req, res) {
        let reqSql = "select * from " + req.params.table;
        if (Object.keys(req.query).length > 0){
            reqSql += " where ";
            Object.keys(req.query).forEach((e, i, a ) => {
                if (isNaN(req.query[e])){
                    reqSql += e + " = '" + req.query[e] + "'";
                }
                else{
                    reqSql += e + " = " + req.query[e];
                }
                if(i < a.length - 1){
                    reqSql += " and ";
                }
            });
        }
        reqSql += ";";
        connection.query(reqSql, function(err, results){
            if (err){
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    },
    update: function (req, res) {
        if (Object.keys(req.query).length > 0){
            let reqSql = 'update ' + req.params.table + ' set ';
            Object.keys(req.body).forEach((e, i, a) =>{
                if (isNaN(req.body[e])){
                    reqSql += e + ' = "' + req.body[e] + '"';
                }
                else{
                    reqSql += e + ' = ' + req.body[e];
                }
                if(i < a.length - 1){
                    reqSql += ', ';
                }
            });
            reqSql += ' where ' + Object.keys(req.query)[0]  + ' = ' + Object.values(req.query)[0] + ';';
            connection.query(reqSql, function(err, results){
                if (err){
                    res.status(500).send(err);
                }
                else {
                    res.status(200).json(results);
                }
            });
        }
        else{
            res.status(400).send("Vous devez renseigner l'id de l'objet dans les paramètres de votre requête");
        }
    },
    delete: function (req, res) {
        if (Object.keys(req.query).length > 0){
            let reqSql = "delete from " + req.params.table + " where ";
            Object.keys(req.query).forEach((e, i , a) => {
                if (isNaN(req.body[e])){
                    reqSql += e + " = '" + req.query[e] + "'";
                }
                else{
                    reqSql += e + " = " + req.query[e];
                }
                if(i < a.length - 1){
                    reqSql += " and ";
                }
            });
            reqSql += ";";
            connection.query(reqSql, function(err, results){
                if (err){
                    res.status(500).send(err);
                }
                else {
                    res.status(200).json(results);
                }
            });
        }
        else{
            res.status(400).send("Vous devez renseigner des paramètres dans votre requête");
        }
    }
};

const getMediasLvl2 = (req, res) => {
    if (Object.keys(req.query).length > 0){
        let reqSql = "select idMedia, localisationMedia from medias, points where medias.idPoint = points.idPoint and ";
        Object.keys(req.query).forEach((e, i, a) => {
            if (isNaN(req.query[e])){
                reqSql += "points." + e + " = '" + req.query[e] + "'";
            }
            else{
                reqSql += "points." + e + " = " + req.query[e];
            }
            if(i < a.length - 1){
                reqSql += " and ";
            }
        });
        reqSql += ";";
        console.log(reqSql);
        connection.query(reqSql, function(err, results){
            if (err){
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    }
    else{
        res.status(400).send("Vous devez renseigner des paramètres dans votre requête");
    }
};

const getPointsLvl2 = (req, res) => {
    if (Object.keys(req.query).length > 0){
        let reqSql = "select * from points, " + req.params.table2
            + "points where points.idPoint = " + req.params.table2
            + "points.idPoint and " + Object.keys(req.query)[0]
            + " = " + req.query[Object.keys(req.query)[0]];
        reqSql += ";";
        connection.query(reqSql, function(err, results){
            if (err){
                res.status(500).send(err);
            }
            else {
                res.status(200).json(results);
            }
        });
    }
    else{
        res.status(400).send("Vous devez renseigner des paramètres dans votre requête");
    }
};

// Trafiquer les requêtes pour les données multmédias (url)
// fs pour supprimer les données multimédias et supprimer en bdd
// chercher pour trouver comment rajouter un média et ajouter en bdd

app.listen(3000);
