const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


const conn = mysql.createConnection({
    connectionLimit: 1,
    host: "localhost",
    user: "root",
    password: "root",
    database: "graphic_cards_comparison",
    port: "8889"
});

conn.connect(function (err) {
    if (err) return console.log("Could'n connect to DB");

    require('./routes.js')(app, conn);
    app.listen(port, () => {
        console.log("Live on port " + port);
    });

});
