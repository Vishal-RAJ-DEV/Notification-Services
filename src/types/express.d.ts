declare namespace Express {
  interface Request {
    requestId?: string;
    correlationId?: string;
    user?: {
      id: string;
      roles: string[];
    };
  }

  interface Response {
    responseTime?: number;
  }
}

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
  }
}
