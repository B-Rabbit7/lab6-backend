
module.exports = {
    database: {
        table: {
            create: "CREATE TABLE IF NOT EXISTS dictionary (id SERIAL PRIMARY KEY, term VARCHAR(100), term_language VARCHAR(50), definition VARCHAR(100), definition_language VARCHAR(50))",
            queryAll: "SELECT * FROM dictionary",
            deleteAll: "DELETE FROM dictionary",
            insert: "INSERT INTO dictionary (term, term_language, definition, definition_language) VALUES ($1, $2, $3, $4)",
            deleteError: "Error deleting rows from the database:",
            deleteSuccess: "All rows deleted from the 'dictionary' table:",
            insertError: (data)=> `Error inserting data into the database: ${data}`,
            update: `UPDATE dictionary SET definition = $1, term_language = $2, definition_language = $3 WHERE term = $4`,
            updateError: (term)=>`Error updating the definition of the term: ${term}`,
            updateSuccess: (term, newDefinition, newTermLanguague, newDefinitionLanguage) => `
            <span style="color: blue;"><strong>Term updated:</strong></span><br>
            <span style="color: green;">${term} (<i>${newTermLanguague}</i>)</span> : 
            <span style="color: purple;">${newDefinition} (<i>${newDefinitionLanguage}</i>)</span>`,
            deleteRow: "DELETE FROM dictionary WHERE term = $1",
            deleteRowError: "Error deleting data from the database. Word does not exist in the database!",
            deleteRowSuccess: (term) => `Term "${term}" deleted successfully.`,
            createLanguageTable: "CREATE TABLE IF NOT EXISTS language (id SERIAL PRIMARY KEY, name VARCHAR(100))",
            insertLanguage: "INSERT INTO language (name) VALUES ($1)",
            errorInsertLanguage: (language) => `Error inserting language: ${language}`,
            successInsertLanguage: (language)=> `Language inserted: ${language}`,
            deleteLanguageQuery: "DELETE FROM language",
            errorDeleteLanguages: "Error deleting all languages:",
            successDeleteLanguages: "All rows deleted from the 'languages' table.",
            displayLanguagesQuery: "SELECT * FROM language",
            errorDisplayLanguage: "Error fetching languages from the language table:",
            successDisplayLanguage:"Successfully added Languages to the table. Languages in the 'language' table:" ,
            checkTermQuery: "SELECT term FROM dictionary WHERE term = $1",
            errorCheckTerm: (term)=> `Error checking the following term in dictionary: ${term}`,
            checkDefinitionQuery: "SELECT definition, term_language, definition_language FROM dictionary WHERE term = $1",
            errorCheckDefinition: (term)=>`Error getting definition for term: ${term} `,





        },
    },
    errors: {
        pgError: "PostgreSQL client error:",
        cantConnect: "Error connecting:",
        fetchError: "Error fetching data:",
        exists: (term)=> `Warning, term ${term} already exists`,
        dictNotFound: (term) => `Term "${term}" not found in the database`,
    },
    messages: {
        connected: "Connected to PostgreSQL!",
        allDataDisplayed: 'Data from the "dictionary" table:',
        insertResults: (data) => `
      <div>
        <strong style="color: #0074D9;">New entry recorded:</strong>
      </div>
      <div>
        <strong>Term:</strong> ${data.term}
      </div>
      <div>
        <strong>Term Language:</strong> ${data.term_language}
      </div>
      <div>
        <strong>Definition:</strong> ${data.definition}
      </div>
      <div>
        <strong>Definition Language:</strong> ${data.definition_language}
      </div>
    `,
        serverUp: (port) => `Server is running on port ${port}`,
        getResults: (term,definition,term_language,definition_language)=>`
        <span style="color: blue;"><strong>${term}:</strong></span> 
        <span style="color: green;">${definition}</span><br>
        <span style="color: blue;"><strong>Term Language:</strong></span> 
        <span style="color: red;">${term_language}</span><br>
        <span style="color: blue;"><strong>Definition Language:</strong></span> 
        <span style="color: purple;">${definition_language}</span>`,
    },
    languages: [
        "English",
        "Española",
        "汉语 (Chinese Simplified)",
        "Française",
    ],
    routes: {
        mainRoute: "/definition/:word",
    }
};
