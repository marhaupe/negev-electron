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
import { from } from "rxjs";
import * as path from "path";
import * as fs from "fs-extra";

function parseHeader(input: string[]): Record<string, string> {
  const headers: Record<string, string> = {};
  input.forEach((keyValuePair) => {
    let [key, value] = keyValuePair.split(":");
    key = key.trim();
    value = value.trim();
    headers[key] = value;
  });
  return headers;
}

class GraphqlLoadtestCli extends Command {
  static description = "Run loadtests against your GraphQL backend.";

  static usage = "graphql-loadtest-cli [...options]";

  static flags = {
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    headers: flags.string({
      char: "H",
      description:
        'request header. can be set multiple times. example: -H="Content-Type: application/json"',
      multiple: true,
    }),
    endpoint: flags.string({
      char: "e",
      description: "the endpoint to test",
    }),
    query: flags.string({
      char: "q",
      description: "the query to use",
    }),
    rateLimit: flags.integer({
      char: "r",
      description: "the limit of requests per second",
    }),
    concurrencyLimit: flags.integer({
      char: "c",
      description: "the limit of concurrent requests",
    }),
    duration: flags.integer({
      char: "d",
      description: "the total duration of the loadtest",
      exclusive: ["numberRequests"],
    }),
    numberRequests: flags.integer({
      char: "n",
      description: "the number of requests to send",
      exclusive: ["duration"],
    }),
  };

  getConfigFromFlags(): Record<string, any> | null {
    const { flags } = this.parse(GraphqlLoadtestCli);
    if (Object.keys(flags).length === 0) {
      return null;
    }
    const config: Record<string, any> = flags;
    if (config.headers) {
      config.headers = parseHeader(config.headers);
    }
    return config;
  }

  answerFilePath = path.join(this.config.dataDir, "answers.json");

  saveAnswers(answers: any) {
    fs.ensureFileSync(this.answerFilePath);
    fs.writeJsonSync(this.answerFilePath, answers);
  }

  readSavedAnswers() {
    fs.ensureFileSync(this.answerFilePath);
    return fs.readJsonSync(this.answerFilePath, { throws: false });
  }

  clearSavedAnswers() {
    fs.removeSync(this.answerFilePath);
  }

  getQuestions() {
    inquirer.registerPrompt("editor", require("./Editor.js"));

    const savedAnswers = this.readSavedAnswers();

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

    const LoadTestType = {
      numberRequests: "I want to set a fixed number of requests.",
      duration: "I want to run the loadtest for a specified duration.",
    };

    const askEndpoint = {
      type: "text",
      name: "endpoint",
      message: "What URL should I loadtest for you?",
      default: savedAnswers?.endpoint ?? "http://localhost:4000",
      validate: async function validateURL(
        url: string
      ): Promise<true | string> {
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

    const askShouldAskHeaders = {
      type: "confirm",
      name: "shouldAskHeaders",
      message: "Do you want to set any headers?",
      default: savedAnswers?.shouldAskHeaders ?? false,
    };

    const askHeaders = {
      type: "editor",
      name: "headers",
      default: savedAnswers?.headers
        ? JSON.stringify(savedAnswers.headers, null, 2)
        : "{\n" + '  "Content-Type": "application/json",\n' + "}\n",
      message: "Which headers does your query need?",
      when: (answers: any): boolean => answers.shouldAskHeaders,
      filter: (input: string): any => {
        let lines = input.split("\n");
        lines = lines
          .filter((line) => !line.startsWith("#"))
          .filter((line) => line.trim().length !== 0);
        const headersJson = lines.join("\n");
        try {
          return JSON.parse(headersJson);
        } catch {
          this.warn(
            "error parsing headers, continuing without setting headers"
          );
          return {};
        }
      },
    };

    const askQuery = {
      type: "editor",
      name: "query",
      default:
        savedAnswers?.query ??
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

    const askLoadtestType = {
      type: "list",
      name: "loadtestType",
      message: "Which type of loadtest do you want to run?",

      choices: [LoadTestType.duration, LoadTestType.numberRequests],
      default: savedAnswers?.loadtestType ?? LoadTestType.duration,
    };

    const askNumberRequests = {
      type: "number",
      name: "numberRequests",
      default: savedAnswers?.numberRequests ?? DEFAULT_NUMBER_REQUESTS,
      message: "How many requests do you want to send?",
      when: (answers: any): boolean =>
        answers.loadtestType === LoadTestType.numberRequests,
      validate: validateNumber,
    };

    const askDuration = {
      type: "number",
      name: "duration",
      default: savedAnswers?.duration ?? DEFAULT_DURATION,
      message: "How long (in seconds) should the loadtest take?",
      when: (answers: any): boolean =>
        answers.loadtestType === LoadTestType.duration,
      validate: validateNumber,
    };

    const askShouldAskRateLimit = {
      type: "confirm",
      name: "shouldAskRateLimit",
      message: "Do you want to limit the number of requests sent per second?",
      default: savedAnswers?.shouldAskRateLimit ?? false,
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
      default: savedAnswers?.concurrencyLimit ?? DEFAULT_CONCURRENCY_LIMIT,
      message: "How many workers should concurrently send requests?",
      validate: validateNumber,
    };

    return [
      askShouldAskHeaders,
      askHeaders,
      askEndpoint,
      askQuery,
      askLoadtestType,
      askDuration,
      askNumberRequests,
      askShouldAskRateLimit,
      askRateLimit,
      askConcurrencyLimit,
    ];
  }

  async getConfigFromPrompt(): Promise<Record<string, any>> {
    const questions = this.getQuestions();
    const observable = from(questions);

    return new Promise((resolve, reject) => {
      let answers: Record<string, any> = {};
      inquirer.prompt(observable as any).ui.process.subscribe(
        (answer) => {
          answers[answer.name] = answer.answer;
          this.saveAnswers(answers);
        },
        (err) => reject(err),
        () => {
          // We're clearing the saved answers because I'd rather be cautious having
          // a persistent component in our application. Once I'm sure that things won't break
          // without the answer being "Just go delete <file-we-store-the-answers>", I'm deleting
          // next line since I personally like having my choices remembered.
          this.clearSavedAnswers();
          resolve(answers);
        }
      );
    });
  }

  async run() {
    let config = this.getConfigFromFlags();
    if (!config) {
      config = await this.getConfigFromPrompt();
    }

    const spinner = ora("Running loadtest...").start();

    const loadtestResult = await executeLoadtest({
      endpoint: config.endpoint,
      query: config.query,
      duration: config.duration,
      headers: config.headers,
      numberRequests: config.numberRequests,
      rateLimit: config.rateLimit,
      concurrencyLimit: config.concurrencyLimit,
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
      this.exit(1);
    }

    this.log("");

    this.log("Summary:");

    this.printTable(
      { "Total requests:": loadtestResult.totalRequests },
      { "Loadtest duration:": loadtestResult.totalDuration + " ms" },
      { "Slowest:": loadtestResult.slowest + " ms" },
      { "Fastest:": loadtestResult.fastest + " ms" },
      { "Average:": loadtestResult.average + " ms" },
      { "Requests/sec:": loadtestResult.requestsPerSecond }
    );

    this.log("");

    this.log("Histogram:");
    Object.keys(loadtestResult.histogram).forEach((bucket) => {
      this.log(`  ${bucket}ms: ${loadtestResult.histogram[Number(bucket)]}`);
    });

    this.log("");

    this.log("Latency Distribution:");
    this.log("  10% in " + loadtestResult.latencyDistribution[10] + " ms");
    this.log("  25% in " + loadtestResult.latencyDistribution[25] + " ms");
    this.log("  50% in " + loadtestResult.latencyDistribution[50] + " ms");
    this.log("  75% in " + loadtestResult.latencyDistribution[75] + " ms");
    this.log("  90% in " + loadtestResult.latencyDistribution[90] + " ms");
    this.log("  95% in " + loadtestResult.latencyDistribution[95] + " ms");
    this.log("  99% in " + loadtestResult.latencyDistribution[99] + " ms");

    this.log("");

    this.log("Error distribution:");
    this.printTable(
      { Successes: loadtestResult.errorDistribution.successCount },
      { Errors: loadtestResult.errorDistribution.errorCount }
    );

    const { flags } = this.parse(GraphqlLoadtestCli);
    if (Object.keys(flags).length === 0) {
      this.log("");
      const { shouldPrintConfig } = await inquirer.prompt({
        type: "confirm",
        name: "shouldPrintConfig",
        message:
          "Do you want me to print the config I used? This can be useful for scripting.",
        default: true,
      });
      if (shouldPrintConfig) {
        this.log("");
        this.printConfig(config);
      }
    }

    this.exit(0);
  }

  printConfig({
    headers,
    endpoint,
    query,
    rateLimit,
    concurrencyLimit,
    duration,
    numberRequests,
  }: any) {
    this.log("graphql-loadtest-cli \\");
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        this.log(`  -H="${key}: ${value}" \\`);
      }
    }
    endpoint && this.log(`  -e="${endpoint}" \\`);
    query &&
      this.log(
        `  -q="${query
          .replace(/\n/g, "")
          .replace(/'/g, '"')
          .replace(/"/g, '\\"')}" \\`
      );
    rateLimit && this.log(`  -r=${rateLimit} \\`);
    concurrencyLimit && this.log(`  -c=${concurrencyLimit} \\`);
    duration && this.log(`  -c=${duration} \\`);
    numberRequests && this.log(`  -n=${numberRequests} \\`);
  }

  printTable(...args: any) {
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
    this.log(table.toString());
  }
}

export = GraphqlLoadtestCli;
