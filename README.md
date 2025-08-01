# YeaBuddyBot

Solution needs 
> npm install -g localtunnel

after 
>func start

run lt
> lt --port 9144 --subdomain myazurefunc

Healthcheck
> http://185.31.46.78:8443/api/HealthCheck
> http://185.31.46.78:8443/api/TelegramBotFunction


trust cert
> dotnet dev-certs https --trust