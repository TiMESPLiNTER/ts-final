# eslint-plugin-final

ESLint plugin for enforcing `@Final` semantics in TypeScript classes.

## Rules

- `final/no-override-final`: Disallow overriding methods decorated with `@Final` in base classes.
- `final/no-final-on-abstract`: Disallow `@Final` on abstract classes.
- `final/no-extend-final`: Disallow extending classes decorated with `@Final`.
- `final/no-redundant-final-method`: Disallow `@Final` on methods when the class is already decorated with `@Final`.

## Install

```bash
npm install final-decorator
npm install --save-dev eslint-plugin-final
```

## Usage (flat config)

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

## Runtime Decorator

Use `final-decorator` in production/runtime code and keep this package as a dev dependency for linting only.
