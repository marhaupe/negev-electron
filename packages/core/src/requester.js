// This file gets run in a node worker. In the worker, we can only run plain JS.
// This should be the first thing that gets improved as I really miss Typescript here.
const valvelet = require('valvelet');

function executeRequests({ request, numberRequests, rateLimit }, doneCallback) {
  const results = [];

  function execute() {
    results.push(
      executeQuery(request)
        .then(response => {
          return response;
        })
        .catch(error => {
          return error;
        })
    );
  }

  const limitedExecuteFunction = rateLimit ? valvelet(execute, rateLimit, 1000) : execute;

  for (let i = 0; i < numberRequests; i++) {
    limitedExecuteFunction();
  }

  console.log('invoking callback with results', results.length);
  doneCallback(null, results);
}

async function executeQuery(request) {
  const startHrTime = process.hrtime();

  const response = await fetch(request);

  const durationHrTime = process.hrtime(startHrTime);

  const json = await response.json();
  let errors = undefined;
  if (json.errors && json.errors.length > 0) {
    errors = json.errors.map(error => JSON.stringify(error));
  }

  return {
    duration: durationHrTimeToMs(durationHrTime),
    statusCode: response.status,
    errors,
  };
}

function durationHrTimeToMs(hrtime) {
  return hrtime[0] * 1e6 + hrtime[1] / 1e6;
}

module.exports = executeRequests;
