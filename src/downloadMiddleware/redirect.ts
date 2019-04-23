import { resolve as urlResolve } from 'url';
import Request from '../request';
import Response from '../response';
import Spider from '../spider'
import Settings from '../settings/settings';
import DownloadMiddleware from './index';
import logger from '../logger';

export default class RedirectDownloadMiddleware extends DownloadMiddleware {

    process_request(request: Request, spider: Spider): void { }

    process_response(request: Request, response: Response): Response | Request | null {
        if (!Settings.getInstance().get('ENABLE_REDIRECT') || response === null) {
            return response;
        }
        if (Settings.getInstance().get('REDIRECT_STATUS_CODE').indexOf(response.status) > -1) {
            return this.redirect(request, response);
        }

        return response;
    }

    private redirect(request: Request, response: Response): Request {
        let ori_url = request.url;
        request.url = urlResolve(request.url, response.headers['location']);
        logger.info(`Redirecting (${response.status}) to <${request.method} ${request.url}> from <${request.method} ${ori_url}>`);
        return request;
    }

}