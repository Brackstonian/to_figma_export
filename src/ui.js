import { getAllVariables } from './helpers.js';
import { exportTheme } from './export-theme.js';
import { exportTypography } from './export-typography.js';
import { exportAll } from './export-all.js';


figma.showUI(__html__, { width: 300, height: 250 });

figma.ui.onmessage = async msg => {
    if (msg.type === 'export-variables') {
        const variables = await getAllVariables('all');
        switch (msg.category) {
            case 'theme':
                exportTheme(variables);
                break;
            case 'typography':
                await exportTypography(variables);
                break;
            case 'all':
                await exportAll(variables);
                break;
            default:
                console.error(`Unknown export category: ${msg.category}`);
        }
    }
};
