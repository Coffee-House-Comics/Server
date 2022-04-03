# Server for Coffee House Comics

The webpage that is served is in /Static.  
The env file in the public repo is a template, the actual data is stored on the server and contains secrets so it will not be pushed    

This repo contains a default webpage in the /Static directory.  
It is recommended to set /Static to be a soft link to the directory hosting the webpages you wish to serve.    

Please note that this server uses environment variables that can be given at start time or placed into an .env file

## Facts
1. Runs server on aws lightsail
2. Server has been registered with Certificate Authority Sectigo Limited
3. Uses NGINX to handle TLS and redirection to port 443 (https) from 80 (http)
4. Uses NGINX as a reverse proxy to forward requests to an express-node server running on localhost.
5. Uses nodemailer to send emails via gmail api
6. Shadow is the cutest dog - BAR NONE

## TODO
1. Set Compression in nginx
2. Set /etc/mongod.conf bind ip back to original eventually
3. Minify and bundle the front end code