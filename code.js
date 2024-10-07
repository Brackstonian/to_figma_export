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

      if (category === 'all' || (category === 'theme' && collection.name === 'Theme Settings')) {
        allVariables[collection.name] = collectionVariables;
      }
    }

    return allVariables;
  } catch (error) {
    console.error('Error in getAllVariables:', error);
    throw error;
  }
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255)).toString(16).slice(1);
}

function formatThemeVariables(variables) {
  const theme = {
    theme_name: figma.root.name,
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

  const themeSettings = variables['Theme Settings'];
  if (themeSettings) {
    themeSettings.forEach(v => {
      const value = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
      if (v.resolvedType === 'COLOR') {
        const hexColor = rgbToHex(value.r, value.g, value.b);
        if (v.name.includes('Text Colours')) {
          theme.text_colours.push({ name: v.name.split('/').pop(), colour: hexColor });
          if (v.name.includes('textPrimary')) theme.theme_primary_text_colour = hexColor;
          if (v.name.includes('textSecondary')) theme.theme_secondary_text_colour = hexColor;
          if (v.name.includes('textTertiary')) theme.theme_tertiary_text_colour = hexColor;
        } else if (v.name.includes('Background Colours')) {
          theme.theme_colours.push({ name: v.name.split('/').pop(), theme_colour: hexColor });
          if (v.name.includes('backgroundPrimary')) theme.theme_primary_background_colour = hexColor;
          if (v.name.includes('backgroundSecondary')) theme.theme_secondary_background_colour = hexColor;
          if (v.name.includes('backgroundTertiary')) theme.theme_tertiary_background_colour = hexColor;
        } else if (v.name.includes('Link Colours')) {
          if (v.name.includes('linkDefault')) theme.links.link_colour = hexColor;
          if (v.name.includes('linkHover')) theme.links.link_colour_hover = hexColor;
          if (v.name.includes('linkDecoration')) theme.links.link_decoration_colour = hexColor;
          if (v.name.includes('linkDecorationHover')) theme.links.link_decoration_colour_hover = hexColor;
        }
      } else if (v.resolvedType === 'STRING') {
        if (v.name.includes('Fonts')) {
          if (v.name.includes('fontPrimary')) theme.theme_primary_font.font = value;
          if (v.name.includes('fontSecondary')) theme.theme_secondary_font.font = value;
          if (v.name.includes('fontTertiary')) theme.theme_tertiary_font.font = value;
          if (v.name.includes('fontQuaternary')) theme.theme_quaternary_font.font = value;
        } else if (v.name.includes('Link Decoration')) {
          if (v.name.includes('linkDecorationDefault')) theme.links.link_decoration_style = value;
          if (v.name.includes('linkDecorationHover')) theme.links.link_decoration_style_hover = value;
        }
      }
    });
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
