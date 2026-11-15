# Nota Fiscal / Recibo Fiscal

Este módulo reúne o formulário, o modelo PDF e os arquivos locais necessários para gerar e baixar o documento sem conexão com a internet. Os dados são processados no navegador; não há envio à SEFAZ ou à Prefeitura e o documento não substitui a emissão fiscal oficial.

## Uso

Abra `index.html` no navegador, preencha os dados e clique em **Gerar Nota Fiscal**. O PDF preenchido é baixado pelo navegador. CNPJ, CPF/CNPJ do cliente e os telefones recebem máscara automaticamente durante a digitação; ao gerar, o formulário avisa se algum desses campos estiver incompleto.

## Atualização do modelo ou da biblioteca

O PDF original fica em `notaFiscalTemplate.pdf`. Para regenerar os recursos offline depois de alterá-lo, instale as dependências deste módulo e execute o script de build na pasta:

```powershell
npm ci
npm run build-assets
```

O script atualiza `notaFiscalTemplate.js`, que incorpora o PDF, e copia a versão local da biblioteca PDF. A aplicação em si usa apenas arquivos deste módulo, sem buscar recursos externos.
