import { PathValues, stateTags, pathTags, StateValues } from "./types"
import Graph from "graphology"

const R = 0.287

class State {

    values: Map<string, number>

    constructor(initial?: StateValues<number>) {
        this.values = new Map<string, number>()
        stateTags.forEach(v => this.values.set(v, undefined))
        if (initial) this.values.forEach((v, k, m) => m.set(k, initial[k]))
    }

}

class Path {

    values: Map<string, number>

    constructor(initial?: PathValues<number>) {
        this.values = new Map<string, number>()
        pathTags.forEach(v => this.values.set(v, undefined))
        if (initial) this.values.forEach((v, k, m) => m.set(k, initial[k]))
    }

}

class Cycle {

    states: State[]
    paths: Path[]
    graph: Graph
    vGraph: Graph

    constructor(states?: State[], paths?: Path[]) {
        this.graph = new Graph()
        this.vGraph = new Graph()
        if (states) states.forEach((s, i) => this.graph.addNode('s' + String(i)))
        if (paths) paths.forEach((p, i) => {
            this.graph.addNode('p' + String(i))
        })
    }

}

var testStates = [
    new State({ 'P': 100, 'T': 298.15 })
]

// var testStates = [
//     new State({ 'P': 100, 'T': 298.15 }),
//     new State(),
//     new State({ 'T': 1523.15 }),
//     new State({ 'P': 100 }),
//     new State({ 'T': 473.15 })
// ]

// var testPaths = [
//     new Path({ 'type': 'isentropic', 'pratio': 14, 'eff': 0.85 }),
//     new Path({ 'type': 'constant pressure', 'Q': 50 }),
//     new Path({ 'type': 'isentropic', 'eff': 0.87 }),
//     new Path({ 'type': 'constant pressure', 'pratio': 1 }),
// ]

var stateRelations = {
    'implicit': [
        'v = V / m',
        ''
    ],
    'ideal': [
        'P * v = R * T'
    ],
}

var pathRelations = {
    'isentropic': [
        'T2S / T1 = (P2 / P1) ^ ((GAMMA - 1) / GAMMA)',
        'T2 = (T2S - T1) / eta + T1'
    ],
    'ratios': [
        'r_c = P2 / P1'
    ]
}

new Cycle(testStates)