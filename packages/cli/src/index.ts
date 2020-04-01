import { Command, flags } from "@oclif/command";
import fetch from "node-fetch";
import * as inquirer from "inquirer";
import {
  introspectionQuery,
  parse,
  buildClientSchema,
  validate,
} from "graphql";
import {
  executeLoadtest,
  DEFAULT_CONCURRENCY_LIMIT,
  DEFAULT_DURATION,
  DEFAULT_NUMBER_REQUESTS,
} from "graphql-loadtest";
import ora from "ora";
import Table from "cli-table";

function validateNumber(input: string): true | string {
  try {
    const num = parseInt(input, 10);
    if (isNaN(num)) {
      return "Please enter an integer";
    }
    if (typeof num !== "number") {
      return "Please enter an integer";
    }
    if (num <= 0) {
      return "Please enter a value greater than zero.";
    }
    if (num >= Number.MAX_SAFE_INTEGER) {
      return "Please enter a smaller value.";
    }
    return true;
  } catch {
    return "Please enter an integer";
  }
}

const askEndpoint = {
  type: "text",
  name: "endpoint",
  message: "What URL should I loadtest for you?",
  default: "http://localhost:4000",
  validate: async function validateURL(url: string): Promise<true | string> {
    return fetch(url)
      .then((response) => {
        if (response.status === 404) {
          return "Invalid URL: 404";
        }
        return true;
      })
      .catch((error) => {
        return "Invalid URL: " + error.toString();
      });
  },
};

const askShoudAskHeaders = {
  type: "confirm",
  name: "shouldAskHeaders",
  message: "Do you want to set any headers?",
  default: false,
};

const askHeaders = {
  type: "editor",
  name: "headers",
  default:
    "# Example:\n" +
    "# Content-Type: application/json\n" +
    "# Authorization: Basic d2lraTpwZWRpYQ==\n",
  message: "Which headers does your query need?",
  when: (answers: any): boolean => answers.shouldAskHeaders,
  filter: (input: string): any => {
    let lines = input.split("\n");
    lines = lines
      .filter((line) => !line.startsWith("#"))
      .filter((line) => line.trim().length !== 0);
    const headers: Record<string, string> = {};
    lines.forEach((keyValuePair) => {
      let [key, value] = keyValuePair.split(":");
      key = key.trim();
      value = value.trim();
      headers[key] = value;
    });
    return headers;
  },
};

const askQuery = {
  type: "editor",
  name: "query",
  default:
    "# Example query:\n" +
    "{ \n" +
    "  books { \n" +
    "    author \n" +
    "  } \n" +
    "}\n",
  message: "What query should I loadtest for you?",
  validate: async function validateQuery(
    query: string,
    answers: Record<string, any>
  ): Promise<true | string> {
    // Removes non-breaking spaces such as \u00A0
    query = query.replace(/\u00A0+/g, " ");

    const response = await fetch(answers.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...answers?.headers,
      },
      body: JSON.stringify({ query: introspectionQuery }),
    });

    const { data } = await response.json();
    const schema = buildClientSchema(data);
    const queryDocument = parse(query);
    const errors = validate(schema, queryDocument);
    if (errors && errors.length > 0) {
      return errors[0].message;
    }
    return true;
  },
};

enum LoadTestType {
  numberRequests = "I want to set a fixed number of requests.",
  duration = "I want to run the loadtest for a specified duration.",
}

const askLoadtestType = {
  type: "list",
  name: "loadtestType",
  message: "Which type of loadtest do you want to run?",

  choices: [LoadTestType.duration, LoadTestType.numberRequests],
  default: LoadTestType.duration,
};

const askNumberRequests = {
  type: "number",
  name: "numberRequests",
  default: DEFAULT_NUMBER_REQUESTS,
  message: "How many requests do you want to send?",
  when: (answers: any): boolean =>
    answers.loadtestType === LoadTestType.numberRequests,
  validate: validateNumber,
};

const askDuration = {
  type: "number",
  name: "duration",
  default: DEFAULT_DURATION,
  message: "How long (in seconds) should the loadtest take?",
  when: (answers: any): boolean =>
    answers.loadtestType === LoadTestType.duration,
  validate: validateNumber,
};

const askShouldAskRateLimit = {
  type: "confirm",
  name: "shouldAskRateLimit",
  message: "Do you want to limit the number of requests sent per second?",
  default: false,
};

const askRateLimit = {
  type: "number",
  name: "rateLimit",
  message: "How many queries should I send per second at most?",
  when: (answers: any): boolean => answers.shouldAskRateLimit,
  validate: validateNumber,
};

const askConcurrencyLimit = {
  type: "number",
  name: "concurrencyLimit",
  default: DEFAULT_CONCURRENCY_LIMIT,
  message: "How many concurrent requests should I send at most?",
  validate: validateNumber,
};

class GraphqlLoadtestCli extends Command {
  static description = "describe the command here";

  static flags = {
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
  };

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(GraphqlLoadtestCli);

    const result = await inquirer.prompt([
      askShoudAskHeaders,
      askHeaders,
      askEndpoint,
      askQuery,
      askLoadtestType,
      askDuration,
      askNumberRequests,
      askShouldAskRateLimit,
      askRateLimit,
      askConcurrencyLimit,
    ]);

    const spinner = ora("Running loadtest...").start();

    const loadtestResult = await executeLoadtest({
      endpoint: result.endpoint,
      query: result.query,
      duration: result.duration,
      headers: result.headers,
      numberRequests: result.numberRequests,
      rateLimit: result.rateLimit,
      concurrencyLimit: result.concurrencyLimit,
    })
      .then((result) => {
        spinner.succeed();
        return result;
      })
      .catch((error) => {
        spinner.fail(error.toString());
        return null;
      });

    if (!loadtestResult) {
      return;
    }

    loadtestResult.average;

    console.log("");

    console.log("Summary:");

    printTable(
      { "Total requests:": loadtestResult.totalRequests },
      { "Loadtest duration:": loadtestResult.totalDuration + " ms" },
      { "Slowest:": loadtestResult.slowest + " ms" },
      { "Fastest:": loadtestResult.fastest + " ms" },
      { "Average:": loadtestResult.average + " ms" },
      { "Requests/sec:": loadtestResult.requestsPerSecond }
    );

    console.log("");

    console.log("Latency Distribution:");
    console.log("  10% in " + loadtestResult.latencyDistribution[10] + " ms");
    console.log("  25% in " + loadtestResult.latencyDistribution[25] + " ms");
    console.log("  50% in " + loadtestResult.latencyDistribution[50] + " ms");
    console.log("  75% in " + loadtestResult.latencyDistribution[75] + " ms");
    console.log("  90% in " + loadtestResult.latencyDistribution[90] + " ms");
    console.log("  95% in " + loadtestResult.latencyDistribution[95] + " ms");
    console.log("  99% in " + loadtestResult.latencyDistribution[99] + " ms");

    console.log("");

    console.log("Error distribution:");
    printTable(
      { Successes: loadtestResult.errorDistribution.successCount },
      { Errors: loadtestResult.errorDistribution.errorCount }
    );
  }
}

function printTable(...args: any) {
  const table = new Table({
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: " ",
    },
    colors: false,
    style: {
      head: [],
    },
  });
  table.push(...args);
  console.log(table.toString());
}
export = GraphqlLoadtestCli;
