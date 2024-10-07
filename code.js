figma.showUI(__html__, { width: 300, height: 250 });

async function getAllVariables(category = 'all') {
  try {
    const variables = await figma.variables.getLocalVariablesAsync();
    const collections = await figma.variables.getLocalVariableCollectionsAsync();

    const allVariables = {};

    for (const collection of collections) {
      const collectionVariables = variables
        .filter(v => v.variableCollectionId === collection.id)
        .map(variable => ({
          name: variable.name,
          id: variable.id,
          resolvedType: variable.resolvedType,
          valuesByMode: variable.valuesByMode
        }));

      if (category === 'all' || (category === 'theme' && isThemeCollection(collection.name))) {
        allVariables[collection.name] = collectionVariables;
      }
    }

    return allVariables;
  } catch (error) {
    console.error('Error in getAllVariables:', error);
    throw error;
  }
}

function isThemeCollection(collectionName) {
  const themeCategories = ['Text Colours', 'Background Colours', 'Link Colours', 'Fonts', 'Link Decoration'];
  return themeCategories.includes(collectionName);
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
}

function formatThemeVariables(variables) {
  const theme = {
    theme_name: figma.root.name, // You might want to make this dynamic
    text_colours: [],
    theme_colours: [],
    theme_primary_text_colour: "",
    theme_secondary_text_colour: "",
    theme_tertiary_text_colour: "",
    theme_primary_background_type: "__solid-colour",
    theme_primary_background_colour: "",
    theme_primary_background_gradient: "",
    theme_secondary_background_colour: "",
    theme_tertiary_background_colour: "",
    theme_primary_font: { font: "" },
    theme_secondary_font: { font: "" },
    theme_tertiary_font: { font: "" },
    theme_quaternary_font: { font: "" },
    links: {
      link_colour: "",
      link_colour_hover: "",
      link_decoration_style: "",
      link_decoration_colour: "",
      link_decoration_style_hover: "",
      link_decoration_colour_hover: ""
    }
  };

  for (const [collectionName, vars] of Object.entries(variables)) {
    switch (collectionName) {
      case 'Text Colours':
        vars.forEach(v => {
          const color = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          const hexColor = rgbToHex(color.r, color.g, color.b);
          theme.text_colours.push({ name: v.name, colour: hexColor });
          if (v.name === 'textPrimary') theme.theme_primary_text_colour = hexColor;
          if (v.name === 'textSecondary') theme.theme_secondary_text_colour = hexColor;
          if (v.name === 'textTertiary') theme.theme_tertiary_text_colour = hexColor;
        });
        break;
      case 'Background Colours':
        vars.forEach(v => {
          const color = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          const hexColor = rgbToHex(color.r, color.g, color.b);
          theme.theme_colours.push({ name: v.name, theme_colour: hexColor });
          if (v.name === 'backgroundPrimary') theme.theme_primary_background_colour = hexColor;
          if (v.name === 'backgroundSecondary') theme.theme_secondary_background_colour = hexColor;
          if (v.name === 'backgroundTertiary') theme.theme_tertiary_background_colour = hexColor;
        });
        break;
      case 'Fonts':
        vars.forEach(v => {
          if (v.name === 'fontPrimary') theme.theme_primary_font.font = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          if (v.name === 'fontSecondary') theme.theme_secondary_font.font = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          if (v.name === 'fontTertiary') theme.theme_tertiary_font.font = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          if (v.name === 'fontQuaternary') theme.theme_quaternary_font.font = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
        });
        break;
      case 'Link Colours':
        vars.forEach(v => {
          const color = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          const hexColor = rgbToHex(color.r, color.g, color.b);
          if (v.name === 'linkDefault') theme.links.link_colour = hexColor;
          if (v.name === 'linkHover') theme.links.link_colour_hover = hexColor;
          if (v.name === 'linkDecoration') theme.links.link_decoration_colour = hexColor;
          if (v.name === 'linkDecorationHover') theme.links.link_decoration_colour_hover = hexColor;
        });
        break;
      case 'Link Decoration':
        vars.forEach(v => {
          if (v.name === 'linkDecorationDefault') theme.links.link_decoration_style = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
          if (v.name === 'linkDecorationHover') theme.links.link_decoration_style_hover = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
        });
        break;
    }
  }

  return [theme];
}

function variablesToJSON(variables, category) {
  if (category === 'theme') {
    return JSON.stringify(formatThemeVariables(variables), null, 2);
  }
  return JSON.stringify(variables, null, 2);
}

async function exportVariables(category) {
  try {
    const variables = await getAllVariables(category);
    const jsonData = variablesToJSON(variables, category);
    const variableCount = Object.values(variables).flat().length;

    figma.ui.postMessage({
      type: 'export-json',
      data: jsonData,
      count: variableCount,
      category: category
    });

    console.log(`Export completed. ${variableCount} ${category} variables exported.`);
  } catch (error) {
    console.error('Error exporting variables:', error);
    figma.ui.postMessage({
      type: 'error',
      message: 'An error occurred while exporting variables: ' + error.message
    });
  }
}

figma.ui.onmessage = msg => {
  if (msg.type === 'export-variables') {
    exportVariables(msg.category);
  }
}
