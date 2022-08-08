import { Archive } from "./archive";

export interface Service {
    getCurrentDate(): Date;
    toUpper(data: string): string;
    multiply(a: number, b: number): number;
    sleep(ms: number): Promise<{start: number, end: number}>
    createArchive(name: string): Archive;
    createArchives(name: string): [Archive, Archive, Archive];
}
