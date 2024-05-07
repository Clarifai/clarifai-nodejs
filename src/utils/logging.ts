import { createLogger, format, transports, LoggerOptions } from "winston";
import chalk from "chalk";

const consoleFormat = format.printf(({ level, message, timestamp }) => {
  let color;
  switch (level) {
    case "error":
      color = chalk.red;
      break;
    case "warn":
      color = chalk.yellow;
      break;
    case "info":
      color = chalk.green;
      break;
    default:
      color = chalk.green;
  }
  return `${color(timestamp)} [${color(level)}]: ${color(message)}`;
});

function setupTransports() {
  const transportArray: LoggerOptions["transports"] = [
    new transports.Console({
      silent: process.env.CLARIFAI_NODEJS_DEBUG !== "true",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        consoleFormat,
      ),
    }),
  ];

  const logFilePath = process.env.CLARIFAI_NODEJS_LOG_PATH;
  if (logFilePath) {
    transportArray.push(
      new transports.File({
        filename: logFilePath,
        format: format.combine(
          format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        ),
      }),
    );
  }

  return transportArray;
}

export const logger = createLogger({
  level: "info",
  transports: setupTransports(),
});
