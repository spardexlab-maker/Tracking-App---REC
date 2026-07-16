const path = require('path');
const sails = require('sails');
const rc = require('sails/accessible/rc');

// Change working directory to server directory so Sails loads its configs, controllers, and models correctly
const serverDir = path.resolve(__dirname, '..', 'server');
process.chdir(serverDir);

// Configure Sails to load quietly
const config = rc('sails');
config.log = { level: 'silent' };
config.hooks = {
  ...config.hooks,
  grunt: false // Disable Grunt hook as it is not needed and fails in serverless
};

let sailsApp = null;
let liftPromise = null;

const ensureSailsLoaded = () => {
  if (sailsApp) {
    return Promise.resolve(sailsApp);
  }
  if (liftPromise) {
    return liftPromise;
  }

  liftPromise = new Promise((resolve, reject) => {
    sails.load(config, (err) => {
      if (err) {
        liftPromise = null;
        return reject(err);
      }
      sailsApp = sails;
      resolve(sailsApp);
    });
  });

  return liftPromise;
};

module.exports = async (req, res) => {
  try {
    const app = await ensureSailsLoaded();
    // Forward the request and response to Sails HTTP hook express application
    app.hooks.http.app(req, res);
  } catch (err) {
    res.status(500).send(`Serverless Sails Boot Error: ${err.message}\n${err.stack}`);
  }
};
