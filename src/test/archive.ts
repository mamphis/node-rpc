export class Archive {
    documents: Document[] = [];
    constructor(private name: string) {

    }

    getName(): string {
        return this.name;
    }

    addDocument(document: string): void {
        this.documents.push(new Document(document));
    }

    has(document: string): boolean {
        return this.documents.some(doc => doc.getName() === document);
    }
}

export class Document {
    constructor(private name: string) {

    }

    getName(): string {
        return this.name;
    }
}