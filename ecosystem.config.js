module.exports = {
    apps : [{
        name: 'Record_Bot',
        script: 'npm',
        // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
        args: 'run start',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
        NODE_ENV: 'development'
        },
        env_production: {
        NODE_ENV: 'production'
        }
    }],

    deploy : {
        production : {
        user : 'node',
        ref  : 'origin/master',
        repo : 'git@github.com:repo.git',
        path : '/var/www/production',
        'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
        }
    }
};
