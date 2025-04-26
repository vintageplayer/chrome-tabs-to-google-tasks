const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");

const replacePlaceholdersInManifest = () => {
    const templatePath = path.resolve(srcDir, "manifest.template.json");
    const outputPath = path.resolve(__dirname, "../dist/manifest.json");
  
    let manifestContent = fs.readFileSync(templatePath, "utf8");
  
    // Replace all placeholders
    manifestContent = manifestContent.replace(/__GOOGLE_CLIENT_ID__/g, process.env.GOOGLE_CLIENT_ID);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, manifestContent);
  };

module.exports = {
    entry: {
      popup: path.join(srcDir, 'popup/index.tsx'),
      options: path.join(srcDir, 'options/index.tsx'),
      background: path.join(srcDir, 'background/background.ts'),
      content_script: path.join(srcDir, 'content/content_script.tsx'),
    },
    output: {
        path: path.join(__dirname, "../dist/js"),
        filename: "[name].js",
    },
    optimization: {
        splitChunks: {
            name: "vendor",
            chunks(chunk) {
              return chunk.name !== 'background';
            }
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                use: [
                    "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                ident: "postcss",
                                plugins: ["tailwindcss", "autoprefixer"],
                            },
                        },
                    },
                ],
                test: /\.css$/i,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: ".", to: "../", context: "public" }],
            options: {},
        }),
        {
            apply: (compiler) => {
                const injectManifest = () => replacePlaceholdersInManifest();
                
                compiler.hooks.beforeRun.tap("InjectManifestPlugin", injectManifest);
                compiler.hooks.beforeCompile.tap("InjectManifestPlugin", injectManifest);
                compiler.hooks.watchRun.tapAsync("InjectManifestPlugin", injectManifest);
            }
        }
    ],
};
