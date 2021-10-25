export interface SVP {
    P: number
    Tsat: number
    hf: number
    hfg: number
    hg: number
    uf: number
    ufg: number
    ug: number
    vf: number
    vg: number
    sf: number
    sfg: number
    sg: number
}

export interface SVT {
    T: number
    Psat: number
    hf: number
    hfg: number
    hg: number
    uf: number
    ufg: number
    ug: number
    vf: number
    vg: number
    sf: number
    sfg: number
    sg: number
}

export interface StateValues<Type> {
    fluid: FluidType
    P?: Type
    T?: Type
    V?: Type
    v?: Type
    m?: Type
    h?: Type
    s?: Type
    X?: Type
}

export interface PathValues<Type> {
    fluid: FluidType
    type: PathType
    W?: Type
    Q?: Type
    vratio?: Type
    pratio?: Type
    eta?: Type
}

export interface Options {
    k?: number
    cp?: number
    cv?: number
    isCycle: boolean
    fluidType?: FluidType
    cycleType: CycleType
}

export type FluidType = 'gas' | 'vapor' | 'none'

export type PathType =
    | 'end'
    | 'ideal'
    | 'adiabatic'
    | 'isentropic'
    | 'isentropic pump'
    | 'isentropic compressor'
    | 'isentropic turbine'
    | 'constant heat'
    | 'constant pressure'
    | 'constant temperature'
    | 'constant volume'

export var pathTypes = [
    'adiabatic',
    'isentropic',
    'isentropic pump',
    'constant heat',
    'constant pressure',
    'constant temperature',
    'constant volume',
]

export type CycleType =
    | 'carnot'
    | 'diesel'
    | 'otto'
    | 'brayton'
    | 'jet'
    | 'rankine'

export var stateTags = [
    'fluid',
    'P',
    'T',
    'v',
    'h',
    's',
    'X',
    'V',
    'm'
]

export var stateNames = [
    'Pressure',
    'Temperature',
    'Specific Volume',
    'Enthalpy',
    'Entropy',
    'Quality',
    'Volume',
    'Mass'
]

export var stateUnits = [
    'kPa',
    'K',
    'm^3/kg',
    'kJ/kg',
    'kJ/kgK',
    '',
    'm^3',
    'kg'
]

export var pathTags = [
    'type',
    'W',
    'Q',
    'pratio',
    'vratio',
    'eta'
]

export var pathNames = [
    'Work',
    'Heat',
    'Pressure Ratio',
    'Volume Ratio',
    'Isentropic Efficiency'
]

export var pathUnits = [
    'kJ/kg',
    'kJ/kg',
    '',
    ''
]

export var cycleTags = [
    'Eff',
    'Wnet',
    'Qh',
    'Ql',
]

export var cycleNames = [
    'Efficiency',
    'Net Work',
    'Heat In',
    'Heat Out'
]

export var cycleUnits = [
    '%',
    'kJ/kg',
    'kJ/kg',
    'kJ/kg',
]

export interface Point {
    x: number,
    y: number
}

export interface HTMLPoint {
    left: number,
    top: number
}

export type ComponentType =
    | 'turbine'
    | 'compressor'
    | 'combustion chamber'
    | 'condenser'

export type PortType =
    | 'in'
    | 'out'
    | 'both'
    | 'ghost'

export type Direction =
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'none'