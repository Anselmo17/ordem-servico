var formulario = document.getElementById('formNotaFiscal');
var modalSucesso = document.getElementById('modalSucesso');
var botaoGerar = document.getElementById('btnGerar');
var erro = document.getElementById('erro');
var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
var escalaModelo = 0.75;
var validacaoExibida = false;

function valorCampo(id) {
  return document.getElementById(id).value.trim();
}

function formatarCnpj(valor) {
  return valor.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarCpf(valor) {
  var digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length > 9) {
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  }
  if (digitos.length > 6) {
    return digitos.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  }
  if (digitos.length > 3) {
    return digitos.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  }
  return digitos;
}

function formatarCpfCnpj(valor) {
  var digitos = valor.replace(/\D/g, '').slice(0, 14);
  return digitos.length > 11 ? formatarCnpj(digitos) : formatarCpf(digitos);
}

function formatarTelefone(valor) {
  var digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return '(' + digitos;
  if (digitos.length <= 6) {
    return '(' + digitos.slice(0, 2) + ') ' + digitos.slice(2);
  }
  if (digitos.length <= 10) {
    return '(' + digitos.slice(0, 2) + ') ' +
      digitos.slice(2, 6) + '-' + digitos.slice(6);
  }
  return '(' + digitos.slice(0, 2) + ') ' +
    digitos.slice(2, 7) + '-' + digitos.slice(7);
}

document.getElementById('lojaCnpj').addEventListener('input', function (evento) {
  evento.target.value = formatarCnpj(evento.target.value);
});
document.getElementById('clienteCpfCnpj').addEventListener('input', function (evento) {
  evento.target.value = formatarCpfCnpj(evento.target.value);
});
['lojaTelefone', 'clienteTelefone'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', function (evento) {
    evento.target.value = formatarTelefone(evento.target.value);
  });
});

var regrasValidacao = [
  {
    id: 'lojaCnpj',
    mensagem: 'CNPJ da loja incompleto: informe 14 dígitos.',
    validar: function (digitos) { return digitos.length === 0 || digitos.length === 14; }
  },
  {
    id: 'clienteCpfCnpj',
    mensagem: 'CPF/CNPJ do cliente incompleto: informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).',
    validar: function (digitos) { return digitos.length === 0 || digitos.length === 11 || digitos.length === 14; }
  },
  {
    id: 'lojaTelefone',
    mensagem: 'Telefone da loja incompleto: informe DDD e número (10 ou 11 dígitos).',
    validar: function (digitos) { return digitos.length === 0 || digitos.length === 10 || digitos.length === 11; }
  },
  {
    id: 'clienteTelefone',
    mensagem: 'Telefone do cliente incompleto: informe DDD e número (10 ou 11 dígitos).',
    validar: function (digitos) { return digitos.length === 0 || digitos.length === 10 || digitos.length === 11; }
  }
];

function atualizarErrosValidacao() {
  var invalidos = [];
  regrasValidacao.forEach(function (regra) {
    var campo = document.getElementById(regra.id);
    var digitos = campo.value.replace(/\D/g, '');
    campo.removeAttribute('aria-invalid');
    if (!regra.validar(digitos)) {
      campo.setAttribute('aria-invalid', 'true');
      invalidos.push({ campo: campo, mensagem: regra.mensagem });
    }
  });
  erro.textContent = invalidos.map(function (item) { return item.mensagem; }).join('\n');
  return invalidos;
}

regrasValidacao.forEach(function (regra) {
  document.getElementById(regra.id).addEventListener('input', function () {
    if (validacaoExibida) atualizarErrosValidacao();
  });
});

function aplicarTema(tema) {
  document.body.setAttribute('data-tema', tema);
  document.querySelectorAll('[data-tema]').forEach(function (botao) {
    botao.setAttribute('aria-pressed', String(botao.dataset.tema === tema));
  });
}

document.querySelectorAll('[data-tema]').forEach(function (botao) {
  botao.addEventListener('click', function () { aplicarTema(botao.dataset.tema); });
});
aplicarTema('claro');

function lerMoeda(id) {
  var digitos = document.getElementById(id).value.replace(/\D/g, '');
  return digitos ? Number(digitos) / 100 : 0;
}

function formatarMoeda(id) {
  var input = document.getElementById(id);
  var digitos = input.value.replace(/\D/g, '');
  input.value = digitos ? moeda.format(Number(digitos) / 100) : '';
}

function quantidade(id) {
  return Number(document.getElementById(id).value.replace(',', '.')) || 0;
}

function linhaItem(quantidadeId, valorId) {
  var qtd = quantidade(quantidadeId);
  var unitario = lerMoeda(valorId);
  return { quantidade: qtd, unitario: unitario, subtotal: qtd * unitario };
}

function atualizarTotais() {
  var servico = linhaItem('quantidadeServico', 'valorServico');
  var peca = linhaItem('quantidadePeca', 'valorPeca');
  var adicional = linhaItem('quantidadeItemAdicional', 'valorItemAdicional');
  var tipoAdicional = valorCampo('tipoItemAdicional');
  var totalServicos = servico.subtotal + (tipoAdicional === 'Serviço' ? adicional.subtotal : 0);
  var totalPecas = peca.subtotal + (tipoAdicional === 'Peça' ? adicional.subtotal : 0);
  var desconto = lerMoeda('desconto');

  document.getElementById('subtotalServico').textContent = 'Subtotal: ' + moeda.format(servico.subtotal);
  document.getElementById('subtotalPeca').textContent = 'Subtotal: ' + moeda.format(peca.subtotal);
  document.getElementById('subtotalItemAdicional').textContent = 'Subtotal: ' + moeda.format(adicional.subtotal);
  document.getElementById('totalServicos').textContent = 'Total serviços: ' + moeda.format(totalServicos);
  document.getElementById('totalPecas').textContent = 'Total peças: ' + moeda.format(totalPecas);
  document.getElementById('totalGeral').textContent =
    'Total geral: ' + moeda.format(Math.max(0, totalServicos + totalPecas - desconto));
}

document.querySelectorAll('.campo-moeda').forEach(function (input) {
  input.addEventListener('input', function () {
    formatarMoeda(input.id);
    atualizarTotais();
  });
});
[
  'quantidadeServico', 'quantidadePeca', 'quantidadeItemAdicional', 'tipoItemAdicional'
].forEach(function (id) {
  document.getElementById(id).addEventListener('input', atualizarTotais);
});
atualizarTotais();

function formatarData(valor) {
  if (!valor) return '';
  var partes = valor.split('-');
  return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : valor;
}

function dataLocalISO() {
  var hoje = new Date();
  var deslocamento = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - deslocamento).toISOString().slice(0, 10);
}

document.getElementById('dataEntrada').value = dataLocalISO();
document.getElementById('dataEmissao').value = dataLocalISO();

function higienizarNomeArquivo(texto) {
  return texto.toLocaleUpperCase('pt-BR')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'CLIENTE';
}

function baixarArquivo(nome, bytes) {
  var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  var link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function converterPosicao(page, xModelo, yModelo) {
  return {
    x: xModelo * escalaModelo,
    y: page.getHeight() - yModelo * escalaModelo
  };
}

function ajustarTexto(font, texto, largura, tamanho, minimo) {
  var valor = String(texto || '').replace(/\s+/g, ' ').trim();
  var tamanhoAjustado = tamanho;

  while (valor && tamanhoAjustado > minimo &&
      font.widthOfTextAtSize(valor, tamanhoAjustado) > largura) {
    tamanhoAjustado = Math.max(minimo, tamanhoAjustado - 0.25);
  }
  if (valor && font.widthOfTextAtSize(valor, tamanhoAjustado) > largura) {
    var sufixo = '...';
    while (valor && font.widthOfTextAtSize(valor + sufixo, tamanhoAjustado) > largura) {
      valor = valor.slice(0, -1).trimEnd();
    }
    valor = valor ? valor + sufixo : '';
  }
  return { texto: valor, tamanho: tamanhoAjustado };
}

function escreverCampo(page, font, boldFont, xModelo, yModelo, largura, texto, opcoes) {
  var config = opcoes || {};
  var ponto = converterPosicao(page, xModelo, yModelo);
  var fonte = config.negrito ? boldFont : font;
  var ajustado = ajustarTexto(fonte, texto, largura - 3, config.tamanho || 8, config.minimo || 5.5);

  page.drawRectangle({
    x: ponto.x - 1,
    y: ponto.y - 2,
    width: largura + 2,
    height: Math.max(12, ajustado.tamanho + 4),
    color: config.fundo || PDFLib.rgb(1, 1, 1)
  });
  if (ajustado.texto) {
    page.drawText(ajustado.texto, {
      x: ponto.x,
      y: ponto.y,
      size: ajustado.tamanho,
      font: fonte,
      color: config.cor || PDFLib.rgb(0.08, 0.22, 0.38)
    });
  }
}

function desenharTabelaResumo(page, corFundoTotal) {
  var xEsquerda = 56.692913;
  var xDivisoria = 580.875062;
  var xDireita = 737.007874;
  var linhas = [732.224749, 774.024749, 815.824749, 843.110492, 871.442913];
  var cantoSuperior = converterPosicao(page, xEsquerda, linhas[0]);
  var cantoInferior = converterPosicao(page, xDireita, linhas[linhas.length - 1]);

  page.drawRectangle({
    x: cantoSuperior.x,
    y: cantoInferior.y,
    width: cantoInferior.x - cantoSuperior.x,
    height: cantoSuperior.y - cantoInferior.y,
    color: PDFLib.rgb(1, 1, 1)
  });

  var topoTotal = converterPosicao(page, xEsquerda, linhas[3]);
  page.drawRectangle({
    x: cantoSuperior.x,
    y: cantoInferior.y,
    width: cantoInferior.x - cantoSuperior.x,
    height: topoTotal.y - cantoInferior.y,
    color: corFundoTotal
  });

  var corBorda = PDFLib.rgb(0.796078, 0.835294, 0.878431);
  linhas.forEach(function (linha) {
    var inicio = converterPosicao(page, xEsquerda, linha);
    var fim = converterPosicao(page, xDireita, linha);
    page.drawLine({ start: inicio, end: fim, thickness: 0.75, color: corBorda });
  });
  [xEsquerda, xDivisoria, xDireita].forEach(function (x) {
    var topo = converterPosicao(page, x, linhas[0]);
    var base = converterPosicao(page, x, linhas[linhas.length - 1]);
    page.drawLine({ start: topo, end: base, thickness: 0.75, color: corBorda });
  });
}

function desenharRotuloResumo(page, font, boldFont, texto, yModelo, opcoes) {
  var ponto = converterPosicao(page, 65.692913, yModelo);
  var config = opcoes || {};
  var fonte = config.negrito ? boldFont : font;
  var largura = (580.875062 - 65.692913) * escalaModelo - 2;
  var ajustado = ajustarTexto(fonte, texto, largura, config.tamanho || 8, config.minimo || 7);
  page.drawText(ajustado.texto, {
    x: ponto.x,
    y: ponto.y,
    size: ajustado.tamanho,
    font: fonte,
    color: config.cor || PDFLib.rgb(0.13, 0.13, 0.13)
  });
}

function escreverBloco(page, font, boldFont, texto, linhas) {
  var x = 45;
  var y = 716;
  var larguraTexto = 294;
  page.drawRectangle({
    x: x - 2,
    y: y,
    width: 303,
    height: 81,
    color: PDFLib.rgb(1, 1, 1)
  });
  var primeiraLinha = String(texto.nome || '').trim();
  if (primeiraLinha) {
    var nomeAjustado = ajustarTexto(boldFont, primeiraLinha, larguraTexto, 14, 8.5);
    page.drawText(nomeAjustado.texto, {
      x: x,
      y: 782,
      size: nomeAjustado.tamanho,
      font: boldFont,
      color: PDFLib.rgb(0.08, 0.22, 0.38)
    });
  }
  linhas.forEach(function (linha, indice) {
    var valor = linha[0] + (linha[1] ? ' ' + linha[1] : '');
    if (!linha[1]) return;
    var valorAjustado = ajustarTexto(font, valor, larguraTexto, 7.5, 6);
    page.drawText(valorAjustado.texto, {
      x: x,
      y: 764 - indice * 11,
      size: valorAjustado.tamanho,
      font: font,
      color: PDFLib.rgb(0.12, 0.16, 0.22)
    });
  });
}

function desenharMultilinha(page, font, xModelo, yModelo, largura, texto) {
  var ponto = converterPosicao(page, xModelo, yModelo - 6);
  var valor = String(texto || '').replace(/\s+/g, ' ').trim();
  var tamanho = 7.5;
  var espacamentoLinha = 8.5;
  var palavras = valor.split(' ');
  var linhas = [];
  var linha = '';

  palavras.forEach(function (palavra) {
    var candidata = linha ? linha + ' ' + palavra : palavra;
    if (linha && font.widthOfTextAtSize(candidata, tamanho) > largura - 4) {
      linhas.push(linha);
      linha = palavra;
    } else {
      linha = candidata;
    }
  });
  if (linha) linhas.push(linha);

  page.drawRectangle({
    x: ponto.x - 1,
    y: ponto.y - 11,
    width: largura + 2,
    height: 15,
    color: PDFLib.rgb(1, 1, 1)
  });
  linhas.slice(0, 2).forEach(function (textoLinha, indice) {
    var valorLinha = indice === 1 && linhas.length > 2 ? textoLinha + '...' : textoLinha;
    var exibido = ajustarTexto(font, valorLinha, largura - 4, tamanho, tamanho).texto;
    if (exibido) {
      page.drawText(exibido, {
        x: ponto.x,
        y: ponto.y - indice * espacamentoLinha,
        size: tamanho,
        font: font,
        color: PDFLib.rgb(0.08, 0.22, 0.38)
      });
    }
  });
}

function obterDados() {
  var servico = linhaItem('quantidadeServico', 'valorServico');
  var peca = linhaItem('quantidadePeca', 'valorPeca');
  var adicional = linhaItem('quantidadeItemAdicional', 'valorItemAdicional');
  var totalServicos = servico.subtotal +
    (valorCampo('tipoItemAdicional') === 'Serviço' ? adicional.subtotal : 0);
  var totalPecas = peca.subtotal +
    (valorCampo('tipoItemAdicional') === 'Peça' ? adicional.subtotal : 0);
  var desconto = lerMoeda('desconto');

  return {
    lojaNome: valorCampo('lojaNome'),
    razaoSocial: valorCampo('razaoSocial'),
    lojaCnpj: valorCampo('lojaCnpj'),
    lojaIeIm: valorCampo('lojaIeIm'),
    lojaEndereco: valorCampo('lojaEndereco'),
    lojaTelefone: valorCampo('lojaTelefone'),
    lojaEmail: valorCampo('lojaEmail'),
    numeroDocumento: valorCampo('numeroDocumento'),
    dataEntrada: formatarData(valorCampo('dataEntrada')),
    dataEmissao: formatarData(valorCampo('dataEmissao')),
    statusReparo: valorCampo('statusReparo'),
    clienteNome: valorCampo('clienteNome'),
    clienteCpfCnpj: valorCampo('clienteCpfCnpj'),
    clienteEmail: valorCampo('clienteEmail'),
    clienteTelefone: valorCampo('clienteTelefone'),
    clienteEndereco: valorCampo('clienteEndereco'),
    aparelhoMarca: valorCampo('aparelhoMarca'),
    aparelhoModelo: valorCampo('aparelhoModelo'),
    aparelhoImei: valorCampo('aparelhoImei'),
    aparelhoAcessorios: valorCampo('aparelhoAcessorios'),
    aparelhoEstado: valorCampo('aparelhoEstado'),
    defeitoRelatado: valorCampo('defeitoRelatado'),
    laudoTecnico: valorCampo('laudoTecnico'),
    codigoServico: valorCampo('codigoServico'),
    descricaoServico: valorCampo('descricaoServico'),
    quantidadeServico: servico.quantidade,
    valorServico: servico.unitario,
    subtotalServico: servico.subtotal,
    ncmPeca: valorCampo('ncmPeca'),
    descricaoPeca: valorCampo('descricaoPeca'),
    quantidadePeca: peca.quantidade,
    valorPeca: peca.unitario,
    subtotalPeca: peca.subtotal,
    tipoItemAdicional: valorCampo('tipoItemAdicional'),
    codigoItemAdicional: valorCampo('codigoItemAdicional'),
    descricaoItemAdicional: valorCampo('descricaoItemAdicional'),
    quantidadeItemAdicional: adicional.quantidade,
    valorItemAdicional: adicional.unitario,
    subtotalItemAdicional: adicional.subtotal,
    totalServicos: totalServicos,
    totalPecas: totalPecas,
    desconto: desconto,
    totalGeral: Math.max(0, totalServicos + totalPecas - desconto),
    formaPagamento: valorCampo('formaPagamento'),
    numeroNfse: valorCampo('numeroNfse'),
    numeroNfe: valorCampo('numeroNfe'),
    diasGarantia: valorCampo('diasGarantia')
  };
}

async function gerarPdf(dados) {
  if (!window.PDFLib || !window.notaFiscalTemplateBase64) {
    throw new Error('Não foi possível carregar o gerador ou o modelo PDF da Nota Fiscal.');
  }

  var binario = atob(window.notaFiscalTemplateBase64);
  var bytesTemplate = new Uint8Array(binario.length);
  for (var i = 0; i < binario.length; i++) bytesTemplate[i] = binario.charCodeAt(i);

  var documento = await PDFLib.PDFDocument.load(bytesTemplate);
  var font = await documento.embedFont(PDFLib.StandardFonts.Helvetica);
  var boldFont = await documento.embedFont(PDFLib.StandardFonts.HelveticaBold);
  var pagina = documento.getPages()[0];
  var corFundoCabecalho = PDFLib.rgb(0.941176, 0.956863, 0.972549);
  var corFundoTotal = PDFLib.rgb(0.929412, 0.94902, 0.968627);

  escreverBloco(pagina, font, boldFont, { nome: dados.lojaNome }, [
    ['Razão Social:', dados.razaoSocial],
    ['CNPJ:', dados.lojaCnpj],
    ['IE / IM:', dados.lojaIeIm],
    ['Endereço:', dados.lojaEndereco],
    ['Contato:', [dados.lojaTelefone, dados.lojaEmail].filter(Boolean).join(' | ')]
  ]);
  escreverCampo(pagina, font, boldFont, 638.187562, 103.40639, 68, dados.numeroDocumento, { fundo: corFundoCabecalho });
  escreverCampo(pagina, font, boldFont, 618.382874, 119.692132, 82, dados.dataEntrada, { fundo: corFundoCabecalho });
  escreverCampo(pagina, font, boldFont, 618.382874, 135.977874, 82, dados.dataEmissao, { fundo: corFundoCabecalho });
  escreverCampo(pagina, font, boldFont, 611.781312, 152.263617, 87, dados.statusReparo, { fundo: corFundoCabecalho });

  escreverCampo(pagina, font, boldFont, 65.692913, 244.549359, 315, dados.clienteNome);
  escreverCampo(pagina, font, boldFont, 507.247638, 244.549359, 150, dados.clienteCpfCnpj);
  escreverCampo(pagina, font, boldFont, 65.692913, 288.435101, 315, dados.clienteEmail);
  escreverCampo(pagina, font, boldFont, 507.247638, 288.435101, 150, dados.clienteTelefone);
  escreverCampo(pagina, font, boldFont, 65.692913, 332.320843, 490, dados.clienteEndereco);

  escreverCampo(pagina, font, boldFont, 65.692913, 414.606585, 112, dados.aparelhoMarca);
  escreverCampo(pagina, font, boldFont, 235.521654, 414.606585, 170, dados.aparelhoModelo);
  escreverCampo(pagina, font, boldFont, 473.28189, 414.606585, 120, dados.aparelhoImei);
  escreverCampo(pagina, font, boldFont, 65.692913, 458.492327, 290, dados.aparelhoAcessorios);
  escreverCampo(pagina, font, boldFont, 473.28189, 458.492327, 120, dados.aparelhoEstado);
  desenharMultilinha(pagina, font, 65.692913, 502.37807, 490, dados.defeitoRelatado);
  desenharMultilinha(pagina, font, 65.692913, 546.263812, 490, dados.laudoTecnico);

  var linhas = [
    {
      y: 654.426702, xTipo: 65.692913, tipo: 'Serviço',
      codigo: dados.codigoServico, descricao: dados.descricaoServico,
      quantidade: dados.quantidadeServico, unitario: dados.valorServico, subtotal: dados.subtotalServico
    },
    {
      y: 683.189593, xTipo: 65.692913, tipo: 'Peça',
      codigo: dados.ncmPeca, descricao: dados.descricaoPeca,
      quantidade: dados.quantidadePeca, unitario: dados.valorPeca, subtotal: dados.subtotalPeca
    },
    {
      y: 711.952484, xTipo: 65.692913, tipo: dados.tipoItemAdicional,
      codigo: dados.codigoItemAdicional, descricao: dados.descricaoItemAdicional,
      quantidade: dados.quantidadeItemAdicional, unitario: dados.valorItemAdicional, subtotal: dados.subtotalItemAdicional
    }
  ];
  var formatarNumero = function (numero) {
    return numero ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(numero) : '';
  };
  linhas.forEach(function (linha, indice) {
    var temItem = Boolean(linha.codigo || linha.descricao || linha.unitario);
    if (indice === 2) {
      escreverCampo(pagina, font, boldFont, linha.xTipo, linha.y, 78, temItem ? linha.tipo : '', { tamanho: 7, minimo: 5.5 });
    }
    escreverCampo(pagina, font, boldFont, 181.716351, linha.y, 88, linha.codigo, { tamanho: 7, minimo: 5.5 });
    escreverCampo(pagina, font, boldFont, 310.942913, linha.y, 95, linha.descricao, { tamanho: 7, minimo: 5.5 });
    escreverCampo(pagina, font, boldFont, 449.750062, linha.y, 48, temItem ? formatarNumero(linha.quantidade) : '', { tamanho: 7, minimo: 5.5 });
    escreverCampo(pagina, font, boldFont, 526.164124, linha.y, 73, temItem ? moeda.format(linha.unitario) : '', { tamanho: 7, minimo: 5.5 });
    escreverCampo(pagina, font, boldFont, 635.585999, linha.y, 72, temItem ? moeda.format(linha.subtotal) : '', { tamanho: 7, minimo: 5.5 });
  });

  desenharTabelaResumo(pagina, corFundoTotal);
  desenharRotuloResumo(pagina, font, boldFont, 'Total Mão de Obra (NFS-e):', 756.938226);
  desenharRotuloResumo(pagina, font, boldFont, 'Total Peças (NF-e / NFC-e):', 798.738226);
  desenharRotuloResumo(pagina, font, boldFont, 'Desconto:', 833.281097);
  desenharRotuloResumo(pagina, font, boldFont, 'VALOR TOTAL GERAL:', 861.436859, {
    negrito: true,
    tamanho: 9,
    minimo: 7.5,
    cor: PDFLib.rgb(0.08, 0.22, 0.38)
  });

  escreverCampo(pagina, font, boldFont, 609.179749, 756.495355, 93, moeda.format(dados.totalServicos), { tamanho: 8 });
  escreverCampo(pagina, font, boldFont, 609.179749, 798.295355, 93, moeda.format(dados.totalPecas), { tamanho: 8 });
  escreverCampo(pagina, font, boldFont, 609.179749, 832.838226, 93, moeda.format(dados.desconto), { tamanho: 8 });
  escreverCampo(pagina, font, boldFont, 589.375062, 861.170648, 108, moeda.format(dados.totalGeral), {
    tamanho: 8,
    negrito: true,
    fundo: corFundoTotal
  });
  escreverCampo(pagina, font, boldFont, 65.692913, 942.45639, 170, dados.formaPagamento);
  escreverCampo(pagina, font, boldFont, 303.45315, 942.45639, 145, dados.numeroNfse);
  escreverCampo(pagina, font, boldFont, 520.833937, 942.45639, 110, dados.numeroNfe);
  escreverCampo(pagina, font, boldFont, 276.877484, 985.85639, 82, dados.diasGarantia, { tamanho: 8 });

  var assinatura = documento.getPages()[1];
  assinatura.drawRectangle({
    x: 40,
    y: assinatura.getHeight() - 112,
    width: 515,
    height: 82,
    color: PDFLib.rgb(1, 1, 1)
  });
  var lojaAssinatura = ajustarTexto(boldFont, dados.lojaNome, 210, 9, 6);
  assinatura.drawText(lojaAssinatura.texto, { x: 64, y: 790, size: lojaAssinatura.tamanho, font: boldFont, color: PDFLib.rgb(0.08, 0.22, 0.38) });
  assinatura.drawLine({ start: { x: 55, y: 778 }, end: { x: 270, y: 778 }, thickness: 0.7, color: PDFLib.rgb(0.2, 0.25, 0.3) });
  assinatura.drawText('Responsável Técnico / Atendimento', { x: 55, y: 762, size: 8, font: font, color: PDFLib.rgb(0.12, 0.16, 0.22) });
  var clienteAssinatura = ajustarTexto(boldFont, dados.clienteNome, 210, 9, 6);
  assinatura.drawText(clienteAssinatura.texto, { x: 330, y: 790, size: clienteAssinatura.tamanho, font: boldFont, color: PDFLib.rgb(0.08, 0.22, 0.38) });
  assinatura.drawLine({ start: { x: 320, y: 778 }, end: { x: 535, y: 778 }, thickness: 0.7, color: PDFLib.rgb(0.2, 0.25, 0.3) });
  assinatura.drawText('Assinatura do Cliente', { x: 320, y: 762, size: 8, font: font, color: PDFLib.rgb(0.12, 0.16, 0.22) });

  return await documento.save();
}

document.getElementById('fecharModal').addEventListener('click', function () {
  modalSucesso.close();
});

formulario.addEventListener('submit', async function (evento) {
  evento.preventDefault();
  erro.textContent = '';
  validacaoExibida = true;
  var invalidos = atualizarErrosValidacao();
  if (invalidos.length) {
    return;
  }
  validacaoExibida = false;

  botaoGerar.disabled = true;
  botaoGerar.textContent = 'Gerando PDF...';

  try {
    var dados = obterDados();
    var bytes = await gerarPdf(dados);
    var nomeArquivo = 'NOTA-FISCAL-' + higienizarNomeArquivo(dados.numeroDocumento) +
      '-' + higienizarNomeArquivo(dados.clienteNome) + '.pdf';
    baixarArquivo(nomeArquivo, bytes);
    document.getElementById('mensagemSucesso').textContent =
      'O arquivo "' + nomeArquivo + '" foi baixado pelo navegador.';
    formulario.reset();
    document.getElementById('dataEntrada').value = dataLocalISO();
    document.getElementById('dataEmissao').value = dataLocalISO();
    atualizarTotais();
    validacaoExibida = false;
    erro.textContent = '';
    modalSucesso.showModal();
  } catch (falha) {
    erro.textContent = 'Não foi possível gerar o PDF: ' + falha.message;
  } finally {
    botaoGerar.disabled = false;
    botaoGerar.textContent = 'Gerar Nota Fiscal';
  }
});
