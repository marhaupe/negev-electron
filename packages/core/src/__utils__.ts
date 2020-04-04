export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function isError(e: any): boolean {
  return e && e.stack && e.message && typeof e.stack === 'string' && typeof e.message === 'string';
}
