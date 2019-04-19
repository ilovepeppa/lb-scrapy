import Spider from '../spider';
import Response from '../response';

export interface Item {
    [key: string]: any;
}

export default abstract class ItemPipeline {
    abstract process_item(item: Item, response: Response, spider: Spider): Item | void;
}
