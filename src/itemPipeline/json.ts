import ItemPipeline, { Item } from './index';
import Spider from '../spider';
import Response from '../response';
import logger from '../logger'

export default class JsonPipeline extends ItemPipeline {
    process_item(item: Item, response: Response, spider: Spider): Item {
        logger.info(`Scrapyed from <${response.status} ${response.url}>\n${JSON.stringify(item)}`);
        return item;
    }
}