import Request from '../request';
import Response from '../response';
import Spider from '../spider'
import Settings from '../settings/settings';
import DownloadMiddleware from './index';
import logger from '../logger';

export default class RetryDownloadMiddleware extends DownloadMiddleware {

    max_retry_count: number = Settings.getInstance().get('RETRY_COUNT');
    retry_status_codes: number[] = Settings.getInstance().get('RETRY_STATUS_CODES');
    retry_exception = [];

    process_request(request: Request, spider: Spider): void { }

    process_response(request: Request, response: Response): Response | Request | null {
        if (!response) {
            return response;
        }
        if (this.retry_status_codes.indexOf(response.status) > -1) {
            let reason = `status code ${response.status}`;
            return this.retry(request, response, reason);
        }
        return response;
    }

    private retry(request: Request, response: Response, reason: string): Request | null {
        let retry_count = ('retry_count' in request.meta ? request.meta['retry_count'] : 0) + 1;
        if (retry_count < this.max_retry_count) {
            logger.info(`Retrying <${request.method} ${request.url}> : ${reason} (Failed ${retry_count} times)`);
            request.meta['retry_count'] = retry_count;
            return request;
        } else {
            logger.info(`Gave up retry <${request.method} ${request.url}> : ${reason} (Failed ${retry_count} times)`);
            return null;
        }
    }

}