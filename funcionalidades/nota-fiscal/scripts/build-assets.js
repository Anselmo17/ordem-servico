var fs = require('fs');
var path = require('path');

var pasta = path.resolve(__dirname, '..');
var pacotePdf = path.join(pasta, 'node_modules', 'pdf-lib');

fs.copyFileSync(
  path.join(pacotePdf, 'dist', 'pdf-lib.min.js'),
  path.join(pasta, 'pdf-lib.min.js')
);
fs.copyFileSync(path.join(pacotePdf, 'LICENSE.md'), path.join(pasta, 'pdf-lib.LICENSE.md'));

var template = fs.readFileSync(path.join(pasta, 'notaFiscalTemplate.pdf'));
fs.writeFileSync(
  path.join(pasta, 'notaFiscalTemplate.js'),
  'window.notaFiscalTemplateBase64 = \'' + template.toString('base64') + '\';\n'
);
