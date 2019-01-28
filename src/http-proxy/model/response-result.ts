import { IncomingHttpHeaders } from "http";

export class ResponseResult {

    public statusCode: number;

    public bodyBuffer: Buffer;

    public headers: IncomingHttpHeaders;

}
