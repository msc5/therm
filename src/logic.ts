import { PathValues, stateTags, pathTags, StateValues } from "./types"
import { AST, toAST, Token } from './ast'

import Graph from "graphology"
import _ from 'lodash'

const R = 0.287

var emitStateRelation = (equation: string) => {
    return (a: string) => {
        return equation.replace(/\[a\]/g, '_' + a)
    }
}

var emitPathRelation = (equation: string) => {
    return (a: string, b: string, c: string) => {
        return equation
            .replace(/\[a\]/g, '_' + a)
            .replace(/\[b\]/g, '_' + b)
            .replace(/\[c\]/g, '_' + c)
    }
}

var stateRelations = {
    'vol': emitStateRelation('V[a] = v[a] / m[a]'),
    'ideal': emitStateRelation('P[a] * v[a] = R * T[a]'),
}

var pathRelations = {
    'isentropic turbine': emitPathRelation('T[b] / T[a] = ((P[b] / P[a]) ^ ((GAMMA - 1) / GAMMA) - 1) / eta[c] + 1'),
    'isentropic compressor': emitPathRelation('T[b] / T[a] = eta[c] * ((P[b] / P[a]) ^ ((GAMMA - 1) / GAMMA) - 1) + 1'),
    'pratio_eqn': emitPathRelation('pratio[c] = P[b] / P[a]'),
}

var printEdges = (graph: Graph): string => {
    var str = []
    graph.forEachDirectedEdge((e, a, s, t) => {
        str.push(s + ' <-> ' + t)
    })
    return str.join('\n')
}

var printNodes = (graph: Graph): string => {
    var str = []
    graph.forEachNode((n, a) => {
        if (a.values) str.push(n + ' -- ' + a.values.toString())
    })
    return str.join('\n')
}

abstract class Values<T> {

    key: string
    values: Map<string, T>

    constructor(tags: string[], initial?: StateValues<T> | PathValues<T>) {
        this.values = new Map<string, T>()
        tags.forEach(v => this.values.set(v, undefined))
        if (initial) this.values.forEach((v, k, m) => m.set(k, initial[k]))
    }

    toString(): string {
        var str = []
        this.values.forEach((v, k) => {
            if (v) {
                var val = String(v) + ' '.repeat(10 - String(v).length)
            } else {
                var val = ' '.repeat(10)
            }
            str.push(k + ': ' + val)
        })
        return str.join('')
    }

}

class State extends Values<number> {

    constructor(initial?: StateValues<number>) { super(stateTags, initial) }

}

class Path extends Values<number> {

    constructor(initial?: PathValues<number>) {
        if (initial) {
            if (initial['type'] == 'constant pressure') initial['pratio'] = 1
        }
        super(pathTags, initial)
    }

}

class Diagram {

    states: State[]
    paths: Path[]

    componentGraph: Graph
    valueGraph: Graph

    constructor(states: State[], paths: Path[], componentGraph: Graph) {

        this.states = states
        this.paths = paths
        this.componentGraph = componentGraph

        // console.log(printNodes(this.componentGraph))
        // console.log(printEdges(this.componentGraph))

        this.valueGraph = new Graph()

        this.valueGraph.addNode('R', { 'values': 0.287, 'type': 'value' })
        this.valueGraph.addNode('GAMMA', { 'values': 1.4, 'type': 'value' })

        this.componentGraph.forEachNode((n, a) => {

            a.values.values.forEach((v: number, k: string) => {
                this.valueGraph.addNode(k + '_' + n, { 'values': v, 'type': 'value' })
            })

            if (n[0] == 's') {
                // Ideal Relation
                if (a.values.values.get('fluid') == 'gas') {
                    var name = 'ideal_' + n
                    this.valueGraph.addNode(name, {
                        'values': toAST(stateRelations['ideal'](n)),
                        'type': 'equation'
                    })
                    this.valueGraph.addEdge('R', name)
                    this.valueGraph.addEdge('P_' + n, name)
                    this.valueGraph.addEdge('v_' + n, name)
                    this.valueGraph.addEdge('T_' + n, name)
                }
                // Volume relation
                name = 'vol_' + n
                this.valueGraph.addNode(name, {
                    'values': toAST(stateRelations['vol'](n)),
                    'type': 'equation'
                })
                this.valueGraph.addEdge('v_' + n, name)
                this.valueGraph.addEdge('V_' + n, name)
            }

            // Assume pressure ratio:
            if (n[0] == 'c') {
                var from = []
                var to = []
                this.componentGraph.forEachInNeighbor(n, node => {
                    if (node[0] == 's') from.push(node)
                })
                this.componentGraph.forEachOutNeighbor(n, node => {
                    if (node[0] == 's') to.push(node)
                })
                var neighbors = _.zip(from, to)
                // console.log(neighbors.toString())

                neighbors.forEach((v, i) => {

                    var name = 'pratio_eqn_' + n
                    // console.log(pathRelations['pratio_eqn'](v[0], v[1], n))
                    this.valueGraph.addNode(name, {
                        'values': toAST(pathRelations['pratio_eqn'](v[0], v[1], n)),
                        'type': 'equation'
                    })
                    this.valueGraph.addEdge('pratio_' + n, name)
                    this.valueGraph.addEdge('P_' + v[0], name)
                    this.valueGraph.addEdge('P_' + v[1], name)

                    if (a.values.values.get('type') == 'isentropic turbine') {
                        name = 'isentropic_' + n
                        this.valueGraph.addNode(name, {
                            'values': toAST(pathRelations['isentropic turbine'](v[0], v[1], n)),
                            'type': 'equation'
                        })
                        this.valueGraph.addEdge('GAMMA', name)
                        // ***!
                        this.valueGraph.addEdge('eta_' + n, name)
                        this.valueGraph.addEdge('P_' + v[0], name)
                        this.valueGraph.addEdge('T_' + v[0], name)
                        this.valueGraph.addEdge('P_' + v[1], name)
                        this.valueGraph.addEdge('T_' + v[1], name)
                    }

                    if (a.values.values.get('type') == 'isentropic compressor') {
                        name = 'isentropic_' + n
                        this.valueGraph.addNode(name, {
                            'values': toAST(pathRelations['isentropic compressor'](v[0], v[1], n)),
                            'type': 'equation'
                        })
                        this.valueGraph.addEdge('GAMMA', name)
                        // ***!
                        this.valueGraph.addEdge('eta_' + n, name)
                        this.valueGraph.addEdge('P_' + v[0], name)
                        this.valueGraph.addEdge('T_' + v[0], name)
                        this.valueGraph.addEdge('P_' + v[1], name)
                        this.valueGraph.addEdge('T_' + v[1], name)
                    }

                })
            }

        })

        // console.log(printNodes(this.valueGraph))
        // console.log(printEdges(this.valueGraph))

        this.states.forEach((v, i) => {
            var keys = ['P', 'T', 'v', 'h', 's']
            console.log('---')
            keys.forEach(k => {
                var key = k + '_s' + (i + 1)
                console.log(key, this.compute(key))
            })
        })

    }

    compute(key: string) { return this.computeNode(key, {}, {}, '') }

    computeNode(key: string, visited: {}, known: {}, last: string) {

        visited[key] = true

        // 1. If Node number is known, return known value
        var num = this.valueGraph.getNodeAttribute(key, 'values')
        if (typeof (num) == 'number') { return num }
        if (known[key]) { return known[key] }

        // 2. If Node number is unknown:
        // Iterate over neighboring equation nodes
        // First to return a valid solution gets returned
        var val
        this.valueGraph.forEachNeighborUntil(key, (n, a) => {
            if (n != last) {
                // console.log(n)
                val = this.computeEqn(n, visited, known, key)
                if (typeof val == 'number') return true
            }
        })
        return val

    }

    computeEqn(key: string, visited: {}, known: {}, last: string) {

        // Iterate over all neighbors
        // Determine if a solution is possible
        // Return solution or undefined
        var eqn = this.valueGraph.getNodeAttribute(key, 'values')
        var val
        this.valueGraph.forEachNeighbor(key, (n, a) => {
            // If neighbor is not known
            if (typeof known[n] != 'number' && n != last && !visited[n]) {
                known[n] = this.computeNode(n, visited, known, key)
            }
        })
        // console.log(JSON.stringify(known))
        // console.log(known)
        // console.log(key, last, known)
        // console.log(eqn.toTree())
        // console.log(eqn.toTree())
        // console.log(eqn.solve(last).toTree())
        var solved = eqn.solve(last)
        var soln = solved.interpret(undefined, known)
        // console.log(soln)
        if (typeof soln == 'number') return soln

    }

}

var testCompGraph = new Graph()

var testStates = [
    new State({ 'fluid': 'gas', 'P': 100e3, 'T': 298.15 }),
    new State({ 'fluid': 'gas' }),
    new State({ 'fluid': 'gas', 'T': 1523.15 }),
    new State({ 'fluid': 'gas', 'P': 100e3 }),
    new State({ 'fluid': 'gas', 'T': 473.15 }),
    new State({ 'fluid': 'vapor' }),
    new State({ 'fluid': 'vapor', 'P': 12.5e6, 'T': 773.15 }),
    new State({ 'fluid': 'vapor', 'P': 10e3 }),
    new State({ 'fluid': 'vapor', 'P': 10e3 })
]


var testPaths = [
    new Path({ 'fluid': 'gas', 'type': 'isentropic turbine', 'pratio': 14, 'eta': 0.85 }),
    new Path({ 'fluid': 'gas', 'type': 'constant pressure', 'Q': 50 }),
    new Path({ 'fluid': 'gas', 'type': 'isentropic compressor', 'eta': 0.87 }),
    new Path({ 'fluid': 'gas', 'type': 'constant pressure' }),
    new Path({ 'fluid': 'vapor', 'type': 'constant pressure' }),
    new Path({ 'fluid': 'vapor', 'type': 'isentropic turbine', 'eta': 0.9 }),
    new Path({ 'fluid': 'vapor', 'type': 'constant pressure' }),
    new Path({ 'fluid': 'vapor', 'type': 'isentropic compressor', 'eta': 1 }),
    new Path({ 'fluid': 'none', 'type': 'end' })
]

testStates.forEach((v, i) => testCompGraph.addNode('s' + String(i + 1), { 'values': v }))
testPaths.forEach((v, i) => testCompGraph.addNode('c' + String(i + 1), { 'values': v }))

for (var i = 1; i < 5; i++) {
    testCompGraph.addDirectedEdge('s' + String(i), 'c' + String(i))
    testCompGraph.addDirectedEdge('c' + String(i), 's' + String(i + 1))
}
testCompGraph.addDirectedEdge('s5', 'c9')
testCompGraph.addDirectedEdge('c9', 's1')

testCompGraph.addDirectedEdge('c1', 'c3')

for (var i = 5; i < 9; i++) {
    testCompGraph.addDirectedEdge('s' + String(i + 1), 'c' + String(i))
}
for (var i = 5; i < 8; i++) {
    testCompGraph.addDirectedEdge('c' + String(i), 's' + String(i + 2))
}
testCompGraph.addDirectedEdge('c8', 's6')
testCompGraph.addEdge('c4', 'c5')

new Diagram(testStates, testPaths, testCompGraph)