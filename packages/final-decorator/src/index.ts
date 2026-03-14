/* eslint-disable no-underscore-dangle */

type FinalAwareConstructor = {
  __finalMethods?: Set<PropertyKey>;
  __isFinalClass?: boolean;
};

type FinalClass = { prototype: object };

export function Final(target: FinalClass): void;
export function Final(target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): void;
export function Final(
  target: object | FinalClass,
  propertyKey?: PropertyKey,
  descriptor?: PropertyDescriptor
): void {
  if (propertyKey === undefined) {
    Object.defineProperty(target, '__isFinalClass', {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false,
    });

    return;
  }

  const ctor = (target as { constructor: FinalAwareConstructor }).constructor;

  if (ctor.__finalMethods === undefined) {
    Object.defineProperty(ctor, '__finalMethods', {
      value: new Set<PropertyKey>(),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  ctor.__finalMethods?.add(propertyKey);

  if (descriptor !== undefined) {
    // Optional runtime hardening for decorated methods.
    descriptor.writable = false;
  }
}
