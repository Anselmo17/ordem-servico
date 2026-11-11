var inputDocumento = document.getElementById('documento');
var tipoIdentificado = document.getElementById('tipoIdentificado');

function formatarCpf(numeros) {
  if (numeros.length > 9) {
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numeros.length > 6) {
    return numeros.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  } else if (numeros.length > 3) {
    return numeros.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return numeros;
}

inputDocumento.addEventListener('input', function () {
  var numeros = inputDocumento.value.replace(/\D/g, '').slice(0, 20);

  if (numeros.length > 0 && numeros.length <= 11) {
    inputDocumento.value = formatarCpf(numeros);
    tipoIdentificado.textContent = numeros.length === 11
      ? 'Tipo identificado: CPF'
      : 'CPF (máscara aplicada)';
  } else if (numeros.length > 11) {
    inputDocumento.value = numeros;
    tipoIdentificado.textContent = 'Tipo identificado: RG';
  } else {
    inputDocumento.value = '';
    tipoIdentificado.textContent = 'O tipo será identificado automaticamente.';
  }
});

var inputContato = document.getElementById('contato');
inputContato.addEventListener('input', function () {
  var numeros = inputContato.value.replace(/\D/g, '').slice(0, 11);

  if (numeros.length > 10) {
    inputContato.value = numeros.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
  } else if (numeros.length > 6) {
    inputContato.value = numeros.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
  } else if (numeros.length > 2) {
    inputContato.value = numeros.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  } else if (numeros.length > 0) {
    inputContato.value = '(' + numeros;
  } else {
    inputContato.value = '';
  }
});

var pastaHandle = null;
var mensagemPasta = document.getElementById('pastaAtual');
mensagemPasta.textContent = 'Pasta selecionada: Downloads do navegador (padrão).';

if (!('showDirectoryPicker' in window)) {
  document.getElementById('btnPasta').style.display = 'none';
}

document.getElementById('btnPasta').addEventListener('click', async function () {
  try {
    var handle = await window.showDirectoryPicker({ startIn: 'documents', mode: 'readwrite' });
    if (await handle.requestPermission({ mode: 'readwrite' }) === 'granted') {
      pastaHandle = handle;
      mensagemPasta.textContent = 'Pasta selecionada: ' + handle.name;
    } else {
      pastaHandle = null;
      mensagemPasta.textContent = 'Sem permissão para a pasta. O arquivo será salvo nos Downloads.';
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      document.getElementById('erro').textContent = 'Não foi possível selecionar a pasta.';
    }
  }
});

function downloadPadrao(nome, blob) {
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

async function salvarArquivo(nome, blob) {
  if (pastaHandle) {
    if (await pastaHandle.queryPermission({ mode: 'readwrite' }) !== 'granted' &&
        await pastaHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
      throw new Error('Permissão de gravação negada para a pasta selecionada.');
    }
    var fileHandle = await pastaHandle.getFileHandle(nome, { create: true });
    var writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return 'na pasta selecionada "' + pastaHandle.name + '"';
  }
  downloadPadrao(nome, blob);
  return 'nos downloads do navegador';
}

function preencherLinhaDocx(xml, seletor, valor) {
  var paragrafo = xml.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'tr'
  )[seletor].getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'p'
  )[0];
  var namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  var propriedades = paragrafo.getElementsByTagNameNS(namespace, 'pPr')[0];

  while (paragrafo.firstChild) {
    paragrafo.removeChild(paragrafo.firstChild);
  }
  if (propriedades) {
    paragrafo.appendChild(propriedades);
  }

  valor.forEach(function (parte) {
    if (!parte.texto) return;

    var run = xml.createElementNS(namespace, 'w:r');
    if (parte.negrito) {
      var runProperties = xml.createElementNS(namespace, 'w:rPr');
      runProperties.appendChild(xml.createElementNS(namespace, 'w:b'));
      run.appendChild(runProperties);
    }

    var texto = xml.createElementNS(namespace, 'w:t');
    if (/^\s|\s$/.test(parte.texto)) {
      texto.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    }
    texto.textContent = parte.texto;
    run.appendChild(texto);
    paragrafo.appendChild(run);
  });
}

function crc32(bytes) {
  var crc = 0xffffffff;
  for (var i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (var bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function juntarBytes(partes) {
  var tamanho = partes.reduce(function (total, parte) { return total + parte.length; }, 0);
  var resultado = new Uint8Array(tamanho);
  var offset = 0;
  partes.forEach(function (parte) {
    resultado.set(parte, offset);
    offset += parte.length;
  });
  return resultado;
}

async function descompactarDados(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este navegador não consegue ler o modelo DOCX. Use uma versão atual do Chrome ou Edge.');
  }
  var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function lerTemplateDocx(bytes) {
  var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  var fimZip = -1;
  for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      fimZip = i;
      break;
    }
  }
  if (fimZip < 0) throw new Error('O arquivo do modelo não é um DOCX válido.');

  var quantidade = view.getUint16(fimZip + 10, true);
  var offsetCentral = view.getUint32(fimZip + 16, true);
  var cursor = offsetCentral;
  var decoder = new TextDecoder();
  var entradas = [];

  for (var indice = 0; indice < quantidade; indice++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error('O modelo DOCX está corrompido.');
    }
    var flags = view.getUint16(cursor + 8, true);
    var metodo = view.getUint16(cursor + 10, true);
    var tamanhoComprimido = view.getUint32(cursor + 20, true);
    var tamanhoOriginal = view.getUint32(cursor + 24, true);
    var tamanhoNome = view.getUint16(cursor + 28, true);
    var tamanhoExtra = view.getUint16(cursor + 30, true);
    var tamanhoComentario = view.getUint16(cursor + 32, true);
    var offsetLocal = view.getUint32(cursor + 42, true);
    var nome = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + tamanhoNome));

    if ((flags & 1) || tamanhoComprimido === 0xffffffff || tamanhoOriginal === 0xffffffff) {
      throw new Error('O modelo DOCX usa um formato de compactação não suportado.');
    }
    if (view.getUint32(offsetLocal, true) !== 0x04034b50) {
      throw new Error('O modelo DOCX está corrompido.');
    }

    var nomeLocal = view.getUint16(offsetLocal + 26, true);
    var extraLocal = view.getUint16(offsetLocal + 28, true);
    var inicioDados = offsetLocal + 30 + nomeLocal + extraLocal;
    var dadosComprimidos = bytes.subarray(inicioDados, inicioDados + tamanhoComprimido);
    var dados;

    if (metodo === 0) {
      dados = new Uint8Array(dadosComprimidos);
    } else if (metodo === 8) {
      dados = await descompactarDados(dadosComprimidos);
    } else {
      throw new Error('O modelo DOCX contém um tipo de compactação não suportado.');
    }
    if (dados.length !== tamanhoOriginal) {
      throw new Error('Não foi possível ler completamente o modelo DOCX.');
    }

    entradas.push({ nome: nome, dados: dados });
    cursor += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
  }
  return entradas;
}

function criarZipSemCompactacao(entradas) {
  var encoder = new TextEncoder();
  var locais = [];
  var centrais = [];
  var offset = 0;
  var agora = new Date();
  var hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | Math.floor(agora.getSeconds() / 2);
  var data = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();

  entradas.forEach(function (entrada) {
    var nome = encoder.encode(entrada.nome);
    var soma = crc32(entrada.dados);
    var local = new Uint8Array(30 + nome.length);
    var localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, hora, true);
    localView.setUint16(12, data, true);
    localView.setUint32(14, soma, true);
    localView.setUint32(18, entrada.dados.length, true);
    localView.setUint32(22, entrada.dados.length, true);
    localView.setUint16(26, nome.length, true);
    local.set(nome, 30);
    locais.push(local, entrada.dados);

    var central = new Uint8Array(46 + nome.length);
    var centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, hora, true);
    centralView.setUint16(14, data, true);
    centralView.setUint32(16, soma, true);
    centralView.setUint32(20, entrada.dados.length, true);
    centralView.setUint32(24, entrada.dados.length, true);
    centralView.setUint16(28, nome.length, true);
    centralView.setUint32(42, offset, true);
    central.set(nome, 46);
    centrais.push(central);
    offset += local.length + entrada.dados.length;
  });

  var bytesCentrais = juntarBytes(centrais);
  var fim = new Uint8Array(22);
  var fimView = new DataView(fim.buffer);
  fimView.setUint32(0, 0x06054b50, true);
  fimView.setUint16(8, entradas.length, true);
  fimView.setUint16(10, entradas.length, true);
  fimView.setUint32(12, bytesCentrais.length, true);
  fimView.setUint32(16, offset, true);

  return new Blob([juntarBytes(locais), bytesCentrais, fim], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

async function gerarDocumentoDoModelo(dados) {
  if (!window.ordemServicoTemplateBase64) {
    throw new Error('O modelo offline não foi carregado. Confira se ordemServicoTemplate.js está junto com index.html.');
  }

  var binario = atob(window.ordemServicoTemplateBase64);
  var bytesTemplate = new Uint8Array(binario.length);
  for (var i = 0; i < binario.length; i++) {
    bytesTemplate[i] = binario.charCodeAt(i);
  }
  var entradas = await lerTemplateDocx(bytesTemplate);
  var entradaDocumento = entradas.find(function (entrada) {
    return entrada.nome === 'word/document.xml';
  });
  if (!entradaDocumento) throw new Error('O modelo não contém o documento Word esperado.');

  var decoder = new TextDecoder();
  var parser = new DOMParser();
  var xml = parser.parseFromString(decoder.decode(entradaDocumento.dados), 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) {
    throw new Error('Não foi possível interpretar o conteúdo do modelo DOCX.');
  }
  var namespaceWord = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  var linhaIdentificacao = xml.getElementsByTagNameNS(namespaceWord, 'tr')[0];
  var textosMarca = linhaIdentificacao.getElementsByTagNameNS(namespaceWord, 't');
  var textoMarca = null;
  for (var indiceTexto = 0; indiceTexto < textosMarca.length; indiceTexto++) {
    if (textosMarca[indiceTexto].textContent.indexOf('JM DIGITAL') !== -1) {
      textoMarca = textosMarca[indiceTexto];
      break;
    }
  }
  if (textoMarca) {
    var run = textoMarca.parentNode;
    var propriedadesRun = run.getElementsByTagNameNS(namespaceWord, 'rPr')[0];
    if (!propriedadesRun) {
      propriedadesRun = xml.createElementNS(namespaceWord, 'w:rPr');
      run.insertBefore(propriedadesRun, textoMarca);
    }
    var posicaoVertical = xml.createElementNS(namespaceWord, 'w:position');
    posicaoVertical.setAttributeNS(namespaceWord, 'w:val', '8');
    var tamanhoFonte = propriedadesRun.getElementsByTagNameNS(namespaceWord, 'sz')[0];
    if (tamanhoFonte) {
      propriedadesRun.insertBefore(posicaoVertical, tamanhoFonte);
    } else {
      propriedadesRun.appendChild(posicaoVertical);
    }
  }
  var formatarLinha = function (rotulo, valor) {
    return [
      { texto: rotulo, negrito: true },
      { texto: valor ? ' ' + valor : '', negrito: false }
    ];
  };
  var capitalizarInicial = function (texto) {
    return texto
      ? texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1)
      : '';
  };

  preencherLinhaDocx(xml, 4, formatarLinha('NOME:', capitalizarInicial(dados.nome)));
  preencherLinhaDocx(xml, 5, formatarLinha('ENDERECO:', capitalizarInicial(dados.endereco)));
  preencherLinhaDocx(xml, 6, [
    { texto: 'CPF/RG:', negrito: true },
    { texto: dados.documento ? ' ' + dados.documento : '', negrito: false },
    { texto: '                                  CONTATO:', negrito: true },
    { texto: dados.contato ? ' ' + dados.contato : '', negrito: false }
  ]);
  preencherLinhaDocx(xml, 7, [
    { texto: 'DATA DE ENTRADA:', negrito: true },
    { texto: ' ' + dados.dataEntrada + '     ', negrito: false },
    { texto: 'DATA RETIRADA:', negrito: true }
  ]);
  preencherLinhaDocx(xml, 8, formatarLinha('MODELO:', capitalizarInicial(dados.modelo)));
  preencherLinhaDocx(xml, 9, formatarLinha('SERVICO REALIZADO:', capitalizarInicial(dados.servico)));

  entradaDocumento.dados = new TextEncoder().encode(new XMLSerializer().serializeToString(xml));
  return criarZipSemCompactacao(entradas);
}

var modalSucesso = document.getElementById('modalSucesso');
document.getElementById('fecharModal').addEventListener('click', function () {
  modalSucesso.close();
});

document.getElementById('formOS').addEventListener('submit', async function (e) {
  e.preventDefault();
  document.getElementById('erro').textContent = '';
  var botaoGerar = e.submitter;

  var documento = inputDocumento.value.trim();
  var nome = document.getElementById('nome').value.trim();
  var endereco = document.getElementById('endereco').value.trim();
  var contato = document.getElementById('contato').value.trim();
  var modelo = document.getElementById('modelo').value.trim();
  var servico = document.getElementById('servico').value.trim();
  var numerosDocumento = documento.replace(/\D/g, '');
  var tipo = documento
    ? (numerosDocumento.length <= 11 ? 'CPF' : 'RG')
    : '';

  var documentoValido = !documento || tipo === 'CPF' ||
    /^\d{5,20}$/.test(numerosDocumento);
  if (!documentoValido) {
    document.getElementById('erro').textContent = 'RG inválido.';
    return;
  }

  var documentoArquivo = !documento
    ? ''
    : tipo === 'CPF'
      ? numerosDocumento
      : numerosDocumento;
  var nomeArquivo = document.getElementById('nome').value.trim()
    .toLocaleUpperCase('pt-BR')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '') || 'CLIENTE';
  var dataAtual = new Date().toLocaleDateString('pt-BR');

  try {
    if (botaoGerar) {
      botaoGerar.disabled = true;
      botaoGerar.textContent = 'Salvando...';
    }
    var nomeCompletoArquivo = nomeArquivo +
      (documentoArquivo ? '-' + documentoArquivo : '') + '.docx';
    var blob = await gerarDocumentoDoModelo({
      nome: nome,
      endereco: endereco,
      documento: documento,
      contato: contato,
      dataEntrada: dataAtual,
      modelo: modelo,
      servico: servico
    });
    var destino = await salvarArquivo(nomeCompletoArquivo, blob);
    document.getElementById('mensagemSucesso').textContent =
      'O arquivo "' + nomeCompletoArquivo + '" foi salvo ' + destino + '.';
    modalSucesso.showModal();
    e.target.reset();
  } catch (err) {
    document.getElementById('erro').textContent =
      'Não foi possível salvar o arquivo: ' + err.message;
  } finally {
    if (botaoGerar) {
      botaoGerar.disabled = false;
      botaoGerar.textContent = 'Gerar Ordem de Serviço';
    }
  }
});
