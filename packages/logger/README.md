# @type-assistant/logger

A wrapper around [Pino](https://github.com/pinojs/pino). Used to log to the console, and to a log file.

The default is `log.txt`. To alter the log file location, you can set the `LOG_FILE` environment variable. This is relative to the current working directory, i.e. your application root.

## quietLogger

This will only log to the file, not to the console. This is probably what you want to use inside the ink app, so that it doesn't interrupt ink's logging.

## logger

This will log to both the file and the console.