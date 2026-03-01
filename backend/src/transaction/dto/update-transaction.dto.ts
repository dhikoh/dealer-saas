import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

// Allow updating all fields EXCEPT vehicleId and customerId (immutable after creation)
export class UpdateTransactionDto extends PartialType(
    OmitType(CreateTransactionDto, ['vehicleId', 'customerId'] as const),
) { }
