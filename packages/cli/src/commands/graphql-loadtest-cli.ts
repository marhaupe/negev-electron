import { GluegunCommand } from 'gluegun'
import fetch from 'node-fetch'
import * as prompts from 'prompts'
import { introspectionQuery, parse, buildClientSchema, validate } from 'graphql'

let endpoint: string | undefined
let headers: { [key: string]: string } | undefined

async function validateQuery(query: string): Promise<true | string> {
  // Removes non-breaking spaces such as \u00A0
  query = query.replace(/\s/g, '')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query: introspectionQuery }),
  })

  const { data } = await response.json()

  const schema = buildClientSchema(data)
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

const askEndpoint: prompts.PromptObject = {
  type: 'text',
  name: 'endpoint',
  message: 'What URL should I loadtest for you?',
  initial: 'http://localhost:4000',
  validate: validateURL,
}

const askQuery: prompts.PromptObject = {
  type: 'text',
  name: 'endpoint',
  message: 'What query should I loadtest for you?',
  validate: validateQuery,
}

const askNumberRequests: prompts.PromptObject = {
  type: 'text',
  name: 'numberRequests',
  message: 'How many requests do you want to run?',
}

const askNumberWorkers: prompts.PromptObject = {
  type: 'text',
  name: 'numberWorkers',
  message: 'How many workers should concurrently send requests?',
}

const askRateLimit: prompts.PromptObject = {
  type: 'text',
  name: 'rateLimit',
  message: 'How many queries should I send per second at most?',
}

const askDuration: prompts.PromptObject = {
  type: 'text',
  name: 'duration',
  message: 'How long should the loadtest take?',
}

const command: GluegunCommand = {
  name: 'graphql-loadtest-cli',
  run: async () => {
    await prompts(
      [
        askEndpoint,
        askQuery,
        askDuration,
        askNumberRequests,
        askNumberWorkers,
        askRateLimit,
      ],
      {
        onSubmit: (prompt, answer) => {
          if (prompt.name === askEndpoint.name) {
            endpoint = answer
          }
        },
      }
    )
  },
}

export default command
