function handleFiles(event) {
    const files = event.target.files;
    const sqlLinksContainer = document.getElementById('sql-links');
    sqlLinksContainer.innerHTML = '';

    // Adiciona animação de processamento
    const processingMsg = document.createElement('p');
    processingMsg.innerText = 'Processando arquivos...';
    sqlLinksContainer.appendChild(processingMsg);

    // Inicia a animação
    processingMsg.classList.add('processing');

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const tableName = sheetName.replace(/\s+/g, '_');
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });
                    const columns = Object.keys(jsonData[0]);
                    const insertSQL = jsonData.map(row => {
                        const values = columns.map(column => {
                            let value = row[column];
                            if (value === '' || typeof value === 'undefined') {
                                return 'NULL';
                            } else {
                                let cleanedValue = typeof value === 'string' ? value.replace(/&nbsp;/g, '').trim() : value;
                                // Remove caracteres especiais e acentuação gráfica
                                cleanedValue = cleanedValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                return typeof cleanedValue === 'string' ? `'${cleanedValue.replace(/'/g, "''")}'` : `'${cleanedValue}'`;
                            }
                        }).join(', ');
                        return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
                    }).join('\n');
                    const blob = new Blob([insertSQL], { type: 'text/plain' });
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = `${tableName}.sql`;
                    link.innerText = `Download ${tableName}.sql`;
                    link.classList.add('sql-link');
                    sqlLinksContainer.appendChild(link);
                });

                // Remove a animação após o processamento
                sqlLinksContainer.removeChild(processingMsg);
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                // Adiciona mensagem de erro destacada
                const errorMsg = document.createElement('p');
                errorMsg.innerText = `Erro ao processar ${file.name}`;
                errorMsg.classList.add('error');
                sqlLinksContainer.appendChild(errorMsg);

                // Remove a animação em caso de erro
                sqlLinksContainer.removeChild(processingMsg);
            }
        };

        reader.readAsArrayBuffer(file);
    }
}

function clearFiles() {
    // Limpa a entrada de arquivo e os links SQL
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';
    const sqlLinksContainer = document.getElementById('sql-links');
    sqlLinksContainer.innerHTML = '';
}
