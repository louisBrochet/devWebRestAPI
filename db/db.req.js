require('db');

const db = {
    create: function (){
        connection.query("select * from " + req.params.table, function(err, results){
            if (err){
                res.send(err);
            }
            res.send(JSON.stringify(results));
        });
    },
    findAll: function () {

    },
    find: function () {

    },
    update: function () {

    },
    delete: function () {

    }
};
