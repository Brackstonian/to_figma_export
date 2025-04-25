import { formatThemeVariables } from './export-theme.js';
import { formatTypographyVariables } from './export-typography.js';

export async function exportAll(variables) {
    try {
        const formattedTheme = formatThemeVariables(variables);
        const formattedTypography = await formatTypographyVariables(variables);

        const combinedData = {
            theme: formattedTheme,
            typography: formattedTypography
        };

        const jsonData = JSON.stringify(combinedData, null, 2);

        const variableCount = Object.values(variables).flat().length;

        figma.ui.postMessage({
            type: 'export-json',
            data: jsonData,
            count: variableCount,
            category: 'all'
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
