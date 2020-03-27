declare module 'valvelet' {
  function valvelet(fn: Function, limit: number, interval: number, size?: number): Function;
  export default valvelet;
}
