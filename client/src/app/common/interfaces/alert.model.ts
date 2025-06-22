export interface Alert {
    severity : 'success' | 'warn' | 'info' | 'error',
    summary : string,
    life : number
}