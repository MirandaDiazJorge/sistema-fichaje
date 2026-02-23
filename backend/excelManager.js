const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const excelPath = path.resolve(__dirname, 'fichajes.xlsx');

// Simple queue-based lock to prevent concurrent write issues
let isWriting = false;
const queue = [];

const processQueue = async () => {
    if (isWriting || queue.length === 0) return;
    isWriting = true;
    const { action, resolve, reject } = queue.shift();
    try {
        await action();
        resolve();
    } catch (err) {
        reject(err);
    } finally {
        isWriting = false;
        processQueue();
    }
};

const runLocked = (action) => {
    return new Promise((resolve, reject) => {
        queue.push({ action, resolve, reject });
        processQueue();
    });
};

const COLUMNS = [
    { header: 'Session ID', key: 'session_id', width: 15 },
    { header: 'Employee ID', key: 'employee_id', width: 15 },
    { header: 'Nombre', key: 'nombre', width: 25 },
    { header: 'Fecha', key: 'fecha', width: 15 },
    { header: 'Hora Entrada', key: 'hora_entrada', width: 15 },
    { header: 'Hora Salida', key: 'hora_salida', width: 15 },
    { header: 'Total Horas (Human)', key: 'total_horas_human', width: 15 },
    { header: 'Total Horas (Decimal)', key: 'total_horas_decimal', width: 15 },
    { header: 'Timestamp Registro', key: 'timestamp_registro', width: 25 },
    { header: 'Dispositivo', key: 'dispositivo', width: 30 }
];

const initExcel = async () => {
    return runLocked(async () => {
        if (!fs.existsSync(excelPath)) {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Fichajes');
            sheet.columns = COLUMNS;
            // Make header bold
            sheet.getRow(1).font = { bold: true };
            await workbook.xlsx.writeFile(excelPath);
        }
    });
};

const upsertFichaje = async (data) => {
    return runLocked(async () => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        const sheet = workbook.getWorksheet('Fichajes');
        sheet.columns = COLUMNS; // Map columns to keys

        // Find row by session_id
        let rowIndex = -1;
        if (data.session_id) {
            sheet.eachRow((row, i) => {
                if (i === 1) return;
                if (row.getCell('session_id').value == data.session_id) {
                    rowIndex = i;
                }
            });
        }

        if (rowIndex !== -1) {
            // Update existing row
            const row = sheet.getRow(rowIndex);
            if (data.hora_salida) row.getCell('hora_salida').value = data.hora_salida;
            if (data.total_horas_human) row.getCell('total_horas_human').value = data.total_horas_human;
            if (data.total_horas_decimal) row.getCell('total_horas_decimal').value = data.total_horas_decimal;
            row.getCell('timestamp_registro').value = new Date().toISOString();
            row.commit();
        } else {
            // Add new row
            sheet.addRow({
                ...data,
                timestamp_registro: new Date().toISOString()
            });
        }
        await workbook.xlsx.writeFile(excelPath);
    });
};

const getFichajes = async () => {
    const workbook = new ExcelJS.Workbook();
    if (!fs.existsSync(excelPath)) return [];

    await workbook.xlsx.readFile(excelPath);
    const sheet = workbook.getWorksheet('Fichajes');
    if (!sheet) return [];

    sheet.columns = COLUMNS; // Map columns to keys
    const data = [];
    sheet.eachRow((row, i) => {
        if (i === 1) return;
        const rowData = {};
        COLUMNS.forEach(col => {
            rowData[col.key] = row.getCell(col.key).value;
        });
        data.push(rowData);
    });
    return data;
};

module.exports = { initExcel, upsertFichaje, getFichajes, excelPath };
