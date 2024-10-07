figma.showUI(__html__, { width: 300, height: 200 });

function logAvailableMethods(obj, name) {
  console.log(`Available methods for ${name}:`, Object.getOwnPropertyNames(obj).filter(prop => typeof obj[prop] === 'function'));
}

async function getAllVariables() {
  try {
    logAvailableMethods(figma.variables, 'figma.variables');

    const getVariables = figma.variables.getLocalVariablesAsync;
    if (typeof getVariables !== 'function') throw new Error('getLocalVariablesAsync missing');

    const [variables, collections] = await Promise.all([
      getVariables(),
      figma.variables.getLocalVariableCollectionsAsync()
    ]);

    return collections.reduce((acc, collection) => {
      acc[collection.name] = variables
        .filter(v => v.variableCollectionId === collection.id)
        .map(({ name, id, resolvedType, valuesByMode }) => ({ name, id, resolvedType, valuesByMode }));
      return acc;
    }, {});

  } catch (error) {
    console.error('Error in getAllVariables:', error);
    throw error;
  }
}

function variablesToJSON(variables) {
  return JSON.stringify(variables, null, 2);
}

async function exportVariables() {
  try {
    const variables = await getAllVariables();
    const jsonData = variablesToJSON(variables);
    figma.ui.postMessage({
      type: 'export-json',
      data: jsonData,
      count: Object.values(variables).flat().length
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: 'Error exporting variables: ' + error.message
    });
  }
}

figma.ui.onmessage = msg => {
  if (msg.type === 'export-variables') {
    exportVariables();
  }
}
