function filterAndMapVariables(variables, collectionId) {
    return variables
        .filter(v => v.variableCollectionId === collectionId)
        .map(mapVariableData);
}
function mapVariableData(variable) {
    return {
        name: variable.name,
        id: variable.id,
        resolvedType: variable.resolvedType,
        valuesByMode: variable.valuesByMode
    };
}
export async function getAllVariables(category = 'all') {
    try {
        const [variables, collections] = await Promise.all([
            figma.variables.getLocalVariablesAsync(),
            figma.variables.getLocalVariableCollectionsAsync()
        ]);

        return collections.reduce((acc, collection) => {
            const collectionVariables = filterAndMapVariables(variables, collection.id);
            if (shouldIncludeCollection(category, collection.name)) {
                acc[collection.name] = collectionVariables;
            }
            return acc;
        }, {});
    } catch (error) {
        console.error('Error in getAllVariables:', error);
        throw error;
    }
}
export function rgbToHex(r, g, b) {
    const toHex = (value) => {
        const hex = Math.round(value * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
export function formatNumber(num) {
    num = typeof num === 'string' ? parseFloat(num) : num;
    if (Number.isInteger(num)) {
        return num.toString();
    }
    return num.toFixed(2);
}
export function setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}
export function shouldIncludeCollection(category, collectionName) {
    const categoryFilters = {
        'all': () => true,
        'theme': name => name === 'Theme Settings',
        'typography': name => name === 'Typography Settings'
    };
    return categoryFilters[category](collectionName);
}
export async function resolveAlias(variable) {
    if (variable.type === 'VARIABLE_ALIAS') {
        const referencedVariable = await figma.variables.getVariableByIdAsync(variable.id);
        if (referencedVariable) {
            return [referencedVariable.name];
        }
    }
    return variable;
}