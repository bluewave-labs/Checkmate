import ts from "typescript";
import path from "node:path";

/** A definition a handler can let escape, as `<catalog file>#<expression>`, e.g. `src/domain/monitors/monitor.errors.ts#monitorErrors.notFound`. */
export type ThrowSite = { definition: string; location: string };

export type ThrowScanner = {
	throwSitesOf: (controllerFile: string, handler: string) => ThrowSite[];
};

export const definitionId = (file: string, expression: string): string => `${file}#${expression}`;

/**
 * Builds a TypeScript program over the server and walks call graphs from controller handlers
 * through service interfaces to their implementing classes, collecting the definition each
 * `new AppError(definition, …)` names. A call inside a `try` is followed only when its `catch`
 * rethrows the caught error or reads its status or definition; a call chained into `.catch(...)`
 * is never followed.
 */
export const createThrowScanner = (serverRoot: string): ThrowScanner => {
	const configFile = ts.readConfigFile(path.join(serverRoot, "tsconfig.json"), ts.sys.readFile);
	const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, serverRoot);
	const program = ts.createProgram(parsed.fileNames, parsed.options);
	const checker = program.getTypeChecker();

	const implementations = new Map<string, ts.ClassDeclaration[]>();
	for (const sourceFile of program.getSourceFiles()) {
		if (sourceFile.isDeclarationFile) continue;
		const visit = (node: ts.Node): void => {
			if (ts.isClassDeclaration(node)) {
				for (const clause of node.heritageClauses ?? []) {
					if (clause.token !== ts.SyntaxKind.ImplementsKeyword) continue;
					for (const type of clause.types) {
						const name = type.expression.getText();
						implementations.set(name, [...(implementations.get(name) ?? []), node]);
					}
				}
			}
			ts.forEachChild(node, visit);
		};
		visit(sourceFile);
	}

	const memberBody = (cls: ts.ClassDeclaration, name: string): ts.Node | undefined => {
		for (const member of cls.members) {
			if (!member.name || member.name.getText() !== name) continue;
			if (ts.isMethodDeclaration(member)) return member.body;
			if (ts.isPropertyDeclaration(member) && member.initializer && ts.isArrowFunction(member.initializer)) return member.initializer.body;
		}
		return undefined;
	};

	const bodiesOf = (declaration: ts.Declaration, name: string): ts.Node[] => {
		if (declaration.getSourceFile().isDeclarationFile) return [];
		if ((ts.isMethodSignature(declaration) || ts.isPropertySignature(declaration)) && ts.isInterfaceDeclaration(declaration.parent)) {
			return (implementations.get(declaration.parent.name.text) ?? []).flatMap((cls) => memberBody(cls, name) ?? []);
		}
		if ((ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) && declaration.body) return [declaration.body];
		if ((ts.isVariableDeclaration(declaration) || ts.isPropertyDeclaration(declaration)) && declaration.initializer) {
			const init = declaration.initializer;
			if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return [init.body];
		}
		return [];
	};

	const resolve = (node: ts.Node): ts.Symbol | undefined => {
		const symbol = checker.getSymbolAtLocation(node);
		return symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
	};

	const targetsOf = (call: ts.CallExpression): ts.Node[] => {
		const callee = call.expression;
		const nameNode = ts.isPropertyAccessExpression(callee) ? callee.name : ts.isIdentifier(callee) ? callee : undefined;
		if (!nameNode) return [];
		return (resolve(nameNode)?.declarations ?? []).flatMap((declaration) => bodiesOf(declaration, nameNode.text));
	};

	const catchPropagates = (clause: ts.CatchClause): boolean => {
		const caught = clause.variableDeclaration?.name;
		if (!caught || !ts.isIdentifier(caught)) return false;
		let found = false;
		const visit = (node: ts.Node): void => {
			if (ts.isThrowStatement(node) && ts.isIdentifier(node.expression) && node.expression.text === caught.text) found = true;
			if (
				ts.isPropertyAccessExpression(node) &&
				ts.isIdentifier(node.expression) &&
				node.expression.text === caught.text &&
				(node.name.text === "status" || node.name.text === "definition")
			)
				found = true;
			ts.forEachChild(node, visit);
		};
		visit(clause.block);
		return found;
	};

	const propagates = (call: ts.CallExpression, body: ts.Node): boolean => {
		const parent = call.parent;
		if (ts.isPropertyAccessExpression(parent) && parent.expression === call && parent.name.text === "catch") return false;
		for (let node: ts.Node = call; node !== body; node = node.parent) {
			const ancestor = node.parent;
			if (ts.isTryStatement(ancestor) && ancestor.tryBlock === node && ancestor.catchClause) return catchPropagates(ancestor.catchClause);
		}
		return true;
	};

	const locationOf = (node: ts.Node): string => {
		const sourceFile = node.getSourceFile();
		const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		return `${path.relative(serverRoot, sourceFile.fileName)}:${line + 1}`;
	};

	const definitionOf = (construction: ts.NewExpression): string => {
		const first = construction.arguments?.[0];
		if (!first || !(ts.isPropertyAccessExpression(first) || ts.isIdentifier(first))) {
			throw new Error(`AppError at ${locationOf(construction)} is not built from a definition`);
		}
		const root = ts.isPropertyAccessExpression(first) ? first.expression : first;
		const declaration = resolve(root)?.declarations?.[0];
		if (!declaration) throw new Error(`Cannot resolve ${first.getText()} at ${locationOf(construction)}`);
		return definitionId(path.relative(serverRoot, declaration.getSourceFile().fileName), first.getText());
	};

	const memo = new Map<ts.Node, ThrowSite[]>();
	const inProgress = new Set<ts.Node>();
	const sitesIn = (body: ts.Node): ThrowSite[] => {
		const cached = memo.get(body);
		if (cached) return cached;
		if (inProgress.has(body)) return [];
		inProgress.add(body);
		const sites: ThrowSite[] = [];
		const visit = (node: ts.Node): void => {
			if (ts.isNewExpression(node) && node.expression.getText() === "AppError") {
				sites.push({ definition: definitionOf(node), location: locationOf(node) });
			}
			if (ts.isCallExpression(node) && propagates(node, body)) {
				for (const target of targetsOf(node)) sites.push(...sitesIn(target));
			}
			ts.forEachChild(node, visit);
		};
		visit(body);
		inProgress.delete(body);
		memo.set(body, sites);
		return sites;
	};

	const throwSitesOf = (controllerFile: string, handler: string): ThrowSite[] => {
		const sourceFile = program.getSourceFile(path.join(serverRoot, controllerFile));
		if (!sourceFile) throw new Error(`Controller file not in program: ${controllerFile}`);
		let controller: ts.ClassDeclaration | undefined;
		ts.forEachChild(sourceFile, (node) => {
			if (ts.isClassDeclaration(node)) controller = node;
		});
		const body = controller && memberBody(controller, handler);
		if (!body) throw new Error(`Handler ${handler} not found in ${controllerFile}`);
		return sitesIn(body);
	};

	return { throwSitesOf };
};
