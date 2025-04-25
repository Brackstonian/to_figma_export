import { rgbToHex, formatNumber, resolveAlias } from './helpers.js';

export async function exportTypography(variables) {
    try {
        const formattedTypography = await formatTypographyVariables(variables);

        const jsonData = JSON.stringify(formattedTypography, null, 2);

        const variableCount = Object.values(variables).flat().length;

        figma.ui.postMessage({
            type: 'export-json',
            data: jsonData,
            count: variableCount,
            category: 'typography'
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

export async function formatTypographyVariables(variables) {
    const typography = {
        headings: {},
        sub_headings: {},
        paragraphs: {
            line_height: "",
            letter_spacing: "",
            font_family: "",
            default_font_weight: "",
            bold_font_weight: "",
            sizes: {}
        },
        links: {},
        spacing: {}
    };

    const typographySettings = variables['Typography Settings'];
    if (typographySettings) {
        for (const v of typographySettings) {
            const value = await resolveAlias(v.valuesByMode[Object.keys(v.valuesByMode)[0]]);
            const nameParts = v.name.split('/');

            if (nameParts[0] === 'Headings' || nameParts[0] === 'Sub Headings') {
                const category = nameParts[0].toLowerCase().replace(' ', '_');
                let size = nameParts[1].toLowerCase().replace('-', '_');
                size = size === 'x_large' ? 'extra_large' : size === 'x_small' ? 'extra_small' : size;
                const property = nameParts[2].toLowerCase().replace('-', '_');

                if (!typography[category][size]) {
                    typography[category][size] = {
                        letter_spacing: "",
                        line_height: "",
                        default_font_weight: "",
                        bold_font_weight: "",
                        font_family: "",
                        sizes: {
                            desktop: "",
                            landscape: "",
                            portrait: "",
                            mobile: ""
                        }
                    };
                }

                if (property.startsWith('font_size')) {
                    const screenSize = property.split(' ')[1].toLowerCase();
                    typography[category][size].sizes[screenSize] = formatNumber(value);
                } else if (property === 'default_font_weight' || property === 'default_font-weight') {
                    typography[category][size].default_font_weight = formatNumber(value);
                } else if (property === 'default_bold_font_weight' || property === 'default_bold-font-weight') {
                    typography[category][size].bold_font_weight = formatNumber(value);
                } else if (property === 'font_family') {
                    let fontValue = JSON.stringify(value).split('/')[1];
                    if (fontValue) {
                        fontValue = fontValue.replace(/"\]$/, '');
                    }
                    typography[category][size].font_family = fontValue;
                } else {
                    typography[category][size][property] = formatNumber(value);
                }
            } else if (nameParts[0] === 'Paragraphs') {
                if (nameParts[1] === 'Paragraph Sizes' && nameParts[2] && nameParts[3]) {
                    let size = 'p_' + nameParts[2].toLowerCase().replace(' ', '_').replace('x-', 'x_');
                    const screenSize = nameParts[3].toLowerCase();
                    if (!typography.paragraphs.sizes[size]) {
                        typography.paragraphs.sizes[size] = {
                            desktop: "",
                            landscape: "",
                            portrait: "",
                            mobile: ""
                        };
                    }
                    console.log(typography.paragraphs.sizes[size]);
                    console.log(value);
                    typography.paragraphs.sizes[size][screenSize] = formatNumber(value);
                } else if (nameParts[1]) {
                    const property = nameParts[1].replace(/([A-Z])/g, '_$1').toLowerCase().replace('paragraph_', '');
                    if (property === 'font_family') {
                        typography.paragraphs[property] = "__var(--secondary-font-family)";
                    } else {
                        typography.paragraphs[property] = formatNumber(value);
                    }
                }
            } else if (nameParts[0] === 'Links') {
                const property = nameParts[1].replace(/([A-Z])/g, '_$1').toLowerCase();
                if (v.resolvedType === 'COLOR') {
                    typography.links[property] = rgbToHex(value.r, value.g, value.b);
                } else {
                    typography.links[property] = value.toString();
                }
            } else if (nameParts[0] === 'Spacing') {
                const property = nameParts[1].replace(/([A-Z])/g, '_$1').toLowerCase();
                typography.spacing[property] = formatNumber(value);
            }
        }
    }

    return [typography];
}