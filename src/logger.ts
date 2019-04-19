import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-dd HH:mm:ss'
        }),
        myFormat
    ),
    transports: [
        new transports.Console(),
    ]
});

export default logger;