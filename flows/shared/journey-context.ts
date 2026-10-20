/** The notifications a test has created, in the order it created them. */
export class JourneyContext {
  private readonly recorded: string[] = [];

  get referenceNumbers(): readonly string[] {
    return this.recorded;
  }

  /** The reference number of the notification created most recently. */
  get referenceNumber(): string | undefined {
    return this.recorded.at(-1);
  }

  recordReferenceNumber(referenceNumber: string): void {
    this.recorded.push(referenceNumber);
  }
}
