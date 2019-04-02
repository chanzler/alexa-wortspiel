process.env.PLUGIN_DIR = __dirname + '/plugins';

module.exports = {
  "serverPort": 3000,
  "numCores": 3, // number of cpu cores to use or 0 = use all cores
  "expressLogLevel": "dev", //combined|common|dev|short|tiny

  "mysqlUser": "user",
  "mysqlPassword": "password",
  "mysqlDB": "alexa_wortspiel",
  "mysqlHost": "localhost",
  "mysqlPort": "3306"
};

