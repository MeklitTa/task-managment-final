import { Controller, Post, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { serve } from 'inngest/express';
import { InngestService } from './inngest.service';

@Controller('api/inngest')
export class InngestController {
  constructor(private inngestService: InngestService) {}

  @All('*')
  async handleInngest(@Req() req: Request, @Res() res: Response) {
    const handler = serve({
      client: this.inngestService.client,
      functions: this.inngestService.getFunctions(),
    });

    return handler(req, res);
  }
}

