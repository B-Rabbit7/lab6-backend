const { Client } = require("pg");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8888;
const GET = "GET";
const POST = "POST";

const dictionary = {};
const search_route = "/definition/";
const create_route = "/definition";
const languages_route = "/languages";
const endpoint_error = "Endpoint not found";
const method_error = "Method not allowed";
const exists_error = "Warning, item already exists";
const pgError = "PostgreSQL client error:";
const pgConnected = "Connected to PostgreSQL!";
const cantConnect = "Error connecting:";
const sqlQuery =
  "CREATE TABLE IF NOT EXISTS dictionary (id SERIAL PRIMARY KEY,term VARCHAR(100),term_language VARCHAR(50),definition VARCHAR(100),definition_language VARCHAR(50))";
const fetch_error = "Error fetching data:";
const query_fetch_all = "SELECT * FROM dictionary";
const msg_all_data_displayed = 'Data from the "dictionary" table:';

let count = 0;
let request = 0;

app.use(bodyParser.json());
app.use(cors());

const con = new Client({
  user: "set",
  password: "JQqZElkvzj3aujXZpn428h3KMnbN8Ckl",
  host: "dpg-cl2na81novjs73b0rhmg-a.oregon-postgres.render.com",
  database: "db_woj4",
  port: 5432,
  ssl: true,
});

con.on("error", (err) => {
  console.error(pgError, err);
});

con
  .connect()
  .then(() => {
    console.log(pgConnected);
    createTable();
    displayData();
  })
  .catch((err) => console.error(cantConnect, err));

function createTable() {
  const sql = sqlQuery;
  con.query(sql, function (err, result) {
    if (err) throw err;
  });
}

function deleteAllRows() {
  const deleteSql = "DELETE FROM dictionary";

  con.query(deleteSql, (err, result) => {
    if (err) {
      console.error("Error deleting rows from the database:", err);
    } else {
      console.log("All rows deleted from the 'dictionary' table.");
    }
  });
}
deleteAllRows();

function displayData() {
  const sql = query_fetch_all;
  con.query(sql, (err, result) => {
    if (err) {
      console.error(fetch_error, err);
      return;
    }
    console.log(msg_all_data_displayed);
    console.table(result.rows);
  });
}

app.post(create_route, (req, res) => {
  let data = req.body;
  if (data.term in dictionary) {
    res.status(400).json({ error: exists_error });
  } else {
    dictionary[data.term] = data.definition;
    count += 1;

    // Insert data into the database
    const insertSql =
      "INSERT INTO dictionary (term, term_language, definition, definition_language) VALUES ($1, $2, $3, $4)";
    const values = [
      data.term,
      data.term_language,
      data.definition,
      data.definition_language,
    ];

    con.query(insertSql, values, (err, result) => {
      if (err) {
        console.error("Error inserting data into the database:", err);
        res
          .status(500)
          .json({ error: "Error inserting data into the database" });
      } else {
        res.status(201).json({
          result: `Request # ${count}\nNew entry recorded:\n"${data.term} (${data.term_language}) : ${data.definition} (${data.definition_language})"`,
        });
        displayData();
      }
    });
  }
});

app.get(search_route, (req, res) => {
  const term = req.query.word;
  request += 1;
  if (term in dictionary) {
    res.status(200).json({ result: `${term}: ${dictionary[term]}` });
  } else {
    res
      .status(404)
      .json({ error: `Request # ${request}, word ${term} not found!` });
  }
});

app.get(languages_route, (req, res) => {
  const availableLanguages = [
    "English",
    "Española",
    "汉语 (Chinese Simplified)",
    "Française",
  ];
  res.status(200).json(availableLanguages);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});