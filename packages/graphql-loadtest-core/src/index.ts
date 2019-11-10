type Config = {
  endpoint: string;
  body: any;
  cycles: number;
  counts: number;
};

type Stats = {};

export async function loadTest({
  endpoint,
  body,
  cycles,
  counts,
}: Config): Promise<Stats> {
  const elapsedTimes = [];
  for (let cycle = 0; cycle < cycles; cycle++) {
    const cycleElapsedTimes = [];
    for (let count = 0; count < counts; count++) {
      const timeStart = Date.now();

      // Only assign mostRecentReponseBody at the end of the loop to be more efficient
      await fetcher({ body, endpoint });

      const timeEnd = Date.now();
      const timeElapsed = timeEnd - timeStart;
      cycleElapsedTimes.push(timeElapsed);
    }
    elapsedTimes.push(cycleElapsedTimes);
  }

  let totalDuration = 0;
  for (let i = 0; i < elapsedTimes.length; i++) {
    const cycleElapsedTimes = elapsedTimes[i];
    const cycleDuration = calculateSum(cycleElapsedTimes);
    const cycleAverage = calculateAverage(cycleElapsedTimes);
    console.log(`total duration for cycle ${i + 1}: ${cycleDuration}ms`);
    console.log(`average duration for cycle ${i + 1}: ${cycleAverage}ms`);
    totalDuration += cycleDuration;
  }
  console.log(
    `benchmarking took ${totalDuration}ms for ${counts} requests over ${cycles} cycles`
  );

  return {};
}

function calculateSum(args: number[]) {
  return args.reduce((accumulator, current) => accumulator + current);
}

function calculateAverage(args: number[]) {
  return Math.round(calculateSum(args) / args.length);
}

type FetchParams = {
  body: any;
  endpoint: string;
};

async function fetcher(params: FetchParams) {
  const response = await fetch(params.endpoint, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params.body),
  });
  return await response.json();
}
