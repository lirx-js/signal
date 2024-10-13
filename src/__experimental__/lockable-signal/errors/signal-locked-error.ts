export class SignalLockedError extends Error {
  constructor(message: string = 'Signal locked.', options?: ErrorOptions) {
    super(message, options);
    this.name = 'SignalLockedError';
  }
}
