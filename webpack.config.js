// webpack.config.js
const path = require('path');

module.exports = {
    entry: './src/ui.js',
    output: {
        filename: 'plugin.js',
        path: path.resolve(__dirname, 'dist'),
    },
    watch: true,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js'],
    },
    mode: 'development',
    devtool: 'source-map'
};