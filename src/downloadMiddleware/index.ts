import Request from '../request';
import Response from '../response';
import Spider from '../spider';

export default abstract class DownloadMiddleware {
    abstract process_request(request: Request, spider: Spider): void;

    abstract process_response(request: Request, response: Response): Response | Request | null;
}