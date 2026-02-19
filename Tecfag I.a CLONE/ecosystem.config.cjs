/**
 * PM2 Ecosystem Configuration
 * 
 * Este arquivo configura o PM2 para rodar o servidor em modo cluster,
 * utilizando todos os núcleos de CPU disponíveis.
 * 
 * Comandos:
 *   pm2 start ecosystem.config.js     - Inicia o cluster
 *   pm2 stop all                       - Para todos os processos
 *   pm2 restart all                    - Reinicia todos
 *   pm2 logs                           - Ver logs em tempo real
 *   pm2 monit                          - Monitor interativo
 *   pm2 list                           - Lista processos
 */

module.exports = {
    apps: [
        {
            name: 'tecfag-api',
            script: './dist/index.js',
            cwd: './server',

            // Modo Cluster - usa todos os CPUs disponíveis
            instances: 'max', // ou número específico: 4
            exec_mode: 'cluster',

            // Configurações de ambiente
            env: {
                NODE_ENV: 'development',
                PORT: 3001,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3001,
            },

            // Logs
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            merge_logs: true,

            // Configurações de restart
            max_restarts: 10,
            min_uptime: '10s',
            max_memory_restart: '500M',

            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,

            // Auto-restart em caso de alterações (apenas dev)
            watch: false,
            ignore_watch: ['node_modules', 'logs', 'uploads', 'backups'],

            // Variáveis extras
            instance_var: 'INSTANCE_ID',
        },

        // Frontend Vite (opcional - só para produção com preview)
        {
            name: 'tecfag-frontend',
            script: 'npm',
            args: 'run preview',
            cwd: './',

            instances: 1,
            exec_mode: 'fork',

            env_production: {
                NODE_ENV: 'production',
            },

            // Desabilitado por padrão (usar nginx para servir o build)
            autorestart: false,
        }
    ],

    // Deploy configuration (opcional para CI/CD)
    deploy: {
        production: {
            user: 'deploy',
            host: 'your-server.com',
            ref: 'origin/main',
            repo: 'git@github.com:your-repo/tecfag-ia.git',
            path: '/var/www/tecfag-ia',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
        }
    }
};
