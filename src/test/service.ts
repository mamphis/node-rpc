export interface Service {
    getCurrentDate(): Date;
    toUpper(data: string): string;
    multiply(a: number, b: number): number;
    sleep(ms: number): Promise<{start: number, end: number}>
}