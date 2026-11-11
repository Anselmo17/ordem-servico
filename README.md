# Ordem de Serviço — JM DIGITAL

Aplicação web simples para registrar atendimentos de assistência técnica de celulares e gerar uma ordem de serviço em Word (`.docx`) a partir do modelo da loja.

## Como usar

1. Mantenha `index.html`, `style.css`, `script.js` e `ordemServicoTemplate.js` juntos na mesma pasta.
2. Abra `index.html` no navegador. Não é necessário instalar dependências nem iniciar um servidor.
3. Preencha o nome do cliente. Esse é o único campo obrigatório.
4. Selecione **Escolher pasta** para gravar diretamente em uma pasta escolhida, quando o navegador oferecer esse recurso. Caso contrário, o arquivo é baixado pelo navegador.
5. Clique em **Gerar Ordem de Serviço**. A confirmação aparece após a gravação ou o início do download.

O programa funciona sem conexão com a internet. Para salvar diretamente em uma pasta, use um navegador compatível, como uma versão atual do Chrome ou Edge, e conceda a permissão solicitada. Se esse recurso não estiver disponível, o navegador usará o fluxo normal de download.

## Campos do formulário

- **Nome do Cliente**: obrigatório; aparece em maiúsculas no documento e no nome do arquivo.
- **CPF ou RG**: opcional. Para 11 dígitos numéricos, o campo aplica a máscara de CPF; não valida os dígitos verificadores. Outros formatos são tratados como RG.
- **Endereço**, **Contato**, **Modelo do aparelho** e **Serviço realizado**: opcionais.
- **Data de entrada**: preenchida automaticamente com a data em que a ordem é gerada. A data de retirada continua em branco no modelo.

O arquivo recebe o nome `NOME DO CLIENTE-DOCUMENTO.docx`. Se não for informado documento, o nome é `NOME DO CLIENTE.docx`.

## Arquivos do projeto

- `index.html`: estrutura da página, formulário e modal de confirmação.
- `style.css`: aparência e adaptação para telas menores.
- `script.js`: máscaras, identificação do documento, preenchimento do modelo e gravação do arquivo.
- `ordemServicoTemplate.js`: contém o modelo DOCX codificado em Base64 para que ele possa ser carregado sem conexão e sem buscar um arquivo via servidor.
- `ordemServicoTemplate.docx`: cópia legível do modelo original; não é necessária para a execução normal, pois o conteúdo usado pela aplicação está em `ordemServicoTemplate.js`.

O JavaScript lê o DOCX incorporado, substitui os campos correspondentes no documento e monta um novo arquivo mantendo os demais elementos do modelo. Se o arquivo `ordemServicoTemplate.docx` for alterado, atualize também o conteúdo incorporado em `ordemServicoTemplate.js`.

## Privacidade

Os dados preenchidos são processados localmente pelo navegador e gravados no destino escolhido ou na pasta de downloads. A aplicação não envia os dados para um serviço remoto.
