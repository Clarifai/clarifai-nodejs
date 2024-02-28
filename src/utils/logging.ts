import { createLogger, format, transports } from "winston";
import chalk from "chalk";

const myFormat = format.printf(({ level, message, timestamp }) => {
  return `${chalk.green(timestamp)} [${level}]: ${message}`;
});

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    myFormat,
  ),
  transports: [new transports.Console()],
});

export const addFileTransport = (filePath: string, level: string = "warn") => {
  const fileTransport = new transports.File({ filename: filePath, level });
  logger.add(fileTransport);
};
