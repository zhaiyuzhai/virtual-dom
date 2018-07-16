const path=require('path');
const HtmlWebpackPlugin=require('html-webpack-plugin');
module.exports=[
  {
    entry:'./src/export.js',
    output:{
      library:'snabbdom',//导出库的名称
      libraryTarget:'umd',//导出的规范将以commonJs，AMD，window的形式进行导出
      libraryExport:'default',// export default 的内容将被导出
      filename:'snabbdom.js',
      path:path.join(__dirname,'dist')
    }
  },
  {
    entry: './demo/app.js',
    output: {
      filename: 'bundle.js',
      path: path.join(__dirname, 'dist')
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'snabbdom',
        template: 'demo/index.ejs'
      })
    ]
  }
];