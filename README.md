webpack-route-data-mapper
====

```javascript
// webpack.config.js

const routeDataMapper = require('webpack-route-data-mapper');

const sharePageData = {
  a: {
    title: 'share page A'
  },
  b: {
    title: 'share page A'
  }
};

module.exports = {
  /*
    (your loader settings)
  */
  plugins: [
    routeDataMapper({
        baseDir: `./src/pug/page`,
        pattern: '**/[!_]*.pug',
        // template base locals data
        locals: {
          url: 'example site'
        },
        // mapping template name for html path
        routes: {
            '/share/:shares': 'share.pug'
        },
        // data for each routing
        data: {
            shares: sharePageData
        },
    })    
  ]
};

// => will generate `/share/a/index.html` and `/share/b/index.html`
```
