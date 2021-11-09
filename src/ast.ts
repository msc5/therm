// import _ from 'lodash'
import $ from 'jquery'
import Graph from 'graphology'
import asciitree from 'ascii-tree'

import 'bootstrap'
import './style.css'

// var testString = '0.01 00 10  00.1 .01'
// var testString = '(ax^2) + bx + c = 0.05'
// var testString = '3 * (2 + 1)'
// var testString = '3.42 ^ 22 * (1 + 12) + 14 / 20'
// var testString = '3 * 2 + 1'
// var testString = '1 * 2 + 3'
// var testString = '1 ^ 2 ^ 3 + (4 - 5 - 6)'
// var testString = 'a + b = c + d'
var testString = 'T2 / T1 = (P2 / P1) ^ ((gamma - 1) / gamma)'
// var testString = 'T2 / 300 = (30 / 10) ^ ((1.4 - 1) / 1.4)'
// var testString = 'a + b = c + d'
// var testString = 'a / (b + c * d) = e / f'
// var testString = 'a / b = c'
// var testString = 'a ^ b = c'

type MathTokenType =
    | 'Equals'
    | 'Operator'
    | 'Number'
    | 'Variable'
    | 'Parenthesis'
    | 'Error'

type Operator =
    | '+'
    | '-'
    | '*'
    | '/'
    | '^'
    | '='

function BindingPower(key: Operator) {
    switch (key) {
        case '+': case '-': return 10
        case '*': case '/': return 20
        case '^': return 30
        case '=': return 1
    }
}

const REGEX = {
    parenthesis: /\(|\)|\[|\]/,
    operator: /\+|\-|\*|\/|\^/,
    variable: /[A-Za-z]/,
    number: /^-?[0-9]+(\.[0-9]+)?$/,
}

interface EdgeAttributes { regex: RegExp }
interface NodeAttributes { name: MathTokenType }

class DFA {

    private graph: Graph
    private current: string

    constructor() {

        this.graph = new Graph<NodeAttributes, EdgeAttributes, any>({ multi: true, type: 'directed' })

        this.graph.addNode('Start', { name: undefined })
        this.current = 'Start'

        this.graph.addDirectedEdge('Start', 'Start', { regex: /\s/ })

        this.graph.addNode('Variable', { name: 'Variable' })
        this.graph.addDirectedEdge('Start', 'Variable', { regex: REGEX.variable })
        this.graph.addDirectedEdge('Variable', 'Variable', { regex: /[0-9]|[A-Za-z]|\_/ })

        this.graph.addNode('Operator', { name: 'Operator' })
        this.graph.addDirectedEdge('Start', 'Operator', { regex: REGEX.operator })

        this.graph.addNode('Parenthesis', { name: 'Parenthesis' })
        this.graph.addDirectedEdge('Start', 'Parenthesis', { regex: REGEX.parenthesis })

        this.graph.addNode('Equals', { name: 'Equals' })
        this.graph.addDirectedEdge('Start', 'Equals', { regex: /\=/ })

        this.graph.addNode('Error', { name: 'Error' })

        this.graph.addNode('N1', { name: 'Number' })
        this.graph.addNode('N2', { name: 'Error' })
        this.graph.addNode('Number', { name: 'Number' })
        this.graph.addDirectedEdge('Start', 'N1', { regex: /[0-9]/ })
        this.graph.addDirectedEdge('Start', 'N2', { regex: /\./ })
        this.graph.addDirectedEdge('N1', 'N1', { regex: /[0-9]/ })
        this.graph.addDirectedEdge('N1', 'N2', { regex: /\./ })
        this.graph.addDirectedEdge('N2', 'N1', { regex: /[0-9]/ })

    }

    reset(): void { this.current = 'Start' }
    state(): string { return this.current }
    outDegree(key: string) { return this.graph.outDegree(key) }
    getName(key: string) { return this.graph.getNodeAttribute(key, 'name') }

    explore(char: string): boolean {
        var found = false
        this.graph.forEachOutEdge(this.current,
            (edge, attr: EdgeAttributes) => {
                if (attr.regex.test(char)) {
                    this.current = this.graph.target(edge)
                    found = !found
                    return true
                }
            }
        )
        return found
    }

}

class Token {

    type: MathTokenType

    name: string

    value: number
    op: Operator

    start: number
    end: number

    constructor(
        type: MathTokenType,
        name: string,
        value?: number,
        op?: Operator,
        start?: number,
        end?: number
    ) {
        this.type = type
        this.name = name
        if (value) this.value = value
        if (op) this.op = op
        if (start) this.start = start
        if (end) this.end = end
    }

    copy(): Token {
        return new Token(
            this.type,
            this.name,
            this.value,
            this.op,
            this.start,
            this.end
        )
    }

}

abstract class Stream<T> {

    a: T[]
    i: number = -1

    constructor(a: T[]) { this.a = a }

    // Utilities to determine whether stream has reached the end
    public hasNext(): boolean { return this.i < this.a.length - 1 }
    private checkEnd() { if (!this.hasNext()) { throw 'End of Stream' } }

    // Returns current stream position i
    public pos(): number { return this.i }

    // Returns value at i
    public current(): T {
        if (this.i == -1) { throw 'Stream has not started' }
        if (this.i >= 0) { return this.a[this.i] }
    }

    // Returns value at i + 1
    public peek(): T {
        this.checkEnd()
        return this.a[this.i + 1]
    }

    // Returns value at i + 1 and advances stream
    public next(): T {
        this.checkEnd()
        return this.a[++this.i]
    }

}

class StringStream extends Stream<string> {

    constructor(text: string) { super([...text]) }

    // // Checks if character at i + 1 matches query.
    // // If there is a match, advances stream
    // public match(regex: RegExp): boolean {
    //     var match = regex.test(this.peek())
    //     if (match) { this.i++ }
    //     return match
    // }

}

class TokenStream extends Stream<Token> {
    // a: Token[]
    // constructor(tokens: Token[]) { this.a = tokens }
    constructor(tokens: Token[]) { super(tokens) }
    // toString(): string { return this.a.map(o => o.toString()).join('') }
    consume(): Token { return this.a.shift() }
    peek(): Token { return this.a[0] }
    isEmpty(): boolean { return this.a.length == 0 }
}

class Lexer {

    private DFA: DFA

    constructor(DFA: DFA) { this.DFA = DFA }

    public lex(stream: StringStream): TokenStream {

        // Steps DFA forward based on peeked character in stringStream
        // If there is a match, advance DFA to that position
        // If the state reached is terminal (outDegree == 0):
        //      If it is the Start state --> disregard token
        //      If not --> add char to token and step stream forward
        // If no match --> break

        var tokens: Token[] = []

        while (stream.hasNext()) {

            this.DFA.reset()
            var start = stream.pos()
            var str: string[] = []

            while (this.DFA.outDegree(this.DFA.state()) != 0) {

                if (!stream.hasNext()) { break }
                var first = this.DFA.state()

                var char = stream.peek()
                var found = this.DFA.explore(char)

                // console.log(char, found, first + ' --> ' + this.DFA.state())
                if (found) {
                    if (this.DFA.state() == 'Start') { stream.next(); break }
                    if (this.DFA.state() != 'Start') { str.push(stream.next()) }
                }
                else { break }

            }

            var type = this.DFA.getName(this.DFA.state())
            var name = str.join('')
            if (type != undefined) {
                tokens.push(
                    new Token(
                        type,
                        name,
                        (isNaN(Number(name)) ? undefined : Number(name)),
                        (type == 'Operator' || type == 'Equals') ? (name as Operator) : undefined,
                        start + 1,
                        start + str.length
                    )
                )
            }

        }

        var tokenStream = new TokenStream(tokens)
        return tokenStream

    }

}

class Node<T extends Token> {
    value: T
    left: Node<T>
    right: Node<T>
    prev: Node<T>

    constructor(value: T, left?: Node<T>, right?: Node<T>) {
        this.value = value
        if (left) {
            this.left = left
            left.prev = this
        }
        if (right) {
            this.right = right
            right.prev = this
        }
    }

    copy(prev?: Node<T>) {
        if (prev) this.prev = prev
        if (this.left != null) {
            var left = this.left.copy(this);
        }
        if (this.right != null) {
            var right = this.right.copy(this);
        }
        return new Node(this.value.copy(), left, right);
    }

}

type Parselet = (tokens: TokenStream, node: Node<Token>) => Node<Token>

class Parser {

    // Initial Parselets deal with numbers, variables and parenthesis.
    private initialParselets(operator: Token): Parselet {

        var parselets = {
            // Number and Variable Initial Parselets simply return the current Token.
            'Number': (tokens: TokenStream, token: Node<Token>) => token,
            'Variable': (tokens: TokenStream, token: Node<Token>) => token,
            // Parenthesis Parselet reParses the remaining tokens (with bp = 0) and
            // When that terminates (By null parenthesis consequent parselet) it consumes
            // the following token, which must be a closing parenthesis.
            'Parenthesis': (tokens: TokenStream, token: Node<Token>) => {
                var leftNode = this.reParse(tokens, 0)
                var next = tokens.consume()
                if (next.type != 'Parenthesis') { throw 'Expected closing parenthesis' }
                return leftNode
            },
        }
        return parselets[operator.type]

    }

    // Consequent Parselets deal with binary operators
    private consequentParselets(operator: Token): Parselet {

        var parselets = {
            // All binary operators require a consequent parser which will 
            // recursively parse the remaining tokens and return a node with itself
            // as the root, leftNode (passed in to this function) as its
            // left node, and the result of the recusive parsing as the right node.
            'Operator': (tokens: TokenStream, leftNode: Node<Token>) => {
                var bp = BindingPower(operator.op)
                // Right Associativity of exponents: 
                if (operator.op == '^') { bp -= 0.1 }
                var rightNode = this.reParse(tokens, bp)
                return new Node(operator, leftNode, rightNode)
            },
            'Equals': (tokens: TokenStream, leftNode: Node<Token>) => {
                var rightNode = this.reParse(tokens, 0)
                return new Node(operator, leftNode, rightNode)
            }
        }
        return parselets[operator.type]

    }

    public parse(tokens: TokenStream): Node<Token> {
        return this.reParse(tokens, 0)
    }

    private reParse(tokens: TokenStream, bp: number): Node<Token> {

        // console.log('reParse()')
        // console.log(tokens.toString())

        var firstToken = tokens.consume()
        // console.log('firstToken: ', firstToken)

        var initialParselet = this.initialParselets(firstToken)
        var leftNode = initialParselet(tokens, new Node(firstToken))
        // console.log('leftNode: ', leftNode)

        while (true) {

            if (tokens.isEmpty()) break

            var nextToken = tokens.peek()
            // console.log('nextToken: ', nextToken)

            var consequentParselet = this.consequentParselets(nextToken)
            if (!consequentParselet) {
                // console.log('NO CONSEQUENT PARSELET')
                break
            }

            if (BindingPower(nextToken.op) <= bp) {
                // console.log('BP!')
                break
            }

            tokens.consume()
            leftNode = consequentParselet(tokens, leftNode)

        }

        return leftNode

    }

}

// type ASTCallback = (node: Node<Token>, depth?: number) => void

class AST {

    root: Node<Token>
    values: {} = {}

    constructor(root: Node<Token>) {
        this.root = root.copy()
        this.BFT((n, d) => {
            if ((n.value.type == 'Number' || n.value.type == 'Variable') && typeof n.value.value != 'number') {
                this.values[n.value.name] = n.value
            }
        })
    }

    // TODO: return defensive copy of AST
    public solve(key: string) {

        // console.log('SOLVING FOR ', key)

        // Create a defensive copy of self:
        var ast = new AST(this.root)

        var i = 0
        var current: Node<Token>
        var visited: Node<Token>[]
        var directions: boolean[]
        var rootDir: boolean
        var nVisited = Infinity

        var balanceRoot = (node: Node<Token>, newNode: Node<Token>, lastDir: boolean, rootDir: boolean) => {
            // If target node is on right side of root
            if (rootDir) {
                ast.root.left = newNode
                if (lastDir) {
                    ast.root.right = node.left
                    node.left.prev = ast.root
                } else {
                    ast.root.right = node.right
                    node.right.prev = ast.root
                }
            }
            // If target node is on left side of root
            else {
                ast.root.right = newNode
                if (lastDir) {
                    ast.root.left = node.left
                    node.left.prev = ast.root
                } else {
                    ast.root.left = node.right
                    node.right.prev = ast.root
                }
            }
        }

        var opNode = (op: Operator, node: Node<Token>, lastDir: boolean, rootDir: boolean) => {
            var div = new Token('Operator', op, undefined, op)
            var newNode = new Node(
                div,
                rootDir ? ast.root.left : ast.root.right,
                lastDir ? node.left : node.right
            )
            newNode.prev = ast.root
            return newNode
        }

        var solveOps = {
            '*': (node: Node<Token>, lastDir: boolean, rootDir: boolean) => {
                var newNode = opNode('/', node, lastDir, rootDir)
                balanceRoot(node, newNode, !lastDir, rootDir)
            },
            '/': (node: Node<Token>, lastDir: boolean, rootDir: boolean) => {
                var newNode = opNode('*', node, false, rootDir)
                balanceRoot(node, newNode, true, rootDir)
            },
            '+': (node: Node<Token>, lastDir: boolean, rootDir: boolean) => {
                var newNode = opNode('-', node, lastDir, rootDir)
                balanceRoot(node, newNode, !lastDir, rootDir)
            },
            '-': (node: Node<Token>, lastDir: boolean, rootDir: boolean) => {
                var newNode = opNode('+', node, false, rootDir)
                balanceRoot(node, newNode, true, rootDir)
            },
            '^': (node: Node<Token>, lastDir: boolean, rootDir: boolean) => {
                // TODO: 
                // This part is janky and only works under many assumptions...
                var newNode = opNode('^', node, lastDir, rootDir)
                balanceRoot(node, newNode, !lastDir, rootDir)
                var div = new Token('Operator', '/')
                var one = new Token('Number', '1')
                var oneNode = new Node(one)
                var divNode = new Node(div, oneNode, newNode.right)
                newNode.right = divNode
            },
        }

        while (i++ < 20 && nVisited >= 1) {

            // console.log(i)

            visited = []
            directions = []

            // DFS for target node by key
            ast.DFT(node => { if (node.value.name == key) current = node })

            if (current.prev == ast.root) break

            // Search upstream for penultimate parent node, keeping track of visited nodes
            while (current.prev != ast.root) {
                var old = current
                current = current.prev
                directions.push(current.right == old ? true : false)
                visited.push(current)
            }
            rootDir = ast.root.right == current ? true : false

            nVisited = visited.length

            // Do operation of last node visited
            var lastDir = directions[directions.length - 1]
            var lastOp = visited[visited.length - 1]
            // console.log('OP', lastOp.value)
            var solveOp = solveOps[lastOp.value.op]
            solveOp(lastOp, lastDir, rootDir)

        }

        if (ast.root.left == current) return new AST(ast.root.right)
        else return new AST(ast.root.left)

    }

    public interpret(key?: string, known?: {}) {
        var ast = new AST(this.root)
        if (known) {
            for (var [k, v] of Object.entries(ast.values)) {
                if (known[k]) {
                    // ast.values[k].value = known[k]
                    ast.setValue(k, known[k])
                }
                else {
                    // console.log('UNKNOWN: ', k)
                    return
                }
            }
            // console.log(ast.toTree())
        }
        if (!key) return this.reInterpret(ast.root)
        var current: Node<Token>
        ast.DFT(node => { if (node.value.name == key) current = node })
        return this.reInterpret(current)
    }

    private reInterpret(node: Node<Token>): number {
        var doOp = {
            '+': (left: number, right: number) => left + right,
            '-': (left: number, right: number) => left - right,
            '*': (left: number, right: number) => left * right,
            '/': (left: number, right: number) => left / right,
            '^': (left: number, right: number) => Math.pow(left, right),
        }
        var num = (node: Node<Token>) => node.value.value as number
        var op = (node: Node<Token>) => {
            var operator = node.value.op
            var left = Number(this.reInterpret(node.left))
            var right = Number(this.reInterpret(node.right))
            return doOp[operator](left, right)
        }
        if (node.value.type == 'Operator') return op(node)
        if (
            node.value.type == 'Number' ||
            typeof (node.value.value) == 'number'
        ) return num(node)
        if (node.value.type == 'Variable') throw 'Cannot interpret variable node!'
    }

    public setValue(key: string, value: number) {
        this.DFT((n, d) => { if (key == n.value.name) n.value.value = value })
    }

    // public toString(): string {
    //     var str: string[] = []
    //     this.DFT((node, depth) => {
    //         str.push('#'.repeat(depth) + node.value.name + ': ' + node.value.value + '\n')
    //     })
    //     return str.reverse().join('')
    // }

    public toTree(): string {
        var str: string[] = []
        this.DFT((node, depth) => {
            str.push('#'.repeat(depth) + node.value.name + '\n')
        })
        return asciitree.generate(str.reverse().join(''))
    }

    // Depth First Traversal
    public DFT(
        callback: (node: Node<Token>, depth?: number) => void,
        root?: Node<Token>,
        order?: string):
        void {
        if (!order) order = 'post'
        if (!root) root = this.root
        function reDFT(current: Node<Token>, depth: number): void {
            if (current != undefined) {
                if (order == 'pre') callback(current, depth + 1)
                reDFT(current.left, depth + 1)
                if (order == 'in') callback(current, depth + 1)
                reDFT(current.right, depth + 1)
                if (order == 'post') callback(current, depth + 1)
            }
        }
        reDFT(root, 0)
    }

    // Breadth First (Level order) Traversal
    public BFT(
        callback: (node: Node<Token>, depth?: number) => void,
        root?: Node<Token>,
        order?: string):
        void {
        if (!order) order = 'post'
        if (!root) root = this.root
        function reBFT(current: Node<Token>[], depth: number): void {
            var next: Node<Token>[] = []
            for (var node of current) {
                if (node != undefined) {
                    if (order == 'pre') callback(node, depth)
                    if (node.left != undefined) { next.push(node.left) }
                    if (order == 'in') callback(node, depth)
                    if (node.right != undefined) { next.push(node.right) }
                    if (order == 'post') callback(node, depth)
                }
            }
            if (next.length != 0) { reBFT(next, depth + 1) }
        }
        reBFT([root], 0)
    }

}

// Takes a string as input and returns an AST
var toAST = (input: string) => {
    var stream = new StringStream(input)
    var dfa = new DFA()
    var lexer = new Lexer(dfa)
    var tokenStream = lexer.lex(stream)
    var parser = new Parser()
    var root = parser.parse(tokenStream)
    var ast = new AST(root)
    return ast
}

// var asciiAST = (ast: AST) => {
//     return asciitree.generate(ast.toString())
// }

window.onload = () => {

    var testBox = $(document.createElement('div'))
    testBox.addClass('testBox')

    var testInput = $(document.createElement('input'))
    testInput.val(testString)

    var testOutput = $(document.createElement('span'))

    var testButton = $(document.createElement('button'))

    var solveInput = $(document.createElement('input'))
    // solveInput.val('c')

    var solveButton = $(document.createElement('button'))
    var solveOutput = $(document.createElement('span'))

    var evalAST = (ast: AST, key: string) => {
        var solved = ast.solve(key)
        // var result = solved.interpret()
        return (solved.toTree() + '\n' + '')
    }

    testButton.click(() => {
        var ast = toAST(testInput.val())
        testOutput.html(ast.toTree())
    })

    testInput.on('change', () => {
        var ast = toAST(testInput.val())
        testOutput.html(ast.toTree())
    })

    solveButton.click(() => {
        var ast = toAST(testInput.val())
        solveOutput.html(evalAST(ast, solveInput.val()))
    })

    solveInput.on('change', () => {
        var ast = toAST(testInput.val())
        solveOutput.html(evalAST(ast, solveInput.val()))
    })


    testBox.append(testInput)
    testBox.append(testButton)
    testBox.append(testOutput)

    testBox.append(solveInput)
    testBox.append(solveButton)
    testBox.append(solveOutput)

    testOutput.html(toAST(testInput.val()))

    document.body.appendChild(testBox[0])

}

export { AST, toAST, Token }