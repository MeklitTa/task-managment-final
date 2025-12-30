import { Controller, Post, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { serve } from 'inngest/express';
import { InngestService } from './inngest.service';

@Controller('api/inngest')
export class InngestController {
  constructor(private inngestService: InngestService) {}

  @All('*')
  async handleInngest(@Req() req: Request, @Res() res: Response) {
    try {
      const handler = serve({
        client: this.inngestService.client,
        functions: this.inngestService.getFunctions(),
      });

      // Ensure the handler is called and response is handled properly
      await handler(req, res);
      return res;
    } catch (error) {
      console.error('[INNGEST] Error handling Inngest webhook:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

