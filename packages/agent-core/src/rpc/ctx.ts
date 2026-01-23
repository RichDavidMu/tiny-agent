export class Context {
  req: Request;
  res: Response;
  constructor(req: Request) {
    this.req = req;
    this.res = new Response();
  }
}
