import { setNestedProperty, rgbToHex } from './helpers.js';

export function exportTheme(variables) {
    try {
        const formattedTheme = formatThemeVariables(variables);

        const jsonData = JSON.stringify(formattedTheme, null, 2);

        const variableCount = Object.values(variables).flat().length;

        figma.ui.postMessage({
            type: 'export-json',
            data: jsonData,
            count: variableCount,
            category: 'theme'
        });

        console.log(`Export completed. ${variableCount} variables exported.`);
    } catch (error) {
        console.error('Error exporting all variables:', error);
        figma.ui.postMessage({
            type: 'error',
            message: 'An error occurred while exporting all variables: ' + error.message
        });
    }
}

const themeConfig = {
    text_colours: {
        prefix: 'Text Colours',
        mapping: {
            'textPrimary': 'theme_primary_text_colour',
            'textSecondary': 'theme_secondary_text_colour',
            'textTertiary': 'theme_tertiary_text_colour'
        }
    },
    background_colours: {
        prefix: 'Background Colours',
        mapping: {
            'backgroundPrimary': 'theme_primary_background_colour',
            'backgroundSecondary': 'theme_secondary_background_colour',
            'backgroundTertiary': 'theme_tertiary_background_colour'
        }
    },
    link_colours: {
        prefix: 'Link Colours',
        mapping: {
            'linkDefault': 'link_colour',
            'linkHover': 'link_colour_hover',
            'linkDecoration': 'link_decoration_colour',
            'linkDecorationHover': 'link_decoration_colour_hover'
        }
    },
    fonts: {
        prefix: 'Fonts',
        mapping: {
            '__var(--primary-font-family)': 'theme_primary_font.font',
            '__var(--primary-font-secondary': 'theme_secondary_font.font',
            '__var(--primary-font-tertiary': 'theme_tertiary_font.font',
            '__var(--primary-font-quaternary)': 'theme_quaternary_font.font'
        }
    },
    link_decoration: {
        prefix: 'Link Decoration',
        mapping: {
            'linkDecorationDefault': 'links.link_decoration_style',
            'linkDecorationHover': 'links.link_decoration_style_hover'
        }
    }
};
export function formatThemeVariables(variables) {
    const theme = {
        theme_name: figma.root.name,
        text_colours: [],
        theme_colours: [],
        theme_primary_background_type: "__solid-colour",
        links: {}
    };

    const themeSettings = variables['Theme Settings'];
    if (themeSettings) {
        themeSettings.forEach(v => {
            const value = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
            Object.entries(themeConfig).forEach(([configKey, config]) => {
                if (v.name.includes(config.prefix)) {
                    if (v.resolvedType === 'COLOR') {
                        const hexColor = rgbToHex(value.r, value.g, value.b);
                        if (configKey === 'text_colours') {
                            theme.text_colours.push({ name: v.name.split('/').pop(), colour: hexColor });
                        } else if (configKey === 'background_colours') {
                            theme.theme_colours.push({ name: v.name.split('/').pop(), theme_colour: hexColor });
                        }
                        Object.entries(config.mapping).forEach(([key, themeKey]) => {
                            if (v.name.includes(key)) {
                                setNestedProperty(theme, themeKey, hexColor);
                            }
                        });
                    } else if (v.resolvedType === 'STRING') {
                        Object.entries(config.mapping).forEach(([key, themeKey]) => {
                            if (v.name.includes(key)) {
                                setNestedProperty(theme, themeKey, value);
                            }
                        });
                    }
                }
            });
        });
    }

    return [theme];
}
