import { Request, Response } from "express";

export interface HttpHandler {
    handle(req: Request, res: Response): void;
}
