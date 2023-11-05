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
const deleteLanguageQuery = dbConstants.table.deleteLanguageQuery;
const errorDeleteLanguages = dbConstants.table.errorDeleteLanguages;
const successDeleteLanguages = dbConstants.table.successDeleteLanguages;
const displayLanguagesQuery = dbConstants.table.displayLanguagesQuery;
const errorDisplayLanguage = dbConstants.table.errorDisplayLanguage;
const successDisplayLanguage = dbConstants.table.successDisplayLanguage;
const checkTermQuery = dbConstants.table.checkTermQuery;
const errorCheckTerm = dbConstants.table.errorCheckTerm;
const checkDefinitionQuery = dbConstants.table.checkDefinitionQuery;
const errorCheckDefinition = dbConstants.table.errorCheckDefinition;
const update = dbConstants.table.update;
const updateError = dbConstants.table.updateError;
const deleteRow = dbConstants.table.deleteRow;
const deleteRowError = dbConstants.table.deleteRowError;
const deleteRowSuccess = dbConstants.table.deleteRowSuccess;
const selectSingleLanguageQuey = dbConstants.table.selectSingleLanguageQuey;
const errorSelectSingleLanguage = dbConstants.table.errorSelectSingleLanguage;

const pgError = errorConstants.pgError;
const cantConnect = errorConstants.cantConnect;
const fetchError = errorConstants.fetchError;
const exists = errorConstants.exists;

const connectedMsg = messageConstants.connected;
const allDataDisplayedMsg = messageConstants.allDataDisplayed;
const getResults = messageConstants.getResults;

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
  const deleteSql = deleteLanguageQuery;
  con.query(deleteSql, (err, result) => {
    if (err) {
      console.error(errorDeleteLanguages, err);
    } else {
      console.log(successDeleteLanguages);
    }
  });
}
deleteAllLanguages();


function displayLanguages() {
  const sql = displayLanguagesQuery;

  con.query(sql, (err, result) => {
    if (err) {
      console.error(errorDisplayLanguage, err);
      return;
    }
    console.log(successDisplayLanguage);
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

  const checkTermSql = checkTermQuery;
  con.query(checkTermSql, [term], (err, result) => {
    if (err) {
      console.error(errorCheckTerm(term), err);
      res.status(500).json({ error: exists(term), request: data });
    } else if (result.rowCount > 0) {
      res.status(400).json({ error: exists(term), request: data });
    } else {
      const insertDataSql = insertSql;
      con.query(
        insertDataSql,
        [term, termLanguage, definition, definitionLanguage],
        (err, result) => {
          if (err) {
            console.error(insertError(data), err);
            res.status(500).json({ error: insertError(data), request: data });
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
  const getDefinitionSql = checkDefinitionQuery;
  con.query(getDefinitionSql, [term], (err, result) => {
    if (err) {
      console.error(errorCheckDefinition, err);
      res
        .status(500)
        .json({ error: errorConstants.dictNotFound(term), request: term });
    } else if (result.rowCount > 0) {
      const { definition, term_language, definition_language } = result.rows[0];
      res
        .status(200)
        .json({
          result: getResults(term,definition,term_language,definition_language),
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

  const updateDataSql = update;
  con.query(
    updateDataSql,
    [newDefinition, newTermLanguague, newDefinitionLanguage, term],
    (err, result) => {
      if (err) {
        console.error(updateError(term), err);
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
          result: dbConstants.table.updateSuccess(term, newDefinition,newTermLanguague,newDefinitionLanguage),
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

  const deleteDataSql = deleteRow;
  con.query(deleteDataSql, [term], (err, result) => {
    if (err) {
      console.error(deleteRowError, err);
      res
        .status(500)
        .json({ error: errorConstants.dictNotFound(term), request: term });
    } else if (result.rowCount > 0) {
      delete dictionary[term];
      res
        .status(200)
        .json({
          result: deleteRowSuccess(term),
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
  const sql = selectSingleLanguageQuey;

  con.query(sql, (err, result) => {
    if (err) {
      console.error(errorSelectSingleLanguage, err);
      callback({ error: errorSelectSingleLanguage});
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
