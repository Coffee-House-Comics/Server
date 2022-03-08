echo \"Starting app.js...\"
echo \" Running shutdown first to make sure no server is running already... \"
bash shutdown.sh
echo \" Done with shutdown, starting now... \"
node app.js > output.log 2>&1 &
echo \"Finished app.js\"
echo \"Starting server.js...\"
node server.js > output.log 2>&1 &
echo \"DONE\"