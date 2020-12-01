const { response } = require("express");

module.exports = function(app, db) {


    app.get('/graphics-cards', (req, res, next) => {

        const params = req.query;

        // default values
        let page = 1;
        let limit = 20;
        let count = 0;
        let search = "";
        let sortBy = "name";
        let brands = "";
        let type = "";

        if(params.page && /^\d+$/.test(params.page)) page = parseInt(params.page);
        if(params.limit && /^\d+$/.test(params.limit)) limit = parseInt(params.limit);
        if(params.search) search = params.search;
        if(params.sortBy) sortBy = params.sortBy;
        if(params.brands) {
            let req = params.brands.split(',');
            if(req.length > 0) {
                brands = "AND brand_name IN (";
                    req.forEach((item, index) => {
                        brands += `'${item}'`;
                        brands += (index < req.length - 1) ? ',' : '';
                    });
                brands += ")";
            } 
        }

        if(params.categories) {
            let req = params.categories.split(',');
            if(req.length > 0) {
                type = "AND type IN (";
                    req.forEach((item, index) => {
                        type += `'${item}'`;
                        type += (index < req.length - 1) ? ',' : '';
                    });
                type += ")";
            } 
        }


        // calculating offset
        let offset = (limit * page) - limit;

        // get count of all graphics cards
        let sql = "SELECT COUNT(*) as count FROM graphic_cards gc";
        sql += " WHERE (SELECT MIN(price) FROM comparison WHERE graphic_card_id = gc.id AND price > 0) IS NOT NULL";
        sql += ` AND name LIKE '%${search}%' ${brands} ${type}`;

        db.query(sql, (err, result) => {
            if(err) return res.status(500).json({ error: true, message: 'Internal server error' });
            count = result[0].count;
        });

        // get list of graphics cards 
        sql = "SELECT gc.*, (SELECT COUNT(*) FROM comparison WHERE graphic_card_id = gc.id) as count, (SELECT MIN(price) FROM comparison WHERE graphic_card_id = gc.id AND price > 0) as price FROM graphic_cards gc";
        sql += " WHERE (SELECT MIN(price) FROM comparison WHERE graphic_card_id = gc.id AND price > 0) IS NOT NULL";
        sql += ` AND name LIKE '%${search}%' ${brands} ${type}`;
        sql += ` ORDER BY ${sortBy} ASC`;
        sql += ` LIMIT ${limit} OFFSET ${offset}`;

        db.query(sql, function(err, result){
                if (err) return res.status(500).json({ error: true, message: 'Internal server error' });

                let response = {
                    page: page,
                    limit: limit,
                    search: search,
                    count: count,
                    data: result 
                }

                return res.json(response);
        });

    });

    app.get('/graphics-card/:id/', (req, res, next) => {

        const id = req.params.id;
        let sql = `SELECT * FROM graphic_cards WHERE id = '${id}'`;
        db.query(sql, (err, result) => {
            if(err) return res.status(500).json({ error: true, message: 'Internal server error' });
            if(result.length <= 0) return res.status(404).json({ error: true, message: 'Graphics Card with provided ID doesn\'t exist' });
            let response = result[0];

            sql = `SELECT * FROM comparison WHERE graphic_card_id = '${id}' ORDER BY price ASC`;
            db.query(sql, (err, result) => {
                if(err) return res.status(500).json({ error: true, message: 'Internal server error' });
                response.comparison = result;
                return res.json(response);
            });


        });

    });


    app.get('/graphics-cards/brands/', (req, res) => {

        let sql = `SELECT brand_name as name FROM graphic_cards WHERE brand_name != '' GROUP BY brand_name ORDER BY brand_name ASC`;
        db.query(sql, (err, result) => {
            if(err) return res.status(500).json({ error: true, message: 'Internal server error' });
    
            return res.json(result);
        });

    });

    app.get('/graphics-cards/categories/', (req, res) => {

        let sql = `SELECT type as name FROM graphic_cards WHERE type != '' GROUP BY type ORDER BY type ASC`;
        db.query(sql, (err, result) => {
            if(err) return res.status(500).json({ error: true, message: 'Internal server error' });
    
            return res.json(result);
        });

    });


    app.get('/graphics-cards/series/', (req, res) => {

        let sql = `SELECT type, series as name FROM graphic_cards WHERE series != '' GROUP BY type, series ORDER BY series ASC`;

        db.query(sql, (err, result) => {
            if(err) return res.status(500).json({ error: true, message: 'Internal server error' });
    
            return res.json(result);
        });

    });


    app.get('*', function(req, res){
        res.status(404).json({ error: true, message: 'Path not recognized', url: req.path });
    });


}