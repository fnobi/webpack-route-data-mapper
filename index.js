const HTMLWebpackPlugin = require('html-webpack-plugin');
const glob = require('glob');
const _ = require('lodash');
const path = require('path');

const ID_REGEXP = /:([a-zA-Z0-9_]+)/;

// 'hoge' => { hoge: {} }
function singleKeyObject(key, data = {}) {
    return _([key])
        .invert()
        .mapValues(_.constant(data))
        .value();
}

// 渡されたパスが.htmlで終わらない場合、ディレクトリ名とみなし、 `index.html` を付け足す
function completeHtmlPath(pathName) {
    return /\.html$/.test(pathName) ? pathName : path.join(pathName, 'index.html');
}

function massProduction(base, data) {
    const result = _.map(base, (baseData, destPath) => {
        const idMatch = destPath.match(ID_REGEXP);
        let rowForPathName;
        if (idMatch) {
            const key = idMatch[1];
            rowForPathName = _(data[key] || {})
                .mapKeys((row, id) => destPath.replace(ID_REGEXP, id))
                .mapValues((row) => Object.assign({}, baseData, singleKeyObject(key, row)))
                .value();
        } else {
            rowForPathName = singleKeyObject(destPath);
        }
        return _.mapKeys(rowForPathName, (row, pathName) => completeHtmlPath(pathName));
    });
    const rowForPathName = _.merge.apply(this, result);
    return _.some(rowForPathName, (row, pathName) => ID_REGEXP.test(pathName))
        ? massProduction(rowForPathName, data)
        : rowForPathName;
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
                ? massProduction(singleKeyObject(matchingPathName), data)
                : simpleProduction(template);

            return _.map(rowForPathName, (row, pathName) => {
                const filename = pathName.replace(/^\//, '');
                return new HTMLWebpackPlugin({
                    template: path.join(baseDir, template),
                    filename,
                    title: false,
                    hash: true,
                    templateParameters: Object.assign(
                        {
                            $route: filename,
                        },
                        locals,
                        row,
                    ),
                });
            });
        })
        .flatten()
        .value();
};
