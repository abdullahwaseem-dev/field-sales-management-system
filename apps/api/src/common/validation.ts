import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/** `@Body(new Zod(schema))` — validates and returns the parsed (typed, defaulted) value. */
@Injectable()
export class Zod<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}
  transform(value: unknown, _meta: ArgumentMetadata): T {
    return this.schema.parse(value);
  }
}
