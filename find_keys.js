const fs = require('fs');
const ts = require('typescript');

const sourceCode = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
const sourceFile = ts.createSourceFile('page.tsx', sourceCode, ts.ScriptTarget.Latest, true);

function traverse(node) {
    if (ts.isJsxExpression(node)) {
        // e.g., {arr.map(...)}
    }
    
    if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'map') {
            const args = node.arguments;
            if (args.length > 0 && (ts.isArrowFunction(args[0]) || ts.isFunctionExpression(args[0]))) {
                const func = args[0];
                let body = func.body;
                
                // If it returns a JSX Element directly: e.g. .map(() => <div/>)
                if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body)) {
                    checkJsxElement(body);
                } 
                // If it's a block: .map(() => { return <div/> })
                else if (ts.isBlock(body)) {
                    body.statements.forEach(stmt => {
                        if (ts.isReturnStatement(stmt) && stmt.expression) {
                            if (ts.isJsxElement(stmt.expression) || ts.isJsxSelfClosingElement(stmt.expression)) {
                                checkJsxElement(stmt.expression);
                            }
                            if (ts.isParenthesizedExpression(stmt.expression)) {
                                const inner = stmt.expression.expression;
                                if (ts.isJsxElement(inner) || ts.isJsxSelfClosingElement(inner)) {
                                    checkJsxElement(inner);
                                }
                            }
                        }
                    });
                }
            }
        }
    }
    ts.forEachChild(node, traverse);
}

function checkJsxElement(node) {
    let openingElement = ts.isJsxElement(node) ? node.openingElement : node;
    let hasKey = false;
    openingElement.attributes.properties.forEach(attr => {
        if (ts.isJsxAttribute(attr) && attr.name.text === 'key') {
            hasKey = true;
        }
    });
    
    if (!hasKey) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        console.log(`Missing key at line ${line + 1}, col ${character + 1}, tag: ${openingElement.tagName.getText()}`);
    }
}

traverse(sourceFile);
