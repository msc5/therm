import { PathValues, stateTags, StateValues } from "./types"
import nodeKey from 'graphology-types'

const R = 0.287

// Pressure, Volume, Temperature ()
class State {
    values: Map<string, number>
    constructor() {
        this.values = new Map<string, number>()
    }
}

// Work, Heat
class Path {
    values: Map<string, number>
    constructor() {
        this.values = new Map<string, number>()
    }
}

class Ideal {

    completeSelf(s: State) {
        var has = s.values.has
        var set = s.values.set
        var get = s.values.get
        if (has('P') && has('v')) {
            set('T', (get('P') * get('v')) / R)
        }
    }

}

class Cycle {
    nodes: nodeKey[]

}

class Diagram {

}

var relations = {
    'isentropic': 'T2 / T1 = (P2 / P1) ^ ((GAMMA - 1) / GAMMA)',

}

// Example

// 1: T2 / T1 = (P2 / P1)**((gamma - 1) / gamma)
// 2: T1 = (P1 * v1) / R

// solve for T1, T2...