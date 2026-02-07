import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // Global so AuthModule can use it without imports
@Module({
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }
