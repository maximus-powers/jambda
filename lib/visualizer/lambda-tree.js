/**
 * Lambda Tree implementation for accurate John Tromp diagrams
 * Based on the structure provided
 */

class Node {
    constructor() {
        this.parent = null;
    }
}

class Variable extends Node {
    /**
     * 
     * @param {string} value - Variable name
     */
    constructor(value) {
        super();
        this.value = value;
    }

    depth() {
        return 0;
    }

    firstStepParent() {
        let parent = this.parent;
        while (parent && parent.constructor.name === "Lambda") {
            parent = parent.parent;
        }
        return parent;
    }

    next() {
        let parent = this.parent;
        let child = this;
        let delta = -1;
        
        while (parent && (parent.constructor.name === "Lambda" || 
               (parent.constructor.name === "Application" && parent.right === child))) {
            child = parent;
            parent = parent.parent;
            delta--;
        }
        
        if (parent && parent.constructor.name === "Application") {
            if (parent.left === child) {
                return [parent.right, delta + 1];
            }
        }
        
        return [null, delta];
    }

    size() {
        return 1;
    }

    copy() {
        return new Variable(this.value);
    }

    toString() {
        return this.value;
    }
}

class Lambda extends Node {
    /**
     * 
     * @param {string} variable - The bound variable name
     * @param {Node} body - The body of the lambda abstraction
     */
    constructor(variable, body) {
        super();
        this.variable = variable;
        this.body = body;
        this.body.parent = this;
    }

    depth() {
        return this.body.depth() + 1;
    }

    firstStepParentFromWhichThisIsSecondChild() {
        let parent = this.parent;
        let child = this;
        let delta = -1;
        
        while (parent && (parent.constructor.name === "Lambda" || 
               (parent.constructor.name === "Application" && parent.right !== child))) {
            child = parent;
            parent = parent.parent;
        }
        
        return parent;
    }

    next() {
        return [this.body, 1];
    }

    size() {
        return this.body.size();
    }

    copy() {
        return new Lambda(this.variable, this.body.copy());
    }

    toString() {
        return "(λ" + this.variable + "." + this.body.toString() + ")";
    }
}

class Application extends Node {
    /**
     * 
     * @param {Node} left - Left part of the application
     * @param {Node} right - Right part of the application
     */
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this.left.parent = this;
        this.right.parent = this;
    }

    depth() {
        const leftDepth = this.left.depth();
        const rightDepth = this.right.depth();
        return Math.max(leftDepth, rightDepth) + 1;
    }

    next() {
        return [this.left, 1];
    }

    size() {
        return this.left.size() + this.right.size();
    }

    copy() {
        return new Application(this.left.copy(), this.right.copy());
    }

    toString() {
        return "(" + this.left.toString() + " " + this.right.toString() + ")";
    }
}

/**
 * LambdaTree class for managing the entire lambda expression tree
 */
class LambdaTree {
    constructor() {
        this.root = null;
    }

    /**
     * Build a tree from a parsed lambda expression
     * @param {Object} parsedTerm - The parsed lambda expression
     * @returns {Node} The root node of the constructed tree
     */
    buildFromParsedTerm(parsedTerm) {
        if (!parsedTerm) return null;

        switch (parsedTerm.type) {
            case 'variable':
                return new Variable(parsedTerm.name);
                
            case 'abstraction':
                const lambda = new Lambda(
                    parsedTerm.variable, 
                    this.buildFromParsedTerm(parsedTerm.body)
                );
                return lambda;
                
            case 'application':
                const app = new Application(
                    this.buildFromParsedTerm(parsedTerm.left),
                    this.buildFromParsedTerm(parsedTerm.right)
                );
                return app;
                
            default:
                throw new Error(`Unknown term type: ${parsedTerm.type}`);
        }
    }

    /**
     * Process a lambda expression and build the tree
     * @param {Object} parsedTerm - The parsed lambda expression
     */
    process(parsedTerm) {
        this.root = this.buildFromParsedTerm(parsedTerm);
        return this.root;
    }

    /**
     * Get the string representation of the tree
     */
    toString() {
        return this.root ? this.root.toString() : "";
    }
}

module.exports = { LambdaTree, Node, Variable, Lambda, Application };