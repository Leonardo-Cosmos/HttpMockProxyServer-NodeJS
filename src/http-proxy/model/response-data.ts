/* 2018/8/5 */

const headerContentType = 'content-type';
const contentApplicationJavascript = 'application/x-javascript';
const contentApplicationJson = 'application/json';
const contentTextType = 'text/';
const contentCharsetUTF8 = 'charset=utf-8';

/**
 * Wrapper of HTTP response data.
 */
export class ResponseData {

    constructor(
        public headers,
        public body: string) {
    }

    /**
     * Check if content is text type.
     * @param contentType 
     */
    private static isTextContentType(contentType: string): boolean {
        if (!contentType) {
            return false;
        }

        return contentType.includes(contentTextType) || contentType.includes(contentCharsetUTF8) ||
            contentType.includes(contentApplicationJavascript) || contentType.includes(contentApplicationJson);
    }

    /**
     * Build body string by buffer of response stream.
     * @param headers 
     * @param bodyBuffer 
     */
    public static buildBody(headers, bodyBuffer: Buffer): string {
        let contentType = headers[headerContentType];
        if (ResponseData.isTextContentType(contentType)) {
            return bodyBuffer.toString('utf-8');
        } else {
            return bodyBuffer.toString('base64');
        }
    }

    /**
     * Parse body string to buffer of response stream.
     * @param headers 
     * @param bodyString 
     */
    public static parseBody(headers, bodyString: string): Buffer {
        let contentType = headers[headerContentType];
        if (ResponseData.isTextContentType(contentType)) {
            return Buffer.from(bodyString, 'utf-8');
        } else {
            return Buffer.from(bodyString, 'base64');
        }
    }

}

