# final-decorator

Runtime TypeScript decorator for marking classes and methods as final.

## Install

```bash
npm install final-decorator
```

## Usage

```ts
import { Final } from 'final-decorator';

@Final
class Foo {
  method() {}
}

class Bar {
  @Final
  method() {}
}
```

Use this package in production/runtime code.
Use `eslint-plugin-final` as a dev dependency for lint enforcement.
