export function calculateSum(args: number[]) {
  return args.reduce((accumulator, current) => accumulator + current);
}

export function calculateAverage(args: number[]) {
  return Math.round(calculateSum(args) / args.length);
}

export async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
