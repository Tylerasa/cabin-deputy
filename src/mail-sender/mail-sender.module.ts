import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { join } from 'node:path';

import { MailSenderService } from './mail-sender.service';

@Module({
  providers: [MailSenderService],
  exports: [MailSenderService],
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      },
      preview: false,
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(
          {
            splitToken: (token) => token.split(''),
          },
          {
            inlineCssEnabled: true,
            // inlineCssOptions: {
            //   preserveMediaQueries: true,
            // },
          },
        ),
        options: {
          strict: true,
        },
      },
      options: {
        strict: true,
        partials: {
          dir: join(__dirname, 'templates/partials'),
          options: {
            strict: true,
          },
        },
      },
    }),

  ],
})
export class MailSenderModule {}
