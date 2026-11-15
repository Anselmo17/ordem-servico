# Ordem de Serviço — JM DIGITAL

Aplicação web simples para registrar atendimentos de assistência técnica de celulares e gerar documentos de ordem de serviço (`.docx`) e recibo fiscal (`.pdf`) a partir dos modelos da loja.

## Como usar

1. Mantenha a estrutura de pastas do projeto.
2. Abra `index.html` no navegador. Não é necessário instalar dependências nem iniciar um servidor.
3. Na tela inicial, escolha **Ordem de Serviço** ou **Nota Fiscal**.
4. Preencha os dados solicitados pela funcionalidade escolhida.
5. Na Ordem de Serviço, selecione **Escolher pasta** para gravar diretamente em uma pasta escolhida, quando o navegador oferecer esse recurso. Caso contrário, o arquivo é baixado pelo navegador.
6. Acione o botão de geração do documento. A confirmação aparece após a gravação ou o início do download.

A funcionalidade Nota Fiscal preenche e baixa o modelo PDF localmente. Ela não transmite dados à SEFAZ ou à Prefeitura e não substitui a emissão fiscal oficial.

O programa funciona sem conexão com a internet. Para salvar diretamente em uma pasta, use um navegador compatível, como uma versão atual do Chrome ou Edge, e conceda a permissão solicitada. Em navegadores sem esse recurso, como o Safari no iOS, o botão **Escolher pasta** permanece visível e informa que os arquivos serão baixados pelo navegador.

Quando a pasta é escolhida, o programa tenta lembrá-la no navegador para reutilizá-la após atualizar a página. O navegador pode exigir autorização novamente ou não permitir persistir essa preferência; nesse caso, escolha a pasta outra vez. A preferência fica armazenada apenas no perfil do navegador e dispositivo usados.

O formulário oferece os temas **Claro** e **Escuro**. Ele sempre inicia no tema **Claro**; a escolha do tema escuro vale apenas até fechar ou atualizar a página.

## Publicar no GitHub Pages

O workflow `.github/workflows/pages.yml` publica o site automaticamente quando há alterações nos arquivos da aplicação na branch `master`. O artefato contém a tela inicial e os arquivos necessários para executar os módulos de ordem de serviço e nota fiscal. A pasta `OS-Finalizadas` e os documentos DOCX não são copiados para o site.

Para ativar:

1. No GitHub, abra **Settings → Pages** do repositório.
2. Em **Build and deployment**, selecione **GitHub Actions** como fonte.
3. Envie o workflow e os arquivos atualizados para a branch `master`.
4. Acompanhe a execução em **Actions**. Após a publicação, o endereço será `https://anselmo17.github.io/ordem-servico/`.

**Privacidade:** o repositório está público e contém documentos de ordens de serviço. Limitar o artefato do Pages não oculta esses arquivos do próprio repositório. Remova os documentos e, para impedir que continuem acessíveis em commits anteriores, limpe também o histórico público antes de divulgar o site. Não adicione ordens de clientes ao Git.

## Campos do formulário

- **Nome do Cliente**: obrigatório; no documento, a primeira letra aparece em maiúscula; o nome do arquivo é gerado em maiúsculas.
- **CPF ou RG**: opcional e aceita somente números. Até 11 dígitos, aplica progressivamente a máscara de CPF sem validar os dígitos verificadores; acima de 11, trata o valor como RG sem máscara de CPF.
- **Endereço**, **Contato**, **Modelo do aparelho**, **Serviço realizado**, **Valor** e **Garantia**: opcionais. O valor é formatado em reais (BRL), e a garantia aceita até dois dígitos numéricos; no documento, o número é seguido por “DIAS”.
- **Data de entrada**: preenchida automaticamente com a data em que a ordem é gerada. A data de retirada continua em branco no modelo.

O arquivo recebe o nome `NOME DO CLIENTE-DOCUMENTO.docx`. Se não for informado documento, o nome é `NOME DO CLIENTE.docx`.

## Arquivos do projeto

- `index.html`: tela inicial para escolher uma funcionalidade.
- `style.css`: aparência da tela inicial e adaptação para telas menores.
- `funcionalidades/ordem-servico/index.html`: formulário e modal de confirmação da ordem de serviço.
- `funcionalidades/ordem-servico/style.css`: estilos da funcionalidade de ordem de serviço.
- `funcionalidades/ordem-servico/script.js`: máscaras, identificação do documento, preenchimento do modelo e gravação do arquivo.
- `funcionalidades/ordem-servico/ordemServicoTemplate.js`: modelo DOCX codificado em Base64 para execução offline.
- `funcionalidades/ordem-servico/ordemServicoTemplate.docx`: cópia legível do modelo original; não é necessária para a execução normal.
- `funcionalidades/nota-fiscal/`: formulário, estilos, geração de PDF e modelo da funcionalidade de nota fiscal.

O JavaScript lê o DOCX incorporado, substitui os campos correspondentes no documento e monta um novo arquivo mantendo os demais elementos do modelo. Se o arquivo `funcionalidades/ordem-servico/ordemServicoTemplate.docx` for alterado, atualize também o conteúdo incorporado em `funcionalidades/ordem-servico/ordemServicoTemplate.js`.

O módulo de Nota Fiscal contém seu próprio formulário e preenche o modelo PDF; veja [funcionalidades/nota-fiscal/README.md](./funcionalidades/nota-fiscal/README.md) para detalhes de uso e atualização.

## Privacidade

Os dados preenchidos são processados localmente pelo navegador e gravados no destino escolhido ou na pasta de downloads. A aplicação não envia os dados para um serviço remoto.



## link do site
- https://anselmo17.github.io/ordem-servico/