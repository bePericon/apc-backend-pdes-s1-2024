import { Controller, Get } from '@overnightjs/core';
import Logger from 'jet-logger';
import { Request, Response } from 'express';

@Controller('metrics')
export default class MetricsController {
  @Get('')
  private async metrics(req: Request, res: Response) {
    Logger.info(req.body, true);

    res.setHeader('Content-Type', req.metrics.register.contentType);
    res.send(await req.metrics.register.metrics());
  }
}
