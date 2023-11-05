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

const pgError = errorConstants.pgError;
const cantConnect = errorConstants.cantConnect;
const fetchError = errorConstants.fetchError;
const exists = errorConstants.exists;

const connectedMsg = messageConstants.connected;
const allDataDisplayedMsg = messageConstants.allDataDisplayed;

const availableLanguages = constants.languages;

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
    setTimeout(() => {
      connectToDatabase();
    }, 1000);
  });

  con
    .connect()
    .then(() => {
      console.log(connectedMsg);
      createTable();
      displayData();
    })
    .catch((err) => {
      console.error(cantConnect, err);
      setTimeout(() => {
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
deleteAllRows();

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
  let data = req.body;
  if (data.term in dictionary) {
    res.status(400).json({ error: exists });
  } else {
    dictionary[data.term] = data.definition;
    const values = [
      data.term,
      data.term_language,
      data.definition,
      data.definition_language,
    ];
    con.query(insertSql, values, (err, result) => {
      if (err) {
        console.error(insertError, err);
        res.status(500).json({ error: insertError });
      } else {
        res.status(201).json({
          result: messageConstants.insertResults(data),
        });
        displayData();
      }
    });
  }
});

app.get(routesConstants.mainRoute, (req, res) => {
  const term = req.params.word;
  if (term in dictionary) {
    res
      .status(200)
      .json({ result: `${term}: ${dictionary[term]}`, exists: true });
  } else {
    res.status(404).json({ error: errorConstants.dictNotFound(term) });
  }
});

app.patch(routesConstants.mainRoute, (req, res) => {
  const term = req.params.word;
  const newDefinition = req.body.definition;
  const newTermLanguague = req.body.termLanguage;
  const newDefinitionLanguage = req.body.definitionLanguage;
  if (term in dictionary) {
    dictionary[term] = newDefinition;
    const updateSql = dbConstants.table.update;
    const values = [
      newDefinition,
      newTermLanguague,
      newDefinitionLanguage,
      term,
    ];

    con.query(updateSql, values, (err, result) => {
      if (err) {
        console.error(dbConstants.table.updateError, err);
        res.status(500).json({ error: dbConstants.table.updateError });
      } else {
        res.status(200).json({
          result: dbConstants.table.updateSuccess(term, newDefinition),
        });
        displayData();
      }
    });
  } else {
    res.status(404).json({ error: errorConstants.dictNotFound(term) });
  }
});

app.delete(routesConstants.mainRoute, (req, res) => {
  const term = req.params.word;
  if (term in dictionary) {
    delete dictionary[term];
    const deleteSql = dbConstants.table.deleteRow;
    const values = [term];
    con.query(deleteSql, values, (err, result) => {
      if (err) {
        console.error(dbConstants.table.deleteRowError, err);
        res.status(500).json({ error: dbConstants.table.deleteRowError });
      } else {
        res
          .status(200)
          .json({ result: dbConstants.table.deleteRowSuccess(term) });
        displayData();
      }
    });
  } else {
    res.status(404).json({ error: errorConstants.dictNotFound(term) });
  }
});

app.get(languages_route, (req, res) => {
  res.status(200).json(availableLanguages);
});

app.listen(PORT, () => {
  console.log(messageConstants.serverUp(PORT));
});
