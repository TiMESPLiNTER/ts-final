import ts from 'typescript';

const FINAL_DECORATOR_NAME = 'Final';

export type TsParserServices = {
    program: ts.Program;
    esTreeNodeToTSNodeMap: Map<unknown, ts.Node>;
};

export const hasParserServices = (value: unknown): value is TsParserServices => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const maybeServices = value as Partial<TsParserServices>;

    return maybeServices.program !== undefined && maybeServices.esTreeNodeToTSNodeMap !== undefined;
};

const getDecorators = (node: ts.Node): readonly ts.Decorator[] => {
    if (!ts.canHaveDecorators(node)) {
        return [];
    }

    return ts.getDecorators(node) ?? [];
};

const getDecoratorName = (decorator: ts.Decorator): string | undefined => {
    const expression = decorator.expression;

    if (ts.isIdentifier(expression)) {
        return expression.text;
    }

    if (ts.isCallExpression(expression)) {
        const calledExpression = expression.expression;

        if (ts.isIdentifier(calledExpression)) {
            return calledExpression.text;
        }

        if (ts.isPropertyAccessExpression(calledExpression)) {
            return calledExpression.name.text;
        }
    }

    if (ts.isPropertyAccessExpression(expression)) {
        return expression.name.text;
    }

    return undefined;
};

export const isFinalDecoratedClass = (classDeclaration: ts.ClassDeclaration): boolean => {
    return getDecorators(classDeclaration)
        .some((decorator: ts.Decorator) => getDecoratorName(decorator) === FINAL_DECORATOR_NAME);
};

export const isAbstractClassDeclaration = (classDeclaration: ts.ClassDeclaration): boolean => {
    return classDeclaration.modifiers
        ?.some((modifier: ts.ModifierLike) => modifier.kind === ts.SyntaxKind.AbstractKeyword) === true;
};

const getClassMethodName = (name: ts.PropertyName): string | undefined => {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
        return name.text;
    }

    if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) {
        return name.expression.text;
    }

    return undefined;
};

const isStaticMethod = (member: ts.MethodDeclaration): boolean => {
    return member.modifiers?.some((modifier: ts.ModifierLike) => modifier.kind === ts.SyntaxKind.StaticKeyword) === true;
};

const getFinalMethodNames = (
    classDeclaration: ts.ClassDeclaration,
    checker: ts.TypeChecker,
    visitedSymbols: Set<ts.Symbol>
): Set<string> => {
    const finalMethodNames = new Set<string>();

    for (const member of classDeclaration.members) {
        if (!ts.isMethodDeclaration(member) || isStaticMethod(member) || member.name === undefined) {
            continue;
        }

        const hasFinalDecorator = getDecorators(member)
            .some((decorator: ts.Decorator) => getDecoratorName(decorator) === FINAL_DECORATOR_NAME);

        if (!hasFinalDecorator) {
            continue;
        }

        const methodName = getClassMethodName(member.name);

        if (methodName !== undefined) {
            finalMethodNames.add(methodName);
        }
    }

    const classType = checker.getTypeAtLocation(classDeclaration) as ts.InterfaceType;
    const baseTypes = checker.getBaseTypes(classType) ?? [];

    for (const baseType of baseTypes) {
        const baseSymbol = baseType.getSymbol();

        if (baseSymbol === undefined || visitedSymbols.has(baseSymbol)) {
            continue;
        }

        visitedSymbols.add(baseSymbol);

        for (const declaration of baseSymbol.getDeclarations() ?? []) {
            if (!ts.isClassDeclaration(declaration)) {
                continue;
            }

            for (const inheritedFinalMethod of getFinalMethodNames(declaration, checker, visitedSymbols)) {
                finalMethodNames.add(inheritedFinalMethod);
            }
        }
    }

    return finalMethodNames;
};

export const getInheritedFinalMethods = (
    tsClassDeclaration: ts.ClassDeclaration,
    checker: ts.TypeChecker
): Set<string> => {
    const classType = checker.getTypeAtLocation(tsClassDeclaration) as ts.InterfaceType;
    const baseTypes = checker.getBaseTypes(classType) ?? [];
    const inheritedFinalMethods = new Set<string>();

    for (const baseType of baseTypes) {
        const baseSymbol = baseType.getSymbol();

        if (baseSymbol === undefined) {
            continue;
        }

        const visitedSymbols = new Set<ts.Symbol>([baseSymbol]);

        for (const declaration of baseSymbol.getDeclarations() ?? []) {
            if (!ts.isClassDeclaration(declaration)) {
                continue;
            }

            for (const finalMethod of getFinalMethodNames(declaration, checker, visitedSymbols)) {
                inheritedFinalMethods.add(finalMethod);
            }
        }
    }

    return inheritedFinalMethods;
};

export const getOwnMethodNames = (node: any): Map<string, any> => {
    const ownMethodNodes = (node.body?.body ?? []).filter((classMember: any) =>
        classMember.type === 'MethodDefinition' && classMember.static !== true
    );

    const ownMethodNames = new Map<string, any>();

    for (const methodNode of ownMethodNodes) {
        if (methodNode.key?.type === 'Identifier') {
            ownMethodNames.set(methodNode.key.name, methodNode.key);
            continue;
        }

        if (methodNode.key?.type === 'Literal' && typeof methodNode.key.value === 'string') {
            ownMethodNames.set(methodNode.key.value, methodNode.key);
        }
    }

    return ownMethodNames;
};
