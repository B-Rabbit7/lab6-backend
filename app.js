const { Pool } = require('pg');
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8888;

const dictionary = {};
const main_route = "/definition/:word";
const create_route = "/definition";
const languages_route = "/languages";
const exists_error = "Warning, item already exists";
const pgError = "PostgreSQL client error:";
const pgConnected = "Connected to PostgreSQL!";
const cantConnect = "Error connecting:";
const sqlQuery =
  "CREATE TABLE IF NOT EXISTS dictionary (id SERIAL PRIMARY KEY,term VARCHAR(100),term_language VARCHAR(50),definition VARCHAR(100),definition_language VARCHAR(50))";
const fetch_error = "Error fetching data:";
const query_fetch_all = "SELECT * FROM dictionary";
const msg_all_data_displayed = 'Data from the "dictionary" table:';
const error = "error";
const query_delete_all = "DELETE FROM dictionary";
const query_error_delete = "Error deleting rows from the database:";
const query_success_delete = "All rows deleted from the 'dictionary' table.";
const query_insert = "INSERT INTO dictionary (term, term_language, definition, definition_language) VALUES ($1, $2, $3, $4)";
const query_error_insert = "Error inserting data into the database:";

let count = 0;
let request = 0;

app.use(bodyParser.json());
app.use(cors());

let con;
function connectToDatabase() {
  con = new Pool({
    user: "set",
    password: "JQqZElkvzj3aujXZpn428h3KMnbN8Ckl",
    host: "dpg-cl2na81novjs73b0rhmg-a.oregon-postgres.render.com",
    database: "db_woj4",
    port: 5432,
    ssl: true,
    idleTimeoutMillis: 20000,
  });

  con.on("error", (err, client) => {
    console.error(pgError, err);
    // Handle the error and attempt to reconnect
    setTimeout(() => {
      connectToDatabase();
    }, 10000); // Retry the connection after 10 seconds
  });

  con.connect()
    .then(() => {
      console.log(pgConnected);
      createTable();
      displayData();
    })
    .catch((err) => {
      console.error(cantConnect, err);
      // Retry the connection after a delay
      setTimeout(() => {
        connectToDatabase();
      }, 1000); // Retry the connection after 1 seconds
    });
}
connectToDatabase();

function createTable() {
  const sql = sqlQuery;
  con.query(sql, function (err, result) {
    if (err) throw err;
  });
}

function deleteAllRows() {
  const deleteSql = query_delete_all;

  con.query(deleteSql, (err, result) => {
    if (err) {
      console.error(query_error_delete, err);
    } else {
      console.log(query_success_delete);
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
    const insertSql = query_insert;
      
    const values = [
      data.term,
      data.term_language,
      data.definition,
      data.definition_language,
    ];

    con.query(insertSql, values, (err, result) => {
      if (err) {
        console.error(query_error_insert, err);
        res
          .status(500)
          .json({ error: query_error_insert });
      } else {
        res.status(201).json({
          result: `<b>New entry recorded: </b>"${data.term} (${data.term_language}): ${data.definition} (${data.definition_language})"`,
        });
        displayData();
      }
    });
  }
});

app.get(main_route, (req, res) => {
  const term = req.params.word;
  request += 1;
  if (term in dictionary) {
    res.status(200).json({ result: `${term}: ${dictionary[term]}`, exists: true });
  } else {
    res.status(404).json({ error: `Term "${term}" not found in the dictionary` });
  }
});


app.patch("/definition/:word", (req, res) => {
  const term = req.params.word;
  const newDefinition = req.body.definition;
  const newTermLanguague = req.body.termLanguage;
  const newDefinitionLanguage = req.body.definitionLanguage;

  // Check if the term exists in the database
  // You should replace the following block with a database query
  // to check if the term exists in your PostgreSQL database
  if (term in dictionary) {
    dictionary[term] = newDefinition;

    // Update the database entry for the term, including term and definition languages
    const updateSql = "UPDATE dictionary SET definition = $1, term_language = $2, definition_language = $3 WHERE term = $4";
    const values = [newDefinition, newTermLanguague, newDefinitionLanguage, term];

    con.query(updateSql, values, (err, result) => {
      if (err) {
        console.error("Error updating data in the database:", err);
        res.status(500).json({ error: "Error updating data in the database" });
      } else {
        res.status(200).json({
          result: `Term updated:\n"${term} : ${newDefinition}"`,
        });
        displayData(); // You may want to refresh the data display after the update
      }
    });
  } else {
    res.status(404).json({ error: `Term "${term}" not found in the database` });
  }
});

app.delete("/definition/:word", (req, res) => {
  const term = req.params.word;

  // Check if the term exists in the dictionary
  if (term in dictionary) {
      // Remove the term from the dictionary
      delete dictionary[term];

      // Delete the database entry for the term
      const deleteSql = "DELETE FROM dictionary WHERE term = $1";
      const values = [term];

      con.query(deleteSql, values, (err, result) => {
          if (err) {
              console.error("Error deleting data from the database:", err);
              res.status(500).json({ error: "Error deleting data from the database" });
          } else {
              res.status(200).json({ result: `Term "${term}" deleted successfully.` });
              displayData();
          }
      });
  } else {
      res.status(404).json({ error: `Term "${term}" not found in the dictionary` });
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