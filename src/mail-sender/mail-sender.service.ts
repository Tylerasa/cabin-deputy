import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { LogService } from 'src/logger/logger.service';
import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';

// ... existing imports ...

interface IMailQueueTask {
  options: ISendMailOptions;
  retryCount: number;
}

@Injectable()
export class MailSenderService {
  private readonly logger = new Logger(MailSenderService.name);
  private emailQueue: IMailQueueTask[] = [];
  private processingQueue = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly DEFAULT_FROM = `"${process.env.APP_NAME || 'App'}" <${process.env.SENDGRID_FROM_EMAIL}>`;

  constructor(
    private readonly mailerService: MailerService,
    private readonly logService: LogService,
  ) {
    this.processQueue();
  }

  private async processQueue() {
    if (this.processingQueue) return;

    this.processingQueue = true;
    while (this.emailQueue.length > 0) {
      const task = this.emailQueue.shift();
      if (task) {
        try {
          await this.sendMailWithRetry(task);
        } catch (error) {
          this.logger.error(
            `Failed to send email after ${this.MAX_RETRIES} attempts`,
            error,
          );
          await this.logService.error(error);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    this.processingQueue = false;
  }

  private async sendMailWithRetry(task: IMailQueueTask): Promise<void> {
    try {
      console.log({ task });
      await this.mailerService.sendMail(task.options);
      this.logger.log(`Email sent successfully to ${task.options.to}`);
    } catch (error) {
      if (task.retryCount < this.MAX_RETRIES) {
        this.logger.warn(
          `Retrying email send. Attempt ${task.retryCount + 1}/${this.MAX_RETRIES}`,
        );
        task.retryCount++;
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        this.emailQueue.unshift(task);
      } else {
        throw error;
      }
    }
  }

  private enqueueEmailTask(options: ISendMailOptions): void {
    this.emailQueue.push({ options, retryCount: 0 });
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  async sendWelcomeMail(
    name: string,
    email: string,
    token: string,
  ): Promise<void> {
    const mailOptions: ISendMailOptions = {
      to: email,
      subject: 'Welcome to Opticash',
      template: 'welcome',
      context: {
        name,
        action_url: `${process.env.BASE_URL}/verify-email?token=${token}&email=${email}`,
      },
      from: this.DEFAULT_FROM,
    };

    this.enqueueEmailTask(mailOptions);
  }


  async sendMail(
    email: string,
    subject: string,
    template: string,
    context: Record<string, any>,
    emailFrom = this.DEFAULT_FROM,
    attachments?: any[],
  ): Promise<void> {
    this.logger.log(
      `Sending email to ${email} with subject ${subject} and template ${template}`,
    );
    const mailOptions: ISendMailOptions = {
      to: email,
      from: emailFrom,
      subject,
      template,
      context,
      attachments,
    };
    this.enqueueEmailTask(mailOptions);
  }
}
