import ts from 'typescript';
import {
    getInheritedFinalMethods,
    getOwnMethodNames,
    hasParserServices,
    isFinalDecoratedClass,
} from './finalPluginUtils.js';

const isFinalDecoratorExpression = (expression: any): boolean => {
    if (expression?.type === 'Identifier') {
        return expression.name === 'Final';
    }

    if (expression?.type === 'CallExpression' && expression.callee?.type === 'Identifier') {
        return expression.callee.name === 'Final';
    }

    if (expression?.type === 'MemberExpression' && expression.property?.type === 'Identifier') {
        return expression.property.name === 'Final';
    }

    return false;
};

const finalRecommendedRules = {
    'final/no-override-final': 'error',
    'final/no-final-on-abstract': 'error',
    'final/no-extend-final': 'error',
    'final/no-redundant-final-method': 'error',
} as const;

const finalPlugin = {
    configs: {
        recommended: {
            rules: finalRecommendedRules,
        },
    },
    rules: {
        'no-override-final': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow overriding methods decorated with @Final in base classes.',
                },
                schema: [],
                messages: {
                    noOverrideFinal: 'Method {{methodName}} overrides a base method marked with @Final.',
                },
            },
            create: (context: any): Record<string, (node: any) => void> => {
                const sourceCode = context.sourceCode as { parserServices?: unknown };
                const parserServicesUnknown = sourceCode.parserServices;

                if (!hasParserServices(parserServicesUnknown)) {
                    return {};
                }

                const parserServices = parserServicesUnknown;
                const checker = parserServices.program.getTypeChecker();

                return {
                    ClassDeclaration: (node: any): void => {
                        if (node.superClass === undefined || node.superClass === null) {
                            return;
                        }

                        const tsClassDeclaration = parserServices.esTreeNodeToTSNodeMap.get(node) as ts.ClassDeclaration;

                        const ownMethodNames = getOwnMethodNames(node);

                        if (ownMethodNames.size === 0) {
                            return;
                        }

                        const inheritedFinalMethods = getInheritedFinalMethods(tsClassDeclaration, checker);

                        for (const methodName of inheritedFinalMethods) {
                            const reportNode = ownMethodNames.get(methodName);

                            if (reportNode === undefined) {
                                continue;
                            }

                            context.report({
                                node: reportNode,
                                messageId: 'noOverrideFinal',
                                data: { methodName },
                            });
                        }
                    },
                };
            },
        },
        'no-final-on-abstract': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow @Final on abstract classes.',
                },
                schema: [],
                messages: {
                    noFinalOnAbstract: 'Final is not allowed on abstract classes.',
                },
            },
            create: (context: any): Record<string, (node: any) => void> => {
                return {
                    Decorator: (node: any): void => {
                        if (!isFinalDecoratorExpression(node?.expression)) {
                            return;
                        }

                        const parent = node.parent;
                        const isAbstractClassDecorator = parent?.type === 'ClassDeclaration' && parent?.abstract === true;

                        if (!isAbstractClassDecorator) {
                            return;
                        }

                        context.report({
                            node: node.expression ?? node,
                            messageId: 'noFinalOnAbstract',
                        });
                    },
                };
            },
        },
        'no-extend-final': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow extending classes decorated with @Final.',
                },
                schema: [],
                messages: {
                    noExtendFinal: 'Class {{className}} is marked with @Final and cannot be extended.',
                },
            },
            create: (context: any): Record<string, (node: any) => void> => {
                const sourceCode = context.sourceCode as { parserServices?: unknown };
                const parserServicesUnknown = sourceCode.parserServices;

                if (!hasParserServices(parserServicesUnknown)) {
                    return {};
                }

                const parserServices = parserServicesUnknown;
                const checker = parserServices.program.getTypeChecker();

                return {
                    ClassDeclaration: (node: any): void => {
                        if (node.superClass === undefined || node.superClass === null) {
                            return;
                        }

                        const tsClassDeclaration = parserServices.esTreeNodeToTSNodeMap.get(node) as ts.ClassDeclaration;
                        const classType = checker.getTypeAtLocation(tsClassDeclaration) as ts.InterfaceType;
                        const baseTypes = checker.getBaseTypes(classType) ?? [];

                        for (const baseType of baseTypes) {
                            const baseSymbol = baseType.getSymbol();

                            if (baseSymbol === undefined) {
                                continue;
                            }

                            for (const declaration of baseSymbol.getDeclarations() ?? []) {
                                if (!ts.isClassDeclaration(declaration)) {
                                    continue;
                                }

                                if (!isFinalDecoratedClass(declaration)) {
                                    continue;
                                }

                                context.report({
                                    node: node.superClass,
                                    messageId: 'noExtendFinal',
                                    data: { className: context.sourceCode.getText(node.superClass) },
                                });
                                return;
                            }
                        }
                    },
                };
            },
        },
        'no-redundant-final-method': {
            meta: {
                type: 'problem',
                docs: {
                    description: 'Disallow @Final on methods when the enclosing class is already decorated with @Final.',
                },
                schema: [],
                messages: {
                    noRedundantFinalMethod: 'Method-level @Final is redundant when the class is already marked with @Final.',
                },
            },
            create: (context: any): Record<string, (node: any) => void> => {
                return {
                    Decorator: (node: any): void => {
                        if (!isFinalDecoratorExpression(node?.expression)) {
                            return;
                        }

                        if (node.parent?.type !== 'MethodDefinition') {
                            return;
                        }

                        const classNode = node.parent?.parent?.parent;
                        const isClassNode = classNode?.type === 'ClassDeclaration' || classNode?.type === 'ClassExpression';

                        if (!isClassNode) {
                            return;
                        }

                        const classDecorators = classNode.decorators ?? [];
                        const hasClassLevelFinal = classDecorators.some((decorator: any) =>
                            isFinalDecoratorExpression(decorator?.expression)
                        );

                        if (!hasClassLevelFinal) {
                            return;
                        }

                        context.report({
                            node: node.expression ?? node,
                            messageId: 'noRedundantFinalMethod',
                        });
                    },
                };
            },
        },
    },
};

export default finalPlugin;
