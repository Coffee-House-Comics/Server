# Server for Coffee House Comics

The webpage that is served is in /Static.  
The env file in the public repo is a template, the actual data is stored on the server and contains secrets so it will not be pushed    

This repo contains a default webpage in the /Static directory.  
It is recommended to set /Static to be a soft link to the directory hosting the webpages you wish to serve.

## Facts
1. Runs server on aws lightsail
2. Server has been registered with a Certificate Authority
3. Uses NGINX to handle TLS and redirection to port 443 (https) from 80 (http)
4. Uses NGINX as a reverse proxy to forward requests to an express-node server running on localhost.
5. Uses google OAUTH to allow the server to send emails via gmail API
6. Shadow is the cutest dog - BAR NONE

## TODO
1. READ THIS: https://www.woolha.com/tutorials/node-js-send-email-using-gmail-with-nodemailer-oauth-2
2. Update the env file
3. npm install googleapis
4. npm install dotenv