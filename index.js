const HTMLWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');
const _ = require('lodash');
const path = require('path');

const ID_REGEXP = /:([a-zA-Z0-9_]+)/;

// 'hoge' => { hoge: {} }
function singleKeyObject(key) {
    return _([key])
        .invert()
        .mapValues(_.constant({}))
        .value();
}

// 渡されたパスが.htmlで終わらない場合、ディレクトリ名とみなし、 `index.html` を付け足す
function completeHtmlPath(pathName) {
    return /\.html$/.test(pathName) ? pathName : path.join(pathName, 'index.html');
}

function massProduction(destPath, data) {
    const idMatch = destPath.match(ID_REGEXP);
    // TODO: 複数回ID_REGEXPにマッチするようなケース
    const rowForPathName = idMatch
        ? _(data[idMatch[1]] || {})
            .mapKeys((row, id) => destPath.replace(ID_REGEXP, id))
            .value()
        : singleKeyObject(destPath);
    return _.mapKeys(rowForPathName, (row, pathName) => completeHtmlPath(pathName));
}

function simpleProduction(template) {
    const ext = path.extname(template);
    const dest = template.replace(new RegExp(`${ext}$`), '.html');
    return singleKeyObject(dest);
}

module.exports = function routeDataMapper({
    src, baseDir, routes = {}, locals = {}, data = {},
}) {
    return _(glob.sync(src, { cwd: baseDir }))
        .map((template) => {
            const matchingPathName = _(routes)
                .keys()
                .find((pathName) => routes[pathName] === template);

            const rowForPathName = matchingPathName
                ? massProduction(matchingPathName, data)
                : simpleProduction(template);

            return _.map(
                rowForPathName,
                (row, pathName) =>
                    new HTMLWebpackPlugin({
                        template: path.join(baseDir, template),
                        filename: pathName.replace(/^\//, ''),
                        title: false,
                        hash: true,
                        templateParameters: Object.assign({}, locals, row),
                    }),
            );
        })
        .flatten()
        .value();
};
