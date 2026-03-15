# eslint-plugin-final monorepo

This repository contains two publishable packages:

- `eslint-plugin-final` in `packages/eslint-plugin-final`
- `final-decorator` in `packages/final-decorator`

## Install

```bash
npm install final-decorator
npm install --save-dev eslint-plugin-final
```

## Usage

### Setting up ESLint

```js
import finalPlugin from 'eslint-plugin-final';

export default [
  {
    files: ['**/*.ts'],
    plugins: {
      final: finalPlugin,
    },
    rules: {
      ...finalPlugin.configs.recommended.rules,
    },
  },
];
```

### Marking classes and methods final

```ts
import { Final } from 'final-decorator';

@Final
class FinalBase {
  keep(): void {}
}

class Child extends FinalBase { // ❌ Class FinalBase is marked with @Final and cannot be extended.
  keep(): void {}
}

class FinalMethodBase {
    @Final
    keep(): void {}
}

class ChildOfFinalMethodBase extends FinalMethodBase {
    keep(): void {} // ❌ Method keep overrides a base method marked with @Final.
}

//
// Not allowed
//
@Final
class FinalFinal {
  @Final // ❌ Method-level @Final is redundant when the class is already marked with @Final.
  keep(): void {}
}

@Final // ❌ Final is not allowed on abstract classes.
abstract class AbstractBase {
  abstract run(): void;
}
```

## Workspace commands

```bash
npm install
npm run build
npm run pack:plugin
npm run pack:decorator
```
