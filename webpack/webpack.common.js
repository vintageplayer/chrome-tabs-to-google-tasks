const webpack = require("webpack");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.join(__dirname, "..", "src");
const fs = require("fs");

// Uncomment this if using dotenv to load environment variables
// const dotenv = require("dotenv");
// dotenv.config();

const replacePlaceholdersInManifest = () => {
    const templatePath = path.resolve(srcDir, "manifest.template.json");
    const outputPath = path.resolve(__dirname, "../dist/manifest.json");
  
    let manifestContent = fs.readFileSync(templatePath, "utf8");
  
    // Replace all placeholders
    // manifestContent = manifestContent.replace(/__A_PLACEHOLDER__/g, process.env.VALUE_FOR_PLACEHOLDER);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, manifestContent);
};

const allEntries = {
    popup: path.join(srcDir, 'popup/index.tsx'),
    options: path.join(srcDir, 'options/index.tsx'),
    background: path.join(srcDir, 'background/background.ts'),
    content_script: path.join(srcDir, 'content/content_script.tsx'),
}

const existingEntries = Object.fromEntries(
    Object.entries(allEntries).filter(([_, path]) => fs.existsSync(path))
);

module.exports = {
    entry: existingEntries,
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
                compiler.hooks.watchRun.tap("InjectManifestPlugin", injectManifest);
            }
        }
    ],
};
