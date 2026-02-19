import fs from 'fs';
import path from 'path';

// Encontrar o diretório base do servidor (onde está o package.json)
const SERVER_ROOT = process.cwd();

// Configurações (podem ser alteradas dinamicamente)
const DB_PATH = path.join(SERVER_ROOT, 'prisma/dev.db');
const BACKUP_DIR = path.join(SERVER_ROOT, 'backups');
const SETTINGS_FILE = path.join(BACKUP_DIR, 'backup-settings.json');

// Configurações padrão
let settings = {
    maxBackups: 10,
    intervalHours: 6,
    lastScheduledBackup: null as string | null,
    nextScheduledBackup: null as string | null,
};

// Carregar configurações do arquivo
function loadSettings(): void {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            settings = { ...settings, ...JSON.parse(data) };
        }
    } catch (error) {
        console.error('[Backup] Erro ao carregar configurações:', error);
    }
}

// Salvar configurações no arquivo
function saveSettings(): void {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('[Backup] Erro ao salvar configurações:', error);
    }
}

// Inicializar configurações
loadSettings();

/**
 * Cria um backup do banco de dados SQLite
 * @param reason - Motivo do backup (ex: 'startup', 'scheduled', 'manual')
 * @returns Informações do backup criado ou null se falhou
 */
export function createBackup(reason: string = 'manual'): { name: string; date: Date; sizeMB: string } | null {
    try {
        // Verificar se o banco existe
        if (!fs.existsSync(DB_PATH)) {
            console.log('[Backup] ⚠️ Banco de dados não encontrado, pulando backup');
            return null;
        }

        // Criar diretório de backups se não existir
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
            console.log('[Backup] 📁 Diretório de backups criado');
        }

        // Gerar nome do arquivo com timestamp
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/:/g, '-')
            .replace(/\./g, '-')
            .replace('T', '_')
            .replace('Z', '');

        const backupFileName = `dev_${timestamp}_${reason}.db`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        // Copiar arquivo
        fs.copyFileSync(DB_PATH, backupPath);

        const stats = fs.statSync(backupPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`[Backup] ✅ Backup criado: ${backupFileName} (${sizeMB} MB)`);

        // Limpar backups antigos
        cleanOldBackups();

        return {
            name: backupFileName,
            date: now,
            sizeMB
        };
    } catch (error) {
        console.error('[Backup] ❌ Erro ao criar backup:', error);
        return null;
    }
}

/**
 * Remove backups antigos, mantendo apenas os N mais recentes
 */
function cleanOldBackups(): void {
    try {
        if (!fs.existsSync(BACKUP_DIR)) return;

        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .map(f => ({
                name: f,
                path: path.join(BACKUP_DIR, f),
                time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time); // Mais recente primeiro

        // Remover backups excedentes
        if (files.length > settings.maxBackups) {
            const toDelete = files.slice(settings.maxBackups);
            toDelete.forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`[Backup] 🗑️ Backup antigo removido: ${file.name}`);
            });
        }
    } catch (error) {
        console.error('[Backup] Erro ao limpar backups antigos:', error);
    }
}

/**
 * Lista todos os backups disponíveis
 */
export function listBackups(): Array<{ name: string; date: Date; sizeMB: string }> {
    try {
        if (!fs.existsSync(BACKUP_DIR)) return [];

        return fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .map(f => {
                const stats = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                    name: f,
                    date: stats.mtime,
                    sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
                };
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
        console.error('[Backup] Erro ao listar backups:', error);
        return [];
    }
}

/**
 * Restaura um backup específico
 * @param backupName - Nome do arquivo de backup
 * @returns true se restaurado com sucesso
 */
export function restoreBackup(backupName: string): boolean {
    try {
        const backupPath = path.join(BACKUP_DIR, backupName);

        if (!fs.existsSync(backupPath)) {
            console.error(`[Backup] ❌ Backup não encontrado: ${backupName}`);
            return false;
        }

        // Criar backup do banco atual antes de restaurar
        createBackup('pre-restore');

        // Copiar o backup para o local do banco
        fs.copyFileSync(backupPath, DB_PATH);

        console.log(`[Backup] ✅ Backup restaurado: ${backupName}`);
        console.log('[Backup] ⚠️ REINICIE O SERVIDOR para aplicar as mudanças!');

        return true;
    } catch (error) {
        console.error('[Backup] ❌ Erro ao restaurar backup:', error);
        return false;
    }
}

/**
 * Deleta um backup específico
 * @param backupName - Nome do arquivo de backup
 * @returns true se deletado com sucesso
 */
export function deleteBackup(backupName: string): boolean {
    try {
        const backupPath = path.join(BACKUP_DIR, backupName);

        if (!fs.existsSync(backupPath)) {
            console.error(`[Backup] ❌ Backup não encontrado: ${backupName}`);
            return false;
        }

        fs.unlinkSync(backupPath);
        console.log(`[Backup] 🗑️ Backup deletado: ${backupName}`);
        return true;
    } catch (error) {
        console.error('[Backup] ❌ Erro ao deletar backup:', error);
        return false;
    }
}

/**
 * Obtém o caminho absoluto de um backup para download
 * @param backupName - Nome do arquivo de backup
 * @returns Caminho absoluto ou null se não existir
 */
export function getBackupPath(backupName: string): string | null {
    const backupPath = path.join(BACKUP_DIR, backupName);
    return fs.existsSync(backupPath) ? backupPath : null;
}

/**
 * Obtém estatísticas dos backups
 */
export function getBackupStats(): {
    totalBackups: number;
    totalSizeMB: string;
    lastBackup: { name: string; date: Date; sizeMB: string } | null;
    oldestBackup: { name: string; date: Date; sizeMB: string } | null;
} {
    try {
        const backups = listBackups();

        if (backups.length === 0) {
            return {
                totalBackups: 0,
                totalSizeMB: '0.00',
                lastBackup: null,
                oldestBackup: null
            };
        }

        const totalSize = backups.reduce((sum, b) => sum + parseFloat(b.sizeMB), 0);

        return {
            totalBackups: backups.length,
            totalSizeMB: totalSize.toFixed(2),
            lastBackup: backups[0],
            oldestBackup: backups[backups.length - 1]
        };
    } catch (error) {
        console.error('[Backup] Erro ao obter estatísticas:', error);
        return {
            totalBackups: 0,
            totalSizeMB: '0.00',
            lastBackup: null,
            oldestBackup: null
        };
    }
}

/**
 * Verifica a integridade do banco de dados SQLite
 * @returns Objeto com status e detalhes da verificação
 */
export function checkDatabaseIntegrity(): { isOk: boolean; details: string } {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return { isOk: false, details: 'Banco de dados não encontrado' };
        }

        // Verificar se o arquivo pode ser lido e tem tamanho válido
        const stats = fs.statSync(DB_PATH);
        if (stats.size === 0) {
            return { isOk: false, details: 'Banco de dados está vazio' };
        }

        // Verificar se o arquivo começa com o header SQLite
        const fd = fs.openSync(DB_PATH, 'r');
        const buffer = Buffer.alloc(16);
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);

        const header = buffer.toString('utf8', 0, 16);
        if (!header.startsWith('SQLite format 3')) {
            return { isOk: false, details: 'Arquivo não é um banco SQLite válido' };
        }

        // Se chegou aqui, o banco está estruturalmente ok
        return {
            isOk: true,
            details: 'Banco de dados íntegro'
        };
    } catch (error: any) {
        console.error('[Backup] Erro ao verificar integridade:', error);
        return { isOk: false, details: `Erro na verificação: ${error.message}` };
    }
}

/**
 * Obtém as configurações atuais de backup
 */
export function getSettings(): {
    maxBackups: number;
    intervalHours: number;
    nextScheduledBackup: string | null;
} {
    return {
        maxBackups: settings.maxBackups,
        intervalHours: settings.intervalHours,
        nextScheduledBackup: settings.nextScheduledBackup
    };
}

/**
 * Atualiza as configurações de backup
 */
export function updateSettings(newSettings: {
    maxBackups?: number;
    intervalHours?: number;
}): {
    maxBackups: number;
    intervalHours: number;
    nextScheduledBackup: string | null;
} {
    if (newSettings.maxBackups !== undefined && newSettings.maxBackups >= 1) {
        settings.maxBackups = newSettings.maxBackups;
    }
    if (newSettings.intervalHours !== undefined && newSettings.intervalHours >= 1) {
        settings.intervalHours = newSettings.intervalHours;
        // Recalcular próximo backup agendado
        const next = new Date();
        next.setHours(next.getHours() + settings.intervalHours);
        settings.nextScheduledBackup = next.toISOString();
    }

    saveSettings();
    console.log(`[Backup] ⚙️ Configurações atualizadas: maxBackups=${settings.maxBackups}, intervalHours=${settings.intervalHours}`);

    // Limpar backups se necessário após mudança de maxBackups
    cleanOldBackups();

    return getSettings();
}

// Variável para armazenar o intervalo do backup agendado
let scheduledBackupInterval: NodeJS.Timeout | null = null;

/**
 * Inicia backup agendado (a cada N horas)
 * @param intervalHours - Intervalo em horas (padrão: valor das configurações)
 */
export function startScheduledBackup(intervalHours?: number): void {
    // Se já existe um intervalo, limpar
    if (scheduledBackupInterval) {
        clearInterval(scheduledBackupInterval);
    }

    const hours = intervalHours ?? settings.intervalHours;
    settings.intervalHours = hours;

    const intervalMs = hours * 60 * 60 * 1000;

    // Calcular próximo backup
    const next = new Date();
    next.setHours(next.getHours() + hours);
    settings.nextScheduledBackup = next.toISOString();
    saveSettings();

    console.log(`[Backup] ⏰ Backup agendado a cada ${hours} horas`);
    console.log(`[Backup] 📅 Próximo backup: ${next.toLocaleString('pt-BR')}`);

    scheduledBackupInterval = setInterval(() => {
        console.log('[Backup] 🔄 Executando backup agendado...');
        createBackup('scheduled');

        // Atualizar próximo backup
        const nextBackup = new Date();
        nextBackup.setHours(nextBackup.getHours() + hours);
        settings.nextScheduledBackup = nextBackup.toISOString();
        settings.lastScheduledBackup = new Date().toISOString();
        saveSettings();
    }, intervalMs);
}

/**
 * Para o backup agendado
 */
export function stopScheduledBackup(): void {
    if (scheduledBackupInterval) {
        clearInterval(scheduledBackupInterval);
        scheduledBackupInterval = null;
        settings.nextScheduledBackup = null;
        saveSettings();
        console.log('[Backup] ⏹️ Backup agendado parado');
    }
}

// Exportar o diretório de backups para referência
export const BACKUPS_PATH = BACKUP_DIR;
export const DATABASE_PATH = DB_PATH;
