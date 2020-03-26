import { GluegunCommand, http } from 'gluegun'
import fetch from 'node-fetch'
import * as inquirer from 'inquirer'
import { introspectionQuery, parse, buildClientSchema, validate } from 'graphql'

async function validateQuery(
  query: string,
  prevAnswers: Record<string, any>
): Promise<true | string> {
  // Removes non-breaking spaces such as \u00A0
  query = query.replace(/\s+/g, ' ')
  query = query.replace(/\s/g, ' ')

  const response = await http
    .create({
      baseURL: prevAnswers.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...prevAnswers?.headers,
      },
    })
    .post<any, any>('', {
      query: introspectionQuery,
    })

  const schema = buildClientSchema(response?.data?.data)
  const queryDocument = parse(query)
  const errors = validate(schema, queryDocument)
  if (errors && errors.length > 0) {
    return errors[0].message
  }
  return true
}

async function validateURL(url: string): Promise<true | string> {
  return fetch(url)
    .then((response) => {
      if (response.status === 404) {
        return 'Invalid URL: 404'
      }
      return true
    })
    .catch((error) => {
      return 'Invalid URL: ' + error.toString()
    })
}

function validateNumber(input: string): true | string {
  const error = 'Please enter an integer'
  try {
    const num = parseInt(input, 10)
    if (isNaN(num)) {
      return error
    }
    if (typeof num === 'number') {
      return true
    }
    return
  } catch {
    return error
  }
}

const askEndpoint = {
  type: 'text',
  name: 'endpoint',
  message: 'What URL should I loadtest for you?',
  default: 'http://localhost:4000',
  validate: validateURL,
}

const askHeaders = {
  type: 'editor',
  name: 'headers',
  default:
    '# Example:\n' +
    '# Content-Type: application/json\n' +
    '# Authorization: Basic d2lraTpwZWRpYQ==\n',
  message: 'Which headers does your query need?',
  filter: (input: string): any => {
    let lines = input.split('\n')
    lines = lines
      .filter((line) => !line.startsWith('#'))
      .filter((line) => line.trim().length !== 0)
    const headers = {}
    lines.forEach((keyValuePair) => {
      let [key, value] = keyValuePair.split(':')
      key = key.trim()
      value = value.trim()
      headers[key] = value
    })
    return headers
  },
}

const askQuery = {
  type: 'editor',
  name: 'query',
  default:
    '# Example query:\n' +
    '#{ \n' +
    '#  books { \n' +
    '#    author \n' +
    '#  } \n' +
    '#}\n',
  message: 'What query should I loadtest for you?',
  validate: validateQuery,
}

const askNumberRequests = {
  type: 'number',
  name: 'numberRequests',
  default: 0,
  message: 'How many requests do you want to run at most? (0 = no limit)',
  validate: validateNumber,
}

const askNumberWorkers = {
  type: 'number',
  name: 'numberWorkers',
  default: 10,
  message: 'How many workers should concurrently send requests?',
  validate: validateNumber,
}

const askRateLimit = {
  type: 'number',
  name: 'rateLimit',
  default: 0,
  message: 'How many queries should I send per second at most? (0 = no limit)',
  validate: validateNumber,
}

const askDuration = {
  type: 'number',
  name: 'duration',
  default: 10,
  message: 'How long should the loadtest take? (in seconds)',
  validate: validateNumber,
}

const command: GluegunCommand = {
  name: 'graphql-loadtest-cli',
  run: async () => {
    const result = await inquirer.prompt([
      askHeaders,
      askEndpoint,
      askQuery,
      askDuration,
      askNumberRequests,
      askNumberWorkers,
      askRateLimit,
    ])

    console.log('result', result)
  },
}

export default command
