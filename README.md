# Thermodynamic Cycle Solver

The goal of this program is to take as input some high-level representation (particularly, as a graph) of a thermodynamic cycle with sparsely-known state (Pressure, specific volume, temperature, etc.) and path values (Work, Heat, etc.), outputting the full cycle with all values known (which are possible to be determined).

Some note that this program is nothing but a solver of systems of equations, and to some degree this is true, but its real advantage in that regard is being able to solve thermodynamic cycles quickly and deterministically, that is, without iteration. Moreover, this program is designed to be simple and as abstract as possible, allowing for applications to very general cycles, such as combined cycles with multiple working fluids, as well as unique combinations of reheats or open feedwater heating, or complex backworking turbines for example. 

## Implementation

### Lexical Analyzer

This program utilizes a lexical analyzer in order to organize string input for the parser, and thereby allow for user-defined state relations. (E.g., if a thermodynamic process is not implemented already, it is possible for the user to input their own.) Many of the basic processes are already implemented, i.e., "isentropic", "adiabatic", etc.

### Parser

The parser implemented in this program uses a precedence-climbing algorithm to recursively parse tokens from the lexical analyzer into abstract syntax trees (ASTs), which are then used to store abstract relations such as the ones mentioned above.

### Abstract Syntax Trees (ASTs)

An extremely rudimentary solving algorithm is implemented in this program for manipulating the AST in order to compute unknown values in the graph representation of each cycle. The AST is thus able to 'solve' for variables in its equations, as shown below:

<!-- ![alt text](https://github.com/msc5/therm/blob//image.jpg?raw=true) -->

### Graph Represenation of Cycles

Each cycle is input as a collection of nodes and edges each representing states and processes in the cycle, with information describing the working fluid and known values. Using this input, the program creates a more complex "Value Graph", which compiles all the known and unknown values into a much larger graph representation which includes all of the specified relations and their corresponding ASTs.

To solve the cycle, the program recursively iterates from each unknown value in the graph, using memoization to keep track of visited and known values. When an equation is visited which has all but one known value, the program is able to solve the AST and compute the value. When an equation is visited which has missing values, the program recurs over its linked values and so on, until either the value is determined or it is unable to find a solution. Due to the nature of the graph and the recursion, this necessarily means that the input graph was missing the required state or path values needed to determine the given value, and this is thereby classed as user error.

## To-do

Although the program is mostly implemented, there are still many key features which are missing, and many more which would make the program more robust and user-friendly.

- AST Solver robustness
    - Currently, the equation solver is unable to handle inputs with multiple reoccurences of the same variable, as well as some specific mathematical operations, such as logarithms, integration, and differentiation.