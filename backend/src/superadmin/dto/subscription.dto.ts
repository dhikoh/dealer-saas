import { IsInt, Min, Max } from 'class-validator';

export class ExtendSubscriptionDto {
    @IsInt({ message: 'Months must be an integer' })
    @Min(1, { message: 'Minimum extension is 1 month' })
    @Max(36, { message: 'Maximum extension is 36 months (3 years)' })
    months: number;
}

export class ReduceSubscriptionDto {
    @IsInt({ message: 'Months must be an integer' })
    @Min(1, { message: 'Minimum reduction is 1 month' })
    months: number;
}
