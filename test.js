const mysql = require("mysql");
const dbConfig = require("./db/db.config");
const express = require("express");
const bodyParser = require("body-parser");
const url = require('url');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.static('photos'));
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
    .get((req, res) => db.find(req, res))
    .post((req, res) => db.create(req, res))
    .put((req, res) => db.update(req, res))
    .delete((req, res) => db.delete(req, res));

const fctSqlQueries = function (queries) {
    queries = queries.replace(/%27/g,"'");
    let sqlQueries = [];
    queries.split('&').forEach((e) => {
        sqlQueries.push(e.split('=')[0] + "=" + e.split('=')[1]);
    });
    return sqlQueries;
}

//////Requêtes db /////////////

const db = {
    create: function (req, res){
        let reqSql = "insert into " + req.params.table;
        let queries = url.parse(req.url).query;
        if (queries == null){
            res.status(400).send("Vous devez renseigner des paramètres !");
        }
        else{
            const sqlQueries = fctSqlQueries(queries);
            reqSql += " (" + sqlQueries[0].split('=')[0];
            for (let i = 1; i < sqlQueries.length; i++){
                reqSql += ", " + sqlQueries[i].split('=')[0];
            }
            reqSql += ") values (" + sqlQueries[0].split('=')[1];
            for (let i = 1; i < sqlQueries.length; i++){
                reqSql += ", " + sqlQueries[i].split('=')[1];
            }
            reqSql += ")";
            connection.query(reqSql, function(err, results){
                if (err){
                    res.status(500).send(err);
                }
                else {
                    res.status(200).json(results);
                }
            });
        }

    },
    find: function (req, res) {
        let reqSql = "select * from " + req.params.table;
        let queries = url.parse(req.url).query;
        if (queries){
            const sqlQueries = fctSqlQueries(queries);
            reqSql += " where " + sqlQueries[0];
            for (let i = 1; i < sqlQueries.length; i++){
                reqSql += " and " + sqlQueries[i];
            }
        }
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
        let reqSql = "update " + req.params.table;
        let queries = url.parse(req.url).query;
        if (queries == null){
            res.status(400).send("Vous devez renseigner des paramètres !");
        }
        else {
            const sqlQueries = fctSqlQueries(queries);
            reqSql += " set "  + sqlQueries[0];
            for (let i = 1; i < sqlQueries.length; i++) {
                reqSql += ", " + sqlQueries[i];
            }
        }
    },
    delete: function () {

    }
};

// Trafiquer les requêtes pour les données multmédias (url)
// fs pour supprimer les données multimédias et supprimer en bdd
// chercher pour trouver comment rajouter un média et ajouter en bdd

app.listen(3000);
