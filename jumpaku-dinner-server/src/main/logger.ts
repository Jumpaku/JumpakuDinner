import log4js from "log4js";

let logger: log4js.Logger | undefined = undefined;

const logLevel = "all";
export function getLogger(): log4js.Logger {
  if (logger == null) {
    logger = log4js.getLogger();
    logger.level = logLevel;
  }
  return logger;
}
