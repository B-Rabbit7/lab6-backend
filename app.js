const { Pool } = require("pg");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 8888;

const dictionary = {};
const create_route = "/definition";
const languages_route = "/languages";

const constants = require("./constants");

const dbConstants = constants.database;
const errorConstants = constants.errors;
const messageConstants = constants.messages;
const routesConstants = constants.routes;

const createTableSql = dbConstants.table.create;
const queryAllSql = dbConstants.table.queryAll;
const deleteAllSql = dbConstants.table.deleteAll;
const insertSql = dbConstants.table.insert;
const deleteError = dbConstants.table.deleteError;
const deleteSuccess = dbConstants.table.deleteSuccess;
const insertError = dbConstants.table.insertError;
const createLanguageTableQuery = dbConstants.table.createLanguageTable;
const insertLanguageQuery = dbConstants.table.insertLanguage;
const errorInsertLanguage = dbConstants.table.errorInsertLanguage;
const successInsertLanguage = dbConstants.table.successInsertLanguage;

const pgError = errorConstants.pgError;
const cantConnect = errorConstants.cantConnect;
const fetchError = errorConstants.fetchError;
const exists = errorConstants.exists;

const connectedMsg = messageConstants.connected;
const allDataDisplayedMsg = messageConstants.allDataDisplayed;

const availableLanguages = constants.languages;

app.use(bodyParser.json());
app.use(cors());
let requestCounter = 0;
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
    setTimeout(() => {
      deleteAllLanguages();
      connectToDatabase();
    }, 1000);
  });

  con
    .connect()
    .then(() => {
      console.log(connectedMsg);
      //add 2 functions 1 create language table, 2 insert data into it
      createTable();
      createLanguageTable();
      insertLanguages();
      displayLanguages();
      displayData();
    })
    .catch((err) => {
      console.error(cantConnect, err);
      setTimeout(() => {
        deleteAllLanguages();
        connectToDatabase();
      }, 1000);
    });
}
connectToDatabase();

function createTable() {
  const sql = createTableSql;
  con.query(sql, function (err, result) {
    if (err) throw err;
  });
}
function deleteAllRows() {
  const deleteSql = deleteAllSql;

  con.query(deleteSql, (err, result) => {
    if (err) {
      console.error(deleteError, err);
    } else {
      console.log(deleteSuccess);
    }
  });
}

// Language Table stuff----------------------------------------------------------------
function createLanguageTable() {
  const sql = createLanguageTableQuery;
  con.query(sql, function (err, result) {
    if (err) throw err;
  });
}

function insertLanguages() {
  const insertSql = insertLanguageQuery;
  availableLanguages.forEach((language) => {
    const values = [language];
    con.query(insertSql, values, (err, result) => {
      if (err) {
        console.error(errorInsertLanguage, err);
      } else {
        console.log(successInsertLanguage(language));
      }
    });
  });
}

function deleteAllLanguages() {
  const deleteSql = "DELETE FROM language";

  con.query(deleteSql, (err, result) => {
    if (err) {
      console.error("Error deleting all languages:", err);
    } else {
      console.log("All rows deleted from the 'languages' table.");
    }
  });
}
// deleteAllLanguages();
deleteAllLanguages();
function displayLanguages() {
  const sql = "SELECT * FROM language";

  con.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching languages from the language table:", err);
      return;
    }
    console.log("Languages in the 'language' table:");
    console.table(result.rows);
  });
}

function displayData() {
  const sql = queryAllSql;
  con.query(sql, (err, result) => {
    if (err) {
      console.error(fetchError, err);
      return;
    }
    console.log(allDataDisplayedMsg);
    console.table(result.rows);
  });
}

app.post(create_route, (req, res) => {
  requestCounter++;
  let data = req.body;
  const term = data.term;
  const termLanguage = data.term_language;
  const definitionLanguage = data.definition_language;
  const definition = data.definition;

  const checkTermSql = "SELECT term FROM dictionary WHERE term = $1";
  con.query(checkTermSql, [term], (err, result) => {
    if (err) {
      console.error("Error checking term in dictionary:", err);
      res.status(500).json({ error: exists, request: data });
    } else if (result.rowCount > 0) {
      res.status(400).json({ error: exists, request: data });
    } else {
      const insertDataSql = insertSql;
      con.query(
        insertDataSql,
        [term, termLanguage, definition, definitionLanguage],
        (err, result) => {
          if (err) {
            console.error("Error inserting data:", err);
            res.status(500).json({ error: insertError, request: data });
          } else {
            dictionary[term] = definition;
            res.status(201).json({
              result: messageConstants.insertResults(data),
              request: data,
            });
            displayData();
          }
        }
      );
    }
  });
});

app.get(routesConstants.mainRoute, (req, res) => {
  requestCounter++;
  const term = req.params.word;
  const getDefinitionSql = "SELECT definition FROM dictionary WHERE term = $1";
  con.query(getDefinitionSql, [term], (err, result) => {
    if (err) {
      console.error("Error getting definition:", err);
      res
        .status(500)
        .json({ error: errorConstants.dictNotFound(term), request: term });
    } else if (result.rowCount > 0) {
      const definition = result.rows[0].definition;
      res
        .status(200)
        .json({
          result: `${term}: ${definition}`,
          exists: true,
          request: term,
        });
    } else {
      res
        .status(404)
        .json({ error: errorConstants.dictNotFound(term), request: term });
    }
  });
});

app.patch(routesConstants.mainRoute, (req, res) => {
  requestCounter++;
  const term = req.params.word;
  const newDefinition = req.body.definition;
  const newTermLanguague = req.body.termLanguage;
  const newDefinitionLanguage = req.body.definitionLanguage;

  const updateDataSql =
    "UPDATE dictionary SET definition = $1, term_language = $2, definition_language = $3 WHERE term = $4";
  con.query(
    updateDataSql,
    [newDefinition, newTermLanguague, newDefinitionLanguage, term],
    (err, result) => {
      if (err) {
        console.error("Error updating definition:", err);
        res
          .status(500)
          .json({
            error: errorConstants.dictNotFound(term),
            request: {
              term,
              newDefinition,
              newTermLanguague,
              newDefinitionLanguage,
            },
          });
      } else if (result.rowCount > 0) {
        dictionary[term] = newDefinition;
        res.status(200).json({
          result: dbConstants.table.updateSuccess(term, newDefinition),
          request: {
            term,
            newDefinition,
            newTermLanguague,
            newDefinitionLanguage,
          },
        });
        displayData();
      } else {
        res
          .status(404)
          .json({
            error: errorConstants.dictNotFound(term),
            request: {
              term,
              newDefinition,
              newTermLanguague,
              newDefinitionLanguage,
            },
          });
      }
    }
  );
});

app.delete(routesConstants.mainRoute, (req, res) => {
  requestCounter++;
  const term = req.params.word;

  const deleteDataSql = "DELETE FROM dictionary WHERE term = $1";
  con.query(deleteDataSql, [term], (err, result) => {
    if (err) {
      console.error("Error deleting data:", err);
      res
        .status(500)
        .json({ error: errorConstants.dictNotFound(term), request: term });
    } else if (result.rowCount > 0) {
      delete dictionary[term];
      res
        .status(200)
        .json({
          result: dbConstants.table.deleteRowSuccess(term),
          request: term,
        });
      displayData();
    } else {
      res
        .status(404)
        .json({ error: errorConstants.dictNotFound(term), request: term });
    }
  });
});
function displayLanguagesFromTable(callback) {
  const sql = "SELECT name FROM language";

  con.query(sql, (err, result) => {
    if (err) {
      console.error("Error fetching languages:", err);
      callback({ error: "Error fetching languages" });
    } else {
      const languages = result.rows.map((row) => row.name);
      callback(languages);
    }
  });
}
app.get(languages_route, (req, res) => {
  displayLanguagesFromTable((languages) => {
    res.status(200).json(languages);
  });
});

app.listen(PORT, () => {
  console.log(messageConstants.serverUp(PORT));
});
// deleteAllRows();
