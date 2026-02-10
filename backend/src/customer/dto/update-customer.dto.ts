import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

// KTP number cannot be changed after creation
export class UpdateCustomerDto extends PartialType(
    OmitType(CreateCustomerDto, ['ktpNumber'] as const),
) { }
