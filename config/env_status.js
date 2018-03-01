require('dotenv').load();

const env_status = 'prod'; // THIS ONE dev or prod
let dbs = {};

if (env_status == 'dev') {
    dbs.db = process.env.DEV_DB;
    dbs.db_logs = process.env.DEV_LOGS_DB;
} else if (env_status == 'prod') {
    dbs.db = process.env.PROD_DB;
    dbs.db_logs = process.env.PROD_LOGS_DB;
}

export default dbs;


/*
El estado del entorno puede ser dev (en desarrollo) o prod (en producción). 
En caso que el entorno esté en desarrollo se seleccionarán las bases de datos
de desarrollo. En caso que el entorno esté en producción se seleccionarán las bases
de datos de producción.
*/