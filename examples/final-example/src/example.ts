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

// Not allowed
@Final
class FinalFinal {
  @Final // ❌ Method-level @Final is redundant when the class is already marked with @Final.
  keep(): void {}
}

@Final // ❌ Final is not allowed on abstract classes.
abstract class AbstractBase {
  abstract run(): void;
}
