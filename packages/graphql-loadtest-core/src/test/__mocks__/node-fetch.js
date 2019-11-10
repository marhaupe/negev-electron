const nodeFetch = jest.requireActual('node-fetch');
const fetchMock = require('fetch-mock').sandbox();

fetchMock.mock('http://example.com/query', { data: {} });
Object.assign(fetchMock.config, nodeFetch, {
  fetch: nodeFetch,
});
module.exports = fetchMock;
